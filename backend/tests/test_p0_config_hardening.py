from pathlib import Path

import pytest
from pydantic import ValidationError

from core.config import Settings


BACKEND_ROOT = Path(__file__).resolve().parent.parent


def _clear_runtime_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for key in (
        "APP_ENV",
        "ENVIRONMENT",
        "NODE_ENV",
        "DATABASE_URL",
        "SECRET_KEY",
        "REDIS_URL",
        "FRONTEND_URL",
    ):
        monkeypatch.delenv(key, raising=False)


def test_development_config_uses_explicit_dev_defaults(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear_runtime_env(monkeypatch)

    settings = Settings(_env_file=None)

    assert settings.APP_ENV == "development"
    assert settings.DATABASE_URL
    assert settings.SECRET_KEY
    assert settings.REDIS_URL
    assert settings.FRONTEND_URL


def test_production_config_requires_runtime_values(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear_runtime_env(monkeypatch)

    with pytest.raises(ValidationError) as exc_info:
        Settings(APP_ENV="production", _env_file=None)

    message = str(exc_info.value)
    assert "DATABASE_URL" in message
    assert "SECRET_KEY" in message
    assert "REDIS_URL" in message
    assert "FRONTEND_URL" in message


def test_production_config_rejects_development_defaults(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear_runtime_env(monkeypatch)

    with pytest.raises(ValidationError) as exc_info:
        Settings(
            APP_ENV="production",
            DATABASE_URL="postgresql://postgres:root@localhost:5433/pos_cerdas_db",
            SECRET_KEY="supersecretkey123",
            REDIS_URL="redis://localhost:6379/0",
            FRONTEND_URL="http://localhost:3000",
            _env_file=None,
        )

    assert "development default" in str(exc_info.value)


def test_inventory_migration_does_not_embed_database_url() -> None:
    source = (BACKEND_ROOT / "scripts" / "migrate_inventory_version.py").read_text(encoding="utf-8")

    assert "postgresql://postgres:postgres@localhost/insightsphere" not in source
    assert "os.getenv(\"DATABASE_URL\"" in source


def test_email_service_does_not_use_placeholder_sender() -> None:
    source = (BACKEND_ROOT / "core" / "email.py").read_text(encoding="utf-8")

    assert "noreply@example.com" not in source

def test_production_config_rejects_short_secret_key(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear_runtime_env(monkeypatch)

    with pytest.raises(ValidationError) as exc_info:
        Settings(
            APP_ENV="production",
            DATABASE_URL="postgresql://prod-db.internal:5432/pos",
            SECRET_KEY="short_key",
            REDIS_URL="redis://prod-redis:6379/0",
            FRONTEND_URL="https://app.example.com",
            _env_file=None,
        )

    message = str(exc_info.value)
    assert "SECRET_KEY too short" in message


def test_staging_config_requires_runtime_values(monkeypatch: pytest.MonkeyPatch) -> None:
    _clear_runtime_env(monkeypatch)

    with pytest.raises(ValidationError) as exc_info:
        Settings(APP_ENV="staging", _env_file=None)

    message = str(exc_info.value)
    assert "DATABASE_URL" in message
    assert "SECRET_KEY" in message
    assert "REDIS_URL" in message
    assert "FRONTEND_URL" in message
