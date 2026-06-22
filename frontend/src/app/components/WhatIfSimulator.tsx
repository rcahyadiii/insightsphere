"use client";

import React, { useState, useMemo } from "react";
import { 
  SlidersHorizontal, 
  RefreshCw, 
  Megaphone, 
  CloudRain, 
  ShoppingCart, 
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { E } from "@/app/lib/elevation";
import { useTranslation } from "@/app/i18n";
import { WHAT_IF_SIMULATOR_RULES } from "@/app/domain/constants";

interface WhatIfSimulatorProps {
  basePrediction: number;
  currentStock: number;
  productName: string;
  scenarios: { scenario: string; result: string; delta: number }[];
}

export function WhatIfSimulator({ basePrediction, currentStock, productName, scenarios }: WhatIfSimulatorProps) {
  const { t } = useTranslation();
  // State for interactive simulation
  const [promoActive, setPromoActive] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState<number>(WHAT_IF_SIMULATOR_RULES.defaultPromoDiscountPct);
  const [weatherChange, setWeatherChange] = useState(false);
  const [competitorRestock, setCompetitorRestock] = useState(false);

  // Calculate adjusted demand based on client-side rules (mocking AI inference)
  const adjustedDemand = useMemo(() => {
    let base = basePrediction;
    if (promoActive) {
      base = Math.round(
        base * (1 + (promoDiscount / 100) * WHAT_IF_SIMULATOR_RULES.promoDiscount.demandLiftPerDiscountPct)
      );
    }
    if (weatherChange) base = Math.round(base * WHAT_IF_SIMULATOR_RULES.weatherDemandMultiplier);
    if (competitorRestock) base = Math.round(base * WHAT_IF_SIMULATOR_RULES.competitorRestockDemandMultiplier);
    return base;
  }, [basePrediction, promoActive, promoDiscount, weatherChange, competitorRestock]);

  const demandDelta = adjustedDemand - basePrediction;
  const stockSufficient = currentStock >= adjustedDemand;

  const resetAll = () => {
    setPromoActive(false);
    setPromoDiscount(WHAT_IF_SIMULATOR_RULES.defaultPromoDiscountPct);
    setWeatherChange(false);
    setCompetitorRestock(false);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      {/* Simulation Controls */}
      <div className="xl:col-span-2 space-y-6">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl transition-transform group-hover:scale-110" />
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/30 flex items-center justify-center border border-border/50">
              <SlidersHorizontal className="w-5 h-5 text-primary" />
            </div>
            <h3 className={cn(T.h2, "text-foreground")}>{t("sim.title")}</h3>
          </div>

          <div className="space-y-4 relative">
            {/* Promo Slider */}
            <div className={cn(
              "p-4 rounded-xl border transition-all",
              promoActive ? "bg-primary/5 border-primary/20 shadow-inner" : "bg-accent/20 border-border/50"
            )}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Megaphone className={cn("w-4 h-4", promoActive ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn(T.buttonLg, "text-foreground")}>{t("sim.promo")}</span>
                </div>
                <button
                  onClick={() => setPromoActive(!promoActive)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg transition-all",
                    T.buttonSm,
                    promoActive ? "bg-primary text-primary-foreground shadow-lg" : "bg-card border border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {promoActive ? t("sim.promo.active") : t("sim.promo.inactive")}
                </button>
              </div>
              
              {promoActive && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between">
                    <span className={cn(T.label, "text-muted-foreground")}>{t("sim.discount")}</span>
                    <span className={cn(T.bodyEmphasis, "text-primary font-bold")}>{promoDiscount}%</span>
                  </div>
                  <input
                    type="range"
                    min={WHAT_IF_SIMULATOR_RULES.promoDiscount.minPct}
                    max={WHAT_IF_SIMULATOR_RULES.promoDiscount.maxPct}
                    step={WHAT_IF_SIMULATOR_RULES.promoDiscount.stepPct}
                    value={promoDiscount}
                    onChange={(e) => setPromoDiscount(Number(e.target.value))}
                    className="w-full h-2 bg-accent rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <p className={cn(T.caption, "text-muted-foreground italic leading-tight")}>
                    {t("sim.discount.note")}
                  </p>
                </div>
              )}
            </div>

            {/* Weather Toggle */}
            <div className={cn(
               "flex items-center justify-between p-4 rounded-xl border transition-all",
               weatherChange ? "bg-primary/5 border-primary/20 shadow-inner" : "bg-accent/20 border-border/50"
            )}>
              <div className="flex items-center gap-3">
                <CloudRain className={cn("w-4 h-4", weatherChange ? "text-primary" : "text-muted-foreground")} />
                <div>
                  <span className={cn(T.buttonLg, "text-foreground")}>{t("sim.weather")}</span>
                  <p className={cn(T.caption, "text-muted-foreground font-medium leading-tight")}>{t("sim.weather.desc")}</p>
                </div>
              </div>
              <button
                onClick={() => setWeatherChange(!weatherChange)}
                className={cn(
                  "px-4 py-1.5 rounded-lg transition-all",
                  T.buttonSm
                )}
              >
                {weatherChange ? t("sim.yes") : t("sim.no")}
              </button>
            </div>

            {/* Competitor Toggle */}
            <div className={cn(
               "flex items-center justify-between p-4 rounded-xl border transition-all",
               competitorRestock ? "bg-primary/5 border-primary/20 shadow-inner" : "bg-accent/20 border-border/50"
            )}>
              <div className="flex items-center gap-3">
                <ShoppingCart className={cn("w-4 h-4", competitorRestock ? "text-primary" : "text-muted-foreground")} />
                <div>
                  <span className={cn(T.buttonLg, "text-foreground")}>{t("sim.competitor")}</span>
                  <p className={cn(T.caption, "text-muted-foreground font-medium leading-tight")}>{t("sim.competitor.desc")}</p>
                </div>
              </div>
              <button
                onClick={() => setCompetitorRestock(!competitorRestock)}
                className={cn(
                  "px-4 py-1.5 rounded-lg transition-all",
                  T.buttonSm
                )}
              >
                {competitorRestock ? t("sim.yes") : t("sim.no")}
              </button>
            </div>

            <button
              onClick={resetAll}
              className={cn(T.buttonSm, "w-full flex items-center justify-center gap-2 py-3 text-muted-foreground hover:text-foreground border border-border rounded-xl hover:bg-accent/50 transition-all")}
            >
              <RefreshCw className="w-4 h-4" />
              {t("sim.reset")}
            </button>
          </div>
        </div>
      </div>

      {/* Simulation Results */}
      <div className="xl:col-span-3 space-y-6">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm overflow-hidden relative group">
          <div className="flex items-center justify-between mb-8">
            <h3 className={cn(T.h2, "text-foreground shrink-0")}>{t("sim.impact.title")}</h3>
            <div className="h-[1px] bg-border flex-1 mx-4" />
            <span className={cn(T.caption, "text-muted-foreground")}>{productName}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-accent/30 rounded-2xl border border-border/50">
              <p className={cn(T.h4, "text-muted-foreground mb-3")}>{t("table.stock")}</p>
              <div className="flex items-end justify-center gap-1">
                <p className={cn(T.kpiHero, "text-foreground")}>{currentStock}</p>
                <p className={cn(T.label, "text-muted-foreground pb-1.5 uppercase")}>{t("table.unit")}</p>
              </div>
            </div>

            <div className={cn(E.glowPrimary, "text-center p-6 bg-primary/5 rounded-2xl border border-primary/20")}>
              <p className={cn(T.h4, "text-primary mb-3")}>{t("sim.impact.base")}</p>
              <div className="flex items-end justify-center gap-1">
                <p className={cn(T.kpiHero, "text-primary")}>{basePrediction}</p>
                <p className={cn(T.label, "text-primary/60 pb-1.5 uppercase")}>{t("table.unit")}</p>
              </div>
            </div>

            <div className={cn(
              "text-center p-6 rounded-2xl border transition-all duration-500",
              demandDelta === 0 
                ? "bg-accent/30 border-border/50" 
                : demandDelta > 0 
                  ? cn(E.glowDestructive, "bg-destructive/5 border-destructive/20")
                  : cn(E.glowSuccess, "bg-emerald-500/5 border-emerald-500/20")
            )}>
              <p className={cn(
                "mb-3",
                T.h4,
                demandDelta === 0 ? "text-muted-foreground" : demandDelta > 0 ? "text-destructive" : "text-emerald-500"
              )}>{t("sim.impact.result")}</p>
              <div className="flex items-end justify-center gap-1">
                <p className={cn(
                  T.kpiHero,
                  "animate-in zoom-in duration-300",
                  demandDelta === 0 ? "text-foreground" : demandDelta > 0 ? "text-destructive" : "text-emerald-500"
                )}>{adjustedDemand}</p>
                <p className={cn(T.label, "text-muted-foreground pb-1.5 uppercase")}>{t("table.unit")}</p>
              </div>
              <div className={cn(
                "mt-2 flex items-center justify-center gap-1",
                T.label,
                demandDelta === 0 ? "text-muted-foreground" : demandDelta > 0 ? "text-destructive" : "text-emerald-500"
              )}>
                {demandDelta > 0 ? <TrendingUp className="w-3 h-3" /> : demandDelta < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                {demandDelta > 0 ? "+" : ""}{demandDelta} {t("table.unit")} ({Math.abs(Math.round(demandDelta/basePrediction*100)) || 0}%)
              </div>
            </div>
          </div>

          {/* Verdict Box */}
          <div className={cn(
            "rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 transition-all duration-700",
            stockSufficient 
              ? "bg-emerald-500/10 border border-emerald-500/20 shadow-lg shadow-emerald-500/5" 
              : "bg-destructive/10 border border-destructive/20 shadow-lg shadow-destructive/5"
          )}>
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm",
              stockSufficient ? "bg-emerald-500 text-white" : "bg-destructive text-white"
            )}>
              {stockSufficient ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6 animate-pulse" />}
            </div>
            <div className="space-y-1.5 text-center sm:text-left">
              <h4 className={cn(T.h2, stockSufficient ? "text-emerald-500" : "text-destructive")}>
                {stockSufficient ? t("sim.verdict.safe") : t("sim.verdict.risk")}
              </h4>
              <p className={cn(T.body, "text-muted-foreground leading-relaxed max-w-lg")}>
                {stockSufficient 
                  ? t("sim.verdict.safe.desc", { demand: adjustedDemand, stock: currentStock })
                  : t("sim.verdict.risk.desc", { demand: adjustedDemand, diff: adjustedDemand - currentStock })
                }
              </p>
            </div>
          </div>
        </div>

        {/* Pre-defined Scenarios */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-4 h-4 text-primary" />
            <h4 className={cn(T.h4, "text-foreground")}>{t("sim.others")}</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-accent/20 rounded-xl hover:bg-accent/40 transition-all border border-transparent hover:border-border cursor-default group">
                <div className="space-y-1">
                  <p className={cn(T.label, "text-foreground group-hover:text-primary transition-colors")}>{s.scenario}</p>
                  <p className={cn(T.caption, "text-muted-foreground italic")}>{s.result}</p>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-lg font-bold transition-transform group-hover:scale-105",
                  T.micro,
                  s.delta > 0 ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-500"
                )}>
                  {s.delta > 0 ? "+" : ""}{s.delta} {t("table.unit").toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
