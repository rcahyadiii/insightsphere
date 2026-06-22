/**
 * InsightSphere Feedback Tokens
 * ================================
 * Single source of truth untuk alerts, empty states, loading (spinner/progress).
 * Toast config lives in `components/ui/sonner.tsx` (sonner wrapper).
 *
 * Design rationale, anatomy, prohibited patterns, migration guide:
 *   → See Design System/ALERTS.md
 *   → See Design System/EMPTY_STATES.md
 *   → See Design System/TOASTS.md
 *   → See Design System/LOADING.md
 *
 * Architecture:
 *   - `ALERT.*`    — Inline alert banners (5 variants + 3 sizes + close)
 *   - `EMPTY.*`    — Empty state wrapper + iconBox + title + description + size
 *   - `LOADING.*`  — Spinner sizes + skeleton color
 *   - `PROGRESS.*` — Progress bar (track + fill + label + variants)
 *
 * Usage:
 *   import { ALERT, EMPTY, LOADING, PROGRESS } from "@/app/lib/feedback";
 *   import { cn } from "@/app/lib/utils";
 *
 *   // Alert
 *   <div className={cn(ALERT.base, ALERT.variant.success)}>
 *     <CheckCircle2 className={cn("size-5", ALERT.icon.success)} />
 *     <div>
 *       <h4 className={ALERT.title}>Berhasil</h4>
 *       <p className={ALERT.description}>Data tersimpan.</p>
 *     </div>
 *   </div>
 *
 *   // Empty state (prefer <EmptyState> component wrapper)
 *   <div className={EMPTY.wrapper}>
 *     <div className={EMPTY.iconBox}><Package /></div>
 *     <h3 className={EMPTY.title}>Belum Ada Produk</h3>
 *     <p className={EMPTY.description}>Tambahkan produk pertama Anda.</p>
 *   </div>
 *
 *   // Spinner
 *   <Loader2 className={LOADING.spinner.md} />
 *
 *   // Progress
 *   <div className={PROGRESS.track}>
 *     <div className={PROGRESS.fill} style={{ width: `${pct}%` }} />
 *   </div>
 */

/* -------------------------------------------------------------------------
 * ALERT (inline banner)
 * -----------------------------------------------------------------------*/
export const ALERT = {
  /** Base: rounded-xl + border + flex start + gap. */
  base:
    "rounded-xl border p-4 flex items-start gap-3 transition-colors",

  /** Semantic variants (5). */
  variant: {
    success:
      "bg-emerald-50 dark:bg-emerald-900/30 " +
      "border-emerald-200 dark:border-emerald-800/50 " +
      "text-emerald-900 dark:text-emerald-100",

    warning:
      "bg-amber-50 dark:bg-amber-900/30 " +
      "border-amber-200 dark:border-amber-800/50 " +
      "text-amber-900 dark:text-amber-100",

    destructive:
      "bg-rose-50 dark:bg-rose-900/30 " +
      "border-rose-200 dark:border-rose-800/50 " +
      "text-rose-900 dark:text-rose-100",

    info:
      "bg-blue-50 dark:bg-blue-900/30 " +
      "border-blue-200 dark:border-blue-800/50 " +
      "text-blue-900 dark:text-blue-100",

    primary:
      "bg-indigo-50 dark:bg-indigo-900/30 " +
      "border-indigo-200 dark:border-indigo-800/50 " +
      "text-indigo-900 dark:text-indigo-100",
  },

  /** Icon color per variant (pair with variant bg). */
  icon: {
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    destructive: "text-rose-600 dark:text-rose-400",
    info: "text-blue-600 dark:text-blue-400",
    primary: "text-indigo-600 dark:text-indigo-400",
  },

  /** Title (bold, text-sm). */
  title: "text-sm font-bold",

  /** Description (sm, muted, 0.5 margin top). */
  description: "text-xs mt-0.5 opacity-80",

  /** Close button (ml-auto, small icon button). */
  close:
    "ml-auto shrink-0 p-1 rounded-lg " +
    "hover:bg-slate-900/10 dark:hover:bg-white/10 " +
    "transition-colors",

  /** Size tiers (padding + text). */
  size: {
    sm: "p-3 text-xs",
    md: "p-4 text-sm",
    lg: "p-5 text-sm",
  },
} as const;

/* -------------------------------------------------------------------------
 * EMPTY STATE
 * -----------------------------------------------------------------------*/
export const EMPTY = {
  /** Wrapper: center flex column + text-center + padding. */
  wrapper:
    "flex flex-col items-center justify-center p-12 text-center " +
    "animate-in fade-in zoom-in duration-300",

  /** Icon box: rounded + bg + flex center + bottom margin. */
  iconBox:
    "w-16 h-16 rounded-2xl mb-6 " +
    "bg-slate-100 dark:bg-slate-800 " +
    "text-slate-400 dark:text-slate-500 " +
    "flex items-center justify-center " +
    "group transition-colors",

  /** Icon box tinted variants (optional, for contextual coloring). */
  iconBoxVariant: {
    neutral: "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500",
    primary: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400",
    success: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400",
    warning: "bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400",
    destructive: "bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400",
  },

  /** Title (bold, large). */
  title:
    "text-lg font-bold mb-2 " +
    "text-slate-900 dark:text-slate-100",

  /** Description (small, muted, max-width, leading). */
  description:
    "text-sm max-w-[280px] leading-relaxed mb-8 " +
    "text-slate-500 dark:text-slate-400",

  /** Action wrapper (flex gap for multiple buttons). */
  action: "flex items-center justify-center gap-3",

  /** Size variants (adjust padding per placement). */
  size: {
    /** Table row empty (compact). */
    sm: "p-6",
    /** Card-internal (medium). */
    md: "p-8",
    /** Page-level (default / large). */
    lg: "p-12",
  },
} as const;

/* -------------------------------------------------------------------------
 * LOADING — SPINNER (Loader2 sizes)
 * -----------------------------------------------------------------------*/
export const LOADING = {
  /** Spinner sizes (apply to Loader2 icon). */
  spinner: {
    /** 12px — badge, tiny inline. */
    xs: "size-3 animate-spin",
    /** 16px — form button, compact. */
    sm: "size-4 animate-spin",
    /** 20px — default page spinner. */
    md: "size-5 animate-spin",
    /** 24px — prominent inline. */
    lg: "size-6 animate-spin",
    /** 32px — full-screen loader. */
    xl: "size-8 animate-spin",
  },

  /** Spinner color presets. */
  spinnerColor: {
    /** Neutral gray (default). */
    neutral: "text-slate-400 dark:text-slate-500",
    /** Branded indigo. */
    primary: "text-indigo-500 dark:text-indigo-400",
    /** On colored bg (in solid button). */
    onSolid: "text-white",
  },

  /** Skeleton base color (pair with animate-pulse from shadcn Skeleton primitive). */
  skeleton:
    "animate-pulse bg-slate-100 dark:bg-slate-800 rounded",
} as const;

/* -------------------------------------------------------------------------
 * PROGRESS BAR
 * -----------------------------------------------------------------------*/
export const PROGRESS = {
  /** Track (container): slate bg + rounded + overflow hidden. */
  track:
    "h-2 w-full rounded-full overflow-hidden " +
    "bg-slate-100 dark:bg-slate-800",

  /** Fill: full height + smooth transition. Pair with inline width style. */
  fill:
    "h-full bg-indigo-500 dark:bg-indigo-400 " +
    "transition-all duration-300 ease-out",

  /** Label (below or beside track). */
  label:
    "text-xs mt-1 " +
    "text-slate-500 dark:text-slate-400",

  /** Fill color variants. */
  variant: {
    primary: "bg-indigo-500 dark:bg-indigo-400",
    success: "bg-emerald-500 dark:bg-emerald-400",
    warning: "bg-amber-500 dark:bg-amber-400",
    destructive: "bg-rose-500 dark:bg-rose-400",
  },

  /** Track size variants. */
  size: {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  },
} as const;

/* -------------------------------------------------------------------------
 * Type exports
 * -----------------------------------------------------------------------*/
export type AlertVariant = keyof typeof ALERT.variant;
export type AlertSize = keyof typeof ALERT.size;
export type EmptySize = keyof typeof EMPTY.size;
export type EmptyIconBoxVariant = keyof typeof EMPTY.iconBoxVariant;
export type SpinnerSize = keyof typeof LOADING.spinner;
export type SpinnerColor = keyof typeof LOADING.spinnerColor;
export type ProgressVariant = keyof typeof PROGRESS.variant;
export type ProgressSize = keyof typeof PROGRESS.size;
