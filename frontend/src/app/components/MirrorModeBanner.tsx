"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, X } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useTranslation } from "@/app/i18n";
import { ROLE_CODES } from "@/app/domain/constants";
import { A11Y } from "@/app/lib/a11y";
import { T } from "@/app/lib/typography";
import { Z } from "@/app/lib/elevation";
import { cn } from "@/app/lib/utils";

/**
 * Top-of-viewport banner saat Admin sedang impersonate role lain.
 * - Persisten di atas Header sehingga selalu terlihat lintas halaman.
 * - role="status" + aria-live agar SR user juga sadar mode cermin aktif.
 * - Tombol "Keluar Mode Cermin" prominent (bukan tertanam di sidebar).
 * - Countdown otomatis dari `expires_at` (refresh tiap detik).
 * - Shortcut keyboard: tekan `Esc` saat banner aktif untuk keluar Mode Cermin.
 * - Watermark fixed di kanan bawah viewport sebagai cue saat scroll panjang.
 */
export function MirrorModeBanner() {
  const { role, actualRole, mirrorSession, switchView } = useAuth();
  const { t } = useTranslation();

  const isMirroring = actualRole === ROLE_CODES.admin && role !== ROLE_CODES.admin;

  useEffect(() => {
    if (!isMirroring) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) {
        return;
      }
      event.preventDefault();
      switchView(ROLE_CODES.admin);
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [isMirroring, switchView]);

  if (!isMirroring) return null;

  const roleLabel = t(`um.role.${role}`);
  const expiresAt = mirrorSession?.expires_at;

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "w-full border-b border-amber-200 bg-amber-50 text-amber-900",
          "dark:border-amber-700/40 dark:bg-amber-900/30 dark:text-amber-200"
        )}
        data-testid="mirror-mode-banner"
      >
        <div className="mx-auto flex max-w-[1920px] items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-200/60 text-amber-700 dark:bg-amber-800/60 dark:text-amber-200"
              aria-hidden="true"
            >
              <Eye className="size-4" />
            </span>
            <div className="min-w-0">
              <p className={cn(T.bodySm, "truncate font-bold")}>
                {t("mirror.banner.viewing_as", { role: roleLabel })}
              </p>
              <p className={cn(T.caption, "hidden truncate text-amber-800/80 sm:block dark:text-amber-200/80")}>
                {t("mirror.banner.description", { role: roleLabel })}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <MirrorCountdown expiresAt={expiresAt} />
            <button
              type="button"
              onClick={() => switchView(ROLE_CODES.admin)}
              title={t("mirror.banner.exit_hint")}
              className={cn(
                T.buttonSm,
                A11Y.focusRing.default,
                "inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-bold text-amber-900 shadow-sm transition-colors hover:bg-amber-100",
                "dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-900/50"
              )}
            >
              <X className="size-3.5" aria-hidden="true" />
              <span>{t("mirror.banner.exit")}</span>
            </button>
          </div>
        </div>
      </div>

      <MirrorModeWatermark roleLabel={roleLabel} />
    </>
  );
}

interface MirrorCountdownProps {
  expiresAt?: string | null;
}

function MirrorCountdown({ expiresAt }: MirrorCountdownProps) {
  const { t } = useTranslation();
  const expiresMs = useMemo(() => {
    if (!expiresAt) return null;
    const ms = new Date(expiresAt).getTime();
    return Number.isFinite(ms) ? ms : null;
  }, [expiresAt]);

  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (expiresMs === null) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresMs]);

  if (expiresMs === null) return null;

  const remaining = Math.max(0, expiresMs - now);
  const totalSeconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <span
      data-testid="mirror-mode-countdown"
      className={cn(
        T.caption,
        "hidden items-center rounded-full border border-amber-200 bg-amber-100/60 px-2 py-1 font-bold tabular-nums sm:inline-flex",
        "dark:border-amber-700/60 dark:bg-amber-900/30"
      )}
      title={t("mirror.banner.countdown_label", { time: formatted })}
    >
      {t("mirror.banner.countdown_label", { time: formatted })}
    </span>
  );
}

interface MirrorModeWatermarkProps {
  roleLabel: string;
}

function MirrorModeWatermark({ roleLabel }: MirrorModeWatermarkProps) {
  const { t } = useTranslation();

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-hidden="true"
      data-testid="mirror-mode-watermark"
      className={cn(
        Z.toast,
        "pointer-events-none fixed select-none",
        // Hide pada mobile (<sm) supaya tidak overlap dengan POS mobile cart bar
        // (KasirPage `fixed inset-x-3 bottom-[...]` di breakpoint < xl).
        // Banner top-of-viewport tetap muncul sebagai cue utama.
        "hidden sm:block",
        "sm:bottom-4 sm:right-4",
        "rounded-full border border-amber-300 bg-amber-50/90 sm:px-3 sm:py-1 px-2 py-0.5 shadow-sm backdrop-blur-sm",
        "text-amber-900",
        "dark:border-amber-700/60 dark:bg-amber-900/40 dark:text-amber-100"
      )}
    >
      <span className={cn(T.caption, "flex items-center gap-1.5 font-bold")}>
        <Eye className="size-3" />
        {t("mirror.banner.viewing_as", { role: roleLabel })}
      </span>
    </div>,
    document.body
  );
}