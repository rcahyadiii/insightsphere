import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from core.database import Base, get_db
from main import app

# --- SQLITE COMPATIBILITY OVERRIDE UNTUK POSTGRES JSONB ---
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB

@compiles(JSONB, 'sqlite')
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"
# ----------------------------------------------------------

# In-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def database():
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(database):
    connection = database.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

from core.security import get_current_user_payload

@pytest.fixture(scope="function")
def admin_client(client, db_session):
    """Client who is mocked as an admin"""
    
    # We must seed a user into the mock database so `get_current_user` finds them
    from domains.identity.models import User
    admin_user = User(
        username="admin_test",
        email="admin@test.com",
        full_name="Admin Test",
        role="admin",
        pin_hash="hashed_pass"
    )
    db_session.add(admin_user)
    db_session.commit()
    
    def override_get_current_user_payload():
        return {
            "sub": "admin_test",
            "username": "admin_test",
            "role": "admin",
            "store_nbr": None
        }

    app.dependency_overrides[get_current_user_payload] = override_get_current_user_payload
    yield client
    app.dependency_overrides.pop(get_current_user_payload, None)

@pytest.fixture(scope="function")
def regular_client(client, db_session):
    """Client who is mocked as a regular user for store 1"""
    # We must seed a user into the db
    from domains.identity.models import User
    regular_user = User(
        username="user1",
        email="user1@test.com",
        full_name="User Test",
        role="cashier",
        store_nbr=1,
        pin_hash="hashed_pass"
    )
    db_session.add(regular_user)
    db_session.commit()

    def override_get_current_user_payload():
        return {
            "sub": "user1",
            "username": "user1",
            "role": "user",
            "store_nbr": 1
        }

    app.dependency_overrides[get_current_user_payload] = override_get_current_user_payload
    yield client
    app.dependency_overrides.pop(get_current_user_payload, None)
