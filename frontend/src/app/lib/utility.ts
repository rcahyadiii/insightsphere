/**
 * InsightSphere Utility Tokens
 * ================================
 * Single source of truth untuk micro-utilities:
 * cursor, opacity scale, border widths, ring widths, backdrop blur,
 * transform presets, outline visibility.
 *
 * Companion:
 *   - Design System/A11Y.md          (focus visibility)
 *   - Design System/MOTION.md        (transitions)
 *   - Design System/ELEVATION.md     (shadows)
 *
 * Architecture:
 *   - `CURSOR.*`     — Cursor types (pointer, not-allowed, etc.)
 *   - `OPACITY.*`    — Semantic opacity scale (muted, subtle, disabled)
 *   - `BORDER_W.*`   — Border width tokens
 *   - `RING_W.*`     — Ring width tokens
 *   - `BACKDROP.*`   — Backdrop blur + overlay tokens
 *   - `SELECT.*`     — user-select variants
 *   - `POINTER.*`    — pointer-events variants
 *   - `SCROLL.*`     — overflow + scrollbar styling
 *   - `TRANSFORM.*`  — common transform presets
 *   - `WHITESPACE.*` — whitespace utilities
 *
 * Usage:
 *   import { CURSOR, OPACITY, BACKDROP } from "@/app/lib/utility";
 *
 *   <button className={CURSOR.pointer}>Click</button>
 *   <div className={OPACITY.disabled}>Disabled state</div>
 *   <div className={BACKDROP.overlay}>Modal backdrop</div>
 */

/* -------------------------------------------------------------------------
 * CURSOR
 * -----------------------------------------------------------------------*/

export const CURSOR = {
  /** Default cursor (arrow). */
  default: "cursor-default",
  /** Pointer (clickable element). */
  pointer: "cursor-pointer",
  /** Not allowed (disabled interactive). */
  notAllowed: "cursor-not-allowed",
  /** Wait (async processing). */
  wait: "cursor-wait",
  /** Text selection. */
  text: "cursor-text",
  /** Move (drag). */
  move: "cursor-move",
  /** Grab (draggable). */
  grab: "cursor-grab",
  /** Grabbing (actively being dragged). */
  grabbing: "cursor-grabbing",
  /** Resize horizontal. */
  resizeX: "cursor-ew-resize",
  /** Resize vertical. */
  resizeY: "cursor-ns-resize",
  /** Help (question mark). */
  help: "cursor-help",
  /** Copy. */
  copy: "cursor-copy",
  /** None (hide). */
  none: "cursor-none",
} as const;

export type CursorType = keyof typeof CURSOR;

/* -------------------------------------------------------------------------
 * OPACITY SCALE (semantic)
 * -----------------------------------------------------------------------*/

/**
 * Semantic opacity tokens (preferred over raw `opacity-N`).
 *
 * | Token    | Class        | Use case                          |
 * |----------|--------------|-----------------------------------|
 * | invisible| opacity-0    | Transition hidden                 |
 * | faint    | opacity-10   | Watermark, very subtle decoration |
 * | subtle   | opacity-30   | Placeholder dimming               |
 * | muted    | opacity-50   | Disabled state, muted content     |
 * | soft     | opacity-60   | Hover secondary                   |
 * | strong   | opacity-80   | Slightly dimmed                   |
 * | opaque   | opacity-100  | Full visibility                   |
 */
export const OPACITY = {
  /** 0% — transition hidden. */
  invisible: "opacity-0",

  /** 10% — watermark, very subtle decoration. */
  faint: "opacity-10",

  /** 20% — subtle accent. */
  veryLight: "opacity-20",

  /** 30% — placeholder dimming. */
  subtle: "opacity-30",

  /** 40% — low emphasis. */
  low: "opacity-40",

  /** 50% — **Default disabled** state, muted content. */
  muted: "opacity-50",

  /** 60% — hover secondary, soft dim. */
  soft: "opacity-60",

  /** 70% — medium emphasis. */
  medium: "opacity-70",

  /** 80% — slightly dimmed. */
  strong: "opacity-80",

  /** 90% — nearly opaque (barely dimmed). */
  nearly: "opacity-90",

  /** 100% — full visibility. */
  opaque: "opacity-100",
} as const;

export type OpacityTier = keyof typeof OPACITY;

/* -------------------------------------------------------------------------
 * ALPHA VALUES (for Tailwind color/alpha suffix — e.g. bg-slate-900/60)
 *
 * NOTE: These are tier NAMES. Use bersama color utilities:
 *   bg-slate-900/60  → modal overlay
 *   bg-indigo-900/30 → dark mode soft bg
 *   text-slate-500/70 → muted text with transparency
 * -----------------------------------------------------------------------*/
export const ALPHA = {
  /** /5 — Extremely subtle. */
  xs: "/5",
  /** /10 — Very subtle. */
  sm: "/10",
  /** /20 — Subtle. */
  md: "/20",
  /** /30 — **Dark mode soft bg** (paired with color-900). */
  darkSoft: "/30",
  /** /40 — Dark mode border. */
  darkBorder: "/40",
  /** /50 — **Modal backdrop**, medium. */
  medium: "/50",
  /** /60 — Standard overlay. */
  overlay: "/60",
  /** /70 — Strong overlay. */
  strong: "/70",
  /** /80 — Translucent header (bg-white/80). */
  frosted: "/80",
  /** /90 — Nearly opaque. */
  nearly: "/90",
} as const;

/* -------------------------------------------------------------------------
 * BORDER WIDTH
 * -----------------------------------------------------------------------*/

export const BORDER_W = {
  /** No border. */
  none: "border-0",
  /** 1px — **Default**. */
  default: "border",
  /** 2px — Emphasized (dashed empty, active focus). */
  medium: "border-2",
  /** 4px — Heavy (stepper circle, extreme emphasis). */
  heavy: "border-4",
  /** 8px — Extra heavy (rare). */
  extraHeavy: "border-8",
} as const;

/** Per-side border helpers. */
export const BORDER_SIDE = {
  /** Top only. */
  top: "border-t",
  /** Right only. */
  right: "border-r",
  /** Bottom only. */
  bottom: "border-b",
  /** Left only. */
  left: "border-l",
  /** X axis (left + right). */
  x: "border-x",
  /** Y axis (top + bottom). */
  y: "border-y",
} as const;

/* -------------------------------------------------------------------------
 * RING WIDTH
 * -----------------------------------------------------------------------*/

export const RING_W = {
  /** No ring. */
  none: "ring-0",
  /** 1px — Subtle. */
  thin: "ring-1",
  /** 2px — **Default focus ring**. */
  default: "ring-2",
  /** 4px — Thick (stepper active). */
  thick: "ring-4",
  /** 8px — Extra thick (rare). */
  extra: "ring-8",
} as const;

/* -------------------------------------------------------------------------
 * BACKDROP (blur + overlay)
 * -----------------------------------------------------------------------*/

export const BACKDROP = {
  /** No backdrop. */
  none: "backdrop-blur-none",

  /** 4px blur — **Header frosted glass** (bg-white/80 + backdrop-blur-sm). */
  sm: "backdrop-blur-sm",

  /** 8px blur — Medium. */
  md: "backdrop-blur-md",

  /** 12px blur — Strong (modal backdrop). */
  lg: "backdrop-blur-lg",

  /** 16px blur — Very strong. */
  xl: "backdrop-blur-xl",

  /** 24px blur — Maximum (rare). */
  "2xl": "backdrop-blur-2xl",

  /* ---------- Pre-built overlay patterns ---------- */

  /**
   * Modal backdrop overlay.
   * Dark overlay + slight blur behind modal.
   */
  overlay:
    "fixed inset-0 bg-slate-900/60 backdrop-blur-sm",

  /**
   * Drawer backdrop (same as modal).
   */
  overlayDrawer:
    "fixed inset-0 bg-slate-900/60 backdrop-blur-sm",

  /**
   * Lighter overlay (for dropdown, popover anchor).
   */
  overlayLight:
    "fixed inset-0 bg-slate-900/30",

  /**
   * Frosted glass header (translucent + blur).
   */
  frostedHeader:
    "bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm",

  /**
   * Frosted glass card (rare — for layered UI).
   */
  frostedCard:
    "bg-white/70 dark:bg-slate-900/70 backdrop-blur-md",
} as const;

/* -------------------------------------------------------------------------
 * USER SELECT
 * -----------------------------------------------------------------------*/

export const USER_SELECT = {
  /** Disable text selection (UI chrome, buttons). */
  none: "select-none",
  /** Default (text, paragraphs). */
  auto: "select-auto",
  /** Allow selection (content areas). */
  text: "select-text",
  /** Select all on click (ID, code snippet). */
  all: "select-all",
} as const;

/* -------------------------------------------------------------------------
 * POINTER EVENTS
 * -----------------------------------------------------------------------*/

export const POINTER = {
  /** Ignore pointer (disabled, decorative icons inside button). */
  none: "pointer-events-none",
  /** Allow pointer (default). */
  auto: "pointer-events-auto",
} as const;

/* -------------------------------------------------------------------------
 * OVERFLOW / SCROLL
 * -----------------------------------------------------------------------*/

export const SCROLL = {
  /** Clip overflow (no scroll). */
  hidden: "overflow-hidden",
  /** Scroll vertical only. */
  y: "overflow-y-auto",
  /** Scroll horizontal only. */
  x: "overflow-x-auto",
  /** Scroll both. */
  auto: "overflow-auto",
  /** Scroll vertical + hide scrollbar (sidebar, chat). */
  ySmooth: "overflow-y-auto scrollbar-hide",
  /** Hidden vertical overflow (trunc content). */
  yHidden: "overflow-y-hidden",

  /** Scroll-snap horizontal (carousel). */
  snapX: "overflow-x-auto snap-x snap-mandatory",

  /** Hide scrollbar entirely (cosmetic). */
  hideScrollbar: "scrollbar-hide",
} as const;

/* -------------------------------------------------------------------------
 * TRANSFORM (common presets)
 * -----------------------------------------------------------------------*/

export const TRANSFORM = {
  /** No transform. */
  none: "transform-none",

  /** Press scale (button tactile feedback). */
  pressScale: "active:scale-[0.98]",

  /** Hover lift (card). */
  hoverLift: "hover:-translate-y-0.5",

  /** Hover scale up (subtle). */
  hoverScaleSm: "hover:scale-[1.02]",

  /** Hover scale (icon in button). */
  iconHoverScale: "group-hover:scale-110",

  /** Rotate chevron (accordion open). */
  chevronOpen: "rotate-180",

  /** 90 degree rotation. */
  rotate90: "rotate-90",

  /** 180 degree rotation. */
  rotate180: "rotate-180",

  /** Flip horizontal (RTL icon). */
  flipX: "scale-x-[-1]",

  /** Flip vertical. */
  flipY: "scale-y-[-1]",
} as const;

/* -------------------------------------------------------------------------
 * WHITESPACE
 * -----------------------------------------------------------------------*/

export const WHITESPACE = {
  /** Normal wrapping. */
  normal: "whitespace-normal",
  /** No wrap (table cell, badge, button). */
  nowrap: "whitespace-nowrap",
  /** Preserve whitespace + wrap. */
  preWrap: "whitespace-pre-wrap",
  /** Preserve whitespace no wrap (code block). */
  pre: "whitespace-pre",
  /** Break words (long URL). */
  breakWord: "break-words",
  /** Break all characters (code, CJK). */
  breakAll: "break-all",
  /** Truncate with ellipsis (single line). */
  truncate: "truncate",
  /** Line clamp 2 lines. */
  clamp2: "line-clamp-2",
  /** Line clamp 3 lines. */
  clamp3: "line-clamp-3",
} as const;

/* -------------------------------------------------------------------------
 * ASPECT RATIO
 * -----------------------------------------------------------------------*/

export const ASPECT = {
  /** 1:1 (avatar, product thumbnail). */
  square: "aspect-square",
  /** 16:9 (video, hero banner). */
  video: "aspect-video",
  /** 4:3 (old video, image). */
  photo: "aspect-[4/3]",
  /** 21:9 (ultrawide banner). */
  ultrawide: "aspect-[21/9]",
  /** 3:4 (portrait card). */
  portrait: "aspect-[3/4]",
  /** 2:3 (poster). */
  poster: "aspect-[2/3]",
} as const;

/* -------------------------------------------------------------------------
 * Type exports
 * -----------------------------------------------------------------------*/
export type BorderWidth = keyof typeof BORDER_W;
export type RingWidth = keyof typeof RING_W;
export type BackdropBlur = keyof typeof BACKDROP;
