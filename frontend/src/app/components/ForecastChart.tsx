"use client";

import {
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Area,
  AreaChart,
} from "recharts";
import { useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { R } from "@/app/lib/radii";
import { E } from "@/app/lib/elevation";
import { formatNumber } from "@/app/lib/format";
import { Info, Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { useTranslation } from "@/app/i18n";
import { CHART_COLORS, CHART_HEIGHT, getAxisProps, getChartColors, getGridProps } from "@/app/lib/charts";
import { StableResponsiveContainer as ResponsiveContainer } from "@/app/components/charts/StableResponsiveContainer";

interface ForecastPoint {
  name: string;
  actual: number;
  predicted: number;
  ciUpper: number;
  ciLower: number;
  ciRange: [number, number];
  event: string | null;
}

interface ForecastTooltipPayload {
  value?: number;
  payload: ForecastPoint;
}

// Deterministic data generator with 20% Confidence Interval
const generateData = (days: number): ForecastPoint[] => {
  const data: ForecastPoint[] = [];
  const baseValue = 500;
  for (let i = 1; i <= days; i++) {
    const dayOfMonth = (i % 30) || 30;
    const paydayEffect = (dayOfMonth >= 25 || dayOfMonth <= 2) ? 1.5 : 1.0;
    const weeklyEffect = (i % 7 === 5 || i % 7 === 6) ? 1.2 : 0.9;
    
    const noise = Math.sin(i * 0.5) * 50; 
    const actual = Math.floor((baseValue + noise) * weeklyEffect * paydayEffect);
    const predicted = Math.floor(actual * (0.95 + Math.sin(i * 1.5) * 0.1)); 
    
    // 20% Confidence Interval
    const ciUpper = Math.floor(predicted * 1.2);
    const ciLower = Math.floor(predicted * 0.8);

    data.push({
      name: `Apr ${i}`,
      actual,
      predicted,
      ciUpper,
      ciLower,
      ciRange: [ciLower, ciUpper],
      event: dayOfMonth === 25 ? "Gajian" : dayOfMonth === 1 ? "Awal Bulan" : null
    });
  }
  return data;
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ForecastTooltipPayload[];
  label?: string;
}) => {
  const { t } = useTranslation();
  if (active && payload && payload.length) {
    const actual = payload[1]?.value; // Actual is at index 1 due to CI area being index 0
    const predicted = payload[2]?.value; 
    const diff = Math.abs((actual ?? 0) - (predicted ?? 0));
    const event = payload[0]?.payload.event;

    return (
      <div className={cn(R.xl, E["2xl"], "bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl p-5 border border-slate-200 dark:border-slate-800 min-w-[220px]")}
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
           <p className={cn(T.label, "text-slate-900 dark:text-slate-100")}>{label}</p>
           {event && <span className={cn(T.micro, R.sm, "bg-indigo-600 text-white px-2 py-0.5")}>{event}</span>}
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-2">
               <div className="size-2 rounded-full bg-indigo-600" />
               <span className={cn(T.label, "text-slate-600 dark:text-slate-400")}>{t("chart.tooltip.actual")}</span>
            </div>
            <span className={cn(T.dataEmphasis, "text-slate-900 dark:text-slate-100")}>{formatNumber(actual ?? 0)} <span className={cn(T.caption, "text-slate-500 capitalize")}>{t("table.unit")}</span></span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <div className="size-2 rounded-full bg-emerald-600" />
               <span className={cn(T.label, "text-slate-600 dark:text-slate-400")}>{t("chart.tooltip.ai")}</span>
            </div>
            <span className={cn(T.dataEmphasis, "text-slate-900 dark:text-slate-100")}>{formatNumber(predicted ?? 0)} <span className={cn(T.caption, "text-slate-500 capitalize")}>{t("table.unit")}</span></span>
          </div>
        </div>

        <div className={cn(
          "mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between",
          diff > 100 ? "text-rose-500" : "text-emerald-500"
        )}>
          <div className="flex items-center gap-1.5">
             {diff > 100 ? <AlertCircle className="size-3.5" /> : <TrendingUp className="size-3.5" />}
             <span className={cn(T.caption, "leading-none")}>
                {diff > 100 ? t("chart.alert.drift") : t("chart.alert.confidence")}
             </span>
          </div>
          <span className={T.dataEmphasis}>Δ {diff}</span>
        </div>
      </div>
    );
  }
  return null;
};

export function ForecastChart() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const [range, setRange] = useState("chart.range.14d");
  const [showCI, setShowCI] = useState(true);
  const chartTheme = resolvedTheme === "dark" ? "dark" : "light";
  const chartColors = getChartColors(chartTheme);
  const axisProps = getAxisProps(chartTheme);
  const gridProps = getGridProps(chartTheme);
  
  const rangeToDays: Record<string, number> = {
    "chart.range.7d": 7,
    "chart.range.14d": 14,
    "chart.range.21d": 21,
    "chart.range.28d": 28
  };

  const data = generateData(rangeToDays[range] || 14);

  return (
    <div className={cn(R.xl, E.sm, "bg-white dark:bg-slate-900 p-8 border border-slate-100 dark:border-slate-800 relative overflow-hidden group")}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className={cn(R.lg, E.glowPrimary, "size-10 bg-indigo-600 flex items-center justify-center")}>
                <Sparkles className="size-5 text-white" />
             </div>
             <h3 className={cn(T.h1, "text-slate-900 dark:text-slate-100")}>
                {t("chart.title")}
             </h3>
          </div>
          <p className={cn(T.bodySm, "text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 max-w-xl")}>
            {t("chart.desc", { margin: "±20%" })}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           {/* CI Toggle */}
           <button 
             onClick={() => setShowCI(!showCI)}
             className={cn(
               T.buttonSm, R.md, "px-4 py-2 transition-all border cursor-pointer",
               showCI ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-600" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400"
             )}
           >
              {showCI ? t("chart.conf.on") : t("chart.conf.off")}
           </button>

           <div className={cn(R.lg, "flex p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100/50 dark:border-slate-700")}>
             {Object.keys(rangeToDays).map((r) => (
               <button
                 key={r}
                 onClick={() => setRange(r)}
                 className={cn(
                   T.buttonSm, R.md, "px-5 py-2.5 transition-all cursor-pointer",
                   range === r 
                     ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-100/50 dark:shadow-indigo-900/50 border border-slate-100 dark:border-slate-700" 
                     : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                 )}
               >
                 {t(r)}
               </button>
             ))}
           </div>
        </div>
      </div>

      <div className="w-full relative z-10" style={{ height: CHART_HEIGHT.xl }}>
        <ResponsiveContainer debounce={200} width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -10, bottom: 20 }}>
            <defs>
              <linearGradient id="colorCI" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.primary.light} stopOpacity={0.15}/>
                <stop offset="95%" stopColor={CHART_COLORS.primary.light} stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <CartesianGrid {...gridProps} strokeDasharray="5 5" />
            <XAxis 
              dataKey="name" 
              {...axisProps}
              tick={{ ...axisProps.tick, fontSize: 10, fontWeight: 900 }}
              dy={20}
            />
            <YAxis 
              {...axisProps}
              tick={{ ...axisProps.tick, fontSize: 10, fontWeight: 900 }}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: chartColors.cursorLine, strokeWidth: 1 }} />
            
            {/* Confidence Interval Area */}
            {showCI && (
              <Area
                type="monotone"
                dataKey="ciRange"
                stroke="none"
                fill="url(#colorCI)"
                fillOpacity={1}
                animationDuration={1500}
                name="CONFIDENCE"
              />
            )}

            {/* Actual Line */}
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke={CHART_COLORS.primary.base}
              strokeWidth={5} 
              dot={{ r: 0, fill: CHART_COLORS.primary.base }}
              activeDot={{ r: 10, strokeWidth: 0, fill: CHART_COLORS.primary.base }}
              name="AKTUAL"
              animationDuration={1000}
            />

            {/* Predicted Line */}
            <Line 
              type="monotone" 
              dataKey="predicted" 
              stroke={CHART_COLORS.semantic.success}
              strokeWidth={3} 
              strokeDasharray="10 10"
              dot={false}
              activeDot={{ r: 7, strokeWidth: 0, fill: CHART_COLORS.semantic.success }}
              name="PREDIKSI"
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Analytics Footer */}
      <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
         <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="size-3 rounded-full border-2 border-indigo-600" />
               <span className={cn(T.caption, "text-slate-600 dark:text-slate-400")}>{t("chart.legend.actual")}</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-1 bg-emerald-600 rounded-full" />
               <span className={cn(T.caption, "text-slate-600 dark:text-slate-400")}>{t("chart.legend.ai")}</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="size-3 bg-indigo-100 rounded-sm" />
               <span className={cn(T.caption, "text-slate-600 dark:text-slate-400")}>{t("chart.legend.ci")}</span>
            </div>
         </div>
         <p className={cn(T.caption, "text-slate-500 italic")}>
            {t("chart.footer.note")}
         </p>
      </div>
    </div>
  );
}
