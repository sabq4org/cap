/**
 * Indexing discovery helpers.
 * - IndexNow (Bing/Yandex/others) when INDEXNOW_KEY is set
 * - Google discovers the sitemap through robots.txt/Search Console; its old
 *   unauthenticated sitemap ping endpoint was retired and now returns 404.
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

function siteBaseUrl(): string {
  return getCanonicalOrigin();
}

export function newsPublicUrl(item: IndexableNews): string {
  const base = siteBaseUrl();
  return item.shortCode ? `${base}/n/${item.shortCode}` : `${base}/news/${item.id}`;
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
  const now = Date.now();
  const list = (Array.isArray(items) ? items : [items]).filter(
    (n) => n
      && n.status === "published"
      && (!n.publishedAt || new Date(n.publishedAt).getTime() <= now),
  );
  if (list.length === 0) return;

  const urls = list.map(newsPublicUrl);

  void (async () => {
    try {
      await pingIndexNow(urls);
      console.log(`[Indexing] submitted ${urls.length} URL(s) to IndexNow`);
    } catch (err) {
      console.warn("[Indexing] notify failed:", err);
    }
  })();
}
