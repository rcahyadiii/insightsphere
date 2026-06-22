from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from core.config import settings

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # Health-check sebelum pakai connection dari pool. Hindari error
    # "server closed the connection unexpectedly" saat Postgres restart
    # atau idle terlalu lama. Trade-off: 1 SELECT 1 ekstra per checkout.
    pool_pre_ping=True,
    # Auto-rotate connection setiap 30 menit untuk menghindari kasus
    # firewall/router memutus TCP secara silent.
    pool_recycle=1800,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
