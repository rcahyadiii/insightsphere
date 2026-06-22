
import sys
import os
from sqlalchemy import create_engine

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import engine, Base
# Import all models to ensure they are registered with Base.metadata
from domains.dataset import models as _dataset
from domains.observability import models as _observability
from domains.identity import models as _identity
from domains.sales import models as _sales
from domains.finance import models as _finance
from domains.intelligence import models as _intelligence
from domains.inventory import models as _inventory
from domains.notification import models as _notification
from domains.reporting import models as _reporting

def init_db():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")

if __name__ == "__main__":
    init_db()
