import os
import sys

# Menambahkan path backend agar bisa import modul internal
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import engine, Base
# Import semua model agar terdaftar di Base.metadata
from domains.identity.models import User
from domains.dataset.models import Store, HolidayEvent, OilPrice, SalesTransaction

def init_db():
    print("Membuat ulang tabel database...")
    Base.metadata.create_all(bind=engine)
    print("Skema database berhasil dibuat!")

if __name__ == "__main__":
    init_db()
