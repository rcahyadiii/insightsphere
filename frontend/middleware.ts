import { NextRequest, NextResponse } from "next/server";

/**
 * CSRF / origin enforcement untuk Next API routes.
 *
 * Strategi pertahanan berlapis:
 *   1. Cookie session sudah `httpOnly + SameSite=Lax`, jadi browser tidak akan
 *      mengirim cookie pada cross-site POST yang dipicu lewat form/JS lintas
 *      origin. Itu memitigasi kasus klasik CSRF.
 *   2. Lapisan kedua di sini: middleware menolak request `POST/PUT/PATCH/DELETE`
 *      ke `/api/*` kalau header `Origin` (atau `Referer` saat Origin null) tidak
 *      sama dengan origin app. Ini menutup celah `<form action="https://app/api/...">`
 *      yang masih bisa kirim cookie SameSite=Lax untuk top-level navigation
 *      (POST). Server-to-server panggilan tanpa Origin (seperti curl/Postman)
 *      diizinkan supaya skrip operasi tidak ikut diblokir; itu memang harus
 *      memakai token bearer eksplisit.
 */

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const ALLOWED_ORIGINS_ENV = process.env.NEXT_PUBLIC_ALLOWED_ORIGINS;

function buildAllowedOrigins(host: string | null): Set<string> {
  const allowed = new Set<string>();
  if (host) {
    allowed.add(`http://${host}`);
    allowed.add(`https://${host}`);
  }
  if (ALLOWED_ORIGINS_ENV) {
    for (const raw of ALLOWED_ORIGINS_ENV.split(",")) {
      const trimmed = raw.trim();
      if (trimmed) allowed.add(trimmed);
    }
  }
  return allowed;
}

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
  if (!WRITE_METHODS.has(request.method)) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  if (!origin && !referer) {
    return NextResponse.next();
  }

  const allowed = buildAllowedOrigins(request.headers.get("host"));

  const candidate = origin ?? (referer ? new URL(referer).origin : null);
  if (candidate && allowed.has(candidate)) {
    return NextResponse.next();
  }

  return NextResponse.json(
    {
      detail: "Origin tidak diizinkan untuk request mutasi",
      code: "CSRF_ORIGIN_BLOCKED",
    },
    { status: 403 }
  );
}

export const config = {
  matcher: ["/api/:path*"],
};