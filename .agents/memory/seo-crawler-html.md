---
name: SEO crawler HTML (buildCrawlerHtml)
description: How كبسولة serves SEO/social crawlers and what must stay true for Google indexing.
---

# Crawler HTML for news pages

This is a React SPA — browsers get a JS bundle with no content. Googlebot/social
crawlers are detected by User-Agent and served server-rendered HTML by
`buildCrawlerHtml` in `server/routes.ts`. Routes: `/api/share/news/:id`,
`/news/:id`, `/n/:shortCode`, `/articles/:slug`, plus listing HTML on `/` and `/news`.

Shared helpers live in `shared/seoSignals.ts` (displayTitle, meta description,
clampModifiedTime, age robots, dirty query detection).

## Rules that must hold (else indexing breaks)
- Crawler HTML MUST contain the **full article body**, not just title+summary.
- **One display title everywhere**: `seoTitle || title` in crawler HTML, Helmet,
  and `sitemap-news.xml` (`news:title` + `image:title`). Mismatch caused
  "indexed but not findable by original title" for FelRlGE.
- Emit rich `NewsArticle` JSON-LD (+ `BreadcrumbList`) with wordCount/speakable/
  NewsMediaOrganization. Escape `<` to `\u003c` in JSON.
- Indexable crawler responses use `redirect:false` (no meta-refresh).
- Withdrawn/deleted content → **410 Gone** for crawlers (not soft-404 SPA 200).
- Notify IndexNow + Google Indexing API with canonical `/n/{shortCode}` only
  (`server/services/indexingPing.ts`). Medical articles use `/articles/{slug}`.
- Private paths: `server/utils/noindexPaths.ts` + cache guard in `server/index.ts`.

## Security constraint
`news.content` is admin- AND external-feed-authored HTML. Must pass
`sanitizeContentHtml` before embedding in crawler HTML.

## Sitemaps
- `sitemap-news.xml`: last 48h only, max 1000, titles from `displayTitle`, TTL ~180s.
- `sitemap-general.xml`: all published with age-based priority/changefreq.
