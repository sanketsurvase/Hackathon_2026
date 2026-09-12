
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
for p in [str(PROJECT_ROOT), str(BASE_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from sqlalchemy import text

try:
    from backend.database import SessionLocal
except ImportError:
    from database import SessionLocal

farmer_id = 7

db = SessionLocal()

try:
    tables = [
        "farmers",
        "farmer_addresses",
        "farmer_farming_details",
        "farmer_accounts"
    ]

    for table in tables:
        result = db.execute(
            text(f"SELECT * FROM {table} WHERE farmer_id = :farmer_id"),
            {
                "farmer_id": farmer_id
            }
        ).fetchall()

        print(f"\n========== {table} ==========")

        if not result:
            print("No record found.")
        else:
            for row in result:
                print(row)

finally:
    db.close()