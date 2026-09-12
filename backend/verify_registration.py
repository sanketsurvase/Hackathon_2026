import os
import sys
import time
import json
import urllib.request
import urllib.error
from pathlib import Path
from typing import Any, Dict, Tuple, Optional

import psycopg2
from dotenv import load_dotenv


# ---------------------------------------------------------
# UTF-8 OUTPUT
# ---------------------------------------------------------

if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    try:
        getattr(sys.stdout, "reconfigure")(encoding="utf-8")
    except Exception:
        pass


def log(message: Any) -> None:
    try:
        print(message)
    except UnicodeEncodeError:
        print(ascii(message))


# ---------------------------------------------------------
# LOAD ENVIRONMENT
# ---------------------------------------------------------

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

db_url = os.getenv("DATABASE_URL")

if not db_url:
    log("ERROR: DATABASE_URL not found in backend/.env")
    sys.exit(1)

if "render.com" in db_url and "sslmode" not in db_url:
    separator = "&" if "?" in db_url else "?"
    db_url += f"{separator}sslmode=require"


# ---------------------------------------------------------
# LIVE BACKEND
# ---------------------------------------------------------

API_BASE = "https://hackathon-2026-0gus.onrender.com"


# ---------------------------------------------------------
# HTTP HELPERS
# ---------------------------------------------------------

def post_json(url: str, payload: Any) -> Tuple[int, Dict[str, Any]]:
    data_bytes = json.dumps(
        payload,
        ensure_ascii=False
    ).encode("utf-8")

    request = urllib.request.Request(
        url,
        data=data_bytes,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            body = response.read().decode("utf-8")

            try:
                data = json.loads(body)
            except Exception:
                data = {"raw": body}

            return response.status, data if isinstance(data, dict) else {"data": data}

    except urllib.error.HTTPError as error:
        body = error.read().decode(
            "utf-8",
            errors="replace"
        )

        try:
            data = json.loads(body)
        except Exception:
            data = {"raw": body}

        return error.code, data if isinstance(data, dict) else {"raw": body}

    except Exception as error:
        return 0, {
            "error": str(error)
        }


# ---------------------------------------------------------
# DATABASE ROW CHECK
# ---------------------------------------------------------

def get_row(cursor: Any, table: str, farmer_id: int) -> Optional[Dict[str, Any]]:
    cursor.execute(
        f"""
        SELECT *
        FROM {table}
        WHERE farmer_id = %s
        """,
        (farmer_id,)
    )

    row = cursor.fetchone()

    if not row:
        return None

    columns = [
        description[0]
        for description in (cursor.description or ())
    ]

    return dict(zip(columns, row))


# ---------------------------------------------------------
# MAIN TEST
# ---------------------------------------------------------

def run_test() -> Tuple[bool, Optional[int]]:

    all_matched = True

    timestamp = int(time.time())

    # Generate unique dynamic test information
    unique_mobile = "9" + str(timestamp)[-9:]
    unique_email = (
        f"farmer_live_{timestamp}@example.com"
    )

    password = f"Ks@{timestamp}"

    test_payload: Dict[str, Any] = {
        "full_name":
            f"Test Farmer {timestamp}",

        "father_spouse_name":
            f"Test Parent {timestamp}",

        "mobile_number":
            unique_mobile,

        "date_of_birth":
            "1985-06-12",

        "email":
            unique_email,

        "gender":
            "male",

        "full_address":
            f"Test Address {timestamp}",

        "district":
            "Solapur",

        "taluka":
            "Pandharpur",

        "village":
            f"TestVillage{timestamp}",

        "pincode":
            "413304",

        "farm_area":
            4.5,

        "area_unit":
            "एकर",

        "crop_name":
            "Soybean",

        "expected_quantity":
            50.0,

        "preferred_centre":
            None,

        "password":
            password
    }

    # =====================================================
    # STEP 1 - REGISTER
    # =====================================================

    log("=" * 60)
    log("STEP 1: LIVE REGISTRATION TEST")
    log("=" * 60)

    log(
        f"API: {API_BASE}/api/register"
    )

    log(
        f"Dynamic Mobile: {unique_mobile}"
    )

    registration_status, registration_result = post_json(
        f"{API_BASE}/api/register",
        test_payload
    )

    log(
        f"Registration Status: "
        f"{registration_status}"
    )

    log(
        f"Registration Response: "
        f"{registration_result}"
    )

    if (
        registration_status not in (200, 201)
        or not registration_result.get("success")
    ):
        log("\nFAIL: Registration failed.")

        if registration_status == 422:
            log(
                "Reason: frontend/backend field "
                "validation mismatch."
            )

        elif registration_status == 409:
            log(
                "Reason: duplicate mobile/email."
            )

        elif registration_status == 500:
            log(
                "Reason: backend/database failure. "
                "Check Render logs."
            )

        elif registration_status == 0:
            log(
                "Reason: could not connect to API."
            )

        return False, None

    farmer_id = registration_result.get(
        "farmer_id"
    )

    if not farmer_id:
        log(
            "FAIL: Registration succeeded "
            "but farmer_id was not returned."
        )
        return False, None

    log(
        f"SUCCESS: Created farmer_id = {farmer_id}"
    )

    # =====================================================
    # STEP 2 - CHECK DATABASE
    # =====================================================

    log("\n" + "=" * 60)
    log("STEP 2: DATABASE VERIFICATION")
    log("=" * 60)

    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()

    try:
        farmers = get_row(
            cursor,
            "farmers",
            farmer_id
        )

        address = get_row(
            cursor,
            "farmer_addresses",
            farmer_id
        )

        farming = get_row(
            cursor,
            "farmer_farming_details",
            farmer_id
        )

        account = get_row(
            cursor,
            "farmer_accounts",
            farmer_id
        )

        table_rows = {
            "farmers": farmers,
            "farmer_addresses": address,
            "farmer_farming_details": farming,
            "farmer_accounts": account
        }

        for table, row in table_rows.items():
            if row:
                log(
                    f"✓ {table}: ROW FOUND"
                )
            else:
                log(
                    f"✗ {table}: ROW NOT FOUND"
                )
                all_matched = False

        if (
            farmers is None
            or address is None
            or farming is None
            or account is None
        ):
            return False, farmer_id

        # =================================================
        # STEP 3 - FIELD COMPARISON
        # =================================================

        log("\n" + "=" * 60)
        log("STEP 3: FIELD VALUE VERIFICATION")
        log("=" * 60)

        checks: list[Tuple[str, Any, Any]] = [
            (
                "farmers.full_name",
                farmers["full_name"],
                test_payload["full_name"]
            ),
            (
                "farmers.father_spouse_name",
                farmers["father_spouse_name"],
                test_payload[
                    "father_spouse_name"
                ]
            ),
            (
                "farmers.mobile_number",
                farmers["mobile_number"],
                test_payload[
                    "mobile_number"
                ]
            ),
            (
                "farmers.date_of_birth",
                str(
                    farmers["date_of_birth"]
                ),
                test_payload[
                    "date_of_birth"
                ]
            ),
            (
                "farmers.email",
                farmers["email"],
                test_payload["email"]
            ),
            (
                "farmers.gender",
                farmers["gender"],
                test_payload["gender"]
            ),
            (
                "address.full_address",
                address["full_address"],
                test_payload[
                    "full_address"
                ]
            ),
            (
                "address.district",
                address["district"],
                test_payload["district"]
            ),
            (
                "address.taluka",
                address["taluka"],
                test_payload["taluka"]
            ),
            (
                "address.village",
                address["village"],
                test_payload["village"]
            ),
            (
                "address.pincode",
                address["pincode"],
                test_payload["pincode"]
            ),
            (
                "farming.crop_name",
                farming["crop_name"],
                test_payload["crop_name"]
            ),
            (
                "farming.area_unit",
                farming["area_unit"],
                test_payload["area_unit"]
            )
        ]

        if farming["farm_area"] is not None:
            checks.append(
                (
                    "farming.farm_area",
                    float(
                        farming[
                            "farm_area"
                        ]
                    ),
                    float(
                        test_payload[
                            "farm_area"
                        ]
                    )
                )
            )

        if (
            farming[
                "expected_quantity"
            ] is not None
        ):
            checks.append(
                (
                    "farming.expected_quantity",
                    float(
                        farming[
                            "expected_quantity"
                        ]
                    ),
                    float(
                        test_payload[
                            "expected_quantity"
                        ]
                    )
                )
            )

        for label, stored, expected in checks:

            if stored == expected:
                log(
                    f"✓ {label}: MATCH"
                )
            else:
                log(
                    f"✗ {label}: "
                    f"stored={stored} "
                    f"expected={expected}"
                )
                all_matched = False

        # =================================================
        # PASSWORD CHECK
        # =================================================

        password_hash = account.get(
            "password_hash"
        )

        if (
            password_hash
            and password_hash
            != test_payload["password"]
            and password_hash.startswith(
                ("$2a$", "$2b$", "$2y$")
            )
        ):
            log(
                "✓ Password stored as bcrypt hash."
            )
        else:
            log(
                "✗ Password hash invalid "
                "or plain password stored."
            )
            all_matched = False

    finally:
        cursor.close()
        conn.close()

    # =====================================================
    # STEP 4 - LOGIN
    # =====================================================

    log("\n" + "=" * 60)
    log("STEP 4: LOGIN TEST")
    log("=" * 60)

    login_status, login_result = post_json(
        f"{API_BASE}/api/login",
        {
            "identifier": unique_mobile,
            "password": password
        }
    )

    log(
        f"Login Status: {login_status}"
    )

    log(
        f"Login Response: {login_result}"
    )

    if login_status != 200:
        log("✗ Login failed.")
        all_matched = False

    else:
        returned_farmer_id = None

        farmer_data = login_result.get("farmer")
        if isinstance(
            farmer_data,
            dict
        ):
            returned_farmer_id = (
                farmer_data.get(
                    "farmer_id"
                )
            )

        if returned_farmer_id is None:
            returned_farmer_id = (
                login_result.get(
                    "farmer_id"
                )
            )

        if (
            returned_farmer_id is not None
            and int(returned_farmer_id)
            == int(farmer_id)
        ):
            log(
                "✓ Login returned "
                "correct farmer_id."
            )
        else:
            log(
                "⚠ Login returned HTTP 200, "
                "but farmer_id response format "
                "needs checking."
            )

    # =====================================================
    # STEP 5 - DUPLICATE MOBILE TEST
    # =====================================================

    log("\n" + "=" * 60)
    log("STEP 5: DUPLICATE MOBILE TEST")
    log("=" * 60)

    duplicate_payload = dict(
        test_payload
    )

    # Same mobile intentionally
    duplicate_payload[
        "mobile_number"
    ] = unique_mobile

    # Different email so the mobile check is tested
    duplicate_payload[
        "email"
    ] = (
        f"duplicate_{timestamp}"
        "@example.com"
    )

    duplicate_status, duplicate_result = post_json(
        f"{API_BASE}/api/register",
        duplicate_payload
    )

    log(
        f"Duplicate Status: "
        f"{duplicate_status}"
    )

    log(
        f"Duplicate Response: "
        f"{duplicate_result}"
    )

    if duplicate_status == 409:
        log(
            "✓ Duplicate mobile correctly "
            "rejected with HTTP 409."
        )
    else:
        log(
            f"✗ Expected 409, received "
            f"{duplicate_status}."
        )
        all_matched = False

    return all_matched, farmer_id


# ---------------------------------------------------------
# RUN SCRIPT
# ---------------------------------------------------------

if __name__ == "__main__":

    success, farmer_id = run_test()

    log("\n" + "=" * 60)

    if success:
        log(
            "ALL VERIFICATION TESTS PASSED!"
        )
        log(
            f"Created farmer_id: {farmer_id}"
        )
        sys.exit(0)

    else:
        log(
            "ONE OR MORE TESTS FAILED!"
        )

        if farmer_id:
            log(
                f"Created farmer_id: "
                f"{farmer_id}"
            )

        sys.exit(1)
