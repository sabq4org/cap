# Threat Model

## Project Overview

كبسولة is a production Express/React healthcare and health-news platform with PostgreSQL storage, session-based authentication, Replit OIDC login, local email/password login, admin content-management routes, AI-backed health/chat features, WhatsApp subscription workflows, and object storage uploads. The application handles user account data, health profile data, nutrition and tracker entries, chat history, admin credentials, subscriber phone numbers, and privileged publishing workflows.

Production assumptions for this scan:
- Only production-reachable code is in scope.
- `NODE_ENV` is `production` in deployed environments.
- Replit deployment terminates TLS for client/server traffic.
- Mockup sandbox and dev-only tooling are out of scope unless production reachability is shown.

## Assets

- **User accounts and sessions** — session cookies, Replit OIDC tokens, local-auth password hashes, and admin sessions. Compromise allows impersonation and access to user or admin capabilities.
- **Health and wellness data** — health profiles, tracker readings, nutrition entries, symptom-related chat content, and personalized interests. This is sensitive personal data and should not be exposed outside the owning user and authorized operators.
- **Admin capabilities** — publishing, moderation, trend/radar management, AI generation, WhatsApp broadcast management, account management, and destructive maintenance endpoints. Abuse here affects content integrity and platform operations.
- **WhatsApp subscriber data** — phone numbers, subscription state, interests, newsletter history, and automation settings. Compromise enables spam, unwanted opt-outs, and privacy issues.
- **Application secrets and internal service access** — session secret, database URL, OIDC credentials, WhatsApp tokens, and sidecar-backed object storage signing capability.
- **Object storage contents** — uploaded images or other files and any objects stored in the configured private bucket namespace.

## Trust Boundaries

- **Browser to Express API** — all request parameters, bodies, headers, and cookies arriving from the client are untrusted and must be validated.
- **Authenticated user to protected data** — endpoints serving health, nutrition, chat, and personalized content must be scoped to the current authenticated user on the server.
- **Public to admin boundary** — admin routes and workflows must require strong server-side authentication and authorization; frontend visibility is not a control.
- **Server to PostgreSQL** — the application has broad database privileges, so broken access control or injection at the route layer can expose or modify core data.
- **Server to external services** — OIDC, OpenAI, WhatsApp/Meta, RSS/news fetching, Google trends, and object-storage sidecar calls cross into third-party or privileged internal services.
- **Server to object storage** — upload URL issuance and object reads/writes cross into a privileged storage boundary and must enforce authentication and ACLs.
- **Public webhook to server** — inbound webhook handlers are internet-reachable and must verify origin/authenticity before mutating subscriber state.

## Scan Anchors

- **Production entry points:** `server/index.ts`, `server/routes.ts`, `server/replitAuth.ts`, `server/localAuth.ts`
- **Highest-risk areas:** admin login/session flows in `server/routes.ts`; object storage routes in `server/replit_integrations/object_storage/*`; user-data routes in `server/routes.ts`; AI/integration helpers in `server/openai.ts` and `server/whatsappService.ts`
- **Public surfaces:** news/articles/feed pages, auth endpoints, rumor submission routes, WhatsApp subscribe/unsubscribe/webhook routes, upload URL route if left public
- **Authenticated user surfaces:** health profile, trackers, nutrition, chat, capsule personalization
- **Admin surfaces:** `/api/admin/*`, radar routes, content publishing, WhatsApp admin routes, generation endpoints, account-management routes
- **Usually dev-only / lower priority unless proven reachable:** Vite/dev middleware, scripts, seed helpers not exposed by routes, build output under `dist/`

## Threat Categories

### Spoofing

This project relies on session-backed authentication for users and administrators, plus public webhook endpoints that receive events from third parties. The system must ensure that only legitimate users can establish sessions, only legitimate admins can obtain admin privileges, and only authentic webhook senders can trigger subscriber state changes. Admin bootstrap flows, hardcoded credentials, default secrets, or unverified webhook requests are especially dangerous here.

Required guarantees:
- All admin routes MUST require strong, server-side admin authentication.
- No production credential or bootstrap login path may rely on hardcoded secrets or default passwords.
- Public webhooks MUST verify the sender using the provider’s signing mechanism before mutating data.

### Tampering

Attackers can submit public input to subscription flows, rumor submission, upload endpoints, and any content-related or integration-facing routes. The application must ensure that untrusted callers cannot alter other users’ data, mutate subscription state for numbers they do not control, upload arbitrary files into privileged storage, or trigger destructive maintenance actions.

Required guarantees:
- Every state-changing route MUST authenticate the caller or otherwise prove authority for the affected resource.
- Upload flows MUST validate authorization, intended object ownership, and storage ACLs before granting write access.
- Admin-only maintenance actions MUST not be gated by reusable shared secrets in URLs.

### Information Disclosure

The application stores health-related personal data, chat history, phone numbers, and internal operational data. Unauthorized disclosure could happen through broken object access control, overly broad API responses, verbose errors, or logging of sensitive response payloads.

Required guarantees:
- User data endpoints MUST only return records belonging to the authenticated user.
- Private object-storage paths MUST not be readable without an authorization check.
- Logs and error responses MUST avoid exposing sensitive user data, credentials, or internal secrets.

### Denial of Service

Public endpoints can be abused to create cost or availability pressure, especially login routes, upload URL issuance, AI-triggering routes, and messaging/subscription flows. Even when confidentiality is intact, unauthenticated high-volume use can create billing or operational risk.

Required guarantees:
- Internet-facing authentication, upload, and messaging routes SHOULD have appropriate rate limits or equivalent abuse controls.
- Public routes that trigger expensive or resource-backed operations MUST enforce bounded input sizes and anti-abuse protections.

### Elevation of Privilege

This project has a meaningful privilege gap between public visitors, authenticated users, editors/admins, and super admins. The most severe failures here would let a public attacker become an admin, obtain destructive content-management powers, or gain access to privileged storage or subscriber-management operations.

Required guarantees:
- Role checks MUST be enforced server-side on every admin and super-admin action.
- Session state alone MUST not be forgeable into admin access through weak bootstrap logic.
- Private storage, account management, and privileged integrations MUST enforce least privilege and resource ownership checks.
