---
name: UPSERT tables need a matching unique index
description: ON CONFLICT writes fail silently when the table lacks the matching unique index; how stats tables are wired here
---

# ON CONFLICT requires a matching unique index — and failures are invisible

Daily-aggregate stats tables (e.g. `view_referrer_stats`, `view_country_stats`, `ad_stats`) are written with `INSERT ... ON CONFLICT (col, date) DO UPDATE` UPSERTs in `server/storage.ts`. Postgres requires a **unique index/constraint exactly matching the ON CONFLICT column list**, otherwise every write throws `there is no unique or exclusion constraint matching the ON CONFLICT specification`.

**Why this bites hard here:** these record* calls are fire-and-forget — `storage.recordReferrerView(...).catch(() => {})`. A missing unique index makes EVERY runtime write throw and get swallowed, so the feature looks wired up but persists nothing. Seed scripts that `INSERT` directly still populate rows, so the table looks populated while live tracking silently records zero.

**How to apply:**
- Any new daily-stats / UPSERT table MUST declare its unique index in the Drizzle schema third-arg, e.g. `(table) => [ uniqueIndex("uq_x_source_date").on(table.source, table.date) ]`, then `npm run db:push` for dev. Prod gets it on Replit Publish.
- When a "tracking works but numbers stay empty" bug appears, first check the table actually has the unique index (`\d <table>`), not just that the route returns ok.
- Before adding a unique index that prod will apply on Publish, preflight prod (read-only) for duplicate rows on the index columns — duplicates make the index creation fail at publish time.

**Referrer classification gotcha (same file, view POST handler):** match referrers against the URL **hostname only**, never the full URL — short single-letter source aliases (e.g. the `x` → twitter alias) otherwise match stray path tokens like `/x`. Also do NOT put generic app names like `whatsapp` in the bot-UA filter: real in-app browsers carry "WhatsApp" in their UA and would be dropped as bots. The `/view` endpoint is JS-triggered, so true preview crawlers never reach it anyway.
