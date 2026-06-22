/**
 * GET /api/auth/me — Proxy ke backend /auth/me dengan Bearer dari cookie.
 *
 * Dipakai AuthContext untuk hydrate session on mount.
 * Return user profile atau 401 kalau cookie invalid.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthCookie, getBackendUrl, clearAuthCookie } from "@/app/lib/auth-cookie";

export async function GET() {
  const token = await getAuthCookie();
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${getBackendUrl()}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      // Disable Next cache — session harus fresh per-request.
      cache: "no-store",
    });
  } catch (err) {
    console.error("[/api/auth/me] Backend unreachable:", err);
    return NextResponse.json(
      { detail: "Tidak dapat menghubungi server" },
      { status: 503 }
    );
  }

  if (!backendResponse.ok) {
    // Token invalid → clear cookie biar client tahu harus re-login.
    const errResp = NextResponse.json(
      { detail: "Session expired" },
      { status: backendResponse.status }
    );
    if (backendResponse.status === 401) {
      clearAuthCookie(errResp);
    }
    return errResp;
  }

  const user = await backendResponse.json();
  return NextResponse.json(user, { status: 200 });
}

export async function PATCH(request: NextRequest) {
  const token = await getAuthCookie();
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${getBackendUrl()}/auth/me`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (err) {
    console.error("[/api/auth/me PATCH] Backend unreachable:", err);
    return NextResponse.json(
      { detail: "Tidak dapat menghubungi server" },
      { status: 503 }
    );
  }

  const data = await backendResponse.json().catch(() => ({}));
  return NextResponse.json(data, { status: backendResponse.status });
}
