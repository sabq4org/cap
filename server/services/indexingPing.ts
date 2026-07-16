/**
 * Indexing discovery helpers.
 * - IndexNow (Bing/Yandex/others) when INDEXNOW_KEY is set
 * - Google Indexing API when GOOGLE_INDEXING_* credentials are set
 *
 * Always submit the canonical public URL (/n/{shortCode} for news,
 * /articles/{slug} for medical articles). Never submit a URL that 301s.
 *
 * Never throws to callers — failures are logged only.
 */

import { getCanonicalOrigin } from "../seo";

export type IndexableNews = {
  id: string;
  shortCode?: string | null;
  status?: string | null;
  publishedAt?: Date | string | null;
};

export type IndexableArticle = {
  id: string;
  slug: string;
  status?: string | null;
  publishedAt?: Date | string | null;
};

function siteBaseUrl(): string {
  return getCanonicalOrigin();
}

/** Canonical news URL — prefers /n/{shortCode}; falls back only when missing. */
export function newsPublicUrl(item: IndexableNews): string {
  const base = siteBaseUrl();
  if (item.shortCode) return `${base}/n/${item.shortCode}`;
  // Fallback: still notify, but prefer ensuring shortCode exists at publish time.
  return `${base}/news/${item.id}`;
}

export function articlePublicUrl(item: IndexableArticle): string {
  return `${siteBaseUrl()}/articles/${encodeURIComponent(item.slug)}`;
}

async function pingIndexNow(urls: string[]): Promise<void> {
  const key = (process.env.INDEXNOW_KEY || "").trim();
  if (!key || urls.length === 0) return;

  const host = new URL(siteBaseUrl()).host;
  const keyLocation = `${siteBaseUrl()}/${key}.txt`;
  const endpoint = "https://api.indexnow.org/indexnow";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key,
      keyLocation,
      urlList: urls.slice(0, 100),
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok && res.status !== 202) {
    const body = await res.text().catch(() => "");
    console.warn(`[Indexing] IndexNow HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
}

async function pingGoogle(urls: string[]): Promise<void> {
  try {
    const { notifyUrlUpdated, isGoogleIndexingConfigured } = await import(
      "./googleIndexingService"
    );
    if (!isGoogleIndexingConfigured()) return;
    for (const url of urls) {
      await notifyUrlUpdated(url).catch((err) => {
        console.warn(
          `[Indexing] Google Indexing failed for ${url}:`,
          err instanceof Error ? err.message : err,
        );
      });
    }
  } catch (err) {
    console.warn("[Indexing] Google Indexing service load failed:", err);
  }
}

function isLivePublished(item: {
  status?: string | null;
  publishedAt?: Date | string | null;
}): boolean {
  const now = Date.now();
  if (item.status !== "published") return false;
  if (!item.publishedAt) return true;
  return new Date(item.publishedAt).getTime() <= now;
}

/** Fire-and-forget indexing signals after news publish/update. */
export function notifySearchEnginesOfNews(
  items: IndexableNews | IndexableNews[],
): void {
  const list = (Array.isArray(items) ? items : [items]).filter(
    (n) => n && isLivePublished(n),
  );
  if (list.length === 0) return;

  // Prefer shortCode URLs only; skip items without shortCode to avoid
  // notifying a /news/:uuid that will 301 for crawlers with shortCode.
  const urls = list
    .map((n) => (n.shortCode ? newsPublicUrl(n) : null))
    .filter((u): u is string => !!u);

  if (urls.length === 0) {
    console.warn(
      "[Indexing] skipped news notify — no shortCode on published items",
    );
    return;
  }

  void (async () => {
    try {
      await Promise.all([pingIndexNow(urls), pingGoogle(urls)]);
      console.log(`[Indexing] submitted ${urls.length} news URL(s)`);
    } catch (err) {
      console.warn("[Indexing] news notify failed:", err);
    }
  })();
}

/** Fire-and-forget indexing for medical articles (/articles/:slug). */
export function notifySearchEnginesOfArticle(
  items: IndexableArticle | IndexableArticle[],
): void {
  const list = (Array.isArray(items) ? items : [items]).filter(
    (a) => a && a.slug && isLivePublished(a),
  );
  if (list.length === 0) return;

  const urls = list.map(articlePublicUrl);

  void (async () => {
    try {
      await Promise.all([pingIndexNow(urls), pingGoogle(urls)]);
      console.log(`[Indexing] submitted ${urls.length} article URL(s)`);
    } catch (err) {
      console.warn("[Indexing] article notify failed:", err);
    }
  })();
}
