"use client";

import { useState, useMemo, useEffect } from "react";
import { useTheme } from "next-themes";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Area, 
  AreaChart, 
  BarChart, 
  Bar, 
} from "recharts";
import { 
  BrainCircuit, 
  RefreshCcw, 
  Info, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Search,
  ChevronRight,
  Sparkles,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { CHART_COLORS, getAxisProps, getGridProps, getTooltipContentStyle , CHART_HEIGHT } from "@/app/lib/charts";
import { StableResponsiveContainer as ResponsiveContainer } from "@/app/components/charts/StableResponsiveContainer";
import { T } from "@/app/lib/typography";
import { C } from "@/app/lib/colors";
import { R } from "@/app/lib/radii";
import { E } from "@/app/lib/elevation";
import { BADGE, TABLE } from "@/app/lib/data";
import { GAP, ICON, STACK } from "@/app/lib/spacing";
import { btn, BTN } from "@/app/lib/buttons";
import { A11Y } from "@/app/lib/a11y";
import { useTranslation } from "@/app/i18n";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "sonner";
import { isDemoDataEnabled } from "@/app/lib/demo-mode";
import { fetchPredictions, type AIPredictionLogResponse } from "@/app/lib/intelligence-client";
import { INPUT } from "@/app/lib/forms";
import { ChartSkeleton, PredictionTableSkeleton } from "../Skeletons";
import { EmptyState } from "../ui/EmptyState";
import { ErrorBoundary } from "../ErrorBoundary";
import { ResponsiveTable } from "@/app/components/ui/ResponsiveTable";

// --- Priority Badge Component ---
const PRIORITY_VARIANT: Record<string, string> = {
  Tinggi: BADGE.variant.destructive,
  Sedang: BADGE.variant.warning,
  Rendah: BADGE.variant.success,
};
const PRIORITY_ICON = { Tinggi: AlertTriangle, Sedang: Clock, Rendah: CheckCircle2 } as const;

const PriorityBadge = ({ level }: { level: string }) => {
  const { t } = useTranslation();
  const Icon = PRIORITY_ICON[level as keyof typeof PRIORITY_ICON] ?? Clock;
  const getLabel = (l: string) => {
    if (l === "Tinggi") return t("pred.priority.high");
    if (l === "Sedang") return t("pred.priority.medium");
    if (l === "Rendah") return t("pred.priority.low");
    return l;
  };
  return (
    <span className={cn(BADGE.base, BADGE.size.xs, PRIORITY_VARIANT[level] ?? BADGE.variant.neutral)}>
      <Icon className="size-3" />
      {getLabel(level)}
    </span>
  );
};

type PredictionHorizon = "7 Hari" | "14 Hari";
const PREDICTION_HORIZONS: PredictionHorizon[] = ["7 Hari", "14 Hari"];

// ─── Helper ──────────────────────────────────────────────────────────────────

function mapApiPrediction(p: AIPredictionLogResponse, idx: number) {
  const rec = p.recommended_stock ?? Math.round(p.predicted_value);
  const forecast7d = p.horizon_days === 7 ? rec : Math.round(p.predicted_value);
  const forecast14d = p.horizon_days === 14 ? rec : Math.round(p.predicted_value * 2);
  const confidence =
    p.actual_value != null && p.actual_value > 0
      ? Math.max(60, Math.min(99, Math.round(100 * (1 - Math.abs(p.predicted_value - p.actual_value) / p.actual_value))))
      : 80;
  const priority = rec > 500 ? "Tinggi" : rec > 200 ? "Sedang" : "Rendah";
  return {
    rowKey: p.id,
    id: p.product_id ? p.product_id.substring(0, 8) : p.id.substring(0, 8),
    name: p.family ?? `Produk ${idx + 1}`,
    category: p.family ?? "—",
    stock: 0,
    forecast7d,
    forecast14d,
    confidence,
    trend: "Stabil",
    priority,
    deadline: p.predicted_for_date,
  };
}

export function PrediksiStokPage() {
  const { t } = useTranslation();
  const { role, user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isTechnical = role === "admin";
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState(false);
  const [horizon, setHorizon] = useState<PredictionHorizon>("7 Hari");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState(false);
  const [apiPredictions, setApiPredictions] = useState<AIPredictionLogResponse[]>([]);
  const [loadError, setLoadError] = useState("");
  const chartTheme = resolvedTheme === "dark" ? "dark" : "light";
  const axisProps = getAxisProps(chartTheme);
  const gridProps = getGridProps(chartTheme);
  const tooltipStyle = getTooltipContentStyle(chartTheme);

  useEffect(() => {
    if (isDemoDataEnabled()) return;
    setIsDataLoading(true);
    setLoadError("");
    fetchPredictions({ store_nbr: user?.storeNbr ?? undefined, limit: 200 })
      .then((data) => setApiPredictions(data))
      .catch(() => setLoadError(t("common.error_loading")))
      .finally(() => setIsDataLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.storeNbr]);

  // Mock Data needs to be localized for labels
  const WEEKLY_DEMAND_DATA = useMemo(() => [
    { name: t("day.mon"), prediksi: 450, batasAtas: 510, batasBawah: 390 },
    { name: t("day.tue"), prediksi: 420, batasAtas: 480, batasBawah: 360 },
    { name: t("day.wed"), prediksi: 480, batasAtas: 540, batasBawah: 420 },
    { name: t("day.thu"), prediksi: 510, batasAtas: 580, batasBawah: 440 },
    { name: t("day.fri"), prediksi: 680, batasAtas: 750, batasBawah: 610 },
    { name: t("day.sat"), prediksi: 850, batasAtas: 920, batasBawah: 780 },
    { name: t("day.sun"), prediksi: 790, batasAtas: 860, batasBawah: 720 },
  ], [t]);

  const CATEGORY_DATA = useMemo(() => {
    if (!isDemoDataEnabled() && apiPredictions.length > 0) {
      const groups: Record<string, number> = {};
      for (const p of apiPredictions) {
        const fam = p.family ?? "Lainnya";
        groups[fam] = (groups[fam] ?? 0) + (p.recommended_stock ?? Math.round(p.predicted_value));
      }
      return Object.entries(groups).map(([name, next]) => ({ name, cur: Math.round(next * 0.8), next }));
    }
    return [
      { name: t("cat.sembako"), cur: 4500, next: 5200 },
      { name: t("cat.minuman"), cur: 3200, next: 3800 },
      { name: t("cat.snack"), cur: 2800, next: 3100 },
      { name: t("cat.dairy"), cur: 1500, next: 1900 },
      { name: t("cat.frozen"), cur: 900, next: 850 },
      { name: t("cat.bakery"), cur: 1200, next: 1400 },
    ];
  }, [t, apiPredictions]);

  const FORECAST_PRODUCTS = useMemo(() => {
    if (!isDemoDataEnabled() && apiPredictions.length > 0) {
      return apiPredictions.map((p, i) => mapApiPrediction(p, i));
    }
    return [
      { id: "BR123", name: "Beras Premium 5kg", category: t("cat.sembako"), stock: 120, forecast7d: 450, forecast14d: 920, confidence: 96, trend: "Naik", priority: "Tinggi", deadline: "18 Apr" },
      { id: "ID456", name: "Indomie Goreng Spc", category: t("cat.snack"), stock: 1560, forecast7d: 1200, forecast14d: 2300, confidence: 92, trend: "Stabil", priority: "Rendah", deadline: "25 Apr" },
      { id: "TS789", name: "Teh Botol Sosro", category: t("cat.minuman"), stock: 850, forecast7d: 900, forecast14d: 1850, confidence: 88, trend: "Naik", priority: "Tinggi", deadline: "17 Apr" },
      { id: "SU012", name: "Susu Ultra 1L", category: t("cat.dairy"), stock: 45, forecast7d: 180, forecast14d: 350, confidence: 94, trend: "Naik", priority: "Tinggi", deadline: "17 Apr" },
      { id: "CP345", name: "Chitato Original", category: t("cat.snack"), stock: 320, forecast7d: 310, forecast14d: 640, confidence: 85, trend: "Turun", priority: "Sedang", deadline: "21 Apr" },
      { id: "GG678", name: "Gudang Garam Filter", category: t("cat.sembako"), stock: 110, forecast7d: 500, forecast14d: 950, confidence: 91, trend: "Naik", priority: "Tinggi", deadline: "17 Apr" },
      { id: "MS910", name: "Minyak SunCo 2L", category: t("cat.sembako"), stock: 15, forecast7d: 120, forecast14d: 250, confidence: 98, trend: "Naik", priority: "Tinggi", deadline: "16 Apr" },
      { id: "YB134", name: "Yakult Multipack", category: t("cat.dairy"), stock: 1200, forecast7d: 850, forecast14d: 1700, confidence: 89, trend: "Stabil", priority: "Rendah", deadline: "29 Apr" },
    ].map((product) => ({ rowKey: product.id, ...product }));
  }, [t, apiPredictions]);



  const filteredProducts = useMemo(() => {
    return FORECAST_PRODUCTS.filter(p => {
      const matchesCat = categoryFilter === "Semua" || p.category === t(`cat.${categoryFilter.toLowerCase()}`);
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [categoryFilter, search, FORECAST_PRODUCTS, t]);

  const handleUpdate = () => {
    setUpdating(true);
    const toastId = toast.loading(t("pred.toast.loading"));
    if (isDemoDataEnabled()) {
      setTimeout(() => {
        setUpdating(false);
        toast.success(t("pred.toast.done"), { id: toastId });
      }, 2000);
      return;
    }
    fetchPredictions({ store_nbr: user?.storeNbr ?? undefined, limit: 200 })
      .then((data) => { setApiPredictions(data); toast.success(t("pred.toast.done"), { id: toastId }); })
      .catch(() => { toast.error(t("common.error_loading"), { id: toastId }); })
      .finally(() => setUpdating(false));
  };

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className={cn("flex flex-col md:flex-row md:items-center justify-between", GAP.default)}>
        <div className={STACK.tight}>
          <h1 className={cn(T.h1, "text-slate-900 dark:text-slate-100")}>{t("pred.header")}</h1>
          <p className={cn(T.body, "text-slate-500 dark:text-slate-400 flex items-center gap-1.5")}>
            <Sparkles className={cn(ICON.sm, C.primary.icon)} />
            {t("pred.subheader")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowModelInfo(!showModelInfo)}
            className={showModelInfo ? btn("neutral", "sm") : btn("neutralSoft", "sm")}
          >
            {showModelInfo ? <ChevronUp className={ICON.sm} /> : <Info className={ICON.sm} />}
            {t("pred.info.title")}
          </button>
          <button 
            onClick={handleUpdate}
            disabled={updating}
            className={cn(btn("success", "sm"), "dark:bg-emerald-900/30 dark:hover:bg-emerald-900/40 dark:text-emerald-400 dark:shadow-none dark:border dark:border-emerald-800/50")}
          >
            <RefreshCcw className={cn(ICON.sm, updating && "animate-spin")} />
            {updating ? t("pred.btn.processing") : t("pred.btn.update")}
          </button>
        </div>
      </div>

      {!isDemoDataEnabled() && loadError && (
        <div className={cn("flex items-center gap-2 px-4 py-3 rounded-xl border text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/50", T.bodySm)}>
          <AlertCircle className="size-4 shrink-0" /> {loadError}
        </div>
      )}

      {/* Model Info Panel */}
      {showModelInfo && (
        <div className="overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-slate-900 rounded-xl p-5 text-white relative overflow-hidden shadow-xl border border-white/5 mb-6">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                  <div className="col-span-1 md:col-span-2 space-y-3">
                     <div className="flex items-center gap-3">
                        <div className={cn(R.sm, "p-2 bg-white/10")}><BrainCircuit className="size-5 text-indigo-400" /></div>
                        <div>
                           <h4 className={cn(T.h2)}>{isTechnical ? "XGBoost Ensemble v3.2" : t("pred.info.biz_title")}</h4>
                           <p className={cn(T.caption, "text-slate-500")}>{isTechnical ? "Active Model Status" : t("pred.info.biz_subtitle")}</p>
                        </div>
                     </div>
                     <p className={cn(T.caption, "text-slate-400 leading-relaxed italic")}>
                        {isTechnical ? t("pred.info.desc") : t("pred.info.biz_desc")}
                     </p>
                  </div>
                  <div className="grid grid-cols-2 gap-6 col-span-2">
                     <div>
                        <p className={cn(T.label, "text-slate-500 mb-0.5")}>{isTechnical ? t("pred.stats.reliability") : t("pred.stats.biz_accuracy")}</p>
                        <p className="text-xl font-bold text-emerald-400 font-data">94.3%</p>
                     </div>
                     {isTechnical ? (
                       <div>
                        <p className={cn(T.label, "text-slate-500 mb-0.5")}>{t("pred.stats.dataset")}</p>
                        <p className="text-xl font-bold font-data">128.4k</p>
                       </div>
                     ) : (
                       <div>
                        <p className={cn(T.label, "text-slate-500 mb-0.5")}>{t("pred.stats.biz_coverage")}</p>
                        <p className="text-xl font-bold font-data">8 {t("pred.stats.biz_categories")}</p>
                       </div>
                     )}
                     <div>
                        <p className={cn(T.label, "text-slate-500 mb-0.5")}>{isTechnical ? t("pred.stats.last_trained") : t("pred.stats.biz_last_update")}</p>
                        <p className={cn(T.dataSm, "font-bold")}>14 APR 26</p>
                     </div>
                     <div>
                        <p className={cn(T.label, "text-slate-500 mb-0.5")}>{isTechnical ? t("pred.stats.next_schedule") : t("pred.stats.biz_next_update")}</p>
                        <p className={cn(T.dataSm, "font-bold text-indigo-400")}>21 APR 26</p>
                     </div>
                  </div>
               </div>
            </div>
        </div>
      )}

      {/* Critial Alert */}
      <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 rounded-xl p-3 flex items-center justify-between gap-4 group">
         <div className="flex items-center gap-3">
            <div className={cn(R.sm, "size-8 bg-rose-500 text-white flex items-center justify-center shadow-md")}>
               <AlertTriangle className="size-4" />
            </div>
            <div>
               <h3 className={cn(T.buttonSm, "text-rose-900 dark:text-rose-300")}>{t("pred.alert.critical")}</h3>
               <p className={cn(T.caption, "text-rose-700 dark:text-rose-400 opacity-80 leading-none")}>{t("pred.alert.desc")}</p>
            </div>
         </div>
         <button className={cn(T.buttonSm, R.sm, "px-3 py-1.5 bg-white dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-500 transition-all cursor-pointer")}>
            {t("pred.alert.view_all")}
         </button>
      </div>

      {/* Analytics Grid */}
      <ErrorBoundary compact sectionName="Forecast Charts">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
         <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className={cn(T.h4, "text-slate-900 dark:text-slate-100 flex items-center gap-2")}>
               <TrendingUp className={cn(ICON.sm, C.primary.icon)} /> {t("pred.chart.weekly")}
            </h3>
            <div style={{ height: CHART_HEIGHT.md }}>
               {isDataLoading ? (
                  <ChartSkeleton minimal />
               ) : (
                  <ResponsiveContainer debounce={200} width="100%" height="100%">
                     <AreaChart data={WEEKLY_DEMAND_DATA}>
                        <defs>
                           <linearGradient id="predFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.primary.base} stopOpacity={0.1}/>
                              <stop offset="95%" stopColor={CHART_COLORS.primary.base} stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid {...gridProps} />
                        <XAxis dataKey="name" {...axisProps} tick={{ ...axisProps.tick, fontSize: 9, fontWeight: 700 }} />
                        <YAxis {...axisProps} tick={{ ...axisProps.tick, fontSize: 9, fontWeight: 700 }} width={30} />
                        <Tooltip 
                           contentStyle={tooltipStyle}
                        />
                        <Area type="monotone" dataKey="prediksi" stroke={CHART_COLORS.primary.base} strokeWidth={3} fillOpacity={1} fill="url(#predFill)" />
                     </AreaChart>
                  </ResponsiveContainer>
               )}
            </div>
         </div>

         <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className={cn(T.h4, "text-slate-900 dark:text-slate-100 flex items-center gap-2")}>
               <BarChart3 className={cn(ICON.sm, C.primary.icon)} /> {t("pred.chart.category")}
            </h3>
            <div style={{ height: CHART_HEIGHT.md }}>
               {isDataLoading ? (
                 <ChartSkeleton minimal type="bar-horizontal" />
               ) : (
                 <ResponsiveContainer debounce={200} width="100%" height="100%">
                    <BarChart data={CATEGORY_DATA} layout="vertical">
                       <XAxis type="number" hide />
                       <YAxis dataKey="name" type="category" {...axisProps} tick={{ ...axisProps.tick, fontSize: 9, fontWeight: 800 }} width={70} />
                       <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ ...tooltipStyle, borderRadius: '0.5rem', fontSize: '9px' }} />
                       <Bar dataKey="next" fill={CHART_COLORS.primary.base} radius={[0, 6, 6, 0]} barSize={14} />
                    </BarChart>
                 </ResponsiveContainer>
               )}
            </div>
         </div>
      </div>
      </ErrorBoundary>

      {/* DataTable */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
         <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-0.5">
               <h3 className={cn(T.h4, "text-slate-900 dark:text-slate-100")}>{t("pred.table.title")}</h3>
               <p className={cn(T.caption, "text-slate-400 dark:text-slate-500")}>Horizon: {horizon === "7 Hari" ? t("pred.horizon.7d") : t("pred.horizon.14d")}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative group">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-slate-400 dark:text-slate-500" />
                   <input 
                     type="text" placeholder={t("pred.search.sku")} value={search} onChange={(e) => setSearch(e.target.value)}
                     aria-label={t("pred.search.sku")}
                     className={cn(INPUT.base, INPUT.size.sm, "pl-8 pr-4 font-bold w-full sm:w-48", T.label)}
                   />
                </div>
                <div className="flex p-0.5 bg-slate-100/50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                   {PREDICTION_HORIZONS.map((h) => (
                     <button
                       key={h} onClick={() => setHorizon(h)}
                       className={cn(
                         cn(T.buttonSm, R.sm, "px-3 py-1 transition-all cursor-pointer"),
                         horizon === h ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                       )}
                     >
                       {h === "7 Hari" ? t("pred.horizon.7d") : t("pred.horizon.14d")}
                     </button>
                   ))}
                </div>
            </div>
         </div>

         <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-slate-800">
            {["Semua", "Sembako", "Minuman", "Snack", "Dairy"].map((cat) => (
              <button
                key={cat} onClick={() => setCategoryFilter(cat)}
                className={cn(
                  cn(T.buttonSm, R.full, "px-3 py-1 border transition-all cursor-pointer"),
                  categoryFilter === cat ? "bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600" : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500"
                )}
              >
                {cat === "Semua" ? t("cat.all") : t(`cat.${cat.toLowerCase()}`)}
              </button>
            ))}
         </div>

         {isDataLoading ? (
            <PredictionTableSkeleton />
         ) : (
            <ResponsiveTable
              label={t("pred.table.title")}
              scrollerClassName="rounded-none border-0 bg-transparent"
              minWidthClassName={TABLE.minWidth.forecast}
            >
               <table className={TABLE.base} aria-label={t("pred.table.title")}>
                  <thead className={TABLE.head}>
                     <tr>
                        <th className={cn(TABLE.headCell, TABLE.stickyColumn, "bg-slate-50 dark:bg-slate-800/50")}>{t("pred.table.product")}</th>
                        <th className={TABLE.headCellNumeric}>{t("pred.table.current")}</th>
                        <th className={TABLE.headCellNumeric}>{t("pred.table.forecast")}</th>
                        <th className={TABLE.headCell}>{t("pred.table.confidence")}</th>
                        <th className={TABLE.headCell}>{t("pred.table.deadline")}</th>
                        <th className={TABLE.headCell}>{t("pred.table.priority")}</th>
                     </tr>
                  </thead>
                  <tbody className={TABLE.body}>
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((p) => {
                         const forecast = horizon === "7 Hari" ? p.forecast7d : p.forecast14d;
                         const deficit = p.stock < forecast;
                         return (
                          <tr key={p.rowKey} className={cn(TABLE.row, TABLE.rowHover, "group", deficit && "bg-rose-50/20 dark:bg-rose-900/10")}>
                             <td className={cn(
                               TABLE.cell,
                               TABLE.stickyColumn,
                               deficit
                                 ? "bg-rose-50 dark:bg-rose-950/30 group-hover:bg-rose-50 dark:group-hover:bg-rose-900/20"
                                 : "bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50"
                             )}>
                                <div className="flex flex-col">
                                   <span className={cn(T.bodySm, "font-bold text-slate-900 dark:text-slate-100")}>{p.name}</span>
                                   <span className={cn(T.caption, "text-slate-500 dark:text-slate-400")}>{p.id} • {p.category}</span>
                                </div>
                             </td>
                             <td className={TABLE.cellNumeric}>
                                <span className={cn(T.dataSm, "font-bold", p.stock < forecast ? "text-rose-500 dark:text-rose-400" : "text-slate-900 dark:text-slate-100")}>{p.stock}</span>
                             </td>
                             <td className={TABLE.cellNumeric}>
                                <div className="flex flex-col items-end">
                                   <span className={cn(T.dataSm, "font-bold", deficit ? "text-rose-600 dark:text-rose-400" : "text-indigo-600 dark:text-indigo-400")}>~{forecast}</span>
                                   {deficit && <span className={cn(T.caption, "font-bold text-rose-500 dark:text-rose-400")}>{t("pred.gap", { count: forecast - p.stock })}</span>}
                                </div>
                             </td>
                             <td className={TABLE.cell}>
                                <div className="space-y-1">
                                   <span className={cn(T.dataSm, "font-bold text-slate-600 dark:text-slate-400")}>{p.confidence}%</span>
                                   <div className="w-12 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                      <div className={cn("h-full", p.confidence > 90 ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${p.confidence}%` }} />
                                   </div>
                                </div>
                             </td>
                             <td className={TABLE.cell}>
                                <div className={cn(T.dataSm, "flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-400")}>
                                   <Calendar className="w-3 h-3 text-slate-400" /> {p.deadline}
                                </div>
                             </td>
                             <td className={TABLE.cell}><PriorityBadge level={p.priority} /></td>
                          </tr>
                         );
                      })
                    ) : (
                      <tr><td className={TABLE.cell} colSpan={6}><EmptyState title={t("pred.empty.title")} description={t("pred.empty.desc")} /></td></tr>
                    )}
                  </tbody>
               </table>
            </ResponsiveTable>
         )}

         <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className={cn(T.caption, "text-slate-500")}>{t("pred.found", { count: filteredProducts.length })}</p>
            <div className="flex gap-1">
               <button aria-label={t("common.page_1")} aria-current="page" className={cn("w-7 h-7 flex items-center justify-center bg-slate-900 dark:bg-indigo-600 text-white", T.buttonSm, R.sm)}>1</button>
               <button aria-label={t("common.next_page")} className={cn("w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 transition-all cursor-pointer", T.buttonSm, R.sm)}><ChevronRight className="w-3 h-3" aria-hidden="true" /></button>
            </div>
         </div>
      </div>
    </div>
  );
}
