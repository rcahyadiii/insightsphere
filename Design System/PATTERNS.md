# 🧩 InsightSphere Page Patterns & Templates

> **Single source of truth untuk reusable page-level patterns.**
> Versi: 1.0 — 23 April 2026
> Companion specs: `CARDS.md`, `MODALS.md`, `TABLES.md`, `FORMS.md`, `BREADCRUMBS.md`, `NAVIGATION.md`

---

## 1. Overview

Components adalah **lego bricks**. Patterns adalah **blueprints** untuk merangkai bricks jadi page utuh.

InsightSphere mendefinisikan **9 core page patterns**:

| # | Pattern | Used For | Example Page |
|---|---|---|---|
| 1 | **Dashboard** | Overview, KPI + charts | `DashboardPage`, `LaporanPage` |
| 2 | **List / Index** | Data table with filters | `InventarisPage`, `TransactionHistoryPage` |
| 3 | **Master-Detail** | List + side panel detail | `UserManagementPage`, `StockMovementPage` drawer |
| 4 | **Form / Settings** | Multi-field form, settings | `PengaturanPage`, `UserProfilePage` |
| 5 | **Wizard / Multi-Step** | Guided multi-stage flow | POS Checkout, Onboarding, StockUpdate modal |
| 6 | **Workspace** | Dual-pane or canvas | `KasirPage` (products + cart) |
| 7 | **Error Pages** | 404/500/403/maintenance | `not-found.tsx`, boundary fallback |
| 8 | **Empty Project / First-Run** | Zero-data onboarding | New store, no transactions yet |
| 9 | **Auth** | Login/Signup/Reset/2FA | `LoginPage`, forgot password |

Setiap pattern punya: **anatomy**, **rules**, **example code**, **common mistakes**.

---

## 2. Shared Anatomy (Semua Pattern)

Setiap page di dalam `(admin)` route group **wajib** mengikuti struktur:

```tsx
<PortalTemplate>
  <main id="main-content" className="flex-1 overflow-y-auto">
    {/* 1. Page Header — breadcrumb + title + primary action */}
    <header className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
      <Breadcrumbs items={[...]} />
      <div className="flex items-center justify-between mt-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Judul Halaman</h1>
          <p className="text-sm text-slate-500 mt-1">Deskripsi singkat tujuan halaman.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Primary actions */}
        </div>
      </div>
    </header>

    {/* 2. Content — pattern-specific */}
    <div className="px-6 py-6 space-y-6">
      {/* Pattern content */}
    </div>
  </main>
</PortalTemplate>
```

**Rules:**
- `<main id="main-content">` — skip link target (A11y §4.7).
- `<h1>` only 1 per page — level-1 heading.
- Page header sticky di top (optional, depending pattern).
- Content area: `px-6 py-6 space-y-6` default stack.

---

## 3. Pattern 1 — Dashboard

### 3.1 Purpose
Overview page dengan **glanceable data** (KPI) + **trends** (charts) + **recent activity** (tables).

### 3.2 Anatomy

```
┌─────────────────────────────────────────────────┐
│ PageHeader (breadcrumb, title, period filter)    │
├─────────────────────────────────────────────────┤
│ KPI Row (4 cards — grid-cols-2 md:grid-cols-4)   │
├─────────────────────────────────────────────────┤
│ Primary Chart (2/3 width) │ Secondary (1/3)     │
├─────────────────────────────────────────────────┤
│ Activity Table (full-width, top 10)              │
└─────────────────────────────────────────────────┘
```

### 3.3 Rules
- **4 KPI max** di row utama (lebih = visual overload). Pakai `grid-cols-2 md:grid-cols-4` responsive.
- **1 hero chart** (paling penting) ambil 2/3 width di desktop, full di mobile.
- **Secondary chart** (ringkasan) di 1/3 width — kalau tidak ada, jangan paksa.
- **Activity/recent table** di bawah — max 10 rows, "Lihat Semua" link ke List page.
- Period filter (Hari Ini / Minggu / Bulan) **wajib** di header kanan — lihat `BUTTONS.md §5.15` segmented control.
- Data kosong: pakai EmptyState di tiap cell (tidak spinner di seluruh page).

### 3.4 Example Structure
```tsx
<div className="space-y-6">
  {/* KPI Row */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <KPICard title="Pendapatan" value={revenue} trend={+12.5} />
    <KPICard title="Transaksi" value={txnCount} trend={+8.2} />
    <KPICard title="Margin" value="34.2%" trend={+2.1} />
    <KPICard title="Produk Aktif" value={productCount} trend={0} />
  </div>

  {/* Charts Row */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <div className="lg:col-span-2">
      <Card><ForecastChart data={...} /></Card>
    </div>
    <div>
      <Card><CategoryPieChart data={...} /></Card>
    </div>
  </div>

  {/* Activity Table */}
  <Card>
    <CardHeader>
      <CardTitle>Transaksi Terakhir</CardTitle>
      <Link href="/transaksi">Lihat Semua →</Link>
    </CardHeader>
    <Table>...</Table>
  </Card>
</div>
```

### 3.5 Anti-Patterns
- ❌ Lebih dari 6 KPI di row utama (overwhelming).
- ❌ KPI mixed dengan chart dalam 1 row.
- ❌ Activity table >20 rows tanpa pagination (should be separate List page).
- ❌ Chart tanpa period context ("Penjualan" tanpa "7 Hari Terakhir").

---

## 4. Pattern 2 — List / Index

### 4.1 Purpose
Browse, search, filter, sort **collection of records**. Entry point untuk CRUD.

### 4.2 Anatomy

```
┌─────────────────────────────────────────────────┐
│ PageHeader (title + "Tambah Baru" primary CTA)   │
├─────────────────────────────────────────────────┤
│ Filter Bar (search + filter chips + sort)        │
├─────────────────────────────────────────────────┤
│ Table (hoverable rows, sortable headers)         │
│ Empty State (if no results)                      │
├─────────────────────────────────────────────────┤
│ Pagination (bottom)                              │
└─────────────────────────────────────────────────┘
```

### 4.3 Rules
- **Primary CTA "Tambah [Entity]"** di header kanan (`btn("primary", "md")`).
- **Filter bar** sticky di atas table (optional — untuk long tables).
- **Search input** (debounced 300ms) paling kiri.
- **Filter chips** (active filter indicators) dengan clear button.
- **Sort** via clickable `<th>` (see TABLES §8.2).
- **Pagination** bottom — 10/25/50/100 per page options.
- **Empty state dibedakan:**
  - No data pernah (first-run): show onboarding hint
  - No filter results: "Tidak ada hasil untuk '{query}'. Reset filter."
- **Row action**: max 3 per row (edit/delete/more menu). Lihat BUTTONS §4.5.

### 4.4 Example Structure
```tsx
<div className="space-y-4">
  {/* Filter Bar */}
  <div className="flex items-center gap-2 flex-wrap">
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
      <input
        type="search"
        placeholder="Cari produk..."
        className={INPUT.base}
      />
    </div>
    <Select value={category} onValueChange={setCategory}>
      <SelectTrigger className="w-[180px]">...</SelectTrigger>
      ...
    </Select>
    {(category || query) && (
      <button className={btn("outline", "md")} onClick={resetFilters}>
        Reset Filter
      </button>
    )}
  </div>

  {/* Table or Empty */}
  {data.length === 0 ? (
    <EmptyState
      icon={Package}
      title={query ? "Tidak ada hasil" : "Belum ada produk"}
      description={query ? `Tidak ditemukan untuk "${query}"` : "Mulai dengan menambahkan produk pertama."}
      action={query ? <Button onClick={resetFilters}>Reset Filter</Button> : <Button onClick={openCreate}>Tambah Produk</Button>}
    />
  ) : (
    <Card>
      <Table>...</Table>
    </Card>
  )}

  {/* Pagination */}
  {data.length > 0 && (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">
        Menampilkan {start}-{end} dari {total} produk
      </span>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )}
</div>
```

### 4.5 Anti-Patterns
- ❌ Tambah button di footer / scattered (harus top-right konsisten).
- ❌ Filter bar hilang saat scroll (should be sticky untuk long list).
- ❌ Empty state generic ("No data") tanpa actionable CTA.
- ❌ Pagination tanpa count indicator ("Menampilkan X dari Y").

---

## 5. Pattern 3 — Master-Detail

### 5.1 Purpose
List di kiri + detail di kanan (side panel atau drawer). Cocok untuk **quick review** tanpa leave list context.

### 5.2 Anatomy

```
┌──────────────────────┬──────────────────────────┐
│ List (1/3 width)     │ Detail (2/3 width)       │
│ - Search             │ - Header + close         │
│ - Filter             │ - Metadata               │
│ - Items (selectable) │ - Actions                │
│                      │ - Tabs (optional)        │
│                      │ - Content                │
└──────────────────────┴──────────────────────────┘
```

### 5.3 Variants

**Variant A — Split Pane (desktop):**
- List pane `w-1/3` di kiri
- Detail pane `w-2/3` di kanan
- Mobile: list saja, klik item → navigate ke detail page atau open drawer

**Variant B — List + Drawer Detail:**
- Full-width list
- Klik row → slide-in drawer (see `DRAWERS.md`) dengan detail
- Default untuk mobile responsive

### 5.4 Rules
- Selected row **wajib visual highlight** (`bg-indigo-50 dark:bg-indigo-900/30`).
- Detail pane pada first load: **EmptyState** "Pilih [item] untuk melihat detail".
- Detail pane **close button** di top-right (icon-only ghost).
- Mobile: collapse ke **drawer** pattern (variant B).
- URL routing: `?id=123` atau `/items/[id]` — agar detail state bisa di-share/bookmark.

### 5.5 Example (Drawer variant — responsive default)
```tsx
<div className="space-y-4">
  <FilterBar />
  <Table onRowClick={(item) => setSelected(item)}>...</Table>

  <Drawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
    <DrawerContent className="w-full md:w-[480px]">
      <DrawerHeader>
        <DrawerTitle>{selected?.name}</DrawerTitle>
        <DrawerClose />
      </DrawerHeader>
      <div className="p-6 space-y-4">
        {/* Detail content */}
      </div>
      <DrawerFooter>
        <Button variant="outline">Edit</Button>
        <Button variant="destructive">Hapus</Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</div>
```

### 5.6 Anti-Patterns
- ❌ Split pane di mobile viewport (<1024px) — always collapse ke drawer.
- ❌ Detail pane tanpa close button / keyboard Esc.
- ❌ Detail loses state saat row lain diklik tanpa konfirmasi (jika ada unsaved changes).

---

## 6. Pattern 4 — Form / Settings

### 6.1 Purpose
Edit single entity atau global settings. Multiple fields grouped into **sections**.

### 6.2 Anatomy

```
┌─────────────────────────────────────────────────┐
│ PageHeader (title + description)                 │
├─────────────────────────────────────────────────┤
│ Section 1: "Informasi Umum"                      │
│   Field, Field, Field                            │
├─────────────────────────────────────────────────┤
│ Section 2: "Preferensi"                          │
│   Field, Field                                   │
├─────────────────────────────────────────────────┤
│ Sticky Footer: [Batal] [Simpan Perubahan]        │
└─────────────────────────────────────────────────┘
```

### 6.3 Rules
- **Sections** dipisah dengan heading (`text-lg font-bold`) + description.
- **Field grouping** logical (Info pribadi vs Keamanan vs Notifikasi).
- **Sticky footer** untuk Save/Cancel — **selalu terlihat** saat scroll.
- **Disabled Save button** sampai ada perubahan (dirty state).
- **Loading state** pada Save — disable + spinner (BUTTONS §5.9).
- **Error summary** di top kalau validation gagal (A11Y §6.6).
- **Unsaved changes warning** saat user navigate away (confirm modal).
- **Form layout:** max 1 column di mobile, 2 column (label kiri, input kanan) di desktop untuk dense settings.

### 6.4 Example Structure
```tsx
<form onSubmit={handleSubmit}>
  <div className="space-y-8">
    {/* Section 1 */}
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Informasi Umum</h2>
        <p className="text-sm text-slate-500">Nama dan kontak dasar akun Anda.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Nama Lengkap" id="name" required error={errors.name}>
          <input {...fieldA11yProps({ id: "name", required: true, error: errors.name })} />
        </FormField>
        <FormField label="Email" id="email" required>
          <input type="email" id="email" aria-required="true" />
        </FormField>
      </div>
    </section>

    <hr className="border-slate-200 dark:border-slate-800" />

    {/* Section 2 */}
    <section className="space-y-4">
      <h2 className="text-lg font-bold">Preferensi</h2>
      ...
    </section>
  </div>

  {/* Sticky Footer */}
  <div className="sticky bottom-0 mt-8 -mx-6 px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
    <div className="flex items-center justify-end gap-2">
      <button type="button" className={btn("outline", "md")} onClick={handleCancel}>
        Batal
      </button>
      <button type="submit" className={btn("primary", "md")} disabled={!isDirty || isSubmitting}>
        {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </div>
  </div>
</form>
```

### 6.5 Anti-Patterns
- ❌ Save button di atas form (unreachable tanpa scroll up di long form).
- ❌ Tidak ada "Unsaved changes" warning → user lost work.
- ❌ Validation error tanpa `aria-invalid` + `aria-describedby` (A11y fail).
- ❌ 20+ fields tanpa sectioning (cognitive overload).

---

## 7. Pattern 5 — Wizard / Multi-Step

### 7.1 Purpose
Break complex task jadi **sequential steps** (onboarding, checkout, setup).

### 7.2 Anatomy

```
┌─────────────────────────────────────────────────┐
│ Stepper (1 → 2 → 3 → 4)                          │
├─────────────────────────────────────────────────┤
│ Current Step Content                             │
│   - Step title + description                     │
│   - Step fields                                  │
├─────────────────────────────────────────────────┤
│ Footer: [← Kembali]        [Lanjut →] / [Selesai]│
└─────────────────────────────────────────────────┘
```

### 7.3 Rules
- **Stepper** di top — klikable untuk jump ke completed steps (not future).
- **Current step** highlighted; completed dengan checkmark; future dimmed.
- **3-5 steps ideal** — >5 jadi exhausting. Break jadi sub-wizard jika perlu.
- **Per-step validation** — "Lanjut" disabled sampai step valid.
- **Save progress** — support "Simpan Draft" untuk long wizards.
- **Back button** preserves state (no re-entry).
- **Final step:** summary + CTA "Konfirmasi" / "Selesai".
- **After complete:** redirect ke detail page / success page (bukan kembali ke step 1).
- **Keyboard:** Enter di field terakhir = "Lanjut" (Intuitive).

### 7.4 Example (POS Checkout adapted)
```tsx
const [step, setStep] = useState(1);
const STEPS = [
  { id: 1, label: "Pilih Produk" },
  { id: 2, label: "Metode Bayar" },
  { id: 3, label: "Konfirmasi" },
  { id: 4, label: "Selesai" },
];

<Dialog open={open}>
  <DialogContent className="max-w-2xl">
    {/* Stepper */}
    <Stepper steps={STEPS} currentStep={step} />

    {/* Step Content */}
    {step === 1 && <ProductSelection onNext={() => setStep(2)} />}
    {step === 2 && <PaymentMethod onNext={() => setStep(3)} onBack={() => setStep(1)} />}
    {step === 3 && <Confirmation onConfirm={handleComplete} onBack={() => setStep(2)} />}
    {step === 4 && <SuccessScreen txnId={txnId} />}
  </DialogContent>
</Dialog>
```

### 7.5 Anti-Patterns
- ❌ Stepper tanpa skip option untuk optional steps.
- ❌ Data loss saat back navigation (harus preserve).
- ❌ Wizard >7 steps — too long, break up.
- ❌ Tidak ada progress indicator ("Step 2 dari 4").

---

## 8. Pattern 6 — Workspace (Dual-Pane)

### 8.1 Purpose
Productivity workflow dengan **2 simultaneous areas** active. Contoh: POS kasir (produk grid + cart panel).

### 8.2 Anatomy (POS KasirPage)

```
┌────────────────────────────────┬──────────────┐
│ Product Grid (2/3 width)       │ Cart Panel   │
│ - Category tabs                 │ (1/3 width)  │
│ - Search                        │ - Items      │
│ - Product cards grid            │ - Total      │
│                                 │ - Checkout   │
└────────────────────────────────┴──────────────┘
```

### 8.3 Rules
- **Fixed height viewport** — no page scroll; each pane scrolls independently.
- **Primary pane** (2/3) — main browsing area.
- **Secondary pane** (1/3) — sticky, action-oriented.
- **Mobile:** collapse secondary pane ke **drawer** atau bottom sheet.
- **Keyboard shortcuts** — critical (POS kasir must be fast).
- **State sync** — action di primary updates secondary (add product → cart updates).

### 8.4 Example Structure (KasirPage)
```tsx
<div className="flex h-screen">
  {/* Primary Pane */}
  <div className="flex-1 overflow-y-auto p-6">
    <CategoryTabs />
    <SearchInput />
    <ProductGrid />
  </div>

  {/* Secondary Pane (desktop) */}
  <aside className="hidden md:flex md:w-[360px] border-l flex-col">
    <CartHeader />
    <CartItems className="flex-1 overflow-y-auto" />
    <CartFooter>
      <Button>Bayar</Button>
    </CartFooter>
  </aside>

  {/* Mobile bottom sheet */}
  <Drawer direction="bottom" open={isMobile && showCart}>
    <CartContent />
  </Drawer>
</div>
```

### 8.5 Anti-Patterns
- ❌ Dual pane di mobile — collapse ke drawer.
- ❌ Secondary pane tidak sticky/fixed — loses context.
- ❌ Tidak ada keyboard shortcuts untuk power users (F1 help overlay).

---

## 9. Pattern 7 — Error Pages

### 9.1 Anatomy (Universal)

```
┌─────────────────────────────────────────────────┐
│                                                  │
│         [Icon/Illustration]                      │
│                                                  │
│         404                                      │
│         Halaman Tidak Ditemukan                  │
│                                                  │
│         Maaf, halaman yang Anda cari tidak ada.  │
│                                                  │
│         [Kembali ke Beranda]  [Lapor Bug]        │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 9.2 Three Standard Error Pages

| Status | Title | Description | Primary CTA |
|---|---|---|---|
| **404** | Halaman Tidak Ditemukan | URL salah atau page dihapus | Kembali ke Beranda |
| **403** | Akses Ditolak | Tidak punya izin untuk halaman ini | Kembali / Ganti Akun |
| **500** | Terjadi Kesalahan | Masalah server — coba lagi nanti | Refresh / Lapor Bug |
| **Maintenance** | Sedang Maintenance | Sistem sedang diupdate | Cek Status |
| **Offline** | Tidak Ada Koneksi | Periksa internet Anda | Coba Lagi |

### 9.3 Rules
- **Centered layout** — content di tengah viewport.
- **Status code besar** (`text-6xl font-black text-slate-300`) — recognizable.
- **Title clear + humanized** (bukan "Error 404" — pakai "Halaman Tidak Ditemukan").
- **Description empatic** — jangan blame user.
- **Primary CTA: navigate back** (not stuck).
- **Secondary CTA: report bug** (optional, dev contact).
- **No chrome** — hide sidebar/header di 403 (user might not be auth'd).

### 9.4 Example `not-found.tsx` (Next.js App Router)
```tsx
// app/not-found.tsx
import Link from "next/link";
import { Home, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-6">
      <div className="text-center max-w-md">
        <FileQuestion className="size-16 mx-auto text-slate-300 dark:text-slate-700" aria-hidden="true" />
        <p className="text-6xl font-black text-slate-300 dark:text-slate-700 mt-4">404</p>
        <h1 className="text-2xl font-black mt-2">Halaman Tidak Ditemukan</h1>
        <p className="text-slate-500 mt-2">
          URL yang Anda masukkan mungkin salah atau halaman sudah dihapus.
        </p>
        <div className="flex items-center justify-center gap-2 mt-6">
          <Link href="/" className={btn("primary", "md")}>
            <Home /> Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
```

### 9.5 Error Boundary (React)
```tsx
// app/error.tsx
"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <AlertCircle className="size-16 mx-auto text-rose-500" aria-hidden="true" />
        <h1 className="text-2xl font-black mt-4">Terjadi Kesalahan</h1>
        <p className="text-slate-500 mt-2">
          Maaf, sistem mengalami masalah. Tim kami sudah diberi tahu.
        </p>
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={reset} className={btn("primary", "md")}>
            Coba Lagi
          </button>
          <Link href="/" className={btn("outline", "md")}>
            Ke Beranda
          </Link>
        </div>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 text-xs text-left bg-slate-100 dark:bg-slate-900 p-3 rounded-lg">
            <summary className="cursor-pointer">Detail Error (dev only)</summary>
            <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
          </details>
        )}
      </div>
    </div>
  );
}
```

### 9.6 Anti-Patterns
- ❌ Generic "Error" title tanpa status code context.
- ❌ Error page menampilkan internal stack trace di production.
- ❌ No way out (tidak ada "Back to Home" CTA).
- ❌ Error pake warning/info color — harus rose/muted untuk clarity.

---

## 10. Pattern 8 — Empty Project / First-Run

### 10.1 Purpose
Zero-data state — user baru signup atau belum pernah pakai fitur.

### 10.2 Anatomy

```
┌─────────────────────────────────────────────────┐
│         [Illustration / Icon]                    │
│                                                  │
│         "Mulai dengan transaksi pertama"         │
│                                                  │
│         Deskripsi apa yang akan terjadi.         │
│                                                  │
│         [Primary CTA: Tambah Transaksi]          │
│         [Secondary: Pelajari Selengkapnya]       │
│                                                  │
│         ─── Quick Start Guide ───                │
│         1. [Step]                                │
│         2. [Step]                                │
│         3. [Step]                                │
└─────────────────────────────────────────────────┘
```

### 10.3 Rules
- **Illustration > icon** — ilustrasi lebih engaging, tapi icon OK untuk simple case.
- **Headline: outcome-focused** — "Dapatkan insight pertama" bukan "No data".
- **Primary CTA: single action** — jangan bingung user dengan 3 choices.
- **Quick start guide** (3-5 steps) — optional tapi valuable untuk onboarding.
- **Progressive disclosure** — don't show entire tutorial, link to docs.
- **Dismissible?** — NO. First-run state harus actionable (bukan closable banner).

### 10.4 Example — InventarisPage first-run
```tsx
<EmptyState
  icon={Package}
  title="Mulai Kelola Stok Fotokopian Anda"
  description="Tambahkan produk pertama untuk mulai tracking stok dan menjual di POS."
  action={
    <div className="flex items-center gap-2">
      <Button onClick={openCreate}>
        <Plus /> Tambah Produk Pertama
      </Button>
      <Link href="/docs/inventaris" className={btn("outline", "md")}>
        Pelajari Cara Kerja
      </Link>
    </div>
  }
  size="lg"
>
  <div className="mt-8 max-w-md mx-auto">
    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Quick Start</h3>
    <ol className="mt-3 space-y-2 text-sm">
      <li>1. Tambahkan produk (SKU, nama, harga, stok awal).</li>
      <li>2. Import dari Excel jika sudah ada katalog lama.</li>
      <li>3. Produk otomatis tersedia di POS kasir.</li>
    </ol>
  </div>
</EmptyState>
```

### 10.5 Distinguish dari No-Results (Filter Empty)

| First-Run | No Filter Results |
|---|---|
| Tidak pernah ada data | Ada data, tapi filter kosong |
| Headline: onboarding | Headline: "Tidak ada hasil untuk X" |
| CTA: Add first item | CTA: Reset filter / Change query |
| Quick start guide OK | Quick start guide TIDAK relevan |

---

## 11. Pattern 9 — Authentication

### 11.1 Auth Pages Overview

| Flow | Page | Priority |
|---|---|---|
| Login | `/login` | P0 |
| Signup / Register | `/signup` (admin onboard) | P1 |
| Forgot Password | `/forgot-password` | P1 |
| Reset Password | `/reset-password?token=...` | P1 |
| 2FA Setup | `/settings/2fa` | P2 |
| 2FA Verify | `/login/2fa` | P2 |
| Accept Invite | `/invite?token=...` | P2 |

### 11.2 Shared Auth Layout

```tsx
// app/(auth)/layout.tsx
<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-6">
  <div className="w-full max-w-sm space-y-6">
    {/* Logo */}
    <div className="text-center">
      <Logo className="mx-auto" />
      <h1 className="text-2xl font-black mt-4">InsightSphere</h1>
    </div>

    {/* Auth Card */}
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg">
      {children}
    </div>

    {/* Footer Links */}
    <div className="text-center text-xs text-slate-500">
      <Link href="/docs">Bantuan</Link> · <Link href="/privacy">Privasi</Link>
    </div>
  </div>
</div>
```

### 11.3 Login Page Pattern
```tsx
<form onSubmit={handleLogin} className="space-y-4">
  <h2 className="text-xl font-bold">Masuk ke Akun Anda</h2>

  <FormField label="Username" id="username" required>
    <input id="username" type="text" autoComplete="username" autoFocus />
  </FormField>

  <FormField label="Password" id="password" required>
    <input id="password" type="password" autoComplete="current-password" />
  </FormField>

  <div className="flex items-center justify-between text-sm">
    <label className="flex items-center gap-2">
      <input type="checkbox" /> Ingat saya
    </label>
    <Link href="/forgot-password" className="text-indigo-600 hover:underline">
      Lupa password?
    </Link>
  </div>

  <button type="submit" className={btn("primary", "lg", { fullWidth: true })} disabled={isSubmitting}>
    {isSubmitting ? "Memproses..." : "Masuk"}
  </button>

  <p className="text-center text-sm text-slate-500">
    Belum punya akun?{" "}
    <Link href="/signup" className="text-indigo-600 hover:underline font-bold">
      Daftar
    </Link>
  </p>
</form>
```

### 11.4 Auth Rules
- **autoComplete** attributes mandatory (`username`, `current-password`, `new-password`, `one-time-code` for 2FA).
- **autoFocus** first field (username).
- **Show/hide password** toggle untuk complex passwords.
- **Error messages:** generic untuk failed login ("Username atau password salah") — jangan leak mana yang salah.
- **Rate limiting UX:** show "Coba lagi dalam X detik" setelah 5 failed attempts.
- **Success:** immediate redirect (no "Login berhasil" toast — too slow).
- **2FA:** 6-digit input with auto-submit when all digits filled.
- **Social login** (future): buttons below, separated dengan "Atau" divider.

### 11.5 Anti-Patterns
- ❌ Error "Username tidak ditemukan" → enumeration attack (use generic).
- ❌ Password field tanpa show/hide toggle.
- ❌ autoComplete=off di password → breaks password managers.
- ❌ Login button tetap enabled saat processing → double-submit.

---

## 12. Pattern Composition (Combining Patterns)

Real pages often combine patterns:

| Page | Primary Pattern | Secondary |
|---|---|---|
| `DashboardPage` | Dashboard | — |
| `InventarisPage` | List | Modal Wizard (Add Product) |
| `KasirPage` | Workspace | Wizard (Checkout Modal) |
| `PengaturanPage` | Form/Settings | Modal confirm (destructive) |
| `UserManagementPage` | List + Master-Detail | Modal Invite |
| `TransactionHistoryPage` | List | Drawer Detail |
| `LaporanPage` | Dashboard | Form (Filter) |
| `LoginPage` | Auth | — |

---

## 13. 🚫 Prohibited Patterns

| Pattern | Why |
|---|---|
| **Infinite scroll** untuk primary data (products, transactions) | User lost position, no pagination context |
| **Modal dalam modal dalam modal** (>2 levels) | Users lose context, stuck flow |
| **Page tanpa `<h1>`** | A11y violation, no landmark |
| **Full-page spinner** untuk partial data fetch | Use skeleton per component |
| **Breadcrumb yang tidak reflect navigation** | Misleading — must match actual routing |
| **Save button tanpa disabled state** saat submitting | Double-submit bugs |
| **Error page tanpa CTA back** | User stuck |
| **Wizard tanpa progress indicator** | User confusion |
| **Mobile-only patterns di desktop** (bottom sheet untuk desktop) | Anti-pattern |
| **Tidak ada loading state** saat async | Appears broken |

---

## 14. Migration Guide

### 14.1 Per-page Refactor Priority

| Page | Current Pattern Compliance | Priority |
|---|:---:|:---:|
| `DashboardPage` | 70% (KPI + chart good, activity table missing) | Medium |
| `InventarisPage` | 80% (good list pattern, sticky filter missing) | Low |
| `KasirPage` | 85% (workspace pattern well-applied) | Low |
| `PengaturanPage` | 60% (sections good, sticky footer missing) | Medium |
| `UserManagementPage` | 50% (list OK, master-detail not applied — drawer missing) | **High** |
| `LoginPage` | 70% (layout OK, autoComplete missing) | Medium |

### 14.2 Missing Pages
- [ ] `not-found.tsx` — create 404 page
- [ ] `error.tsx` — create error boundary
- [ ] `forbidden.tsx` — create 403 page (middleware redirect target)

### 14.3 Missing Components
- [ ] `PageHeader.tsx` — standardize header pattern (see BREADCRUMBS §9.3)
- [ ] `FormField.tsx` — standardize label/input/error anatomy
- [ ] `Stepper.tsx` — promote from ad-hoc 42 step references
- [ ] `FilterBar.tsx` — search + filter chips reusable

---

## 15. Future Enhancements

- [ ] `PATTERNS_EXPANDED.md` — detail patterns (CRUD confirmation, bulk action, export flow, notification preferences)
- [ ] Page template generator (`npx insight create:page dashboard --name=Analytics`)
- [ ] Figma page template library (match these patterns)
- [ ] Storybook page-level stories (each pattern as story)
- [ ] E2E tests per pattern (Playwright scenarios)
- [ ] Pattern usage analytics (which patterns used most?)

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
