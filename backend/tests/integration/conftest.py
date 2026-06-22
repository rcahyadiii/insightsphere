"""Pytest fixtures untuk integration test berbasis Postgres real (tanpa Docker).

Strategi:
- Konek ke Postgres existing di `INTEGRATION_DATABASE_URL` (default
  `postgresql://postgres:root@localhost:5433/postgres`).
- Buat database test ephemeral `insightsphere_test_pytest` per session,
  buat schema via `Base.metadata.create_all` (semua model di-import dari
  alembic/env.py supaya konsisten), yield engine + session.
- Drop database setelah session selesai.

Catatan: kita tidak menjalankan `alembic upgrade head` di sini karena
revisi awal `a155786af199` non-bootstrap (mengasumsikan schema lama sudah
ada). Item perbaikan migrasi itu di-track terpisah di Project Health
Tracker. Untuk kebutuhan integration test, schema dari model-side cukup
karena Postgres-isms (JSONB, partial unique index) ikut di-emit oleh
SQLAlchemy.

Skip otomatis kalau Postgres tidak reachable supaya CI ringan/dev tanpa
Postgres tidak meledak.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Iterator

import pytest
import sqlalchemy
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

ADMIN_DB_URL = os.environ.get(
    "INTEGRATION_DATABASE_URL",
    "postgresql://postgres:root@localhost:5433/postgres",
)
TEST_DB_NAME = os.environ.get("INTEGRATION_DATABASE_NAME", "insightsphere_test_pytest")


def _replace_database(url: str, db_name: str) -> str:
    parsed = sqlalchemy.engine.url.make_url(url)
    # NB: str(URL) masks the password as "***" in SQLAlchemy 1.4+, which would
    # break engine/subprocess auth. render_as_string keeps the real password.
    return parsed.set(database=db_name).render_as_string(hide_password=False)


def _admin_engine() -> Engine:
    return create_engine(ADMIN_DB_URL, isolation_level="AUTOCOMMIT", pool_pre_ping=True)


@pytest.fixture(scope="session")
def integration_engine() -> Iterator[Engine]:
    try:
        admin = _admin_engine()
        with admin.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:  # pragma: no cover - environment guard
        pytest.skip(f"Postgres tidak reachable di {ADMIN_DB_URL}: {exc}")

    with admin.connect() as conn:
        conn.execute(
            text(
                "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                "WHERE datname = :db AND pid <> pg_backend_pid()"
            ),
            {"db": TEST_DB_NAME},
        )
        conn.execute(text(f'DROP DATABASE IF EXISTS "{TEST_DB_NAME}"'))
        conn.execute(text(f'CREATE DATABASE "{TEST_DB_NAME}"'))

    test_url = _replace_database(ADMIN_DB_URL, TEST_DB_NAME)
    os.environ["DATABASE_URL"] = test_url

    # Import semua domain models supaya Base.metadata terisi.
    from core.database import Base  # noqa: F401
    import domains.dataset.models  # noqa: F401
    import domains.observability.models  # noqa: F401
    import domains.identity.models  # noqa: F401
    import domains.sales.models  # noqa: F401
    import domains.finance.models  # noqa: F401
    import domains.intelligence.models  # noqa: F401
    import domains.inventory.models  # noqa: F401
    import domains.notification.models  # noqa: F401
    import domains.reporting.models  # noqa: F401

    engine = create_engine(test_url, future=True, pool_pre_ping=True)
    Base.metadata.create_all(engine)

    try:
        yield engine
    finally:
        engine.dispose()
        with admin.connect() as conn:
            conn.execute(
                text(
                    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                    "WHERE datname = :db AND pid <> pg_backend_pid()"
                ),
                {"db": TEST_DB_NAME},
            )
            conn.execute(text(f'DROP DATABASE IF EXISTS "{TEST_DB_NAME}"'))


@pytest.fixture(scope="function")
def pg_session(integration_engine: Engine) -> Iterator[Session]:
    SessionLocal = sessionmaker(bind=integration_engine, autoflush=False, autocommit=False)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()