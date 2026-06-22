/**
 * InsightSphere Form Tokens
 * ===========================
 * Single source of truth untuk input, select, textarea, checkbox, radio,
 * switch, label, helper text, dan error text styling.
 *
 * Design rationale, anatomy, prohibited patterns, migration guide:
 *   → See Design System/FORMS.md
 *
 * Architecture:
 *   - `FIELD.*`  — Field wrapper (stacked label+control+helper)
 *   - `LABEL.*`  — Label text + required/optional indicators
 *   - `INPUT.*`  — Input base + size tiers + state modifiers
 *   - `TEXTAREA.*` — Textarea base + size tiers
 *   - `SELECT.*` — Select trigger (reuse INPUT styling)
 *   - `CHECKBOX.*` — Checkbox base + states
 *   - `RADIO.*`  — Radio base + states
 *   - `SWITCH.*` — Switch track + thumb + states
 *   - `HELPER.*` — Helper/hint text
 *   - `ERROR_TEXT.*` — Validation error text
 *   - `FOCUS.*`  — Focus ring presets (standalone, reusable)
 *
 * Usage:
 *   import { FIELD, LABEL, INPUT, HELPER, ERROR_TEXT } from "@/app/lib/forms";
 *   import { cn } from "@/app/lib/utils";
 *
 *   <div className={FIELD.wrapper}>
 *     <label className={cn(LABEL.base, LABEL.required)}>Email</label>
 *     <input type="email" className={cn(INPUT.base, INPUT.size.md)} />
 *     <p className={HELPER.base}>Email kerja untuk notifikasi.</p>
 *   </div>
 */

/* -------------------------------------------------------------------------
 * FOCUS RING PRESETS (field-specific — paired with bordered inputs)
 *
 * @deprecated Prefer `A11Y.focusRing.*` from `@/app/lib/a11y` for standalone
 * focus rings. This `FOCUS.*` object is retained for backward compatibility
 * and contains input-specific patterns (border + ring combo) that pair with
 * bordered fields like `<input>`, `<textarea>`, `<select>`.
 *
 * Decision rubric:
 *   - Button / icon button / link?  → `A11Y.focusRing.default`
 *   - Bordered input / textarea?    → `FOCUS.ring` (border-color + ring combo)
 *   - Colored bg (indigo-600)?      → `A11Y.focusRing.onSolid`
 *   - Dark chrome (sidebar)?        → `A11Y.focusRing.onDark`
 * -----------------------------------------------------------------------*/
export const FOCUS = {
  /** Default focus ring for bordered inputs: indigo-500 border + 20% ring. */
  ring:
    "focus:outline-none focus:border-indigo-500 " +
    "focus-visible:ring-2 focus-visible:ring-indigo-500/20",

  /** Destructive/error focus ring: rose-500. */
  ringError:
    "focus:outline-none focus:border-rose-500 " +
    "focus-visible:ring-2 focus-visible:ring-rose-500/20",

  /** Success focus ring: emerald-500. */
  ringSuccess:
    "focus:outline-none focus:border-emerald-500 " +
    "focus-visible:ring-2 focus-visible:ring-emerald-500/20",
} as const;

/* -------------------------------------------------------------------------
 * FIELD WRAPPER
 * -----------------------------------------------------------------------*/
export const FIELD = {
  /** Stacked wrapper: label above control, helper/error below. Gap 6px. */
  wrapper: "space-y-1.5",

  /** Inline wrapper: control left, label right (for checkbox/radio/switch). */
  inline: "flex items-center gap-2 cursor-pointer",

  /** Fieldset (radio group, checkbox group). */
  fieldset: "space-y-2",
} as const;

/* -------------------------------------------------------------------------
 * LABEL
 * -----------------------------------------------------------------------*/
export const LABEL = {
  /** Base label: text-xs font-bold with dark mode. */
  base:
    "text-xs font-bold text-slate-700 dark:text-slate-300 " +
    "block select-none",

  /** Required indicator: red asterisk after label. */
  required:
    "after:content-['*'] after:ml-0.5 after:text-rose-500 after:font-bold",

  /** Optional indicator: muted "(opsional)" after label. */
  optional:
    "after:content-['(opsional)'] after:ml-1.5 " +
    "after:text-slate-400 dark:after:text-slate-500 " +
    "after:font-normal after:text-[10px]",

  /** Disabled label (muted). */
  disabled: "text-slate-400 dark:text-slate-600 cursor-not-allowed",
} as const;

/* -------------------------------------------------------------------------
 * INPUT (text, email, password, number, tel, search, url, date)
 * -----------------------------------------------------------------------*/
export const INPUT = {
  /** Base input: border + bg + text + placeholder + focus + disabled. */
  base:
    "w-full rounded-xl transition-colors " +
    "border border-slate-200 dark:border-slate-700 " +
    "bg-white dark:bg-slate-900 " +
    "text-slate-900 dark:text-slate-100 " +
    "placeholder:text-slate-400 dark:placeholder:text-slate-500 " +
    "focus:outline-none focus:border-indigo-500 " +
    "focus-visible:ring-2 focus-visible:ring-indigo-500/20 " +
    "disabled:opacity-50 disabled:cursor-not-allowed " +
    "disabled:bg-slate-50 dark:disabled:bg-slate-800",

  /** Size tiers (height + padding + text size). */
  size: {
    /** Compact: h-9 (36px), text-xs — for inline filters, dense forms. */
    sm: "h-9 px-3 text-xs",
    /** Default: h-10 (40px), text-sm — standard form. */
    md: "h-10 px-4 text-sm",
    /** Large: h-11 (44px), text-sm — primary CTA forms (login). */
    lg: "h-11 px-4 text-sm",
  },

  /** Error state modifier: rose border + ring. */
  error:
    "border-rose-500 dark:border-rose-500 " +
    "focus:border-rose-500 focus-visible:ring-rose-500/20",

  /** Success state modifier: emerald border + ring. */
  success:
    "border-emerald-500 dark:border-emerald-500 " +
    "focus:border-emerald-500 focus-visible:ring-emerald-500/20",

  /** Readonly state: bg-slate-50 + no opacity. */
  readonly: "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
} as const;

/* -------------------------------------------------------------------------
 * TEXTAREA
 * -----------------------------------------------------------------------*/
export const TEXTAREA = {
  /** Reuse INPUT.base styling. */
  base: INPUT.base,

  /** Size tiers: min-height instead of fixed height. */
  size: {
    sm: "min-h-[80px] px-3 py-2 text-xs",
    md: "min-h-[100px] px-3 py-2 text-sm",
    lg: "min-h-[140px] px-4 py-3 text-sm",
  },

  /** Resize behavior (vertical only — horizontal resize feels broken). */
  resize: "resize-y",

  /** No resize (fixed height). */
  noResize: "resize-none",
} as const;

/* -------------------------------------------------------------------------
 * SELECT (native or shadcn trigger)
 * -----------------------------------------------------------------------*/
export const SELECT = {
  /** Reuse INPUT styling. */
  base: INPUT.base,
  size: INPUT.size,
  error: INPUT.error,

  /** Remove native arrow (pair with custom ChevronDown icon). */
  noArrow: "appearance-none pr-10",
} as const;

/* -------------------------------------------------------------------------
 * CHECKBOX
 * -----------------------------------------------------------------------*/
export const CHECKBOX = {
  base:
    "size-4 rounded transition-colors " +
    "border border-slate-300 dark:border-slate-600 " +
    "text-indigo-600 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 " +
    "disabled:opacity-50 disabled:cursor-not-allowed",

  /** Error state. */
  error: "border-rose-500 focus-visible:ring-rose-500/20",
} as const;

/* -------------------------------------------------------------------------
 * RADIO
 * -----------------------------------------------------------------------*/
export const RADIO = {
  base:
    "size-4 rounded-full transition-colors " +
    "border border-slate-300 dark:border-slate-600 " +
    "text-indigo-600 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 " +
    "disabled:opacity-50 disabled:cursor-not-allowed",

  error: "border-rose-500 focus-visible:ring-rose-500/20",
} as const;

/* -------------------------------------------------------------------------
 * SWITCH (custom toggle)
 * -----------------------------------------------------------------------*/
export const SWITCH = {
  /** Track base (apply `on` or `off` state). */
  base:
    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full " +
    "transition-colors cursor-pointer " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 " +
    "disabled:opacity-50 disabled:cursor-not-allowed",

  /** On state: indigo background. */
  on: "bg-indigo-600",

  /** Off state: slate background. */
  off: "bg-slate-200 dark:bg-slate-700",

  /** Thumb (white circle). */
  thumb:
    "inline-block size-4 transform rounded-full bg-white shadow-sm " +
    "transition-transform",

  /** Thumb on-state position (right). */
  thumbOn: "translate-x-6",

  /** Thumb off-state position (left). */
  thumbOff: "translate-x-1",
} as const;

/* -------------------------------------------------------------------------
 * HELPER TEXT (hint, description)
 * -----------------------------------------------------------------------*/
export const HELPER = {
  /** Default helper text: muted, small. */
  base: "text-xs text-slate-500 dark:text-slate-400",

  /** With icon (info). */
  withIcon: "text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1",
} as const;

/* -------------------------------------------------------------------------
 * ERROR TEXT (validation error)
 * -----------------------------------------------------------------------*/
export const ERROR_TEXT = {
  /** Default error text: rose-600 / rose-400 dark. */
  base: "text-xs font-medium text-rose-600 dark:text-rose-400",

  /** With icon (AlertCircle). */
  withIcon:
    "text-xs font-medium text-rose-600 dark:text-rose-400 " +
    "flex items-start gap-1",
} as const;

/* -------------------------------------------------------------------------
 * SUCCESS TEXT (validation success — optional, rare)
 * -----------------------------------------------------------------------*/
export const SUCCESS_TEXT = {
  base: "text-xs font-medium text-emerald-600 dark:text-emerald-400",
  withIcon:
    "text-xs font-medium text-emerald-600 dark:text-emerald-400 " +
    "flex items-start gap-1",
} as const;

/* -------------------------------------------------------------------------
 * Type exports
 * -----------------------------------------------------------------------*/
export type InputSize = keyof typeof INPUT.size;
export type TextareaSize = keyof typeof TEXTAREA.size;
export type SelectSize = keyof typeof SELECT.size;
