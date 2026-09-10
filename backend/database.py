import os

from dotenv import load_dotenv  # type: ignore
from sqlalchemy import create_engine  # type: ignore
from sqlalchemy.orm import sessionmaker  # type: ignore

from pathlib import Path

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)
load_dotenv()  # also check current working dir

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "kisansetu_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "farmer")

DATABASE_URL = (
    f"postgresql://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

try:
    with engine.connect() as connection:
        print("PostgreSQL connected successfully!")
except Exception as e:
    print("Database connection failed!")
    print(e)