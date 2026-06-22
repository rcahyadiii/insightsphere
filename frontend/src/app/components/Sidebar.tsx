"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  Eye,
  User as UserIcon,
} from "lucide-react";
import { NAV_GROUPS, routes } from "@/app/routes";
import { useTranslation } from "@/app/i18n";
import { useAuth } from "@/app/context/AuthContext";
import { cn } from "@/app/lib/utils";
import { T } from "@/app/lib/typography";
import { C } from "@/app/lib/colors";
import { ICON } from "@/app/lib/spacing";
import { R } from "@/app/lib/radii";
import { LAYOUT_CLASS } from "@/app/lib/layout";
import { ROLE_CODES, ROLE_SETS, hasRole } from "@/app/domain/constants";

const SIDEBAR_KEY = "sidebar_collapsed";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIDEBAR_KEY) === "true";
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(collapsed));
  }, [collapsed]);

  const pathname = usePathname();
  const { t } = useTranslation();
  const { user, role, actualRole, switchView } = useAuth();

  const isAdmin = hasRole(ROLE_SETS.impersonators, actualRole ?? ROLE_CODES.cashier);

  // Filter routes based on user role
  const filteredRoutes = routes.filter(route =>
    !route.allowedRoles || hasRole(route.allowedRoles, role)
  );

  const groupedRoutes = NAV_GROUPS.map((group) => ({
    group,
    items: filteredRoutes.filter((route) => route.group === group),
  })).filter(({ items }) => items.length > 0);

  const roleAvatarClass =
    actualRole === ROLE_CODES.owner ? C.roleOwner.avatar :
    actualRole === ROLE_CODES.admin ? C.roleAdmin.avatar :
    actualRole === ROLE_CODES.inventoryManager ? C.roleInventory.avatar :
    C.roleCashier.avatar;

  return (
    <aside
      className={cn(
        "h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out shrink-0",
        collapsed ? LAYOUT_CLASS.sidebarCollapsed : LAYOUT_CLASS.sidebarExpanded
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-6 h-14 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
          <Boxes className={cn(ICON.lg, "text-white")} />
        </div>
        {!collapsed && (
          <span className={cn(T.h2, "text-slate-900 dark:text-white animate-in fade-in duration-300")}>
            InsightSphere
          </span>
        )}
      </div>

      {/* Navigation section */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {groupedRoutes.map(({ group, items }, groupIdx) => (
          <div
            key={group}
            className={cn(
              "space-y-1",
              groupIdx === 0
                ? ""
                : collapsed
                  ? "mt-2 pt-3 border-t border-slate-200 dark:border-slate-800"
                  : "mt-2 pt-3 border-t border-slate-200/70 dark:border-slate-800/60",
            )}
          >
            {!collapsed && (
              <p className={cn(T.label, "px-3 pt-1 pb-2 uppercase tracking-widest text-slate-400 dark:text-slate-500")}>
                {t(`nav.group.${group}`)}
              </p>
            )}
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === "/"
                ? pathname === "/"
                : pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  title={collapsed ? t(`nav.${item.id}`) : undefined}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-indigo-50 dark:bg-slate-700/60 text-indigo-700 dark:text-white shadow-sm ring-1 ring-indigo-100 dark:ring-white/5"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <div className="shrink-0 w-6 flex justify-center">
                    <Icon className={cn(
                      ICON.lg,
                      "transition-transform duration-300",
                      isActive ? "text-indigo-700 dark:text-white scale-110" : "group-hover:scale-110"
                    )} />
                  </div>
                  {!collapsed && (
                    <span className={cn(T.buttonLg, "truncate animate-in fade-in slide-in-from-left-2 duration-300")}>
                      {t(`nav.${item.id}`)}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Admin Mirror Mode Control */}
      {!collapsed && isAdmin && (
        <div className={cn("mx-4 mb-4 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500", R.lg)}>
           <div className="flex items-center gap-2 text-emerald-500">
              <Eye className={ICON.md} />
              <span className={T.label}>{t("nav.mirror.mode")}</span>
           </div>
           
           <div className="grid grid-cols-3 gap-1.5">
              {ROLE_SETS.mirrorTargets.map((r) => {
                const label = t(`um.role.${r}`);
                return (
                  <button
                    key={r}
                    onClick={() => switchView(r)}
                    title={label}
                    className={cn(
                      T.buttonSm,
                      "min-w-0 px-1.5 py-2 rounded-lg transition-all truncate",
                      role === r
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-transparent hover:text-slate-900 dark:hover:text-slate-200"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
           </div>

        </div>
      )}

      {/* User Profile */}
      <div className="px-3 pt-3 pb-2 border-t border-slate-200 dark:border-slate-800">
        <Link
          href="/pengaturan"
          className={cn(
            "flex items-center gap-3 rounded-lg transition-all group",
            pathname.startsWith("/pengaturan")
              ? "bg-indigo-50 dark:bg-slate-700/60 ring-1 ring-indigo-100 dark:ring-white/5"
              : "hover:bg-slate-100 dark:hover:bg-slate-800",
            collapsed ? "justify-center p-1.5" : "p-2"
          )}
          title={user?.name || "Profile"}
        >
          <div className={cn(
            "size-9 rounded-lg flex items-center justify-center border shadow-sm shrink-0 group-hover:shadow-md transition-all",
            roleAvatarClass
          )}>
            <UserIcon className={ICON.lg} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300 min-w-0">
              <p className={cn(T.bodySm, "text-slate-900 dark:text-white font-bold leading-tight truncate")}>{user?.name || "User"}</p>
              <p className={cn(T.caption, "font-bold text-slate-500 uppercase tracking-wider leading-none mt-0.5 truncate")}>{actualRole ?? role}</p>
            </div>
          )}
        </Link>
      </div>

      {/* Footer / Toggle section */}
      <div className="p-3">
        <button
          onClick={() => setCollapsed(prev => !prev)}
          className="w-full h-10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
          title={collapsed ? t("nav.expand") : t("nav.collapse")}
        >
          {collapsed ? (
            <ChevronRight className={ICON.lg} />
          ) : (
            <div className="flex items-center gap-2">
              <ChevronLeft className={ICON.lg} />
              <span className={cn(T.buttonSm, "text-slate-500 animate-in fade-in duration-300")}>{t("nav.collapse")}</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
