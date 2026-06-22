import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie, getAuthCookie, getBackendUrl } from "@/app/lib/auth-cookie";

function buildForwardHeaders(request: NextRequest | null, token: string, hasBody: boolean) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }
  if (request) {
    const userAgent = request.headers.get("user-agent");
    if (userAgent) {
      headers["User-Agent"] = userAgent;
    }
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
      headers["X-Forwarded-For"] = forwardedFor;
    } else {
      const remote = request.headers.get("x-real-ip");
      if (remote) {
        headers["X-Forwarded-For"] = remote;
      }
    }
  }
  return headers;
}

async function forwardMirror(
  method: "GET" | "POST" | "DELETE",
  request: NextRequest | null,
  body?: unknown
) {
  const token = await getAuthCookie();
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${getBackendUrl()}/auth/mirror`, {
      method,
      headers: buildForwardHeaders(request, token, body !== undefined),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
    });
  } catch (err) {
    console.error(`[/api/auth/mirror ${method}] Backend unreachable:`, err);
    return NextResponse.json(
      { detail: "Tidak dapat menghubungi server" },
      { status: 503 }
    );
  }

  if (backendResponse.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const data = await backendResponse.json().catch(() => ({}));
  const response = NextResponse.json(data, { status: backendResponse.status });
  if (backendResponse.status === 401) {
    clearAuthCookie(response);
  }
  return response;
}

export async function GET(request: NextRequest) {
  return forwardMirror("GET", request);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }
  return forwardMirror("POST", request, body);
}

export async function DELETE(request: NextRequest) {
  return forwardMirror("DELETE", request);
}