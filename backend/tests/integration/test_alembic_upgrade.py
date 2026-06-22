"""Alembic smoke test for a fresh PostgreSQL database."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
from typing import Iterator

import pytest
import sqlalchemy
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine


BACKEND_ROOT = Path(__file__).resolve().parents[2]
ADMIN_DB_URL = os.environ.get(
    "INTEGRATION_DATABASE_URL",
    "postgresql://postgres:root@localhost:5433/postgres",
)
TEST_DB_NAME = os.environ.get(
    "INTEGRATION_ALEMBIC_DATABASE_NAME",
    "insightsphere_test_alembic",
)


def _replace_database(url: str, db_name: str) -> str:
    parsed = sqlalchemy.engine.url.make_url(url)
    # NB: str(URL) masks the password as "***" in SQLAlchemy 1.4+, which would
    # break the alembic subprocess auth. render_as_string keeps the real password.
    return parsed.set(database=db_name).render_as_string(hide_password=False)


def _admin_engine() -> Engine:
    return create_engine(ADMIN_DB_URL, isolation_level="AUTOCOMMIT", pool_pre_ping=True)


@pytest.fixture()
def fresh_alembic_database() -> Iterator[str]:
    try:
        admin = _admin_engine()
        with admin.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
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
    try:
        yield test_url
    finally:
        with admin.connect() as conn:
            conn.execute(
                text(
                    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                    "WHERE datname = :db AND pid <> pg_backend_pid()"
                ),
                {"db": TEST_DB_NAME},
            )
            conn.execute(text(f'DROP DATABASE IF EXISTS "{TEST_DB_NAME}"'))
        admin.dispose()


def test_alembic_upgrade_head_succeeds_on_fresh_postgres(fresh_alembic_database: str) -> None:
    env = os.environ.copy()
    env.update(
        {
            "APP_ENV": "development",
            "DATABASE_URL": fresh_alembic_database,
            "SECRET_KEY": "pytest-secret-key-with-enough-length-for-staging-checks",
            "REDIS_URL": "redis://localhost:6379/0",
            "FRONTEND_URL": "http://localhost:3000",
        }
    )

    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=BACKEND_ROOT,
        env=env,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        stdin=subprocess.DEVNULL,
        timeout=180,
    )

    assert result.returncode == 0, result.stdout + result.stderr

    engine = create_engine(fresh_alembic_database, pool_pre_ping=True)
    try:
        with engine.connect() as conn:
            version = conn.execute(text("SELECT version_num FROM alembic_version")).scalar_one()
            branches_exists = conn.execute(text("SELECT to_regclass('public.branches')")).scalar_one()
            users_exists = conn.execute(text("SELECT to_regclass('public.users')")).scalar_one()
            mirror_exists = conn.execute(text("SELECT to_regclass('public.mirror_sessions')")).scalar_one()
    finally:
        engine.dispose()

    assert version == "e5f6a7b8c9d0"
    assert branches_exists == "branches"
    assert users_exists == "users"
    assert mirror_exists == "mirror_sessions"
