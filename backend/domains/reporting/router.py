"""
Domain Reporting — HTTP Router.

Endpoint:
    GET    /reporting/templates    Metadata 4 export type (untuk dropdown UI)
    POST   /reporting/export       Generate & stream file (CSV/XLSX)
    GET    /reporting/history      Audit log export sebelumnya
"""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user, get_current_user_payload, require_owner_or_admin
from domains.identity.constants import ADMIN_OWNER_ROLES, ROLE_CASHIER
from domains.identity.models import User
from domains.reporting.schemas import (
    ExportHistoryItem, ExportRequest, ReportingDashboardStatsResponse, TemplateInfo,
)
from domains.reporting.service import ReportingService, media_type_for

router = APIRouter(prefix="/reporting", tags=["Reporting"])


# DI factory — kelola Session per-request, hindari circular import.
def get_reporting_service(db: Session = Depends(get_db)) -> ReportingService:
    return ReportingService(db)


@router.get(
    "/templates",
    response_model=List[TemplateInfo],
    summary="List metadata export template (untuk dropdown UI)",
)
def list_templates(
    _: User = Depends(get_current_user),
    service: ReportingService = Depends(get_reporting_service),
):
    return service.list_templates()


@router.get(
    "/dashboard-stats",
    response_model=ReportingDashboardStatsResponse,
    summary="Ringkasan KPI dashboard reporting",
)
def dashboard_stats(
    period: str = Query("month", pattern="^(week|month|quarter|year)$"),
    store_nbr: Optional[int] = Query(None),
    service: ReportingService = Depends(get_reporting_service),
    _user=Depends(get_current_user_payload),
):
    return service.get_dashboard_stats(period=period, store_nbr=store_nbr)


@router.post(
    "/export",
    summary="Generate dan download report (CSV/XLSX)",
    response_class=StreamingResponse,
)
def generate_export(
    payload: ExportRequest,
    current_user: User = Depends(get_current_user),
    service: ReportingService = Depends(get_reporting_service),
):
    """
    Generate report on-demand dan stream file ke client.

    **Aturan akses store_nbr**:
    - admin / owner: boleh kosongkan (semua cabang) atau pilih spesifik.
    - cashier: dipaksa ke `store_nbr` miliknya (override input).
    """
    # Enforce branch scoping untuk cashier
    effective_store_nbr: Optional[int] = payload.store_nbr
    if current_user.role == ROLE_CASHIER:
        effective_store_nbr = current_user.store_nbr

    buf, filename, row_count = service.generate_export(
        export_type=payload.export_type,
        period=payload.period,
        export_format=payload.export_format,
        requested_by=current_user.id,
        store_nbr=effective_store_nbr,
    )

    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type=media_type_for(payload.export_format),
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Row-Count": str(row_count),
        },
    )


@router.get(
    "/history",
    response_model=List[ExportHistoryItem],
    summary="Riwayat export — admin/owner lihat semua, user lain lihat miliknya",
)
def list_history(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    service: ReportingService = Depends(get_reporting_service),
):
    # admin & owner lihat semua history; role lain hanya miliknya sendiri
    requested_by = None if current_user.role in ADMIN_OWNER_ROLES else current_user.id
    return service.list_export_history(requested_by=requested_by, limit=limit)
