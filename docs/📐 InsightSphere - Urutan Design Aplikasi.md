# InsightSphere — Information Architecture & Living Specification

> **Smart POS untuk Bisnis Fotokopian dengan AI Forecasting**
> Dokumen ini adalah sumber kebenaran aktual project. Terakhir diperbarui: 9 Mei 2026 (Phase 67 — UI/UX Audit).

## 📑 Daftar Isi

1. [Overview Aplikasi](#1-overview-aplikasi)
2. [User Roles & Hak Akses](#2-user-roles--hak-akses)
3. [Routing Structure](#3-routing-structure-aktual)
4. [Component Registry](#4-component-registry-aktual)
5. [Status Implementasi](#5-status-implementasi) — 15 fase kronologis
6. [Halaman Tambahan](#6-halaman-tambahan-di-luar-spec-awal)
7. [Backlog — Fitur Belum Selesai](#7-backlog--fitur-belum-selesai)
8. [Struktur Folder Frontend](#8-struktur-folder-frontend)
9. [Struktur Backend](#9-struktur-backend)

**Design System terpisah:** lihat folder [`Design System/`](../Design%20System/) untuk 31 spec docs + 20 token files. Quick index: [`Design System/TOKEN_GAP.md §8`](../Design%20System/TOKEN_GAP.md).

---

## 1. Overview Aplikasi

| Aspek | Detail |
|---|---|
| **Nama** | InsightSphere |
| **Tujuan** | Sistem Point of Sale dengan AI Forecasting untuk optimasi stok bisnis fotokopian |
| **Tech Stack (Frontend)** | Next.js 16, React, TypeScript, Tailwind CSS, shadcn/ui, Recharts, TanStack Query, Zustand |
| **Tech Stack (Backend)** | FastAPI, Python, SQLAlchemy, APScheduler, Uvicorn |
| **Package Manager** | npm (frontend) / pip (backend) |
| **Status API** | 100% mock data — belum terintegrasi ke backend |

---

## 2. User Roles & Hak Akses

Project menggunakan **4 role** (bukan 2 seperti draft awal):

| Role | Deskripsi | Akses |
|---|---|---|
| `admin` | Superuser sistem | Semua halaman |
| `owner` | Pemilik toko | Semua kecuali Tim & Akses penuh |
| `cashier` | Kasir / Staff | Dashboard, POS, Inventaris (read), Laporan |
| `inventory_manager` | Manajer gudang | Inventaris penuh, Laporan |

---

## 3. Routing Structure (Aktual)

| Path | Komponen | Role yang Diizinkan | Status |
|---|---|---|---|
| `/` | `DashboardPage` | admin, owner, cashier | ✅ Done |
| `/login/[role]` | `PortalTemplate` | — (public) | ✅ Done |
| `/kasir` | `KasirPage` | admin, owner, cashier | ✅ Done — `app/kasir/page.tsx`, nav key: `nav.kasir` |
| `/inventaris` | `InventarisPage` | admin, owner, cashier | ✅ Done |
| `/prediksi-stok` | `PrediksiStokPage` | admin, owner | ✅ Done |
| `/penjelasan-ai` | `XAIPage` | admin, owner | ✅ Done |
| `/riwayat-transaksi` | `TransactionHistoryPage` | admin, owner | ✅ Done |
| `/manajemen-kas` | `CashManagementPage` | admin, owner, cashier | ✅ Done — `app/manajemen-kas/page.tsx`, nav key: `nav.cash_management` |
| `/laporan` | `LaporanPage` | admin, owner, cashier | ✅ Done |
| `/pengaturan` | `PengaturanPage` | admin, owner, cashier | ✅ Done |

---

## 4. Component Registry (Aktual)

### 4.1 Pages (`src/app/components/pages/`)

| File | Deskripsi | API Status |
|---|---|---|
| `DashboardPage.tsx` | KPI cards, TopProductsChart, LowStockAlert, ForecastChart | Mock |
| `KasirPage.tsx` | POS interface, cart, payment, stock check | Mock |
| `InventarisPage.tsx` | Tabel produk, filter, pagination, product drawer | Mock |
| `PrediksiStokPage.tsx` | AI forecast charts, prediction table, recommendation cards | Mock |
| `XAIPage.tsx` | Explainable AI, WhatIf simulator, SHAP visualization | Mock |
| `TransactionHistoryPage.tsx` | Riwayat transaksi POS dengan filter & export |
| `CashManagementPage.tsx` | Manajemen kas — KPI saldo/pemasukan/pengeluaran/pending, CRUD transaksi (add/edit/delete), filter (tipe/kategori/status/periode), sort, pagination, modal form, detail drawer, saldo running balance. **i18n DONE (Phase 51)**: `LABELS` constant dihapus; semua UI text pakai `t("cm.*")` calls — reaktif terhadap language switch. **Token canonical**: `STATUS_META` badge colors via `C.success/C.warning/C.neutral`, destructive colors via `C.destructive.*`, badges via `BADGE.base+BADGE.size.*`, table via `TABLE.head/body/row/rowHover/footer`, drawer close via `MODAL.close`. **100% design system tokens + A11Y + i18n compliant.** |
| `StockMovementPage.tsx` | Log pergerakan stok — masuk, keluar, adjustment, transfer, retur |
| `UserManagementPage.tsx` | Manajemen pengguna — daftar, tambah, edit, nonaktifkan, filter role |
| `LaporanPage.tsx` | Laporan penjualan & inventaris, chart, export | Mock |
| `PengaturanPage.tsx` | Info toko, notifikasi, tim & akses, keamanan, logout | Mock |
| `UserProfilePage.tsx` | Profil user, performa, aktivitas, achievements | Mock |

### 4.2 Shared Components (`src/app/components/`)

| File | Deskripsi |
|---|---|
| `ForecastChart.tsx` | Line chart prediksi dengan confidence interval |
| `TopProductsChart.tsx` | Bar chart produk terlaris |
| `LowStockAlert.tsx` | Alert list stok menipis dengan progress bar |
| `KPICards.tsx` | Reusable metric cards dengan sparkline |
| `NotificationCenter.tsx` | Panel notifikasi |
| `ExportShareModal.tsx` | Modal export dan share data |
| `WhatIfSimulator.tsx` | Simulator skenario AI |
| `PredictionTable.tsx` | Tabel prediksi stok per produk |
| `Skeletons.tsx` | Loading skeleton untuk semua halaman |
| `Sidebar.tsx` | Navigasi sidebar dengan RBAC filter |
| `Header.tsx` | Header dengan notifikasi dan user info |
| `RouteGuard.tsx` | Auth guard + role-based redirect |

### 4.3 POS Components (`src/app/components/pos/`)

| File | Deskripsi |
|---|---|
| `CartPanel.tsx` | Sidebar keranjang belanja |
| `PaymentModal.tsx` | Modal pembayaran (Tunai / QRIS) |
| `ProductCard.tsx` | Card produk di grid POS |
| `StockCheckView.tsx` | View cek stok (read-only) |
| `ServicePanel.tsx` | Grid layanan fotokopi/print/jilid/laminasi/scan + filter kategori |
| `JobQueuePanel.tsx` | Antrian cetak dengan status pending → processing → done + form baru |
| `RefundModal.tsx` | Flow refund/retur 3-step: pilih transaksi → pilih item → konfirmasi |

### 4.4 Inventory Components (`src/app/components/inventory/`)

| File | Deskripsi |
|---|---|
| `ProductForm.tsx` | Form tambah / edit produk |
| `StockUpdateModal.tsx` | Modal update stok (masuk / keluar / adjustment) |
| `StockHistoryTable.tsx` | Tabel riwayat perubahan stok dengan pagination |
| `StockOpnameModal.tsx` | Modal stock opname — hitung fisik vs sistem, rekonsiliasi selisih |
| `StockTransferModal.tsx` | Modal transfer stok antar cabang + riwayat transfer |

---

## 5. Status Implementasi

> **Ringkasan:** 15 fase terselesaikan antara Jan–Apr 2026. Core features lengkap, RBAC 4-role jalan, AI forecasting terpasang, dan design system layer matang (spec + token). Color token `C.*` adoption di 29/102 komponen. Pending: lanjutan token adoption + backend API integration.

### 📋 Quick Index

| Fase | Fokus | Periode |
|:---:|---|:---:|
| **1–6** | Core App Features (Auth → Transaction History) | Jan–Feb 2026 |
| **7–10** | Navigation Gap P0–P3 (Pages / Auth / Intelligence / Polish) | Feb–Mar 2026 |
| **11** | Global Design System Alignment (Dark Mode + Typography) | Mar 2026 |
| **12** | Domain Polish Pass (10+ pages UX refinement) | Mar–Apr 2026 |
| **13** | POS Fotokopian Integration + RBAC 4-role | Apr 2026 |
| **14** | Design System Specs (Cluster A–K, 30 docs) | 22–23 Apr 2026 |
| **15** | Token Layer Expansion (Cluster L, 7 new files + 4 fixes) | 23 Apr 2026 |
| **16** | Token Adoption Migration Sprint (9 clusters, 30+ files) | 23 Apr 2026 |
| **17** | Design System Migration — XAIPage + PengaturanPage | 25 Apr 2026 |
| **18** | shadcn Tabs Adoption — XAIPage + PengaturanPage ARIA | 25 Apr 2026 |
| **19** | Custom ESLint Rule (Token Enforcement) | 25 Apr 2026 |
| **20** | Audit & Remediasi Design System (PengaturanPage) | 25 Apr 2026 |
| **21** | Audit & Remediasi Design System (StockMovementPage) | 25 Apr 2026 |
| **22** | Audit Tipografi & Perbaikan Komponen (Inventaris & Pengaturan) | 25 Apr 2026 |
| **23** | Lokalisasi i18n (UserManagement, CashManagement, StockMovement) | 25 Apr 2026 |
| **24** | P1 Priority Fixes Sprint (performance, UX, A11Y, mega-component) | 25–26 Apr 2026 |
| **25** | Critical Bug Fixes — 4 bug kritis di 3 halaman utama | 27 Apr 2026 |
| **26** | Feature Gaps — UM Pagination + CRUD state fix; SM Delete action | 27 Apr 2026 |
| **27** | Design System Token Adoption — PriorityBadge + ROLE_CONFIG refactor | 27 Apr 2026 |
| **28** | A11Y — Focus Ring Migration: `focus:outline-none focus:border-indigo-*` → `FOCUS.ring` / `A11Y.focusRing.*` (5 pages) | 27 Apr 2026 |
| **29** | P2 #17 — Granular `<ErrorBoundary compact>` per widget — MLOpsDashboardPage + XAIPage | 27 Apr 2026 |
| **30** | P2 #16 — `useMemo` untuk expensive computations — DashboardPage + LaporanPage | 27 Apr 2026 |
| **31** | fix-i18n — Hardcoded strings migration: StockMovementPage + UserManagementPage | 27 Apr 2026 |
| **32** | P0/P1 Audit Fixes Sprint — ARIA DashboardPage, C.destructive token adoption (MLOps + Inventaris), all P0 items verified ✅ | 28 Apr 2026 |
| **33** | Quick Wins — `ErrorBoundary` + `error.tsx` hard navigation → `<Link>`; `PrediksiStokPage` search `aria-label` | 28 Apr 2026 |
| **34** | Medium Severity Audit — `#2` LaporanPage `fmt()` fix; `#23` toast verified; `#30` `useModalA11y` verified | 28 Apr 2026 |
| **35** | Low Severity Audit — `#37` ResponsiveContainer debounce; `#39` RouteGuard dark+a11y; `#40` formatDate; `#32` ErrorBoundary tokens; `#14` Layout Z+BACKDROP tokens | 28 Apr 2026 |
| **36** | Missing Components — `SkipLink` (A11Y §4.7) + `ChartTooltip` (CHARTS §6.4) + `forbidden.tsx` (PATTERNS §9.2); SkipLink integrated ke Layout | 28 Apr 2026 |
| **37** | Missing Components Pt.2 — `VisuallyHidden`, `LiveRegion`, `FormField` + `FormFieldInline`, `Stepper` (horizontal + vertical, 3 sizes) | 28 Apr 2026 |
| **38** | Token Adoption Sprint — `focus:ring-*` → `focus-visible:ring-*` (22 instances/8 files); `<div onClick>` → `<button>` (3 POS cards); hardcoded `Rp` → `formatRupiah()` | 28 Apr 2026 |
| **39** | Dark Mode 100% Sprint — 5 batches: Skeletons/KPICards/LowStockAlert/TopProducts/ForecastChart/PredictionTable (B1), ExportShareModal/NotificationCenter (B2), XAIPage (B3), PengaturanPage/PaymentModal (B4), KasirPage/CartPanel/RefundModal/ErrorBoundary/Header/PortalTemplate (B5); ~60 `bg-white` gaps patched | 28 Apr 2026 |
| **40** | Typography Token Migration Sprint — 4 batches across 30+ files; ~103 hardcoded `text-{size}` → `T.*` tokens (T.body/bodySm/h1-h3/buttonSm/buttonLg/dataSm/kpiCard/micro); 25 instances kept intentional (text-xl/2xl/3xl hero numbers, brand names, decorative); 3 missing `T` imports added (WhatIfSimulator/Sidebar/Stepper) | 28 Apr 2026 |
| **41** | Label `htmlFor` Accessibility Sprint — 21 `<label>` tanpa `htmlFor` diperbaiki di 6 file (ProductForm×7, StockTransferModal×5, StockUpdateModal×3, StockOpnameModal×1, JobQueuePanel×3, RefundModal×1, UserProfilePage×1); StockUpdateModal type-selector pakai `aria-labelledby` (button group) | 28 Apr 2026 |
| **42** | Color Token `C.*` Migration Sprint — 6 batch, 22 file komponen dimigrasikan (ikon, label, config object, error text → `C.primary/success/warning/destructive.*`). 29/102 komponen kini import `C`. Instance bersih: section icons, status configs, action links, error messages. Sisa ~350 instance kompleks (ternary, hover states, chart legends) ditangani manual nanti. | 28 Apr 2026 |
| **43** | Dark Mode + Icon + Spacing Token Standardization — (1) Dark mode: 40+ elemen di 6 halaman ditambahkan `dark:text-slate-400` — UserManagementPage (11), DashboardPage (8), PengaturanPage (11), StockMovementPage (4), TransactionHistoryPage (1), dan minor. (2) Icon size: `w-3.5 h-3.5` hardcoded → `ICON.sm` token di 5 file (UserProfilePage, PengaturanPage, XAIPage, MLOpsDashboardPage + ICON import ditambah). (3) Spacing: `space-y-0.5` page header containers → `STACK.tight` token di 5 halaman (PrediksiStok, Laporan, Inventaris, Pengaturan, Dashboard); STACK import ditambah ke 5 file. | 28 Apr 2026 |
| **44** | Shared Component Dark Mode — `Header.tsx`: store selector + language toggle buttons (`bg-slate-50` → + `dark:bg-slate-800/border-slate-700/hover-slate-700`), Store icon/text/chevron dark variants, dropdown items (`bg-emerald-50` → `dark:bg-emerald-900/20`), mirror mode indicator dark; `NotificationCenter.tsx`: bell button dark bg/border/hover; `KPICards.tsx`: 3 icon container variants (`bg-indigo/emerald/amber-50` → + `dark:bg-*-900/30`, border dark). **Total: 3 shared components, ~15 elements fixed.** | 28 Apr 2026 |
| **45** | `LowStockAlert.tsx` Dark Mode — icon containers (`bg-rose/amber-50` → `+dark:bg-*-900/30`), Urgent badge (`bg-rose-50` → dark + `dark:border-rose-800/50`), stock bar track (`bg-slate-100` → `+dark:bg-slate-700`), action links (indigo + emerald `bg-*-50` → `+dark:bg-*-900/30`), restock text (`text-slate-300` → `+dark:text-slate-600`). **6 fix, 1 file.** | 28 Apr 2026 |
| **46** | `TopProductsChart.tsx` Dark Mode — `BAR_COLORS_DARK` array (rank 5 `#e0e7ff`→`#a5b4fc` to fix invisible white badge in dark), `useTheme` import + `resolvedTheme`-aware `barColors`, Y-axis tick fill (`#475569`→`#94a3b8` in dark), `thead` row (`bg-slate-50/50`→`+dark:bg-slate-800/40`), 5 table headers (`text-slate-500`→`+dark:text-slate-400`), sold/revenue (`text-slate-600`→`+dark:text-slate-300`), pct (`text-slate-900`→`+dark:text-slate-100`). **9 fix, 1 file.** | 28 Apr 2026 |
| **47** | `DashboardPage.tsx` Dark Mode Polish — MODEL PRECISION icon container (`bg-indigo-50` → `+dark:bg-indigo-900/30`), "94.3%" value (`text-slate-900` → `+dark:text-slate-100`), period selector active button (`dark:bg-slate-100 dark:text-slate-900` → `dark:bg-indigo-600 text-white` consistent with branch selector pattern). **3 fix, 1 file.** | 28 Apr 2026 |
| **48** | `PredictionTable.tsx` Dark Mode — `getStatusBadge()` semua 4 variant (`bg-*-100` → `+dark:bg-*-900/30`); category badge (`bg-slate-100` → `+dark:bg-slate-800 dark:text-slate-400`); stock bar track (`bg-slate-100` → `+dark:bg-slate-700`); stock count (`text-slate-900` → `+dark:text-slate-100`); days safe (`text-slate-600` → `+dark:text-slate-400`). **5 fix, 1 file.** | 28 Apr 2026 |
| **49** | `KasirPage.tsx` + `ProductCard.tsx` Dark Mode — KasirPage: category active pill (`dark:bg-slate-100`→`dark:bg-indigo-600`), nav icon rings (`ring-indigo/emerald/amber-100`→`+dark:ring-*-900/50` ×4), nav active shadow (`shadow-indigo-50`→`+dark:shadow-none`). ProductCard: Min badge (`bg-indigo-100`→`+dark:bg-indigo-900/40 dark:text-indigo-300`), Custom badge (`bg-amber-100`→`+dark:bg-amber-900/40 dark:text-amber-300`), hover add shadow (`shadow-indigo-200`→`+dark:shadow-indigo-900/50`). **9 fix, 2 file.** | 28 Apr 2026 |
| **50** | `CartPanel.tsx` Dark Mode — SVC badge (`bg-indigo-100`→`+dark:bg-indigo-900/40 dark:text-indigo-300`); hold button hover (`hover:bg-amber-50`→`+dark:hover:bg-amber-900/20`); clear cart hover (`hover:bg-rose-50`→`+dark:hover:bg-rose-900/20`); qty − hover (same rose); qty + hover (`hover:bg-indigo-50`→`+dark:hover:bg-indigo-900/30`); discount active badge (`bg-rose-100 border-rose-200`→`+dark:bg-rose-900/30 dark:border-rose-800/50`); discount hover (`hover:bg-indigo-50`→`+dark:hover:bg-indigo-900/30`). **7 fix, 1 file.** | 28 Apr 2026 |
| **66** | **`rounded-md` → `R.md` Token Migration (19 shadcn/ui files).** Gap #2: 38 standalone `rounded-md` (banned, harusnya `R.md`). Strategy: template literal `${R.md}` dengan import `R` dari `@/app/lib/radii`. **19 file dimigrasi**: sidebar (8), button (4), menubar (3), navigation-menu (2 + 1 modifier-prefix reverted), calendar (1 + 1 modifier-prefix skipped), command (2), context-menu (2), dropdown-menu (2), select (2), accordion (1), badge (1), hover-card (1), input (1), popover (1), skeleton (1), textarea (1), toggle-group (1), toggle (1), tooltip (1). **5 exceptions dipertahankan** (modifier-prefixed — Tailwind JIT scanner constraint): `radii.ts` (2 = token definition), `calendar.tsx` (1 = `[&:has([aria-selected])]:rounded-md`), `navigation-menu.tsx` (1 = `group-data-[viewport=false]/navigation-menu:rounded-md`), `a11y.ts` (1 = `focus-visible:rounded-md`). **Result: 38/38 standalone `rounded-md` → `${R.md}`. Token adoption shadcn/ui primitives 100% untuk radius tier.** | 2 Mei 2026 |
| **65** | **ErrorBoundary — i18n Activation.** Class component tidak bisa pakai `useTranslation()` hook — sudah memakai `static contextType = I18nContext` + `this.context?.t("eb.*") ?? "fallback"` pattern, tapi: (1) **`I18nContext` belum di-export** dari `i18n.tsx` → `this.context` selalu `undefined`, semua 12 string selalu fallback ke hardcoded; (2) **`I18nContextType` belum di-export** → TypeScript error pada `declare context`; (3) **`eb.*` keys belum ada** di `i18n.tsx`. Fix: export `I18nContext` + `I18nContextType` dari `i18n.tsx`; tambah **+13 keys baru** `eb.*` (ID + EN) — `widget_failed`, `section_failed` (interpolasi `{name}`), `unknown_error`, `retry`, `title`, `desc` (brand fix SmartStock→InsightSphere), `refresh`, `home`, `hide_log`, `show_log`, `diagnostic`, `stack`, `status`. **Compact fallback** (3 strings) + **full-page fallback** (9 strings) + **footer status** (1 string) = 13 total. Pattern: `this.context?.t(key) ?? "fallback"` dipertahankan sebagai safety net jika ErrorBoundary render di luar I18nProvider. **2 file, 0 breaking changes.** | 2 Mei 2026 |
| **64** | **POS Components — i18n Completion (7 files).** Upgrade semua komponen POS dari hardcoded ID strings ke `t()` calls: (1) **CartPanel.tsx**: 16 strings → `pos.cart.*` — title, items count, hold/clear/restore/delete, empty state, edit price, discount, subtotal, pay, payment methods; (2) **ProductCard.tsx**: 5 strings → `pos.product.*` — out_of_stock/low_stock badges, min qty, custom badge, stock count; (3) **StockCheckView.tsx**: 11 strings → `pos.stock.*` — title, subtitle w/ branch interpolation, refresh, search placeholder, urgent/critical/available status, current stock, velocity, fast moving, not found; (4) **PaymentModal.tsx**: 22 strings → `pos.pay.*` — success screen (title/desc/txn_id/total/close/print), confirm panel (title/subtitle/total_purchase/item_count/pcs/discount/promo/e-receipt), method selector (cash/qris/split labels), cash input (received/placeholder/change), qris scan, split cash, processing, confirm buttons per method; (5) **JobQueuePanel.tsx**: 16 strings → `pos.job.*` — `STATUS_CONFIG` refactored ke `STATUS_STYLE` (visual) + `STATUS_LABEL` (i18n inside component); pending/processing counts, new queue, form (title/customer/copies/desc/placeholder), cancel/add, advance buttons, default customer; (6) **RefundModal.tsx**: 16 strings → `pos.refund.*` — title, 4 step labels, search, click hint, items selected, back/next, warning, total, reason + placeholder, submit, success title/desc w/ amount interpolation, close; (7) **ServicePanel.tsx**: 2 strings → `pos.service.*` — all category + search; `SERVICE_CATEGORIES` refactored ke `SERVICE_CATEGORY_KEYS` (`"Semua"` → `"ALL"` internal key). **+80 keys baru** `pos.*` (ID + EN) ditambah, 6 old duplicate keys dihapus. **7 file, ~90 hardcoded strings eliminated.** | 2 Mei 2026 |
| **63** | **CommandPalette — i18n Completion.** Fix semua string hardcoded di `CommandPalette.tsx`: (1) **`GROUP_LABEL` object dihapus** — konstanta module-level `{ pages: "Halaman", actions: "Aksi Cepat", settings: "Pengaturan" }` diganti `t(\`cmd.group.${group}\`)` inline; (2) **Trigger button**: `aria-label="Open command palette"` (EN hardcoded) → `t("cmd.open")`; placeholder pendek `"Cari..."` → `t("cmd.placeholder_short")`; (3) **Search input**: `placeholder="Cari halaman..."` → `t("cmd.placeholder")`; (4) **Empty state**: `"Tidak ada hasil untuk..."` → `t("cmd.empty", { query })`; (5) **Group headers**: `GROUP_LABEL[group]` → `t(\`cmd.group.${group}\`)`; (6) **Quick action labels + descriptions** (6 strings) → `t("cmd.action.*")` + `t("cmd.settings.*")`; (7) **Footer keyboard hints**: `"Navigasi"`, `"Buka"` → `t("cmd.hint.nav/open")`; (8) **Result count**: `"{n} hasil"` → `t("cmd.results", { count })`; (9) **`groupStartIdx` unused variable** dihapus; (10) **keywords extended**: tambah EN synonyms per item agar fuzzy search bekerja di kedua bahasa. **+22 keys baru** `cmd.*` (ID + EN). | 2 Mei 2026 |
| **62** | **NotificationCenter — i18n Completion.** Fix sisa string hardcoded di `NotificationCenter.tsx`: (1) **`notif.mute` / `notif.unmute`**: 2 keys baru — dipakai di komponen tapi belum ada di `i18n.tsx`; fallback `|| "..."` dihapus; (2) **Urgency badge**: `{n.urgency}` raw value ("tinggi"/"sedang"/"rendah") → `t(\`notif.urgency.${n.urgency}\`)` — +3 keys `notif.urgency.tinggi/sedang/rendah` (ID: Tinggi/Sedang/Rendah, EN: High/Medium/Low); (3) **Aria-labels**: "Hapus notifikasi" → `t("notif.delete")`; "Bagikan notifikasi" → `t("notif.share")`; (4) **Footer "Polling \u00b7"**: hardcoded → `t("notif.polling")`; (5) **`time: "Baru saja"`** di POLL_NOTIFICATIONS → sentinel `"__just_now__"` — render time menggunakan `t("notif.just_now")` saat ditemukan; (6) **`notif.mark.all` fallback** dihapus (`|| "Mark all as read"` → langsung `t()`); (7) **Total keys baru**: +9 (ID + EN) — mute, unmute, delete, share, polling, just_now, urgency\u00d73. | 2 Mei 2026 |
| **61** | **Error Pages — i18n + Brand Fix.** Upgrade 3 error pages yang sudah ada (`not-found.tsx`, `error.tsx`, `forbidden.tsx`): (1) **i18n**: semua string hardcoded ID diganti dengan `t("err.*")`; +15 keys baru (ID + EN) — `err.not_found.*` (title/desc/cta/footer), `err.error.*` (title/desc/id/retry/home/footer), `err.forbidden.*` (title/desc/back/home/footer); (2) **Brand fix**: "SmartStock" di footer semua 3 halaman diganti ke "InsightSphere"; (3) **Server → Client**: `not-found.tsx` ditambahkan `"use client"` directive agar dapat menggunakan `useTranslation` hook; (4) **useTranslation import**: ditambahkan ke `not-found.tsx` (baru) + `error.tsx` + `forbidden.tsx`; (5) **Error ID label**: `"ID:"` hardcoded di `error.tsx` → `t("err.error.id")`  yang translatable. | 2 Mei 2026 |
| **60** | **Change PIN — SecurityTab Upgrade.** Upgrade section *Ganti PIN Kasir* dari static wizard tanpa validasi ke flow interaktif penuh: (1) **i18n**: semua string hardcoded → `t("set.sec.pin_*")`; +15 keys baru (ID + EN) — title, desc, step indicator, group labels, demo hint, cancel/next/save/reset/error keys; (2) **Step indicator**: `t("set.sec.pin_step", { step })` — "Langkah 1/3", "Langkah 2/3", "Langkah 3/3"; (3) **PIN Validation**: Step 1 (verify) — cek `join() === "1234"` (demo), salah → error banner; Step 3 (confirm) — cek `next === confirm`, beda → error banner; (4) **Error banner**: `AlertCircle` + `animate-in fade-in` konsisten dengan pattern 2FA & Change Password; (5) **Loading state**: Tombol "Simpan PIN" — 1s mock delay + `Loader2` spinner; (6) **Toast**: `toast.success(t("set.sec.pin_success"))` setelah save berhasil; (7) **Button disable**: tombol Lanjut/Simpan disabled (`!allFilled \|\| pinLoading`) — harus semua 4 digit terisi dulu; (8) **Error reset**: setiap digit input juga memanggil `setPinError("")` — error hilang otomatis saat user mulai mengetik; (9) **Cancel reset**: tombol Batal kini juga reset `pinError` + semua `pinValues`; (10) **State baru**: `pinLoading`, `pinError`. | 2 Mei 2026 |
| **59** | **2FA Wizard — SecurityTab Upgrade.** Upgrade section 2FA di `SecurityTab` dari static 3-step sederhana ke wizard interaktif penuh: (1) **i18n**: semua string hardcoded ID → `t("set.sec.twofa_*")`; +22 keys baru (ID + EN) — title, desc, step labels, hints, demo hint, error, success, disable confirm; (2) **Loading state**: Step 2 verify kini punya 1s mock delay dengan `Loader2` spinner di tombol; (3) **OTP Validation**: kode salah → tampilkan error banner `AlertCircle` + `animate-in` (demo: gunakan `123456`); (4) **Copy Secret Key**: tombol inline di secret key card — `navigator.clipboard` + `toast.success`; (5) **Copy Backup Codes**: tombol di header done-panel — salin semua 5 kode sekaligus; (6) **Disable Confirmation**: toggle ke OFF tidak lagi instan — muncul amber warning panel dengan konfirmasi + `toast.success(twofa_deactivated)`; (7) **QR dark mode**: pixel `bg-slate-800` → + `dark:bg-slate-100` agar QR tetap terlihat di dark mode; (8) **State baru**: `twoFaLoading`, `twoFaError`, `showDisableConfirm`; (9) **Import**: `Copy` icon ditambah. | 2 Mei 2026 |
| **58** | **Accept Invite Page — Full Rewrite.** Route `/accept-invite/[token]` sudah ada tapi tanpa design tokens, i18n, dark mode, atau error UI. Rewrite total: (1) **Design tokens**: `T.*`, `R.*`, `E.sm` — menggantikan semua hardcoded Tailwind (text-[10px], text-[9px], rounded-xl, shadow-sm, dll); (2) **i18n**: `useTranslation` ditambah; +23 keys `auth.invite.*` (ID + EN) — semua teks header, detail, label, placeholder, error, success, footer; interpolasi `{name}` di `invited_by`; (3) **Dark mode**: semua 3 step punya `dark:` variants lengkap; (4) **Role badge colors**: fix `ROLE_CONFIG` lama (inventory_manager amber → **teal** sesuai canonical) + ditambah dark variants per role; (5) **Error UI**: upgrade dari `<p>` biasa → `AlertCircle` banner + `animate-in fade-in` konsisten dengan ForgotPasswordPage; (6) **A11y**: semua input punya `<label htmlFor>` yang benar; eye-toggle punya `aria-label`; (7) **Dynamic login link**: success step pakai `loginHref = /login/${invite.role}` — tidak lagi hardcoded ke `/login/cashier`; (8) **Detail rows**: refactor repetitif → array map untuk Organisasi + Cabang; Role row tetap terpisah karena render badge khusus. | 2 Mei 2026 |
| **57** | **Login History — SecurityTab Enhancement.** Upgrade tabel Login History dari 4-row static ke UI interaktif penuh: (1) **Mock data**: 4 → 10 entri dengan `location` field baru (Jakarta/Bandung/Singapore/Tor Exit Node) + variasi device; (2) **Filter tabs**: Semua / Berhasil / Gagal — reset limit saat filter berganti; (3) **Kolom Lokasi**: ditambah sebagai kolom ke-4 di antara Device dan IP; (4) **Suspicious Alert Banner**: amber warning otomatis muncul bila ada login gagal (`suspiciousCount > 0`), dengan interpolasi `{count}` dari `t()`; (5) **Row highlighting**: baris `success: false` diberi background `rose-50/30` untuk visual cue; (6) **Export button**: header-row kanan — mock `toast.success`; (7) **Pagination**: "Menampilkan X dari Y log" + tombol "Tampilkan lebih banyak" (+5 per klik); (8) **TypeScript fix**: `TFn` type diupdate dari `(key: string) => string` → `(key: string, params?: Record<string, string|number>) => string` — fix 2 TS error interpolasi; (9) **i18n**: +9 keys `set.sec.lh_*` (ID + EN) + `Download` icon import. | 2 Mei 2026 |
| **56** | **Change Password — SecurityTab PengaturanPage.** Upgrade section *Ganti Password* dari static UI ke form fungsional: (1) **State**: `pwOld`, `pwNew`, `pwConfirm` + 3 `showPw*` boolean; (2) **Show/Hide toggle**: `Eye`/`EyeOff` per field dengan `aria-label`; (3) **Validasi 3 lapis** (client-side): old required → new ≥ 8 char → confirm match; (4) **Error banner** inline (`AlertCircle` + `animate-in`) sesuai design pattern PortalTemplate; (5) **Mock submit**: `Loader2` saat loading 1.2s → reset form → `toast.success(t("set.sec.pw_updated"))`; (6) **i18n**: +4 keys `set.sec.error_old_required`, `set.sec.error_min`, `set.sec.error_mismatch`, `set.sec.pw_updated` (ID + EN); (7) **Button**: upgrade dari `btn("neutral")` statis → `btn("primary")` dengan dark mode variants + `disabled:opacity-50`. **Import ditambah**: `EyeOff`, `AlertCircle`, `Loader2`. | 1 Mei 2026 |
| **55** | **Forgot Password Page — Full Rewrite.** Route `/login/forgot-password` sudah ada tapi belum pakai design tokens & i18n. Rewrite total: (1) **4-step flow dipertahankan**: `email` → `sent` → `reset` → `success`; (2) **Design tokens**: `T.*` (h2/h3/micro/body), `R.*` (md/lg/xl/full), `E.sm` — menggantikan semua hardcoded Tailwind; (3) **Dark mode**: semua 4 step punya `dark:` variants lengkap (bg/border/text/icon/placeholder); (4) **i18n**: `useTranslation` ditambah; +26 keys `auth.forgot.*` di `i18n.tsx` (ID + EN) — semua teks label, placeholder, pesan validasi, heading, button, footer; (5) **Validasi error**: pakai `AlertCircle` + error banner konsisten dengan PortalTemplate; (6) **A11y**: `aria-label` pada eye-toggle buttons; (7) **Interpolation-safe**: `passwordFields` dan `sentSteps` di-compute dari `t()` — aman ganti bahasa real-time. **Link dari PortalTemplate** ke `/login/forgot-password` sudah ada sejak sebelumnya, tidak perlu perubahan. | 1 Mei 2026 |
| **54b** | **i18n — Minor Files Completion.** Eliminasi sisa 9 hardcoded toast di 5 file: (1) **RouteGuard.tsx**: tambah `useTranslation`; `"Access Denied"` + desc dengan interpolasi `{role}` → `t("auth.accessDenied")` + `t("auth.access_denied_desc", { role })`. (2) **DashboardPage.tsx**: 2 `toast.info` di footer → `t("dash.toast.status/security")`. (3) **UserProfilePage.tsx**: 3 toast (`profil diperbarui`, `avatar size`, `log diunduh`) → `t("prof.toast.*")`. (4) **PrediksiStokPage.tsx**: 2 toast (`loading`/`done`) → `t("pred.toast.loading/done")`. (5) **ExcelImportModal.tsx**: tambah `useTranslation`; 1 toast `"Template Excel diunduh (mock)"` → `t("inv.excel.toast.template")`. **Tambah +9 keys baru (ID + EN)**: `auth.access_denied_desc` (×1, dengan interpolasi `{role}`), `dash.toast.*` (×2), `prof.toast.*` (×3), `pred.toast.*` (×2), `inv.excel.toast.template` (×1). **Hasil: 0 hardcoded toast tersisa di seluruh codebase frontend.** | 1 Mei 2026 |
| **54** | **i18n — Sisa Halaman & AuthContext.** (1) **App.tsx**: swap provider order — `I18nProvider` kini membungkus `AuthProvider` (bukan sebaliknya) sehingga `AuthContext` dapat menggunakan `useTranslation()`. (2) **AuthContext.tsx**: tambah `useTranslation` import; 3 hardcoded string → `t()` (`auth.session.expired`, `auth.session.expired_desc`, `auth.error.server`); tambah `t` ke dependency arrays `useEffect` + `useCallback`. (3) **XAIPage.tsx**: 2 toast hardcoded (`toast.loading`/`toast.success`) → `t("xai.toast.loading/done")`. (4) **TransactionHistoryPage.tsx**: 2 toast hardcoded (`CSV berhasil diunduh`, `Mencetak halaman...`) → `t("txn.toast.csv/print")`. (5) **InventarisPage.tsx**: 5 toast hardcoded (`export`, `produk ditambahkan/diperbarui`, `stok diperbarui`, `stock opname`, `transfer`) → `t("inv.toast.*")`. (6) **PengaturanPage.tsx**: 1 toast hardcoded → pakai `set.toast.success` key yg sudah ada. **Tambah +13 keys baru** (ID + EN): `auth.session.*` ×3, `xai.toast.*` ×2, `txn.toast.*` ×2, `inv.toast.*` ×6. **Total: 6 file, 13 hardcoded strings dieliminasi, 0 breaking changes.** | 1 Mei 2026 |
| **53** | **i18n Engine Innovations — 3 Inovasi Sistemik.** (1) **Native Interpolation**: signature `t(key, params?)` — `Params = Record<string, string|number>`; implementasi via `Object.entries(params).reduce(replaceAll)` menggantikan semua manual `.replace()` di komponen; backward-compatible (tanpa params = perilaku lama). (2) **Dev Missing-Key Warning**: `t()` kini log `console.warn('[i18n] Missing key "…" in locale "…"')` di `NODE_ENV === "development"` saat key tidak ditemukan; zero cost di production. (3) **`useTranslations(prefix)` Hook**: scoped hook dengan auto-prefix — `useTranslations("cm")` → `t("header")` resolves ke `"cm.header"`; meng-expose `t`, `lang`, `setLang`; JSDoc dengan contoh penggunaan. **Refactor call sites**: 19 instance `t(key).replace()` di 10 file dieliminasi (PortalTemplate, MLOps, UserMgmt, StockMovement, PrediksiStok, Laporan, Dashboard, CashMgmt, WhatIfSimulator, Header, LowStockAlert, ForecastChart); `ExportShareModal`: ganti pattern `.replace(" (Opsional)", "")` dengan key baru `share.note.short` (+2 keys ID+EN). `UserTableRowProps.t` type updated agar match new signature. **Total: 1 file engine, 12 file refactor, +2 keys, 0 breaking changes.** | 29 Apr 2026 |
| **52** | **i18n — Auth/Login Pages.** (1) `i18n.tsx`: tambah 44 `auth.*` keys (ID + EN) — form labels, placeholders, role/portal names, toast messages, 2FA errors, select page portal cards, per-role title+subtitle. (2) `PortalTemplate.tsx`: `useTranslation` sudah ada tapi belum dipakai untuk semua string — ganti `portalConfigs` (hardcoded ID) dengan `PORTAL_STYLE` (visual-only, no text); semua text strings (`username`, `password`, `forgotPassword`, `switchPortal`, `login` btn, toast, 2FA error, `accessDenied`, `footer`) → `t("auth.*")`. (3) `app/login/[role]/page.tsx`: hapus `roleConfigs` hardcoded EN; tambah `useTranslation`; gunakan `t("auth.login.{role}.title")` + `t("auth.login.{role}.subtitle")`. (4) `app/login/select/page.tsx`: hapus static `portals` array; tambah `useTranslation`; portal cards render dari `PORTAL_STYLE` (visual) + `t("auth.select.{id}.title/role/desc")` (text); header + footer → `t("auth.select.*")`. **Total: 3 file, +44 auth.* keys, login/auth pages 100% reaktif ID/EN.** | 29 Apr 2026 |
| **51** | **i18n — MLOpsDashboardPage + CashManagementPage.** (1) `MLOpsDashboardPage`: tambah `useTranslation` import; pindahkan `STATUS_CONFIG`, `JOB_STATUS_CONFIG`, `TRIGGER_LABEL` ke dalam komponen sebagai computed values dengan `t()`; ganti 30+ hardcoded string (header, subheader, buttons, toast, KPI labels, tab labels, chart titles, status badges, training/versions section) dengan `t("mlops.*")` calls; tambah 44 mlops.* keys ke `i18n.tsx` (ID + EN). (2) `CashManagementPage`: hapus static `const LABELS` (59 baris modul-level hardcoded ID); ganti seluruh `LABELS.*` refs dengan direct `t("cm.*")` calls (~55 referensi: page title/subtitle, KPI, filter, table headers, pagination, modal fields, validation errors, delete body template, drawer fields); tambah 14 missing cm.* keys ke `i18n.tsx` (validation, pagination.page/prev/next, modal.close, drawer.close, delete.body, btn.addAria, page.skipLink); form errors sekarang reactive terhadap bahasa aktif. **Total: 2 file komponen, +58 i18n keys, 100% reaktif bahasa ID/EN.** | 29 Apr 2026 |

---

### ✅ Phase 1 — Foundation & Authentication
- Login page dengan form username/password
- Role-based authentication (4 roles)
- Session management & protected routes via `RouteGuard`
- i18n Bahasa Indonesia + English

### ✅ Phase 2 — Core POS System
- Grid produk dengan kategori & search filter
- Cart management (tambah, edit quantity, hapus item)
- Auto-calculate subtotal, total, kembalian
- Modal pembayaran: Tunai & QRIS
- Stock Check view (read-only)
- ✅ Print struk fungsional — `printReceipt()` di `PaymentModal.tsx` (popup thermal receipt + `window.print()`)
- ✅ Diskon per item + per transaksi
- ✅ Hold Transaksi, Split Payment (CASH + QRIS), Barcode Scanner (F1)
- ✅ Price List Layanan (`ServicePanel` 15 services)
- ✅ Job Queue Antrian Cetak (`JobQueuePanel`)
- ✅ Refund/Retur (`RefundModal` 3-step flow)

### ✅ Phase 3 — Admin Dashboard
- 4 KPI cards: Omzet, Transaksi, Rata-rata, Item Terjual
- `TopProductsChart` (bar chart horizontal + ranking)
- `LowStockAlert` (list kritis + progress bar + quick action)
- `ForecastChart` (line chart AI prediction)
- ✅ Toggle Harian/Mingguan/Bulanan fungsional

### ✅ Phase 4 — Inventory Management
- Tabel produk: SKU, nama, kategori, harga, stok, satuan, threshold, status badge
- Search, filter kategori, pagination (10/page)
- `ProductForm` (add/edit dengan validasi), `StockUpdateModal`, `StockHistoryTable`
- ✅ Sort by column fungsional (toggle asc/desc di Produk/Stok/DOI)
- ✅ Export CSV `StockHistoryTable` → `riwayat-stok-[tanggal].csv`
- ✅ `StockOpnameModal` (hitung fisik vs sistem + rekonsiliasi selisih)
- ✅ `StockTransferModal` (transfer antar cabang + riwayat)

### ✅ Phase 5 — AI Forecasting
- Historical sales chart (line chart)
- Prediction chart dengan confidence interval (dashed line)
- Akurasi model badge (MAE, RMSE)
- Recommendation cards per produk (stok / prediksi 7 hari / restok)
- WhatIf Simulator
- XAI / Explainable AI (SHAP visualization)
- ⚠️ **Bonus:** XAIPage adalah fitur tambahan di luar spec awal

### ✅ Phase 6 — Transaction History
- Tabel transaksi: ID, tanggal/waktu, item, total, metode, kasir
- Search by ID + filter tanggal (date range) + filter metode bayar
- Detail modal (header + item table + summary + uang diterima/kembalian)
- ✅ Export CSV fungsional → `transaksi-[tanggal].csv`
- ✅ Tombol PDF via `window.print()`

---

### ✅ Phase 7 — Navigation Gap (P0 Pages)
- ✅ **Manajemen Kas** (`/manajemen-kas`) — KPI kas, catat transaksi, riwayat shift
- ✅ **Pergerakan Stok** (`/pergerakan-stok`) — log masuk/keluar/adjustment/transfer/retur dengan filter
- ✅ **Manajemen Pengguna** (`/manajemen-pengguna`) — CRUD user, role badge, cabang, toggle status

### ✅ Phase 8 — Navigation Gap (P1 Auth & Security)
- ✅ **Forgot Password** (`/login/forgot-password`) — flow 4-step (email → sent → reset → success)
- ✅ **Accept Invite** (`/accept-invite/[token]`) — invite card → setup akun → success
- ✅ **Change PIN** (Pengaturan → Keamanan) — wizard 4-digit PIN boxes, 3-step verifikasi
- ✅ **2FA Wizard** (Pengaturan → Keamanan) — toggle, QR code mock, OTP verify, backup codes
- ✅ **Login History** — tabel log per device/IP/status
- ✅ **"Lupa Password?"** link di semua portal login

### ✅ Phase 9 — Navigation Gap (P2 Intelligence & Monitoring)
- ✅ **MLOps Dashboard** (`/mlops`) — 4 service status, 5 KPI cards, Accuracy Timeline, Feature Importance, Per-Category Metrics, Training Jobs, Model Registry (promote/rollback)
- ✅ **Notif Polling** — `NotificationCenter` dengan `setInterval` 30s + rotating mock + footer timestamp + live dot

### ✅ Phase 10 — Navigation Gap (P3 Polish & Global UX)
- ✅ **Dark Mode** — Sun/Moon toggle di Header, `dark:` classes di Layout+Header, body `dark:bg-slate-950`, hotkey `D`
- ✅ **Command Palette** (`Cmd/Ctrl+K`) — global modal di Header, fuzzy search routes+quick actions+settings, keyboard nav (↑↓ Enter Esc)

---

### ✅ Phase 11 — Global Design System Alignment

Sinkronisasi dark mode + typography + modal standardization di seluruh halaman, dilakukan dalam **4 batch**.

<details>
<summary><strong>Batch 1 — 8 pages umum</strong></summary>

- **TransactionHistory** — mock data fotokopian (Print B&W/Cetak Foto/Laminasi/Jilid/Stiker/Scan), dark mode penuh, modal `rounded-3xl` + `zoom-in-95 slide-in-from-bottom-4 duration-200` + `backdrop-blur-sm`
- **UserManagement** — CTA `font-black uppercase tracking-widest shadow-indigo-100`, modal standardization
- **Laporan / Pengaturan** — h1 `font-bold→font-black`
- **PrediksiStok / XAI** — h1 `font-black dark:text-slate-100`, `border-b dark:border-slate-800`
- **Dashboard** — KPI card `rounded-xl→2xl`, icon bg dark variants, value `font-bold→font-black`

</details>

<details>
<summary><strong>Batch 2 — KasirPage + 7 POS components</strong></summary>

- **KasirPage** — h2 `font-black`, separator + shift badge + loading + empty state dark
- **Custom Price Modal** — backdrop `/50→/60`, `zoom-in-95`, icon bg dark, input dark, close `p-1.5 rounded-xl`
- **CartPanel** — container/header/items/qty control full dark mode
- **ProductCard** — image area `dark:bg-slate-800`, Package icon dark, price footer dark
- **RefundModal / PaymentModal** — `rounded-3xl`, `backdrop-blur-sm`, success + main modal full dark
- **StockCheckView / ServicePanel / JobQueuePanel** — container/search/categories/inputs full dark

</details>

<details>
<summary><strong>Batch 3 — UserProfile + Pengaturan (7 sub-tabs)</strong></summary>

- **UserProfile** — ROLE_CONFIG dark variants untuk 3 role, +inventory_manager (teal)
- **Pengaturan 7 tabs** — Profile (2FA card dark) / Toko / AI (slider + toggle cards) / Notifikasi (threshold + channel buttons) / Akses (invite + team table + permissions) / Keamanan (change PW + QR + OTP + PIN) / Logout

</details>

<details>
<summary><strong>Batch 4 — StockMovement / MLOpsDashboard / Inventaris + 5 inventory sub-components</strong></summary>

- **StockMovement** — TYPE_CONFIG badges dark, drawer backdrop `/40→/60`
- **MLOpsDashboard** — STATUS_CONFIG + JOB_STATUS_CONFIG dark, h1 + KPI cards + tabs + tables full dark
- **Inventaris** — h1 `font-bold→font-black`, summary KPI icon dark, stock bar dark, DOI/status badge dark, drawer dark
- **5 inventory modals** — `ProductForm`, `StockUpdateModal`, `StockHistoryTable`, `StockOpnameModal`, `StockTransferModal` — container/header/inputs/tables/footers full dark mode

</details>

### ✅ Phase 12 — Domain Polish Pass

Iterasi UX refinement per halaman setelah Batch alignment.

<details>
<summary><strong>User Profile / Stock Movement / Dashboard</strong></summary>

- **User Profile** — full rewrite: `useAuth()` untuk nama/role/2FA, Edit Profile modal (avatar upload + validasi + toast), security toggles fungsional, Sign Out wired ke `logout()`
- **Stock Movement** — modal tambah 8-field dengan validasi, detail drawer slide-over, date filter (Hari Ini/Kemarin/Pekan/Semua), pagination 8/hal. **Bug fixes:** `useMemo→useEffect` untuk side effect, `idCounter` module→`useRef`, hardcoded date `"22 Apr"→_fmt(new Date())`, qty mock standardized (out/transfer negatif), filter bar row 2 labeled (Tipe: / Kategori:) + tombol Reset kondisional, modal form + Stok Sebelumnya + Nama Operator field, pagination ellipsis `getPaginationRange`
- **Dashboard** — Period selector KPI (Hari Ini/Pekan/Bulan), **Filter per Cabang** (pill Semua/HQ/Tangerang/Bekasi), **Laporan Konsolidasi Multi-Cabang** (table Omzet/Transaksi/Pertumbuhan/Stok Kritis/Staff per cabang + TOTAL row + drill-down click), "Full Report" wired ke `/laporan`

</details>

<details>
<summary><strong>Cash Management / User Management</strong></summary>

- **Cash Management** — Tutup Shift modal (konfirmasi + badge Shift Ditutup), delete transaksi inline confirm, toast save/delete/export/shift
- **P&L Summary** tab — 4 KPI (Pendapatan Bruto/Laba Kotor/Beban Operasional/Laba Bersih) + breakdown Sumber Pendapatan (4 item + progress bar) + breakdown Beban HPP+OPEX (5 item + badge HPP/OPEX) + footer Net Margin
- **Petty Cash** tab — balance card + Isi Dana modal (quick-select 50rb/100rb/200rb/500rb + nominal bebas) + Catat Keluar modal (kategori + validasi saldo) + riwayat + total footer
- **User Management** — delete confirm inline di dropdown, toast save/toggle/delete

</details>

<details>
<summary><strong>Kasir / Laporan / Pengaturan / Inventaris</strong></summary>

- **Kasir** — Dark mode pada sidebar, kategori, search bar, content area, footer status bar
- **Laporan** — Dark mode semua chart/tabs/KPI, Download PDF wired, template PDF/XLS wired. Bahasa bisnis fotokopian: pie chart (Print Dok./Cetak Foto/Fotokopi/Laminasi/Jasa), top products (Print B&W/Cetak Foto/dst), 4 KPI dibenahi (Items Sold→Jumlah Transaksi, Kerusakan 28 Item→Kerugian Bahan Rp 420rb, Akurasi AI→Margin Kotor 34.2%). Label teknis dihilangkan (Celery references removed)
- **Pengaturan** — Toast save, dark mode semua 7 tab, form/tabel/section borders
- **Inventaris** — Dark mode penuh (header/cards/tabel/drawer/pagination), Export toast, semua modal onSubmit wired ke toast
- **Inventaris Excel Import** — Tombol "Import Excel" di header, modal 3-langkah (Upload drag-drop → Preview & Validasi per-baris → Confirm), template download mock, column legend (wajib/opsional), validasi error highlight (SKU kosong, harga 0)

</details>

<details>
<summary><strong>Frontend Audit P0 Fixes — 26 April 2026</strong></summary>

- **Security — console.log removal:** Hapus 7 `console.log` yang mencetak user/product data di production code. `InventarisPage` (4: onSubmit product/stock/opname/transfer → `void data`) + `UserManagementPage` (3: handleDeleteUser, handleSubmit create/update → `TODO: API integration` comment). Semua callback tetap fungsional, toast feedback tidak terganggu.
- **Security/RBAC — RouteGuard nested route fix:** `routes.find(r => r.path === pathname)` exact-match diganti dengan `pathname === r.path || pathname.startsWith(r.path + "/")` untuk cover semua sub-routes dan dynamic segments. Special case untuk root `/` tetap exact match. TypeScript cast `as readonly string[]` untuk `allowedRoles.includes(role)` type compatibility. Error message digeneralisasi (tidak expose pathname).
- **Dark Mode — PrediksiStokPage (full):** 22 lokasi ditambahkan `dark:` variants — `PriorityBadge` styles (rose/amber/emerald), info button, critical alert banner, 2 chart cards (bg/border/heading), DataTable (wrapper/header/search input/horizon toggle/category pills/table head/body dividers/row hover/deficit row/all text colors/confidence bar/pagination footer).
- **Dark Mode — LaporanPage (partial gaps):** 10 lokasi yang belum tercoverage ditambahkan `dark:` variants — KPI change badges (rose/emerald), pie chart legend value, top products cards (bg/border/text/rank number/trend badge), sales toggle buttons, restock table (header/dividers/hover/body text), download tab heading.

</details>

<details>
<summary><strong>CashManagement + StockMovement Design System Alignment</strong></summary>

- **StockMovement** — full token migration: `T.*`, `R.*`, `Z.*`, `GAP/STACK/PAD/ICON/ICON_BY_CONTEXT`, `C.*`, `CARD/MODAL/DRAWER`, `BTN`, `A11Y.focusRing.*`, `BACKDROP.overlay`, `FOCUS.ring`, `formatDate()`, `TYPE_META` canonical badges, `EmptyState`, `htmlFor` labels, `aria-label` icon buttons, focus-visible rings, keyboard Escape handling. **0 banned patterns.** **Search Input Bug Fix (24 Apr ~16:30):** `pl-10` was overridden by `PAD.inputMd` (`px-4`) via tailwind-merge — fixed by reordering to `cn("w-full", PAD.inputMd, "pl-10", R_COMPONENT.input, ...)` in search + 2 modal inputs. Hardcoded `"border-rose-500"` → `C.destructive.border`. **Table Row Audit (24 Apr ~14:15):** 5 bugs fixed — (1) `role="button"` on `<tr>` removed (breaks ARIA table semantics); (2) hardcoded `<tr>` className → `TABLE.row + TABLE.rowHover`; (3) type badge missing `BADGE.base` (border invisible) → `BADGE.base + BADGE.size.sm`; (4) status badge pending variant broken (`border` class missing, wrong `dark:` prefix on light-mode color, missing `dark:text-amber-400`) → `BADGE.base + BADGE.size.xs + BADGE.variant.warning/success/neutral`; (5) drawer type badge same `BADGE.base` fix. Added `TABLE, BADGE` import from `@/app/lib/data`. **Drawer Blur Bug Fix (24 Apr ~15:30) — both StockMovement + CashManagement:** Drawer panel was nested INSIDE the backdrop `<motion.div>`. The backdrop's `initial={{ opacity: 0 }}` applied to the entire subtree including the drawer, making the drawer invisible/transparent during the fade-in animation. Additionally, `backdrop-filter: blur()` on the backdrop creates a new CSS containing block for `position: fixed` children, causing positioning issues. Fixed by separating backdrop and drawer as **siblings** inside `<AnimatePresence><>...</></>` with `key="drawer-backdrop"` and `key="drawer-panel"`. Backdrop onClick simplified to `() => setIsDrawerOpen(false)` (no longer needs `e.currentTarget === e.target` guard since drawer is not a child). `aria-hidden="true"` added to backdrop.
- **CashManagement** — **full rewrite dari nol** dengan 100% design system token compliance. Semua hardcoded Tailwind classes diganti: `T.*` typography, `C.*` colors, `R.*` / `R_COMPONENT.*` radii, `E.*` / `E_COMPONENT.*` elevation, `Z.*` z-index, `GAP.*` / `STACK.*` / `PAD.*` spacing, `ICON.*` icon sizing, `CARD.*` / `MODAL.*` / `DRAWER.*` containers, `BTN.*` buttons, `A11Y.focusRing.*` / `A11Y.skipLink` accessibility, `BACKDROP.overlay` modal backdrops, `FOCUS.ring` input focus, `formatRupiah()` / `formatDate()` formatting (no hardcoded `Rp ` atau `toLocaleString`). CRUD lengkap (add/edit/delete dengan validasi), filter (tipe/kategori/status/periode), sort, pagination 8/halaman, modal transaksi baru/edit, detail drawer slide-over, delete confirmation modal, saldo running balance real-time. **Refactored (24 Apr 2026):** root wrapper `PAD.card`, `STATUS_META` tokenized, rose→`C.destructive.*`, `LABELS` i18n-ready. **Design System Audit (24 Apr 2026 ~16:00):** 13 bugs fixed — `BADGE.base+size.*` (border fix P0), `TABLE.head/body/row/rowHover/footer` dari `data.ts`, `MODAL.header justify-between` (P0 close-button layout), status filter option label fix, `MODAL.close` untuk drawer header, `TYPE_META` labels di form select, `GAP.compact` sort buttons, KPI label dark mode, `md:flex-wrap` filter bar, `ICON_BY_CONTEXT` unused import removed. **0 banned patterns.**

</details>

<details>
<summary><strong>XAI — Bahasa Bisnis & Produk Fotokopian</strong></summary>

- Mock products diganti ke CF-4X6/PR-BW/LM-A4
- FACTORS & deskripsi konteks fotokopian (musim wisuda, awal semester, bundling)
- Label teknis di-soften: "Confidence %" → "Keyakinan AI: Sangat Tinggi/Tinggi/Sedang", "Product/Category/Global" → "Produk Ini/Kategori/Rata-rata Toko", "Est. Delta" → "Perkiraan Perubahan"
- InsightCards Global tab → Pola Wisuda / Lonjakan Print Warna / Stok Kertas Menipis / Bundling Print+Jilid

</details>

### ✅ Phase 13 — POS Fotokopian Integration + RBAC 4-Role

Integrasi domain bisnis fotokopian nyata + expansion RBAC.

<details>
<summary><strong>Produk POS Fotokopian (27 items)</strong></summary>

**27 MOCK_POS_PRODUCTS:**
- **Cetak Foto** — 2x3/3x4/4x6 (min qty 5), 4R/5R/8R (custom price)
- **Print** — B&W/Warna/Bolak-balik (harga tetap), HQ/Poster/Stiker (custom price)
- **Fotokopi** — A4/F4
- **Laminasi** — A4/F4/A3 (tetap), Custom Size (custom)
- **Jilid** — Spiral/Mika (tetap), Hard Cover (custom)
- **Jasa** — Edit File/Ketik/Desain (custom), Scan (tetap)

Fallback mock otomatis jika backend offline.

</details>

<details>
<summary><strong>Min Qty + Custom Price + Auto-Deduct + RBAC</strong></summary>

- **Min Qty Enforcement** — field `min_qty` di Product & CartItem, cetak foto mulai dari qty=5 saat pertama ditambah, tombol − di-lock di batas minimum, badge "Min 5" di ProductCard
- **Custom Price (Harga Diskresi)** — field `custom_price` + `price_hint`, ProductCard badge "Custom" + icon Pencil, klik produk custom → modal input harga dengan hint panduan (Print HQ Rp 3-5rb, Jasa Edit gratis/opsional), CartPanel inline pencil untuk edit setelah tambah
- **RBAC 4 Role** — `owner/admin/inventory_manager/cashier` full differentiation, `UserRole` type diperbarui, `mapBackendRoleToFE` 1:1, `routes.tsx` `allowedRoles` per route, Sidebar mirror 3 pilihan (Owner/Inv./Kasir), avatar color per role (indigo/emerald/teal/slate), `PortalTemplate` tambah inventory_manager (emerald), `DashboardPage` pakai `canSeeFinancials`/`canSeeStock`, `switchView` owner+admin only, **MLOps hanya admin**
- **Inventaris Auto-Deduct dari POS** — `inventoryStore.ts` module reactive store, `useCheckout` menulis `deductStock(sku, qty)` setelah setiap checkout, `InventarisPage` subscribe via `useInventoryDeductions()` hook — stok di tabel turun real-time per transaksi, bridge via SKU

</details>

---

### ✅ Phase 14 — Design System Specs (Cluster A–K)

Spec layer design system (**30 dokumen**) dibuat di folder [`Design System/`](../Design%20System/). Quick reference: [`TOKEN_GAP.md §8`](../Design%20System/TOKEN_GAP.md).

<details>
<summary><strong>Cluster A — Foundation (Typography/Colors/Buttons/Spacing/Radii/Elevation/Motion)</strong></summary>

- [`TYPOGRAPHY.md`](../Design%20System/TYPOGRAPHY.md) **v1.1** — Minimal uppercase policy (3 tokens: H4/Micro/Code). Token: `typography.ts` → `T.*`
- [`COLORS.md`](../Design%20System/COLORS.md) **v1.1** — 8-family palette (5 core + 2 extended blue/violet + 1 role teal). Token: `colors.ts` → `C.*`
- [`BUTTONS.md`](../Design%20System/BUTTONS.md) **v1.1** — 13 variants (5 solid + 5 soft + outline/ghost/link) × 5 sizes + composite patterns. Token: `buttons.ts` → `BTN.*` + `btn()` helper
- [`SPACING.md`](../Design%20System/SPACING.md) — 4/8 base scale + semantic categories. Token: `spacing.ts` (see Cluster L)
- [`RADII.md`](../Design%20System/RADII.md) — 6 tier closed system. Token: `radii.ts` (see Cluster L)
- [`ELEVATION.md`](../Design%20System/ELEVATION.md) — 5 shadow tiers + colored glows. Token: `elevation.ts` (see Cluster L)
- [`MOTION.md`](../Design%20System/MOTION.md) — 3 duration tiers + transition recipes. Token: `motion.ts` → `M.*`

</details>

<details>
<summary><strong>Cluster B — Container Components (Cards/Modals/Drawers)</strong></summary>

- [`CARDS.md`](../Design%20System/CARDS.md) — 4 variants + 3 padding tiers + icon box pattern
- [`MODALS.md`](../Design%20System/MODALS.md) — 5 size tiers + anatomy + focus trap
- [`DRAWERS.md`](../Design%20System/DRAWERS.md) — 3 directions (right/bottom/left) + 3 size per direction
- Token: `containers.ts` → `CARD/MODAL/DRAWER`

</details>

<details>
<summary><strong>Cluster D — Form Components</strong></summary>

[`FORMS.md`](../Design%20System/FORMS.md) — Field anatomy 3-4 bagian + unified focus pattern + 7 controls + 7-state matrix.
Token: `forms.ts` → `FIELD/LABEL/INPUT/TEXTAREA/SELECT/CHECKBOX/RADIO/SWITCH/HELPER/ERROR_TEXT`.

</details>

<details>
<summary><strong>Cluster E — Data Display (Tables/Badges/KPI/Avatar)</strong></summary>

- [`TABLES.md`](../Design%20System/TABLES.md) — Row hover unified, header muted, cell padding 3 tiers, `tabular-nums` numeric, sticky header, empty state
- [`BADGES.md`](../Design%20System/BADGES.md) — 4 size tiers + 7 variants + role badge + Avatar
- [`KPI.md`](../Design%20System/KPI.md) — Wrapper + label + value 3 tiers + Trend Indicator (inverted semantic supported)
- Token: `data.ts` → `TABLE/BADGE/AVATAR/KPI/TREND`

</details>

<details>
<summary><strong>Cluster F — Feedback States (Alerts/Empty/Toasts/Loading)</strong></summary>

- [`ALERTS.md`](../Design%20System/ALERTS.md) — 5 variants + 3 size tiers + 4 placement rules + alert-vs-toast mental model
- [`EMPTY_STATES.md`](../Design%20System/EMPTY_STATES.md) — Anatomy (icon/title/description/action) + 5 iconBox variants + dark mode fix
- [`TOASTS.md`](../Design%20System/TOASTS.md) — Sonner wrapper + 4 duration tiers + promise pattern
- [`LOADING.md`](../Design%20System/LOADING.md) — Spinner (5 sizes) + skeleton strategy + progress bar
- Token: `feedback.ts` → `ALERT/EMPTY/LOADING/PROGRESS`

</details>

<details>
<summary><strong>Cluster G — Navigation (Sidebar/Header/CmdPalette/Tabs/Stepper/Breadcrumbs/PageHeader)</strong></summary>

- [`NAVIGATION.md`](../Design%20System/NAVIGATION.md) — App chrome: Sidebar `bg-slate-900` + Header `sticky top-0 z-40 h-14 bg-white/80 backdrop-blur-sm` + CmdPalette `Ctrl+K`
- [`TABS.md`](../Design%20System/TABS.md) — 3 variants (pill/underline/segmented) + Stepper (horizontal/vertical, 3 states)
- [`BREADCRUMBS.md`](../Design%20System/BREADCRUMBS.md) — Segment + separator + truncation + PageHeader pattern
- Token: `nav.ts` → `SIDEBAR/HEADER/NAV_LINK/TABS/STEPPER/BREADCRUMB/PAGE_HEADER`

</details>

<details>
<summary><strong>Cluster H — Overlays (Popover/Tooltip/HoverCard/Dropdown/ContextMenu)</strong></summary>

[`OVERLAYS.md`](../Design%20System/OVERLAYS.md) — Decision tree: tooltip=hover label / hovercard=hover rich / popover=click inline / dropdown=click menu / contextmenu=right-click. Tooltip (dark surface) vs HoverCard (light surface) distinction.
Token: `overlays.ts` → `POPOVER/TOOLTIP/HOVER_CARD/DROPDOWN/CONTEXT_MENU`.

</details>

<details>
<summary><strong>Cluster I — Charts & Data Viz</strong></summary>

[`CHARTS.md`](../Design%20System/CHARTS.md) — Recharts patterns, 7-series palette (indigo/emerald/amber/blue/violet/rose/teal), axis/grid/tooltip styling, height tiers, dark mode adaptation.
Token: `charts.ts` → `CHART_COLORS/CHART_AXIS/CHART_GRID/CHART_TOOLTIP/CHART_LEGEND/CHART_HEIGHT` + `getChartColors()` dark mode helper.

</details>

<details>
<summary><strong>Cluster J — Accessibility (Horizontal Meta-Spec)</strong></summary>

[`A11Y.md`](../Design%20System/A11Y.md) — WCAG 2.1 AA horizontal spec: focus-visible, keyboard navigation, ARIA patterns, color contrast, motion-safe/reduce, form a11y, skip link.
Token: `a11y.ts` → `A11Y.focusRing.*` (canonical untuk buttons/links), `srOnly`, `skipLink`, `motionReduce/Safe`, `tapTarget`, `fieldA11yProps()`, `KEYS.*`, `LIVE_REGION.*`.

</details>

<details>
<summary><strong>Cluster K — Enterprise Readiness (5 meta-specs)</strong></summary>

- [`ENTERPRISE_GAP.md`](../Design%20System/ENTERPRISE_GAP.md) — Maturity assessment L1–L5 (current: **47% = L2→L3**), 12 dimensions scoring, 11 gap categories, Q2–Q4 2026 roadmap
- [`PATTERNS.md`](../Design%20System/PATTERNS.md) — 9 page patterns (Dashboard/List/MasterDetail/Form/Wizard/Workspace/ErrorPages/FirstRun/Auth)
- [`CONTENT.md`](../Design%20System/CONTENT.md) — Voice & tone + microcopy (buttons/labels/placeholders/loading/empty/errors/success/confirmations)
- [`TERMINOLOGY.md`](../Design%20System/TERMINOLOGY.md) — Domain glossary (4 roles + 60+ terms + fotokopian-specific)
- [`RESPONSIVE.md`](../Design%20System/RESPONSIVE.md) — Breakpoints + device matrix + touch vs mouse + print. Token: `responsive.ts`
- [`I18N.md`](../Design%20System/I18N.md) — next-intl + ICU format + locale formatting (id/en) + RTL future

</details>

---

### ✅ Phase 15 — Token Layer Expansion (Cluster L, 23 Apr 2026)

Audit menyeluruh terhadap 13 existing token files menemukan **adoption rate ~0%** (tokens exist tapi developer masih hardcode). Ditemukan 7 inkonsistensi internal (4 di-fix), 11 missing concepts, 3 spec-to-token gaps.

**🔧 4 Inkonsistensi fixed:**
1. 🔴 **Banned color violations** (13 instances di data.ts/feedback.ts/nav.ts/charts.ts) → `colors.ts` upgrade v1.1 extended palette
2. 🔴 **Cashier role kontradiksi** (slate vs emerald) → `data.ts` BADGE/AVATAR.role.cashier = emerald (align canonical)
3. 🟡 **FOCUS ring duplikat** → `forms.ts` `FOCUS.*` di-deprecate, `A11Y.focusRing.*` canonical
4. 🟡 **Container max-width overlap** → policy clarified (page-level vs overlay-level distinct)

**✨ 7 Token files baru:**

| File | Exports | Purpose |
|---|---|---|
| `radii.ts` | `R.*`, `R_COMPONENT.*`, `R_DIRECTIONAL.*`, `BANNED_RADII`, `nestedRadius()` | Border radius 6 tiers + 40 per-component + nesting rule |
| `elevation.ts` | `E.*`, `E_COMPONENT.*`, **`Z.*` (12-layer registry)**, `Z_NUMERIC.*`, `BANNED_Z` | Shadows + colored glows + **Z-INDEX registry** |
| `spacing.ts` | `S/GAP/STACK/ROW/ICON/ICON_BY_CONTEXT/PAD.*`, `iconSizeForButton()` | Base scale + semantic gap + icon sizes |
| `layout.ts` | `LAYOUT_PX/CLASS/TEMPLATE.*` | Header-h/sidebar-w/content widths/page templates |
| `format.ts` | `formatRupiah/Number/Percent/Date/Relative/Duration/FileSize/PhoneID/truncate/maskId/maskEmail` | **Centralized formatters** (replace 111 hardcoded `Rp ` + 62 `toLocaleString`) |
| `status.ts` | `TXN_STATUS/PRODUCT_STATUS/STOCK_STATUS/USER_STATUS/SHIFT_STATUS/SYNC_STATUS/PRIORITY.*` + **`ROLE.*`** | Status → variant + role → color mapping canonical |
| `utility.ts` | `CURSOR/OPACITY/ALPHA/BORDER_W/RING_W/BACKDROP/SELECT/POINTER/SCROLL/TRANSFORM/WHITESPACE/ASPECT.*` | Micro-utility presets |

**🔄 1 Token file extended:** `motion.ts` + accordion/collapsible/slide/pageEnter/shimmer/cardLift + **`DELAY.*`** stagger + **`stagger()`** helper + **`TIME.*`** 17 ms constants (toast dismissal / debounce / polling / session timeout).

**📄 2 Spec docs baru/updated:**
- [`COLORS.md` v1.1](../Design%20System/COLORS.md) — 8-family palette documented
- [`TOKEN_GAP.md`](../Design%20System/TOKEN_GAP.md) — meta audit + 3-phase migration roadmap + quick reference index

**📊 Coverage results:** Token layer **65% → 95%**, internal consistency **72% → 98%**. Migration sprint dilanjutkan di Phase 16.

---

### ✅ Phase 16 — Token Adoption Migration Sprint (23 Apr 2026)

Migrasi masif hardcoded styles → design tokens di seluruh halaman utama + komponen anak. Total **37 file** (29 page + 8 shared components), **8 cluster** dalam 1 sprint.

**📦 Scope migrated:**

| Cluster | Files | Key Tokens |  
|---|---|---|
| **Dashboard** | `DashboardPage` + `LowStockAlert`, `TopProductsChart`, `ForecastChart` | `T.*`, `R_COMPONENT.kpi`, `E_COMPONENT.*`, `formatRupiah` |
| **Inventaris** | `InventarisPage` + 6 modals (`ProductForm`, `StockUpdate/History/Opname/Transfer`, `ExcelImport`) | `T.*`, `R.*`, `E.*`, `Z.*`, `formatRupiah` |
| **Kasir** | `KasirPage` + 7 komponen POS (`ProductCard`, `CartPanel`, `PaymentModal`, `Refund`, `ServicePanel`, `JobQueue`, `StockCheck`) | `T.*`, `R.*`, `E.*`, `Z.*`, `formatRupiah` |
| **Laporan** | `LaporanPage` + `ExportShareModal`, `ExplanationCharts` | `T.*`, `R.*`, `E.*`, `Z.*` |
| **Login** | `PortalTemplate` (4 role variants: owner/admin/inventory_manager/cashier) | `T.*`, `R.*`, `E.*` |
| **Riwayat Transaksi** | `TransactionHistoryPage` | `T.*`, `R.*`, `E.*`, `Z.*`, `formatRupiah`, `formatNumber` |
| **Prediksi Stok** | `PrediksiStokPage` + `PredictionTable` + `KPICards` | `T.*`, `R.*`, `E.*`, `Z.*` |
| **Manajemen Kas** | `CashManagementPage` | `T.*`, `R.*`, `R_COMPONENT.*`, `Z.*`, `C.*`, `GAP.*`, `STACK.*`, `PAD.*`, `ICON.*`, `ICON_BY_CONTEXT.*`, `CARD.*`, `MODAL.*`, `DRAWER.*`, `BTN.*`, `A11Y.*`, `BACKDROP.*`, `FOCUS.*`, `formatRupiah`, `formatDate`, `EmptyState` |
| **Shared / System** | `CommandPalette`, `ErrorBoundary`, `Skeletons`, `EmptyState`, `UserProfilePage`, `PengaturanPage`, `MLOpsDashboardPage`, `XAIPage`, `Breadcrumbs`, `Header`, `LoadingBar`, `NotificationCenter`, `ExportShareModal`, `XAIComponents` | `T.*`, `R.*`, `E.*`, `Z.*`, `formatRupiah`, `formatNumber` |
| **Pergerakan Stok** | `StockMovementPage` | `T.*`, `R.*`, `E.*`, `Z.*`, `C.*`, `CARD/MODAL/DRAWER`, `formatDate`, `A11Y`, `BACKDROP`, `FOCUS`, `BTN`, `TYPE_META` |
| **Manajemen User** | `UserManagementPage` | `T.*`, `R.*`, `E.*`, `Z.*`, `C.role*`, `getRoleInfo`, `formatPhoneID`, `formatDate`, `A11Y`, `BACKDROP`, `FOCUS`, `BTN` |

**🐛 BANNED patterns dieliminasi:**
- `rounded-md` → `R.sm` / `R.md` (**0 remaining** di seluruh codebase)
- Arbitrary z-index `z-[1001]`, `z-[1002]`, `z-[200]`, `z-[2000]`, `z-[1010]`, `z-[100]`, `z-[110]` → `Z.overlay` / `Z.modal` / `Z.dropdown` / `Z.popover` (**0 remaining**)
- `font-extrabold` (BANNED) → `font-bold` (**0 remaining**)
- `font-mono` (BANNED) → `T.code` / `font-data` (**0 remaining**)
- `text-[7px]` a11y violations → `T.micro` (9px floor) (**0 remaining**)
- `text-[8px]`, `text-[9px]`, `text-[10px]`, `text-[11px]` → `T.micro` / `T.label` / `T.caption` / `T.h4` / `text-xs` (normalized ke token)
- `text-[12px]`, `text-[13px]` → `T.dataSm` / `T.bodySm`
- `w-N h-N` icon sizing → `size-N` (all square icons)
- `Rp ` + `toLocaleString("id-ID")` → `formatRupiah()` / `formatNumber()` (111 target → **0 remaining** di seluruh app-owned source. Sisa hanya di `format.ts` dan `charts.ts` sebagai canonical implementations.)
- Pre-existing TS bug: `locale` → `lang` di `ExportShareModal`

**📈 Metrics after sprint (updated 24 Apr 2026 ~07:35):**
- Token imports (% app-owned .tsx): <1% → **~95%** ✅
- Arbitrary `z-[*]` usages: 12 → **0** ✅
- `text-[7px]` a11y violations: 15+ → **0** ✅
- `text-[8px]` / `text-[9px]` / `text-[10px]` / `text-[11px]` arbitrary: 80+ → **0** ✅
- `rounded-md` legacy: 70 → **0** ✅
- `font-extrabold` / `font-mono`: 3+ → **0** ✅
- `Rp ` hardcoded + `toLocaleString`: 111 → **0** (sisa hanya di `format.ts` / `charts.ts` sebagai canonical implementations)
- App-owned shared components: 8 file (`Breadcrumbs`, `CommandPalette`, `ErrorBoundary`, `ExportShareModal`, `Header`, `LoadingBar`, `NotificationCenter`, `XAIComponents`) → **0 banned patterns** ✅
- Pages: `UserManagementPage` → **0 banned patterns, ROLE_CONFIG removed, canonical role badges via `getRoleInfo` + `C.role*`** ✅
- Pages: `StockMovementPage` → **0 banned patterns, TYPE_CONFIG removed, canonical movement type badges via `TYPE_META` + `C.*` + `CARD/MODAL/DRAWER`** ✅
- Pages: `CashManagementPage` → **0 banned patterns, full rewrite dari nol, 100% token compliance, A11Y full pass (`htmlFor`, `aria-label`, `focus-visible`, skip-link, keyboard Escape), CRUD + filter + sort + pagination + modal + drawer + saldo calculation** ✅
- `TOKEN_GAP.md` updated to v1.2

---

### ✅ Phase 17 — Design System Migration Sprint: XAIPage + PengaturanPage (25 Apr 2026)

Refaktorisasi `XAIPage.tsx` dan `PengaturanPage.tsx` untuk mengganti semua **hardcoded styles** dengan token terpusat dari Design System. Ini adalah kelanjutan langsung dari Phase 16 yang belum menyentuh kedua halaman tersebut secara penuh.

**🎯 Scope:** 2 file halaman utama — `XAIPage.tsx` + `PengaturanPage.tsx`

**📦 Imports baru ditambahkan:**
- `btn`, `BTN` dari `@/app/lib/buttons`
- `INPUT`, `TEXTAREA`, `SWITCH`, `FIELD`, `LABEL` dari `@/app/lib/forms`
- `ICON` dari `@/app/lib/spacing`

**🔧 Perubahan di `XAIPage.tsx`:**

| Pattern Lama | Token Baru |
|---|---|
| `font-black uppercase tracking-widest` di tab headers | `font-bold border-b-2` — sesuai Typography v1.1 |
| `w-3.5 h-3.5`, `w-4 h-4`, `w-6 h-6` icon hardcoded | `ICON.sm`, `ICON.md`, `ICON.xl` dari `spacing.ts` |
| `h-12 w-12 flex items-center` | `size-12 flex items-center` |
| Hardcoded button class (Share2 button) | `btn("ghost", "sm", { icon: true })` |
| Hardcoded CTA button inline-style panjang | `btn("neutral", "md")` |
| Custom toggle hand-rolled `div` (Promo) | `SWITCH.base + SWITCH.on/off + SWITCH.thumb + SWITCH.thumbOn/Off` |
| `role="tab"` + `aria-selected` missing | ✅ ditambahkan (A11Y fix) |
| `h2` / heading hardcoded | `T.h2`, `T.h3`, `T.h4`, `T.caption` |
| Underline tab indicator via `<motion.div>` | Native `border-b-2 border-indigo-500` (simpler, no JS) |
| `uppercase italic tracking-wider` di deskripsi | Dihapus — comply Typography v1.1 |

**🔧 Perubahan di `PengaturanPage.tsx`:**

| Pattern Lama | Token Baru |
|---|---|
| `font-black uppercase tracking-[0.2em]` di header H1 | `T.h2` dari `typography.ts` |
| `font-black uppercase tracking-widest` di Save button | `btn("neutral", "md")` |
| `font-black uppercase tracking-widest` di sidebar nav tabs | `BTN.base + BTN.size.md + BTN.variant.neutral` |
| `space-y-2 + font-black label` (semua input fields) | `FIELD.wrapper + LABEL.base` |
| Hardcoded 80-char input class (8+ instances) | `INPUT.base + INPUT.size.md/sm` |
| Hardcoded textarea class | `TEXTAREA.base + TEXTAREA.size.sm + TEXTAREA.noResize` |
| Custom toggle `div` hand-rolled (receipt auto, 8 notif toggles) | `SWITCH.base + SWITCH.on/off + SWITCH.thumbOn/Off` + `role="switch" aria-checked` |
| Hardcoded button: Save, 2FA, Invite | `btn("neutral")`, `btn("primary")`, `btn("primary", "sm")` |
| Hardcoded button: Danger Zone (Reset + Delete) | `btn("destructiveSoft", "sm")`, `btn("destructive", "sm")` |
| Hardcoded button: Logout (Cancel + Confirm) | `btn("neutralSoft", "md")`, `btn("destructive", "md")` |
| Password fields hardcoded class | `INPUT.base + INPUT.size.md` |
| Update Password button hardcoded | `btn("neutral", "sm")` |

**🐛 A11Y fixes yang ikut diperbaiki:**
- `role="switch"` + `aria-checked` pada semua toggle buttons
- `role="tab"` + `aria-selected` pada tab navigation XAIPage
- `aria-label` pada icon-only buttons (Share, ThumbsUp, ThumbsDown)

**📊 Banned patterns dieliminasi:**
- `font-black` (BANNED) → `font-bold` via token — **0 remaining di XAIPage + PengaturanPage**
- `uppercase tracking-widest` di body text → dihapus sesuai Typography v1.1
- `w-N h-N` icon sizing → `size-N` / `ICON.*`
- Hardcoded toggle `div` → `SWITCH.*` token dengan proper ARIA
- `space-y-2` + ad-hoc label → `FIELD.wrapper + LABEL.base`

---

### ✅ Phase 18 — shadcn Tabs Adoption: XAIPage + PengaturanPage ARIA (25 Apr 2026)

Adopsi `<Tabs>` primitif dari shadcn/ui di `XAIPage.tsx`, dan penambahan ARIA-compliance penuh di sidebar nav `PengaturanPage.tsx` mengacu spec `TABS.md §3–5`.

**🔧 XAIPage — Hand-rolled → shadcn `<Tabs>` (Underline variant)**

| Sebelum | Sesudah |
|---|---|
| `const [activeTab, setActiveTab] = useState<TabId>` | Dihapus — state dikelola Radix `TabsPrimitive.Root` |
| Manual `<button>` dengan `onClick` + `aria-selected` | `<TabsTrigger value={tab.id}>` Radix-managed |
| Conditional `{activeTab === "X" && <motion.div>}` | `<TabsContent value="X">` native Radix |
| `AnimatePresence + motion.div` per tab | Dihapus — native tab visibility |
| Inline class `border-b-2 border-indigo-500` | `TABS.trigger.underline.base + data-[state=active]` dari `nav.ts` |
| Import: tidak ada Tabs primitif | `import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs"` |
| Import: tidak ada TABS token | `import { TABS } from "@/app/lib/nav"` |

**Keyboard nav** sekarang fully native via Radix: `Arrow Left/Right`, `Home`, `End`, `Enter/Space` — sesuai TABS.md §3.5.

**🔧 PengaturanPage — Sidebar Nav ARIA Compliance (Vertical tablist pattern)**

PengaturanPage *tidak* menggunakan shadcn Tabs karena layout-nya adalah **vertical sidebar nav** (2-column grid), bukan horizontal tab list. Sesuai TABS.md yang membolehkan custom implementation dengan ARIA-compliance.

| Ditambahkan | Nilai |
|---|---|
| `role="tablist"` + `aria-orientation="vertical"` | Pada container sidebar nav |
| `id="tab-{id}"` + `role="tab"` + `aria-selected` + `aria-controls` | Pada setiap tab button |
| `id="panel-{id}"` + `role="tabpanel"` + `aria-labelledby` | Pada content wrapper |

**📦 Imports baru:**
- `TABS` dari `@/app/lib/nav` (kedua file)
- `Tabs, TabsList, TabsTrigger, TabsContent` dari `@/app/components/ui/tabs` (XAIPage)

**📊 Status setelah Phase 18:**
- `XAIPage` — **0 hand-rolled tabs**, fully shadcn Tabs primitif ✅
- `PengaturanPage` — **ARIA-compliant** vertical tablist (WCAG 2.1 AA) ✅
- TypeScript: **0 new errors** di kedua file ✅

---

### ✅ Phase 19 — Custom ESLint Rule (Token Enforcement) (25 Apr 2026)

Implementasi custom ESLint rule untuk secara otomatis memblokir penggunaan class *hardcoded* (banned patterns) agar tim developer patuh pada Design System tokens secara permanen.

**🔧 Konfigurasi (`eslint.config.mjs`)**
Dibuat custom plugin lokal `design-system/no-banned-tokens` yang memparsing `Literal` dan `TemplateElement` node di seluruh JSX/TSX.

**🚫 Patterns yang Diblokir (Error):**
1. `font-black` (harus pakai token tipografi `T.*` atau `font-bold` max)
2. `font-extrabold`
3. `font-mono` (harus pakai `T.code` atau `font-data`)
4. `rounded-md` (harus pakai radius scale `R.*`)
5. Arbitrary z-index seperti `z-[100]`, `z-[2000]` (harus pakai `Z.modal`, `Z.overlay`, dll)
6. Arbitrary pixel text size seperti `text-[9px]`, `text-[10px]` (harus pakai `T.micro`, `T.label`)
7. Hardcoded `"Rp "` string (harus pakai `formatRupiah()`), dengan pengecualian file core formatter `format.ts` dan `charts.ts`.

**📊 Hasil Scan Awal:**
- Rule berhasil men-scan codebase dan mendeteksi legacy hardcoded values yang tersisa di komponen lama (`text-[10px]`, `font-black`).
- ESLint CI/CD sekarang akan *fail* (Exit code 1) jika ada PR baru yang menggunakan class di atas, mengunci maturity level UI ke standard Enterprise (L3).

---

### ✅ Phase 20 — Audit & Remediasi Design System (PengaturanPage) (25 Apr 2026)

Melakukan refaktor komprehensif pada komponen `PengaturanPage` untuk mengatasi 50+ pelanggaran Design System yang sebelumnya lolos dari deteksi.

**🛠️ Perbaikan yang Dilakukan:**
1. **Typography Cleanup**: Menghapus `font-black` inline (yang merupakan anti-pattern) dan menggantinya dengan `font-bold` atau token `T.*` yang diotorisasi.
2. **Heading Standardization**: Mengoreksi style `uppercase` dan `italic` yang salah tempat pada tag `<h3>` di seluruh tab.
3. **Component Alignment**: Mengganti toggles dan buttons buatan manual (*hand-rolled*) dengan token komponen standar seperti `SWITCH.*` dan fungsi utilitas `btn()`.
4. **Spacing & Sizing Discipline**: Mengeliminasi sizing kustom arbitrer (seperti `w-8 h-8`) dan beralih ke token resmi dari `ICON.*` dan utility sizing `size-*`.
5. **Typescript Strictness**: Menghapus penggunaan `any` dan memperbaiki tipe menjadi `React.ElementType` untuk objek icons, sehingga meloloskan validasi ESLint tanpa warnings.

**📊 Status setelah Phase 20:**
- `PengaturanPage` sepenuhnya 100% compliant dengan *InsightSphere Design System* ✅
- Tidak ada warning dari rule `design-system/no-banned-tokens` pada ESLint ✅
- Integrasi UI yang lebih kokoh dan mudah di-maintain untuk Sprint Integrasi API berikutnya.

---

### ✅ Phase 21 — Audit & Remediasi Design System (StockMovementPage) (25 Apr 2026)

Melakukan refaktor komprehensif pada komponen `StockMovementPage` untuk mencapai 100% kepatuhan pada Design System token, mengatasi 37+ pelanggaran.

**🛠️ Perbaikan yang Dilakukan:**
1. **Pembersihan Banned Patterns**: Menghapus `TYPE_CONFIG` manual dan menggantinya dengan canonical `TYPE_META` (menggunakan warna dari `C.success/C.destructive/C.warning/C.primary`).
2. **Typography Standardization**: Mengganti `text-3xl font-black` menjadi `T.h1`, membenahi tracking uppercase `T.micro`, dan mengandalkan tokens `T.*` untuk sizing font (`text-xs font-bold` → `T.h4` / `T.buttonSm`).
3. **Form Refactoring**: Seluruh form input, text area, dan select pada modal tambah disesuaikan dengan form control primitive `INPUT.base`, `SELECT.base`, dan `TEXTAREA.base`.
4. **Spacing & Radii**: Padding card dari arbitrer `p-4/p-6` menjadi `PAD.card/PAD.modalBody`, gap `gap-4/gap-1.5` disesuaikan dengan `GAP.*`, radius ke `R_COMPONENT.*`.
5. **Logic Bugs Fixes**: Memperbaiki Date Filter agar responsif dan berfungsi sebagai logic sorting/filtering sungguhan dengan tambahan "Semua Periode". Menyesuaikan React Hooks memoization dependencies agar tidak terjadi lag state data.

**📊 Status setelah Phase 21:**
- `StockMovementPage` sepenuhnya 100% compliant dengan *InsightSphere Design System* ✅
- Tidak ada ESLint warning dari rule `design-system/no-banned-tokens` pada komponen ini ✅
- Menyelaraskan seluruh styling Modal dan Drawer agar menggunakan canonical token (`BTN`, `MODAL`, `DRAWER`)

---

### ✅ Phase 22 — Audit Tipografi & Perbaikan Komponen (25 Apr 2026)

Menyelaraskan penggunaan tipografi dan merapikan token di komponen yang masih menggunakan styling hardcoded.

**🛠️ Perbaikan yang Dilakukan:**
1. **Typography `T.h1`**: Mengubah ketebalan font dari `font-black` menjadi `font-bold` di `typography.ts` agar desain terlihat lebih elegan dan konsisten dengan preferensi terbaru.
2. **PengaturanPage**: Mengubah heading halaman dari `T.h2` menjadi `T.h1` untuk konsistensi hierarki judul.
3. **InventarisPage**: Refaktor besar-besaran untuk mengganti utility class Tailwind hardcoded (seperti `text-xs font-bold`) dengan token tipografi standar (`T.buttonSm`, `T.body`, `T.h3`, `T.label`, `T.caption`).

**📊 Status setelah Phase 22:**
- Konsistensi tipografi meningkat drastis pada halaman Inventaris dan Pengaturan ✅
- Header halaman menggunakan `T.h1` yang disesuaikan secara proporsional ✅

---

### ✅ Phase 23 — Lokalisasi i18n Tiga Halaman Utama (25 Apr 2026)

Mengimplementasikan dukungan bilingual penuh (Bahasa Indonesia / English) menggunakan hook custom `useTranslation` pada tiga halaman terakhir yang sebelumnya berisi string hardcoded.

**🛠️ Perbaikan yang Dilakukan:**
1. **Ekspansi `i18n.tsx`**: Menambahkan lebih dari 170 baris mapping dictionary baru (`um.*`, `cm.*`, `sm.*`) yang mencakup halaman UserManagement, CashManagement, dan StockMovement. Memperbaiki casing (Title Case) pada kunci translasi header inventaris.
2. **UserManagementPage**: Mengganti semua string hardcoded (termasuk mock data peran, label kolom tabel, placeholder, text pada status) dengan pemanggilan fungsi `t()`.
3. **CashManagementPage**: Mengintegrasikan hook `useTranslation`, memindahkan objek konstanta `LABELS` ke dalam scope komponen agar reaktif terhadap switch bahasa, dan me-wire setiap key dengan tipe transaksi serta status.
4. **StockMovementPage**: Menyambungkan seluruh template JSX (KPI cards, filter dropdown, tabel header) dengan abstraksi dari sistem i18n sehingga pergantian bahasa ID ↔ EN berjalan mulus tanpa reload.

**📊 Status setelah Phase 23:**
- `UserManagementPage`, `CashManagementPage`, dan `StockMovementPage` 100% mendukung lokalisasi ✅
- Aplikasi secara keseluruhan telah menutupi gap penerjemahan statis (fitur i18n front-end siap pakai) ✅

---

### ✅ Phase 24 — P1 Priority Fixes Sprint (Apr 2026)

Eksekusi seluruh 7 item P1 dari `FRONTEND_AUDIT_REPORT.md` — performance, UX, A11Y, dan design system compliance.

| # | Task | Finding | Hasil |
|---|------|---------|-------|
| P1-1 | **Lazy-load 4 Recharts pages** via `next/dynamic` | #34 | `LaporanPage`, `PrediksiStokPage`, `XAIPage`, `MLOpsDashboardPage` di-lazy-load → ~200KB bundle reduction ✅ |
| P1-2 | **Custom delete modal** menggantikan `window.confirm()` | #20 | `UserManagementPage` — `window.confirm()` dihapus, diganti modal konfirmasi dengan `AnimatePresence` + `BACKDROP.*` + `A11Y.focusRing.*` ✅ |
| P1-3 | **ARIA audit 5 halaman** tanpa accessibility attributes | #26 | `LaporanPage`, `UserManagementPage`, `CashManagementPage`, `StockMovementPage`, `PengaturanPage` — tambah `role`, `aria-label`, `aria-live`, `aria-expanded` ✅ |
| P1-4 | **Fix 10 `<label>` tanpa `htmlFor`** di PengaturanPage | #27 | Semua 10 input field di StoreTab mendapat `htmlFor`+`id` pairing yang benar ✅ |
| P1-5 | **Migrate 55 hardcoded `rose` classes** → `C.destructive.*` | #1 | `KasirPage`, `UserProfilePage`, `DashboardPage`, `XAIPage` — dark mode variants ditambahkan via `C.destructive.*` tokens ✅ |
| P1-6 | **Migrate 40+ hardcoded hex colors** di Recharts → `CHART_COLORS.*` | #3 | `LaporanPage`, `PrediksiStokPage`, `MLOpsDashboardPage`, `XAIPage` — semua hex literals diganti dengan `CHART_COLORS.series[N]`, `.semantic.*`, `.primary.*` ✅ |
| P1-7 | **Pecah 4 mega-components** ke sub-components | #35 | Lihat detail di bawah ✅ |

**🔧 P1-7 Detail — Mega-Component Decomposition:**

| Komponen | Perubahan |
|---|---|
| `PengaturanPage` | 5 tab functions (`StoreTab`, `NotificationsTab`, `AccessTab`, `SecurityTab`, `LogoutTab`) dikonversi ke `const X = memo(function X(...))`. `handleGoBack` di-wrap `useCallback`. Import: `memo, useCallback` ditambah. |
| `UserManagementPage` | `UserTableRow` diekstrak sebagai `memo`'d sub-component (120+ baris JSX dipindah). Props: `user`, `isDropdownOpen`, `dropdownRef`, `onToggleDropdown`, `onEdit`, `onDelete`, `t`. Handler `handleEditUser`, `handleDeleteUser`, `handleToggleDropdown` di-wrap `useCallback`. |
| `StockMovementPage` | `memo, useCallback` ditambahkan ke React import sebagai fondasi untuk decomposition berikutnya. |
| `CashManagementPage` | Handlers sudah menggunakan `useMemo` (filter/sort/paginate). Persiapan `useCallback` adoption. |

**📊 Impact setelah Phase 24:**
- Recharts bundle hanya dimuat saat route chart aktif (lazy-loaded) ✅
- Delete confirmation UX konsisten dengan design system, no native browser dialog ✅
- 5 halaman WCAG 2.1 AA compliant (ARIA role + label) ✅
- 10 form labels properly associated dengan `htmlFor` ✅
- Dark mode sempurna untuk semua destructive actions (`C.destructive.*`) ✅
- Charts 100% menggunakan `CHART_COLORS.*` design tokens ✅
- `UserManagementPage` table rows hanya re-render saat data/dropdown mereka berubah (`React.memo`) ✅

---

### ✅ Phase 25 — Critical Bug Fixes — 3 Halaman Utama (27 Apr 2026)

Perbaikan 4 bug kritis yang ditemukan dari audit `FRONTEND_AUDIT_REPORT.md`, masing-masing menyebabkan **kerusakan fungsional nyata** yang terlihat oleh pengguna.

| ID | File | Deskripsi Bug | Fix |
|---|---|---|---|
| **BUG-1** | `UserManagementPage.tsx` | Delete modal backdrop **tidak cover full-screen** — `fixed inset-0` hilang, background tetap bisa diklik/discroll | Tambah `"fixed inset-0"` + ganti manual flex ke `MODAL.wrapper` (token canonical) |
| **BUG-2** | `StockMovementPage.tsx` | Form "Catat Pergerakan" submit → data **dibuang** (`_data` discarded) — baris baru tidak pernah muncul di tabel | Tambah `useState<MovementRecord[]>(MOCK_MOVEMENTS)`, bangun `newRecord` di `onSubmit`, `setMovements((prev) => [newRecord, ...prev])`, update `useMemo` dep array |
| **BUG-3** | `CashManagementPage.tsx` | Konstanta `LABELS` **didefinisikan dua kali** — module-level (hardcoded ID) + component-level (via `t()`) saling shadow. Component-level punya semantic error: `deleteModal.confirm` dipakai sebagai body text DAN button label sekaligus; `pagination.prev/next` hardcoded English, `aria.*` hardcoded English | Hapus seluruh component-level `LABELS` (64 baris dead code). Module-level `LABELS` tetap aktif sebagai single source of truth |
| **BUG-4** | `UserManagementPage.tsx` + `i18n.tsx` | Delete modal menampilkan **raw i18n key string** di UI (`"um.delete.title"`, `"um.delete.warning"`, `"um.delete.confirm_btn"`) karena `t()` mengembalikan key itu sendiri ketika key tidak ditemukan — `\|\| "fallback"` **tidak pernah aktif** (string key bersifat truthy) | Tambah 3 key baru ke ID + EN section di `i18n.tsx`; hapus `\|\| "fallback"` yang menyesatkan dari semua 3 lokasi |

**📋 Root cause BUG-4:** `t(key)` impl: `return translations[lang][key] \|\| key` — key yang tidak ditemukan mengembalikan string key itu sendiri (truthy), sehingga pattern `{t("missing.key") \|\| "Default"}` **selalu menampilkan key string**, bukan fallback. Seluruh codebase harus menggunakan key yang valid, bukan || fallback.

**📊 Status setelah Phase 25:**
- Delete modal `UserManagementPage` sekarang cover full viewport dengan proper backdrop ✅
- Form tambah pergerakan stok: baris baru muncul langsung di tabel setelah submit ✅
- `CashManagementPage` bebas dari dead code; `LABELS` single source of truth ✅
- Delete modal `UserManagementPage` menampilkan teks yang benar (bukan raw key) di EN dan ID ✅
- `i18n.tsx` ditambah 6 key baru (`um.delete.title/warning/confirm_btn` × ID + EN) ✅

**⚠️ Pre-existing TS warning (tidak disentuh, scope di luar bug fix):**
- `z.coerce.number()` + `zodResolver` di `StockMovementPage` → `qty: unknown` inference di resolver type. Runtime OK, TS strict mode complaint. Fix: ganti ke `z.number({ coerce: true })` di sprint berikutnya.

---

### ✅ Phase 26 — Feature Gaps — UM Pagination + SM Delete (27 Apr 2026)

Perbaikan 2 feature gap fungsional yang ditemukan dari audit `FRONTEND_AUDIT_REPORT.md`.

#### UserManagementPage — Pagination + CRUD State Fix

| Item | Sebelum | Sesudah |
|---|---|---|
| **`users` state** | Tidak ada — semua operasi baca dari `MOCK_USERS` konstan | `useState<User[]>(MOCK_USERS)` — single source of truth untuk semua CRUD |
| **`onSubmit`** | `(_data)` dibuang — add/edit user tidak persist ke tabel | Tambah user baru ke state (`setUsers((prev) => [newUser, ...prev])`) atau update existing via `prev.map()` |
| **`handleConfirmDelete`** | `setDeleteTargetUser(null)` saja — user tidak benar-benar dihapus dari list | `setUsers((prev) => prev.filter(...))` — user terhapus dari state dan tabel langsung |
| **Pagination** | `filtered.map()` → semua user tampil tanpa batas di satu halaman | `pageItems` (8/page) + footer dengan prev/next + page buttons + count label |
| **Reset page** | Tidak ada — filter change tidak reset ke page 1 | `useEffect` → `setCurrentPage(1)` saat `searchQuery/roleFilter/statusFilter/sortField/sortDirection` berubah |
| **Derived stats** | Dari `MOCK_USERS.length` (static) | Dari `users.length` (reactive — update saat user ditambah/dihapus) |

#### StockMovementPage — Delete Action Per Row

| Item | Sebelum | Sesudah |
|---|---|---|
| **Actions column** | Header "Aksi" ada tapi hanya tampilkan status badge | Flex row: status badge + Trash2 icon button |
| **Delete state** | Tidak ada | `isDeleteModalOpen`, `deletingMovement` state |
| **`confirmDelete()`** | Tidak ada | Set `deletingMovement` + buka modal |
| **`handleDelete()`** | Tidak ada | `setMovements(prev.filter(...))` + tutup modal |
| **Delete modal** | Tidak ada | Modal konfirmasi dengan `AlertTriangle` icon, nama produk + ref, tombol Batal/Hapus |
| **Escape handler** | Hanya tutup `isModalOpen` + `isDrawerOpen` | Tambah `isDeleteModalOpen` + `setDeletingMovement(null)` |
| **Click propagation** | N/A | `e.stopPropagation()` pada delete button — tidak trigger row click (open drawer) |

**📊 Status setelah Phase 26:**
- Add user → muncul di tabel + stats KPI terupdate ✅
- Edit user → perubahan tampil langsung di tabel ✅
- Delete user → user hilang dari tabel + stats KPI terupdate ✅
- Tabel UM terpaginasi 8/halaman dengan counter + navigasi ✅
- Setiap baris SM punya tombol hapus → modal konfirmasi → hapus dari state ✅

---

### ✅ Phase 27 — Design System Token Adoption — PriorityBadge + ROLE_CONFIG (27 Apr 2026)

Menyelesaikan 2 finding dari audit report (`FRONTEND_AUDIT_REPORT.md`) P1 #5 dan P2 #6.

#### PrediksiStokPage — PriorityBadge Refactor (Audit #6)

| Item | Sebelum | Sesudah |
|---|---|---|
| **`styles` object** | Hardcoded rose/amber/emerald class strings per level | `PRIORITY_VARIANT` pakai `BADGE.variant.destructive/warning/success` |
| **`Icons` const** | Inline object di dalam component body (re-created per render) | `PRIORITY_ICON` extracted ke module level (`as const`) |
| **Badge `className`** | `cn(T.micro, R.sm, "px-2 py-0.5 border flex items-center gap-1.5", styles[level])` | `cn(BADGE.base, BADGE.size.xs, PRIORITY_VARIANT[level] ?? BADGE.variant.neutral)` |
| **Import** | Tidak ada `BADGE` | `BADGE` dari `@/app/lib/data` ditambahkan |
| **Fallback** | Tidak ada | `?? BADGE.variant.neutral` untuk level tidak dikenal |

#### UserProfilePage — ROLE_CONFIG Refactor (Audit #5)

| Item | Sebelum | Sesudah |
|---|---|---|
| **`ROLE_CONFIG` const** | 8 hardcoded rose/indigo/emerald/teal class strings (4 roles × 3 props) | Dihapus — digantikan oleh canonical token |
| **`roleCfg` variable** | `ROLE_CONFIG[role] ?? ROLE_CONFIG.cashier` | `getRoleInfo(role)` dari `status.ts` |
| **Badge `className`** | `cn(T.micro, R.xs, "px-2 py-0.5 border", roleCfg.bg, roleCfg.color, roleCfg.border)` | `cn(BADGE.base, BADGE.size.xs, BADGE.role[role])` |
| **Label text** | `roleCfg.label` (hardcoded) | `roleInfo.labelId` (dari `status.ts` canonical) |
| **Imports** | Tidak ada `BADGE`, tidak ada `getRoleInfo` | `BADGE` dari `data.ts`, `getRoleInfo` dari `status.ts` |

**📊 Status setelah Phase 27:**
- `PrediksiStokPage` PriorityBadge 100% pakai design system token ✅
- `UserProfilePage` role badge 100% pakai canonical `BADGE.role` + `getRoleInfo()` ✅
- Tidak ada lagi hardcoded rose/amber/emerald classes di kedua file untuk badge/role context ✅

---

### ✅ Phase 28 — A11Y Focus Ring Migration (27 Apr 2026)

Menyelesaikan audit finding #4 dari `FRONTEND_AUDIT_REPORT.md` — 8 instance `focus:outline-none focus:border-indigo-*` di 5 halaman dimigrasikan ke token canonical.

| Page | Element | Sebelum | Sesudah | Token digunakan |
|---|---|---|---|---|
| **TransactionHistoryPage** | Search input | `focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400` | `FOCUS.ring` | `FOCUS` dari `forms.ts` |
| **PrediksiStokPage** | Search input | `focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400` | `FOCUS.ring` | `FOCUS` dari `forms.ts` |
| **PengaturanPage** | 2FA OTP input | `focus:outline-none focus:border-indigo-500` (string literal) | `cn(..., FOCUS.ring)` | `FOCUS` added to forms.ts import |
| **PengaturanPage** | PIN digit input (×4) | `focus:outline-none focus:border-indigo-500` (string literal) | `cn(..., FOCUS.ring)` | `FOCUS` added to forms.ts import |
| **KasirPage** | POS search input | `focus:outline-none focus:bg-white focus:border-indigo-400` | `focus-visible:bg-white` + `FOCUS.ring` | `FOCUS` dari `forms.ts` |
| **KasirPage** | Custom price input | `focus:border-amber-400 focus:outline-none focus:bg-white` (string) | `focus-visible:bg-white` + `FOCUS.ring` | `FOCUS` dari `forms.ts` |
| **InventarisPage** | Search input | `focus:outline-none focus:border-indigo-500` | `FOCUS.ring` | `FOCUS` + `A11Y` dari `a11y.ts` |
| **InventarisPage** | Drawer container (tabIndex div) | `focus:outline-none` (conditioned on focus) | `outline-none` (unconditional) | — |
| **InventarisPage** | Drawer close button | `focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40` | `A11Y.focusRing.default` | `A11Y` dari `a11y.ts` |

**Keputusan teknis:**
- **Bordered inputs** → `FOCUS.ring` (forms.ts) — menambah `focus:border-indigo-500` + `focus-visible:ring-2 focus-visible:ring-indigo-500/20`
- **Buttons / icon buttons** → `A11Y.focusRing.default` (a11y.ts) — `ring-offset-2` tanpa border color
- **Focus trap containers** (tabIndex div) → `outline-none` tanpa prefix (unconditional, lebih tepat)
- `focus:` prefix dihapus untuk KasirPage `focus-visible:bg-white` background change (hanya tampil saat keyboard nav)

**📊 Status setelah Phase 28:**
- 8 instance `focus:outline-none focus:border-*` di 5 halaman → 0 instance ✅
- 5 halaman sekarang fully compliant dengan A11Y.md §5.2 (keyboard-only focus rings) ✅
- `FOCUS.ring` / `A11Y.focusRing.*` adoption: TransactionHistoryPage, PrediksiStokPage, PengaturanPage, KasirPage, InventarisPage ✅

---

### ✅ Phase 29 — Granular `<ErrorBoundary compact>` per Widget (27 Apr 2026)

Menyelesaikan audit finding P2 #17 — 2 halaman chart-heavy yang belum memiliki boundary ditambahkan.

| Page | Boundary ditambahkan | sectionName | Sebelum |
|---|---|---|---|
| **MLOpsDashboardPage** | Wrap seluruh Overview tab grid (3 chart cards) | `"ML Overview Charts"` | Tidak ada ErrorBoundary sama sekali |
| **XAIPage** | Wrap Compare tab grid (RadarChart + BarChart) | `"Compare Charts"` | Tidak ada ErrorBoundary sama sekali |

**Status ErrorBoundary coverage per halaman setelah Phase 29:**

| Page | Coverage |
|---|---|
| DashboardPage | ✅ Per-widget (5 boundaries: KPICards, TopProducts, LowStockAlert, ForecastChart, PredictionTable) |
| LaporanPage | ✅ Per-section (2 boundaries: Analytics Charts, Best Products) |
| PrediksiStokPage | ✅ 1 boundary (Forecast Charts section) |
| MLOpsDashboardPage | ✅ 1 boundary (Overview Charts grid) — **baru** |
| XAIPage | ✅ 1 boundary (Compare Charts tab) — **baru** |
| StockMovementPage, InventarisPage, KasirPage | — Tidak ada Recharts, boundary tidak diperlukan |
| TransactionHistoryPage, UserManagementPage, CashManagementPage | — Tabel/form, boundary tidak diperlukan |

---

### ✅ Phase 30 — `useMemo` Audit & Memoization (27 Apr 2026)

Menyelesaikan audit finding P2 #16 — memoize expensive/derived computations di 2 halaman yang belum menggunakan `useMemo`.

**Audit findings #36 hasil scan:**
- Already done ✅: `CashManagementPage` (ref), `StockMovementPage` (ref), `PrediksiStokPage`, `XAIPage`, `TransactionHistoryPage`, `InventarisPage`, `UserManagementPage`, `KasirPage`
- Needs work: `DashboardPage`, `LaporanPage`, `MLOpsDashboardPage` (all static data, skip)

| Page | Komputasi di-memoize | Deps | Sebelum |
|---|---|---|---|
| **DashboardPage** | `BUSINESS_KPIS` | `[selectedBranch, kpiPeriod]` | Property lookup tanpa memo, re-runs every render |
| **DashboardPage** | `headerKey` | `[role]` | `getHeaderKey()` function recreated every render |
| **DashboardPage** | `descKey` | `[role]` | `getDescKey()` function recreated every render |
| **DashboardPage** | `canSeeFinancials` | `[role]` | Raw boolean, re-evaluated every render |
| **DashboardPage** | `canSeeStock` | `[role]` | Raw boolean, re-evaluated every render |
| **DashboardPage** | `totalCriticalStock` | `[]` | Inline `BRANCH_COMPARISON.reduce()` in JSX |
| **DashboardPage** | `totalStaff` | `[]` | Inline `BRANCH_COMPARISON.reduce()` in JSX |
| **LaporanPage** | `dashboardKpis` | `[t]` | Inline array `[{ label: t("..."), ... }]` di JSX, recreated every render |
| **LaporanPage** | `salesKpis` | `[t]` | Inline array `[{ label: t("..."), ... }]` di JSX, recreated every render |

**📊 Status setelah Phase 30:**
- `DashboardPage` 7 komputasi baru dimemoize ✅
- `LaporanPage` 2 inline array KPI dipindah ke `useMemo` ✅
- `MLOpsDashboardPage` di-skip (semua data adalah module-level constants, tidak ada derived computations) ✅
- Total 9 dari 10 target pages kini menggunakan `useMemo` untuk computations yang tepat ✅

---

### ✅ Phase 31 — i18n Hardcoded String Migration: SM + UM (27 Apr 2026)

Menyelesaikan `fix-i18n` TODO — migrasi semua hardcoded string yang tersisa di `StockMovementPage` dan `UserManagementPage` ke `t()` keys.

**17 i18n keys baru ditambahkan ke `i18n.tsx` (ID + EN):**

| Namespace | Keys baru | Jumlah |
|---|---|---|
| `sm.pagination.*` | `prev`, `next`, `page` | 3 |
| `sm.modal.*` | `close` | 1 |
| `sm.drawer.*` | `close` | 1 |
| `sm.action.*` | `delete_item` | 1 |
| `sm.delete.*` | `title`, `body`, `warning`, `btn` | 4 |
| `um.pagination.*` | `showing`, `of`, `users`, `prev`, `next`, `page` | 6 |
| `um.action.*` | `menu` | 1 |

**Strings dimigrasi per file:**

| File | String dimigrasikan | Sebelum |
|---|---|---|
| **StockMovementPage** | EmptyState `title`/`description` | Hardcoded literal |
| **StockMovementPage** | Pagination showing text | `Menampilkan ... dari ... catatan` hardcoded |
| **StockMovementPage** | Pagination `aria-label` prev/next/page | `"Halaman sebelumnya"` hardcoded |
| **StockMovementPage** | Modal close `aria-label` | `"Tutup modal"` hardcoded |
| **StockMovementPage** | Drawer close `aria-label` | `"Tutup panel detail"` hardcoded |
| **StockMovementPage** | Delete item `aria-label` | Template literal tanpa t() |
| **StockMovementPage** | Delete modal title, body, warning, cancel, confirm btn | 5 hardcoded strings |
| **UserManagementPage** | Pagination showing text | `Menampilkan ... dari ... pengguna` hardcoded |
| **UserManagementPage** | Pagination `aria-label` prev/next/page | `"Halaman sebelumnya"` hardcoded |
| **UserManagementPage** | Action menu `aria-label` | Template literal tanpa t() |

**Status ADR-007 setelah Phase 31:** Semua halaman utama (SM + UM + CM + lainnya) kini 100% bebas dari visible hardcoded strings. ADR-007 i18n bundle split tetap deferred ke Phase 5.

---

### ✅ Phase 32 — P0/P1 Audit Fixes Sprint (28 Apr 2026)

Verifikasi + eksekusi seluruh backlog P0 dan P1 item dari `FRONTEND_AUDIT_REPORT.md`.

#### Hasil Verifikasi P0 (semua sudah selesai sebelumnya)

| ID | Audit Finding | Status | Keterangan |
|---|---|---|---|
| P0 #38 | console.log di production (7 instance) | ✅ Sudah selesai | Tidak ada `console.log` di InventarisPage & UserManagementPage |
| P0 #15 | RBAC RouteGuard — exact match only | ✅ Sudah selesai | `startsWith(r.path + "/")` sudah ada di RouteGuard.tsx |
| P0 #11-12 | Dark mode zero di PrediksiStok + Laporan | ✅ Sudah selesai | Full `dark:` coverage sudah ada dari Phase 22 |

#### P1: ARIA — DashboardPage (baru dikerjakan)

Audit menemukan `DashboardPage` satu-satunya halaman tanpa ARIA attributes. 9 perubahan di `DashboardPage.tsx`:

| Element | Sebelum | Sesudah |
|---|---|---|
| Period selector container | `<div className="flex gap-1">` | `role="group" aria-label="Periode KPI"` |
| Period buttons | bare `<button>` | `aria-pressed={kpiPeriod === p.key}` |
| Branch filter container | bare `<div>` | `role="group" aria-label="Filter Cabang"` |
| Branch filter buttons | bare `<button>` | `aria-pressed={selectedBranch === b.id}` |
| `<MapPin>` label icon | bare SVG | `aria-hidden="true"` |
| `<Building2>` branch icon | bare SVG | `aria-hidden="true"` |
| Branch comparison table | `<table>` | `aria-label="Laporan Konsolidasi Multi-Cabang"` |
| Clickable table rows | `onClick` only | `+role="button" tabIndex={0} onKeyDown aria-label="Filter ke {name}"` |
| Decorative heading icons (`TrendingUp`, `Sparkles`, `AlertTriangle`, `Building2`) | bare SVGs | `aria-hidden="true"` |

#### P1 #1: Rose classes → C.destructive.* token adoption

Migrasi instance dengan **exact token match** ke `C.destructive.*`:

| File | Instance | Sebelum | Sesudah |
|---|---|---|---|
| `MLOpsDashboardPage` | `STATUS_CONFIG.offline.color` | `"text-rose-700 dark:text-rose-400"` | `C.destructive.text` |
| `MLOpsDashboardPage` | `STATUS_CONFIG.offline.bg` | `"bg-rose-50 dark:bg-rose-900/30"` | `C.destructive.bg` |
| `MLOpsDashboardPage` | `STATUS_CONFIG.offline.border` | `"border-rose-200 dark:border-rose-800/50"` | `C.destructive.border` |
| `MLOpsDashboardPage` | `JOB_STATUS_CONFIG.failed.color/bg/border` | same 3 classes | `C.destructive.text/bg/border` |
| `InventarisPage` | KPI icon box (`color === "rose"`) | `"bg-rose-50... text-rose-600..."` | `cn(C.destructive.bg, C.destructive.text)` |
| `InventarisPage` | Days-left badge (`Kritis`) | `"bg-rose-50... text-rose-600..."` | `cn(C.destructive.bg, C.destructive.text)` |
| `InventarisPage` | Status badge span (`Kritis`) | `"bg-rose-50... border-rose-200..."` | `cn(C.destructive.bg, C.destructive.text, C.destructive.border)` |

#### P1 #3 + P1 #34: Verified sudah selesai sebelumnya

| ID | Finding | Status |
|---|---|---|
| P1 #3 | 40+ hex colors di Recharts → CHART_COLORS.* | ✅ Semua halaman (Laporan/XAI/PrediksiStok/MLOps) sudah menggunakan `CHART_COLORS.*` |
| P1 #34 | Lazy-load 4 Recharts pages | ✅ Semua 4 route page.tsx sudah `next/dynamic` + ssr:false + skeleton loading |
| P1 #20 | window.confirm → custom modal | ✅ UserManagementPage sudah punya `deleteTargetUser` state + AnimatePresence modal |
| P1 #27 | PengaturanPage label htmlFor | ✅ Semua 10 form label sudah paired `htmlFor` + `id` |

---

### ✅ Phase 33 — Quick Wins: Hard Navigation Fix + Search A11Y (28 Apr 2026)

Verifikasi & eksekusi 3 remaining quick win items dari audit report.

**Verified sudah ada (tidak perlu dibuat):**
- `app/not-found.tsx` ✅ — Branded 404 dengan `C.*`, `R.*`, `E.*` tokens + dark mode
- `app/error.tsx` ✅ — Route-level error boundary (`"use client"`) dengan retry + home button
- `app/loading.tsx` ✅ — Global skeleton (KPI cards + filter + table rows) dengan dark mode

**Yang diperbaiki:**

| # | File | Perubahan |
|---|------|-----------|
| #19 | `ErrorBoundary.tsx` | `window.location.href = "/"` → `<Link href="/">` (import `next/link`). Client-side navigation, tidak reload, preserves client state. |
| #19 | `app/error.tsx` | `<a href="/">` → `<Link href="/">` (import `next/link`). Same fix — soft navigation instead of full reload. |
| #28 | `PrediksiStokPage.tsx` | Search `<input>` ditambah `aria-label={t("pred.search.sku")}`. Screen reader sekarang dapat mendeskripsikan field tanpa visual label. |

---

### ✅ Phase 34 — Medium Severity Audit Fixes (28 Apr 2026)

Verifikasi + eksekusi seluruh remaining medium severity items dari `FRONTEND_AUDIT_REPORT.md`.

| # | Finding | Status | Detail |
|---|---------|--------|--------|
| **#2** | formatRupiah() adoption | ✅ Fixed | `LaporanPage` `salesKpis`: `"7.8 Jt"` → `fmt(7_800_000)`, `"5.42 Jt"` → `fmt(5_420_000)`. `DashboardPage` sudah sepenuhnya menggunakan `fmt()`. |
| **#23** | Toast feedback 6 pages | ✅ Verified already done | `DashboardPage` → `toast.info()` on branch/table row; `LaporanPage` → `toast.success()` on export; `PrediksiStokPage` → `toast.loading` + `toast.success`; `MLOpsDashboardPage` → retrain toast; `TransactionHistoryPage` → CSV/print toast; `XAIPage` → `toast.loading` + `toast.success` |
| **#30** | InventarisPage drawer focus trap | ✅ Verified already done | `useModalA11y` hook sudah terpasang — Escape key, Tab focus trap, auto-focus, restore focus, body scroll lock. |

---

### ✅ Phase 35 — Low Severity Audit Fixes (28 Apr 2026)

Verifikasi + eksekusi seluruh remaining low severity items dari `FRONTEND_AUDIT_REPORT.md`.

| # | File | Perubahan |
|---|------|-----------|
| **#37** | `LaporanPage`, `PrediksiStokPage`, `MLOpsDashboardPage`, `XAIPage` | `<ResponsiveContainer>` + `debounce={200}` — 10 instances total. Prevents chart thrash-rerender on window resize. |
| **#39** | `RouteGuard.tsx` | Loading container: + `dark:bg-slate-950` + `role="status"` + `aria-live="polite"`. Screen readers now announce authenticating state. |
| **#40** | `inventoryStore.ts` | `deductStock()`: `new Date().toLocaleTimeString("id-ID", {...})` → `formatDate(new Date(), "time")` dari `format.ts`. |
| **#32** | `ErrorBoundary.tsx` | Import `C` + `R` tokens. Compact fallback: `bg-rose-50/30` → `C.destructive.bg`, `border-rose-100` → `C.destructive.border`, text colors → `C.destructive.text`, button → `C.destructive.border + text`. Full-page: `rounded-[3rem]` → `R.xl`, icon box + icon → `C.destructive.bg + icon`, diagnostic label → `C.destructive.text`. Card `bg-white` → `dark:bg-slate-900` dark mode fix. |
| **#14** | `Layout.tsx` | Import `Z` + `BACKDROP`. Mobile sidebar wrapper: `z-50` → `Z.overlay`. Backdrop div: `backdrop-blur-sm` → `BACKDROP.sm` token. |

---

### ✅ Phase 36 — Missing Components: SkipLink + ChartTooltip + Forbidden (28 Apr 2026)

Membuat 3 komponen yang ada di spec tapi belum diimplementasi. `PageHeader` dan `FilterBar` sudah ada sebelumnya.

| Komponen | Path | Detail |
|---|---|---|
| `SkipLink` | `components/SkipLink.tsx` | Skip-to-content link per A11Y.md §4.7. Sr-only by default, visible on keyboard focus (`A11Y.skipLink` token). Integrated ke `Layout.tsx` sebagai first focusable element. `<main id="main-content">` ditambahkan sebagai target. |
| `ChartTooltip` | `components/charts/ChartTooltip.tsx` | Recharts custom tooltip standar menggunakan `CHART_TOOLTIP.*` tokens. Props: `formatter`, `labelFormatter`, `footer` (ReactNode untuk delta/trend). Digunakan via `<Tooltip content={<ChartTooltip />} />`. |
| `forbidden.tsx` | `app/forbidden.tsx` | 403 Forbidden page per PATTERNS.md §9.2. Design konsisten dengan `not-found.tsx` dan `error.tsx`: `ShieldOff` icon, `C.destructive.*` tokens, `router.back()` + Dashboard Link actions. |

---

### ✅ Phase 37 — Missing Components Pt.2: VisuallyHidden + LiveRegion + FormField + Stepper (28 Apr 2026)

Melengkapi semua missing components dari spec design system.

| Komponen | Path | Detail |
|---|---|---|
| `VisuallyHidden` | `components/VisuallyHidden.tsx` | Wrapper `A11Y.srOnly` dengan `as` prop polymorphic. Untuk icon-only button labels, sr context, hidden headings. |
| `LiveRegion` | `components/LiveRegion.tsx` | ARIA live region menggunakan `LIVE_REGION.polite / assertive` dari `a11y.ts`. Props: `variant` + `visuallyHidden`. Untuk status announcements tanpa interrupt user. |
| `FormField` | `components/FormField.tsx` | Standard form field wrapper: `<label htmlFor>` + children slot + helper text (`${id}-helper`) + error text (`${id}-error` + `role="alert"`). Dengan `FIELD/LABEL/HELPER/ERROR_TEXT` tokens. |
| `FormFieldInline` | (same file) | Variant untuk checkbox/radio/switch: control di kiri, label di kanan, menggunakan `FIELD.inline`. |
| `Stepper` | `components/Stepper.tsx` | Multi-step indicator dengan `STEPPER.*` tokens. Horizontal (connector antara step) + vertical (step + connector + description). 3 sizes (sm/md/lg). Step states: completed (checkmark) / active (ring) / upcoming. ARIA `aria-current="step"`. |

**Status setelah Phase 37 — Semua pending components dari spec sudah dibuat:**
- ✅ `PageHeader` (existed) · `FilterBar` (existed) · `SkipLink` · `ChartTooltip` · `VisuallyHidden` · `LiveRegion` · `FormField` · `Stepper`
- ❌ `not-found.tsx` (existed) · `error.tsx` (existed) · `forbidden.tsx` (new Phase 36)

---

### ✅ Phase 38 — Token Adoption Sprint: A11Y + Semantic HTML + Format (28 Apr 2026)

Scan seluruh codebase untuk banned patterns dan migrasi ke design tokens.

| Category | Before | After | Count |
|---|---|---|---|
| `focus:ring-*` | Mouse-triggered focus ring | `focus-visible:ring-*` (keyboard-only) | **22 instances / 8 files** |
| `<div onClick>` | Non-keyboard-accessible cards | `<button type="button">` + `text-left w-full` | **3 files** (ServicePanel, ProductCard, RefundModal) |
| Hardcoded `Rp` | `"Rp 14.2 Jt"` string literal | `formatRupiah(14200000, { compact: true })` | **1 file** (KPICards.tsx) |

**Skipped (shadcn/ui auto-generated — tidak diubah):**
- `rounded-md`: 38 instances, all in `ui/` — shadcn default
- `z-[N]` arbitrary: 1 instance in `ui/navigation-menu.tsx`
- `toLocaleString`: 9 instances, 8 in `format.ts` (correct internal usage), 1 in `charts.ts` (axis formatter)

---

## 6. Halaman Tambahan (di Luar Spec Awal)

Halaman-halaman ini **tidak ada di dokumen awal** namun sudah diimplementasi:

| Halaman | Deskripsi |
|---|---|
| `/penjelasan-ai` (`XAIPage`) | Explainable AI lengkap dengan simulator dan SHAP chart |
| `/laporan` (`LaporanPage`) | Laporan penjualan & inventaris dengan tab dan chart |
| `/pengaturan` (`PengaturanPage`) | 7 tab settings: profil, toko, notifikasi, AI, tim, keamanan, logout |
| `UserProfilePage` | Profil user dengan performa, aktivitas, dan achievements |

---

## 7. Backlog — Fitur Belum Selesai

### 🔴 Outstanding (Pending)

| Prioritas | Fitur | Lokasi / Context |
|:---:|---|---|
| 🔴 High | **Integrasi API backend** (ganti semua mock data) | Semua halaman — backend ~45 endpoints sudah ready |
| 🔴 High | **Auth token via httpOnly cookie** (replace `localStorage`) | `AuthContext.tsx` |
| ✅ Done | **Token adoption migration sprint** | Semua banned patterns (hardcoded `Rp`, `toLocaleString`, `text-[*px]`, `rounded-md`, `z-[N]`, `font-mono`, `font-extrabold`, `size-N` icon sizing) = **0** di seluruh user-facing source. Sisa hanya di `format.ts` dan `charts.ts` (canonical token implementations). |
| 🟡 Medium | **Storybook setup + visual regression tests** | Enterprise Readiness P0 gap (tooling 0/10). Lihat [`ENTERPRISE_GAP.md`](../Design%20System/ENTERPRISE_GAP.md) |
| 🟡 Medium | **i18n wiring (next-intl)** | 0 `useTranslations` / `next-intl` imports — infrastructure tidak aktif. Spec: [`I18N.md`](../Design%20System/I18N.md) |
| 🟡 Medium | **Refactor hand-rolled → shadcn primitives** | 100+ alert banners + 20 tables + 14 badges hand-rolled. Lihat specs Cluster E/F |
| � Medium | **A11y remediation P0** | 50 broken `<label>` (missing `htmlFor`), 0 `aria-live`, 0 skip-link, 0 `motion-reduce`. Lihat [`A11Y.md`](../Design%20System/A11Y.md) |
| � Low | Print CSS untuk `ExportShareModal` | `ExportShareModal.tsx` |
| � Low | PWA / offline mode | infrastruktur |

### ✅ Completed (21+ items)

<details>
<summary><strong>Ringkasan fitur terselesaikan</strong></summary>

- **Phase 7 (P0):** Manajemen Kas, Pergerakan Stok, Manajemen Pengguna
- **Phase 8 (P1):** Forgot Password, Accept Invite, Change PIN, 2FA Wizard, Login History
- **Phase 9 (P2):** MLOps Dashboard, Notif Polling
- **Phase 10 (P3):** Dark Mode (toggle + hotkey `D`), Command Palette (`Ctrl+K`)
- **Sprint P2 — Audit Remediation (Apr–May 2026):**
  - ✅ **P2-1: Route special files** — `not-found.tsx`, `error.tsx`, `loading.tsx` dibuat dengan branded design dan skeleton loading
  - ✅ **P2-2: Reusable components** — `FilterBar.tsx` (slot: search + filter + actions) + `PageHeader.tsx` (slot: title + subtitle + actions + breadcrumbs) dibuat sesuai `PATTERNS.md §4.4` & `BREADCRUMBS.md §9.3`
  - ✅ **P2-3: Currency migration** — 40+ hardcoded `"Rp "` string di `DashboardPage`, `LaporanPage`, `TransactionHistoryPage` diganti ke `formatRupiah(n, { compact: true })` via helper `fmt`
  - ✅ **P2-5: Toast feedback** — `toast.success/loading/info` ditambah ke 4 page tanpa feedback: `TransactionHistoryPage` (CSV export + print), `MLOpsDashboardPage` (retrain + export), `PrediksiStokPage` (update prediksi), `XAIPage` (refresh + buka analisis lanjut)
  - ✅ **P2-6: useMemo dep fix** — `TransactionHistoryPage` filtered useMemo deps dilengkapi dengan `dateRange` untuk konsistensi
  - ✅ **P2-7: ErrorBoundary compact** — `<ErrorBoundary compact sectionName="...">` ditambahkan ke chart sections di `LaporanPage` (Analytics Charts + Best Products) dan `PrediksiStokPage` (Forecast Charts) agar satu widget crash tidak merusak seluruh halaman
  - ✅ **P2-4: React Hook Form + Zod migration** — `zod@4` + `@hookform/resolvers@5` diinstall; `StockMovementPage` (9 field) dan `UserManagementPage` (7 field) dimigrasikan dari manual `useState formData` + `validateForm()` ke `useForm<TSchema>({ resolver: zodResolver(schema) })`. Keunggulan: type-safe validation, pesan error terpusat di schema, `reset(values)` menggantikan manual `setFormData`, tidak ada re-render per-keystroke pada field tidak aktif
- **POS Features:** Print struk, Diskon per item/transaksi, Hold transaksi, Split Payment (CASH + QRIS), Barcode Scanner (F1), Price List Layanan, Job Queue Antrian, Refund/Retur
- **Data Features:** Export CSV + PDF (Transaksi & Stok), Sort by column (Inventaris), Toggle Harian/Mingguan/Bulanan
- **Inventory Features:** Stock Opname (fisik vs sistem), Transfer Antar Cabang, Excel Import 3-step

</details>

---

## 8. Struktur Folder Frontend

```
frontend/
├── app/                          # Next.js App Router (route pages)
│   ├── page.tsx                  # / → DashboardPage
│   ├── login/[role]/page.tsx     # /login/admin, /login/cashier
│   ├── kasir/page.tsx            # /kasir
│   ├── inventaris/page.tsx       # /inventaris
│   ├── prediksi-stok/page.tsx    # /prediksi-stok
│   ├── penjelasan-ai/page.tsx    # /penjelasan-ai
│   ├── riwayat-transaksi/page.tsx# /riwayat-transaksi
│   ├── manajemen-kas/page.tsx    # /manajemen-kas
│   ├── laporan/page.tsx          # /laporan
│   └── pengaturan/page.tsx       # /pengaturan
│
└── src/app/
    ├── components/
    │   ├── pages/                # Full page components
    │   ├── pos/                  # POS-specific components
    │   ├── inventory/            # Inventory-specific components
    │   └── ui/                   # Reusable UI primitives (shadcn)
    ├── context/
    │   └── AuthContext.tsx       # Auth state + role management
    ├── hooks/                    # Custom hooks (useProducts, useDebounce, dll)
    ├── lib/                      # Utilities (cn, api client)
    ├── types/                    # TypeScript interfaces
    ├── i18n.tsx                  # i18n translations (ID + EN)
    └── routes.tsx                # Route definitions + RBAC config
```

---

## 9. Struktur Backend

```
backend/
├── main.py                       # Entry point FastAPI
├── core/
│   ├── security.py               # JWT auth, role guards
│   └── database.py               # SQLAlchemy setup
└── domains/
    ├── identity/                 # Auth, User, Login history
    ├── inventory/                # Products, Stock, Stores
    ├── pos/                      # Transactions, Cart
    ├── forecasting/              # ML model, predictions
    ├── notification/             # Notification system
    └── reporting/                # Export, reports
```

**Backend sudah production-ready (~45 endpoints).** Frontend belum terintegrasi — semua data saat ini masih mock.

---

## 10. UI/UX Audit (Phase 67)

> **Living document:** [`docs/UI_UX_AUDIT.md`](./UI_UX_AUDIT.md)

**Skor keseluruhan: 7.4/10** — Fondasi design system sangat kuat, masalah utama di eksekusi konsistensi.

| Kategori | Skor | Status |
|---|---|---|
| Accessibility | 7/10 | ⚠️ 29 hardcoded aria-label, 3 focus:ring |
| Touch & Interaction | 8/10 | ✅ cursor-pointer konsisten |
| Performance | 7/10 | ⚠️ Beberapa page tanpa skeleton |
| Layout & Responsive | 8/10 | ✅ Grid responsive baik |
| Typography & Color | 9/10 | ✅ Token adoption tinggi |
| Animation & Motion | 8/10 | ✅ prefers-reduced-motion ada |
| Dark Mode | 7.5/10 | ⚠️ Chart belum dark-aware |
| Error States | 5/10 | 🔴 not-found/error page belum ada |

**Total temuan: 27 items** — 3 P0, 7 P1, 6 P2, 11 P3 — estimasi ~8 sesi kerja.
