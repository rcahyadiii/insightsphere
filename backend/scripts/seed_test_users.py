"""
Seed akun test untuk tiap role (selain admin yang ditangani create_admin.py).

Idempotent: melewati user yang sudah ada, jadi aman dipanggil tiap boot lewat
start.sh (Render free tier sering restart setelah sleep).

PIN semua akun = 1234. KHUSUS staging/demo — ganti untuk produksi nyata.
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import SessionLocal
from domains.identity import models, service
from domains.identity.constants import (
    ROLE_OWNER,
    ROLE_CASHIER,
    ROLE_INVENTORY_MANAGER,
)

# (username, pin, role, full_name, email, store_nbr)
# store_nbr di-isi untuk role store-scoped (kasir, inventory_manager).
TEST_USERS = [
    ("owner", "1234", ROLE_OWNER, "Test Owner", "owner@insightsphere.com", None),
    ("kasir", "1234", ROLE_CASHIER, "Test Kasir", "kasir@insightsphere.com", 1),
    ("inventaris", "1234", ROLE_INVENTORY_MANAGER, "Test Inventory", "inventaris@insightsphere.com", 1),
]


def seed_test_users():
    db = SessionLocal()
    try:
        for username, pin, role, full_name, email, store_nbr in TEST_USERS:
            if service.get_user_by_username(db, username):
                print(f"User '{username}' ({role}) sudah ada — dilewati.")
                continue
            db.add(
                models.User(
                    username=username,
                    pin_hash=service.get_pin_hash(pin),
                    role=role,
                    full_name=full_name,
                    email=email,
                    store_nbr=store_nbr,
                    is_active=True,
                )
            )
            db.commit()
            print(f"[SUCCESS] User '{username}' ({role}) dibuat.")
    except Exception as e:
        print(f"[ERROR] {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_test_users()
