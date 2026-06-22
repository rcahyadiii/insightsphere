# 🟦 InsightSphere Border Radius System

> **Single source of truth untuk border radius (rounding) policy.**
> Versi: 1.0 — 23 April 2026
> CSS variables: `frontend/src/styles/theme.css`
> Companion specs: `SPACING.md`, `BUTTONS.md`

---

## 1. Overview

InsightSphere memakai **6 tier radius** + `rounded-full` untuk circular. Policy ini menutup 920 rounding occurrences di codebase, dengan fokus:

- ✅ Formalize 5 tier resmi
- 🔴 **Eliminate `rounded-md` legacy (69 instances)** — peninggalan shadcn default
- ✅ Align dengan `--radius-card` (24px) dan `--radius-input` (12px) di theme.css

---

## 2. Design Principles

### 2.1 Tier Hierarchy (by element size)
Semakin besar element, semakin besar radius. Pair radius dengan ukuran:
- Chip/tag kecil → radius kecil (4px)
- Button/input → radius sedang (12px)
- Card → radius besar (16-24px)
- Modal → radius terbesar (24px)

### 2.2 Closed Tier System
Hanya 6 tier + full yang diizinkan. `rounded-md` (6px) dilarang — gantikan dengan `rounded-xl` (12px).

### 2.3 CSS Variable Mapping
```css
--radius-input: 0.75rem;   /* 12px → rounded-xl untuk buttons/inputs */
--radius-card:  1.5rem;    /* 24px → rounded-3xl untuk cards/modals */
```

### 2.4 Visual Consistency
Button + input di row yang sama harus same radius. Card container harus ≥ radius child element.

---

## 3. Tier Reference Table

| Tier | Class | Pixels | Use case | Current count |
|:---:|:---:|:---:|---|---:|
| **xs** | `rounded-sm` | 4px | Chips, tags kecil, inline badges | 16 |
| **sm** | `rounded-lg` | 8px | Tight buttons, icon boxes, compact cards | 153 |
| **md** | `rounded-xl` | 12px | **Default** — buttons, inputs, form fields | **337** 🥇 |
| **lg** | `rounded-2xl` | 16px | Cards standar | 118 |
| **xl** | `rounded-3xl` | 24px | Modals, dialogs, hero cards | 29 |
| **full** | `rounded-full` | ∞ | Avatars, pills, circular buttons | 196 |

### 🚫 Dilarang
| `rounded-md` | 6px | **LEGACY** — 69 instances perlu migrasi | 🔴 69 |
| `rounded-none` | 0 | Jarang digunakan, hanya untuk reset | 2 |

---

## 4. Component Mapping

### 4.1 By Component Type

| Component | Radius | Rationale |
|---|---|---|
| Chip, tag, small badge | `rounded-sm` (4px) | Minimal visual noise |
| Status pill | `rounded-full` | Classic pill look |
| Avatar (user, role) | `rounded-full` or `rounded-xl` | Depends on brand |
| Icon box (header icon container) | `rounded-lg` or `rounded-xl` | Smaller than parent card |
| Button (all sizes) | `rounded-xl` (12px) | Matches `--radius-input` |
| Input, select, textarea | `rounded-xl` (12px) | Matches `--radius-input` |
| Search bar | `rounded-xl` or `rounded-full` | Modern feel |
| Card (default) | `rounded-2xl` (16px) | Standard card |
| Card (large feature) | `rounded-3xl` (24px) | Hero card |
| Modal / Dialog | `rounded-3xl` (24px) | Matches `--radius-card` |
| Drawer | `rounded-3xl` top corners only | `rounded-t-3xl` |
| Toast notification | `rounded-xl` | Compact feel |
| Dropdown menu | `rounded-xl` | Floating panel |
| Tooltip | `rounded-lg` | Small floating |
| Progress bar | `rounded-full` | Classic |
| Alert box | `rounded-xl` | Medium feel |

### 4.2 Nested Radius Rule
Child element radius **selalu ≤** parent radius. Rule-of-thumb: child = parent - 4px to 8px.

```
Modal (rounded-3xl 24px)
  └── Header icon box (rounded-xl 12px)  ✅
  └── Button footer (rounded-xl 12px)    ✅
  └── Card inside (rounded-2xl 16px)     ✅
```

---

## 5. Usage Examples

### 5.1 Button (default radius)
```tsx
<button className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white">
  Simpan
</button>
```

### 5.2 Card with nested icon box
```tsx
<div className="p-6 rounded-2xl bg-white border border-slate-200">
  <div className="p-2.5 rounded-xl bg-indigo-50">
    <Icon className="size-5 text-indigo-600" />
  </div>
</div>
```

### 5.3 Modal (rounded-3xl)
```tsx
<div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
  <header className="px-6 py-4 border-b border-slate-100">...</header>
  <main className="p-6">...</main>
  <footer className="px-6 py-4 border-t border-slate-100 flex gap-2">
    <button className="rounded-xl ...">Batal</button>
    <button className="rounded-xl ...">Simpan</button>
  </footer>
</div>
```

### 5.4 Drawer (top corners only)
```tsx
<div className="fixed bottom-0 inset-x-0 rounded-t-3xl bg-white">...</div>
```

### 5.5 Avatar + status dot
```tsx
<div className="relative">
  <img className="size-10 rounded-full" />
  <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 border-2 border-white" />
</div>
```

### 5.6 Chip with rounded-sm
```tsx
<span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-slate-100 text-slate-700">
  KATEGORI
</span>
```

### 5.7 Button group (use rounded-lg in square modifier)
```tsx
<div className="inline-flex gap-1 p-1 rounded-xl bg-slate-100">
  <button className="px-3 py-1.5 rounded-lg">...</button>
  <button className="px-3 py-1.5 rounded-lg">...</button>
</div>
```

---

## 6. 🚫 Prohibited Patterns

| Pattern | Count | Why | Replacement |
|---|---:|---|---|
| `rounded-md` | **69** | Legacy shadcn default (6px), violates `--radius-input` | `rounded-xl` |
| `rounded-[10px]` | - | Arbitrary value off-scale | `rounded-xl` (12px) or `rounded-lg` (8px) |
| `rounded-none` | 2 | Almost never needed | Use default tier |
| Mixed radius in same row (button 8px + input 12px) | - | Visual inconsistency | Match radius across form row |
| Parent smaller radius than child | - | Nested overflow clipping bug | Parent ≥ child |
| `rounded-full` untuk non-circular shape | - | Semantically wrong | `rounded-xl` for rectangular |

---

## 7. Migration Guide

### 7.1 `rounded-md` elimination (Priority: HIGH)
**69 instances** scattered across codebase. Migration target: `rounded-xl`.

**Likely locations (from audit):**
- `components/ui/button.tsx` (shadcn variant defaults — 4 uses)
- Shadcn sub-components (Card, Input, Select, Checkbox, etc.)
- Hand-rolled components copying shadcn pattern

**Search & replace command:**
```
Find:    className=".*rounded-md.*"
Review:  Each occurrence manually (some shadcn internals may need rounded-lg instead)
Replace: rounded-md → rounded-xl (default) or rounded-lg (for tight button groups)
```

### 7.2 Arbitrary value elimination
Grep untuk `rounded-\[` dan konversi ke nearest tier.

### Per-page priority
Sama dengan `COLORS.md §6`: Dashboard → Kasir → Inventaris → dst.

### Code review rubric
1. `rounded-md` baru? → **reject**, pakai `rounded-xl` atau `rounded-lg`
2. `rounded-[*px]` arbitrary? → **request change**, pakai tier terdekat
3. Parent radius < child radius? → **reject** (bug visual)
4. Mixed radius di row yang sama? → **request change**
5. Button + input different radius di form? → **request change**

---

## 8. Future Enhancements

- [ ] ESLint rule: reject `rounded-md` + arbitrary values
- [ ] Refactor `components/ui/button.tsx` internal to use `rounded-xl`
- [ ] Audit shadcn sub-components (Card, Input, Select) untuk override default `rounded-md`
- [ ] Add `--radius-chip` CSS var untuk tier `rounded-sm`
- [ ] Visual tool: storybook page untuk radius tier reference
- [ ] Responsive radius (mobile card `rounded-xl`, desktop `rounded-2xl`)

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
