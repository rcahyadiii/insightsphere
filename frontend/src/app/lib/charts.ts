/**
 * InsightSphere Charts (Recharts) Tokens
 * =========================================
 * Single source of truth untuk chart palette, axis, grid,
 * tooltip, legend, dan chart-type conventions.
 *
 * Design rationale, prohibited patterns, migration guide:
 *   → See Design System/CHARTS.md
 *
 * Architecture:
 *   - `CHART_COLORS.*`  — Palette (primary, series, neutrals, tooltip, semantic)
 *   - `CHART_AXIS`       — XAxis/YAxis default props
 *   - `CHART_GRID`       — CartesianGrid default props
 *   - `CHART_TOOLTIP.*`  — Custom tooltip className tokens (for JSX tooltip)
 *   - `CHART_LEGEND.*`   — Legend default props
 *   - `CHART_HEIGHT.*`   — Chart height tiers
 *   - `getChartColors()` — Helper for dark mode adaptation
 *
 * Usage:
 *   import {
 *     CHART_COLORS, CHART_AXIS, CHART_GRID,
 *     CHART_TOOLTIP, CHART_LEGEND, CHART_HEIGHT,
 *     getChartColors,
 *   } from "@/app/lib/charts";
 *
 *   <BarChart data={data}>
 *     <CartesianGrid {...CHART_GRID} />
 *     <XAxis dataKey="name" {...CHART_AXIS} />
 *     <YAxis {...CHART_AXIS} />
 *     <Tooltip content={<ChartTooltip />} cursor={{ fill: CHART_COLORS.cursor.bar }} />
 *     <Bar dataKey="value" fill={CHART_COLORS.primary.base} radius={[8, 8, 0, 0]} />
 *   </BarChart>
 */

/* -------------------------------------------------------------------------
 * CHART_COLORS — Palette
 * -----------------------------------------------------------------------*/
export const CHART_COLORS = {
  /** Primary series color (indigo-500 based). */
  primary: {
    /** indigo-500 — main series stroke/fill. */
    base: "#6366f1",
    /** indigo-400 — lighter for multi-layer. */
    light: "#818cf8",
    /** indigo-600 — active/hover. */
    dark: "#4f46e5",
    /** For gradient fill (0.3 opacity at top). */
    gradientStart: "rgba(99, 102, 241, 0.3)",
    /** For gradient fill (0 opacity at bottom). */
    gradientEnd: "rgba(99, 102, 241, 0)",
  },

  /**
   * Multi-series palette (7 colors, ordered).
   * Use berurutan: series[0] → series[1] → dst.
   */
  series: [
    "#6366f1", // 1. indigo-500  — primary
    "#10b981", // 2. emerald-500 — success/positive
    "#f59e0b", // 3. amber-500   — warning/attention
    "#3b82f6", // 4. blue-500    — info
    "#8b5cf6", // 5. violet-500  — AI/predictive
    "#f43f5e", // 6. rose-500    — negative/loss
    "#14b8a6", // 7. teal-500    — balance
  ] as const,

  /** Grid stroke (horizontal reference lines). */
  grid: {
    light: "#f1f5f9", // slate-100
    dark: "#1e293b",  // slate-800
  },

  /** Axis line + tick label color. */
  axis: {
    /** Axis line (hidden tapi used for ReferenceLine). */
    strokeLight: "#94a3b8",  // slate-400
    strokeDark: "#64748b",   // slate-500
    /** Tick label fill. */
    tickLight: "#64748b",    // slate-500
    tickDark: "#94a3b8",     // slate-400
  },

  /** Tooltip cursor (highlight under tooltip). */
  cursor: {
    /** Bar chart cursor (faint indigo fill). */
    bar: "rgba(99, 102, 241, 0.08)",
    /** Line/Area chart cursor (subtle dashed vertical line). */
    line: "#cbd5e1",  // slate-300
    lineDark: "#475569", // slate-600
  },

  /** Semantic accents (for sentiment-coded series). */
  semantic: {
    success: "#10b981",     // emerald-500
    warning: "#f59e0b",     // amber-500
    destructive: "#f43f5e", // rose-500
    info: "#3b82f6",        // blue-500
    ai: "#8b5cf6",          // violet-500
    inventory: "#14b8a6",   // teal-500
  },

  /** Tooltip surface (for contentStyle prop). */
  tooltip: {
    bg: "#ffffff",
    bgDark: "#0f172a",       // slate-900
    foregroundDark: "#ffffff",
    border: "#e2e8f0",       // slate-200
    borderDark: "#1e293b",   // slate-800
    shadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    shadowDark: "0 4px 6px -1px rgb(0 0 0 / 0.4)",
  },
} as const;

/* -------------------------------------------------------------------------
 * CHART_AXIS — XAxis/YAxis default props
 * -----------------------------------------------------------------------*/
export const CHART_AXIS = {
  stroke: CHART_COLORS.axis.strokeLight,
  fontSize: 11,
  tickLine: false,
  axisLine: false,
  tick: { fill: CHART_COLORS.axis.tickLight, fontWeight: 500 },
} as const;

/* -------------------------------------------------------------------------
 * CHART_GRID — CartesianGrid default props
 * -----------------------------------------------------------------------*/
export const CHART_GRID = {
  stroke: CHART_COLORS.grid.light,
  strokeDasharray: "3 3",
  /** Horizontal only — vertical usually redundant with XAxis ticks. */
  vertical: false,
} as const;

/* -------------------------------------------------------------------------
 * CHART_TOOLTIP — Custom tooltip className tokens (JSX)
 *
 * Used inside <ChartTooltip> component.
 * -----------------------------------------------------------------------*/
export const CHART_TOOLTIP = {
  /** Outer wrapper (rounded card surface). */
  wrapper:
    "rounded-xl p-3 min-w-[180px] " +
    "bg-white dark:bg-slate-900 " +
    "border border-slate-200 dark:border-slate-800 " +
    "shadow-md",

  /** Label (x-axis value / period). */
  label:
    "text-xs font-bold text-slate-900 dark:text-slate-100 " +
    "pb-2 mb-2 border-b border-slate-100 dark:border-slate-800",

  /** Data row (flex between name and value). */
  row: "flex items-center justify-between gap-4",

  /** Series dot indicator. */
  dot: "size-2 rounded-full shrink-0",

  /** Series name (left side). */
  name:
    "text-xs font-medium text-slate-600 dark:text-slate-400",

  /** Series value (right side, tabular nums). */
  value:
    "text-xs font-bold tabular-nums " +
    "text-slate-900 dark:text-slate-100 font-data",

  /** Footer note (e.g., delta, alert). */
  footer:
    "mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 " +
    "flex items-center justify-between text-xs font-bold",

  /** Footer success (positive delta). */
  footerSuccess: "text-emerald-600 dark:text-emerald-400",

  /** Footer warning (drift detected). */
  footerWarning: "text-amber-600 dark:text-amber-400",

  /** Footer destructive (negative delta). */
  footerDestructive: "text-rose-600 dark:text-rose-400",
} as const;

/* -------------------------------------------------------------------------
 * CHART_LEGEND — Legend default props
 * -----------------------------------------------------------------------*/
export const CHART_LEGEND = {
  /** Default bottom legend config. */
  default: {
    iconType: "circle" as const,
    iconSize: 8,
    wrapperStyle: {
      paddingTop: "16px",
      fontSize: "12px",
      fontWeight: 500,
    },
  },

  /** Right-side legend (for tall charts). */
  right: {
    iconType: "circle" as const,
    iconSize: 8,
    layout: "vertical" as const,
    verticalAlign: "middle" as const,
    align: "right" as const,
    wrapperStyle: {
      paddingLeft: "16px",
      fontSize: "12px",
      fontWeight: 500,
    },
  },
} as const;

/* -------------------------------------------------------------------------
 * CHART_HEIGHT — Height tiers
 * -----------------------------------------------------------------------*/
export const CHART_HEIGHT = {
  /** Sparkline / mini widget (no axis). */
  sparkline: 40,
  /** Small embedded chart. */
  sm: 200,
  /** Dashboard card standard. */
  md: 280,
  /** Mid-large chart (between md and lg) — laporan analytics blok 320px. */
  mlg: 320,
  /** Dedicated chart section. */
  lg: 360,
  /** Full-page hero chart. */
  xl: 440,
} as const;

/* -------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------*/

/**
 * Get theme-aware chart colors.
 *
 * Usage:
 *   const { resolvedTheme } = useTheme();
 *   const colors = getChartColors(resolvedTheme as "light" | "dark");
 *   <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
 */
export function getChartColors(theme: "light" | "dark" | undefined) {
  const isDark = theme === "dark";
  return {
    grid: isDark ? CHART_COLORS.grid.dark : CHART_COLORS.grid.light,
    axisStroke: isDark
      ? CHART_COLORS.axis.strokeDark
      : CHART_COLORS.axis.strokeLight,
    axisTick: isDark
      ? CHART_COLORS.axis.tickDark
      : CHART_COLORS.axis.tickLight,
    cursorLine: isDark
      ? CHART_COLORS.cursor.lineDark
      : CHART_COLORS.cursor.line,
    tooltipBg: isDark
      ? CHART_COLORS.tooltip.bgDark
      : CHART_COLORS.tooltip.bg,
    tooltipBorder: isDark
      ? CHART_COLORS.tooltip.borderDark
      : CHART_COLORS.tooltip.border,
    tooltipForeground: isDark ? CHART_COLORS.tooltip.foregroundDark : "#0f172a",
    tooltipShadow: isDark
      ? CHART_COLORS.tooltip.shadowDark
      : CHART_COLORS.tooltip.shadow,
    /** Primary unchanged in dark mode (brand consistency). */
    primary: CHART_COLORS.primary.base,
    /** Series palette. */
    series: CHART_COLORS.series,
  };
}

/**
 * Get axis props adapted to theme.
 *
 * Usage:
 *   const axisProps = getAxisProps(resolvedTheme);
 *   <XAxis dataKey="date" {...axisProps} />
 */
export function getAxisProps(theme: "light" | "dark" | undefined) {
  const colors = getChartColors(theme);
  return {
    stroke: colors.axisStroke,
    fontSize: 11,
    tickLine: false,
    axisLine: false,
    tick: { fill: colors.axisTick, fontWeight: 500 },
  };
}

/**
 * Get grid props adapted to theme.
 */
export function getGridProps(theme: "light" | "dark" | undefined) {
  const colors = getChartColors(theme);
  return {
    stroke: colors.grid,
    strokeDasharray: "3 3",
    vertical: false,
  };
}

export function getTooltipContentStyle(theme: "light" | "dark" | undefined) {
  const colors = getChartColors(theme);
  return {
    borderRadius: "0.75rem",
    border: `1px solid ${colors.tooltipBorder}`,
    background: colors.tooltipBg,
    color: colors.tooltipForeground,
    boxShadow: colors.tooltipShadow,
    fontSize: "10px",
  };
}

/* -------------------------------------------------------------------------
 * Number formatters (common use in YAxis tickFormatter)
 * -----------------------------------------------------------------------*/

/**
 * Format number with K/M/B suffix for axis ticks.
 *
 *   formatCompact(12000)   → "12K"
 *   formatCompact(1500000) → "1.5M"
 *   formatCompact(950)     → "950"
 */
export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return value.toString();
}

/**
 * Format as Indonesian Rupiah with compact notation.
 *
 *   formatRupiah(12000)   → "Rp 12K"
 *   formatRupiah(1500000) → "Rp 1.5M"
 */
export function formatRupiah(value: number): string {
  return `Rp ${formatCompact(value)}`;
}

/**
 * Format full number with Indonesian locale.
 *
 *   formatNumberID(12000) → "12.000"
 */
export function formatNumberID(value: number): string {
  return value.toLocaleString("id-ID");
}

/* -------------------------------------------------------------------------
 * Type exports
 * -----------------------------------------------------------------------*/
export type ChartSeriesIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type ChartHeightTier = keyof typeof CHART_HEIGHT;
export type ChartSemanticColor = keyof typeof CHART_COLORS.semantic;
