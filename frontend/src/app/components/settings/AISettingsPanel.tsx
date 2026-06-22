"use client";

import { Database, Eye, Layout } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { C } from "@/app/lib/colors";
import { T } from "@/app/lib/typography";
import { ICON } from "@/app/lib/spacing";

type SettingsPanelProps = {
  t: (key: string, params?: Record<string, string | number>) => string;
};

export function AISettingsPanel({ t }: SettingsPanelProps) {
  return (
    <div className="p-8 space-y-8 flex-1">
      <div className="space-y-2">
        <h3 className={cn(T.h3, "text-slate-900 dark:text-slate-100 flex items-center gap-3")}>
          <Layout className={cn(ICON.lg, C.primary.icon)} />
          {t("set.ai.title")}
        </h3>
        <p className={cn(T.bodySm, "text-slate-500 dark:text-slate-400")}>{t("set.ai.desc")}</p>
      </div>

      <div className="space-y-6">
        {[
          { label: t("set.ai.threshold"), value: 85, desc: t("set.ai.threshold_desc") },
          { label: t("set.ai.window"), value: 30, desc: t("set.ai.window_desc") },
        ].map((slider, i) => (
          <div key={i} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(T.label, "text-slate-900 dark:text-slate-100")}>{slider.label}</p>
                <p className={cn(T.caption, "text-slate-400")}>{slider.desc}</p>
              </div>
              <span className={cn(T.dataSm, "font-bold", C.primary.icon)}>{slider.value}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
              <div className="absolute top-0 left-0 h-full bg-indigo-500 transition-all cursor-pointer" style={{ width: `${slider.value}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between group cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors">
          <div className="flex items-center gap-3">
            <Eye className="w-4 h-4 text-slate-400" />
            <span className={cn(T.label, "text-slate-600 dark:text-slate-300")}>{t("set.ai.xai_viz")}</span>
          </div>
          <div className="w-8 h-4 bg-emerald-500 rounded-full relative">
            <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between group cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors">
          <div className="flex items-center gap-3">
            <Database className="w-4 h-4 text-slate-400" />
            <span className={cn(T.label, "text-slate-600 dark:text-slate-300")}>{t("set.ai.auto_retrain")}</span>
          </div>
          <div className="w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded-full relative">
            <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
