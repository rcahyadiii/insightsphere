from pydantic import BaseModel


class DashboardToday(BaseModel):
    revenue: float = 0
    transactions: int = 0
    items_sold: int = 0


class DashboardInventory(BaseModel):
    total_products: int = 0
    safe: int = 0
    low: int = 0
    critical: int = 0
    overstock: int = 0
    out_of_stock: int = 0
    total_inventory_value: float = 0


class DashboardModel(BaseModel):
    accuracy: float | None = None
    metric_source: str | None = None


class DashboardBranchComparisonItem(BaseModel):
    store_nbr: int
    name: str
    revenue: float = 0
    transactions: int = 0
    stock_health: int = 0


class DashboardPeriodKpi(BaseModel):
    period: str
    revenue: float = 0
    transactions: int = 0


class DashboardOverviewResponse(BaseModel):
    today: DashboardToday
    inventory: DashboardInventory
    model: DashboardModel
    branch_comparison: list[DashboardBranchComparisonItem]
    period_kpis: list[DashboardPeriodKpi]
