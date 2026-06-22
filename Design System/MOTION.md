# 🎬 InsightSphere Motion & Animation System

> **Single source of truth untuk transitions, animations, dan motion design.**
> Versi: 1.0 — 23 April 2026
> Implementasi token: `frontend/src/app/lib/motion.ts`
> Companion specs: `BUTTONS.md`, `ELEVATION.md`

---

## 1. Overview

InsightSphere memakai **3 tier duration** + **4 animation preset** + transition property-specific. Total 804 motion occurrences di codebase (125 duration + 107 animate-in + 91 slide + 481 transition).

Policy ini meng-codify pattern yang sudah konsisten di Design System Alignment Batch 1-4, terutama modal entrance yang sudah standardized.

---

## 2. Design Principles

### 2.1 Duration Tiers (3 level)
| Tier | Duration | Use |
|:---:|:---:|---|
| **Quick** | 200ms | Hover, button press, modal entrance, tooltip |
| **Standard** | 300ms | Default transition, panel swap, fade |
| **Slow** | 500ms | Chart reveal, progress fill, ambient animation |

Dilarang: `duration-150` (terlalu instant untuk motion bermakna), `duration-1000+` (terlalu lambat, bikin UI terasa lag).

### 2.2 Ease Default
Pakai default Tailwind (`cubic-bezier(0.4, 0, 0.2, 1)` = ease-in-out). Hanya override jika ada alasan:
- `ease-linear` — progress bar, circular spinner
- `ease-out` — element masuk (deceleration)
- `ease-in` — element keluar (acceleration)

### 2.3 Transition Property (avoid `transition-all`)
❌ `transition-all` = transition semua property — mahal, unpredictable.
✅ Spesifik: `transition-colors`, `transition-transform`, `transition-opacity`, `transition-shadow`.

Pengecualian: kompleks interaksi dengan banyak property berubah bersamaan.

### 2.4 Reduced Motion Respect
Untuk a11y, motion intensive harus respect `prefers-reduced-motion`. Tailwind handles this via `motion-safe:` / `motion-reduce:` prefix:
```tsx
<div className="motion-safe:animate-in motion-reduce:animate-none" />
```

### 2.5 Presets over Ad-hoc
Untuk modal, dropdown, tooltip, drawer — gunakan **preset** dari `motion.ts`. Jangan compose strings manually.

---

## 3. Duration Tokens

### 3.1 TypeScript tokens (`motion.ts`)
```ts
import { M } from "@/app/lib/motion";

M.duration.quick      // "duration-200"
M.duration.standard   // "duration-300"
M.duration.slow       // "duration-500"
```

### 3.2 CSS variables (`theme.css`)
```css
--duration-quick:    200ms;
--duration-standard: 300ms;
--duration-slow:     500ms;
```

---

## 4. Animation Presets

### 4.1 Modal / Dialog Entrance
Pattern yang sudah terstandarisasi di Batch 1-4:

```ts
M.modalEnter
// "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-200"
```

**Komposisi:**
- `animate-in` — trigger Tailwind Animate
- `fade-in-0` — opacity 0 → 1
- `zoom-in-95` — scale 95% → 100%
- `slide-in-from-bottom-4` — translate-y 16px → 0
- `duration-200` — quick

### 4.2 Drawer Entrance
```ts
M.drawerEnterRight    // "animate-in slide-in-from-right duration-300"
M.drawerEnterBottom   // "animate-in slide-in-from-bottom-8 duration-300"
```

### 4.3 Dropdown / Popover Entrance
```ts
M.dropdownEnter
// "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150"
```

### 4.4 Tooltip Entrance
```ts
M.tooltipEnter
// "animate-in fade-in-0 zoom-in-95 duration-150"
```

### 4.5 Fade In (generic reveal)
```ts
M.fadeIn       // "animate-in fade-in duration-300"
M.fadeInQuick  // "animate-in fade-in duration-200"
```

### 4.6 Backdrop Fade
```ts
M.backdropEnter  // "animate-in fade-in-0 duration-200"
```

---

## 5. Transition Recipes

Pakai recipe untuk property-specific transition, menghindari `transition-all`:

```ts
M.transition.color     // "transition-colors duration-200"
M.transition.transform // "transition-transform duration-200"
M.transition.opacity   // "transition-opacity duration-200"
M.transition.shadow    // "transition-shadow duration-200"
```

Example:
```tsx
<button className={cn(M.transition.color, "bg-indigo-600 hover:bg-indigo-700")}>
  Simpan
</button>

<div className={cn(M.transition.shadow, "shadow-sm hover:shadow-md")}>
  Card
</div>
```

---

## 6. Usage Examples

### 6.1 Modal with full entrance pattern
```tsx
import { M } from "@/app/lib/motion";

<div className={cn(
  "fixed inset-0 bg-slate-900/60 backdrop-blur-sm",
  M.backdropEnter
)}>
  <div className={cn(
    "mx-auto mt-20 max-w-md rounded-3xl bg-white shadow-2xl",
    M.modalEnter
  )}>
    ...
  </div>
</div>
```

### 6.2 Button hover (transition-colors only)
```tsx
<button className={cn(
  "px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white",
  M.transition.color
)}>
  Simpan
</button>
```

### 6.3 Card hover lift (transition-shadow only)
```tsx
<div className={cn(
  "p-6 rounded-2xl bg-white shadow-sm hover:shadow-md",
  M.transition.shadow
)}>
  ...
</div>
```

### 6.4 Drawer (right-side slide)
```tsx
<aside className={cn(
  "fixed right-0 inset-y-0 w-96 bg-white shadow-2xl",
  M.drawerEnterRight
)}>
  ...
</aside>
```

### 6.5 Dropdown menu (top-anchored)
```tsx
<div className={cn(
  "absolute top-full mt-2 w-48 rounded-xl bg-white shadow-xl border border-slate-100",
  M.dropdownEnter
)}>
  ...
</div>
```

### 6.6 Animated spinner (linear ease)
```tsx
<Loader2 className="size-4 animate-spin" />
```

### 6.7 Progress bar fill (slow linear)
```tsx
<div
  className={cn("h-full bg-indigo-600 rounded-full", M.transition.transform)}
  style={{ transform: `scaleX(${progress})`, transformOrigin: "left" }}
/>
```

### 6.8 Reduced motion respect
```tsx
<div className={cn(
  "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300",
  "motion-reduce:opacity-100"
)}>
  ...
</div>
```

---

## 7. 🚫 Prohibited Patterns

| Pattern | Why | Replacement |
|---|---|---|
| `transition-all` tanpa alasan | Expensive, unpredictable | Specific property (`transition-colors`) |
| `duration-1000`+ untuk hover | Terlalu lambat, feels laggy | `duration-200` |
| `duration-75` atau `duration-100` | Terlalu instant, no motion value | `duration-200` minimum |
| Animation string ad-hoc untuk modal | Inconsistent, easy to diverge | `M.modalEnter` preset |
| `transition` (no property, no duration) | Default browser 200ms applied — implicit | Explicit `transition-colors duration-200` |
| Custom `ease-[cubic-bezier(...)]` | Hard to maintain | Default or Tailwind preset (`ease-out`, `ease-linear`) |
| Motion-intensive tanpa `motion-safe:` | A11y violation | Prefix dengan `motion-safe:` |
| `animate-ping` / `animate-bounce` untuk non-critical UI | Too attention-grabbing | Subtle hover transition |

---

## 8. Migration Guide

### 8.1 `transition-all` reduction (298 instances)
Classify & migrate:

| Context | Replace with |
|---|---|
| Button hover (bg change only) | `transition-colors` |
| Card hover (shadow change) | `transition-shadow` |
| Modal/drawer (complex) | Keep `transition-all` (justified) |
| Icon rotation | `transition-transform` |
| Opacity fade | `transition-opacity` |

### 8.2 Modal Entrance Unification
Search untuk modal components, ganti manual animation string dengan `M.modalEnter`:

```diff
- className="animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-8 duration-300"
+ className={M.modalEnter}  // "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-200"
```

(Note: `slide-in-from-bottom-8` → `slide-in-from-bottom-4` dan `duration-300` → `duration-200` adalah intended standardization.)

### 8.3 Dropdown/Popover Unification
Ganti manual string dengan `M.dropdownEnter`.

### Per-page priority
Sama dengan `COLORS.md §6`.

### Code review rubric
1. `transition-all` tanpa justifikasi kompleks? → **request change** ke specific property
2. Modal animation string manual (bukan preset)? → **request change** ke `M.modalEnter`
3. `duration-*` di luar 200/300/500 tanpa alasan? → **request change** atau butuh justifikasi
4. Custom `ease-[cubic-bezier(...)]`? → **request change**
5. Motion intensive tanpa `motion-safe:` prefix? → **request change** (a11y)
6. `animate-ping`/`animate-bounce` di critical UI? → **request change**

---

## 9. Future Enhancements

- [ ] Add `prefers-reduced-motion` CSS global override di `theme.css`
- [ ] Create motion audit tool: scan untuk off-spec durations
- [ ] Add exit animations (`M.modalExit`, `M.drawerExit`)
- [ ] Stagger children animation preset (list reveal)
- [ ] Layout animation helpers (Framer Motion integration kalau perlu)
- [ ] Storybook page: live preview semua presets
- [ ] Document FLIP animation pattern untuk reorder/filter

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
