import os, sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL").replace("postgresql://", "postgresql+psycopg2://", 1)
engine = create_engine(DATABASE_URL)

tables = ["users", "roles", "user_roles", "students", "user_tokens"]

with engine.connect() as conn:
    for table in tables:
        try:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS token_expiry TIMESTAMP"))
            print(f"✅ Added token_expiry to {table}")
        except Exception as e:
            print(f"❌ Error on {table}: {e}")
    conn.commit()
