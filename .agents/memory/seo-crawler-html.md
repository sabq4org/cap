---
name: SEO crawler HTML (buildCrawlerHtml)
description: How كبسولة serves SEO/social crawlers and what must stay true for Google indexing.
---

# Crawler HTML for news pages

This is a React SPA — browsers get a JS bundle with no content. Googlebot/social
crawlers are detected by User-Agent and served server-rendered HTML by
`buildCrawlerHtml` in `server/routes.ts`. Four routes call it: `/api/share/news/:id`,
`/news/:id` (shortCode + non-shortCode branches), and `/n/:shortCode`.

## Rules that must hold (else indexing breaks)
- Crawler HTML MUST contain the **full article body**, not just title+summary. Thin
  content (title + one-line summary + image only) was the root cause of weak Google
  indexing — Google treats it as low-value and under-indexes.
- Emit `NewsArticle` JSON-LD (headline/description/image/datePublished/dateModified/
  author/publisher/articleBody/keywords/mainEntityOfPage/inLanguage). Escape `<` to
  `\u003c` in the JSON string so an article body containing `</script>` can't break out.
- Crawler responses for indexable pages (`/news/:id`, `/n/:shortCode`) MUST use
  `redirect:false` — no meta-refresh. A self-redirect wastes crawl budget and lowers
  crawler confidence. Only `/api/share/...` (not in robots.txt, human share fallback)
  uses redirect:true.

## Security constraint
`news.content` is admin- AND external-feed-authored HTML, embedded into crawler HTML.
Crawler detection is UA-based (spoofable), so this output reaches real browsers →
stored-XSS risk. Content MUST pass `sanitizeContentHtml` (server-side regex allowlist:
strips script/style/iframe/object/embed/form/svg etc., inline `on*=` handlers, and
`javascript:` URLs) before embedding. The client renders the same field with DOMPurify;
no jsdom on the server, so DOMPurify can't run server-side — hence the regex sanitizer.

## Known optional follow-up (not done)
`sitemap-news.xml` includes up to 5000 items including old content. Google News spec
wants only the recent window (~last 48h) with `<news:news>` tags; the full archive
belongs in the regular sitemaps. Splitting this could further help News indexing.
