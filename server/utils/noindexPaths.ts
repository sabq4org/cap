/**
 * Central list of SPA paths that must never be indexed and must never be
 * cached on shared/CDN edges (private, no-store).
 *
 * Keep in sync with authenticated/admin UI routes in client/src/App.tsx.
 */

export const NOINDEX_EXACT: ReadonlySet<string> = new Set<string>([
  "/login",
  "/register",
  "/logout",
  "/forgot-password",
  "/reset-password",
  "/profile",
  "/portal",
  "/assistant",
  "/ask",
  "/nutrition",
  "/capsule",
  "/settings",
  "/notification-settings",
  "/search",
  "/authors/register",
]);

export const NOINDEX_PREFIXES: readonly string[] = [
  "/admin",
  "/dashboard",
  "/mataws",
  "/onboarding",
  "/ask-capsule/status",
];

export function isNoindexPath(pathname: string): boolean {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  if (NOINDEX_EXACT.has(normalized)) return true;
  for (const prefix of NOINDEX_PREFIXES) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      return true;
    }
  }
  return false;
}
