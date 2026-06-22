# Frontend Hardcode Remediation Progress

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` or `superpowers:test-driven-development` before implementing tasks. Use `superpowers:verification-before-completion` before marking any task done.

**Goal:** Menjadi acuan kerja dan progress tracker untuk membersihkan hardcode frontend InsightSphere berdasarkan audit terbaru.

**Architecture:** Perbaikan dilakukan bertahap dari risiko tertinggi: runtime config, demo data guard, API client consistency, lalu styling token debt. Setiap task harus punya test/audit command agar progress bisa diverifikasi.

**Tech Stack:** Next.js App Router, TypeScript/React, Playwright/Node test scripts, Tailwind/design tokens.

---

## Status Ringkas

| Area | Prioritas | Status | Catatan |
| --- | --- | --- | --- |
| Backend dev URL literal | P0 | Done | `DEV_BACKEND_URL` jadi named export tunggal di `auth-cookie.ts`; production fail-fast dipusatkan di `getDevBackendUrl()`; `.env.local.example` mendokumentasikan kewajiban env. |
| Demo data runtime guard | P1 | Done | Audit generik memastikan semua import `@/app/demo/*` di runtime didahului `isDemoDataEnabled()`. |
| Demo identity fixture | P1 | Done | Semua email demo/frontend yang memakai domain produk diganti ke reserved domain `example.test`; audit regression ditambahkan. |
| API client standardization | P2 | Done | `deleteUser` memakai helper `deleteJson`; export report memakai `api.raw` dengan blob response. |
| Styling token bypass | P2 | Done (first pass) | `MODAL.maxHeight` & `MODAL.counterValue` token baru; modal POS/inventory tidak lagi pakai `max-h-[85vh]/[90vh]`; `rounded-[32px]` dan `stroke-[3]` di POS dihapus. |
| Page table & modal token migrasi | P4 | Done (forward-engineered) | Sticky kolom 4 page table dirutekan ke `TABLE.stickyColumn`; `minWidthClassName` literal diganti `TABLE.minWidth.*`; modal `TransactionHistoryPage`/`UserManagementPage` pakai `MODAL.maxHeight.md/lg`; `XAIPage`/`ExplanationCharts` pakai `CHART_HEIGHT`; `ProductForm` body scroll pakai `MODAL.bodyScroll`; `LoginControls` di-restore ke `app/login/select/page.tsx`. |

## Temuan Audit Terbaru

### P0 - Backend URL Literal

**File:** `frontend/src/app/lib/auth-cookie.ts:18`

Temuan:

- Ada `DEV_BACKEND_URL = "http://127.0.0.1:8000"`.
- Fallback production sudah fail-fast, tetapi literal dev URL tetap berada di source.
- Risiko drift dengan konfigurasi backend/docker yang sebelumnya terdeteksi tidak sinkron.

Target perbaikan:

- Pusatkan pembacaan URL backend ke helper config frontend server-side.
- Dev fallback tetap eksplisit dan hanya aktif saat non-production.
- `.env.local.example` harus menjelaskan `BACKEND_INTERNAL_URL` dan `NEXT_PUBLIC_API_URL`.

### P1 - Demo Data Runtime Guard

**Area:** `frontend/src/app/demo/` dan import `@/app/demo/*` di runtime components.

Contoh file terdampak:

- `frontend/src/app/components/pages/DashboardPage.tsx`
- `frontend/src/app/components/pages/UserManagementPage.tsx`
- `frontend/src/app/components/pages/TransactionHistoryPage.tsx`
- `frontend/src/app/components/LowStockAlert.tsx`
- `frontend/src/app/services/productService.ts:54`

Temuan:

- Banyak dynamic import demo data di komponen runtime.
- Guard yang diharapkan: `isDemoDataEnabled()` dari `frontend/src/app/lib/demo-mode.ts`.

Target perbaikan:

- Semua import `@/app/demo/*` harus berada di branch yang hanya berjalan jika demo mode aktif.
- Tambah audit test yang gagal jika ada demo import tanpa guard.

### P1 - Demo Identity Fixture

**File:** `frontend/src/app/demo/user-profile.ts:18`

Temuan:

- Ada email demo `admin@insightsphere.id`.
- Aman jika tetap dalam demo fixture, tetapi tidak boleh menjadi fallback user production.

Target perbaikan:

- Pastikan semua konsumsi `DEMO_USER_PROFILE` hanya terjadi saat demo mode aktif.
- Jika perlu, ganti nilai fixture menjadi domain reserved seperti `admin@example.test`.

### P2 - API Client Standardization

Contoh file:

- `frontend/src/app/lib/auth-client.ts:266`
- `frontend/src/app/lib/reporting-client.ts:81`

Temuan:

- Relative route seperti `/api/auth/users/${userId}` dan `/api/backend/reporting/export` masih tersebar.
- Ini valid untuk Next API routes, tetapi error handling/logging/auth menjadi tidak konsisten jika terus menyebar.

Target perbaikan:

- Gunakan satu helper API client untuk request frontend.
- Standarkan behavior: auth forwarding, JSON parsing, error message, timeout/cancel handling bila sudah ada pola existing.

### P2 - Styling Token Bypass

Contoh file:

- `frontend/src/app/components/pages/CashManagementPage.tsx:620`
- `frontend/src/app/components/pos/StockCheckView.tsx:82`
- `frontend/src/app/components/pos/ServicePanel.tsx:92`

Temuan:

- Masih ada arbitrary Tailwind seperti `max-h-[90vh]`, `rounded-[32px]`, `stroke-[3]`, `min-w-[16px]`.
- Sebagian valid untuk edge-case UI, tetapi halaman POS/inventory harus diprioritaskan untuk token consistency.

Target perbaikan:

- Jangan refactor seluruh styling sekaligus.
- Prioritaskan POS dan inventory user-facing flows.
- Gunakan token existing di `frontend/src/app/lib/` sebelum membuat token baru.

---

## Implementation Checklist

### Task 1: Centralize Backend URL Config (P0)

**Files:**

- Modify: `frontend/src/app/lib/auth-cookie.ts`
- Modify: `frontend/.env.local.example`
- Test: existing hardcode tests in `frontend/tests/integration/`

- [x] Write/update test that rejects production runtime URL fallback literals outside approved config helper.
- [x] Extract backend URL resolution to one server-only helper or keep `getBackendUrl()` but remove scattered literal risk.
- [x] Document required env variables in `.env.local.example`.
- [x] Run frontend hardcode tests.

Acceptance criteria:

- Production still throws if backend URL env is missing.
- Dev fallback is explicitly named and test-covered.
- No new hardcoded host/port is introduced outside approved helper.

### Task 2: Guard All Demo Imports (P1)

**Files:**

- Modify: runtime components importing `@/app/demo/*`
- Modify/Create: `frontend/tests/integration/demo-import-guard.test.mjs`

- [x] Write audit test that finds `@/app/demo/*` imports and requires nearby `isDemoDataEnabled()` guard.
- [x] Fix each unguarded import or prove existing guard is sufficient.
- [x] Run the new audit test.

Acceptance criteria:

- No runtime demo import executes unless `NEXT_PUBLIC_ENABLE_DEMO_DATA=true`.
- Test fails on future unguarded demo import.

### Task 3: Review Demo Identity Fixture (P1)

**Files:**

- Modify: `frontend/src/app/demo/user-profile.ts`
- Verify: consumers of `DEMO_USER_PROFILE`

- [x] Confirm all consumers are demo-mode guarded.
- [x] Replace demo email with reserved test domain if needed.
- [x] Add/extend test coverage if fixture leaks into normal runtime.

Acceptance criteria:

- Demo identity never appears when demo mode is disabled.
- Fixture value cannot be mistaken as real production account data.

### Task 4: Standardize Frontend API Calls (P2)

**Files:**

- Modify: `frontend/src/app/lib/auth-client.ts`
- Modify: `frontend/src/app/lib/reporting-client.ts`
- Reuse/Create: shared API helper in `frontend/src/app/lib/`

- [x] Inventory existing API helper patterns before creating anything new.
- [x] Route relative fetch calls through the chosen helper.
- [x] Preserve current API behavior and response shape.
- [x] Run affected frontend tests.

Acceptance criteria:

- Auth/reporting clients share consistent error handling.
- No behavior regression in route policy or reporting export flow.

### Task 5: Tokenize High-Impact Styling Debt (P2)

**Files:**

- Modify: POS/inventory components only for first pass.
- Prefer existing tokens in `frontend/src/app/lib/`.

- [x] List arbitrary classes in POS and inventory components.
- [x] Replace only obvious token equivalents (`rounded`, `min-w`, icon stroke/size, modal max-height).
- [x] Leave justified edge cases with minimal comments only if unavoidable.
- [x] Run UI/hardcode style audit tests.

Acceptance criteria:

- POS/inventory arbitrary-value count decreases without layout regression.
- No broad visual redesign is introduced in this cleanup pass.

---

## Verification Commands

Run from repo root unless noted.

```powershell
# Hardcode-related frontend tests
node --test frontend/tests/integration/*.test.mjs frontend/tests/ui/*.test.mjs

# Targeted grep checks
Select-String -Path frontend/src/app/**/*.ts,frontend/src/app/**/*.tsx -Pattern "http://localhost|http://127\.0\.0\.1|@/app/demo/" -CaseSensitive:$false

# Backend/frontend baseline where relevant
pytest backend/tests/test_p0_config_hardening.py
```

## Progress Log

| Date | Change | Evidence |
| --- | --- | --- |
| 2026-05-19 | Forward-engineered prior P4 work after losing intermediate diff. | Reset path resolution di 9 test (`new URL("..")` -> `new URL("../..")`) plus `tests/ui/pos-mobile-cart.test.mjs`, `tests/integration/integration-plan-status.test.mjs`, `tests/integration/route-policy.test.mjs`; flipped `getDevBackendUrl()` ke negated NODE_ENV guard; tambah `defaultValue={t("set.profile.display_name_mock")}` di `ProfileSettingsPanel`; refactor `exportToCSV` `TransactionHistoryPage` ke i18n; restore `app/login/select/page.tsx` dengan `LoginControls`; `aria-label` literal di `TransactionHistoryPage` diganti `t("txn.header")`; routing sticky/minWidth/MODAL/CHART_HEIGHT di `CashManagementPage`, `StockMovementPage`, `TransactionHistoryPage`, `UserManagementPage`, `XAIPage`, `ExplanationCharts`, `inventory/ProductForm`; `node --test` 77 passed; `npm run typecheck` -> pass. |
| 2026-05-19 | Added `CHART_HEIGHT.mlg = 320` tier and routed LaporanPage 320px wrapper to it. | New audits in `frontend/tests/integration/hardcode-followup-p3-styling.test.mjs` (`mlg tier between md and lg`, `LaporanPage 320px wrapper uses CHART_HEIGHT.mlg`); inserted `mlg: 320` between `md` and `lg` in `frontend/src/app/lib/charts.ts`; switched `frontend/src/app/components/pages/LaporanPage.tsx:540` from `CHART_HEIGHT.lg` to `CHART_HEIGHT.mlg`; `node --test` 36 passed; `npm run typecheck` -> pass. |
| 2026-05-19 | P2 second-pass styling outside POS/inventory. | Added audit `frontend/tests/integration/hardcode-followup-p3-styling.test.mjs`; routed `Sidebar.tsx` to `LAYOUT_CLASS.sidebarExpanded/Collapsed`; replaced `stroke-[3]` in `Stepper.tsx` with `strokeWidth={3}`; replaced arbitrary `h-[200/220/250/280/320/400px]` and `min-h-[250px]` chart wrappers in `Skeletons.tsx`, `TopProductsChart.tsx`, `ForecastChart.tsx`, `PrediksiStokPage.tsx`, `LaporanPage.tsx` with `CHART_HEIGHT.*` via inline `style`; `node --test` 34 passed; `npm run typecheck` -> pass. |
| 2026-05-19 | Consolidated `auth-client` JSON helpers behind one `requestJson` core. | Added audit `P2 auth-client consolidates JSON helpers...` in `frontend/tests/integration/hardcode-followup-p1.test.mjs:206`; refactored `frontend/src/app/lib/auth-client.ts:63` so `postJson`/`getJson`/`patchJson`/`deleteJson` delegate to a single `requestJson<T>` (only one `fetch(` call site remains); `node --test` 30 passed across all hardcode/p0/p1/p2/p3 suites; `npm run typecheck` -> pass. |
| 2026-05-19 | Completed P2 styling token first pass for POS/inventory. | Added `MODAL.maxHeight` and `MODAL.counterValue` tokens; refactored 5 modal containers (`StockTransferModal`, `StockHistoryTable`, `StockOpnameModal`, `ExcelImportModal`, `RefundModal`); removed `rounded-[32px]` in `StockCheckView`; replaced `stroke-[3]` with `strokeWidth={3}` in `ProductCard` and `ServicePanel`; new audit `frontend/tests/integration/hardcode-followup-p2-styling.test.mjs`; `node --test` 28 passed across all hardcode/p0/p1/p2/p3 suites; `npm run typecheck` -> pass. |
| 2026-05-19 | Completed P0 backend dev URL centralization. | Added `frontend/tests/integration/hardcode-followup-p0-backend-url.test.mjs` with three audit assertions; refactored `frontend/src/app/lib/auth-cookie.ts` to expose `DEV_BACKEND_URL` and dedicated `getDevBackendUrl()` guard; clarified `frontend/.env.local.example` production requirement; `node --test` -> 14 passed; `npm run typecheck` -> pass; `rg` only matches the named constant in `auth-cookie.ts`. |
| 2026-05-13 | Completed P2 API client standardization first pass. | Added audit for one-off fetch calls; refactored `deleteUser` to `deleteJson`; refactored report export to `api.raw<Blob, "blob">`; `node --test frontend/tests/integration/hardcode-followup-p1.test.mjs` -> 10 passed; `npm run typecheck` -> pass. |
| 2026-05-13 | Extended P1 identity cleanup to all frontend product-domain demo emails. | Replaced remaining `@insightsphere.id` in `frontend/src/app/demo/users.ts` and `frontend/src/app/components/ExportShareModal.tsx`; `node --test frontend/tests/integration/hardcode-followup-p1.test.mjs` -> 9 passed; `rg -n '@insightsphere\.id' frontend/src` -> no matches. |
| 2026-05-13 | Completed P1 demo identity fixture cleanup. | Replaced `@insightsphere.id` profile demo emails with `@example.test`; added audit assertion; `node --test frontend/tests/integration/hardcode-followup-p1.test.mjs` -> 8 passed. |
| 2026-05-13 | Completed P1 demo data runtime guard. | Added generic audit in `frontend/tests/integration/hardcode-followup-p1.test.mjs`; `node --test frontend/tests/integration/hardcode-followup-p1.test.mjs` -> 7 passed. |
| 2026-05-13 | Created this remediation tracker from latest frontend hardcode scan. | Static scan found URL literal, demo imports, demo fixture, API path spread, and styling token bypass. |

## Notes

- Do not delete `frontend/src/app/demo/` in one sweep. Demo mode is an intentional feature gate.
- Do not move all API paths blindly; preserve Next API route semantics.
- Do not refactor all Tailwind arbitrary values globally; prioritize user-facing POS/inventory flows first.
