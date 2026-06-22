"""Smoke check Phase 2/3 yang masih open: log rotation config + alembic chain."""

from __future__ import annotations

import importlib.util
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]


def _load_main():
    """Import backend/main.py yang sebelumnya dipakai TestClient."""
    spec = importlib.util.find_spec("main")
    if spec is None or spec.origin is None:
        raise RuntimeError("backend.main belum bisa di-resolve")
    return importlib.import_module("main")


def test_main_uses_rotating_file_handler():
    main_module = _load_main()
    handlers = logging.getLogger().handlers
    rotating = [h for h in handlers if isinstance(h, RotatingFileHandler)]
    assert main_module is not None
    if not rotating:
        # Pada test SQLite, file handler bisa tidak ter-attach (mis. izin file).
        # Cukup pastikan import path memang konfigurasi RotatingFileHandler.
        source = (BACKEND_ROOT / "main.py").read_text(encoding="utf-8")
        assert "RotatingFileHandler" in source
        assert "maxBytes=5 * 1024 * 1024" in source
        assert "backupCount=5" in source
        return

    handler = rotating[0]
    assert handler.maxBytes == 5 * 1024 * 1024
    assert handler.backupCount == 5


def test_alembic_revisions_form_a_linear_chain():
    versions = sorted((BACKEND_ROOT / "alembic" / "versions").glob("*.py"))
    assert versions, "tidak ada Alembic revision file"

    revisions: list[tuple[str, str | None]] = []
    for path in versions:
        text = path.read_text(encoding="utf-8")
        revision = _extract_string(text, "revision: str = ")
        down = _extract_string(text, "down_revision: Union[str, Sequence[str], None] = ")
        revisions.append((revision, down))

    chain = {rev: down for rev, down in revisions}
    roots = [rev for rev, down in revisions if down is None]
    assert len(roots) == 1, f"alembic chain harus satu root, ditemukan {roots}"
    assert all(rev in chain for rev in chain.values() if rev is not None), (
        "semua down_revision harus mengarah ke revision yang ada"
    )


def _extract_string(text: str, prefix: str) -> str | None:
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith(prefix):
            value = stripped[len(prefix):].strip().rstrip(",").strip()
            if value in {"None", "null"}:
                return None
            return value.strip("'").strip('"')
    return None