# 📋 InsightSphere Table System

> **Single source of truth untuk table anatomy, row patterns, sort, pagination.**
> Versi: 1.0 — 23 April 2026
> Implementasi token: `frontend/src/app/lib/data.ts`
> Companion specs: `CARDS.md`, `BADGES.md`, `KPI.md`, `TYPOGRAPHY.md`

---

## 1. Overview

InsightSphere punya 20 table instances (118 `<td>`, 78 `<th>`) — **semua hand-rolled** (0 shadcn `<Table>` usage). Top table-heavy files: PengaturanPage (36 ops), TransactionHistoryPage (30), DashboardPage (26), StockHistoryTable (18), PrediksiStokPage (18).

**Issues teridentifikasi:**
1. **Row hover variance** — 3 pattern (50× `slate-50`, 39× `slate-100`, 59× `indigo-*`) butuh policy
2. **Sort minim** — hanya 4 sort icons di 20 table
3. **No shared anatomy** — setiap table bikin markup manual
4. **Pagination pattern scattered** (39 refs tapi varies)

---

## 2. Design Principles

### 2.1 Minimalist Borders (Divide, not Grid)
Tables pakai **horizontal divider only** (`divide-y`), **bukan** cell borders (`border`).
```tsx
<tbody className="divide-y divide-slate-100 dark:divide-slate-800">
```
- Less visual noise
- Easier scanning
- Cell borders feel "excel-like", tidak modern

### 2.2 Row Hover Policy (Unified: slate-50)
**Pilih 1 pattern untuk semua tables:**
```
hover:bg-slate-50 dark:hover:bg-slate-800/50
```
- `slate-50` = subtle, doesn't compete with content
- `slate-100` too strong (reserve untuk selected state)
- `indigo-*` too branded (reserve untuk active/selected row)

### 2.3 Header Styling (Muted + Bold)
```
px-4 py-3 text-left text-xs font-bold
text-slate-500 dark:text-slate-400
bg-slate-50 dark:bg-slate-800/50
```
- Small (`text-xs`), bold, muted color
- Optional: sticky top-0 for long tables
- **NO `uppercase tracking-widest`** (dari `TYPOGRAPHY.md v1.1` — uppercase minimal)

### 2.4 Cell Padding Standard
| Tier | Padding | Use |
|:---:|:---:|---|
| Compact | `px-3 py-2` | Dense tables (>10 cols), inline edit |
| **Default** | **`px-4 py-3`** | **Standard** |
| Spacious | `px-6 py-4` | Readable, few columns |

### 2.5 Numeric Cells (Tabular Nums)
Semua kolom angka wajib pakai `tabular-nums` untuk alignment:
```tsx
<td className="px-4 py-3 text-right tabular-nums">Rp 1.234.000</td>
```

### 2.6 Sticky Header untuk Long Tables
Table dengan >10 rows wajib sticky header:
```tsx
<thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/50">
```
Plus wrapper `max-h-[500px] overflow-y-auto`.

### 2.7 Empty State Wajib
Setiap table wajib punya empty state (bukan blank `<tbody>`):
```tsx
{rows.length === 0 ? (
  <TableEmpty />
) : (
  rows.map(...)
)}
```

---

## 3. Table Anatomy

```
┌─────────────────────────────────────────────────────┐
│ Wrapper (overflow-x-auto + rounded + border)        │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Table (w-full text-sm)                          │ │
│ │ ┌─────────┬─────────┬─────────┬─────────────┐   │ │
│ │ │ Header  │ Header  │ Header  │    Header   │   │ │
│ │ ├─────────┼─────────┼─────────┼─────────────┤   │ │
│ │ │ Cell    │ Cell    │ Cell    │  Numeric →  │   │ │  ← divide-y
│ │ ├─────────┼─────────┼─────────┼─────────────┤   │ │
│ │ │ Cell    │ Cell    │ Cell    │  Numeric →  │   │ │
│ │ └─────────┴─────────┴─────────┴─────────────┘   │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ Footer (pagination)                                 │
└─────────────────────────────────────────────────────┘
```

### 3.1 Tokens (from `data.ts`)

```tsx
TABLE.wrapper       // overflow wrapper + rounded + border + bg
TABLE.base          // w-full + text-sm
TABLE.head          // thead bg
TABLE.headCell      // th styling
TABLE.headCellSortable  // th with cursor + hover
TABLE.body          // tbody + divide-y
TABLE.row           // tr base
TABLE.rowHover      // tr hover
TABLE.rowInteractive  // clickable row
TABLE.rowSelected   // selected row (indigo-50)
TABLE.cell          // td standard
TABLE.cellNumeric   // td right-align + tabular-nums
TABLE.cellCompact   // td with px-3 py-2
TABLE.stickyHead    // sticky top-0
```

---

## 4. Usage Examples

### 4.1 Basic Table
```tsx
import { TABLE } from "@/app/lib/data";

<div className={TABLE.wrapper}>
  <table className={TABLE.base}>
    <thead className={TABLE.head}>
      <tr>
        <th className={TABLE.headCell}>Produk</th>
        <th className={TABLE.headCell}>Kategori</th>
        <th className={cn(TABLE.headCell, "text-right")}>Harga</th>
        <th className={cn(TABLE.headCell, "text-right")}>Stok</th>
      </tr>
    </thead>
    <tbody className={TABLE.body}>
      {products.map((p) => (
        <tr key={p.id} className={cn(TABLE.row, TABLE.rowHover)}>
          <td className={TABLE.cell}>{p.name}</td>
          <td className={TABLE.cell}>{p.category}</td>
          <td className={TABLE.cellNumeric}>{formatRp(p.price)}</td>
          <td className={TABLE.cellNumeric}>{p.stock}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### 4.2 Sortable Header
```tsx
<th className={cn(TABLE.headCell, TABLE.headCellSortable)} onClick={() => toggleSort("price")}>
  <span className="inline-flex items-center gap-1">
    Harga
    {sortBy === "price" ? (
      sortDir === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />
    ) : (
      <ArrowUpDown className="size-3 opacity-40" />
    )}
  </span>
</th>
```

### 4.3 Interactive Row (Clickable)
```tsx
<tr
  className={cn(TABLE.row, TABLE.rowInteractive)}
  onClick={() => router.push(`/transactions/${txn.id}`)}
>
  <td className={TABLE.cell}>{txn.id}</td>
  <td className={TABLE.cell}>{txn.customer}</td>
  <td className={TABLE.cellNumeric}>{formatRp(txn.total)}</td>
</tr>
```

### 4.4 Selected Row
```tsx
<tr className={cn(TABLE.row, isSelected ? TABLE.rowSelected : TABLE.rowHover)}>
  {/* ... */}
</tr>
```

### 4.5 Row dengan Badge
```tsx
<tr className={cn(TABLE.row, TABLE.rowHover)}>
  <td className={TABLE.cell}>{product.name}</td>
  <td className={TABLE.cell}>
    <span className={cn(BADGE.base, BADGE.size.sm, BADGE.variant.success)}>
      <Check className="size-3" /> Aktif
    </span>
  </td>
</tr>
```

### 4.6 Sticky Header (Long Table)
```tsx
<div className={cn(TABLE.wrapper, "max-h-[500px] overflow-y-auto")}>
  <table className={TABLE.base}>
    <thead className={cn(TABLE.head, TABLE.stickyHead)}>
      {/* ... */}
    </thead>
    {/* ... */}
  </table>
</div>
```

### 4.7 Empty State
```tsx
{rows.length === 0 ? (
  <tr>
    <td colSpan={cols} className="px-4 py-12 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Inbox className="size-6 text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum ada data</p>
          <p className="text-xs text-slate-500 mt-1">Data akan muncul setelah ada transaksi</p>
        </div>
      </div>
    </td>
  </tr>
) : (
  rows.map(...)
)}
```

### 4.8 Loading Skeleton
```tsx
{isLoading ? (
  Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} className={TABLE.row}>
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className={TABLE.cell}>
          <div className="h-4 w-3/4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
        </td>
      ))}
    </tr>
  ))
) : (
  /* actual rows */
)}
```

---

## 5. Pagination Pattern

### 5.1 Simple Pagination (Prev/Next + Page Counter)
```tsx
<div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
  <p className="text-xs text-slate-500">
    Menampilkan <span className="font-bold">{start}–{end}</span> dari <span className="font-bold">{total}</span>
  </p>
  <div className="flex items-center gap-1">
    <button className={btn("outline", "sm")} disabled={page === 1} onClick={() => setPage(p => p - 1)}>
      <ChevronLeft className="size-4" /> Prev
    </button>
    <span className="px-3 text-xs font-bold">Hal {page} / {totalPages}</span>
    <button className={btn("outline", "sm")} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
      Next <ChevronRight className="size-4" />
    </button>
  </div>
</div>
```

### 5.2 Numbered Pagination (with Ellipsis)
Pakai helper `getPaginationRange(page, totalPages)` yang sudah ada di `StockMovementPage`:
```tsx
{getPaginationRange(page, totalPages).map((p, i) =>
  p === "..." ? (
    <span key={i} className="px-2 text-slate-400">…</span>
  ) : (
    <button
      key={i}
      onClick={() => setPage(p as number)}
      className={cn(
        "size-8 rounded-xl text-xs font-bold transition-colors",
        p === page
          ? "bg-indigo-600 text-white"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
      )}
    >
      {p}
    </button>
  )
)}
```

---

## 6. 🚫 Prohibited Patterns

| Pattern | Why | Replacement |
|---|---|---|
| `hover:bg-slate-100` untuk default row hover | Too strong (reserve untuk selected) | `hover:bg-slate-50` |
| `hover:bg-indigo-*` untuk default row hover | Too branded (reserve untuk active) | `hover:bg-slate-50` |
| Cell borders (`border` per td) | Visual noise, not modern | `divide-y divide-slate-100` di tbody |
| Header `uppercase tracking-widest` | Violates Typography v1.1 | `text-xs font-bold` only |
| Missing `tabular-nums` on number cells | Misaligned digits | Always include |
| Long table tanpa sticky header | Headers lost on scroll | `sticky top-0 z-10` |
| Blank `<tbody>` saat no data | Confusing UX | Explicit empty state |
| Pagination inline dalam table cells | Layout issue | Separate footer `<div>` |
| Table tanpa horizontal scroll wrapper | Overflows di mobile | `overflow-x-auto` wrapper |
| `<th>` tanpa `text-left` | Inconsistent alignment | Explicit text alignment |
| Sortable column tanpa icon indicator | Affordance fail | Always include sort icon |
| Row click dengan no cursor indicator | UX fail | `cursor-pointer` di `rowInteractive` |
| Cell text `font-normal` untuk label | Weak hierarchy | `font-medium` atau `font-bold` untuk kolom identifier |

---

## 7. Migration Guide

### 7.1 Row Hover Unification (highest priority)
Scan tables:
- `hover:bg-slate-100` → `hover:bg-slate-50` (default rows)
- `hover:bg-indigo-50` → reserve untuk `rowInteractive` atau selected state only

### 7.2 Header Typography Cleanup
```diff
- className="text-xs uppercase tracking-widest font-bold text-slate-500"
+ className={TABLE.headCell}  // "text-xs font-bold text-slate-500 dark:text-slate-400"
```

### 7.3 Token Adoption
Refactor hand-rolled tables:
```diff
- <table className="w-full text-sm">
-   <thead className="bg-slate-50">
-     <tr>
-       <th className="px-4 py-3 text-left text-xs font-bold ...">...</th>
-     </tr>
-   </thead>
-   <tbody>
-     <tr className="border-b hover:bg-slate-100">
-       <td className="px-4 py-3">...</td>
-     </tr>
-   </tbody>
- </table>
+ <table className={TABLE.base}>
+   <thead className={TABLE.head}>
+     <tr><th className={TABLE.headCell}>...</th></tr>
+   </thead>
+   <tbody className={TABLE.body}>
+     <tr className={cn(TABLE.row, TABLE.rowHover)}>
+       <td className={TABLE.cell}>...</td>
+     </tr>
+   </tbody>
+ </table>
```

### Per-page priority
1. **TransactionHistoryPage** — data-heavy, most scrolled table
2. **InventarisPage** — product table
3. **StockHistoryTable** — already reusable component
4. **PengaturanPage** — settings tables (role mgmt, audit log)
5. **PrediksiStokPage** — prediction table
6. **DashboardPage** — recent activity table

### Code Review Rubric
1. Row hover bukan `hover:bg-slate-50`? → **request change**
2. Header `uppercase tracking-widest`? → **request change**
3. Numeric cell tanpa `tabular-nums`? → **request change**
4. Long table tanpa sticky header? → **request change**
5. Missing empty state? → **reject**
6. Missing `overflow-x-auto` wrapper? → **request change**
7. Cell borders (bukan divide)? → **request change**
8. Sortable column tanpa icon? → **request change**

---

## 8. Future Enhancements

- [ ] Virtualized table untuk 1000+ rows (react-virtual)
- [ ] Column resize/reorder
- [ ] Row selection (checkbox + bulk actions)
- [ ] Fixed left column (scroll horizontal)
- [ ] CSV/Excel export from table
- [ ] Column visibility toggle
- [ ] Filter dropdown per column header
- [ ] Storybook page dengan semua table states

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
