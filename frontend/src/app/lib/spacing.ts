/**
 * InsightSphere Spacing & Sizing Tokens
 * =========================================
 * Single source of truth untuk padding, margin, gap, icon sizes, dan size scale.
 *
 * Design rationale:
 *   → See Design System/SPACING.md
 *
 * Architecture:
 *   - `S.*`         — Base scale tokens (0 → 16) — numeric in Tailwind units (4px each)
 *   - `GAP.*`       — Semantic gap (tight/default/loose/generous)
 *   - `STACK.*`     — Vertical stack spacing (space-y)
 *   - `ROW.*`       — Horizontal row spacing (space-x or gap)
 *   - `ICON.*`      — Icon size tokens (size-3 → size-10)
 *   - `ICON_BY_CONTEXT.*` — Per-context icon size (in button, badge, etc)
 *   - `PAD.*`       — Padding presets per component type
 *
 * Usage:
 *   import { GAP, STACK, ICON, PAD } from "@/app/lib/spacing";
 *   import { cn } from "@/app/lib/utils";
 *
 *   // Semantic gap
 *   <div className={cn("flex items-center", GAP.default)}>...</div>
 *
 *   // Stack
 *   <div className={STACK.default}>
 *     <Card />
 *     <Card />
 *   </div>
 *
 *   // Icon
 *   <Check className={ICON.md} />
 *
 *   // Padding
 *   <div className={PAD.card}>...</div>
 *
 * Design principles:
 *   1. Tailwind spacing scale (4px base unit) — no arbitrary pixel values.
 *   2. Semantic names preferred (tight/default/loose) over numeric (gap-2).
 *   3. Icon size matches text size context (xs=size-3, sm=size-3.5, md=size-4).
 */

/* -------------------------------------------------------------------------
 * BASE SCALE (numeric classes)
 * -----------------------------------------------------------------------*/

/** Base scale values (Tailwind spacing, 4px base). */
export const S = {
  /** 0px */
  0: "0",
  /** 2px */
  0.5: "0.5",
  /** 4px */
  1: "1",
  /** 6px */
  1.5: "1.5",
  /** 8px */
  2: "2",
  /** 10px */
  2.5: "2.5",
  /** 12px */
  3: "3",
  /** 16px */
  4: "4",
  /** 20px */
  5: "5",
  /** 24px */
  6: "6",
  /** 32px */
  8: "8",
  /** 40px */
  10: "10",
  /** 48px */
  12: "12",
  /** 64px */
  16: "16",
} as const;

/* -------------------------------------------------------------------------
 * SEMANTIC GAP (flex/grid gap-*)
 * -----------------------------------------------------------------------*/

/**
 * Gap tokens (flex/grid spacing between children).
 * Use these preferred semantic names over `gap-2`, `gap-3`, etc.
 */
export const GAP = {
  /** No gap. */
  none: "gap-0",

  /** 2px — Icon + tight label pair (rare). */
  tight: "gap-0.5",

  /** 4px — Badge internal, compact row. */
  compact: "gap-1",

  /** 6px — Form label + helper. */
  snug: "gap-1.5",

  /** 8px — **Default** button groups, toolbar, card content. */
  default: "gap-2",

  /** 12px — Spacious row, card header + body. */
  loose: "gap-3",

  /** 16px — Grid between cards, form field groups. */
  generous: "gap-4",

  /** 24px — Section between dashboard rows. */
  spacious: "gap-6",

  /** 32px — Between major page sections. */
  section: "gap-8",
} as const;

export type GapTier = keyof typeof GAP;

/* -------------------------------------------------------------------------
 * VERTICAL STACK (space-y-*)
 * -----------------------------------------------------------------------*/
export const STACK = {
  /** No gap between stacked items. */
  none: "space-y-0",

  /** 4px — Tight list. */
  tight: "space-y-1",

  /** 8px — Form field internal (label+helper). */
  compact: "space-y-2",

  /** 12px — Nav links, menu items. */
  snug: "space-y-3",

  /** 16px — **Default** form stack, card content stack. */
  default: "space-y-4",

  /** 24px — Page section stack. */
  loose: "space-y-6",

  /** 32px — Between major sections. */
  generous: "space-y-8",

  /** 48px — Hero / landing page sections. */
  section: "space-y-12",
} as const;

/* -------------------------------------------------------------------------
 * HORIZONTAL ROW (space-x-* — rare, prefer flex+gap)
 * -----------------------------------------------------------------------*/
export const ROW = {
  none: "space-x-0",
  tight: "space-x-1",
  compact: "space-x-2",
  default: "space-x-3",
  loose: "space-x-4",
  generous: "space-x-6",
} as const;

/* -------------------------------------------------------------------------
 * ICON SIZES (for Lucide icons, inline SVGs)
 *
 * | Token | Class   | Pixels | Typical pairing                      |
 * |-------|---------|--------|--------------------------------------|
 * | 2xs   | size-2  | 8px    | status dot (rare inline)             |
 * | xs    | size-3  | 12px   | xs button, badge internal, chart dot |
 * | sm    | size-3.5| 14px   | sm button                            |
 * | md    | size-4  | 16px   | **Default** — md button, body icon   |
 * | lg    | size-5  | 20px   | lg button, card header               |
 * | xl    | size-6  | 24px   | Hero icon, alert banner              |
 * | 2xl   | size-8  | 32px   | Empty state icon                     |
 * | 3xl   | size-10 | 40px   | Large feature icon                   |
 * -----------------------------------------------------------------------*/
export const ICON = {
  /** 8px — status dot inline. */
  "2xs": "size-2",
  /** 12px — xs button, badge, chart dot. */
  xs: "size-3",
  /** 14px — sm button. */
  sm: "size-3.5",
  /** 16px — **Default** md button, body icon. */
  md: "size-4",
  /** 20px — lg button, card header icon. */
  lg: "size-5",
  /** 24px — Hero icon, alert banner. */
  xl: "size-6",
  /** 32px — Empty state icon. */
  "2xl": "size-8",
  /** 40px — Large feature icon. */
  "3xl": "size-10",
  /** 64px — Marketing / onboarding hero. */
  "4xl": "size-16",
} as const;

export type IconSize = keyof typeof ICON;

/* -------------------------------------------------------------------------
 * ICON SIZE BY CONTEXT
 * -----------------------------------------------------------------------*/
export const ICON_BY_CONTEXT = {
  /* ---------- Buttons (match BTN.size tier) ---------- */
  buttonXs: ICON.xs,      // 12px
  buttonSm: ICON.sm,      // 14px
  buttonMd: ICON.md,      // 16px
  buttonLg: ICON.md,      // 16px
  buttonXl: ICON.lg,      // 20px

  /* ---------- Form ---------- */
  input: ICON.md,         // inside input (search, calendar)
  checkbox: ICON.xs,      // check mark inside checkbox
  switch: ICON.xs,        // icon inside switch thumb

  /* ---------- Display ---------- */
  badge: ICON.xs,         // 12px inside badge
  chip: ICON.xs,
  kpiDecor: ICON.lg,      // 20px top-right KPI icon box
  cardHeader: ICON.lg,    // 20px card header accent

  /* ---------- Alerts ---------- */
  alertSm: ICON.md,       // 16px inline alert
  alertMd: ICON.lg,       // 20px default alert
  alertLg: ICON.xl,       // 24px large alert

  /* ---------- Empty ---------- */
  emptyState: ICON["2xl"], // 32px empty state icon

  /* ---------- Navigation ---------- */
  sidebarNav: ICON.lg,    // 20px sidebar nav icon
  breadcrumb: ICON.md,    // 16px separator
  tabs: ICON.md,

  /* ---------- Data ---------- */
  tableRow: ICON.md,      // 16px inline row action
  sortIndicator: ICON.xs, // 12px arrow on sortable column

  /* ---------- Status ---------- */
  statusDot: ICON["2xs"], // 8px

  /* ---------- Hero / Marketing ---------- */
  hero: ICON["3xl"],      // 40px
  heroLarge: ICON["4xl"], // 64px
} as const;

/* -------------------------------------------------------------------------
 * PADDING PRESETS (per-component)
 * -----------------------------------------------------------------------*/
export const PAD = {
  /* ---------- Cards ---------- */
  /** 16px — Compact card, list item. */
  cardCompact: "p-4",
  /** 24px — **Default** card. */
  card: "p-6",
  /** 32px — Spacious card, hero. */
  cardLarge: "p-8",

  /* ---------- Modals ---------- */
  /** Modal body default. */
  modalBody: "p-6",
  /** Modal header. */
  modalHeader: "px-6 py-4",
  /** Modal footer. */
  modalFooter: "px-6 py-4",

  /* ---------- Buttons (from BTN.size) ---------- */
  buttonXs: "px-2.5 py-1",
  buttonSm: "px-3 py-1.5",
  buttonMd: "px-4 py-2",
  buttonLg: "px-5 py-2.5",
  buttonXl: "px-6 py-3",

  /* ---------- Inputs ---------- */
  inputSm: "px-3 py-2",
  inputMd: "px-4 py-2.5",
  inputLg: "px-4 py-3",

  /* ---------- Page containers ---------- */
  /** Responsive page padding. */
  page: "px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8",
  /** Section padding. */
  section: "py-6 md:py-8 lg:py-12",

  /* ---------- Table cells ---------- */
  /** Default table cell. */
  tableCell: "px-4 py-3",
  /** Compact table cell. */
  tableCellCompact: "px-3 py-2",
  /** Table head cell. */
  tableHead: "px-4 py-3",
} as const;

/* -------------------------------------------------------------------------
 * HELPER: Determine icon size from button size
 * -----------------------------------------------------------------------*/
export function iconSizeForButton(
  buttonSize: "xs" | "sm" | "md" | "lg" | "xl",
): IconSize {
  const map = {
    xs: "xs",
    sm: "sm",
    md: "md",
    lg: "md",
    xl: "lg",
  } as const;
  return map[buttonSize];
}
