import { NextRequest, NextResponse } from "next/server";
import { getAuthCookie, getBackendUrl } from "@/app/lib/auth-cookie";

export async function GET(request: NextRequest) {
  const token = await getAuthCookie();
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams();
  ["is_active", "role", "store_nbr", "search", "skip", "limit"].forEach((key) => {
    const val = searchParams.get(key);
    if (val !== null) params.set(key, val);
  });

  const qs = params.toString();
  const url = `${getBackendUrl()}/auth/users${qs ? `?${qs}` : ""}`;

  let backendResponse: Response;
  try {
    backendResponse = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
  } catch (err) {
    console.error("[/api/auth/users] Backend unreachable:", err);
    return NextResponse.json({ detail: "Tidak dapat menghubungi server" }, { status: 503 });
  }

  const data = await backendResponse.json().catch(() => ([]));
  return NextResponse.json(data, { status: backendResponse.status });
}
