"use client";

import { useState } from "react";
import {
  Zap, Mail, ArrowRight, ArrowLeft,
  CheckCircle2, Loader2, KeyRound, Eye, EyeOff, AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { R } from "@/app/lib/radii";
import { E } from "@/app/lib/elevation";
import { useTranslation } from "@/app/i18n";
import { LoginControls } from "@/app/components/LoginControls";

type Step = "email" | "sent" | "reset" | "success";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();

  const [step, setStep]                   = useState<Step>("email");
  const [email, setEmail]                 = useState("");
  const [newPassword, setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPw]   = useState("");
  const [showNew, setShowNew]             = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [isLoading, setIsLoading]         = useState(false);
  const [error, setError]                 = useState("");

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsLoading(false);
    setStep("sent");
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) { setError(t("auth.forgot.error_min")); return; }
    if (newPassword !== confirmPassword) { setError(t("auth.forgot.error_mismatch")); return; }
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsLoading(false);
    setStep("success");
  };

  const passwordFields = [
    {
      key: "new",
      label: t("auth.forgot.new_password_label"),
      val: newPassword,
      set: setNewPassword,
      show: showNew,
      toggle: () => setShowNew(v => !v),
    },
    {
      key: "confirm",
      label: t("auth.forgot.confirm_password_label"),
      val: confirmPassword,
      set: setConfirmPw,
      show: showConfirm,
      toggle: () => setShowConfirm(v => !v),
    },
  ];

  const sentSteps = [
    t("auth.forgot.sent_step1"),
    t("auth.forgot.sent_step2"),
    t("auth.forgot.sent_step3"),
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      <LoginControls />

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

        <div className={cn(R.lg, E.sm, "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-8 relative")}>

          {/* Back link */}
          {step !== "success" && (
            <div className="absolute top-5 left-5">
              <Link
                href="/login/cashier"
                className={cn(T.buttonSm, "flex items-center gap-1 text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors")}
              >
                <ArrowLeft className="size-3" />
                {t("auth.forgot.back_link")}
              </Link>
            </div>
          )}

          {/* ── Step 1: Email Input ─────────────────── */}
          {step === "email" && (
            <div className="animate-in fade-in duration-300">
              <div className="flex flex-col items-center text-center mb-7">
                <div className={cn(R.md, "size-12 flex items-center justify-center mb-4 bg-indigo-50 dark:bg-indigo-950")}>
                  <KeyRound className="size-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h1 className={cn(T.h2, "text-slate-900 dark:text-slate-100")}>{t("auth.forgot.header")}</h1>
                <p className={cn(T.caption, "text-slate-400 dark:text-slate-500 mt-1")}>{t("auth.forgot.subheader")}</p>
              </div>

              <form onSubmit={handleSendEmail} className="space-y-4">
                <div className="space-y-1.5">
                  <p className={cn(T.label, "text-slate-400 dark:text-slate-500 pl-1")}>{t("auth.forgot.email_label")}</p>
                  <div className={cn(R.md, "flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 h-12 transition-all focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-indigo-300")}>
                    <Mail className="size-4 text-slate-300 dark:text-slate-600 shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder={t("auth.forgot.email_placeholder")}
                      autoFocus
                      className={cn(T.body, "font-bold bg-transparent border-none outline-none w-full text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600")}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className={cn(T.buttonSm, R.md, "w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-indigo-100 dark:shadow-none")}
                >
                  {isLoading
                    ? <Loader2 className="size-4 animate-spin" />
                    : <><span>{t("auth.forgot.btn_send")}</span><ArrowRight className="size-4" /></>
                  }
                </button>
              </form>
            </div>
          )}

          {/* ── Step 2: Email Sent ──────────────────── */}
          {step === "sent" && (
            <div className="animate-in fade-in zoom-in-95 duration-300 text-center space-y-5 py-2">
              <div className={cn(R.xl, "size-14 bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mx-auto")}>
                <Mail className="size-7 text-emerald-500" />
              </div>

              <div>
                <h2 className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>{t("auth.forgot.sent_title")}</h2>
                <p className={cn(T.bodySm, "text-slate-400 dark:text-slate-500 mt-1")}>{t("auth.forgot.sent_desc")}</p>
                <p className={cn(T.bodyEmphasis, "text-indigo-600 dark:text-indigo-400 mt-1")}>{email}</p>
              </div>

              <div className={cn(R.md, "bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-100 dark:border-slate-700 text-left space-y-2.5")}>
                {sentSteps.map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className={cn(R.full, T.dataSm, "size-5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-semibold shrink-0")}>
                      {i + 1}
                    </span>
                    <span className={cn(T.bodySm, "text-slate-600 dark:text-slate-400")}>{s}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep("reset")}
                className={cn(T.buttonSm, R.md, "w-full h-10 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white flex items-center justify-center gap-2 transition-all cursor-pointer")}
              >
                {t("auth.forgot.simulate_btn")} <ArrowRight className="size-3.5" />
              </button>

              <p className={cn(T.caption, "text-slate-400 dark:text-slate-500")}>
                {t("auth.forgot.no_email")}{" "}
                <button
                  className="text-indigo-500 hover:underline cursor-pointer"
                  onClick={() => setStep("email")}
                >
                  {t("auth.forgot.resend")}
                </button>
              </p>
            </div>
          )}

          {/* ── Step 3: New Password ────────────────── */}
          {step === "reset" && (
            <div className="animate-in fade-in duration-300">
              <div className="flex flex-col items-center text-center mb-7">
                <div className={cn(R.md, "size-12 flex items-center justify-center mb-4 bg-indigo-50 dark:bg-indigo-950")}>
                  <KeyRound className="size-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h1 className={cn(T.h2, "text-slate-900 dark:text-slate-100")}>{t("auth.forgot.reset_title")}</h1>
                <p className={cn(T.caption, "text-slate-400 dark:text-slate-500 mt-1")}>{t("auth.forgot.reset_subheader")}</p>
              </div>

              <form onSubmit={handleReset} className="space-y-4">
                {passwordFields.map(field => (
                  <div key={field.key} className="space-y-1.5">
                    <p className={cn(T.label, "text-slate-400 dark:text-slate-500 pl-1")}>{field.label}</p>
                    <div className={cn(R.md, "flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 h-12 transition-all focus-within:ring-2 focus-within:ring-indigo-400")}>
                      <KeyRound className="size-4 text-slate-300 dark:text-slate-600 shrink-0" />
                      <input
                        type={field.show ? "text" : "password"}
                        value={field.val}
                        onChange={e => field.set(e.target.value)}
                        placeholder="••••••••"
                        className={cn(T.body, "font-bold bg-transparent border-none outline-none w-full text-slate-900 dark:text-slate-100 flex-1")}
                        required
                      />
                      <button
                        type="button"
                        onClick={field.toggle}
                        className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 cursor-pointer transition-colors"
                        aria-label={field.show ? t("auth.aria.hide_password") : t("auth.aria.show_password")}
                      >
                        {field.show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                ))}

                {error && (
                  <div className={cn(T.bodySm, R.md, "flex items-start gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 p-3 border border-rose-100 dark:border-rose-800/50 animate-in fade-in duration-150")}>
                    <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(T.buttonSm, R.md, "w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-indigo-100 dark:shadow-none")}
                >
                  {isLoading
                    ? <Loader2 className="size-4 animate-spin" />
                    : <><span>{t("auth.forgot.btn_save")}</span><ArrowRight className="size-4" /></>
                  }
                </button>
              </form>
            </div>
          )}

          {/* ── Step 4: Success ─────────────────────── */}
          {step === "success" && (
            <div className="animate-in fade-in zoom-in-95 duration-300 text-center space-y-5 py-4">
              <div className={cn(R.xl, "size-14 bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mx-auto")}>
                <CheckCircle2 className="size-7 text-emerald-500" />
              </div>

              <div>
                <h2 className={cn(T.h3, "text-slate-900 dark:text-slate-100")}>{t("auth.forgot.success_title")}</h2>
                <p className={cn(T.bodySm, "text-slate-400 dark:text-slate-500 mt-1")}>{t("auth.forgot.success_desc")}</p>
              </div>

              <Link
                href="/login/cashier"
                className={cn(T.buttonSm, R.md, "w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 dark:shadow-none active:scale-[0.98]")}
              >
                {t("auth.forgot.back_login")} <ArrowRight className="size-4" />
              </Link>
            </div>
          )}
        </div>

        <p className={cn(T.caption, "text-center mt-5 text-slate-300 dark:text-slate-700")}>
          {t("auth.forgot.footer")}
        </p>
      </div>
    </div>
  );
}
