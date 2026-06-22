# Rencana Integrasi Frontend ↔ Backend

Dokumen acuan untuk menghubungkan setiap halaman frontend dengan endpoint backend yang sesungguhnya, menggantikan data demo/mock.

> **Prinsip Utama**:
> - Semua panggilan backend lewat `api()` dari `@/app/lib/api.ts` → otomatis melalui proxy `/api/backend/[...path]` dengan cookie auth.
> - Data demo hanya aktif jika `NEXT_PUBLIC_ENABLE_DEMO_DATA=true`. Integrasi real menambahkan `else` branch yang memanggil API.
> - Integrasi dilakukan **per-domain**, bukan per-halaman, agar satu domain tuntas sebelum pindah.

---

## Status Saat Ini

### Data Source per Halaman

| # | Halaman | File | Data Source | Backend Endpoint |
|---|---|---|---|---|
| 1 | Dashboard | `DashboardPage.tsx` | ✅ Real API (overview endpoint) | `GET /dashboard/overview` ✅, `GET /transactions/summary/today` ✅, `GET /inventory/stock/summary` ✅ |
| 2 | Kasir / POS | `KasirPage.tsx` | Real API + offline sync pending | `POST /transactions/` ✅, `GET /inventory/stock` ✅, `POST /transactions/batch` pending |
| 3 | Prediksi Stok | `PrediksiStokPage.tsx` | ✅ Real API | `GET /api/analytics/predictions` ✅ |
| 4 | Penjelasan AI (XAI) | `XAIPage.tsx` | Demo notice + endpoint pending | `GET /api/analytics/explanations` needed |
| 5 | Inventaris | `InventarisPage.tsx` | ✅ Real API | `GET /inventory/stock` ✅, `GET /inventory/stock/summary` ✅, `POST /inventory/products` ✅, `PUT /inventory/products/{id}` ✅ |
| 6 | Riwayat Transaksi | `TransactionHistoryPage.tsx` | ✅ Real API | `GET /transactions/` ✅, `GET /transactions/mine` ✅ |
| 7 | Laporan | `LaporanPage.tsx` | Partial real API + local summary tabs | `GET /reporting/templates` ✅, `POST /reporting/export` ✅, `GET /reporting/history` ✅, aggregate endpoints needed |
| 8 | MLOps Dashboard | `MLOpsDashboardPage.tsx` | Partial real API | `GET /api/analytics/metrics` ✅, training/service endpoints needed |
| 9 | Manajemen Kas | `CashManagementPage.tsx` | ✅ Real API (cash sessions) | `GET /finance/cash-sessions` ✅, `GET /finance/cash-sessions/{id}` ✅, `POST /finance/cash-sessions/open` ✅, `PUT /finance/cash-sessions/{id}/close` ✅, `POST /finance/cash-sessions/petty-cash` ✅ |
| 10 | Pergerakan Stok | `StockMovementPage.tsx` | ✅ Real API (submit) | `POST /inventory/stock/movement` ✅, SKU→inventory_id lookup via `GET /inventory/stock` |
| 11 | Manajemen Pengguna | `UserManagementPage.tsx` | ✅ Real API (admin/owner) | `GET /auth/users` ✅, `PATCH /auth/users/{id}` ✅, `DELETE /auth/users/{id}` ✅, `POST /auth/invite-user` ✅ |
| 12 | Profil | `UserProfilePage.tsx` | ✅ Real API + AuthContext | `GET /auth/me` ✅, `PATCH /auth/me` ✅ |
| 13 | Pengaturan | `PengaturanPage.tsx` | Sub-panel masing² | Beragam (lihat detail) |

### Settings Panels

| Panel | File | Data Source | Backend |
|---|---|---|---|
| Profile | `ProfileSettingsPanel.tsx` | ✅ Real (`AuthContext` + `PATCH /auth/me`) | `GET /auth/me` ✅, `PATCH /auth/me` ✅ |
| Security (2FA) | `SecuritySettingsPanel.tsx` | ✅ Real API 2FA + PIN + login history | `POST /auth/2fa/setup/*` ✅, `POST /auth/change-password` ✅, `GET /auth/login-history` ✅ |
| Access | `AccessSettingsPanel.tsx` | ✅ Real (`GET /auth/users` admin/owner) | `GET /auth/users` ✅ |
| Notifications | `NotificationsSettingsPanel.tsx` | Local state | `GET /notifications` ✅ |
| AI Settings | `AISettingsPanel.tsx` | Local state | ❌ Belum ada backend |
| Store | `StoreSettingsPanel.tsx` | Local state | `GET /stores/` ✅ |
| Logout | `LogoutSettingsPanel.tsx` | AuthContext | `GET /auth/login-history` ✅ |

---

## Fase Integrasi

### Fase 1 — Auth & User Identity ⭐ PRIORITAS TERTINGGI

**Tujuan**: Semua komponen yang menampilkan user info baca dari `AuthContext`/API, bukan hardcode.

| Task | Detail | Status |
|---|---|---|
| 1.1 | `ProfileSettingsPanel` → baca dari `AuthContext.user` + `/auth/me` | ✅ Selesai |
| 1.2 | `AccessSettingsPanel` → panggil `GET /auth/users` (ganti array hardcode) | ✅ Selesai |
| 1.3 | `SecuritySettingsPanel` → hubungkan form 2FA ke `POST /auth/2fa/setup/init` → `verify` | ✅ Selesai |
| 1.4 | `SecuritySettingsPanel` → hubungkan "Ubah PIN" ke `POST /auth/change-password` | ✅ Selesai |
| 1.5 | `SecuritySettingsPanel` login history → `GET /auth/login-history` | ✅ Selesai |
| 1.6 | `UserProfilePage` → baca profil dari `AuthContext` + `updateMe` | ✅ Selesai |
| 1.7 | Sidebar avatar/name/role → pastikan baca dari `AuthContext` (bukan hardcode) | ✅ Sudah dilakukan sesi sebelumnya |
| 1.8 | ~~Accept Invite flow~~ | ✅ Selesai |

**Backend yang ditambah pada Fase 1:**
- `PATCH /auth/me` ✅ — user update profil sendiri (full_name, email, phone, position, avatar_url)
- Proxy routes Next.js: `GET /api/auth/login-history`, `POST /api/auth/2fa/setup/init`, `POST /api/auth/2fa/setup/verify`, `POST /api/auth/2fa/disable`, `POST /api/auth/change-password`, `GET /api/auth/users` ✅

---

### Fase 2 — User Management

**Tujuan**: Halaman admin kelola user terhubung penuh ke backend.

| Task | Detail | Status |
|---|---|---|
| 2.1 | `UserManagementPage` → `GET /auth/users` untuk list | ✅ Selesai |
| 2.2 | Form "Undang User" → `POST /auth/invite-user` (invite flow) | ✅ Selesai |
| 2.3 | Edit user → `PATCH /auth/users/{id}` | ✅ Selesai |
| 2.4 | Deactivate user → `DELETE /auth/users/{id}` (soft-delete) | ✅ Selesai |
| 2.5 | Reactivate user → via edit modal `{is_active: true}` di `PATCH /auth/users/{id}` | ✅ Selesai |
| 2.6 | Role label `inventory_manager` → sudah pakai `t("um.role.inventory_manager")` | ✅ Selesai |

**Proxy routes ditambah:**
- `PATCH /api/auth/users/[id]` ✅
- `DELETE /api/auth/users/[id]` ✅
- `POST /api/auth/invite-user` ✅

---

### Fase 3 — Inventory & Stock

**Tujuan**: Inventaris, stok, dan pergerakan stok baca data real.

| Task | Detail | Status |
|---|---|---|
| 3.1 | `InventarisPage` → `GET /inventory/stock` untuk list + `GET /inventory/stock/summary` | ✅ Selesai |
| 3.2 | Filter dropdown → `GET /inventory/products/filters` | ⬜ (UI filter masih category tabs) |
| 3.3 | Tambah produk → `POST /inventory/products` via `ProductForm` | ✅ Selesai |
| 3.4 | Edit produk → `PUT /inventory/products/{id}` via `ProductForm` | ✅ Selesai |
| 3.5 | Hapus produk → `DELETE /inventory/products/{id}` (soft-delete) | ⬜ (tidak ada tombol delete di UI) |
| 3.6 | `StockMovementPage` → `POST /inventory/stock/movement` | ✅ Selesai |
| 3.7 | Stock summary card → `GET /inventory/stock/summary` | ✅ Selesai |

**Library baru:** `src/app/lib/inventory-client.ts` — typed API helpers untuk semua inventory endpoints.
**`ProductForm.tsx`** — ditambah field `sku` + `family` (add mode), `supplier`; `onSubmit` bisa async.

---

### Fase 4 — Sales & Transactions

**Tujuan**: POS dan riwayat transaksi terhubung ke backend.

| Task | Detail | Status |
|---|---|---|
| 4.1 | `KasirPage` — produk catalog dari `GET /inventory/stock` via `useProducts` + `productService` | ✅ Sudah ada sebelum Fase 4 |
| 4.2 | `KasirPage` — checkout via `POST /transactions/` via `useCheckout` + `transactionService` | ✅ Sudah ada sebelum Fase 4 |
| 4.3 | `KasirPage` — offline batch sync via `POST /transactions/batch` | ⬜ (PWA phase) |
| 4.4 | `TransactionHistoryPage` → `GET /transactions/` (admin/owner) + `GET /transactions/mine` (kasir) | ✅ Selesai |
| 4.5 | `TransactionHistoryPage` date range filter → `date_from`/`date_to` ke backend | ✅ Selesai |
| 4.6 | Detail modal: graceful fallback saat items kosong dari API | ✅ Selesai |

**Files diupdate:**
- `types/pos.ts` — `TransactionResponse` diperluas: `branch_id, date, time, payment_method, cashier_id, client_txn_id`
- `services/transactionService.ts` — tambah `fetchTransactions()` + `fetchMyTransactions()` dengan `date_from`/`date_to` params
- `TransactionHistoryPage.tsx` — real API fetch berdasarkan role user, `computeDateRange()` → backend query params, loading/error banners, no_items fallback di detail modal
- `i18n.tsx` — key baru: `txn.detail.no_items` (ID + EN)

---

### Fase 5 — Finance / Cash Management

**Tujuan**: Manajemen kas terhubung ke backend finance.

| Task | Detail | Status |
|---|---|---|
| 5.1 | Buka shift → `POST /finance/cash-sessions/open` | ✅ Selesai |
| 5.2 | Tutup shift → `PUT /finance/cash-sessions/{id}/close` | ✅ Selesai |
| 5.3 | Petty cash → `POST /finance/cash-sessions/petty-cash` (expense entries saat shift aktif) | ✅ Selesai |
| 5.4 | List/detail cash sessions dari backend → `GET /finance/cash-sessions`, `GET /finance/cash-sessions/{id}` | ✅ Selesai |

**Files diupdate:**
- `lib/finance-client.ts` *(baru)* — typed interfaces `CashSessionResponse`, `CashSessionListResponse`, `PettyCashResponse`; helpers `fetchCashSessions`, `fetchCashSessionDetail`, `openShift`, `closeShift`, `recordPettyCash`, `storeIdFromNbr`
- `CashManagementPage.tsx` — Shift Status Banner (emerald=aktif, slate=tidak aktif), non-demo history dari `fetchCashSessions()`, modal Buka Shift (opening balance), modal Tutup Shift (actual closing balance + info saldo awal), petty-cash API call untuk entri expense baru saat shift aktif, hapus fake setTimeout
- `i18n.tsx` — key `cm.shift.*` + `cm.error.load_sessions` (ID + EN)

**Catatan teknis:** `store_id` di backend tidak punya FK constraint ke tabel stores → kita generate deterministic pseudo-UUID dari `storeNbr` via `storeIdFromNbr()`. Backend menerima UUID apapun untuk field ini.

**Backend yang ditambah:**
- `GET /finance/cash-sessions` ✅ — list sesi kas
- `GET /finance/cash-sessions/{id}` ✅ — detail sesi kas

---

### Fase 6 — Intelligence / AI ✅ SELESAI

**Tujuan**: Prediksi stok dan XAI baca dari endpoint AI.

| Task | Detail | Status |
|---|---|---|
| 6.1 | `PrediksiStokPage` → `GET /api/analytics/predictions` (ganti hardcoded data) | ✅ Selesai |
| 6.2 | `MLOpsDashboardPage` → `GET /api/analytics/metrics` | ✅ Selesai |
| 6.3 | `XAIPage` → ❌ **Belum ada endpoint XAI di backend** (banner demo_notice ditambah) | ✅ Banner |
| 6.4 | What-If Simulator → ❌ **Belum ada endpoint simulasi** (tetap client-side) | ⬜ lokal-only |

**Files diupdate:**
- `lib/intelligence-client.ts` *(baru)* — typed interfaces `AIPredictionLogResponse`, `AIModelMetricResponse`; helpers `fetchPredictions`, `fetchModelMetrics`
- `PrediksiStokPage.tsx` — non-demo: fetch `GET /api/analytics/predictions` → map ke tabel + chart kategori; helper `mapApiPrediction()`; replace fake `handleUpdate` setTimeout → re-fetch API; loadError banner
- `MLOpsDashboardPage.tsx` — non-demo: fetch `GET /api/analytics/metrics` → helper `buildMlopsFromMetrics()` → populate `activeModelKpis` + `accuracyTimeline` + `modelVersions`; `featureImportance`/`trainingJobs`/`services` tetap kosong (endpoint tidak ada)
- `XAIPage.tsx` — banner amber `xai.demo_notice` saat non-demo mode
- `i18n.tsx` — 1 key baru: `xai.demo_notice` (ID + EN)

**Mapping notes:**
- `AIPredictionLogResponse.family` → nama/kategori produk (backend tidak return product_name)
- `AIPredictionLogResponse.recommended_stock` → forecast value; `horizon_days` menentukan 7d/14d
- `AIModelMetricResponse` rows di-pivot: `metric_name="accuracy"/"rmse"/"mape"` → `activeModelKpis`; group by date → `accuracyTimeline`; group by `model_name` → `modelVersions`

**Backend yang perlu ditambah (future):**
- `GET /api/analytics/explanations` — XAI reasoning per produk
- `POST /api/analytics/simulate` — What-If Simulator (opsional, bisa client-side)

---

### Fase 7 — Reporting & Export ✅ SELESAI

**Tujuan**: Laporan baca data real dan download file dari backend.

| Task | Detail | Status |
|---|---|---|
| 7.1 | `LaporanPage` tab "Unduh" → `GET /reporting/templates` + `POST /reporting/export` | ✅ Selesai |
| 7.2 | `LaporanPage` tab "Dashboard" charts → ❌ **Belum ada endpoint aggregat laporan** | ⬜ lokal-only |
| 7.3 | `LaporanPage` tab "Penjualan" → ❌ **Butuh endpoint aggregat penjualan per periode** | ⬜ lokal-only |
| 7.4 | `LaporanPage` tab "Inventaris" → bisa reuse `GET /inventory/stock/summary` | ⬜ |
| 7.5 | Riwayat export → `GET /reporting/history` | ✅ Selesai |

**Files diupdate:**
- `lib/reporting-client.ts` *(baru)* — typed interfaces `TemplateInfo`, `ExportHistoryItem`; types `ExportType`, `ExportFormat`, `ExportPeriod`; helpers `fetchReportTemplates`, `fetchExportHistory`, `exportReport`, `saveBlobAsFile`
- `LaporanPage.tsx` — tab "Unduh" fetch template/history dari backend di non-demo mode; selector periode (`week/month/quarter/year`); tombol export real CSV/XLSX; refresh history setelah export; header quick export CSV; loading/error/empty state; auto-report tetap UI local-only
- `i18n.tsx` — key baru `rep.period.*`, `rep.history.*`, `rep.export.*`, `rep.toast.exporting`, `rep.toast.downloaded`, `rep.error.*`, `rep.btn.download_csv`, `rep.tpl.columns`, `rep.tpl.demo_desc` (ID + EN)

**Catatan teknis:**
- `POST /reporting/export` mengembalikan `StreamingResponse`, sehingga client memakai `fetch()` langsung (bukan `ofetch api`) untuk membaca `Blob`, `Content-Disposition`, dan `X-Row-Count`.
- Backend hanya support `CSV` dan `XLSX`; UI lama PDF/XLS diganti ke CSV/XLSX.
- Tab Dashboard/Penjualan masih demo karena endpoint aggregat belum tersedia.

**Backend yang perlu ditambah:**
- `GET /reporting/dashboard-stats` — aggregat KPI untuk tab Dashboard
- `GET /transactions/summary` — aggregat penjualan per periode (daily/monthly)

---

### Fase 8 — Notifications ✅ SELESAI

**Tujuan**: Notifikasi real-time dari backend.

| Task | Detail | Status |
|---|---|---|
| 8.1 | `NotificationCenter` → `GET /notifications` | ✅ Selesai |
| 8.2 | Mark as read → `PATCH /notifications/{id}/read` | ✅ Selesai |
| 8.3 | Polling HTTP 30s (WebSocket ditunda, tidak ada WS route aktif) | ✅ Polling |

**Files diupdate:**
- `lib/notification-client.ts` *(baru)* — typed interfaces `NotificationRead`, `NotificationListResponse`; helpers `fetchNotifications`, `markNotificationRead`
- `NotificationCenter.tsx` — non-demo: initial fetch + 30s polling `GET /notifications`; helper mappers `mapPriority`, `mapCategory`, `relativeTime`, `mapApiNotification`; `markAllRead` fan-out PATCH per unread ID; `toggleRead` PATCH saat marking read; footer label "Live" vs "Polling"; demo behavior tidak berubah
- `i18n.tsx` — 1 key baru: `notif.live` (ID + EN)

**Mapping notes:**
- `category=INVENTORY + priority=CRITICAL/HIGH` → type `"kritis"`; lainnya → `"prediksi"`
- `category=AI_INSIGHT + priority=CRITICAL/HIGH` → `"anomali"`; lainnya → `"prediksi"`
- `category=SALES` → `"peluang"`; `category=SYSTEM` → `"sistem"`
- `priority=CRITICAL/HIGH` → urgency `"tinggi"`; `MEDIUM` → `"sedang"`; `LOW` → `"rendah"`
- Tidak ada endpoint DELETE — remove notif tetap local-only
- Tidak ada endpoint Mark-all-read — fan-out PATCH individual (best-effort)

---

### Fase 9 — Dashboard Aggregat ✅ SELESAI

**Tujuan**: Dashboard utama menampilkan data real.

| Task | Detail | Status |
|---|---|---|
| 9.1 | KPI cards → stock summary (health %, stockout count, inventory value) | ✅ Selesai |
| 9.2 | Branch comparison + period KPI → `GET /dashboard/overview` | ✅ Selesai |
| 9.3 | Stock alerts (LowStockAlert) → `GET /inventory/stock` filter LOW/CRITICAL | ✅ Selesai |
| 9.4 | Today's revenue → `GET /transactions/summary/today` | ✅ Selesai |

**Files diupdate:**
- `lib/dashboard-client.ts` *(baru)* — `DashboardOverviewResponse`, `StockSummaryResponse`, `TodaySummaryResponse`, `InventoryStockItem`; `fetchDashboardOverview`, `fetchStockSummary`, `fetchTodaySummary`, `fetchLowStockAlerts`
- `KPICards.tsx` — non-demo: fetch `/inventory/stock/summary` → real stockout count, stock health %, inventory value; card accuracy tetap static (belum ada endpoint)
- `LowStockAlert.tsx` — non-demo: fetch `/inventory/stock?limit=100` → filter `status=LOW/CRITICAL`; mapper `mapApiItem`
- `DashboardPage.tsx` — non-demo: `fetchDashboardOverview()` mengisi Today's Snapshot, KPI periode, branch comparison; `fetchModelMetrics` tetap dipakai untuk fallback `livePrecision` (WAPE → accuracy)
- `i18n.tsx` — 2 keys baru: `dash.live.revenue_today`, `dash.live.txn_today` (ID + EN)

**Technical notes:**
- `storeNbr` di-akses via `user?.storeNbr` (dari `useAuth().user`), bukan langsung dari context
- Precision widget: `livePrecision` override demo `precision` saat non-demo dan WAPE tersedia
- Branch comparison memakai agregasi sesi hari ini per store dari backend dashboard overview.

---

## Endpoint Backend yang Masih Perlu Ditambah

Ringkasan endpoint baru yang masih dibutuhkan untuk integrasi penuh:

| # | Endpoint | Domain | Kebutuhan |
|---|---|---|---|
| 1 | `GET /api/analytics/explanations` | Intelligence | XAI reasoning |
| 2 | `POST /api/analytics/simulate` | Intelligence | What-If Simulator |
| 3 | `GET /reporting/dashboard-stats` | Reporting | Aggregat KPI dashboard |
| 4 | `GET /transactions/summary` | Sales | Aggregat penjualan per periode |

---

## Navigation Role Matrix (Sesuai Desain Baru)

### Role: Admin (Tech Admin)
```
UTAMA:        Dashboard, Kasir/POS
ANALITIK:     Prediksi Stok, Penjelasan AI, MLOps Dashboard
LAPORAN:      Laporan
OPERASIONAL:  Inventaris, Pergerakan Stok, Manajemen Kas, Riwayat Transaksi
SISTEM:       Manajemen Pengguna, Log Aktivitas [BARU], Konfigurasi Toko [BARU]
```

### Role: Owner (Pemilik Toko)
```
UTAMA:        Dashboard
ANALITIK:     Prediksi Stok, Penjelasan AI
LAPORAN:      Laporan
OPERASIONAL:  Inventaris, Pergerakan Stok, Manajemen Kas, Riwayat Transaksi
```

### Role: Kepala Toko (inventory_manager)
```
UTAMA:        Dashboard, Kasir/POS
TIM:          Kelola Kasir [BARU], Jadwal Shift [BARU]
OPERASIONAL:  Inventaris, Pergerakan Stok, Riwayat Transaksi
LAPORAN:      Laporan Harian [BARU], Kas Harian [BARU]
```

### Role: Kasir (Staff)
```
UTAMA:        Dashboard, Kasir/POS
SAYA:         Transaksi Saya [BARU], Riwayat Shift [BARU]
```

> **Catatan**: Item bertanda `[BARU]` membutuhkan halaman frontend + kemungkinan endpoint backend baru. Implementasi bisa ditunda ke fase lanjutan.

---

## Pola Data-Fetching Standar

Setiap halaman yang diintegrasikan harus mengikuti pola ini:

```tsx
import { api } from "@/app/lib/api";

// Di dalam useEffect atau event handler:
useEffect(() => {
  let cancelled = false;

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api("/inventory/products", { query: { limit: 100 } });
      if (!cancelled) setProducts(data);
    } catch (err) {
      if (!cancelled) setError(err instanceof ApiError ? err.message : "Gagal memuat data");
    } finally {
      if (!cancelled) setLoading(false);
    }
  };

  loadData();
  return () => { cancelled = true; };
}, []);
```

**Jangan gunakan**:
- `fetch("http://127.0.0.1:8000/...")` ← langsung ke backend
- `fetch("/api/backend/...")` ← bypass api client
- Hardcoded data tanpa fallback

---

## Checklist Sebelum Integrasi Setiap Halaman

- [ ] Identifikasi endpoint backend yang diperlukan
- [ ] Pastikan endpoint sudah ada dan bisa dicoba di Swagger
- [ ] Ganti `isDemoDataEnabled()` branch → `else` yang panggil `api()`
- [ ] Handle loading, error, dan empty state
- [ ] Test dengan user yang punya role sesuai
- [ ] Pastikan `AuthContext` menyediakan user info yang dibutuhkan

---

## Changelog

- **2026-05-11** — Dokumen dibuat. Accept-invite flow selesai. Endpoint `GET /transactions/mine` ditambahkan.
