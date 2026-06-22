from pathlib import Path

from core.email import EmailService


def test_email_sender_is_resolved_from_settings(monkeypatch):
    monkeypatch.setattr("core.email.settings.SMTP_FROM_EMAIL", "ops@example.test")
    monkeypatch.setattr("core.email.settings.SMTP_FROM_NAME", "Insight Ops")
    monkeypatch.setattr("core.email.settings.SMTP_USER", "smtp-user@example.test")
    monkeypatch.setattr("core.email.settings.APP_NAME", "InsightSphere")

    assert EmailService._resolve_from() == "Insight Ops <ops@example.test>"


def test_email_service_does_not_embed_placeholder_sender_or_provider_url():
    # Resolve relatif ke file ini supaya portable lintas cwd (repo root vs `backend/`).
    backend_root = Path(__file__).resolve().parents[1]
    source = (backend_root / "core" / "email.py").read_text(encoding="utf-8")

    assert "noreply@example.com" not in source
    assert "https://" not in source
    assert "http://" not in source
