import { NextRequest, NextResponse } from "next/server";
import { getAuthCookie, getBackendUrl } from "@/app/lib/auth-cookie";

export async function POST(request: NextRequest) {
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
    backendResponse = await fetch(`${getBackendUrl()}/auth/invite-user`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (err) {
    console.error("[/api/auth/invite-user] Backend unreachable:", err);
    return NextResponse.json({ detail: "Tidak dapat menghubungi server" }, { status: 503 });
  }

  const data = await backendResponse.json().catch(() => ({}));
  return NextResponse.json(data, { status: backendResponse.status });
}
