import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import SessionLocal
from domains.identity import models, service
from domains.identity.constants import ROLE_ADMIN

def create_initial_admin():
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin_username = "faiz"
        admin_pass = "1234"
        
        existing = service.get_user_by_username(db, admin_username)
        if existing:
            print(f"User '{admin_username}' already exists. Updating to admin role...")
            setattr(existing, "role", ROLE_ADMIN)
            setattr(existing, "pin_hash", service.get_pin_hash(admin_pass))
            db.commit()
            print("[SUCCESS] User updated to Admin")
        else:
            print(f"Creating new Admin user: {admin_username}...")
            new_admin = models.User(
                username=admin_username,
                pin_hash=service.get_pin_hash(admin_pass),
                role=ROLE_ADMIN,
                full_name="System Administrator",
                email="admin@insightsphere.com",
                is_active=True
            )
            db.add(new_admin)
            db.commit()
            print("[SUCCESS] Admin user created successfully")
            
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_initial_admin()
