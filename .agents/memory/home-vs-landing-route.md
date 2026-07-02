---
name: Home page route uses Landing.tsx not Home.tsx
description: Which component actually renders the "/" home page in this app (avoids editing the wrong file)
---

The public home page `/` renders `client/src/pages/Landing.tsx`, NOT `Home.tsx`.

**Why:** In `client/src/App.tsx` the routes are `<Route path="/" component={Landing} />` and `<Route path="/portal">{isAuthenticated ? <Home /> : <Login />}</Route>`. So `Home.tsx` is only the authenticated dashboard at `/portal`; `Landing.tsx` is the real homepage every visitor sees.

**How to apply:** Any request about "the home page" / "الصفحة الرئيسية" / capsulah.com root = edit `Landing.tsx`. Editing `Home.tsx` will appear to do nothing on the live site. Symptom of the mistake: "I published but the home page shows no change" while `/news` (News.tsx) changes do show — both share one SPA bundle, so a route-level mismatch (wrong file) is the cause, not caching.
