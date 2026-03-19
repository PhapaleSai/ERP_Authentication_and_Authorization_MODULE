from database import SessionLocal
import models
from auth import verify_password

def test_login():
    db = SessionLocal()
    try:
        # Get a user to test with
        user = db.query(models.User).first()
        if not user:
            print("No users found in database to test with.")
            return

        print(f"Testing with user: {user.username} ({user.email})")
        
        # Test with email (original behavior)
        found_by_email = db.query(models.User).filter(
            (models.User.email == user.email) | (models.User.username == user.email)
        ).first()
        print(f"Login by email: {'SUCCESS' if found_by_email and found_by_email.user_id == user.user_id else 'FAILED'}")
        
        # Test with username (new behavior)
        found_by_username = db.query(models.User).filter(
            (models.User.email == user.username) | (models.User.username == user.username)
        ).first()
        print(f"Login by username: {'SUCCESS' if found_by_username and found_by_username.user_id == user.user_id else 'FAILED'}")

    finally:
        db.close()

if __name__ == "__main__":
    test_login()
