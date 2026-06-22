import {
  LayoutDashboard, 
  BrainCircuit, 
  Lightbulb, 
  Package, 
  BarChart3, 
  Settings,
  Receipt,
  ShoppingCart,
  Wallet,
  ArrowLeftRight,
  Users,
  User,
  FlaskConical,
} from "lucide-react";
import { ROLE_SETS } from "@/app/domain/constants";

export const NAV_GROUPS = [
  "main",
  "operations",
  "analytics",
  "system",
] as const;

export type NavGroup = typeof NAV_GROUPS[number];

export const routes = [
  {
    id: "dashboard",
    group: "main",
    path: "/",
    labelKey: "nav.dashboard",
    icon: LayoutDashboard,
    allowedRoles: ROLE_SETS.all,
  },
  {
    id: "kasir",
    group: "operations",
    path: "/kasir",
    labelKey: "nav.kasir",
    icon: ShoppingCart,
    layout: "fullscreen",
    allowedRoles: ROLE_SETS.operational,
  },
  {
    id: "predictions",
    group: "analytics",
    path: "/prediksi-stok",
    labelKey: "nav.predictions",
    icon: BrainCircuit,
    allowedRoles: ROLE_SETS.inventoryAccess,
  },
  {
    id: "xai",
    group: "analytics",
    path: "/penjelasan-ai",
    labelKey: "nav.xai",
    icon: Lightbulb,
    allowedRoles: ROLE_SETS.adminOwner,
  },
  {
    id: "inventory",
    group: "operations",
    path: "/inventaris",
    labelKey: "nav.inventory",
    icon: Package,
    allowedRoles: ROLE_SETS.inventoryAccess,
  },
  {
    id: "transactions",
    group: "operations",
    path: "/riwayat-transaksi",
    labelKey: "nav.transactions",
    icon: Receipt,
    allowedRoles: ROLE_SETS.adminOwner,
  },
  {
    id: "reports",
    group: "analytics",
    path: "/laporan",
    labelKey: "nav.reports",
    icon: BarChart3,
    allowedRoles: ROLE_SETS.inventoryAccess,
  },
  {
    id: "mlops",
    group: "analytics",
    path: "/mlops",
    labelKey: "nav.mlops",
    icon: FlaskConical,
    allowedRoles: ROLE_SETS.adminOnly,
  },
  {
    id: "cash_management",
    group: "operations",
    path: "/manajemen-kas",
    labelKey: "nav.cash_management",
    icon: Wallet,
    allowedRoles: ROLE_SETS.adminOwner,
  },
  {
    id: "stock_movement",
    group: "operations",
    path: "/pergerakan-stok",
    labelKey: "nav.stock_movement",
    icon: ArrowLeftRight,
    allowedRoles: ROLE_SETS.inventoryAccess,
  },
  {
    id: "user_management",
    group: "system",
    path: "/manajemen-pengguna",
    labelKey: "nav.user_management",
    icon: Users,
    allowedRoles: ROLE_SETS.adminOnly,
  },
  {
    id: "settings",
    group: "system",
    path: "/pengaturan",
    labelKey: "nav.settings",
    icon: Settings,
    allowedRoles: ROLE_SETS.all,
  },
] as const;

export type RouteId = typeof routes[number]["id"];
