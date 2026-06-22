# 📏 InsightSphere Spacing System

> **Single source of truth untuk spacing, gap, padding, dan icon sizing.**
> Versi: 1.0 — 23 April 2026
> Companion specs: `TYPOGRAPHY.md`, `COLORS.md`, `BUTTONS.md`, `RADII.md`

---

## 1. Overview

InsightSphere memakai **4/8 base scale** dari Tailwind (1 unit = 0.25rem = 4px) dengan half-step (0.5 increment) untuk micro-tuning.

Policy ini menutup 2,459 spacing occurrences yang sebelumnya picked by feel — tanpa aturan jelas kapan pakai `p-4` vs `p-5` vs `p-6`.

---

## 2. Design Principles

### 2.1 Base Scale (4/8 Grid)
Seluruh spacing utama harus kelipatan 4px: `2 (8px), 4 (16px), 6 (24px), 8 (32px), 12 (48px)` — ini forms visual rhythm konsisten.

### 2.2 Half-step (Micro-tuning)
Fractional values (`0.5, 1.5, 2.5, 3.5`) **hanya boleh** untuk:
- Button padding adjustment (`py-2.5` standar button md)
- Icon alignment (`pt-0.5` untuk optical centering dengan text)
- Border compensation (`px-1.5` dengan border)

**Bukan** untuk container spacing — container selalu pakai base scale.

### 2.3 Semantic Categories
Setiap spacing use case punya tier yang sudah ditentukan:
- **Container padding** → `p-4`, `p-5`, `p-6`
- **Card content** → `p-6` (standard), `p-5` (compact)
- **Button inner** → `px-4 py-2` (md default)
- **Inline gap** (icon+text) → `gap-2`
- **Tight group** (button group, breadcrumbs) → `gap-1.5`
- **Form field spacing** → `space-y-4`
- **Page section** → `space-y-6`, `space-y-8`

### 2.4 No Arbitrary Values
❌ `p-[17px]`, `gap-[13px]` — dilarang kecuali ada alasan khusus dengan approval.

---

## 3. Scale Reference Table

| Token | rem | pixels | Typical use |
|:---:|:---:|:---:|---|
| `0` | 0 | 0 | Reset |
| `0.5` | 0.125 | 2 | Micro-alignment (border compensate) |
| `1` | 0.25 | 4 | Minimum visible gap |
| `1.5` | 0.375 | 6 | Tight button group gap |
| `2` | 0.5 | 8 | **Default inline gap** (`gap-2`) |
| `2.5` | 0.625 | 10 | Button md vertical padding |
| `3` | 0.75 | 12 | Compact container padding |
| `4` | 1 | 16 | **Default container padding** (`p-4`) |
| `5` | 1.25 | 20 | Medium variant |
| `6` | 1.5 | 24 | Card content, modal body |
| `8` | 2 | 32 | Hero sections, major spacing |
| `10` | 2.5 | 40 | Large reveal spacing |
| `12` | 3 | 48 | Top-level page padding |

---

## 4. Token Categories

### 4.1 Container Padding
```
Chip / Badge         → px-2 py-0.5 or px-2 py-1
Button (sm)          → px-3 py-1.5
Button (md default)  → px-4 py-2 or px-4 py-2.5
Button (lg)          → px-5 py-2.5
Button (xl)          → px-6 py-3
Input                → px-4 py-2.5 (same as button md)
Card (default)       → p-6
Card (compact)       → p-5 or p-4
Modal body           → p-6
Modal header/footer  → px-6 py-4
Page root            → p-4 md:p-6 lg:p-8
```

### 4.2 Inline Spacing (gap)
```
Tight group (breadcrumb, button group) → gap-1.5
Icon + text inside button              → gap-2
Card header (icon + title)             → gap-3
Grid of cards                          → gap-4 or gap-6
Dashboard section                      → gap-6
```

### 4.3 Vertical Rhythm (space-y)
```
Inline form field stacking → space-y-1 (label+field)
Form fields stack           → space-y-4
Page section blocks         → space-y-6
Hero sections               → space-y-8
```

### 4.4 Icon Sizing

**Policy:** Gunakan `size-N` (Tailwind v4 shortcut), bukan `h-N w-N`. Size tiers align dengan `BTN.size.*`.

| Icon tier | Class | Pixels | Context |
|:---:|:---:|:---:|---|
| `xs` | `size-3` | 12px | Chip icon, badge indicator |
| `sm` | `size-3.5` | 14px | Button sm icon |
| `md` | `size-4` | 16px | **Default** — button md, inline icon |
| `lg` | `size-5` | 20px | Button xl icon, prominent icon |
| `xl` | `size-6` | 24px | Card header icon, section marker |
| `2xl` | `size-8` | 32px | Feature icon, empty state |
| `3xl` | `size-10` | 40px | Hero icon, avatar large |
| `4xl` | `size-12` | 48px | Feature hero |

---

## 5. Usage Examples

### 5.1 Card with Icon Header
```tsx
<div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
  <div className="flex items-center gap-3">
    <div className="p-2.5 rounded-xl bg-indigo-50">
      <ShoppingCart className="size-5 text-indigo-600" />
    </div>
    <div>
      <h3 className="text-base font-bold">Transaksi</h3>
      <p className="text-xs text-slate-500">Hari ini</p>
    </div>
  </div>
  <div className="space-y-2">
    {/* List items */}
  </div>
</div>
```

### 5.2 Form Field Group
```tsx
<div className="space-y-4">
  <div className="space-y-1">
    <label className="text-xs font-bold text-slate-700">Nama Produk</label>
    <input className="w-full px-4 py-2.5 rounded-xl border border-slate-300" />
  </div>
  <div className="space-y-1">
    <label>...</label>
    <input />
  </div>
</div>
```

### 5.3 Button Group (toolbar)
```tsx
<div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100">
  <button className="px-3 py-1.5 rounded-lg">Hari Ini</button>
  <button className="px-3 py-1.5 rounded-lg">Minggu</button>
</div>
```

### 5.4 Page Layout
```tsx
<div className="p-4 md:p-6 lg:p-8 space-y-6">
  <header className="flex items-center justify-between">...</header>
  <section className="space-y-4">
    <h2>KPI</h2>
    <div className="grid grid-cols-4 gap-4">{/* cards */}</div>
  </section>
  <section className="space-y-4">...</section>
</div>
```

---

## 6. 🚫 Prohibited Patterns

| Pattern | Why | Replacement |
|---|---|---|
| `p-[17px]`, `gap-[13px]` | Arbitrary off-scale | Pilih closest token (`p-4`, `gap-3`) |
| `p-7`, `gap-7`, `m-7` | Not in policy scale | Pakai `p-6` atau `p-8` |
| `pt-5 pb-4 pl-3 pr-6` (asymmetric) | Usually indicates layout smell | Pakai grid/flex layout dengan gap |
| `space-y-0.5` between form fields | Too tight, cramped | Minimum `space-y-2` antar fields |
| `<div className="mt-4"><div className="mt-4">` (stacked margins) | Margin collision | Pakai `space-y-4` di parent |
| `h-4 w-4` (separate dimensions) | Error-prone (h-4 w-5 typo) | Pakai `size-4` |
| Margin untuk gap antar sibling | Hard to maintain | Pakai `gap-*` di parent flex/grid |
| `p-1` pada card | Too cramped untuk content | Minimum `p-4` |

---

## 7. Migration Guide

### 7.1 Icon sizing migration (691 instances)
Ganti `h-N w-N` → `size-N`:

| Before | After |
|---|---|
| `h-4 w-4` (153+65 = 218 instances) | `size-4` |
| `h-3.5 w-3.5` (123 instances) | `size-3.5` |
| `h-3 w-3` (77 instances) | `size-3` |
| `h-5 w-5` (57 instances) | `size-5` |
| `h-6 w-6` (28 instances) | `size-6` |

### 7.2 Odd-number eliminations
Audit untuk `p-7`, `p-9`, `gap-7`, dsb. — kalau ada, ganti ke nearest base scale.

### Per-page priority
Sama dengan `COLORS.md §6`: Dashboard → Kasir → Inventaris → dst.

### Code review rubric
1. Arbitrary value (`p-[17px]`)? → **reject** kecuali approved
2. Off-scale number (`p-7`, `gap-9`)? → **request change**
3. `h-N w-N` separate (not `size-N`)? → **request change**
4. Asymmetric padding without layout reason? → **question**
5. Container dengan `p-1` atau `p-2` (too cramped)? → **request change**
6. `space-y-0.5` antar form fields? → **reject**

---

## 8. Future Enhancements

- [ ] Consider creating `spacing.ts` token file dengan semantic names (`SPACING.card`, `SPACING.section`)
- [ ] ESLint rule: reject arbitrary `p-[*]`, `gap-[*]` tanpa comment justification
- [ ] Storybook page: visual reference untuk semua tiers
- [ ] Design audit tool: scan component for off-scale usage
- [ ] Responsive spacing presets (`p-4 md:p-6 lg:p-8` sebagai reusable)

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
