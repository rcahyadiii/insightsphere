# 🔘 InsightSphere Button System

> **Single source of truth untuk button styling di seluruh aplikasi.**
> Versi: 1.0 — 23 April 2026
> Implementasi token: `frontend/src/app/lib/buttons.ts`
> Companion specs: `TYPOGRAPHY.md`, `COLORS.md` (same folder)

---

## 1. Overview

InsightSphere memakai **13 button variants × 5 size tiers** — semuanya dikompose dari 3 bagian:

1. **`BTN.base`** — shared classes (radius, transition, focus ring, disabled, active press)
2. **`BTN.size.*`** — dimensi (height, padding, icon size, typography)
3. **`BTN.variant.*`** — warna/style (filled, soft, outline, ghost, link)

Usage minimal via helper:

```tsx
import { btn } from "@/app/lib/buttons";

<button className={btn("primary", "lg")}>Simpan Transaksi</button>
<button className={btn("ghost", "md", { icon: true })}><X /></button>
<button className={btn("destructive", "md")}>Hapus Produk</button>
```

---

## 2. Design Principles

### 2.1 Radius
- Semua button pakai `rounded-xl` = **12px**, aligned dengan `--radius-input` di `theme.css`.
- Exception: `{ pill: true }` untuk circular (biasa dipakai dengan `icon: true`).
- Exception: `{ square: true }` untuk `rounded-lg` (8px) di tight button groups.

### 2.2 Tactile Feedback
- `active:scale-[0.98]` memberi sedikit "press depth" saat diklik.
- `transition-all` untuk smooth hover/active state.

### 2.3 Focus Ring (A11y)
- `focus-visible:ring-2 focus-visible:ring-offset-2` = standard 2px ring + 2px offset.
- Ring color menyesuaikan variant (`focus-visible:ring-indigo-400`, dst).
- Dark mode: `dark:focus-visible:ring-offset-slate-900` supaya offset terlihat.

### 2.4 Disabled State
- `disabled:opacity-50` + `disabled:pointer-events-none`.
- Tidak perlu ganti warna — opacity sudah cukup signal.

### 2.5 Icon Alignment
- `gap-2` antara icon dan text.
- `[&_svg]:shrink-0` agar icon tidak kompres di flex container.
- `[&_svg]:size-*` controlled per size tier.

### 2.6 Typography Integration
- `font-bold tracking-tight` (sesuai Typography v1.1 policy — NO uppercase).
- Size tier menentukan `text-*`:
  - `xs` → `text-[11px]`
  - `sm` → `text-xs`
  - `md` → `text-sm` (default)
  - `lg` → `text-sm`
  - `xl` → `text-base`

### 2.7 Emphasis Hierarchy
Per view/modal, hanya **1 button boleh pakai `primary` solid**. Button lain pakai:
- Soft variant (medium emphasis)
- Outline / ghost (low emphasis)

---

## 3. Variant Matrix

### 3.1 SOLID (Maximum Emphasis — 5 variants)

| Variant | Color | Use case |
|---|---|---|
| `primary` | Indigo-600 | Main CTA, brand action, AI-feature, save (owner context) |
| `success` | Emerald-600 | Confirm positive (complete payment, mark paid), cashier role |
| `warning` | Amber-500 | Rare — attention action (prefer soft) |
| `destructive` | Rose-600 | Delete, void, close shift, admin role |
| `neutral` | Slate-900 | Default dark CTA when `primary` taken |

### 3.2 SOFT (Medium Emphasis — 5 variants)

| Variant | Color | Use case |
|---|---|---|
| `primarySoft` | Indigo-50 | Secondary CTA accompanying `primary` |
| `successSoft` | Emerald-50 | Positive secondary (e.g. "Mark as Received") |
| `warningSoft` | Amber-50 | Attention secondary ("Review before publish") |
| `destructiveSoft` | Rose-50 | Destructive preview ("Remove" before Delete confirm) |
| `neutralSoft` | Slate-50 | Subtle secondary |

### 3.3 OUTLINE / GHOST / LINK (Low Emphasis — 3 variants)

| Variant | Style | Use case |
|---|---|---|
| `outline` | Slate border, transparent bg | Cancel, modal "Batal", reset filter |
| `ghost` | No border, hover bg | Toolbar action, close X, icon buttons |
| `link` | Inline text link, no padding | Navigation link, "Lupa password?", footer |

---

## 4. Size Matrix

### 4.1 Rectangular (text + optional icon)

| Size | Height | Padding-X | Text | Icon | Use case |
|---|---:|---:|---|---:|---|
| `xs` | 28px | 10px | 11px | 12px | Dense toolbars, table row actions |
| `sm` | 32px | 12px | 12px | 14px | Secondary actions, chips |
| `md` | 36px | 16px | 14px | 16px | **Default** |
| `lg` | 44px | 20px | 14px | 16px | Modal footer CTA, primary forms |
| `xl` | 48px | 24px | 16px | 20px | Hero CTA, login submit |

### 4.2 Icon-only (square, h = w)

Gunakan `{ icon: true }`:

| Size | Width × Height | Icon | Touch AAA |
|---|---:|---:|:---:|
| `xs` | 28×28 | 12px | ❌ |
| `sm` | 32×32 | 14px | ❌ |
| `md` | 36×36 | 16px | ❌ |
| `lg` | 44×44 | 16px | ✅ |
| `xl` | 48×48 | 20px | ✅ |

### 4.3 Touch Target Policy (WCAG 2.5.5 AAA)

WCAG 2.1 AAA mensyaratkan touch target **minimum 44×44px** (iOS HIG juga 44pt, Material 48dp). Hanya `lg` dan `xl` lolos.

**Policy:**

| Context | Minimum Size | Rationale |
|---|---|---|
| **Mobile / touch devices** (viewport ≤ 768px) | **`lg`** (44px) | Finger tap accuracy |
| **Desktop mouse**, spacious area (modal footer, hero, form) | **`lg`** (44px) | User expectation |
| **Desktop mouse**, compact (sidebar, header toolbar) | `md` (36px) | Spacing compensates |
| **Table row actions** (dense) | `sm` (32px) atau `xs` (28px) | Acceptable **only if** spacing ≥ 4px antar target |
| **Chips / filter pills** | `sm` (32px) | Acceptable — tap-accidentally-wrong ke neighbor tidak destructive |

**Hard rules:**
- `xs` (28px) & `sm` (32px) **DILARANG untuk destructive actions** di mobile — gunakan min `lg`.
- Icon-only button **di toolbar mobile** min `lg` (44×44).
- Jika harus pakai `md` atau lebih kecil di mobile, wajib `min-h-[44px] min-w-[44px]` dengan padding transparent hit-area extension:
  ```tsx
  <button className={cn(btn("ghost", "sm", { icon: true }), "min-h-[44px] min-w-[44px]")}>
    <X />
  </button>
  ```
  Atau pakai helper `A11Y.tapTarget` dari `lib/a11y.ts`.

### 4.4 Responsive Sizing (mobile-up)

Default pattern: **pakai 1 size untuk semua viewport**. Responsive sizing hanya bila user journey berbeda (e.g., hero CTA yang jauh lebih prominent di mobile).

**Pattern 1 — `clsx` split:**
```tsx
<button className={cn(
  BTN.base,
  BTN.variant.primary,
  "h-11 px-5 text-sm md:h-9 md:px-4 md:text-sm"   // lg → md
)}>
```

**Pattern 2 — Helper dengan responsive size key (future):**
```tsx
// Proposed future API (not yet implemented):
<button className={btn("primary", { base: "lg", md: "md" })}>
```

**Common responsive recipes:**
| Use case | Mobile | Desktop | Notes |
|---|---|---|---|
| Hero login CTA | `xl` fullWidth | `lg` | Shrink but keep prominence |
| Modal footer | `lg` | `md` | Mobile needs bigger touch |
| Table row action | `md` icon-only | `sm` icon-only | Mobile needs tap accuracy |
| Header icon buttons | `lg` icon-only | `md` icon-only | Same reason |
| Secondary form actions | `md` | `sm` | Desktop can be denser |

**Rule of thumb:** Saat ragu — **larger on mobile, smaller on desktop**. Never reverse.

### 4.5 Density Rules

Berapa button boleh ada per row/group?

| Context | Max Buttons | Min Spacing | Recommended Size |
|---|:---:|:---:|---|
| **Table row actions** | 3 | 4px (`gap-1`) | `xs` icon-only |
| **Toolbar segmented** | 5 | 4px (`gap-1`) | `sm` square |
| **Modal footer** | 2–3 | 8px (`gap-2`) | `md` / `lg` |
| **Form inline actions** | 2 | 8px (`gap-2`) | `md` |
| **Card header menu** | 1 (kebab menu) | — | `sm` icon ghost |
| **FAB stack** | 1 primary + 2 secondary | 12px (`gap-3`) | `lg` circular |
| **Filter chip row** | 4–6 | 8px (`gap-2`) | `sm` |

**Anti-pattern: "Christmas tree"** — lebih dari 3 primary/solid button bersebelahan. Pilih 1 primary, rest soft/outline/ghost (lihat §2.7).

**Anti-pattern: Mixed sizes** — jangan campur `xs`/`md`/`lg` dalam 1 row tanpa alasan visual hierarchy. Buttons dalam 1 group biasanya **satu size**.

### 4.6 Tap Target Escape Hatch

Untuk dense UI yang secara visual butuh button kecil tapi target harus 44px:

```tsx
import { A11Y } from "@/app/lib/a11y";

// Visual xs, tap target 44px (extra padding hit area):
<button className={cn(
  btn("ghost", "xs", { icon: true }),
  A11Y.tapTarget,           // min-h-[44px] min-w-[44px]
)}>
  <X />
</button>
```

Visual tetap compact (28px), tapi touch area 44×44 — kompromi antara density + a11y.

---

## 5. Usage Examples

### 5.1 Primary CTA dengan icon

```tsx
import { btn } from "@/app/lib/buttons";
import { Save } from "lucide-react";

<button className={btn("primary", "lg")}>
  <Save /> Simpan Transaksi
</button>
```

### 5.2 Modal Footer (cancel + confirm)

```tsx
<div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
  <button className={btn("outline", "md")}>Batal</button>
  <button className={btn("primary", "md")}>Simpan</button>
</div>
```

### 5.3 Destructive Confirmation

```tsx
<div className="flex items-center justify-end gap-2">
  <button className={btn("outline", "md")}>Batal</button>
  <button className={btn("destructive", "md")}>
    <Trash2 /> Hapus Permanen
  </button>
</div>
```

### 5.4 Icon-only Close Button

```tsx
<button className={btn("ghost", "md", { icon: true })}>
  <X />
</button>
```

### 5.5 Full-width Hero CTA (login, checkout)

```tsx
<button className={btn("primary", "xl", { fullWidth: true })}>
  Lanjutkan ke Pembayaran
</button>
```

### 5.6 Button Group (segmented toolbar)

```tsx
<div className="inline-flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
  <button className={btn("ghost", "sm", { square: true })}>Hari Ini</button>
  <button className={btn("primarySoft", "sm", { square: true })}>Minggu</button>
  <button className={btn("ghost", "sm", { square: true })}>Bulan</button>
</div>
```

### 5.7 Circular Icon Button (FAB-like)

```tsx
<button className={btn("primary", "lg", { icon: true, pill: true })}>
  <Plus />
</button>
```

### 5.8 Link Button (navigation)

```tsx
<button className={btn("link", "sm")}>
  Lupa password?
</button>
```

### 5.9 Loading State Pattern

```tsx
import { Loader2 } from "lucide-react";

<button
  className={btn("primary", "md")}
  disabled={isLoading}
  aria-busy={isLoading}                     // announce to screen reader
>
  {isLoading ? <Loader2 className="animate-spin" /> : <Save />}
  {isLoading ? "Menyimpan..." : "Simpan"}
</button>
```

**Spinner size otomatis mengikuti button size** via `[&_svg]:size-*` di `BTN.size`:

| Button Size | Spinner Size |
|---|---:|
| `xs` | 12px |
| `sm` | 14px |
| `md` | 16px |
| `lg` | 16px |
| `xl` | 20px |

Jangan override `<Loader2 className="size-6">` secara manual — biarkan `BTN.size` handle.

**Important:** Tambah `aria-busy={isLoading}` untuk screen reader announcement. Text label juga wajib berubah (`"Simpan"` → `"Menyimpan..."`) supaya sighted users juga dapat feedback.

### 5.10 Role-based CTA

```tsx
import { C } from "@/app/lib/colors";

// Owner portal login
<button className={cn(BTN.base, BTN.size.xl, BTN.fullWidth, C.roleOwner.solid, "text-white shadow-lg shadow-indigo-100")}>
  Masuk sebagai Owner
</button>
```

### 5.11 Split Button (primary action + dropdown caret)

Split button = 1 main action + dropdown untuk variasi action terkait. Contoh: "Export ▾" dengan options (CSV / Excel / PDF).

```tsx
import { btn, BTN } from "@/app/lib/buttons";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/app/components/ui/dropdown-menu";
import { Download, ChevronDown } from "lucide-react";

<div className="inline-flex rounded-xl shadow-sm">
  {/* Main action */}
  <button
    className={cn(
      BTN.base, BTN.size.md, BTN.variant.primary,
      "rounded-r-none border-r border-indigo-700/40"     // flat right edge
    )}
    onClick={handleExportCSV}
  >
    <Download /> Export CSV
  </button>

  {/* Dropdown trigger */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        className={cn(
          BTN.base, BTN.size.md, BTN.variant.primary,
          "rounded-l-none px-2"                          // flat left edge, narrow
        )}
        aria-label="Opsi export lainnya"
      >
        <ChevronDown />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={handleExportExcel}>Export Excel</DropdownMenuItem>
      <DropdownMenuItem onClick={handleExportPDF}>Export PDF</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

**Rules:**
- Main action = most-used option (e.g., CSV kalau 70% user pilih CSV).
- Chevron button ≤ main button height; aria-label wajib.
- Same variant untuk kedua button (primary/primarySoft/outline, dll).
- Use `rounded-r-none` + `rounded-l-none` untuk seamless join.
- **Jangan** pakai 2 primary solid berdampingan tanpa split pattern (itu Christmas tree).

### 5.12 Toggle Button (aria-pressed)

Toggle = stateful button. Saat "on", tampil soft/filled; saat "off", ghost/outline.

```tsx
import { btn } from "@/app/lib/buttons";
import { Star } from "lucide-react";

const [favorited, setFavorited] = useState(false);

<button
  className={btn(favorited ? "primarySoft" : "ghost", "md")}
  onClick={() => setFavorited(v => !v)}
  aria-pressed={favorited}                              // wajib
  aria-label={favorited ? "Hapus dari favorit" : "Tambah ke favorit"}
>
  <Star className={favorited ? "fill-current" : ""} />
  {favorited ? "Tersimpan" : "Simpan"}
</button>
```

**Rules:**
- `aria-pressed={boolean}` **WAJIB** — screen reader announces state.
- Variant change between "on" / "off" harus kontras (indigo-50 vs transparent).
- Optional: icon berubah (outline Star → filled Star) untuk visual clarity.
- Jangan override jadi `aria-checked` — itu untuk radio/checkbox semantic.

### 5.13 Button dengan Badge / Counter

Composite: button + numeric indicator di corner.

```tsx
import { btn } from "@/app/lib/buttons";
import { Bell } from "lucide-react";

<button
  className={cn(btn("ghost", "md", { icon: true }), "relative")}
  aria-label={`Notifikasi (${unreadCount} belum dibaca)`}
>
  <Bell />
  {unreadCount > 0 && (
    <span
      className={cn(
        "absolute -top-0.5 -right-0.5",
        "min-w-[18px] h-[18px] px-1 rounded-full",
        "bg-rose-500 text-white text-[10px] font-bold",
        "flex items-center justify-center",
        "ring-2 ring-white dark:ring-slate-900"
      )}
      aria-hidden="true"   // count already in aria-label
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  )}
</button>
```

**Rules:**
- Badge anchored via `relative` parent + `absolute -top-0.5 -right-0.5`.
- Badge color = rose (alert) / indigo (info) — contrast dengan button bg.
- `ring-2 ring-white` = separator dari button edge.
- Max display "99+" — jangan tampilkan 4-digit number.
- **A11y:** count harus ada di `aria-label` parent (badge `aria-hidden="true"`).
- Untuk inline counter (bukan corner badge): pakai `<span>` in-flow dengan spacing.

**Inline counter variant:**
```tsx
<button className={btn("outline", "md")}>
  <Filter /> Filter
  <span className="ml-1 px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-xs dark:bg-indigo-900/40 dark:text-indigo-300">
    3
  </span>
</button>
```

### 5.14 FAB (Floating Action Button) + Positioning

FAB = primary action yang selalu visible, floating di viewport corner. Umum untuk "New Transaction", "Add Product".

```tsx
import { btn } from "@/app/lib/buttons";
import { Plus } from "lucide-react";

{/* Bottom-right fixed FAB */}
<button
  className={cn(
    btn("primary", "lg", { icon: true, pill: true }),
    "fixed bottom-6 right-6 z-40",
    "shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40",
    "hover:-translate-y-0.5 transition-all"
  )}
  aria-label="Tambah transaksi baru"
>
  <Plus />
</button>
```

**Position tiers:**
| Location | Classes | Use case |
|---|---|---|
| Bottom-right (default) | `fixed bottom-6 right-6 z-40` | Mobile primary action |
| Bottom-center | `fixed bottom-6 left-1/2 -translate-x-1/2 z-40` | Main CTA, narrow screens |
| Bottom-left (rare) | `fixed bottom-6 left-6 z-40` | Right-handed users? Localized |
| With bottom nav | `fixed bottom-20 right-6 z-40` | Above tab bar / sticky footer |

**Rules:**
- **Size:** minimum `lg` (44px) for AAA touch target.
- **z-index:** `z-40` (above content, below modals at `z-50`).
- **Shadow:** colored elevation (`shadow-indigo-500/30`) untuk depth cue.
- **Hover:** subtle `-translate-y-0.5` untuk tactile feedback.
- **Jangan 2 FAB** — itu 2 primary CTA in view (violates hierarchy).
- **FAB stack** (1 main + expanded secondary) harus collapsible, bukan permanent 3-FAB.
- Mobile: pastikan tidak overlap bottom sheet/keyboard area.
- `aria-label` wajib (icon-only).

**Extended FAB with label (desktop):**
```tsx
<button
  className={cn(
    btn("primary", "lg", { pill: true }),
    "fixed bottom-6 right-6 z-40 shadow-lg shadow-indigo-500/30"
  )}
>
  <Plus /> Tambah Produk
</button>
```

### 5.15 Segmented Control with Keyboard Nav

Extend §5.6 — proper toggle group dengan arrow key navigation + `aria-pressed`.

**Simple tablist pattern (preferred — if tabs semantic fits):**
```tsx
// Pakai shadcn Tabs (handles keyboard automatically) — see TABS.md
```

**Manual segmented control (toggle-based, not tablist):**
```tsx
import { btn } from "@/app/lib/buttons";

const OPTIONS = ["Hari Ini", "Minggu", "Bulan"] as const;
const [period, setPeriod] = useState<typeof OPTIONS[number]>("Minggu");

<div
  role="group"
  aria-label="Filter periode"
  className="inline-flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl"
>
  {OPTIONS.map(opt => {
    const active = period === opt;
    return (
      <button
        key={opt}
        onClick={() => setPeriod(opt)}
        aria-pressed={active}
        className={btn(active ? "primarySoft" : "ghost", "sm", { square: true })}
      >
        {opt}
      </button>
    );
  })}
</div>
```

**Rules:**
- `role="group"` + `aria-label` pada wrapper (describe purpose).
- Setiap button `aria-pressed={boolean}` (not `aria-selected` — that's for tablist).
- Active variant = soft (primarySoft), inactive = ghost.
- Jika butuh radio semantic (mutually exclusive, ≥ 3 options, keyboard Arrow nav) — pakai **Radix ToggleGroup** atau native `<input type="radio">` visually styled.
- Keyboard: Tab masuk group, dalam group Space/Enter toggle per button. Untuk Arrow Left/Right nav antar segment, pakai Radix ToggleGroup.

### 5.16 Icon Button with Tooltip (accessibility)

Icon-only button **wajib** ada label. Ideal: `aria-label` + visible tooltip saat hover.

```tsx
import { btn } from "@/app/lib/buttons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { Trash2 } from "lucide-react";

<Tooltip>
  <TooltipTrigger asChild>
    <button
      className={btn("ghost", "sm", { icon: true })}
      aria-label="Hapus produk"
    >
      <Trash2 />
    </button>
  </TooltipTrigger>
  <TooltipContent>Hapus produk</TooltipContent>
</Tooltip>
```

**Rules:**
- `aria-label` dulu (for screen reader + fallback).
- Tooltip = **visual reinforcement** untuk sighted users.
- Same text di `aria-label` dan tooltip (no divergence).
- Jangan pakai native `title="..."` attribute (see `OVERLAYS.md §5.3`).

---

## 6. 🚫 Prohibited Patterns

| Pattern | Why | Replacement |
|---|---|---|
| `<button className="bg-indigo-600 h-10 rounded-md">` | Hand-rolled button tidak konsisten | `btn("primary", "md")` |
| `rounded-md` atau `rounded-lg` untuk button utama | Radius harus 12px (`rounded-xl`) | Pakai `btn(...)` default radius |
| `font-medium` untuk button text | Harus `font-bold` per spec | Pakai `btn(...)` yang sudah bake-in |
| `uppercase tracking-widest` di button | Typography v1.1 ban uppercase untuk button | Gunakan Title Case, `btn(...)` sudah tracking-tight |
| Multiple `primary` solid di satu view | Emphasis hierarchy pecah | Max 1 primary solid, sisanya soft/outline/ghost |
| `<button className="bg-red-600">` | Stray color | `btn("destructive", ...)` |
| `<button onClick={...}>X</button>` (no className) | Butuh minimal ghost | `btn("ghost", "md", { icon: true })` |
| Button tanpa focus ring | A11y fail | `btn(...)` sudah include ring |
| Button tanpa disabled state handling | A11y fail | `btn(...)` sudah include `disabled:*` |
| Mixing `<Button>` shadcn + hand-rolled `<button>` di file sama | Inconsistent | Pilih salah satu per file (prefer `btn()` untuk branded CTA) |

---

## 7. Coexistence dengan Shadcn `<Button>`

Shadcn `button.tsx` (`@/app/components/ui/button.tsx`) tetap dipertahankan untuk:

- **Internal shadcn component** (Dialog close, DropdownMenu items, Pagination, dsb) — biarkan pakai `<Button>`.
- **Third-party integrations** yang expect Shadcn props.

Untuk **custom CTA brand-colored InsightSphere**, pakai `btn()` helper:
- Indigo CTA, emerald confirm, rose destructive — semua via `btn()`.
- Tidak perlu override shadcn variant `default` (yang warnanya slate-900).

Future enhancement (opsional): Rewrite `button.tsx` agar internal-nya pakai `btn()` di balik layar. Tapi untuk sekarang **coexist** is fine.

---

## 8. Migration Guide

Scope migrasi: **~376 button instances** (265 `<Button>` + 111 hand-rolled `<button bg-*>`).

### Prioritas

1. **Hand-rolled `<button bg-indigo-600/emerald-600/rose-600>` CTA** → convert ke `btn(variant, size)` (~111 instances)
2. **Shadcn `<Button variant="default">`** yang di-override dengan `className="bg-indigo-600"` → ganti ke `btn("primary", ...)`
3. **Modal footer buttons** — standardize "Batal" ke `btn("outline", "md")` dan primary ke `btn("primary", "md")`
4. **Icon buttons** (close X, hamburger, dsb) → `btn("ghost", size, { icon: true })`

### Checklist per file

- [ ] Ganti manual `<button className="bg-{color}-600 h-... px-...">` → `btn(variant, size)`
- [ ] Hapus `font-medium`/`uppercase`/`tracking-widest` (sudah handled via `btn` base)
- [ ] Hapus duplicate `active:scale-*`, `transition-*`, `focus-visible:*` (sudah handled via `btn` base)
- [ ] Hapus `disabled:opacity-50` manual (sudah handled)
- [ ] Radius: pastikan tidak ada `rounded-md`/`rounded-lg` kecuali pakai `{ square: true }`
- [ ] Cek max 1 `primary` solid per view

### Per-page priority (sama dengan COLORS.md §6)

1. **DashboardPage** — traffic tertinggi
2. **KasirPage** + POS sub-components (banyak modal payment/refund)
3. **InventarisPage** + inventory modals
4. **TransactionHistoryPage**
5. **LaporanPage**, **XAIPage**, **PrediksiStokPage**
6. **CashManagementPage**, **StockMovementPage**
7. **UserManagementPage**, **PengaturanPage**, **UserProfilePage**
8. **MLOpsDashboardPage**
9. **Shared** (`Header.tsx`, `Sidebar.tsx`, `NotificationCenter.tsx`)

### Code review rubric

1. Hand-rolled `<button className="bg-{color}-600 ...">` tanpa `btn()`? → **request change**
2. `rounded-md` atau `rounded-lg` di button utama? → **request change**
3. `uppercase tracking-widest` pada button? → **reject** (violates Typography v1.1)
4. Multiple `primary` solid di 1 view? → **request change**
5. Button tanpa focus ring handling? → **reject**
6. Button warna tidak sesuai semantic (e.g. `destructive` untuk save)? → **reject**
7. Campuran `<Button>` shadcn + `<button>` hand-rolled di file sama tanpa alasan jelas? → **request change**

---

## 9. Future Enhancements

- [ ] Rewrite `components/ui/button.tsx` agar internal-nya pakai `btn()` helper — satu sumber kebenaran
- [ ] Storybook page untuk live preview semua 13 variants × 5 sizes × states
- [ ] Loading prop built-in (`<Button loading>` auto-adds spinner + disables)
- [ ] `asChild` support untuk `<Link>` wrapping (radix-slot pattern)
- [ ] Tooltip auto-attach untuk icon-only buttons (a11y label)
- [ ] ESLint rule: warn jika `<button className="bg-*-600 ...">` tanpa `btn()` helper
- [ ] Button group component (`<BtnGroup>`) untuk segmented toolbar pattern

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
