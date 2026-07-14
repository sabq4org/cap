const DEFAULT_CANONICAL_ORIGIN = "https://capsulah.com";

/**
 * One authoritative public origin for canonicals, sitemaps, social metadata,
 * and indexing notifications. Never derive SEO URLs from an untrusted Host
 * header because alternate domains would then canonicalize to themselves.
 */
export function getCanonicalOrigin(): string {
  const configured = (process.env.BASE_URL || DEFAULT_CANONICAL_ORIGIN).trim();

  try {
    const parsed = new URL(configured);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return DEFAULT_CANONICAL_ORIGIN;
    }
    return `${parsed.protocol}//${parsed.host}`.replace(/\/$/, "");
  } catch {
    return DEFAULT_CANONICAL_ORIGIN;
  }
}

export function getCanonicalHostname(): string {
  return new URL(getCanonicalOrigin()).hostname.toLowerCase();
}

/** Hosts owned by Capsulah that should always collapse to the canonical host. */
export function isCapsulahAliasHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return new Set([
    "capsulah.com",
    "www.capsulah.com",
    "capsulah.net",
    "www.capsulah.net",
  ]).has(host);
}
