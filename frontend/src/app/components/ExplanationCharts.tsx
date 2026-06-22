"use client";

import React from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { Info } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { R } from "@/app/lib/radii";
import { useTranslation } from "@/app/i18n";
import { CHART_COLORS, CHART_HEIGHT } from "@/app/lib/charts";
import { StableResponsiveContainer as ResponsiveContainer } from "@/app/components/charts/StableResponsiveContainer";

interface FactorInput {
  name: string;
  impact: number;
}

interface SimilarProductInput {
  name: string;
  prediction: number;
  actual: number;
}

/**
 * Radar Chart untuk profil pengaruh faktor (SHAP)
 */
export function FactorRadarProfile({ factors }: { factors: FactorInput[] }) {
  const { t } = useTranslation();
  const radarData = factors.map((f) => ({
    subject: f.name.split(" ")[0],
    fullName: f.name,
    value: f.impact,
  }));

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm h-full flex flex-col group">
      <div className="space-y-1 mb-6">
        <h4 className={cn(T.h3, "text-foreground group-hover:text-primary transition-colors")}>{t("xai.chart.radar.title")}</h4>
        <p className={cn(T.bodySm, "text-muted-foreground leading-relaxed mt-1")}>
          {t("xai.chart.radar.desc")}
        </p>
      </div>

      <div style={{ minHeight: CHART_HEIGHT.md }} className="flex-1 w-full">
        <ResponsiveContainer debounce={200} width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: "var(--muted-foreground)", fontSize: 8 }} 
              domain={[0, 50]} 
              axisLine={false}
            />
            <Radar
              name={t("xai.chart.radar.impact")}
              dataKey="value"
              stroke="var(--primary)"
              fill="var(--primary)"
              fillOpacity={0.2}
              strokeWidth={3}
              animationDuration={2000}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--popover))", 
                borderColor: "hsl(var(--border))",
                borderRadius: "12px",
                fontSize: "11px",
                color: "hsl(var(--foreground))",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
              }}
              itemStyle={{ color: "hsl(var(--primary))", fontWeight: "bold" }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      <div className={cn(T.caption, R.md, "mt-4 flex items-center gap-2 text-muted-foreground bg-accent/30 px-3 py-2")}>
        <Info className="size-3.5" />
        {t("xai.chart.radar.note")}
      </div>
    </div>
  );
}

/**
 * Accuracy Benchmarking vs Similar Products
 */
export function AccuracyBench({ similarProducts }: { similarProducts: SimilarProductInput[] }) {
  const { t } = useTranslation();
  const compData = similarProducts.map((sp) => ({
    name: sp.name.length > 20 ? sp.name.substring(0, 18) + "..." : sp.name,
    prediksi: sp.prediction,
    aktual: sp.actual,
  }));

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm h-full flex flex-col group">
      <div className="space-y-1 mb-6">
        <h4 className={cn(T.h3, "text-foreground group-hover:text-emerald-500 transition-colors")}>{t("xai.chart.bench.title")}</h4>
        <p className={cn(T.bodySm, "text-muted-foreground leading-relaxed mt-1")}>
          {t("xai.chart.bench.desc")}
        </p>
      </div>

      <div style={{ minHeight: CHART_HEIGHT.md }} className="flex-1 w-full">
        <ResponsiveContainer debounce={200} width="100%" height="100%">
          <BarChart data={compData} layout="vertical" margin={{ left: -20, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" horizontal={false} />
            <XAxis 
              type="number" 
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} 
              axisLine={false} 
              tickLine={false} 
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fill: "hsl(var(--foreground))", fontSize: 9, fontWeight: 600 }} 
              axisLine={false} 
              tickLine={false} 
              width={100}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--accent) / 0.3)" }}
              contentStyle={{ 
                backgroundColor: "hsl(var(--popover))", 
                borderColor: "hsl(var(--border))",
                borderRadius: "12px",
                fontSize: "11px",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
              }}
              formatter={(value, name) => [
                `${value} ${t("table.unit")}`,
                name === "prediksi" ? t("xai.chart.bench.ai") : t("xai.chart.bench.actual"),
              ]}
            />
            <Legend 
              formatter={(v: string) => (
                <span className={cn(T.caption, "text-muted-foreground ml-1")}>
                  {v === "prediksi" ? t("xai.chart.bench.ai") : t("xai.chart.bench.actual")}
                </span>
              )}
            />
            <Bar dataKey="prediksi" fill="var(--primary)" fillOpacity={0.8} radius={[0, 4, 4, 0]} barSize={12} name="prediksi" animationDuration={1000} />
            <Bar dataKey="aktual" fill={CHART_COLORS.semantic.success} radius={[0, 4, 4, 0]} barSize={12} name="aktual" animationDuration={1500} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={cn(R.md, "mt-4 p-3 bg-emerald-500/5 border border-emerald-500/10")}>
        <p className={cn(T.bodySm, "text-emerald-500 leading-normal")}>
          {t("xai.chart.bench.accuracy.note")}
        </p>
      </div>
    </div>
  );
}
