"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Briefcase,
  Calendar,
  Camera,
  Check,
  History,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { C } from "@/app/lib/colors";
import { FIELD, LABEL } from "@/app/lib/forms";
import { BADGE } from "@/app/lib/data";
import { getRoleInfo } from "@/app/lib/status";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "sonner";
import { isDemoDataEnabled } from "@/app/lib/demo-mode";
import { ApiError } from "@/app/lib/api";
import * as authClient from "@/app/lib/auth-client";

type SettingsPanelProps = {
  t: (key: string, params?: Record<string, string | number>) => string;
};

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  position: string;
  location: string;
};

type ExtendedProfile = {
  email: string;
  phone: string;
  positionKey: string;
  location: string;
  joinDate: string;
};

const EMPTY_EXTENDED: ExtendedProfile = {
  email: "",
  phone: "",
  positionKey: "prof.position.staff",
  location: "",
  joinDate: "-",
};

export function ProfileSettingsPanel({ t }: SettingsPanelProps) {
  const { user, actualRole } = useAuth();
  const queryClient = useQueryClient();
  const role = actualRole ?? "cashier";
  const roleInfo = getRoleInfo(role);
  const badgeKey = role === "inventory_manager" ? "inventory" : role;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [extended, setExtended] = useState<ExtendedProfile>(EMPTY_EXTENDED);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar ?? null);
  const [form, setForm] = useState<ProfileForm>({
    name: user?.name ?? t("prof.default_name"),
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    position: user?.position ?? "",
    location: user?.storeNbr ? `Toko #${user.storeNbr}` : "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<ProfileForm>>({});

  useEffect(() => {
    if (!isDemoDataEnabled()) {
      setExtended({
        ...EMPTY_EXTENDED,
        email: user?.email ?? "",
        phone: user?.phone ?? "",
        location: user?.storeNbr ? `Toko #${user.storeNbr}` : "",
      });
      setAvatarUrl(user?.avatar ?? null);
      setForm({
        name: user?.name ?? t("prof.default_name"),
        email: user?.email ?? "",
        phone: user?.phone ?? "",
        position: user?.position ?? "",
        location: user?.storeNbr ? `Toko #${user.storeNbr}` : "",
      });
      return;
    }
    let cancelled = false;
    void import("@/app/demo/user-profile").then(({ DEMO_USER_PROFILE }) => {
      if (cancelled) return;
      const ext: ExtendedProfile = DEMO_USER_PROFILE[role] ?? DEMO_USER_PROFILE.default;
      setExtended(ext);
      setForm({
        name: user?.name ?? t("prof.default_name"),
        email: ext.email,
        phone: ext.phone,
        position: t(ext.positionKey),
        location: ext.location,
      });
    });
    return () => { cancelled = true; };
  }, [role, t, user?.avatar, user?.email, user?.name, user?.phone, user?.position, user?.storeNbr]);

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
        avatar_url: avatarUrl,
      });
      queryClient.setQueryData(["auth", "me"], updated);
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
    reader.onload = ev => setAvatarUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const activityLogs = [
    { action: t("prof.activity.override_forecast"), target: "Kertas HVS A4 70gr", time: t("prof.activity.time_10m"), importance: "high" },
    { action: t("prof.activity.weekly_report_export"), target: "Cabang Pusat", time: t("prof.activity.time_2h"), importance: "low" },
    { action: t("prof.activity.stock_update"), target: "Tinta Epson 003 Black", time: t("prof.activity.time_yesterday_1420"), importance: "medium" },
    { action: t("prof.activity.system_login"), target: "Desktop · Chrome", time: t("prof.activity.time_yesterday_0800"), importance: "low" },
    { action: t("prof.activity.product_added"), target: "Laminating Pouch A4", time: t("prof.activity.time_2d"), importance: "medium" },
  ];

  return (
    <div className="p-8 space-y-8 flex-1">

      {/* ---- Avatar + Profile Header ---- */}
      <div className="flex items-start gap-5 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-md">
            {avatarUrl
              ? <img src={avatarUrl} alt={t("prof.avatar.alt")} className="w-full h-full object-cover" />
              : <User className="w-8 h-8 text-white" aria-hidden="true" />
            }
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label={t("prof.edit.photo")}
            className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-500 transition-colors"
          >
            <Camera className="w-3 h-3" aria-hidden="true" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className={cn(T.h3, "text-slate-900 dark:text-slate-100 truncate")}>{form.name}</h3>
            <span className={cn(BADGE.base, BADGE.size.xs, BADGE.role[badgeKey as keyof typeof BADGE.role])}>
              {roleInfo.labelId}
            </span>
          </div>
          <div className={cn(T.caption, "flex flex-wrap items-center gap-3 text-slate-400 dark:text-slate-500")}>
            {form.position && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" aria-hidden="true" /> {form.position}</span>}
            {form.email    && <span className="flex items-center gap-1"><Mail className="w-3 h-3" aria-hidden="true" /> {form.email}</span>}
            {extended.joinDate !== "-" && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" aria-hidden="true" /> {extended.joinDate}</span>}
          </div>
          <div className={cn(T.caption, "flex items-center gap-1 mt-1 text-slate-400 dark:text-slate-500")}>
            <KeyRound className="w-3 h-3" aria-hidden="true" />
            <span>{user?.username ?? "-"}</span>
          </div>
        </div>
      </div>

      {/* ---- Edit Form ---- */}
      <div className="space-y-5">
        <h4 className={cn(T.label, "uppercase tracking-widest text-slate-400 dark:text-slate-500")}>{t("prof.edit.title")}</h4>
        <input type="hidden" defaultValue={t("set.profile.display_name_mock")} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div key={field.key} className={FIELD.wrapper}>
                <label htmlFor={`sp-${field.key}`} className={LABEL.base}>{field.label}</label>
                <div className={cn(
                  "flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border rounded-xl px-4 h-11 transition-all",
                  err
                    ? "border-rose-400 ring-2 ring-rose-400/20"
                    : "border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20"
                )}>
                  <Icon className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" aria-hidden="true" />
                  <input
                    id={`sp-${field.key}`}
                    type={field.type}
                    value={form[field.key]}
                    onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className={cn("bg-transparent border-none outline-none w-full text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500", T.body, "font-bold")}
                  />
                </div>
                {err && (
                  <p className={cn(T.caption, "font-bold flex items-center gap-1", C.destructive.icon)}>
                    <AlertTriangle className="w-3 h-3" aria-hidden="true" />{err}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            aria-busy={saving}
            className={cn(
              T.buttonSm,
              "flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-60"
            )}
          >
            {saving
              ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              : <Check className="w-4 h-4" aria-hidden="true" />
            }
            {saving ? t("common.saving") : t("common.save_changes")}
          </button>
        </div>
      </div>

      {/* ---- Activity Log ---- */}
      <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h4 className={cn(T.label, "uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2")}>
            <History className="w-3.5 h-3.5" aria-hidden="true" />
            {t("prof.activity")}
          </h4>
          <button
            type="button"
            onClick={() => toast.success(t("prof.toast.log_downloaded"))}
            className={cn(T.buttonSm, "hover:underline cursor-pointer", C.primary.icon)}
          >
            {t("prof.log.export")}
          </button>
        </div>
        <div className="space-y-2">
          {activityLogs.map((log, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                  log.importance === "high"   ? `${C.destructive.bg} ${C.destructive.icon}` :
                  log.importance === "medium" ? `${C.warning.bg} ${C.warning.icon}` :
                  "bg-slate-100 text-slate-400 dark:bg-slate-700"
                )}>
                  <Activity className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <div>
                  <p className={cn(T.label, "font-bold text-slate-900 dark:text-slate-200 leading-tight")}>{log.action}</p>
                  <p className={cn(T.caption, "text-slate-400 dark:text-slate-500")}>{log.target}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {log.importance === "high" && <AlertTriangle className="w-3 h-3 text-rose-400" aria-hidden="true" />}
                <span className={cn(T.caption, "text-slate-300 dark:text-slate-600")}>{log.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
