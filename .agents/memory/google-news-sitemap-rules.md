---
name: Google News sitemap rules
description: News sitemap must only contain last-48h items (max 1000) or Google ignores it entirely
---

# Google News sitemap rules

A sitemap with `<news:news>` tags must contain ONLY articles published in the last 48 hours, capped at 1000 URLs. Older items carrying news tags cause Google to ignore/deprioritize the whole file — new articles then stop getting indexed quickly.

**Why:** The site's news sitemap once contained all ~11k published items (some from 2002/2024) with news tags; Google ignored it and fresh news was not indexed.

**How to apply:**
- `sitemap-news.xml` = last-48h items only, with news tags. If none exist, fall back to a few latest items WITHOUT `<news:news>` tags (never empty, never old items with news tags).
- All older/long-tail news belong in a plain urlset (`sitemap-general.xml`), referenced from the `sitemap.xml` index.
- Both endpoints reuse the cached `getNewsForSitemap()` result (sorted newest-first), so filtering is a cheap in-memory slice — no extra DB query.
- **Title sync:** `news:title` and `image:title` MUST use `displayTitle(seoTitle, title)` — same as crawler HTML / Helmet — or Search Console shows one title while users search another.
- CDN TTL for news sitemap ≈ 180s; general sitemap uses age-based `priority`/`changefreq`.
