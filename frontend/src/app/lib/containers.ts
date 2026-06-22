/**
 * InsightSphere Container Tokens
 * ================================
 * Single source of truth untuk card, modal, dan drawer styling.
 *
 * Design rationale, anatomy, dan migration guide:
 *   → See Design System/CARDS.md
 *   → See Design System/MODALS.md
 *   → See Design System/DRAWERS.md
 *
 * Architecture:
 *   - `CARD.*` — Card variants (base/interactive/hero/kpi) + padding tiers
 *   - `MODAL.*` — Modal anatomy (backdrop/container/header/body/footer/close/size)
 *   - `DRAWER.*` — Drawer anatomy per direction (right/bottom/left) + size
 *
 * Usage:
 *   import { CARD, MODAL, DRAWER } from "@/app/lib/containers";
 *   import { M } from "@/app/lib/motion";
 *   import { cn } from "@/app/lib/utils";
 *
 *   // Static card
 *   <div className={cn(CARD.base, CARD.padding.default)}>...</div>
 *
 *   // Interactive card
 *   <div className={cn(CARD.base, CARD.interactive, CARD.padding.default)}>...</div>
 *
 *   // Modal
 *   <div className={cn(MODAL.backdrop, M.backdropEnter)}>
 *     <div className={cn(MODAL.container, MODAL.size.md, M.modalEnter)}>
 *       <header className={MODAL.header}>...</header>
 *       <main className={MODAL.body}>...</main>
 *       <footer className={MODAL.footer}>...</footer>
 *     </div>
 *   </div>
 *
 *   // Right drawer
 *   <div className={cn(DRAWER.backdrop, M.backdropEnter)}>
 *     <aside className={cn(DRAWER.right, DRAWER.size.right.md, M.drawerEnterRight)}>
 *       ...
 *     </aside>
 *   </div>
 */

/* -------------------------------------------------------------------------
 * CARD
 * -----------------------------------------------------------------------*/
export const CARD = {
  /** Base card: container + bg + border + shadow-sm at rest. */
  base:
    "rounded-2xl bg-white dark:bg-slate-900 " +
    "border border-slate-200 dark:border-slate-800 shadow-sm",

  /** Interactive card: adds hover elevation + cursor pointer + transition. */
  interactive:
    "hover:shadow-md transition-shadow cursor-pointer",

  /** Hero card: larger radius + heavier shadow (for feature sections). */
  hero:
    "rounded-3xl bg-white dark:bg-slate-900 " +
    "border border-slate-100 dark:border-slate-800 shadow-lg",

  /** Padding tiers (pair with `base`). */
  padding: {
    /** Dense list items, sidebar cards. */
    compact: "p-4",
    /** Standard card (default). */
    default: "p-6",
    /** Feature/hero content. */
    spacious: "p-8",
  },

  /** KPI card preset (icon box top-right + large number). */
  kpi:
    "p-5 rounded-2xl bg-white dark:bg-slate-900 " +
    "border border-slate-200 dark:border-slate-800 " +
    "shadow-sm hover:shadow-md transition-shadow",

  /** Empty state card (centered, generous padding). */
  empty:
    "p-12 text-center rounded-2xl " +
    "bg-white dark:bg-slate-900 " +
    "border border-dashed border-slate-300 dark:border-slate-700",
} as const;

/* -------------------------------------------------------------------------
 * MODAL
 * -----------------------------------------------------------------------*/
export const MODAL = {
  /** Backdrop overlay (standard: slate-900/60 + blur-sm). */
  backdrop:
    "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50",

  /** Container (rounded-3xl + heavy shadow + overflow-hidden for rounded corners). */
  container:
    "relative rounded-3xl bg-white dark:bg-slate-900 " +
    "shadow-2xl overflow-hidden",

  /** Header (icon box + title + optional close). */
  header:
    "px-6 py-4 border-b border-slate-100 dark:border-slate-800 " +
    "flex items-center gap-3",

  /** Body (main content area). */
  body:
    "p-6",

  /** Scrollable body (for long forms). */
  bodyScroll:
    "p-6 max-h-[70vh] overflow-y-auto",

  /** Footer (justify-end buttons with gap). */
  footer:
    "px-6 py-4 border-t border-slate-100 dark:border-slate-800 " +
    "flex items-center justify-end gap-2",

  /** Close button (X icon, ghost style). */
  close:
    "p-2 rounded-xl " +
    "text-slate-500 dark:text-slate-400 " +
    "hover:bg-slate-100 dark:hover:bg-slate-800 " +
    "hover:text-slate-700 dark:hover:text-slate-200 " +
    "transition-colors",

  /** Size tiers (max-width). */
  size: {
    /** Confirm dialog, simple alert. */
    sm: "w-full max-w-sm",
    /** Default — simple form, info. */
    md: "w-full max-w-md",
    /** Multi-field form, data edit. */
    lg: "w-full max-w-2xl",
    /** Complex form, data table. */
    xl: "w-full max-w-4xl",
    /** Near-full screen (image viewer, rich content). */
    full: "w-full max-w-[95vw]",
  },

  /**
   * Container max-height tiers untuk modal yang mengandung body scrollable.
   * Pakai bersama MODAL.container lalu tambahkan kelas \lex flex-col\
   * agar header/body/footer ikut konvensi shrink/grow.
   */
  maxHeight: {
    /** Multi-field form (default scrollable). */
    md: "max-h-[85vh]",
    /** Form panjang / data table dalam modal. */
    lg: "max-h-[90vh]",
  },

  /**
   * Numeric counter chip yang muncul di samping tombol +/- (misal RefundModal).
   * Pisahkan dari typography agar lebar dan alignment-nya konsisten lintas modal.
   */
  counterValue:
    "min-w-[16px] text-center",

  /** Wrapper to center the modal in viewport. */
  wrapper:
    "flex items-center justify-center min-h-screen p-4",
} as const;

/* -------------------------------------------------------------------------
 * DRAWER
 * -----------------------------------------------------------------------*/
export const DRAWER = {
  /** Backdrop (same as modal backdrop). */
  backdrop:
    "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50",

  /** Right drawer (detail panel, product view). */
  right:
    "fixed right-0 inset-y-0 " +
    "bg-white dark:bg-slate-900 " +
    "shadow-2xl overflow-y-auto " +
    "border-l border-slate-100 dark:border-slate-800",

  /** Bottom drawer (mobile sheet, action sheet). */
  bottom:
    "fixed bottom-0 inset-x-0 " +
    "rounded-t-3xl bg-white dark:bg-slate-900 " +
    "shadow-2xl overflow-y-auto " +
    "border-t border-slate-100 dark:border-slate-800",

  /** Left drawer (alternative nav, category browser). */
  left:
    "fixed left-0 inset-y-0 " +
    "bg-white dark:bg-slate-900 " +
    "shadow-2xl overflow-y-auto " +
    "border-r border-slate-100 dark:border-slate-800",

  /** Grabber indicator for bottom drawer (swipe affordance). */
  grabber:
    "pt-3 pb-2 flex justify-center",

  grabberHandle:
    "w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700",

  /** Size tiers per direction. */
  size: {
    right: {
      sm: "w-full max-w-sm",
      md: "w-full max-w-md",
      lg: "w-full max-w-2xl",
      xl: "w-full max-w-4xl",
    },
    bottom: {
      sm: "max-h-[50vh]",
      md: "max-h-[70vh]",
      lg: "max-h-[85vh]",
    },
    left: {
      sm: "w-full max-w-sm",
      md: "w-full max-w-md",
      lg: "w-full max-w-2xl",
    },
  },
} as const;

/* -------------------------------------------------------------------------
 * Type exports
 * -----------------------------------------------------------------------*/
export type CardPadding = keyof typeof CARD.padding;
export type ModalSize = keyof typeof MODAL.size;
export type DrawerSizeRight = keyof typeof DRAWER.size.right;
export type DrawerSizeBottom = keyof typeof DRAWER.size.bottom;
export type DrawerSizeLeft = keyof typeof DRAWER.size.left;
