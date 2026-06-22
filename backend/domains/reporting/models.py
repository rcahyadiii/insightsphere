"""
Domain Reporting — Audit log for generated exports.

Catatan:
- File CSV/Excel TIDAK di-persist ke disk pada MVP ini (streaming inline).
- Tabel ini menyimpan METADATA setiap generation untuk audit trail
  (siapa export apa, kapan, period apa, berapa row).
"""
from __future__ import annotations

import enum

from sqlalchemy import (
    Column, String, Integer, ForeignKey, Index,
    Enum as SQLAlchemyEnum,
)
from sqlalchemy.dialects.postgresql import UUID

from core.base_model import AbstractBase


class ExportType(str, enum.Enum):
    """Jenis export yang didukung."""
    SALES = "SALES"
    PREDICTION = "PREDICTION"
    PROFIT_LOSS = "PROFIT_LOSS"
    WASTAGE = "WASTAGE"


class ExportFormat(str, enum.Enum):
    """Format file output."""
    CSV = "CSV"
    XLSX = "XLSX"


class ExportPeriod(str, enum.Enum):
    """Window waktu yang diekspor (relatif terhadap hari ini)."""
    WEEK = "week"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"


class ReportExport(AbstractBase):
    """
    Audit log: 1 row = 1 kali generation export.
    Bersifat append-only (tidak ada update / delete dari aplikasi).
    """
    __tablename__ = "report_exports"

    requested_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    export_type = Column(
        SQLAlchemyEnum(ExportType, name="export_type", native_enum=False),
        nullable=False,
        index=True,
    )
    export_format = Column(
        SQLAlchemyEnum(ExportFormat, name="export_format", native_enum=False),
        nullable=False,
        default=ExportFormat.CSV,
    )
    period = Column(
        SQLAlchemyEnum(ExportPeriod, name="export_period", native_enum=False),
        nullable=False,
    )
    store_nbr = Column(Integer, nullable=True, index=True)
    row_count = Column(Integer, nullable=False, default=0)
    filename = Column(String(255), nullable=False)

    __table_args__ = (
        Index("ix_report_exports_user_time", "requested_by", "created_at"),
    )

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<ReportExport type={self.export_type} period={self.period} "
            f"rows={self.row_count} by={self.requested_by}>"
        )
