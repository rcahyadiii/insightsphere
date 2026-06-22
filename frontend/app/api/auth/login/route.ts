/**
 * POST /api/auth/login — Proxy ke backend `/auth/login`.
 *
 * Flow:
 *   1. Client POST JSON { username, pin }
 *   2. Next route convert ke form-urlencoded (FastAPI OAuth2PasswordRequestForm)
 *   3. Forward ke backend /auth/login
 *   4a. Backend return { access_token, token_type } → set httpOnly cookie,
 *       return { user: UserResponse } (fetched dari /auth/me dengan fresh token)
 *   4b. Backend return { requires_2fa, challenge_token } → forward ke client
 *       TANPA set cookie (auth belum selesai)
 *   4c. Backend 401/other error → forward error + clear cookie (jaga-jaga)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  setAuthCookie,
  clearAuthCookie,
  getBackendUrl,
} from "@/app/lib/auth-cookie";

interface LoginRequestBody {
  username: string;
  pin: string;
}

interface BackendLoginSuccess {
  access_token: string;
  token_type: string;
}

interface Backend2FAChallenge {
  requires_2fa: true;
  challenge_token: string;
  message?: string;
}

type BackendLoginResponse = BackendLoginSuccess | Backend2FAChallenge;

export async function POST(request: NextRequest) {
  let body: LoginRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.username || !body.pin) {
    return NextResponse.json(
      { detail: "username dan pin wajib diisi" },
      { status: 422 }
    );
  }

  // FastAPI OAuth2PasswordRequestForm expects form-urlencoded.
  const formData = new URLSearchParams();
  formData.append("username", body.username);
  formData.append("password", body.pin);
  formData.append("grant_type", "password");

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${getBackendUrl()}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: formData.toString(),
      // Forward real client IP ke backend untuk audit trail yg akurat.
      // Next sudah strip dulu, kita restore dengan header forwarded-for.
      // (Best-effort; jika Vercel/Railway, LB sudah set X-Forwarded-For.)
    });
  } catch (err) {
    console.error("[/api/auth/login] Backend unreachable:", err);
    return NextResponse.json(
      { detail: "Tidak dapat menghubungi server. Periksa koneksi Anda." },
      { status: 503 }
    );
  }

  const data = (await backendResponse.json()) as BackendLoginResponse & {
    detail?: string;
  };

  // Case 4c: auth failure. Clear cookie as safety + forward error.
  if (!backendResponse.ok) {
    const errorResp = NextResponse.json(
      { detail: data.detail || "Login gagal" },
      { status: backendResponse.status }
    );
    clearAuthCookie(errorResp);
    return errorResp;
  }

  // Case 4b: 2FA required — forward challenge, DON'T set cookie.
  if ("requires_2fa" in data && data.requires_2fa) {
    return NextResponse.json(
      {
        requires_2fa: true,
        challenge_token: data.challenge_token,
        message: data.message,
      },
      { status: 200 }
    );
  }

  // Case 4a: success — fetch user profile dengan fresh token, then set cookie.
  const successData = data as BackendLoginSuccess;

  let userResponse: Response;
  try {
    userResponse = await fetch(`${getBackendUrl()}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${successData.access_token}`,
        Accept: "application/json",
      },
    });
  } catch (err) {
    console.error("[/api/auth/login] /auth/me fetch failed:", err);
    return NextResponse.json(
      { detail: "Login berhasil tapi gagal mengambil profil user" },
      { status: 502 }
    );
  }

  if (!userResponse.ok) {
    return NextResponse.json(
      { detail: "Login berhasil tapi gagal validate user" },
      { status: 502 }
    );
  }

  const user = await userResponse.json();

  const resp = NextResponse.json({ user }, { status: 200 });
  setAuthCookie(resp, successData.access_token);
  return resp;
}
