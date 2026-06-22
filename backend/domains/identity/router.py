from datetime import timedelta
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Path, Request, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from core.database import get_db
from core.exceptions import APIException, get_language
from core.rate_limit import limiter
from domains.identity import mirror_service, service, schemas
from domains.identity.constants import ADMIN_OWNER_ROLES, ROLE_ADMIN
from domains.identity.models import LoginStatus, User
from core.security import get_current_user, require_owner_or_admin

router = APIRouter(prefix="/auth", tags=["auth"])


# ----------------------------------------------------------------
# Helper: ekstrak IP & User-Agent dari Request
# ----------------------------------------------------------------
def _extract_client_meta(request: Request) -> tuple[Optional[str], Optional[str]]:
    """
    Ambil IP & User-Agent dengan benar.
    - Prefer header `X-Forwarded-For` (kalau ada di belakang reverse proxy / load balancer).
    - Fallback ke `request.client.host`.
    - User-Agent diambil dari header standar.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        # Format: "client, proxy1, proxy2" — ambil yang paling kiri (real client).
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return ip, user_agent


def _issue_access_token(user: User) -> dict:
    access_token_expires = timedelta(minutes=service.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_data = {
        "sub": user.username,
        "role": user.role,
        "store_nbr": user.store_nbr,
    }
    access_token = service.create_access_token(
        data=token_data, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login")
@limiter.limit("5/minute")
def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
    lang: str = Depends(get_language),
):
    """
    Login step 1: verify username + PIN.

    Response:
    - **2FA disabled**: `{access_token, token_type}` — siap dipakai.
    - **2FA enabled**: `{requires_2fa: true, challenge_token, message}` —
      lanjut POST ke `/auth/login/verify-2fa` dgn challenge_token + TOTP code.
    """
    ip_address, user_agent = _extract_client_meta(request)
    user = service.get_user_by_username(db, username=form_data.username)

    # Kasus 1: user tidak ditemukan
    if not user:
        service.record_login_activity(
            db, username_attempted=form_data.username, status=LoginStatus.FAILED,
            user_id=None, ip_address=ip_address, user_agent=user_agent,
            failure_reason="user_not_found",
        )
        raise APIException(
            status.HTTP_401_UNAUTHORIZED,
            "auth.invalid_credentials",
            lang=lang,
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Kasus 2: PIN salah
    if not service.verify_pin(form_data.password, user.pin_hash):
        service.record_login_activity(
            db, username_attempted=form_data.username, status=LoginStatus.FAILED,
            user_id=user.id, ip_address=ip_address, user_agent=user_agent,
            failure_reason="invalid_pin",
        )
        raise APIException(
            status.HTTP_401_UNAUTHORIZED,
            "auth.invalid_credentials",
            lang=lang,
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Kasus 3a: sukses + 2FA enabled → return challenge, BUKAN access token
    if user.two_factor_enabled:
        challenge = service.create_2fa_challenge_token(user)
        # Audit: PIN sukses tapi belum lengkap (akan ada SUCCESS row di /verify-2fa)
        service.record_login_activity(
            db, username_attempted=user.username, status=LoginStatus.FAILED,
            user_id=user.id, ip_address=ip_address, user_agent=user_agent,
            failure_reason="awaiting_2fa",
        )
        return {
            "requires_2fa": True,
            "challenge_token": challenge,
            "message": "2FA code required. POST to /auth/login/verify-2fa with challenge_token + code.",
        }

    # Kasus 3b: sukses + 2FA disabled → langsung issue access token
    service.record_login_activity(
        db, username_attempted=user.username, status=LoginStatus.SUCCESS,
        user_id=user.id, ip_address=ip_address, user_agent=user_agent,
    )
    return _issue_access_token(user)


@router.post("/login/verify-2fa", response_model=schemas.Token)
@limiter.limit("10/minute")
def login_verify_2fa(
    payload: schemas.TwoFactorLoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Login step 2: tukar challenge_token + TOTP code → access_token."""
    ip_address, user_agent = _extract_client_meta(request)

    decoded = service.decode_2fa_challenge_token(payload.challenge_token)
    user = service.get_user_by_username(db, decoded["sub"])
    if not user or not user.two_factor_enabled:
        raise HTTPException(status_code=400, detail="2FA flow invalid")

    if not service.verify_2fa_for_login(db, user, payload.code):
        service.record_login_activity(
            db, username_attempted=user.username, status=LoginStatus.FAILED,
            user_id=user.id, ip_address=ip_address, user_agent=user_agent,
            failure_reason="invalid_2fa_code",
        )
        raise HTTPException(status_code=401, detail="Invalid 2FA code")

    service.record_login_activity(
        db, username_attempted=user.username, status=LoginStatus.SUCCESS,
        user_id=user.id, ip_address=ip_address, user_agent=user_agent,
    )
    return _issue_access_token(user)


@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: schemas.UserResponse = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=schemas.UserResponse)
def update_users_me(
    payload: schemas.SelfProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.update_self_profile(db, current_user, payload)

# ----------------------------------------------------------------
# Mirror Mode (Mode Cermin) — admin server-side session + audit log
# ----------------------------------------------------------------

@router.get("/mirror", response_model=schemas.MirrorSessionResponse | None)
def get_mirror_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return active mirror session untuk admin saat ini, atau null."""
    if current_user.role != ROLE_ADMIN:
        return None
    session = mirror_service.get_active_session(db, current_user)
    return mirror_service.serialize(session)

@router.post(
    "/mirror",
    response_model=schemas.MirrorSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("10/minute")
def start_mirror_session(
    payload: schemas.MirrorStartRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aktifkan Mode Cermin untuk admin (server-side). Diaudit."""
    ip, user_agent = _extract_client_meta(request)
    session = mirror_service.start_session(
        db,
        user=current_user,
        target_role=payload.target_role.value,
        ip_address=ip,
        user_agent=user_agent,
    )
    return mirror_service.serialize(session)

@router.delete("/mirror", status_code=status.HTTP_204_NO_CONTENT)
def stop_mirror_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Akhiri sesi mirror aktif (idempotent)."""
    mirror_service.end_active_session(db, user=current_user)
    return None


@router.post(
    "/refresh",
    summary="Refresh access token (rotate tanpa login ulang)",
)
def refresh_access_token(current_user: User = Depends(get_current_user)):
    """
    Refresh access token tanpa perlu login ulang.
    Client bisa panggil ini sebelum token expire untuk mempertahankan session.
    
    **Offline POS**: kasir yang sempat offline >1 jam bisa panggil ini saat online
    untuk dapat token fresh, tanpa harus re-input username/PIN.
    """
    return _issue_access_token(current_user)


@router.get(
    "/login-history",
    response_model=List[schemas.LoginActivityRead],
    summary="Riwayat login user yang sedang login (default 10 terakhir)",
)
def read_login_history(
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.get_user_login_history(db, user_id=current_user.id, limit=limit)


# Secret endpoint for admin creation (example)
@router.post("/register-admin", response_model=schemas.UserResponse)
def register_admin(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if user.role.value != ROLE_ADMIN:
        raise HTTPException(status_code=400, detail="Use this endpoint only to create admin")
    existing_user = service.get_user_by_username(db, user.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    return service.create_user(db=db, user=user)


# ============================================================
# USER INVITATION (Item #7)
# ============================================================

@router.post(
    "/invite-user",
    response_model=schemas.InviteRead,
    status_code=status.HTTP_201_CREATED,
    summary="Kirim undangan email ke user baru (admin/owner only)",
)
def invite_user(
    payload: schemas.InviteCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    auth_payload: dict = Depends(require_owner_or_admin),
):
    # Resolve current user (untuk simpan invited_by)
    inviter = service.get_user_by_username(db, auth_payload.get("sub"))
    if not inviter:
        raise HTTPException(status_code=404, detail="Inviter user not found")

    invite = service.create_invite(
        db,
        email=payload.email,
        role=payload.role.value,
        invited_by=inviter.id,
        store_nbr=payload.store_nbr,
        full_name=payload.full_name,
    )
    # Kirim email async via BackgroundTasks (no Celery dependency for MVP)
    background_tasks.add_task(
        service.send_invitation_email,
        invite.email, invite.token, invite.full_name,
    )
    return invite


@router.get(
    "/invitations",
    response_model=List[schemas.InviteRead],
    summary="List undangan pending (admin/owner only)",
)
def list_invitations(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _auth: dict = Depends(require_owner_or_admin),
):
    return service.list_pending_invites(db, limit=limit)


@router.delete(
    "/invitations/{invite_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cabut undangan yang belum di-accept (admin/owner only)",
)
def revoke_invitation(
    invite_id: UUID = Path(...),
    db: Session = Depends(get_db),
    _auth: dict = Depends(require_owner_or_admin),
):
    service.revoke_invite(db, invite_id)
    return None


@router.get(
    "/invite-preview/{token}",
    summary="Preview detail undangan sebelum diterima (PUBLIC, no auth)",
)
def preview_invite(
    token: str = Path(..., min_length=10),
    db: Session = Depends(get_db),
):
    """Return metadata undangan (role, expiry, inviter) tanpa data sensitif."""
    from datetime import datetime, timezone
    invite = service.get_invite_by_token(db, token)
    if not invite:
        raise HTTPException(status_code=404, detail="Token undangan tidak valid")
    if invite.accepted:
        raise HTTPException(status_code=400, detail="Undangan ini sudah diterima")
    expires_at = invite.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Undangan sudah kedaluwarsa")

    inviter = service.get_user_by_id(db, invite.invited_by) if invite.invited_by else None
    inviter_name = (inviter.full_name or inviter.username) if inviter else "InsightSphere"

    return {
        "role": invite.role,
        "full_name": invite.full_name,
        "email": invite.email,
        "store_nbr": invite.store_nbr,
        "expires_at": expires_at.isoformat(),
        "inviter_name": inviter_name,
    }


@router.post(
    "/accept-invite/{token}",
    response_model=schemas.UserResponse,
    summary="Accept undangan & buat akun (PUBLIC, no auth)",
)
def accept_invitation(
    payload: schemas.InviteAccept,
    token: str = Path(..., min_length=10),
    db: Session = Depends(get_db),
):
    return service.accept_invite(
        db, token=token, username=payload.username, pin=payload.pin,
    )


# ============================================================
# PASSWORD RESET (Item #8)
# ============================================================

@router.post(
    "/forgot-password",
    response_model=schemas.GenericMessage,
    summary="Request reset PIN via email (PUBLIC, no auth)",
)
@limiter.limit("3/minute")
def forgot_password(
    payload: schemas.ForgotPasswordRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Selalu return success message (anti user-enumeration).
    Email dikirim hanya jika user benar-benar ada.
    """
    user = service.get_user_by_email(db, payload.email)
    if user and user.is_active:
        pr = service.create_password_reset(db, user)
        background_tasks.add_task(
            service.send_password_reset_email, user.email, pr.token,
        )
    return {"message": "Jika email terdaftar, link reset telah dikirim."}


@router.post(
    "/reset-password/{token}",
    response_model=schemas.GenericMessage,
    summary="Set PIN baru via reset token (PUBLIC, no auth)",
)
def reset_password(
    payload: schemas.ResetPasswordRequest,
    token: str = Path(..., min_length=10),
    db: Session = Depends(get_db),
):
    service.consume_password_reset(db, token=token, new_pin=payload.new_pin)
    return {"message": "PIN berhasil diatur ulang. Silakan login dengan PIN baru."}


@router.post(
    "/change-password",
    response_model=schemas.GenericMessage,
    summary="Ubah PIN sendiri (authenticated)",
)
def change_password(
    payload: schemas.ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    lang: str = Depends(get_language),
):
    if not service.verify_pin(payload.current_pin, current_user.pin_hash):
        raise APIException(status.HTTP_401_UNAUTHORIZED, "auth.pin_incorrect", lang=lang)
    if payload.current_pin == payload.new_pin:
        raise APIException(status.HTTP_400_BAD_REQUEST, "auth.pin_must_differ", lang=lang)
    service.update_user_pin(db, current_user, payload.new_pin)
    return {"message": "PIN berhasil diubah."}


# ============================================================
# 2FA SETUP / DISABLE (Item #10)
# ============================================================

@router.post(
    "/2fa/setup/init",
    response_model=schemas.TwoFactorSetupInitResponse,
    summary="Step 1: generate TOTP secret + QR code (belum aktif sampai diverifikasi)",
)
def two_factor_setup_init(
    current_user: User = Depends(get_current_user),
):
    return service.setup_2fa_init(current_user)


@router.post(
    "/2fa/setup/verify",
    response_model=schemas.TwoFactorEnableResponse,
    summary="Step 2: verify TOTP code & enable 2FA. Return backup codes (1x display).",
)
def two_factor_setup_verify(
    payload: schemas.TwoFactorVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    backup_codes = service.setup_2fa_verify(
        db, current_user, secret=payload.secret, code=payload.code,
    )
    return {
        "message": "2FA enabled. Simpan backup codes berikut di tempat aman — tidak ditampilkan ulang.",
        "backup_codes": backup_codes,
    }


@router.post(
    "/2fa/disable",
    response_model=schemas.GenericMessage,
    summary="Disable 2FA (wajib verify PIN + valid TOTP/backup code)",
)
def two_factor_disable(
    payload: schemas.TwoFactorDisableRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service.disable_2fa(db, current_user, pin=payload.pin, code=payload.code)
    return {"message": "2FA berhasil dinonaktifkan."}


# ============================================================
# USER MANAGEMENT (ADR-005) — admin/owner only
# ============================================================

def _require_admin_or_owner_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency: return User object, raise 403 jika role bukan admin/owner."""
    if current_user.role not in ADMIN_OWNER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requires owner or admin privileges",
        )
    return current_user


@router.get(
    "/users",
    response_model=List[schemas.UserResponse],
    summary="List semua users dengan filter (admin/owner only)",
)
def list_users_endpoint(
    is_active: Optional[bool] = Query(None, description="Filter status aktif"),
    role: Optional[schemas.RoleEnum] = Query(None, description="Filter by role"),
    store_nbr: Optional[int] = Query(None, description="Filter by store number"),
    search: Optional[str] = Query(None, min_length=1, max_length=100, description="Cari username atau full_name (case-insensitive)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _actor: User = Depends(_require_admin_or_owner_user),
):
    """
    List users dengan filter opsional + pagination.
    Sorted by `created_at` desc (newest first).

    Default `is_active=None` → return semua users termasuk yang sudah soft-deleted.
    UI sebaiknya default pass `is_active=true` kecuali ada toggle "tampilkan nonaktif".
    """
    role_str = role.value if role else None
    return service.list_users(
        db,
        is_active=is_active,
        role=role_str,
        store_nbr=store_nbr,
        search=search,
        skip=skip,
        limit=limit,
    )


@router.patch(
    "/users/{user_id}",
    response_model=schemas.UserResponse,
    summary="Update field user (admin/owner only). PIN tidak bisa diubah di sini.",
)
def update_user_endpoint(
    payload: schemas.UserUpdate,
    user_id: UUID = Path(..., description="UUID user yang akan di-update"),
    db: Session = Depends(get_db),
    actor: User = Depends(_require_admin_or_owner_user),
):
    """
    Partial update user. Hanya field yang dikirim yang berubah.

    Guardrails:
    - User tidak boleh mengubah role-nya sendiri (mencegah lock-out).
    - User tidak boleh deactivate akun-nya sendiri.
    - Role `cashier` / `inventory_manager` wajib punya `store_nbr`.
    - Email yang di-update harus unik.
    """
    return service.update_user(db, user_id=user_id, payload=payload, acting_user_id=actor.id)


@router.delete(
    "/users/{user_id}",
    response_model=schemas.UserResponse,
    summary="Soft-delete user (set is_active=False). Idempotent.",
)
def soft_delete_user_endpoint(
    user_id: UUID = Path(..., description="UUID user yang akan di-nonaktifkan"),
    db: Session = Depends(get_db),
    actor: User = Depends(_require_admin_or_owner_user),
):
    """
    Soft-delete user — preserve FK ke `login_activities`, `transactions`, `stock_movements`.

    Untuk reactivate user yang sudah soft-deleted, pakai `PATCH /auth/users/{id}` dengan
    body `{"is_active": true}`.

    Guardrails:
    - Tidak boleh soft-delete diri sendiri.
    - Idempotent: user yang sudah inactive → no-op, return user apa adanya.
    """
    return service.soft_delete_user(db, user_id=user_id, acting_user_id=actor.id)
