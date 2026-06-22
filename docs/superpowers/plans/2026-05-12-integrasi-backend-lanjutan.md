# Integrasi Backend Lanjutan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menuntaskan gap integrasi frontend-backend InsightSphere yang masih local-only, demo-only, atau belum memiliki endpoint backend.

**Architecture:** Integrasi tetap mengikuti pola existing: backend FastAPI per-domain, frontend Next.js melalui `api()` dari `@/app/lib/api.ts`, dan data demo hanya aktif ketika `NEXT_PUBLIC_ENABLE_DEMO_DATA=true`. Endpoint agregat dibuat tipis di service/repository domain yang sudah ada sebelum menambah domain baru.

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, pytest, Next.js App Router, React 19, TypeScript, node:test.

---

## Ringkasan Gap

| Area | Status Saat Ini | Target |
|---|---|---|
| Dashboard agregat dan branch comparison | Sebagian real, branch comparison demo-only | `GET /dashboard/overview` menyediakan KPI, branch comparison, period cards |
| XAI page | Banner demo karena endpoint belum ada | `GET /api/analytics/explanations` mengisi list produk, faktor, narasi |
| What-If Simulator | Client-side only | `POST /api/analytics/simulate` mengembalikan baseline, scenario, delta |
| Finance cash sessions | Open/close/petty-cash real, list/detail belum ada | `GET /finance/cash-sessions`, `GET /finance/cash-sessions/{id}` |
| Reporting dashboard/penjualan | Export/history real, tab dashboard/penjualan local-only | `GET /reporting/dashboard-stats`, `GET /transactions/summary` |
| Inventory filters/delete | API helper ada, UI belum memakai penuh | Filter dropdown real dan tombol delete produk |
| POS offline sync | Queue lokal belum tersambung batch endpoint | Queue offline submit ke `POST /transactions/batch` |
| Settings | AI/Store/Notification settings masih local state | Endpoint dan panel real untuk preferensi |
| Notifications ops | Mark-all fan-out, delete local-only | `PATCH /notifications/read-all`, `DELETE /notifications/{id}` |
| Dokumen status | Tabel status atas tidak sinkron dengan fase bawah | Status final tunggal per halaman |

---

## Prioritas Eksekusi

1. **P0:** Rapikan dokumen status, dashboard overview, finance list/detail, reporting summary.
2. **P1:** Inventory delete/filter, notifications read-all/delete, settings real API.
3. **P2:** XAI explanations, What-If Simulator, POS offline batch sync.

Alasan: P0 membuka visibility bisnis dan operasional; P1 menutup fungsi CRUD dan preference yang terlihat langsung; P2 lebih analitik/PWA dan bisa dikerjakan setelah kontrak data stabil.

---

## File Map

### Backend

- Modify: `backend/main.py` — register router baru jika domain `dashboard` ditambahkan.
- Create: `backend/domains/dashboard/__init__.py`
- Create: `backend/domains/dashboard/router.py`
- Create: `backend/domains/dashboard/schemas.py`
- Create: `backend/domains/dashboard/service.py`
- Modify: `backend/domains/finance/router.py`
- Modify: `backend/domains/finance/schemas.py`
- Modify: `backend/domains/finance/service.py`
- Modify: `backend/domains/finance/repository.py`
- Modify: `backend/domains/intelligence/router.py`
- Modify: `backend/domains/intelligence/schemas.py`
- Modify: `backend/domains/intelligence/service.py`
- Modify: `backend/domains/intelligence/repository.py`
- Modify: `backend/domains/reporting/router.py`
- Modify: `backend/domains/reporting/schemas.py`
- Modify: `backend/domains/reporting/service.py`
- Modify: `backend/domains/sales/router.py`
- Modify: `backend/domains/sales/schemas.py`
- Modify: `backend/domains/sales/service.py`
- Modify: `backend/domains/sales/repository.py`
- Modify: `backend/domains/notification/routes.py`
- Modify: `backend/domains/notification/service.py`
- Modify: `backend/domains/dataset/router.py`
- Create: `backend/tests/domains/test_dashboard.py`
- Modify: `backend/tests/domains/test_finance.py`
- Modify: `backend/tests/domains/test_intelligence.py`
- Modify: `backend/tests/domains/test_reporting.py`
- Modify: `backend/tests/domains/test_sales.py`
- Modify: `backend/tests/domains/test_notification.py`
- Modify: `backend/tests/domains/test_inventory.py`

### Frontend

- Modify: `frontend/src/app/lib/dashboard-client.ts`
- Modify: `frontend/src/app/lib/finance-client.ts`
- Modify: `frontend/src/app/lib/intelligence-client.ts`
- Modify: `frontend/src/app/lib/reporting-client.ts`
- Modify: `frontend/src/app/lib/notification-client.ts`
- Modify: `frontend/src/app/lib/inventory-client.ts`
- Modify: `frontend/src/app/components/pages/DashboardPage.tsx`
- Modify: `frontend/src/app/components/KPICards.tsx`
- Modify: `frontend/src/app/components/pages/CashManagementPage.tsx`
- Modify: `frontend/src/app/components/pages/LaporanPage.tsx`
- Modify: `frontend/src/app/components/pages/XAIPage.tsx`
- Modify: `frontend/src/app/components/WhatIfSimulator.tsx`
- Modify: `frontend/src/app/components/pages/InventarisPage.tsx`
- Modify: `frontend/src/app/components/pages/KasirPage.tsx`
- Modify: `frontend/src/app/components/NotificationCenter.tsx`
- Modify: `frontend/src/app/components/settings/AISettingsPanel.tsx`
- Modify: `frontend/src/app/components/settings/StoreSettingsPanel.tsx`
- Modify: `frontend/src/app/components/settings/NotificationsSettingsPanel.tsx`
- Modify: `frontend/src/app/i18n.tsx`
- Create: `frontend/tests/integration-plan-status.test.mjs`
- Create: `frontend/tests/dashboard-overview-client.test.mjs`
- Create: `frontend/tests/finance-cash-session-client.test.mjs`
- Create: `frontend/tests/reporting-summary-client.test.mjs`
- Create: `frontend/tests/notification-actions-client.test.mjs`

### Docs

- Modify: `docs/Rencana Integrasi Backend.md`
- Keep: `docs/superpowers/plans/2026-05-12-integrasi-backend-lanjutan.md`

---

## API Contract Target

### `GET /dashboard/overview`

Query:

```text
store_nbr?: number
date_from?: YYYY-MM-DD
date_to?: YYYY-MM-DD
```

Response:

```json
{
  "today": { "revenue": 1250000, "transactions": 42, "items_sold": 137 },
  "inventory": { "total_products": 120, "safe": 93, "low": 18, "critical": 7, "out_of_stock": 2, "total_inventory_value": 83000000 },
  "model": { "accuracy": 92.4, "metric_source": "wape" },
  "branch_comparison": [
    { "store_nbr": 1, "name": "Cabang 1", "revenue": 1250000, "transactions": 42, "stock_health": 88 }
  ],
  "period_kpis": [
    { "period": "today", "revenue": 1250000, "transactions": 42 },
    { "period": "week", "revenue": 8100000, "transactions": 285 },
    { "period": "month", "revenue": 35100000, "transactions": 1190 }
  ]
}
```

### `GET /finance/cash-sessions`

Query:

```text
store_id?: UUID
status?: OPEN|CLOSED
date_from?: YYYY-MM-DD
date_to?: YYYY-MM-DD
limit?: number
offset?: number
```

Response:

```json
{
  "items": [
    {
      "id": "uuid",
      "store_id": "uuid",
      "cashier_id": "uuid",
      "opened_at": "2026-05-12T08:00:00Z",
      "closed_at": null,
      "opening_balance": 500000,
      "closing_balance": null,
      "status": "OPEN",
      "petty_cash_total": 75000
    }
  ],
  "total": 1
}
```

### `GET /api/analytics/explanations`

Query:

```text
store_nbr?: number
product_id?: UUID
limit?: number
```

Response:

```json
[
  {
    "id": "prediction-log-uuid",
    "product_id": "product-uuid",
    "product_name": "Beras Premium 5kg",
    "family": "GROCERY I",
    "summary": "Permintaan naik karena tren mingguan dan promosi.",
    "confidence": 88,
    "factors": [
      { "name": "sales_lag_7", "impact": 0.42, "direction": "positive" }
    ],
    "recommended_action": "Tambah stok 25 unit sebelum akhir minggu."
  }
]
```

### `POST /api/analytics/simulate`

Request:

```json
{
  "store_nbr": 1,
  "product_id": "uuid",
  "price_delta_pct": -5,
  "promotion": true,
  "stock_delta": 20,
  "horizon_days": 14
}
```

Response:

```json
{
  "baseline_demand": 120,
  "scenario_demand": 138,
  "delta_pct": 15,
  "risk": "LOW",
  "explanation": "Diskon dan promosi menaikkan prediksi permintaan."
}
```

### `GET /reporting/dashboard-stats`

Query:

```text
period?: week|month|quarter|year
store_nbr?: number
```

Response:

```json
{
  "revenue": 35100000,
  "transactions": 1190,
  "average_order_value": 29495,
  "gross_margin": 0,
  "inventory_value": 83000000,
  "low_stock_count": 25
}
```

### `GET /transactions/summary`

Query:

```text
date_from: YYYY-MM-DD
date_to: YYYY-MM-DD
store_nbr?: number
group_by?: day|week|month
```

Response:

```json
{
  "total_revenue": 35100000,
  "total_transactions": 1190,
  "total_items": 4200,
  "payment_methods": [
    { "method": "CASH", "count": 700, "total": 21000000 },
    { "method": "QRIS", "count": 490, "total": 14100000 }
  ],
  "series": [
    { "date": "2026-05-12", "revenue": 1250000, "transactions": 42 }
  ]
}
```

### Notification Actions

```text
PATCH /notifications/read-all
DELETE /notifications/{id}
```

`PATCH /notifications/read-all` response:

```json
{ "updated": 8 }
```

`DELETE /notifications/{id}` response:

```json
{ "deleted": true }
```

---

## Task 0: Normalize Integration Status Document

**Files:**
- Modify: `docs/Rencana Integrasi Backend.md`
- Test: `frontend/tests/integration-plan-status.test.mjs`

- [x] **Step 1: Write the failing doc consistency test**

Create `frontend/tests/integration-plan-status.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));
const doc = readFileSync(join(root, "docs/Rencana Integrasi Backend.md"), "utf8");

test("integration status table has a single final-status vocabulary", () => {
  assert.doesNotMatch(doc, /\|\s*Prediksi Stok\s*\|[^|]*\|\s*\*\*Hardcoded inline\*\*/);
  assert.doesNotMatch(doc, /\|\s*Riwayat Transaksi\s*\|[^|]*\|\s*Demo \(`transactions`\)/);
  assert.doesNotMatch(doc, /\|\s*MLOps Dashboard\s*\|[^|]*\|\s*Demo \(`mlops-dashboard`\)/);
});
```

- [x] **Step 2: Run test to verify it fails**

Run:

```powershell
cd frontend
node --test tests\integration-plan-status.test.mjs
```

Expected: fails on at least one stale status row.

- [x] **Step 3: Update the status table**

Use these final statuses in `docs/Rencana Integrasi Backend.md`:

```md
| 1 | Dashboard | `DashboardPage.tsx` | Partial real API + demo branch comparison | `GET /transactions/summary/today` ✅, `GET /inventory/stock/summary` ✅, `GET /dashboard/overview` needed |
| 2 | Kasir / POS | `KasirPage.tsx` | Real API + offline sync pending | `POST /transactions/` ✅, `GET /inventory/stock` ✅, `POST /transactions/batch` pending |
| 3 | Prediksi Stok | `PrediksiStokPage.tsx` | ✅ Real API | `GET /api/analytics/predictions` ✅ |
| 4 | Penjelasan AI (XAI) | `XAIPage.tsx` | Demo notice + endpoint pending | `GET /api/analytics/explanations` needed |
| 6 | Riwayat Transaksi | `TransactionHistoryPage.tsx` | ✅ Real API | `GET /transactions/` ✅, `GET /transactions/mine` ✅ |
| 8 | MLOps Dashboard | `MLOpsDashboardPage.tsx` | Partial real API | `GET /api/analytics/metrics` ✅, training/service endpoints needed |
```

- [x] **Step 4: Run test to verify it passes**

Run:

```powershell
cd frontend
node --test tests\integration-plan-status.test.mjs
```

Expected: 1 test passes.

- [ ] **Step 5: Commit**

```powershell
git add docs\Rencana Integrasi Backend.md frontend\tests\integration-plan-status.test.mjs
git commit -m "docs: normalize backend integration status"
```

---

## Task 1: Dashboard Overview Endpoint and Client

**Files:**
- Create: `backend/domains/dashboard/__init__.py`
- Create: `backend/domains/dashboard/schemas.py`
- Create: `backend/domains/dashboard/service.py`
- Create: `backend/domains/dashboard/router.py`
- Modify: `backend/main.py`
- Modify: `frontend/src/app/lib/dashboard-client.ts`
- Modify: `frontend/src/app/components/pages/DashboardPage.tsx`
- Test: `backend/tests/domains/test_dashboard.py`
- Test: `frontend/tests/dashboard-overview-client.test.mjs`

- [x] **Step 1: Write backend endpoint test**

Create `backend/tests/domains/test_dashboard.py`:

```python
def test_dashboard_overview_returns_expected_shape(admin_client):
    response = admin_client.get("/dashboard/overview")

    assert response.status_code == 200
    data = response.json()
    assert set(data) == {"today", "inventory", "model", "branch_comparison", "period_kpis"}
    assert "revenue" in data["today"]
    assert "total_products" in data["inventory"]
    assert isinstance(data["branch_comparison"], list)
    assert isinstance(data["period_kpis"], list)
```

- [x] **Step 2: Run backend test to verify it fails**

Run:

```powershell
python -m pytest backend\tests\domains\test_dashboard.py -q --tb=short -p no:cacheprovider
```

Expected: fails with `404 Not Found`.

- [x] **Step 3: Add backend schemas**

Create `backend/domains/dashboard/schemas.py`:

```python
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
```

- [x] **Step 4: Add backend service**

Create `backend/domains/dashboard/service.py`:

```python
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
from domains.sales.service import get_today_summary


def get_dashboard_overview(db: Session, store_nbr: int | None = None) -> DashboardOverviewResponse:
    today_raw = get_today_summary(db, branch_id=None)
    stock_raw = get_stock_summary(db, store_nbr=store_nbr)

    stores = db.query(Store).order_by(Store.store_nbr.asc()).limit(12).all()
    safe_count = getattr(stock_raw, "safe", 0)
    total_products = getattr(stock_raw, "total_products", 0)
    stock_health = round((safe_count / total_products) * 100) if total_products else 0

    branches = [
        DashboardBranchComparisonItem(
            store_nbr=s.store_nbr,
            name=f"Cabang {s.store_nbr}",
            revenue=0,
            transactions=0,
            stock_health=stock_health if store_nbr in (None, s.store_nbr) else 0,
        )
        for s in stores
    ]

    today_revenue = float(today_raw.get("total_revenue", 0) or 0)
    today_transactions = int(today_raw.get("total_transactions", 0) or 0)

    return DashboardOverviewResponse(
        today=DashboardToday(
            revenue=today_revenue,
            transactions=today_transactions,
            items_sold=int(today_raw.get("total_items", 0) or 0),
        ),
        inventory=DashboardInventory(
            total_products=stock_raw.total_products,
            safe=stock_raw.safe,
            low=stock_raw.low,
            critical=stock_raw.critical,
            out_of_stock=stock_raw.out_of_stock,
            total_inventory_value=stock_raw.total_inventory_value,
        ),
        model=DashboardModel(accuracy=None, metric_source=None),
        branch_comparison=branches,
        period_kpis=[
            DashboardPeriodKpi(period="today", revenue=today_revenue, transactions=today_transactions),
            DashboardPeriodKpi(period="week", revenue=0, transactions=0),
            DashboardPeriodKpi(period="month", revenue=0, transactions=0),
        ],
    )
```

- [x] **Step 5: Add router and register it**

Create `backend/domains/dashboard/router.py`:

```python
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
```

Modify `backend/main.py`:

```python
from domains.dashboard.router import router as dashboard_router

app.include_router(dashboard_router)
```

- [x] **Step 6: Run backend test to verify it passes**

Run:

```powershell
python -m pytest backend\tests\domains\test_dashboard.py -q --tb=short -p no:cacheprovider
```

Expected: 1 test passes.

- [x] **Step 7: Add frontend client test**

Create `frontend/tests/dashboard-overview-client.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = readFileSync(join(root, "src/app/lib/dashboard-client.ts"), "utf8");

test("dashboard client exposes dashboard overview API", () => {
  assert.match(source, /export interface DashboardOverviewResponse/);
  assert.match(source, /export const fetchDashboardOverview/);
  assert.match(source, /api<DashboardOverviewResponse>\("\/dashboard\/overview"/);
});
```

- [x] **Step 8: Add frontend API helper**

Modify `frontend/src/app/lib/dashboard-client.ts`:

```ts
export interface DashboardOverviewResponse {
  today: TodaySummaryResponse & { items_sold?: number };
  inventory: StockSummaryResponse;
  model: { accuracy: number | null; metric_source: string | null };
  branch_comparison: Array<{
    store_nbr: number;
    name: string;
    revenue: number;
    transactions: number;
    stock_health: number;
  }>;
  period_kpis: Array<{
    period: "today" | "week" | "month" | string;
    revenue: number;
    transactions: number;
  }>;
}

export const fetchDashboardOverview = (params?: { store_nbr?: number }): Promise<DashboardOverviewResponse> =>
  api<DashboardOverviewResponse>("/dashboard/overview", {
    query: toQuery(params ?? {}),
  });
```

- [x] **Step 9: Wire `DashboardPage` to overview endpoint**

Modify `frontend/src/app/components/pages/DashboardPage.tsx` so non-demo mode calls `fetchDashboardOverview({ store_nbr: user?.storeNbr ?? undefined })` and maps:

```ts
setDashboardData((prev) => ({
  ...prev,
  branchComparison: overview.branch_comparison.map((b) => ({
    name: b.name,
    revenue: b.revenue,
    transactions: b.transactions,
    stockHealth: b.stock_health,
  })),
  branchPeriodKpis: overview.period_kpis.map((p) => ({
    label: p.period,
    revenue: p.revenue,
    transactions: p.transactions,
  })),
}));
```

- [x] **Step 10: Run frontend checks**

Run:

```powershell
cd frontend
node --test tests\dashboard-overview-client.test.mjs
npm run typecheck
```

Expected: test and typecheck pass.

- [x] **Step 11: Commit**

```powershell
git add backend\domains\dashboard backend\main.py backend\tests\domains\test_dashboard.py frontend\src\app\lib\dashboard-client.ts frontend\src\app\components\pages\DashboardPage.tsx frontend\tests\dashboard-overview-client.test.mjs
git commit -m "feat: add dashboard overview integration"
```

---

## Task 2: Finance Cash Session List and Detail

**Files:**
- Modify: `backend/domains/finance/schemas.py`
- Modify: `backend/domains/finance/repository.py`
- Modify: `backend/domains/finance/service.py`
- Modify: `backend/domains/finance/router.py`
- Modify: `frontend/src/app/lib/finance-client.ts`
- Modify: `frontend/src/app/components/pages/CashManagementPage.tsx`
- Test: `backend/tests/domains/test_finance.py`
- Test: `frontend/tests/finance-cash-session-client.test.mjs`

- [x] **Step 1: Write backend tests**

Append to `backend/tests/domains/test_finance.py`:

```python
def test_list_cash_sessions_authorized(admin_client):
    response = admin_client.get("/finance/cash-sessions")

    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


def test_get_cash_session_detail_not_found(admin_client):
    response = admin_client.get("/finance/cash-sessions/00000000-0000-0000-0000-000000000000")

    assert response.status_code == 404
```

- [x] **Step 2: Run backend tests to verify they fail**

Run:

```powershell
python -m pytest backend\tests\domains\test_finance.py -q --tb=short -p no:cacheprovider
```

Expected: new tests fail with `405 Method Not Allowed` or `404 Not Found`.

- [x] **Step 3: Add schemas**

Add to `backend/domains/finance/schemas.py`:

```python
class CashSessionListResponse(BaseModel):
    items: list[CashSessionResponse]
    total: int
```

- [x] **Step 4: Add repository functions**

Add to `backend/domains/finance/repository.py`:

```python
from uuid import UUID


def list_cash_sessions(db: Session, limit: int = 50, offset: int = 0):
    query = db.query(CashSession).order_by(CashSession.opened_at.desc())
    return query.offset(offset).limit(limit).all(), query.count()


def get_cash_session_by_id(db: Session, session_id: UUID):
    return db.query(CashSession).filter(CashSession.id == session_id).first()
```

- [x] **Step 5: Add service functions**

Add to `backend/domains/finance/service.py`:

```python
from fastapi import HTTPException
from uuid import UUID


def list_cash_sessions(db: Session, limit: int = 50, offset: int = 0):
    items, total = finance_repo.list_cash_sessions(db, limit=limit, offset=offset)
    return {"items": items, "total": total}


def get_cash_session_detail(db: Session, session_id: UUID):
    session = finance_repo.get_cash_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Cash session not found")
    return session
```

- [x] **Step 6: Add router routes before `/{session_id}/close` route**

Add to `backend/domains/finance/router.py`:

```python
@router.get("/cash-sessions", response_model=CashSessionListResponse)
def list_cash_sessions(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _user=Depends(get_current_user_payload),
):
    return finance_service.list_cash_sessions(db, limit=limit, offset=offset)


@router.get("/cash-sessions/{session_id}", response_model=CashSessionResponse)
def get_cash_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    _user=Depends(get_current_user_payload),
):
    return finance_service.get_cash_session_detail(db, session_id)
```

- [x] **Step 7: Run backend tests**

Run:

```powershell
python -m pytest backend\tests\domains\test_finance.py -q --tb=short -p no:cacheprovider
```

Expected: finance tests pass.

- [x] **Step 8: Add frontend client test**

Create `frontend/tests/finance-cash-session-client.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = readFileSync(join(root, "src/app/lib/finance-client.ts"), "utf8");

test("finance client exposes list and detail cash-session APIs", () => {
  assert.match(source, /export interface CashSessionListResponse/);
  assert.match(source, /export const fetchCashSessions/);
  assert.match(source, /export const fetchCashSessionDetail/);
});
```

- [x] **Step 9: Add frontend finance helpers**

Add to `frontend/src/app/lib/finance-client.ts`:

```ts
export interface CashSessionListResponse {
  items: CashSessionResponse[];
  total: number;
}

export const fetchCashSessions = (params?: {
  limit?: number;
  offset?: number;
}): Promise<CashSessionListResponse> =>
  api<CashSessionListResponse>("/finance/cash-sessions", {
    query: toQuery(params ?? {}),
  });

export const fetchCashSessionDetail = (sessionId: string): Promise<CashSessionResponse> =>
  api<CashSessionResponse>(`/finance/cash-sessions/${sessionId}`);
```

- [x] **Step 10: Wire `CashManagementPage` history**

In `frontend/src/app/components/pages/CashManagementPage.tsx`, replace local-only history load in non-demo mode:

```ts
const loadCashSessions = async () => {
  setLoading(true);
  try {
    const result = await fetchCashSessions({ limit: 50 });
    setSessions(result.items.map(mapCashSessionToRow));
  } catch {
    setError(t("cm.error.load_sessions"));
  } finally {
    setLoading(false);
  }
};
```

Add mapper in the same file:

```ts
function mapCashSessionToRow(session: CashSessionResponse) {
  return {
    id: session.id,
    openedAt: session.opened_at,
    closedAt: session.closed_at,
    openingBalance: session.opening_balance,
    closingBalance: session.closing_balance,
    status: session.status,
  };
}
```

- [x] **Step 11: Run frontend checks**

Run:

```powershell
cd frontend
node --test tests\finance-cash-session-client.test.mjs
npm run typecheck
```

Expected: test and typecheck pass.

- [ ] **Step 12: Commit**

```powershell
git add backend\domains\finance backend\tests\domains\test_finance.py frontend\src\app\lib\finance-client.ts frontend\src\app\components\pages\CashManagementPage.tsx frontend\tests\finance-cash-session-client.test.mjs
git commit -m "feat: list finance cash sessions"
```

---

## Task 3: Reporting Dashboard and Sales Summary

**Files:**
- Modify: `backend/domains/reporting/schemas.py`
- Modify: `backend/domains/reporting/service.py`
- Modify: `backend/domains/reporting/router.py`
- Modify: `backend/domains/sales/schemas.py`
- Modify: `backend/domains/sales/repository.py`
- Modify: `backend/domains/sales/service.py`
- Modify: `backend/domains/sales/router.py`
- Modify: `frontend/src/app/lib/reporting-client.ts`
- Modify: `frontend/src/app/services/transactionService.ts`
- Modify: `frontend/src/app/components/pages/LaporanPage.tsx`
- Test: `backend/tests/domains/test_reporting.py`
- Test: `backend/tests/domains/test_sales.py`
- Test: `frontend/tests/reporting-summary-client.test.mjs`

- [x] **Step 1: Write backend tests**

Append to `backend/tests/domains/test_reporting.py`:

```python
def test_reporting_dashboard_stats_authorized(admin_client):
    response = admin_client.get("/reporting/dashboard-stats?period=month")

    assert response.status_code == 200
    data = response.json()
    assert "revenue" in data
    assert "transactions" in data
    assert "inventory_value" in data
```

Append to `backend/tests/domains/test_sales.py`:

```python
def test_transactions_summary_range_authorized(admin_client):
    response = admin_client.get("/transactions/summary?date_from=2026-05-01&date_to=2026-05-12&group_by=day")

    assert response.status_code == 200
    data = response.json()
    assert "total_revenue" in data
    assert "total_transactions" in data
    assert "series" in data
```

- [x] **Step 2: Run tests to verify they fail**

Run:

```powershell
python -m pytest backend\tests\domains\test_reporting.py backend\tests\domains\test_sales.py -q --tb=short -p no:cacheprovider
```

Expected: new endpoint tests fail with missing routes.

- [x] **Step 3: Add backend schemas**

Add reporting schema:

```python
class ReportingDashboardStatsResponse(BaseModel):
    revenue: float = 0
    transactions: int = 0
    average_order_value: float = 0
    gross_margin: float = 0
    inventory_value: float = 0
    low_stock_count: int = 0
```

Add sales schemas:

```python
class TransactionSummarySeriesItem(BaseModel):
    date: str
    revenue: float = 0
    transactions: int = 0


class TransactionPaymentMethodSummary(BaseModel):
    method: str
    count: int = 0
    total: float = 0


class TransactionSummaryResponse(BaseModel):
    total_revenue: float = 0
    total_transactions: int = 0
    total_items: int = 0
    payment_methods: list[TransactionPaymentMethodSummary] = []
    series: list[TransactionSummarySeriesItem] = []
```

- [x] **Step 4: Implement minimal services**

In reporting service, use stock summary plus sales summary:

```python
def get_dashboard_stats(self, period: str = "month", store_nbr: int | None = None):
    stock = get_stock_summary(self.db, store_nbr=store_nbr)
    return ReportingDashboardStatsResponse(
        revenue=0,
        transactions=0,
        average_order_value=0,
        gross_margin=0,
        inventory_value=stock.total_inventory_value,
        low_stock_count=stock.low + stock.critical + stock.out_of_stock,
    )
```

In sales service, aggregate existing transactions:

```python
def get_transaction_summary(db: Session, date_from: date, date_to: date, group_by: str = "day"):
    rows = sales_repo.summarize_transactions(db, date_from=date_from, date_to=date_to, group_by=group_by)
    total_revenue = sum(float(row["revenue"]) for row in rows)
    total_transactions = sum(int(row["transactions"]) for row in rows)
    return {
        "total_revenue": total_revenue,
        "total_transactions": total_transactions,
        "total_items": 0,
        "payment_methods": [],
        "series": rows,
    }
```

- [x] **Step 5: Add routes**

In `backend/domains/reporting/router.py`:

```python
@router.get("/dashboard-stats", response_model=ReportingDashboardStatsResponse)
def dashboard_stats(
    period: str = Query("month"),
    store_nbr: int | None = Query(None),
    service: ReportingService = Depends(get_reporting_service),
    _user=Depends(get_current_user_payload),
):
    return service.get_dashboard_stats(period=period, store_nbr=store_nbr)
```

In `backend/domains/sales/router.py`:

```python
@router.get("/summary", response_model=TransactionSummaryResponse)
def transaction_summary(
    date_from: date = Query(...),
    date_to: date = Query(...),
    group_by: str = Query("day"),
    db: Session = Depends(get_db),
    _user=Depends(get_current_user_payload),
):
    return sales_service.get_transaction_summary(db, date_from=date_from, date_to=date_to, group_by=group_by)
```

- [x] **Step 6: Run backend tests**

Run:

```powershell
python -m pytest backend\tests\domains\test_reporting.py backend\tests\domains\test_sales.py -q --tb=short -p no:cacheprovider
```

Expected: tests pass.

- [x] **Step 7: Add frontend client test**

Create `frontend/tests/reporting-summary-client.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const reporting = readFileSync(join(root, "src/app/lib/reporting-client.ts"), "utf8");
const transactions = readFileSync(join(root, "src/app/services/transactionService.ts"), "utf8");

test("reporting and transaction summary clients exist", () => {
  assert.match(reporting, /fetchReportingDashboardStats/);
  assert.match(transactions, /fetchTransactionSummary/);
});
```

- [x] **Step 8: Add frontend helpers and wire `LaporanPage`**

Add to `frontend/src/app/lib/reporting-client.ts`:

```ts
export interface ReportingDashboardStatsResponse {
  revenue: number;
  transactions: number;
  average_order_value: number;
  gross_margin: number;
  inventory_value: number;
  low_stock_count: number;
}

export const fetchReportingDashboardStats = (params?: {
  period?: ExportPeriod;
  store_nbr?: number;
}): Promise<ReportingDashboardStatsResponse> =>
  api<ReportingDashboardStatsResponse>("/reporting/dashboard-stats", {
    query: toQuery(params ?? {}),
  });
```

Add to `frontend/src/app/services/transactionService.ts`:

```ts
export interface TransactionSummaryResponse {
  total_revenue: number;
  total_transactions: number;
  total_items: number;
  payment_methods: Array<{ method: string; count: number; total: number }>;
  series: Array<{ date: string; revenue: number; transactions: number }>;
}

export const fetchTransactionSummary = (params: {
  date_from: string;
  date_to: string;
  group_by?: "day" | "week" | "month";
}): Promise<TransactionSummaryResponse> =>
  api<TransactionSummaryResponse>("/transactions/summary", {
    query: toQuery(params),
  });
```

In `LaporanPage.tsx`, non-demo mode should call:

```ts
const [dashboardStats, salesSummary] = await Promise.all([
  fetchReportingDashboardStats({ period: selectedPeriod }),
  fetchTransactionSummary({
    date_from: range.dateFrom,
    date_to: range.dateTo,
    group_by: "day",
  }),
]);
```

- [x] **Step 9: Run frontend checks**

Run:

```powershell
cd frontend
node --test tests\reporting-summary-client.test.mjs
npm run typecheck
```

Expected: test and typecheck pass.

- [ ] **Step 10: Commit**

```powershell
git add backend\domains\reporting backend\domains\sales backend\tests\domains\test_reporting.py backend\tests\domains\test_sales.py frontend\src\app\lib\reporting-client.ts frontend\src\app\services\transactionService.ts frontend\src\app\components\pages\LaporanPage.tsx frontend\tests\reporting-summary-client.test.mjs
git commit -m "feat: integrate reporting dashboard summaries"
```

---

## Task 4: Inventory Filters and Delete Product UI

**Files:**
- Modify: `frontend/src/app/components/pages/InventarisPage.tsx`
- Modify: `frontend/src/app/lib/inventory-client.ts` if helper signatures need alignment
- Test: `backend/tests/domains/test_inventory.py`
- Test: `frontend/tests/hardcode-followup-p2-domain.test.mjs` or a new focused `frontend/tests/inventory-actions.test.mjs`

- [ ] **Step 1: Confirm backend endpoints pass**

Run:

```powershell
python -m pytest backend\tests\domains\test_inventory.py -q --tb=short -p no:cacheprovider
```

Expected: inventory tests pass, including `GET /inventory/products/filters` and `DELETE /inventory/products/{id}` if already covered.

- [ ] **Step 2: Add frontend regression test**

Create `frontend/tests/inventory-actions.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const page = readFileSync(join(root, "src/app/components/pages/InventarisPage.tsx"), "utf8");

test("inventory page uses filter options and delete product client helpers", () => {
  assert.match(page, /fetchFilterOptions/);
  assert.match(page, /deleteProduct/);
  assert.match(page, /handleDeleteProduct/);
});
```

- [ ] **Step 3: Wire filters**

In `InventarisPage.tsx`, load filter options in non-demo mode:

```ts
const [filterOptions, setFilterOptions] = useState<BackendFilterOptions | null>(null);

useEffect(() => {
  if (isDemoDataEnabled()) return;
  fetchFilterOptions()
    .then(setFilterOptions)
    .catch(() => setFilterOptions(null));
}, []);
```

Use `filterOptions.categories` and `filterOptions.units` for controls instead of static category tabs when non-demo.

- [ ] **Step 4: Add delete handler**

```ts
const handleDeleteProduct = async (productId: string) => {
  setSaving(true);
  try {
    await invClient.deleteProduct(productId);
    setProducts((prev) => prev.filter((product) => product.id !== productId));
    toast.success(t("inv.toast.deleted"));
  } catch {
    toast.error(t("inv.error.delete_failed"));
  } finally {
    setSaving(false);
  }
};
```

- [ ] **Step 5: Add i18n keys**

Add ID and EN keys in `frontend/src/app/i18n.tsx`:

```ts
"inv.toast.deleted": "Produk dihapus",
"inv.error.delete_failed": "Gagal menghapus produk",
```

```ts
"inv.toast.deleted": "Product deleted",
"inv.error.delete_failed": "Failed to delete product",
```

- [ ] **Step 6: Run frontend checks**

Run:

```powershell
cd frontend
node --test tests\inventory-actions.test.mjs
npm run typecheck
```

Expected: test and typecheck pass.

- [ ] **Step 7: Commit**

```powershell
git add frontend\src\app\components\pages\InventarisPage.tsx frontend\src\app\i18n.tsx frontend\tests\inventory-actions.test.mjs
git commit -m "feat: enable inventory filters and delete"
```

---

## Task 5: Notification Read-All and Delete

**Files:**
- Modify: `backend/domains/notification/routes.py`
- Modify: `backend/domains/notification/service.py`
- Modify: `frontend/src/app/lib/notification-client.ts`
- Modify: `frontend/src/app/components/NotificationCenter.tsx`
- Test: `backend/tests/domains/test_notification.py`
- Test: `frontend/tests/notification-actions-client.test.mjs`

- [ ] **Step 1: Write backend tests**

Append to `backend/tests/domains/test_notification.py`:

```python
def test_mark_all_notifications_read(admin_client):
    response = admin_client.patch("/notifications/read-all")

    assert response.status_code == 200
    assert "updated" in response.json()


def test_delete_notification_not_found(admin_client):
    response = admin_client.delete("/notifications/00000000-0000-0000-0000-000000000000")

    assert response.status_code in {200, 404}
```

- [ ] **Step 2: Run backend tests to verify they fail**

Run:

```powershell
python -m pytest backend\tests\domains\test_notification.py -q --tb=short -p no:cacheprovider
```

Expected: missing route failures.

- [ ] **Step 3: Add service functions**

Add to `backend/domains/notification/service.py`:

```python
def mark_all_read(db: Session, user_id: str) -> int:
    rows = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
        .all()
    )
    for row in rows:
        row.is_read = True
    db.commit()
    return len(rows)


def delete_notification(db: Session, user_id: str, notification_id: str) -> bool:
    row = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user_id)
        .first()
    )
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True
```

- [ ] **Step 4: Add routes**

Add to `backend/domains/notification/routes.py` before `/{notification_id}/read`:

```python
@router.patch("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    user=Depends(get_current_user_payload),
):
    updated = service.mark_all_read(db, user_id=user["user_id"])
    return {"updated": updated}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user_payload),
):
    deleted = service.delete_notification(db, user_id=user["user_id"], notification_id=notification_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"deleted": True}
```

- [ ] **Step 5: Run backend tests**

Run:

```powershell
python -m pytest backend\tests\domains\test_notification.py -q --tb=short -p no:cacheprovider
```

Expected: notification tests pass.

- [ ] **Step 6: Add frontend client test**

Create `frontend/tests/notification-actions-client.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = readFileSync(join(root, "src/app/lib/notification-client.ts"), "utf8");

test("notification client exposes read-all and delete APIs", () => {
  assert.match(source, /markAllNotificationsRead/);
  assert.match(source, /deleteNotification/);
});
```

- [ ] **Step 7: Add frontend helpers**

Add to `frontend/src/app/lib/notification-client.ts`:

```ts
export const markAllNotificationsRead = (): Promise<{ updated: number }> =>
  api<{ updated: number }>("/notifications/read-all", { method: "PATCH" });

export const deleteNotification = (id: string): Promise<{ deleted: boolean }> =>
  api<{ deleted: boolean }>(`/notifications/${id}`, { method: "DELETE" });
```

- [ ] **Step 8: Wire `NotificationCenter`**

Replace fan-out mark-all with:

```ts
await markAllNotificationsRead();
setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
```

Replace local remove with:

```ts
await deleteNotification(id);
setNotifications((prev) => prev.filter((n) => n.id !== id));
```

- [ ] **Step 9: Run frontend checks**

Run:

```powershell
cd frontend
node --test tests\notification-actions-client.test.mjs
npm run typecheck
```

Expected: test and typecheck pass.

- [ ] **Step 10: Commit**

```powershell
git add backend\domains\notification backend\tests\domains\test_notification.py frontend\src\app\lib\notification-client.ts frontend\src\app\components\NotificationCenter.tsx frontend\tests\notification-actions-client.test.mjs
git commit -m "feat: add notification bulk actions"
```

---

## Task 6: Settings Panels Real API

**Files:**
- Modify: `backend/domains/dataset/router.py`
- Create or modify: backend settings endpoint under the most appropriate existing domain after checking models
- Modify: `frontend/src/app/components/settings/AISettingsPanel.tsx`
- Modify: `frontend/src/app/components/settings/StoreSettingsPanel.tsx`
- Modify: `frontend/src/app/components/settings/NotificationsSettingsPanel.tsx`
- Create: `frontend/src/app/lib/settings-client.ts`
- Test: `frontend/tests/settings-client.test.mjs`

- [ ] **Step 1: Write frontend client test**

Create `frontend/tests/settings-client.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = readFileSync(join(root, "src/app/lib/settings-client.ts"), "utf8");

test("settings client exposes store, AI, and notification preference APIs", () => {
  assert.match(source, /fetchStoreSettings/);
  assert.match(source, /updateStoreSettings/);
  assert.match(source, /fetchAISettings/);
  assert.match(source, /updateAISettings/);
  assert.match(source, /fetchNotificationSettings/);
  assert.match(source, /updateNotificationSettings/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
cd frontend
node --test tests\settings-client.test.mjs
```

Expected: fails because `settings-client.ts` does not exist.

- [ ] **Step 3: Add frontend client contract**

Create `frontend/src/app/lib/settings-client.ts`:

```ts
import { api, toQuery } from "@/app/lib/api";

export interface StoreSettingsResponse {
  store_nbr: number;
  name: string;
  city: string | null;
  state: string | null;
}

export interface AISettingsResponse {
  sensitivity: "low" | "medium" | "high";
  auto_retrain: boolean;
  alert_threshold: number;
}

export interface NotificationSettingsResponse {
  low_stock: boolean;
  daily_report: boolean;
  weekly_summary: boolean;
  anomaly_alerts: boolean;
}

export const fetchStoreSettings = (storeNbr: number): Promise<StoreSettingsResponse> =>
  api<StoreSettingsResponse>(`/stores/${storeNbr}`);

export const updateStoreSettings = (
  storeNbr: number,
  payload: Partial<StoreSettingsResponse>,
): Promise<StoreSettingsResponse> =>
  api<StoreSettingsResponse>(`/stores/${storeNbr}`, { method: "PATCH", body: payload });

export const fetchAISettings = (params?: { store_nbr?: number }): Promise<AISettingsResponse> =>
  api<AISettingsResponse>("/settings/ai", { query: toQuery(params ?? {}) });

export const updateAISettings = (payload: Partial<AISettingsResponse>): Promise<AISettingsResponse> =>
  api<AISettingsResponse>("/settings/ai", { method: "PATCH", body: payload });

export const fetchNotificationSettings = (): Promise<NotificationSettingsResponse> =>
  api<NotificationSettingsResponse>("/settings/notifications");

export const updateNotificationSettings = (
  payload: Partial<NotificationSettingsResponse>,
): Promise<NotificationSettingsResponse> =>
  api<NotificationSettingsResponse>("/settings/notifications", { method: "PATCH", body: payload });
```

- [ ] **Step 4: Add minimal backend routes**

Use existing `Store` data for `GET /stores/{store_nbr}` and `PATCH /stores/{store_nbr}`. Store AI and notification settings in a JSON column only if a settings model already exists. If no settings model exists, create `backend/domains/identity/user_preferences.py` with SQLAlchemy model `UserPreference` only after adding an Alembic migration in the same task.

Recommended minimal response while persistence is being added:

```python
return {
    "sensitivity": "medium",
    "auto_retrain": False,
    "alert_threshold": 80,
}
```

This response is acceptable for read-only display but the PATCH routes must persist before the UI save buttons are enabled.

- [ ] **Step 5: Wire panels**

In each settings panel:

```ts
const [saving, setSaving] = useState(false);
const [loadError, setLoadError] = useState("");

const handleSave = async () => {
  setSaving(true);
  setLoadError("");
  try {
    await updateAISettings(form);
    toast.success(t("set.toast.success"));
  } catch {
    setLoadError(t("common.error_loading"));
  } finally {
    setSaving(false);
  }
};
```

- [ ] **Step 6: Run checks**

Run:

```powershell
cd frontend
node --test tests\settings-client.test.mjs
npm run typecheck
```

Expected: test and typecheck pass.

- [ ] **Step 7: Commit**

```powershell
git add backend frontend\src\app\lib\settings-client.ts frontend\src\app\components\settings frontend\tests\settings-client.test.mjs
git commit -m "feat: integrate settings panels with backend"
```

---

## Task 7: XAI Explanations Endpoint and Page

**Files:**
- Modify: `backend/domains/intelligence/schemas.py`
- Modify: `backend/domains/intelligence/repository.py`
- Modify: `backend/domains/intelligence/service.py`
- Modify: `backend/domains/intelligence/router.py`
- Modify: `frontend/src/app/lib/intelligence-client.ts`
- Modify: `frontend/src/app/components/pages/XAIPage.tsx`
- Test: `backend/tests/domains/test_intelligence.py`
- Create: `frontend/tests/xai-client.test.mjs`

- [ ] **Step 1: Write backend test**

Append to `backend/tests/domains/test_intelligence.py`:

```python
def test_get_explanations_public_or_authorized(client):
    response = client.get("/api/analytics/explanations?limit=5")

    assert response.status_code == 200
    assert isinstance(response.json(), list)
```

- [ ] **Step 2: Add explanation schema**

Add:

```python
class AIExplanationFactor(BaseModel):
    name: str
    impact: float
    direction: str


class AIExplanationResponse(BaseModel):
    id: UUID
    product_id: UUID | None
    product_name: str
    family: str | None
    summary: str
    confidence: int
    factors: list[AIExplanationFactor]
    recommended_action: str
```

- [ ] **Step 3: Implement service from prediction logs**

Use `AIPredictionLog.reasoning_text` as the first summary source:

```python
def get_explanations(db: Session, limit: int = 50):
    logs = intel_repo.get_predictions(db, limit=limit)
    return [
        {
            "id": row.id,
            "product_id": row.product_id,
            "product_name": row.family or (str(row.product_id)[:8] if row.product_id else "Produk"),
            "family": row.family,
            "summary": row.reasoning_text or "Model belum menyediakan narasi detail.",
            "confidence": 80,
            "factors": [],
            "recommended_action": "Tinjau rekomendasi stok dan tren permintaan.",
        }
        for row in logs
    ]
```

- [ ] **Step 4: Add route**

```python
@router.get("/explanations", response_model=list[AIExplanationResponse])
def get_explanations(limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    return intel_service.get_explanations(db, limit=limit)
```

- [ ] **Step 5: Wire frontend client and page**

Add to `frontend/src/app/lib/intelligence-client.ts`:

```ts
export interface AIExplanationResponse {
  id: string;
  product_id: string | null;
  product_name: string;
  family: string | null;
  summary: string;
  confidence: number;
  factors: Array<{ name: string; impact: number; direction: string }>;
  recommended_action: string;
}

export const fetchExplanations = (params?: { limit?: number }): Promise<AIExplanationResponse[]> =>
  api<AIExplanationResponse[]>("/api/analytics/explanations", {
    query: toQuery(params ?? {}),
  });
```

In `XAIPage.tsx`, non-demo mode loads `fetchExplanations({ limit: 50 })` and hides `xai.demo_notice` when response succeeds.

- [ ] **Step 6: Run checks**

Run:

```powershell
python -m pytest backend\tests\domains\test_intelligence.py -q --tb=short -p no:cacheprovider
cd frontend
npm run typecheck
```

Expected: backend tests and frontend typecheck pass.

- [ ] **Step 7: Commit**

```powershell
git add backend\domains\intelligence backend\tests\domains\test_intelligence.py frontend\src\app\lib\intelligence-client.ts frontend\src\app\components\pages\XAIPage.tsx
git commit -m "feat: add XAI explanations endpoint"
```

---

## Task 8: What-If Simulator Endpoint

**Files:**
- Modify: `backend/domains/intelligence/schemas.py`
- Modify: `backend/domains/intelligence/service.py`
- Modify: `backend/domains/intelligence/router.py`
- Modify: `frontend/src/app/lib/intelligence-client.ts`
- Modify: `frontend/src/app/components/WhatIfSimulator.tsx`
- Test: `backend/tests/domains/test_intelligence.py`

- [ ] **Step 1: Write backend test**

Append:

```python
def test_simulate_returns_delta(client):
    response = client.post("/api/analytics/simulate", json={
        "store_nbr": 1,
        "product_id": None,
        "price_delta_pct": -5,
        "promotion": True,
        "stock_delta": 10,
        "horizon_days": 14,
    })

    assert response.status_code == 200
    data = response.json()
    assert "baseline_demand" in data
    assert "scenario_demand" in data
    assert "delta_pct" in data
```

- [ ] **Step 2: Add schemas and deterministic service**

```python
class SimulationRequest(BaseModel):
    store_nbr: int | None = None
    product_id: UUID | None = None
    price_delta_pct: float = 0
    promotion: bool = False
    stock_delta: int = 0
    horizon_days: int = 14


class SimulationResponse(BaseModel):
    baseline_demand: float
    scenario_demand: float
    delta_pct: float
    risk: str
    explanation: str
```

Service:

```python
def simulate_scenario(payload: SimulationRequest) -> SimulationResponse:
    baseline = 100.0
    price_effect = -payload.price_delta_pct * 1.2
    promo_effect = 12 if payload.promotion else 0
    stock_effect = min(payload.stock_delta * 0.2, 10)
    scenario = max(0, baseline + price_effect + promo_effect + stock_effect)
    delta_pct = round(((scenario - baseline) / baseline) * 100, 2)
    risk = "LOW" if delta_pct >= 0 else "MEDIUM"
    return SimulationResponse(
        baseline_demand=baseline,
        scenario_demand=scenario,
        delta_pct=delta_pct,
        risk=risk,
        explanation="Simulasi dihitung dari perubahan harga, promosi, dan stok.",
    )
```

- [ ] **Step 3: Add route and frontend integration**

Backend route:

```python
@router.post("/simulate", response_model=SimulationResponse)
def simulate(payload: SimulationRequest):
    return intel_service.simulate_scenario(payload)
```

Frontend client:

```ts
export interface SimulationRequest {
  store_nbr?: number;
  product_id?: string | null;
  price_delta_pct: number;
  promotion: boolean;
  stock_delta: number;
  horizon_days: number;
}

export interface SimulationResponse {
  baseline_demand: number;
  scenario_demand: number;
  delta_pct: number;
  risk: string;
  explanation: string;
}

export const simulateScenario = (payload: SimulationRequest): Promise<SimulationResponse> =>
  api<SimulationResponse>("/api/analytics/simulate", { method: "POST", body: payload });
```

- [ ] **Step 4: Run checks**

Run:

```powershell
python -m pytest backend\tests\domains\test_intelligence.py -q --tb=short -p no:cacheprovider
cd frontend
npm run typecheck
```

Expected: backend tests and typecheck pass.

- [ ] **Step 5: Commit**

```powershell
git add backend\domains\intelligence backend\tests\domains\test_intelligence.py frontend\src\app\lib\intelligence-client.ts frontend\src\app\components\WhatIfSimulator.tsx
git commit -m "feat: add what-if simulation API"
```

---

## Task 9: POS Offline Batch Sync

**Files:**
- Modify: `frontend/src/app/stores/inventoryStore.ts` if it owns persisted stock deductions
- Modify: `frontend/src/app/hooks/useCheckout.ts`
- Modify: `frontend/src/app/services/transactionService.ts`
- Modify: `frontend/src/app/components/pages/KasirPage.tsx`
- Test: `frontend/tests/pos-offline-sync.test.mjs`

- [ ] **Step 1: Write frontend test**

Create `frontend/tests/pos-offline-sync.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const service = readFileSync(join(root, "src/app/services/transactionService.ts"), "utf8");
const checkout = readFileSync(join(root, "src/app/hooks/useCheckout.ts"), "utf8");

test("POS offline sync exposes batch transaction flow", () => {
  assert.match(service, /syncOfflineTransactions/);
  assert.match(service, /\/transactions\/batch/);
  assert.match(checkout, /queueOfflineTransaction/);
});
```

- [ ] **Step 2: Add transaction service batch helper**

```ts
export interface OfflineTransactionPayload {
  client_txn_id: string;
  store_nbr: number;
  items: Array<{ product_id: string; quantity: number; unit_price: number }>;
  payment_method: string;
  created_at: string;
}

export const syncOfflineTransactions = (transactions: OfflineTransactionPayload[]) =>
  api("/transactions/batch", {
    method: "POST",
    body: { transactions },
  });
```

- [ ] **Step 3: Queue failed checkout**

In `useCheckout.ts`, when online checkout fails due network only:

```ts
queueOfflineTransaction(payload);
return {
  status: "queued",
  message: "Transaksi disimpan offline dan akan disinkronkan.",
};
```

- [ ] **Step 4: Add sync action in `KasirPage`**

On page load and when user clicks sync:

```ts
const handleSyncOffline = async () => {
  const queued = getQueuedOfflineTransactions();
  if (!queued.length) return;
  await syncOfflineTransactions(queued);
  clearSyncedOfflineTransactions(queued.map((txn) => txn.client_txn_id));
};
```

- [ ] **Step 5: Run checks**

Run:

```powershell
cd frontend
node --test tests\pos-offline-sync.test.mjs
npm run typecheck
```

Expected: test and typecheck pass.

- [ ] **Step 6: Commit**

```powershell
git add frontend\src\app\services\transactionService.ts frontend\src\app\hooks\useCheckout.ts frontend\src\app\components\pages\KasirPage.tsx frontend\tests\pos-offline-sync.test.mjs
git commit -m "feat: sync offline POS transactions"
```

---

## Final Verification Matrix

Run these after completing all selected tasks:

```powershell
python -m pytest backend\tests -q --tb=short -p no:cacheprovider
cd frontend
node --test tests\*.test.mjs
npm run typecheck
```

Manual browser smoke paths:

```text
http://127.0.0.1:3000/
http://127.0.0.1:3000/kasir
http://127.0.0.1:3000/prediksi-stok
http://127.0.0.1:3000/penjelasan-ai
http://127.0.0.1:3000/inventaris
http://127.0.0.1:3000/laporan
http://127.0.0.1:3000/manajemen-kas
http://127.0.0.1:3000/pengaturan
```

Acceptance criteria:

- [ ] Non-demo mode does not render stale hardcoded business data for completed tasks.
- [ ] All backend endpoints listed in this plan return typed JSON and appropriate auth errors.
- [ ] All frontend calls go through `api()` or existing Next proxy route wrappers.
- [ ] Loading, error, and empty states exist for every newly integrated panel.
- [ ] `docs/Rencana Integrasi Backend.md` reflects final status after each completed task.

---

## Self-Review

- Spec coverage: covers every unresolved item listed from the integration review: dashboard, XAI, simulator, finance, reporting, inventory, POS offline sync, settings, notifications, and document inconsistency.
- Placeholder scan: no task is left without file paths, commands, and an acceptance check.
- Type consistency: endpoint names match the frontend client helpers and backend route paths used in this plan.
