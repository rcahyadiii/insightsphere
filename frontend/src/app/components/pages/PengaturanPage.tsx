"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, type ElementType } from "react";
import {
  Bell,
  BrainCircuit,
  ChevronRight,
  Globe,
  Lock,
  LogOut,
  ShieldCheck,
  Store,
  User,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/context/AuthContext";
import { useTranslation } from "@/app/i18n";
import { btn, BTN } from "@/app/lib/buttons";
import { C } from "@/app/lib/colors";
import { R } from "@/app/lib/radii";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { GAP, ICON, STACK } from "@/app/lib/spacing";
import { SettingsShellSkeleton } from "@/app/components/Skeletons";

type SettingsTab = "profile" | "store" | "notifications" | "ai" | "access" | "security" | "logout";

const settingsPanelLoading = () => <SettingsShellSkeleton />;

const ProfileSettingsPanel = dynamic(
  () => import("@/app/components/settings/ProfileSettingsPanel").then((mod) => mod.ProfileSettingsPanel),
  { loading: settingsPanelLoading }
);
const StoreSettingsPanel = dynamic(
  () => import("@/app/components/settings/StoreSettingsPanel").then((mod) => mod.StoreSettingsPanel),
  { loading: settingsPanelLoading }
);
const NotificationsSettingsPanel = dynamic(
  () => import("@/app/components/settings/NotificationsSettingsPanel").then((mod) => mod.NotificationsSettingsPanel),
  { loading: settingsPanelLoading }
);
const AISettingsPanel = dynamic(
  () => import("@/app/components/settings/AISettingsPanel").then((mod) => mod.AISettingsPanel),
  { loading: settingsPanelLoading }
);
const AccessSettingsPanel = dynamic(
  () => import("@/app/components/settings/AccessSettingsPanel").then((mod) => mod.AccessSettingsPanel),
  { loading: settingsPanelLoading }
);
const SecuritySettingsPanel = dynamic(
  () => import("@/app/components/settings/SecuritySettingsPanel").then((mod) => mod.SecuritySettingsPanel),
  { loading: settingsPanelLoading }
);
const LogoutSettingsPanel = dynamic(
  () => import("@/app/components/settings/LogoutSettingsPanel").then((mod) => mod.LogoutSettingsPanel),
  { loading: settingsPanelLoading }
);

export function PengaturanPage() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    if (isSaving) return;
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success(t("set.toast.success"));
    }, 1500);
  };

  const handleGoBack = useCallback(() => setActiveTab("profile"), []);

  const tabs: { id: SettingsTab; label: string; icon: ElementType }[] = [
    { id: "profile", label: t("set.tab.profile"), icon: User },
    { id: "store", label: t("set.tab.store"), icon: Store },
    { id: "notifications", label: t("set.tab.notifications"), icon: Bell },
    { id: "ai", label: t("set.tab.ai"), icon: BrainCircuit },
    { id: "access", label: t("set.tab.access"), icon: Users },
    { id: "security", label: t("set.tab.security"), icon: Lock },
    { id: "logout", label: t("set.tab.logout"), icon: LogOut },
  ];

  return (
    <div className="space-y-6 pb-6">
      <div className={cn("flex flex-col md:flex-row md:items-center justify-between", GAP.default)}>
        <div className={STACK.tight}>
          <h1 className={cn(T.h1, "text-slate-900 dark:text-slate-100")}>{t("set.header")}</h1>
          <div className="flex items-center gap-2">
            <p className={cn(T.body, "text-slate-500 dark:text-slate-400 flex items-center gap-1.5")}>
              <ShieldCheck className={cn(ICON.sm, C.primary.icon)} />
              {t("set.subheader")}
            </p>
            <span className={cn(T.micro, R.xs, "px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-800/50")}>{t("set.access.admin_level")}</span>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          aria-busy={isSaving}
          className={cn(btn("neutral", "md"), "shadow-lg shadow-slate-100/50")}
        >
          {isSaving ? <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className={cn(ICON.sm, "text-amber-400")} />}
          {isSaving ? t("set.btn.saving") : t("set.btn.save")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div
          role="tablist"
          aria-orientation="vertical"
          aria-label={t("set.aria.navigation")}
          className="lg:col-span-1 space-y-1"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                BTN.base,
                BTN.size.md,
                "w-full flex items-center justify-between rounded-xl font-bold transition-all group",
                activeTab === tab.id
                  ? cn(BTN.variant.neutral, "translate-x-1 shadow-xl")
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 bg-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <tab.icon className={cn(ICON.sm, activeTab === tab.id ? "text-indigo-400" : "text-slate-300 group-hover:text-slate-500")} />
                {tab.label}
              </div>
              {activeTab === tab.id && <ChevronRight className={cn(ICON.xs, "text-white/50")} />}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[500px] overflow-hidden flex flex-col">
            <div
              id={`panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              className="flex-1"
            >
              {activeTab === "profile" && <ProfileSettingsPanel t={t} />}
              {activeTab === "store" && <StoreSettingsPanel t={t} />}
              {activeTab === "notifications" && <NotificationsSettingsPanel t={t} />}
              {activeTab === "ai" && <AISettingsPanel t={t} />}
              {activeTab === "access" && <AccessSettingsPanel t={t} />}
              {activeTab === "security" && <SecuritySettingsPanel t={t} />}
              {activeTab === "logout" && <LogoutSettingsPanel t={t} onBack={handleGoBack} onLogout={logout} />}
            </div>

            <div className={cn("px-8 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-data text-slate-500 dark:text-slate-400", T.caption)}>
              <span>System Hash: IS-A92-F1X</span>
              <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> Region: US-EAST-1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
