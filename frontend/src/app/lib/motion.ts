/**
 * InsightSphere Motion Tokens
 * ============================
 * Single source of truth for animation durations, transition recipes,
 * and animation presets across the application.
 *
 * Design rationale, migration guide, and a11y considerations:
 *   → See Design System/MOTION.md
 *
 * Architecture:
 *   - `M.duration.*` — 3 tier durations (quick/standard/slow)
 *   - `M.transition.*` — property-specific transition recipes
 *   - `M.modalEnter` / `M.dropdownEnter` / etc. — animation presets
 *
 * Usage:
 *   import { M } from "@/app/lib/motion";
 *   import { cn } from "@/app/lib/utils";
 *
 *   // Modal
 *   <div className={cn("fixed inset-0 bg-slate-900/60", M.backdropEnter)}>
 *     <div className={cn("rounded-3xl bg-white shadow-2xl", M.modalEnter)}>
 *       ...
 *     </div>
 *   </div>
 *
 *   // Button hover
 *   <button className={cn(
 *     "bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl",
 *     M.transition.color
 *   )}>
 *     Simpan
 *   </button>
 */

/* -------------------------------------------------------------------------
 * Duration tiers (3 levels)
 * -----------------------------------------------------------------------*/
/**
 * | Tier     | Class          | Milliseconds | Use case                           |
 * |----------|----------------|--------------|------------------------------------|
 * | quick    | duration-200   | 200          | Hover, button press, modal         |
 * | standard | duration-300   | 300          | Panel swap, fade, drawer           |
 * | slow     | duration-500   | 500          | Chart reveal, progress, ambient    |
 */
export const M = {
  duration: {
    quick: "duration-200",
    standard: "duration-300",
    slow: "duration-500",
  },

  /* -----------------------------------------------------------------------
   * Transition recipes (property-specific, avoiding transition-all)
   * ---------------------------------------------------------------------*/
  transition: {
    /** Background, border, text, ring color changes. Most common. */
    color: "transition-colors duration-200",
    /** Translate, scale, rotate, skew. Use for hover scale, press. */
    transform: "transition-transform duration-200",
    /** Fade in/out. */
    opacity: "transition-opacity duration-200",
    /** Shadow lift on hover (card patterns). */
    shadow: "transition-shadow duration-200",
    /**
     * Multi-property transition. Use ONLY when multiple properties
     * change simultaneously (e.g., color + shadow + transform on hover).
     * Prefer specific properties above for better performance.
     */
    all: "transition-all duration-200",
  },

  /* -----------------------------------------------------------------------
   * Animation presets (Tailwind Animate)
   * ---------------------------------------------------------------------*/

  /**
   * Modal / Dialog entrance.
   * Standard: fade + zoom-95 + slide-up + quick duration.
   */
  modalEnter:
    "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-200",

  /**
   * Modal / Dialog exit (reverse of modalEnter).
   */
  modalExit:
    "animate-out fade-out-0 zoom-out-95 slide-out-to-bottom-4 duration-200",

  /**
   * Drawer sliding from the right (standard for detail panels).
   */
  drawerEnterRight: "animate-in slide-in-from-right duration-300",

  /**
   * Drawer sliding from the bottom (standard for mobile sheets).
   */
  drawerEnterBottom: "animate-in slide-in-from-bottom-8 duration-300",

  /**
   * Drawer sliding from the left (sidebar-like).
   */
  drawerEnterLeft: "animate-in slide-in-from-left duration-300",

  /**
   * Dropdown menu / select popup entrance.
   * Anchored from top, slightly faster than modal.
   */
  dropdownEnter:
    "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150",

  /**
   * Tooltip entrance. Subtle, quick.
   */
  tooltipEnter: "animate-in fade-in-0 zoom-in-95 duration-150",

  /**
   * Popover entrance (larger than tooltip, has padding).
   */
  popoverEnter:
    "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200",

  /**
   * Modal backdrop fade.
   */
  backdropEnter: "animate-in fade-in-0 duration-200",

  /**
   * Generic fade-in reveal (standard duration).
   */
  fadeIn: "animate-in fade-in duration-300",

  /**
   * Generic fade-in reveal (quick).
   */
  fadeInQuick: "animate-in fade-in duration-200",

  /**
   * Toast notification entrance.
   */
  toastEnter:
    "animate-in fade-in-0 slide-in-from-top-2 duration-300",

  /**
   * Toast notification exit.
   */
  toastExit:
    "animate-out fade-out-0 slide-out-to-top-2 duration-200",

  /* -----------------------------------------------------------------------
   * Accordion (shadcn Radix Accordion — `data-state` driven)
   * ---------------------------------------------------------------------*/

  /**
   * Accordion content open/close.
   * Pairs with `@keyframes accordion-down/up` defined in Tailwind/theme.
   */
  accordion:
    "data-[state=open]:animate-accordion-down " +
    "data-[state=closed]:animate-accordion-up",

  /**
   * Collapsible content (generic disclosure).
   */
  collapsible:
    "data-[state=open]:animate-in data-[state=closed]:animate-out " +
    "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 " +
    "duration-200",

  /* -----------------------------------------------------------------------
   * Slide presets (notifications, panels)
   * ---------------------------------------------------------------------*/

  slideInRight: "animate-in slide-in-from-right-4 duration-300",
  slideInLeft: "animate-in slide-in-from-left-4 duration-300",
  slideInTop: "animate-in slide-in-from-top-4 duration-300",
  slideInBottom: "animate-in slide-in-from-bottom-4 duration-300",

  /* -----------------------------------------------------------------------
   * Page transitions (route changes)
   * ---------------------------------------------------------------------*/

  /** Page enter: subtle fade + slight upward movement. */
  pageEnter:
    "animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out",

  /* -----------------------------------------------------------------------
   * Emphasis animations (attention-grab)
   * ---------------------------------------------------------------------*/

  /** Pulse scale (attention to CTA). Respect reduced motion via motion-safe. */
  pulseScale: "motion-safe:animate-pulse",

  /** Shake (validation error — use sparingly). */
  shake: "motion-safe:animate-shake",

  /** Bounce (stop-sign warning). */
  bounce: "motion-safe:animate-bounce",

  /* -----------------------------------------------------------------------
   * Skeleton loading
   * ---------------------------------------------------------------------*/

  /** Shimmer effect for skeleton states. */
  shimmer: "animate-pulse motion-reduce:animate-none",

  /* -----------------------------------------------------------------------
   * Hover lift preset (card interactive)
   * ---------------------------------------------------------------------*/

  /** Card hover: lift + shadow bloom. Compose-ready. */
  cardLift:
    "transition-all duration-200 " +
    "hover:-translate-y-0.5 hover:shadow-md " +
    "motion-reduce:hover:translate-y-0",
} as const;

/* -------------------------------------------------------------------------
 * DELAY TOKENS (for stagger, sequential reveal)
 * -----------------------------------------------------------------------*/

/**
 * Tailwind delay classes — use with `animate-in`:
 *
 *   <li className={cn(M.fadeIn, DELAY[100])}>Item 1</li>
 *   <li className={cn(M.fadeIn, DELAY[200])}>Item 2</li>
 *   <li className={cn(M.fadeIn, DELAY[300])}>Item 3</li>
 */
export const DELAY = {
  /** 75ms — micro-delay. */
  75: "delay-75",
  /** 100ms — default stagger unit. */
  100: "delay-100",
  /** 150ms */
  150: "delay-150",
  /** 200ms */
  200: "delay-200",
  /** 300ms */
  300: "delay-300",
  /** 500ms */
  500: "delay-500",
  /** 700ms */
  700: "delay-700",
  /** 1000ms — slow reveal. */
  1000: "delay-1000",
} as const;

/* -------------------------------------------------------------------------
 * STAGGER HELPER (generate N staggered delay values)
 * -----------------------------------------------------------------------*/

/**
 * Return array of Tailwind delay classes (100ms apart).
 *
 *   const delays = stagger(4);
 *   // → ["delay-0", "delay-100", "delay-200", "delay-300"]
 *
 *   items.map((item, i) => (
 *     <li className={cn(M.fadeIn, delays[i])}>...</li>
 *   ))
 */
export function stagger(count: number, stepMs = 100): string[] {
  return Array.from({ length: count }, (_, i) => {
    const ms = i * stepMs;
    if (ms === 0) return "delay-0";
    // Tailwind supports delay-75/100/150/200/300/500/700/1000 as preset.
    // For arbitrary, use delay-[Nms] bracket notation.
    const presets = [75, 100, 150, 200, 300, 500, 700, 1000];
    return presets.includes(ms) ? `delay-${ms}` : `delay-[${ms}ms]`;
  });
}

/* -------------------------------------------------------------------------
 * TIME CONSTANTS (milliseconds — for JS, not CSS)
 *
 * Use these for `setTimeout`, debounce, throttle, polling intervals, etc.
 * -----------------------------------------------------------------------*/

export const TIME = {
  /** Instant feedback (typing debounce). */
  instant: 0,

  /** 150ms — dropdown open delay. */
  micro: 150,

  /** 200ms — button press, quick transitions. */
  quick: 200,

  /** 300ms — standard transition, hover tooltip default. */
  standard: 300,

  /** 500ms — slow transition, search debounce standard. */
  slow: 500,

  /** 700ms — very slow (emphasis). */
  extraSlow: 700,

  /** 1000ms — 1 second (full second). */
  second: 1000,

  /** 3000ms — toast auto-dismiss (info). */
  toastInfo: 3000,

  /** 4000ms — toast auto-dismiss (success — default). */
  toastSuccess: 4000,

  /** 6000ms — toast auto-dismiss (warning). */
  toastWarning: 6000,

  /** Infinity — toast persists until dismissed (destructive/errors). */
  toastPersist: Infinity,

  /** 300ms — input debounce for search/typeahead. */
  debounceInput: 300,

  /** 500ms — heavy search debounce. */
  debounceSearch: 500,

  /** 1000ms — auto-save debounce. */
  debounceAutoSave: 1000,

  /** 60_000ms (1 min) — polling interval for dashboards. */
  pollDashboard: 60_000,

  /** 300_000ms (5 min) — polling interval for background sync. */
  pollBackground: 300_000,

  /** 1800_000ms (30 min) — session warning threshold. */
  sessionWarning: 1800_000,

  /** 3600_000ms (60 min) — session timeout. */
  sessionTimeout: 3600_000,
} as const;

export type DurationTier = keyof typeof M.duration;
export type TransitionRecipe = keyof typeof M.transition;
export type DelayTier = keyof typeof DELAY;
export type TimeConstant = keyof typeof TIME;
