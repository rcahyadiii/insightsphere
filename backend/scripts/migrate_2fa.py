"""
Migration script untuk menambah kolom 2FA ke tabel users.
Run: cd backend && ..\.venv\Scripts\python.exe migrate_2fa.py
"""
import sys
sys.path.insert(0, '.')

from sqlalchemy import create_engine, text
from core.config import settings

def migrate():
    print("Connecting to database...")
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Check if columns already exist
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='two_factor_enabled'
        """))
        
        if result.fetchone():
            print("Column 'two_factor_enabled' already exists. Skipping migration.")
            return
        
        print("Adding 2FA columns to users table...")
        
        # Add two_factor_enabled column
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE
        """))
        
        # Add two_factor_secret column
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN two_factor_secret VARCHAR(255)
        """))
        
        # Add backup_codes column
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN backup_codes TEXT
        """))
        
        conn.commit()
        print("✓ Migration completed successfully!")
        print("  - Added: two_factor_enabled")
        print("  - Added: two_factor_secret")
        print("  - Added: backup_codes")

if __name__ == "__main__":
    migrate()
