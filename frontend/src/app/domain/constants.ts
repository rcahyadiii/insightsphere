export const ROLE_CODES = {
  admin: "admin",
  owner: "owner",
  inventoryManager: "inventory_manager",
  cashier: "cashier",
} as const;

export type UserRole = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];

export const USER_ROLE_VALUES = [
  ROLE_CODES.admin,
  ROLE_CODES.owner,
  ROLE_CODES.inventoryManager,
  ROLE_CODES.cashier,
] as const satisfies readonly UserRole[];

export const DEFAULT_ROLE = ROLE_CODES.cashier;

export const ROLE_SETS = {
  all: USER_ROLE_VALUES,
  adminOnly: [ROLE_CODES.admin],
  adminOwner: [ROLE_CODES.admin, ROLE_CODES.owner],
  operational: [ROLE_CODES.admin, ROLE_CODES.owner, ROLE_CODES.cashier],
  inventoryAccess: [ROLE_CODES.admin, ROLE_CODES.owner, ROLE_CODES.inventoryManager],
  mirrorTargets: [ROLE_CODES.owner, ROLE_CODES.inventoryManager, ROLE_CODES.cashier],
  impersonators: [ROLE_CODES.admin, ROLE_CODES.owner],
} as const;

export function isRoleCode(value: string): value is UserRole {
  return (USER_ROLE_VALUES as readonly string[]).includes(value);
}

export function hasRole(set: readonly UserRole[], role: UserRole): boolean {
  return set.includes(role);
}

export const AUTH_SESSION_DAYS = 7;
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * AUTH_SESSION_DAYS;

export const INVENTORY_CATEGORIES = [
  { value: "Toner", labelKey: "sm.category.toner" },
  { value: "Kertas", labelKey: "sm.category.paper" },
  { value: "Lem", labelKey: "sm.category.glue" },
  { value: "Tinta", labelKey: "sm.category.ink" },
  { value: "Sparepart", labelKey: "sm.category.sparepart" },
  { value: "Lainnya", labelKey: "sm.category.other" },
] as const;

export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number]["value"];
export const DEFAULT_INVENTORY_CATEGORY: InventoryCategory = INVENTORY_CATEGORIES[0].value;

export const INVENTORY_UNITS = ["pcs", "box", "rim", "roll", "liter", "kg"] as const;
export type InventoryUnit = (typeof INVENTORY_UNITS)[number];
export const DEFAULT_INVENTORY_UNIT: InventoryUnit = INVENTORY_UNITS[0];

export const STOCK_MOVEMENT_TYPES = ["in", "out", "adjustment", "transfer", "return"] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export const STOCK_MOVEMENT_PERIODS = [
  { value: "all", labelKey: "sm.period.all" },
  { value: "today", labelKey: "sm.period.today" },
  { value: "yesterday", labelKey: "sm.period.yesterday" },
  { value: "last7", labelKey: "sm.period.last7" },
  { value: "last30", labelKey: "sm.period.last30" },
  { value: "custom", labelKey: "sm.period.custom" },
] as const;
export type StockMovementPeriod = (typeof STOCK_MOVEMENT_PERIODS)[number]["value"];

export const STOCK_MOVEMENT_STATUS = {
  completed: "completed",
  pending: "pending",
  cancelled: "cancelled",
} as const;
export type StockMovementStatus = (typeof STOCK_MOVEMENT_STATUS)[keyof typeof STOCK_MOVEMENT_STATUS];

export const INVENTORY_STOCK_STATUS = {
  all: "Semua",
  critical: "Kritis",
  thin: "Menipis",
  safe: "Aman",
} as const;
export type InventoryStockStatus =
  (typeof INVENTORY_STOCK_STATUS)[keyof typeof INVENTORY_STOCK_STATUS];

export const WHAT_IF_SIMULATOR_RULES = {
  defaultPromoDiscountPct: 10,
  promoDiscount: {
    minPct: 5,
    maxPct: 50,
    stepPct: 5,
    demandLiftPerDiscountPct: 1.5,
  },
  weatherDemandMultiplier: 0.85,
  competitorRestockDemandMultiplier: 0.8,
} as const;

/** Default page size untuk Transaction History list. */
export const TRANSACTION_PAGE_SIZE = 5;
