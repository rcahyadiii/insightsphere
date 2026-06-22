/**
 * Auth Cookie Helpers — Phase 0.3 (ADR-002).
 *
 * Dipakai EKSKLUSIF di Next.js API route handlers (server-side).
 * JANGAN import di Client Component — cookie ini httpOnly dan tidak
 * bisa dibaca dari JavaScript browser.
 *
 * Naming: `ss_access_token` dipertahankan untuk kompatibilitas dengan
 * konvensi legacy `ss_user` di localStorage yang akan di-delete di
 * AuthContext refactor.
 */

import type { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_MAX_AGE_SECONDS } from "@/app/domain/constants";

export const AUTH_COOKIE_NAME = "ss_access_token";

/**
 * Dev fallback URL backend FastAPI lokal.
 * SENGAJA di-export agar audit/tooling tahu satu-satunya tempat literal ini hidup.
 * JANGAN duplikasi di file lain — pakai `getBackendUrl()` di production code.
 */
export const DEV_BACKEND_URL = "http://127.0.0.1:8000";

/**
 * Max age cookie (detik). 7 hari — match backend ACCESS_TOKEN_EXPIRE_MINUTES
 * default. Session expiry ditentukan backend JWT exp claim; cookie hanya
 * container transport. Cookie expired > JWT expired = browser hapus otomatis.
 */
export { AUTH_COOKIE_MAX_AGE_SECONDS };

/**
 * Set httpOnly cookie dengan access token.
 * HARUS dipanggil di Route Handler response sebelum return.
 */
export function setAuthCookie(response: NextResponse, accessToken: string): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: accessToken,
    httpOnly: true,
    // Secure=true di prod (HTTPS), false di dev (HTTP localhost).
    secure: process.env.NODE_ENV === "production",
    // Lax: cookie ikut di top-level navigation GET (back button, link click),
    // tapi tidak di cross-site iframe/XHR → balance security vs UX.
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  });
}

/**
 * Clear cookie saat logout atau auth failure.
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // expire langsung
  });
}

/**
 * Baca access token dari incoming request (via Next `cookies()` helper).
 * Return `null` kalau tidak ada / kosong.
 *
 * Catatan: `cookies()` adalah async di Next 15+.
 */
export async function getAuthCookie(): Promise<string | null> {
  const store = await cookies();
  const cookie = store.get(AUTH_COOKIE_NAME);
  return cookie?.value || null;
}

/**
 * Dev-only fallback resolver. Kembalikan `DEV_BACKEND_URL` di non-production,
 * kalau-kalau tidak ada env yang di-set sama sekali.
 *
 * Pisahkan dari `getBackendUrl()` agar audit test dapat mengunci posisi
 * literal hostname lokal hanya di file ini, dan agar production tetap
 * fail-fast kalau env wajib hilang.
 */
function getDevBackendUrl(): string {
  if (process.env.NODE_ENV !== "production") {
    return DEV_BACKEND_URL;
  }
  throw new Error(
    "BACKEND_INTERNAL_URL or NEXT_PUBLIC_API_URL must be configured in production",
  );
}

/**
 * Base URL backend untuk server-side forward (Next API → FastAPI).
 * Berbeda dengan `NEXT_PUBLIC_API_URL` yg dipakai client — server-side
 * pakai env private `BACKEND_INTERNAL_URL` kalau ada (untuk kasus
 * container-to-container networking) atau fallback ke public URL.
 */
export function getBackendUrl(): string {
  const configuredBackendUrl =
    process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;

  if (configuredBackendUrl) {
    return configuredBackendUrl;
  }

  return getDevBackendUrl();
}
