---
name: News view-count policy
description: Intentional 2x view counting with no dedup — do not "fix" it back to 1x/deduped.
---

# News view counting is intentionally inflated

Each news view counts as **+2** (both `viewCount` and daily `todayViews`), and **every** open/refresh/repeat click from the same person counts again. There is deliberately **no** dedup.

**Why:** Product owner explicitly requested it ("مشاهدتين" per view, repeated clicks each add 2). This intentionally reverses earlier "Fix double view count" / "Fix duplicate view count increment" work.

**How to apply:** Do not reintroduce a view-count dedup/throttle when you see repeated counting. Three layers were removed/changed and must stay this way unless the owner asks:
- `incrementViewCount` uses `+2` (not `+1`); daily reset seeds `todayViews:2`.
- The `POST /api/news/:id/view` server 30s per-IP+article throttle (`viewThrottle`) was removed.
- `NewsDetail.tsx` client `sessionStorage` guard was removed; only `viewedRef` remains (prevents double-fire within one mount / dev StrictMode — keep it).
- Country/referrer/debunk stats still record per request (debunk keeps its own 3s `ctaThrottle`); they are NOT numerically doubled.
