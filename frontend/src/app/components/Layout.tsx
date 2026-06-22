"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { SkipLink } from "./SkipLink";
import { Header } from "./Header";
import { MirrorModeBanner } from "./MirrorModeBanner";
import { ErrorBoundary } from "./ErrorBoundary";
import { RouteGuard } from "./RouteGuard";
import { usePathname } from "next/navigation";
import { cn } from "@/app/lib/utils";
import { Z } from "@/app/lib/elevation";
import { BACKDROP } from "@/app/lib/utility";
import { getShellMode } from "@/app/lib/route-policy";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const shellMode = getShellMode(pathname);

  if (shellMode === "public") {
    return (
      <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100">
        <RouteGuard>{children}</RouteGuard>
      </div>
    );
  }

  if (shellMode === "fullscreen") {
    return (
      <div className="flex h-screen h-[100dvh] w-full overflow-hidden bg-slate-50 font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <SkipLink />
        <RouteGuard>
          <MirrorModeBanner />
          <main id="main-content" className="h-full flex-1 overflow-hidden p-2 text-slate-900 dark:text-slate-100 sm:p-3 lg:p-4">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </RouteGuard>
      </div>
    );
  }

  return (
    <div className="flex h-screen h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      <SkipLink />
      <RouteGuard>
        {/* Desktop Sidebar */}
        <div className="hidden lg:block h-full">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className={cn("fixed inset-0 lg:hidden", Z.overlay)}>
            <div
              className={cn("absolute inset-0 transition-opacity duration-300", BACKDROP.sm, "bg-slate-900/60")}
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative h-full w-[252px] animate-in slide-in-from-left duration-300 ease-out shadow-2xl overflow-hidden">
              <Sidebar />
            </div>
          </div>
        )}

        <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
          <MirrorModeBanner />
          <Header onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
          <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 text-slate-900 dark:text-slate-100">
            <div className="mx-auto max-w-[1920px] w-full">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </RouteGuard>
    </div>
  );
}
