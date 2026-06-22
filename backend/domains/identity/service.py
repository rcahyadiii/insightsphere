from datetime import datetime, timedelta, timezone
from typing import Optional, List, Tuple
from uuid import UUID as UUIDType
import base64
import io
import json
import logging
import secrets

import pyotp
import qrcode
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import os

from domains.identity.models import (
    User, LoginActivity, LoginStatus, UserInvite, PasswordReset,
)
from domains.identity.schemas import SelfProfileUpdate, UserCreate, UserUpdate
from domains.identity.constants import STORE_SCOPED_ROLES
from core.config import settings
from core.email import EmailService

logger = logging.getLogger(__name__)

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    try:
        return bcrypt.checkpw(plain_pin.encode('utf-8'), hashed_pin.encode('utf-8'))
    except Exception:
        return False

def get_pin_hash(pin: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pin.encode('utf-8'), salt).decode('utf-8')

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user: UserCreate):
    db_user = User(
        username=user.username,
        pin_hash=get_pin_hash(user.pin),
        role=user.role.value,
        store_nbr=user.store_nbr,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        position=user.position,
        avatar_url=user.avatar_url
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# ============================================================
# Login Activity (audit trail)
# ============================================================

def record_login_activity(
    db: Session,
    *,
    username_attempted: str,
    status: LoginStatus,
    user_id: Optional[UUIDType] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    failure_reason: Optional[str] = None,
) -> LoginActivity:
    """
    Persist 1 baris audit login.

    Audit ditulis di transaksi terpisah agar kegagalan logging tidak
    membatalkan response login. Caller boleh ignore exception dari sini.
    """
    activity = LoginActivity(
        user_id=user_id,
        username_attempted=username_attempted[:150],  # truncate defensif
        ip_address=ip_address,
        user_agent=user_agent,
        status=status,
        failure_reason=failure_reason,
    )
    try:
        db.add(activity)
        db.commit()
        db.refresh(activity)
    except Exception as exc:
        # Audit gagal tidak boleh menjatuhkan login flow.
        db.rollback()
        logger.error("Failed to record login activity for %s: %s", username_attempted, exc)
        return activity
    return activity


def get_user_login_history(
    db: Session,
    user_id: UUIDType,
    limit: int = 10,
) -> List[LoginActivity]:
    """Ambil N login activity terakhir milik 1 user, sorted desc by timestamp."""
    return (
        db.query(LoginActivity)
        .filter(LoginActivity.user_id == user_id)
        .order_by(LoginActivity.timestamp.desc())
        .limit(limit)
        .all()
    )


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def update_user_pin(db: Session, user: User, new_pin: str) -> User:
    user.pin_hash = get_pin_hash(new_pin)
    db.commit()
    db.refresh(user)
    return user

def update_self_profile(db: Session, user: User, payload: SelfProfileUpdate) -> User:
    updates = payload.model_dump(exclude_unset=True)

    new_email = updates.get("email")
    if new_email and new_email != user.email:
        existing = get_user_by_email(db, new_email)
        if existing and existing.id != user.id:
            raise HTTPException(
                status_code=409,
                detail="Email already registered to another user.",
            )

    for field, value in updates.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    logger.info("Self profile updated user=%s fields=%s", user.id, list(updates.keys()))
    return user


# ============================================================
# User Management (ADR-005) — admin/owner only
# ============================================================

def get_user_by_id(db: Session, user_id: UUIDType) -> Optional[User]:
    """Ambil user by UUID. Return None jika tidak ditemukan."""
    return db.query(User).filter(User.id == user_id).first()


def list_users(
    db: Session,
    is_active: Optional[bool] = None,
    role: Optional[str] = None,
    store_nbr: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[User]:
    """
    List users dengan filter optional.

    Filter:
    - `is_active`: True/False/None (None = semua)
    - `role`: 'admin' | 'owner' | 'inventory_manager' | 'cashier'
    - `store_nbr`: integer
    - `search`: substring match (case-insensitive) pada username atau full_name
    - `skip` + `limit`: pagination

    Sorted by `created_at` descending (newest first).
    """
    query = db.query(User)

    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if role is not None:
        query = query.filter(User.role == role)
    if store_nbr is not None:
        query = query.filter(User.store_nbr == store_nbr)
    if search:
        # Case-insensitive partial match di username ATAU full_name
        from sqlalchemy import or_, func
        pattern = f"%{search.lower()}%"
        query = query.filter(
            or_(
                func.lower(User.username).like(pattern),
                func.lower(User.full_name).like(pattern),
            )
        )

    return (
        query.order_by(User.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_user(
    db: Session,
    user_id: UUIDType,
    payload: UserUpdate,
    acting_user_id: UUIDType,
) -> User:
    """
    Update field user (admin/owner only). PIN tidak bisa diubah di sini.

    Guardrails:
    - User tidak boleh demote dirinya sendiri (mencegah lock-out).
    - User tidak boleh deactivate dirinya sendiri.
    - Role cashier/inventory_manager wajib punya store_nbr (jika role diubah ke itu).
    """
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Self-protection: tidak boleh downgrade atau deactivate diri sendiri
    is_self = user.id == acting_user_id
    updates = payload.model_dump(exclude_unset=True)

    if is_self:
        if "role" in updates and updates["role"] != user.role:
            raise HTTPException(
                status_code=400,
                detail="Cannot change your own role — ask another admin/owner to do it.",
            )
        if "is_active" in updates and updates["is_active"] is False:
            raise HTTPException(
                status_code=400,
                detail="Cannot deactivate your own account.",
            )

    # Business rule: cashier & inventory_manager wajib store_nbr
    effective_role = updates.get("role", user.role)
    # role dari payload bisa enum, dari user adalah string
    if hasattr(effective_role, "value"):
        effective_role = effective_role.value
    effective_store_nbr = updates.get("store_nbr", user.store_nbr)
    if effective_role in STORE_SCOPED_ROLES and effective_store_nbr is None:
        raise HTTPException(
            status_code=400,
            detail=f"Role '{effective_role}' requires store_nbr to be set.",
        )

    # Email uniqueness check jika email berubah
    new_email = updates.get("email")
    if new_email and new_email != user.email:
        existing = get_user_by_email(db, new_email)
        if existing and existing.id != user.id:
            raise HTTPException(
                status_code=409,
                detail="Email already registered to another user.",
            )

    # Apply updates — handle role enum to string conversion
    for field, value in updates.items():
        if field == "role" and hasattr(value, "value"):
            value = value.value
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    logger.info("User updated id=%s by=%s fields=%s", user.id, acting_user_id, list(updates.keys()))
    return user


def soft_delete_user(
    db: Session,
    user_id: UUIDType,
    acting_user_id: UUIDType,
) -> User:
    """
    Soft delete user → set is_active=False.
    Preserves foreign keys di login_activities, transactions, dll.

    Guardrails:
    - Tidak boleh soft-delete diri sendiri (pakai UserUpdate kalau benar-benar perlu).
    - Soft delete idempotent: sudah inactive → no-op, return user apa adanya.
    """
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == acting_user_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete your own account.",
        )

    if not user.is_active:
        # Idempotent — already deactivated
        return user

    user.is_active = False
    db.commit()
    db.refresh(user)
    logger.info("User soft-deleted id=%s by=%s", user.id, acting_user_id)
    return user


# ============================================================
# Token helpers (invite + reset)
# ============================================================

def _generate_token() -> str:
    """URL-safe token, ~256-bit entropy."""
    return secrets.token_urlsafe(32)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ============================================================
# Invitation (Item #7)
# ============================================================

def create_invite(
    db: Session,
    *,
    email: str,
    role: str,
    invited_by: UUIDType,
    store_nbr: Optional[int] = None,
    full_name: Optional[str] = None,
) -> UserInvite:
    """Buat undangan baru. Tolak jika email sudah dipakai user aktif."""
    existing_user = get_user_by_email(db, email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered to an existing user",
        )

    expires_at = _utcnow() + timedelta(hours=settings.INVITE_TOKEN_EXPIRE_HOURS)
    invite = UserInvite(
        email=email,
        token=_generate_token(),
        role=role,
        store_nbr=store_nbr,
        full_name=full_name,
        invited_by=invited_by,
        expires_at=expires_at,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    logger.info("UserInvite created id=%s email=%s role=%s", invite.id, email, role)
    return invite


def get_invite_by_token(db: Session, token: str) -> Optional[UserInvite]:
    return db.query(UserInvite).filter(UserInvite.token == token).first()


def list_pending_invites(db: Session, limit: int = 100) -> List[UserInvite]:
    return (
        db.query(UserInvite)
        .filter(UserInvite.accepted.is_(False))
        .filter(UserInvite.expires_at > _utcnow())
        .order_by(UserInvite.created_at.desc())
        .limit(limit)
        .all()
    )


def revoke_invite(db: Session, invite_id: UUIDType) -> None:
    invite = db.query(UserInvite).filter(UserInvite.id == invite_id).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.accepted:
        raise HTTPException(status_code=400, detail="Cannot revoke an accepted invite")
    db.delete(invite)
    db.commit()


def accept_invite(
    db: Session,
    *,
    token: str,
    username: str,
    pin: str,
) -> User:
    """
    Tukar token invite menjadi akun aktif.
    Validasi: invite ada, belum accepted, belum expired, username belum dipakai.
    """
    invite = get_invite_by_token(db, token)
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid invitation token")
    if invite.accepted:
        raise HTTPException(status_code=400, detail="Invitation already accepted")
    if invite.expires_at < _utcnow():
        raise HTTPException(status_code=400, detail="Invitation has expired")

    if get_user_by_username(db, username):
        raise HTTPException(status_code=409, detail="Username already taken")

    # Buat user
    user = User(
        username=username,
        pin_hash=get_pin_hash(pin),
        role=invite.role,
        store_nbr=invite.store_nbr,
        full_name=invite.full_name,
        email=invite.email,
        is_active=True,
    )
    db.add(user)

    # Mark invite as accepted (single-use)
    invite.accepted = True
    invite.accepted_at = _utcnow()

    db.commit()
    db.refresh(user)
    logger.info("Invite accepted id=%s -> user=%s", invite.id, user.id)
    return user


# ============================================================
# Password Reset (Item #8)
# ============================================================

def create_password_reset(db: Session, user: User) -> PasswordReset:
    """Generate reset token. Invalidate token-token sebelumnya milik user ini."""
    # Invalidate previous unused tokens (defensive)
    db.query(PasswordReset).filter(
        PasswordReset.user_id == user.id,
        PasswordReset.used.is_(False),
    ).update({"used": True, "used_at": _utcnow()}, synchronize_session=False)

    expires_at = _utcnow() + timedelta(hours=settings.RESET_TOKEN_EXPIRE_HOURS)
    pr = PasswordReset(
        user_id=user.id,
        token=_generate_token(),
        expires_at=expires_at,
    )
    db.add(pr)
    db.commit()
    db.refresh(pr)
    logger.info("PasswordReset created id=%s user=%s", pr.id, user.id)
    return pr


def consume_password_reset(db: Session, token: str, new_pin: str) -> User:
    """Validate token, set new PIN, mark used."""
    pr = db.query(PasswordReset).filter(PasswordReset.token == token).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Invalid reset token")
    if pr.used:
        raise HTTPException(status_code=400, detail="Reset token already used")
    if pr.expires_at < _utcnow():
        raise HTTPException(status_code=400, detail="Reset token has expired")

    user = db.query(User).filter(User.id == pr.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User no longer exists")

    user.pin_hash = get_pin_hash(new_pin)
    pr.used = True
    pr.used_at = _utcnow()
    db.commit()
    db.refresh(user)
    logger.info("PasswordReset consumed user=%s", user.id)
    return user


# ============================================================
# Email composers — pure functions (gampang dipindah ke Celery task)
# ============================================================

def send_invitation_email(to_email: str, token: str, full_name: Optional[str] = None) -> bool:
    accept_link = f"{settings.FRONTEND_URL}/accept-invite/{token}"
    salutation = f"Halo {full_name}," if full_name else "Halo,"
    text = (
        f"{salutation}\n\n"
        f"Anda telah diundang untuk bergabung di {settings.APP_NAME}.\n"
        f"Klik link berikut untuk membuat akun Anda:\n\n{accept_link}\n\n"
        f"Tautan ini berlaku {settings.INVITE_TOKEN_EXPIRE_HOURS // 24} hari.\n\n"
        f"Jika ini bukan Anda, abaikan email ini."
    )
    html = (
        f"<p>{salutation}</p>"
        f"<p>Anda telah diundang untuk bergabung di <b>{settings.APP_NAME}</b>.</p>"
        f'<p><a href="{accept_link}">Klik di sini untuk membuat akun Anda</a></p>'
        f"<p>Tautan berlaku {settings.INVITE_TOKEN_EXPIRE_HOURS // 24} hari.</p>"
    )
    return EmailService.send(to_email, f"Undangan {settings.APP_NAME}", text, html)


# ============================================================
# 2FA — TOTP (Item #10)
# ============================================================

TOTP_ISSUER = settings.APP_NAME
CHALLENGE_TOKEN_EXPIRE_MINUTES = 5


def generate_totp_secret() -> str:
    """Generate base32 secret (compatible with Google/Microsoft Authenticator)."""
    return pyotp.random_base32()


def build_otpauth_uri(secret: str, account_name: str) -> str:
    """Build otpauth:// URI yang bisa di-scan oleh authenticator app."""
    return pyotp.TOTP(secret).provisioning_uri(
        name=account_name, issuer_name=TOTP_ISSUER,
    )


def render_qr_code_base64(uri: str) -> str:
    """Render URI sebagai PNG QR code, return base64-encoded string (siap utk <img src>)."""
    img = qrcode.make(uri)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


def verify_totp_code(secret: str, code: str, valid_window: int = 1) -> bool:
    """
    Verify 6-digit TOTP code. `valid_window=1` toleransi clock skew ±30 detik.
    """
    try:
        return pyotp.TOTP(secret).verify(code, valid_window=valid_window)
    except Exception:
        return False


def _generate_backup_codes(n: int = 10) -> List[str]:
    """Generate N backup codes (8-char alphanumeric, uppercase)."""
    return [secrets.token_hex(4).upper() for _ in range(n)]


def _hash_backup_codes(codes: List[str]) -> str:
    """Hash backup codes dengan bcrypt sebelum disimpan (JSON list of hashes)."""
    hashes = [bcrypt.hashpw(c.encode(), bcrypt.gensalt(rounds=10)).decode() for c in codes]
    return json.dumps(hashes)


def _verify_and_consume_backup_code(user: User, code: str, db: Session) -> bool:
    """
    Cek apakah `code` cocok dengan salah satu backup code milik user.
    Jika cocok → hapus dari list (single-use) dan commit.
    """
    if not user.backup_codes:
        return False
    try:
        hashes: List[str] = json.loads(user.backup_codes)
    except (TypeError, ValueError):
        return False

    for i, h in enumerate(hashes):
        try:
            if bcrypt.checkpw(code.encode(), h.encode()):
                # Konsumsi (hapus) backup code yg sudah dipakai
                hashes.pop(i)
                user.backup_codes = json.dumps(hashes)
                db.commit()
                return True
        except Exception:
            continue
    return False


def setup_2fa_init(user: User) -> dict:
    """Step 1: generate secret + QR code. BELUM di-persist ke DB."""
    if user.two_factor_enabled:
        raise HTTPException(status_code=400, detail="2FA already enabled")

    secret = generate_totp_secret()
    account_name = user.email or user.username
    uri = build_otpauth_uri(secret, account_name)
    qr_b64 = render_qr_code_base64(uri)
    return {
        "secret": secret,
        "otpauth_uri": uri,
        "qr_code_base64": qr_b64,
        "issuer": TOTP_ISSUER,
        "account_name": account_name,
    }


def setup_2fa_verify(db: Session, user: User, secret: str, code: str) -> List[str]:
    """
    Step 2: verify code, simpan secret, generate backup codes.
    Return PLAIN backup codes (1x display, hashes-nya yg disimpan).
    """
    if user.two_factor_enabled:
        raise HTTPException(status_code=400, detail="2FA already enabled")

    if not verify_totp_code(secret, code):
        raise HTTPException(status_code=400, detail="Invalid 2FA code — make sure your device clock is accurate")

    backup_codes = _generate_backup_codes(10)
    user.two_factor_secret = secret
    user.two_factor_enabled = True
    user.backup_codes = _hash_backup_codes(backup_codes)
    db.commit()
    db.refresh(user)
    logger.info("2FA enabled for user=%s", user.id)
    return backup_codes


def disable_2fa(db: Session, user: User, pin: str, code: str) -> None:
    """Disable 2FA — wajib verify PIN + valid 2FA/backup code."""
    if not user.two_factor_enabled:
        raise HTTPException(status_code=400, detail="2FA is not enabled")
    if not verify_pin(pin, user.pin_hash):
        raise HTTPException(status_code=401, detail="PIN incorrect")

    valid = verify_totp_code(user.two_factor_secret, code) or _verify_and_consume_backup_code(user, code, db)
    if not valid:
        raise HTTPException(status_code=401, detail="Invalid 2FA code")

    user.two_factor_enabled = False
    user.two_factor_secret = None
    user.backup_codes = None
    db.commit()
    db.refresh(user)
    logger.info("2FA disabled for user=%s", user.id)


def verify_2fa_for_login(db: Session, user: User, code: str) -> bool:
    """
    Verify TOTP atau backup code saat login flow.
    Backup code di-konsumsi otomatis kalau dipakai.
    """
    if not user.two_factor_enabled or not user.two_factor_secret:
        return True  # 2FA tidak aktif, skip
    if verify_totp_code(user.two_factor_secret, code):
        return True
    return _verify_and_consume_backup_code(user, code, db)


def create_2fa_challenge_token(user: User) -> str:
    """JWT pendek (5 menit) yang membuktikan user sudah pass step-1 (PIN)."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=CHALLENGE_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user.username,
        "user_id": str(user.id),
        "purpose": "2fa_challenge",
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_2fa_challenge_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired challenge token")
    if payload.get("purpose") != "2fa_challenge":
        raise HTTPException(status_code=401, detail="Wrong token purpose")
    return payload


def send_password_reset_email(to_email: str, token: str) -> bool:
    reset_link = f"{settings.FRONTEND_URL}/reset-password/{token}"
    text = (
        f"Halo,\n\n"
        f"Anda meminta reset PIN untuk akun {settings.APP_NAME}.\n"
        f"Klik link berikut untuk mengatur ulang PIN Anda:\n\n{reset_link}\n\n"
        f"Tautan ini berlaku {settings.RESET_TOKEN_EXPIRE_HOURS} jam.\n"
        f"Jika ini bukan Anda, abaikan email ini — PIN Anda tetap aman."
    )
    html = (
        f"<p>Halo,</p>"
        f"<p>Anda meminta reset PIN untuk akun <b>{settings.APP_NAME}</b>.</p>"
        f'<p><a href="{reset_link}">Klik di sini untuk reset PIN</a></p>'
        f"<p>Tautan berlaku {settings.RESET_TOKEN_EXPIRE_HOURS} jam.</p>"
    )
    return EmailService.send(to_email, f"Reset PIN {settings.APP_NAME}", text, html)
