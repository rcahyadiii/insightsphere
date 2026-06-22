/**
 * InsightSphere Overlays Tokens
 * ================================
 * Single source of truth untuk floating overlays:
 * Popover, Tooltip, HoverCard, DropdownMenu, ContextMenu.
 *
 * Design rationale, mental model, prohibited patterns, migration guide:
 *   → See Design System/OVERLAYS.md
 *
 * Architecture:
 *   - `POPOVER.*`       — Click-triggered content panel (form, picker, filter)
 *   - `TOOLTIP.*`       — Hover-triggered text label (dark surface, high contrast)
 *   - `HOVER_CARD.*`    — Hover-triggered rich content (profile, preview)
 *   - `DROPDOWN.*`      — Click-triggered menu of actions
 *   - `CONTEXT_MENU.*`  — Right-click menu (same styling as DROPDOWN)
 *
 * Rule of thumb:
 *   - Label icon button?          → Tooltip
 *   - Preview rich content?       → HoverCard
 *   - Inline form/filter/picker?  → Popover
 *   - Menu of actions?            → DropdownMenu
 *   - Right-click menu?           → ContextMenu
 *
 * Usage:
 *   import { POPOVER, TOOLTIP, HOVER_CARD, DROPDOWN } from "@/app/lib/overlays";
 *   import { cn } from "@/app/lib/utils";
 *
 *   // Tooltip
 *   <TooltipContent className={TOOLTIP.content}>Label</TooltipContent>
 *
 *   // Popover
 *   <PopoverContent className={cn(POPOVER.content, POPOVER.size.md)}>...</PopoverContent>
 *
 *   // DropdownMenu item
 *   <DropdownMenuItem className={cn(DROPDOWN.item.base, DROPDOWN.item.inactive)}>
 *     <Icon className={DROPDOWN.item.icon} /> Label
 *   </DropdownMenuItem>
 */

/* -------------------------------------------------------------------------
 * POPOVER
 * -----------------------------------------------------------------------*/
export const POPOVER = {
  /** Content panel base (light surface). */
  content:
    "rounded-xl outline-none " +
    "bg-white dark:bg-slate-900 " +
    "border border-slate-200 dark:border-slate-800 " +
    "shadow-md p-4",

  /** Width tiers. */
  size: {
    sm: "w-64",
    md: "w-72",
    lg: "w-96",
    /** Auto width (let content decide, min-w 224). */
    auto: "w-auto min-w-[224px]",
  },

  /** Arrow indicator fill (for PopoverArrow). */
  arrow: "fill-white dark:fill-slate-900",

  /** Animation (Radix data-state variants). */
  animation:
    "data-[state=open]:animate-in data-[state=closed]:animate-out " +
    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 " +
    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
} as const;

/* -------------------------------------------------------------------------
 * TOOLTIP (Dark Surface — Inversed)
 * -----------------------------------------------------------------------*/
export const TOOLTIP = {
  /** Recommended TooltipProvider delay. */
  delay: {
    instant: 0,
    default: 300,
    slow: 500,
  },

  /** Content: dark bg in light mode, light bg in dark mode (inverse). */
  content:
    "rounded-lg px-2.5 py-1.5 " +
    "bg-slate-900 dark:bg-slate-100 " +
    "text-white dark:text-slate-900 " +
    "text-xs font-medium " +
    "shadow-md max-w-xs " +
    "animate-in fade-in-0 zoom-in-95 " +
    "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",

  /** Arrow fill (inversed). */
  arrow: "fill-slate-900 dark:fill-slate-100",

  /** Keyboard shortcut chip inside tooltip (optional). */
  kbd:
    "ml-1.5 px-1 py-0.5 rounded " +
    "bg-white/20 dark:bg-slate-900/20 " +
    "text-[10px] font-data",
} as const;

/* -------------------------------------------------------------------------
 * HOVER_CARD
 * -----------------------------------------------------------------------*/
export const HOVER_CARD = {
  /** Content panel (same surface as Popover). */
  content:
    "rounded-xl outline-none " +
    "bg-white dark:bg-slate-900 " +
    "border border-slate-200 dark:border-slate-800 " +
    "shadow-md p-4",

  /** Width tiers. */
  size: {
    sm: "w-64",
    md: "w-80",
    lg: "w-96",
  },

  /** Delays (heavier than tooltip). */
  delay: {
    open: 500,
    close: 200,
  },

  /** Animation. */
  animation:
    "data-[state=open]:animate-in data-[state=closed]:animate-out " +
    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 " +
    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
} as const;

/* -------------------------------------------------------------------------
 * DROPDOWN_MENU
 * -----------------------------------------------------------------------*/
export const DROPDOWN = {
  /** Content panel. */
  content:
    "rounded-xl p-1 min-w-[180px] " +
    "bg-white dark:bg-slate-900 " +
    "border border-slate-200 dark:border-slate-800 " +
    "shadow-md outline-none " +
    "data-[state=open]:animate-in data-[state=closed]:animate-out " +
    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 " +
    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",

  /** Reusable anchored panel sizes. */
  size: {
    headerStore: "w-72",
    notificationPanel:
      "fixed left-4 right-4 top-16 max-h-[calc(100dvh-5rem)] " +
      "sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-4 " +
      "sm:w-[440px] sm:max-h-[700px]",
  },

  /** Trigger text constraints for dropdown anchors. */
  triggerText: {
    headerStore: "hidden max-w-[100px] truncate md:inline lg:max-w-[140px]",
  },

  /** Notification dropdown badge dimensions. */
  notificationBadge: {
    count:
      "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 " +
      "flex items-center justify-center rounded-full border-2 border-white " +
      "text-white leading-none",
    overflow:
      "absolute -top-1 -right-1 w-[18px] h-[18px] " +
      "flex items-center justify-center rounded-full border-2 border-white " +
      "font-bold text-white leading-none",
  },

  /** Menu item. */
  item: {
    /** Base layout for any item. */
    base:
      "flex items-center gap-2 px-2 py-1.5 rounded-lg " +
      "text-sm font-medium cursor-pointer select-none outline-none " +
      "transition-colors",

    /** Default state (inactive / idle). */
    inactive:
      "text-slate-700 dark:text-slate-300 " +
      "hover:bg-slate-100 dark:hover:bg-slate-800 " +
      "focus:bg-slate-100 dark:focus:bg-slate-800 " +
      "data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800",

    /** Destructive variant (delete, remove). */
    destructive:
      "text-rose-600 dark:text-rose-400 " +
      "hover:bg-rose-50 dark:hover:bg-rose-900/30 " +
      "focus:bg-rose-50 dark:focus:bg-rose-900/30 " +
      "data-[highlighted]:bg-rose-50 dark:data-[highlighted]:bg-rose-900/30",

    /** Active / selected state (e.g., current sort). */
    active:
      "bg-indigo-50 dark:bg-indigo-900/30 " +
      "text-indigo-700 dark:text-indigo-300",

    /** Disabled. */
    disabled:
      "opacity-50 pointer-events-none cursor-not-allowed",

    /** Icon inside item (shrink + consistent size). */
    icon: "size-4 shrink-0",
  },

  /** Group label (uppercase tracking — sole exception to Typography v1.1 uppercase policy). */
  label:
    "px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest " +
    "text-slate-500 dark:text-slate-400",

  /** Separator between groups. */
  separator:
    "-mx-1 my-1 h-px bg-slate-100 dark:bg-slate-800",

  /** Keyboard shortcut chip (ml-auto aligned). */
  shortcut:
    "ml-auto text-xs font-data " +
    "text-slate-400 dark:text-slate-500",
} as const;

/* -------------------------------------------------------------------------
 * CONTEXT_MENU (Right-click)
 *
 * Visually identical to DROPDOWN — aliased for clarity.
 * -----------------------------------------------------------------------*/
export const CONTEXT_MENU = {
  content: DROPDOWN.content,
  item: DROPDOWN.item,
  label: DROPDOWN.label,
  separator: DROPDOWN.separator,
  shortcut: DROPDOWN.shortcut,
} as const;

/* -------------------------------------------------------------------------
 * Type exports
 * -----------------------------------------------------------------------*/
export type PopoverSize = keyof typeof POPOVER.size;
export type HoverCardSize = keyof typeof HOVER_CARD.size;
export type DropdownItemVariant = keyof typeof DROPDOWN.item;
