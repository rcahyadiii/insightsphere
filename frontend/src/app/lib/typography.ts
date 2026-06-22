/**
 * InsightSphere Typography Tokens
 * ================================
 * Single source of truth for all typography usage across the application.
 *
 * Design rationale, tier definitions, and migration guide:
 *   → See Design System/TYPOGRAPHY.md
 *
 * Usage:
 *   import { T } from "@/app/lib/typography";
 *   import { cn } from "@/app/lib/utils";
 *
 *   <h1 className={cn(T.h1, "text-slate-900 dark:text-slate-100")}>
 *     Dashboard
 *   </h1>
 *
 * Design principles:
 *   1. Two fonts only: Inter (body) + Fira Code via `font-data` (numeric/code).
 *   2. Three weight levels used: 400 (normal) / 600 (semibold) / 900 (black).
 *      `font-bold` (700) allowed for accent/label emphasis only.
 *   3. A11y floor: 9px minimum font size.
 *   4. Uppercase dipakai terbatas — HANYA untuk 3 context: H4 (mini-section
 *      divider), Micro (status badge/chip), Code (SKU/ID). Semua token lain
 *      pakai Title Case atau Sentence Case agar natural untuk Bahasa Indonesia.
 *      Uppercase text yang dipakai SELALU pairing dengan `tracking-widest`.
 *   5. Numeric data always uses `font-data tabular-nums` for column alignment.
 */

/* -------------------------------------------------------------------------
 * Role-based typography tokens
 * -----------------------------------------------------------------------*/
export const T = {
  /* ---------- Headings ---------- */

  /** H1 — Page title. Mixed case, compact. */
  h1: "text-2xl font-black tracking-tight",

  /** H2 — Modal / section title. Title Case, compact. */
  h2: "text-lg font-bold tracking-tight",

  /** H3 — Card / subsection header. Distinguished from body by SIZE + weight. */
  h3: "text-base font-semibold tracking-tight",

  /** H4 — Mini section label inside cards. One of the 3 uppercase tokens. */
  h4: "text-xs font-bold uppercase tracking-widest",

  /* ---------- Body ---------- */

  /** Body — Default reading text. `font-normal` to avoid weight fatigue. */
  body: "text-sm font-normal",

  /** Body-sm — Secondary / supporting text. */
  bodySm: "text-xs font-normal",

  /** Body-emphasis — Inline emphasis within body copy. */
  bodyEmphasis: "text-sm font-semibold",

  /* ---------- Labels & Captions ---------- */

  /** Label — Form field labels, table column headers. Title Case. */
  label: "text-[10px] font-bold",

  /** Caption — Meta info (timestamp, sub-label, hint text). Sentence case. */
  caption: "text-[9px] font-medium",

  /**
   * Micro — Status badges, chips. One of the 3 uppercase tokens.
   * A11y floor at 9px. Uppercase OK here because it functions as a visual
   * "signal chip", not reading text (always short, always has bg color).
   */
  micro: "text-[9px] font-bold uppercase tracking-widest",

  /* ---------- KPI / Hero numbers ---------- */

  /**
   * KPI-hero — Dashboard hero number (scannable from viewing distance).
   * Use for the main 1–4 top-level metrics on a page.
   */
  kpiHero: "text-4xl font-black font-data tabular-nums tracking-tight",

  /**
   * KPI-card — Inline summary card number (smaller than hero).
   * Use for grid of 4–8 secondary metrics.
   */
  kpiCard: "text-2xl font-black font-data tabular-nums tracking-tight",

  /* ---------- Tabular data ---------- */

  /** Data-md — Default numeric cell in tables. */
  dataMd: "text-sm font-normal font-data tabular-nums",

  /** Data-sm — Compact numeric display, inline. */
  dataSm: "text-xs font-normal font-data tabular-nums",

  /** Data-emphasis — Totals row, highlighted metric cells. */
  dataEmphasis: "text-sm font-semibold font-data tabular-nums",

  /* ---------- Code / Identifiers ---------- */

  /**
   * Code — SKU, transaction ID, version string.
   * One of the 3 uppercase tokens — follows universal code convention
   * (CF-4X6 not Cf-4x6).
   */
  code: "text-[10px] font-medium font-data uppercase tracking-tighter",

  /* ---------- Buttons ---------- */

  /** Button-lg — Primary CTAs. Title Case ("Simpan", not "SIMPAN"). */
  buttonLg: "text-sm font-bold tracking-tight",

  /** Button-sm — Secondary / inline buttons. Title Case. */
  buttonSm: "text-xs font-bold tracking-tight",
} as const;

export type TypographyToken = keyof typeof T;

/* -------------------------------------------------------------------------
 * Banned patterns reference (for lint / documentation)
 * -----------------------------------------------------------------------*/
export const BANNED_PATTERNS = [
  "text-[7px]",   // A11y violation (< 9px floor)
  "text-[8px]",   // A11y violation (< 9px floor)
  "text-[11px]",  // Duplicate of text-xs (12px) — pick one
  "text-[12px]",  // Use text-xs
  "text-[13px]",  // Use text-sm
  "font-mono",    // Use font-data (Fira Code, not Tailwind default)
  "font-extrabold", // Redundant between bold (700) and black (900)
] as const;
