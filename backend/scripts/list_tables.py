
import sys
import os
from sqlalchemy import create_engine, inspect

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.config import settings

def list_tables():
    engine = create_engine(settings.DATABASE_URL)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Existing tables in {settings.DATABASE_URL}:")
    for table in tables:
        print(f" - {table}")

if __name__ == "__main__":
    list_tables()
