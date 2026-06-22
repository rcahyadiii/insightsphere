# ⏳ InsightSphere Loading System

> **Single source of truth untuk spinner, skeleton, progress bar, dan loading states.**
> Versi: 1.0 — 23 April 2026
> Implementasi: `frontend/src/app/components/Skeletons.tsx` + `frontend/src/app/lib/feedback.ts`
> Companion specs: `TOASTS.md`, `EMPTY_STATES.md`, `ALERTS.md`, `MOTION.md`, `BUTTONS.md`

---

## 1. Overview

InsightSphere sudah heavily invested in loading UI:
- **`Skeletons.tsx`** (588 LOC) — 10 specialized skeleton components
- **Sonner toast** — `toast.loading()` untuk long async
- **`<Loader2>` icon** — 8 instances di button loading (4 size variance)
- **shadcn `<Skeleton>` primitive** — di `components/ui/skeleton.tsx`

**Issues teridentifikasi:**
1. Spinner size inconsistent (`w-3.5`, `w-4`, `w-5`, `w-6`) — butuh 3-4 tier standard
2. Skeleton usage strategy undocumented
3. No progress bar pattern
4. Loading decision rule (spinner vs skeleton vs toast) tidak formal

---

## 2. Loading Strategy Matrix

| Scenario | Pattern | Why |
|---|---|---|
| **Page-level fetch** (route change) | **Skeleton** | Perceived performance, preserves layout |
| **Section re-fetch** (filter change) | Skeleton overlay | Context-preserving |
| **Button action** (save, delete) | **Spinner in button** | Immediate feedback at action source |
| **Background task** (export, backup) | **Toast loading + promise** | Non-blocking, async progress |
| **Long determinate op** (file upload 0-100%) | **Progress bar** | Shows completion ETA |
| **Initial app load** | **Full-screen loader** | Once, before app mount |
| **Instant op** (< 100ms) | **Nothing** | Too fast to justify UI |

**Rule: Skeleton > Spinner** untuk content-heavy areas (table, chart, KPI). Spinner hanya untuk button/tiny contexts.

---

## 3. Spinner System

### 3.1 Size Tiers (4)
Pakai `Loader2` dari lucide dengan sizing konsisten:

| Tier | Class | Pixel | Use case |
|:---:|:---:|:---:|---|
| `xs` | `size-3 animate-spin` | 12px | Inline small button, badge |
| `sm` | `size-4 animate-spin` | 16px | Form button, compact context |
| **`md`** | **`size-5 animate-spin`** | **20px** | **Default** — page spinner |
| `lg` | `size-6 animate-spin` | 24px | Prominent inline loader |
| `xl` | `size-8 animate-spin` | 32px | Full-screen loader |

### 3.2 Spinner Color Policy
```
text-slate-400 dark:text-slate-500   // neutral (default)
text-indigo-500 dark:text-indigo-400  // branded (primary spinner)
text-white                            // on colored bg (in button solid)
```

### 3.3 Usage Examples

**In button (loading):**
```tsx
<button className={btn("primary", "md")} disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className={cn(LOADING.spinner.sm, "mr-2")} />
      Menyimpan...
    </>
  ) : (
    <>
      <Save className="size-4 mr-2" />
      Simpan
    </>
  )}
</button>
```

**Inline loader:**
```tsx
<div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
  <Loader2 className={LOADING.spinner.md} />
  <span className="text-sm">Memuat data...</span>
</div>
```

**Full-screen loader:**
```tsx
<div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-slate-900 z-50">
  <div className="flex flex-col items-center gap-4">
    <Loader2 className={cn(LOADING.spinner.xl, "text-indigo-500")} />
    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Memuat aplikasi...</p>
  </div>
</div>
```

---

## 4. Skeleton System

### 4.1 When to Use Skeleton
✅ **Use skeleton for:**
- Initial page load
- Data table refresh
- Chart re-render
- Grid of items (products, KPI cards)
- List of items (transactions, notifications)

❌ **Do NOT use skeleton for:**
- Button loading state (use spinner)
- Form submission (use spinner + toast)
- Quick operations < 300ms (use nothing)
- Overlays/modals (already transient)

### 4.2 Existing Skeleton Library
File: `frontend/src/app/components/Skeletons.tsx`

| Component | Use case |
|---|---|
| `StatsSkeleton` | Summary KPI cards (icon / kpi variant) |
| `ChartSkeleton` | Bar / pie / horizontal bar charts |
| `ProductGridSkeleton` | 5-col product grid |
| `TableSkeleton` | Generic table placeholder |
| `SettingsShellSkeleton` | PengaturanPage profile tab |
| `UserProfileSkeleton` | UserProfilePage full |
| `InventoryTableSkeleton` | InventarisPage 5-col table |
| `PredictionTableSkeleton` | PrediksiStokPage 6-col table |
| `KPICardsSkeleton` | Dashboard KPI 4-col grid |
| `OverviewTableSkeleton` | General 6-col overview |

### 4.3 Skeleton Base Styling
```
animate-pulse bg-slate-100 dark:bg-slate-800 rounded
```

Shadcn `<Skeleton>` primitive (di `components/ui/skeleton.tsx`) pakai pattern ini dengan tambahan `rounded-md` default.

### 4.4 Skeleton Anatomy Rules
| Element | Height | Use |
|---|---|---|
| Label / caption | `h-2` / `h-2.5` | Thin horizontal line |
| Title / heading | `h-3` / `h-4` | Regular text line |
| Large value (KPI) | `h-5` / `h-6` / `h-8` | Big number/title |
| Button | `h-10` / `h-11` | Matches real button |
| Avatar / icon box | `size-8` / `size-10` / `size-16` | Matches real icon |
| Card | `h-[200px]` etc. | Matches real card height |

**Opacity for hierarchy:**
```
opacity-30 / opacity-40 → very muted (tiny details)
opacity-50 / opacity-60 → normal muted
(no opacity)            → full emphasis (main title)
```

### 4.5 Matching Real Layout
Skeleton **harus** match real layout exactly:
- Same grid structure (cols, gap)
- Same padding (p-5 matches real card p-5)
- Same border + radius
- Same number of rows/items (typically 4-6)

**Why:** Layout shift (skeleton → real content) = bad UX. Matched skeleton = seamless transition.

### 4.6 Usage Example
```tsx
import { KPICardsSkeleton, ChartSkeleton } from "@/app/components/Skeletons";

function DashboardPage() {
  const { data, isLoading } = useQuery({...});

  if (isLoading) {
    return (
      <div className="space-y-6">
        <KPICardsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton type="bar" />
          <ChartSkeleton type="pie" />
        </div>
      </div>
    );
  }

  return <RealDashboard data={data} />;
}
```

---

## 5. Progress Bar

### 5.1 When to Use
- File upload / download with %
- Multi-step wizard with step X / Y
- Determinate background task dengan ETA
- Onboarding progress

❌ **Not for:**
- Indeterminate loading (use spinner/skeleton)
- Generic "progress" tanpa known completion

### 5.2 Anatomy
```
┌─────────────────────────────────┐
│████████████░░░░░░░░░░░░░░░░░░░░│  ← Filled portion (indigo) + track (slate-100)
└─────────────────────────────────┘
Uploading... 45% (4 of 10 files)  ← Label (optional)
```

### 5.3 Token
```tsx
PROGRESS.track      // h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden
PROGRESS.fill       // h-full bg-indigo-500 dark:bg-indigo-400 transition-all duration-300
PROGRESS.label      // text-xs text-slate-500 dark:text-slate-400 mt-1
```

### 5.4 Usage
```tsx
<div>
  <div className={PROGRESS.track}>
    <div className={PROGRESS.fill} style={{ width: `${percent}%` }} />
  </div>
  <p className={PROGRESS.label}>
    Mengunggah... {percent}% ({done} dari {total} file)
  </p>
</div>
```

### 5.5 Variants
| Variant | Fill color | Use |
|---|---|---|
| `primary` (default) | `indigo-500` | General progress |
| `success` | `emerald-500` | Near completion / positive metric |
| `warning` | `amber-500` | Slow / warning level |
| `destructive` | `rose-500` | Error-prone / over limit |

---

## 6. Loading Button Pattern (Integrate dengan buttons.ts)

### 6.1 Basic Pattern
```tsx
<button
  className={btn("primary", "md")}
  disabled={isLoading}
>
  {isLoading ? (
    <Loader2 className="size-4 animate-spin" />
  ) : (
    <Save className="size-4" />
  )}
  {isLoading ? "Menyimpan..." : "Simpan"}
</button>
```

### 6.2 Spinner Size Match Button Size
| Button size | Spinner size |
|:---:|:---:|
| `sm` | `size-3` (xs) |
| `md` | `size-4` (sm) |
| `lg` | `size-5` (md) |
| `xl` | `size-5` (md) |

### 6.3 Disabled Styling (Auto)
`disabled:opacity-60 disabled:cursor-not-allowed` sudah include di `BTN.base` (dari `buttons.ts`). Tinggal set `disabled={isLoading}`.

---

## 7. 🚫 Prohibited Patterns

| Pattern | Why | Replacement |
|---|---|---|
| Spinner size ad-hoc (`w-3.5`, `w-7`, dll) | Variance | `LOADING.spinner.{xs/sm/md/lg/xl}` |
| Skeleton yang tidak match layout real | Causes jarring transition | Match grid + padding + size exactly |
| `animate-spin` tanpa `Loader2` icon | Odd element rotating | Use `<Loader2>` from lucide |
| Spinner untuk page-level load | Worse perceived perf | Skeleton |
| Skeleton untuk button loading | Too heavy for button | Spinner |
| Spinner + skeleton bersamaan | Double loading indicator | Pick one |
| Loading state persistent tanpa timeout | User stuck | Handle error + timeout |
| Progress bar tanpa label | No context for user | Include "% (x of y)" label |
| Progress bar untuk indeterminate task | Wrong pattern | Use spinner or skeleton |
| Skeleton opacity tidak konsisten | Hierarchy violation | opacity-30/50/70 scale |
| Skeleton tanpa dark mode | Breaks dark theme | `bg-slate-100 dark:bg-slate-800` |
| Full-page spinner bawaan (pre-hydration) | Usually FOUC | Next.js `loading.tsx` + skeleton |

---

## 8. Migration Guide

### 8.1 Spinner Size Unification (8 instances)
Scan `<Loader2>`:
```diff
- <Loader2 className="w-3.5 h-3.5 animate-spin" />
+ <Loader2 className={LOADING.spinner.xs} />   // size-3

- <Loader2 className="w-4 h-4 animate-spin" />
+ <Loader2 className={LOADING.spinner.sm} />   // size-4

- <Loader2 className="w-5 h-5 animate-spin" />
+ <Loader2 className={LOADING.spinner.md} />   // size-5
```

### 8.2 Button Loading Pattern Adoption
Ensure all long-async buttons use spinner + disabled pattern (§6).

### 8.3 Skeleton Library Adoption
Document existing `Skeletons.tsx` variants as canonical. Future skeleton additions masuk ke file yang sama.

### 8.4 Progress Bar Introduction
Currently minimal usage. Add where appropriate:
- File import progress (ExcelImportModal)
- Export progress (LaporanPage download report)
- Backup progress (Pengaturan)
- Onboarding wizard

### Per-page priority
1. **InventarisPage + ExcelImportModal** — import progress
2. **LaporanPage** — export progress
3. **Loading buttons** across all pages (8 instances)
4. **Spinner sizes** — unify semua `<Loader2>`

### Code Review Rubric
1. Spinner size non-standard? → **request change**
2. Skeleton tidak match real layout? → **request change**
3. Button loading tanpa spinner? → **request change**
4. Page-load pakai spinner (bukan skeleton)? → **request change**
5. Long async tanpa loading indicator? → **reject**
6. Progress bar tanpa label? → **request change**
7. Missing dark mode di skeleton? → **reject**

---

## 9. Future Enhancements

- [ ] Shimmer animation variant (alternative to `animate-pulse`)
- [ ] Optimistic UI pattern (immediate update + rollback on error)
- [ ] Suspense boundaries integration (React Server Components)
- [ ] Loading state persistence (survive route change for background tasks)
- [ ] Auto-extend skeleton count based on viewport (responsive skeleton)
- [ ] Progress bar with step indicator (multi-step wizard)
- [ ] Estimated time remaining untuk long tasks
- [ ] Visual hint: skeleton → fade-in real content (`M.fadeInSoft`)
- [ ] Storybook dengan all loading states

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
