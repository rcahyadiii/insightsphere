/**
 * Catch-all Backend Proxy — /api/backend/[...path]/route.ts
 *
 * Forward SEMUA request FE ke backend FastAPI dengan inject Bearer token
 * dari httpOnly cookie. Ini jembatan yang membuat ADR-002 (cookie auth)
 * compatible dengan backend yang Bearer-only.
 *
 * Mapping:
 *   FE: api("/inventory/products")
 *   → fetch("/api/backend/inventory/products")
 *   → Next baca cookie ss_access_token
 *   → fetch("{BACKEND_URL}/inventory/products", { Authorization: Bearer ... })
 *   → return streamed response
 *
 * Support semua HTTP method (GET, POST, PUT, PATCH, DELETE).
 * Body passthrough, headers allowlist, response streamed.
 *
 * Catatan:
 *   - Auth endpoints (/auth/login, /auth/me, dll) DIBLOK di sini —
 *     wajib pakai route khusus `/api/auth/*` yang handle Set-Cookie.
 *     Ini defensive: cegah token accidentally bocor via generic response.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthCookie, getBackendUrl } from "@/app/lib/auth-cookie";

// Headers dari request yang kita forward ke backend.
// Filter out Next-internal headers + security-sensitive ones.
const FORWARD_REQUEST_HEADERS = new Set([
  "content-type",
  "accept",
  "accept-language",
  "user-agent",
  "x-forwarded-for",
  "x-real-ip",
]);

// Headers dari response backend yang kita forward ke client.
const FORWARD_RESPONSE_HEADERS = new Set([
  "content-type",
  "content-disposition", // untuk file download (reporting export)
  "x-row-count",         // custom header dari reporting
  "cache-control",
]);

// Path yang DILARANG via generic proxy — harus via /api/auth/* explicit route.
// Mencegah user bypass cookie refresh logic dengan call langsung /api/backend/auth/login.
const BLOCKED_PATHS = [
  "auth/login",
  "auth/login/verify-2fa",
  "auth/logout",
  "auth/refresh",
  "auth/me",
];

async function handle(request: NextRequest, method: string) {
  // Extract path segments: /api/backend/inventory/products → "inventory/products"
  const url = new URL(request.url);
  const pathSegments = url.pathname.replace(/^\/api\/backend\/?/, "");

  if (BLOCKED_PATHS.some((p) => pathSegments === p || pathSegments.startsWith(p + "/"))) {
    return NextResponse.json(
      {
        detail: `Path '/${pathSegments}' harus diakses via /api/auth/* route khusus`,
      },
      { status: 400 }
    );
  }

  const token = await getAuthCookie();
  if (!token) {
    return NextResponse.json(
      { detail: "Not authenticated" },
      { status: 401 }
    );
  }

  // Build backend URL dengan preserve query string.
  const backendUrl = `${getBackendUrl()}/${pathSegments}${url.search}`;

  // Forward allowed headers + inject Authorization.
  const forwardHeaders = new Headers();
  for (const [name, value] of request.headers.entries()) {
    if (FORWARD_REQUEST_HEADERS.has(name.toLowerCase())) {
      forwardHeaders.set(name, value);
    }
  }
  forwardHeaders.set("Authorization", `Bearer ${token}`);

  // Passthrough body untuk non-GET methods.
  let body: BodyInit | undefined;
  if (method !== "GET" && method !== "HEAD" && method !== "DELETE") {
    body = await request.arrayBuffer();
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(backendUrl, {
      method,
      headers: forwardHeaders,
      body,
      cache: "no-store",
    });
  } catch (err) {
    console.error(`[proxy ${method} /${pathSegments}] Backend unreachable:`, err);
    return NextResponse.json(
      { detail: "Tidak dapat menghubungi server" },
      { status: 503 }
    );
  }

  // Stream response body apa adanya (support download, JSON, text).
  const responseHeaders = new Headers();
  for (const [name, value] of backendResponse.headers.entries()) {
    if (FORWARD_RESPONSE_HEADERS.has(name.toLowerCase())) {
      responseHeaders.set(name, value);
    }
  }

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });
}

export async function GET(req: NextRequest) { return handle(req, "GET"); }
export async function POST(req: NextRequest) { return handle(req, "POST"); }
export async function PUT(req: NextRequest) { return handle(req, "PUT"); }
export async function PATCH(req: NextRequest) { return handle(req, "PATCH"); }
export async function DELETE(req: NextRequest) { return handle(req, "DELETE"); }
