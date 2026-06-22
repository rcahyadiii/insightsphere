/**
 * InsightSphere Button Tokens
 * ============================
 * Single source of truth for button styling across the application.
 *
 * Design rationale, variants matrix, usage guide, and migration:
 *   → See Design System/BUTTONS.md
 *
 * Architecture:
 *   - `BTN.base` — shared classes (flex, gap, radius, transition, focus, active press, disabled)
 *   - `BTN.size.*` — size tiers (xs/sm/md/lg/xl) with height + padding + typography
 *   - `BTN.iconSize.*` — square variants for icon-only buttons
 *   - `BTN.variant.*` — 13 variants (5 solid + 5 soft + outline/ghost/link)
 *   - `BTN.*` modifiers (fullWidth/pill/square)
 *   - `btn()` — helper to compose a complete class string
 *
 * Usage (verbose):
 *   import { BTN } from "@/app/lib/buttons";
 *   import { cn } from "@/app/lib/utils";
 *
 *   <button className={cn(BTN.base, BTN.size.md, BTN.variant.primary)}>
 *     Simpan
 *   </button>
 *
 * Usage (helper):
 *   import { btn } from "@/app/lib/buttons";
 *
 *   <button className={btn("primary", "md")}>Simpan</button>
 *   <button className={btn("ghost", "md", { icon: true })}><X /></button>
 *   <button className={btn("primary", "lg", { fullWidth: true })}>CTA</button>
 */

/* -------------------------------------------------------------------------
 * Base — classes shared by every button
 * -----------------------------------------------------------------------*/
/**
 * - `rounded-xl` = 12px, matches `--radius-input` in theme.css
 * - `font-bold tracking-tight` aligned with typography v1.1 (`T.buttonLg`/`T.buttonSm`)
 * - `active:scale-[0.98]` for tactile press feedback
 * - `focus-visible:ring-2 ring-offset-2` for a11y-compliant focus ring
 * - `disabled:opacity-50 disabled:pointer-events-none` standard disabled state
 * - `[&_svg]:shrink-0` icons never compress under flex
 */
export const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-bold tracking-tight transition-all " +
  "active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "dark:focus-visible:ring-offset-slate-900 " +
  "[&_svg]:pointer-events-none [&_svg]:shrink-0";

/* -------------------------------------------------------------------------
 * Size tiers
 * -----------------------------------------------------------------------*/
/**
 * | Size | Height | Padding-X | Typography       | Icon   | Use case                  |
 * |------|--------|-----------|------------------|--------|---------------------------|
 * | xs   | 28px   | 10px      | text-xs          | 12px   | Dense toolbars, chips     |
 * | sm   | 32px   | 12px      | text-xs          | 14px   | Secondary, table actions  |
 * | md   | 36px   | 16px      | text-sm (default)| 16px   | Default button            |
 * | lg   | 44px   | 20px      | text-sm          | 16px   | Primary CTA, modal footer |
 * | xl   | 48px   | 24px      | text-base        | 20px   | Hero CTA, login submit    |
 */
export const BTN = {
  base: BTN_BASE,

  size: {
    xs: "h-7 px-2.5 text-xs [&_svg]:size-3",
    sm: "h-8 px-3 text-xs [&_svg]:size-3.5",
    md: "h-9 px-4 text-sm [&_svg]:size-4",
    lg: "h-11 px-5 text-sm [&_svg]:size-4",
    xl: "h-12 px-6 text-base [&_svg]:size-5",
  },

  /** Square variants for icon-only buttons (no text). */
  iconSize: {
    xs: "h-7 w-7 [&_svg]:size-3",
    sm: "h-8 w-8 [&_svg]:size-3.5",
    md: "h-9 w-9 [&_svg]:size-4",
    lg: "h-11 w-11 [&_svg]:size-4",
    xl: "h-12 w-12 [&_svg]:size-5",
  },

  /* -----------------------------------------------------------------------
   * Variants — 5 solid + 5 soft + outline + ghost + link
   * ---------------------------------------------------------------------*/
  variant: {
    /* ----- SOLID (filled — maximum emphasis) ----- */
    /** Main CTA, brand, AI, owner role. Use sparingly (max 1 per view). */
    primary:
      "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 " +
      "text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900/30 " +
      "focus-visible:ring-indigo-400",

    /** Positive confirm, save, approve, cashier role. */
    success:
      "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 " +
      "text-white shadow-lg shadow-emerald-100 dark:shadow-emerald-900/30 " +
      "focus-visible:ring-emerald-400",

    /** Attention/caution action (rarely used; prefer soft or outline). */
    warning:
      "bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 " +
      "text-white shadow-lg shadow-amber-100 dark:shadow-amber-900/30 " +
      "focus-visible:ring-amber-400",

    /** Destructive action confirm (delete, void, shift close), admin role. */
    destructive:
      "bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 " +
      "text-white shadow-lg shadow-rose-100 dark:shadow-rose-900/30 " +
      "focus-visible:ring-rose-400",

    /** Default slate CTA (dark button). Use when `primary` is already taken. */
    neutral:
      "bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 " +
      "text-white shadow-lg shadow-slate-100 dark:shadow-slate-900/30 " +
      "focus-visible:ring-slate-400",

    /* ----- SOFT (tinted bg — medium emphasis, compatible with adjacent filled) ----- */
    primarySoft:
      "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 " +
      "border border-indigo-200 dark:border-indigo-800/50 " +
      "hover:bg-indigo-100 dark:hover:bg-indigo-900/40 " +
      "focus-visible:ring-indigo-400",

    successSoft:
      "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 " +
      "border border-emerald-200 dark:border-emerald-800/50 " +
      "hover:bg-emerald-100 dark:hover:bg-emerald-900/40 " +
      "focus-visible:ring-emerald-400",

    warningSoft:
      "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 " +
      "border border-amber-200 dark:border-amber-800/50 " +
      "hover:bg-amber-100 dark:hover:bg-amber-900/40 " +
      "focus-visible:ring-amber-400",

    destructiveSoft:
      "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 " +
      "border border-rose-200 dark:border-rose-800/50 " +
      "hover:bg-rose-100 dark:hover:bg-rose-900/40 " +
      "focus-visible:ring-rose-400",

    neutralSoft:
      "bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 " +
      "border border-slate-200 dark:border-slate-700 " +
      "hover:bg-slate-100 dark:hover:bg-slate-800 " +
      "focus-visible:ring-slate-400",

    /* ----- OUTLINE (transparent bg, border only — low-medium emphasis) ----- */
    /** Cancel / secondary action (modal footer "Batal"). */
    outline:
      "bg-transparent text-slate-700 dark:text-slate-300 " +
      "border border-slate-300 dark:border-slate-700 " +
      "hover:bg-slate-50 dark:hover:bg-slate-800/50 " +
      "focus-visible:ring-slate-400",

    /* ----- GHOST (no border, bg on hover — minimum emphasis) ----- */
    /** Toolbar actions, close button, dismiss, icon buttons. */
    ghost:
      "bg-transparent text-slate-700 dark:text-slate-300 " +
      "hover:bg-slate-100 dark:hover:bg-slate-800/50 " +
      "focus-visible:ring-slate-400",

    /* ----- LINK (styled as inline link — NO padding/height) ----- */
    /** Inline text link style. Override h-* and px-* via size — use xs/sm. */
    link:
      "bg-transparent text-indigo-600 dark:text-indigo-400 " +
      "underline-offset-4 hover:underline " +
      "h-auto !px-0 shadow-none " +
      "focus-visible:ring-indigo-400",
  },

  /* ----- Modifiers (additive) ----- */
  /** Stretch to container width. */
  fullWidth: "w-full",
  /** Circular (h = w). Use with `iconSize`. */
  pill: "rounded-full",
  /** Smaller radius (8px) for tight button groups. */
  square: "rounded-lg",
} as const;

/* -------------------------------------------------------------------------
 * Type exports
 * -----------------------------------------------------------------------*/
export type BtnSize = keyof typeof BTN.size;
export type BtnVariant = keyof typeof BTN.variant;

/* -------------------------------------------------------------------------
 * Helper — compose a complete button class string
 * -----------------------------------------------------------------------*/
export interface BtnOptions {
  /** If true, uses square `iconSize.*` instead of rectangular `size.*`. */
  icon?: boolean;
  /** Stretch to container width. */
  fullWidth?: boolean;
  /** Circular pill shape (usually with `icon: true`). */
  pill?: boolean;
  /** Smaller radius (8px) for tight button groups. */
  square?: boolean;
  /** Extra classes to append (margin, custom overrides, etc.). */
  className?: string;
}

/**
 * Compose a complete button className string.
 *
 * @example
 *   btn("primary", "md")                           // Simpan
 *   btn("ghost", "md", { icon: true })             // <X/>
 *   btn("primary", "lg", { fullWidth: true })      // Hero CTA
 *   btn("destructive", "sm", { className: "mt-2" }) // With margin
 */
export function btn(
  variant: BtnVariant,
  size: BtnSize = "md",
  opts: BtnOptions = {},
): string {
  const sizeClass = opts.icon ? BTN.iconSize[size] : BTN.size[size];
  return [
    BTN.base,
    sizeClass,
    BTN.variant[variant],
    opts.fullWidth && BTN.fullWidth,
    opts.pill && BTN.pill,
    opts.square && BTN.square,
    opts.className,
  ]
    .filter(Boolean)
    .join(" ");
}
