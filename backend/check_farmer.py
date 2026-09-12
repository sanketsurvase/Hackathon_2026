
from sqlalchemy import text
from backend.database import SessionLocal

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