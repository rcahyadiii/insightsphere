import { BarChart3, Boxes, DollarSign, ShoppingCart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatRupiah } from "@/app/lib/format";

type DemoKpiPeriod = "day" | "week" | "month";

type DemoDashboardKpi = {
  key: string;
  value: string;
  change: string;
  up: boolean;
  icon: LucideIcon;
  color: string;
};

type DemoBranch = {
  id: string;
  name: string;
  short: string;
};

type DemoBranchComparison = {
  id: string;
  name: string;
  location: string;
  omzet: Record<DemoKpiPeriod, string>;
  txn: Record<DemoKpiPeriod, number>;
  trend: Record<DemoKpiPeriod, string>;
  up: boolean;
  criticalStock: number;
  staffCount: number;
};

type DemoDashboardData = {
  branches: DemoBranch[];
  branchPeriodKpis: Record<string, Record<DemoKpiPeriod, DemoDashboardKpi[]>>;
  branchComparison: DemoBranchComparison[];
  precision: {
    value: string;
    grade: string;
  };
};

const fmt = (value: number) => formatRupiah(value, { compact: true });

const allPeriodKpis: Record<DemoKpiPeriod, DemoDashboardKpi[]> = {
  day: [
    { key: "dash.kpi.revenue", value: fmt(3_200_000), change: "+8.1%", up: true, icon: DollarSign, color: "indigo" },
    { key: "dash.kpi.transactions", value: "38", change: "+5.3%", up: true, icon: ShoppingCart, color: "emerald" },
    { key: "dash.kpi.avg_transaction", value: fmt(84_200), change: "+2.8%", up: true, icon: BarChart3, color: "indigo" },
    { key: "dash.kpi.items_sold", value: "312", change: "-1.1%", up: false, icon: Boxes, color: "amber" },
  ],
  week: [
    { key: "dash.kpi.revenue", value: fmt(12_800_000), change: "+18.3%", up: true, icon: DollarSign, color: "indigo" },
    { key: "dash.kpi.transactions", value: "142", change: "+12.1%", up: true, icon: ShoppingCart, color: "emerald" },
    { key: "dash.kpi.avg_transaction", value: fmt(90_100), change: "+5.6%", up: true, icon: BarChart3, color: "indigo" },
    { key: "dash.kpi.items_sold", value: "1,247", change: "-3.2%", up: false, icon: Boxes, color: "amber" },
  ],
  month: [
    { key: "dash.kpi.revenue", value: fmt(48_500_000), change: "+22.7%", up: true, icon: DollarSign, color: "indigo" },
    { key: "dash.kpi.transactions", value: "574", change: "+15.4%", up: true, icon: ShoppingCart, color: "emerald" },
    { key: "dash.kpi.avg_transaction", value: fmt(84_500), change: "+6.2%", up: true, icon: BarChart3, color: "indigo" },
    { key: "dash.kpi.items_sold", value: "4,980", change: "+4.1%", up: true, icon: Boxes, color: "amber" },
  ],
};

export const DEMO_DASHBOARD: DemoDashboardData = {
  branches: [
    { id: "all", name: "Semua Cabang", short: "ALL" },
    { id: "hq", name: "HQ - Jakarta Pusat", short: "HQ" },
    { id: "cb1", name: "Cabang Tangerang", short: "TNG" },
    { id: "cb2", name: "Cabang Bekasi", short: "BKS" },
  ],
  branchPeriodKpis: {
    all: allPeriodKpis,
    hq: {
      day: [
        { key: "dash.kpi.revenue", value: fmt(1_300_000), change: "+7.2%", up: true, icon: DollarSign, color: "indigo" },
        { key: "dash.kpi.transactions", value: "16", change: "+5.0%", up: true, icon: ShoppingCart, color: "emerald" },
        { key: "dash.kpi.avg_transaction", value: fmt(81_300), change: "+2.1%", up: true, icon: BarChart3, color: "indigo" },
        { key: "dash.kpi.items_sold", value: "131", change: "-0.8%", up: false, icon: Boxes, color: "amber" },
      ],
      week: [
        { key: "dash.kpi.revenue", value: fmt(5_400_000), change: "+17.5%", up: true, icon: DollarSign, color: "indigo" },
        { key: "dash.kpi.transactions", value: "60", change: "+11.0%", up: true, icon: ShoppingCart, color: "emerald" },
        { key: "dash.kpi.avg_transaction", value: fmt(90_000), change: "+5.1%", up: true, icon: BarChart3, color: "indigo" },
        { key: "dash.kpi.items_sold", value: "524", change: "-2.5%", up: false, icon: Boxes, color: "amber" },
      ],
      month: [
        { key: "dash.kpi.revenue", value: fmt(20_400_000), change: "+21.3%", up: true, icon: DollarSign, color: "indigo" },
        { key: "dash.kpi.transactions", value: "241", change: "+14.0%", up: true, icon: ShoppingCart, color: "emerald" },
        { key: "dash.kpi.avg_transaction", value: fmt(84_700), change: "+5.8%", up: true, icon: BarChart3, color: "indigo" },
        { key: "dash.kpi.items_sold", value: "2,092", change: "+3.9%", up: true, icon: Boxes, color: "amber" },
      ],
    },
    cb1: {
      day: [
        { key: "dash.kpi.revenue", value: fmt(1_100_000), change: "+9.5%", up: true, icon: DollarSign, color: "indigo" },
        { key: "dash.kpi.transactions", value: "13", change: "+6.2%", up: true, icon: ShoppingCart, color: "emerald" },
        { key: "dash.kpi.avg_transaction", value: fmt(84_600), change: "+3.1%", up: true, icon: BarChart3, color: "indigo" },
        { key: "dash.kpi.items_sold", value: "109", change: "-1.5%", up: false, icon: Boxes, color: "amber" },
      ],
      week: [
        { key: "dash.kpi.revenue", value: fmt(4_500_000), change: "+19.2%", up: true, icon: DollarSign, color: "indigo" },
        { key: "dash.kpi.transactions", value: "50", change: "+13.0%", up: true, icon: ShoppingCart, color: "emerald" },
        { key: "dash.kpi.avg_transaction", value: fmt(90_000), change: "+5.8%", up: true, icon: BarChart3, color: "indigo" },
        { key: "dash.kpi.items_sold", value: "437", change: "-3.8%", up: false, icon: Boxes, color: "amber" },
      ],
      month: [
        { key: "dash.kpi.revenue", value: fmt(17_000_000), change: "+23.1%", up: true, icon: DollarSign, color: "indigo" },
        { key: "dash.kpi.transactions", value: "201", change: "+16.2%", up: true, icon: ShoppingCart, color: "emerald" },
        { key: "dash.kpi.avg_transaction", value: fmt(84_600), change: "+6.6%", up: true, icon: BarChart3, color: "indigo" },
        { key: "dash.kpi.items_sold", value: "1,743", change: "+4.5%", up: true, icon: Boxes, color: "amber" },
      ],
    },
    cb2: {
      day: [
        { key: "dash.kpi.revenue", value: fmt(800_000), change: "+7.8%", up: true, icon: DollarSign, color: "indigo" },
        { key: "dash.kpi.transactions", value: "9", change: "+4.0%", up: true, icon: ShoppingCart, color: "emerald" },
        { key: "dash.kpi.avg_transaction", value: fmt(88_900), change: "+3.7%", up: true, icon: BarChart3, color: "indigo" },
        { key: "dash.kpi.items_sold", value: "72", change: "-0.9%", up: false, icon: Boxes, color: "amber" },
      ],
      week: [
        { key: "dash.kpi.revenue", value: fmt(2_900_000), change: "+16.1%", up: true, icon: DollarSign, color: "indigo" },
        { key: "dash.kpi.transactions", value: "32", change: "+10.5%", up: true, icon: ShoppingCart, color: "emerald" },
        { key: "dash.kpi.avg_transaction", value: fmt(90_600), change: "+5.3%", up: true, icon: BarChart3, color: "indigo" },
        { key: "dash.kpi.items_sold", value: "286", change: "-3.1%", up: false, icon: Boxes, color: "amber" },
      ],
      month: [
        { key: "dash.kpi.revenue", value: fmt(11_100_000), change: "+20.8%", up: true, icon: DollarSign, color: "indigo" },
        { key: "dash.kpi.transactions", value: "132", change: "+15.2%", up: true, icon: ShoppingCart, color: "emerald" },
        { key: "dash.kpi.avg_transaction", value: fmt(84_100), change: "+4.8%", up: true, icon: BarChart3, color: "indigo" },
        { key: "dash.kpi.items_sold", value: "1,145", change: "+3.8%", up: true, icon: Boxes, color: "amber" },
      ],
    },
  },
  branchComparison: [
    {
      id: "hq",
      name: "HQ - Jakarta Pusat",
      location: "Gambir, Jakarta Pusat",
      omzet: { day: fmt(1_300_000), week: fmt(5_400_000), month: fmt(20_400_000) },
      txn: { day: 16, week: 60, month: 241 },
      trend: { day: "+7.2%", week: "+17.5%", month: "+21.3%" },
      up: true,
      criticalStock: 2,
      staffCount: 8,
    },
    {
      id: "cb1",
      name: "Cabang Tangerang",
      location: "BSD City, Tangerang Selatan",
      omzet: { day: fmt(1_100_000), week: fmt(4_500_000), month: fmt(17_000_000) },
      txn: { day: 13, week: 50, month: 201 },
      trend: { day: "+9.5%", week: "+19.2%", month: "+23.1%" },
      up: true,
      criticalStock: 5,
      staffCount: 6,
    },
    {
      id: "cb2",
      name: "Cabang Bekasi",
      location: "Kalimalang, Bekasi Barat",
      omzet: { day: fmt(800_000), week: fmt(2_900_000), month: fmt(11_100_000) },
      txn: { day: 9, week: 32, month: 132 },
      trend: { day: "+7.8%", week: "+16.1%", month: "+20.8%" },
      up: true,
      criticalStock: 3,
      staffCount: 5,
    },
  ],
  precision: {
    value: "94.3%",
    grade: "A+ Grade",
  },
};
