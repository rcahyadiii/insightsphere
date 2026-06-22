# 📊 InsightSphere Charts & Data Visualization System

> **Single source of truth untuk Recharts patterns: palette, axis, grid, tooltip, legend, dan chart-type best practices.**
> Versi: 1.0 — 23 April 2026
> Implementasi token: `frontend/src/app/lib/charts.ts`
> Companion specs: `COLORS.md`, `TYPOGRAPHY.md`, `OVERLAYS.md`, `KPI.md`, `CARDS.md`

---

## 1. Overview

Audit chart ecosystem InsightSphere:

| Aspect | Detail |
|---|---|
| **Library** | `recharts` |
| **Files using charts** | 9 (LaporanPage, MLOpsDashboard, PrediksiStok, ExplanationCharts, XAI, ForecastChart, TopProductsChart, InventarisPage) |
| **Chart types** | BarChart (9), AreaChart (4), RadarChart (2), LineChart (1), PieChart (1) |
| **ResponsiveContainer** | 15 instances |
| **Hex colors hardcoded** | 87 instances — `#6366f1` indigo-500 dominant (19×) |
| **ChartContainer (shadcn)** | 1 instance (underused) |
| **Custom tooltip** | 1 implementation (ForecastChart) |

Policy ini memformalkan:
1. **Chart color palette** — indigo primary + slate neutrals + semantic accents
2. **Axis/grid/tooltip/legend standard** per chart type
3. **Dark mode adaptation** (previously static)
4. **CustomTooltip pattern** (reusable, typography-compliant)
5. **ChartContainer (shadcn) adoption** guidelines
6. **Chart height tiers** dan layout conventions

**Note:** Recharts `<Tooltip>` berbeda dari UI Tooltip (`OVERLAYS.md §5`). Jangan tertukar.

---

## 2. Design Principles

### 2.1 Data-Ink Ratio First
Per Tufte: hapus ink yang tidak menyampaikan data. InsightSphere charts:
- ❌ No thick borders around chart area
- ❌ No unnecessary gridlines (vertical usually redundant)
- ❌ No 3D effects, drop shadows pada bars
- ✅ Dashed horizontal grid saja (subtle reference)
- ✅ Axis lines dihidden (tickLine={false} axisLine={false})
- ✅ Gradient fill sparing (only for hero charts)

### 2.2 Color Palette Semantic
Chart colors ikut design system palette (`COLORS.md`):
- **Primary series:** Indigo-500 (`#6366f1`)
- **Secondary:** Emerald-500 (`#10b981`)
- **Neutrals:** Slate-400/500 (axis, grid)
- **Semantic:** Rose (negative/loss), Amber (warning), Blue (info), Violet (AI)

**NEVER** gunakan random hex (`#ff0000`, `#0000ff`) atau palette di luar sistem.

### 2.3 Dark Mode Parity
Chart harus adapt ke theme. Current: 87 hex colors static. Target: gunakan `useTheme()` hook + `CHART_COLORS.*` yang provide light/dark pair.

### 2.4 Typography in Charts
Per `TYPOGRAPHY.md v1.1`:
- Axis tick: `fontSize: 11` + `font-weight: 500` — **NO uppercase**
- Tooltip label: `text-xs font-bold`
- Legend: `text-xs font-medium`
- ❌ Jangan pakai `font-weight: 900` + uppercase + tracking-widest di chart (existing ForecastChart violating ini)

### 2.5 Tooltip Wajib untuk Data Accuracy
Default Recharts tooltip jelek. **Semua chart yang punya `<Tooltip>`** harus pakai `content={<ChartTooltip />}` (custom) atau `contentStyle`/`labelStyle` via tokens.

### 2.6 Legend Policy
- **Chart dengan 1 series:** Legend tidak perlu (inferred dari title)
- **Chart dengan 2+ series:** Legend wajib
- **Pie chart:** Legend wajib (categorical)
- Position: `bottom` standard, `right` untuk chart tinggi

### 2.7 Responsive by Default
Selalu wrap chart dalam `<ResponsiveContainer width="100%" height={...}>`. Never fixed width.

### 2.8 Height Tiers
| Tier | Height | Use case |
|---|:---:|---|
| `sm` | 200px | Card sparkline, mini widget |
| `md` | 280px | Dashboard card standard |
| `lg` | 360px | Dedicated chart section |
| `xl` | 440px | Full-page chart |

---

## 3. Chart Color Palette

### 3.1 Single Series (Primary)
```
Primary color:  Indigo-500 (#6366f1)
Gradient fill:  Indigo-500 → Indigo-300 (for AreaChart)
Hover/active:   Indigo-600 (#4f46e5)
```

### 3.2 Multi-Series Palette (7 Colors)
Ordered — pakai berurutan untuk series 1, 2, 3, dst:
```
1. Indigo-500   #6366f1  (primary)
2. Emerald-500  #10b981  (secondary — success/positive)
3. Amber-500    #f59e0b  (tertiary — warning/attention)
4. Blue-500     #3b82f6  (info)
5. Violet-500   #8b5cf6  (AI/predictive)
6. Rose-500     #f43f5e  (negative/loss)
7. Teal-500     #14b8a6  (quinary/balance)
```

### 3.3 Neutrals (Axis + Grid)
```
Grid (light):     Slate-100 (#f1f5f9)
Grid (dark):      Slate-800 (#1e293b)
Axis stroke:      Slate-400 (#94a3b8)
Axis stroke dark: Slate-500 (#64748b)
Tick labels:      Slate-500 / Slate-400 (dark)
Zero line:        Slate-300 / Slate-600 (dark)
```

### 3.4 Tooltip Surface
```
Background:        White (#ffffff) / Slate-900 (dark)
Border:            Slate-200 (#e2e8f0) / Slate-800 (dark)
Shadow:            shadow-md (via className)
```

### 3.5 Semantic Accents
Ikut `COLORS.md`:
| Purpose | Color | Hex |
|---|---|---|
| Success / Positive trend | emerald-500 | `#10b981` |
| Warning / Threshold | amber-500 | `#f59e0b` |
| Destructive / Loss / Alert | rose-500 | `#f43f5e` |
| Info / Neutral highlight | blue-500 | `#3b82f6` |
| AI / Predictive / Forecast | violet-500 | `#8b5cf6` |

---

## 4. Axis Styling

### 4.1 Default Tokens
```tsx
<XAxis
  stroke="#94a3b8"        // axis line color (hidden via axisLine={false})
  fontSize={11}            // tick label
  tickLine={false}         // hide tick marks
  axisLine={false}         // hide axis line
  tick={{ fill: "#64748b" }}  // tick label color
  dy={10}                  // vertical offset
/>

<YAxis
  stroke="#94a3b8"
  fontSize={11}
  tickLine={false}
  axisLine={false}
  tick={{ fill: "#64748b" }}
  dx={-10}
/>
```

### 4.2 Axis Typography
- Font size: `11px` (tick labels)
- Font weight: `500` (medium) — **NO `font-weight: 900`**
- Color: `slate-500` light, `slate-400` dark
- **NO uppercase, NO tracking-widest**

### 4.3 Number Formatting (YAxis)
Untuk angka besar, format dengan shorthand:
```tsx
<YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
// 12000 → "12K"
// 1500000 → "1.5M"
```

Untuk currency Rupiah:
```tsx
<YAxis tickFormatter={(v) => `Rp ${v.toLocaleString("id-ID")}`} />
```

### 4.4 Date Axis (XAxis dengan timestamp)
```tsx
<XAxis
  dataKey="date"
  tickFormatter={(v) => format(new Date(v), "dd MMM", { locale: id })}
/>
```

---

## 5. Grid Styling

### 5.1 Default: Horizontal Dashed
```tsx
<CartesianGrid
  stroke="#f1f5f9"         // slate-100
  strokeDasharray="3 3"    // dashed
  vertical={false}         // hanya horizontal
/>
```

### 5.2 Kenapa Horizontal Saja?
Vertical grid lines biasanya redundant dengan x-axis tick labels. Horizontal grid membantu mata baca value di y-axis.

### 5.3 Dark Mode
```tsx
stroke="#1e293b"  // slate-800
```

### 5.4 No Grid (Minimalist)
Untuk sparkline / hero chart clean:
```tsx
// Omit <CartesianGrid /> entirely
```

---

## 6. Tooltip Pattern

### 6.1 Default Recharts Tooltip Buruk
Default tooltip tidak bisa dark mode, styling jelek, tidak match design system. **Selalu customize**.

### 6.2 Custom Tooltip via `contentStyle` (Simple)
Untuk tooltip sederhana:
```tsx
<Tooltip
  contentStyle={{
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "0.75rem",  // rounded-xl
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    fontSize: "12px",
    fontWeight: 500,
  }}
  labelStyle={{ color: "#0f172a", fontWeight: 700, marginBottom: 4 }}
  cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}  // indigo-500/8
/>
```

### 6.3 CustomTooltip Component (Rich)
Untuk tooltip kompleks (multi-series, alerts, formatting):
```tsx
import { ChartTooltip } from "@/app/components/charts/ChartTooltip";

<Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(99, 102, 241, 0.08)" }} />
```

### 6.4 ChartTooltip Component Template
```tsx
// frontend/src/app/components/charts/ChartTooltip.tsx
import { cn } from "@/app/lib/utils";
import { CHART_TOOLTIP } from "@/app/lib/charts";

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  /** Format value untuk display (e.g., currency, number shorthand). */
  formatter?: (value: number, name: string) => string;
  /** Custom label formatter (e.g., date formatting). */
  labelFormatter?: (label: string) => string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className={CHART_TOOLTIP.wrapper}>
      <p className={CHART_TOOLTIP.label}>
        {labelFormatter ? labelFormatter(label || "") : label}
      </p>
      <div className="space-y-1.5 mt-2">
        {payload.map((entry, i) => (
          <div key={i} className={CHART_TOOLTIP.row}>
            <div className="flex items-center gap-2">
              <div
                className={CHART_TOOLTIP.dot}
                style={{ backgroundColor: entry.color }}
              />
              <span className={CHART_TOOLTIP.name}>{entry.name}</span>
            </div>
            <span className={CHART_TOOLTIP.value}>
              {formatter ? formatter(entry.value, entry.name) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 6.5 Tooltip Cursor
Cursor = highlight di bawah tooltip (bar chart area, vertical line di line chart):
```tsx
// BarChart cursor
cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}   // faint indigo

// LineChart/AreaChart cursor
cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "3 3" }}
```

---

## 7. Legend Styling

### 7.1 Default Tokens
```tsx
<Legend
  iconType="circle"                    // not default square
  iconSize={8}                          // small dots
  wrapperStyle={{
    paddingTop: "16px",
    fontSize: "12px",
    fontWeight: 500,
  }}
  formatter={(value) => (
    <span className="text-slate-600 dark:text-slate-400">{value}</span>
  )}
/>
```

### 7.2 Position Policy
- **Bottom (default):** Most charts
- **Right:** Tall charts atau many series (>4)
- **Top:** Rare, hanya untuk korporat style header
- **None:** Single-series chart

### 7.3 Custom Legend Component
Untuk full control (custom click behavior, hover highlight):
```tsx
<Legend content={<CustomLegend />} />
```

---

## 8. Chart Type Guides

### 8.1 BarChart
Use for: **Kategorical comparison** (top produk, sales per category, stock levels)

```tsx
<ResponsiveContainer width="100%" height={CHART_HEIGHT.md}>
  <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
    <CartesianGrid {...CHART_GRID} />
    <XAxis dataKey="name" {...CHART_AXIS} />
    <YAxis {...CHART_AXIS} />
    <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(99, 102, 241, 0.08)" }} />
    <Bar
      dataKey="value"
      fill={CHART_COLORS.primary.base}
      radius={[8, 8, 0, 0]}          // rounded top corners
      maxBarSize={48}                 // prevent overly thick bars
    />
  </BarChart>
</ResponsiveContainer>
```

**Principles:**
- Rounded top corners (`radius={[8, 8, 0, 0]}`)
- `maxBarSize={48}` agar tidak terlalu lebar saat data sedikit
- Horizontal bar: swap `<BarChart layout="horizontal">` → `layout="vertical"` (Recharts terminology confusing)

### 8.2 LineChart
Use for: **Trend over time** (sales trend, forecast)

```tsx
<LineChart data={data}>
  <CartesianGrid {...CHART_GRID} />
  <XAxis dataKey="date" {...CHART_AXIS} />
  <YAxis {...CHART_AXIS} />
  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#cbd5e1", strokeWidth: 1, strokeDasharray: "3 3" }} />
  <Line
    type="monotone"                   // smooth curve
    dataKey="sales"
    stroke={CHART_COLORS.primary.base}
    strokeWidth={2}
    dot={false}                        // no dots per data point
    activeDot={{ r: 5, fill: CHART_COLORS.primary.base }}  // dot on hover
  />
</LineChart>
```

**Principles:**
- `type="monotone"` untuk smooth curve (vs "linear" yang angular)
- `strokeWidth: 2` default; `3` untuk hero
- `dot={false}` — plotting dots menambah noise
- `activeDot` on hover (interactive affordance)

### 8.3 AreaChart
Use for: **Volume trend** (cumulative sales, inventory over time)

```tsx
<AreaChart data={data}>
  <defs>
    <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={CHART_COLORS.primary.base} stopOpacity={0.3} />
      <stop offset="100%" stopColor={CHART_COLORS.primary.base} stopOpacity={0} />
    </linearGradient>
  </defs>
  <CartesianGrid {...CHART_GRID} />
  <XAxis dataKey="date" {...CHART_AXIS} />
  <YAxis {...CHART_AXIS} />
  <Tooltip content={<ChartTooltip />} />
  <Area
    type="monotone"
    dataKey="value"
    stroke={CHART_COLORS.primary.base}
    strokeWidth={2}
    fill="url(#colorPrimary)"
  />
</AreaChart>
```

**Principles:**
- Gradient fill (opacity 0.3 → 0) untuk depth
- Define gradient in `<defs>` per chart
- Unique `id` per gradient jika multiple charts in same page

### 8.4 PieChart / Donut
Use for: **Komposisi** (kategori share, budget breakdown)

```tsx
<PieChart>
  <Pie
    data={data}
    dataKey="value"
    nameKey="name"
    cx="50%"
    cy="50%"
    innerRadius={60}            // Donut (omit untuk Pie solid)
    outerRadius={90}
    paddingAngle={2}             // gap antar slices
  >
    {data.map((entry, i) => (
      <Cell key={i} fill={CHART_COLORS.series[i % CHART_COLORS.series.length]} />
    ))}
  </Pie>
  <Tooltip content={<ChartTooltip />} />
  <Legend {...CHART_LEGEND.default} />
</PieChart>
```

**Principles:**
- **Prefer Donut** (innerRadius > 0) daripada solid Pie — lebih modern
- `paddingAngle: 2` untuk visual separation
- Max 7 slices (lebih dari itu pakai Bar horizontal)
- Legend wajib (categorical)

### 8.5 RadarChart
Use for: **Multi-dimensional comparison** (skill profile, XAI factors)

```tsx
<RadarChart data={data} outerRadius={80}>
  <PolarGrid stroke="#e2e8f0" />
  <PolarAngleAxis dataKey="factor" tick={{ fontSize: 11, fill: "#64748b" }} />
  <PolarRadiusAxis tick={false} axisLine={false} />
  <Radar
    name="Current"
    dataKey="value"
    stroke={CHART_COLORS.primary.base}
    fill={CHART_COLORS.primary.base}
    fillOpacity={0.3}
  />
</RadarChart>
```

**Principles:**
- Max 6-8 vertices (lebih dari itu tidak terbaca)
- FillOpacity 0.3 (area terlihat tapi overlap readable)
- Multi-layer (compare 2 datasets): opacity 0.3 each

### 8.6 Sparkline (Mini Chart)
Use for: **Inline trend di KPI card** (no axis, no tooltip, no legend)

```tsx
<ResponsiveContainer width="100%" height={40}>
  <LineChart data={data}>
    <Line
      type="monotone"
      dataKey="value"
      stroke={CHART_COLORS.primary.base}
      strokeWidth={2}
      dot={false}
    />
  </LineChart>
</ResponsiveContainer>
```

**Principles:**
- Height `40-60px` only
- No axes, grid, tooltip, legend — pure line
- Single color
- Pair with KPI number (see `KPI.md`)

---

## 9. ChartContainer (Shadcn) — Adoption Guide

Shadcn `<ChartContainer>` (`ui/chart.tsx`) = wrapper yang provide CSS variables + responsive. Currently 1 usage.

### 9.1 When to Use
- **Gunakan** jika butuh theme-aware colors via CSS vars (`--chart-1`, `--chart-2`, etc.)
- **Skip** jika chart simple dan pakai `CHART_COLORS.*` langsung

### 9.2 Config Pattern
```tsx
import { ChartContainer, type ChartConfig } from "@/app/components/ui/chart";

const chartConfig = {
  sales: {
    label: "Penjualan",
    color: "hsl(var(--chart-1))",
  },
  forecast: {
    label: "Prediksi AI",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

<ChartContainer config={chartConfig} className="h-[280px]">
  <LineChart data={data}>
    {/* ...use var(--color-sales), var(--color-forecast) */}
    <Line dataKey="sales" stroke="var(--color-sales)" />
  </LineChart>
</ChartContainer>
```

---

## 10. Dark Mode Integration

### 10.1 Hook Pattern
```tsx
import { useTheme } from "next-themes";
import { CHART_COLORS, getChartColors } from "@/app/lib/charts";

function MyChart() {
  const { resolvedTheme } = useTheme();
  const colors = getChartColors(resolvedTheme as "light" | "dark");

  return (
    <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
    // ... dst
  );
}
```

### 10.2 CSS Variable Alternative
Jika pakai `ChartContainer`, warna otomatis adapt via CSS `var(--chart-N)` dengan definisi di `theme.css`:
```css
:root {
  --chart-1: 239 84% 67%;  /* indigo-500 */
  --chart-2: 160 84% 39%;  /* emerald-500 */
  /* ... */
}
.dark {
  --chart-1: 234 89% 74%;  /* indigo-400 brighter for dark */
  /* ... */
}
```

### 10.3 Inline Conditional
Untuk chart sederhana:
```tsx
const isDark = resolvedTheme === "dark";
<CartesianGrid stroke={isDark ? "#1e293b" : "#f1f5f9"} />
```

---

## 11. 🚫 Prohibited Patterns

| Pattern | Why | Replacement |
|---|---|---|
| Random hex colors (`#ff0000`, `#ab34ef`) | Violates palette | Use `CHART_COLORS.*` |
| Default Recharts tooltip (tanpa customize) | Ugly, no dark mode | `<ChartTooltip>` atau `contentStyle` |
| `font-weight: 900` + uppercase di chart text | Violates Typography v1.1 | `font-weight: 500-700` normal case |
| Vertical grid lines (`vertical={true}` default) | Redundant dengan x-axis | `vertical={false}` |
| Axis line + tick line visible | Clutter | `axisLine={false} tickLine={false}` |
| Fixed width chart (`<LineChart width={600}>`) | Not responsive | Always wrap `<ResponsiveContainer>` |
| 3D effects, drop shadows on bars | Violates data-ink | Flat design |
| `strokeWidth: 4+` (terlalu thick) | Overwhelms data | `strokeWidth: 2` default, `3` hero max |
| Chart > 8 series di 1 chart | Unreadable | Split atau use filtering |
| Pie chart > 7 slices | Too many categories | Use BarChart horizontal atau group "Others" |
| Dot pada LineChart (`dot={true}`) | Noise | `dot={false}`, gunakan `activeDot` |
| Tooltip pakai `<Tooltip>` (UI shadcn) di dalam chart | Wrong component | Import Tooltip **dari recharts** |
| Hardcoded hex tanpa dark variant | Dark mode broken | Use `getChartColors(theme)` helper |
| Chart height hardcoded (`height={350}`) | Inconsistent | Use `CHART_HEIGHT.{sm/md/lg/xl}` tiers |
| Legend icon `square` (default) | Visual mismatch | `iconType="circle"` |
| No tooltip di chart interactive | UX fail | Always include tooltip untuk data accuracy |

---

## 12. Migration Guide

### 12.1 Hex Color Audit & Replace (87 instances)
```diff
- <Line stroke="#6366f1" />
+ <Line stroke={CHART_COLORS.primary.base} />

- <Bar fill="#10b981" />
+ <Bar fill={CHART_COLORS.semantic.success} />
```

### 12.2 ForecastChart.tsx Tooltip Cleanup
Existing `CustomTooltip` (di ForecastChart) pakai banyak `uppercase tracking-widest font-black`. Migrate:
```diff
- <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{label}</p>
+ <p className={CHART_TOOLTIP.label}>{label}</p>

- <span className="text-[10px] font-bold text-slate-600 uppercase">{t("chart.tooltip.actual")}</span>
+ <span className={CHART_TOOLTIP.name}>{t("chart.tooltip.actual")}</span>
```

### 12.3 Create Shared ChartTooltip Component
Buat `frontend/src/app/components/charts/ChartTooltip.tsx` (template di §6.4). Adopt di 9 chart files.

### 12.4 Axis Defaults via Spread
```diff
- <XAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
+ <XAxis dataKey="date" {...CHART_AXIS} />
```

### 12.5 Grid Standardization
```diff
- <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
+ <CartesianGrid {...CHART_GRID} />
```

### 12.6 Dark Mode Adoption
Pages prioritas:
1. **DashboardPage** — main chart visibility
2. **LaporanPage** — 26 chart elements
3. **MLOpsDashboardPage** — 16 chart elements
4. **PrediksiStokPage** — 14 chart elements
5. **XAIPage**, **ExplanationCharts** — AI semantic

### Per-file priority
1. **ForecastChart.tsx** — tooltip cleanup + tokens
2. **TopProductsChart.tsx** — migrate hex → tokens
3. **ExplanationCharts.tsx** — XAI radar charts
4. **LaporanPage.tsx** — heaviest chart file
5. **MLOpsDashboardPage.tsx** — MLOps metrics
6. **PrediksiStokPage.tsx** — prediction charts
7. **InventarisPage.tsx** — minor charts

### Code Review Rubric
1. Hex color hardcoded tanpa dark variant? → **request change**
2. Default Recharts tooltip (no customize)? → **request change**
3. Uppercase di chart text? → **request change** (violates Typography v1.1)
4. `vertical={true}` grid tanpa alasan? → **request change**
5. Chart tanpa ResponsiveContainer? → **reject**
6. Pie chart > 7 slices? → **request change**
7. Missing tooltip di interactive chart? → **reject**
8. Fixed width chart? → **reject**
9. `dot={true}` pada LineChart? → **request change**
10. Random non-palette hex? → **reject**

---

## 13. Future Enhancements

- [ ] Create `<ChartTooltip>` shared component (pending — this spec)
- [ ] Create `<ChartLegend>` shared component
- [ ] Storybook dengan semua chart types
- [ ] Animated chart entrance (stagger bars, draw line)
- [ ] Zoom/pan untuk time-series
- [ ] Brush component untuk large datasets
- [ ] Click-to-drill-down pattern
- [ ] Chart export (PNG/SVG download)
- [ ] A11y: tabular data alternative (`<table aria-label>`)
- [ ] Color-blind palette alternative
- [ ] Comparison charts (period-over-period overlay)
- [ ] Annotation support (event markers)
- [ ] Empty state untuk no-data charts (re-use `EmptyState` per `EMPTY_STATES.md`)
- [ ] Loading skeleton untuk chart (pair dengan `LOADING.md`)

---

**Design review oleh:** faiz
**Implementasi spec:** 23 April 2026
