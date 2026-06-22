# InsightSphere — Arsitektur Navigasi & Routing

**Versi:** 1.0 | **Tanggal:** 26 April 2026  
**Perspektif:** Frontend Architect  
**Framework:** Next.js 14+ App Router  
**Sumber Analisis:** `frontend/app/` (filesystem routing) + `src/app/routes.tsx` (runtime route registry)

---

## 1. Peta Routing Utama

### 1.1 Filesystem Route Tree

```
frontend/app/
│
├── layout.tsx                          ← ROOT LAYOUT (semua halaman lewat sini)
├── loading.tsx                         ← Global loading skeleton (Suspense fallback)
├── error.tsx                           ← Global error boundary page
├── not-found.tsx                       ← 404 catch-all
├── page.tsx                            ← "/" → DashboardPage
├── globals.css                         ← Global stylesheet
│
├── login/                              ← PUBLIC — Zona Autentikasi
│   ├── select/
│   │   └── page.tsx                    ← "/login/select" → Portal selector (3 card)
│   ├── [role]/
│   │   └── page.tsx                    ← "/login/{role}" → PortalTemplate login form
│   └── forgot-password/
│       └── page.tsx                    ← "/login/forgot-password" → 4-step reset wizard
│
├── accept-invite/                      ← PUBLIC — Onboarding Undangan
│   └── [token]/
│       └── page.tsx                    ← "/accept-invite/{token}" → 3-step setup wizard
│
├── (dashboard)/                        ← ROUTE GROUP — unused layout wrapper (AppShell)
│   ├── layout.tsx
│   └── intelligence/
│       └── xai/                        ← Kosong (belum dipakai, rute XAI di top-level)
│
├── admin/                              ← STANDALONE — Admin prototype dashboard
│   └── dashboard/
│       └── page.tsx                    ← "/admin/dashboard" → AdminDashboardPage
│
├── kasir/page.tsx                      ← "/kasir" → KasirPage (POS)
├── prediksi-stok/page.tsx              ← "/prediksi-stok" → PrediksiStokPage
├── penjelasan-ai/page.tsx              ← "/penjelasan-ai" → XAIPage
├── inventaris/page.tsx                 ← "/inventaris" → InventarisPage
├── riwayat-transaksi/page.tsx          ← "/riwayat-transaksi" → TransactionHistoryPage
├── laporan/page.tsx                    ← "/laporan" → LaporanPage
├── mlops/page.tsx                      ← "/mlops" → MLOpsDashboardPage
├── manajemen-kas/page.tsx              ← "/manajemen-kas" → CashManagementPage
├── pergerakan-stok/page.tsx            ← "/pergerakan-stok" → StockMovementPage
├── manajemen-pengguna/page.tsx         ← "/manajemen-pengguna" → UserManagementPage
├── pengaturan/page.tsx                 ← "/pengaturan" → PengaturanPage
│
└── api/                                ← SERVER-SIDE API Routes (Next.js Route Handlers)
    ├── auth/
    │   ├── login/route.ts              ← POST: Proxy → backend /auth/login + set cookie
    │   ├── logout/route.ts             ← POST: Clear httpOnly cookie
    │   ├── me/route.ts                 ← GET:  Proxy → backend /auth/me + validate cookie
    │   └── refresh/route.ts            ← POST: Proxy → backend /auth/refresh + rotate cookie
    └── backend/
        └── [...path]/route.ts          ← ALL:  Catch-all proxy → backend /* (inject Bearer)
```

### 1.2 Klasifikasi Zona Routing

| Zona | Paths | Autentikasi | Keterangan |
|:---|:---|:---|:---|
| **PUBLIC** | `/login/*`, `/accept-invite/*` | ❌ Tidak diperlukan | Halaman terbuka untuk semua pengunjung |
| **PROTECTED** | `/`, `/kasir`, `/prediksi-stok`, `/penjelasan-ai`, `/inventaris`, `/riwayat-transaksi`, `/laporan`, `/mlops`, `/manajemen-kas`, `/pergerakan-stok`, `/manajemen-pengguna`, `/pengaturan` | ✅ Wajib login + role check | Redirect ke `/login/cashier` jika belum auth |
| **STANDALONE** | `/admin/dashboard` | ⚠️ Tidak terdaftar di RouteGuard | Prototype page, di luar registry `routes.tsx` |
| **SYSTEM** | `/api/auth/*`, `/api/backend/*` | Server-side cookie check | Next.js Route Handlers, bukan halaman visible |
| **ERROR** | `error.tsx`, `not-found.tsx` | N/A (app-level boundary) | Ditangani oleh Next.js runtime |

---

## 2. Role-Based Access Control (RBAC) pada Navigasi

### 2.1 Sumber Kebenaran

RBAC diimplementasikan di **dua layer** yang bekerja bersamaan:

| Layer | File | Mekanisme |
|:---|:---|:---|
| **Registry** | `src/app/routes.tsx` | Array `routes[]` — setiap entry punya `allowedRoles: string[]` |
| **Enforcement** | `src/app/components/RouteGuard.tsx` | `useEffect` hook — matching `pathname` ke `routes[]`, cek `role` dari `AuthContext` |
| **Sidebar Filter** | `src/app/components/Sidebar.tsx` | `routes.filter(r => r.allowedRoles.includes(role))` — menu item yang tidak punya akses tidak ditampilkan |

### 2.2 Matriks Izin Akses per Role

| # | Route | Path | `owner` | `admin` | `inventory_manager` | `cashier` |
|:---:|:---|:---|:---:|:---:|:---:|:---:|
| 1 | Dashboard | `/` | ✅ | ✅ | ✅ | ✅ |
| 2 | Kasir / POS | `/kasir` | ✅ | ✅ | ❌ | ✅ |
| 3 | Prediksi Stok | `/prediksi-stok` | ✅ | ✅ | ✅ | ❌ |
| 4 | Penjelasan AI (XAI) | `/penjelasan-ai` | ✅ | ✅ | ❌ | ❌ |
| 5 | Inventaris | `/inventaris` | ✅ | ✅ | ✅ | ❌ |
| 6 | Riwayat Transaksi | `/riwayat-transaksi` | ✅ | ✅ | ❌ | ❌ |
| 7 | Laporan | `/laporan` | ✅ | ✅ | ✅ | ❌ |
| 8 | MLOps Dashboard | `/mlops` | ❌ | ✅ | ❌ | ❌ |
| 9 | Manajemen Kas | `/manajemen-kas` | ✅ | ✅ | ❌ | ❌ |
| 10 | Pergerakan Stok | `/pergerakan-stok` | ✅ | ✅ | ✅ | ❌ |
| 11 | Manajemen Pengguna | `/manajemen-pengguna` | ❌ | ✅ | ❌ | ❌ |
| 12 | Pengaturan | `/pengaturan` | ✅ | ✅ | ✅ | ✅ |

### 2.3 Ringkasan Hak Akses per Role

| Role | Jumlah Rute | Rute Eksklusif | Profil Akses |
|:---|:---:|:---|:---|
| **admin** | 12 / 12 | `/mlops`, `/manajemen-pengguna` | Full access — satu-satunya role yang bisa akses MLOps dan User Management |
| **owner** | 10 / 12 | — | Hampir full — tidak bisa akses MLOps dan User Management |
| **inventory_manager** | 6 / 12 | — | Fokus supply chain: Dashboard, Prediksi, Inventaris, Laporan, Pergerakan Stok, Pengaturan |
| **cashier** | 3 / 12 | — | Minimal operasional: Dashboard, Kasir/POS, Pengaturan |

### 2.4 Mirror Mode (Impersonation)

Didefinisikan di `Sidebar.tsx` dan `AuthContext.tsx`:

```
actualRole = user.role asli dari backend (immutable)
role       = effectiveRole = viewingAsRole || actualRole
```

- Hanya `admin` dan `owner` yang bisa mengaktifkan Mirror Mode
- Saat aktif, sidebar menampilkan 3 tombol: **Owner**, **Inv.**, **Kasir** + tombol "Exit Mirror"
- Role yang di-switch hanya mempengaruhi **client-side filtering** — backend tetap melihat role asli dari JWT
- Tujuan: testing/demo bagaimana tampilan dan akses menu untuk role lain

---

## 3. Distribusi Layout

### 3.1 Hierarki Provider & Layout

```
html (lang="id")
└── body
    └── <App>                                   ← src/app/App.tsx
        ├── QueryClientProvider                 ← TanStack Query
        │   └── AuthProvider                    ← Session state + role
        │       └── I18nProvider                ← Locale (ID/EN)
        │           └── ThemeProvider           ← Dark/light mode
        │               └── LoadingBar          ← Global fetch indicator
        │                   └── <Layout>        ← src/app/components/Layout.tsx
        │                       └── {children}  ← Page content
```

### 3.2 Layout Decision Tree

`Layout.tsx` melakukan branching berdasarkan `pathname`:

```
pathname.includes("/login") ?
├── YES → LAYOUT_BARE
│         ┌──────────────────────────┐
│         │  RouteGuard              │
│         │  └── {children}          │  ← Full-screen, tanpa sidebar/header
│         │      (min-h-screen)      │
│         └──────────────────────────┘
│
└── NO  → LAYOUT_APP_SHELL
          ┌──────────────────────────────────────────┐
          │  RouteGuard                              │
          │  ┌────────┬─────────────────────────┐    │
          │  │Sidebar │  Header                 │    │
          │  │(240px) │  ┌───────────────────┐  │    │
          │  │ atau   │  │ main              │  │    │
          │  │(68px)  │  │ ┌───────────────┐ │  │    │
          │  │collaps.│  │ │ ErrorBoundary  │ │  │    │
          │  │        │  │ │ └── {children} │ │  │    │
          │  │        │  │ │ max-w-[1920px] │ │  │    │
          │  │        │  │ └───────────────┘ │  │    │
          │  │        │  └───────────────────┘  │    │
          │  └────────┴─────────────────────────┘    │
          └──────────────────────────────────────────┘
```

### 3.3 Matriks Layout per Halaman

| Halaman | Path | Layout yang Dipakai | Sidebar | Header | Catatan |
|:---|:---|:---|:---:|:---:|:---|
| Portal Select | `/login/select` | `LAYOUT_BARE` | ❌ | ❌ | Full-screen card grid |
| Login per Role | `/login/{role}` | `LAYOUT_BARE` | ❌ | ❌ | Full-screen PortalTemplate |
| Forgot Password | `/login/forgot-password` | `LAYOUT_BARE` | ❌ | ❌ | Full-screen wizard |
| Accept Invite | `/accept-invite/{token}` | `LAYOUT_APP_SHELL`* | ✅ | ✅ | ⚠️ Arsitektural mismatch — seharusnya BARE |
| Dashboard | `/` | `LAYOUT_APP_SHELL` | ✅ | ✅ | — |
| Kasir / POS | `/kasir` | `LAYOUT_APP_SHELL`* | ✅ | ✅ | ⚠️ ADR-004 menyatakan POS harus fullscreen — belum diimplementasi |
| Prediksi Stok | `/prediksi-stok` | `LAYOUT_APP_SHELL` | ✅ | ✅ | — |
| Penjelasan AI | `/penjelasan-ai` | `LAYOUT_APP_SHELL` | ✅ | ✅ | — |
| Inventaris | `/inventaris` | `LAYOUT_APP_SHELL` | ✅ | ✅ | — |
| Riwayat Transaksi | `/riwayat-transaksi` | `LAYOUT_APP_SHELL` | ✅ | ✅ | — |
| Laporan | `/laporan` | `LAYOUT_APP_SHELL` | ✅ | ✅ | — |
| MLOps | `/mlops` | `LAYOUT_APP_SHELL` | ✅ | ✅ | — |
| Manajemen Kas | `/manajemen-kas` | `LAYOUT_APP_SHELL` | ✅ | ✅ | — |
| Pergerakan Stok | `/pergerakan-stok` | `LAYOUT_APP_SHELL` | ✅ | ✅ | — |
| Manajemen Pengguna | `/manajemen-pengguna` | `LAYOUT_APP_SHELL` | ✅ | ✅ | — |
| Pengaturan | `/pengaturan` | `LAYOUT_APP_SHELL` | ✅ | ✅ | — |
| Admin Dashboard | `/admin/dashboard` | `LAYOUT_APP_SHELL`* | ✅ | ✅ | ⚠️ Prototype — tidak terdaftar di routes.tsx |
| 404 Not Found | (catch-all) | `LAYOUT_APP_SHELL`* | ✅ | ✅ | Rendered di dalam Layout wrapper |
| Error | (runtime error) | `LAYOUT_APP_SHELL`* | ✅ | ✅ | Error boundary di dalam Layout |

> **⚠️ Catatan arsitektural:**
> - `/accept-invite/{token}` adalah halaman publik (pre-auth) tapi path-nya tidak mengandung `/login`, sehingga mendapat App Shell layout. Ini mismatch — seharusnya menggunakan bare layout.
> - `/kasir` saat ini menggunakan App Shell standar. ADR-004 menyatakan POS harus menggunakan layout fullscreen terpisah tanpa sidebar — ini belum dieksekusi.
> - Route group `(dashboard)` ada di filesystem tapi tidak aktif dipakai — semua halaman protected langsung di root `app/`.

### 3.4 Unused Route Group: `(dashboard)`

```
app/(dashboard)/
├── layout.tsx         → import AppShell dari @/components/layout/app-shell
└── intelligence/xai/  → kosong
```

Folder ini tidak memiliki `page.tsx` anak dan `AppShell` yang di-import (`@/components/layout/app-shell`) **tidak ditemukan** di codebase. Ini adalah artefak arsitektur lama yang belum dibersihkan. Semua halaman protected menggunakan `Layout.tsx` di `src/app/components/` yang dibungkus langsung di root `layout.tsx`.

---

## 4. Proteksi Rute (Route Guards)

### 4.1 Arsitektur Keamanan Berlapis

```
┌───────────────────────────────────────────────────────────────┐
│ LAYER 1: Cookie httpOnly (Transport Security)                 │
│ File: src/app/lib/auth-cookie.ts                              │
│                                                               │
│ • Token JWT disimpan di cookie `ss_access_token`              │
│ • httpOnly=true → tidak bisa dibaca JavaScript browser        │
│ • secure=true di production (HTTPS only)                      │
│ • sameSite="lax" → mencegah CSRF cross-origin                 │
│ • maxAge=7 hari (match backend ACCESS_TOKEN_EXPIRE_MINUTES)   │
└───────────────┬───────────────────────────────────────────────┘
                │
┌───────────────▼───────────────────────────────────────────────┐
│ LAYER 2: Next.js API Proxy (Server-Side Token Injection)      │
│ File: app/api/backend/[...path]/route.ts                      │
│                                                               │
│ • Setiap request data dari FE → `/api/backend/*`              │
│ • Proxy baca cookie → inject `Authorization: Bearer {token}`  │
│ • Jika tidak ada cookie → langsung return 401                 │
│ • Auth endpoints (/auth/*) DIBLOK dari proxy generik          │
│   → wajib via `/api/auth/*` dedicated route handlers          │
└───────────────┬───────────────────────────────────────────────┘
                │
┌───────────────▼───────────────────────────────────────────────┐
│ LAYER 3: AuthContext + Session Hydration (Client-Side)         │
│ File: src/app/context/AuthContext.tsx                          │
│                                                               │
│ • On mount: useQuery(["auth","me"]) → GET /api/auth/me        │
│ • Jika 401 → user=null, isLoading=false (state: not-auth)     │
│ • Jika OK → user object + role di-set ke context              │
│ • Listen event `auth:unauthorized` dari api client             │
│   → auto clear cache + redirect `/login/select`               │
└───────────────┬───────────────────────────────────────────────┘
                │
┌───────────────▼───────────────────────────────────────────────┐
│ LAYER 4: RouteGuard (Client-Side Navigation Enforcement)      │
│ File: src/app/components/RouteGuard.tsx                        │
│                                                               │
│ ┌─ Rule 1: Auth Check ────────────────────────────────────┐   │
│ │ IF !user AND pathname NOT includes "/login"             │   │
│ │ THEN router.push("/login/cashier")                      │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌─ Rule 2: Login Redirect ────────────────────────────────┐   │
│ │ IF user AND pathname includes "/login"                  │   │
│ │ THEN router.push("/")                                   │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌─ Rule 3: RBAC Check ───────────────────────────────────┐   │
│ │ IF user exists:                                         │   │
│ │   FIND route WHERE path === pathname OR                 │   │
│ │                     pathname.startsWith(path + "/")     │   │
│ │   IF route found AND role NOT IN allowedRoles           │   │
│ │   THEN toast.error("Access Denied") +                   │   │
│ │        router.push("/")                                 │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌─ Loading State ─────────────────────────────────────────┐   │
│ │ IF isLoading (hydrating session):                       │   │
│ │   RENDER full-screen spinner "Authenticating..."        │   │
│ │   (Blocks all page content until session resolved)      │   │
│ └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

### 4.2 Sequence Diagram — Akses Tanpa Izin

```
User (cashier)                RouteGuard              AuthContext           Browser
     │                             │                       │                   │
     ├── navigate /mlops ─────────►│                       │                   │
     │                             ├── check isLoading ───►│                   │
     │                             │◄── false ─────────────┤                   │
     │                             ├── check user ────────►│                   │
     │                             │◄── { role: "cashier" }┤                   │
     │                             │                       │                   │
     │                             ├── FIND route matching │                   │
     │                             │   "/mlops" →          │                   │
     │                             │   allowedRoles=["admin"]                  │
     │                             │                       │                   │
     │                             ├── "cashier" NOT IN    │                   │
     │                             │   ["admin"]           │                   │
     │                             │                       │                   │
     │                             ├── toast.error ────────────────────────────►│
     │                             │   "Access Denied:     │                   │
     │                             │    Your current portal│                   │
     │                             │    (cashier) does not │                   │
     │                             │    have permission"   │                   │
     │                             │                       │                   │
     │                             ├── router.push("/") ───────────────────────►│
     │◄───────────────── Dashboard rendered ───────────────────────────────────┤
```

### 4.3 Sequence Diagram — Sesi Kadaluarsa

```
User                    api client              AuthContext              Browser
  │                          │                       │                      │
  ├── fetch data ───────────►│                       │                      │
  │                          ├── GET /api/backend/*  │                      │
  │                          │   (cookie attached)   │                      │
  │                          │◄── 401 Unauthorized   │                      │
  │                          │                       │                      │
  │                          ├── EMIT window event   │                      │
  │                          │   "auth:unauthorized" ────────────────────────►│
  │                          │                       │                      │
  │                          │                       ├── event listener     │
  │                          │                       │   fires              │
  │                          │                       │                      │
  │                          │                       ├── queryClient.clear()│
  │                          │                       ├── setViewingAsRole(null)
  │                          │                       │                      │
  │                          │                       ├── toast.error        │
  │                          │                       │   "Sesi berakhir —   │
  │                          │                       │    Silakan login     │
  │                          │                       │    ulang"            │
  │                          │                       │                      │
  │                          │                       ├── router.push ───────►│
  │                          │                       │   "/login/select"    │
  │◄───────────── Login select page rendered ──────────────────────────────┤
```

### 4.4 Matriks Skenario Proteksi

| Skenario | Kondisi | Aksi Sistem | Redirect Target |
|:---|:---|:---|:---|
| **Tidak login, akses protected** | `user=null`, path ≠ `/login/*` | Redirect otomatis | `/login/cashier` |
| **Sudah login, akses login** | `user≠null`, path = `/login/*` | Redirect otomatis | `/` (Dashboard) |
| **Login, role insufficient** | `user≠null`, role ∉ `allowedRoles` | Toast error + redirect | `/` (Dashboard) |
| **Cookie expired, data fetch** | 401 dari `/api/backend/*` | Event `auth:unauthorized` → auto-logout | `/login/select` |
| **Cookie expired, session hydrate** | 401 dari `/api/auth/me` | `user=null` → RouteGuard Rule 1 kicks in | `/login/cashier` |
| **Path tidak dikenal** | Path tidak match route manapun | Next.js `not-found.tsx` rendered | Tombol "Kembali ke Dashboard" |
| **Runtime error** | Exception di page component | Next.js `error.tsx` rendered | Tombol "Coba Lagi" / "Dashboard" |
| **Invalid invite token** | Token di URL tidak valid | Mock handling saat ini (no backend check) | — |

### 4.5 Kelemahan Proteksi Saat Ini

| # | Issue | Dampak | Rekomendasi |
|:---:|:---|:---|:---|
| 1 | **Tidak ada Next.js Middleware** (`middleware.ts` tidak ada) | Proteksi rute hanya client-side — halaman HTML protected tetap di-serve oleh server sebelum RouteGuard berjalan di browser | Tambahkan `middleware.ts` yang cek cookie `ss_access_token` existence sebelum serve halaman protected |
| 2 | **`/accept-invite/{token}` tidak dikecualikan dari RouteGuard** | Halaman publik ini terjebak di App Shell dan akan di-redirect ke login jika user belum auth | Tambahkan path exception di RouteGuard atau pindahkan ke zona `/login/*` |
| 3 | **`/admin/dashboard` tidak terdaftar di `routes.tsx`** | Tidak ada RBAC enforcement — bisa diakses oleh role manapun yang sudah login | Daftarkan di `routes.tsx` dengan `allowedRoles: ["admin"]` atau hapus |
| 4 | **Route matching hanya prefix-based** | Path seperti `/kasir-baru` (jika ada) bisa salah match ke `/kasir` | Gunakan exact match atau segment-based matching |
| 5 | **RBAC hanya client-side** | Backend sudah punya role guard tersendiri, tapi FE enforcement bisa di-bypass via dev tools | Pastikan setiap backend endpoint juga enforce role (sudah ada — ini defense-in-depth) |

---

## 5. API Route Architecture (Server-Side Proxy)

### 5.1 Peta API Routes

```
/api/
├── auth/                         ← DEDICATED auth handlers (manage cookies)
│   ├── POST   login              ← JSON→form-urlencoded proxy + set cookie
│   ├── POST   logout             ← Clear cookie only (JWT stateless)
│   ├── GET    me                 ← Proxy /auth/me + validate cookie
│   └── POST   refresh            ← Proxy /auth/refresh + rotate cookie
│
└── backend/                      ← GENERIC catch-all proxy
    └── GET|POST|PUT|PATCH|DELETE  [...path]
                                  ← Inject Bearer dari cookie → forward ke FastAPI
                                  ← BLOCKED: auth/* paths (wajib via /api/auth/*)
```

### 5.2 Alur Proxy Data

```
Browser (Client Component)
    │
    ├── fetch("/api/backend/inventory/products?updated_since=...")
    │         │
    │         ▼
    │   Next.js Route Handler (app/api/backend/[...path]/route.ts)
    │         │
    │         ├── Read cookie `ss_access_token`
    │         ├── If no cookie → 401 "Not authenticated"
    │         ├── If path in BLOCKED_PATHS → 400 "Use /api/auth/*"
    │         │
    │         ├── Build: GET {BACKEND_URL}/inventory/products?updated_since=...
    │         │         Authorization: Bearer {token}
    │         │
    │         ▼
    │   FastAPI Backend (127.0.0.1:8000)
    │         │
    │         ├── Validate JWT
    │         ├── Check role permission
    │         ├── Execute query
    │         │
    │         ▼
    │   Stream response back through proxy
    │
    ▼
Browser receives JSON/File
```

---

## 6. Ringkasan Navigasi Sidebar

Sidebar di-render berdasarkan `routes.tsx` yang di-filter oleh `role` aktif (termasuk Mirror Mode).

### 6.1 Tampilan Sidebar per Role

**Owner (10 item):**
```
📊 Dashboard          /
🛒 Kasir / POS        /kasir
🧠 Prediksi Stok      /prediksi-stok
💡 Penjelasan AI       /penjelasan-ai
📦 Inventaris          /inventaris
🧾 Riwayat Transaksi   /riwayat-transaksi
📈 Laporan             /laporan
💰 Manajemen Kas       /manajemen-kas
↔️ Pergerakan Stok     /pergerakan-stok
⚙️ Pengaturan          /pengaturan
```

**Admin (12 item — full):**
```
📊 Dashboard          /
🛒 Kasir / POS        /kasir
🧠 Prediksi Stok      /prediksi-stok
💡 Penjelasan AI       /penjelasan-ai
📦 Inventaris          /inventaris
🧾 Riwayat Transaksi   /riwayat-transaksi
📈 Laporan             /laporan
🧪 MLOps              /mlops              ← admin-only
💰 Manajemen Kas       /manajemen-kas
↔️ Pergerakan Stok     /pergerakan-stok
👥 Manajemen Pengguna  /manajemen-pengguna ← admin-only
⚙️ Pengaturan          /pengaturan
```

**Inventory Manager (6 item):**
```
📊 Dashboard          /
🧠 Prediksi Stok      /prediksi-stok
📦 Inventaris          /inventaris
📈 Laporan             /laporan
↔️ Pergerakan Stok     /pergerakan-stok
⚙️ Pengaturan          /pengaturan
```

**Cashier (3 item):**
```
📊 Dashboard          /
🛒 Kasir / POS        /kasir
⚙️ Pengaturan          /pengaturan
```

### 6.2 Active State Detection

```typescript
// Dari Sidebar.tsx — logika penentuan menu aktif:
const isActive = item.path === "/"
  ? pathname === "/"                     // Root: exact match only
  : pathname.startsWith(item.path);      // Others: prefix match
```

Ini memastikan `/inventaris/detail/123` (jika ada) akan tetap meng-highlight menu "Inventaris".

---

## 7. Temuan & Gap Arsitektural

| # | Temuan | Severity | Status |
|:---:|:---|:---:|:---|
| 1 | `middleware.ts` tidak ada — proteksi rute 100% client-side | 🔴 High | Gap |
| 2 | ADR-004 (POS fullscreen layout) belum dieksekusi — `/kasir` masih di App Shell | 🟡 Medium | Gap |
| 3 | `/accept-invite/{token}` terjebak di App Shell padahal halaman publik | 🟡 Medium | Gap |
| 4 | `/admin/dashboard` di luar registry routes.tsx — tanpa RBAC | 🟡 Medium | Gap |
| 5 | Route group `(dashboard)` ada tapi tidak dipakai — dead code | 🟢 Low | Cleanup |
| 6 | `page_old.tsx` ada di `app/` — file unused | 🟢 Low | Cleanup |
| 7 | Login default redirect ke `/login/cashier` (bukan `/login/select`) | 🟢 Low | Design choice |
| 8 | 2FA verify endpoint belum ada di `/api/auth/` routes | 🟡 Medium | Pending Phase 4 |
