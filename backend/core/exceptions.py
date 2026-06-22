"""
Core Exceptions — i18n-aware HTTPException.

Pakai `APIException` di tempat HTTPException agar pesan otomatis ter-translate.
Dependency `get_language` mengekstrak primary lang dari header `Accept-Language`.
"""
from __future__ import annotations

from typing import Optional

from fastapi import HTTPException, Request

from core.i18n import DEFAULT_LANG, get_message, parse_accept_language


def get_language(request: Request) -> str:
    """FastAPI dependency: parse Accept-Language → primary code (id/en)."""
    return parse_accept_language(request.headers.get("accept-language"))


class APIException(HTTPException):
    """
    HTTPException dengan auto-translation berdasarkan message_key.

    Usage:
        raise APIException(401, "auth.invalid_credentials", lang=lang)

    `lang` opsional — kalau tidak diisi, pakai DEFAULT_LANG ("id").
    """
    def __init__(
        self,
        status_code: int,
        message_key: str,
        lang: Optional[str] = None,
        headers: Optional[dict] = None,
    ):
        message = get_message(message_key, lang or DEFAULT_LANG)
        super().__init__(status_code=status_code, detail=message, headers=headers)
        self.message_key = message_key
        self.lang = lang or DEFAULT_LANG
