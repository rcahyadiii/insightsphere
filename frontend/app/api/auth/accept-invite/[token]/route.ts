import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/app/lib/auth-cookie";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${getBackendUrl()}/auth/accept-invite/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ detail: "Tidak dapat menghubungi server." }, { status: 503 });
  }

  const data = await backendResponse.json().catch(() => ({}));
  return NextResponse.json(data, { status: backendResponse.status });
}
