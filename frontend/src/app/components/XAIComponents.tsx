"use client";

import React from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  BrainCircuit, 
  AlertTriangle, 
  Lightbulb,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { R } from "@/app/lib/radii";
import { useTranslation } from "@/app/i18n";

export interface XAIFactor {
  name: string;
  impact: number;
  direction: "up" | "down";
  icon: React.ElementType;
  description: string;
}

export interface XAIInsight {
  title: string;
  description: string;
  type: "pattern" | "anomaly" | "risk" | "opportunity" | "opportunity_en"; // added for safety if type comes with suffix
  confidence: number;
}

/**
 * Visualisasi Bar untuk faktor pengaruh individual
 */
export function FactorBar({ factor }: { factor: XAIFactor }) {
  const Icon = factor.icon;
  
  return (
    <div className="group relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/30 flex items-center justify-center shrink-0 border border-border/50 group-hover:border-primary/50 transition-colors">
            <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="flex flex-col">
            <span className="text-foreground font-bold group-hover:translate-x-0.5 transition-transform">
              {factor.name}
            </span>
            <p className={cn("text-muted-foreground font-medium leading-tight max-w-48 opacity-0 group-hover:opacity-100 transition-opacity", T.label)}>
              {factor.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={cn(
            T.dataSm,
            "flex items-center gap-1 px-2 py-0.5 uppercase tracking-wider",
            R.xl,
            factor.direction === "up" 
              ? "bg-destructive/10 text-destructive border border-destructive/20" 
              : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
          )}>
            {factor.direction === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {factor.impact}%
          </div>
        </div>
      </div>
      
      <div className="h-2 bg-accent/50 rounded-full overflow-hidden border border-border/20">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out shadow-lg",
            factor.direction === "up" 
              ? "bg-gradient-to-r from-amber-400 to-destructive" 
              : "bg-gradient-to-r from-emerald-400 to-emerald-600"
          )}
          style={{ width: `${factor.impact}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Kartu Insight Global (Anomaly, Opportunity, dll)
 */
export function InsightCard({ insight }: { insight: XAIInsight }) {
  const { t } = useTranslation();
  
  const configs = {
    pattern: { 
      bg: "bg-indigo-500/5", 
      border: "border-indigo-500/20",
      icon: BrainCircuit, 
      color: "text-indigo-400", 
      badge: "bg-indigo-500/10 text-indigo-400",
      label: t("xai.label.pattern")
    },
    anomaly: { 
      bg: "bg-amber-500/5", 
      border: "border-amber-500/20",
      icon: AlertTriangle, 
      color: "text-amber-500", 
      badge: "bg-amber-500/10 text-amber-500",
      label: t("xai.label.anomaly")
    },
    risk: { 
      bg: "bg-destructive/5", 
      border: "border-destructive/20",
      icon: AlertTriangle, 
      color: "text-destructive", 
      badge: "bg-destructive/10 text-destructive",
      label: t("xai.label.risk")
    },
    opportunity: { 
      bg: "bg-emerald-500/5", 
      border: "border-emerald-500/20",
      icon: Lightbulb, 
      color: "text-emerald-500", 
      badge: "bg-emerald-500/10 text-emerald-500",
      label: t("xai.label.opportunity")
    },
    opportunity_en: { 
        bg: "bg-emerald-500/5", 
        border: "border-emerald-500/20",
        icon: Lightbulb, 
        color: "text-emerald-500", 
        badge: "bg-emerald-500/10 text-emerald-500",
        label: t("xai.label.opportunity")
      },
  };

  const config = configs[insight.type as keyof typeof configs] || configs.pattern;
  const Icon = config.icon;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border p-5 transition-all hover:shadow-xl hover:-translate-y-0.5 group",
      config.bg,
      config.border
    )}>
      {/* Glow effect */}
      <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full -mr-12 -mt-12 opacity-20 transition-opacity group-hover:opacity-40", config.bg)} />
      
      <div className="flex items-start gap-4 relative">
        <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shrink-0 shadow-sm group-hover:border-primary/20 transition-colors">
          <Icon className={cn("w-5 h-5", config.color)} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={cn(T.micro, "px-2 py-0.5 rounded-full", config.badge)}>
              {config.label}
            </span>
            <span className={cn(T.caption, "text-muted-foreground")}>
              {t("xai.confidence")}: {insight.confidence}%
            </span>
          </div>
          <h4 className={cn(T.buttonLg, "text-foreground")}>{insight.title}</h4>
          <p className={cn(T.caption, "text-muted-foreground leading-relaxed italic")}>
            &ldquo;{insight.description}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Feedback Action
 */
export function XAIFeedback() {
  const { t } = useTranslation();
  return (
    <div className="bg-accent/10 border border-border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="space-y-1 text-center md:text-left">
        <p className={cn(T.buttonLg, "text-foreground")}>{t("xai.feedback.question")}</p>
        <p className={cn(T.bodySm, "font-medium text-muted-foreground")}>{t("xai.feedback.desc")}</p>
      </div>
      <div className="flex items-center gap-2">
        <button className={cn("px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded-xl transition-all active:scale-95 cursor-pointer", T.buttonSm)}>
          {t("xai.feedback.yes")}
        </button>
        <button className={cn("px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 rounded-xl transition-all active:scale-95 cursor-pointer", T.buttonSm)}>
          {t("xai.feedback.no")}
        </button>
      </div>
    </div>
  );
}
