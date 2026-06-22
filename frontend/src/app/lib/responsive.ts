/**
 * InsightSphere Responsive System Tokens & Helpers
 * =========================================================
 * Breakpoint tokens + useBreakpoint hook + device detection helpers.
 *
 * Design rationale, full device matrix, print patterns:
 *   → See Design System/RESPONSIVE.md
 *
 * Architecture:
 *   - `BREAKPOINTS.*` — breakpoint tokens in px (matches Tailwind defaults)
 *   - `MEDIA.*`       — media query strings (for inline CSS-in-JS or matchMedia)
 *   - `useBreakpoint()` — React hook: detect if viewport >= breakpoint
 *   - `useMediaQuery()` — React hook: match custom media query
 *   - `useIsTouch()`    — React hook: detect touch-primary device
 *   - `CONTAINER.*`    — max-width presets per container type
 *   - `PRINT.*`        — print stylesheet utility classes
 *
 * Usage:
 *   import { useBreakpoint, BREAKPOINTS, CONTAINER } from "@/app/lib/responsive";
 *
 *   // Hook — reactive to viewport changes
 *   const isDesktop = useBreakpoint("lg");
 *   const isMobile = !useBreakpoint("md");
 *
 *   // Token — access numeric values
 *   if (window.innerWidth >= BREAKPOINTS.md) { ... }
 *
 *   // Container max-width
 *   <div className={CONTAINER.dashboard}>...</div>
 */

import { useSyncExternalStore } from "react";

/* -------------------------------------------------------------------------
 * Breakpoint tokens (aligned with Tailwind defaults)
 * -----------------------------------------------------------------------*/

/** Breakpoint min-width values in pixels. */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/** Media query strings for min-width breakpoints. */
export const MEDIA = {
  sm: `(min-width: ${BREAKPOINTS.sm}px)`,
  md: `(min-width: ${BREAKPOINTS.md}px)`,
  lg: `(min-width: ${BREAKPOINTS.lg}px)`,
  xl: `(min-width: ${BREAKPOINTS.xl}px)`,
  "2xl": `(min-width: ${BREAKPOINTS["2xl"]}px)`,

  /** Touch-primary device (no hover, coarse pointer). */
  touch: "(hover: none) and (pointer: coarse)",

  /** Mouse-primary device (hover, fine pointer). */
  mouse: "(hover: hover) and (pointer: fine)",

  /** Print mode. */
  print: "print",

  /** Reduced motion preference. */
  reducedMotion: "(prefers-reduced-motion: reduce)",

  /** Dark mode preference. */
  darkMode: "(prefers-color-scheme: dark)",

  /** Portrait orientation. */
  portrait: "(orientation: portrait)",

  /** Landscape orientation. */
  landscape: "(orientation: landscape)",
} as const;

/* -------------------------------------------------------------------------
 * Container max-width presets
 * -----------------------------------------------------------------------*/

/**
 * Max-width class strings per container type.
 * See RESPONSIVE.md §6.1.
 */
export const CONTAINER = {
  /** Auth pages (login, signup, forgot-password). */
  auth: "max-w-sm mx-auto",

  /** Form pages (settings, profile edit). */
  form: "max-w-2xl mx-auto",

  /** Dashboard, list pages. */
  dashboard: "max-w-7xl mx-auto",

  /** Full-bleed (charts, workspace, POS kasir). */
  bleed: "w-full",

  /** Narrow article (docs, policy). */
  article: "max-w-3xl mx-auto",

  /** Responsive side padding (aligned with RESPONSIVE.md §6.2). */
  padX: "px-4 md:px-6 lg:px-8",

  /** Responsive vertical padding. */
  padY: "py-4 md:py-6 lg:py-8",

  /** Both X + Y. */
  pad: "px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8",
} as const;

/* -------------------------------------------------------------------------
 * Print utility class strings
 * -----------------------------------------------------------------------*/

/**
 * Common print stylesheet class helpers.
 * See RESPONSIVE.md §8.
 */
export const PRINT = {
  /** Hide on print (show only on screen). */
  hideOnPrint: "print:hidden",

  /** Show only on print. */
  showOnPrint: "hidden print:block",

  /** Thermal receipt width (80mm thermal printer). */
  receipt:
    "hidden print:block w-[80mm] font-data text-[10pt] leading-tight text-black bg-white",

  /** A4/Letter report container. */
  report: "hidden print:block print:text-xs print:break-inside-avoid",

  /** Avoid page break inside element. */
  avoidBreak: "print:break-inside-avoid",

  /** Force page break before element. */
  breakBefore: "print:break-before-page",
} as const;

/* -------------------------------------------------------------------------
 * React hooks
 * -----------------------------------------------------------------------*/

/**
 * Detect if viewport is AT LEAST the given breakpoint width.
 * Returns `false` on SSR (safe default).
 *
 * @example
 *   const isDesktop = useBreakpoint("lg");
 *   {isDesktop ? <Sidebar /> : <MobileHamburger />}
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  return useMediaQuery(MEDIA[breakpoint]);
}

/**
 * Match arbitrary media query string.
 * Returns `false` on SSR.
 *
 * @example
 *   const prefersReducedMotion = useMediaQuery(MEDIA.reducedMotion);
 *   const isLandscape = useMediaQuery(MEDIA.landscape);
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};

      const mql = window.matchMedia(query);
      const handler = () => onStoreChange();

      // Modern browsers
      if (mql.addEventListener) {
        mql.addEventListener("change", handler);
        return () => mql.removeEventListener("change", handler);
      }
      // Legacy fallback (Safari < 14)
      mql.addListener(handler);
      return () => mql.removeListener(handler);
    },
    () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false),
    () => false
  );
}

/**
 * Detect if user is on a touch-primary device (mobile/tablet).
 * Pair with `useBreakpoint` for finer control.
 *
 * @example
 *   const isTouch = useIsTouch();
 *   {isTouch ? <Drawer>...</Drawer> : <Popover>...</Popover>}
 */
export function useIsTouch(): boolean {
  return useMediaQuery(MEDIA.touch);
}

/**
 * Detect if user prefers reduced motion.
 * Paired with global CSS override in theme.css.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery(MEDIA.reducedMotion);
}

/**
 * Get current active breakpoint name.
 * Useful for debugging or conditional rendering.
 *
 * @example
 *   const bp = useActiveBreakpoint();  // "md" | "lg" | ...
 */
export function useActiveBreakpoint(): Breakpoint | "base" {
  const isSm = useBreakpoint("sm");
  const isMd = useBreakpoint("md");
  const isLg = useBreakpoint("lg");
  const isXl = useBreakpoint("xl");
  const is2xl = useBreakpoint("2xl");

  if (is2xl) return "2xl";
  if (isXl) return "xl";
  if (isLg) return "lg";
  if (isMd) return "md";
  if (isSm) return "sm";
  return "base";
}

/* -------------------------------------------------------------------------
 * Server-safe helpers (for use outside React)
 * -----------------------------------------------------------------------*/

/**
 * Check if window width is >= breakpoint (client-only).
 * Returns `false` on SSR.
 */
export function isBreakpoint(breakpoint: Breakpoint): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth >= BREAKPOINTS[breakpoint];
}

/**
 * Get current numeric viewport width (client-only).
 * Returns 0 on SSR.
 */
export function getViewportWidth(): number {
  if (typeof window === "undefined") return 0;
  return window.innerWidth;
}

/* -------------------------------------------------------------------------
 * Responsive recipe constants (reusable class patterns)
 * -----------------------------------------------------------------------*/

/**
 * Common responsive patterns — ready-to-use class strings.
 * See RESPONSIVE.md §7.1 for rationale.
 */
export const RECIPE = {
  /** 4-column KPI row — responsive. */
  kpiRow: "grid grid-cols-2 md:grid-cols-4 gap-4",

  /** 3-column card grid — responsive. */
  cardGrid3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",

  /** 2-column form. */
  formGrid2: "grid grid-cols-1 md:grid-cols-2 gap-4",

  /** Asymmetric dashboard: 2/3 + 1/3. */
  dashboardSplit: "grid grid-cols-1 lg:grid-cols-3 gap-6",
  dashboardMain: "lg:col-span-2",
  dashboardAside: "",

  /** Auto-fit gallery. */
  galleryAutoFit:
    "grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4",

  /** Typography scale — page h1. */
  h1: "text-xl md:text-2xl lg:text-3xl font-black tracking-tight",

  /** Typography scale — section h2. */
  h2: "text-lg md:text-xl font-bold",

  /** Body text responsive. */
  body: "text-sm md:text-base",

  /** KPI number scale. */
  kpiNumber: "text-2xl md:text-3xl lg:text-4xl font-black",
} as const;
