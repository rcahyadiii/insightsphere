"""
Domain Identity — User & Role-Based Access Control.
Mengelola identitas karyawan, PIN kasir, dan role (admin/cashier).
"""
import enum
import uuid

from sqlalchemy import (
    Column, String, Integer, Boolean, Text, DateTime, ForeignKey, Index,
    Enum as SQLAlchemyEnum, text,
)
from sqlalchemy.dialects.postgresql import UUID

from core.base_model import AbstractBase, get_utc_now
from core.database import Base


class User(AbstractBase):
    __tablename__ = "users"
    
    username = Column(String, unique=True, index=True, nullable=False)
    pin_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="cashier")  # 'admin', 'owner', 'inventory_manager', 'cashier'
    full_name = Column(String, nullable=True)
    store_nbr = Column(Integer, nullable=True)  # Using store_nbr for branch scoping
    is_active = Column(Boolean, default=True)
    
    # New profile fields
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, nullable=True)
    position = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    
    # 2FA / TOTP fields
    two_factor_enabled = Column(Boolean, default=False, nullable=False)
    two_factor_secret = Column(String(255), nullable=True)
    backup_codes = Column(Text, nullable=True)  # Store as comma-separated or JSON string


# ============================================================
# LOGIN AUDIT TRAIL — append-only, tidak inherit AbstractBase
# ============================================================

class LoginStatus(str, enum.Enum):
    """Hasil percobaan login."""
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class LoginActivity(Base):
    """
    Catatan setiap percobaan login (sukses / gagal) untuk audit keamanan.

    Catatan:
      - Bersifat append-only — tidak boleh di-UPDATE / DELETE oleh aplikasi.
      - `user_id` nullable: jika username tidak ditemukan saat login gagal,
        kita tetap mencatat attempt-nya untuk deteksi brute-force.
      - `username_attempted` selalu di-isi (sumber kebenaran ketika user_id null).
    """
    __tablename__ = "login_activities"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    username_attempted = Column(String(150), nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)   # cukup utk IPv6 (max 45 char)
    user_agent = Column(Text, nullable=True)
    status = Column(
        SQLAlchemyEnum(LoginStatus, name="login_status", native_enum=False),
        nullable=False,
        index=True,
    )
    failure_reason = Column(String(255), nullable=True)  # mis. "user_not_found", "invalid_pin"
    timestamp = Column(
        DateTime(timezone=True),
        nullable=False,
        default=get_utc_now,
        server_default=text("now()"),
        index=True,
    )

    __table_args__ = (
        # Query terpopuler: history per user, sort desc by timestamp.
        Index("ix_login_activities_user_time", "user_id", "timestamp"),
    )

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<LoginActivity user={self.username_attempted} "
            f"status={self.status} ip={self.ip_address} at={self.timestamp}>"
        )


# ============================================================
# USER INVITATION (Item #7)
# ============================================================

class UserInvite(AbstractBase):
    """
    Undangan untuk user baru. Token dikirim via email; user accept dgn set username + PIN.

    Catatan keamanan:
    - `token` di-generate dgn `secrets.token_urlsafe(32)` (~256-bit entropy).
    - Single-use: setelah `accepted=True`, tidak bisa dipakai lagi.
    - Auto-invalid setelah `expires_at` lewat.
    - TODO production hardening: hash token at-rest (sha256) sebelum INSERT.
    """
    __tablename__ = "user_invites"

    email = Column(String(255), nullable=False, index=True)
    token = Column(String(128), nullable=False, unique=True, index=True)
    role = Column(String(50), nullable=False)             # 'admin'/'owner'/'inventory_manager'/'cashier'
    store_nbr = Column(Integer, nullable=True)            # branch assignment (untuk cashier)
    full_name = Column(String(150), nullable=True)
    invited_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    accepted = Column(Boolean, nullable=False, default=False, index=True)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)


# ============================================================
# PASSWORD RESET (Item #8)
# ============================================================

class PasswordReset(Base):
    """
    Token one-shot untuk reset PIN.
    Append-only secara semantik (kecuali field `used`).
    """
    __tablename__ = "password_resets"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token = Column(String(128), nullable=False, unique=True, index=True)
    used = Column(Boolean, nullable=False, default=False, index=True)
    used_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=get_utc_now,
        server_default=text("now()"),
    )

# ============================================================
# MIRROR SESSION (Admin Mode Cermin)
# ============================================================

class MirrorSession(Base):
    """Server-side state untuk Mode Cermin Admin.

    Hanya satu sesi aktif (`ended_at IS NULL`) per `actor_user_id`.
    Sesi otomatis kadaluwarsa lewat `expires_at`. Semua aktivasi/deaktivasi
    juga dicatat di `audit_events` (event_type=MIRROR_*).
    """
    __tablename__ = "mirror_sessions"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    actor_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    actor_role = Column(String(50), nullable=False)
    target_role = Column(String(50), nullable=False)
    started_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=get_utc_now,
        server_default=text("now()"),
    )
    expires_at = Column(DateTime(timezone=True), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    end_reason = Column(String(32), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)

    __table_args__ = (
        Index(
            "ix_mirror_sessions_actor_active",
            "actor_user_id",
            unique=True,
            postgresql_where=text("ended_at IS NULL"),
            sqlite_where=text("ended_at IS NULL"),
        ),
    )
