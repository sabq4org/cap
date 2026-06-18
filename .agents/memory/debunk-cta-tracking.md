---
name: Client-side analytics endpoints get blocked
description: Why first-party engagement tracking must avoid "/analytics" URLs and sendBeacon
---

# Client-side tracking endpoints must avoid blocklisted patterns

A production "clicks" counter (debunk CTA) stayed near zero even though the server
endpoint worked (a direct curl incremented it). Real browser clicks never reached
the server.

**Root cause:** the tracking call was `navigator.sendBeacon('/api/analytics/debunk-cta', ...)`.
Two independent failure modes stacked:
1. The URL contained the substring `analytics` — ad-blockers / privacy browsers
   (uBlock Origin, Brave, Safari content blockers) silently drop requests whose
   path matches common tracking patterns (`/analytics`, `/track`, `/collect`,
   `/beacon`, `/pixel`, `/telemetry`).
2. `sendBeacon` itself is restricted/dropped by Brave and Safari ITP in many cases.

**Fix that worked:** rename the endpoint to a neutral, app-domain path
(`POST /api/rumors/cta`, not `/api/analytics/*`) AND use
`fetch(url, { keepalive: true, credentials: 'include' })` fire-and-forget instead
of `sendBeacon`. Add a small per-IP in-memory throttle on the public increment route.

**Why:** first-party engagement metrics are indistinguishable from third-party
trackers to a blocklist when the URL looks like analytics. The endpoint name is the
signal, not who owns it.

**How to apply:** for ANY client-fired counter/metric/telemetry route, never put
`analytics|track|collect|beacon|pixel|telemetry|stat` in the public path; prefer a
normal-looking resource path. Prefer `fetch(keepalive)` over `sendBeacon`.

**FINAL OUTCOME (decisive):** even after renaming + `fetch(keepalive)`, the counter
still didn't move for the real user — prod logs showed ZERO debunk-related requests
from them. The fix was to make the metric SERVER-SIDE, but the CRITICAL lesson was
identifying WHAT the user actually considers "engagement." After two wrong guesses
(button clicks; then `/ask-capsule` listing-page opens), the user revealed they engage
with debunk content by opening individual **debunk topics** shared as `/n/<code>`
short links — these are `news` rows with `category='debunk'`, and opening one fires
`POST /api/news/:id/view`. So the counter now increments inside that view handler when
`category==='debunk'`, throttled per **IP+articleId** (3s) so different topics each
count but a quick refresh of the same topic doesn't. Old click POSTs are NO-OP; the
`GET /api/rumors/published` (listing page) does NOT count.

**Why server-side won:** a client click is only observable if the client fires an
observable request AND it isn't blocked AND the bundle is fresh — too many failure
points. Anchor the count to a data request the page can't render without.

**Why pinning down the exact user event mattered most:** the user kept saying "زائر"
(visitor) / "دخولي" (my entry) and testing by browsing the SITE, never the page I was
counting. Always confirm the literal URL/event the user performs (ask, or read prod
logs to see which endpoints their session actually hits) BEFORE choosing what to count.
`/n/<code>` → news view; debunk vs not is the `category` field.

**Also relevant:** SPA cache. Returning visitors run an old cached `index.html`
shell → old JS bundle → tracking changes don't take effect until one fresh shell
load. `index.html` is served with `Cache-Control: no-cache, no-store,
must-revalidate` (in serveStatic) so future deploys self-heal; hashed assets keep
long caching.
