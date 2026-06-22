# 🃏 InsightSphere Card System

> **Single source of truth untuk card anatomy, variants, dan patterns.**
> Versi: 1.0 — 23 April 2026
> Implementasi token: `frontend/src/app/lib/containers.ts`
> Companion specs: `RADII.md`, `ELEVATION.md`, `SPACING.md`

---

## 1. Overview

InsightSphere memakai **4 card variants** sebagai container paling dominan di aplikasi (147+ card instances di codebase). Policy ini memformalkan anatomy dan memastikan hover elevation pattern konsisten.

---

## 2. Design Principles

### 2.1 Card = Surface
Card adalah "surface" yang mengangkat content dari background. Selalu punya:
- Border atau shadow (atau keduanya)
- Padding internal (≥ `p-4`)
- Radius (minimum `rounded-xl`, default `rounded-2xl`)

### 2.2 Interactive Cards WAJIB Hover Feedback
Card yang clickable (onClick, wrapped `<Link>`, `<button>`) **wajib** punya hover elevation:
```
shadow-sm hover:shadow-md transition-shadow
```
Plus cursor indicator: `cursor-pointer`.

### 2.3 Hierarchy by Radius
| Level | Radius | Use |
|---|---|---|
| Compact | `rounded-xl` (12px) | Secondary card, list item |
| Standard | `rounded-2xl` (16px) | **Default** |
| Hero | `rounded-3xl` (24px) | Feature card, dashboard KPI |

### 2.4 Dark Mode Parity
Setiap card **wajib** punya dark mode counterpart:
- `bg-white` → `dark:bg-slate-900`
- `border-slate-200` → `dark:border-slate-800`

### 2.5 Nested Radius Rule
Child radius selalu ≤ parent radius (dari `RADII.md §4.2`).

---

## 3. Card Anatomy

```
┌──────────────────────────────────────────┐
│  Card Container (rounded-2xl, bg, border)│
│  ┌────────────────────────────────────┐  │
│  │ Card Header (optional)             │  │
│  │   [Icon Box]  Title                │  │
│  │               Subtitle             │  │
│  ├────────────────────────────────────┤  │
│  │ Card Body (main content)           │  │
│  │                                    │  │
│  ├────────────────────────────────────┤  │
│  │ Card Footer (optional)             │  │
│  │              [Action] [Action]     │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### 3.1 Container Classes
```tsx
// Base (static card)
"rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"

// Interactive (clickable card)
"rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"

// Hero (feature card)
"rounded-3xl bg-white dark:bg-slate-900 shadow-lg"
```

### 3.2 Padding Tiers
| Tier | Class | Use case |
|---|---|---|
| Compact | `p-4` | Dense list items, sidebar cards |
| **Default** | `p-6` | Standard card |
| Spacious | `p-8` | Feature cards, hero cards |

### 3.3 Header Pattern (Icon Box + Title)
```tsx
<div className="flex items-center gap-3">
  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
    <ShoppingCart className="size-5 text-indigo-600 dark:text-indigo-400" />
  </div>
  <div className="min-w-0">
    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Title</h3>
    <p className="text-xs text-slate-500 dark:text-slate-400">Subtitle</p>
  </div>
</div>
```

---

## 4. Variants

### 4.1 `CARD.base` — Static card
Non-interactive container. Display-only.

```tsx
<div className={cn(CARD.base, CARD.padding.default)}>
  <p>Static content</p>
</div>
```

### 4.2 `CARD.interactive` — Clickable card
Hover lift + cursor pointer.

```tsx
<Link href="/detail">
  <div className={cn(CARD.base, CARD.interactive, CARD.padding.default)}>
    <h3>Click me</h3>
  </div>
</Link>
```

### 4.3 `CARD.hero` — Feature card
Larger radius, more shadow.

```tsx
<div className={cn(CARD.hero, CARD.padding.spacious)}>
  <h2>Featured content</h2>
</div>
```

### 4.4 `CARD.kpi` — KPI card pattern
Icon box + label + value + trend (standard dashboard card).

```tsx
<div className={cn(CARD.base, CARD.interactive, "p-5")}>
  <div className="flex items-start justify-between mb-3">
    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Pendapatan</span>
    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
      <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
    </div>
  </div>
  <div className="text-2xl font-black text-slate-900 dark:text-slate-100">Rp 5.2jt</div>
  <div className="flex items-center gap-1 mt-1">
    <ArrowUp className="size-3 text-emerald-600" />
    <span className="text-xs font-bold text-emerald-600">12.5%</span>
    <span className="text-[10px] text-slate-400">vs kemarin</span>
  </div>
</div>
```

---

## 5. Usage Examples

### 5.1 Standard Card
```tsx
<div className={cn(CARD.base, CARD.padding.default)}>
  <div className="space-y-4">
    <h3 className="text-base font-bold">Informasi Produk</h3>
    <p className="text-sm text-slate-600 dark:text-slate-400">...</p>
  </div>
</div>
```

### 5.2 Interactive Card dengan Header + Body + Footer
```tsx
<div className={cn(CARD.base, CARD.interactive, "overflow-hidden")}>
  <header className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
      <Package className="size-5 text-indigo-600 dark:text-indigo-400" />
    </div>
    <h3 className="text-base font-bold">Inventaris</h3>
  </header>
  <main className="p-6">
    {/* body content */}
  </main>
  <footer className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
    <button className={btn("outline", "sm")}>Detail</button>
    <button className={btn("primary", "sm")}>Kelola</button>
  </footer>
</div>
```

### 5.3 Grid of KPI Cards
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <KpiCard label="Pendapatan" value="Rp 5.2jt" trend={+12.5} color="emerald" />
  <KpiCard label="Transaksi" value="243" trend={+5.2} color="indigo" />
  <KpiCard label="Stok Menipis" value="12" trend={-3} color="amber" />
  <KpiCard label="Refund" value="2" trend={0} color="rose" />
</div>
```

### 5.4 Compact List Card
```tsx
<ul className="space-y-2">
  {items.map(item => (
    <li key={item.id} className={cn(CARD.base, CARD.interactive, "p-4 flex items-center gap-3")}>
      <img className="size-10 rounded-xl" src={item.img} />
      <div className="flex-1 min-w-0">
        <h4 className="font-bold truncate">{item.name}</h4>
        <p className="text-xs text-slate-500">{item.price}</p>
      </div>
      <ChevronRight className="size-4 text-slate-400" />
    </li>
  ))}
</ul>
```

### 5.5 Empty State Card
```tsx
<div className={cn(CARD.base, "p-12 text-center space-y-4")}>
  <div className="mx-auto size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
    <Package className="size-8 text-slate-400" />
  </div>
  <div>
    <h3 className="font-bold">Belum Ada Produk</h3>
    <p className="text-sm text-slate-500 mt-1">Tambahkan produk pertama Anda</p>
  </div>
  <button className={btn("primary", "md")}>Tambah Produk</button>
</div>
```

### 5.6 Error State Card
```tsx
<div className={cn(
  "rounded-xl border p-4 flex items-start gap-3",
  C.destructive.bg, C.destructive.border
)}>
  <AlertCircle className={cn("size-5 mt-0.5", C.destructive.icon)} />
  <div className="flex-1">
    <h4 className={cn("text-sm font-bold", C.destructive.text)}>Gagal memuat data</h4>
    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
      Periksa koneksi internet Anda.
    </p>
  </div>
</div>
```

---

## 6. 🚫 Prohibited Patterns

| Pattern | Why | Replacement |
|---|---|---|
| Interactive card tanpa `hover:shadow-md` | Missing affordance | `CARD.interactive` bundle |
| Card tanpa dark mode variant | Inconsistent | Full `dark:*` pairing |
| Card dengan `p-1` atau `p-2` | Too cramped | Minimum `p-4` |
| `rounded-md` untuk card | Legacy (see `RADII.md`) | `rounded-xl` or `rounded-2xl` |
| Card dengan `shadow-xl` at rest | Too heavy | `shadow-sm` at rest, `shadow-md` hover |
| Nested card (card in card) tanpa reason | Visual complexity | Flat with border or section divider |
| Card header tanpa icon box (di KPI) | Inconsistent | Include icon box with color |
| Multiple CTAs di single card | Hierarchy collision | 1 primary + 1-2 secondary max |
| Card width tanpa max-width di wide screens | Awkward stretched layout | `max-w-md` or container grid |

---

## 7. Migration Guide

### 7.1 Interactive Card Hover Pattern
Scan clickable cards (those wrapped in `<Link>` or `<button>`, or with `onClick`), ensure `hover:shadow-md transition-shadow` exists.

### 7.2 Dark Mode Pairing
From `COLORS.md §2.2`:
- `bg-white` → `dark:bg-slate-900`
- `border-slate-100` → `dark:border-slate-800`
- `border-slate-200` → `dark:border-slate-800`

### 7.3 Radius Harmonization
- Card default → `rounded-2xl`
- Compact list card → `rounded-xl`
- Hero/feature → `rounded-3xl`
- `rounded-md`/`rounded-lg` → upgrade ke `rounded-xl` minimum

### Per-page priority
Sama dengan `COLORS.md §6`: Dashboard → Kasir → Inventaris → dst.

### Code review rubric
1. Clickable card tanpa hover elevation? → **request change**
2. Dark mode counterpart missing? → **reject**
3. `rounded-md` di card? → **request change**
4. Card `p-1`/`p-2`? → **request change**
5. Multiple `primary` CTA di 1 card? → **request change**
6. `shadow-xl` at rest (bukan hover)? → **request change**

---

## 8. Future Enhancements

- [ ] Create dedicated `<Card>` component wrapper untuk enforce pattern
- [ ] Skeleton variant untuk loading state card
- [ ] Expandable/collapsible card pattern
- [ ] Card with image header (media card)
- [ ] Stat card with sparkline integration
- [ ] Storybook page dengan visual reference semua variants

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
