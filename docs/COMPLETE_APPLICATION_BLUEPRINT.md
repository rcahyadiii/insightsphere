# InsightSphere — Cetak Biru Aplikasi Lengkap

**Versi:** 1.0 | **Tanggal:** 26 April 2026  
**Perspektif:** Product Designer & Frontend Architect  
**Cakupan:** Konteks Produk, Information Architecture, User Flow Diagrams, Panduan UI/UX

---

## Daftar Isi

1. [Konteks Produk](#1-konteks-produk)
2. [Information Architecture & Daftar Fitur](#2-information-architecture--daftar-fitur)
3. [Diagram Alur Navigasi](#3-diagram-alur-navigasi)
4. [Panduan UI/UX](#4-panduan-uiux)
5. [Lampiran](#5-lampiran)

---

## 1. Konteks Produk

### 1.1 Apa yang Dibangun?

**InsightSphere** (nama internal: SmartStock) adalah **platform manajemen toko ritel terintegrasi** yang menggabungkan tiga kapabilitas dalam satu aplikasi web:

```
┌─────────────────────────────────────────────────────────────┐
│                    INSIGHTSPHERE                            │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  LAYER 3: INTELLIGENCE ENGINE                         │  │
│  │  ML Forecasting ∙ XAI ∙ What-If Simulator ∙ MLOps    │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  LAYER 2: BUSINESS OPERATIONS PLATFORM                │  │
│  │  Inventory ∙ Cash Mgmt ∙ Reporting ∙ User Mgmt       │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │  LAYER 1: POS (POINT OF SALE) ENGINE                  │  │
│  │  Checkout ∙ Cart ∙ Payment ∙ Refund ∙ Offline Sync    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Tech Stack:**  
Next.js 14 App Router ∙ TypeScript ∙ TailwindCSS ∙ shadcn/ui ∙ TanStack Query ∙ Zustand ∙ Recharts ∙ Framer Motion ∙ FastAPI (backend) ∙ XGBoost (ML)

### 1.2 Siapa Target Penggunanya?

InsightSphere melayani **usaha ritel kecil-menengah Indonesia** (toko kelontong, fotokopi, minimarket independen) dengan 1–5 cabang dan 2–15 karyawan. Empat persona utama:

| Persona | Role Sistem | Profil | Kebutuhan Utama |
|:---|:---|:---|:---|
| **Pemilik Usaha** | `owner` | Pemilik toko dengan 1-5 cabang, memantau dari jarak jauh | Dashboard strategis, perbandingan cabang, prediksi AI, laporan ekspor |
| **Administrator** | `admin` | Pengelola IT / orang kepercayaan pemilik | Manajemen user, konfigurasi sistem, MLOps monitoring, audit trail |
| **Manajer Inventaris** | `inventory_manager` | Staff senior yang mengelola stok | Stock opname, transfer antar cabang, prediksi stok kritis, laporan inventaris |
| **Kasir** | `cashier` | Operator frontline di counter | POS checkout, refund, cek stok cepat, buka/tutup shift |

### 1.3 Apa Tujuan Utamanya?

| Tujuan | Masalah yang Dipecahkan | Solusi di Aplikasi |
|:---|:---|:---|
| **Eliminasi Blind Spot Operasional** | Pemilik tidak tahu performa toko sampai akhir bulan | Dashboard KPI real-time per hari/minggu/bulan per cabang |
| **Keputusan Restok Berbasis Data** | Restok berdasarkan "feeling" → stockout atau dead stock | ML forecasting multi-horizon (7-28 hari) + priority alert |
| **Unified Operations** | Kas, stok, transaksi, SDM di spreadsheet terpisah | 9 domain backend terintegrasi dalam satu platform |
| **Offline-First POS** | Internet tidak stabil di Indonesia | Batch sync + idempotency key + 7-hari token expiry |

### 1.4 Bahasa dan Konteks Lokal

- **Bilingual:** Bahasa Indonesia (primer) + English
- **Mata uang:** Rupiah dengan compact format khas Indonesia (rb/jt/M/T)
- **Domain vocabulary:** Istilah toko ritel Indonesia (Sembako, Kasir, Opname, dll)
- **Mock data context:** Toko fotokopi/print (kertas, tinta, laminasi, jilid)

---

## 2. Information Architecture & Daftar Fitur

### 2.1 Sitemap (Struktur Pohon Halaman)

```
InsightSphere
│
├── ZONA PUBLIK (Tanpa Login)
│   ├── /login/select ─────────── Portal Selector
│   │   └── 3 card: Owner, Kasir, Admin → link ke login masing-masing
│   │
│   ├── /login/{role} ─────────── Login per Role
│   │   ├── /login/owner
│   │   ├── /login/admin
│   │   ├── /login/cashier
│   │   └── /login/inventory_manager
│   │
│   ├── /login/forgot-password ── Lupa PIN (4-step wizard)
│   │   ├── Step 1: Input email
│   │   ├── Step 2: Konfirmasi email terkirim
│   │   ├── Step 3: Reset PIN form
│   │   └── Step 4: Sukses
│   │
│   └── /accept-invite/{token} ── Terima Undangan (3-step wizard)
│       ├── Step 1: Detail undangan
│       ├── Step 2: Setup akun (username + PIN)
│       └── Step 3: Sukses
│
├── ZONA PROTECTED (Wajib Login + RBAC)
│   │
│   ├── / ─────────────────────── DASHBOARD
│   │   ├── Header (role badge, AI precision indicator)
│   │   ├── Branch Filter (Semua / HQ / Cabang 1-N)
│   │   ├── KPI Cards (Pendapatan, Transaksi, Avg Transaksi, Item Terjual)
│   │   │   └── Period selector: Hari Ini / Pekan Ini / Bulan Ini
│   │   ├── Multi-Branch Consolidated Report Table [owner/admin]
│   │   ├── AI KPI Cards (precision, model health) [owner/admin]
│   │   ├── Top Products Chart + Low Stock Alert [non-cashier]
│   │   ├── Forecast Chart [owner/admin]
│   │   └── AI Recommendation Table (prediction + reasoning)
│   │
│   ├── /kasir ────────────────── POINT OF SALE (POS)
│   │   ├── Sidebar Navigasi POS
│   │   │   ├── Tab: POS (grid produk)
│   │   │   ├── Tab: Stock Check
│   │   │   ├── Tab: Service Panel (layanan non-produk)
│   │   │   └── Tab: Job Queue (antrian fotokopi/print)
│   │   ├── Search Bar + Shift Badge + Refund Button
│   │   ├── Product Grid (card-based, filterable by kategori)
│   │   ├── Cart Panel (sisi kanan, sticky)
│   │   │   ├── Item list (qty +/-, custom price, remove)
│   │   │   ├── Subtotal + Total
│   │   │   └── Checkout button
│   │   ├── [Modal] Payment Modal (CASH/QRIS, hitung kembalian)
│   │   ├── [Modal] Refund Modal
│   │   └── [Modal] Custom Price Input
│   │
│   ├── /prediksi-stok ────────── PREDIKSI STOK (AI)
│   │   ├── Header + Model Info Toggle + Update Prediction Button
│   │   ├── [Collapsible] Model Info Panel (XGBoost stats)
│   │   ├── Critical Stock Alert Banner
│   │   ├── Charts Grid
│   │   │   ├── Weekly Demand AreaChart (prediksi + confidence band)
│   │   │   └── Category Demand BarChart (horizontal)
│   │   └── Forecast Products Table
│   │       ├── Filters: Search, Horizon (7d/14d), Category pills
│   │       ├── Columns: Product, Stock, Forecast, Confidence, Deadline, Priority
│   │       └── Pagination
│   │
│   ├── /penjelasan-ai ────────── EXPLAINABLE AI (XAI)
│   │   ├── Header + Product Selector Dropdown
│   │   ├── AI Guide Banner (onboarding)
│   │   └── 4-Tab Interface
│   │       ├── Tab "Explain": AI Summary + Feature Importance Bars + Feedback
│   │       ├── Tab "Simulate": What-If toggles (Promo/Holiday/Payday) + Impact
│   │       ├── Tab "Compare": Radar Chart + Benchmark BarChart
│   │       └── Tab "Global": Insight Cards (Pola/Anomali/Risiko/Peluang) + CTA
│   │
│   ├── /inventaris ───────────── MANAJEMEN INVENTARIS
│   │   ├── Header + Action Buttons
│   │   │   ├── Import Excel, Export, History, Transfer, Opname, + Tambah Produk
│   │   ├── Summary Cards (Total, Aman, Menipis, Kritis)
│   │   ├── Product Table
│   │   │   ├── Tabs: Semua / Aman / Menipis / Kritis
│   │   │   ├── Search
│   │   │   ├── Sortable columns: Produk, Stok, DOI (Days of Inventory)
│   │   │   └── Pagination
│   │   ├── [Drawer] Product Detail (trend chart, stats, restock/edit/share)
│   │   ├── [Modal] ProductForm (Add/Edit mode)
│   │   ├── [Modal] StockUpdateModal (restock)
│   │   ├── [Modal] StockHistoryTable
│   │   ├── [Modal] StockOpnameModal (audit stok)
│   │   ├── [Modal] StockTransferModal (antar cabang)
│   │   ├── [Modal] ExcelImportModal (bulk import)
│   │   └── [Modal] ExportShareModal
│   │
│   ├── /riwayat-transaksi ────── RIWAYAT TRANSAKSI
│   │   ├── Header + Export Button
│   │   ├── Filter Bar (Date range, Payment method, Search)
│   │   ├── Transaction Table (ID, Waktu, Items, Total, Metode, Kasir, Cabang)
│   │   ├── [Modal] Transaction Detail (item list, receipt view)
│   │   └── Pagination
│   │
│   ├── /laporan ──────────────── LAPORAN & ANALYTICS
│   │   ├── Header + Download Buttons (CSV/XLSX)
│   │   ├── Summary KPI Cards (Total Penjualan, Avg Harian, Target, Growth)
│   │   ├── Charts
│   │   │   ├── Monthly Sales vs Target (BarChart)
│   │   │   ├── Category Contribution (PieChart)
│   │   │   └── Revenue Trend (AreaChart)
│   │   ├── Top Products Table (ranking + trend)
│   │   ├── Stock Alerts Section (kritis + menipis)
│   │   └── Operational Metrics (shift efficiency, peak hours)
│   │
│   ├── /mlops ────────────────── MLOPS DASHBOARD [admin only]
│   │   ├── Service Status Cards (Prediction API, Training Pipeline, Feature Store)
│   │   ├── Model Version Table (version, accuracy, MAPE, RMSE, status)
│   │   ├── Accuracy Timeline LineChart (multi-version overlay)
│   │   ├── Feature Importance BarChart
│   │   ├── Category Metrics Table (per-category accuracy + drift flag)
│   │   └── Training Jobs History Table (trigger, duration, status)
│   │
│   ├── /manajemen-kas ────────── MANAJEMEN KAS
│   │   ├── Header + "Transaksi Baru" Button
│   │   ├── KPI Cards (Saldo, Total Pemasukan, Total Pengeluaran, Transaksi)
│   │   ├── Filter Bar (Period, Type, Search)
│   │   ├── Cash Entries Table (Date, Type, Category, Amount, Status, Operator)
│   │   ├── [Modal] Add/Edit Cash Transaction Form
│   │   ├── [Modal] Transaction Detail
│   │   └── Pagination
│   │
│   ├── /pergerakan-stok ──────── PERGERAKAN STOK
│   │   ├── Header + "Catat Pergerakan" Button
│   │   ├── KPI Cards (Total Masuk, Keluar, Transfer, Retur)
│   │   ├── Filter Bar (Period, Type, Search)
│   │   ├── Movement Table (Date, Type, Product, Qty, Before/After, Operator)
│   │   ├── [Modal] Add Movement Form (validated with Zod)
│   │   ├── [Drawer] Movement Detail
│   │   └── Pagination
│   │
│   ├── /manajemen-pengguna ───── MANAJEMEN PENGGUNA [admin only]
│   │   ├── Header + "Undang Pengguna" Button
│   │   ├── Stats Cards (Total Users, Active, Inactive, per Role)
│   │   ├── Filter Bar (Role, Status, Search)
│   │   ├── User Table (Name, Email, Role, Branch, Status, Last Active)
│   │   │   ├── Inline actions: Edit, Deactivate, Delete
│   │   │   └── Sort by columns
│   │   ├── [Modal] Invite User Form (email, role, branch)
│   │   ├── [Modal] Edit User Form
│   │   ├── [Modal] Delete Confirmation
│   │   └── Pagination
│   │
│   └── /pengaturan ───────────── PENGATURAN
│       └── 7-Tab Settings Panel
│           ├── Profil: Nama, email, telepon, avatar, password
│           ├── Toko: Nama toko, alamat, cabang, jam operasional, printer
│           ├── Notifikasi: Toggle per kategori (stok, transaksi, sistem)
│           ├── AI: Konfigurasi model, horizon prediksi, threshold alert
│           ├── Akses: Daftar user terkait, quick invite
│           ├── Keamanan: 2FA setup, session management, login history
│           └── Logout: Konfirmasi + clear session
│
├── ZONA SYSTEM
│   ├── error.tsx ─────────────── Global Error Page (retry + back to dashboard)
│   ├── not-found.tsx ─────────── 404 Page (decorative + back to dashboard)
│   └── loading.tsx ───────────── Global Loading Skeleton
│
└── ZONA API (Server-Side Routes — Tidak Visible)
    ├── /api/auth/login ────────── Proxy login + set httpOnly cookie
    ├── /api/auth/logout ───────── Clear cookie
    ├── /api/auth/me ───────────── Proxy session check
    ├── /api/auth/refresh ──────── Rotate token
    └── /api/backend/[...path] ── Catch-all proxy (inject Bearer)
```

### 2.2 Matriks Fitur per Halaman (Ringkas)

| # | Halaman | Path | Fitur Utama | Komponen Kunci |
|:---:|:---|:---|:---|:---|
| 1 | Dashboard | `/` | KPI cards, branch filter, forecast chart, low stock alert, AI recommendations | `KPICards`, `ForecastChart`, `TopProductsChart`, `LowStockAlert`, `PredictionTable` |
| 2 | POS Kasir | `/kasir` | Product grid, cart, checkout, refund, stock check, service panel, job queue | `ProductCard`, `CartPanel`, `PaymentModal`, `RefundModal`, `StockCheckView`, `ServicePanel`, `JobQueuePanel` |
| 3 | Prediksi Stok | `/prediksi-stok` | Demand forecast chart, category chart, forecast table, priority badges | `AreaChart`, `BarChart`, `PriorityBadge`, `PredictionTableSkeleton` |
| 4 | Penjelasan AI | `/penjelasan-ai` | Feature importance, what-if simulator, radar chart, insight cards | `FactorBar`, `InsightCard`, `ExportShareModal`, `RadarChart` |
| 5 | Inventaris | `/inventaris` | CRUD produk, stock opname, transfer, import excel, product detail drawer | `ProductForm`, `StockUpdateModal`, `StockOpnameModal`, `StockTransferModal`, `ExcelImportModal` |
| 6 | Riwayat Transaksi | `/riwayat-transaksi` | Transaction list, detail view, receipt, filter, export | `TransactionDetailModal`, `ReceiptView` |
| 7 | Laporan | `/laporan` | Sales vs target chart, category pie, top products, download CSV/XLSX | `BarChart`, `PieChart`, `AreaChart` |
| 8 | MLOps | `/mlops` | Model versions, accuracy timeline, feature importance, training jobs | `LineChart`, `BarChart`, service status cards |
| 9 | Manajemen Kas | `/manajemen-kas` | Cash entries CRUD, KPI, filter, detail | `CashEntryForm`, `CashDetailModal` |
| 10 | Pergerakan Stok | `/pergerakan-stok` | Stock movement log, add movement (Zod validated), detail drawer | `MovementForm`, `MovementDetailDrawer` |
| 11 | Manajemen Pengguna | `/manajemen-pengguna` | User CRUD, invite, role assignment, deactivate | `InviteUserModal`, `EditUserModal`, `DeleteConfirmModal` |
| 12 | Pengaturan | `/pengaturan` | 7-tab settings (profil, toko, notifikasi, AI, akses, keamanan, logout) | `SettingsTabPanel` per tab |

### 2.3 RBAC Access Matrix

```
            ┌──────┬───────┬───────┬──────────────────┬─────────┐
 Halaman    │Owner │Admin  │Inv.Mgr│Cashier           │Total    │
├───────────┼──────┼───────┼───────┼──────────────────┼─────────┤
│Dashboard  │  ✅  │  ✅   │  ✅   │  ✅ (limited)    │ 4 roles │
│POS Kasir  │  ✅  │  ✅   │  ❌   │  ✅              │ 3 roles │
│Prediksi   │  ✅  │  ✅   │  ✅   │  ❌              │ 3 roles │
│XAI        │  ✅  │  ✅   │  ❌   │  ❌              │ 2 roles │
│Inventaris │  ✅  │  ✅   │  ✅   │  ❌              │ 3 roles │
│Transaksi  │  ✅  │  ✅   │  ❌   │  ❌              │ 2 roles │
│Laporan    │  ✅  │  ✅   │  ✅   │  ❌              │ 3 roles │
│MLOps      │  ❌  │  ✅   │  ❌   │  ❌              │ 1 role  │
│Kas        │  ✅  │  ✅   │  ❌   │  ❌              │ 2 roles │
│Stok Move  │  ✅  │  ✅   │  ✅   │  ❌              │ 3 roles │
│User Mgmt  │  ❌  │  ✅   │  ❌   │  ❌              │ 1 role  │
│Pengaturan │  ✅  │  ✅   │  ✅   │  ✅              │ 4 roles │
├───────────┼──────┼───────┼───────┼──────────────────┼─────────┤
│TOTAL      │10/12 │12/12  │ 6/12  │ 3/12             │         │
└───────────┴──────┴───────┴───────┴──────────────────┴─────────┘
```

---

## 3. Diagram Alur Navigasi

### 3.1 Task Flow: Login → Dashboard (Flowchart Murni)

```
    ┌─────────┐
    │  START  │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│ Buka Aplikasi   │
│ (URL root /)    │
└────────┬────────┘
         │
         ▼
    ◆ Sudah Login?
   ╱              ╲
  YA              TIDAK
  │                │
  │                ▼
  │    ┌───────────────────┐
  │    │ Redirect ke       │
  │    │ /login/cashier    │
  │    └─────────┬─────────┘
  │              │
  │              ▼
  │    ┌───────────────────┐
  │    │ Klik "Pilih       │
  │    │ Portal Lain"      │
  │    │ → /login/select   │
  │    └─────────┬─────────┘
  │              │
  │              ▼
  │    ┌───────────────────┐
  │    │ Pilih Role        │
  │    │ (Owner/Admin/     │
  │    │  Cashier)         │
  │    └─────────┬─────────┘
  │              │
  │              ▼
  │    ┌───────────────────┐
  │    │ Input Username    │
  │    │ + PIN             │
  │    └─────────┬─────────┘
  │              │
  │              ▼
  │         ◆ Valid?
  │        ╱       ╲
  │      YA       TIDAK
  │       │         │
  │       │         ▼
  │       │  ┌─────────────┐
  │       │  │ Toast Error  │
  │       │  │ "Kredensial  │
  │       │  │  salah"      │
  │       │  └──────┬──────┘
  │       │         │ (kembali ke form)
  │       │         └──►
  │       │
  │       ▼
  │  ◆ 2FA Enabled?
  │ ╱              ╲
  │ YA            TIDAK
  │ │               │
  │ ▼               │
  │ ┌────────────┐  │
  │ │ Input TOTP │  │
  │ │ Code       │  │
  │ └─────┬──────┘  │
  │       │         │
  │       ▼         │
  │  ◆ TOTP Valid?  │
  │ ╱         ╲     │
  │YA        TIDAK  │
  │ │          │    │
  │ │          ▼    │
  │ │  [Toast Error]│
  │ │               │
  │ ├───────────────┘
  │ │
  ▼ ▼
┌─────────────────┐
│ Set httpOnly     │
│ Cookie           │
│ (server-side)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Redirect ke /   │
│ (Dashboard)     │
└────────┬────────┘
         │
         ▼
    ┌─────────┐
    │   END   │
    └─────────┘
```

### 3.2 Task Flow: Checkout POS (Kasir)

```
    ┌─────────┐
    │  START  │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│ Buka /kasir     │
│ (Tab POS aktif) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Search / Browse  │
│ Produk (grid)   │
│ [F1 = focus     │
│  search bar]    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Klik Product    │
│ Card            │
└────────┬────────┘
         │
         ▼
    ◆ Custom Price?
   ╱              ╲
  YA              TIDAK
  │                │
  ▼                │
┌──────────────┐   │
│ Modal: Input │   │
│ Harga Custom │   │
│ → Enter /    │   │
│   Klik Add   │   │
└──────┬───────┘   │
       │           │
       ▼           ▼
┌─────────────────────┐
│ Item masuk Cart     │
│ Panel (sisi kanan)  │
└──────────┬──────────┘
         │
         ▼
    ◆ Tambah item lagi?
   ╱              ╲
  YA              TIDAK
  │                │
  └─►(kembali      │
     ke search)    │
                   ▼
┌─────────────────────┐
│ Klik "Bayar"        │
│ di Cart Panel       │
└──────────┬──────────┘
         │
         ▼
┌─────────────────────┐
│ Payment Modal       │
│ muncul              │
│ ┌─────────────────┐ │
│ │ Pilih: CASH     │ │
│ │ atau QRIS       │ │
│ └────────┬────────┘ │
└──────────┼──────────┘
           │
      ◆ Metode?
     ╱        ╲
   CASH      QRIS
    │          │
    ▼          ▼
┌──────────┐  ┌──────────┐
│Input     │  │Scan QR   │
│Uang      │  │code      │
│Diterima  │  │          │
└────┬─────┘  └────┬─────┘
     │             │
     ▼             │
┌──────────┐       │
│Kembalian │       │
│dihitung  │       │
│otomatis  │       │
└────┬─────┘       │
     │             │
     ▼             ▼
┌─────────────────────┐
│ Klik "Konfirmasi    │
│ Pembayaran"         │
└──────────┬──────────┘
         │
         ▼
┌─────────────────────┐
│ Transaksi tersimpan │
│ Toast: "Sukses"     │
│ Cart di-reset       │
│ Struk siap cetak    │
└──────────┬──────────┘
         │
         ▼
    ┌─────────┐
    │   END   │
    └─────────┘
```

### 3.3 Task Flow: Refund (Kasir)

```
    ┌─────────┐
    │  START  │
    └────┬────┘
         │
         ▼
┌──────────────────┐
│ Klik tombol      │
│ "Refund" di      │
│ header POS       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Refund Modal     │
│ muncul           │
│ → Input ID       │
│   Transaksi      │
└────────┬─────────┘
         │
         ▼
    ◆ Transaksi ditemukan?
   ╱                   ╲
  YA                  TIDAK
  │                    │
  │                    ▼
  │            ┌──────────────┐
  │            │Toast Error   │
  │            │"Tidak        │
  │            │ ditemukan"   │
  │            └──────────────┘
  │
  ▼
┌──────────────────┐
│ Tampil detail    │
│ transaksi asli   │
│ Pilih item       │
│ untuk refund     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Input alasan     │
│ refund           │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Klik "Proses     │
│ Refund"          │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Refund tercatat  │
│ Toast: "Sukses"  │
│ Stok dikembalikan│
└────────┬─────────┘
         │
         ▼
    ┌─────────┐
    │   END   │
    └─────────┘
```

### 3.4 User Flow: Pemilik Review Performa (Decision-Heavy)

```
    ┌─────────┐
    │  START  │
    │ (Owner  │
    │  login) │
    └────┬────┘
         │
         ▼
┌──────────────────┐
│ DASHBOARD /      │
│ Lihat 4 KPI      │
│ cards            │
└────────┬─────────┘
         │
         ▼
    ◆ Perlu detail cabang?
   ╱                   ╲
  YA                  TIDAK
  │                    │
  ▼                    │
┌──────────────┐       │
│ Klik filter  │       │
│ cabang       │       │
│ (HQ/Tng/Bks) │       │
└──────┬───────┘       │
       │               │
       ▼               │
┌──────────────┐       │
│ KPI + tabel  │       │
│ update per   │       │
│ cabang       │       │
└──────┬───────┘       │
       │               │
       ▼               ▼
    ◆ Ada stok kritis?
   ╱                ╲
  YA               TIDAK
  │                  │
  ▼                  │
┌──────────────┐     │
│ Lihat Low    │     │
│ Stock Alert  │     │
│ section      │     │
└──────┬───────┘     │
       │             │
       ▼             │
    ◆ Perlu cek prediksi?
   ╱                ╲
  YA               TIDAK
  │                  │
  ▼                  │
┌──────────────┐     │
│ Navigate ke  │     │
│ /prediksi-   │     │
│ stok         │     │
└──────┬───────┘     │
       │             │
       ▼             │
┌──────────────┐     │
│ Lihat tabel  │     │
│ forecast per │     │
│ produk       │     │
│ + priority   │     │
└──────┬───────┘     │
       │             │
       ▼             │
    ◆ Ingin pahami "mengapa"?
   ╱                     ╲
  YA                    TIDAK
  │                       │
  ▼                       │
┌──────────────────┐      │
│ Navigate ke      │      │
│ /penjelasan-ai   │      │
│ (XAI Page)       │      │
└──────┬───────────┘      │
       │                  │
       ▼                  │
┌──────────────────┐      │
│ Tab "Explain":   │      │
│ Baca AI Summary  │      │
│ + Feature Bars   │      │
└──────┬───────────┘      │
       │                  │
       ▼                  │
    ◆ Ingin simulasi skenario?
   ╱                     ╲
  YA                    TIDAK
  │                       │
  ▼                       │
┌──────────────────┐      │
│ Tab "Simulate":  │      │
│ Toggle Promo,    │      │
│ Holiday, Payday  │      │
│ → Lihat dampak   │      │
│   demand         │      │
└──────┬───────────┘      │
       │                  │
       ▼                  ▼
    ◆ Perlu laporan formal?
   ╱                     ╲
  YA                    TIDAK
  │                       │
  ▼                       │
┌──────────────────┐      │
│ Navigate ke      │      │
│ /laporan         │      │
│ → Klik Download  │      │
│   XLSX/CSV       │      │
└──────┬───────────┘      │
       │                  │
       ▼                  ▼
    ┌─────────┐
    │   END   │
    └─────────┘
```

### 3.5 User Flow: Admin Onboarding Karyawan Baru

```
    ┌─────────┐
    │  START  │
    │ (Admin  │
    │  login) │
    └────┬────┘
         │
         ▼
┌──────────────────────┐
│ Navigate ke          │
│ /manajemen-pengguna  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Klik "Undang         │
│ Pengguna"            │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Modal: Invite Form   │
│ ┌──────────────────┐ │
│ │ Input Email      │ │
│ │ Pilih Role       │ │
│ │ (dropdown)       │ │
│ │ Pilih Cabang     │ │
│ │ (dropdown)       │ │
│ └──────────────────┘ │
└──────────┬───────────┘
           │
           ▼
    ◆ Data valid?
   ╱             ╲
  YA            TIDAK
  │               │
  │               ▼
  │       ┌──────────────┐
  │       │ Error:       │
  │       │ "Email wajib │
  │       │  diisi"      │
  │       └──────────────┘
  │
  ▼
┌──────────────────────┐
│ Klik "Kirim          │
│ Undangan"            │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Email terkirim       │
│ (token valid 7 hari) │
│ Toast: "Undangan     │
│ berhasil dikirim"    │
└──────────┬───────────┘
           │
           │
═══════════╪═══════════════ (perspektif pindah ke karyawan baru)
           │
           ▼
┌──────────────────────┐
│ Karyawan buka link   │
│ /accept-invite/      │
│ {token}              │
└──────────┬───────────┘
           │
           ▼
    ◆ Token valid?
   ╱              ╲
  YA             TIDAK
  │                │
  │                ▼
  │        ┌──────────────┐
  │        │ Error Page:  │
  │        │ "Undangan    │
  │        │  kadaluarsa" │
  │        └──────────────┘
  │
  ▼
┌──────────────────────┐
│ Step 1: Detail       │
│ undangan (role,      │
│ cabang, inviter)     │
│ → Klik "Lanjutkan"   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Step 2: Setup Akun   │
│ ┌──────────────────┐ │
│ │ Input Username   │ │
│ │ Input PIN        │ │
│ │ Confirm PIN      │ │
│ └──────────────────┘ │
│ → Klik "Buat Akun"   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Step 3: Sukses!      │
│ "Akun berhasil       │
│  dibuat"             │
│ → Klik "Login"       │
│   → redirect ke      │
│     /login/{role}    │
└──────────┬───────────┘
           │
           ▼
    ┌─────────┐
    │   END   │
    └─────────┘
```

### 3.6 User Flow: Inventaris — Restok Produk Kritis

```
    ┌─────────┐
    │  START  │
    │(Inv.Mgr)│
    └────┬────┘
         │
         ▼
┌──────────────────┐
│ Navigate ke      │
│ /inventaris      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Klik tab "Kritis"│
│ (filter otomatis)│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Lihat daftar     │
│ produk kritis    │
│ (DOI < 3 hari)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Klik chevron >   │
│ pada produk      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Drawer Detail    │
│ Product muncul   │
│ ┌──────────────┐ │
│ │ DOI: 1 hari  │ │
│ │ Trend chart  │ │
│ │ Stock: 5     │ │
│ │ Demand: 30/h │ │
│ └──────────────┘ │
└────────┬─────────┘
         │
         ▼
    ◆ Aksi yang diambil?
   ╱        │         ╲
Restock   Edit     Transfer
  │        │          │
  ▼        ▼          ▼
┌──────┐ ┌──────┐  ┌──────┐
│Stock │ │Prod  │  │Trans │
│Update│ │Form  │  │fer   │
│Modal │ │Modal │  │Modal │
│      │ │      │  │      │
│Input │ │Edit  │  │Pilih │
│qty + │ │nama, │  │cabang│
│note  │ │harga,│  │asal +│
│      │ │min,  │  │tujuan│
│      │ │dll   │  │+ qty │
└──┬───┘ └──┬───┘  └──┬───┘
   │        │         │
   ▼        ▼         ▼
┌──────────────────────┐
│ Toast: "Berhasil"    │
│ Tabel ter-update     │
└──────────┬───────────┘
         │
         ▼
    ┌─────────┐
    │   END   │
    └─────────┘
```

### 3.7 Wire Flow: Dashboard → Prediksi → XAI (Navigasi Lintas Halaman)

```
┌─────────────────────────────────────────────────┐
│ DASHBOARD (/)                                    │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ │
│ │ Rp12,8jt│ │ 142 txn │ │ Rp90,1rb│ │ 1.247  │ │
│ │ +18.3%  │ │ +12.1%  │ │ +5.6%   │ │ -3.2%  │ │
│ └─────────┘ └─────────┘ └─────────┘ └────────┘ │
│                                                  │
│ ┌───────────────────────┐ ┌────────────────────┐ │
│ │ Top Products Chart    │ │ ⚠️ Low Stock Alert │ │
│ │ (Bar)                 │ │ • Minyak SunCo: 5  │ │
│ │                       │ │ • Indomie: 15 ─────┼─┼──► Klik item
│ └───────────────────────┘ │ • Mizone: 12       │ │     mengarah ke
│                           └────────────────────┘ │     /inventaris
│ ┌──────────────────────────────────────────────┐ │
│ │ 🧠 AI Recommendations                        │ │
│ │ ┌──────────┬──────┬──────┬──────┬──────────┐ │ │
│ │ │ Product  │Stock │Pred  │Conf  │Priority  │ │ │
│ │ │ Beras 5kg│ 120  │~450  │ 96%  │🔴Tinggi ─┼─┼──┼──► Klik row
│ │ │ Teh Botol│ 850  │~900  │ 88%  │🔴Tinggi  │ │ │     mengarah ke
│ │ │ Indomie  │1560  │~1200 │ 92%  │🟢Rendah  │ │ │     /prediksi-stok
│ │ └──────────┴──────┴──────┴──────┴──────────┘ │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
         │
         │ (Klik "Prediksi Stok" di sidebar / klik row tabel)
         ▼
┌──────────────────────────────────────────────────┐
│ PREDIKSI STOK (/prediksi-stok)                    │
│                                                    │
│ ┌───────────────────────┐ ┌──────────────────────┐ │
│ │ Weekly Demand Chart   │ │ Category Demand      │ │
│ │ (AreaChart)           │ │ (BarChart horizontal)│ │
│ │     ╱╲  ╱╲            │ │ Sembako  ████████    │ │
│ │   ╱    ╲╱  ╲          │ │ Minuman  ██████      │ │
│ │  ╱          ╲         │ │ Snack    █████       │ │
│ └───────────────────────┘ └──────────────────────┘ │
│                                                    │
│ ┌────────────────────────────────────────────────┐ │
│ │ Forecast Table                                 │ │
│ │ ┌──────────┬──────┬──────┬──────┬──────────┐   │ │
│ │ │ Product  │Stock │Pred  │Conf  │Priority  │   │ │
│ │ │ Beras 5kg│ 120  │~450  │ 96%  │🔴Tinggi ─┼───┼──► Klik
│ │ │ ...      │      │      │      │          │   │ │   mengarah
│ │ └──────────┴──────┴──────┴──────┴──────────┘   │ │   ke XAI
│ └────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
         │
         │ (Klik "Penjelasan AI" di sidebar)
         ▼
┌────────────────────────────────────────────────────┐
│ PENJELASAN AI (/penjelasan-ai)                      │
│                                                      │
│ ┌─ Product Selector ─────────────────────────────┐   │
│ │ [▼ Cetak Foto 4x6 — CF-4X6]                   │   │
│ └────────────────────────────────────────────────┘   │
│                                                      │
│ ┌─ Tabs ─────────────────────────────────────────┐   │
│ │ [Explain] [Simulate] [Compare] [Global]        │   │
│ └────────────────────────────────────────────────┘   │
│                                                      │
│ Tab: Explain                                         │
│ ┌────────────────────┐  ┌────────────────────────┐   │
│ │ AI Summary         │  │ Feature Importance     │   │
│ │ "Permintaan cetak  │  │ Holiday    ████████ 45%│   │
│ │  foto diprediksi   │  │ Payday     █████   25%│   │
│ │  naik 42%..."      │  │ Trend      ███     15%│   │
│ │                    │  │ Location   ██      10%│   │
│ │ 👍  👎  [Share]    │  │ Price      █        5%│   │
│ └────────────────────┘  └────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### 3.8 User Flow: Sesi Kadaluarsa (Session Expiry)

```
    ┌──────────────────┐
    │ User sedang di   │
    │ halaman apapun   │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Browser fetch    │
    │ data ke          │
    │ /api/backend/*   │
    └────────┬─────────┘
             │
             ▼
        ◆ Cookie valid?
       ╱              ╲
     YA              TIDAK
      │                │
      ▼                ▼
┌──────────┐   ┌──────────────────┐
│ Data     │   │ Backend return   │
│ berhasil │   │ 401 Unauthorized │
│ dimuat   │   └────────┬─────────┘
└──────────┘            │
                        ▼
               ┌──────────────────┐
               │ API client emit  │
               │ event            │
               │ "auth:unauthorized│"
               └────────┬─────────┘
                        │
                        ▼
               ┌──────────────────┐
               │ AuthContext       │
               │ listener fires:  │
               │ • Clear cache    │
               │ • Clear role     │
               └────────┬─────────┘
                        │
                        ▼
               ┌──────────────────┐
               │ Toast: "Sesi    │
               │ berakhir —      │
               │ Silakan login   │
               │ ulang"          │
               └────────┬─────────┘
                        │
                        ▼
               ┌──────────────────┐
               │ Redirect ke      │
               │ /login/select    │
               └──────────────────┘
```

### 3.9 User Flow: Akses Tanpa Izin (RBAC Violation)

```
    ┌──────────────────┐
    │ Cashier mencoba  │
    │ akses /mlops     │
    │ (via URL bar)    │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ RouteGuard       │
    │ memeriksa:       │
    │                  │
    │ routes.find(     │
    │   "/mlops"       │
    │ ).allowedRoles   │
    │ = ["admin"]      │
    └────────┬─────────┘
             │
             ▼
        ◆ "cashier" IN ["admin"]?
       ╱                     ╲
     YA                    TIDAK
      │                      │
      ▼                      ▼
┌──────────┐       ┌──────────────────┐
│ Halaman  │       │ Toast Error:     │
│ dimuat   │       │ "Access Denied:  │
│ normal   │       │  Your portal     │
│          │       │  (cashier) does  │
│          │       │  not have        │
│          │       │  permission"     │
└──────────┘       └────────┬─────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │ Redirect ke /    │
                   │ (Dashboard)      │
                   └──────────────────┘
```

### 3.10 Task Flow: Lupa PIN (Forgot Password)

```
    ┌─────────┐
    │  START  │
    └────┬────┘
         │
         ▼
┌──────────────────┐
│ Klik "Lupa PIN?" │
│ di halaman login │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Step 1:          │
│ Input alamat     │
│ email terdaftar  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Klik "Kirim      │
│ Link Reset"      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Step 2:          │
│ "Email terkirim  │
│ ke a***@***.id"  │
│ Cek inbox Anda   │
└────────┬─────────┘
         │
         │ (User buka email, klik link)
         ▼
┌──────────────────┐
│ Step 3:          │
│ Input PIN baru   │
│ + Konfirmasi PIN │
└────────┬─────────┘
         │
         ▼
    ◆ PIN valid?
   ╱            ╲
  YA           TIDAK
  │              │
  │              ▼
  │      ┌──────────────┐
  │      │ Error:       │
  │      │ "PIN minimal │
  │      │  4 digit"    │
  │      └──────────────┘
  │
  ▼
┌──────────────────┐
│ Step 4:          │
│ "PIN berhasil    │
│  direset!"       │
│                  │
│ [Login Sekarang] │
│ → /login/{role}  │
└──────────────────┘
```

---

## 4. Panduan UI/UX

### 4.1 Tata Letak (Layout)

#### App Shell Architecture

```
┌──────────────────────────────────────────────────────┐
│                   HEADER (h-14 / 56px)               │
│  [☰ Mobile] [Logo] ──────────── [Search] [Notif] [?] │
├──────────┬───────────────────────────────────────────┤
│          │                                           │
│ SIDEBAR  │              MAIN CONTENT                 │
│(w-[240px]│         (flex-1, overflow-y-auto)         │
│  atau    │                                           │
│ w-[68px] │   ┌─────────────────────────────────┐     │
│collapsed)│   │  max-w-[1920px] mx-auto         │     │
│          │   │  p-4 sm:p-6 lg:p-8              │     │
│ ┌──────┐ │   │                                  │     │
│ │ Logo │ │   │  [Page Content Here]             │     │
│ ├──────┤ │   │                                  │     │
│ │ Nav  │ │   │                                  │     │
│ │Links │ │   │                                  │     │
│ │      │ │   │                                  │     │
│ ├──────┤ │   │                                  │     │
│ │Mirror│ │   │                                  │     │
│ │ Mode │ │   │                                  │     │
│ ├──────┤ │   │                                  │     │
│ │ User │ │   │                                  │     │
│ ├──────┤ │   │                                  │     │
│ │[</>] │ │   └─────────────────────────────────┘     │
│ └──────┘ │                                           │
└──────────┴───────────────────────────────────────────┘
```

**Prinsip Layout:**

- **Sidebar gelap (`bg-slate-900`)** sebagai anchor visual — memberikan kontras tegas dengan area konten putih (`bg-slate-50`)
- **Sidebar collapsible:** 240px → 68px dengan animasi `duration-300`
- **Mobile:** Sidebar menjadi overlay dengan backdrop blur (`bg-slate-900/60 backdrop-blur-sm`), slide-in dari kiri
- **Content max-width:** `1920px` — mendukung ultra-wide display
- **Responsive padding:** `p-4 → p-6 → p-8` bertambah seiring layar membesar

#### Layout per Tipe Halaman

| Tipe Halaman | Layout | Max Width | Padding | Contoh |
|:---|:---|:---|:---|:---|
| **Dashboard** | App Shell + Grid Cards | 1920px | p-4/6/8 responsive | `/` |
| **Data List** | App Shell + Table Card | 1920px | p-4/6/8 responsive | `/inventaris`, `/riwayat-transaksi` |
| **Analytics** | App Shell + Chart Grid | 1920px | p-4/6/8 responsive | `/laporan`, `/mlops` |
| **POS** | App Shell* (seharusnya fullscreen) | 100vw | Full height | `/kasir` |
| **Settings** | App Shell + 2-Column (nav + content) | 1920px | p-4/6/8 responsive | `/pengaturan` |
| **Auth** | Bare Layout (fullscreen, centered) | 480px | Centered | `/login/*` |
| **Wizard** | Bare Layout + Stepper | 640px | Centered | `/accept-invite/*`, `/login/forgot-password` |
| **Error** | Bare/App Shell + Centered | 480px | Centered | `error.tsx`, `not-found.tsx` |

### 4.2 Interaksi Pengguna (Interaction Patterns)

#### Pattern: Feedback Instan

| Aksi User | Feedback Sistem | Mekanisme |
|:---|:---|:---|
| Klik tombol aksi (Save/Add/Delete) | Toast notification (Sonner) | `toast.success()` / `toast.error()` |
| Loading data awal | Skeleton placeholder (shimmer) | `animate-pulse` custom skeletons |
| Proses berjalan (save, upload) | Button disabled + spinner icon | `disabled:opacity-50` + `animate-spin` |
| Error fetching data | ErrorBoundary fallback card | `<ErrorBoundary compact>` |
| Hover pada card/row | Elevasi naik + subtle highlight | `hover:shadow-md transition-shadow` |
| Keyboard shortcut (F1) | Focus search bar di POS | `window.addEventListener("keydown")` |

#### Pattern: Modal & Drawer

| Komponen | Trigger | Overlay | Animasi | Close |
|:---|:---|:---|:---|:---|
| **Payment Modal** | Klik "Bayar" | `bg-slate-900/60 backdrop-blur-sm` | `zoom-in-95 slide-in-from-bottom-4` | Klik overlay / ESC / tombol X |
| **Product Drawer** | Klik chevron di tabel | `bg-slate-900/60 backdrop-blur-sm` | `slide-in-from-right-2` | Klik overlay / ESC / tombol X |
| **Stock Opname** | Klik "Opname" | Full overlay | `fade-in` | Klik X / Complete |
| **Dropdown** | Klik selector | None / transparent | `scale-95 → scale-100` | Klik option / klik luar |

#### Pattern: Form Validation

```
Input State Flow:
┌──────────┐      ┌──────────┐      ┌──────────┐
│  DEFAULT │─────►│  FOCUS   │─────►│ FILLED   │
│          │      │(ring-2   │      │          │
│border-   │      │ring-     │      │          │
│slate-200 │      │indigo-   │      │          │
│          │      │500/40)   │      │          │
└──────────┘      └──────────┘      └────┬─────┘
                                         │
                                    ◆ Valid?
                                   ╱       ╲
                                 YA       TIDAK
                                  │         │
                                  ▼         ▼
                           ┌──────────┐ ┌──────────┐
                           │ SUCCESS  │ │  ERROR   │
                           │text-     │ │text-     │
                           │emerald-  │ │rose-500  │
                           │500       │ │border-   │
                           │          │ │rose-300  │
                           └──────────┘ └──────────┘
```

- **Validasi:** React Hook Form + Zod schemas (pada form yang sudah dimigrasi)
- **Error display:** Inline di bawah field, warna rose
- **Debounce:** Search field menggunakan 250ms debounce (`useDebounce`)

### 4.3 Prinsip Kegunaan (Usability Principles)

#### A. Progressive Disclosure

Informasi disajikan secara berlapis — ringkasan dahulu, detail kemudian:

```
Layer 1: KPI Cards          → angka ringkas + trend (↑↓)
Layer 2: Tables/Charts      → data detail + sorting + filter
Layer 3: Drawer/Modal       → full detail per item + actions
Layer 4: Cross-page nav     → analisis mendalam (XAI, MLOps)
```

**Contoh di Dashboard:**
1. KPI card menampilkan "Rp 12,8jt" (Layer 1)
2. Forecast chart menampilkan tren 7 hari (Layer 2)
3. Prediction table menampilkan per-produk detail (Layer 2)
4. Klik produk → navigasi ke `/prediksi-stok` (Layer 3)
5. Klik "Penjelasan AI" → `/penjelasan-ai` (Layer 4)

#### B. Role-Adaptive UI

Halaman yang sama menampilkan konten berbeda berdasarkan role:

| Section | Owner | Admin | Inv.Manager | Cashier |
|:---|:---|:---|:---|:---|
| Financial KPI Cards | ✅ | ✅ | ❌ | ❌ |
| Branch Comparison Table | ✅ | ✅ | ❌ | ❌ |
| AI Precision Badge | ✅ | ✅ | ❌ | ❌ |
| Stock Section (Charts + Alerts) | ✅ | ✅ | ✅ | ❌ |
| Forecast Chart | ✅ | ✅ | ❌ | ❌ |
| AI Recommendations Table | ✅ | ✅ | ✅ | ✅ |

Implementasi: conditional rendering via `canSeeFinancials` dan `canSeeStock` booleans derived dari `role`.

#### C. Konsistensi Visual

Setiap halaman mengikuti struktur yang konsisten:

```
┌──────────────────────────────────────────┐
│  1. PAGE HEADER                          │
│     H1 Title + Subtitle + Action Buttons │
│     border-b border-slate-100            │
├──────────────────────────────────────────┤
│  2. ALERT BANNER (opsional)              │
│     Peringatan kritis jika ada           │
├──────────────────────────────────────────┤
│  3. SUMMARY CARDS (opsional)             │
│     4-column KPI grid                    │
├──────────────────────────────────────────┤
│  4. FILTER BAR                           │
│     Tabs + Search + Period selector      │
├──────────────────────────────────────────┤
│  5. MAIN CONTENT                         │
│     Table / Chart Grid / Card Grid       │
├──────────────────────────────────────────┤
│  6. PAGINATION                           │
│     Page info + page buttons             │
└──────────────────────────────────────────┘
```

#### D. Aksesibilitas (Accessibility)

| Aspek | Implementasi | Referensi |
|:---|:---|:---|
| **Keyboard Navigation** | `focus-visible:ring-2 ring-indigo-500/40` pada semua interactive elements | `A11Y.md` |
| **Screen Reader** | `aria-label`, `aria-modal`, `role="dialog"`, `aria-checked` pada switch | Per-komponen |
| **Reduced Motion** | Global `@media (prefers-reduced-motion: reduce)` CSS override | `theme.css` |
| **Focus Trap** | `useModalA11y` hook untuk modal dan drawer | `useModalA11y.ts` |
| **Min Font Size** | 9px minimum (`text-[9px]`) — tidak ada yang lebih kecil | `typography.ts` |
| **Color Contrast** | Minimum WCAG 2.1 AA (4.5:1 untuk body text) | `COLORS.md` |
| **Skip Link** | Planned — `SkipLink.tsx` belum diimplementasi | `A11Y.md §4.7` |

#### E. Responsive Behavior

| Breakpoint | Width | Perubahan Utama |
|:---|:---|:---|
| **Mobile** | < 640px | Sidebar hidden (hamburger toggle), single column, padding 16px |
| **Tablet** | 640–1023px | 2-column grids, padding 24px |
| **Desktop** | 1024–1535px | Sidebar visible, 3-4 column grids, padding 32px |
| **Wide** | 1536px+ | Full sidebar + spacious layout, 4-5 column grids |

POS Kasir memiliki breakpoint khusus:
- **Mobile/Tablet:** Sidebar icon-only (w-20), search bar simplified
- **Desktop:** Full sidebar (w-64), category panel visible
- **Product grid:** `grid-cols-2 → 3 → 4 → 5` seiring layar membesar

### 4.4 Design Token System

Aplikasi menggunakan **20 token files** sebagai single source of truth untuk semua styling:

| Category | Token File | Purpose | Key Tokens |
|:---|:---|:---|:---|
| **Typography** | `typography.ts` | Font sizes, weights, line heights | `T.h1`, `T.body`, `T.kpiHero`, `T.micro` |
| **Colors** | `colors.ts` | 8-family palette (5 core + 3 special) | `C.primary.*`, `C.success.*`, `C.destructive.*` |
| **Spacing** | `spacing.ts` | Gaps, paddings, icon sizes | `GAP.*`, `PAD.*`, `ICON.*` |
| **Radii** | `radii.ts` | Border radius (6 tiers) | `R.sm`, `R.md`, `R.xl`, `R.full` |
| **Elevation** | `elevation.ts` | Shadows + z-index layers | `E.sm`, `E.lg`, `Z.modal`, `Z.dropdown` |
| **Motion** | `motion.ts` | Durations, easings, stagger | `M.fast`, `M.smooth`, `DELAY.*` |
| **Format** | `format.ts` | Currency, date, number formatting | `formatRupiah()`, `formatDate()` |
| **Status** | `status.ts` | Status→variant canonical mapping | `ROLE.*`, `TXN_STATUS.*`, `STOCK_STATUS.*` |

### 4.5 Pola Warna Semantik

```
┌────────────────────────────────────────────────────────────┐
│                    COLOR USAGE MAP                          │
├────────────┬───────────────────────────────────────────────┤
│ INDIGO     │ Brand, CTA, primary actions, owner badge,    │
│ (Primary)  │ AI precision, active nav, focus ring fallback│
├────────────┼───────────────────────────────────────────────┤
│ EMERALD    │ Success, revenue up, safe stock, confirm,    │
│ (Success)  │ cashier badge, logo accent, online status    │
├────────────┼───────────────────────────────────────────────┤
│ AMBER      │ Warning, low stock, items down, pending,     │
│ (Warning)  │ shift badge, custom price                    │
├────────────┼───────────────────────────────────────────────┤
│ ROSE       │ Error, critical stock, delete, cancel,       │
│(Destructive│ admin badge, refund                          │
├────────────┼───────────────────────────────────────────────┤
│ SLATE      │ 90%+ surface: background, borders, body text,│
│ (Neutral)  │ sidebar chrome, disabled, secondary text     │
├────────────┼───────────────────────────────────────────────┤
│ VIOLET     │ AI-specific: predictions, XAI features,      │
│ (AI)       │ model metrics, intelligence badges           │
├────────────┼───────────────────────────────────────────────┤
│ BLUE       │ Informational: tooltips, hints, passive info │
│ (Info)     │                                              │
├────────────┼───────────────────────────────────────────────┤
│ TEAL       │ ONLY for inventory_manager role badge/avatar │
│ (Role)     │                                              │
└────────────┴───────────────────────────────────────────────┘
```

---

## 5. Lampiran

### 5.1 Glosarium Istilah Domain

| Istilah | Definisi dalam Konteks InsightSphere |
|:---|:---|
| **DOI** | Days of Inventory — estimasi berapa hari stok akan habis |
| **Opname** | Stock opname — audit fisik stok vs sistem |
| **Shift** | Periode kerja kasir (buka shift → tutup shift) |
| **Petty Cash** | Pengeluaran kecil operasional dari laci kas |
| **Feature Store** | Tabel ML yang menyimpan 25+ engineered features |
| **Reasoning Text** | Penjelasan AI dalam bahasa manusia tentang prediksi |
| **Mirror Mode** | Admin/owner melihat UI dari perspektif role lain |
| **Horizon** | Rentang waktu prediksi (7/14/21/28 hari) |

### 5.2 Keyboard Shortcuts

| Shortcut | Lokasi | Aksi |
|:---|:---|:---|
| `F1` | POS Kasir | Focus ke search bar (barcode input) |
| `Enter` | Custom Price Modal | Konfirmasi harga dan tambah ke cart |
| `Escape` | Semua Modal/Drawer | Tutup modal/drawer aktif |
| `Cmd+K` | Global | Buka Command Palette (search navigasi cepat) |

### 5.3 Daftar File Referensi

| Kategori | File | Lokasi |
|:---|:---|:---|
| Routes Registry | `routes.tsx` | `frontend/src/app/routes.tsx` |
| Route Guard | `RouteGuard.tsx` | `frontend/src/app/components/RouteGuard.tsx` |
| Auth Context | `AuthContext.tsx` | `frontend/src/app/context/AuthContext.tsx` |
| Layout Controller | `Layout.tsx` | `frontend/src/app/components/Layout.tsx` |
| Sidebar Navigation | `Sidebar.tsx` | `frontend/src/app/components/Sidebar.tsx` |
| Provider Tree | `App.tsx` | `frontend/src/app/App.tsx` |
| Cookie Manager | `auth-cookie.ts` | `frontend/src/app/lib/auth-cookie.ts` |
| API Proxy | `[...path]/route.ts` | `frontend/app/api/backend/[...path]/route.ts` |
| Design System | `Design System/*.md` | `Design System/` (repo root) |
| Token Files | `*.ts` (20 files) | `frontend/src/app/lib/` |
