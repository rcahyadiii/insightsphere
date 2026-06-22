"use client";

import { useState, useMemo } from "react";
import { useTheme } from "next-themes";
import { ErrorBoundary } from "../ErrorBoundary";
import { 
  Eye, 
  SlidersHorizontal, 
  GitCompare, 
  Lightbulb, 
  ChevronDown, 
  Share2, 
  ThumbsUp, 
  ThumbsDown, 
  Calendar, 
  CloudRain, 
  TrendingUp, 
  ShoppingCart, 
  Scale, 
  Target, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  RefreshCcw,
  Clock,
  Zap,
  MapPin,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import { CHART_COLORS, CHART_HEIGHT, getAxisProps, getChartColors, getTooltipContentStyle } from "@/app/lib/charts";
import { T } from "@/app/lib/typography";
import { C } from "@/app/lib/colors";
import { R } from "@/app/lib/radii";
import { Z } from "@/app/lib/elevation";
import { btn } from "@/app/lib/buttons";
import { SWITCH } from "@/app/lib/forms";
import { GAP, ICON } from "@/app/lib/spacing";
import { TABS } from "@/app/lib/nav";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { useTranslation } from "@/app/i18n";
import { isDemoDataEnabled } from "@/app/lib/demo-mode";
import { 
    Radar, 
    RadarChart, 
    PolarGrid, 
    PolarAngleAxis, 
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
  } from "recharts";
import { StableResponsiveContainer as ResponsiveContainer } from "@/app/components/charts/StableResponsiveContainer";

// --- Types ---

// Tab IDs dikelola oleh shadcn Tabs (value prop)

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  status: string;
  summary: string;
  confidence: number;
  currentDemand: number;
}

interface FactorData {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  desc: string;
}

type InsightType = "Pola" | "Anomali" | "Risiko" | "Peluang";

// --- Sub-Components ---

const FactorBar = ({ factor }: { factor: FactorData }) => (
  <div className="group relative">
    <div className="flex items-center justify-between mb-1.5">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
          <factor.icon className={cn(ICON.sm, "text-slate-500 group-hover:text-indigo-600")} />
        </div>
        <span className={cn(T.label, "text-slate-700 dark:text-slate-300")}>{factor.label}</span>
      </div>
      <span className={cn(T.label, "text-slate-900 dark:text-slate-100 font-data")}>{factor.value}%</span>
    </div>
    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
      <div 
        style={{ width: `${factor.value}%` }}
        className={cn("h-full bg-gradient-to-r rounded-full transition-all duration-1000 ease-out", factor.color)}
      />
    </div>
    {/* Tooltip on hover */}
    <div className={cn("absolute top-8 left-0 w-64 p-2.5 bg-slate-900 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-2xl pointer-events-none border border-white/10", T.caption)}>
      {factor.desc}
    </div>
  </div>
);

const InsightCard = ({ type, title, desc, conf }: { type: InsightType, title: string, desc: string, conf: number }) => {
  const { t } = useTranslation();
  const styles: Record<InsightType, {
    bg: string;
    text: string;
    icon: React.ElementType;
    label: string;
  }> = {
    Pola: { bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-600", icon: Sparkles, label: t("xai.label.pattern") },
    Anomali: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600", icon: Zap, label: t("xai.label.anomaly") },
    Risiko: { bg: "bg-rose-50 dark:bg-rose-900/30", text: "text-rose-600 dark:text-rose-400", icon: AlertCircle, label: t("xai.label.risk") },
    Peluang: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600", icon: Lightbulb, label: t("xai.label.opportunity") },
  };
  const style = styles[type];
  
  return (
    <div className={cn("p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all bg-white dark:bg-slate-800 relative overflow-hidden group/card", style.bg)}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <div className={cn("p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm", style.text)}>
            <style.icon className={ICON.sm} />
          </div>
        </div>
        <span className={cn("px-1.5 py-0.5 rounded-lg border border-current opacity-70", style.text, T.caption)}>
          {t("xai.confidence")} {conf}%
        </span>
      </div>
      <h4 className={cn("text-slate-900 dark:text-slate-100 mb-1 group-hover/card:text-indigo-600 transition-colors uppercase tracking-tight", T.label)}>{title}</h4>
      <p className={cn("text-slate-500 leading-relaxed italic", T.caption)}>&ldquo;{desc}&rdquo;</p>
    </div>
  );
};

export function XAIPage() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const [isDataLoading, setIsDataLoading] = useState(false);
  const chartColors = getChartColors(resolvedTheme as "light" | "dark" | undefined);
  const axisProps = getAxisProps(resolvedTheme as "light" | "dark" | undefined);
  const tooltipStyle = getTooltipContentStyle(resolvedTheme as "light" | "dark" | undefined);
  const [selectedProductId, setSelectedProductId] = useState("foto4x6");
  const [showDropdown, setShowDropdown] = useState(false);

  // Simulation States
  const [isPromo, setIsPromo] = useState(false);
  const [discount, setDiscount] = useState(10);
  const [isHoliday, setIsHoliday] = useState(false);
  const [isPayday, setIsPayday] = useState(false);
  const [, setShareModalOpen] = useState(false);

  const handleRefresh = () => {
    setIsDataLoading(true);
    const toastId = toast.loading(t("xai.toast.loading"));
    setTimeout(() => {
      setIsDataLoading(false);
      toast.success(t("xai.toast.done"), { id: toastId });
    }, 1500);
  };

  const PRODUCTS: Product[] = useMemo(() => [
    { 
      id: "foto4x6", 
      name: "Cetak Foto 4x6", 
      sku: "CF-4X6", 
      stock: 180, 
      status: t("xai.status.restock"),
      confidence: 92,
      currentDemand: 240,
      summary: t("xai.product.foto4x6.summary")
    },
    { 
      id: "printbw", 
      name: "Print B&W", 
      sku: "PR-BW", 
      stock: 999, 
      status: t("xai.status.overstock"),
      confidence: 88,
      currentDemand: 310,
      summary: t("xai.product.printbw.summary")
    },
    { 
      id: "lamA4", 
      name: "Laminasi A4", 
      sku: "LM-A4", 
      stock: 100, 
      status: t("xai.status.safe"),
      confidence: 94,
      currentDemand: 45,
      summary: t("xai.product.lamA4.summary")
    }
  ], [t]);

  const FACTORS = useMemo<Record<string, FactorData[]>>(() => ({
    foto4x6: [
      { label: t("xai.factor.holiday"), value: 45, icon: Calendar, color: "from-amber-400 to-rose-500", desc: t("xai.factor_desc.foto4x6.holiday") },
      { label: t("xai.factor.payday"), value: 25, icon: Scale, color: "from-amber-300 to-amber-500", desc: t("xai.factor_desc.foto4x6.payday") },
      { label: t("xai.factor.trend"), value: 15, icon: TrendingUp, color: "from-emerald-400 to-emerald-600", desc: t("xai.factor_desc.foto4x6.trend") },
      { label: t("xai.factor.location"), value: 10, icon: MapPin, color: "from-slate-300 to-slate-500", desc: t("xai.factor_desc.foto4x6.location") },
      { label: t("xai.factor.price"), value: 5, icon: ShoppingCart, color: "from-slate-200 to-slate-400", desc: t("xai.factor_desc.foto4x6.price") },
    ],
    printbw: [
      { label: t("xai.factor.trend"), value: 40, icon: TrendingUp, color: "from-emerald-400 to-emerald-600", desc: t("xai.factor_desc.printbw.trend") },
      { label: t("xai.factor.location"), value: 25, icon: MapPin, color: "from-amber-300 to-amber-500", desc: t("xai.factor_desc.printbw.location") },
      { label: t("xai.factor.promo"), value: 20, icon: Zap, color: "from-indigo-400 to-indigo-600", desc: t("xai.factor_desc.printbw.promo") },
      { label: t("xai.factor.payday"), value: 10, icon: Calendar, color: "from-slate-300 to-slate-500", desc: t("xai.factor_desc.printbw.payday") },
      { label: t("xai.factor.price"), value: 5, icon: Scale, color: "from-slate-200 to-slate-400", desc: t("xai.factor_desc.printbw.price") },
    ],
    lamA4: [
      { label: t("xai.factor.supply"), value: 50, icon: ShoppingCart, color: "from-emerald-400 to-emerald-600", desc: t("xai.factor_desc.lamA4.supply") },
      { label: t("xai.factor.trend"), value: 30, icon: Target, color: "from-slate-300 to-slate-500", desc: t("xai.factor_desc.lamA4.trend") },
      { label: t("xai.factor.holiday"), value: 10, icon: Clock, color: "from-amber-300 to-amber-500", desc: t("xai.factor_desc.lamA4.holiday") },
      { label: t("xai.factor.weather"), value: 10, icon: CloudRain, color: "from-slate-200 to-slate-400", desc: t("xai.factor_desc.lamA4.weather") },
    ]
  }), [t]);

  const selectedProduct = useMemo(() => 
    PRODUCTS.find(p => p.id === selectedProductId) || PRODUCTS[0], 
  [selectedProductId, PRODUCTS]);
  const confidenceLabel =
    selectedProduct.confidence >= 90
      ? t("xai.confidence.very_high")
      : selectedProduct.confidence >= 80
        ? t("xai.confidence.high")
        : t("xai.confidence.medium");

  const getStatusIcon = (status: string) => {
    if (status === t("xai.status.restock")) return AlertTriangle;
    if (status === t("xai.status.overstock")) return TrendingUp;
    return CheckCircle2;
  };

  const getStatusClass = (status: string) => {
    if (status === t("xai.status.restock")) return "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400";
    if (status === t("xai.status.overstock")) return "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400";
    return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400";
  };

  const adjustedDemand = useMemo(() => {
    let base = selectedProduct.currentDemand;
    if (isPromo) base *= (1 + (discount / 100));
    if (isHoliday) base *= 1.25; 
    if (isPayday) base *= 1.40;  
    return Math.floor(base);
  }, [selectedProduct, isPromo, discount, isHoliday, isPayday]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {!isDemoDataEnabled() && (
        <div className={cn("flex items-start gap-3 px-4 py-3 rounded-xl border bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50", T.bodySm)}>
          <AlertCircle className="size-4 shrink-0 mt-0.5 text-amber-500" aria-hidden="true" />
          <span className="text-amber-700 dark:text-amber-300">{t("xai.demo_notice")}</span>
        </div>
      )}

      {/* Header Section */}
      <div className={cn("flex flex-col md:flex-row md:items-center justify-between", GAP.default)}>
        <div>
           <h1 className={cn(T.h1, "text-slate-900 dark:text-slate-100")}>{t("xai.header")}</h1>
           <p className={cn(T.body, "text-slate-500 dark:text-slate-400")}>{t("xai.subheader")}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isDataLoading}
            aria-label={t("xai.aria.refresh_analysis")}
            className={btn("neutralSoft", "sm", { icon: true })}
          >
            <RefreshCcw className={cn(ICON.sm, isDataLoading && "animate-spin")} />
          </button>
        </div>

        {/* Product Selector */}
        <div className={cn(Z.dropdown, "relative")}>
           <button 
             onClick={() => setShowDropdown(!showDropdown)}
             className="w-full md:w-64 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between shadow-sm hover:border-indigo-500 transition-all group cursor-pointer"
           >
              <div className="flex items-center gap-3 text-left">
                 <div className={cn(T.code, "size-7 rounded-lg bg-slate-900 flex items-center justify-center text-white")}>
                    {selectedProduct.sku.split('-')[0]}
                 </div>
                 <div className="flex flex-col">
                    <span className={cn(T.bodySm, "font-bold text-slate-900 dark:text-slate-100 leading-none mb-1")}>{selectedProduct.name}</span>
                    <span className={cn(T.code, "text-slate-400")}>{selectedProduct.sku}</span>
                 </div>
              </div>
               <ChevronDown className={cn(ICON.sm, "text-slate-400 transition-transform", showDropdown && "rotate-180")} />
           </button>

           {showDropdown && (
             <div 
               className={cn(Z.popover, R.md, "absolute top-full left-0 right-0 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl space-y-1", "animate-in fade-in zoom-in-95 duration-100")}
             >
                  {PRODUCTS.map(p => {
                    const StatusIcon = getStatusIcon(p.status);

                    return (
                    <button 
                      key={p.id}
                      onClick={() => { setSelectedProductId(p.id); setShowDropdown(false); }}
                      className={cn(
                        "w-full p-2 rounded-lg flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer",
                        selectedProductId === p.id && C.primary.bg
                      )}
                    >
                       <div className="flex flex-col text-left">
                          <span className={cn("font-bold text-slate-900 dark:text-slate-100", T.label)}>{p.name}</span>
                          <span className={cn("text-slate-400 font-data", T.caption)}>{t("xai.stock_label", { stock: p.stock })}</span>
                       </div>
                       <span className={cn(
                         cn(T.micro, R.xs, "inline-flex items-center gap-1 px-1.5 py-0.5"),
                         getStatusClass(p.status)
                       )}>
                         <StatusIcon className="size-3" aria-hidden="true" />
                         {p.status}
                       </span>
                    </button>
                    );
                  })}
             </div>
           )}
        </div>
      </div>

      <div className="p-4 bg-slate-900 rounded-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden group">
         <div className="absolute top-0 right-0 size-32 bg-indigo-500/10 rounded-full blur-3xl -mr-5 -mt-5 group-hover:scale-110 transition-transform duration-1000"></div>
         <div className="flex items-center gap-4 relative z-10">
            <div className="p-2 bg-white/10 rounded-lg border border-white/10"><Sparkles className="size-5 text-indigo-300" /></div>
            <div>
               <h3 className={cn(T.h4, "mb-0.5")}>{t("xai.guide.title")}</h3>
               <p className={cn(T.caption, "text-slate-400")}>{t("xai.guide.desc")}</p>
            </div>
         </div>
      </div>

      <Tabs defaultValue="Explain" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
          {/* Tab List — Underline variant sesuai TABS.md §3.1 */}
          <TabsList className={cn(TABS.list.underline, "px-4 bg-slate-50/50 dark:bg-slate-800/50 gap-1 rounded-none border-b-0 h-auto w-full justify-start")}>
            {[
              { id: "Explain", label: t("xai.tab.explain"), icon: Eye },
              { id: "Simulate", label: t("xai.tab.simulate"), icon: SlidersHorizontal },
              { id: "Compare", label: t("xai.tab.compare"), icon: GitCompare },
              { id: "Global", label: t("xai.tab.global"), icon: Lightbulb },
            ].map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  TABS.trigger.underline.base,
                  "flex items-center gap-2 cursor-pointer",
                  "data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600",
                  "data-[state=inactive]:text-slate-400 data-[state=inactive]:hover:text-slate-900",
                )}
              >
                <tab.icon className={ICON.sm} />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {/* Tab Content */}
          <TabsContent value="Explain" className="p-8 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                       {isDataLoading ? (
                          <div className="space-y-8">
                             <div className="h-48 w-full bg-slate-50 animate-pulse rounded-xl" />
                          </div>
                       ) : (
                          <>
                             <div className="p-6 bg-indigo-50/40 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/40 relative group overflow-hidden">
                                <div className="flex items-center justify-between mb-4">
                                   <div className="flex items-center gap-2">
                                      <span className={cn("bg-indigo-600 text-white px-2 py-0.5 rounded font-bold", T.micro)}>{t("xai.summary.badge")}</span>
                                      <span className={cn(T.caption, "font-bold flex items-center gap-1", C.primary.icon)}><Target className="size-3" /> {t("xai.confidence.label")}: {confidenceLabel}</span>
                                   </div>
                                    <button 
                                      onClick={() => setShareModalOpen(true)}
                                      className={btn("ghost", "sm", { icon: true })}
                                      aria-label={t("xai.aria.share_analysis")}
                                    >
                                       <Share2 className={ICON.sm} />
                                    </button>
                                </div>
                                <p className={cn(T.h3, "font-bold text-slate-800 dark:text-slate-200 leading-snug mb-6 italic")}>
                                   &ldquo;{selectedProduct.summary}&rdquo;
                                </p>
                                <div className="grid grid-cols-3 gap-3 bg-white dark:bg-slate-800 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
                                   <div className="text-center">
                                      <p className={cn(T.label, "text-slate-500 mb-0.5")}>{t("inv.table.stock")}</p>
                                      <p className={cn(T.h3, "font-bold text-slate-900 dark:text-slate-100 font-data")}>{selectedProduct.stock}</p>
                                   </div>
                                   <div className="text-center border-x border-slate-100 dark:border-slate-700">
                                      <p className={cn(T.label, "text-slate-500 mb-0.5")}>{t("pred.table.forecast")}</p>
                                      <p className={cn(T.h3, "font-bold font-data", C.primary.icon)}>~{selectedProduct.currentDemand}</p>
                                   </div>
                                   <div className="text-center">
                                      <p className={cn(T.label, "text-slate-500 mb-0.5")}>{t("common.status")}</p>
                                      {(() => {
                                        const StatusIcon = getStatusIcon(selectedProduct.status);

                                        return (
                                      <span className={cn(
                                         cn(T.micro, R.xs, "inline-flex items-center gap-1 px-1.5 py-0.5"),
                                         getStatusClass(selectedProduct.status)
                                      )}>
                                        <StatusIcon className="size-3" aria-hidden="true" />
                                        {selectedProduct.status}
                                      </span>
                                        );
                                      })()}
                                   </div>
                                </div>
                             </div>

                             <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                <p className={cn("font-bold text-slate-500 italic", T.label)}>{t("xai.feedback.question")}</p>
                                <div className="flex items-center gap-2">
                                   <button aria-label={t("xai.feedback.helpful")} className={btn("ghost", "sm", { icon: true })}><ThumbsUp className={cn(ICON.sm, C.success.icon)} /></button>
                                   <button aria-label={t("xai.feedback.not_helpful")} className={btn("ghost", "sm", { icon: true })}><ThumbsDown className={cn(ICON.sm, C.destructive.icon)} /></button>
                                </div>
                             </div>
                          </>
                       )}
                    </div>

                    <div className="space-y-6">
                       <div className="space-y-1">
                          <h3 className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>{t("xai.factor.title")}</h3>
                           <p className={cn(T.caption, "text-slate-400 italic")}>{t("xai.factor.desc")}</p>
                       </div>
                       {isDataLoading ? (
                         <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className="h-12 w-full bg-slate-50 animate-pulse rounded-lg" />
                            ))}
                         </div>
                       ) : (
                         <div className="space-y-5">
                            {(FACTORS[selectedProductId] ?? []).map((factor, idx) => (
                              <FactorBar key={idx} factor={factor} />
                            ))}
                         </div>
                       )}
                    </div>
                 </div>
          </TabsContent>

          <TabsContent value="Simulate" className="p-8 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                       <div className="space-y-1">
                          <h3 className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>{t("xai.sim.title")}</h3>
                           <p className={cn(T.caption, "text-slate-400")}>{t("xai.sim.desc")}</p>
                       </div>
                       
                       {isDataLoading ? (
                          <div style={{ height: CHART_HEIGHT.md }} className="w-full bg-slate-50 animate-pulse rounded-xl" />
                       ) : (
                          <div className="grid grid-cols-1 gap-4">
                             <div className={cn(
                               "p-4 rounded-xl border transition-all duration-300",
                               isPromo ? "bg-indigo-600 text-white border-indigo-500 shadow-md" : "bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                             )}>
                                <div className="flex items-center justify-between mb-4">
                                   <div className="flex items-center gap-3">
                                      <div className={cn("p-2 rounded-lg", isPromo ? "bg-white/20" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm")}>
                                         <Zap className={cn("size-4", isPromo ? "text-white" : "text-indigo-600")} />
                                      </div>
                                      <div>
                                         <h5 className={cn("font-bold uppercase tracking-tight", T.label)}>{t("xai.sim.promo")}</h5>
                                         <p className={cn("opacity-70", isPromo ? "text-indigo-100" : "text-slate-400", T.caption)}>{t("xai.sim.promo_desc")}</p>
                                      </div>
                                   </div>
                                    <button 
                                      onClick={() => setIsPromo(!isPromo)}
                                      role="switch"
                                      aria-checked={isPromo}
                                      className={cn(SWITCH.base, isPromo ? "bg-white" : "bg-slate-300")}
                                    >
                                       <div 
                                         className={cn(SWITCH.thumb, isPromo ? "bg-indigo-600 translate-x-[18px]" : "bg-white translate-x-[3px]", "transition-all duration-150")} />
                                    </button>
                                </div>
                                {isPromo && (
                                   <div className="space-y-2 animate-in slide-in-from-top-1">
                                      <div className={cn(T.label, "flex items-center justify-between")}>
                                         <span>{t("xai.sim.discount_level")}</span>
                                         <span className={cn(T.dataSm)}>{discount}%</span>
                                      </div>
                                       <input 
                                         type="range" min="1" max="50" 
                                         value={discount} 
                                         onChange={(e) => setDiscount(Number(e.target.value))}
                                         className="w-full cursor-pointer accent-white opacity-90 hover:opacity-100"
                                       />
                                   </div>
                                )}
                             </div>
                          </div>
                       )}
                    </div>

                    <div className="flex flex-col justify-center gap-6">
                       {isDataLoading ? (
                          <div style={{ height: CHART_HEIGHT.md }} className="w-full bg-slate-50 animate-pulse rounded-xl" />
                       ) : (
                          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden group shadow-sm">
                             <h4 className={cn(T.h4, "text-slate-500 mb-6")}>{t("xai.sim.impact_analysis")}</h4>
                             <div className="flex items-center justify-between mb-6">
                                <div className="space-y-0.5">
                                   <p className={cn(T.label, "text-slate-500")}>{t("xai.sim.baseline")}</p>
                                   <p className={cn(T.kpiCard, "font-bold text-slate-300")}>~{selectedProduct.currentDemand}</p>
                                </div>
                                <ArrowRight className="size-4 text-slate-400" />
                                <div className="space-y-0.5 text-right">
                                   <p className={cn(T.label, C.primary.icon)}>{t("xai.sim.projected")}</p>
                                   <p className="text-3xl font-bold font-data transition-all duration-300">
                                      ~{adjustedDemand}
                                   </p>
                                </div>
                             </div>
                          </div>
                       )}
                    </div>
            </div>
          </TabsContent>

          <TabsContent value="Compare" className="p-8 mt-0">
            <ErrorBoundary compact sectionName={t("xai.section.compare_charts")}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                       <div className="space-y-1">
                          <h3 className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>{t("xai.chart.radar.title")}</h3>
                           <p className={cn(T.caption, "text-slate-400 italic")}>{t("xai.chart.radar.desc")}</p>
                       </div>
                       {isDataLoading ? (
                         <div style={{ height: CHART_HEIGHT.md }} className="w-full bg-slate-50 rounded-xl animate-pulse" />
                       ) : (
                         <div style={{ height: CHART_HEIGHT.mlg }} className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700 rounded-xl p-4 flex items-center justify-center shadow-inner">
                            <ResponsiveContainer debounce={200} width="100%" height="100%">
                               <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                 { subject: t("xai.factor.payday"), A: 120, fullMark: 150 },
                                 { subject: t("xai.factor.promo"), A: 98, fullMark: 150 },
                                 { subject: t("xai.factor.trend"), A: 99, fullMark: 150 },
                               ]}>
                                 <PolarGrid stroke={chartColors.cursorLine} />
                                 <PolarAngleAxis dataKey="subject" tick={{fill: chartColors.axisTick, fontSize: 8, fontWeight: 700}} />
                                 <Radar name={t("xai.chart.radar.impact")} dataKey="A" stroke={CHART_COLORS.primary.base} fill={CHART_COLORS.primary.base} fillOpacity={0.6} />
                               </RadarChart>
                            </ResponsiveContainer>
                         </div>
                       )}
                    </div>

                    <div className="space-y-8">
                       <div className="space-y-1">
                          <h3 className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>{t("xai.chart.bench.title")}</h3>
                           <p className={cn(T.caption, "text-slate-400")}>{t("xai.chart.bench.desc")}</p>
                       </div>
                       <div style={{ height: CHART_HEIGHT.sm }} className="w-full">
                          {isDataLoading ? (
                             <div className="h-full bg-slate-50 animate-pulse rounded-xl" />
                          ) : (
                             <ResponsiveContainer debounce={200} width="100%" height="100%">
                               <BarChart data={[
                                    { name: t("xai.tab.global"), acc: 94, fill: CHART_COLORS.primary.base },
                                    { name: t("inv.stats.total"), acc: 88, fill: chartColors.cursorLine },
                               ]} layout="vertical">
                                 <XAxis type="number" hide />
                                 <YAxis dataKey="name" type="category" {...axisProps} tick={{...axisProps.tick, fontSize: 9, fontWeight: 700}} width={100} />
                                 <Tooltip cursor={{fill: 'transparent'}} contentStyle={tooltipStyle} />
                                 <Bar dataKey="acc" radius={[0, 8, 8, 0]} barSize={24} />
                               </BarChart>
                             </ResponsiveContainer>
                          )}
                       </div>
                    </div>
            </div>
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="Global" className="p-8 mt-0">
            <div className="space-y-8">
                    <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <h3 className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>{t("xai.insight.title")}</h3>
                        <p className={cn(T.caption, "text-slate-500")}>{t("xai.insight.desc")}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                       {isDataLoading ? (
                         [...Array(4)].map((_, i) => (
                           <div key={i} className="h-32 w-full bg-slate-50 animate-pulse rounded-xl" />
                         ))
                       ) : (
                         <>
                            <InsightCard type="Pola" title={t("xai.insight.pattern_graduation.title")} desc={t("xai.insight.pattern_graduation.desc")} conf={96} />
                            <InsightCard type="Anomali" title={t("xai.insight.color_print_surge.title")} desc={t("xai.insight.color_print_surge.desc")} conf={82} />
                            <InsightCard type="Risiko" title={t("xai.insight.paper_stock_low.title")} desc={t("xai.insight.paper_stock_low.desc")} conf={91} />
                            <InsightCard type="Peluang" title={t("xai.insight.print_binding_bundle.title")} desc={t("xai.insight.print_binding_bundle.desc")} conf={88} />
                         </>
                       )}
                    </div>

                    {!isDataLoading && (
                       <div className="p-6 bg-indigo-600 rounded-xl text-white flex items-center justify-between group overflow-hidden relative shadow-lg">
                          <div className="absolute top-0 right-0 size-48 bg-white/10 rounded-full blur-3xl -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-1000"></div>
                          <div className="flex items-center gap-5 relative z-10">
                             <div className="size-12 bg-white/20 rounded-lg flex items-center justify-center border border-white/20 shadow-inner"><Zap className="size-6" /></div>
                              <div>
                                 <h4 className={cn(T.h4, "mb-0.5")}>{t("xai.advanced.title")}</h4>
                                 <p className={cn(T.caption, "text-indigo-100")}>{t("xai.advanced.desc")}</p>
                              </div>
                           </div>
                           <button onClick={() => toast.info(t("xai.advanced.in_development"))} className={cn(btn("neutral", "md"), "bg-white text-indigo-600 hover:bg-slate-50 relative z-10 shadow-md hover:-translate-y-0.5")}>{t("xai.advanced.open")}</button>
                       </div>
                    )}
                 </div>
          </TabsContent>
      </Tabs>
    </div>
  );
}
