"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Info, Loader2, Shield, UserPlus, Users, XCircle } from "lucide-react";
import { ResponsiveTable } from "@/app/components/ui/ResponsiveTable";
import { cn } from "@/app/lib/utils";
import { TABLE } from "@/app/lib/data";
import { C } from "@/app/lib/colors";
import { R } from "@/app/lib/radii";
import { T } from "@/app/lib/typography";
import { btn } from "@/app/lib/buttons";
import { A11Y } from "@/app/lib/a11y";
import { ICON } from "@/app/lib/spacing";
import * as authClient from "@/app/lib/auth-client";
import type { BackendUserListItem } from "@/app/lib/auth-client";
import { useAuth } from "@/app/context/AuthContext";

type SettingsPanelProps = {
  t: (key: string, params?: Record<string, string | number>) => string;
};

const ROLE_LABEL_KEY: Record<string, string> = {
  admin: "um.role.admin",
  owner: "um.role.owner",
  cashier: "um.role.cashier",
  inventory_manager: "um.role.inventory_manager",
};

export function AccessSettingsPanel({ t }: SettingsPanelProps) {
  const { user } = useAuth();
  const canManageUsers = user?.role === "admin" || user?.role === "owner";

  const {
    data: usersData = [],
    isLoading: usersLoading,
    isError: usersLoadFailed,
  } = useQuery<BackendUserListItem[]>({
    queryKey: ["settings", "access", "users"],
    queryFn: () => authClient.fetchUsers({ limit: 50 }),
    enabled: canManageUsers,
    retry: false,
    staleTime: 60_000,
  });

  const usersError = usersLoadFailed ? t("common.error_loading") : "";

  const members = useMemo(() => usersData.map(u => ({
    id: u.id,
    name: u.full_name || u.username,
    email: u.email ?? u.username,
    role: t(ROLE_LABEL_KEY[u.role] ?? u.role),
    active: u.is_active ?? true,
    lastActive: "-",
  })), [t, usersData]);

  const permissions = [
    { feature: t("set.access.feature.dashboard"), admin: true, owner: true, cashier: true },
    { feature: t("set.access.feature.pos"), admin: true, owner: true, cashier: true },
    { feature: t("set.access.feature.inventory"), admin: true, owner: true, cashier: false },
    { feature: t("set.access.feature.ai"), admin: true, owner: true, cashier: false },
    { feature: t("set.access.feature.reports"), admin: true, owner: true, cashier: true },
    { feature: t("set.access.feature.settings"), admin: true, owner: true, cashier: false },
    { feature: t("set.access.feature.team"), admin: true, owner: false, cashier: false },
  ];

  return (
    <div className="p-8 space-y-8 flex-1">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h3 className={cn(T.h3, "text-slate-900 dark:text-slate-100 flex items-center gap-3")}>
            <Users className={cn(ICON.lg, C.primary.icon)} />
            {t("set.access.title")}
          </h3>
          <p className={cn(T.bodySm, "text-slate-500 dark:text-slate-400")}>{t("set.access.desc")}</p>
        </div>
        <button className={cn(btn("primary", "sm"), "dark:bg-indigo-900/30 dark:hover:bg-indigo-900/40 dark:text-indigo-400 dark:shadow-none dark:border dark:border-indigo-800/50")}>
          <UserPlus className={ICON.sm} /> {t("set.access.invite")}
        </button>
      </div>

      {/* Mirror Mode Info */}
      <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30">
        <Info className="w-4 h-4 text-amber-500 shrink-0" />
        <p className={cn(T.bodySm, C.warning.text)}>{t("set.access.mirror_info")}</p>
      </div>

      {usersLoading && (
        <div className={cn(T.caption, "text-slate-400 dark:text-slate-500 flex items-center gap-2")}>
          <Loader2 className="size-3.5 animate-spin" /> {t("common.loading")}
        </div>
      )}

      {!usersLoading && usersError && (
        <div className={cn(T.bodySm, "flex items-center gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-lg border border-rose-100 dark:border-rose-800/50")}>
          <AlertCircle className="size-3.5 shrink-0" /> {usersError}
        </div>
      )}

      {!canManageUsers && !usersLoading && (
        <div className={cn(T.bodySm, "flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-100 dark:border-amber-800/50")}>
          <Info className="size-3.5 shrink-0" /> {t("set.access.mirror_info")}
        </div>
      )}

      {/* Team Table */}
      <ResponsiveTable
        label={t("set.access.title")}
        scrollerClassName="rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/30"
        minWidthClassName={TABLE.minWidth.settings}
      >
        <table className={TABLE.base} aria-label={t("set.access.title")}>
          <thead className={TABLE.head}>
            <tr>
              <th className={cn(TABLE.headCell, TABLE.stickyColumn, "bg-slate-50 dark:bg-slate-800/50")}>{t("set.access.name")}</th>
              <th className={TABLE.headCell}>{t("set.access.role")}</th>
              <th className={TABLE.headCell}>{t("set.access.status")}</th>
              <th className={TABLE.headCell}>{t("set.access.last_active")}</th>
              <th className={cn(TABLE.headCell, "text-center")}>{t("set.access.actions")}</th>
            </tr>
          </thead>
          <tbody className={TABLE.body}>
            {members.map((member) => (
              <tr key={member.id} className={cn(TABLE.row, TABLE.rowHover, "group")}>
                <td className={cn(TABLE.cell, TABLE.stickyColumn, "bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50")}>
                  <div className="flex items-center gap-3">
                    <div className={cn(T.label, "size-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400")}>
                      {member.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className={cn(T.label, "text-slate-900 dark:text-slate-200")}>{member.name}</p>
                      <p className={cn(T.caption, "text-slate-400")}>{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className={TABLE.cell}>
                  <span className={cn(
                    cn(T.micro, R.sm, "px-2 py-1 border"),
                    member.role === t("um.role.admin") ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/50" :
                    member.role === t("um.role.owner") ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/50" :
                    "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                  )}>
                    {member.role}
                  </span>
                </td>
                <td className={TABLE.cell}>
                  <span className={cn(
                    "inline-flex items-center gap-1", T.caption,
                    member.active ? C.success.icon : "text-slate-300"
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", member.active ? "bg-emerald-500" : "bg-slate-300")} />
                    {member.active ? t("set.access.active") : t("set.access.inactive")}
                  </span>
                </td>
                <td className={cn(TABLE.cell, "text-slate-400", T.caption)}>{member.lastActive}</td>
                <td className={cn(TABLE.cell, "text-center")}>
                  <div className="flex items-center justify-center gap-1">
                    <button type="button" className={cn(T.buttonSm, "px-2 py-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer", A11Y.focusRing.default)}>{t("set.access.edit_role")}</button>
                    <button type="button" className={cn(T.buttonSm, "px-2 py-1 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer", A11Y.focusRing.destructive)}>{t("set.access.remove")}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ResponsiveTable>

      {/* Permission Matrix */}
      <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
        <div>
          <h4 className={cn(T.h4, "text-slate-900 dark:text-slate-200 flex items-center gap-2")}>
            <Shield className="w-4 h-4 text-slate-400" /> {t("set.access.permission_title")}
          </h4>
          <p className={cn(T.caption, "text-slate-400 mt-0.5")}>{t("set.access.permission_desc")}</p>
        </div>
        <ResponsiveTable
          label={t("set.access.permission_title")}
          scrollerClassName="rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/30"
          minWidthClassName={TABLE.minWidth.reportCompact}
        >
          <table className={TABLE.base} aria-label={t("set.access.permission_title")}>
            <thead className={TABLE.head}>
              <tr>
                <th className={cn(TABLE.headCell, TABLE.stickyColumn, "bg-slate-50 dark:bg-slate-800/50")}>{t("set.access.feature")}</th>
                <th className={cn(TABLE.headCell, "text-center", C.primary.icon)}>{t("um.role.admin")}</th>
                <th className={cn(TABLE.headCell, "text-center", C.warning.icon)}>{t("um.role.owner")}</th>
                <th className={cn(TABLE.headCell, "text-center")}>{t("um.role.cashier")}</th>
              </tr>
            </thead>
            <tbody className={TABLE.body}>
              {permissions.map((row) => (
                <tr key={row.feature} className={cn(TABLE.row, TABLE.rowHover, "group")}>
                  <td className={cn(TABLE.cell, TABLE.stickyColumn, "bg-white font-bold dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50", T.bodySm)}>{row.feature}</td>
                  {[row.admin, row.owner, row.cashier].map((allowed, j) => (
                    <td key={j} className={cn(TABLE.cell, "text-center")}>
                      {allowed ? <CheckCircle2 className={cn("w-4 h-4 mx-auto", C.success.icon)} /> : <XCircle className="w-4 h-4 text-slate-200 dark:text-slate-700 mx-auto" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTable>
      </div>
    </div>
  );
}
