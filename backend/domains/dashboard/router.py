from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user_payload
from domains.dashboard.schemas import DashboardOverviewResponse
from domains.dashboard.service import get_dashboard_overview

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/overview", response_model=DashboardOverviewResponse)
def dashboard_overview(
    store_nbr: int | None = Query(None),
    db: Session = Depends(get_db),
    _user=Depends(get_current_user_payload),
):
    return get_dashboard_overview(db, store_nbr=store_nbr)
