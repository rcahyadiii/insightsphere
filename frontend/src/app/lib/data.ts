import { Z } from "@/app/lib/elevation";

/**
 * InsightSphere Data Display Tokens
 * ===================================
 * Single source of truth untuk table, badge, avatar, KPI, dan trend indicator.
 *
 * Design rationale, anatomy, prohibited patterns, migration guide:
 *   → See Design System/TABLES.md
 *   → See Design System/BADGES.md
 *   → See Design System/KPI.md
 *
 * Architecture:
 *   - `TABLE.*`  — Table wrapper + head + body + rows + cells + pagination
 *   - `BADGE.*`  — Badge base + 4 size tiers + 7 variant + role
 *   - `AVATAR.*` — Avatar base + 5 size tiers + role color
 *   - `KPI.*`    — KPI wrapper + label + value (3 tiers) + icon box
 *   - `TREND.*`  — Trend indicator (up/down/flat + inverted semantic)
 *
 * Usage:
 *   import { TABLE, BADGE, AVATAR, KPI, TREND } from "@/app/lib/data";
 *   import { cn } from "@/app/lib/utils";
 *
 *   // Table
 *   <table className={TABLE.base}>
 *     <thead className={TABLE.head}>
 *       <tr><th className={TABLE.headCell}>...</th></tr>
 *     </thead>
 *     <tbody className={TABLE.body}>
 *       <tr className={cn(TABLE.row, TABLE.rowHover)}>
 *         <td className={TABLE.cell}>...</td>
 *       </tr>
 *     </tbody>
 *   </table>
 *
 *   // Badge
 *   <span className={cn(BADGE.base, BADGE.size.sm, BADGE.variant.success)}>
 *     <Check className="size-3" /> Aktif
 *   </span>
 *
 *   // KPI
 *   <div className={KPI.wrapper}>
 *     <span className={KPI.label}>Pendapatan</span>
 *     <div className={KPI.value.md}>Rp 5.2jt</div>
 *     <div className={cn(TREND.wrapper, TREND.up)}>
 *       <TrendingUp className="size-3" /><span>+12.5%</span>
 *     </div>
 *   </div>
 */

/* -------------------------------------------------------------------------
 * TABLE
 * -----------------------------------------------------------------------*/
export const TABLE = {
  /** Outer wrapper: overflow-x + rounded + border + bg. */
  wrapper:
    "overflow-x-auto rounded-2xl " +
    "border border-slate-200 dark:border-slate-800 " +
    "bg-white dark:bg-slate-900",

  /** Table element: full width + text-sm. */
  base: "w-full text-sm",

  /** thead: muted bg. */
  head: "bg-slate-50 dark:bg-slate-800/50",

  /** th cell: small, bold, muted text. */
  headCell:
    "px-4 py-3 text-left text-xs font-bold " +
    "text-slate-500 dark:text-slate-400 whitespace-nowrap",

  /** th numeric (right-aligned). */
  headCellNumeric:
    "px-4 py-3 text-right text-xs font-bold " +
    "text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums",

  /** th sortable: cursor + hover. */
  headCellSortable:
    "cursor-pointer select-none " +
    "hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",

  /** Sticky header (for long tables). */
  stickyHead: `sticky top-0 ${Z.raised}`,

  /** Sticky first column for horizontally scrollable tables. */
  stickyColumn: `sticky left-0 ${Z.raised}`,

  /** Responsive table min-width presets. */
  minWidth: {
    default: "min-w-[720px]",
    detailCompact: "min-w-[480px] sm:min-w-full",
    reportCompact: "min-w-[560px]",
    topProducts: "min-w-[620px]",
    inventory: "min-w-[760px]",
    settings: "min-w-[760px]",
    dashboard: "min-w-[820px]",
    forecast: "min-w-[860px]",
    stockHistory: "min-w-[860px]",
    transaction: "min-w-[940px]",
    prediction: "min-w-[980px]",
    stockMovement: "min-w-[1040px]",
    userManagement: "min-w-[1060px]",
    cashManagement: "min-w-[1280px]",
  },

  /** tbody: horizontal dividers between rows. */
  body: "divide-y divide-slate-100 dark:divide-slate-800",

  /** tr base (transition for hover). */
  row: "transition-colors",

  /** tr hover (default, subtle). */
  rowHover:
    "hover:bg-slate-50 dark:hover:bg-slate-800/50",

  /** tr interactive (clickable row: hover + cursor). */
  rowInteractive:
    "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50",

  /** tr selected state. */
  rowSelected:
    "bg-indigo-50 dark:bg-indigo-900/20 " +
    "hover:bg-indigo-100 dark:hover:bg-indigo-900/30",

  /** td default. */
  cell:
    "px-4 py-3 text-sm " +
    "text-slate-700 dark:text-slate-300",

  /** td bold (identifier column, e.g. name/SKU). */
  cellBold:
    "px-4 py-3 text-sm font-bold " +
    "text-slate-900 dark:text-slate-100",

  /** td numeric (right-align + tabular-nums). */
  cellNumeric:
    "px-4 py-3 text-sm text-right tabular-nums " +
    "text-slate-700 dark:text-slate-300",

  /** td compact padding. */
  cellCompact:
    "px-3 py-2 text-sm " +
    "text-slate-700 dark:text-slate-300",

  /** Footer wrapper (pagination area). */
  footer:
    "flex items-center justify-between px-4 py-3 " +
    "border-t border-slate-100 dark:border-slate-800",
} as const;

/* -------------------------------------------------------------------------
 * BADGE
 * -----------------------------------------------------------------------*/
export const BADGE = {
  /** Base badge: pill shape + inline flex + font-bold + transition. */
  base:
    "inline-flex items-center gap-1 rounded-full font-bold border " +
    "whitespace-nowrap transition-colors",

  /** Size tiers. */
  size: {
    /** Micro: 10px text (for counts, table cells). */
    xs: "px-2 py-0.5 text-[10px]",
    /** Default: 12px text. */
    sm: "px-2.5 py-0.5 text-xs",
    /** Medium: standalone badge. */
    md: "px-3 py-1 text-xs",
    /** Large: hero badge. */
    lg: "px-3 py-1.5 text-xs",
  },

  /** Semantic variants (7) + role accent (3). */
  variant: {
    success:
      "bg-emerald-50 dark:bg-emerald-900/30 " +
      "text-emerald-700 dark:text-emerald-400 " +
      "border-emerald-100 dark:border-emerald-800/50",

    warning:
      "bg-amber-50 dark:bg-amber-900/30 " +
      "text-amber-700 dark:text-amber-400 " +
      "border-amber-100 dark:border-amber-800/50",

    destructive:
      "bg-rose-50 dark:bg-rose-900/30 " +
      "text-rose-700 dark:text-rose-400 " +
      "border-rose-100 dark:border-rose-800/50",

    info:
      "bg-blue-50 dark:bg-blue-900/30 " +
      "text-blue-700 dark:text-blue-400 " +
      "border-blue-100 dark:border-blue-800/50",

    primary:
      "bg-indigo-50 dark:bg-indigo-900/30 " +
      "text-indigo-700 dark:text-indigo-400 " +
      "border-indigo-100 dark:border-indigo-800/50",

    neutral:
      "bg-slate-100 dark:bg-slate-800 " +
      "text-slate-700 dark:text-slate-300 " +
      "border-slate-200 dark:border-slate-700",

    /** Teal accent (role: inventory_manager). */
    inventory:
      "bg-teal-50 dark:bg-teal-900/30 " +
      "text-teal-700 dark:text-teal-400 " +
      "border-teal-100 dark:border-teal-800/50",
  },

  /**
   * Role badges (canonical mapping dengan colors.ts).
   *   - owner   → indigo
   *   - admin   → slate
   *   - inventory_manager → teal
   *   - cashier → emerald (NOT slate — aligned with colors.ts §roleCashier)
   */
  role: {
    owner:
      "bg-indigo-50 dark:bg-indigo-900/30 " +
      "text-indigo-700 dark:text-indigo-400 " +
      "border-indigo-100 dark:border-indigo-800/50",

    admin:
      "bg-slate-100 dark:bg-slate-800 " +
      "text-slate-700 dark:text-slate-300 " +
      "border-slate-200 dark:border-slate-700",

    inventory:
      "bg-teal-50 dark:bg-teal-900/30 " +
      "text-teal-700 dark:text-teal-400 " +
      "border-teal-100 dark:border-teal-800/50",

    cashier:
      "bg-emerald-50 dark:bg-emerald-900/30 " +
      "text-emerald-700 dark:text-emerald-400 " +
      "border-emerald-100 dark:border-emerald-800/50",
  },
} as const;

/* -------------------------------------------------------------------------
 * AVATAR
 * -----------------------------------------------------------------------*/
export const AVATAR = {
  /** Base: flex center + rounded-full + font-bold + shrink-0. */
  base:
    "inline-flex items-center justify-center rounded-full " +
    "font-bold shrink-0 select-none overflow-hidden",

  /** Size tiers (5). */
  size: {
    xs: "size-6 text-[10px]",
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-12 text-base",
    xl: "size-16 text-xl",
  },

  /**
   * Role-based background + text color (initials avatar).
   * Cashier = emerald (aligned dengan colors.ts §roleCashier).
   */
  role: {
    owner:
      "bg-indigo-100 dark:bg-indigo-900/40 " +
      "text-indigo-700 dark:text-indigo-300",

    admin:
      "bg-slate-200 dark:bg-slate-700 " +
      "text-slate-700 dark:text-slate-200",

    inventory:
      "bg-teal-100 dark:bg-teal-900/40 " +
      "text-teal-700 dark:text-teal-300",

    cashier:
      "bg-emerald-100 dark:bg-emerald-900/40 " +
      "text-emerald-700 dark:text-emerald-300",
  },

  /** Ring variants (for avatar stack). */
  ring:
    "ring-2 ring-white dark:ring-slate-900",
} as const;

/* -------------------------------------------------------------------------
 * KPI
 * -----------------------------------------------------------------------*/
export const KPI = {
  /** KPI card wrapper: reuse CARD interactive pattern with p-5. */
  wrapper:
    "rounded-2xl p-5 " +
    "bg-white dark:bg-slate-900 " +
    "border border-slate-200 dark:border-slate-800 " +
    "shadow-sm hover:shadow-md transition-shadow",

  /** KPI label (muted, small, bold). */
  label:
    "text-xs font-bold text-slate-500 dark:text-slate-400",

  /** KPI value size tiers. */
  value: {
    /** Default dashboard KPI. */
    md: "text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums",
    /** Featured KPI. */
    lg: "text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums",
    /** Profile hero KPI. */
    xl: "text-4xl font-black text-slate-900 dark:text-slate-100 tabular-nums",
  },

  /** Icon box (top-right corner of KPI). Mirror CARDS.md §3.3 pattern. */
  iconBox: {
    success: "p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30",
    warning: "p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30",
    destructive: "p-2 rounded-xl bg-rose-50 dark:bg-rose-900/30",
    info: "p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30",
    primary: "p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30",
    neutral: "p-2 rounded-xl bg-slate-100 dark:bg-slate-800",
    ai: "p-2 rounded-xl bg-violet-50 dark:bg-violet-900/30",
    inventory: "p-2 rounded-xl bg-teal-50 dark:bg-teal-900/30",
  },
} as const;

/* -------------------------------------------------------------------------
 * TREND INDICATOR
 * -----------------------------------------------------------------------*/
export const TREND = {
  /** Wrapper: inline flex + gap + small bold text. */
  wrapper:
    "inline-flex items-center gap-1 text-xs font-bold",

  /** Trend direction colors (standard semantic: up=good, down=bad). */
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-rose-600 dark:text-rose-400",
  flat: "text-slate-500 dark:text-slate-400",

  /**
   * Inverted semantic (lower is better).
   * Use for: biaya, komplain, error rate, churn, waste.
   */
  inverted: {
    /** Value went up = bad. */
    up: "text-rose-600 dark:text-rose-400",
    /** Value went down = good. */
    down: "text-emerald-600 dark:text-emerald-400",
  },

  /** Comparison label (muted tiny text). */
  comparison:
    "text-[10px] text-slate-400 dark:text-slate-500 font-medium",
} as const;

/* -------------------------------------------------------------------------
 * Type exports
 * -----------------------------------------------------------------------*/
export type BadgeSize = keyof typeof BADGE.size;
export type BadgeVariant = keyof typeof BADGE.variant;
export type BadgeRole = keyof typeof BADGE.role;
export type AvatarSize = keyof typeof AVATAR.size;
export type AvatarRole = keyof typeof AVATAR.role;
export type KpiValueSize = keyof typeof KPI.value;
export type KpiIconBox = keyof typeof KPI.iconBox;
