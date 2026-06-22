"use client";

import Link from "next/link";
import { Briefcase, ShieldCheck, Terminal } from "lucide-react";
import { LoginControls } from "@/app/components/LoginControls";
import { useTranslation } from "@/app/i18n";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { R } from "@/app/lib/radii";
import { E } from "@/app/lib/elevation";

const PORTALS = [
  { role: "owner", icon: Briefcase, accent: "text-indigo-600 dark:text-indigo-300" },
  { role: "cashier", icon: ShieldCheck, accent: "text-emerald-600 dark:text-emerald-300" },
  { role: "admin", icon: Terminal, accent: "text-slate-600 dark:text-slate-200" },
] as const;

export default function SelectPortal() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 dark:text-slate-100 flex items-center justify-center p-6 relative">
      <LoginControls />

      <div className="w-full max-w-3xl space-y-8">
        <header className="text-center space-y-2">
          <h1 className={cn(T.h1, "text-slate-900 dark:text-slate-100")}>
            {t("auth.select.titlePre")} <span className="text-indigo-600 dark:text-indigo-300">{t("auth.select.titleAccent")}</span> {t("auth.select.titleSuffix")}
          </h1>
          <p className={cn(T.body, "text-slate-500 dark:text-slate-400")}>{t("auth.select.subtitle")}</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          {PORTALS.map(({ role, icon: Icon, accent }) => (
            <Link
              key={role}
              href={`/login/${role}`}
              className={cn(
                R.lg,
                E.sm,
                "block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
              )}
            >
              <Icon className={cn("size-6", accent)} aria-hidden="true" />
              <h2 className={cn(T.h3, "mt-3 text-slate-900 dark:text-slate-100")}>{t(`auth.select.${role}.title`)}</h2>
              <p className={cn(T.caption, "mt-1 text-slate-500 dark:text-slate-400")}>{t(`auth.select.${role}.role`)}</p>
              <p className={cn(T.bodySm, "mt-3 text-slate-500 dark:text-slate-400")}>{t(`auth.select.${role}.desc`)}</p>
            </Link>
          ))}
        </div>

        <p className={cn(T.caption, "text-center text-slate-400 dark:text-slate-500")}>
          {t("auth.select.footer")}
        </p>
      </div>
    </div>
  );
}