"use client";

/**
 * AuthContext — Phase 0.3 rewrite (ADR-002 cookie-based).
 *
 * Perubahan dari versi lama:
 *   - Buang DEMO_CREDENTIALS hardcoded + localStorage persistence
 *   - Session di-hydrate via `useQuery(["auth", "me"])` dari cookie httpOnly
 *   - `login()` panggil Next proxy `/api/auth/login` (bukan backend langsung)
 *   - Listen global event `auth:unauthorized` dari api client → auto-logout
 *
 * Role naming (ADR-003 updated):
 *   - FE UserRole = "admin" | "owner" | "inventory_manager" | "cashier"
 *   - Backend BackendRole mirrors FE 1:1 (semua 4 role dibedakan)
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as authClient from "@/app/lib/auth-client";
import type { BackendUser, BackendRole } from "@/app/lib/auth-client";
import { ApiError, API_EVENTS } from "@/app/lib/api";
import { useTranslation } from "@/app/i18n";
import { shouldHandleUnauthorizedRedirect, shouldHydrateAuth } from "@/app/lib/route-policy";
import {
  DEFAULT_ROLE,
  ROLE_CODES,
  isRoleCode,
  type UserRole,
} from "@/app/domain/constants";

// ============================================================
// Types
// ============================================================

export type { UserRole };

export interface User {
  id: string;
  name: string;
  role: UserRole;
  username: string;
  storeNbr: number | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  avatar?: string;
  twoFactorEnabled: boolean;
}

export type LoginResult =
  | { kind: "success" }
  | { kind: "requires_2fa"; challengeToken: string }
  | { kind: "failed"; error: string };

interface AuthContextType {
  user: User | null;
  role: UserRole;
  actualRole: UserRole | null;
  mirrorSession: authClient.MirrorSession | null;
  login: (username: string, pin: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  switchView: (role: UserRole) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================
// Role mapping (ADR-003 transitional)
// ============================================================

function mapBackendRoleToFE(role: BackendRole): UserRole {
  return isRoleCode(role) ? role : DEFAULT_ROLE;
}

function mapBackendUserToFE(u: BackendUser): User {
  return {
    id: u.id,
    name: u.full_name || u.username,
    role: mapBackendRoleToFE(u.role),
    username: u.username,
    storeNbr: u.store_nbr,
    email: u.email,
    phone: u.phone,
    position: u.position,
    avatar: u.avatar_url || undefined,
    twoFactorEnabled: u.two_factor_enabled,
  };
}

// ============================================================
// Provider
// ============================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const shouldHydrateSession = shouldHydrateAuth(pathname);

  // Hydrate session from cookie on mount (dan di-share ke component lain
  // via useQuery cache). Retry skip kalau 401 — tidak auth = baris kosong,
  // user harus login dulu.
  const {
    data: backendUser,
    isLoading: isAuthQueryLoading,
  } = useQuery<BackendUser | null, ApiError>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        return await authClient.fetchMe();
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          // Not authenticated — itu state normal, bukan error.
          return null;
        }
        throw err;
      }
    },
    enabled: shouldHydrateSession,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) return false;
      return failureCount < 2;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const user = backendUser ? mapBackendUserToFE(backendUser) : null;
  const isLoading = shouldHydrateSession ? isAuthQueryLoading : false;

  const { data: mirrorSession } = useQuery<authClient.MirrorSession | null, ApiError>({
    queryKey: ["auth", "mirror"],
    queryFn: async () => authClient.fetchMirrorSession(),
    enabled: Boolean(user && user.role === ROLE_CODES.admin && shouldHydrateSession),
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  // Listen global 401 dari `api` client (data endpoint) → otomatis logout.
  useEffect(() => {
    const handleUnauthorized = () => {
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.clear();
      if (
        typeof window !== "undefined" &&
        shouldHandleUnauthorizedRedirect(window.location.pathname)
      ) {
        toast.error(t("auth.session.expired"), {
          description: t("auth.session.expired_desc"),
        });
        router.push("/login/select");
      }
    };
    window.addEventListener(API_EVENTS.UNAUTHORIZED, handleUnauthorized);

    const handleMirrorReadOnly = () => {
      toast.error(t("mirror.read_only.toast"), {
        description: t("mirror.read_only.desc"),
      });
    };
    window.addEventListener(API_EVENTS.MIRROR_READ_ONLY, handleMirrorReadOnly);

    return () => {
      window.removeEventListener(API_EVENTS.UNAUTHORIZED, handleUnauthorized);
      window.removeEventListener(API_EVENTS.MIRROR_READ_ONLY, handleMirrorReadOnly);
    };
  }, [queryClient, router, t]);

  // ============================================================
  // Actions
  // ============================================================

  const login = useCallback(
    async (username: string, pin: string): Promise<LoginResult> => {
      try {
        const result = await authClient.login({ username, pin });
        if (authClient.isChallenge(result)) {
          return {
            kind: "requires_2fa",
            challengeToken: result.challenge_token,
          };
        }
        // Full success — sync query cache dari response payload
        // (hemat round-trip ke /auth/me).
        queryClient.setQueryData(["auth", "me"], result.user);
        return { kind: "success" };
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : t("auth.error.server");
        return { kind: "failed", error: message };
      }
    },
    [queryClient, t]
  );

  const logout = useCallback(async () => {
    try {
      await authClient.logout();
    } catch {
      // Cookie tetap di-clear oleh Next route handler meskipun backend error.
    }
    queryClient.setQueryData(["auth", "me"], null);
    queryClient.clear();
    router.push("/login/select");
  }, [queryClient, router]);

  const switchView = useCallback(
    (newRole: UserRole) => {
      if (user?.role !== ROLE_CODES.admin) return;

      const applyMirror = async () => {
        try {
          if (newRole === ROLE_CODES.admin) {
            await authClient.stopMirrorSession();
            queryClient.setQueryData(["auth", "mirror"], null);
            return;
          }
          const session = await authClient.startMirrorSession(newRole);
          queryClient.setQueryData(["auth", "mirror"], session);
        } catch (err) {
          const message = err instanceof ApiError ? err.message : t("common.error");
          toast.error(message);
        }
      };

      void applyMirror();
    },
    [queryClient, t, user]
  );

  // ============================================================
  // Derived state
  // ============================================================

  const mirroredRole: UserRole | null =
    user?.role === ROLE_CODES.admin &&
    mirrorSession?.target_role &&
    isRoleCode(mirrorSession.target_role)
      ? mirrorSession.target_role
      : null;

  const effectiveRole: UserRole =
    mirroredRole || user?.role || ROLE_CODES.cashier;

  const value: AuthContextType = {
    user,
    role: effectiveRole,
    actualRole: user?.role ?? null,
    mirrorSession: mirrorSession ?? null,
    login,
    logout,
    switchView,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
