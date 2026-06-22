"use client";

import { LogOut } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { btn } from "@/app/lib/buttons";
import { ICON } from "@/app/lib/spacing";

type SettingsPanelProps = {
  t: (key: string, params?: Record<string, string | number>) => string;
};

type LogoutSettingsPanelProps = SettingsPanelProps & {
  onBack: () => void;
  onLogout: () => Promise<void>;
};

export function LogoutSettingsPanel({ t, onBack, onLogout }: LogoutSettingsPanelProps) {
  return (
    <div className="p-8 h-full flex flex-col items-center justify-center text-center space-y-8 py-12">
      <div className="w-20 h-20 rounded-3xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center border border-rose-100 dark:border-rose-800/30">
        <LogOut className="w-10 h-10 text-rose-400" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h3 className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>{t("set.logout.title")}</h3>
        <p className={cn(T.caption, "text-slate-400")}>{t("set.logout.desc")}</p>
      </div>

      {/* Session Info */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 w-full max-w-xs space-y-2">
        <div className="flex justify-between">
          <span className={cn(T.label, "text-slate-400")}>{t("set.logout.session_info")}</span>
          <span className={cn(T.dataSm, "font-bold text-slate-600 dark:text-slate-400")}>21 Apr 2026, 22:58</span>
        </div>
        <div className="flex justify-between">
          <span className={cn(T.label, "text-slate-400")}>{t("set.logout.last_activity")}</span>
          <span className={cn(T.caption, "font-bold text-slate-600 dark:text-slate-400")}>{t("set.logout.just_now")}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={onBack} className={btn("neutralSoft", "md")}>
          {t("set.logout.cancel")}
        </button>
        <button onClick={() => onLogout()} className={cn(btn("destructive", "md"), "shadow-lg shadow-rose-100/50")}>
          <LogOut className={ICON.sm} /> {t("set.logout.confirm")}
        </button>
      </div>
    </div>
  );
}
