/**
 * InsightSphere Formatting Helpers
 * ====================================
 * Single source of truth untuk locale-specific formatting:
 * Rupiah currency, number, date, time, file size, duration.
 *
 * Companion:
 *   - Design System/I18N.md         (locale-specific rules)
 *   - Design System/CONTENT.md      (display rules)
 *   - Design System/TERMINOLOGY.md  (ID/EN vocabulary)
 *
 * Usage:
 *   import { formatRupiah, formatDate, formatRelative } from "@/app/lib/format";
 *
 *   formatRupiah(1500000)              // "Rp 1.500.000"
 *   formatRupiah(1500000, { compact: true })  // "Rp 1,5 jt"
 *   formatDate(new Date())             // "23 April 2026"
 *   formatDate(new Date(), "short")    // "23 Apr 2026"
 *   formatRelative(new Date())         // "baru saja"
 *
 * Design principles:
 *   1. Centralized — replace 111 hardcoded `"Rp "` + 63 `toLocaleString` scattered.
 *   2. ID primary — default locale `id-ID`, EN via opt-in.
 *   3. ICU-compliant via `Intl.NumberFormat` + `Intl.DateTimeFormat`.
 *   4. Compact mode (Indonesian: rb/jt/M; English: K/M/B).
 */

/* -------------------------------------------------------------------------
 * CONFIG
 * -----------------------------------------------------------------------*/

export type FormatLocale = "id-ID" | "en-US";

/** Default app locale. */
export const DEFAULT_LOCALE: FormatLocale = "id-ID";

/** Indonesian compact labels (rb/jt/M). */
const ID_COMPACT_LABELS = {
  thousand: "rb", // ribu
  million: "jt",  // juta
  billion: "M",   // milyar (careful: M in EN = million, NOT same!)
  trillion: "T",  // triliun
} as const;

/* -------------------------------------------------------------------------
 * RUPIAH (IDR)
 * -----------------------------------------------------------------------*/

export interface FormatRupiahOptions {
  /** Compact notation (1,5 jt). Default: false. */
  compact?: boolean;
  /** Number of decimal places. Default: 0. */
  decimals?: number;
  /** Force sign (+/-) even for positive. Default: false. */
  signed?: boolean;
  /** Hide "Rp " prefix (return only the number). Default: false. */
  noPrefix?: boolean;
}

/**
 * Format number as Indonesian Rupiah.
 *
 * @example
 *   formatRupiah(1500000)                      // "Rp 1.500.000"
 *   formatRupiah(1500000, { compact: true })   // "Rp 1,5 jt"
 *   formatRupiah(-50000)                        // "-Rp 50.000"
 *   formatRupiah(100000, { signed: true })      // "+Rp 100.000"
 *   formatRupiah(1500, { compact: true })       // "Rp 1,5 rb"
 *   formatRupiah(1500000000, { compact: true }) // "Rp 1,5 M"
 */
export function formatRupiah(
  amount: number,
  opts: FormatRupiahOptions = {},
): string {
  if (!Number.isFinite(amount)) return opts.noPrefix ? "-" : "Rp -";

  const { compact = false, decimals = 0, signed = false, noPrefix = false } = opts;

  if (compact) {
    return formatRupiahCompact(amount, { signed, noPrefix });
  }

  const formatter = new Intl.NumberFormat("id-ID", {
    style: "decimal",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const abs = Math.abs(amount);
  const formatted = formatter.format(abs);
  const sign = amount < 0 ? "-" : signed ? "+" : "";
  const prefix = noPrefix ? "" : "Rp ";

  return `${sign}${prefix}${formatted}`;
}

/**
 * Compact Rupiah (Indonesian abbreviation).
 *
 * Thresholds:
 *   < 1.000        → "Rp 999"
 *   1.000 – 999.999  → "Rp 1,5 rb"
 *   1.000.000 – 999.999.999 → "Rp 1,5 jt"
 *   1.000.000.000+  → "Rp 1,5 M"
 *   1.000.000.000.000+ → "Rp 1,5 T"
 */
function formatRupiahCompact(
  amount: number,
  opts: { signed?: boolean; noPrefix?: boolean } = {},
): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : opts.signed ? "+" : "";
  const prefix = opts.noPrefix ? "" : "Rp ";

  let value: number;
  let label = "";

  if (abs >= 1_000_000_000_000) {
    value = abs / 1_000_000_000_000;
    label = ` ${ID_COMPACT_LABELS.trillion}`;
  } else if (abs >= 1_000_000_000) {
    value = abs / 1_000_000_000;
    label = ` ${ID_COMPACT_LABELS.billion}`;
  } else if (abs >= 1_000_000) {
    value = abs / 1_000_000;
    label = ` ${ID_COMPACT_LABELS.million}`;
  } else if (abs >= 1_000) {
    value = abs / 1_000;
    label = ` ${ID_COMPACT_LABELS.thousand}`;
  } else {
    value = abs;
  }

  // Format with Indonesian comma decimal
  const formatted = label
    ? value.toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      })
    : value.toLocaleString("id-ID");

  return `${sign}${prefix}${formatted}${label}`;
}

/* -------------------------------------------------------------------------
 * NUMBER
 * -----------------------------------------------------------------------*/

export interface FormatNumberOptions {
  /** Decimal places. Default: 0. */
  decimals?: number;
  /** Compact notation. Default: false. */
  compact?: boolean;
  /** Force sign. Default: false. */
  signed?: boolean;
  /** Locale override. */
  locale?: FormatLocale;
}

/**
 * Format plain number with locale-appropriate separators.
 *
 *   formatNumber(1500)            → "1.500"      (id)
 *   formatNumber(1500, {...,locale:"en-US"}) → "1,500"  (en)
 *   formatNumber(1500.5, { decimals: 1 })    → "1.500,5"
 *   formatNumber(1500, { compact: true })    → "1,5 rb"
 */
export function formatNumber(
  value: number,
  opts: FormatNumberOptions = {},
): string {
  if (!Number.isFinite(value)) return "-";

  const { decimals = 0, compact = false, signed = false, locale = DEFAULT_LOCALE } = opts;

  if (compact) {
    return formatCompact(value, { signed, locale });
  }

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : signed && value > 0 ? "+" : "";
  return `${sign}${formatter.format(abs)}`;
}

/**
 * Compact number notation (locale-aware).
 *
 *   formatCompact(1500)          → "1,5 rb"   (id)
 *   formatCompact(1500, {locale:"en-US"}) → "1.5K"  (en)
 */
export function formatCompact(
  value: number,
  opts: { signed?: boolean; locale?: FormatLocale } = {},
): string {
  if (!Number.isFinite(value)) return "-";
  const { signed = false, locale = DEFAULT_LOCALE } = opts;
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : signed && value > 0 ? "+" : "";

  if (locale === "id-ID") {
    if (abs >= 1_000_000_000_000) return `${sign}${round(abs / 1e12, 1).toLocaleString("id-ID")} ${ID_COMPACT_LABELS.trillion}`;
    if (abs >= 1_000_000_000) return `${sign}${round(abs / 1e9, 1).toLocaleString("id-ID")} ${ID_COMPACT_LABELS.billion}`;
    if (abs >= 1_000_000) return `${sign}${round(abs / 1e6, 1).toLocaleString("id-ID")} ${ID_COMPACT_LABELS.million}`;
    if (abs >= 1_000) return `${sign}${round(abs / 1e3, 1).toLocaleString("id-ID")} ${ID_COMPACT_LABELS.thousand}`;
    return `${sign}${abs.toLocaleString("id-ID")}`;
  }

  // English compact
  const nf = new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  });
  return `${sign}${nf.format(abs)}`;
}

function round(v: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
}

/* -------------------------------------------------------------------------
 * PERCENT
 * -----------------------------------------------------------------------*/

/**
 * Format as percent (0–1 input OR 0–100 input — autodetect).
 *
 *   formatPercent(0.85)              → "85%"
 *   formatPercent(85)                → "85%"
 *   formatPercent(0.125, { decimals: 1 }) → "12,5%"
 *   formatPercent(-0.05, { signed: true }) → "-5%"
 */
export function formatPercent(
  value: number,
  opts: { decimals?: number; signed?: boolean; locale?: FormatLocale } = {},
): string {
  if (!Number.isFinite(value)) return "-";

  const { decimals = 0, signed = false, locale = DEFAULT_LOCALE } = opts;

  // If input is small (< 2), treat as 0–1 fraction. Else treat as already-percent.
  const percent = Math.abs(value) <= 2 ? value * 100 : value;
  const abs = Math.abs(percent);
  const sign = percent < 0 ? "-" : signed && percent > 0 ? "+" : "";

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${sign}${formatter.format(abs)}%`;
}

/* -------------------------------------------------------------------------
 * DATE & TIME
 * -----------------------------------------------------------------------*/

export type DateStyle = "full" | "long" | "short" | "compact" | "time" | "datetime";

/**
 * Format date with locale-aware styles.
 *
 *   formatDate(new Date())              → "23 April 2026"     (long default)
 *   formatDate(new Date(), "full")      → "Kamis, 23 April 2026"
 *   formatDate(new Date(), "short")     → "23 Apr 2026"
 *   formatDate(new Date(), "compact")   → "23/04/26"
 *   formatDate(new Date(), "time")      → "13:45"
 *   formatDate(new Date(), "datetime")  → "23 April 2026, 13:45"
 */
export function formatDate(
  date: Date | string | number,
  style: DateStyle = "long",
  locale: FormatLocale = DEFAULT_LOCALE,
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "-";

  const options: Intl.DateTimeFormatOptions = {
    full: {
      weekday: "long" as const,
      day: "numeric" as const,
      month: "long" as const,
      year: "numeric" as const,
    },
    long: {
      day: "numeric" as const,
      month: "long" as const,
      year: "numeric" as const,
    },
    short: {
      day: "numeric" as const,
      month: "short" as const,
      year: "numeric" as const,
    },
    compact: {
      day: "2-digit" as const,
      month: "2-digit" as const,
      year: "2-digit" as const,
    },
    time: {
      hour: "2-digit" as const,
      minute: "2-digit" as const,
      hour12: locale === "en-US",
    },
    datetime: {
      day: "numeric" as const,
      month: "long" as const,
      year: "numeric" as const,
      hour: "2-digit" as const,
      minute: "2-digit" as const,
      hour12: locale === "en-US",
    },
  }[style];

  return new Intl.DateTimeFormat(locale, options).format(d);
}

/* -------------------------------------------------------------------------
 * RELATIVE TIME
 * -----------------------------------------------------------------------*/

/**
 * Format date as relative time (Indonesian-first).
 *
 *   formatRelative(new Date(Date.now() - 30 * 1000))  → "baru saja"
 *   formatRelative(new Date(Date.now() - 5 * 60 * 1000))  → "5 menit lalu"
 *   formatRelative(new Date(Date.now() - 2 * 3600 * 1000)) → "2 jam lalu"
 *   formatRelative(yesterday)  → "kemarin"
 *   formatRelative(old)  → "23 April 2026"  (fallback absolute)
 */
export function formatRelative(
  date: Date | string | number,
  locale: FormatLocale = DEFAULT_LOCALE,
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "-";

  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (locale === "id-ID") {
    if (diffSec < 60) return "baru saja";
    if (diffMin < 60) return `${diffMin} menit lalu`;
    if (diffHour < 24) return `${diffHour} jam lalu`;
    if (diffDay === 1) return "kemarin";
    if (diffDay < 7) return `${diffDay} hari lalu`;
    if (diffDay < 14) return "minggu lalu";
    if (diffDay < 28) return `${Math.floor(diffDay / 7)} minggu lalu`;
    if (diffDay < 60) return "bulan lalu";
    // Fallback to absolute
    return formatDate(d, "long", locale);
  }

  // English
  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hr ago`;
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  if (diffDay < 14) return "last week";
  if (diffDay < 28) return `${Math.floor(diffDay / 7)} weeks ago`;
  if (diffDay < 60) return "last month";
  return formatDate(d, "long", locale);
}

/* -------------------------------------------------------------------------
 * DURATION
 * -----------------------------------------------------------------------*/

/**
 * Format seconds as duration.
 *
 *   formatDuration(45)    → "45 detik"
 *   formatDuration(125)   → "2 menit 5 detik"
 *   formatDuration(3700)  → "1 jam 1 menit"
 *   formatDuration(90000) → "1 hari 1 jam"
 */
export function formatDuration(
  seconds: number,
  locale: FormatLocale = DEFAULT_LOCALE,
): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "-";

  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (locale === "id-ID") {
    if (d) parts.push(`${d} hari`);
    if (h) parts.push(`${h} jam`);
    if (m) parts.push(`${m} menit`);
    if (s && !d && !h) parts.push(`${s} detik`);
    return parts.length ? parts.slice(0, 2).join(" ") : "0 detik";
  }

  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s && !d && !h) parts.push(`${s}s`);
  return parts.length ? parts.slice(0, 2).join(" ") : "0s";
}

/* -------------------------------------------------------------------------
 * FILE SIZE
 * -----------------------------------------------------------------------*/

/**
 * Format bytes as human-readable file size.
 *
 *   formatFileSize(1024)       → "1 KB"
 *   formatFileSize(1536000)    → "1,5 MB"
 *   formatFileSize(2147483648) → "2 GB"
 */
export function formatFileSize(
  bytes: number,
  locale: FormatLocale = DEFAULT_LOCALE,
): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "-";
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes / 1024;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${formatNumber(size, { decimals: 1, locale })} ${units[i]}`;
}

/* -------------------------------------------------------------------------
 * PHONE (Indonesian)
 * -----------------------------------------------------------------------*/

/**
 * Format Indonesian phone number with spacing.
 *
 *   formatPhoneID("081234567890")    → "0812-3456-7890"
 *   formatPhoneID("+6281234567890")  → "+62 812-3456-7890"
 */
export function formatPhoneID(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.startsWith("62")) {
    const rest = clean.slice(2);
    return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`.trim();
  }
  if (clean.startsWith("0")) {
    return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8)}`.trim();
  }
  return phone;
}

/* -------------------------------------------------------------------------
 * TRUNCATION / ELLIPSIS
 * -----------------------------------------------------------------------*/

/**
 * Truncate string with ellipsis at character limit.
 *
 *   truncate("Hello world", 5)    → "Hello…"
 *   truncate("Short", 10)         → "Short"
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return `${str.slice(0, maxLen)}…`;
}

/* -------------------------------------------------------------------------
 * SKU / ID mask
 * -----------------------------------------------------------------------*/

/**
 * Mask sensitive ID (credit card, phone, email) showing only last N chars.
 *
 *   maskId("1234567890", 4) → "••••••7890"
 *   maskEmail("faiz@mail.com") → "f***@mail.com"
 */
export function maskId(id: string, visibleLast = 4): string {
  if (id.length <= visibleLast) return id;
  return `${"•".repeat(id.length - visibleLast)}${id.slice(-visibleLast)}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 1) return `${local}***@${domain}`;
  return `${local[0]}***@${domain}`;
}
