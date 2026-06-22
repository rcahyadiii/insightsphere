from pydantic import BaseModel, Field, constr, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum

from domains.identity.constants import (
    ROLE_ADMIN,
    ROLE_CASHIER,
    ROLE_INVENTORY_MANAGER,
    ROLE_OWNER,
)


class RoleEnum(str, Enum):
    ADMIN = ROLE_ADMIN
    OWNER = ROLE_OWNER
    INVENTORY_MANAGER = ROLE_INVENTORY_MANAGER
    CASHIER = ROLE_CASHIER

class UserBase(BaseModel):
    username: str = Field(..., description="Username untuk login")
    full_name: Optional[str] = None
    role: RoleEnum = RoleEnum.CASHIER
    store_nbr: Optional[int] = Field(None, description="Nomor toko khusus untuk Cashier")
    email: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    pin: str = Field(..., min_length=4, max_length=6, description="PIN angka 4-6 digit")


class UserUpdate(BaseModel):
    """
    Payload PATCH /auth/users/{id} — admin/owner only.
    Semua field optional; hanya field yg dikirim yang di-update.
    PIN TIDAK bisa diubah via endpoint ini (user pakai /auth/change-password sendiri,
    atau admin trigger /auth/forgot-password flow untuk reset).
    """
    full_name: Optional[str] = None
    role: Optional[RoleEnum] = None
    store_nbr: Optional[int] = Field(None, description="Set null untuk admin/owner, wajib untuk cashier/inventory_manager")
    email: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = Field(None, description="True=aktif, False=soft-deleted")


class SelfProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    avatar_url: Optional[str] = None


from uuid import UUID

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    is_active: bool
    two_factor_enabled: bool = False


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    store_nbr: Optional[int] = None


# ============================================================
# Login Activity (audit trail)
# ============================================================

class LoginStatusEnum(str, Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class LoginActivityRead(BaseModel):
    """Representasi 1 baris audit login utk endpoint /auth/login-history."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: Optional[UUID] = None
    username_attempted: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    status: LoginStatusEnum
    failure_reason: Optional[str] = None
    timestamp: datetime


# ============================================================
# Invitation (Item #7)
# ============================================================

from pydantic import EmailStr  # noqa: E402


class InviteCreate(BaseModel):
    """Payload POST /auth/invite-user (admin/owner only)."""
    email: EmailStr
    role: RoleEnum = RoleEnum.CASHIER
    store_nbr: Optional[int] = None
    full_name: Optional[str] = None


class InviteAccept(BaseModel):
    """Payload POST /auth/accept-invite/{token} (public)."""
    username: str = Field(..., min_length=3, max_length=50)
    pin: str = Field(..., min_length=4, max_length=6, description="PIN 4-6 digit")


class InviteRead(BaseModel):
    """Output schema utk list / detail invitation."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    role: RoleEnum
    store_nbr: Optional[int] = None
    full_name: Optional[str] = None
    invited_by: Optional[UUID] = None
    accepted: bool
    accepted_at: Optional[datetime] = None
    expires_at: datetime
    created_at: datetime


# ============================================================
# Password Reset (Item #8)
# ============================================================

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Body POST /auth/reset-password/{token}."""
    new_pin: str = Field(..., min_length=4, max_length=6)


class ChangePasswordRequest(BaseModel):
    """Body POST /auth/change-password (authenticated)."""
    current_pin: str = Field(..., min_length=4, max_length=6)
    new_pin: str = Field(..., min_length=4, max_length=6)


class GenericMessage(BaseModel):
    message: str


# ============================================================
# 2FA (Item #10)
# ============================================================

class TwoFactorSetupInitResponse(BaseModel):
    """Step 1: backend kirim secret + QR code ke user."""
    secret: str = Field(..., description="Base32 TOTP secret — JANGAN tampilkan ke user lain")
    otpauth_uri: str = Field(..., description="otpauth:// URI untuk authenticator app")
    qr_code_base64: str = Field(..., description="PNG QR code, base64-encoded (siap pakai di <img src>)")
    issuer: str
    account_name: str


class TwoFactorVerifyRequest(BaseModel):
    """Step 2: user submit secret yg diterima + 6-digit code dari authenticator."""
    secret: str = Field(..., min_length=16, max_length=64)
    code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


class TwoFactorEnableResponse(BaseModel):
    message: str
    backup_codes: list[str] = Field(..., description="Simpan baik-baik — 1x display only")


class TwoFactorDisableRequest(BaseModel):
    pin: str = Field(..., min_length=4, max_length=6)
    code: str = Field(..., min_length=6, max_length=8, description="TOTP 6-digit atau backup code 8-char")


class LoginChallengeResponse(BaseModel):
    """Response /auth/login saat 2FA enabled — bukan access_token, tapi challenge."""
    requires_2fa: bool = True
    challenge_token: str = Field(..., description="Short-lived JWT (5 menit) untuk dipakai di /auth/login/verify-2fa")
    message: str = "2FA code required. POST to /auth/login/verify-2fa with challenge_token + code."


class TwoFactorLoginRequest(BaseModel):
    challenge_token: str
    code: str = Field(..., min_length=6, max_length=8)

# ============================================================
# Mirror Mode (Mode Cermin) — server-side session
# ============================================================

class MirrorStartRequest(BaseModel):
    target_role: RoleEnum

class MirrorSessionResponse(BaseModel):
    id: UUID
    actor_user_id: UUID
    actor_role: str
    target_role: str
    started_at: datetime
    expires_at: datetime
