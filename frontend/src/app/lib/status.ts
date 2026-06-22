/**
 * InsightSphere Status & Role Mapping Tokens
 * ==============================================
 * Single source of truth untuk mapping dari status/role code ke UI variant
 * (label, color, icon semantic). Used by Badge, StatusIndicator, RoleChip, dll.
 *
 * Companion:
 *   - Design System/TERMINOLOGY.md (canonical role + status labels)
 *   - Design System/BADGES.md      (badge variant mapping)
 *   - Design System/CONTENT.md     (label tone)
 *
 * Architecture:
 *   - `TXN_STATUS.*`      — Transaction status → variant + label
 *   - `PRODUCT_STATUS.*`  — Product status
 *   - `STOCK_STATUS.*`    — Stock level status
 *   - `USER_STATUS.*`     — User status (active/invited/suspended)
 *   - `SHIFT_STATUS.*`    — Shift open/closed/reconciling
 *   - `SYNC_STATUS.*`     — Offline POS sync status
 *   - `ROLE.*`            — Role code → label + color + avatar + badge
 *   - `PRIORITY.*`        — Task priority (high/medium/low)
 *
 * Usage:
 *   import { TXN_STATUS, ROLE } from "@/app/lib/status";
 *
 *   const info = TXN_STATUS.completed;
 *   // { label: "Selesai", variant: "success", icon: "CheckCircle" }
 *
 *   <Badge variant={info.variant}>{info.label}</Badge>
 *
 *   const role = ROLE.owner;
 *   // { labelId: "Pemilik", labelEn: "Owner", colorFamily: "indigo", badge: "...", avatar: "..." }
 *
 * Design principles:
 *   1. Codes match backend (English, snake_case).
 *   2. Labels dual-language (ID primary, EN secondary).
 *   3. Variant mapping aligns with BADGES.md §3 semantic variants.
 *   4. Icons referenced by Lucide name (string) — component consumer resolves.
 */

/* -------------------------------------------------------------------------
 * SHARED TYPES
 * -----------------------------------------------------------------------*/

export type BadgeVariant =
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "primary"
  | "neutral"
  | "ai"
  | "inventory";

export type ColorFamily =
  | "indigo"
  | "emerald"
  | "amber"
  | "rose"
  | "slate"
  | "blue"
  | "violet"
  | "teal";

export interface StatusInfo {
  /** Backend code. */
  code: string;
  /** Indonesian label. */
  labelId: string;
  /** English label. */
  labelEn: string;
  /** Badge variant name. */
  variant: BadgeVariant;
  /** Lucide icon name. */
  icon: string;
  /** Color family (for non-badge contexts). */
  colorFamily: ColorFamily;
}

export interface RoleInfo {
  /** Backend code. */
  code: string;
  /** Indonesian label. */
  labelId: string;
  /** English label. */
  labelEn: string;
  /** Compact label (for mobile, sidebar collapsed). */
  labelCompact: string;
  /** Badge variant. */
  badgeVariant: BadgeVariant;
  /** Color family. */
  colorFamily: ColorFamily;
}

/* -------------------------------------------------------------------------
 * TRANSACTION STATUS
 * -----------------------------------------------------------------------*/

export const TXN_STATUS = {
  pending: {
    code: "pending",
    labelId: "Menunggu",
    labelEn: "Pending",
    variant: "warning",
    icon: "Clock",
    colorFamily: "amber",
  },
  processing: {
    code: "processing",
    labelId: "Diproses",
    labelEn: "Processing",
    variant: "info",
    icon: "Loader",
    colorFamily: "blue",
  },
  completed: {
    code: "completed",
    labelId: "Selesai",
    labelEn: "Completed",
    variant: "success",
    icon: "CheckCircle2",
    colorFamily: "emerald",
  },
  cancelled: {
    code: "cancelled",
    labelId: "Dibatalkan",
    labelEn: "Cancelled",
    variant: "neutral",
    icon: "XCircle",
    colorFamily: "slate",
  },
  failed: {
    code: "failed",
    labelId: "Gagal",
    labelEn: "Failed",
    variant: "destructive",
    icon: "AlertCircle",
    colorFamily: "rose",
  },
  refunded: {
    code: "refunded",
    labelId: "Dikembalikan",
    labelEn: "Refunded",
    variant: "neutral",
    icon: "Undo2",
    colorFamily: "slate",
  },
  partial_refund: {
    code: "partial_refund",
    labelId: "Refund Sebagian",
    labelEn: "Partial Refund",
    variant: "warning",
    icon: "Undo2",
    colorFamily: "amber",
  },
} as const satisfies Record<string, StatusInfo>;

export type TxnStatusCode = keyof typeof TXN_STATUS;

/* -------------------------------------------------------------------------
 * PRODUCT STATUS
 * -----------------------------------------------------------------------*/

export const PRODUCT_STATUS = {
  active: {
    code: "active",
    labelId: "Aktif",
    labelEn: "Active",
    variant: "success",
    icon: "Check",
    colorFamily: "emerald",
  },
  inactive: {
    code: "inactive",
    labelId: "Tidak Aktif",
    labelEn: "Inactive",
    variant: "neutral",
    icon: "Minus",
    colorFamily: "slate",
  },
  draft: {
    code: "draft",
    labelId: "Draf",
    labelEn: "Draft",
    variant: "neutral",
    icon: "FileEdit",
    colorFamily: "slate",
  },
  archived: {
    code: "archived",
    labelId: "Diarsipkan",
    labelEn: "Archived",
    variant: "neutral",
    icon: "Archive",
    colorFamily: "slate",
  },
} as const satisfies Record<string, StatusInfo>;

export type ProductStatusCode = keyof typeof PRODUCT_STATUS;

/* -------------------------------------------------------------------------
 * STOCK STATUS
 * -----------------------------------------------------------------------*/

export const STOCK_STATUS = {
  in_stock: {
    code: "in_stock",
    labelId: "Tersedia",
    labelEn: "In Stock",
    variant: "success",
    icon: "Package",
    colorFamily: "emerald",
  },
  low_stock: {
    code: "low_stock",
    labelId: "Stok Rendah",
    labelEn: "Low Stock",
    variant: "warning",
    icon: "AlertTriangle",
    colorFamily: "amber",
  },
  out_of_stock: {
    code: "out_of_stock",
    labelId: "Habis",
    labelEn: "Out of Stock",
    variant: "destructive",
    icon: "PackageX",
    colorFamily: "rose",
  },
  discontinued: {
    code: "discontinued",
    labelId: "Tidak Dijual Lagi",
    labelEn: "Discontinued",
    variant: "neutral",
    icon: "Ban",
    colorFamily: "slate",
  },
} as const satisfies Record<string, StatusInfo>;

export type StockStatusCode = keyof typeof STOCK_STATUS;

/* -------------------------------------------------------------------------
 * USER STATUS
 * -----------------------------------------------------------------------*/

export const USER_STATUS = {
  active: {
    code: "active",
    labelId: "Aktif",
    labelEn: "Active",
    variant: "success",
    icon: "UserCheck",
    colorFamily: "emerald",
  },
  invited: {
    code: "invited",
    labelId: "Diundang",
    labelEn: "Invited",
    variant: "info",
    icon: "Mail",
    colorFamily: "blue",
  },
  inactive: {
    code: "inactive",
    labelId: "Tidak Aktif",
    labelEn: "Inactive",
    variant: "neutral",
    icon: "UserMinus",
    colorFamily: "slate",
  },
  suspended: {
    code: "suspended",
    labelId: "Diblokir",
    labelEn: "Suspended",
    variant: "destructive",
    icon: "UserX",
    colorFamily: "rose",
  },
} as const satisfies Record<string, StatusInfo>;

export type UserStatusCode = keyof typeof USER_STATUS;

/* -------------------------------------------------------------------------
 * SHIFT STATUS
 * -----------------------------------------------------------------------*/

export const SHIFT_STATUS = {
  open: {
    code: "open",
    labelId: "Buka",
    labelEn: "Open",
    variant: "success",
    icon: "DoorOpen",
    colorFamily: "emerald",
  },
  closed: {
    code: "closed",
    labelId: "Tutup",
    labelEn: "Closed",
    variant: "neutral",
    icon: "DoorClosed",
    colorFamily: "slate",
  },
  reconciling: {
    code: "reconciling",
    labelId: "Rekonsiliasi",
    labelEn: "Reconciling",
    variant: "info",
    icon: "Calculator",
    colorFamily: "blue",
  },
} as const satisfies Record<string, StatusInfo>;

export type ShiftStatusCode = keyof typeof SHIFT_STATUS;

/* -------------------------------------------------------------------------
 * SYNC STATUS (Offline POS)
 * -----------------------------------------------------------------------*/

export const SYNC_STATUS = {
  synced: {
    code: "synced",
    labelId: "Tersinkron",
    labelEn: "Synced",
    variant: "success",
    icon: "CheckCircle2",
    colorFamily: "emerald",
  },
  pending_sync: {
    code: "pending_sync",
    labelId: "Menunggu Sinkronisasi",
    labelEn: "Pending Sync",
    variant: "warning",
    icon: "CloudOff",
    colorFamily: "amber",
  },
  sync_failed: {
    code: "sync_failed",
    labelId: "Sinkronisasi Gagal",
    labelEn: "Sync Failed",
    variant: "destructive",
    icon: "CloudOff",
    colorFamily: "rose",
  },
  offline: {
    code: "offline",
    labelId: "Offline",
    labelEn: "Offline",
    variant: "warning",
    icon: "WifiOff",
    colorFamily: "amber",
  },
} as const satisfies Record<string, StatusInfo>;

export type SyncStatusCode = keyof typeof SYNC_STATUS;

/* -------------------------------------------------------------------------
 * PRIORITY
 * -----------------------------------------------------------------------*/

export const PRIORITY = {
  urgent: {
    code: "urgent",
    labelId: "Mendesak",
    labelEn: "Urgent",
    variant: "destructive",
    icon: "AlertOctagon",
    colorFamily: "rose",
  },
  high: {
    code: "high",
    labelId: "Tinggi",
    labelEn: "High",
    variant: "warning",
    icon: "ArrowUp",
    colorFamily: "amber",
  },
  medium: {
    code: "medium",
    labelId: "Sedang",
    labelEn: "Medium",
    variant: "info",
    icon: "Minus",
    colorFamily: "blue",
  },
  low: {
    code: "low",
    labelId: "Rendah",
    labelEn: "Low",
    variant: "neutral",
    icon: "ArrowDown",
    colorFamily: "slate",
  },
} as const satisfies Record<string, StatusInfo>;

export type PriorityCode = keyof typeof PRIORITY;

/* -------------------------------------------------------------------------
 * ROLE MAPPING (canonical)
 *
 * Backend uses: owner, admin, inventory_manager, cashier (snake_case).
 * Display uses ID labels per TERMINOLOGY.md §2.
 * Colors aligned dengan colors.ts (canonical):
 *   owner   → indigo
 *   admin   → slate
 *   inventory_manager → teal
 *   cashier → emerald
 * -----------------------------------------------------------------------*/

export const ROLE = {
  owner: {
    code: "owner",
    labelId: "Pemilik",
    labelEn: "Owner",
    labelCompact: "Owner",
    badgeVariant: "primary",
    colorFamily: "indigo",
  },
  admin: {
    code: "admin",
    labelId: "Admin",
    labelEn: "Admin",
    labelCompact: "Admin",
    badgeVariant: "neutral",
    colorFamily: "slate",
  },
  inventory_manager: {
    code: "inventory_manager",
    labelId: "Manajer Inventaris",
    labelEn: "Inventory Manager",
    labelCompact: "Inv. Manager",
    badgeVariant: "inventory",
    colorFamily: "teal",
  },
  cashier: {
    code: "cashier",
    labelId: "Kasir",
    labelEn: "Cashier",
    labelCompact: "Kasir",
    badgeVariant: "success",
    colorFamily: "emerald",
  },
} as const satisfies Record<string, RoleInfo>;

export type RoleCode = keyof typeof ROLE;

/* -------------------------------------------------------------------------
 * HELPERS
 * -----------------------------------------------------------------------*/

/** Get status info by category + code, fallback to neutral stub. */
export function getStatusInfo<T extends Record<string, StatusInfo>>(
  category: T,
  code: string,
): StatusInfo {
  return (
    category[code] ?? {
      code,
      labelId: code,
      labelEn: code,
      variant: "neutral",
      icon: "Circle",
      colorFamily: "slate",
    }
  );
}

/** Get role info, fallback to stub. */
export function getRoleInfo(code: string): RoleInfo {
  return (
    (ROLE as Record<string, RoleInfo>)[code] ?? {
      code,
      labelId: code,
      labelEn: code,
      labelCompact: code,
      badgeVariant: "neutral",
      colorFamily: "slate",
    }
  );
}

/** Resolve localized label. */
export function getLabel(
  info: StatusInfo | RoleInfo,
  locale: "id-ID" | "en-US" = "id-ID",
): string {
  return locale === "id-ID" ? info.labelId : info.labelEn;
}
