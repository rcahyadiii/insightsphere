/**
 * InsightSphere Accessibility (A11y) Utilities & Tokens
 * =========================================================
 * Reusable class strings and helpers untuk memastikan WCAG 2.1 AA compliance.
 *
 * Design rationale, full patterns, migration guide:
 *   → See Design System/A11Y.md
 *
 * Architecture:
 *   - `A11Y.focusRing.*`   — Visible focus ring class strings (default/destructive/dark/onSolid)
 *   - `A11Y.srOnly`         — Visually hidden but screen-reader accessible
 *   - `A11Y.notSrOnly`      — Reveal sr-only on focus
 *   - `A11Y.skipLink`       — Skip-to-content link classes
 *   - `A11Y.motionReduce`   — Respect prefers-reduced-motion
 *   - `fieldA11yProps()`    — Helper: generate ARIA props for form fields
 *   - `describedByIds()`    — Helper: compose aria-describedby ID list
 *
 * Usage:
 *   import { A11Y, fieldA11yProps } from "@/app/lib/a11y";
 *   import { cn } from "@/app/lib/utils";
 *
 *   // Focus ring on button
 *   <button className={cn(BTN.base, A11Y.focusRing.default)}>...</button>
 *
 *   // Skip link (top of layout)
 *   <a href="#main-content" className={A11Y.skipLink}>Lompat ke konten utama</a>
 *
 *   // sr-only label
 *   <button>
 *     <Trash2 aria-hidden="true" />
 *     <span className={A11Y.srOnly}>Hapus produk</span>
 *   </button>
 *
 *   // Form field ARIA
 *   <input {...fieldA11yProps({ id: "email", required: true, error: errorMsg })} />
 */

/* -------------------------------------------------------------------------
 * A11Y — Class Strings
 * -----------------------------------------------------------------------*/
export const A11Y = {
  /**
   * Focus ring variants — pair with `outline-none` on trigger element.
   * Always use `focus-visible:` (keyboard only) — not `focus:` (mouse click triggers too).
   */
  focusRing: {
    /** Default: indigo ring on light/dark bg. */
    default:
      "outline-none " +
      "focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 " +
      "dark:focus-visible:ring-offset-slate-900",

    /** Destructive actions (delete, remove). */
    destructive:
      "outline-none " +
      "focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 " +
      "dark:focus-visible:ring-offset-slate-900",

    /** On dark chrome (sidebar): use white/40 ring (no offset to dark bg). */
    onDark:
      "outline-none " +
      "focus-visible:ring-2 focus-visible:ring-white/40",

    /** On solid colored bg (e.g., bg-indigo-600 button): use white ring inset. */
    onSolid:
      "outline-none " +
      "focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 " +
      "focus-visible:ring-offset-indigo-600",

    /** Subtle — for link-style buttons (no ring offset, just underline + ring). */
    link:
      "outline-none " +
      "focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:rounded-md",

    /** Inset — ring inside element boundary (for tight containers). */
    inset:
      "outline-none " +
      "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500",
  },

  /** Container ring (when child is focused) — useful for input wrapper. */
  focusWithin:
    "focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500",

  /**
   * sr-only: Visually hidden but available to screen readers.
   * Tailwind default utility — alias here for explicit import.
   */
  srOnly: "sr-only",

  /**
   * Reveal sr-only content on focus (used with skip links).
   */
  notSrOnly:
    "focus:not-sr-only focus:absolute focus:z-50",

  /**
   * Skip-to-content link — sr-only by default, visible on keyboard focus.
   *
   * Place as first child of layout/body:
   *   <a href="#main-content" className={A11Y.skipLink}>
   *     Lompat ke konten utama
   *   </a>
   *
   * Target:
   *   <main id="main-content">...</main>
   */
  skipLink:
    "sr-only focus:not-sr-only " +
    "focus:absolute focus:top-4 focus:left-4 focus:z-[100] " +
    "focus:px-4 focus:py-2 focus:rounded-xl " +
    "focus:bg-indigo-600 focus:text-white focus:shadow-lg " +
    "focus:text-sm focus:font-bold " +
    "outline-none " +
    "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-300",

  /**
   * Motion reduce utilities (pair with motion-safe if needed).
   * Example: `cn("animate-pulse", A11Y.motionReduce.none)`
   */
  motionReduce: {
    /** Disable animation entirely when reduced motion preferred. */
    none: "motion-reduce:animate-none motion-reduce:transition-none",
    /** Disable transform (keep opacity transitions). */
    noTransform: "motion-reduce:transform-none",
  },

  /** Motion safe (apply animation ONLY if user doesn't prefer reduced). */
  motionSafe: {
    pulse: "motion-safe:animate-pulse",
    spin: "motion-safe:animate-spin",
    bounce: "motion-safe:animate-bounce",
  },

  /**
   * Touch target minimum size (WCAG AAA 2.5.5: 44×44px).
   * Apply to any tap target: icon buttons, links in toolbars.
   */
  tapTarget: "min-h-[44px] min-w-[44px]",

  /**
   * Forced-colors mode support (Windows high contrast).
   * Apply where default colors would break in high contrast.
   */
  forcedColors: "forced-colors:border forced-colors:border-[ButtonText]",
} as const;

/* -------------------------------------------------------------------------
 * ARIA helper types
 * -----------------------------------------------------------------------*/

export type AriaLiveLevel = "off" | "polite" | "assertive";

export type AriaCurrentValue =
  | "page"
  | "step"
  | "location"
  | "date"
  | "time"
  | true
  | false;

/* -------------------------------------------------------------------------
 * Form A11y Helpers
 * -----------------------------------------------------------------------*/

export interface FieldA11yOptions {
  /** Field ID (required, used to wire label/error/help). */
  id: string;
  /** Is field required? */
  required?: boolean;
  /** Error message (if invalid). */
  error?: string | null;
  /** Helper text ID (if field has helper text). */
  helperId?: string;
  /** Custom describedby IDs to append. */
  describedBy?: string[];
}

/**
 * Generate ARIA props for form fields.
 *
 * Returns props ready to spread on <input>, <textarea>, <select>:
 *   - `id`
 *   - `aria-required` (if required)
 *   - `aria-invalid` (if error)
 *   - `aria-describedby` (error ID + helper ID + custom)
 *
 * Usage:
 *   <label htmlFor="email">Email</label>
 *   <input {...fieldA11yProps({ id: "email", required: true, error: errorMsg })} />
 *   {errorMsg && <p id="email-error" role="alert">{errorMsg}</p>}
 */
export function fieldA11yProps(opts: FieldA11yOptions) {
  const { id, required, error, helperId, describedBy = [] } = opts;
  const errorId = error ? `${id}-error` : null;

  const describedByIds = [
    ...(errorId ? [errorId] : []),
    ...(helperId ? [helperId] : []),
    ...describedBy,
  ];

  return {
    id,
    ...(required ? { "aria-required": true as const } : {}),
    ...(error ? { "aria-invalid": true as const } : {}),
    ...(describedByIds.length > 0
      ? { "aria-describedby": describedByIds.join(" ") }
      : {}),
  };
}

/**
 * Compose aria-describedby from multiple IDs (skip falsy).
 *
 * Usage:
 *   <input aria-describedby={describedByIds("email-help", errorMsg && "email-error")} />
 */
export function describedByIds(...ids: (string | null | undefined | false)[]): string | undefined {
  const filtered = ids.filter(Boolean) as string[];
  return filtered.length > 0 ? filtered.join(" ") : undefined;
}

/* -------------------------------------------------------------------------
 * Key matcher helpers (for onKeyDown handlers)
 * -----------------------------------------------------------------------*/

/**
 * Common key matchers for custom keyboard handlers.
 * Prefer Radix primitives which handle keyboard automatically.
 *
 * Usage:
 *   const handleKeyDown = (e: React.KeyboardEvent) => {
 *     if (KEYS.isEscape(e)) onClose();
 *     if (KEYS.isEnterOrSpace(e)) onActivate();
 *   };
 */
export const KEYS = {
  isEscape: (e: React.KeyboardEvent | KeyboardEvent) => e.key === "Escape",
  isEnter: (e: React.KeyboardEvent | KeyboardEvent) => e.key === "Enter",
  isSpace: (e: React.KeyboardEvent | KeyboardEvent) => e.key === " " || e.key === "Spacebar",
  isEnterOrSpace: (e: React.KeyboardEvent | KeyboardEvent) =>
    e.key === "Enter" || e.key === " " || e.key === "Spacebar",
  isTab: (e: React.KeyboardEvent | KeyboardEvent) => e.key === "Tab",
  isArrowUp: (e: React.KeyboardEvent | KeyboardEvent) => e.key === "ArrowUp",
  isArrowDown: (e: React.KeyboardEvent | KeyboardEvent) => e.key === "ArrowDown",
  isArrowLeft: (e: React.KeyboardEvent | KeyboardEvent) => e.key === "ArrowLeft",
  isArrowRight: (e: React.KeyboardEvent | KeyboardEvent) => e.key === "ArrowRight",
  isHome: (e: React.KeyboardEvent | KeyboardEvent) => e.key === "Home",
  isEnd: (e: React.KeyboardEvent | KeyboardEvent) => e.key === "End",
} as const;

/* -------------------------------------------------------------------------
 * Live Region Props (spread on element)
 * -----------------------------------------------------------------------*/

/**
 * Standard live region props for polite announcements (status updates).
 *
 *   <div {...LIVE_REGION.polite}>{statusText}</div>
 */
export const LIVE_REGION = {
  /** Non-urgent announcements (toast success, data updated). */
  polite: {
    role: "status" as const,
    "aria-live": "polite" as const,
    "aria-atomic": true,
  },

  /** Urgent announcements (errors, session expiring). Use sparingly. */
  assertive: {
    role: "alert" as const,
    "aria-live": "assertive" as const,
    "aria-atomic": true,
  },
} as const;

/* -------------------------------------------------------------------------
 * Type exports
 * -----------------------------------------------------------------------*/
export type FocusRingVariant = keyof typeof A11Y.focusRing;
