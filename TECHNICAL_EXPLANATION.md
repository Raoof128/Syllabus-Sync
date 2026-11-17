# Technical Architecture & Engineering Decisions

**Checked against the code on 17 November 2026.** An earlier version of this document described a Vercel deployment and a proxy that authenticated every API request through an `isPublicApiPath()` allowlist. Neither is how the code works now, and sections 1, 2, 3.1, 3.4, 5 and 7 were rewritten to match it. For the runtime in detail, see the [architecture guide](./docs/architecture/ARCHITECTURE.md).

**System:** Syllabus Sync, a student planning application
**Author:** Raouf

---

## Overview

Syllabus Sync is built on Next.js 16 and Supabase (PostgreSQL), and is deployed as a Cloudflare Worker through OpenNext. This document records why some of the larger technical choices were made and what they cost.

---

## 1. Request Pipeline

### 1.1 What the proxy does

Page and API requests pass through one function, `lib/proxy.ts`, before they reach a route (static assets are served directly and get their headers from `public/_headers`). The proxy:

- generates a per-request nonce and sets the Content Security Policy and the other security headers (HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`), so no rendered response can omit them;
- rejects state-changing requests whose `Origin` or `Referer` does not match the site or a trusted origin;
- for page navigations, looks up the session and redirects signed-out users to the login page, unverified users to `/verify`, and users who still owe a second factor to the MFA step.

### 1.2 What the proxy does not do

The proxy is not an authentication gate for API routes. An earlier design resolved the session at the proxy for every `/api/*` request; it was removed because a page that fired many API calls in parallel had each one present the same refresh token at the proxy, Supabase rate-limited all but one, and signed-in users were bounced to the login page. Each API route now authenticates for itself, most of them through `requireAuth` or `requireAuthWithRateLimit` in `app/api/_lib/middleware.ts`.

The cost of this choice is the one the original design set out to avoid: a new route is only protected if its author adds the check. `tests/security/api-auth-coverage.test.ts` is an inventory test that fails when a route file has no recognised authentication call and is not on its public allowlist.

### 1.3 Deadlines on upstream calls

A slow Supabase response must not hang the Worker.

**Fetch wrapper (`lib/supabase/fetch.ts`).** Supabase calls use `fetchWithTimeout`, which enforces a 15-second deadline (20 seconds in development) by combining the caller's `AbortSignal` with a timeout signal.

**Session lookup deadline.** The proxy gives the session lookup for a page 6 seconds (`PROXY_AUTH_DEADLINE_MS`). If Supabase has not answered, the request proceeds as signed-out, so the user sees a login redirect and not a blank screen.

**Assurance-level deadline.** The second-factor lookup is given 2.5 seconds in production (`MFA_AAL_DEADLINE_MS`).

---

## 2. Distributed Rate Limiting

### 2.1 The Problem: In-Memory State in Serverless

Traditional rate limiting libraries (e.g., `express-rate-limit`) store counters in process memory. On a serverless platform each request may run in a different isolate with its own memory, so an in-memory counter does not limit anything.

### 2.2 The Decision: Tiered Storage with Fail-Closed Semantics

The rate limiting service (`lib/services/rateLimitService.ts`) implements a pluggable storage backend with a strict priority chain:

1. **Upstash Redis** -- REST API, no persistent connections.
2. **A store with the same REST protocol** (the `KV_REST_API_*` variables).
3. **Supabase PostgreSQL** -- a `ratelimit_increment` function called over RPC.
4. **In-memory** -- development only.

The limiter is a fixed-window counter per key.

**The fail-closed design.** Security-critical endpoints (login, signup, password reset, passkey authentication) are configured with `failClosed: true`. If the rate limit store is unreachable or misconfigured in production, these endpoints reject requests instead of allowing unlimited attempts, so a store outage does not become a brute-force window.

Non-critical endpoints (general API reads, bulk operations) use `failClosed: false`, prioritizing availability over strict enforcement. This is an explicit trade-off documented in the configuration.

**Why in the application?** Limits in the application can be tuned per endpoint (5 signups per hour, 10 login attempts per 15 minutes, 10 password resets per hour, 200 general API calls per minute) and are reviewed alongside the code. The full table is in the [security posture document](./docs/security/SECURITY_POSTURE.md).

---

## 3. Database-Level Security & Atomicity

### 3.1 Row-Level Security as the Final Authority

Application-layer authorization is necessary but insufficient. A single missing `WHERE user_id = ?` clause in a query creates an Insecure Direct Object Reference (IDOR) vulnerability. In a codebase with dozens of data access patterns, this is difficult to prevent through code review alone.

**Decision:** Each of the 27 tables the migrations create has Row-Level Security enabled. User-owned tables have policies that require `auth.uid()` to match the row owner; internal tables (verification and reset tokens, rate-limit counters) have no policy for application roles at all. A flawed query in a route that uses the caller's own session is therefore still confined to the caller's rows.

The limit of this control: routes that use the service-role client bypass RLS, and so do `SECURITY DEFINER` functions, so those need their own checks. Several findings in the audit records under `docs/` were of exactly that kind.

### 3.2 Signup Atomicity via PostgreSQL Triggers

**The problem.** User signup requires two operations: creating an Auth record (in `auth.users`) and creating a profile row (in `public.profiles`). The original implementation performed these as sequential API calls in the signup route handler. If the profile insertion failed (network error, constraint violation, timeout), the system produced an Auth user with no profile, which broke queries that join on the profile.

**The fix.** A PostgreSQL trigger (`on_auth_user_created`) fires when a row is inserted into `auth.users` and creates the `public.profiles` row in the same transaction, so either both records exist or neither does. The signup route still upserts the profile afterwards to fill in the remaining fields.

### 3.3 Securing the Gamification RPC Layer

The platform includes XP and streak mechanics. Client-controlled XP awards are inherently vulnerable to tampering -- a modified client could award arbitrary XP to any user.

**Decision:** XP mutations are delegated to a PostgreSQL RPC function (`award_xp`) defined as `SECURITY DEFINER SET search_path = public`. The function:

- Rejects a call unless `auth.uid()` matches the target `user_id` (the service role is exempt).
- Has execution revoked from the `anon` role.
- Awards a given (user, event type, reference) only once.
- Runs in a single transaction, so XP and streak cannot be half-updated.

The XP amounts come from a server-side table, not from the request.

### 3.4 Audit Logging

Security-relevant events are recorded through the `log_audit` function into the `audit_logs` table, with the actor, action, old/new data payloads, IP address and user agent. Application roles can only add rows. The log is not tamper-evident: there is no hash chain, the service role can modify rows, and a retention function deletes old ones.

**PII handling trade-off.** The `old_data`/`new_data` JSON payloads are sanitized via `sanitizeForAudit` to strip passwords and API keys. IP addresses and user agents are stored in plaintext (`inet` and `text`) to support incident response. Forensic use was put ahead of minimising stored personal data. (An IP anomaly detection module exists in `lib/security/` but nothing calls it.)

---

## 4. Optimistic UI & Concurrency Control

### 4.1 The Problem: The Disappearing Notification

Optimistic UI creates a specific race condition that is easy to overlook:

1. User creates a reminder. The client immediately renders it with a temporary ID (`temp-abc123`).
2. The client sends a POST to the server.
3. Concurrently, a browser focus event triggers a background GET to `/api/notifications` to refresh the list.
4. The GET response returns _before_ the POST is processed. The standard pattern -- "replace local state with server state" -- overwrites the notification list, and the just-created reminder vanishes from the UI.

The user sees their reminder appear, then disappear, then reappear seconds later when the POST completes. This is disorienting and erodes trust in the application.

### 4.2 The Decision: Additive Merge with Protected IDs

The notification store (`lib/store/notificationsStore.ts`) implements a custom merge strategy instead of the naive "replace" pattern:

**Concurrency guard (`_loadInFlight`).** A boolean flag prevents overlapping `loadNotifications` calls. When the `addNotification` function fires a POST, it sets `_loadInFlight = true`, blocking any concurrent background refresh from executing until the POST completes. A 30-second timeout acts as a safety valve against hung fetches.

**Protected ID map (`_protectedIds`).** When a notification is optimistically added, its temporary ID is registered in a `Map<string, number>` with a timestamp. During the merge phase of any subsequent server sync, notifications whose IDs appear in this map are preserved rather than overwritten. When the server confirms the creation, protection transfers from the temporary ID to the server-assigned ID.

**Additive merge logic.** The sync function iterates the server response and:

- Updates existing notifications with server data (picking up read status changes, etc.).
- Adds notifications that exist on the server but not locally.
- Preserves locally-created notifications that the server has not yet acknowledged.

Protection entries expire after 2 minutes, ensuring that genuinely deleted notifications are eventually cleaned up.

**Why not a simple queue?** A request queue would serialize all operations, eliminating the race condition but also eliminating the performance benefit of parallel fetches. The additive merge preserves concurrency while preventing data loss -- the right trade-off for a notification system where eventual consistency is acceptable but UI flicker is not.

---

## 5. Authentication: WebAuthn Passkeys

**Decision:** The platform supports passkeys through WebAuthn, alongside passwords with optional TOTP or SMS second factors.

**Two implementations.** The current routes under `app/api/webauthn/` store credentials in a `webauthn_credentials` table and issue single-use challenges that expire after five minutes. An older set under `app/api/auth/passkey/` keeps credential data in the user's `user_metadata` and restricts registration to platform authenticators (`authenticatorAttachment: 'platform'`). Both are still in the code; consolidating them is open work.

**Origin binding.** In production the relying-party ID and expected origin come from `WEBAUTHN_RP_ID` and `WEBAUTHN_ORIGIN`. The code refuses to derive them from request headers, because a caller-supplied `Host` or `Origin` would let an attacker's page choose what the assertion is checked against.

**Cross-site requests.** The proxy applies an origin check to state-changing requests. It is not a double-submit token check: a `__Host-csrf` cookie is issued and token validation exists in `lib/security/csrf.ts`, but only the gamification routes call it.

---

## 6. Campus Navigation: Heading Fusion Algorithm

### 6.1 The Problem

Standard HTML5 Geolocation provides unreliable heading data when a user is walking slowly or stationary -- precisely the common case for students navigating between buildings on a compact campus.

### 6.2 The Decision: Multi-Source Heading Fusion

The `useMapLocation` hook fuses three heading sources with a priority cascade:

1. **GPS heading** -- used only when velocity exceeds a threshold, where GPS heading data is reliable.
2. **Movement-derived heading** -- computed by smoothing the vector between the last N coordinate samples. Effective at walking speed but noisy when stationary.
3. **Compass fallback (DeviceOrientation API)** -- used when the user is stationary, providing a stable heading from the device magnetometer.

**Outlier rejection.** GPS samples with large coordinate jumps (exceeding a distance threshold relative to the previous sample) or low accuracy scores are discarded. This prevents the map marker from jumping across buildings when the device briefly triangulates to a distant cell tower.

**Server-side API proxies.** Google Maps API calls (Routes, Places search, Places details) are proxied through server-side API routes (`/api/maps/*`) rather than called directly from the client. This keeps the API key server-side, enables per-route rate limiting via `apiLimiter`, and allows origin validation via `isTrustedOrigin`.

---

## 7. Development Operations & Quality Gates

**Local gate.** `npm run check` runs the secrets scan, the Prettier check, the TypeScript check, ESLint, the Vitest suite (1,399 tests in 167 files on 17 November 2026) and a production build.

**CI.** `.github/workflows/ci-cd.yml` runs on every pull request: `npm audit` on production dependencies, the secrets scan, the translation check, a documentation link check, format, lint, types and tests, a database built from the migrations alone, the Next.js and Cloudflare build, and Playwright end-to-end tests. It does not deploy.

**Secret scanning.** `tools/security/check-secrets.mjs` scans tracked files for patterns that look like API keys and tokens. It runs in CI and as part of `npm run check`.

**Observability.** Sentry configuration files exist for the client, server and edge runtimes (`config/sentry/`). Request bodies and sensitive headers are removed before an event is sent (`lib/observability/sentry-scrub.ts`).

**Deployment.** Production runs on Cloudflare Workers. Deployment is a manual step run by an authorized maintainer; see the [deployment checklist](./docs/operations/deployment-checklist.md).

---

## Related Documents

- [Architecture Overview](./docs/architecture/ARCHITECTURE.md) -- Component-level system design and data flow.
- [Security Posture](./docs/security/SECURITY_POSTURE.md) -- Controls in force, modules that exist but are not in force, and known limitations.
- [Route Inventory](./docs/inventory/ROUTE_INVENTORY.md) -- Mapping of the Next.js App Router structure.
