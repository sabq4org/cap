---
name: News query performance pitfall
description: Why public news endpoints must filter in SQL, not in JS, and the event-loop saturation it caused
---

# Fetch-all-then-filter-in-JS saturates the event loop

Several `storage.ts` news methods historically fetched ALL published rows (including the
large `content` HTML column, no LIMIT) and then filtered in JavaScript. On a public
endpoint this is catastrophic: Node is single-threaded, so scanning large strings in JS
blocks the event loop, concurrent requests pile up, and response times balloon (observed
~15 minutes/request in production for `/api/news/keyword/:keyword`), which then cascades
into `/api/news` returning 500 timeouts.

**Rule:** Any public, frequently-hit news lookup MUST filter in SQL (`ILIKE` / WHERE) with a
`LIMIT` and use the `newsCache` (TtlCache) layer. Never `select()` all rows and `.filter()`
in JS on a hot path. The `news` table already has indexes on status/category/published_at.

**Why:** A single slow synchronous handler blocks every other request on the same process.

**How to apply:** When adding/editing news (or similar large-content) lookups in
`server/storage.ts`, push predicates into the Drizzle query and cap rows. Reserve
fetch-all-then-filter only for admin-only, low-traffic methods (e.g. `getAllNewsForAdmin`).

Related: a hidden UI block (`{false && ...}`) does NOT stop its `useQuery` from firing —
disable the query with `enabled: false` too, or it keeps hammering the slow endpoint.
