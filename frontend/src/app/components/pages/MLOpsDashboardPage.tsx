"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Legend,
} from "recharts";
import {
  CheckCircle2, AlertTriangle, XCircle,
  RefreshCw, Clock, TrendingUp, TrendingDown,
  Play, Pause, RotateCcw, Download, ChevronDown, Info,
  Server, Cpu, Archive,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { CHART_COLORS, getAxisProps, getChartColors, getGridProps, getTooltipContentStyle } from "@/app/lib/charts";
import { C } from "@/app/lib/colors";
import { T } from "@/app/lib/typography";
import { R, R_COMPONENT } from "@/app/lib/radii";
import { formatNumber } from "@/app/lib/format";
import { GAP, ICON, PAD } from "@/app/lib/spacing";
import { btn } from "@/app/lib/buttons";
import { E_COMPONENT } from "@/app/lib/elevation";
import { toast } from "sonner";
import { ErrorBoundary } from "../ErrorBoundary";
import { useTranslation } from "@/app/i18n";
import { StableResponsiveContainer as ResponsiveContainer } from "@/app/components/charts/StableResponsiveContainer";
import { MLOpsDashboardSkeleton } from "@/app/components/Skeletons";
import { isDemoDataEnabled } from "@/app/lib/demo-mode";
import { useAuth } from "@/app/context/AuthContext";
import { fetchModelMetrics, type AIModelMetricResponse } from "@/app/lib/intelligence-client";

type ServiceStatus = "online" | "degraded" | "offline";

interface ModelVersion {
  version: string;
  trainedAt: string;
  accuracy: number;
  mape: number;
  rmse: number;
  samples: number;
  status: "active" | "archived" | "staging";
}

interface TrainingJob {
  id: string;
  model: string;
  trigger: "scheduled" | "manual" | "drift";
  startedAt: string;
  duration: string;
  samples: number;
  accuracy: number;
  status: "success" | "failed" | "running";
}

type AccuracyTimelinePoint = {
  date: string;
  v1: number | null;
  v2: number | null;
  v3: number | null;
};

type FeatureImportanceMetric = {
  feature: string;
  importance: number;
};

type CategoryMetric = {
  category: string;
  mape: number;
  accuracy: number;
  drift: boolean;
};

type ServiceHealth = {
  label: string;
  status: ServiceStatus;
  uptime: string;
  icon: LucideIcon;
  detail: string;
};

type ActiveModelKpi = {
  labelKey: string;
  value: string;
  delta: string;
  up: boolean;
  icon: LucideIcon;
};

type MlopsDashboardData = {
  periodLabel: string;
  accuracyTimeline: AccuracyTimelinePoint[];
  featureImportance: FeatureImportanceMetric[];
  categoryMetrics: CategoryMetric[];
  activeModelKpis: ActiveModelKpi[];
  trainingJobs: TrainingJob[];
  modelVersions: ModelVersion[];
  services: ServiceHealth[];
};

const EMPTY_MLOPS_DASHBOARD: MlopsDashboardData = {
  periodLabel: "",
  accuracyTimeline: [],
  featureImportance: [],
  categoryMetrics: [],
  activeModelKpis: [],
  trainingJobs: [],
  modelVersions: [],
  services: [],
};

// ─── Helper: build partial dashboard from real metrics ────────────────────────────

function buildMlopsFromMetrics(metrics: AIModelMetricResponse[]): MlopsDashboardData {
  if (!metrics.length) return EMPTY_MLOPS_DASHBOARD;

  // Group by model_name
  const byModel: Record<string, AIModelMetricResponse[]> = {};
  for (const m of metrics) {
    (byModel[m.model_name] ??= []).push(m);
  }
  const modelNames = Object.keys(byModel);

  // Helper: latest value of a specific metric for a given model
  const getLatest = (model: string, metricName: string): number | undefined => {
    const rows = (byModel[model] ?? [])
      .filter((m) => m.metric_name === metricName)
      .sort((a, b) => new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime());
    return rows[0]?.metric_value;
  };

  // --- accuracyTimeline: pivot by model_name, grouped by date ---
  const timeMap: Record<string, AccuracyTimelinePoint> = {};
  for (const m of metrics) {
    if (m.metric_name !== "accuracy" && m.metric_name !== "r_squared") continue;
    const day = m.evaluated_at.substring(0, 10);
    timeMap[day] ??= { date: day, v1: null, v2: null, v3: null };
    const val = parseFloat((m.metric_value * 100).toFixed(1));
    const idx = modelNames.indexOf(m.model_name);
    if (idx === 0) timeMap[day].v1 = val;
    else if (idx === 1) timeMap[day].v2 = val;
    else if (idx === 2) timeMap[day].v3 = val;
  }
  const accuracyTimeline = Object.values(timeMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  // --- modelVersions ---
  const modelVersions: ModelVersion[] = modelNames.map((name, idx) => {
    const acc = getLatest(name, "accuracy") ?? getLatest(name, "r_squared") ?? 0;
    const rmse = getLatest(name, "rmse") ?? 0;
    const mape = getLatest(name, "mape") ?? 0;
    const latest = [...(byModel[name] ?? [])].sort(
      (a, b) => new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime()
    )[0];
    return {
      version: name,
      trainedAt: latest?.evaluated_at.substring(0, 10) ?? "—",
      accuracy: parseFloat((acc * 100).toFixed(1)),
      mape: parseFloat(mape.toFixed(1)),
      rmse: parseFloat(rmse.toFixed(2)),
      samples: 0,
      status: idx === 0 ? "active" : "archived",
    };
  });

  // --- activeModelKpis: latest across all models ---
  const globalLatest: Record<string, number> = {};
  for (const m of [...metrics].sort(
    (a, b) => new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime()
  )) {
    globalLatest[m.metric_name] ??= m.metric_value;
  }
  const activeModelKpis: ActiveModelKpi[] = [];
  const acc = globalLatest["accuracy"] ?? globalLatest["r_squared"];
  if (acc != null) {
    activeModelKpis.push({ labelKey: "mlops.kpi.accuracy", value: `${(acc * 100).toFixed(1)}%`, delta: "Live", up: true, icon: TrendingUp });
  }
  if (globalLatest["rmse"] != null) {
    activeModelKpis.push({ labelKey: "mlops.kpi.rmse", value: globalLatest["rmse"].toFixed(2), delta: "Live", up: false, icon: TrendingDown });
  }
  if (globalLatest["mape"] != null) {
    activeModelKpis.push({ labelKey: "mlops.kpi.mape", value: `${globalLatest["mape"].toFixed(1)}%`, delta: "Live", up: false, icon: TrendingDown });
  }

  return {
    periodLabel: new Date().toLocaleDateString("id-ID"),
    accuracyTimeline,
    modelVersions,
    activeModelKpis,
    featureImportance: [],
    categoryMetrics: [],
    trainingJobs: [],
    services: [],
  };
}

export function MLOpsDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"overview" | "training" | "versions">("overview");
  const [isRetraining, setIsRetraining] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<MlopsDashboardData>(EMPTY_MLOPS_DASHBOARD);
  const chartTheme = resolvedTheme === "dark" ? "dark" : "light";
  const chartColors = getChartColors(chartTheme);
  const axisProps = getAxisProps(chartTheme);
  const gridProps = getGridProps(chartTheme);
  const tooltipStyle = getTooltipContentStyle(chartTheme);
  const {
    periodLabel,
    accuracyTimeline,
    featureImportance,
    categoryMetrics,
    activeModelKpis,
    trainingJobs,
    modelVersions,
    services,
  } = dashboardData;

  useEffect(() => {
    if (isDemoDataEnabled()) {
      let cancelled = false;
      void import("@/app/demo/mlops-dashboard").then(({ DEMO_MLOPS_DASHBOARD }) => {
        if (!cancelled) {
          setDashboardData(DEMO_MLOPS_DASHBOARD);
          setIsDataLoading(false);
        }
      });
      return () => { cancelled = true; };
    }

    // Non-demo: fetch real metrics from backend
    setIsDataLoading(true);
    fetchModelMetrics({ store_nbr: user?.storeNbr ?? undefined, limit: 200 })
      .then((metrics) => setDashboardData(buildMlopsFromMetrics(metrics)))
      .catch(() => { /* stay with EMPTY_MLOPS_DASHBOARD on error */ })
      .finally(() => setIsDataLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.storeNbr]);

  if (isDataLoading) {
    return (
      <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
        <MLOpsDashboardSkeleton />
      </div>
    );
  }

  const STATUS_CONFIG: Record<ServiceStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
    online:   { label: t("mlops.status.online"),   color: C.success.text, bg: C.success.bg, border: C.success.border, dot: "bg-emerald-500" },
    degraded: { label: t("mlops.status.degraded"), color: C.warning.text, bg: C.warning.bg, border: C.warning.border, dot: "bg-amber-500" },
    offline:  { label: t("mlops.status.offline"),  color: C.destructive.text, bg: C.destructive.bg, border: C.destructive.border, dot: "bg-rose-500" },
  };

  const JOB_STATUS_CONFIG = {
    success: { label: t("mlops.job.success"), color: C.success.text, bg: C.success.bg, border: C.success.border },
    failed:  { label: t("mlops.job.failed"),  color: C.destructive.text, bg: C.destructive.bg, border: C.destructive.border },
    running: { label: t("mlops.job.running"), color: C.primary.text, bg: C.primary.bg, border: C.primary.border },
  };

  const MODEL_STATUS_CONFIG = {
    active: {
      label: t("mlops.versions.active"),
      icon: CheckCircle2,
      className: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50",
    },
    staging: {
      label: t("mlops.versions.staging"),
      icon: Clock,
      className: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50",
    },
    archived: {
      label: t("mlops.versions.archived"),
      icon: Archive,
      className: "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700",
    },
  };

  const TRIGGER_LABEL = {
    scheduled: t("mlops.trigger.scheduled"),
    manual: t("mlops.trigger.manual"),
    drift: t("mlops.trigger.drift"),
  };

  const handleRetrain = () => {
    setIsRetraining(true);
    const toastId = toast.loading(t("mlops.toast.retrain_start"));
    setTimeout(() => {
      setIsRetraining(false);
      toast.success(t("mlops.toast.retrain_done"), { id: toastId });
    }, 3000);
  };

  return (
    <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
      {/* Header */}
      <div className={cn("flex flex-col md:flex-row md:items-center justify-between", GAP.default)}>
        <div>
          <h1 className={cn(T.h1, "text-slate-900 dark:text-slate-100")}>{t("mlops.header")}</h1>
          <p className={cn(T.body, "text-slate-500 dark:text-slate-400")}>{t("mlops.subheader")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => toast.success(t("mlops.toast.export_done"))} className={btn("neutralSoft", "md")}>
            <Download className={ICON.sm} /> {t("mlops.btn.export")}
          </button>
          <button
            onClick={handleRetrain}
            disabled={isRetraining}
            className={cn(btn("primary", "md"), "dark:bg-indigo-900/30 dark:hover:bg-indigo-900/40 dark:text-indigo-400 dark:shadow-none dark:border dark:border-indigo-800/50")}
          >
            {isRetraining
              ? <><RefreshCw className={cn(ICON.sm, "animate-spin")} /> {t("mlops.btn.retraining")}</>
              : <><Play className={ICON.sm} /> {t("mlops.btn.retrain")}</>
            }
          </button>
        </div>
      </div>

      {/* Service Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((svc, i) => {
          const cfg = STATUS_CONFIG[svc.status];
          const Icon = svc.icon;
          return (
            <div key={i} className={cn("bg-white dark:bg-slate-900 border", PAD.cardCompact, R_COMPONENT.card, E_COMPONENT.card, cfg.border)}>
              <div className="flex items-center justify-between mb-3">
                <div className={cn("w-9 h-9 flex items-center justify-center", R_COMPONENT.iconBox, cfg.bg)}>
                  <Icon className={cn("w-4 h-4", cfg.color)} />
                </div>
                <span className={cn(T.micro, R.full, "flex items-center gap-1 px-2 py-0.5 border", cfg.bg, cfg.color, cfg.border)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", cfg.dot)} />
                  {cfg.label}
                </span>
              </div>
              <p className={cn(T.bodySm, "font-bold text-slate-900 dark:text-slate-100")}>{svc.label}</p>
              <p className={cn(T.caption, "text-slate-400 dark:text-slate-500 mt-0.5 truncate")}>{svc.detail}</p>
              <p className={cn(T.caption, C.success.icon, "mt-2")}>{t("mlops.uptime", { value: svc.uptime })}</p>
            </div>
          );
        })}
      </div>

      {/* Active Model KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {activeModelKpis.map((m, i) => (
          <div key={i} className={cn("bg-white dark:bg-slate-900 border", PAD.cardCompact, R_COMPONENT.kpi, E_COMPONENT.card, C.neutral.border)}>
            <div className="flex items-center justify-between mb-2">
              <span className={cn(T.label, "text-slate-400 dark:text-slate-500")}>{t(m.labelKey)}</span>
              <m.icon className={cn(ICON.sm, C.neutral.icon)} />
            </div>
            <p className={cn(T.kpiCard, "text-slate-900 dark:text-slate-100 tracking-tighter")}>{m.value}</p>
            <p className={cn(T.caption, "mt-1 flex items-center gap-1", m.up ? C.success.icon : C.destructive.icon)}>
              {m.up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {m.delta}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={cn("flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 w-fit", R.md)} role="tablist" aria-label={t("mlops.aria.sections")}>
        {(["overview", "training", "versions"] as const).map(tab => (
          <button key={tab} id={`tab-${tab}`} onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`mlops-tabpanel-${tab}`}
            className={cn(
              "px-5 py-2 transition-all cursor-pointer", R.sm, T.buttonSm,
              activeTab === tab ? cn("bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100", E_COMPONENT.card) : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            {tab === "overview" ? t("mlops.tab.overview") : tab === "training" ? t("mlops.tab.training") : t("mlops.tab.versions")}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div role="tabpanel" id="mlops-tabpanel-overview" aria-labelledby="tab-overview">
        <ErrorBoundary compact sectionName="ML Overview Charts">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Accuracy Timeline */}
          <div className={cn("bg-white dark:bg-slate-900 p-6 border", R_COMPONENT.card, E_COMPONENT.card, C.neutral.border)}>
            <div className="mb-4">
              <p className={cn("text-slate-400 dark:text-slate-500 uppercase tracking-widest", T.label)}>{t("mlops.chart.accuracy_title")}</p>
              <p className={cn(T.bodySm, "font-bold text-slate-900 dark:text-slate-100 mt-0.5")}>{periodLabel}</p>
            </div>
            <ResponsiveContainer debounce={200} width="100%" height={200}>
              <LineChart data={accuracyTimeline}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" {...axisProps} tick={{ ...axisProps.tick, fontSize: 9, fontWeight: 700 }} />
                <YAxis domain={[90, 96]} {...axisProps} tick={{ ...axisProps.tick, fontSize: 9, fontWeight: 700 }} />
                <Tooltip contentStyle={{ ...tooltipStyle, borderRadius: "12px", fontSize: "11px", fontWeight: 700 }} />
                <ReferenceLine y={90} stroke={chartColors.tooltipBorder} strokeDasharray="3 3" />
                <Line dataKey="v1" stroke={chartColors.axisStroke} strokeWidth={2} dot={false} connectNulls name="v3.1.x" />
                <Line dataKey="v2" stroke={CHART_COLORS.primary.light} strokeWidth={2} dot={false} connectNulls name="v3.1.5" />
                <Line dataKey="v3" stroke={CHART_COLORS.primary.dark} strokeWidth={2.5} dot={{ fill: CHART_COLORS.primary.dark, r: 3 }} connectNulls name="v3.2.x" />
                <Legend wrapperStyle={{ color: chartColors.axisTick, fontSize: "9px", fontWeight: 700 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Feature Importance */}
          <div className={cn("bg-white dark:bg-slate-900 p-6 border", R_COMPONENT.card, E_COMPONENT.card, C.neutral.border)}>
            <div className="mb-4">
              <p className={cn("text-slate-400 dark:text-slate-500 uppercase tracking-widest", T.label)}>{t("mlops.chart.feature_title")}</p>
              <p className={cn(T.bodySm, "font-bold text-slate-900 dark:text-slate-100 mt-0.5")}>{t("mlops.chart.feature_subtitle")}</p>
            </div>
            <ResponsiveContainer debounce={200} width="100%" height={200}>
              <BarChart data={featureImportance} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" domain={[0, 0.3]} {...axisProps} tick={{ ...axisProps.tick, fontSize: 9, fontWeight: 700 }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                <YAxis type="category" dataKey="feature" width={130} {...axisProps} tick={{ ...axisProps.tick, fontSize: 9, fontWeight: 700 }} />
                <Tooltip formatter={(v) => [`${(Number(v) * 100).toFixed(1)}%`, "Importance"]} contentStyle={{ ...tooltipStyle, borderRadius: "12px", fontSize: "11px", fontWeight: 700 }} />
                <Bar dataKey="importance" fill={CHART_COLORS.primary.dark} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Per-Category Metrics */}
          <div className={cn("bg-white dark:bg-slate-900 p-6 border lg:col-span-2", R_COMPONENT.card, E_COMPONENT.card, C.neutral.border)}>
            <div className="mb-4">
              <p className={cn("text-slate-400 dark:text-slate-500 uppercase tracking-widest", T.label)}>{t("mlops.chart.category_title")}</p>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {categoryMetrics.map((m, i) => (
                <div key={i} className="py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                  <div className="flex items-center gap-2 w-28">
                    <p className={cn(T.bodySm, "font-bold text-slate-800 dark:text-slate-200")}>{m.category}</p>
                    {m.drift && (
                      <span className={cn(T.micro, R.xs, "inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-400")}>
                        <AlertTriangle className="size-3" aria-hidden="true" />
                        {t("mlops.status.drift")}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(T.label, "text-slate-400 dark:text-slate-500")}>{t("mlops.section.accuracy")}</span>
                      <span className={cn("text-slate-700 dark:text-slate-300", T.label)}>{m.accuracy}%</span>
                    </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5" role="progressbar" aria-valuenow={m.accuracy} aria-valuemin={90} aria-valuemax={96} aria-label={t("mlops.aria.category_accuracy", { category: m.category })}>
                        <div className={cn("h-1.5 rounded-full transition-all", m.accuracy >= 94 ? "bg-emerald-500" : m.accuracy >= 92 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${Math.min(100, ((m.accuracy - 90) / 6) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="text-center min-w-[80px]">
                    <p className={cn(T.label, "text-slate-400")}>MAPE</p>
                    <p className={cn(T.bodySm, "font-bold", m.mape <= 5 ? "text-emerald-600" : m.mape <= 7 ? "text-amber-600" : "text-rose-600")}>{m.mape}%</p>
                  </div>
                  <div className="text-right">
                    {m.drift
                      ? <span className={cn(T.caption, C.warning.icon, "flex items-center gap-1")}><AlertTriangle className="w-3 h-3" /> {t("mlops.section.need_retrain")}</span>
                      : <span className={cn(T.caption, C.success.icon, "flex items-center gap-1")}><CheckCircle2 className="w-3 h-3" /> {t("mlops.section.normal")}</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </ErrorBoundary>
        </div>
      )}

      {/* Tab: Training Jobs */}
      {activeTab === "training" && (
        <div role="tabpanel" id="mlops-tabpanel-training" aria-labelledby="tab-training" className={cn("bg-white dark:bg-slate-900 overflow-hidden border", R_COMPONENT.card, E_COMPONENT.card, C.neutral.border)}>
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className={cn("text-slate-400 dark:text-slate-500 uppercase tracking-widest", T.label)}>{t("mlops.training.title")}</p>
            <button onClick={handleRetrain} disabled={isRetraining} className={btn("primarySoft", "sm")}>
              {isRetraining ? <RefreshCw className={cn(ICON.xs, "animate-spin")} /> : <Play className={ICON.xs} />}
              {isRetraining ? t("mlops.btn.retraining") : t("mlops.training.run")}
            </button>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {trainingJobs.map(job => {
              const sc = JOB_STATUS_CONFIG[job.status];
              return (
                <div key={job.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors">
                  <div className={cn("w-9 h-9 flex items-center justify-center flex-shrink-0 border", R_COMPONENT.iconBox, sc.bg, sc.border)}>
                    {job.status === "success" ? <CheckCircle2 className={cn("w-4 h-4", sc.color)} /> : job.status === "failed" ? <XCircle className={cn("w-4 h-4", sc.color)} /> : <RefreshCw className={cn("w-4 h-4 animate-spin", sc.color)} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(T.bodySm, "font-bold text-slate-900 dark:text-slate-100")}>{job.model}</p>
                      <span className={cn(T.micro, R.xs, "px-1.5 py-0.5 border", sc.bg, sc.color, sc.border)}>{sc.label}</span>
                    </div>
                    <p className={cn(T.caption, "text-slate-400 dark:text-slate-500 mt-0.5")}>{job.id} · {TRIGGER_LABEL[job.trigger]} · {job.startedAt}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <p className={cn(T.label, "text-slate-400 dark:text-slate-500")}>{t("mlops.training.duration")}</p>
                      <p className={cn(T.bodySm, "font-bold text-slate-700 dark:text-slate-300")}>{job.duration}</p>
                    </div>
                    <div>
                      <p className={cn(T.label, "text-slate-400 dark:text-slate-500")}>{t("mlops.training.samples")}</p>
                      <p className={cn(T.bodySm, "font-bold text-slate-700 dark:text-slate-300")}>{formatNumber(job.samples)}</p>
                    </div>
                    <div>
                      <p className={cn(T.label, "text-slate-400 dark:text-slate-500")}>{t("mlops.kpi.accuracy")}</p>
                      <p className={cn(T.bodySm, "font-bold", job.status === "failed" ? "text-slate-400 dark:text-slate-600" : "text-indigo-600 dark:text-indigo-400")}>{job.status === "failed" ? "—" : `${job.accuracy}%`}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Model Versions */}
      {activeTab === "versions" && (
        <div role="tabpanel" id="mlops-tabpanel-versions" aria-labelledby="tab-versions" className={cn("bg-white dark:bg-slate-900 overflow-hidden border", R_COMPONENT.card, E_COMPONENT.card, C.neutral.border)}>
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <p className={cn("text-slate-400 dark:text-slate-500 uppercase tracking-widest", T.label)}>{t("mlops.versions.title")}</p>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {modelVersions.map(v => {
              const modelStatus = MODEL_STATUS_CONFIG[v.status];
              const ModelStatusIcon = modelStatus.icon;

              return (
              <div key={v.version} className={cn("px-6 py-5 flex items-center gap-6 hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors", v.status === "active" && "bg-indigo-50/20 dark:bg-indigo-900/10")}>
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-1">
                    <p className={cn(T.code, "text-slate-900 dark:text-slate-100")}>{v.version}</p>
                    <span className={cn(
                      cn(T.micro, R.full, "inline-flex items-center gap-1 px-2 py-0.5"),
                      modelStatus.className
                    )}>
                      <ModelStatusIcon className="size-3" aria-hidden="true" />
                      {modelStatus.label}
                    </span>
                  </div>
                  <p className={cn(T.caption, "text-slate-400 dark:text-slate-500")}>{t("mlops.versions.trained")} {v.trainedAt} · {formatNumber(v.samples)} {t("mlops.versions.samples")}</p>
                </div>
                <div className="grid grid-cols-3 gap-8 text-center">
                  {[
                    { label: t("mlops.kpi.accuracy"), val: `${v.accuracy}%`, color: "text-indigo-600" },
                    { label: t("mlops.kpi.mape"), val: `${v.mape}%`, color: "text-amber-600" },
                    { label: t("mlops.kpi.rmse"), val: `${v.rmse}`, color: "text-slate-700 dark:text-slate-300" },
                  ].map((m, i) => (
                    <div key={i}>
                      <p className={cn(T.label, "text-slate-400 dark:text-slate-500")}>{m.label}</p>
                      <p className={cn(T.bodySm, "font-bold", m.color)}>{m.val}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {v.status !== "active" && (
                    <button className={cn(T.buttonSm, R.md, "px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all")}>
                      {t("mlops.versions.promote")}
                    </button>
                  )}
                  {v.status === "staging" && (
                    <button className={cn(T.buttonSm, R.md, "px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all")}>
                      {t("mlops.versions.rollback")}
                    </button>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
