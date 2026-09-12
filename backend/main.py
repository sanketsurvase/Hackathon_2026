# =========================================================
# KISANSETU - FASTAPI BACKEND
# PostgreSQL via SQLAlchemy + Render deployment ready
# =========================================================

import os
import random
import string
from datetime import date, datetime
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import (
    Column, Integer, String, Date, Time, Numeric,
    DateTime, Boolean, text, create_engine
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from dotenv import load_dotenv
import bcrypt

from pathlib import Path

# ─── Load env ────────────────────────────────────────────
env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # fallback for local dev from individual vars
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "kisansetu_db")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASS = os.getenv("DB_PASSWORD", "farmer")
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Render PostgreSQL requires SSL; add sslmode if not present
if "render.com" in DATABASE_URL and "sslmode" not in DATABASE_URL:
    DATABASE_URL += "?sslmode=require"

# ─── SQLAlchemy ──────────────────────────────────────────
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_recycle=300
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ─── DB Dependency ───────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── ORM Models (mirrors existing tables — no DDL) ───────
class Farmer(Base):
    __tablename__ = "farmers"
    farmer_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    father_spouse_name = Column(String)
    mobile_number = Column(String)
    email = Column(String)
    gender = Column(String)
    date_of_birth = Column(Date)
    role = Column(String)
    status = Column(String)
    created_at = Column(DateTime)
    updated_at = Column(DateTime, nullable=True)


class FarmerAccount(Base):
    __tablename__ = "farmer_accounts"
    account_id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer)
    password_hash = Column(String)
    mobile_verified = Column(Boolean, default=False)
    verification_status = Column(String, default="pending")
    last_login = Column(DateTime, nullable=True)


class FarmerAddress(Base):
    __tablename__ = "farmer_addresses"
    address_id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer)
    full_address = Column(String)
    village = Column(String)
    taluka = Column(String)
    district = Column(String)
    state = Column(String)
    pincode = Column(String)


class FarmerFarmingDetail(Base):
    __tablename__ = "farmer_farming_details"
    farming_id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer)
    farm_area = Column(Numeric)
    area_unit = Column(String)
    crop_name = Column(String)
    expected_quantity = Column(Numeric)
    preferred_centre = Column(String)


class ProcurementCentre(Base):
    __tablename__ = "procurement_centres"
    centre_id = Column(Integer, primary_key=True, index=True)
    centre_name = Column(String)
    district = Column(String)
    taluka = Column(String)
    address = Column(String)
    is_active = Column(Integer)


class Slot(Base):
    __tablename__ = "slots"
    slot_id = Column(Integer, primary_key=True, index=True)
    centre_id = Column(Integer)
    slot_date = Column(Date)
    start_time = Column(Time)
    end_time = Column(Time)
    capacity = Column(Integer)
    booked_count = Column(Integer)


class Booking(Base):
    __tablename__ = "bookings"
    booking_id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer)
    slot_id = Column(Integer)
    crop_name = Column(String)
    expected_quantity = Column(Numeric)
    token_number = Column(String)
    booking_status = Column(String)
    created_at = Column(DateTime)


class QueueStatus(Base):
    __tablename__ = "queue_status"
    queue_id = Column(Integer, primary_key=True, index=True)
    slot_id = Column(Integer)
    booking_id = Column(Integer)
    queue_position = Column(Integer)
    status = Column(String)
    called_at = Column(DateTime)
    completed_at = Column(DateTime)


# ─── Pydantic Schemas ────────────────────────────────────
class LoginRequest(BaseModel):
    identifier: str       # mobile or email
    password: str


class FarmerRegistration(BaseModel):
    full_name: str
    father_spouse_name: Optional[str] = ""
    mobile_number: str
    date_of_birth: Optional[str] = None
    email: Optional[str] = None
    gender: Optional[str] = "पुरुष"
    full_address: Optional[str] = ""
    district: Optional[str] = ""
    taluka: Optional[str] = ""
    village: Optional[str] = ""
    pincode: Optional[str] = ""
    farm_area: Optional[float] = 0.0
    area_unit: Optional[str] = "एकर"
    crop_name: Optional[str] = ""
    expected_quantity: Optional[float] = 0.0
    preferred_centre: Optional[str] = None
    password: str
    # Compatibility fields
    land_area_acres: Optional[float] = None
    primary_crop: Optional[str] = None
    state: Optional[str] = "Maharashtra"
    gat_number: Optional[str] = ""
    secondary_crop: Optional[str] = ""


# Alias for backward compatibility
RegisterRequest = FarmerRegistration


class BookingRequest(BaseModel):
    farmer_id: int
    slot_id: int
    crop_name: str
    expected_quantity: float


class CancelBookingRequest(BaseModel):
    booking_id: int


# ─── FastAPI App ─────────────────────────────────────────
app = FastAPI(
    title="KisanSetu API",
    description="Farmer slot booking system for APMC procurement",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Root ────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "app": "KisanSetu API",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs"
    }


# ─── Health check ────────────────────────────────────────
@app.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ─── LOGIN ───────────────────────────────────────────────
@app.post("/api/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    identifier = req.identifier.strip()
    is_phone = identifier.isdigit() or (identifier.startswith("+") and identifier[1:].isdigit())

    # Fast indexed query combining Farmer and FarmerAccount into 1 network roundtrip
    if is_phone:
        query = text("""
            SELECT 
                f.farmer_id,
                f.full_name,
                f.mobile_number,
                f.email,
                fa.password_hash
            FROM farmers f
            LEFT JOIN farmer_accounts fa ON fa.farmer_id = f.farmer_id
            WHERE f.mobile_number = :ident
            LIMIT 1
        """)
    else:
        query = text("""
            SELECT 
                f.farmer_id,
                f.full_name,
                f.mobile_number,
                f.email,
                fa.password_hash
            FROM farmers f
            LEFT JOIN farmer_accounts fa ON fa.farmer_id = f.farmer_id
            WHERE f.email = :ident
            LIMIT 1
        """)

    row = db.execute(query, {"ident": identifier}).mappings().first()

    if not row:
        # Fallback check across both fields
        fallback_query = text("""
            SELECT 
                f.farmer_id,
                f.full_name,
                f.mobile_number,
                f.email,
                fa.password_hash
            FROM farmers f
            LEFT JOIN farmer_accounts fa ON fa.farmer_id = f.farmer_id
            WHERE f.mobile_number = :ident OR f.email = :ident
            LIMIT 1
        """)
        row = db.execute(fallback_query, {"ident": identifier}).mappings().first()

    if not row:
        raise HTTPException(status_code=401, detail="मोबाईल क्रमांक किंवा ईमेल नोंदणीकृत नाही.")

    if not row["password_hash"]:
        raise HTTPException(status_code=401, detail="या खात्यासाठी पासवर्ड सेट नाही.")

    try:
        password_matches = bcrypt.checkpw(
            req.password.encode("utf-8"),
            str(row["password_hash"]).encode("utf-8")
        )
    except Exception:
        raise HTTPException(status_code=500, detail="पासवर्ड तपासणीत त्रुटी.")

    if not password_matches:
        raise HTTPException(status_code=401, detail="चुकीचा पासवर्ड. कृपया पुन्हा प्रयत्न करा.")

    return {
        "success": True,
        "farmer": {
            "farmer_id": row["farmer_id"],
            "full_name": row["full_name"],
            "mobile_number": row["mobile_number"],
            "email": row["email"] or ""
        }
    }


# ─── REGISTER ────────────────────────────────────────────
@app.post("/api/register")
def register(req: FarmerRegistration, db: Session = Depends(get_db)):
    # Validate required fields
    if not req.full_name or len(req.full_name.strip()) < 2:
        raise HTTPException(status_code=422, detail="कृपया पूर्ण नाव प्रविष्ट करा.")

    if not req.mobile_number or not req.mobile_number.strip().isdigit() or len(req.mobile_number.strip()) != 10:
        raise HTTPException(status_code=422, detail="कृपया वैध 10 अंकी मोबाईल क्रमांक प्रविष्ट करा.")

    if not req.password or len(req.password) < 6:
        raise HTTPException(status_code=422, detail="पासवर्ड किमान 6 अक्षरांचा असावा.")

    # Check duplicate mobile dynamically
    existing = db.query(Farmer).filter(
        Farmer.mobile_number == req.mobile_number.strip()
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="हा मोबाईल क्रमांक आधीच नोंदणीकृत आहे.")

    # Check duplicate email dynamically
    if req.email and req.email.strip():
        existing_email = db.query(Farmer).filter(
            Farmer.email == req.email.strip()
        ).first()
        if existing_email:
            raise HTTPException(status_code=409, detail="हा ईमेल आधीच नोंदणीकृत आहे.")

    try:
        # Sync postgres sequences if out of sync
        try:
            db.execute(text("SELECT setval(pg_get_serial_sequence('farmers', 'farmer_id'), COALESCE((SELECT MAX(farmer_id) FROM farmers), 0) + 1, false)"))
            db.execute(text("SELECT setval(pg_get_serial_sequence('farmer_accounts', 'account_id'), COALESCE((SELECT MAX(account_id) FROM farmer_accounts), 0) + 1, false)"))
            db.execute(text("SELECT setval(pg_get_serial_sequence('farmer_addresses', 'address_id'), COALESCE((SELECT MAX(address_id) FROM farmer_addresses), 0) + 1, false)"))
            db.execute(text("SELECT setval(pg_get_serial_sequence('farmer_farming_details', 'farming_id'), COALESCE((SELECT MAX(farming_id) FROM farmer_farming_details), 0) + 1, false)"))
        except Exception as seq_err:
            print("Sequence sync notice:", seq_err)

        # Dynamic values from payload
        father_name = (req.father_spouse_name or "").strip() or "शेतकरी"
        resolved_area = float(req.farm_area if req.farm_area is not None and req.farm_area > 0 else (req.land_area_acres or 0.0))
        resolved_unit = (req.area_unit or "एकर").strip()
        resolved_crop = (req.crop_name or req.primary_crop or "").strip() or "सोयाबीन"
        resolved_quantity = float(req.expected_quantity if req.expected_quantity is not None else 0.0)
        resolved_centre = (req.preferred_centre or "").strip() or None

        resolved_full_address = (req.full_address or "").strip()
        if not resolved_full_address:
            resolved_full_address = f"{req.village or ''}, {req.taluka or ''}, {req.district or ''}".strip(", ") or "पत्ता उपलब्ध नाही"

        # Parse date_of_birth safely into python date object (since DB column is date NOT NULL)
        dob_val = None
        if req.date_of_birth and req.date_of_birth.strip():
            try:
                dob_val = datetime.strptime(req.date_of_birth.strip(), "%Y-%m-%d").date()
            except Exception:
                dob_val = None
        if not dob_val:
            dob_val = date(1990, 1, 1)

        # 1. Insert Farmer
        farmer = Farmer(
            full_name=req.full_name.strip(),
            father_spouse_name=father_name,
            mobile_number=req.mobile_number.strip(),
            email=(req.email.strip() if req.email and req.email.strip() else None),
            gender=req.gender or "पुरुष",
            date_of_birth=dob_val,
            role="farmer",
            status="active",
            created_at=datetime.utcnow()
        )
        db.add(farmer)
        db.flush()  # Obtain the generated farmer_id

        # 2. Insert FarmerAddress using the same farmer_id
        address = FarmerAddress(
            farmer_id=farmer.farmer_id,
            full_address=resolved_full_address,
            district=(req.district or "").strip(),
            taluka=(req.taluka or "").strip(),
            village=(req.village or "").strip(),
            pincode=(req.pincode or "").strip(),
            state=(req.state or "Maharashtra").strip()
        )
        db.add(address)
        db.flush()

        # 3. Insert FarmerFarmingDetail using the same farmer_id
        details = FarmerFarmingDetail(
            farmer_id=farmer.farmer_id,
            farm_area=resolved_area,
            area_unit=resolved_unit,
            crop_name=resolved_crop,
            expected_quantity=resolved_quantity,
            preferred_centre=resolved_centre
        )
        db.add(details)
        db.flush()

        # 4. Hash password with bcrypt and insert FarmerAccount using the same farmer_id
        hashed = bcrypt.hashpw(
            req.password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        account = FarmerAccount(
            farmer_id=farmer.farmer_id,
            password_hash=hashed,
            mobile_verified=False,
            verification_status="pending"
        )
        db.add(account)
        db.flush()

        # 5. Commit all four table inserts atomically
        db.commit()
        db.refresh(farmer)

        return {
            "success": True,
            "farmer_id": farmer.farmer_id,
            "message": "नोंदणी यशस्वी झाली!"
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        print("Registration Error:", str(e))
        raise HTTPException(
            status_code=500,
            detail="नोंदणी पूर्ण करता आली नाही. कृपया सर्व माहिती तपासून पुन्हा प्रयत्न करा."
        )


# ─── PROCUREMENT CENTRES ─────────────────────────────────
@app.get("/api/centres")
def get_centres(db: Session = Depends(get_db)):
    try:
        centres = db.query(ProcurementCentre).filter(
            ProcurementCentre.is_active == 1
        ).all()

        if not centres:
            centres = db.query(ProcurementCentre).all()

        return {
            "success": True,
            "centres": [
                {
                    "centre_id": c.centre_id,
                    "centre_name": c.centre_name,
                    "district": c.district,
                    "taluka": c.taluka,
                    "address": c.address or f"{c.taluka}, {c.district}"
                }
                for c in centres
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── SLOTS ───────────────────────────────────────────────
@app.get("/api/slots")
def get_slots(
    centre_id: int = Query(...),
    slot_date: str = Query(...),
    db: Session = Depends(get_db)
):
    try:
        parsed_date = date.fromisoformat(slot_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="तारीख चुकीच्या स्वरूपात आहे. YYYY-MM-DD वापरा.")

    try:
        slots = db.query(Slot).filter(
            Slot.centre_id == centre_id,
            Slot.slot_date == parsed_date
        ).order_by(Slot.start_time).all()

        return {
            "success": True,
            "slots": [
                {
                    "slot_id": s.slot_id,
                    "centre_id": s.centre_id,
                    "slot_date": str(s.slot_date),
                    "start_time": str(s.start_time)[:5],
                    "end_time": str(s.end_time)[:5],
                    "capacity": int(str(s.capacity)) if s.capacity else 0,
                    "booked_count": int(str(s.booked_count)) if s.booked_count else 0
                }
                for s in slots
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── CREATE BOOKING ──────────────────────────────────────
@app.post("/api/bookings")
def create_booking(req: BookingRequest, db: Session = Depends(get_db)):
    # Verify slot exists and has capacity
    slot = db.query(Slot).filter(Slot.slot_id == req.slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="निवडलेला स्लॉट आढळला नाही.")

    booked = int(str(slot.booked_count)) if slot.booked_count else 0
    capacity = int(str(slot.capacity)) if slot.capacity else 0
    if booked >= capacity:
        raise HTTPException(status_code=400, detail="हा स्लॉट पूर्ण झाला आहे. कृपया दुसरा वेळ निवडा.")

    # Verify farmer exists
    farmer = db.query(Farmer).filter(Farmer.farmer_id == req.farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="शेतकरी माहिती आढळली नाही.")

    try:
        # Generate token number
        token_num = booked + 1
        token_str = f"#{token_num:02d}"

        # Create booking record
        booking = Booking(
            farmer_id=req.farmer_id,
            slot_id=req.slot_id,
            crop_name=req.crop_name,
            expected_quantity=req.expected_quantity,
            token_number=token_str,
            booking_status="confirmed",
            created_at=datetime.utcnow()
        )
        db.add(booking)
        db.flush()  # get booking_id

        # Update slot booked_count
        slot.booked_count = int(booked) + 1  # type: ignore[assignment]

        # Add to queue_status
        queue_entry = QueueStatus(
            slot_id=req.slot_id,
            booking_id=booking.booking_id,
            queue_position=booked + 1,
            status="waiting"
        )
        db.add(queue_entry)

        db.commit()
        db.refresh(booking)

        return {
            "success": True,
            "booking": {
                "booking_id": booking.booking_id,
                "farmer_id": booking.farmer_id,
                "slot_id": booking.slot_id,
                "crop_name": booking.crop_name,
                "expected_quantity": float(str(booking.expected_quantity)),
                "token_number": booking.token_number,
                "booking_status": booking.booking_status,
                "created_at": str(booking.created_at) if booking.created_at else None
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"बुकिंग प्रक्रियेत त्रुटी: {str(e)}")


# ─── GET BOOKINGS (by farmer) ────────────────────────────
@app.get("/api/bookings")
def get_bookings(
    farmer_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(
            Booking, Farmer, Slot, ProcurementCentre
        ).join(
            Farmer, Farmer.farmer_id == Booking.farmer_id
        ).join(
            Slot, Slot.slot_id == Booking.slot_id
        ).join(
            ProcurementCentre, ProcurementCentre.centre_id == Slot.centre_id
        )

        if farmer_id:
            query = query.filter(Booking.farmer_id == farmer_id)

        rows = query.order_by(Booking.created_at.desc()).all()

        bookings_list = []
        for booking, farmer, slot, centre in rows:
            bookings_list.append({
                "booking_id": booking.booking_id,
                "farmer_id": booking.farmer_id,
                "farmer_name": farmer.full_name,
                "mobile_number": farmer.mobile_number,
                "slot_id": booking.slot_id,
                "slot_date": str(slot.slot_date),
                "start_time": str(slot.start_time)[:5],
                "end_time": str(slot.end_time)[:5],
                "centre_id": centre.centre_id,
                "centre_name": centre.centre_name,
                "crop_name": booking.crop_name,
                "expected_quantity": float(str(booking.expected_quantity)),
                "token_number": booking.token_number,
                "booking_status": booking.booking_status,
                "created_at": str(booking.created_at) if booking.created_at else None
            })

        return {"success": True, "bookings": bookings_list}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── CANCEL BOOKING ──────────────────────────────────────
@app.post("/api/bookings/cancel")
def cancel_booking(req: CancelBookingRequest, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(
        Booking.booking_id == req.booking_id
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="बुकिंग आढळली नाही.")

    if booking.booking_status == "cancelled":
        raise HTTPException(status_code=400, detail="ही बुकिंग आधीच रद्द झाली आहे.")

    try:
        booking.booking_status = "cancelled"  # type: ignore[assignment]

        # Decrease booked_count on slot
        slot = db.query(Slot).filter(Slot.slot_id == booking.slot_id).first()
        if slot and slot.booked_count:
            current_count = int(str(slot.booked_count))
            if current_count > 0:
                slot.booked_count = current_count - 1  # type: ignore[assignment]

        # Update queue status
        queue = db.query(QueueStatus).filter(
            QueueStatus.booking_id == req.booking_id
        ).first()
        if queue:
            queue.status = "cancelled"  # type: ignore[assignment]
            queue.completed_at = datetime.utcnow()  # type: ignore[assignment]

        db.commit()

        return {"success": True, "message": "बुकिंग यशस्वीरित्या रद्द झाली."}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"रद्द करताना त्रुटी: {str(e)}")


# ─── LIVE QUEUE ──────────────────────────────────────────
@app.get("/api/live-queue")
def live_queue(
    centre_id: int = Query(...),
    db: Session = Depends(get_db)
):
    try:
        today = date.today()

        # Get all confirmed bookings for this centre today
        rows = db.query(
            Booking, Farmer, Slot, QueueStatus
        ).join(
            Farmer, Farmer.farmer_id == Booking.farmer_id
        ).join(
            Slot, Slot.slot_id == Booking.slot_id
        ).outerjoin(
            QueueStatus, QueueStatus.booking_id == Booking.booking_id
        ).filter(
            Slot.centre_id == centre_id,
            Slot.slot_date == today,
            Booking.booking_status == "confirmed"
        ).order_by(QueueStatus.queue_position).all()

        serving = None
        waiting = []

        for booking, farmer, slot, queue in rows:
            entry = {
                "booking_id": booking.booking_id,
                "token_number": booking.token_number,
                "farmer_id": farmer.farmer_id,
                "farmer_name": farmer.full_name,
                "mobile_number": farmer.mobile_number,
                "crop_name": booking.crop_name,
                "expected_quantity": float(str(booking.expected_quantity)),
                "start_time": str(slot.start_time)[:5],
                "end_time": str(slot.end_time)[:5],
                "queue_position": int(str(queue.queue_position)) if queue and queue.queue_position else 99,
                "queue_status": str(queue.status) if queue and queue.status else "waiting"
            }

            if queue and queue.status == "serving":
                serving = entry
            else:
                waiting.append(entry)

        return {
            "success": True,
            "centre_id": centre_id,
            "date": str(today),
            "now_serving": serving,
            "waiting_list": waiting,
            "total_waiting": len(waiting)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── FARMER PROFILE ──────────────────────────────────────
@app.get("/api/farmer/{farmer_id}")
def get_farmer_profile(farmer_id: int, db: Session = Depends(get_db)):
    try:
        query = text("""
            SELECT
                f.farmer_id,
                f.full_name,
                f.father_spouse_name,
                f.mobile_number,
                f.date_of_birth,
                f.email,
                f.gender,
                f.role,
                f.status,

                a.full_address,
                a.district,
                a.taluka,
                a.village,
                a.pincode,
                a.state,

                fd.farm_area,
                fd.area_unit,
                fd.crop_name,
                fd.expected_quantity,
                fd.preferred_centre,

                fa.mobile_verified,
                fa.verification_status

            FROM farmers f

            LEFT JOIN farmer_addresses a
                ON a.farmer_id = f.farmer_id

            LEFT JOIN farmer_farming_details fd
                ON fd.farmer_id = f.farmer_id

            LEFT JOIN farmer_accounts fa
                ON fa.farmer_id = f.farmer_id

            WHERE f.farmer_id = :farmer_id
            ORDER BY a.address_id DESC, fd.farming_id DESC
            LIMIT 1
        """)

        result = db.execute(query, {"farmer_id": farmer_id}).mappings().first()

        if not result:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "message": "शेतकरी सापडला नाही.",
                    "detail": "शेतकरी सापडला नाही."
                }
            )

        farmer = dict(result)

        # Safely serialize PostgreSQL types
        if farmer.get("date_of_birth") is not None:
            farmer["date_of_birth"] = str(farmer["date_of_birth"])
        if farmer.get("farm_area") is not None:
            farmer["farm_area"] = float(farmer["farm_area"])
        if farmer.get("expected_quantity") is not None:
            farmer["expected_quantity"] = float(farmer["expected_quantity"])

        # Backward compatibility aliases for frontend compatibility
        farmer["land_area_acres"] = farmer.get("farm_area")
        farmer["primary_crop"] = farmer.get("crop_name") or ""

        return {
            "success": True,
            "farmer": farmer
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Get farmer profile error: {e}")
        raise HTTPException(
            status_code=500,
            detail="शेतकरी माहिती मिळवताना त्रुटी आली."
        )
