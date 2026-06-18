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
normal-looking resource path. Prefer `fetch(keepalive)` over `sendBeacon`. Count
clicks at the click, not via a page-load data fetch — React Query `staleTime:Infinity`
means repeat in-session page opens won't refetch, so page-load counting undercounts.

**Also relevant:** SPA cache. Returning visitors run an old cached `index.html`
shell → old JS bundle → tracking changes don't take effect until one fresh shell
load. `index.html` is served with `Cache-Control: no-cache, no-store,
must-revalidate` (in serveStatic) so future deploys self-heal; hashed assets keep
long caching.
