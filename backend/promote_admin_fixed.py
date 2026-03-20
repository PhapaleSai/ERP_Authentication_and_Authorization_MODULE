import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # 1. Get user_id
    user_res = conn.execute(text("SELECT user_id FROM users WHERE email = 'admin@example.com' OR username = 'admin'"))
    user = user_res.fetchone()
    
    # 2. Get role_id for 'admin'
    role_res = conn.execute(text("SELECT role_id FROM roles WHERE role_name = 'admin'"))
    role = role_res.fetchone()
    
    if user and role:
        u_id = user[0]
        r_id = role[0]
        # 3. Insert into user_roles if not already there
        conn.execute(text(f"INSERT INTO user_roles (user_id, role_id) VALUES ({u_id}, {r_id}) ON CONFLICT DO NOTHING"))
        # Also clean up any other roles if needed, or just ensure this one is there.
        # Given my property logic: roles[0] if roles else "guest", having at least one role is enough.
        conn.commit()
        print(f"User {u_id} promoted to Role {r_id} (admin)!")
    else:
        print(f"Could not find user or role. User: {user}, Role: {role}")
