# 🌫️ InsightSphere Elevation & Shadow System

> **Single source of truth untuk shadow dan elevation hierarchy.**
> Versi: 1.0 — 23 April 2026
> CSS variables: `frontend/src/styles/theme.css`
> Companion specs: `COLORS.md`, `BUTTONS.md`, `RADII.md`

---

## 1. Overview

InsightSphere memakai **5 tier elevation** + 1 inner shadow + colored glow pattern. Total 342 shadow occurrences di codebase (295 base + 47 colored).

Policy ini melengkapi shadow variables yang sudah ada di `theme.css` dengan **semantic mapping** (kapan pakai tier apa).

---

## 2. Design Principles

### 2.1 Semantic Elevation Levels
Setiap shadow tier mewakili **"ketinggian"** UI element di atas surface dasar:

| Level | Z-depth | Context |
|:---:|---|---|
| 0 | Flat (no shadow) | Body text, inline element |
| 1 | Subtle (`shadow-sm`) | Card at rest |
| 2 | Low (`shadow-md`) | Card on hover |
| 3 | Medium (`shadow-lg`) | CTA button, sticky bar |
| 4 | High (`shadow-xl`) | Popover, dropdown |
| 5 | Overlay (`shadow-2xl`) | Modal, drawer |
| -1 | Sunken (`shadow-inner`) | Input, sunken panel |

### 2.2 Colored Glow Pattern
CTA buttons pakai **colored shadow** untuk "brand aura". Sudah di-bake di `BTN.variant.*`:
- `primary` → `shadow-lg shadow-indigo-100`
- `success` → `shadow-lg shadow-emerald-100`
- `destructive` → `shadow-lg shadow-rose-100`

### 2.3 Elevation Consistency
Komponen pada elevation level yang sama harus konsisten:
- Semua modal = `shadow-2xl` (tidak pernah `shadow-xl`)
- Semua card default = `shadow-sm` (tidak pernah `shadow-md` saat rest)

### 2.4 Hover Elevation Pattern
Interactive card: rest `shadow-sm` → hover `shadow-md`. Butuh `transition-shadow` untuk smooth.

---

## 3. Tier Reference Table

| Tier | Class | CSS (approx) | Use case | Current count |
|:---:|:---:|---|---|---:|
| **1 (subtle)** | `shadow-sm` | `0 1px 2px rgb(0 0 0 / 5%)` | Card at rest, subtle lift | **162** 🥇 |
| **2 (low)** | `shadow-md` | `0 4px 6px rgb(0 0 0 / 10%)` | Card hover, toast | 28 |
| **3 (medium)** | `shadow-lg` | `0 10px 15px rgb(0 0 0 / 10%)` | CTA button + colored glow | 35 |
| **4 (high)** | `shadow-xl` | `0 20px 25px rgb(0 0 0 / 10%)` | Dropdown, popover, tooltip | 22 |
| **5 (overlay)** | `shadow-2xl` | `0 25px 50px rgb(0 0 0 / 25%)` | Modal, drawer, dialog | 35 |
| **-1 (sunken)** | `shadow-inner` | `inset 0 2px 4px rgb(0 0 0 / 5%)` | Input sunken, track | 11 |

---

## 4. Component Mapping

### 4.1 By Component Type

| Component | Shadow (rest) | Shadow (hover/active) |
|---|---|---|
| Card (default) | `shadow-sm` | `shadow-md` |
| Card (interactive/clickable) | `shadow-sm` | `shadow-md` |
| Card (feature/hero) | `shadow-lg` | — |
| KPI card | `shadow-sm` | `shadow-md` |
| CTA button (primary) | `shadow-lg shadow-indigo-100` | (hover shifts bg, shadow stays) |
| Button secondary | — | `shadow-sm` on hover (optional) |
| Sidebar | (none, use border) | — |
| Header sticky | `shadow-sm` when scrolled | — |
| Dropdown menu | `shadow-xl` | — |
| Tooltip | `shadow-xl` | — |
| Popover | `shadow-xl` | — |
| Modal (backdrop) | `shadow-2xl` | — |
| Drawer | `shadow-2xl` | — |
| Toast notification | `shadow-lg` | — |
| Input (default) | — (use border) | — |
| Input (ghost/chip) | `shadow-inner` | — |
| Progress track | `shadow-inner` | — |
| Avatar | `shadow-sm` (optional) | — |

### 4.2 Colored Glow (CTA pattern)

Colored shadow = tint shadow dengan warna semantic untuk "brand aura":

| Variant | Shadow class | Visual effect |
|---|---|---|
| `primary` | `shadow-lg shadow-indigo-100` | Subtle indigo glow |
| `success` | `shadow-lg shadow-emerald-100` | Subtle emerald glow |
| `warning` | `shadow-lg shadow-amber-100` | Subtle amber glow |
| `destructive` | `shadow-lg shadow-rose-100` | Subtle rose glow |
| `neutral` | `shadow-lg shadow-slate-200` | Subtle gray glow |

**Dark mode counterpart** (via `BTN.variant.*`):
- `dark:shadow-indigo-900/30`, dst.

**Kapan pakai colored glow:**
- ✅ Primary CTA (hero action, submit button)
- ✅ Login/onboarding button
- ❌ Secondary button (terlalu noisy)
- ❌ Ghost/outline button (inconsistent)

---

## 5. Usage Examples

### 5.1 Card at rest + hover
```tsx
<div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
  ...
</div>
```

### 5.2 CTA Button with colored glow
```tsx
<button className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700">
  Simpan Transaksi
</button>
```

### 5.3 Modal with overlay shadow
```tsx
<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm">
  <div className="mx-auto mt-20 max-w-md rounded-3xl bg-white shadow-2xl">
    ...
  </div>
</div>
```

### 5.4 Dropdown menu
```tsx
<div className="rounded-xl bg-white shadow-xl border border-slate-100">
  ...menu items
</div>
```

### 5.5 Input with inner shadow (search)
```tsx
<input className="w-full px-4 py-2.5 rounded-xl bg-slate-50 shadow-inner border border-slate-200" />
```

### 5.6 KPI Card with hover lift
```tsx
<div className="p-6 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
  <div className="flex items-center justify-between">
    <span className="text-slate-500 text-xs font-bold">Pendapatan</span>
    <div className="p-2 rounded-xl bg-emerald-50">
      <TrendingUp className="size-4 text-emerald-600" />
    </div>
  </div>
  <div className="text-2xl font-black mt-2">Rp 5.2jt</div>
</div>
```

### 5.7 Sticky header (scrolled)
```tsx
<header className={cn(
  "sticky top-0 bg-white/80 backdrop-blur-md",
  scrolled && "shadow-sm"
)}>
  ...
</header>
```

---

## 6. 🚫 Prohibited Patterns

| Pattern | Why | Replacement |
|---|---|---|
| `shadow-xl` untuk card default | Terlalu berat, violates tier | `shadow-sm` |
| `shadow-sm` untuk modal | Kurang elevated, tidak clear overlay | `shadow-2xl` |
| `shadow-[0_4px_12px_rgba(...)]` arbitrary | Off-scale | Pilih nearest tier |
| Mixed tier di row (card sm + card lg tanpa alasan) | Visual inconsistent | Consistent tier per context |
| Colored glow tanpa base shadow | Incomplete — tidak ada depth | `shadow-lg shadow-indigo-100` (both) |
| Card at rest = `shadow-md` | Tier 2 adalah hover state | `shadow-sm` at rest, hover → `shadow-md` |
| `shadow-inner` untuk button | Semantically wrong (buttons elevate, not sunken) | `shadow-lg` |
| Modal tanpa backdrop + tanpa shadow | No elevation cue | Pair backdrop + `shadow-2xl` |

---

## 7. Migration Guide

### 7.1 Audit Tasks
1. Scan untuk `shadow-xl` pada card non-floating → convert ke `shadow-sm`/`shadow-md`
2. Scan untuk `shadow-sm` pada modal → upgrade ke `shadow-2xl`
3. Scan untuk arbitrary `shadow-[...]` → tier mapping

### 7.2 Hover Pattern Refactor
Interactive cards sering tidak punya hover elevation. Tambahkan:
```diff
- className="p-6 rounded-2xl bg-white shadow-sm"
+ className="p-6 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow"
```

### 7.3 CTA Glow Unification
Primary CTA yang belum pakai colored glow, pakai `BTN.variant.primary` (sudah include shadow).

### Per-page priority
Sama dengan `COLORS.md §6`.

### Code review rubric
1. `shadow-xl` pada card default? → **request change** (pakai `shadow-sm`)
2. Modal tanpa `shadow-2xl`? → **request change**
3. Arbitrary `shadow-[...]`? → **reject** kecuali approved
4. Interactive card tanpa `hover:shadow-*`? → **request change**
5. CTA primary tanpa colored glow? → **suggestion** (pakai `btn()` helper)
6. `shadow-inner` di button? → **reject**

---

## 8. Future Enhancements

- [ ] Add dark mode shadow variants di `theme.css` (dark mode pakai higher opacity)
- [ ] Create `elevation.ts` token file kalau pattern kompleks muncul
- [ ] Storybook page: visual ladder dari flat → overlay
- [ ] Auto-lint: detect tier-mismatch (card + shadow-xl)
- [ ] Dynamic shadow based on scroll position (parallax-like)

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
