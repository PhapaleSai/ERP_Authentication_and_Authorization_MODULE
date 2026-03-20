"""
Promote an existing user to 'admin' role by looking up any user in the database.
Usage: python promote_admin.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
import models

db = SessionLocal()

try:
    # List all users
    users = db.query(models.User).all()
    print("All users:")
    for u in users:
        r = u.role
        print(f"  id={u.user_id}  username={u.username}  email={u.email}  role={r}")
    
    if not users:
        print("\nNo users found in the database!")
        sys.exit(1)
    
    # Find or create admin role
    admin_role = db.query(models.Role).filter(models.Role.role_name == "admin").first()
    if not admin_role:
        admin_role = models.Role(role_name="admin", description="Full system administrator", created_by="system")
        db.add(admin_role)
        db.commit()
        db.refresh(admin_role)
        print(f"\nCreated admin role (id={admin_role.role_id})")

    # Also ensure other roles exist
    for rn, desc in [("vice_principal","High-level admin"),("hod","Department head"),("guest","Minimal access"),("faculty","Faculty member"),("student","Student access")]:
        if not db.query(models.Role).filter(models.Role.role_name==rn).first():
            db.add(models.Role(role_name=rn, description=desc, created_by="system"))
    db.commit()

    # Promote all found users to admin (for demo purposes)
    # In this case we pick the first user or one that looks like an admin
    target = None
    for u in users:
        if 'admin' in u.username.lower() or 'admin' in u.email.lower():
            target = u
            break
    # Fallback: promote the first user
    if not target:
        target = users[0]

    # Remove all existing roles
    db.query(models.UserRole).filter(models.UserRole.user_id == target.user_id).delete()
    # Assign admin
    db.add(models.UserRole(user_id=target.user_id, role_id=admin_role.role_id))
    db.commit()

    print(f"\n✅ Promoted '{target.username}' (email: {target.email}) to ADMIN role!")
    print(f"   Login with: username='{target.username}' or email='{target.email}'")

finally:
    db.close()
