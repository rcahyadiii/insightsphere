"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { KPICards } from "../KPICards";
import { PredictionTable } from "../PredictionTable";
import { TopProductsChart } from "../TopProductsChart";
import { LowStockAlert } from "../LowStockAlert";
import { ErrorBoundary } from "../ErrorBoundary";
import { RefreshCcw, Sparkles, Zap, ShieldCheck, ChevronRight, TrendingUp, MapPin, Building2, ArrowUpRight, AlertTriangle, Banknote, ShoppingCart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useTranslation } from "@/app/i18n";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { C } from "@/app/lib/colors";
import { R, R_COMPONENT } from "@/app/lib/radii";
import { E, E_COMPONENT } from "@/app/lib/elevation";
import { toast } from "sonner";
import { useEffect, useState, useMemo } from "react";
import { GAP, STACK } from "@/app/lib/spacing";
import { TABLE } from "@/app/lib/data";
import { ResponsiveTable } from "@/app/components/ui/ResponsiveTable";
import { A11Y } from "@/app/lib/a11y";
import { isDemoDataEnabled } from "@/app/lib/demo-mode";

import { ChartSkeleton } from "../Skeletons";
import { formatRupiah } from "@/app/lib/format";
import { fetchDashboardOverview, type DashboardOverviewResponse } from "@/app/lib/dashboard-client";
import { fetchModelMetrics } from "@/app/lib/intelligence-client";

// ForecastChart uses Recharts (heavy). Lazy-load so that "cashier" role
// — who never renders it — doesn't pay the cost in their initial bundle.
const ForecastChart = dynamic(
  () => import("../ForecastChart").then((mod) => ({ default: mod.ForecastChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton bento />,
  }
);

const PERIODS = [
  { key: "day", labelKey: "dash.period.daily" },
  { key: "week", labelKey: "dash.period.weekly" },
  { key: "month", labelKey: "dash.period.monthly" },
] as const;
type KpiPeriod = typeof PERIODS[number]["key"];

type BranchId = string;

type DashboardKpi = {
  key: string;
  value: string;
  change: string;
  up: boolean;
  icon: LucideIcon;
  color: string;
};

type Branch = {
  id: BranchId;
  name: string;
  short: string;
};

type BranchComparison = {
  id: BranchId;
  name: string;
  location: string;
  omzet: Record<KpiPeriod, string>;
  txn: Record<KpiPeriod, number>;
  trend: Record<KpiPeriod, string>;
  up: boolean;
  criticalStock: number;
  staffCount: number;
};

type DashboardData = {
  branches: Branch[];
  branchPeriodKpis: Record<BranchId, Record<KpiPeriod, DashboardKpi[]>>;
  branchComparison: BranchComparison[];
  precision: {
    value: string;
    grade: string;
  };
};

const EMPTY_DASHBOARD: DashboardData = {
  branches: [],
  branchPeriodKpis: {},
  branchComparison: [],
  precision: {
    value: "-",
    grade: "-",
  },
};

const emptyPeriodKpis = (): Record<KpiPeriod, DashboardKpi[]> => ({
  day: [],
  week: [],
  month: [],
});

const toPeriodKey = (period: string): KpiPeriod => {
  if (period === "today" || period === "day") return "day";
  if (period === "month") return "month";
  return "week";
};

const makeShortBranchName = (name: string, fallback: string) => {
  const short = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
  return short || fallback.slice(0, 3).toUpperCase();
};

const buildKpis = (revenue: number, transactions: number, itemsSold = 0): DashboardKpi[] => {
  const averageTransaction = transactions > 0 ? revenue / transactions : 0;
  return [
    { key: "dash.kpi.revenue", value: formatRupiah(revenue, { compact: true }), change: "0%", up: true, icon: Banknote, color: "indigo" },
    { key: "dash.kpi.transactions", value: transactions.toLocaleString("id-ID"), change: "0%", up: true, icon: ShoppingCart, color: "emerald" },
    { key: "dash.kpi.avg_transaction", value: formatRupiah(averageTransaction, { compact: true }), change: "0%", up: true, icon: TrendingUp, color: "indigo" },
    { key: "dash.kpi.items_sold", value: itemsSold.toLocaleString("id-ID"), change: "0%", up: true, icon: Building2, color: "amber" },
  ];
};

const toDashboardData = (overview: DashboardOverviewResponse): DashboardData => {
  const allKpis = emptyPeriodKpis();
  for (const period of overview.period_kpis) {
    allKpis[toPeriodKey(period.period)] = buildKpis(period.revenue, period.transactions);
  }
  allKpis.day = buildKpis(overview.today.revenue, overview.today.transactions, overview.today.items_sold);

  const branchRows: BranchComparison[] = overview.branch_comparison.map((branch) => {
    const id = String(branch.store_nbr);
    return {
      id,
      name: branch.name,
      location: `Store ${branch.store_nbr}`,
      omzet: {
        day: formatRupiah(branch.revenue, { compact: true }),
        week: formatRupiah(branch.revenue, { compact: true }),
        month: formatRupiah(branch.revenue, { compact: true }),
      },
      txn: {
        day: branch.transactions,
        week: branch.transactions,
        month: branch.transactions,
      },
      trend: { day: "0%", week: "0%", month: "0%" },
      up: true,
      criticalStock: overview.inventory.critical + overview.inventory.out_of_stock,
      staffCount: 0,
    };
  });

  const branchPeriodKpis: Record<BranchId, Record<KpiPeriod, DashboardKpi[]>> = {
    all: allKpis,
  };
  for (const branch of overview.branch_comparison) {
    const id = String(branch.store_nbr);
    branchPeriodKpis[id] = {
      day: buildKpis(branch.revenue, branch.transactions),
      week: buildKpis(branch.revenue, branch.transactions),
      month: buildKpis(branch.revenue, branch.transactions),
    };
  }

  const modelAccuracy = overview.model.accuracy;
  return {
    branches: [
      { id: "all", name: "Semua Cabang", short: "ALL" },
      ...overview.branch_comparison.map((branch) => {
        const id = String(branch.store_nbr);
        return {
          id,
          name: branch.name,
          short: makeShortBranchName(branch.name, id),
        };
      }),
    ],
    branchPeriodKpis,
    branchComparison: branchRows,
    precision: {
      value: modelAccuracy == null ? "-" : `${modelAccuracy.toFixed(1)}%`,
      grade: modelAccuracy == null ? "-" : modelAccuracy >= 90 ? "Grade A+" : modelAccuracy >= 80 ? "Grade A" : "Grade B",
    },
  };
};

export function DashboardPage() {
  const { role, user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [kpiPeriod, setKpiPeriod] = useState<KpiPeriod>("week");
  const [selectedBranch, setSelectedBranch] = useState<BranchId>("all");
  const [dashboardData, setDashboardData] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [liveToday, setLiveToday] = useState<{ date: string; totalRevenue: number; totalTransactions: number } | null>(null);
  const [livePrecision, setLivePrecision] = useState<DashboardData["precision"] | null>(null);
  const { branches, branchPeriodKpis, branchComparison, precision } = dashboardData;
  const BUSINESS_KPIS = useMemo(
    () => branchPeriodKpis[selectedBranch]?.[kpiPeriod] ?? [],
    [branchPeriodKpis, selectedBranch, kpiPeriod]
  );
  const ALL_PERIOD_KPIS = branchPeriodKpis.all?.[kpiPeriod] ?? [];

  useEffect(() => {
    if (!isDemoDataEnabled()) return;

    let cancelled = false;
    void import("@/app/demo/dashboard").then(({ DEMO_DASHBOARD }) => {
      if (!cancelled) setDashboardData(DEMO_DASHBOARD);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isDemoDataEnabled()) return;
    let cancelled = false;
    void fetchDashboardOverview({ store_nbr: user?.storeNbr ?? undefined })
      .then((overview) => {
        if (cancelled) return;
        const nextDashboard = toDashboardData(overview);
        setDashboardData(nextDashboard);
        setLiveToday({
          date: new Date().toISOString().slice(0, 10),
          totalRevenue: overview.today.revenue,
          totalTransactions: overview.today.transactions,
        });
        if (overview.model.accuracy != null) {
          setLivePrecision(nextDashboard.precision);
        }
        setSelectedBranch((current) => (nextDashboard.branchPeriodKpis[current] ? current : "all"));
      })
      .catch(() => {});
    void fetchModelMetrics({ store_nbr: user?.storeNbr ?? undefined })
      .then((metrics) => {
        const wape = metrics.find((m) => m.metric_name.toLowerCase() === "wape");
        if (wape) {
          const acc = Math.max(0, 100 - wape.metric_value);
          setLivePrecision({ value: `${acc.toFixed(1)}%`, grade: acc >= 90 ? "Grade A+" : acc >= 80 ? "Grade A" : "Grade B" });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.storeNbr]);

  const headerKey = useMemo(() => {
    if (role === "owner") return "dash.header.owner";
    if (role === "admin" || role === "inventory_manager") return "dash.header.admin";
    return "dash.header.staff";
  }, [role]);

  const descKey = useMemo(() => {
    if (role === "owner") return "dash.desc.owner";
    if (role === "admin" || role === "inventory_manager") return "dash.desc.admin";
    return "dash.desc.staff";
  }, [role]);

  const canSeeFinancials = useMemo(() => role === "owner" || role === "admin", [role]);
  const canSeeStock      = useMemo(() => role !== "cashier", [role]);
  const totalCriticalStock = useMemo(() => branchComparison.reduce((s, b) => s + b.criticalStock, 0), [branchComparison]);
  const totalStaff         = useMemo(() => branchComparison.reduce((s, b) => s + b.staffCount, 0), [branchComparison]);

  return (
    <div className="space-y-6 pb-6">
      {/* Header Section */}
      <div className={cn("flex flex-col md:flex-row md:items-center justify-between", GAP.default)}>
        <div className={STACK.tight}>
          <div className="flex items-center gap-3">
              <div className={cn(T.micro, R.sm, E.glowPrimary, "px-2 py-0.5 bg-indigo-600 text-white flex items-center gap-1.5")}>
                <Zap className="size-3" />
                {t("dash.ai_engine_live")}
              </div>
              <span className={cn(T.caption, "text-slate-400")}>•</span>
              <span className={cn(T.caption, "text-slate-400 flex items-center gap-1.5")}>
                 <RefreshCcw className="size-3" />
                 {t("common.mode")}: <span className={cn(T.code, "text-indigo-600 dark:text-indigo-400")}>{role}</span>
              </span>
          </div>
          <h1 className={cn(T.h1, "text-slate-900 dark:text-slate-100")}>
            {t(headerKey)}
          </h1>
          <p className={cn(T.body, "text-slate-500 dark:text-slate-400 max-w-xl")}>
            {t(descKey)}
          </p>
        </div>
        
        {role === "admin" && (
          <div className={cn(R.md, E_COMPONENT.card, "flex items-center gap-4 bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 group hover:shadow-md transition-all")}>
             <div className={cn(R.sm, "size-10 bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center group-hover:rotate-6 transition-transform")}>
                <ShieldCheck className={cn("size-5", C.primary.icon)} />
             </div>
             <div>
                <p className={cn(T.label, "text-slate-500 dark:text-slate-400 leading-none mb-1")}>{t("dash.precision")}</p>
                <div className="flex items-baseline gap-1.5">
                   <span className={cn(T.h3, "font-bold text-slate-900 dark:text-slate-100 font-data")}>{(livePrecision ?? precision).value}</span>
                   <span className={cn(T.caption, C.success.icon, "italic")}>{(livePrecision ?? precision).grade}</span>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Today's Live Snapshot — real API, non-demo only */}
      {!isDemoDataEnabled() && liveToday && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={cn(R.md, E_COMPONENT.card, "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3")}>
            <div className={cn(R.sm, "size-9 bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0")}>
              <Banknote className={cn("size-4", C.success.icon)} />
            </div>
            <div>
              <p className={cn(T.label, "text-slate-400 dark:text-slate-500")}>{t("dash.live.revenue_today")}</p>
              <p className={cn(T.h4, "text-slate-900 dark:text-slate-100 font-data")}>{formatRupiah(liveToday.totalRevenue, { compact: true })}</p>
            </div>
          </div>
          <div className={cn(R.md, E_COMPONENT.card, "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3")}>
            <div className={cn(R.sm, "size-9 bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0")}>
              <ShoppingCart className={cn("size-4", C.primary.icon)} />
            </div>
            <div>
              <p className={cn(T.label, "text-slate-400 dark:text-slate-500")}>{t("dash.live.txn_today")}</p>
              <p className={cn(T.h4, "text-slate-900 dark:text-slate-100 font-data")}>{liveToday.totalTransactions.toLocaleString("id-ID")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Branch Filter */}
      {canSeeStock && (
        <div className={cn(R.md, "flex flex-col items-stretch gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 sm:flex-row sm:flex-wrap sm:items-center")}>
          <div className={cn(T.label, "flex items-center gap-1.5 text-slate-400 dark:text-slate-500 shrink-0")}>
            <MapPin className="size-3" aria-hidden="true" /> {t("dash.branch_filter")}:
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap" role="group" aria-label={t("dash.branch_filter")}>
            {branches.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBranch(b.id)}
                aria-pressed={selectedBranch === b.id}
                className={cn(
                  T.buttonSm, R.sm, A11Y.tapTarget, "flex items-center justify-center gap-1.5 px-3 py-1.5 transition-all cursor-pointer",
                  selectedBranch === b.id
                    ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-md"
                    : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:bg-slate-700"
                )}
              >
                <Building2 className="size-2.5" aria-hidden="true" />
                {b.name}
              </button>
            ))}
          </div>
          {selectedBranch !== "all" && (
            <span className={cn(T.label, R.xs, "w-full text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 border border-indigo-100 dark:border-indigo-900 sm:ml-auto sm:w-auto")}>
              {branches.find(b => b.id === selectedBranch)?.name}
            </span>
          )}
        </div>
      )}

      {/* Business KPI Cards — Period Selector */}
      <div className="flex items-center justify-between">
        <p className={cn(T.label, "text-slate-400 dark:text-slate-500")}>{t("dash.sales_summary")}</p>
        <div className="flex gap-1" role="group" aria-label={t("dash.kpi_period")}>
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setKpiPeriod(p.key)}
              aria-pressed={kpiPeriod === p.key}
              className={cn(T.buttonSm, R.sm, "px-3 py-1.5 transition-all cursor-pointer",
                kpiPeriod === p.key ? "bg-slate-900 dark:bg-indigo-600 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >{t(p.labelKey)}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {BUSINESS_KPIS.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className={cn(R_COMPONENT.kpi, E_COMPONENT.kpi, "bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 group hover:shadow-md transition-shadow")}>
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  R.sm, "size-9 flex items-center justify-center",
                  kpi.color === "indigo" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" :
                  kpi.color === "emerald" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" :
                  "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                )}>
                  <Icon className="size-4" />
                </div>
                <div className={cn(
                  T.micro, R.xs, "flex items-center gap-1 px-1.5 py-0.5",
                  kpi.up ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30" : "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30"
                )}>
                  {kpi.change}
                </div>
              </div>
              <p className={cn(T.label, "text-slate-400 dark:text-slate-500 mb-1")}>{t(kpi.key)}</p>
              <p className={cn(T.kpiCard, "text-slate-900 dark:text-slate-100")}>{kpi.value}</p>
              <p className={cn(T.caption, "text-slate-300 dark:text-slate-600 mt-1")}>{t("dash.kpi.vs_yesterday")}</p>
            </div>
          );
        })}
      </div>

      {/* Multi-Branch Consolidated Report */}
      {canSeeFinancials && selectedBranch === "all" && (
        <div className={cn(R.md, E_COMPONENT.card, "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden")}>
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className={cn(T.h4, "text-slate-900 dark:text-slate-100 flex items-center gap-2")}>
              <Building2 className={cn("size-3.5", C.primary.icon)} aria-hidden="true" />
              {t("dash.report.consolidated")}
            </h3>
            <span className={cn(T.caption, "text-slate-400 font-data")}>
              {t(PERIODS.find(p => p.key === kpiPeriod)?.labelKey ?? "dash.period.weekly")}
            </span>
          </div>
          <ResponsiveTable
            label={t("dash.report.consolidated")}
            scrollerClassName="rounded-none border-0 bg-transparent"
            minWidthClassName={TABLE.minWidth.dashboard}
          >
            <table className={TABLE.base} aria-label={t("dash.report.consolidated")}>
              <thead className={TABLE.head}>
                <tr>
                  <th className={cn(TABLE.headCell, TABLE.stickyColumn, "bg-slate-50 dark:bg-slate-800/50")}>{t("dash.table.branch")}</th>
                  <th className={TABLE.headCell}>{t("dash.table.revenue")}</th>
                  <th className={TABLE.headCell}>{t("dash.table.transactions")}</th>
                  <th className={TABLE.headCell}>{t("dash.table.growth")}</th>
                  <th className={TABLE.headCell}>{t("dash.table.critical_stock")}</th>
                  <th className={TABLE.headCell}>{t("dash.table.staff")}</th>
                  <th className={TABLE.headCell} aria-label={t("dash.table.action")} />
                </tr>
              </thead>
              <tbody className={TABLE.body}>
                {branchComparison.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => { setSelectedBranch(b.id as BranchId); toast.info(t("dash.toast.showing_branch", { branch: b.name })); }}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setSelectedBranch(b.id as BranchId); toast.info(t("dash.toast.showing_branch", { branch: b.name })); } }}
                    tabIndex={0}
                    role="button"
                    aria-label={t("dash.aria.filter_branch_to", { branch: b.name })}
                    className={cn(TABLE.rowInteractive, "group")}
                  >
                    <td className={cn(TABLE.cell, TABLE.stickyColumn, "bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50")}>
                      <div className="flex items-center gap-2.5">
                        <div className={cn(T.label, R.sm, "size-8 bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center shrink-0")}>
                          {branches.find(br => br.id === b.id)?.short}
                        </div>
                        <div>
                          <p className={cn(T.bodySm, "font-bold text-slate-900 dark:text-slate-200 leading-tight")}>{b.name}</p>
                          <p className={cn(T.caption, "text-slate-400 flex items-center gap-0.5")}>
                            <MapPin className="size-2.5" />{b.location}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={TABLE.cell}>
                      <p className={cn(T.dataSm, "font-bold text-slate-900 dark:text-slate-200")}>{b.omzet[kpiPeriod]}</p>
                    </td>
                    <td className={TABLE.cell}>
                      <p className={cn(T.dataSm, "font-bold text-slate-900 dark:text-slate-200")}>{b.txn[kpiPeriod]}</p>
                    </td>
                    <td className={TABLE.cell}>
                      <span className={cn(
                        T.micro, R.xs, "inline-flex items-center gap-1 px-1.5 py-0.5",
                        b.up ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" : "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30"
                      )}>
                        <ArrowUpRight className="size-2.5" />
                        {b.trend[kpiPeriod]}
                      </span>
                    </td>
                    <td className={TABLE.cell}>
                      <span className={cn(
                        T.label, "inline-flex items-center gap-1",
                        b.criticalStock >= 5 ? C.destructive.icon : b.criticalStock >= 3 ? C.warning.icon : C.success.icon
                      )}>
                        <AlertTriangle className="size-3" aria-hidden="true" />
                        {b.criticalStock} SKU
                      </span>
                    </td>
                    <td className={TABLE.cell}>
                      <p className={cn(T.bodySm, "font-bold text-slate-500 dark:text-slate-400")}>{b.staffCount} {t("dash.table.people")}</p>
                    </td>
                    <td className={cn(TABLE.cell, "text-right")}>
                      <ChevronRight className="size-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700">
                  <td className={cn(TABLE.cell, T.label, TABLE.stickyColumn, "bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400")}>{t("dash.table.total_consolidated")}</td>
                  <td className={cn(TABLE.cell, T.dataSm, "font-bold text-slate-900 dark:text-slate-200")}>{ALL_PERIOD_KPIS[0]?.value ?? "-"}</td>
                  <td className={cn(TABLE.cell, T.dataSm, "font-bold text-slate-900 dark:text-slate-200")}>{ALL_PERIOD_KPIS[1]?.value ?? "-"}</td>
                  <td className={TABLE.cell}>
                    <span className={cn(T.micro, R.xs, "inline-flex items-center gap-1 px-1.5 py-0.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30")}>
                      <ArrowUpRight className="size-2.5" />{ALL_PERIOD_KPIS[0]?.change ?? "-"}
                    </span>
                  </td>
                  <td className={cn(TABLE.cell, T.bodySm, "font-bold text-slate-500 dark:text-slate-400")}>{totalCriticalStock} SKU</td>
                  <td className={cn(TABLE.cell, T.bodySm, "font-bold text-slate-500 dark:text-slate-400")}>{totalStaff} {t("dash.table.people")}</td>
                  <td className={TABLE.cell} />
                </tr>
              </tfoot>
            </table>
          </ResponsiveTable>
        </div>
      )}

      {/* AI KPI Cards Section (existing) */}
      {canSeeFinancials && (
        <ErrorBoundary compact sectionName="KPI Cards">
          <KPICards />
        </ErrorBoundary>
      )}

      {/* Top Products Chart + Low Stock Alert Grid */}
      {canSeeStock && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ErrorBoundary compact sectionName="Top Products">
            <TopProductsChart />
          </ErrorBoundary>
          <ErrorBoundary compact sectionName="Low Stock Alert">
            <LowStockAlert />
          </ErrorBoundary>
        </div>
      )}

      {/* Main Grid: Charts & Tables */}
      <div className="grid grid-cols-1 gap-6">
        {canSeeFinancials && (
          <div className={cn(R.md, E_COMPONENT.card, "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden")}>
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
               <h3 className={cn(T.h4, "text-slate-900 dark:text-slate-100 flex items-center gap-2")}>
                  <TrendingUp className={cn("size-3.5", C.primary.icon)} aria-hidden="true" />
                  {t("dash.forecast_analysis")}
               </h3>
               <button onClick={() => router.push("/laporan")} className={cn(T.buttonSm, C.primary.icon, "flex items-center gap-1 hover:gap-1.5 transition-all cursor-pointer")}>
                  {t("dash.full_report")} <ChevronRight className="size-3" />
               </button>
            </div>
            <div className="p-4">
              <ErrorBoundary compact sectionName="Forecast Chart">
                <ForecastChart />
              </ErrorBoundary>
            </div>
          </div>
        )}

        <div className={cn(R.md, E_COMPONENT.card, "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden")}>
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
             <h3 className={cn(T.h4, "text-slate-900 dark:text-slate-100 flex items-center gap-2")}>
                <Sparkles className={cn("size-3.5", C.primary.icon)} aria-hidden="true" />
                {t("dash.ai_recommendations")}
             </h3>
             <span className={cn(T.caption, "text-slate-500 dark:text-slate-400 font-data")}>
                {t("dash.critical_items", { count: 5 })}
             </span>
          </div>
          <div className="p-0">
            <ErrorBoundary compact sectionName="Prediction Table">
              <PredictionTable />
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className={cn(T.caption, "pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 dark:text-slate-400")}>
         <div className="flex items-center gap-4">
            <p>© 2026 InsightSphere — {t("dash.footer.product")}</p>
            <span className="text-slate-200 dark:text-slate-700">|</span>
            <p className={cn("flex items-center gap-1", C.success.icon)}>
               <span className="size-1 rounded-full bg-emerald-500" />
               {t("dash.sync_pulse")}
            </p>
         </div>
         <div className="flex items-center gap-5">
            <button onClick={() => toast.info(t("dash.toast.status"))} aria-label={t("dash.aria.view_system_status")} className="hover:text-indigo-600 transition-colors cursor-pointer">{t("common.status")}</button>
            <button onClick={() => toast.info(t("dash.toast.security"))} aria-label={t("dash.aria.view_security_info")} className="hover:text-indigo-600 transition-colors cursor-pointer">{t("common.security")}</button>
            <button onClick={() => router.push("/pengaturan")} className={cn(T.buttonSm, R.sm, "px-3 py-1.5 bg-slate-900 dark:bg-indigo-900/30 dark:border dark:border-indigo-800/50 text-white dark:text-indigo-400 hover:bg-indigo-600 dark:hover:bg-indigo-900/40 transition-all cursor-pointer")}>
               {t("common.documentation")}
            </button>
         </div>
      </div>
    </div>
  );
}
