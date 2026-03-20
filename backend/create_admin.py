"""
Create an 'admin' user with username='admin', email='admin@admin.com', password='admin'
and assign the 'admin' role.
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
import models
from auth import get_password_hash

db = SessionLocal()

try:
    # Ensure admin role exists
    admin_role = db.query(models.Role).filter(models.Role.role_name == "admin").first()
    if not admin_role:
        admin_role = models.Role(role_name="admin", description="Full system administrator", created_by="system")
        db.add(admin_role)
        db.commit()
        db.refresh(admin_role)

    # Ensure other roles exist too
    for rn, desc in [("vice_principal","High-level admin"),("hod","Department head"),("guest","Minimal access"),("faculty","Faculty member"),("student","Student access")]:
        if not db.query(models.Role).filter(models.Role.role_name == rn).first():
            db.add(models.Role(role_name=rn, description=desc, created_by="system"))
    db.commit()

    # Check if 'admin' user already exists
    existing = db.query(models.User).filter(
        (models.User.username == "admin") | (models.User.email == "admin@admin.com")
    ).first()

    if existing:
        # Update password and ensure admin role
        existing.password_hash = get_password_hash("admin")
        db.query(models.UserRole).filter(models.UserRole.user_id == existing.user_id).delete()
        db.add(models.UserRole(user_id=existing.user_id, role_id=admin_role.role_id))
        db.commit()
        print(f"✅ Updated existing user '{existing.username}' — password reset to 'admin', role set to admin.")
    else:
        # Create new admin user
        admin_user = models.User(
            username="admin",
            email="admin@admin.com",
            password_hash=get_password_hash("admin"),
            created_by="system",
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        db.add(models.UserRole(user_id=admin_user.user_id, role_id=admin_role.role_id))
        db.commit()
        print(f"✅ Created admin user (id={admin_user.user_id})")

    print("\n🔑 Login credentials:")
    print("   Username: admin")
    print("   Password: admin")

finally:
    db.close()
