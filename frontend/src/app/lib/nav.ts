/**
 * InsightSphere Navigation Tokens
 * ==================================
 * Single source of truth untuk sidebar, header, command palette,
 * tabs, stepper, breadcrumbs, dan page header.
 *
 * Design rationale, anatomy, prohibited patterns, migration guide:
 *   → See Design System/NAVIGATION.md
 *   → See Design System/TABS.md
 *   → See Design System/BREADCRUMBS.md
 *
 * Architecture:
 *   - `SIDEBAR.*`      — Aside + logo + nav links + footer + collapse
 *   - `HEADER.*`       — Sticky top bar + clusters + icon button
 *   - `NAV_LINK.*`     — Shared active/inactive patterns (3 variants)
 *   - `TABS.*`         — List + trigger (3 variants: pill/underline/segmented) + content
 *   - `STEPPER.*`      — Circle + connector + label per state
 *   - `BREADCRUMB.*`   — Nav + home + link + current + separator
 *   - `PAGE_HEADER.*`  — Wrapper + iconBox (7 semantic) + title + subtitle + actions
 *
 * Usage:
 *   import { SIDEBAR, HEADER, NAV_LINK, TABS, STEPPER, BREADCRUMB, PAGE_HEADER }
 *     from "@/app/lib/nav";
 */

/* -------------------------------------------------------------------------
 * SIDEBAR (Dark Chrome)
 * -----------------------------------------------------------------------*/
export const SIDEBAR = {
  /** Aside container: dark chrome + border + flex col. */
  aside:
    "h-screen bg-slate-900 border-r border-slate-800 " +
    "flex flex-col transition-all duration-300 ease-in-out shrink-0",

  /** Width tiers. */
  width: {
    expanded: "w-[240px]",
    collapsed: "w-[68px]",
  },

  /** Logo section (header of sidebar). */
  logo:
    "flex items-center gap-3 px-6 h-14 " +
    "border-b border-slate-800 shrink-0",

  /** Nav scroll area. */
  nav:
    "flex-1 py-3 px-3 space-y-1 " +
    "overflow-y-auto overflow-x-hidden scrollbar-hide",

  /** Nav link base (apply active or inactive after). */
  link:
    "group flex items-center gap-3 px-3 py-2 rounded-lg " +
    "transition-all duration-200",

  /** Active link: elevated slate + ring. */
  linkActive:
    "bg-slate-700/60 text-white shadow-sm ring-1 ring-white/5",

  /** Inactive link. */
  linkInactive:
    "text-slate-400 hover:text-slate-200 hover:bg-slate-800",

  /** Icon wrapper (consistent spacing even when collapsed). */
  iconWrapper: "shrink-0 w-6 flex justify-center",

  /** Icon base. */
  icon: "w-5 h-5 transition-transform duration-300",

  /** Icon when active (scale + white). */
  iconActive: "text-white scale-110",

  /** Icon hover (group hover). */
  iconHover: "group-hover:scale-110",

  /** Footer section (user info + collapse toggle). */
  footer:
    "border-t border-slate-800 p-3 space-y-2 shrink-0",

  /** Collapse toggle button. */
  collapseBtn:
    "w-full flex items-center justify-center p-2 rounded-lg " +
    "text-slate-400 hover:text-slate-200 hover:bg-slate-800 " +
    "transition-colors",
} as const;

/* -------------------------------------------------------------------------
 * HEADER (Sticky Top Bar)
 * -----------------------------------------------------------------------*/
export const HEADER = {
  /** Base header: sticky + translucent + backdrop blur + border. */
  base:
    "sticky top-0 z-40 h-14 " +
    "bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm " +
    "border-b border-slate-200 dark:border-slate-800",

  /** Inner container. */
  container:
    "flex items-center gap-3 h-full px-6",

  /** Left cluster: mobile trigger + breadcrumb. */
  leftCluster: "flex items-center gap-3",

  /** Center cluster: command palette trigger. */
  centerCluster: "flex-1 max-w-md mx-auto",

  /** Right cluster: store/lang/theme/notif/avatar. */
  rightCluster: "flex items-center gap-2 ml-auto",

  /** Icon button (for header controls). */
  iconButton:
    "p-2 rounded-xl transition-colors " +
    "text-slate-600 dark:text-slate-400 " +
    "hover:bg-slate-100 dark:hover:bg-slate-800 " +
    "hover:text-slate-900 dark:hover:text-slate-100",

  /** Pill button (for command palette trigger). */
  pillButton:
    "w-full flex items-center gap-2 px-3 py-2 rounded-xl " +
    "bg-slate-100 dark:bg-slate-800 " +
    "hover:bg-slate-200 dark:hover:bg-slate-700 " +
    "transition-colors",
} as const;

/* -------------------------------------------------------------------------
 * NAV_LINK (Shared Active Patterns — 3 variants)
 * -----------------------------------------------------------------------*/
export const NAV_LINK = {
  /** Elevated slate (dark chrome sidebar). */
  elevatedSlate: {
    active:
      "bg-slate-700/60 text-white shadow-sm ring-1 ring-white/5",
    inactive:
      "text-slate-400 hover:text-slate-200 hover:bg-slate-800",
  },

  /** Solid indigo (primary active, mode toggles, hero tabs). */
  solidIndigo: {
    active: "bg-indigo-600 text-white shadow-sm",
    inactive:
      "text-slate-600 dark:text-slate-400 " +
      "hover:bg-slate-100 dark:hover:bg-slate-800 " +
      "hover:text-slate-900 dark:hover:text-slate-100",
  },

  /** Soft indigo (in-content nav, chips, filters). */
  softIndigo: {
    active:
      "bg-indigo-50 dark:bg-indigo-900/30 " +
      "text-indigo-700 dark:text-indigo-300 " +
      "border border-indigo-100 dark:border-indigo-800/50",
    inactive:
      "text-slate-600 dark:text-slate-400 " +
      "hover:bg-slate-100 dark:hover:bg-slate-800 " +
      "hover:text-slate-900 dark:hover:text-slate-100 " +
      "border border-transparent",
  },
} as const;

/* -------------------------------------------------------------------------
 * TABS (3 variants)
 * -----------------------------------------------------------------------*/
export const TABS = {
  /** TabsList per variant. */
  list: {
    pill: "inline-flex items-center gap-1",

    underline:
      "flex items-center gap-6 border-b border-slate-200 dark:border-slate-800",

    segmented:
      "inline-flex items-center gap-1 p-1 rounded-xl " +
      "bg-slate-100 dark:bg-slate-800",
  },

  /** Trigger (tab button) per variant. */
  trigger: {
    pill: {
      base:
        "px-3 py-1.5 rounded-xl text-sm font-bold " +
        "transition-colors " +
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20",
      active: "bg-indigo-600 text-white shadow-sm",
      inactive:
        "text-slate-600 dark:text-slate-400 " +
        "hover:bg-slate-100 dark:hover:bg-slate-800 " +
        "hover:text-slate-900 dark:hover:text-slate-100",
    },

    underline: {
      base:
        "px-1 py-3 text-sm font-bold " +
        "border-b-2 border-transparent transition-colors " +
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20",
      active:
        "border-indigo-500 text-indigo-600 dark:text-indigo-400",
      inactive:
        "text-slate-600 dark:text-slate-400 " +
        "hover:text-slate-900 dark:hover:text-slate-100",
    },

    segmented: {
      base:
        "px-3 py-1.5 rounded-lg text-sm font-bold " +
        "transition-colors " +
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20",
      active:
        "bg-white dark:bg-slate-900 shadow-sm " +
        "text-slate-900 dark:text-slate-100",
      inactive:
        "text-slate-600 dark:text-slate-400 " +
        "hover:text-slate-900 dark:hover:text-slate-100",
    },
  },

  /** Content area (gap from list). */
  content: "mt-4",
} as const;

/* -------------------------------------------------------------------------
 * STEPPER
 * -----------------------------------------------------------------------*/
export const STEPPER = {
  /** Horizontal wrapper. */
  wrapperHorizontal: "flex items-center gap-2",

  /** Vertical wrapper. */
  wrapperVertical: "flex flex-col gap-0",

  /** Single step (horizontal = col, vertical = row). */
  stepHorizontal: "flex flex-col items-center",
  stepVertical: "flex gap-4",

  /** Circle base. */
  circle: {
    base:
      "size-8 rounded-full flex items-center justify-center " +
      "text-sm font-bold transition-all duration-200 shrink-0",
    completed:
      "bg-emerald-500 dark:bg-emerald-400 text-white",
    active:
      "bg-indigo-600 text-white " +
      "ring-4 ring-indigo-100 dark:ring-indigo-900/40",
    upcoming:
      "bg-white dark:bg-slate-900 " +
      "border-2 border-slate-300 dark:border-slate-700 " +
      "text-slate-500 dark:text-slate-400",
  },

  /** Connector (line between steps). */
  connector: {
    base: "flex-1 h-0.5 transition-colors duration-200",
    vertical: "w-0.5 flex-1 min-h-[40px] my-2",
    done: "bg-emerald-500 dark:bg-emerald-400",
    todo: "bg-slate-200 dark:bg-slate-700",
  },

  /** Step label. */
  label: {
    base: "mt-2 text-xs font-bold transition-colors",
    completed: "text-emerald-600 dark:text-emerald-400",
    active: "text-indigo-600 dark:text-indigo-400",
    upcoming: "text-slate-500 dark:text-slate-400",
  },

  /** Size tiers. */
  size: {
    sm: { circle: "size-6 text-xs", label: "text-[10px]" },
    md: { circle: "size-8 text-sm", label: "text-xs" },
    lg: { circle: "size-10 text-base", label: "text-sm" },
  },
} as const;

/* -------------------------------------------------------------------------
 * BREADCRUMB
 * -----------------------------------------------------------------------*/
export const BREADCRUMB = {
  /** Nav wrapper. */
  nav: "flex items-center gap-2",

  /** Segment wrapper (for gap + icon). */
  segment: "flex items-center gap-2",

  /** Home link (app root). */
  home:
    "text-sm font-bold text-slate-900 dark:text-slate-100 " +
    "hover:text-indigo-600 dark:hover:text-indigo-400 " +
    "transition-colors tracking-tight",

  /** Intermediate link. */
  link:
    "text-sm font-medium text-slate-500 dark:text-slate-400 " +
    "hover:text-slate-900 dark:hover:text-slate-100 " +
    "truncate max-w-[150px] transition-colors",

  /** Current (last) segment — non-clickable. */
  current:
    "text-sm font-bold " +
    "text-slate-700 dark:text-slate-200 " +
    "truncate max-w-[150px]",

  /** Separator icon. */
  separator: "size-4 text-slate-300 dark:text-slate-600 shrink-0",
} as const;

/* -------------------------------------------------------------------------
 * PAGE_HEADER
 * -----------------------------------------------------------------------*/
export const PAGE_HEADER = {
  /** Wrapper: flex + separator + spacing. */
  wrapper:
    "flex items-start justify-between gap-4 " +
    "pb-6 mb-6 border-b border-slate-100 dark:border-slate-800",

  /** Left cluster (icon + title block). */
  left: "flex items-start gap-4 min-w-0",

  /** Icon box base (apply semantic variant after). */
  iconBox: "p-2.5 rounded-xl shrink-0",

  /** Icon box semantic variants. */
  iconBoxSemantic: {
    primary: "bg-indigo-50 dark:bg-indigo-900/30",
    success: "bg-emerald-50 dark:bg-emerald-900/30",
    warning: "bg-amber-50 dark:bg-amber-900/30",
    destructive: "bg-rose-50 dark:bg-rose-900/30",
    info: "bg-blue-50 dark:bg-blue-900/30",
    neutral: "bg-slate-100 dark:bg-slate-800",
    ai: "bg-violet-50 dark:bg-violet-900/30",
    inventory: "bg-teal-50 dark:bg-teal-900/30",
  },

  /** Icon color variants (pair with iconBoxSemantic). */
  iconColor: {
    primary: "text-indigo-600 dark:text-indigo-400",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    destructive: "text-rose-600 dark:text-rose-400",
    info: "text-blue-600 dark:text-blue-400",
    neutral: "text-slate-600 dark:text-slate-400",
    ai: "text-violet-600 dark:text-violet-400",
    inventory: "text-teal-600 dark:text-teal-400",
  },

  /** Title block wrapper. */
  titleBlock: "space-y-1 min-w-0",

  /** Title text. */
  title:
    "text-xl md:text-2xl font-black tracking-tight " +
    "text-slate-900 dark:text-slate-100 " +
    "truncate",

  /** Subtitle. */
  subtitle:
    "text-sm text-slate-500 dark:text-slate-400 font-medium",

  /** Actions cluster (right-aligned). */
  actions: "flex items-center gap-2 shrink-0",
} as const;

/* -------------------------------------------------------------------------
 * Type exports
 * -----------------------------------------------------------------------*/
export type NavLinkVariant = keyof typeof NAV_LINK;
export type TabsVariant = keyof typeof TABS.list;
export type StepperState = "completed" | "active" | "upcoming";
export type StepperSize = keyof typeof STEPPER.size;
export type PageHeaderTone = keyof typeof PAGE_HEADER.iconBoxSemantic;
