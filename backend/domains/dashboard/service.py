from datetime import datetime, timezone

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from domains.dashboard.schemas import (
    DashboardBranchComparisonItem,
    DashboardInventory,
    DashboardModel,
    DashboardOverviewResponse,
    DashboardPeriodKpi,
    DashboardToday,
)
from domains.dataset.models import Store
from domains.inventory.service import get_stock_summary
from domains.sales.models import Transaction, TransactionItem
from domains.sales.service import get_today_summary


def _get_today_items_sold(db: Session, branch_id=None) -> int:
    today_date = datetime.now(timezone.utc).date()
    query = (
        db.query(func.sum(TransactionItem.quantity))
        .join(Transaction, TransactionItem.transaction_id == Transaction.id)
        .filter(Transaction.date == today_date)
    )
    if branch_id is not None:
        query = query.filter(Transaction.branch_id == branch_id)
    total = query.scalar()
    return int(total or 0)


def _stock_health_percent(safe_count: int, total_products: int) -> int:
    if total_products <= 0:
        return 0
    return round((safe_count / total_products) * 100)


def _get_store_branch_id(db: Session, store_nbr: int | None):
    if store_nbr is None:
        return None
    store = db.query(Store).filter(Store.store_nbr == store_nbr).first()
    return store.id if store else None


def _get_branch_comparison(db: Session, stock_health: int, store_nbr: int | None = None):
    today_date = datetime.now(timezone.utc).date()
    query = (
        db.query(
            Store.store_nbr.label("store_nbr"),
            func.coalesce(func.count(Transaction.id), 0).label("transactions"),
            func.coalesce(func.sum(Transaction.total_amount), 0).label("revenue"),
        )
        .outerjoin(
            Transaction,
            and_(
                Transaction.branch_id == Store.id,
                Transaction.date == today_date,
            ),
        )
        .group_by(Store.id, Store.store_nbr)
        .order_by(Store.store_nbr.asc())
    )
    if store_nbr is not None:
        query = query.filter(Store.store_nbr == store_nbr)

    return [
        DashboardBranchComparisonItem(
            store_nbr=row.store_nbr,
            name=f"Cabang {row.store_nbr}",
            revenue=float(row.revenue or 0),
            transactions=int(row.transactions or 0),
            stock_health=stock_health,
        )
        for row in query.limit(12).all()
    ]


def get_dashboard_overview(db: Session, store_nbr: int | None = None) -> DashboardOverviewResponse:
    branch_id = _get_store_branch_id(db, store_nbr)
    today_raw = get_today_summary(db, branch_id=branch_id)
    stock_raw = get_stock_summary(db, store_nbr=store_nbr)

    today_revenue = float(today_raw.get("total_revenue", 0) or 0)
    today_transactions = int(today_raw.get("total_transactions", 0) or 0)
    stock_health = _stock_health_percent(stock_raw.safe, stock_raw.total_products)

    return DashboardOverviewResponse(
        today=DashboardToday(
            revenue=today_revenue,
            transactions=today_transactions,
            items_sold=_get_today_items_sold(db, branch_id=branch_id),
        ),
        inventory=DashboardInventory(
            total_products=stock_raw.total_products,
            safe=stock_raw.safe,
            low=stock_raw.low,
            critical=stock_raw.critical,
            overstock=stock_raw.overstock,
            out_of_stock=stock_raw.out_of_stock,
            total_inventory_value=stock_raw.total_inventory_value,
        ),
        model=DashboardModel(accuracy=None, metric_source=None),
        branch_comparison=_get_branch_comparison(db, stock_health=stock_health, store_nbr=store_nbr),
        period_kpis=[
            DashboardPeriodKpi(period="today", revenue=today_revenue, transactions=today_transactions),
            DashboardPeriodKpi(period="week", revenue=0, transactions=0),
            DashboardPeriodKpi(period="month", revenue=0, transactions=0),
        ],
    )
