/**
 * InsightSphere Border Radius Tokens
 * =====================================
 * Single source of truth untuk border radius policy.
 *
 * Design rationale, tier mapping, prohibited patterns:
 *   → See Design System/RADII.md
 *
 * Architecture:
 *   - `R.*`        — 6 radius tiers + full (class strings)
 *   - `R_PX.*`     — Numeric pixel values (for inline style / calculations)
 *   - `R_COMPONENT.*` — Pre-mapped per-component radius
 *   - `R_DIRECTIONAL.*` — Per-corner radius (top-only, bottom-only)
 *   - `BANNED_RADII` — Legacy values to refuse in code review
 *
 * Usage:
 *   import { R, R_COMPONENT } from "@/app/lib/radii";
 *   import { cn } from "@/app/lib/utils";
 *
 *   // By tier
 *   <div className={cn(R.md, "p-4 bg-white")}>...</div>       // rounded-xl
 *
 *   // By component type (recommended — self-documenting)
 *   <button className={cn(R_COMPONENT.button, "...")}>Simpan</button>
 *   <div className={R_COMPONENT.card}>...</div>
 *
 *   // Directional (drawer top corners, sticky footer)
 *   <aside className={cn(R_DIRECTIONAL.topXl, "bg-white")}>...</aside>
 *
 * Design principles:
 *   1. 6 tiers + `full` — closed system, no arbitrary values.
 *   2. `rounded-md` (6px shadcn default) is BANNED — migrate to `rounded-xl`.
 *   3. Nested radius rule: child ≤ parent (typically parent - 4px to 8px).
 *   4. Same-row form elements (button + input) MUST match radius.
 *   5. Aligned with CSS variables:
 *        --radius-input: 0.75rem  (12px → R.md)
 *        --radius-card:  1.5rem   (24px → R.xl)
 */

/* -------------------------------------------------------------------------
 * RADIUS TIERS (class strings)
 * -----------------------------------------------------------------------*/

/**
 * | Tier | Class          | Pixels | Use case                                |
 * |------|----------------|--------|-----------------------------------------|
 * | xs   | rounded-sm     | 4px    | Chips, tags, inline badges              |
 * | sm   | rounded-lg     | 8px    | Tight buttons, icon boxes, button group |
 * | md   | rounded-xl     | 12px   | **Default** — buttons, inputs, forms    |
 * | lg   | rounded-2xl    | 16px   | Cards (default)                         |
 * | xl   | rounded-3xl    | 24px   | Modals, dialogs, hero cards             |
 * | full | rounded-full   | ∞      | Avatars, pills, circular buttons        |
 */
export const R = {
  /** 4px — Chips, inline badges. */
  xs: "rounded-sm",

  /** 8px — Tight buttons, icon boxes, button groups. */
  sm: "rounded-lg",

  /** 12px — Default for buttons, inputs, forms, toasts. Aligns with `--radius-input`. */
  md: "rounded-xl",

  /** 16px — Cards (default standard). */
  lg: "rounded-2xl",

  /** 24px — Modals, drawers, hero cards. Aligns with `--radius-card`. */
  xl: "rounded-3xl",

  /** ∞ — Avatars, pills, circular icon buttons, progress bars. */
  full: "rounded-full",

  /** 0 — Reset (almost never used; prefer tier). */
  none: "rounded-none",
} as const;

export type RadiusTier = keyof typeof R;

/* -------------------------------------------------------------------------
 * NUMERIC PIXEL VALUES (for inline styles, JS calculations)
 * -----------------------------------------------------------------------*/
export const R_PX = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
  none: 0,
} as const;

/* -------------------------------------------------------------------------
 * PER-COMPONENT RADIUS (self-documenting mappings)
 * Prefer this over raw `R.*` for readability.
 * -----------------------------------------------------------------------*/
export const R_COMPONENT = {
  /* ---------- Interactive ---------- */
  /** Button (all sizes). */
  button: R.md,
  /** Icon button (square). */
  iconButton: R.sm,
  /** Link (rarely rounded). */
  link: R.none,
  /** Circular icon button. */
  iconButtonCircle: R.full,

  /* ---------- Form ---------- */
  /** Input, select, textarea. */
  input: R.md,
  /** Checkbox (small squares). */
  checkbox: R.xs,
  /** Radio (circle). */
  radio: R.full,
  /** Switch track. */
  switchTrack: R.full,
  /** Switch thumb. */
  switchThumb: R.full,
  /** Search bar (compact). */
  searchBar: R.md,

  /* ---------- Container ---------- */
  /** Card (default). */
  card: R.lg,
  /** Card hero (featured). */
  cardHero: R.xl,
  /** Modal / Dialog. */
  modal: R.xl,
  /** Popover. */
  popover: R.md,
  /** Tooltip. */
  tooltip: R.sm,
  /** Dropdown menu content. */
  dropdown: R.md,
  /** Dropdown menu item. */
  dropdownItem: R.sm,
  /** Alert banner. */
  alert: R.md,
  /** Toast notification. */
  toast: R.md,
  /** Empty state. */
  empty: R.lg,

  /* ---------- Data Display ---------- */
  /** Chip / tag. */
  chip: R.xs,
  /** Badge pill. */
  badge: R.full,
  /** Status dot. */
  statusDot: R.full,
  /** Avatar (user). */
  avatar: R.full,
  /** Avatar (role/brand, square-ish). */
  avatarSquare: R.md,
  /** Table wrapper. */
  table: R.lg,
  /** KPI card. */
  kpi: R.lg,
  /** Icon box inside card. */
  iconBox: R.md,

  /* ---------- Misc ---------- */
  /** Progress bar. */
  progress: R.full,
  /** Skeleton. */
  skeleton: R.sm,
  /** Kbd key chip. */
  kbd: R.xs,
  /** Code block inline. */
  code: R.xs,
} as const;

/* -------------------------------------------------------------------------
 * DIRECTIONAL RADIUS (per-corner)
 * For elements anchored to viewport edges (drawers, sticky bars).
 * -----------------------------------------------------------------------*/
export const R_DIRECTIONAL = {
  /* ---------- Top corners only ---------- */
  /** Bottom sheet, sticky top. */
  topSm: "rounded-t-lg",
  topMd: "rounded-t-xl",
  topLg: "rounded-t-2xl",
  /** Bottom drawer (mobile sheet) — pair with DRAWER.bottom. */
  topXl: "rounded-t-3xl",

  /* ---------- Bottom corners only ---------- */
  bottomSm: "rounded-b-lg",
  bottomMd: "rounded-b-xl",
  bottomLg: "rounded-b-2xl",
  bottomXl: "rounded-b-3xl",

  /* ---------- Left corners only ---------- */
  leftSm: "rounded-l-lg",
  leftMd: "rounded-l-xl",
  leftLg: "rounded-l-2xl",
  leftXl: "rounded-l-3xl",

  /* ---------- Right corners only ---------- */
  rightSm: "rounded-r-lg",
  rightMd: "rounded-r-xl",
  rightLg: "rounded-r-2xl",
  rightXl: "rounded-r-3xl",
} as const;

/* -------------------------------------------------------------------------
 * BANNED PATTERNS (for lint / code review)
 * -----------------------------------------------------------------------*/
export const BANNED_RADII = [
  "rounded-md",        // 6px — shadcn legacy default, breaks --radius-input contract
  "rounded-[6px]",     // explicit 6px hex value
  "rounded-[10px]",    // off-scale arbitrary
  "rounded-[14px]",    // off-scale arbitrary
  "rounded-[20px]",    // off-scale arbitrary
  "rounded-[28px]",    // off-scale arbitrary
] as const;

/* -------------------------------------------------------------------------
 * HELPER: Get next smaller radius for nested element
 * Use when parent has radius X, you need child radius ≤ X.
 * -----------------------------------------------------------------------*/
export function nestedRadius(parent: RadiusTier): RadiusTier {
  const order: RadiusTier[] = ["none", "xs", "sm", "md", "lg", "xl", "full"];
  const idx = order.indexOf(parent);
  // Step down 2 tiers (parent - 4-8px typical)
  return order[Math.max(0, idx - 2)];
}
