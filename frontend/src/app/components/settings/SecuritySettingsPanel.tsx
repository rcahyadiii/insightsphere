"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as authClient from "@/app/lib/auth-client";
import type { LoginActivityItem, TwoFactorSetupInitResponse } from "@/app/lib/auth-client";
import { ApiError } from "@/app/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import { AlertCircle, AlertTriangle, CheckCircle2, Copy, Download, Eye, EyeOff, History, KeyRound, Loader2, Lock, Monitor, ShieldCheck, Trash2, XCircle } from "lucide-react";
import { ResponsiveTable } from "@/app/components/ui/ResponsiveTable";
import { cn } from "@/app/lib/utils";
import { TABLE } from "@/app/lib/data";
import { C } from "@/app/lib/colors";
import { R } from "@/app/lib/radii";
import { T } from "@/app/lib/typography";
import { btn } from "@/app/lib/buttons";
import { A11Y } from "@/app/lib/a11y";
import { FIELD, INPUT, LABEL, SWITCH } from "@/app/lib/forms";
import { ICON } from "@/app/lib/spacing";
import { toast } from "sonner";

type SettingsPanelProps = {
  t: (key: string, params?: Record<string, string | number>) => string;
};

export function SecuritySettingsPanel({ t }: SettingsPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [pinStep, setPinStep] = useState<"idle" | "verify" | "new" | "confirm" | "done">("idle");
  const [pinValues, setPinValues] = useState({ current: ["","","",""], next: ["","","",""], confirm: ["","","",""] });
  const [twoFaEnabled, setTwoFaEnabled] = useState(user?.twoFactorEnabled ?? false);
  const [twoFaStep, setTwoFaStep] = useState<"off" | "qr" | "verify" | "done">("off");
  const [twoFaCode, setTwoFaCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [twoFaInitData, setTwoFaInitData] = useState<TwoFactorSetupInitResponse | null>(null);
  const [disablePin, setDisablePin] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);

  const [lhFilter, setLhFilter] = useState<"all" | "success" | "failed">("all");
  const [lhLimit,  setLhLimit]  = useState(5);
  const [loginHistory, setLoginHistory] = useState<LoginActivityItem[]>([]);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(true);
  const [loginHistoryError, setLoginHistoryError] = useState("");

  const [twoFaLoading,       setTwoFaLoading]       = useState(false);
  const [twoFaError,         setTwoFaError]         = useState("");
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  const [pinLoading, setPinLoading] = useState(false);
  const [pinError,   setPinError]   = useState("");

  const [pwOld, setPwOld]           = useState("");
  const [pwNew, setPwNew]           = useState("");
  const [pwConfirm, setPwConfirm]   = useState("");
  const [showPwOld, setShowPwOld]   = useState(false);
  const [showPwNew, setShowPwNew]   = useState(false);
  const [showPwConf, setShowPwConf] = useState(false);
  const [isPwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError]       = useState("");

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (!pwOld.trim()) { setPwError(t("set.sec.error_old_required")); return; }
    if (pwNew.length < 8) { setPwError(t("set.sec.error_min")); return; }
    if (pwNew !== pwConfirm) { setPwError(t("set.sec.error_mismatch")); return; }
    setPwLoading(true);
    try {
      await authClient.changePin({ current_pin: pwOld, new_pin: pwNew });
      setPwOld(""); setPwNew(""); setPwConfirm("");
      toast.success(t("set.sec.pw_updated"));
    } catch (err) {
      setPwError(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setPwLoading(false);
    }
  };

  const handlePinInput = (group: "current" | "next" | "confirm", idx: number, val: string) => {
    if (val.length > 1 || !/^[0-9]*$/.test(val)) return;
    setPinValues(prev => ({ ...prev, [group]: prev[group].map((v, i) => i === idx ? val : v) }));
    if (val && idx < 3) {
      const next = document.getElementById(`pin-${group}-${idx + 1}`);
      next?.focus();
    }
  };

  const sessions = [
    { device: "Chrome — Windows 11", ip: "103.120.14.52", lastActive: "Sekarang", current: true },
    { device: "Safari — iPhone 15", ip: "103.120.14.52", lastActive: "3 jam lalu", current: false },
  ];

  useEffect(() => {
    setLoginHistoryLoading(true);
    authClient.fetchLoginHistory(20)
      .then(data => { setLoginHistory(data); setLoginHistoryError(""); })
      .catch(() => setLoginHistoryError(t("common.error_loading")))
      .finally(() => setLoginHistoryLoading(false));
  }, [t]);

  const parsedLogs = loginHistory.map(item => ({
    id: item.id,
    date: new Date(item.timestamp).toLocaleString("id-ID", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
    device: item.user_agent ?? "Unknown Device",
    ip: item.ip_address ?? "-",
    location: "-",
    success: item.status === "SUCCESS",
  }));
  const filteredLogs    = parsedLogs.filter(l => lhFilter === "all" || (lhFilter === "success" ? l.success : !l.success));
  const visibleLogs     = filteredLogs.slice(0, lhLimit);
  const suspiciousCount = parsedLogs.filter(l => !l.success).length;

  return (
    <div className="p-8 space-y-8 flex-1">
      <div className="space-y-2">
        <h3 className={cn(T.h3, "text-slate-900 dark:text-slate-100 flex items-center gap-3")}>
          <Lock className={cn(ICON.lg, C.primary.icon)} />
          {t("set.sec.title")}
        </h3>
        <p className={cn(T.bodySm, "text-slate-500 dark:text-slate-400")}>{t("set.sec.desc")}</p>
      </div>

      {/* 2FA Wizard */}
      <div className="space-y-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h4 className={cn(T.h4, "text-slate-900 dark:text-slate-200 flex items-center gap-2")}>
              <ShieldCheck className="w-4 h-4 text-slate-400" /> {t("set.sec.twofa_title")}
            </h4>
            <p className={cn(T.caption, "text-slate-400 dark:text-slate-500 mt-0.5")}>{t("set.sec.twofa_desc")}</p>
          </div>
          <button
            onClick={async () => {
              if (!twoFaEnabled) {
                setTwoFaError("");
                setTwoFaLoading(true);
                try {
                  const data = await authClient.twoFaSetupInit();
                  setTwoFaInitData(data);
                  setTwoFaStep("qr");
                } catch (err) {
                  toast.error(err instanceof ApiError ? err.message : t("common.error"));
                } finally {
                  setTwoFaLoading(false);
                }
              } else {
                setDisablePin("");
                setDisableCode("");
                setShowDisableConfirm(true);
              }
            }}
            disabled={twoFaLoading && !twoFaEnabled}
            role="switch"
            aria-checked={twoFaEnabled}
            className={cn(SWITCH.base, twoFaEnabled ? SWITCH.on : SWITCH.off, "disabled:opacity-60")}
          >
            {twoFaLoading && !twoFaEnabled
              ? <Loader2 className="size-4 animate-spin text-white" />
              : <span className={cn(SWITCH.thumb, twoFaEnabled ? SWITCH.thumbOn : SWITCH.thumbOff)} />
            }
          </button>
        </div>

        {/* Disable confirmation */}
        {showDisableConfirm && (
          <div className={cn(R.lg, "space-y-3 px-4 py-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 animate-in fade-in duration-200")}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className={cn(T.label, "text-amber-800 dark:text-amber-300")}>{t("set.sec.twofa_disable_confirm")}</p>
                <p className={cn(T.caption, "text-amber-600 dark:text-amber-400 mt-0.5")}>{t("set.sec.twofa_disable_hint")}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={FIELD.wrapper}>
                <label className={LABEL.base}>{t("set.sec.pin_current")}</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={disablePin}
                  onChange={e => setDisablePin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className={cn(INPUT.base, INPUT.size.md)}
                />
              </div>
              <div className={FIELD.wrapper}>
                <label className={LABEL.base}>{t("set.sec.twofa_step2")}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  value={disableCode}
                  onChange={e => setDisableCode(e.target.value.replace(/\s/g, ""))}
                  placeholder="000000"
                  className={cn(INPUT.base, INPUT.size.md)}
                />
              </div>
            </div>
            {twoFaError && (
              <div className={cn(T.bodySm, R.md, "flex items-center gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 border border-rose-100 dark:border-rose-800/50")}>
                <AlertCircle className="size-3.5 shrink-0" /> {twoFaError}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setShowDisableConfirm(false); setTwoFaError(""); }} className={btn("ghost", "sm")}>{t("set.sec.twofa_back")}</button>
              <button
                disabled={disableLoading || !disablePin || !disableCode}
                onClick={async () => {
                  setDisableLoading(true);
                  setTwoFaError("");
                  try {
                    await authClient.twoFaDisable({ pin: disablePin, code: disableCode });
                    setTwoFaEnabled(false);
                    setTwoFaStep("off");
                    setShowDisableConfirm(false);
                    setTwoFaCode("");
                    queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
                    toast.success(t("set.sec.twofa_deactivated"));
                  } catch (err) {
                    setTwoFaError(err instanceof ApiError ? err.message : t("common.error"));
                  } finally {
                    setDisableLoading(false);
                  }
                }}
                className={cn(btn("destructiveSoft", "sm"), "disabled:opacity-50")}
              >
                {disableLoading ? <Loader2 className="size-3.5 animate-spin" /> : t("set.sec.twofa_disable_btn")}
              </button>
            </div>
          </div>
        )}

        {/* Step 1: QR */}
        {twoFaStep === "qr" && twoFaInitData && (
          <div className={cn(R.lg, "bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 space-y-4 animate-in slide-in-from-top-2 duration-200")}>
            <p className={cn(T.label, C.primary.icon)}>{t("set.sec.twofa_step1")}</p>
            <div className="flex gap-5 items-start">
              <div className={cn(R.lg, "size-28 bg-white dark:bg-white border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0 overflow-hidden")}>
                <img src={`data:image/png;base64,${twoFaInitData.qr_code_base64}`} alt="QR Code 2FA" className="w-full h-full object-contain" />
              </div>
              <div className="space-y-2 flex-1 min-w-0">
                <p className={cn(T.label, "text-slate-600 dark:text-slate-300")}>{t("set.sec.twofa_scan_hint")}</p>
                <div className={cn(R.md, "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-2 flex items-center justify-between gap-2")}>
                  <div className="min-w-0">
                    <p className={cn(T.label, "text-slate-400 dark:text-slate-500")}>{t("set.sec.twofa_secret")}</p>
                    <p className={cn(T.code, C.primary.icon, "truncate")}>{twoFaInitData.secret}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(twoFaInitData.secret); toast.success(t("set.sec.twofa_copied_secret")); }}
                    className={cn(T.buttonSm, R.sm, "flex items-center gap-1 px-2 py-1 border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-indigo-500 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer shrink-0")}
                  >
                    <Copy className="size-3" /> {t("set.sec.twofa_copy_secret")}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => { setTwoFaStep("verify"); setTwoFaError(""); setTwoFaCode(""); }}
              className={cn(btn("primary", "sm"), "dark:bg-indigo-900/30 dark:hover:bg-indigo-900/40 dark:text-indigo-400 dark:shadow-none dark:border dark:border-indigo-800/50")}
            >
              {t("set.sec.twofa_next")}
            </button>
          </div>
        )}

        {/* Step 2: Verify OTP */}
        {twoFaStep === "verify" && (
          <div className={cn(R.lg, "bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 space-y-4 animate-in slide-in-from-top-2 duration-200")}>
            <p className={cn(T.label, C.primary.icon)}>{t("set.sec.twofa_step2")}</p>
            <div className="space-y-1">
              <p className={cn(T.caption, "text-slate-500 dark:text-slate-400")}>{t("set.sec.twofa_otp_hint")}</p>
              <p className={cn(T.caption, "text-amber-500 dark:text-amber-400 font-bold")}>{t("set.sec.twofa_otp_demo")}</p>
            </div>
            <input
              type="text"
              maxLength={6}
              value={twoFaCode}
              onChange={e => { setTwoFaCode(e.target.value.replace(/\D/g, "")); setTwoFaError(""); }}
              placeholder="000000"
              className={cn(INPUT.base, R.lg, "w-32 h-14 px-3 text-center text-2xl font-bold font-data tabular-nums tracking-[0.3em]")}
            />
            {twoFaError && (
              <div className={cn(T.bodySm, R.md, "flex items-center gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 border border-rose-100 dark:border-rose-800/50 animate-in fade-in duration-150")}>
                <AlertCircle className="size-3.5 shrink-0" /> {twoFaError}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setTwoFaStep("qr"); setTwoFaError(""); }} className={btn("ghost", "sm")}>{t("set.sec.twofa_back")}</button>
              <button
                onClick={async () => {
                  if (twoFaCode.length !== 6 || !twoFaInitData) return;
                  setTwoFaLoading(true);
                  setTwoFaError("");
                  try {
                    const resp = await authClient.twoFaSetupVerify({ secret: twoFaInitData.secret, code: twoFaCode });
                    setBackupCodes(resp.backup_codes);
                    setTwoFaEnabled(true);
                    setTwoFaStep("done");
                    queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
                    toast.success(t("set.sec.twofa_activated"));
                  } catch (err) {
                    setTwoFaError(err instanceof ApiError ? err.message : t("set.sec.twofa_error_wrong"));
                  } finally {
                    setTwoFaLoading(false);
                  }
                }}
                disabled={twoFaCode.length !== 6 || twoFaLoading || !twoFaInitData}
                className={cn(btn("primary", "sm"), "dark:bg-indigo-900/30 dark:hover:bg-indigo-900/40 dark:text-indigo-400 dark:shadow-none dark:border dark:border-indigo-800/50 disabled:opacity-50")}
              >
                {twoFaLoading ? <Loader2 className="size-3.5 animate-spin" /> : t("set.sec.twofa_activate")}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done — Backup Codes */}
        {twoFaStep === "done" && (
          <div className={cn(R.lg, "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 p-5 space-y-3 animate-in slide-in-from-top-2 duration-200")}>
            <div className="flex items-center justify-between">
              <p className={cn(T.label, "flex items-center gap-1.5", C.success.icon)}>
                <CheckCircle2 className={ICON.sm} /> {t("set.sec.twofa_done_title")}
              </p>
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(backupCodes.join("\n")); toast.success(t("set.sec.twofa_copied_codes")); }}
                className={cn(T.buttonSm, R.sm, "flex items-center gap-1 px-2 py-1 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all cursor-pointer")}
              >
                <Copy className="size-3" /> {t("set.sec.twofa_copy_codes")}
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {backupCodes.map((code, i) => (
                <span key={i} className={cn(T.code, R.sm, "bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 px-2 py-1.5 text-slate-700 dark:text-slate-300 text-center block")}>{code}</span>
              ))}
            </div>
            <p className={cn(T.caption, "text-slate-400 dark:text-slate-500")}>{t("set.sec.twofa_backup_hint")}</p>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="space-y-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <h4 className={cn(T.h4, "text-slate-900 dark:text-slate-200 flex items-center gap-2")}>
          <KeyRound className="w-4 h-4 text-slate-400" /> {t("set.sec.change_pw")}
        </h4>
        <form onSubmit={handleChangePw} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: "set-pw-old",  label: t("set.sec.old_pw"),     val: pwOld,     set: setPwOld,     show: showPwOld, toggle: () => setShowPwOld(v => !v) },
              { id: "set-pw-new",  label: t("set.sec.new_pw"),     val: pwNew,     set: setPwNew,     show: showPwNew, toggle: () => setShowPwNew(v => !v) },
              { id: "set-pw-conf", label: t("set.sec.confirm_pw"), val: pwConfirm, set: setPwConfirm, show: showPwConf, toggle: () => setShowPwConf(v => !v) },
            ].map(field => (
              <div key={field.id} className={FIELD.wrapper}>
                <label htmlFor={field.id} className={LABEL.base}>{field.label}</label>
                <div className={cn(INPUT.base, INPUT.size.md, "flex items-center gap-2 pr-2")}>
                  <input
                    id={field.id}
                    type={field.show ? "text" : "password"}
                    value={field.val}
                    onChange={e => field.set(e.target.value)}
                    placeholder="••••••••"
                    className="bg-transparent border-none outline-none w-full flex-1"
                  />
                  <button
                    type="button"
                    onClick={field.toggle}
                    className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 shrink-0 transition-colors cursor-pointer"
                    aria-label={field.show ? t("set.aria.hide_password") : t("set.aria.show_password")}
                  >
                    {field.show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pwError && (
            <div className={cn(T.bodySm, R.md, "flex items-start gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-3 py-2.5 border border-rose-100 dark:border-rose-800/50 animate-in fade-in duration-150")}>
              <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
              {pwError}
            </div>
          )}

          <button type="submit" disabled={isPwLoading} className={cn(btn("primary", "sm"), "dark:bg-indigo-900/30 dark:hover:bg-indigo-900/40 dark:text-indigo-400 dark:shadow-none dark:border dark:border-indigo-800/50 disabled:opacity-50")}>
            {isPwLoading
              ? <><Loader2 className="size-3.5 animate-spin" /> {t("set.sec.update_pw")}...</>
              : t("set.sec.update_pw")
            }
          </button>
        </form>
      </div>

      {/* Change PIN */}
      <div className="space-y-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h4 className={cn(T.h4, "text-slate-900 dark:text-slate-200 flex items-center gap-2")}>
              <KeyRound className="w-4 h-4 text-slate-400" /> {t("set.sec.pin_title")}
            </h4>
            {pinStep === "idle" && (
              <p className={cn(T.caption, "text-slate-400 dark:text-slate-500 mt-0.5")}>{t("set.sec.pin_desc")}</p>
            )}
          </div>
          {pinStep === "idle" && (
            <button onClick={() => { setPinStep("verify"); setPinError(""); }} className={btn("neutralSoft", "sm")}>
              {t("set.sec.pin_change_btn")}
            </button>
          )}
        </div>

        {pinStep !== "idle" && pinStep !== "done" && (() => {
          const stepNum = pinStep === "verify" ? 1 : pinStep === "new" ? 2 : 3;
          const groups = (["current", "next", "confirm"] as const).slice(0, stepNum);
          const groupLabels: Record<string, string> = {
            current: t("set.sec.pin_current"),
            next:    t("set.sec.pin_new"),
            confirm: t("set.sec.pin_confirm"),
          };
          const allFilled = pinValues[groups[groups.length - 1]].every(v => v !== "");

          const handleNext = async () => {
            setPinError("");
            if (pinStep === "verify") {
              setPinStep("new");
            } else if (pinStep === "new") {
              setPinStep("confirm");
            } else {
              if (pinValues.next.join("") !== pinValues.confirm.join("")) {
                setPinError(t("set.sec.pin_error_mismatch"));
                return;
              }
              setPinLoading(true);
              try {
                await authClient.changePin({
                  current_pin: pinValues.current.join(""),
                  new_pin: pinValues.next.join(""),
                });
                setPinStep("done");
                toast.success(t("set.sec.pin_success"));
              } catch (err) {
                setPinError(err instanceof ApiError ? err.message : t("set.sec.pin_error_wrong"));
              } finally {
                setPinLoading(false);
              }
            }
          };

          return (
            <div className={cn(R.lg, "space-y-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 animate-in slide-in-from-top-2 duration-200")}>
              <p className={cn(T.label, C.primary.icon)}>{t("set.sec.pin_step", { step: stepNum })}</p>
              {groups.map(group => (
                <div key={group} className="space-y-2">
                  <p className={cn(T.label, "text-slate-400 dark:text-slate-500")}>{groupLabels[group]}</p>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3].map(idx => (
                      <input
                        key={idx}
                        id={`pin-${group}-${idx}`}
                        type="password"
                        maxLength={1}
                        inputMode="numeric"
                        value={pinValues[group][idx]}
                        onChange={e => { handlePinInput(group, idx, e.target.value); setPinError(""); }}
                        className={cn(INPUT.base, R.lg, "w-12 h-12 px-0 text-center text-xl font-bold font-data tabular-nums")}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {pinError && (
                <div className={cn(T.bodySm, R.md, "flex items-center gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 border border-rose-100 dark:border-rose-800/50 animate-in fade-in duration-150")}>
                  <AlertCircle className="size-3.5 shrink-0" /> {pinError}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setPinStep("idle"); setPinError(""); setPinValues({ current: ["","","",""], next: ["","","",""], confirm: ["","","",""] }); }}
                  className={btn("ghost", "sm")}
                >
                  {t("set.sec.pin_cancel")}
                </button>
                <button
                  onClick={handleNext}
                  disabled={!allFilled || pinLoading}
                  className={cn(btn("primary", "sm"), "dark:bg-indigo-900/30 dark:hover:bg-indigo-900/40 dark:text-indigo-400 dark:shadow-none dark:border dark:border-indigo-800/50 disabled:opacity-50")}
                >
                  {pinLoading
                    ? <Loader2 className="size-3.5 animate-spin" />
                    : pinStep === "confirm" ? t("set.sec.pin_save") : t("set.sec.pin_next")
                  }
                </button>
              </div>
            </div>
          );
        })()}

        {pinStep === "done" && (
          <div className={cn(R.lg, "flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 px-4 py-3 animate-in slide-in-from-top-2 duration-200")}>
            <CheckCircle2 className={cn("size-4", C.success.icon)} />
            <span className={cn(T.label, "font-bold", C.success.text)}>{t("set.sec.pin_success")}</span>
            <button
              onClick={() => { setPinStep("idle"); setPinValues({ current: ["","","",""], next: ["","","",""], confirm: ["","","",""] }); }}
              className={cn("ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors", T.buttonSm)}
            >
              {t("set.sec.pin_reset")}
            </button>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="space-y-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h4 className={cn(T.h4, "text-slate-900 dark:text-slate-200 flex items-center gap-2")}>
            <Monitor className="w-4 h-4 text-slate-400" /> {t("set.sec.sessions")}
          </h4>
          <p className={cn(T.caption, "text-slate-400 mt-0.5")}>{t("set.sec.sessions_desc")}</p>
        </div>
        <div className="space-y-2">
          {sessions.map((session, i) => (
            <div key={i} className="p-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Monitor className="w-4 h-4 text-slate-400" />
                <div>
                  <p className={cn(T.label, "text-slate-900 dark:text-slate-200")}>{session.device}</p>
                  <p className={cn(T.caption, "text-slate-400")}>IP: {session.ip} · {session.lastActive}</p>
                </div>
              </div>
              {session.current ? (
                <span className={cn(T.micro, R.xs, C.success.bg, C.success.icon, "px-2 py-1 border border-emerald-100 dark:border-emerald-800/50")}>{t("set.sec.current")}</span>
              ) : (
                <button className={btn("destructiveSoft", "sm")}>{t("set.sec.revoke")}</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Login History */}
      <div className="space-y-4 pb-6 border-b border-slate-100 dark:border-slate-800">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <h4 className={cn(T.h4, "text-slate-900 dark:text-slate-200 flex items-center gap-2")}>
            <History className="w-4 h-4 text-slate-400" /> {t("set.sec.login_history")}
          </h4>
          <button
            onClick={() => toast.success(t("set.sec.lh_exported"))}
            className={cn(T.buttonSm, R.md, "flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer")}
          >
            <Download className="size-3" /> {t("set.sec.lh_export")}
          </button>
        </div>

        {loginHistoryLoading && (
          <div className={cn(T.caption, "text-slate-400 dark:text-slate-500 flex items-center gap-2")}>
            <Loader2 className="size-3.5 animate-spin" /> {t("common.loading")}
          </div>
        )}

        {!loginHistoryLoading && loginHistoryError && (
          <div className={cn(T.bodySm, R.md, "flex items-center gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 border border-rose-100 dark:border-rose-800/50")}>
            <AlertCircle className="size-3.5 shrink-0" /> {loginHistoryError}
          </div>
        )}

        {/* Suspicious alert */}
        {!loginHistoryLoading && suspiciousCount > 0 && (
          <div className={cn(T.bodySm, R.md, "flex items-start gap-2.5 px-3.5 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 animate-in fade-in duration-300")}>
            <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
            <div>
              <p className={T.label}>{t("set.sec.lh_suspicious")}</p>
              <p className="mt-0.5 opacity-80">{t("set.sec.lh_suspicious_desc", { count: suspiciousCount })}</p>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1">
          {(["all", "success", "failed"] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => { setLhFilter(f); setLhLimit(5); }}
              className={cn(
                T.buttonSm, R.sm,
                "px-3 py-1.5 transition-all cursor-pointer",
                A11Y.focusRing.default,
                lhFilter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              {f === "all" ? t("set.sec.lh_all") : f === "success" ? t("set.sec.login_success") : t("set.sec.login_failed")}
            </button>
          ))}
        </div>

        {/* Table */}
        <ResponsiveTable
          label={t("set.sec.login_history")}
          scrollerClassName={cn(R.lg, "border border-slate-100 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/30")}
          minWidthClassName={TABLE.minWidth.settings}
        >
          <table className={TABLE.base} aria-label={t("set.sec.login_history")}>
            <thead className={TABLE.head}>
              <tr>
                {[t("set.sec.login_date"), t("set.sec.login_device"), t("set.sec.lh_location"), t("set.sec.login_ip"), t("set.sec.login_status")].map((h, index) => (
                  <th key={h} className={cn(TABLE.headCell, index === 0 && TABLE.stickyColumn, index === 0 && "bg-slate-50 dark:bg-slate-800/50")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={TABLE.body}>
              {visibleLogs.map((log) => (
                <tr key={log.id} className={cn(TABLE.row, TABLE.rowHover, "group", !log.success && "bg-rose-50/30 dark:bg-rose-900/10")}>
                  <td className={cn(
                    TABLE.cell,
                    TABLE.stickyColumn,
                    "whitespace-nowrap",
                    T.dataSm,
                    log.success
                      ? "bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50"
                      : "bg-rose-50 dark:bg-rose-950/30 group-hover:bg-rose-50 dark:group-hover:bg-rose-900/20"
                  )}>{log.date}</td>
                  <td className={cn(TABLE.cell, T.bodySm, "font-bold text-slate-700 dark:text-slate-300")}>{log.device}</td>
                  <td className={cn(TABLE.cell, T.bodySm, "text-slate-500 dark:text-slate-400")}>{log.location}</td>
                  <td className={cn(TABLE.cell, T.code, "text-slate-400 dark:text-slate-500")}>{log.ip}</td>
                  <td className={TABLE.cell}>
                    <span className={cn("inline-flex items-center gap-1", T.caption, log.success ? C.success.icon : C.destructive.icon)}>
                      {log.success ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                      {log.success ? t("set.sec.login_success") : t("set.sec.login_failed")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTable>

        {/* Footer: count + load more */}
        <div className="flex items-center justify-between">
          <p className={cn(T.caption, "text-slate-400 dark:text-slate-500")}>
            {t("set.sec.lh_showing", { shown: visibleLogs.length, total: filteredLogs.length })}
          </p>
          {visibleLogs.length < filteredLogs.length && (
            <button
              type="button"
              onClick={() => setLhLimit(v => v + 5)}
              className={cn(T.buttonSm, "text-indigo-500 hover:underline cursor-pointer transition-colors", A11Y.focusRing.default)}
            >
              {t("set.sec.lh_show_more")}
            </button>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="space-y-4">
        <div>
          <h4 className={cn(T.h4, "text-rose-600 flex items-center gap-2")}>
            <AlertTriangle className="w-4 h-4" /> {t("set.sec.danger")}
          </h4>
          <p className={cn(T.caption, "text-slate-400 mt-0.5")}>{t("set.sec.danger_desc")}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className={btn("destructiveSoft", "sm")}>
            <Trash2 className={ICON.sm} /> {t("set.sec.reset_data")}
          </button>
          <button className={btn("destructive", "sm")}>
            <Trash2 className={ICON.sm} /> {t("set.sec.delete_account")}
          </button>
        </div>
      </div>
    </div>
  );
}
