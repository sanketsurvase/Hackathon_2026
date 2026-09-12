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
# WINDOWS UTF-8 OUTPUT
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
# LOAD RENDER DATABASE URL
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
# LIVE RENDER BACKEND
# ---------------------------------------------------------

API_BASE = "https://hackathon-2026-0gus.onrender.com"


# ---------------------------------------------------------
# HTTP HELPERS
# ---------------------------------------------------------

def get_json(url: str) -> Tuple[int, Dict[str, Any]]:
    req = urllib.request.Request(
        url,
        headers={"Accept": "application/json"}
    )

    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            body = resp.read().decode("utf-8")

            try:
                data = json.loads(body)
            except Exception:
                data = {"raw": body}

            return resp.status, data if isinstance(data, dict) else {"data": data}

    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")

        try:
            data = json.loads(body)
        except Exception:
            data = {"raw": body}

        return error.code, data if isinstance(data, dict) else {"raw": body}

    except Exception as error:
        return 0, {"error": str(error)}


def post_json(url: str, payload: Any) -> Tuple[int, Dict[str, Any]]:
    data_bytes = json.dumps(
        payload,
        ensure_ascii=False
    ).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=data_bytes,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            body = resp.read().decode("utf-8")

            try:
                data = json.loads(body)
            except Exception:
                data = {"raw": body}

            return resp.status, data if isinstance(data, dict) else {"data": data}

    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")

        try:
            data = json.loads(body)
        except Exception:
            data = {"raw": body}

        return error.code, data if isinstance(data, dict) else {"raw": body}

    except Exception as error:
        return 0, {"error": str(error)}


# ---------------------------------------------------------
# GET EXISTING FARMER IDS DYNAMICALLY
# ---------------------------------------------------------

def get_existing_farmer_ids(limit: int = 2) -> list[int]:
    conn = psycopg2.connect(db_url)

    try:
        cur = conn.cursor()

        cur.execute(
            """
            SELECT farmer_id
            FROM farmers
            ORDER BY farmer_id
            LIMIT %s
            """,
            (limit,)
        )

        rows = cur.fetchall()

        return [row[0] for row in rows]

    finally:
        conn.close()


# ---------------------------------------------------------
# VERIFY NEW FARMER IN ALL TABLES
# ---------------------------------------------------------

def verify_farmer_in_database(farmer_id: int) -> bool:
    conn = psycopg2.connect(db_url)

    try:
        cur = conn.cursor()

        tables = [
            "farmers",
            "farmer_addresses",
            "farmer_farming_details",
            "farmer_accounts"
        ]

        all_found = True

        for table in tables:
            cur.execute(
                f"""
                SELECT *
                FROM {table}
                WHERE farmer_id = %s
                """,
                (farmer_id,)
            )

            row = cur.fetchone()

            if row:
                log(f"✓ Record found in {table}")
            else:
                log(
                    f"✗ No record found in {table} "
                    f"for farmer_id={farmer_id}"
                )
                all_found = False

        # Security check
        cur.execute(
            """
            SELECT password_hash
            FROM farmer_accounts
            WHERE farmer_id = %s
            """,
            (farmer_id,)
        )

        account = cur.fetchone()

        if account and account[0]:
            log("✓ Password hash exists in farmer_accounts")
        else:
            log("✗ Password hash missing")
            all_found = False

        return all_found

    finally:
        conn.close()


# ---------------------------------------------------------
# MAIN TESTS
# ---------------------------------------------------------

def run_tests() -> bool:
    all_ok = True

    log("=" * 60)
    log("KISANSETU LIVE SIGNUP / LOGIN / PROFILE TEST")
    log("=" * 60)

    # -----------------------------------------------------
    # TEST EXISTING FARMERS
    # -----------------------------------------------------

    existing_ids = get_existing_farmer_ids(2)

    if existing_ids:
        for index, farmer_id in enumerate(existing_ids, start=1):

            log("\n" + "=" * 60)
            log(
                f"TEST {index}: "
                f"GET /api/farmer/{farmer_id}"
            )
            log("=" * 60)

            status, data = get_json(
                f"{API_BASE}/api/farmer/{farmer_id}"
            )

            log(f"Status Code: {status}")
            log(f"Response: {data}")

            if status == 200 and data.get("success"):
                farmer_raw = data.get("farmer")
                farmer: Dict[str, Any] = farmer_raw if isinstance(farmer_raw, dict) else {}

                log(
                    "✓ Farmer profile returned: "
                    f"{farmer.get('full_name')}"
                )

                if (
                    "password_hash" in farmer
                    or "password" in farmer
                ):
                    log(
                        "✗ SECURITY ERROR: "
                        "Password information exposed!"
                    )
                    all_ok = False
                else:
                    log(
                        "✓ Password information is not exposed."
                    )

            else:
                log(
                    f"✗ Farmer profile API failed "
                    f"for farmer_id={farmer_id}"
                )
                all_ok = False
    else:
        log("No existing farmers found in database.")

    # -----------------------------------------------------
    # TEST NONEXISTENT FARMER
    # -----------------------------------------------------

    log("\n" + "=" * 60)
    log("TEST: NONEXISTENT FARMER")
    log("=" * 60)

    status, data = get_json(
        f"{API_BASE}/api/farmer/999999999"
    )

    log(f"Status Code: {status}")
    log(f"Response: {data}")

    if status == 404:
        log("✓ Missing farmer correctly returns HTTP 404.")
    else:
        log(
            f"✗ Expected HTTP 404, received {status}."
        )
        all_ok = False

    # -----------------------------------------------------
    # COMPLETE SIGNUP FLOW
    # -----------------------------------------------------

    log("\n" + "=" * 60)
    log(
        "TEST: SIGNUP -> DATABASE -> LOGIN -> PROFILE"
    )
    log("=" * 60)

    timestamp = int(time.time())

    # Generate unique dynamic values
    new_mobile = "9" + str(timestamp)[-9:]
    new_email = f"kisansetu_test_{timestamp}@example.com"

    test_password = f"Ks@{timestamp}"

    registration_payload = {
        "full_name": f"Test Farmer {timestamp}",
        "father_spouse_name": f"Test Parent {timestamp}",
        "mobile_number": new_mobile,
        "date_of_birth": "1995-01-01",
        "email": new_email,
        "gender": "male",

        "full_address": f"Test Address {timestamp}",
        "district": "Solapur",
        "taluka": "Pandharpur",
        "village": f"TestVillage{timestamp}",
        "pincode": "413304",

        "farm_area": 5.0,
        "area_unit": "एकर",
        "crop_name": "Soybean",
        "expected_quantity": 50.0,
        "preferred_centre": None,

        "password": test_password
    }

    log(
        f"Generated mobile: {new_mobile}"
    )

    # Signup
    registration_status, registration_data = post_json(
        f"{API_BASE}/api/register",
        registration_payload
    )

    log(
        f"Signup Status: {registration_status}"
    )
    log(
        f"Signup Response: {registration_data}"
    )

    if (
        registration_status not in (200, 201)
        or not registration_data.get("success")
    ):
        log("✗ SIGNUP FAILED")

        log(
            "Check the response above and Render logs "
            "for the exact backend error."
        )

        return False

    new_farmer_id = registration_data.get(
        "farmer_id"
    )

    if not new_farmer_id:
        log(
            "✗ Registration succeeded but "
            "farmer_id was not returned."
        )
        return False

    log(
        f"✓ Registration successful. "
        f"farmer_id={new_farmer_id}"
    )

    # -----------------------------------------------------
    # VERIFY DATABASE
    # -----------------------------------------------------

    log("\nChecking Render PostgreSQL...")

    if verify_farmer_in_database(new_farmer_id):
        log(
            "✓ Farmer exists in all four tables."
        )
    else:
        log(
            "✗ Farmer database verification failed."
        )
        all_ok = False

    # -----------------------------------------------------
    # LOGIN
    # -----------------------------------------------------

    log("\nTesting login...")

    login_payload = {
        "identifier": new_mobile,
        "password": test_password
    }

    login_status, login_data = post_json(
        f"{API_BASE}/api/login",
        login_payload
    )

    log(f"Login Status: {login_status}")
    log(f"Login Response: {login_data}")

    if login_status == 200:
        log("✓ Login API returned HTTP 200.")

        returned_farmer_id: Optional[Any] = None

        farmer_obj = login_data.get("farmer")
        if isinstance(farmer_obj, dict):
            returned_farmer_id = (
                farmer_obj.get("farmer_id")
            )

        if returned_farmer_id is None:
            returned_farmer_id = login_data.get(
                "farmer_id"
            )

        if (
            returned_farmer_id is not None
            and int(returned_farmer_id)
            == int(new_farmer_id)
        ):
            log(
                "✓ Login returned correct farmer_id."
            )
        else:
            log(
                "⚠ Login succeeded but farmer_id "
                "response format differs."
            )

    else:
        log("✗ Login failed.")
        all_ok = False

    # -----------------------------------------------------
    # PROFILE
    # -----------------------------------------------------

    log("\nTesting new farmer profile...")

    profile_status, profile_data = get_json(
        f"{API_BASE}/api/farmer/{new_farmer_id}"
    )

    log(
        f"Profile Status: {profile_status}"
    )
    log(
        f"Profile Response: {profile_data}"
    )

    if (
        profile_status == 200
        and profile_data.get("success")
    ):
        p_farmer_raw = profile_data.get(
            "farmer"
        )
        farmer = p_farmer_raw if isinstance(p_farmer_raw, dict) else {}

        log(
            "✓ Newly registered farmer profile "
            "returned successfully."
        )

        if (
            "password_hash" in farmer
            or "password" in farmer
        ):
            log(
                "✗ SECURITY ERROR: "
                "Password exposed in profile response."
            )
            all_ok = False
        else:
            log(
                "✓ Profile does not expose password."
            )

    else:
        log(
            "✗ New farmer profile endpoint failed."
        )
        all_ok = False

    return all_ok


# ---------------------------------------------------------
# RUN
# ---------------------------------------------------------

if __name__ == "__main__":

    success = run_tests()

    if success:
        log(
            "\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<"
        )
        sys.exit(0)

    else:
        log(
            "\n>>> ONE OR MORE TESTS FAILED! <<<"
        )
        sys.exit(1)
