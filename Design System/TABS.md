# 🔀 InsightSphere Tabs & Stepper System

> **Single source of truth untuk tabs (view switching) dan stepper (multi-step flow).**
> Versi: 1.0 — 23 April 2026
> Implementasi token: `frontend/src/app/lib/nav.ts`
> Companion specs: `NAVIGATION.md`, `BREADCRUMBS.md`, `BUTTONS.md`

---

## 1. Overview

Audit InsightSphere menemukan:
- **Tabs: 0 shadcn `<Tabs>` usage** walaupun `ui/tabs.tsx` ada. Component exists tapi tidak diadopsi.
- **Stepper: 26 "step" references** hand-rolled di PaymentModal (3-step flow), CashManagement, POS flow. **No shared component**.

Policy ini:
1. Formalkan tabs pattern (3 variant: pill/underline/segmented)
2. Formalkan stepper pattern (horizontal + vertical)
3. Provide tokens untuk adoption

---

## 2. Tabs vs Stepper (Mental Model)

| Aspect | Tabs | Stepper |
|---|---|---|
| **Semantic** | View switching (parallel content) | Sequential flow (must-complete-in-order) |
| **User control** | Free to switch anytime | Constrained (usually can go back, limited forward) |
| **Completion** | No completion state | Each step has completed/active/upcoming state |
| **Use for** | Profile tabs, report periods, settings sections | Checkout, multi-step forms, onboarding, wizards |

---

## 3. Tabs Design Principles

### 3.1 3 Variants
| Variant | Use case | Visual |
|---|---|---|
| `pill` | Toggle-like, compact | Rounded pill bg |
| `underline` | Classic tabs, long list | Bottom border |
| `segmented` | Binary/ternary toggle | Connected pills in container |

### 3.2 Active State
- **Pill:** `bg-indigo-600 text-white` (solid) atau `bg-indigo-50 text-indigo-700` (soft)
- **Underline:** `border-b-2 border-indigo-500 text-indigo-600`
- **Segmented:** `bg-white dark:bg-slate-900 shadow-sm text-indigo-600` (inside slate-100 container)

### 3.3 Typography
- Tab label: `text-sm font-bold` (default), `text-xs font-bold` (compact)
- No uppercase (per `TYPOGRAPHY.md v1.1`)

### 3.4 Focus Ring
Sesuai `FORMS.md §2.2`:
```
focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20
```

### 3.5 Keyboard Nav (A11y)
Wajib support:
- `Tab` → move focus
- `Arrow Left/Right` → cycle between tabs
- `Home` / `End` → first / last tab
- `Enter` / `Space` → activate

---

## 4. Tab Anatomy

### 4.1 Pill Tabs (Default)
```
┌──────────────────────────────────┐
│ ■ Active ■  Tab 2   Tab 3   Tab4 │  ← TabsList (flex, gap-1)
└──────────────────────────────────┘
─────────────────────────────────
Content for active tab           ← TabsContent
```

### 4.2 Underline Tabs
```
 Active   Tab 2    Tab 3    Tab 4
 ─────                            ← border-b-2 indigo on active
─────────────────────────────────
Content for active tab
```

### 4.3 Segmented
```
┌─────────────────────────────────┐
│ ■ Active ■  Tab 2   Tab 3       │  ← All inside bg-slate-100 container
└─────────────────────────────────┘
```

### 4.4 Structure Tokens
```
TABS.list.pill         // flex + gap-1
TABS.list.underline    // flex + gap-6 + border-b
TABS.list.segmented    // inline-flex + bg-slate-100 + p-1 + rounded-xl

TABS.trigger.pill.base       // px-3 py-1.5 + rounded-xl + text-sm font-bold
TABS.trigger.pill.active     // bg-indigo-600 + text-white (or soft variant)
TABS.trigger.pill.inactive   // text-slate-600 + hover:bg-slate-100

TABS.trigger.underline.base       // px-1 py-3 + text-sm + font-bold + border-b-2 border-transparent
TABS.trigger.underline.active     // border-indigo-500 + text-indigo-600
TABS.trigger.underline.inactive   // text-slate-600 + hover:text-slate-900

TABS.trigger.segmented.base      // px-3 py-1.5 + rounded-lg + text-sm + font-bold
TABS.trigger.segmented.active    // bg-white dark:bg-slate-900 + shadow-sm + text-slate-900
TABS.trigger.segmented.inactive  // text-slate-600 + hover:text-slate-900

TABS.content   // mt-4 (separation from list)
```

---

## 5. Tab Usage Examples

### 5.1 Pill Tabs (with shadcn)
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";

<Tabs defaultValue="overview">
  <TabsList className={TABS.list.pill}>
    <TabsTrigger value="overview" className={cn(TABS.trigger.pill.base)}>Ringkasan</TabsTrigger>
    <TabsTrigger value="products" className={cn(TABS.trigger.pill.base)}>Produk</TabsTrigger>
    <TabsTrigger value="staff" className={cn(TABS.trigger.pill.base)}>Staff</TabsTrigger>
  </TabsList>
  <TabsContent value="overview" className={TABS.content}>...</TabsContent>
  <TabsContent value="products" className={TABS.content}>...</TabsContent>
</Tabs>
```

### 5.2 Underline Tabs (Report Periods)
```tsx
<div className={TABS.list.underline}>
  {periods.map((p) => (
    <button
      key={p.id}
      onClick={() => setPeriod(p.id)}
      className={cn(
        TABS.trigger.underline.base,
        p.id === period ? TABS.trigger.underline.active : TABS.trigger.underline.inactive
      )}
    >
      {p.label}
    </button>
  ))}
</div>
```

### 5.3 Segmented (Binary Toggle)
```tsx
<div className={TABS.list.segmented}>
  <button
    className={cn(
      TABS.trigger.segmented.base,
      mode === "daily" ? TABS.trigger.segmented.active : TABS.trigger.segmented.inactive
    )}
    onClick={() => setMode("daily")}
  >
    Harian
  </button>
  <button
    className={cn(
      TABS.trigger.segmented.base,
      mode === "monthly" ? TABS.trigger.segmented.active : TABS.trigger.segmented.inactive
    )}
    onClick={() => setMode("monthly")}
  >
    Bulanan
  </button>
</div>
```

### 5.4 Tabs dengan Count Badge
```tsx
<TabsTrigger value="pending" className={TABS.trigger.pill.base}>
  Pending
  <span className={cn(BADGE.base, BADGE.size.xs, BADGE.variant.warning, "ml-2")}>
    12
  </span>
</TabsTrigger>
```

---

## 6. Stepper Design Principles

### 6.1 Step States (3)
| State | Visual |
|---|---|
| `completed` | Checkmark + emerald fill + line solid |
| `active` | Number + indigo fill + ring glow |
| `upcoming` | Number + slate outline + line dashed |

### 6.2 Orientation
| Orientation | Use case |
|---|---|
| **Horizontal** (default) | Desktop, < 6 steps |
| **Vertical** | Mobile, long flow, with step descriptions |

### 6.3 Step Sizing
| Size | Circle | Text |
|---|---|---|
| `sm` | `size-6` (24px) | `text-xs` |
| **`md`** | **`size-8` (32px)** | **`text-sm`** |
| `lg` | `size-10` (40px) | `text-base` |

### 6.4 Clickable Steps?
- **Completed steps:** clickable (go back)
- **Active step:** current, non-clickable
- **Upcoming steps:** disabled (unless validation allows skip)

### 6.5 Label Below Circle (Horizontal)
```
 ①────②────③
Nama  PIN  Konfirmasi
```

---

## 7. Stepper Anatomy (Horizontal)

```
 ┌─┐          ┌─┐          ┌─┐
 │✓│────────  │2│ ┄┄┄┄┄┄┄┄ │3│
 └─┘          └─┘          └─┘
 Nama         PIN          Verifikasi
 (completed) (active)      (upcoming)
```

### 7.1 Structure Tokens
```
STEPPER.wrapper            // flex items-center (horizontal) or flex-col (vertical)
STEPPER.step               // flex flex-col items-center (horizontal) or flex-row (vertical)

STEPPER.circle.base        // size-8 + rounded-full + flex center + text-sm font-bold transition
STEPPER.circle.completed   // bg-emerald-500 + text-white
STEPPER.circle.active      // bg-indigo-600 + text-white + ring-4 ring-indigo-100 dark:ring-indigo-900/40
STEPPER.circle.upcoming    // bg-white dark:bg-slate-900 + border-2 border-slate-300 dark:border-slate-700 + text-slate-500

STEPPER.connector.base     // flex-1 + h-0.5 (horizontal) or w-0.5 (vertical)
STEPPER.connector.done     // bg-emerald-500
STEPPER.connector.todo     // bg-slate-200 dark:bg-slate-700 (or border-dashed)

STEPPER.label.base         // mt-2 + text-xs + font-bold
STEPPER.label.active       // text-indigo-600 dark:text-indigo-400
STEPPER.label.completed    // text-emerald-600 dark:text-emerald-400
STEPPER.label.upcoming     // text-slate-500 dark:text-slate-400
```

---

## 8. Stepper Usage Examples

### 8.1 Horizontal Stepper (3-step)
```tsx
import { STEPPER } from "@/app/lib/nav";
import { Check } from "lucide-react";

const steps = [
  { id: 1, label: "Pilih Produk", status: "completed" },
  { id: 2, label: "Pembayaran", status: "active" },
  { id: 3, label: "Konfirmasi", status: "upcoming" },
];

<div className={STEPPER.wrapper}>
  {steps.map((step, i) => (
    <>
      <div key={step.id} className={STEPPER.step}>
        <div className={cn(
          STEPPER.circle.base,
          step.status === "completed" && STEPPER.circle.completed,
          step.status === "active" && STEPPER.circle.active,
          step.status === "upcoming" && STEPPER.circle.upcoming,
        )}>
          {step.status === "completed" ? <Check className="size-4" /> : step.id}
        </div>
        <span className={cn(
          STEPPER.label.base,
          step.status === "completed" && STEPPER.label.completed,
          step.status === "active" && STEPPER.label.active,
          step.status === "upcoming" && STEPPER.label.upcoming,
        )}>
          {step.label}
        </span>
      </div>
      {i < steps.length - 1 && (
        <div className={cn(
          STEPPER.connector.base,
          step.status === "completed" ? STEPPER.connector.done : STEPPER.connector.todo
        )} />
      )}
    </>
  ))}
</div>
```

### 8.2 Vertical Stepper (dengan Description)
```tsx
<div className="flex flex-col gap-0">
  {steps.map((step, i) => (
    <div key={step.id} className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={cn(
          STEPPER.circle.base,
          step.status === "completed" ? STEPPER.circle.completed : STEPPER.circle.upcoming
        )}>
          {step.status === "completed" ? <Check className="size-4" /> : step.id}
        </div>
        {i < steps.length - 1 && (
          <div className={cn("w-0.5 flex-1 my-2 min-h-[40px]",
            step.status === "completed" ? STEPPER.connector.done : STEPPER.connector.todo
          )} />
        )}
      </div>
      <div className="flex-1 pb-8">
        <h4 className={cn("text-sm font-bold mb-1", STEPPER.label[step.status])}>
          {step.label}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {step.description}
        </p>
      </div>
    </div>
  ))}
</div>
```

### 8.3 Stepper Navigation (Next/Prev)
```tsx
<div className="flex items-center justify-between mt-6 pt-4 border-t">
  <button
    className={btn("outline", "md")}
    disabled={currentStep === 1}
    onClick={prev}
  >
    <ChevronLeft className="size-4" /> Sebelumnya
  </button>
  <span className="text-sm text-slate-500">
    Langkah {currentStep} dari {totalSteps}
  </span>
  <button
    className={btn("primary", "md")}
    onClick={next}
    disabled={!canProceed}
  >
    {currentStep === totalSteps ? "Selesai" : "Selanjutnya"} <ChevronRight className="size-4" />
  </button>
</div>
```

---

## 9. 🚫 Prohibited Patterns

### Tabs
| Pattern | Why | Replacement |
|---|---|---|
| Tab label uppercase `tracking-widest` | Violates Typography v1.1 | `text-sm font-bold` |
| Active tab tanpa visual affordance | A11y fail | Include bg/underline/text change |
| Tabs dengan >7 items | Overwhelming | Split to sections atau navigation |
| Mixing variant dalam 1 page | Visual chaos | Pick 1 variant consistently |
| Tab clickable tapi tidak switch content | Broken UX | Wire up content switching |
| No keyboard nav | A11y fail | Arrow keys + Home/End |

### Stepper
| Pattern | Why | Replacement |
|---|---|---|
| Stepper > 5 steps (horizontal) | Cluttered | Switch to vertical or split flow |
| No visual distinction between states | Confusing | Colors: emerald/indigo/slate |
| All steps clickable forward | Can skip validation | Only completed steps clickable |
| Stepper tanpa label | Unclear progress | Always include step labels |
| Circle tanpa number/check | Visual void | Always show number or check |
| Connector hardcoded color | No state feedback | Change based on step state |

---

## 10. Migration Guide

### 10.1 Adopt Shadcn Tabs (0 → goal)
Pages yang punya multi-view content:
- **UserProfilePage** — metrics / activity / achievements / security tabs
- **PengaturanPage** — profile / security / team / notifications
- **LaporanPage** — daily / weekly / monthly / yearly reports
- **MLOpsDashboardPage** — models / metrics / experiments

### 10.2 Consolidate Hand-Rolled Steppers
Refactor 26 step references ke `STEPPER.*` tokens:
- **PaymentModal** — 3-step checkout (cart → pay → confirm)
- **CashManagementPage** — close shift flow
- **ExcelImportModal** — upload → preview → confirm

### 10.3 Typography Cleanup
Step button existing pakai `text-[9px] font-black uppercase tracking-widest` — migrate ke normal case per Typography v1.1.

### Code Review Rubric
1. Tab variant mixing dalam 1 view? → **request change**
2. Active tab tanpa visual feedback? → **reject**
3. Stepper > 5 horizontal? → **request change** (vertical)
4. No keyboard nav on tabs? → **reject**
5. Step button uppercase? → **request change**
6. Stepper tanpa connector state feedback? → **request change**

---

## 11. Future Enhancements

- [ ] Animated underline transition (tabs)
- [ ] Progress percentage display (stepper)
- [ ] Collapsed vertical stepper (show only current + completed count)
- [ ] Reorderable tabs (user customization)
- [ ] Tab context menu (close, pin, duplicate — for multi-doc views)
- [ ] Stepper with substeps (nested)
- [ ] Validation gate per step (auto-block forward)
- [ ] Save-as-draft between steps
- [ ] Storybook dengan semua variants

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
