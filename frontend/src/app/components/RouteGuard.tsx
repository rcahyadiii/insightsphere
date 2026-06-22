"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { routes } from "@/app/routes";
import { toast } from "sonner";
import { useTranslation } from "@/app/i18n";
import { T } from "@/app/lib/typography";
import { cn } from "@/app/lib/utils";
import { isLoginPath, isPublicPath } from "@/app/lib/route-policy";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, role, isLoading } = useAuth();
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // 1. If not logged in and not on a public route, redirect to staff login (User choice #1)
    if (!user && !isPublicPath(pathname)) {
      router.push("/login/cashier");
      return;
    }

    // 2. If logged in but trying to access login page, redirect to home
    if (user && isLoginPath(pathname)) {
      router.push("/");
      return;
    }

    // 3. Deep RBAC Check — matches exact path AND all nested sub-routes
    if (user) {
      const currentRoute = routes.find(r =>
        r.path === "/"
          ? pathname === "/"
          : pathname === r.path || pathname.startsWith(r.path + "/")
      );
      if (currentRoute && currentRoute.allowedRoles) {
        if (!(currentRoute.allowedRoles as readonly string[]).includes(role)) {
          toast.error(t("auth.accessDenied"), {
            description: t("auth.access_denied_desc", { role }),
          });
          router.push("/");
        }
      }
    }
  }, [user, role, pathname, isLoading, router, t]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className={cn(T.caption, "text-slate-400")}>Authenticating...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
