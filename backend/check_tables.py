import os
from pathlib import Path

import psycopg2
from dotenv import load_dotenv


env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in backend/.env")
    raise SystemExit(1)

if "render.com" in DATABASE_URL and "sslmode" not in DATABASE_URL:
    separator = "&" if "?" in DATABASE_URL else "?"
    DATABASE_URL += f"{separator}sslmode=require"

tables = [
    "farmers",
    "farmer_addresses",
    "farmer_farming_details",
    "farmer_accounts"
]

try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    print("\nConnected to Render PostgreSQL successfully!\n")

    for table in tables:
        cur.execute(
            """
            SELECT
                column_name,
                data_type,
                is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = %s
            ORDER BY ordinal_position;
            """,
            (table,)
        )

        rows = cur.fetchall()

        print(f"========== {table} ==========")

        if not rows:
            print("Table not found.")
        else:
            for column_name, data_type, is_nullable in rows:
                print(
                    f"{column_name:25} "
                    f"{data_type:25} "
                    f"Nullable: {is_nullable}"
                )

        print()

    cur.close()
    conn.close()

    print("Render schema check completed successfully.")

except Exception as error:
    print("\nRender database error:")
    print(error)