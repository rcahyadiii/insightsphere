from pathlib import Path

import pytest


# Path resolusi anchor: file ini di `backend/tests/test_p3_dev_scripts.py`,
# jadi parents[1] = `backend/`. Pakai resolve() supaya portable kalau pytest
# dipanggil dari repo root atau dari subfolder.
BACKEND_ROOT = Path(__file__).resolve().parents[1]
DEV_SCRIPT_ROOT = BACKEND_ROOT / "scripts" / "dev"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_scratch_scripts_are_separated_from_backend_root():
    root_scratch_scripts = sorted(path.name for path in BACKEND_ROOT.glob("scratch_*.py"))

    assert root_scratch_scripts == []


def test_dev_scripts_are_env_driven_and_development_guarded():
    expected_scripts = [
        DEV_SCRIPT_ROOT / "test_transactions_api.py",
        DEV_SCRIPT_ROOT / "stress_transactions_summary.py",
        DEV_SCRIPT_ROOT / "recreate_prediction_log_table.py",
        DEV_SCRIPT_ROOT / "seed_mock_product.py",
    ]

    for script_path in expected_scripts:
        source = _read(script_path)
        assert "require_development_env" in source
        assert "127.0.0.1" not in source
        assert "localhost" not in source
        assert "requests.get(\"http" not in source
        assert "requests.post(\"http" not in source

    api_scripts = expected_scripts[:2]
    for script_path in api_scripts:
        source = _read(script_path)
        assert "get_api_base_url" in source
        assert "API_BASE_URL" in source


def test_dev_script_guard_rejects_non_development_env(monkeypatch: pytest.MonkeyPatch):
    from scripts.dev.dev_script_guard import get_api_base_url, require_development_env

    monkeypatch.setenv("APP_ENV", "production")
    with pytest.raises(RuntimeError, match="development"):
        require_development_env("test-script")

    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.delenv("API_BASE_URL", raising=False)
    with pytest.raises(RuntimeError, match="API_BASE_URL"):
        get_api_base_url()

    monkeypatch.setenv("API_BASE_URL", "https://api.example.test/")
    assert get_api_base_url() == "https://api.example.test"


def test_alembic_ini_does_not_embed_placeholder_database_url():
    alembic_ini = _read(BACKEND_ROOT / "alembic.ini")
    alembic_env = _read(BACKEND_ROOT / "alembic" / "env.py")

    assert "driver://user:pass@localhost/dbname" not in alembic_ini
    assert "localhost" not in alembic_ini
    assert 'configuration["sqlalchemy.url"] = settings.DATABASE_URL' in alembic_env
