
import sys
import os
from sqlalchemy import create_engine, text

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.config import settings

def migrate():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        print("Checking for tax columns in transactions table...")
        
        # PostgreSQL syntax to add columns if not exists
        try:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tax_rate FLOAT DEFAULT 0"))
            conn.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tax_amount FLOAT DEFAULT 0"))
            conn.commit()
            print("Successfully added tax_rate and tax_amount to transactions table.")
        except Exception as e:
            print(f"Error during migration: {e}")
            conn.rollback()

if __name__ == "__main__":
    migrate()
