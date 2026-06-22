# Fase 5: Frontend Development Plan

**Status Backend**: ✅ 100% Tested (47/47 endpoints + offline sync verified)
**Scope**: Dual-app (POS PWA + Admin Dashboard) paralel
**Estimated Duration**: 5-6 minggu

---

## 1. Arsitektur Keputusan

### Pilihan: **Single Next.js 14 App dengan Route Groups**

```
frontend/
├── app/
│   ├── (auth)/              # Shared login page untuk POS & Admin
│   ├── (cashier)/           # POS PWA — offline-first
│   │   ├── pos/             # Halaman kasir utama
│   │   ├── cash-session/    # Buka/tutup kasir
│   │   └── layout.tsx       # Manifest PWA + service worker
│   └── (admin)/             # Admin Dashboard — online-only
│       ├── dashboard/
│       ├── inventory/
│       ├── reports/
│       └── users/
```

**Alasan pilih single app (bukan monorepo):**
- Setup lebih cepat untuk MVP
- Shared components (`<Button>`, `<Input>`) dari shadcn/ui
- Shared API client + types
- Bisa dipecah jadi monorepo nanti kalau sudah stable
- Route groups di Next.js 14 sudah cukup untuk separation of concerns

---

## 2. Technology Stack

| Layer | Choice | Versi | Alasan |
|-------|--------|-------|--------|
| **Framework** | Next.js | 14.2+ (App Router) | Server Components, streaming, PWA support |
| **Language** | TypeScript | 5.4+ | Type safety, autocomplete |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first, cepat |
| **UI Components** | shadcn/ui | latest | Copy-paste components, full control |
| **Icons** | Lucide React | latest | Consistent icon set |
| **State (client)** | Zustand | 4.5+ | Ringan, tanpa boilerplate |
| **State (server)** | TanStack Query | 5+ | Auto-caching, refetch, optimistic |
| **IndexedDB** | Dexie.js | 4+ | Wrapper IDB paling mature |
| **PWA** | next-pwa | 5.6+ | Workbox terintegrasi, auto service worker |
| **Form** | React Hook Form + Zod | latest | Type-safe validation |
| **HTTP** | ofetch | 1.3+ | Modern fetch wrapper (better than axios for SW) |
| **Date** | date-fns | 3+ | Tree-shakeable, smaller than moment |

---

## 3. File Structure Detail

```
frontend/
├── app/
│   ├── layout.tsx                    # Root layout + providers
│   ├── globals.css                   # Tailwind + custom
│   ├── manifest.ts                   # PWA manifest
│   │
│   ├── (auth)/
│   │   ├── layout.tsx                # Minimal layout (no nav)
│   │   └── login/
│   │       └── page.tsx              # Login form
│   │
│   ├── (cashier)/
│   │   ├── layout.tsx                # Sidebar + offline indicator
│   │   ├── pos/
│   │   │   ├── page.tsx              # Main POS (katalog + cart)
│   │   │   └── components/
│   │   │       ├── ProductGrid.tsx
│   │   │       ├── Cart.tsx
│   │   │       ├── CheckoutModal.tsx
│   │   │       └── OfflineBadge.tsx
│   │   ├── cash-session/
│   │   │   ├── open/page.tsx         # Buka kasir
│   │   │   └── close/page.tsx        # Tutup kasir
│   │   └── transactions/
│   │       └── page.tsx              # History transaksi hari ini
│   │
│   └── (admin)/
│       ├── layout.tsx                # Full sidebar + header
│       ├── dashboard/
│       │   └── page.tsx              # KPI cards + charts
│       ├── inventory/
│       │   ├── page.tsx              # Product list
│       │   ├── [id]/page.tsx         # Product detail
│       │   ├── new/page.tsx          # Create product
│       │   └── stock/page.tsx        # Stock management
│       ├── reports/
│       │   ├── page.tsx              # Report templates
│       │   └── history/page.tsx      # Export history
│       ├── users/
│       │   ├── page.tsx              # User list + invites
│       │   └── new/page.tsx          # Invite user
│       ├── finance/
│       │   └── sessions/page.tsx     # Cash sessions overview
│       └── analytics/
│           └── page.tsx              # AI predictions + metrics
│
├── components/
│   ├── ui/                           # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── shared/
│   │   ├── AuthGuard.tsx
│   │   ├── RoleGuard.tsx
│   │   └── LoadingSpinner.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       └── TopBar.tsx
│
├── lib/
│   ├── api/
│   │   ├── client.ts                 # ofetch instance + auth header
│   │   ├── auth.ts                   # Login, refresh, logout
│   │   ├── products.ts               # CRUD products
│   │   ├── transactions.ts           # POS transactions + batch sync
│   │   ├── finance.ts                # Cash sessions
│   │   └── ...
│   ├── db/
│   │   ├── dexie.ts                  # IndexedDB schema
│   │   ├── sync-manager.ts           # Orchestrate offline sync
│   │   └── queue.ts                  # Transaction queue CRUD
│   ├── auth/
│   │   ├── session.ts                # Token storage + refresh
│   │   └── jwt.ts                    # Decode/verify client-side
│   ├── hooks/
│   │   ├── useOnline.ts              # Online/offline detector
│   │   ├── useAuth.ts                # Auth context
│   │   ├── useSync.ts                # Sync status hook
│   │   └── useCart.ts                # Cart state (Zustand)
│   ├── stores/
│   │   ├── auth-store.ts             # Zustand auth
│   │   ├── cart-store.ts             # Zustand cart
│   │   └── sync-store.ts             # Zustand sync status
│   └── utils/
│       ├── currency.ts
│       ├── date.ts
│       └── uuid.ts
│
├── types/
│   ├── api.ts                        # Response types
│   ├── product.ts
│   ├── transaction.ts
│   └── user.ts
│
├── public/
│   ├── icons/                        # PWA icons (72, 96, 128, 144, 152, 192, 384, 512)
│   └── service-worker.js             # Generated by next-pwa
│
├── next.config.js                    # PWA config + env
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local                        # NEXT_PUBLIC_API_URL
```

---

## 4. Offline Mode Architecture (POS)

### 4.1 IndexedDB Schema (Dexie)

```typescript
// lib/db/dexie.ts
import Dexie, { Table } from 'dexie';

interface CachedProduct {
  id: string;                         // UUID dari server
  sku: string;
  name: string;
  family: string;
  category: string;
  base_price: number;
  is_active: boolean;
  updated_at: string;                 // Untuk incremental sync
}

interface QueuedTransaction {
  client_txn_id: string;              // UUID v4 dari browser
  branch_id: string;
  date: string;
  time: string;
  payment_method: string;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price_at_time: number;
  }>;
  total_amount: number;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retry_count: number;
  last_error?: string;
  created_at: number;                 // Timestamp lokal
  synced_at?: number;
  server_id?: string;                 // ID dari server setelah sync
}

interface SyncMeta {
  key: string;                        // 'products_last_sync', 'auth_token_exp'
  value: string;
  updated_at: number;
}

class InsightDB extends Dexie {
  products!: Table<CachedProduct>;
  txnQueue!: Table<QueuedTransaction>;
  meta!: Table<SyncMeta>;

  constructor() {
    super('InsightSphereDB');
    this.version(1).stores({
      products: 'id, sku, family, category, updated_at',
      txnQueue: 'client_txn_id, status, created_at',
      meta: 'key',
    });
  }
}

export const db = new InsightDB();
```

### 4.2 Sync Manager State Machine

```
┌─────────────┐   transaction created    ┌──────────┐
│   ONLINE    │─────────────────────────→│ OPTIMIST │
│             │   POST /transactions/    │  UI OK   │
│             │←─────────────────────────│          │
└─────────────┘   201 + server_id        └──────────┘
       │
       │ network lost
       ▼
┌─────────────┐   transaction created    ┌──────────┐
│   OFFLINE   │─────────────────────────→│ QUEUED   │
│             │   save to IndexedDB      │ PENDING  │
└─────────────┘                          └──────────┘
       │
       │ online restored
       ▼
┌─────────────┐   POST /transactions/    ┌──────────┐
│  SYNCING    │─────────batch───────────→│  BATCH   │
│             │←─── 207 Multi-Status ────│ RESPONSE │
└─────────────┘                          └──────────┘
       │
       ├─ status=success → update queue: SYNCED, server_id
       ├─ status=duplicate → update queue: SYNCED (already on server)
       └─ status=failed → update queue: FAILED, last_error, retry_count++
                         → exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, max 5 min
```

### 4.3 Service Worker Strategy

```typescript
// next.config.js → next-pwa config
{
  runtimeCaching: [
    // Static assets — Cache First
    {
      urlPattern: /\.(js|css|png|svg|woff2)$/,
      handler: 'CacheFirst',
      options: { cacheName: 'static-assets' },
    },
    // API: katalog produk — Stale While Revalidate
    {
      urlPattern: /\/api\/inventory\/products/,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'products-cache' },
    },
    // API: auth/me — Network First
    {
      urlPattern: /\/auth\//,
      handler: 'NetworkFirst',
      options: { cacheName: 'auth-cache', networkTimeoutSeconds: 5 },
    },
    // API: POST transactions — Background Sync queue
    {
      urlPattern: /\/transactions\//,
      handler: 'NetworkOnly',
      method: 'POST',
      options: {
        backgroundSync: {
          name: 'txn-sync-queue',
          options: { maxRetentionTime: 24 * 60 },  // 24 jam
        },
      },
    },
  ],
}
```

---

## 5. Weekly Roadmap

### **Week 1: Foundation & Auth** (High priority)

**Goal**: Setup project, login page, auth flow working.

- [x] `pnpm create next-app frontend --typescript --tailwind --app`
- [x] Install deps: shadcn/ui, zustand, @tanstack/react-query, dexie, next-pwa
- [x] Setup TailwindCSS + shadcn/ui init
- [x] Create API client (`lib/api/client.ts`) dengan auth interceptor (Phase 0.3)
- [x] Build `/login` pages + integrate `/auth/login` (Phase 0.3)
- [x] Auth store (Context + TanStack Query) + Cookie persistence (httpOnly)
- [x] Auth guard HOC + role-based routing (Phase 0.4: `karyawan` renamed to `cashier`)
- [ ] Token auto-refresh middleware (pakai `/auth/refresh` 1 jam sebelum expire)

**Deliverable**: User bisa login dengan role-based redirect ke `/pos` atau `/dashboard`. Role standar: `admin`, `owner`, `cashier`.

---

### **Week 2: POS Cashier (Online-first)** (High priority)

**Goal**: Kasir bisa buat transaksi saat online. Offline mode belum.

- [ ] Layout cashier dengan sidebar sederhana
- [ ] Halaman `/pos` dengan product grid (fetch `/inventory/products`)
- [ ] Cart component (Zustand state)
- [ ] Search + filter by family/category
- [ ] Checkout modal dengan payment method selector
- [ ] Integrate POST `/transactions/` (optimistic UI)
- [ ] History transaksi hari ini (`/transactions/summary/today`)
- [ ] Cash session buka/tutup UI

**Deliverable**: Kasir bisa transact end-to-end di kondisi online.

---

### **Week 3: Admin Dashboard** (Medium priority)

**Goal**: Dashboard analytics + CRUD inventory + laporan.

- [ ] Layout admin dengan sidebar lengkap
- [ ] Dashboard: KPI cards (penjualan hari ini, produk terlaris, stock critical)
- [ ] Integrate charts (Recharts atau Tremor)
- [ ] Inventory page: table + filter + pagination
- [ ] Product CRUD forms (create, edit, delete)
- [ ] Stock management (list + movement history)
- [ ] Reports: template list + export trigger
- [ ] Users page: invite + list + delete
- [ ] AI predictions page (`/api/analytics/predictions`)

**Deliverable**: Admin punya full control panel yang functional.

---

### **Week 4: PWA + Offline Mode** (CRITICAL)

**Goal**: POS jadi installable PWA dengan offline sync.

- [ ] Install & config `next-pwa` di `next.config.js`
- [ ] Buat `manifest.ts` + icons (8 ukuran)
- [ ] Setup Dexie.js schema (products, txnQueue, meta)
- [ ] Hook `useOnline()` dengan `navigator.onLine` + ping fallback
- [ ] Sync product catalog on login (pakai `updated_since` untuk incremental)
- [ ] Modify POS checkout:
  - Online → POST langsung, update UI
  - Offline → save ke Dexie `txnQueue`, generate `client_txn_id` (UUID v4)
- [ ] Sync Manager:
  - Detect online → trigger batch sync
  - POST `/transactions/batch` dengan semua PENDING transactions
  - Handle 207 response per-item
  - Update queue status
- [ ] UI indicators:
  - Banner merah "Mode Offline" di top
  - Badge di icon sync "3 pending"
  - Success toast saat sync complete
- [ ] Background sync dengan Workbox (fallback polling tiap 30 detik)
- [ ] Install prompt ("Install aplikasi untuk akses lebih cepat")

**Deliverable**: POS install-able, bisa kerja offline >24 jam, auto-sync saat online kembali.

---

### **Week 5: Polish & Testing** (Medium priority)

**Goal**: Smooth UX + edge case handling.

- [ ] Conflict resolution UI:
  - Kalau server tolak transaksi (produk dihapus, dll), tampilkan modal
  - User bisa edit/hapus transaksi yang failed
- [ ] Manual sync trigger button
- [ ] Error boundaries + fallback UI
- [ ] Loading skeletons di semua data-heavy pages
- [ ] Empty states (belum ada produk, transaksi, dll)
- [ ] Keyboard shortcuts di POS (hotkey F2 = checkout, dll)
- [ ] Touch-optimized UI untuk tablet
- [ ] Dark mode (opsional)
- [ ] Notification UI (realtime via WebSocket)

**Deliverable**: Production-ready UX.

---

### **Week 6: Testing & Deployment** (High priority)

**Goal**: Deployed + tested di realistic scenarios.

- [ ] Playwright E2E test:
  - Login flow
  - POS transaction flow
  - Offline → online sync
- [ ] Chrome DevTools offline simulation test
- [ ] Performance audit (Lighthouse >90 for PWA)
- [ ] Test di real device (mobile phone + tablet)
- [ ] Setup deployment:
  - Backend: existing setup
  - Frontend: Vercel (atau Netlify)
- [ ] Environment variables production
- [ ] Monitoring: Sentry untuk error tracking
- [ ] Documentation: README + user guide

**Deliverable**: Live production URL, ready untuk user testing.

---

## 6. Risk Analysis & Mitigation

| Risk | Probabilitas | Impact | Mitigation |
|------|--------------|--------|------------|
| **iOS Safari tidak support Background Sync** | Tinggi | Tinggi | Fallback ke polling setiap 30 detik saat online |
| **IndexedDB quota exceeded** | Sedang | Tinggi | Request persistent storage, cleanup transaksi lama >30 hari |
| **Service worker update breaks cache** | Sedang | Sedang | Versioning cache names, skip waiting + client reload |
| **Token expire saat sync batch besar** | Rendah | Tinggi | Refresh token sebelum sync + retry dengan token baru |
| **Product di-delete saat transaksi di-queue offline** | Rendah | Sedang | Server return 400 per-item, UI tampilkan conflict modal |
| **Jam device kasir salah** | Tinggi | Sedang | Server otoritatif untuk `created_at`. `date/time` client hanya referensi |

---

## 7. Integration Points dengan Backend

| Feature Frontend | Endpoint Backend | Notes |
|------------------|------------------|-------|
| Login | POST `/auth/login` | Form-urlencoded! |
| Token refresh | POST `/auth/refresh` | Call 1 jam sebelum expire |
| Current user | GET `/auth/me` | Cache di Dexie |
| Product catalog | GET `/inventory/products?updated_since=X` | Incremental sync |
| Create transaction (online) | POST `/transactions/` | Include `client_txn_id` |
| Sync offline queue | POST `/transactions/batch` | Bulk, handle 207 |
| Dashboard KPI | GET `/transactions/summary/today` | Plus stock summary |
| Stock list | GET `/inventory/stock?store_nbr=X` | Per-branch |
| Reports export | POST `/reporting/export` | Streaming download |
| Notifications (realtime) | WS `/ws/notifications?token=X` | Reconnect on online |

---

## 8. Acceptance Criteria

Fase 5 selesai kalau:

1. ✅ User bisa login sebagai admin DAN cashier dengan role-based redirect
2. ✅ Cashier bisa buat transaksi POS online, data masuk ke database
3. ✅ Cashier bisa buat transaksi **tanpa internet**, data tersimpan di IndexedDB
4. ✅ Saat online kembali, transaksi offline auto-sync dalam <30 detik
5. ✅ **Retry sync tidak bikin duplikat** (idempotency via client_txn_id)
6. ✅ Admin bisa CRUD produk + lihat dashboard
7. ✅ PWA bisa di-install di mobile/desktop
8. ✅ Lighthouse PWA score >90
9. ✅ Zero console errors di production build
10. ✅ Playwright E2E tests pass

---

## 9. Quick Start Command Preview

Begitu disetujui, saya akan jalankan:

```bash
# 1. Bootstrap project
cd c:\Portfolio\InsightSphere
pnpm create next-app@latest frontend --typescript --tailwind --app --src-dir=false --import-alias="@/*"

# 2. Install dependencies
cd frontend
pnpm add zustand @tanstack/react-query dexie next-pwa ofetch lucide-react date-fns
pnpm add react-hook-form @hookform/resolvers zod
pnpm add -D @types/node

# 3. Init shadcn/ui
pnpm dlx shadcn@latest init -d

# 4. Add components
pnpm dlx shadcn@latest add button input form card dialog toast table badge

# 5. Start dev server
pnpm dev
```

---

## 10. Next Decision Needed

Sebelum coding dimulai, saya butuh konfirmasi:
1. **Package manager**: `pnpm` (recommended, faster) / `npm` / `yarn`?
2. **Deploy target**: Vercel (recommended) / Netlify / self-hosted?
3. **Multi-language**: Support Bahasa Indonesia + English sekarang, atau Indonesia saja dulu?
4. **Dark mode**: Include dari awal atau skip untuk MVP?
