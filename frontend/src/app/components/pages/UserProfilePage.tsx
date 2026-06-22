"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as authClient from "@/app/lib/auth-client";
import { ApiError } from "@/app/lib/api";
import {
  User, MapPin, Mail, Phone, Calendar, ShieldCheck, Trophy,
  TrendingUp, Activity, History, Edit2, Lock,
  X, Check, Camera, LogOut, Shield, AlertTriangle,
  Briefcase, KeyRound,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { C } from "@/app/lib/colors";
import { ICON } from "@/app/lib/spacing";
import { BADGE } from "@/app/lib/data";
import { getRoleInfo } from "@/app/lib/status";
import { useTranslation } from "@/app/i18n";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "sonner";
import { UserProfileSkeleton } from "@/app/components/Skeletons";
import { A11Y } from "@/app/lib/a11y";
import { isDemoDataEnabled } from "@/app/lib/demo-mode";

type ExtendedProfile = {
  email: string;
  phone: string;
  positionKey: string;
  location: string;
  joinDate: string;
};

const EMPTY_EXTENDED_PROFILE: Record<string, ExtendedProfile> = {
  default: {
    email: "",
    phone: "",
    positionKey: "prof.position.staff",
    location: "",
    joinDate: "-",
  },
};

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  position: string;
  location: string;
}

export function UserProfilePage() {
  const { t } = useTranslation();
  const { user, actualRole, logout } = useAuth();
  const queryClient = useQueryClient();
  const [extendedProfiles, setExtendedProfiles] = useState<Record<string, ExtendedProfile>>(EMPTY_EXTENDED_PROFILE);

  const extended = extendedProfiles[actualRole ?? "default"] ?? extendedProfiles.default;

  const realProfile: ProfileForm = {
    name: user?.name ?? t("prof.default_name"),
    email: user?.email ?? extended.email,
    phone: user?.phone ?? extended.phone,
    position: user?.position ?? t(extended.positionKey),
    location: user?.storeNbr ? `Toko #${user.storeNbr}` : extended.location,
  };

  // ---- Local editable state ----
  const [profile, setProfile] = useState<ProfileForm>(realProfile);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar ?? null);
  const [twoFaEnabled, setTwoFaEnabled] = useState(user?.twoFactorEnabled ?? false);
  const [compactMode, setCompactMode] = useState(false);

  // ---- Edit Modal ----
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<ProfileForm>(profile);
  const [formAvatar, setFormAvatar] = useState<string | null>(avatarUrl);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<ProfileForm>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsDataLoading(false), 250);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isDemoDataEnabled()) return;

    let cancelled = false;
    void import("@/app/demo/user-profile").then(({ DEMO_USER_PROFILE }) => {
      if (!cancelled) setExtendedProfiles(DEMO_USER_PROFILE);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setProfile({
      name: user?.name ?? t("prof.default_name"),
      email: user?.email ?? extended.email,
      phone: user?.phone ?? extended.phone,
      position: user?.position ?? t(extended.positionKey),
      location: user?.storeNbr ? `Toko #${user.storeNbr}` : extended.location,
    });
    setAvatarUrl(user?.avatar ?? null);
    setTwoFaEnabled(user?.twoFactorEnabled ?? false);
  }, [user?.name, user?.email, user?.phone, user?.position, user?.storeNbr, user?.avatar, user?.twoFactorEnabled, extended.email, extended.location, extended.phone, extended.positionKey, t]);

  if (isDataLoading) {
    return (
      <div className="space-y-6 pb-6 animate-in fade-in duration-300">
        <UserProfileSkeleton />
      </div>
    );
  }

  const openEdit = () => {
    setForm(profile);
    setFormAvatar(avatarUrl);
    setErrors({});
    setEditOpen(true);
  };

  const validate = (): boolean => {
    const e: Partial<ProfileForm> = {};
    if (!form.name.trim()) e.name = t("prof.validation.name_required");
    if (form.email && !form.email.includes("@")) e.email = t("prof.validation.email_invalid");
    if (form.phone && !/^[0-9+\-\s]{8,15}$/.test(form.phone)) e.phone = t("prof.validation.phone_invalid");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const updated = await authClient.updateMe({
        full_name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        position: form.position.trim() || null,
        avatar_url: formAvatar,
      });
      queryClient.setQueryData(["auth", "me"], updated);
      setProfile(form);
      setAvatarUrl(formAvatar);
      setEditOpen(false);
      toast.success(t("prof.toast.updated"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error(t("prof.toast.avatar_size")); return; }
    const reader = new FileReader();
    reader.onload = ev => setFormAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    await logout();
  };

  const role = actualRole ?? "cashier";
  const roleInfo = getRoleInfo(role);

  const activityLogs = [
    { action: t("prof.activity.override_forecast"), target: "Kertas HVS A4 70gr", time: t("prof.activity.time_10m"), importance: "high" },
    { action: t("prof.activity.weekly_report_export"), target: "Cabang Pusat", time: t("prof.activity.time_2h"), importance: "low" },
    { action: t("prof.activity.stock_update"), target: "Tinta Epson 003 Black", time: t("prof.activity.time_yesterday_1420"), importance: "medium" },
    { action: t("prof.activity.system_login"), target: "Desktop · Chrome", time: t("prof.activity.time_yesterday_0800"), importance: "low" },
    { action: t("prof.activity.product_added"), target: "Laminating Pouch A4", time: t("prof.activity.time_2d"), importance: "medium" },
  ];

  const achievements = [
    { title: t("prof.ach.accuracy_master"), description: t("prof.ach.accuracy_master_desc"), icon: Trophy, color: "amber" },
    { title: t("prof.ach.efficiency_hero"), description: t("prof.ach.efficiency_hero_desc"), icon: ShieldCheck, color: "emerald" },
    { title: t("prof.ach.data_guardian"), description: t("prof.ach.data_guardian_desc"), icon: ShieldCheck, color: "indigo" },
  ];

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">

      {/* ---- Profile Header Card ---- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-slate-900 to-indigo-950 relative">
          <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className={cn(T.micro, "text-white/80")}>{t("prof.status.active")}</span>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between -mt-12 gap-6 relative z-10">
            {/* Avatar + Name */}
            <div className="flex flex-col lg:flex-row lg:items-end gap-5">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-xl flex items-center justify-center overflow-hidden ring-1 ring-slate-100 dark:ring-slate-700">
                  {avatarUrl
                    ? <img src={avatarUrl} alt={t("prof.avatar.alt")} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-slate-900 dark:bg-slate-700 flex items-center justify-center">
                        <User className="w-9 h-9 text-white" />
                      </div>
                  }
                </div>
              </div>

              <div className="mb-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h1 className={cn(T.h1, "text-slate-900 dark:text-slate-100")}>{profile.name}</h1>
                  <span className={cn(BADGE.base, BADGE.size.xs, BADGE.role[role as keyof typeof BADGE.role])}>
                    {roleInfo.labelId}
                  </span>
                </div>
                <div className={cn(T.caption, "flex flex-wrap items-center gap-4 text-slate-400 dark:text-slate-500")}>
                  <div className="flex items-center gap-1.5"><Briefcase className={ICON.sm} /> {profile.position}</div>
                  <div className="flex items-center gap-1.5"><MapPin className={ICON.sm} /> {profile.location}</div>
                  <div className="flex items-center gap-1.5"><Mail className={ICON.sm} /> {profile.email}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={openEdit}
                className={cn(T.buttonSm, "flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100/50 hover:bg-indigo-500 transition-all cursor-pointer")}>
                <Edit2 className={ICON.sm} /> {t("prof.edit.title")}
              </button>
              <button
                onClick={handleLogout}
                className={cn(T.buttonSm, "flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer")}>
                <LogOut className={ICON.sm} /> {t("pos.logout")}
              </button>
            </div>
          </div>

          {/* Info row */}
          <div className="flex flex-wrap gap-4 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
            {[
              { icon: Phone, label: t("prof.info.phone"), val: profile.phone },
              { icon: Calendar, label: t("prof.info.joined"), val: extended.joinDate },
              { icon: KeyRound, label: t("prof.info.username"), val: user?.username ?? "-" },
              { icon: Shield, label: t("prof.info.twofa"), val: twoFaEnabled ? t("set.access.active") : t("set.access.inactive"), color: twoFaEnabled ? C.success.icon : "text-slate-400" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <item.icon className={cn(ICON.sm, "text-slate-400 dark:text-slate-500 shrink-0")} />
                <span className={cn(T.label, "text-slate-400 dark:text-slate-500")}>{item.label}:</span>
                <span className={cn(T.bodySm, "font-bold text-slate-700 dark:text-slate-300", item.color)}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Main Grid ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Performance Metrics */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className={cn("font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2", T.label)}>
                <TrendingUp className={cn("w-4 h-4", C.primary.icon)} /> {t("prof.metrics")}
              </h2>
              <p className={cn(T.caption, "text-slate-400")}>{t("prof.period")}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: t("prof.metric.accuracy"), value: "+4.2%", sub: t("prof.metric.vs_last"), color: C.success.icon },
                { label: t("prof.metric.alerts"), value: "158", sub: t("prof.metric.processed"), color: "text-slate-900 dark:text-slate-100" },
                { label: t("prof.metric.audit"), value: "98/100", sub: t("prof.metric.internal_score"), color: C.primary.icon },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className={cn(T.label, "text-slate-400 dark:text-slate-500 mb-1.5")}>{stat.label}</p>
                  <p className={cn(T.kpiCard, "font-bold font-data tracking-tighter", stat.color)}>{stat.value}</p>
                  <p className={cn(T.caption, "text-slate-400 dark:text-slate-500 mt-0.5")}>{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className={cn("font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2", T.label)}>
                <History className="w-4 h-4 text-slate-400" /> {t("prof.activity")}
              </h2>
              <button
                onClick={() => toast.success(t("prof.toast.log_downloaded"))}
                className={cn(T.buttonSm, "hover:underline cursor-pointer", C.primary.icon)}>
                {t("prof.log.export")}
              </button>
            </div>
            <div className="space-y-2">
              {activityLogs.map((log, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      log.importance === "high" ? `${C.destructive.bg} ${C.destructive.icon}` :
                      log.importance === "medium" ? `${C.warning.bg} ${C.warning.icon}` :
                      "bg-slate-50 text-slate-400 dark:bg-slate-700"
                    )}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={cn("font-bold text-slate-900 dark:text-slate-200 leading-tight", T.label)}>{log.action}</p>
                      <p className={cn(T.caption, "font-bold text-slate-400 dark:text-slate-500")}>{log.target}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {log.importance === "high" && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                    <span className={cn(T.caption, "text-slate-300 dark:text-slate-600")}>{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* Achievements */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className={cn("font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-5 flex items-center gap-2", T.label)}>
              <Trophy className={cn("w-4 h-4", C.warning.icon)} /> {t("prof.achievements")}
            </h2>
            <div className="space-y-4">
              {achievements.map((ach, i) => {
                const Icon = ach.icon;
                return (
                  <div key={i} className="flex gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-xl shrink-0 flex items-center justify-center shadow-sm",
                      ach.color === "amber" ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30" :
                      ach.color === "emerald" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30" :
                      "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={cn("font-bold text-slate-900 dark:text-slate-200 leading-tight mb-0.5", T.label)}>{ach.title}</p>
                      <p className={cn(T.caption, "text-slate-400 dark:text-slate-500 leading-tight")}>{ach.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-5 text-white space-y-5 relative overflow-hidden shadow-xl border border-slate-800">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -mr-12 -mt-12" />
            <h2 className={cn("font-bold text-white uppercase tracking-widest relative z-10 flex items-center gap-2", T.label)}>
              <Lock className="w-4 h-4 text-indigo-400" /> {t("common.security")}
            </h2>
            <div className="space-y-2.5 relative z-10">
              {/* 2FA Toggle */}
              <div className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/5 hover:bg-white/8 transition-colors">
                <div>
                  <p className={cn(T.label, "text-slate-300")}>{t("prof.security.2fa")}</p>
                  <p className={cn(T.caption, "mt-0.5", twoFaEnabled ? "text-emerald-400" : "text-slate-500")}>
                    {twoFaEnabled ? t("prof.security.2fa_enabled") : t("prof.security.2fa_disabled")}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setTwoFaEnabled(v => !v);
                    toast.success(twoFaEnabled ? t("prof.security.2fa_deactivated") : t("prof.security.2fa_activated"));
                  }}
                  className={cn(A11Y.tapTarget, "relative shrink-0 cursor-pointer")}
                  aria-label={t("prof.security.toggle_2fa")}
                >
                  <div className={cn("w-9 h-5 rounded-full transition-colors duration-200", twoFaEnabled ? "bg-emerald-500" : "bg-white/10")}>
                    <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200", twoFaEnabled ? "right-0.5" : "left-0.5")} />
                  </div>
                </button>
              </div>

              {/* Compact Mode Toggle */}
              <div className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/5 hover:bg-white/8 transition-colors">
                <div>
                  <p className={cn(T.label, "text-slate-300")}>{t("prof.security.compact")}</p>
                  <p className={cn(T.caption, "text-slate-500 mt-0.5")}>{t("prof.security.compact_desc")}</p>
                </div>
                <button
                  onClick={() => setCompactMode(v => !v)}
                  className={cn(A11Y.tapTarget, "relative shrink-0 cursor-pointer")}
                  aria-label={t("prof.security.toggle_compact")}
                >
                  <div className={cn("w-9 h-5 rounded-full transition-colors duration-200", compactMode ? "bg-indigo-500" : "bg-white/10")}>
                    <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200", compactMode ? "right-0.5" : "left-0.5")} />
                  </div>
                </button>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={cn(T.buttonSm, "relative z-10 w-full py-2.5 bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 rounded-xl text-white hover:text-rose-300 transition-all flex items-center justify-center gap-2 cursor-pointer")}>
              <LogOut className={ICON.sm} /> {t("prof.security.signout")}
            </button>
          </div>
        </div>
      </div>

      {/* ========= EDIT PROFILE MODAL ========= */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200 overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className={cn(T.label, "font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest")}>{t("prof.edit.title")}</h3>
              <button onClick={() => setEditOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Avatar Upload */}
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                    {formAvatar
                      ? <img src={formAvatar} alt={t("prof.avatar.preview_alt")} className="w-full h-full object-cover" />
                      : <User className="w-8 h-8 text-slate-400" />
                    }
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-500 transition-colors cursor-pointer"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
                <div>
                  <p className={cn(T.bodySm, "font-bold text-slate-700 dark:text-slate-300")}>{t("prof.edit.photo")}</p>
                  <p className={cn(T.caption, "font-bold text-slate-400 dark:text-slate-500 mt-0.5")}>{t("prof.edit.photo_requirements")}</p>
                  {formAvatar && (
                    <button
                      type="button"
                      onClick={() => setFormAvatar(null)}
                      className={cn(T.buttonSm, "mt-1 hover:underline cursor-pointer", C.destructive.icon)}>
                      {t("prof.edit.remove_photo")}
                    </button>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              {([
                { key: "name",     label: t("prof.edit.field.name"),     icon: User,      type: "text",  placeholder: t("prof.edit.field.name_placeholder") },
                { key: "email",    label: t("prof.edit.field.email"),    icon: Mail,      type: "email", placeholder: t("prof.edit.field.email_placeholder") },
                { key: "phone",    label: t("prof.edit.field.phone"),    icon: Phone,     type: "tel",   placeholder: t("prof.edit.field.phone_placeholder") },
                { key: "position", label: t("prof.edit.field.position"), icon: Briefcase, type: "text",  placeholder: t("prof.edit.field.position_placeholder") },
                { key: "location", label: t("prof.edit.field.location"), icon: MapPin,    type: "text",  placeholder: t("prof.edit.field.location_placeholder") },
              ] as const).map(field => {
                const Icon = field.icon;
                const err = errors[field.key];
                return (
                  <div key={field.key} className="space-y-1.5">
                    <label htmlFor={`up-${field.key}`} className={cn(T.label, "text-slate-400 dark:text-slate-500")}>{field.label}</label>
                    <div className={cn(
                      "flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border rounded-xl px-4 h-11 transition-all",
                      err ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20 dark:ring-rose-500/20" : "border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20"
                    )}>
                      <Icon className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                      <input
                        id={`up-${field.key}`}
                        type={field.type}
                        value={form[field.key]}
                        onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className={cn("bg-transparent border-none outline-none w-full text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500", T.body, "font-bold")}
                      />
                    </div>
                    {err && <p className={cn(T.caption, "font-bold flex items-center gap-1", C.destructive.icon)}><AlertTriangle className="w-3 h-3" />{err}</p>}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditOpen(false)}
                className={cn("px-4 py-2 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer", T.buttonSm)}
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={cn("flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-sm disabled:opacity-60 cursor-pointer", T.buttonSm)}
              >
                {saving
                  ? <><span className={cn(ICON.sm, "border-2 border-white/30 border-t-white rounded-full animate-spin")} />{t("common.saving")}</>
                  : <><Check className={ICON.sm} />{t("common.save_changes")}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
