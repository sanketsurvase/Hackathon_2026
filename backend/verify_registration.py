import os
import sys
import time
import json
import urllib.request
import urllib.error
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

# Set UTF-8 stdout encoding if possible
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def log(msg):
    try:
        print(msg)
    except UnicodeEncodeError:
        print(ascii(msg))

load_dotenv(dotenv_path=Path(__file__).parent / ".env")
db_url = os.getenv("DATABASE_URL")
if not db_url:
    log("ERROR: DATABASE_URL not found")
    sys.exit(1)
if "render.com" in db_url and "sslmode" not in db_url:
    db_url += "?sslmode=require"

API_BASE = "https://hackathon-2026-0gus.onrender.com"

def run_test():
    ts = int(time.time())
    unique_mobile = "97" + str(ts)[-8:]
    unique_email = f"farmer_live_{ts}@kisansetu.org"

    test_payload = {
        "full_name": "आनंद महादेव पाटील",
        "father_spouse_name": "महादेव विठ्ठल पाटील",
        "mobile_number": unique_mobile,
        "date_of_birth": "1985-06-12",
        "email": unique_email,
        "gender": "पुरुष",
        "full_address": "घर क्र. ४८, विठ्ठल रुक्मिणी मंदिर जवळ",
        "district": "सोलापूर",
        "taluka": "पंढरपूर",
        "village": "वाखरी",
        "pincode": "413304",
        "farm_area": 4.5,
        "area_unit": "एकर",
        "crop_name": "कापूस",
        "expected_quantity": 50.0,
        "preferred_centre": "कृषी उत्पन्न बाजार समिती (APMC)",
        "password": "SecurePassword@2026"
    }

    log("=" * 60)
    log("STEP 1: Testing Live POST /api/register on Render")
    log("=" * 60)
    log(f"Backend URL: {API_BASE}/api/register")
    log(f"Test Mobile: {unique_mobile}")
    log(f"Test Email:  {unique_email}")

    data_bytes = json.dumps(test_payload).encode("utf-8")
    req = urllib.request.Request(
        f"{API_BASE}/api/register",
        data=data_bytes,
        headers={"Content-Type": "application/json"}
    )

    reg_status = None
    reg_result = None
    try:
        with urllib.request.urlopen(req) as resp:
            reg_status = resp.status
            body = resp.read().decode("utf-8")
            reg_result = json.loads(body)
            log(f"Registration HTTP Status: {reg_status}")
            log(f"Registration Response: {reg_result}")
    except urllib.error.HTTPError as e:
        log(f"HTTP Error {e.code}: {e.read().decode('utf-8', errors='replace')}")
        return False
    except Exception as e:
        log(f"Registration Request Failed: {e}")
        return False

    if reg_status != 200 or not reg_result.get("success"):
        log("FAIL: Registration did not return success=True")
        return False

    created_farmer_id = reg_result.get("farmer_id")
    log(f"\nSUCCESS: Farmer registered with ID: {created_farmer_id}")

    log("\n" + "=" * 60)
    log("STEP 2: Verifying Data in Render PostgreSQL across all 4 tables")
    log("=" * 60)

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    tables = ["farmers", "farmer_addresses", "farmer_farming_details", "farmer_accounts"]
    stored_data = {}

    for tbl in tables:
        cur.execute(f"SELECT * FROM {tbl} WHERE farmer_id = %s", (created_farmer_id,))
        cols = [desc[0] for desc in cur.description]
        rows = cur.fetchall()
        if not rows:
            log(f"FAIL: No row found in table '{tbl}' for farmer_id {created_farmer_id}")
            cur.close()
            conn.close()
            return False
        row_dict = dict(zip(cols, rows[0]))
        stored_data[tbl] = row_dict
        log(f"Table '{tbl}': ROW FOUND")
        for k, v in row_dict.items():
            log(f"   {k}: {v}")

    cur.close()
    conn.close()

    log("\n" + "=" * 60)
    log("STEP 3: Field-by-Field Value Verification")
    log("=" * 60)

    f = stored_data["farmers"]
    a = stored_data["farmer_addresses"]
    d = stored_data["farmer_farming_details"]
    acc = stored_data["farmer_accounts"]

    checks = [
        ("farmers.farmer_id", f["farmer_id"], created_farmer_id),
        ("farmers.full_name", f["full_name"], test_payload["full_name"]),
        ("farmers.father_spouse_name", f["father_spouse_name"], test_payload["father_spouse_name"]),
        ("farmers.mobile_number", f["mobile_number"], test_payload["mobile_number"]),
        ("farmers.date_of_birth", str(f["date_of_birth"]), test_payload["date_of_birth"]),
        ("farmers.gender", f["gender"], test_payload["gender"]),
        ("farmers.email", f["email"], test_payload["email"]),
        ("farmer_addresses.farmer_id", a["farmer_id"], created_farmer_id),
        ("farmer_addresses.full_address", a["full_address"], test_payload["full_address"]),
        ("farmer_addresses.district", a["district"], test_payload["district"]),
        ("farmer_addresses.taluka", a["taluka"], test_payload["taluka"]),
        ("farmer_addresses.village", a["village"], test_payload["village"]),
        ("farmer_addresses.pincode", a["pincode"], test_payload["pincode"]),
        ("farmer_farming_details.farmer_id", d["farmer_id"], created_farmer_id),
        ("farmer_farming_details.farm_area", float(d["farm_area"]), test_payload["farm_area"]),
        ("farmer_farming_details.area_unit", d["area_unit"], test_payload["area_unit"]),
        ("farmer_farming_details.crop_name", d["crop_name"], test_payload["crop_name"]),
        ("farmer_farming_details.expected_quantity", float(d["expected_quantity"]), test_payload["expected_quantity"]),
        ("farmer_farming_details.preferred_centre", d["preferred_centre"], test_payload["preferred_centre"]),
        ("farmer_accounts.farmer_id", acc["farmer_id"], created_farmer_id),
    ]

    all_matched = True
    for label, stored_val, expected_val in checks:
        matched = (stored_val == expected_val)
        if matched:
            log(f"✓ {label:40}: MATCH ({stored_val})")
        else:
            log(f"✗ {label:40}: MISMATCH! Stored='{stored_val}', Expected='{expected_val}'")
            all_matched = False

    # Password hash check
    pw_hash = acc.get("password_hash")
    if pw_hash and pw_hash != test_payload["password"] and pw_hash.startswith("$2b$"):
        log(f"✓ {'farmer_accounts.password_hash':40}: HASHED WITH BCRYPT ({pw_hash[:15]}...)")
    else:
        log(f"✗ {'farmer_accounts.password_hash':40}: INVALID HASH ({pw_hash})")
        all_matched = False

    log("\n" + "=" * 60)
    log("STEP 4: Testing Live Login with newly registered user")
    log("=" * 60)
    login_req = urllib.request.Request(
        f"{API_BASE}/api/login",
        data=json.dumps({"identifier": unique_mobile, "password": test_payload["password"]}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(login_req) as resp:
            login_status = resp.status
            login_data = json.loads(resp.read().decode("utf-8"))
            log(f"Login HTTP Status: {login_status}")
            log(f"Login Response: {login_data}")
            returned_farmer_id = login_data.get("farmer", {}).get("farmer_id")
            if returned_farmer_id == created_farmer_id:
                log(f"✓ Login returned correct farmer_id: {returned_farmer_id}")
            else:
                log(f"✗ Login returned wrong farmer_id: {returned_farmer_id} vs expected {created_farmer_id}")
                all_matched = False
    except Exception as e:
        log(f"FAIL: Login failed with error: {e}")
        all_matched = False

    log("\n" + "=" * 60)
    log("STEP 5: Testing Duplicate Mobile Validation")
    log("=" * 60)
    dup_req = urllib.request.Request(
        f"{API_BASE}/api/register",
        data=json.dumps({
            "full_name": "डुप्लिकेट चाचणी",
            "father_spouse_name": "डुप्लिकेट वडील",
            "mobile_number": unique_mobile,
            "password": "NewPassword123"
        }).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        urllib.request.urlopen(dup_req)
        log("✗ Duplicate mobile was allowed! Expected 409 Conflict.")
        all_matched = False
    except urllib.error.HTTPError as e:
        if e.code == 409:
            log(f"✓ Duplicate mobile correctly rejected with HTTP 409 Conflict: {e.read().decode('utf-8', errors='replace')}")
        else:
            log(f"✗ Unexpected status code for duplicate mobile: {e.code}")
            all_matched = False
    except Exception as e:
        log(f"Duplicate check unexpected error: {e}")
        all_matched = False

    return all_matched, created_farmer_id

if __name__ == "__main__":
    success, fid = run_test()
    if success:
        log("\n>>> ALL VERIFICATION TESTS PASSED SUCCESSFULLY! <<<")
        sys.exit(0)
    else:
        log("\n>>> VERIFICATION FAILED! <<<")
        sys.exit(1)
