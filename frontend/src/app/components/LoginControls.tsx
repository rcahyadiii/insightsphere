"use client";

import { Globe2, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "@/app/i18n";
import { A11Y } from "@/app/lib/a11y";
import { Z } from "@/app/lib/elevation";
import { R } from "@/app/lib/radii";
import { T } from "@/app/lib/typography";
import { cn } from "@/app/lib/utils";

interface LoginControlsProps {
  className?: string;
}

export function LoginControls({ className }: LoginControlsProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { lang, setLang, t } = useTranslation();
  const isDark = resolvedTheme === "dark";

  return (
    <div className={cn(Z.header, "fixed right-4 top-4 flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={t("common.toggle_dark_mode")}
        className={cn(
          A11Y.tapTarget,
          A11Y.focusRing.default,
          R.full,
          "flex items-center justify-center border border-slate-200 bg-white/90 text-slate-600 shadow-sm backdrop-blur-md transition-colors hover:bg-slate-100",
          "dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300 dark:shadow-none dark:hover:bg-slate-800"
        )}
      >
        {isDark ? (
          <Sun className="size-4 text-amber-400" aria-hidden="true" />
        ) : (
          <Moon className="size-4" aria-hidden="true" />
        )}
      </button>

      <button
        type="button"
        onClick={() => setLang(lang === "ID" ? "EN" : "ID")}
        aria-label={`${t("common.language")}: ${lang === "ID" ? t("common.indonesian") : t("common.english")}`}
        className={cn(
          A11Y.tapTarget,
          A11Y.focusRing.default,
          R.full,
          "flex items-center justify-center gap-2 border border-slate-200 bg-white/90 px-3 text-slate-600 shadow-sm backdrop-blur-md transition-colors hover:bg-slate-100",
          "dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300 dark:shadow-none dark:hover:bg-slate-800"
        )}
      >
        <Globe2 className="size-4" aria-hidden="true" />
        <span className={cn(T.label, "leading-none tracking-widest")}>{lang}</span>
      </button>
    </div>
  );
}
