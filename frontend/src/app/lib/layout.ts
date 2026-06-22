/**
 * InsightSphere Layout Constants
 * ==================================
 * Single source of truth untuk layout dimensions: header height,
 * sidebar width, content max-widths, page template tokens.
 *
 * Companion:
 *   - Design System/NAVIGATION.md   (sidebar, header anatomy)
 *   - Design System/RESPONSIVE.md   (breakpoints, containers)
 *   - Design System/PATTERNS.md     (page template structure)
 *
 * Architecture:
 *   - `LAYOUT_PX.*`      — Numeric pixel values (for JS, inline style)
 *   - `LAYOUT_CLASS.*`   — Tailwind class strings
 *   - `LAYOUT_TEMPLATE.*` — Pre-built page template class combos
 *
 * Usage:
 *   import { LAYOUT_CLASS, LAYOUT_TEMPLATE } from "@/app/lib/layout";
 *
 *   // Header with fixed height
 *   <header className={LAYOUT_CLASS.headerHeight}>...</header>
 *
 *   // Sidebar expanded/collapsed
 *   <aside className={LAYOUT_CLASS.sidebarExpanded}>...</aside>
 *
 *   // Page template (main content area with max-width + padding)
 *   <main className={LAYOUT_TEMPLATE.pageWrapper}>...</main>
 *
 * Design principles:
 *   1. Header height = **56px (h-14)** — fixed across breakpoints.
 *   2. Sidebar expanded = **240px**, collapsed = **68px** (icon only).
 *   3. Content max-width = **1440px (max-w-7xl)** at dashboard level.
 *   4. Mobile header = 56px too — NO separate mobile header height.
 */

/* -------------------------------------------------------------------------
 * NUMERIC VALUES (for JS, calculations, inline style)
 * -----------------------------------------------------------------------*/

export const LAYOUT_PX = {
  /** App header height (sticky top). */
  headerHeight: 56,

  /** Sidebar widths. */
  sidebarExpanded: 240,
  sidebarCollapsed: 68,

  /** Drawer widths (right-side detail). */
  drawerSm: 384,     // max-w-sm
  drawerMd: 448,     // max-w-md
  drawerLg: 672,     // max-w-2xl
  drawerXl: 896,     // max-w-4xl

  /** Bottom sheet heights (mobile). */
  bottomSheetSm: "50vh",
  bottomSheetMd: "70vh",
  bottomSheetLg: "85vh",

  /** Content max-widths. */
  contentAuth: 384,       // max-w-sm
  contentForm: 672,       // max-w-2xl
  contentArticle: 896,    // max-w-3xl
  contentDashboard: 1440, // max-w-7xl

  /** Modal max-widths. */
  modalSm: 448,   // max-w-md
  modalMd: 512,   // max-w-lg
  modalLg: 672,   // max-w-2xl
  modalXl: 896,   // max-w-4xl

  /** Print sizes (thermal receipt). */
  receipt80mm: "80mm",
  receipt58mm: "58mm",
} as const;

/* -------------------------------------------------------------------------
 * CLASS STRINGS
 * -----------------------------------------------------------------------*/

export const LAYOUT_CLASS = {
  /* ---------- Header ---------- */
  /** App header: 56px fixed height. */
  headerHeight: "h-14",
  /** Header sticky positioning. */
  headerSticky:
    "sticky top-0 h-14 " +
    "bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm " +
    "border-b border-slate-200 dark:border-slate-800",

  /* ---------- Sidebar ---------- */
  /** Sidebar expanded (240px). */
  sidebarExpanded: "w-[240px]",
  /** Sidebar collapsed (68px — icon only). */
  sidebarCollapsed: "w-[68px]",
  /** Sidebar container. */
  sidebarContainer:
    "h-screen bg-slate-900 border-r border-slate-800 " +
    "flex flex-col shrink-0 " +
    "transition-all duration-300 ease-in-out",

  /* ---------- Content wrappers ---------- */
  /** Auth pages (narrow). */
  contentAuth: "w-full max-w-sm mx-auto",
  /** Form pages. */
  contentForm: "w-full max-w-2xl mx-auto",
  /** Article / docs. */
  contentArticle: "w-full max-w-3xl mx-auto",
  /** Dashboard (default). */
  contentDashboard: "w-full max-w-7xl mx-auto",
  /** Full bleed (workspace, POS). */
  contentBleed: "w-full",

  /* ---------- Responsive padding ---------- */
  /** Responsive page padding (X + Y). */
  pagePadding: "px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8",
  /** X-only padding. */
  pagePaddingX: "px-4 md:px-6 lg:px-8",
  /** Y-only padding. */
  pagePaddingY: "py-4 md:py-6 lg:py-8",

  /* ---------- Main layout ---------- */
  /** Main content area (scroll, flex-1 in shell). */
  mainScroll: "flex-1 overflow-y-auto",
  /** Main with header offset (accounts for sticky header). */
  mainWithHeader: "flex-1 overflow-y-auto min-h-[calc(100vh-56px)]",

  /* ---------- App shell (dual-column) ---------- */
  /** App shell root container (sidebar + main). */
  appShell: "flex h-screen overflow-hidden",

  /* ---------- Full height ---------- */
  /** Full viewport height. */
  fullViewport: "h-screen",
  /** Full viewport minus header. */
  viewportMinusHeader: "h-[calc(100vh-56px)]",
} as const;

/* -------------------------------------------------------------------------
 * PAGE TEMPLATES (pre-built compositions)
 * -----------------------------------------------------------------------*/

export const LAYOUT_TEMPLATE = {
  /** Dashboard page wrapper (max-w-7xl + responsive padding). */
  pageWrapper:
    "w-full max-w-7xl mx-auto " +
    "px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8",

  /** Auth page wrapper (centered, narrow). */
  authPage:
    "min-h-screen flex items-center justify-center " +
    "bg-slate-50 dark:bg-slate-950 px-6",

  /** Error page wrapper (centered, no chrome). */
  errorPage:
    "min-h-screen flex items-center justify-center " +
    "bg-slate-50 dark:bg-slate-950 px-6 text-center",

  /** Form page wrapper (narrower than dashboard). */
  formPage:
    "w-full max-w-2xl mx-auto " +
    "px-4 md:px-6 py-4 md:py-6 lg:py-8",

  /** Full bleed workspace (POS, kanban). */
  workspacePage:
    "w-full h-[calc(100vh-56px)] overflow-hidden",

  /** Page stack default (vertical gap between sections). */
  pageStack: "space-y-6",

  /** Section stack (between h2 sections). */
  sectionStack: "space-y-8",
} as const;

/* -------------------------------------------------------------------------
 * DECORATIVE LAYOUT TOKENS
 * -----------------------------------------------------------------------*/

export const LAYOUT_DECORATION = {
  portalOrnament: {
    primary:
      "absolute top-0 right-0 w-[500px] h-[500px] " +
      "bg-indigo-50 rounded-full blur-[120px] opacity-50 -mr-48 -mt-48",
    secondary:
      "absolute bottom-0 left-0 w-[400px] h-[400px] " +
      "bg-slate-100 rounded-full blur-[100px] opacity-60 -ml-32 -mb-32",
  },
} as const;

/* -------------------------------------------------------------------------
 * Type exports
 * -----------------------------------------------------------------------*/
export type LayoutClass = keyof typeof LAYOUT_CLASS;
export type LayoutTemplate = keyof typeof LAYOUT_TEMPLATE;
