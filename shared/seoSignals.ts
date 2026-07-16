/**
 * Shared SEO signal helpers for Capsulah (server crawler HTML + client Helmet).
 * Principles mirror Sabq's handoff: one display title, word-boundary descriptions,
 * age-based robots, and clamped modified times.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export function displayTitle(seoTitle?: string | null, title?: string | null): string {
  const seo = (seoTitle || "").trim();
  if (seo) return seo;
  return (title || "").trim();
}

/**
 * Build a readable, Unicode-safe URL segment from an Arabic or Latin title.
 * The stable shortCode remains in the URL, so editorial title changes can be
 * redirected safely without losing the article identity.
 */
export function seoTitleSlug(value?: string | null, maxLength = 80): string {
  const normalized = (value || "")
    .normalize("NFKC")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .toLocaleLowerCase("ar")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  const chars = Array.from(normalized);
  if (chars.length <= maxLength) return normalized;
  return chars.slice(0, maxLength).join("").replace(/-+$/g, "");
}

export type NewsCanonicalLink = {
  id: string;
  shortCode?: string | null;
  title?: string | null;
  seoTitle?: string | null;
};

/** Canonical news path: stable code + readable SEO-title segment. */
export function newsCanonicalPath(item: NewsCanonicalLink): string {
  if (!item.shortCode) return `/news/${item.id}`;
  const slug = seoTitleSlug(displayTitle(item.seoTitle, item.title));
  return slug ? `/n/${item.shortCode}/${slug}` : `/n/${item.shortCode}`;
}

/** Truncate at a word boundary (default 220 chars) and append ellipsis when cut. */
export function truncateMetaDescription(raw: string, maxLen = 220): string {
  const text = (raw || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (text.length <= maxLen) return text;
  const slice = text.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > Math.floor(maxLen * 0.6) ? slice.slice(0, lastSpace) : slice;
  return `${cut.replace(/[.,;:\u060C\u061B\s]+$/g, "")}...`;
}

export function buildMetaDescription(opts: {
  seoDescription?: string | null;
  summary?: string | null;
  contentPlain?: string | null;
  title?: string | null;
  fallbackSuffix?: string;
}): string {
  const fromSeo = (opts.seoDescription || "").trim();
  if (fromSeo) return truncateMetaDescription(fromSeo);
  const fromSummary = (opts.summary || "").trim();
  if (fromSummary) return truncateMetaDescription(fromSummary);
  const fromBody = (opts.contentPlain || "").trim();
  if (fromBody) return truncateMetaDescription(fromBody);
  const title = (opts.title || "").trim();
  const suffix = opts.fallbackSuffix || "اقرأ المزيد على كبسولة";
  return truncateMetaDescription(title ? `${title} - ${suffix}` : suffix);
}

/**
 * If the article is older than 30 days and was edited more than 7 days after
 * publish, Google News treats a late modified_time as fake freshness — clamp
 * modified back to published.
 */
export function clampModifiedTime(
  publishedAt?: Date | string | null,
  updatedAt?: Date | string | null,
): string | undefined {
  const publishedIso = publishedAt ? new Date(publishedAt).toISOString() : undefined;
  if (!publishedIso) {
    return updatedAt ? new Date(updatedAt).toISOString() : undefined;
  }
  if (!updatedAt) return publishedIso;

  const pubMs = new Date(publishedAt!).getTime();
  const updMs = new Date(updatedAt).getTime();
  if (!Number.isFinite(pubMs) || !Number.isFinite(updMs)) return publishedIso;

  const ageMs = Date.now() - pubMs;
  if (ageMs > 30 * DAY_MS && updMs - pubMs > 7 * DAY_MS) {
    return publishedIso;
  }
  return new Date(Math.max(updMs, pubMs)).toISOString();
}

export function computeContentRobots(
  publishedAt?: Date | string | null,
  status?: string | null,
): { robots: string; googlebotNews?: string } {
  const base = "index, follow, max-image-preview:large";
  if (status && status !== "published" && status !== "scheduled") {
    return { robots: "noindex, follow" };
  }
  if (!publishedAt) return { robots: base };

  const ageMs = Date.now() - new Date(publishedAt).getTime();
  if (ageMs >= 365 * DAY_MS) {
    return {
      robots:
        "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1, noarchive",
      googlebotNews: "noindex",
    };
  }
  if (ageMs >= 30 * DAY_MS) {
    return { robots: base, googlebotNews: "noindex" };
  }
  return { robots: base };
}

/** Tracking / deep pagination / sort params that must not create indexed variants. */
export function hasDirtySeoQuery(query: Record<string, unknown> | undefined | null): boolean {
  if (!query) return false;
  const dirtyKeys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "fbclid",
    "gclid",
    "msclkid",
    "mc_cid",
    "mc_eid",
    "sort",
    "order",
    "filter",
  ];
  for (const key of dirtyKeys) {
    if (query[key] != null && String(query[key]).length > 0) return true;
  }
  const pageRaw = query.page;
  if (pageRaw != null) {
    const page = Number(Array.isArray(pageRaw) ? pageRaw[0] : pageRaw);
    if (Number.isFinite(page) && page > 5) return true;
  }
  return false;
}

export function sitemapPriorityForAge(publishedAt?: Date | string | null): {
  priority: string;
  changefreq: string;
} {
  if (!publishedAt) return { priority: "0.3", changefreq: "yearly" };
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  if (ageMs < 7 * DAY_MS) return { priority: "0.9", changefreq: "hourly" };
  if (ageMs < 30 * DAY_MS) return { priority: "0.7", changefreq: "daily" };
  return { priority: "0.3", changefreq: "yearly" };
}

export function wordCountFromPlain(plain: string): number {
  const parts = plain.trim().split(/\s+/).filter(Boolean);
  return parts.length;
}
