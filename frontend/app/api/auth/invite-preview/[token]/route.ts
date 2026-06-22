import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/app/lib/auth-cookie";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${getBackendUrl()}/auth/invite-preview/${token}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "Tidak dapat menghubungi server." }, { status: 503 });
  }

  const data = await backendResponse.json().catch(() => ({}));
  return NextResponse.json(data, { status: backendResponse.status });
}
