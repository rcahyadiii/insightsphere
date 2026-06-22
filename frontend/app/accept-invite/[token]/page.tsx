"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Zap, UserPlus, ArrowRight, CheckCircle2, Loader2,
  Eye, EyeOff, KeyRound, User, Building2, Shield, AlertCircle, Mail,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { R } from "@/app/lib/radii";
import { E } from "@/app/lib/elevation";
import { useTranslation } from "@/app/i18n";

type Step = "invite" | "setup" | "success";

type InvitePreview = {
  role: string;
  full_name: string | null;
  email: string;
  store_nbr: number | null;
  expires_at: string;
  inviter_name: string;
};

// ROLE_LABEL diambil via t(`um.role.${role}`) supaya konsisten dengan i18n.

const ROLE_BADGE: Record<string, string> = {
  owner:             "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/50",
  admin:             "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  cashier:           "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50",
  inventory_manager: "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-800/50",
};

const formatDate = (iso: string, lang: "ID" | "EN") =>
  new Date(iso).toLocaleDateString(lang === "ID" ? "id-ID" : "en-US", { day: "numeric", month: "short", year: "numeric" });

export default function AcceptInvitePage() {
  const { t, lang } = useTranslation();
  const params = useParams();
  const token = String(params.token);

  const [step, setStep]               = useState<Step>("invite");
  const [inviteData, setInviteData]   = useState<InvitePreview | null>(null);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [loadingInvite, setLoading]   = useState(true);
  const [username, setUsername]       = useState("");
  const [pin, setPin]                 = useState("");
  const [confirmPin, setConfirmPin]   = useState("");
  const [showPin, setShowPin]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState("");

  useEffect(() => {
    fetch(`/api/auth/invite-preview/${token}`)
      .then(async r => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.detail || t("auth.invite.invalid_token"));
        setInviteData(data as InvitePreview);
      })
      .catch((e: Error) => setFetchError(e.message || t("auth.invite.invalid_token")))
      .finally(() => setLoading(false));
  }, [token, t]);

  const roleLabel = inviteData ? t(`um.role.${inviteData.role}`) : "";
  const roleBadge = inviteData ? (ROLE_BADGE[inviteData.role] ?? ROLE_BADGE.cashier) : "";
  const loginHref = inviteData ? `/login/${inviteData.role}` : "/";

  const handleAccept = () => setStep("setup");

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (username.trim().length < 3)  { setError(t("auth.invite.error_name"));     return; }
    if (!/^\d{4,6}$/.test(pin))      { setError(t("auth.invite.error_min"));      return; }
    if (pin !== confirmPin)           { setError(t("auth.invite.error_mismatch")); return; }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/auth/accept-invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || t("auth.invite.create_failed"));
      } else {
        setStep("success");
      }
    } catch {
      setError(t("auth.invite.network_error"));
    } finally {
      setIsLoading(false);
    }
  };

  const pinFields = [
    { id: "inv-pin",  label: t("auth.invite.password_label"),   val: pin,        set: setPin,        show: showPin,    toggle: () => setShowPin(v => !v) },
    { id: "inv-conf", label: t("auth.invite.confirm_pw_label"), val: confirmPin, set: setConfirmPin, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      <div className="w-full max-w-sm z-10 animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* Brand badge */}
        <div className="flex items-center justify-center mb-6">
          <div className={cn(R.full, E.sm, "inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2")}>
            <div className={cn(R.full, "size-5 bg-indigo-600 flex items-center justify-center")}>
              <Zap className="size-3 text-white" />
            </div>
            <span className={cn(T.caption, "text-slate-500 dark:text-slate-400")}>InsightSphere</span>
          </div>
        </div>

        <div className={cn(R.lg, E.sm, "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-8")}>

          {/* ── Loading ─────────────────────────── */}
          {loadingInvite && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="size-8 text-indigo-500 animate-spin" />
              <p className={cn(T.caption, "text-slate-400")}>{t("auth.invite.loading")}</p>
            </div>
          )}

          {/* ── Error (invalid token) ────────────── */}
          {!loadingInvite && fetchError && (
            <div className="flex flex-col items-center text-center py-8 gap-4">
              <div className={cn(R.xl, "size-14 bg-rose-50 dark:bg-rose-950 flex items-center justify-center")}>
                <AlertCircle className="size-7 text-rose-500" />
              </div>
              <div>
                <h1 className={cn(T.h2, "text-slate-900 dark:text-slate-100")}>{t("auth.invite.invalid_title")}</h1>
                <p className={cn(T.caption, "text-slate-400 dark:text-slate-500 mt-1")}>{fetchError}</p>
              </div>
            </div>
          )}

          {/* ── Step 1: Invite Card ─────────────────── */}
          {!loadingInvite && !fetchError && inviteData && step === "invite" && (
            <div className="animate-in fade-in duration-300 space-y-6">
              <div className="text-center space-y-3">
                <div className={cn(R.xl, "size-14 bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mx-auto")}>
                  <UserPlus className="size-7 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h1 className={cn(T.h2, "text-slate-900 dark:text-slate-100")}>{t("auth.invite.header")}</h1>
                  <p className={cn(T.caption, "text-slate-400 dark:text-slate-500 mt-1")}>
                    {t("auth.invite.invited_by", { name: inviteData.inviter_name })}
                  </p>
                </div>
              </div>

              {/* Invite details */}
              <div className={cn(R.lg, "bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700/60")}>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 text-slate-400" />
                    <span className={cn(T.label, "text-slate-500 dark:text-slate-400")}>Email</span>
                  </div>
                  <span className={cn(T.bodySm, "font-bold text-slate-800 dark:text-slate-200 truncate max-w-[160px]")}>{inviteData.email}</span>
                </div>
                {inviteData.store_nbr != null && (
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="size-3.5 text-slate-400" />
                      <span className={cn(T.label, "text-slate-500 dark:text-slate-400")}>{t("auth.invite.branch")}</span>
                    </div>
                    <span className={cn(T.bodySm, "font-bold text-slate-800 dark:text-slate-200")}>Toko #{inviteData.store_nbr}</span>
                  </div>
                )}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="size-3.5 text-slate-400" />
                    <span className={cn(T.label, "text-slate-500 dark:text-slate-400")}>{t("auth.invite.role_label")}</span>
                  </div>
                  <span className={cn(T.micro, R.full, "px-2 py-0.5 border uppercase tracking-wide", roleBadge)}>
                    {roleLabel}
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className={cn(T.label, "text-slate-400 dark:text-slate-500")}>{t("auth.invite.expires")}</span>
                  <span className={cn(T.dataSm, "font-bold text-amber-600 dark:text-amber-400")}>{formatDate(inviteData.expires_at, lang)}</span>
                </div>
              </div>

              <button
                onClick={handleAccept}
                className={cn(T.buttonSm, R.lg, "w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-100 dark:shadow-none cursor-pointer")}
              >
                {t("auth.invite.accept_btn")} <ArrowRight className="size-4" />
              </button>

              <p className={cn(T.caption, "text-center text-slate-400 dark:text-slate-500")}>
                {t("auth.invite.token_label")}: <span className={cn(T.code, "text-slate-500 dark:text-slate-400")}>{token.slice(0, 16)}…</span>
              </p>
            </div>
          )}

          {/* ── Step 2: Setup Account ───────────────── */}
          {step === "setup" && (
            <div className="animate-in fade-in duration-300">
              <div className="flex flex-col items-center text-center mb-6">
                <div className={cn(R.lg, "size-12 bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mb-4")}>
                  <User className="size-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className={cn(T.h2, "text-slate-900 dark:text-slate-100")}>{t("auth.invite.setup_header")}</h1>
                <p className={cn(T.caption, "text-slate-400 dark:text-slate-500 mt-1")}>{t("auth.invite.setup_subheader")}</p>
              </div>

              <form onSubmit={handleSetup} className="space-y-3">
                {/* Name field */}
                <div className="space-y-1.5">
                  <label htmlFor="inv-name" className={cn(T.label, "text-slate-400 dark:text-slate-500 pl-1")}>
                    {t("auth.invite.name_label")}
                  </label>
                  <div className={cn(R.lg, "flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 h-12 transition-all focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-indigo-300")}>
                    <User className="size-4 text-slate-300 dark:text-slate-600 shrink-0" />
                    <input
                      id="inv-name"
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder={t("auth.invite.name_placeholder")}
                      autoFocus
                      className={cn(T.body, "font-bold bg-transparent border-none outline-none w-full text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600")}
                    />
                  </div>
                </div>

                {/* PIN fields */}
                {pinFields.map(f => (
                  <div key={f.id} className="space-y-1.5">
                    <label htmlFor={f.id} className={cn(T.label, "text-slate-400 dark:text-slate-500 pl-1")}>
                      {f.label}
                    </label>
                    <div className={cn(R.lg, "flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 h-12 transition-all focus-within:ring-2 focus-within:ring-indigo-400")}>
                      <KeyRound className="size-4 text-slate-300 dark:text-slate-600 shrink-0" />
                      <input
                        id={f.id}
                        type={f.show ? "text" : "password"}
                        inputMode="numeric"
                        maxLength={6}
                        value={f.val}
                        onChange={e => f.set(e.target.value.replace(/\D/g, ""))}
                        placeholder="••••••"
                        className={cn(T.body, "font-bold bg-transparent border-none outline-none w-full text-slate-900 dark:text-slate-100 flex-1")}
                      />
                      <button
                        type="button"
                        onClick={f.toggle}
                        aria-label={f.show ? t("auth.aria.hide_password") : t("auth.aria.show_password")}
                        className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors cursor-pointer"
                      >
                        {f.show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Error banner */}
                {error && (
                  <div className={cn(T.bodySm, R.lg, "flex items-start gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-3 py-2.5 border border-rose-100 dark:border-rose-800/50 animate-in fade-in duration-150")}>
                    <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(T.buttonSm, R.lg, "w-full h-11 mt-1 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-emerald-100 dark:shadow-none cursor-pointer")}
                >
                  {isLoading
                    ? <Loader2 className="size-4 animate-spin" />
                    : <><span>{t("auth.invite.submit_btn")}</span><ArrowRight className="size-4" /></>
                  }
                </button>
              </form>
            </div>
          )}

          {/* ── Step 3: Success ─────────────────────── */}
          {step === "success" && (
            <div className="animate-in fade-in zoom-in-95 duration-300 text-center space-y-5 py-4">
              <div className={cn(R.xl, "size-16 bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mx-auto border-4 border-emerald-100 dark:border-emerald-800/50")}>
                <CheckCircle2 className="size-8 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className={cn(T.h2, "text-slate-900 dark:text-slate-100")}>{t("auth.invite.success_title")}</h2>
                <p className={cn(T.bodySm, "text-slate-400 dark:text-slate-500 mt-1")}>{t("auth.invite.success_subtitle")}</p>
                <p className={cn(T.bodyEmphasis, "text-indigo-600 dark:text-indigo-400 mt-2")}>{username}</p>
                <p className={cn(T.caption, "text-slate-500 dark:text-slate-400 mt-0.5")}>{roleLabel}</p>
              </div>
              <Link
                href={loginHref}
                className={cn(T.buttonSm, R.lg, "w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 dark:shadow-none")}
              >
                {t("auth.invite.login_btn")} <ArrowRight className="size-4" />
              </Link>
            </div>
          )}
        </div>

        <p className={cn(T.caption, "text-center mt-5 text-slate-300 dark:text-slate-600")}>
          {t("auth.invite.footer")}
        </p>
      </div>
    </div>
  );
}
