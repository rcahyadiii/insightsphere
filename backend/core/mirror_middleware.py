"""Read-only enforcement saat Admin sedang Mode Cermin.

Default: ketika admin punya `mirror_sessions` aktif, semua HTTP write
(POST/PUT/PATCH/DELETE) diblokir dengan 403 supaya Admin tidak melakukan
mutasi atas nama role lain. Hanya endpoint berikut yang tetap diizinkan
agar admin bisa mengakhiri sesi atau mempertahankan auth lifecycle:

  - `/auth/mirror`  (start/stop sesi cermin)
  - `/auth/logout`  (logout cookie)
  - `/auth/refresh` (rotate token)

Untuk mengizinkan write tertentu (opt-in), tambahkan path-nya di
`MIRROR_WRITABLE_PATHS`. Pilihan ini sengaja eksplisit agar review
governance mudah.
"""

from __future__ import annotations

from typing import Iterable

from fastapi import Request
from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response

from core.config import settings
from core.database import SessionLocal, get_db
from domains.identity import mirror_service
from domains.identity.constants import ROLE_ADMIN

WRITE_METHODS: frozenset[str] = frozenset({"POST", "PUT", "PATCH", "DELETE"})

MIRROR_ALWAYS_ALLOWED_PATHS: tuple[str, ...] = (
    "/auth/mirror",
    "/auth/logout",
    "/auth/refresh",
)

MIRROR_WRITABLE_PATHS: tuple[str, ...] = ()
"""Path tambahan yang explicit opt-in writable saat mirror aktif."""

MIRROR_READ_ONLY_DETAIL = (
    "Mode Cermin aktif: write request diblokir. "
    "Keluarkan Mode Cermin untuk melakukan perubahan."
)
MIRROR_READ_ONLY_CODE = "MIRROR_READ_ONLY"


def _is_allowed(path: str, allowed: Iterable[str]) -> bool:
    return any(path == prefix or path.startswith(prefix + "/") for prefix in allowed)


def _extract_client_meta(request: Request) -> tuple[str | None, str | None]:
    """Ambil IP & User-Agent. Prefer X-Forwarded-For (paling kiri)."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        ip = forwarded.split(",")[0].strip() or None
    else:
        ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return ip, user_agent


class MirrorReadOnlyMiddleware(BaseHTTPMiddleware):
    """Blokir mutasi server kalau admin sedang impersonate role lain."""

    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        if request.method not in WRITE_METHODS:
            return await call_next(request)

        path = request.url.path
        if _is_allowed(path, MIRROR_ALWAYS_ALLOWED_PATHS):
            return await call_next(request)
        if _is_allowed(path, MIRROR_WRITABLE_PATHS):
            return await call_next(request)

        auth_header = request.headers.get("authorization") or ""
        if not auth_header.lower().startswith("bearer "):
            return await call_next(request)

        token = auth_header.split(" ", 1)[1].strip()
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except JWTError:
            return await call_next(request)

        if payload.get("role") != ROLE_ADMIN:
            return await call_next(request)

        username = payload.get("sub") or payload.get("username")
        if not username:
            return await call_next(request)

        db, _close = _open_db_session(request)
        try:
            from domains.identity.service import get_user_by_username

            user = get_user_by_username(db, username=username)
            if user is None:
                return await call_next(request)

            session = mirror_service.get_active_session(db, user)
            if session is None:
                return await call_next(request)

            ip_address, user_agent = _extract_client_meta(request)
            mirror_service.record_block_audit(
                db,
                user=user,
                session=session,
                method=request.method,
                path=path,
                ip_address=ip_address,
                user_agent=user_agent,
            )
            return JSONResponse(
                status_code=403,
                content={
                    "detail": MIRROR_READ_ONLY_DETAIL,
                    "code": MIRROR_READ_ONLY_CODE,
                    "target_role": session.target_role,
                },
            )
        finally:
            _close()


__all__ = [
    "MIRROR_ALWAYS_ALLOWED_PATHS",
    "MIRROR_READ_ONLY_CODE",
    "MIRROR_READ_ONLY_DETAIL",
    "MIRROR_WRITABLE_PATHS",
    "MirrorReadOnlyMiddleware",
]


# Keep imports referenced for static analyzers (Response is used in subclassing
# semantics by mypy in some configs).
_ = Response

def _open_db_session(request: Request):
    """Pakai dependency override dari TestClient kalau tersedia."""
    override = request.app.dependency_overrides.get(get_db)
    if override is not None:
        gen = override()
        try:
            session = next(gen)
        except StopIteration:
            session = SessionLocal()
            return session, session.close

        def _close():
            try:
                next(gen)
            except StopIteration:
                return

        return session, _close
    session = SessionLocal()
    return session, session.close
