/**
 * InsightSphere Color Tokens
 * ===========================
 * Single source of truth for semantic color usage across the application.
 *
 * Design rationale, palette policy, dark mode rules, and migration guide:
 *   → See Design System/COLORS.md
 *
 * Usage:
 *   import { C } from "@/app/lib/colors";
 *   import { cn } from "@/app/lib/utils";
 *
 *   // Soft badge
 *   <span className={cn(C.success.bg, C.success.text, C.success.border, "px-2 py-1 rounded-xl")}>
 *     Berhasil
 *   </span>
 *
 *   // Solid button
 *   <button className={cn(C.primary.solid, C.primary.solidText, "px-4 py-2 rounded-xl")}>
 *     Simpan
 *   </button>
 *
 *   // Role avatar
 *   <div className={cn(C.roleOwner.avatar, "w-10 h-10 rounded-xl border")}>
 *
 * Design principles:
 *   1. **5 core semantic families** — neutral (slate), primary (indigo),
 *      success (emerald), warning (amber), destructive (rose).
 *   2. **2 extended semantic families** (specific-purpose only):
 *      - `blue` → info (distinct dari primary indigo untuk clarity)
 *      - `violet` → ai/predictive (AI forecasting, XAI features)
 *   3. **1 role accent exception:** `teal` ONLY untuk inventory_manager role.
 *   4. Total palette: **8 families** (5 core + 2 extended + 1 role).
 *   5. Every token pair includes dark mode variant automatically.
 *   6. Dark mode pairing rule:
 *        light `{color}-50`  ↔ dark `{color}-900/30`
 *        light `{color}-100` ↔ dark `{color}-900/40`
 *        light `{color}-200` ↔ dark `{color}-800/50`
 *        light `{color}-600` ↔ dark `{color}-400`
 *        light `{color}-700` ↔ dark `{color}-400`
 *   7. Banned: `red` `orange` `yellow` `lime` `green` `cyan` `sky`
 *      `purple` `fuchsia` `pink`. Map to the 8 allowed families.
 */

/* -------------------------------------------------------------------------
 * Semantic color tokens — each semantic has 6 sub-variants
 * -----------------------------------------------------------------------*/
export const C = {
  /* ---------- PRIMARY (indigo) ----------
   * Use for: main CTA, brand accent, AI-related features, owner role.
   */
  primary: {
    /** Soft surface background (for subtle cards/badges). */
    bg: "bg-indigo-50 dark:bg-indigo-900/30",
    /** Text on soft bg or as colored body text. */
    text: "text-indigo-700 dark:text-indigo-400",
    /** Border on soft bg. */
    border: "border-indigo-200 dark:border-indigo-800/50",
    /** Solid button/surface. */
    solid: "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500",
    /** Text on solid surface. */
    solidText: "text-white",
    /** Icon accent color. */
    icon: "text-indigo-500 dark:text-indigo-400",
    /** Focus ring. */
    ring: "ring-indigo-400 dark:ring-indigo-500",
  },

  /* ---------- SUCCESS (emerald) ----------
   * Use for: positive feedback, revenue, growth, confirmed, cashier role.
   */
  success: {
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800/50",
    solid: "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500",
    solidText: "text-white",
    icon: "text-emerald-500 dark:text-emerald-400",
    ring: "ring-emerald-400 dark:ring-emerald-500",
  },

  /* ---------- WARNING (amber) ----------
   * Use for: low stock, pending, attention needed, in-transit, waiting.
   */
  warning: {
    bg: "bg-amber-50 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800/50",
    solid: "bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400",
    solidText: "text-white",
    icon: "text-amber-500 dark:text-amber-400",
    ring: "ring-amber-400 dark:ring-amber-500",
  },

  /* ---------- DESTRUCTIVE (rose) ----------
   * Use for: errors, delete actions, critical alerts, decline.
   */
  destructive: {
    bg: "bg-rose-50 dark:bg-rose-900/30",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800/50",
    solid: "bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500",
    solidText: "text-white",
    icon: "text-rose-500 dark:text-rose-400",
    ring: "ring-rose-400 dark:ring-rose-500",
  },

  /* ---------- NEUTRAL (slate) ----------
   * Use for: chrome, borders, disabled, neutral badges, administrative actions.
   */
  neutral: {
    bg: "bg-slate-50 dark:bg-slate-800/50",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
    solid: "bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700",
    solidText: "text-white",
    icon: "text-slate-500 dark:text-slate-400",
    ring: "ring-slate-400 dark:ring-slate-500",
  },

  /* ---------- INFO (blue) ---------- EXTENDED
   * Use for: informational banners, neutral notifications, "did you know" hints.
   * Distinct dari primary (indigo) untuk clarity — info is passive, primary is action.
   */
  info: {
    bg: "bg-blue-50 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800/50",
    solid: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500",
    solidText: "text-white",
    icon: "text-blue-500 dark:text-blue-400",
    ring: "ring-blue-400 dark:ring-blue-500",
  },

  /* ---------- AI (violet) ---------- EXTENDED
   * Use for: AI forecasting UI, XAI explanations, ML-generated content,
   * predictive insights. Distinct branding untuk AI-driven features.
   */
  ai: {
    bg: "bg-violet-50 dark:bg-violet-900/30",
    text: "text-violet-700 dark:text-violet-400",
    border: "border-violet-200 dark:border-violet-800/50",
    solid: "bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500",
    solidText: "text-white",
    icon: "text-violet-500 dark:text-violet-400",
    ring: "ring-violet-400 dark:ring-violet-500",
  },

  /* ---------- INVENTORY (teal) ---------- EXTENDED
   * Role accent — reserved for `inventory_manager` role only.
   * Don't use for general UI; use `primary`/`success`/etc instead.
   */
  inventoryAccent: {
    bg: "bg-teal-50 dark:bg-teal-900/30",
    text: "text-teal-700 dark:text-teal-400",
    border: "border-teal-200 dark:border-teal-800/50",
    solid: "bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500",
    solidText: "text-white",
    icon: "text-teal-500 dark:text-teal-400",
    ring: "ring-teal-400 dark:ring-teal-500",
  },

  /* -----------------------------------------------------------------------
   * Role tokens — formal color mapping for the 4 user roles.
   * Palette enforces: owner=indigo, admin=slate, cashier=emerald, inv_mgr=teal.
   * `teal` is the 5th color allowed ONLY for inventory_manager role badges.
   * ---------------------------------------------------------------------*/

  /** Role: Owner — indigo. */
  roleOwner: {
    avatar: "bg-indigo-600 border-indigo-500 text-white",
    badge: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50",
    solid: "bg-indigo-600 hover:bg-indigo-700",
  },

  /** Role: Admin — slate (charcoal). Authority & professionalism, distinct from destructive/error rose. */
  roleAdmin: {
    avatar: "bg-slate-700 border-slate-600 text-white",
    badge: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    solid: "bg-slate-700 hover:bg-slate-800",
  },

  /** Role: Cashier — emerald. */
  roleCashier: {
    avatar: "bg-emerald-600 border-emerald-500 text-white",
    badge: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50",
    solid: "bg-emerald-600 hover:bg-emerald-700",
  },

  /**
   * Role: Inventory Manager — teal.
   * This is the ONLY place in the codebase where `teal` is allowed.
   */
  roleInventory: {
    avatar: "bg-teal-600 border-teal-500 text-white",
    badge: "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800/50",
    solid: "bg-teal-600 hover:bg-teal-700",
  },
} as const;

export type ColorToken = keyof typeof C;

/* -------------------------------------------------------------------------
 * Banned color families reference (for lint / code review)
 * -----------------------------------------------------------------------*/
export const BANNED_COLOR_FAMILIES = [
  "red",     // use `rose` (destructive)
  "orange",  // use `amber` (warning)
  "yellow",  // use `amber`
  "lime",    // use `emerald` (success)
  "green",   // use `emerald`
  "cyan",    // use `blue` (info) or `teal` (inventory)
  "sky",     // use `blue` (info) or `indigo` (primary)
  "purple",  // use `violet` (ai)
  "fuchsia", // use `rose` (destructive)
  "pink",    // use `rose`
] as const;

/* -------------------------------------------------------------------------
 * Allowed color families (for lint rules to whitelist)
 * -----------------------------------------------------------------------*/
export const ALLOWED_COLOR_FAMILIES = [
  "slate",   // neutral chrome
  "indigo",  // primary CTA + owner role
  "emerald", // success + cashier role
  "amber",   // warning
  "rose",    // destructive (errors, delete, critical alerts)
  "blue",    // info (extended)
  "violet",  // ai/predictive (extended)
  "teal",    // inventory_manager role (extended)
] as const;

/* -------------------------------------------------------------------------
 * Dark mode pairing helper (for docs/lint)
 * Maps a light-shade to its canonical dark-mode counterpart.
 * -----------------------------------------------------------------------*/
export const DARK_MODE_PAIRING = {
  "50": "900/30",
  "100": "900/40",
  "200": "800/50",
  "300": "700",
  "400": "500",
  "500": "500",
  "600": "400",
  "700": "400",
  "800": "300",
  "900": "200",
} as const;
