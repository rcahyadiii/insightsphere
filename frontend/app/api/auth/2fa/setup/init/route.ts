import { NextResponse } from "next/server";
import { getAuthCookie, getBackendUrl } from "@/app/lib/auth-cookie";

export async function POST() {
  const token = await getAuthCookie();
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${getBackendUrl()}/auth/2fa/setup/init`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
  } catch (err) {
    console.error("[/api/auth/2fa/setup/init] Backend unreachable:", err);
    return NextResponse.json({ detail: "Tidak dapat menghubungi server" }, { status: 503 });
  }

  const data = await backendResponse.json().catch(() => ({}));
  return NextResponse.json(data, { status: backendResponse.status });
}
