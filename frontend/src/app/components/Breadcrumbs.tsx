"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { routes } from "@/app/routes";
import { useTranslation } from "@/app/i18n";
import { T } from "@/app/lib/typography";
import { cn } from "@/app/lib/utils";
import { ICON } from "@/app/lib/spacing";

export function Breadcrumbs() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const breadcrumbText = cn(T.body, "truncate");
  const breadcrumbCurrentText = cn(T.bodyEmphasis, "max-w-[150px] truncate text-slate-600 dark:text-slate-300");
  
  // Split path into segments, filtering out empty strings
  const segments = pathname.split("/").filter(Boolean);
  
  // Helper to get label from routes
  const getLabel = (segment: string, fullPath: string) => {
    // If it's the root or dashboard
    if (fullPath === "" || fullPath === "/") return "InsightSphere";
    
    // Find in routes mapping
    const route = routes.find(r => r.path === fullPath);
    if (route) return t(route.labelKey);
    
    // Fallback: Capitalize
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
  };

  return (
    <nav className="flex min-w-0 items-center gap-2 text-slate-400 font-medium" aria-label={t("common.breadcrumb")}>
      {/* Root / Home */}
      <Link 
        href="/"
        className="flex min-w-0 items-center gap-1.5 transition-colors hover:text-slate-900 dark:hover:text-slate-100 group cursor-pointer"
      >
        <span className={cn(breadcrumbText, "text-slate-900 dark:text-slate-100")}>InsightSphere</span>
      </Link>

      {/* Dynamic Segments */}
      {segments.map((segment, index) => {
        const path = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        const label = getLabel(segment, path);

        return (
          <div key={path} className="hidden min-w-0 items-center gap-2 sm:flex">
            <ChevronRight className={cn(ICON.md, "text-slate-300")} />
            {isLast ? (
              <span className={breadcrumbCurrentText}>
                {label}
              </span>
            ) : (
              <Link
                href={path}
                className={cn(breadcrumbText, "max-w-[150px] transition-colors hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer")}
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}

      {/* Desktop Only Page Label for Single Segments (e.g. Dashboard) */}
      {segments.length === 0 && (
         <div className="hidden items-center gap-2 sm:flex">
           <ChevronRight className={cn(ICON.md, "text-slate-300")} />
           <span className={breadcrumbCurrentText}>{t("nav.dashboard")}</span>
         </div>
      )}
    </nav>
  );
}
