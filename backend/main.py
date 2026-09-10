import os
import sys
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import text
import bcrypt
import uvicorn

# Ensure the backend directory and project root are in sys.path
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

for path_str in (str(BACKEND_DIR), str(PROJECT_ROOT)):
    if path_str not in sys.path:
        sys.path.insert(0, path_str)

try:
    from database import SessionLocal
except ImportError:
    try:
        from backend.database import SessionLocal
    except ImportError:
        import database
        SessionLocal = database.SessionLocal

# =========================================================
# APPLICATION SETUP & CONFIGURATION
# =========================================================

app = FastAPI(
    title="KisanSetu Backend API",
    description="Backend services for KisanSetu Farmer Portal",
    version="1.0.0"
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# SCHEMAS (PYDANTIC MODELS)
# =========================================================

class FarmerLogin(BaseModel):
    identifier: str = Field(..., description="मोबाईल क्रमांक किंवा ईमेल")
    password: str = Field(..., description="खाते पासवर्ड")


class FarmerRegister(BaseModel):
    full_name: str
    father_spouse_name: str
    mobile_number: str
    date_of_birth: str
    email: Optional[str] = None
    gender: str = "इतर"
    full_address: str
    district: str
    taluka: str
    village: str
    pincode: str
    farm_area: Optional[float] = 0.0
    area_unit: Optional[str] = "एकर"
    crop_name: Optional[str] = None
    expected_quantity: Optional[float] = 0.0
    preferred_centre: Optional[str] = None
    password: str


# =========================================================
# SECURITY UTILITIES
# =========================================================

def hash_password(password: str) -> str:
    """Generate bcrypt password hash."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password with fallback safety."""
    if not plain_password or not hashed_password:
        return False
    try:
        if hashed_password.startswith(("$2b$", "$2a$", "$2y$")):
            return bcrypt.checkpw(
                plain_password.encode("utf-8"),
                hashed_password.encode("utf-8")
            )
    except Exception:
        pass
    # Fallback comparison for development/test records
    return plain_password == hashed_password


# =========================================================
# ROOT / HEALTH CHECK
# =========================================================

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "KisanSetu Backend API",
        "version": "1.0.0"
    }


# =========================================================
# LOGIN FARMER
# =========================================================

@app.post("/api/login")
def login_farmer(data: FarmerLogin):

    db = SessionLocal()

    try:
        identifier = data.identifier.strip()
        password = data.password

        # Check empty fields
        if not identifier:
            raise HTTPException(
                status_code=400,
                detail="कृपया मोबाईल क्रमांक किंवा ईमेल प्रविष्ट करा."
            )

        if not password:
            raise HTTPException(
                status_code=400,
                detail="कृपया पासवर्ड प्रविष्ट करा."
            )

        # Find farmer by mobile number or email
        farmer = db.execute(
            text("""
                SELECT
                    f.farmer_id,
                    f.full_name,
                    f.mobile_number,
                    f.email,
                    f.status,
                    a.password_hash,
                    a.mobile_verified,
                    a.verification_status
                FROM farmers AS f
                INNER JOIN farmer_accounts AS a
                    ON f.farmer_id = a.farmer_id
                WHERE
                    f.mobile_number = :identifier
                    OR LOWER(COALESCE(f.email, '')) = LOWER(:identifier)
                LIMIT 1
            """),
            {
                "identifier": identifier
            }
        ).mappings().fetchone()

        # Farmer not found
        if farmer is None:
            raise HTTPException(
                status_code=401,
                detail="हा मोबाईल क्रमांक किंवा ईमेल नोंदणीकृत नाही."
            )

        # Verify password
        if not verify_password(
            password,
            farmer["password_hash"]
        ):
            raise HTTPException(
                status_code=401,
                detail="पासवर्ड चुकीचा आहे."
            )

        # Check farmer status
        if farmer["status"] != "active":
            raise HTTPException(
                status_code=403,
                detail="आपले खाते सध्या सक्रिय नाही."
            )

        # Update last login
        db.execute(
            text("""
                UPDATE farmer_accounts
                SET last_login = CURRENT_TIMESTAMP
                WHERE farmer_id = :farmer_id
            """),
            {
                "farmer_id": farmer["farmer_id"]
            }
        )

        db.commit()

        # Successful login
        return {
            "success": True,
            "message": "लॉगिन यशस्वी झाले.",
            "farmer": {
                "farmer_id": farmer["farmer_id"],
                "full_name": farmer["full_name"],
                "mobile_number": farmer["mobile_number"],
                "email": farmer["email"]
            }
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()
        print("Login Error:", str(error))
        raise HTTPException(
            status_code=500,
            detail="लॉगिन पूर्ण करता आले नाही. कृपया पुन्हा प्रयत्न करा."
        )

    finally:
        db.close()


# =========================================================
# REGISTER FARMER
# =========================================================

@app.post("/api/register", status_code=status.HTTP_201_CREATED)
def register_farmer(data: FarmerRegister):

    db = SessionLocal()

    try:
        mobile = data.mobile_number.strip()
        full_name = data.full_name.strip()
        password = data.password.strip()

        if not full_name:
            raise HTTPException(status_code=400, detail="कृपया संपूर्ण नाव प्रविष्ट करा.")

        if not mobile or len(mobile) != 10 or not mobile.isdigit():
            raise HTTPException(status_code=400, detail="कृपया १० अंकी वैध मोबाईल क्रमांक प्रविष्ट करा.")

        if not password or len(password) < 6:
            raise HTTPException(status_code=400, detail="पासवर्ड किमान ६ अक्षरांचा असावा.")

        # Check if mobile already exists
        existing = db.execute(
            text("SELECT farmer_id FROM farmers WHERE mobile_number = :mobile LIMIT 1"),
            {"mobile": mobile}
        ).fetchone()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="हा मोबाईल क्रमांक आधीच नोंदणीकृत आहे. कृपया लॉगिन करा."
            )

        # 1. Insert Farmer
        result = db.execute(
            text("""
                INSERT INTO farmers (
                    full_name, father_spouse_name, mobile_number,
                    date_of_birth, email, gender, role, status
                ) VALUES (
                    :full_name, :father_spouse_name, :mobile_number,
                    CAST(:date_of_birth AS DATE), :email, :gender, 'farmer', 'active'
                ) RETURNING farmer_id
            """),
            {
                "full_name": full_name,
                "father_spouse_name": data.father_spouse_name.strip(),
                "mobile_number": mobile,
                "date_of_birth": data.date_of_birth,
                "email": data.email.strip() if data.email else None,
                "gender": data.gender
            }
        )
        farmer_id = result.scalar()

        # 2. Insert Farmer Address
        db.execute(
            text("""
                INSERT INTO farmer_addresses (
                    farmer_id, full_address, district, taluka, village, pincode, state
                ) VALUES (
                    :farmer_id, :full_address, :district, :taluka, :village, :pincode, 'Maharashtra'
                )
            """),
            {
                "farmer_id": farmer_id,
                "full_address": data.full_address.strip(),
                "district": data.district.strip(),
                "taluka": data.taluka.strip(),
                "village": data.village.strip(),
                "pincode": data.pincode.strip()
            }
        )

        # 3. Insert Farming Details
        db.execute(
            text("""
                INSERT INTO farmer_farming_details (
                    farmer_id, farm_area, area_unit, crop_name, expected_quantity, preferred_centre
                ) VALUES (
                    :farmer_id, :farm_area, :area_unit, :crop_name, :expected_quantity, :preferred_centre
                )
            """),
            {
                "farmer_id": farmer_id,
                "farm_area": data.farm_area or 0.0,
                "area_unit": data.area_unit or "एकर",
                "crop_name": data.crop_name,
                "expected_quantity": data.expected_quantity or 0.0,
                "preferred_centre": data.preferred_centre
            }
        )

        # 4. Insert Account Credentials
        pwd_hash = hash_password(password)
        db.execute(
            text("""
                INSERT INTO farmer_accounts (
                    farmer_id, password_hash, mobile_verified, verification_status
                ) VALUES (
                    :farmer_id, :password_hash, FALSE, 'pending'
                )
            """),
            {
                "farmer_id": farmer_id,
                "password_hash": pwd_hash
            }
        )

        db.commit()

        return {
            "success": True,
            "message": "नोंदणी यशस्वी झाली! आता आपण लॉगिन करू शकता.",
            "farmer_id": farmer_id
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()
        print("Registration Error:", str(error))
        raise HTTPException(
            status_code=500,
            detail="नोंदणी पूर्ण करता आले नाही. कृपया पुन्हा प्रयत्न करा."
        )

    finally:
        db.close()


# =========================================================
# ENTRY POINT
# =========================================================

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)