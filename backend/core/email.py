"""
Core Email Service — pluggable backend (SMTP / Console).

Strategy:
- Bila `SMTP_HOST` di-set → kirim via smtplib (production / staging).
- Bila tidak → tulis ke logger (dev mode, mempermudah testing tanpa SMTP).
- Pemanggilan disarankan via `BackgroundTasks` agar tidak blocking response.

Catatan untuk migrasi ke Celery (Phase 4 / future):
- Cukup ganti `BackgroundTasks` di router dengan `email_task.delay(...)`.
- `EmailService.send()` sudah pure function — gampang dipindahkan ke Celery task.
"""
from __future__ import annotations

import logging
import smtplib
import ssl
from email.message import EmailMessage
from typing import Optional

from core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Singleton-style service. Stateless, aman dipanggil concurrent."""

    @staticmethod
    def is_smtp_configured() -> bool:
        return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)

    @staticmethod
    def _resolve_from() -> str:
        from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
        if not from_email:
            raise RuntimeError(
                "SMTP_FROM_EMAIL or SMTP_USER must be configured before sending email"
            )
        from_name = settings.SMTP_FROM_NAME or settings.APP_NAME
        return f"{from_name} <{from_email}>"

    @classmethod
    def send(
        cls,
        to_email: str,
        subject: str,
        body_text: str,
        body_html: Optional[str] = None,
    ) -> bool:
        """
        Kirim 1 email. Return True kalau sukses (atau ter-log di console mode).

        Args:
            to_email: Alamat tujuan.
            subject: Subject baris email.
            body_text: Plain-text body (selalu wajib utk fallback).
            body_html: Optional HTML body (akan jadi alternative content).
        """
        if not cls.is_smtp_configured():
            cls._console_log(to_email, subject, body_text, body_html)
            return True

        msg = EmailMessage()
        msg["From"] = cls._resolve_from()
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.set_content(body_text)
        if body_html:
            msg.add_alternative(body_html, subtype="html")

        try:
            if settings.SMTP_USE_TLS:
                context = ssl.create_default_context()
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as s:
                    s.ehlo()
                    s.starttls(context=context)
                    s.ehlo()
                    s.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    s.send_message(msg)
            else:
                with smtplib.SMTP_SSL(
                    settings.SMTP_HOST, settings.SMTP_PORT,
                    context=ssl.create_default_context(), timeout=15,
                ) as s:
                    s.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    s.send_message(msg)
            logger.info("Email sent to=%s subject=%r", to_email, subject)
            return True
        except Exception as exc:
            logger.error("Email send FAILED to=%s subject=%r err=%s", to_email, subject, exc)
            return False

    @staticmethod
    def _console_log(to_email: str, subject: str, body_text: str, body_html: Optional[str]):
        logger.warning(
            "[EMAIL CONSOLE MODE] SMTP not configured. Email NOT sent — logged below.\n"
            "  TO     : %s\n"
            "  SUBJECT: %s\n"
            "  BODY   :\n%s",
            to_email, subject, body_text,
        )
