"use client";

import { AlertTriangle, BarChart3, Bell, CalendarDays, Mail, MessageSquare } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { C } from "@/app/lib/colors";
import { T } from "@/app/lib/typography";
import { FIELD, INPUT, LABEL, SWITCH } from "@/app/lib/forms";
import { ICON } from "@/app/lib/spacing";

type SettingsPanelProps = {
  t: (key: string, params?: Record<string, string | number>) => string;
};

export function NotificationsSettingsPanel({ t }: SettingsPanelProps) {
  const notifItems = [
    { key: "stock_alert", icon: AlertTriangle, enabled: true, color: "amber" as const },
    { key: "daily_report", icon: BarChart3, enabled: true, color: "indigo" as const },
    { key: "large_txn", icon: CalendarDays, enabled: false, color: "rose" as const, hasThreshold: true },
    { key: "weekly_summary", icon: CalendarDays, enabled: true, color: "emerald" as const },
  ];

  const channels = [
    { key: "channel_email", icon: Mail, active: true },
    { key: "channel_inapp", icon: Bell, active: true },
    { key: "channel_wa", icon: MessageSquare, active: false },
  ];

  const colorMap = { amber: `${C.warning.bg} ${C.warning.icon}`, indigo: `${C.primary.bg} ${C.primary.icon}`, rose: `${C.destructive.bg} ${C.destructive.icon}`, emerald: `${C.success.bg} ${C.success.icon}` };

  return (
    <div className="p-8 space-y-8 flex-1">
      <div className="space-y-2">
        <h3 className={cn(T.h3, "text-slate-900 dark:text-slate-100 flex items-center gap-3")}>
          <Bell className={cn(ICON.lg, C.primary.icon)} />
          {t("set.notif.title")}
        </h3>
        <p className={cn(T.bodySm, "text-slate-500 dark:text-slate-400")}>{t("set.notif.desc")}</p>
      </div>

      <div className="space-y-3">
        {notifItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colorMap[item.color])}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={cn(T.label, "text-slate-900 dark:text-slate-200")}>{t(`set.notif.${item.key}`)}</p>
                    <p className={cn(T.caption, "text-slate-400")}>{t(`set.notif.${item.key}_desc`)}</p>
                  </div>
                </div>
                <button role="switch" aria-checked={item.enabled} className={cn(SWITCH.base, item.enabled ? SWITCH.on : SWITCH.off)}>
                  <span className={cn(SWITCH.thumb, item.enabled ? SWITCH.thumbOn : SWITCH.thumbOff)} />
                </button>
              </div>
              {item.hasThreshold && (
                <div className="pl-11">
                  <div className={FIELD.wrapper}>
                    <label htmlFor="set-notif-threshold" className={LABEL.base}>{t("set.notif.large_txn_threshold")}</label>
                    <input id="set-notif-threshold" type="number" defaultValue="500000" className={cn(INPUT.base, INPUT.size.sm, "w-40 tabular-nums")} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Channel Selector */}
      <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
        <h4 className={cn(T.h4, "text-slate-900 dark:text-slate-200 flex items-center gap-2")}>
          <MessageSquare className="w-4 h-4 text-slate-400" /> {t("set.notif.channel")}
        </h4>
        <div className="grid grid-cols-3 gap-3">
          {channels.map((ch) => {
            const ChIcon = ch.icon;
            return (
              <button key={ch.key} className={cn(
                "flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all cursor-pointer",
                ch.active ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400" : "border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-200 dark:hover:border-slate-600"
              )}>
                <ChIcon className="w-5 h-5" />
                <span className={cn(T.buttonSm)}>{t(`set.notif.${ch.key}`)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
