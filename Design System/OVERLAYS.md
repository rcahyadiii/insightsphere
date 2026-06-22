# 💬 InsightSphere Overlays System (Popover + Tooltip + HoverCard + DropdownMenu)

> **Single source of truth untuk floating overlays: popover, tooltip, hover card, dropdown menu, context menu.**
> Versi: 1.0 — 23 April 2026
> Implementasi token: `frontend/src/app/lib/overlays.ts`
> Companion specs: `MODALS.md`, `DRAWERS.md`, `NAVIGATION.md`, `COLORS.md`, `MOTION.md`

---

## 1. Overview

Audit menemukan fakta penting:

| Primitive | File | App Code Usage |
|---|---|:---:|
| `<Popover>` | `ui/popover.tsx` | **0** |
| `<Tooltip>` | `ui/tooltip.tsx` | **1** (hampir tidak dipakai) |
| `<HoverCard>` | `ui/hover-card.tsx` | **0** |
| `<DropdownMenu>` | `ui/dropdown-menu.tsx` | **0** |
| `<ContextMenu>` | `ui/context-menu.tsx` | **0** |

**Shadcn primitives ada lengkap** tapi nyaris tidak diadopsi. Sebaliknya:
- **6 native `title="..."` attributes** — no styling, OS-dependent rendering
- **3+ hand-rolled floating panels** dengan `absolute z-10/z-20` + manual state
- **Header store selector** 60 LOC custom keyboard nav (seharusnya `<DropdownMenu>`)
- **NotificationCenter panel** hand-rolled (seharusnya `<Popover>`)

Policy ini memformalkan: **kapan pakai yang mana + cara pakai + prohibited hand-rolled**.

**Note:** 11 `<Tooltip>` yang ada di codebase = **Recharts `<Tooltip>`** (chart tooltip), bukan UI Tooltip. Kedua concept distinct.

---

## 2. Mental Model: Kapan Pakai Yang Mana

| Komponen | Trigger | Content | Dismiss | Use case |
|---|---|---|---|---|
| **Tooltip** | Hover/focus | Text only (1-2 sentences) | Auto on leave | Label icon button, explain abbreviation, show full value for truncated text |
| **HoverCard** | Hover/focus | Rich content (avatar, metrics, preview) | Auto on leave | User profile preview, product quick view, link preview |
| **Popover** | Click | Rich content (form, filters, date picker) | Click outside / Esc | Filter panel, date picker, inline form, settings quickie |
| **DropdownMenu** | Click | List of actions (menu items) | Click item / outside / Esc | Context actions, sort menu, user menu, more actions "⋯" |
| **ContextMenu** | Right-click | List of actions | Click item / outside / Esc | Advanced: right-click on row, table cell |

### 2.1 Decision Tree
```
Need to show extra info/actions?
├─ Just a label/hint? ────────── Tooltip
├─ Preview of something? ──────── HoverCard
├─ Inline form/filter/picker? ──── Popover
├─ Menu of actions? ───────────── DropdownMenu
└─ Right-click menu? ───────────── ContextMenu
```

### 2.2 Tooltip vs HoverCard (Sering Bingung)
| | Tooltip | HoverCard |
|---|---|---|
| Content | Text only | Rich JSX (avatar, layout, multiple elements) |
| Size | Small (max-w-xs) | Medium (w-64/w-80) |
| Delay | Fast (~300ms) | Slower (~500-700ms) |
| Typography | `text-xs` | `text-sm` + structure |

**Rule:** If content is > 1 sentence atau butuh layout → HoverCard. Else → Tooltip.

### 2.3 Popover vs Modal
| | Popover | Modal |
|---|---|---|
| Focus | Partial (page still visible) | Full (backdrop blocks page) |
| Context | Inline near trigger | Center/stage |
| Weight | Light | Heavy (force decision) |

**Rule:** Quick inline task → Popover. Multi-step / important decision → Modal. Lihat `MODALS.md`.

---

## 3. Design Principles

### 3.1 Pakai Shadcn Primitives — Selalu
✅ `<Popover>`, `<Tooltip>`, `<HoverCard>`, `<DropdownMenu>`, `<ContextMenu>` sudah handle:
- Positioning (via Radix/Floating UI)
- Escape key dismiss
- Click-outside dismiss
- Focus management
- ARIA attributes
- Keyboard navigation (arrow keys di menu, Tab di popover)
- Portal rendering (escape overflow)

❌ **DO NOT hand-roll** dengan `absolute + z-50 + useRef + manual listeners` — reinvents wheel.

### 3.2 Delay Tiers (Tooltip/HoverCard)
| Tier | Delay | Use case |
|---|:---:|---|
| `instant` | `0ms` | Critical info (error state) |
| **`default`** | **`300ms`** | **Tooltip standard** |
| `slow` | `500-700ms` | HoverCard (heavier content) |

### 3.3 Max Width
| Component | Max Width |
|---|---|
| Tooltip | `max-w-xs` (~320px) |
| HoverCard | `w-64` or `w-80` (256/320px) |
| Popover | `w-72` to `w-96` (288–384px) depending on content |
| DropdownMenu | `w-44` to `w-56` (176–224px) menu standard |

### 3.4 Surface + Elevation
Sesuai `ELEVATION.md`:
```
Popover/HoverCard/DropdownMenu content:
  bg-white dark:bg-slate-900
  border border-slate-200 dark:border-slate-800
  shadow-md
  rounded-xl
```

Tooltip berbeda — dark bg selalu (even in light mode) untuk contrast:
```
Tooltip content:
  bg-slate-900 dark:bg-slate-100
  text-white dark:text-slate-900
  text-xs font-medium
  px-2.5 py-1.5
  rounded-lg
  shadow-md
```

### 3.5 Animation
Sesuai `MOTION.md`:
- Enter: `zoom-in-95 fade-in-0 duration-200`
- Exit: `zoom-out-95 fade-out-0 duration-150`
- Radix primitives punya built-in `data-[state=open]` + `data-[state=closed]` variants.

### 3.6 Z-index Standard
```
z-30  — sticky headers
z-40  — Header bar
z-50  — Overlays (Popover, Tooltip, DropdownMenu, Modal, Drawer, Toast)
```
Semua floating overlay di `z-50` (Radix default). **Jangan bikin z-index baru**.

### 3.7 Arrow Indicator (Optional)
Arrow kecil menunjuk ke trigger (optional, visual polish):
- Tooltip: arrow recommended
- Popover/DropdownMenu: arrow optional (biasanya OK tanpa)
- HoverCard: arrow optional

### 3.8 Portal Rendering (Default On)
Semua overlay render via `Portal` (mount ke `document.body`) untuk escape container overflow. Shadcn default, don't override.

---

## 4. Popover Spec

### 4.1 Anatomy
```
[Trigger] ← click
    │
    ▼
┌─────────────────┐
│  Content        │  ← rounded-xl + shadow-md + border
│  ┌──────────┐   │     bg-white/slate-900 dark
│  │ Form     │   │
│  │ Inputs   │   │
│  └──────────┘   │
│  [Cancel][Save] │
└─────────────────┘
```

### 4.2 Structure Tokens
```
POPOVER.content      // rounded-xl + bg-white dark:bg-slate-900 + border + shadow-md + p-4 + outline-none
POPOVER.size.sm      // w-64
POPOVER.size.md      // w-72 (default)
POPOVER.size.lg      // w-96
POPOVER.arrow        // fill-white dark:fill-slate-900 (shadcn default)
POPOVER.animation    // data-[state=open]:animate-in data-[state=closed]:animate-out zoom-in-95 zoom-out-95 fade-in-0 fade-out-0
```

### 4.3 Usage: Filter Panel
```tsx
import { Popover, PopoverTrigger, PopoverContent } from "@/app/components/ui/popover";

<Popover>
  <PopoverTrigger asChild>
    <button className={btn("outline", "md")}>
      <Filter className="size-4" /> Filter
    </button>
  </PopoverTrigger>
  <PopoverContent className={cn(POPOVER.content, POPOVER.size.md)}>
    <h4 className="text-sm font-bold mb-3">Filter Produk</h4>
    <div className="space-y-3">
      <div>
        <label className={LABEL.base}>Kategori</label>
        <Select ...>...</Select>
      </div>
      <div>
        <label className={LABEL.base}>Rentang Harga</label>
        <Slider ... />
      </div>
    </div>
    <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
      <button className={cn(btn("outline", "sm"), "flex-1")}>Reset</button>
      <button className={cn(btn("primary", "sm"), "flex-1")}>Terapkan</button>
    </div>
  </PopoverContent>
</Popover>
```

### 4.4 Usage: Date Picker
```tsx
<Popover>
  <PopoverTrigger asChild>
    <button className={cn(btn("outline", "md"), "justify-start")}>
      <Calendar className="size-4" />
      {date ? format(date, "dd MMM yyyy") : "Pilih tanggal"}
    </button>
  </PopoverTrigger>
  <PopoverContent className={cn(POPOVER.content, "p-0")} align="start">
    <CalendarPicker mode="single" selected={date} onSelect={setDate} />
  </PopoverContent>
</Popover>
```

---

## 5. Tooltip Spec

### 5.1 Dark Surface (Contrast-First)
Tooltip pakai `bg-slate-900 text-white` **selalu** (inversed dalam dark mode jadi `bg-slate-100 text-slate-900`). Alasan: tooltip harus kontras tinggi dengan UI sekitar, bukan ngikut theme.

### 5.2 Structure Tokens
```
TOOLTIP.provider     // delayDuration prop (300ms default)
TOOLTIP.content      // bg-slate-900 dark:bg-slate-100 + text-white dark:text-slate-900 + text-xs font-medium + px-2.5 py-1.5 + rounded-lg + shadow-md + max-w-xs
TOOLTIP.arrow        // fill-slate-900 dark:fill-slate-100
TOOLTIP.kbd          // ml-1.5 + px-1 + rounded + bg-white/20 + text-[10px] + font-mono (optional keyboard shortcut)
```

### 5.3 Provider Setup (Once di Layout)
```tsx
// layout.tsx
import { TooltipProvider } from "@/app/components/ui/tooltip";

<TooltipProvider delayDuration={300}>
  {children}
</TooltipProvider>
```

### 5.4 Usage: Icon Button Label
```tsx
import { Tooltip, TooltipTrigger, TooltipContent } from "@/app/components/ui/tooltip";

<Tooltip>
  <TooltipTrigger asChild>
    <button className={HEADER.iconButton}>
      <Bell className="size-5" />
    </button>
  </TooltipTrigger>
  <TooltipContent className={TOOLTIP.content}>
    Notifikasi
  </TooltipContent>
</Tooltip>
```

### 5.5 Usage: Dengan Keyboard Shortcut
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <button onClick={openCmdPalette}>
      <Search className="size-5" />
    </button>
  </TooltipTrigger>
  <TooltipContent className={TOOLTIP.content}>
    Cari
    <kbd className={TOOLTIP.kbd}>Ctrl K</kbd>
  </TooltipContent>
</Tooltip>
```

### 5.6 Usage: Explain Abbreviation/Metric
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <span className="underline decoration-dotted cursor-help">
      MAPE
    </span>
  </TooltipTrigger>
  <TooltipContent className={TOOLTIP.content}>
    Mean Absolute Percentage Error — ukuran akurasi forecast (lebih rendah = lebih akurat)
  </TooltipContent>
</Tooltip>
```

### 5.7 Tooltip vs Recharts Tooltip (Jangan Bingung!)
```tsx
// UI Tooltip (dari shadcn) — untuk hover button/icon/text
import { Tooltip } from "@/app/components/ui/tooltip";

// Recharts Tooltip — untuk hover di chart (bar/line/pie)
import { Tooltip as RechartsTooltip } from "recharts";
```

Styling untuk Recharts Tooltip dibahas di `CHARTS.md` (future spec). Jangan pakai UI Tooltip di dalam Recharts Cartesian.

---

## 6. HoverCard Spec

### 6.1 Anatomy
Preview rich content on hover — typically profile card, product preview, link preview.

### 6.2 Structure Tokens
```
HOVER_CARD.content     // same as Popover (bg-white/slate-900 + border + shadow-md + rounded-xl + p-4 + w-64 or w-80)
HOVER_CARD.openDelay   // 500ms (slower than tooltip)
HOVER_CARD.closeDelay  // 200ms
```

### 6.3 Usage: User Profile Preview
```tsx
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/app/components/ui/hover-card";

<HoverCard openDelay={500}>
  <HoverCardTrigger asChild>
    <button className="flex items-center gap-2">
      <Avatar ... />
      <span>Sarah Wijaya</span>
    </button>
  </HoverCardTrigger>
  <HoverCardContent className={cn(HOVER_CARD.content, "w-64")}>
    <div className="flex items-start gap-3">
      <Avatar src={user.photo} className="size-12" />
      <div>
        <h4 className="text-sm font-bold">Sarah Wijaya</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">Kasir · Shift Pagi</p>
        <div className="mt-2 flex items-center gap-3 text-xs">
          <span>📅 Bergabung Jun 2024</span>
          <span>🎯 98% target</span>
        </div>
      </div>
    </div>
  </HoverCardContent>
</HoverCard>
```

### 6.4 Usage: Product Quick View
```tsx
<HoverCard>
  <HoverCardTrigger asChild>
    <button className="text-indigo-600 underline">
      {product.name}
    </button>
  </HoverCardTrigger>
  <HoverCardContent className={cn(HOVER_CARD.content, "w-80")}>
    <img src={product.image} className="rounded-lg mb-3" />
    <h4 className="text-sm font-bold">{product.name}</h4>
    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{product.description}</p>
    <div className="mt-3 flex items-center justify-between">
      <span className="font-data text-lg font-bold">Rp {product.price.toLocaleString()}</span>
      <Badge variant="success">Stok: {product.stock}</Badge>
    </div>
  </HoverCardContent>
</HoverCard>
```

---

## 7. DropdownMenu Spec

### 7.1 Anatomy
```
[Trigger ▾] ← click
      │
      ▼
┌─────────────────┐
│ Label           │  ← section label
│ ───────────── │
│ ⚙ Item 1        │
│ 📋 Item 2       │
│ ───────────── │  ← separator
│ 🗑 Destructive   │  ← destructive variant
└─────────────────┘
```

### 7.2 Structure Tokens
```
DROPDOWN.trigger        // button style (use btn() tokens)
DROPDOWN.content        // bg-white dark:bg-slate-900 + border + shadow-md + rounded-xl + p-1 + min-w-[180px]
DROPDOWN.item.base      // flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium cursor-pointer outline-none
DROPDOWN.item.inactive  // text-slate-700 dark:text-slate-300 + hover/focus:bg-slate-100 dark:focus:bg-slate-800
DROPDOWN.item.destructive // text-rose-600 dark:text-rose-400 + hover/focus:bg-rose-50 dark:focus:bg-rose-900/30
DROPDOWN.item.disabled  // opacity-50 pointer-events-none
DROPDOWN.item.icon      // size-4 shrink-0
DROPDOWN.label          // px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400
DROPDOWN.separator      // -mx-1 my-1 h-px bg-slate-100 dark:bg-slate-800
DROPDOWN.shortcut       // ml-auto text-xs text-slate-400 dark:text-slate-500 font-mono
```

**Note:** `DROPDOWN.label` adalah **satu-satunya** spot yang boleh uppercase di design system (per Typography v1.1 §3.3 exception: super-small utility label).

### 7.3 Usage: More Actions Menu
```tsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/app/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button className={cn(btn("ghost", "sm"), "size-8 p-0")}>
      <MoreHorizontal className="size-4" />
    </button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className={DROPDOWN.content} align="end">
    <DropdownMenuLabel className={DROPDOWN.label}>Aksi</DropdownMenuLabel>
    <DropdownMenuItem className={cn(DROPDOWN.item.base, DROPDOWN.item.inactive)}>
      <Eye className={DROPDOWN.item.icon} /> Lihat Detail
    </DropdownMenuItem>
    <DropdownMenuItem className={cn(DROPDOWN.item.base, DROPDOWN.item.inactive)}>
      <Pencil className={DROPDOWN.item.icon} /> Edit
    </DropdownMenuItem>
    <DropdownMenuItem className={cn(DROPDOWN.item.base, DROPDOWN.item.inactive)}>
      <Copy className={DROPDOWN.item.icon} /> Duplikat
    </DropdownMenuItem>
    <DropdownMenuSeparator className={DROPDOWN.separator} />
    <DropdownMenuItem className={cn(DROPDOWN.item.base, DROPDOWN.item.destructive)}>
      <Trash2 className={DROPDOWN.item.icon} /> Hapus
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 7.4 Usage: User Menu (Header Avatar)
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
      <Avatar src={user.avatar} className="size-8" />
    </button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className={cn(DROPDOWN.content, "w-56")} align="end">
    <div className="px-2 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
      <p className="text-sm font-bold">{user.name}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
    </div>
    <DropdownMenuItem className={cn(DROPDOWN.item.base, DROPDOWN.item.inactive)}>
      <User className={DROPDOWN.item.icon} /> Profil
    </DropdownMenuItem>
    <DropdownMenuItem className={cn(DROPDOWN.item.base, DROPDOWN.item.inactive)}>
      <Settings className={DROPDOWN.item.icon} /> Pengaturan
      <kbd className={DROPDOWN.shortcut}>⌘,</kbd>
    </DropdownMenuItem>
    <DropdownMenuSeparator className={DROPDOWN.separator} />
    <DropdownMenuItem className={cn(DROPDOWN.item.base, DROPDOWN.item.destructive)}>
      <LogOut className={DROPDOWN.item.icon} /> Keluar
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 7.5 Usage: Sort Menu
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button className={btn("outline", "sm")}>
      <ArrowUpDown className="size-4" />
      Urutkan: {sortLabel}
    </button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className={DROPDOWN.content}>
    {sortOptions.map((opt) => (
      <DropdownMenuItem
        key={opt.value}
        onSelect={() => setSort(opt.value)}
        className={cn(
          DROPDOWN.item.base,
          sort === opt.value
            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
            : DROPDOWN.item.inactive
        )}
      >
        {sort === opt.value && <Check className={DROPDOWN.item.icon} />}
        <span className={sort !== opt.value ? "ml-6" : ""}>{opt.label}</span>
      </DropdownMenuItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>
```

---

## 8. ContextMenu Spec (Brief)

Right-click menu. Sama dengan DropdownMenu secara visual, beda trigger only.

### 8.1 Use Case
- Right-click di table row → quick actions (edit/delete/duplicate)
- Right-click di canvas (future: chart interactions)

### 8.2 Token Reference
```
CONTEXT_MENU.content   // sama dengan DROPDOWN.content
CONTEXT_MENU.item.*    // sama dengan DROPDOWN.item.*
```

**Note:** Gunakan sparingly. Desktop-only feature (tidak ada di mobile touch). Selalu sediakan alternative via DropdownMenu "⋯" button.

---

## 9. 🚫 Prohibited Patterns

| Pattern | Why | Replacement |
|---|---|---|
| Native `title="..."` attribute | OS-dependent, no styling, bad UX | `<Tooltip>` dari shadcn |
| Hand-rolled `absolute z-10/z-20` floating panel | Reinvents primitive | `<Popover>` / `<DropdownMenu>` |
| Manual `useRef` + outside click listener | Brittle, duplicates Radix logic | Radix primitives handle ini |
| Manual keyboard nav di dropdown | Missing edge cases | Radix `<DropdownMenu>` built-in |
| Tooltip `bg-white` light surface | Low contrast dengan UI sekitar | `bg-slate-900 text-white` inverse |
| Popover isi navigation (bukan content) | Wrong primitive | Gunakan DropdownMenu |
| HoverCard untuk text pendek saja | Overkill | Gunakan Tooltip |
| Tooltip untuk rich content (JSX layout) | Layout issues | Gunakan HoverCard |
| Dropdown tanpa Escape dismiss | A11y fail | Radix handle (jangan stopPropagation) |
| Multiple overlays open bersamaan | Visual chaos | Close previous when open new |
| Overlay tanpa Portal | Container overflow cut-off | Shadcn default (Portal on) |
| z-index custom (z-60, z-100) | Breaks layering | Use `z-50` standard |
| Tooltip > 2 sentences | Too much text untuk hover | Split to HoverCard atau redesign |
| Dropdown item tanpa icon di menu yang ada icon | Inconsistent alignment | All items punya icon atau semua tidak |

---

## 10. Migration Guide

### 10.1 Replace Native `title=""` (6 instances)
```diff
- <button title="Hapus">
+ <Tooltip>
+   <TooltipTrigger asChild>
      <button>
        <Trash2 className="size-4" />
      </button>
+   </TooltipTrigger>
+   <TooltipContent className={TOOLTIP.content}>Hapus</TooltipContent>
+ </Tooltip>
```

### 10.2 Migrate Header Store Dropdown → DropdownMenu
Header.tsx punya 60+ LOC custom dropdown logic (dropdownRef, triggerRef, listboxRef, keyboard nav handler). Replace dengan:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button className={HEADER.iconButton}>
      <Store className="size-4" /> {activeStore} <ChevronDown />
    </button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {stores.map(s => <DropdownMenuItem>...</DropdownMenuItem>)}
  </DropdownMenuContent>
</DropdownMenu>
```
- **LOC saved:** ~60 lines of manual state/effect/keyboard logic
- **Bonus:** Radix handles arrow keys, Home/End, type-ahead automatically

### 10.3 Migrate NotificationCenter → Popover
Current: hand-rolled floating panel dengan `absolute right-0 top-10 z-20 w-44`. Replace dengan `<Popover>`.

### 10.4 Migrate Filter Toolbars → Popover
Banyak page punya filter inline; consider collapsing ke `<Popover>` trigger + filter panel untuk visual clean.

### 10.5 Setup TooltipProvider
Pastikan `<TooltipProvider delayDuration={300}>` wrap semua page (di `layout.tsx` atau `PortalTemplate`).

### Per-page priority
1. **Header.tsx** — store dropdown + notification → DropdownMenu + Popover
2. **TransactionHistoryPage** — row actions → DropdownMenu
3. **InventarisPage** — row actions + filter → DropdownMenu + Popover
4. **UserManagementPage** — row actions → DropdownMenu
5. **Icon buttons dengan native title** — 6 instances → Tooltip
6. **UserProfile** — user preview → HoverCard
7. **POS ProductCard** — product hover detail → HoverCard

### Code Review Rubric
1. Native `title=""` → **reject** (use Tooltip)
2. Hand-rolled floating dengan `absolute z-*` → **reject** (use primitive)
3. Manual outside-click listener → **reject** (primitive handles)
4. Tooltip bg-white → **request change** (dark surface standard)
5. Tooltip > 2 sentences → **request change** (too long)
6. z-index custom (>z-50) → **reject**
7. Multiple overlays open simultaneously → **request change**
8. Missing TooltipProvider wrap → **reject**

---

## 11. TooltipProvider Config

### 11.1 Recommended Setup
```tsx
// frontend/src/app/layout.tsx or PortalTemplate
import { TooltipProvider } from "@/app/components/ui/tooltip";

<TooltipProvider
  delayDuration={300}         // hover delay before show
  skipDelayDuration={100}     // quick re-show if user moves between tooltips
  disableHoverableContent     // tooltips not hoverable (standard)
>
  {children}
</TooltipProvider>
```

---

## 12. Future Enhancements

- [ ] Tooltip with interactive action (onClick shortcut)
- [ ] HoverCard with async content load (skeleton)
- [ ] DropdownMenu with submenu (nested)
- [ ] DropdownMenu with search (combobox)
- [ ] Popover with dismiss-on-scroll
- [ ] Context menu for table row right-click (+ all table instances)
- [ ] Animated overlay entrance variants (slide vs zoom per context)
- [ ] Touch-long-press context menu for mobile
- [ ] Storybook dengan all overlay variants

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
