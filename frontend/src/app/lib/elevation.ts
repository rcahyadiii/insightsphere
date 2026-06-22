/**
 * InsightSphere Elevation & Layering Tokens
 * =============================================
 * Single source of truth untuk shadows (depth) + z-index (layering).
 * Bersama mereka mengatur **perceived depth** dari flat (surface) ke overlays.
 *
 * Design rationale:
 *   → See Design System/ELEVATION.md
 *
 * Architecture:
 *   - `E.*`         — Shadow tiers (7 levels: none → 2xl + colored glows)
 *   - `E_COMPONENT.*` — Pre-mapped shadow per component type
 *   - `Z.*`         — Z-index layering registry (11 semantic layers)
 *   - `Z_NUMERIC.*` — Numeric z-index values (for inline styles)
 *   - `BANNED_Z`    — Arbitrary z-values to refuse in code review
 *
 * Usage:
 *   import { E, E_COMPONENT, Z } from "@/app/lib/elevation";
 *   import { cn } from "@/app/lib/utils";
 *
 *   // Shadows by tier
 *   <div className={cn(E.md, "rounded-xl bg-white")}>...</div>
 *
 *   // Shadows by component (recommended)
 *   <button className={E_COMPONENT.buttonPrimary}>Simpan</button>
 *
 *   // Z-index by semantic layer
 *   <div className={cn(Z.modal, "fixed inset-0")}>...</div>
 *
 * Design principles:
 *   1. 7 shadow tiers — closed system, no arbitrary shadow strings.
 *   2. Colored glows (primary/success/etc) reserved for solid buttons only.
 *   3. Z-index LOCKED to 11 semantic layers — no z-[9999] ad-hoc values.
 *   4. Dark mode: shadows auto-lighter (dark bg absorbs too much).
 */

/* -------------------------------------------------------------------------
 * SHADOWS (Elevation tiers)
 *
 * | Tier | Class         | Use case                                       |
 * |------|---------------|------------------------------------------------|
 * | none | shadow-none   | Flat (tables, inline chips)                    |
 * | xs   | shadow-xs     | Subtle (pressed buttons, skeleton)             |
 * | sm   | shadow-sm     | **Default card at rest**                        |
 * | md   | shadow-md     | Hover-lifted card, dropdown                    |
 * | lg   | shadow-lg     | Solid buttons (brand emphasis)                 |
 * | xl   | shadow-xl     | Floating panels, popovers                      |
 * | 2xl  | shadow-2xl    | Modals, drawers (maximum elevation)            |
 * | inner| shadow-inner  | Inset (input focus, active buttons)            |
 * -----------------------------------------------------------------------*/

export const E = {
  /** Flat — no shadow. */
  none: "shadow-none",

  /** Subtle — skeleton, pressed state. */
  xs: "shadow-xs",

  /** Default card at rest. */
  sm: "shadow-sm",

  /** Hover-lifted card, dropdown, popover resting. */
  md: "shadow-md",

  /** Solid buttons (brand emphasis with colored glow below). */
  lg: "shadow-lg",

  /** Floating panels, large popovers. */
  xl: "shadow-xl",

  /** Modals, drawers (maximum elevation). */
  "2xl": "shadow-2xl",

  /** Inset (input focus, active toggles). */
  inner: "shadow-inner",

  /* ---------- Colored glows (pair with solid buttons) ---------- */
  /**
   * Colored glow — subtle tint below solid button to add brand presence.
   * Only use on SOLID buttons (primary/success/warning/destructive/neutral).
   */
  glowPrimary: "shadow-lg shadow-indigo-100 dark:shadow-indigo-900/30",
  glowSuccess: "shadow-lg shadow-emerald-100 dark:shadow-emerald-900/30",
  glowWarning: "shadow-lg shadow-amber-100 dark:shadow-amber-900/30",
  glowDestructive: "shadow-lg shadow-rose-100 dark:shadow-rose-900/30",
  glowNeutral: "shadow-lg shadow-slate-100 dark:shadow-slate-900/30",
  glowInfo: "shadow-lg shadow-blue-100 dark:shadow-blue-900/30",
  glowAi: "shadow-lg shadow-violet-100 dark:shadow-violet-900/30",
} as const;

export type ElevationTier = keyof typeof E;

/* -------------------------------------------------------------------------
 * PER-COMPONENT SHADOW (self-documenting)
 * -----------------------------------------------------------------------*/
export const E_COMPONENT = {
  /* ---------- Buttons ---------- */
  /** Solid primary button. */
  buttonPrimary: E.glowPrimary,
  /** Solid success button. */
  buttonSuccess: E.glowSuccess,
  /** Solid warning button. */
  buttonWarning: E.glowWarning,
  /** Solid destructive button. */
  buttonDestructive: E.glowDestructive,
  /** Solid neutral button. */
  buttonNeutral: E.glowNeutral,
  /** Soft/outline/ghost button. */
  buttonSoft: E.none,

  /* ---------- Containers ---------- */
  /** Card at rest. */
  card: E.sm,
  /** Card on hover. */
  cardHover: E.md,
  /** Hero card (featured). */
  cardHero: E.lg,
  /** KPI card. */
  kpi: E.sm,
  /** KPI on hover. */
  kpiHover: E.md,

  /* ---------- Overlays ---------- */
  /** Dropdown menu content. */
  dropdown: E.md,
  /** Popover content. */
  popover: E.md,
  /** Tooltip. */
  tooltip: E.md,
  /** Modal (max elevation). */
  modal: E["2xl"],
  /** Drawer (max elevation). */
  drawer: E["2xl"],
  /** Toast notification. */
  toast: E.lg,

  /* ---------- Form ---------- */
  /** Input at rest. */
  input: E.none,
  /** Input focus (subtle inset). */
  inputFocus: E.none, // focus ring handles elevation
  /** Switch thumb. */
  switchThumb: E.xs,

  /* ---------- Navigation ---------- */
  /** Sticky header. */
  header: E.sm,
  /** Sidebar active item. */
  sidebarActiveItem: E.xs,
} as const;

/* -------------------------------------------------------------------------
 * Z-INDEX LAYERING REGISTRY
 *
 * Single ordered registry untuk semua z-index di app.
 * Setiap layer punya semantic name — NO arbitrary z-[9999] values.
 *
 * Layer order (bottom → top):
 *   0. base          — default stacking context
 *   1. below         — below normal flow (decorative bg)
 *   2. raised        — subtle elevation (sticky row highlight)
 *   3. dropdown      — dropdown menus, autocomplete
 *   4. sticky        — sticky headers, fixed toolbars
 *   5. fixed         — fixed elements (FAB, side nav mobile)
 *   6. header        — app header (sticky top)
 *   7. overlay       — modal backdrop, drawer overlay
 *   8. modal         — modal content, drawer content
 *   9. popover       — popover, dropdown ABOVE modal
 *  10. tooltip       — tooltip (always on top of popover)
 *  11. toast         — toast notifications (above everything)
 *  12. skipLink      — skip-to-content link (ABOVE toast when focused)
 * -----------------------------------------------------------------------*/
export const Z = {
  /** Below normal flow (decorative bg). */
  below: "z-[-1]",

  /** Default stacking context. */
  base: "z-0",

  /** Subtle raised (e.g., selected row highlight over table). */
  raised: "z-10",

  /** Dropdown menus, autocomplete, select options. */
  dropdown: "z-20",

  /** Sticky elements (filter bar, table header). */
  sticky: "z-30",

  /** Fixed chrome (app header). */
  header: "z-40",

  /** Modal/drawer backdrop overlay. */
  overlay: "z-50",

  /** Modal / drawer content (above their backdrop). */
  modal: "z-50",

  /** Popover / dropdown opened INSIDE a modal (must be above modal). */
  popover: "z-[60]",

  /** Tooltip (always on top of popovers). */
  tooltip: "z-[70]",

  /** Toast notifications (above everything). */
  toast: "z-[80]",

  /** Skip link (keyboard focus — must be above toast). */
  skipLink: "z-[100]",
} as const;

export type ZLayer = keyof typeof Z;

/* -------------------------------------------------------------------------
 * NUMERIC Z-INDEX VALUES (for inline style / JS)
 * -----------------------------------------------------------------------*/
export const Z_NUMERIC = {
  below: -1,
  base: 0,
  raised: 10,
  dropdown: 20,
  sticky: 30,
  header: 40,
  overlay: 50,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
  skipLink: 100,
} as const;

/* -------------------------------------------------------------------------
 * BANNED PATTERNS (for lint / code review)
 * -----------------------------------------------------------------------*/
export const BANNED_Z = [
  "z-[100]",   // use Z.skipLink
  "z-[110]",   // arbitrary
  "z-[200]",   // arbitrary
  "z-[201]",   // arbitrary
  "z-[1000]",  // arbitrary legacy
  "z-[1001]",  // arbitrary
  "z-[1002]",  // arbitrary
  "z-[1010]",  // arbitrary
  "z-[2000]",  // arbitrary
  "z-[9999]",  // NUCLEAR — never use
] as const;

export const BANNED_SHADOWS = [
  "shadow-[0_0_8px_rgba(79,70,229,0.5)]",   // use E.glowPrimary
  "shadow-[0_0_20px_rgba(var(--primary),0.05)]", // arbitrary
] as const;
