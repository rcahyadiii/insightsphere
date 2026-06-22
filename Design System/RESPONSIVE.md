# 📱 InsightSphere Responsive System

> **Single source of truth untuk breakpoints, mobile-first policy, device matrix, print.**
> Versi: 1.0 — 23 April 2026
> Implementasi token: `frontend/src/app/lib/responsive.ts`
> Companion: `SPACING.md`, `A11Y.md §4.3` (touch targets), `BUTTONS.md §4.4`

---

## 1. Overview

InsightSphere adalah **dual-app**: POS PWA (tablet/mobile) + Admin Dashboard (desktop). Responsive design = blocker untuk kedua mode.

**Audit current state:**
- Total responsive modifier usage: **278 instances**
- Breakdown: sm (70) · md (78) · lg (97) · xl (30) · 2xl (3)
- Strictly mobile-first (0 `max-*` modifier usage)
- 0 print stylesheet (`@media print`, 0 `print:` Tailwind)
- 2 `window.print()` calls (ad-hoc, belum terstandarisasi)
- 146 `grid-cols-N` instances (responsive grids well-adopted)

**Goals:**
- 🎯 Formalize breakpoint scale + naming
- 🎯 Enforce mobile-first approach
- 🎯 Define device matrix (min viewport, target devices)
- 🎯 Standardize print styles (receipts, reports)
- 🎯 Touch vs mouse interaction differentiation
- 🎯 Container query adoption policy (future)

---

## 2. Breakpoint Scale

Aligned dengan **Tailwind defaults** (tidak di-override di project).

### 2.1 Tokens

| Breakpoint | Min Width | Target Device | Usage Count (Audit) |
|---|---:|---|:---:|
| **`sm`** | 640px | Mobile landscape, small tablet | 70 |
| **`md`** | 768px | Tablet (iPad portrait) | 78 |
| **`lg`** | 1024px | Desktop laptop, iPad landscape | 97 |
| **`xl`** | 1280px | Desktop standard | 30 |
| **`2xl`** | 1536px | Large desktop, wide monitor | 3 |

### 2.2 Implicit Base (Mobile-First)
Anything BEFORE `sm` = mobile portrait (< 640px). **All default styles apply to mobile**, override with `sm:` / `md:` / `lg:` / dst.

```tsx
// ✅ Correct mobile-first
<div className="text-sm md:text-base lg:text-lg">
```

```tsx
// ❌ Don't use max-* approach (inverse of our policy)
<div className="text-lg max-md:text-sm">
```

### 2.3 Breakpoint Philosophy

| Tier | Design Principle |
|---|---|
| **Base (<640px)** | Mobile portrait — most constrained, optimize first |
| **`sm` (640+)** | Mobile landscape, some tablets — minor enhancements |
| **`md` (768+)** | Tablet portrait — 2-column layout starts |
| **`lg` (1024+)** | Desktop / tablet landscape — sidebar visible, workspace patterns |
| **`xl` (1280+)** | Standard desktop — final layout, 3-column OK |
| **`2xl` (1536+)** | Large monitors — constraint-max-width, whitespace |

---

## 3. Mobile-First Policy

### 3.1 Rules

1. **Always write mobile-first CSS.**
   - Base styles = mobile portrait
   - Use `sm:`, `md:`, `lg:`, `xl:`, `2xl:` to progressively enhance
2. **Avoid `max-*` modifiers** kecuali benar-benar necessary.
3. **Test pada minimum viewport first** (iPhone SE 375px).
4. **Enhance, don't degrade** — add complexity as viewport grows.

### 3.2 Layout Progression Pattern

```tsx
// Typical dashboard card grid
<div className={cn(
  "grid gap-4",
  "grid-cols-1",         // mobile: 1 column
  "sm:grid-cols-2",      // sm+: 2 columns
  "lg:grid-cols-3",      // lg+: 3 columns
  "xl:grid-cols-4"       // xl+: 4 columns
)}>
```

### 3.3 Typography Scaling

| Element | Base (mobile) | md: | lg: |
|---|---|---|---|
| Page h1 | `text-xl` | `text-2xl` | `text-3xl` |
| Section h2 | `text-lg` | `text-xl` | — |
| Body | `text-sm` | `text-base` | — |
| KPI number | `text-2xl` | `text-3xl` | `text-4xl` |

```tsx
<h1 className="text-xl md:text-2xl lg:text-3xl font-black">
```

### 3.4 Spacing Scaling

Reduce padding/margins at mobile:

```tsx
<div className={cn(
  "px-4 py-4",           // mobile: tight
  "md:px-6 md:py-6",     // tablet: comfortable
  "lg:px-8 lg:py-8"      // desktop: spacious
)}>
```

### 3.5 Sidebar Behavior

| Breakpoint | Sidebar |
|---|---|
| Base (<1024px) | Hidden, accessed via hamburger drawer |
| `lg` (1024+) | Visible, collapsible |
| `xl` (1280+) | Visible, expanded by default |

Lihat `NAVIGATION.md §2.5` untuk detail.

---

## 4. Device Matrix

### 4.1 Supported Devices

| Device Class | Min Viewport | Target Example | Priority |
|---|---:|---|:---:|
| **Smartphone (portrait)** | 360×640 | Samsung A-series, budget phones | **P0** |
| **Smartphone (landscape)** | 640×360 | Any smartphone | P1 |
| **iPhone SE** | 375×667 | Baseline iOS | **P0** |
| **Tablet (portrait)** | 768×1024 | iPad, Samsung Tab | **P0** (kasir POS) |
| **Tablet (landscape)** | 1024×768 | iPad landscape | **P0** (kasir POS) |
| **Laptop small** | 1280×720 | 13" MacBook | **P0** |
| **Laptop standard** | 1440×900 | 14-15" laptop | **P0** |
| **Desktop** | 1920×1080 | Standard monitor | P1 |
| **Ultrawide** | 2560×1080+ | Pro monitor | P2 |

### 4.2 Minimum Viewport Support
**360×640px** — smallest target. Anything smaller = graceful degradation (content still usable, layout may shift).

### 4.3 Browser Matrix

| Browser | Min Version | Support Level |
|---|---|---|
| Chrome | 90+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari (Mac) | 14+ | ✅ Full |
| Safari (iOS) | 14+ | ✅ Full |
| Samsung Internet | 14+ | 🟡 Tested |
| IE 11 | — | ❌ Not supported |
| Opera Mini | — | ❌ Not supported |

### 4.4 OS Matrix

| OS | Min Version |
|---|---|
| iOS | 14+ |
| Android | 9+ (Pie) |
| Windows | 10+ |
| macOS | Big Sur 11+ |

### 4.5 POS-Specific Target Devices

Kasir workflow primarily on:
- **iPad 10.2" / 10.9"** (1024×768 landscape) — **primary**
- **Android tablet 10"** (landscape)
- **Budget Android 7"** (landscape, 1024×600)

Test POS UX pada devices ini specifically.

---

## 5. Touch vs Mouse Interaction

### 5.1 Differences

| Aspect | Mouse (Desktop) | Touch (Mobile/Tablet) |
|---|---|---|
| **Cursor** | Yes (hover states relevant) | No (hover = tap equivalent) |
| **Hover** | Rich (tooltips, previews) | Avoid — use tap-and-hold / drawer |
| **Tap target** | 24×24px OK | **Min 44×44px** (WCAG AAA) |
| **Spacing** | Dense OK | Generous for fat-finger avoidance |
| **Right-click** | Context menu | Long-press (iOS) — avoid critical features here |
| **Scroll** | Wheel (fine control) | Flick (momentum) |
| **Drag** | Smooth precision | Requires larger handles |
| **Multi-select** | Shift/Ctrl+click | Long-press → checkboxes |
| **Keyboard shortcuts** | Expected | Not primary |

### 5.2 Detecting Input Mode

**CSS:**
```css
/* Touch-primary device */
@media (hover: none) and (pointer: coarse) {
  .desktop-only-hover { display: none; }
}

/* Mouse-primary device */
@media (hover: hover) and (pointer: fine) {
  .touch-only-tap { display: none; }
}
```

**Tailwind equivalent (pakai `hover:` responsibly):**
```tsx
<button className="hover:bg-slate-100 active:bg-slate-200">
  // hover = desktop, active = touch tap
</button>
```

### 5.3 Hover Policies

✅ **Hover OK for:**
- Subtle visual feedback (slight bg change)
- Tooltip reveal (desktop only)
- Preview on product card

❌ **Hover NOT OK for:**
- Critical interaction gated behind hover
- Navigation dropdown that only opens on hover
- Delete button only visible on row hover (invisible on mobile)

### 5.4 Touch-Specific Enhancements

- **Swipe gestures** — drawer dismiss, carousel
- **Pull-to-refresh** — data lists
- **Pinch-to-zoom** — charts, images (OS-level)
- **Long-press** — context menu alternative

---

## 6. Container Layout Rules

### 6.1 Max Width

| Context | Max Width | Classes |
|---|---:|---|
| Auth pages | 420px | `max-w-sm` |
| Form pages | 640px | `max-w-2xl` |
| Dashboard | 1440px | `max-w-7xl mx-auto` |
| Full-bleed (charts, workspace) | 100% | no max |
| Modal content | 384–896px | `sm` to `3xl` variants |
| Drawer content | 320–640px | per `DRAWERS.md` |

### 6.2 Side Padding

```tsx
<div className="px-4 md:px-6 lg:px-8">
```

| Viewport | Padding-X |
|---|---:|
| Mobile (<768) | 16px (`px-4`) |
| Tablet (768+) | 24px (`px-6`) |
| Desktop (1024+) | 32px (`px-8`) |

### 6.3 Vertical Rhythm

```tsx
<div className="py-4 md:py-6 lg:py-8 space-y-6 md:space-y-8">
```

---

## 7. Grid System

InsightSphere pakai **Tailwind CSS Grid** (no 12-column Bootstrap-style).

### 7.1 Common Grid Recipes

```tsx
// KPI row — 4 cards
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">

// Card list — 3 columns responsive
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Dashboard layout — asymmetric
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">{/* Main */}</div>
  <div>{/* Sidebar */}</div>
</div>

// Form 2-column
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// Gallery — auto-fit
<div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
```

### 7.2 Grid vs Flexbox

| Use Case | Recommendation |
|---|---|
| **Grid (2D)** | Cards, gallery, multi-col form, dashboard layout |
| **Flex (1D)** | Nav bar, toolbar, button groups, inline form |

---

## 8. Print Styles

### 8.1 Current Gap
**0 `@media print`, 0 `print:` Tailwind modifier usage** — significant enterprise gap untuk POS (struk cetak) + Laporan (print report).

### 8.2 Tailwind Print Modifier

```tsx
<div className="print:hidden">Only on screen</div>
<div className="hidden print:block">Only when printing</div>
<div className="text-base print:text-xs">Smaller when printed</div>
```

### 8.3 Receipt Print Pattern

Struk POS perlu:
- Narrow width (58mm / 80mm thermal)
- Monospace-ish font
- No backgrounds (save ink)
- Pure black text
- Dimensi fit ke printer

```tsx
<div className={cn(
  "hidden print:block",
  "w-[80mm] font-mono text-[10pt] leading-tight",
  "text-black bg-white"
)}>
  <h1 className="text-center font-bold">STRUK PEMBELIAN</h1>
  <div className="text-center text-[8pt] mt-1">
    InsightSphere POS
    <br />
    {storeName}
  </div>
  <hr className="my-2 border-black border-dashed" />
  {/* items */}
  <hr className="my-2 border-black border-dashed" />
  <div className="flex justify-between font-bold">
    <span>TOTAL</span>
    <span>{formatRupiah(total)}</span>
  </div>
</div>
```

### 8.4 Report Print Pattern

```tsx
{/* Screen view */}
<div className="print:hidden">
  <Header />
  <Toolbar />
</div>

{/* Print view */}
<div className="hidden print:block">
  <PrintHeader storeName={name} period={period} />
</div>

{/* Shared content — adjusts automatically */}
<ReportContent className="print:text-xs print:break-inside-avoid" />

{/* Print footer */}
<footer className="hidden print:block print:fixed print:bottom-0">
  Halaman [X] dari [Y]
</footer>
```

### 8.5 Print Global Rules

```css
@media print {
  /* Disable animations */
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
  }

  /* Avoid color printing for ink savings */
  body {
    background: white !important;
    color: black !important;
  }

  /* Hide non-essentials */
  nav, aside, .print\:hidden {
    display: none !important;
  }

  /* Better page breaks */
  h1, h2, h3 { page-break-after: avoid; }
  table { page-break-inside: avoid; }
  tr { page-break-inside: avoid; }

  /* No URL after links */
  a::after { content: "" !important; }
}
```

Global snippet bisa ditambahkan ke `theme.css` atau dedicated `print.css`.

### 8.6 Print Preview
Browser `window.print()` → OS dialog. Jangan invoke tanpa user action.

---

## 9. Orientation

### 9.1 Rules
- **Mobile:** Support both portrait + landscape (auto-rotate)
- **Tablet POS:** Lock ke **landscape** (better UX untuk kasir workflow)
  ```html
  <meta name="screen-orientation" content="landscape">
  ```
  Atau via JS `screen.orientation.lock('landscape')` saat user enter POS.
- **Desktop:** N/A (always landscape)

### 9.2 Orientation-Specific Layout

```css
@media (orientation: portrait) and (max-width: 767px) {
  /* Phone portrait: single column */
}

@media (orientation: landscape) and (max-width: 767px) {
  /* Phone landscape: keyboard-aware layout */
}
```

### 9.3 Keyboard-Open State (Mobile)

Saat virtual keyboard muncul di mobile, viewport shrinks. Handle dengan:
- Scroll focused input into view (`scrollIntoView({ block: "center" })`)
- Avoid fixed-bottom sheets yang ketimpa keyboard
- Use `visualViewport` API untuk detect keyboard state

---

## 10. Container Queries (Future)

**Container queries** (`@container`) = respond to parent size, bukan viewport. Useful untuk reusable components yang mengadaptasi ke container apapun.

**Status:** CSS baseline 2023+, all modern browsers support. Tailwind 4 punya `@container` modifier.

**Example (proposed future adoption):**
```tsx
<div className="@container">
  <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3">
    {/* Grid adapts to container, not viewport */}
  </div>
</div>
```

**Policy:** Adopt **incrementally** — start untuk KPI cards (same card in sidebar vs full-width behaves differently).

---

## 11. Performance Budget (Responsive Impact)

### 11.1 Image Optimization

```tsx
import Image from "next/image";

<Image
  src="/product.jpg"
  alt="Foto produk"
  width={800}
  height={600}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  priority={isAboveFold}
/>
```

### 11.2 Conditional Rendering (desktop-only components)

```tsx
{isDesktop && <HeavyDesktopOnlyComponent />}
```

Pakai `useMediaQuery` hook dari `responsive.ts`:
```tsx
const isDesktop = useBreakpoint("lg");
```

Beware hydration mismatch — render default fallback first, swap after mount.

### 11.3 Lazy Loading Routes
Next.js App Router sudah auto code-split per route. Untuk heavy components dalam route, pakai `dynamic()`:
```tsx
const HeavyChart = dynamic(() => import("./HeavyChart"), { ssr: false });
```

---

## 12. 🚫 Prohibited Patterns

| Pattern | Why | Fix |
|---|---|---|
| `max-md:text-sm` default approach | Goes against mobile-first | Use base+md: progression |
| Fixed widths (`w-[600px]`) without responsive override | Breaks mobile | Use `w-full md:w-[600px]` |
| `lg:hidden` untuk mobile nav | Inverse mobile-first | Show drawer by default, hide on `lg` |
| Hover-only dropdowns | Touch devices fail | Click/tap-based open |
| Tiny touch targets on mobile (< 44px) | A11y AAA fail | Use `lg` size on mobile |
| Bottom sheets on desktop | Wrong paradigm | Use regular modals |
| Sidebars always visible on mobile | Takes too much screen | Hamburger + drawer |
| `print:` ignored untuk Laporan/struk | Ugly print output | Add print styles |
| Dual-pane split at mobile viewport | Cramped | Collapse to drawer |
| Tables with 10+ columns without horizontal scroll | Content cutoff | Add `overflow-x-auto` or responsive table |

---

## 13. Migration Guide

### 13.1 Priority Refactors

1. **Add `print:` styles** untuk:
   - Struk POS (PaymentModal success)
   - Laporan (LaporanPage)
   - Shift summary (CashManagementPage)
2. **Add `responsive.ts` tokens** + `useBreakpoint()` hook
3. **Header mobile drawer** — hamburger + sidebar-in-drawer pattern
4. **POS KasirPage mobile** — bottom sheet pattern untuk cart
5. **Test pada iPhone SE (375px)** — smallest priority device

### 13.2 Per-page Checklist

Per page verify:
- [ ] Readable pada 375px wide?
- [ ] Touch targets ≥ 44px at mobile viewport?
- [ ] Sidebar collapses correctly at <1024px?
- [ ] Tables scroll horizontally bila perlu?
- [ ] Modal tidak overflow viewport height?
- [ ] Form labels stack correctly di mobile?
- [ ] Typography scale comfortable per viewport?
- [ ] Padding/spacing comfortable di masing-masing tier?
- [ ] Hover state tidak gate critical interaction?

### 13.3 Landing Page (Low Priority)
Marketing/landing pages di future release mungkin need extra responsive polish. Defer sampai Phase 6.

---

## 14. Future Enhancements

- [ ] Container queries migration (per-component)
- [ ] Print stylesheet lengkap (`print.css` atau extension `theme.css`)
- [ ] Storybook responsive viewport controls
- [ ] Device matrix automated testing (Playwright cross-device)
- [ ] PWA offline UI adaptation
- [ ] Foldable device support (Samsung Fold)
- [ ] Dark mode + print combination
- [ ] Reduced data mode (slow connection) indicator

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
