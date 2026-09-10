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
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import (
    Column, Integer, String, Date, Time, Numeric,
    DateTime, text, create_engine
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from dotenv import load_dotenv
import bcrypt

# ─── Load env ────────────────────────────────────────────
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
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
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
    mobile_number = Column(String)
    email = Column(String)
    created_at = Column(DateTime)


class FarmerAccount(Base):
    __tablename__ = "farmer_accounts"
    account_id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer)
    password_hash = Column(String)


class FarmerAddress(Base):
    __tablename__ = "farmer_addresses"
    address_id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer)
    village = Column(String)
    taluka = Column(String)
    district = Column(String)
    state = Column(String)
    pincode = Column(String)


class FarmerFarmingDetail(Base):
    __tablename__ = "farmer_farming_details"
    detail_id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer)
    land_area_acres = Column(Numeric)
    primary_crop = Column(String)
    secondary_crop = Column(String)
    gat_number = Column(String)


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


class RegisterRequest(BaseModel):
    full_name: str
    mobile_number: str
    email: Optional[str] = None
    password: str
    village: Optional[str] = None
    taluka: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    land_area_acres: Optional[float] = None
    primary_crop: Optional[str] = None
    secondary_crop: Optional[str] = None
    gat_number: Optional[str] = None


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

    # Find farmer by mobile or email
    farmer = db.query(Farmer).filter(
        (Farmer.mobile_number == identifier) | (Farmer.email == identifier)
    ).first()

    if not farmer:
        raise HTTPException(status_code=401, detail="मोबाईल क्रमांक किंवा ईमेल नोंदणीकृत नाही.")

    account = db.query(FarmerAccount).filter(
        FarmerAccount.farmer_id == farmer.farmer_id
    ).first()

    if not account:
        raise HTTPException(status_code=401, detail="या खात्यासाठी पासवर्ड सेट नाही.")

    try:
        password_matches = bcrypt.checkpw(
            req.password.encode("utf-8"),
            account.password_hash.encode("utf-8")
        )
    except Exception:
        raise HTTPException(status_code=500, detail="पासवर्ड तपासणीत त्रुटी.")

    if not password_matches:
        raise HTTPException(status_code=401, detail="चुकीचा पासवर्ड. कृपया पुन्हा प्रयत्न करा.")

    return {
        "success": True,
        "farmer": {
            "farmer_id": farmer.farmer_id,
            "full_name": farmer.full_name,
            "mobile_number": farmer.mobile_number,
            "email": farmer.email or ""
        }
    }


# ─── REGISTER ────────────────────────────────────────────
@app.post("/api/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Check duplicate mobile
    existing = db.query(Farmer).filter(
        Farmer.mobile_number == req.mobile_number
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="हा मोबाईल क्रमांक आधीच नोंदणीकृत आहे.")

    if req.email:
        existing_email = db.query(Farmer).filter(
            Farmer.email == req.email
        ).first()
        if existing_email:
            raise HTTPException(status_code=409, detail="हा ईमेल आधीच नोंदणीकृत आहे.")

    try:
        # Create farmer
        farmer = Farmer(
            full_name=req.full_name,
            mobile_number=req.mobile_number,
            email=req.email or None,
            created_at=datetime.utcnow()
        )
        db.add(farmer)
        db.flush()  # get farmer_id

        # Hash password
        hashed = bcrypt.hashpw(
            req.password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        account = FarmerAccount(
            farmer_id=farmer.farmer_id,
            password_hash=hashed
        )
        db.add(account)

        # Address
        if any([req.village, req.taluka, req.district]):
            address = FarmerAddress(
                farmer_id=farmer.farmer_id,
                village=req.village or "",
                taluka=req.taluka or "",
                district=req.district or "",
                state=req.state or "Maharashtra",
                pincode=req.pincode or ""
            )
            db.add(address)

        # Farming details
        if any([req.primary_crop, req.gat_number, req.land_area_acres]):
            details = FarmerFarmingDetail(
                farmer_id=farmer.farmer_id,
                land_area_acres=req.land_area_acres or 0,
                primary_crop=req.primary_crop or "",
                secondary_crop=req.secondary_crop or "",
                gat_number=req.gat_number or ""
            )
            db.add(details)

        db.commit()
        db.refresh(farmer)

        return {
            "success": True,
            "farmer_id": farmer.farmer_id,
            "message": "नोंदणी यशस्वी झाली!"
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"नोंदणी प्रक्रियेत त्रुटी: {str(e)}")


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
                    "capacity": s.capacity,
                    "booked_count": s.booked_count or 0
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

    booked = slot.booked_count or 0
    if booked >= slot.capacity:
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
        slot.booked_count = booked + 1

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
                "created_at": booking.created_at.isoformat()
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
                "created_at": booking.created_at.isoformat() if booking.created_at else None
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
        booking.booking_status = "cancelled"

        # Decrease booked_count on slot
        slot = db.query(Slot).filter(Slot.slot_id == booking.slot_id).first()
        if slot and slot.booked_count and slot.booked_count > 0:
            slot.booked_count = slot.booked_count - 1

        # Update queue status
        queue = db.query(QueueStatus).filter(
            QueueStatus.booking_id == req.booking_id
        ).first()
        if queue:
            queue.status = "cancelled"
            queue.completed_at = datetime.utcnow()

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
                "queue_position": queue.queue_position if queue else 99,
                "queue_status": queue.status if queue else "waiting"
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
    farmer = db.query(Farmer).filter(Farmer.farmer_id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="शेतकरी आढळला नाही.")

    address = db.query(FarmerAddress).filter(
        FarmerAddress.farmer_id == farmer_id
    ).first()

    farming = db.query(FarmerFarmingDetail).filter(
        FarmerFarmingDetail.farmer_id == farmer_id
    ).first()

    return {
        "success": True,
        "farmer": {
            "farmer_id": farmer.farmer_id,
            "full_name": farmer.full_name,
            "mobile_number": farmer.mobile_number,
            "email": farmer.email or "",
            "village": address.village if address else "",
            "taluka": address.taluka if address else "",
            "district": address.district if address else "",
            "state": address.state if address else "",
            "pincode": address.pincode if address else "",
            "land_area_acres": float(str(farming.land_area_acres)) if farming and farming.land_area_acres else 0,
            "primary_crop": farming.primary_crop if farming else "",
            "secondary_crop": farming.secondary_crop if farming else "",
            "gat_number": farming.gat_number if farming else ""
        }
    }
