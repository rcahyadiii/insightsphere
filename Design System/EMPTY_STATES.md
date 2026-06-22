# 🗳️ InsightSphere Empty States System

> **Single source of truth untuk empty state patterns.**
> Versi: 1.0 — 23 April 2026
> Implementasi: `frontend/src/app/components/ui/EmptyState.tsx` + `frontend/src/app/lib/feedback.ts`
> Companion specs: `ALERTS.md`, `TOASTS.md`, `LOADING.md`, `CARDS.md`

---

## 1. Overview

Empty state = kondisi dimana konten yang biasanya ada **belum/tidak tersedia**. Berbeda dengan loading (sementara) dan error (ada masalah), empty state adalah **neutral state** yang sering merupakan **starting point** untuk user action.

InsightSphere sudah punya `EmptyState.tsx` (41 LOC) dengan props `icon | title | description | action`, dipakai di:
- CartPanel (6×)
- StockCheckView (5×)
- InventarisPage (3×)
- PrediksiStokPage (3×)

**Bug teridentifikasi:** `EmptyState.tsx` tidak punya dark mode variants (semua warna slate hardcoded tanpa `dark:*`). Policy ini memformalkan anatomy + perbaiki bug + tambah variants.

---

## 2. Design Principles

### 2.1 Empty = Opportunity, Bukan Error
Empty state **selalu actionable**:
- Tampilkan CTA untuk next step (tambah produk, mulai transaksi, reset filter)
- Tone friendly + informational
- Avoid technical jargon

**Bad:** "No data found."
**Good:** "Belum ada produk. Yuk tambahkan produk pertama Anda!"

### 2.2 Icon / Illustration Wajib
Setiap empty state wajib punya visual:
- Icon (Lucide) di dalam `iconBox` (rounded bg + padding)
- Atau SVG illustration (optional untuk hero empty)
- Size minimum `size-12` di mobile, `size-16` di desktop

### 2.3 Hierarchy: Icon → Title → Description → Action
```
[  icon  ]           ← size-16 (48-64px), bg-slate-100
Title (bold)         ← text-lg font-bold
Description text     ← text-sm text-slate-500, max-w-280px
[Primary Action]     ← btn primary
```

### 2.4 Dark Mode Parity (Wajib — Fix Bug)
```
bg-slate-100 → dark:bg-slate-800
text-slate-900 → dark:text-slate-100
text-slate-500 → dark:text-slate-400
text-slate-400 → dark:text-slate-500
```

### 2.5 Placement-Aware Sizing
| Placement | Size variant | Icon size | Padding |
|---|:---:|:---:|---|
| **Page-level** | `lg` (default) | `size-16` | `p-12` |
| **Card-internal** | `md` | `size-12` | `p-8` |
| **Table row** (colspan) | `sm` | `size-10` | `p-6` |
| **Modal body** | `md` | `size-12` | `p-8` |

### 2.6 4 Variants per Context

| Variant | Icon default | Use case |
|---|---|---|
| **`no-data`** | `Inbox` / `Package` | Belum ada data sama sekali |
| **`no-results`** | `SearchX` | Filter/search returns 0 |
| **`no-access`** | `Lock` / `ShieldOff` | Permission denied |
| **`error`** | `AlertCircle` | Failed to load (treat as empty) |

---

## 3. Empty State Anatomy

```
    ┌───────────┐
    │           │
    │    📦     │  ← Icon box (rounded-2xl, bg-slate-100)
    │           │
    └───────────┘

   Belum Ada Produk            ← Title (font-bold, text-lg)

Tambahkan produk pertama       ← Description (text-sm, slate-500, max-w)
untuk mulai jualan.

     [+ Tambah Produk]         ← Action button (primary)
```

### 3.1 Structure Tokens (`feedback.ts`)

```tsx
EMPTY.wrapper        // flex flex-col items-center + center text + padding
EMPTY.iconBox        // size-16 + rounded-2xl + bg + flex center
EMPTY.iconBox.{variant}  // per-variant bg color tinting
EMPTY.title          // text-lg font-bold
EMPTY.description    // text-sm max-w-[280px] leading-relaxed
EMPTY.action         // flex gap container
EMPTY.size.{sm|md|lg}  // sizing presets
```

---

## 4. `<EmptyState>` Component (Fixed)

```tsx
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Package } from "lucide-react";

<EmptyState
  icon={Package}
  title="Belum Ada Produk"
  description="Tambahkan produk pertama Anda untuk mulai jualan."
  action={
    <button className={btn("primary", "md")} onClick={openAddProductModal}>
      <Plus className="size-4" /> Tambah Produk
    </button>
  }
/>
```

**Note:** `EmptyState.tsx` diperbaiki dalam cluster ini untuk include dark mode variants.

---

## 5. Usage Examples

### 5.1 No-Data (Fresh Page)
```tsx
<EmptyState
  icon={Package}
  title="Belum Ada Produk"
  description="Mulai dengan menambahkan produk pertama Anda."
  action={
    <button className={btn("primary", "md")} onClick={openModal}>
      <Plus className="size-4" /> Tambah Produk
    </button>
  }
/>
```

### 5.2 No-Results (Filter/Search)
```tsx
<EmptyState
  icon={SearchX}
  title="Produk Tidak Ditemukan"
  description="Coba ubah kata kunci atau reset filter."
  action={
    <button className={btn("outline", "md")} onClick={resetFilter}>
      <RotateCcw className="size-4" /> Reset Filter
    </button>
  }
/>
```

### 5.3 No-Access (Permission)
```tsx
<EmptyState
  icon={Lock}
  title="Akses Terbatas"
  description="Hanya pengguna dengan role Admin yang dapat melihat halaman ini."
  action={
    <Link href="/" className={btn("outline", "md")}>
      <Home className="size-4" /> Kembali ke Dashboard
    </Link>
  }
/>
```

### 5.4 Error State (Treat as Empty)
```tsx
<EmptyState
  icon={AlertCircle}
  title="Gagal Memuat Data"
  description="Periksa koneksi internet Anda atau coba lagi dalam beberapa saat."
  action={
    <button className={btn("outline", "md")} onClick={retry}>
      <RefreshCw className="size-4" /> Coba Lagi
    </button>
  }
/>
```

### 5.5 Table Row Empty (Compact)
```tsx
<tbody>
  {rows.length === 0 ? (
    <tr>
      <td colSpan={cols}>
        <div className={cn(EMPTY.wrapper, EMPTY.size.sm)}>
          <div className={cn(EMPTY.iconBox, "size-12 mb-4")}>
            <Inbox className="size-6 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum ada data</p>
          <p className="text-xs text-slate-500 mt-1">Data akan muncul setelah ada transaksi</p>
        </div>
      </td>
    </tr>
  ) : (
    rows.map(...)
  )}
</tbody>
```

### 5.6 Cart Empty (POS Specific)
```tsx
<EmptyState
  icon={ShoppingCart}
  title="Keranjang Kosong"
  description="Pilih produk dari panel sebelah kiri untuk mulai transaksi."
/>
{/* No action needed — user obvious next step */}
```

### 5.7 Multi-action Empty State
```tsx
<EmptyState
  icon={Package}
  title="Belum Ada Produk"
  description="Tambah manual atau import dari file Excel."
  action={
    <>
      <button className={btn("primary", "md")}>
        <Plus className="size-4" /> Tambah Manual
      </button>
      <button className={btn("outline", "md")}>
        <FileSpreadsheet className="size-4" /> Import Excel
      </button>
    </>
  }
/>
```

---

## 6. 🚫 Prohibited Patterns

| Pattern | Why | Replacement |
|---|---|---|
| Empty state tanpa icon | Weak visual | Always include icon in iconBox |
| Empty state tanpa action (non-cart) | Dead-end UX | Include CTA (except obvious-next-step cases) |
| Technical jargon ("No records found") | Not user-friendly | Conversational Bahasa Indonesia |
| Negative tone ("Error: ...") | Scary for user | Neutral/positive phrasing |
| Icon tanpa iconBox wrapper | Feels floating | Always in rounded container |
| Missing dark mode | Component broken in dark theme | Full pairing (this spec fixes it) |
| Description terlalu panjang (>2 sentences) | Too much reading | Max 2 sentences / ~140 chars |
| Multiple primary actions | Decision fatigue | 1 primary + optional secondary |
| Blank `<tbody>` tanpa empty state | Confusing UX | Explicit empty state row |
| Empty state di loading context | Wrong semantic | Use skeleton during loading |
| Generic "No data" tanpa context | Vague | Specific: "Belum ada {entity}" |
| Icon size inconsistent dengan placement | Scale violation | Follow size tier per placement |

---

## 7. Migration Guide

### 7.1 Dark Mode Fix (Auto via Spec)
`EmptyState.tsx` diperbarui dalam spec ini untuk include:
- `bg-slate-100` → `bg-slate-100 dark:bg-slate-800`
- `text-slate-900` → `text-slate-900 dark:text-slate-100`
- `text-slate-500` → `text-slate-500 dark:text-slate-400`
- `text-slate-400` → `text-slate-400 dark:text-slate-500`

### 7.2 Adopt Component
Scan hand-rolled empty state patterns (search: "Belum ada" / "Tidak ada") → replace dengan `<EmptyState>`:

```diff
- <div className="flex flex-col items-center justify-center py-12 text-center">
-   <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
-     <Package className="w-8 h-8 text-slate-400" />
-   </div>
-   <h3 className="text-lg font-bold text-slate-900">Belum Ada Produk</h3>
-   <p className="text-sm text-slate-500 mt-2">Tambah produk pertama Anda.</p>
- </div>
+ <EmptyState
+   icon={Package}
+   title="Belum Ada Produk"
+   description="Tambah produk pertama Anda."
+ />
```

### 7.3 Table Empty State Migration
Apply compact variant di table `<tbody>` (see §5.5).

### Per-page priority
1. **CartPanel** (6 empty states) — highest usage
2. **StockCheckView** (5)
3. **InventarisPage** (3)
4. **PrediksiStokPage** (3)
5. All tables without explicit empty state

### Code Review Rubric
1. Empty state tanpa icon? → **reject**
2. Missing dark mode? → **reject** (post-fix)
3. Technical jargon? → **request change**
4. Tanpa action (non-cart context)? → **request change**
5. Description >2 sentences? → **request change**
6. Hand-rolled markup (bukan `<EmptyState>`)? → **request change**
7. Table tanpa empty state row? → **request change**

---

## 8. Future Enhancements

- [ ] Illustration variants (custom SVG per context — cart/product/user)
- [ ] Animated empty state (subtle bounce/pulse to draw attention)
- [ ] Contextual help link (learn more → docs)
- [ ] Empty state with demo data button (for onboarding)
- [ ] Variant prop di `<EmptyState>` (`no-data` | `no-results` | `no-access` | `error`) dengan default icon per variant
- [ ] Size prop (`sm` | `md` | `lg`) untuk placement-aware
- [ ] Lottie animation support untuk hero empty
- [ ] Storybook page dengan semua variants

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
