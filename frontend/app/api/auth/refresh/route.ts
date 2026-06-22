/**
 * POST /api/auth/refresh — Rotate access token tanpa re-login.
 *
 * Dipanggil oleh:
 *   - AuthContext secara terjadwal sebelum token mendekati expiry
 *   - Middleware (Phase 0.5) saat detect cookie mau expire
 *   - `api` client sebagai retry-once setelah 401 (optional future)
 *
 * Flow:
 *   1. Baca cookie saat ini
 *   2. Forward ke backend /auth/refresh dengan Bearer header
 *   3. Backend return token baru → update cookie dengan max-age reset
 *   4. Backend 401 → clear cookie, signal re-login
 */

import { NextResponse } from "next/server";
import {
  setAuthCookie,
  clearAuthCookie,
  getAuthCookie,
  getBackendUrl,
} from "@/app/lib/auth-cookie";

export async function POST() {
  const currentToken = await getAuthCookie();
  if (!currentToken) {
    return NextResponse.json(
      { detail: "No active session" },
      { status: 401 }
    );
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${getBackendUrl()}/auth/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${currentToken}`,
        Accept: "application/json",
      },
    });
  } catch (err) {
    console.error("[/api/auth/refresh] Backend unreachable:", err);
    return NextResponse.json(
      { detail: "Tidak dapat menghubungi server" },
      { status: 503 }
    );
  }

  if (!backendResponse.ok) {
    // Token lama sudah invalid/expired — clear cookie, force re-login.
    const errResp = NextResponse.json(
      { detail: "Session expired, please login again" },
      { status: 401 }
    );
    clearAuthCookie(errResp);
    return errResp;
  }

  const data = (await backendResponse.json()) as {
    access_token: string;
    token_type: string;
  };

  const resp = NextResponse.json({ success: true }, { status: 200 });
  setAuthCookie(resp, data.access_token);
  return resp;
}
