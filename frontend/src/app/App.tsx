"use client";

import { ReactNode, useState } from "react";
import { QueryClientProvider, useIsFetching } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { I18nProvider } from "./i18n";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./context/AuthContext";
import { createQueryClient } from "./lib/query-client";
import { LoadingBar } from "./components/ui/LoadingBar";

interface AppProps {
  children: ReactNode;
}

/**
 * App component acts as the global provider wrapper.
 * Equivalent to the entry point in a standard React SPA.
 *
 * Provider order (outer → inner):
 *   QueryClientProvider  — server state (TanStack Query)
 *   AuthProvider         — session state (will consume api.ts 401 events)
 *   I18nProvider         — locale
 *   ThemeProvider        — dark/light mode
 */
export function App({ children }: AppProps) {
  // Lazy init memastikan QueryClient singleton stabil antar render.
  // Dibuat per-instance App (bukan module-level) supaya SSR aman dari
  // state bleed antar request.
  const [queryClient] = useState(() => createQueryClient());
  const showQueryDevtools = process.env.NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS === "true";

  return (
    <QueryClientProvider client={queryClient}>
      <AppContent>{children}</AppContent>
      {process.env.NODE_ENV === "development" && showQueryDevtools && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
}

function AppContent({ children }: { children: ReactNode }) {
  const isFetching = useIsFetching();

  return (
    <I18nProvider>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <LoadingBar isLoading={isFetching > 0} />
          {children}
        </ThemeProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
