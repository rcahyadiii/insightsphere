"""Domain Reporting — Pydantic schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from domains.reporting.models import ExportType, ExportFormat, ExportPeriod


# ============================================================
# REQUEST
# ============================================================

class ExportRequest(BaseModel):
    """Body untuk POST /reporting/export."""
    export_type: ExportType = Field(..., description="Jenis data yang diekspor")
    period: ExportPeriod = Field(default=ExportPeriod.MONTH, description="Window waktu")
    export_format: ExportFormat = Field(default=ExportFormat.CSV, description="Format file output")
    store_nbr: Optional[int] = Field(
        default=None,
        description="Filter cabang. Owner/admin boleh None (semua cabang). "
                    "Cashier dipaksa ke store_nbr-nya sendiri di service layer.",
    )


# ============================================================
# RESPONSE
# ============================================================

class TemplateInfo(BaseModel):
    """Metadata 1 export template (untuk dropdown UI)."""
    export_type: ExportType
    label: str
    description: str
    columns: List[str]


class ReportingDashboardStatsResponse(BaseModel):
    revenue: float = 0
    transactions: int = 0
    average_order_value: float = 0
    gross_margin: float = 0
    inventory_value: float = 0
    low_stock_count: int = 0


class ExportHistoryItem(BaseModel):
    """1 baris audit log generation."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    requested_by: Optional[UUID] = None
    export_type: ExportType
    export_format: ExportFormat
    period: ExportPeriod
    store_nbr: Optional[int] = None
    row_count: int
    filename: str
    created_at: datetime
