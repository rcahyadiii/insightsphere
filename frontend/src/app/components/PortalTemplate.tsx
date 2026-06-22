"use client";

import { useState } from "react";
import { useAuth, UserRole } from "@/app/context/AuthContext";
import { 
  ShieldCheck, 
  Briefcase, 
  Terminal, 
  Package,
  ArrowRight, 
  AlertCircle, 
  Loader2,
  Lock,
  User as UserIcon,
  Zap,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { R } from "@/app/lib/radii";
import { E } from "@/app/lib/elevation";
import { LAYOUT_DECORATION } from "@/app/lib/layout";
import { LoginControls } from "@/app/components/LoginControls";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslation } from "@/app/i18n";

interface PortalTemplateProps {
  portalType: UserRole;
  title: string;
  subtitle: string;
}

const PORTAL_STYLE = {
  owner: {
    icon: Briefcase,
    iconBg: "bg-indigo-50 dark:bg-indigo-950",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    btn: "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none",
    ring: "focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-indigo-300",
    badge: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800/60",
  },
  cashier: {
    icon: ShieldCheck,
    iconBg: "bg-emerald-50 dark:bg-emerald-950",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    btn: "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 dark:shadow-none",
    ring: "focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-emerald-300",
    badge: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800/60",
  },
  inventory_manager: {
    icon: Package,
    iconBg: "bg-teal-50 dark:bg-teal-950",
    iconColor: "text-teal-600 dark:text-teal-400",
    btn: "bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-100 dark:shadow-none",
    ring: "focus-within:ring-2 focus-within:ring-teal-400 focus-within:border-teal-300",
    badge: "bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800/60",
  },
  admin: {
    icon: Terminal,
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-700 dark:text-slate-300",
    btn: "bg-slate-700 hover:bg-slate-800 shadow-lg shadow-slate-200 dark:shadow-none",
    ring: "focus-within:ring-2 focus-within:ring-slate-400 focus-within:border-slate-300",
    badge: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
};

export function PortalTemplate({ portalType, title, subtitle }: PortalTemplateProps) {
  const { login } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const style = PORTAL_STYLE[portalType];
  const Icon = style.icon;
  const portalName = t(`auth.portal.${portalType}`);
  const roleLabel = t(`auth.role.${portalType}`);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);

    const result = await login(username, password);

    if (result.kind === "success") {
      toast.success(t("auth.toast.welcome", { portal: portalName }), {
        description: t("auth.toast.syncEngine"),
      });
      router.push("/");
    } else if (result.kind === "requires_2fa") {
      // 2FA verify flow akan di-wire di Phase 2.4 (2FA Enrollment Wizard).
      // Sementara: tampilkan pesan jelas supaya user bisa koordinasi dg admin.
      setError(t("auth.2fa.error"));
      toast.error(t("auth.2fa.toast"), {
        description: t("auth.2fa.desc"),
      });
    } else {
      setError(result.error);
      toast.error(t("auth.accessDenied"), { description: result.error });
    }

    setIsLoggingIn(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      <LoginControls />

      {/* Background Ornament */}
      <div className={LAYOUT_DECORATION.portalOrnament.primary} />
      <div className={LAYOUT_DECORATION.portalOrnament.secondary} />

      <div className="w-full max-w-sm z-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Brand Badge */}
        <div className="flex items-center justify-center mb-6">
          <div className={cn(R.full, E.sm, "inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2")}>
            <div className={cn(R.full, "size-5 bg-indigo-600 flex items-center justify-center")}>
              <Zap className="size-3 text-white" />
            </div>
            <span className={cn(T.caption, "text-slate-500 dark:text-slate-400")}>InsightSphere</span>
          </div>
        </div>

        <div className={cn(R.lg, E.sm, "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-8 relative")}>

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className={cn(R.md, "size-12 flex items-center justify-center mb-4", style.iconBg)}>
              <Icon className={cn("size-6", style.iconColor)} />
            </div>
            <span className={cn(T.micro, R.full, "normal-case tracking-normal px-2.5 py-1 border mb-3", style.badge)}>
              {roleLabel}
            </span>
            <h1 className={cn(T.h2, "text-slate-900 dark:text-slate-100")}>{title}</h1>
            <p className={cn(T.caption, "text-slate-400 dark:text-slate-500 mt-1")}>{subtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-3">
              {/* Username */}
              <div className="space-y-1.5">
                <p className={cn(T.label, "text-slate-400 dark:text-slate-500 pl-1")}>{t("auth.username")}</p>
                <div className={cn(R.md, "flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 h-12 transition-all", style.ring)}>
                  <UserIcon className="size-4 text-slate-300 dark:text-slate-600 shrink-0" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t("auth.usernamePlaceholder")}
                    className={cn("bg-transparent border-none outline-none w-full text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600", T.body, "font-bold")}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <p className={cn(T.label, "text-slate-400 dark:text-slate-500")}>{t("auth.password")}</p>
                  <Link
                    href="/login/forgot-password"
                    className={cn(T.buttonSm, "text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors")}
                  >
                    {t("auth.forgotPassword")}
                  </Link>
                </div>
                <div className={cn(R.md, "flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 h-12 transition-all", style.ring)}>
                  <Lock className="size-4 text-slate-300 dark:text-slate-600 shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={cn("bg-transparent border-none outline-none w-full text-slate-900 dark:text-slate-100", T.body, "font-bold")}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? t("auth.aria.hide_password") : t("auth.aria.show_password")}
                    className="shrink-0 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div
                className={cn(T.bodySm, R.md, "flex items-start gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 p-3 border border-rose-100 dark:border-rose-800/50 animate-in fade-in duration-150")}
              >
                <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className={cn(
                cn(T.buttonSm, R.md, "w-full h-11 text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"),
                style.btn
              )}
            >
              {isLoggingIn ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  {t("auth.login")}
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className={cn(T.caption, "text-center mt-5 text-slate-300 dark:text-slate-700")}>
          {t("auth.footer")} • {portalName}
        </p>
      </div>
    </div>
  );
}
