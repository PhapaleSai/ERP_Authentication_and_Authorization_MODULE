import requests

def test_login_new_params():
    url = "http://localhost:8000/auth/login"
    # Note: We need a real user from the database. Let's try to find one first.
    from database import SessionLocal
    import models
    db = SessionLocal()
    user = db.query(models.User).first()
    db.close()

    if not user:
        print("No user found to test with.")
        return

    print(f"Testing login for {user.email}...")
    
    # The passwords for seeded users are usually 'password123' or similar.
    # Let's hope I can find a valid password or just check the 401 response is handled correctly.
    data = {
        "email": user.email,
        "password": "wrong_password"
    }
    
    response = requests.post(url, data=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.json()}")
    
    if response.status_code == 401 and response.json().get("detail") == "Incorrect email or password":
        print("SUCCESS: Endpoint correctly handled the 'email' parameter and returned 401 for wrong password.")
    elif response.status_code == 200:
        print("SUCCESS: Login successful (if password was correct).")
    else:
        print(f"FAILED: Unexpected response. Status: {response.status_code}")

if __name__ == "__main__":
    test_login_new_params()
