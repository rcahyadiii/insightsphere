export type ShellMode = "public" | "fullscreen" | "app";

export const PUBLIC_ROUTE_PREFIXES = ["/login", "/accept-invite"] as const;
export const FULLSCREEN_ROUTE_PREFIXES = ["/kasir"] as const;

function normalizePathname(pathname: string): string {
  const pathOnly = pathname.split(/[?#]/, 1)[0] || "/";
  const withLeadingSlash = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;
  return withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, "") : withLeadingSlash;
}

export function matchesRoutePrefix(pathname: string, prefix: string): boolean {
  const normalizedPathname = normalizePathname(pathname);
  const normalizedPrefix = normalizePathname(prefix);

  if (normalizedPrefix === "/") {
    return normalizedPathname === "/";
  }

  return normalizedPathname === normalizedPrefix || normalizedPathname.startsWith(`${normalizedPrefix}/`);
}

export function isLoginPath(pathname: string): boolean {
  return matchesRoutePrefix(pathname, "/login");
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_ROUTE_PREFIXES.some((prefix) => matchesRoutePrefix(pathname, prefix));
}

export function isFullscreenPath(pathname: string): boolean {
  return FULLSCREEN_ROUTE_PREFIXES.some((prefix) => matchesRoutePrefix(pathname, prefix));
}

export function getShellMode(pathname: string): ShellMode {
  if (isPublicPath(pathname)) return "public";
  if (isFullscreenPath(pathname)) return "fullscreen";
  return "app";
}

export function shouldHydrateAuth(pathname: string): boolean {
  return !isPublicPath(pathname);
}

export function shouldHandleUnauthorizedRedirect(pathname: string): boolean {
  return !isPublicPath(pathname);
}
