import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Error: DATABASE_URL not found in .env")
    exit(1)

# Fix for common postgres+psycopg2 issue
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = create_engine(DATABASE_URL)

migration_queries = [
    # 1. Create user_tokens table
    """
    CREATE TABLE IF NOT EXISTS user_tokens (
        token_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id),
        token TEXT UNIQUE NOT NULL,
        expiry_date TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(150),
        updated_by VARCHAR(150),
        created_from VARCHAR(100)
    )
    """,
    # 2. Add audit fields to users table
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by VARCHAR(150)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_by VARCHAR(150)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_from VARCHAR(100)",
    # 3. Add audit fields to roles table
    "ALTER TABLE roles ADD COLUMN IF NOT EXISTS created_by VARCHAR(150)",
    "ALTER TABLE roles ADD COLUMN IF NOT EXISTS updated_by VARCHAR(150)",
    "ALTER TABLE roles ADD COLUMN IF NOT EXISTS created_from VARCHAR(100)",
    # 4. Add audit fields to user_roles table
    "ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS created_by VARCHAR(150)",
    "ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS updated_by VARCHAR(150)",
    "ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS created_from VARCHAR(100)",
    # 5. Add audit fields to students table
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS created_by VARCHAR(150)",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_by VARCHAR(150)",
    "ALTER TABLE students ADD COLUMN IF NOT EXISTS created_from VARCHAR(100)",
    # 6. Ensure roles exist
    "INSERT INTO roles (role_name, description, created_by, created_from) VALUES ('guest', 'Default role with minimum permissions', 'system', 'migration') ON CONFLICT (role_name) DO NOTHING",
    "INSERT INTO roles (role_name, description, created_by, created_from) VALUES ('admin', 'Administrator with full access', 'system', 'migration') ON CONFLICT (role_name) DO NOTHING"
]

with engine.connect() as conn:
    for query in migration_queries:
        try:
            print(f"Executing: {query[:50]}...")
            conn.execute(text(query))
            conn.commit()
            print("Success")
        except Exception as e:
            print(f"Error executing query: {e}")

print("Migration completed successfully!")
