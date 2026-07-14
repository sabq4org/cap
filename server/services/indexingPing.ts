/**
 * Fast-indexing helpers for Google/Bing.
 * - IndexNow (Bing/Yandex/others) when INDEXNOW_KEY is set
 * - Google sitemap ping for the news sitemap
 *
 * Never throws to callers — failures are logged only.
 */

export type IndexableNews = {
  id: string;
  shortCode?: string | null;
  status?: string | null;
};

function siteBaseUrl(): string {
  return (process.env.BASE_URL || "https://capsulah.net").trim().replace(/\/$/, "");
}

export function newsPublicUrl(item: IndexableNews): string {
  const base = siteBaseUrl();
  return item.shortCode ? `${base}/n/${item.shortCode}` : `${base}/news/${item.id}`;
}

async function pingGoogleSitemap(): Promise<void> {
  const sitemapUrl = `${siteBaseUrl()}/sitemap-news.xml`;
  const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
  const res = await fetch(pingUrl, {
    method: "GET",
    headers: { "User-Agent": "CapsulahIndexingBot/1.0" },
  });
  if (!res.ok) {
    console.warn(`[Indexing] Google sitemap ping HTTP ${res.status}`);
  }
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
  });

  // 200/202 accepted; 404 usually means key file not reachable yet
  if (!res.ok && res.status !== 202) {
    const body = await res.text().catch(() => "");
    console.warn(`[Indexing] IndexNow HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
}

/** Fire-and-forget indexing signals after publish/update. */
export function notifySearchEnginesOfNews(items: IndexableNews | IndexableNews[]): void {
  const list = (Array.isArray(items) ? items : [items]).filter(
    (n) => n && n.status === "published",
  );
  if (list.length === 0) return;

  const urls = list.map(newsPublicUrl);

  void (async () => {
    try {
      await Promise.allSettled([pingGoogleSitemap(), pingIndexNow(urls)]);
      console.log(`[Indexing] notified engines for ${urls.length} URL(s)`);
    } catch (err) {
      console.warn("[Indexing] notify failed:", err);
    }
  })();
}
