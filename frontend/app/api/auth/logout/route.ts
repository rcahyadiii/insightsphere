/**
 * POST /api/auth/logout — Clear auth cookie.
 *
 * Backend tidak punya endpoint logout (JWT stateless), jadi cukup
 * invalidate cookie di sisi FE. Token masih valid sampai natural expire,
 * tapi browser tidak bisa kirim lagi.
 *
 * Future enhancement (post-MVP): backend bisa maintain token blacklist,
 * lalu Next ini forward POST ke /auth/logout untuk real invalidation.
 */

import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/app/lib/auth-cookie";

export async function POST() {
  const resp = NextResponse.json({ success: true }, { status: 200 });
  clearAuthCookie(resp);
  return resp;
}
