import os, sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL").replace("postgresql://", "postgresql+psycopg2://", 1)
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    try:
        # PostgreSQL specific check for column existence
        check_sql = text("SELECT 1 FROM information_schema.columns WHERE table_name='roles' AND column_name='permissions'")
        exists = conn.execute(check_sql).fetchone()
        
        if not exists:
            conn.execute(text("ALTER TABLE roles ADD COLUMN permissions JSONB DEFAULT '[]'::jsonb"))
            print("✅ Added permissions column to roles table")
        else:
            print("ℹ️ Permissions column already exists")
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        # Try a more direct approach if the schema check fails
        try:
            conn.execute(text("ALTER TABLE roles ADD COLUMN permissions JSONB DEFAULT '[]'::jsonb"))
            print("✅ Added permissions column (direct approach)")
        except:
            pass
    conn.commit()
