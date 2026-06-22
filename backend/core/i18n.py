"""
Core i18n Service — multilingual error messages.

Strategi:
- TRANSLATIONS dict adalah single source of truth (id, en).
- `get_message(key, lang)` → return string terjemahan, fallback ke key kalau tidak ada.
- `parse_accept_language(header)` → extract primary language code.
- Default language: Indonesia (`id`).

Cara pakai (lihat juga `core/exceptions.py`):
    from core.i18n import get_message
    raise APIException(401, "auth.invalid_credentials", lang="en")
"""
from __future__ import annotations

from typing import Dict

DEFAULT_LANG = "id"
SUPPORTED_LANGS = ("id", "en")


TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "id": {
        # ---- auth ----
        "auth.invalid_credentials": "Username atau PIN salah",
        "auth.token_expired": "Token telah kedaluwarsa",
        "auth.unauthorized": "Anda tidak memiliki akses",
        "auth.forbidden": "Operasi tidak diizinkan untuk role Anda",
        "auth.user_not_found": "Pengguna tidak ditemukan",
        "auth.username_taken": "Username sudah digunakan",
        "auth.email_registered": "Email sudah terdaftar",
        "auth.pin_incorrect": "PIN saat ini salah",
        "auth.pin_must_differ": "PIN baru harus berbeda dari PIN saat ini",
        # ---- 2FA ----
        "auth.2fa_required": "Kode 2FA diperlukan",
        "auth.2fa_invalid": "Kode 2FA tidak valid",
        "auth.2fa_already_enabled": "2FA sudah aktif",
        "auth.2fa_not_enabled": "2FA belum diaktifkan",
        "auth.2fa_clock_skew": "Kode 2FA tidak valid — pastikan jam perangkat Anda akurat",
        # ---- invitation ----
        "invite.invalid_token": "Token undangan tidak valid",
        "invite.already_accepted": "Undangan sudah pernah diterima",
        "invite.expired": "Undangan telah kedaluwarsa",
        "invite.cannot_revoke_accepted": "Tidak bisa mencabut undangan yang sudah diterima",
        # ---- password reset ----
        "reset.invalid_token": "Token reset tidak valid",
        "reset.already_used": "Token reset sudah pernah digunakan",
        "reset.expired": "Token reset telah kedaluwarsa",
        # ---- generic ----
        "generic.not_found": "Sumber data tidak ditemukan",
        "generic.bad_request": "Permintaan tidak valid",
        "generic.server_error": "Terjadi kesalahan pada server",
    },
    "en": {
        # ---- auth ----
        "auth.invalid_credentials": "Invalid username or PIN",
        "auth.token_expired": "Token has expired",
        "auth.unauthorized": "Unauthorized access",
        "auth.forbidden": "Operation not permitted for your role",
        "auth.user_not_found": "User not found",
        "auth.username_taken": "Username already taken",
        "auth.email_registered": "Email already registered",
        "auth.pin_incorrect": "Current PIN is incorrect",
        "auth.pin_must_differ": "New PIN must differ from current PIN",
        # ---- 2FA ----
        "auth.2fa_required": "2FA code required",
        "auth.2fa_invalid": "Invalid 2FA code",
        "auth.2fa_already_enabled": "2FA already enabled",
        "auth.2fa_not_enabled": "2FA is not enabled",
        "auth.2fa_clock_skew": "Invalid 2FA code — make sure your device clock is accurate",
        # ---- invitation ----
        "invite.invalid_token": "Invalid invitation token",
        "invite.already_accepted": "Invitation already accepted",
        "invite.expired": "Invitation has expired",
        "invite.cannot_revoke_accepted": "Cannot revoke an accepted invite",
        # ---- password reset ----
        "reset.invalid_token": "Invalid reset token",
        "reset.already_used": "Reset token already used",
        "reset.expired": "Reset token has expired",
        # ---- generic ----
        "generic.not_found": "Resource not found",
        "generic.bad_request": "Bad request",
        "generic.server_error": "Internal server error",
    },
}


def parse_accept_language(header_value: str | None) -> str:
    """
    Parse `Accept-Language` header sederhana.
    Contoh: "id-ID,id;q=0.9,en;q=0.8" → "id"
    Fallback ke DEFAULT_LANG kalau tidak ada/tidak supported.
    """
    if not header_value:
        return DEFAULT_LANG
    # Ambil primary tag dari first segment
    primary = header_value.split(",")[0].split(";")[0].strip().lower()
    primary = primary.split("-")[0]  # "id-ID" → "id"
    return primary if primary in SUPPORTED_LANGS else DEFAULT_LANG


def get_message(key: str, lang: str = DEFAULT_LANG) -> str:
    """Lookup pesan terjemahan. Fallback: lang default → key itu sendiri."""
    lang = lang if lang in SUPPORTED_LANGS else DEFAULT_LANG
    return (
        TRANSLATIONS.get(lang, {}).get(key)
        or TRANSLATIONS.get(DEFAULT_LANG, {}).get(key)
        or key
    )
