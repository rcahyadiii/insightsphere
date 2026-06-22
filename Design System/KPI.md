# 📈 InsightSphere KPI & Stats System

> **Single source of truth untuk KPI card, trend indicator, dan stats layout.**
> Versi: 1.0 — 23 April 2026
> Implementasi token: `frontend/src/app/lib/data.ts`
> Companion specs: `CARDS.md`, `BADGES.md`, `COLORS.md`, `TYPOGRAPHY.md`

---

## 1. Overview

KPI card = "hero data display" paling dominan di dashboard-like pages (Dashboard, Laporan, MLOps, CashManagement, TransactionHistory). Audit menemukan:

- **24 `text-2xl font-black`** — standard KPI number (dominant)
- **6 `text-3xl font-black`** — larger value (hero KPI)
- **3 `text-4xl font-black`** — xl value (profile hero)
- **17 TrendingUp/Down icons** vs **12 ArrowUp/Down icons** — duplicate semantic

**Issues:**
1. No standard KPI wrapper (24 instances scattered dengan composition yang mirip tapi tidak identik)
2. Trend icon duplikasi — 2 family untuk semantic yang sama
3. No unified trend color policy

Policy ini memformalkan KPI anatomy + trend indicator unified.

---

## 2. Design Principles

### 2.1 KPI Card Anatomy (4 Parts)
```
┌──────────────────────────────────────┐
│ [Label]                  [Icon Box]  │  ← Row 1: label + icon (top-right)
│                                      │
│ [VALUE]                              │  ← Row 2: large number
│                                      │
│ [↑ Trend] vs [comparison]            │  ← Row 3: trend + comparison
└──────────────────────────────────────┘
```

### 2.2 Icon Box Position (Top-Right Standard)
Icon box selalu **top-right** dari KPI (bukan top-left atau side-by-side):
- Scanning pattern → user lihat label dulu, baru context icon
- Consistent dengan card icon box pattern (`CARDS.md §3.3`)

### 2.3 Value Typography (font-black + tabular-nums)
```
text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums
```
- `font-black` (900) untuk emphasis
- `tabular-nums` untuk consistent digit width
- Size: `text-2xl` default, scale up untuk hero

### 2.4 Trend Indicator (Unified: TrendingUp/Down)
**Pilih `TrendingUp`/`TrendingDown`** (lucide icons dengan diagonal line) sebagai standard.

| Family | Keep? | Count | Use for |
|---|:---:|---:|---|
| `TrendingUp` / `TrendingDown` | ✅ | 17 | Trend in KPI cards |
| `ArrowUp` / `ArrowDown` | ❌ | 12 | Migrate or repurpose (stepper, sort, navigation) |

**Kenapa `TrendingUp/Down`?** Icon dengan diagonal line menyampaikan "trend over time" secara visual; `ArrowUp/Down` generic dan bisa ambiguous (sort, navigation, etc.).

### 2.5 Trend Color Semantic
| Direction | Color | Dark mode |
|---|---|---|
| Up (positive) | `text-emerald-600` | `dark:text-emerald-400` |
| Down (negative) | `text-rose-600` | `dark:text-rose-400` |
| Flat (no change) | `text-slate-500` | `dark:text-slate-400` |

**Exception:** Inverted semantics untuk metric "lower is better":
- Biaya naik → `rose` (bad)
- Komplain turun → `emerald` (good)
- **Token menyediakan `TREND.inverted.*` untuk ini.**

### 2.6 Comparison Label (Context)
Setelah trend number, **wajib** ada comparison label untuk context:
- "vs kemarin"
- "vs minggu lalu"
- "vs bulan lalu"
- "dari target"

Tanpa context, trend tidak bermakna.

---

## 3. KPI Size Tiers (3)

| Tier | Value size | Use case |
|:---:|:---:|---|
| `md` | `text-2xl font-black` (24px) | **Default** — dashboard grid |
| `lg` | `text-3xl font-black` (30px) | Featured KPI, primary metric |
| `xl` | `text-4xl font-black` (36px) | Profile hero, single-focus page |

---

## 4. Usage Examples

### 4.1 Standard KPI (Grid Item)
```tsx
import { KPI, TREND, CARD } from "@/app/lib/data";
import { cn } from "@/app/lib/utils";
import { TrendingUp } from "lucide-react";

<div className={KPI.wrapper}>
  <div className="flex items-start justify-between mb-3">
    <span className={KPI.label}>Pendapatan</span>
    <div className={KPI.iconBox.success}>
      <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
    </div>
  </div>
  <div className={KPI.value.md}>Rp 5.2jt</div>
  <div className={cn(TREND.wrapper, TREND.up)}>
    <TrendingUp className="size-3" />
    <span>+12.5%</span>
    <span className="text-[10px] text-slate-400 font-medium">vs kemarin</span>
  </div>
</div>
```

### 4.2 KPI Grid (4 Columns)
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <KpiCard
    label="Pendapatan"
    value="Rp 5.2jt"
    trend={+12.5}
    comparison="vs kemarin"
    icon={DollarSign}
    iconTone="success"
  />
  <KpiCard
    label="Transaksi"
    value="243"
    trend={+5.2}
    comparison="vs kemarin"
    icon={ShoppingCart}
    iconTone="primary"
  />
  <KpiCard
    label="Stok Menipis"
    value="12"
    trend={-3}
    comparison="vs kemarin"
    icon={Package}
    iconTone="warning"
    inverted  // lower is better
  />
  <KpiCard
    label="Refund"
    value="2"
    trend={0}
    comparison="vs kemarin"
    icon={Undo2}
    iconTone="destructive"
  />
</div>
```

### 4.3 Hero KPI (Single Metric)
```tsx
<div className={cn(KPI.wrapper, "p-8")}>
  <div className="flex items-start justify-between mb-4">
    <span className={KPI.label}>Total Pendapatan Bulan Ini</span>
    <div className={KPI.iconBox.success}>
      <DollarSign className="size-5 text-emerald-600 dark:text-emerald-400" />
    </div>
  </div>
  <div className={KPI.value.xl}>Rp 45.2jt</div>
  <div className={cn(TREND.wrapper, TREND.up, "mt-2")}>
    <TrendingUp className="size-4" />
    <span className="text-sm">+18.2%</span>
    <span className="text-xs text-slate-400 font-medium">vs bulan lalu</span>
  </div>
</div>
```

### 4.4 KPI dengan Inverted Semantic (Biaya/Komplain)
```tsx
<div className={KPI.wrapper}>
  <div className="flex items-start justify-between mb-3">
    <span className={KPI.label}>Biaya Operasional</span>
    <div className={KPI.iconBox.warning}>
      <Receipt className="size-4 text-amber-600 dark:text-amber-400" />
    </div>
  </div>
  <div className={KPI.value.md}>Rp 2.1jt</div>
  <div className={cn(TREND.wrapper, TREND.inverted.down)}>
    <TrendingDown className="size-3" />
    <span>-5.2%</span>
    <span className="text-[10px] text-slate-400 font-medium">vs kemarin</span>
  </div>
</div>
{/* Biaya turun = emerald (good), bukan rose */}
```

### 4.5 KPI dengan Breakdown (Secondary Metrics)
```tsx
<div className={cn(KPI.wrapper, "p-6")}>
  <div className="flex items-start justify-between mb-3">
    <span className={KPI.label}>Transaksi Hari Ini</span>
    <div className={KPI.iconBox.primary}>
      <ShoppingCart className="size-4 text-indigo-600 dark:text-indigo-400" />
    </div>
  </div>
  <div className={KPI.value.lg}>243</div>

  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
    <div>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lunas</span>
      <div className="text-sm font-bold text-emerald-600">231</div>
    </div>
    <div>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Refund</span>
      <div className="text-sm font-bold text-rose-600">12</div>
    </div>
  </div>
</div>
```

### 4.6 Sparkline KPI (with Inline Chart)
```tsx
<div className={KPI.wrapper}>
  <div className="flex items-start justify-between mb-2">
    <span className={KPI.label}>Pendapatan 7 Hari</span>
  </div>
  <div className="flex items-end justify-between gap-3">
    <div>
      <div className={KPI.value.md}>Rp 32jt</div>
      <div className={cn(TREND.wrapper, TREND.up)}>
        <TrendingUp className="size-3" />
        <span>+8.4%</span>
      </div>
    </div>
    <Sparkline data={last7Days} className="w-24 h-12 text-emerald-500" />
  </div>
</div>
```

---

## 5. Icon Box Semantic Mapping

Mirror pattern dari `CARDS.md §3.3` — setiap KPI punya icon box top-right dengan warna yang match semantic:

| Semantic | Token | Color | Use case |
|---|---|---|---|
| Financial positive | `KPI.iconBox.success` | emerald | Pendapatan, Profit |
| Primary metric | `KPI.iconBox.primary` | indigo | Transaksi, Pengguna aktif |
| Warning | `KPI.iconBox.warning` | amber | Stok menipis, Pending |
| Destructive | `KPI.iconBox.destructive` | rose | Refund, Error |
| Info | `KPI.iconBox.info` | blue | Informational |
| Neutral | `KPI.iconBox.neutral` | slate | Generic stat |
| AI / Purple | `KPI.iconBox.ai` | violet/indigo | AI metric, prediction |

---

## 6. 🚫 Prohibited Patterns

| Pattern | Why | Replacement |
|---|---|---|
| KPI value tanpa `tabular-nums` | Misaligned digits antar card | Always include |
| KPI tanpa comparison label | Trend tidak bermakna | Always include "vs X" |
| `ArrowUp/Down` untuk trend | Ambiguous semantic | `TrendingUp/Down` |
| Trend warna arbitrary | Inconsistent | `emerald` up / `rose` down / `slate` flat |
| KPI value `font-bold` (bukan black) | Weak emphasis | `font-black` |
| Icon box di kiri atas | Non-standard position | Top-right |
| KPI dengan 2+ icons | Visual clutter | 1 icon box only |
| Trend number tanpa direction icon | Weak affordance | Always include arrow icon |
| Percentage tanpa %, ribuan tanpa format | Unreadable | Format Rp / % / K/M |
| Label uppercase `tracking-widest` (modern KPI) | Violates Typography v1.1 | Title Case |
| Exception: KPI breakdown mini-labels | `T.micro` pattern allowed | 10px uppercase tracking-wider |

---

## 7. Migration Guide

### 7.1 Trend Icon Unification (12 ArrowUp/Down → TrendingUp/Down)
Scan:
```diff
- import { ArrowUp, ArrowDown } from "lucide-react";
+ import { TrendingUp, TrendingDown } from "lucide-react";

- <ArrowUp className="size-3 text-emerald-500" />
+ <TrendingUp className="size-3 text-emerald-600 dark:text-emerald-400" />
```

**Catatan:** `ArrowUp/Down` masih boleh dipakai untuk **non-trend** contexts (stepper input, pagination, table sort — tapi sort sebaiknya `ChevronUp/Down`).

### 7.2 KPI Token Adoption
Refactor scattered KPI:
```diff
- <div className="rounded-2xl bg-white ... p-5 ...">
-   <div className="flex items-start justify-between mb-3">
-     <span className="text-xs font-bold text-slate-500">Pendapatan</span>
-     <div className="p-2 rounded-xl bg-emerald-50"><TrendingUp /></div>
-   </div>
-   <div className="text-2xl font-black">Rp 5.2jt</div>
- </div>
+ <div className={KPI.wrapper}>
+   <div className="flex items-start justify-between mb-3">
+     <span className={KPI.label}>Pendapatan</span>
+     <div className={KPI.iconBox.success}><TrendingUp /></div>
+   </div>
+   <div className={KPI.value.md}>Rp 5.2jt</div>
+ </div>
```

### 7.3 Trend Color Standardization
Scan trend colors:
- `text-green-*` → `text-emerald-600 dark:text-emerald-400`
- `text-red-*` → `text-rose-600 dark:text-rose-400`
- Ad-hoc → `TREND.up` / `TREND.down` / `TREND.flat`

### 7.4 Comparison Label Addition
Audit KPI tanpa comparison label → tambah:
```diff
- <div className="text-xs text-emerald-600">+12.5%</div>
+ <div className={cn(TREND.wrapper, TREND.up)}>
+   <TrendingUp className="size-3" />
+   <span>+12.5%</span>
+   <span className="text-[10px] text-slate-400 font-medium">vs kemarin</span>
+ </div>
```

### Per-page priority
1. **DashboardPage** — 4-6 KPI cards, highest visibility
2. **LaporanPage** — 4 KPI (recently refactored to business language)
3. **CashManagementPage** — 4 KPI (recently aligned)
4. **MLOpsDashboardPage** — model performance KPIs
5. **TransactionHistoryPage** — summary KPIs
6. **PrediksiStokPage** — forecast accuracy KPI

### Code Review Rubric
1. KPI value tanpa `tabular-nums`? → **request change**
2. Trend pakai `ArrowUp/Down`? → **request change** (use `TrendingUp/Down`)
3. Trend color bukan `TREND.*`? → **request change**
4. Missing comparison label? → **request change**
5. Icon box bukan top-right? → **request change**
6. KPI value bukan `font-black`? → **request change**
7. Warna semantic arbitrary (bukan dari palette)? → **reject**
8. Missing dark mode pair? → **reject**

---

## 8. Future Enhancements

- [ ] Dedicated `<KpiCard>` component dengan props typed
- [ ] Sparkline integration (mini chart in KPI)
- [ ] Threshold indicator (red zone, green zone)
- [ ] Goal progress bar in KPI
- [ ] Animated number counter (count-up animation on mount)
- [ ] Drill-down click handler (KPI click → detail page)
- [ ] Comparison variants (WoW / MoM / YoY selector)
- [ ] Loading skeleton variant untuk KPI
- [ ] Empty state variant (no data yet)
- [ ] Storybook page dengan semua KPI variants

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
