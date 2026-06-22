import { NextRequest, NextResponse } from "next/server";
import { getAuthCookie, getBackendUrl } from "@/app/lib/auth-cookie";

export async function GET(request: NextRequest) {
  const token = await getAuthCookie();
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") ?? "20";

  let backendResponse: Response;
  try {
    backendResponse = await fetch(
      `${getBackendUrl()}/auth/login-history?limit=${limit}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      }
    );
  } catch (err) {
    console.error("[/api/auth/login-history] Backend unreachable:", err);
    return NextResponse.json({ detail: "Tidak dapat menghubungi server" }, { status: 503 });
  }

  const data = await backendResponse.json().catch(() => ([]));
  return NextResponse.json(data, { status: backendResponse.status });
}
