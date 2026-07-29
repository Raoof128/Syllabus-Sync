# Backend Security Audit — Lanes G, H, I

**Scope:** External fetch/SSRF (G), email & push (H), cron/cleanup (I)
**Target:** `/Users/raoof.r12/Desktop/Raouf/MQ_Research/Syllabus-Sync-backend-audit` (branch `audit/backend-hardening-cloudflare`)
**Platform:** Next.js App Router on Cloudflare Workers (`nodejs_compat`, `global_fetch_strictly_public`), Supabase — **live in production**
**Date:** 2026-07-29 (same day as the Vercel→Cloudflare cron cutover)

All file:line references are against the audit checkout above. No files were modified.

---

## 1. Summary

| Severity | Count |
| -------- | ----- |
| P0       | 0     |
| P1       | 1     |
| P2       | 3     |
| P3       | 8     |

**Can any user-controlled URL reach a private/internal address? No.** The only endpoint that accepts a user-supplied URL for a server-side fetch (`/api/security/scan-headers`) validates scheme, credentials, port, literal-IP ranges, and DNS-resolved addresses against a private/loopback/link-local/`.internal`/`.local`/metadata blocklist _before_ fetching, uses `redirect: "manual"` (redirects are never followed), and applies an 8s timeout. The only residual gap is a documented DNS-rebinding TOCTOU (separate DNS lookup at validation time vs. fetch time), which requires an attacker who controls authoritative DNS for the target host — not exploitable by an ordinary user. All other server-side fetches (Google Places/Routes, ORS, HIBP, weather providers, Upstash, CSP webhook) go to a **fixed, code- or env-configured host**, never a user-supplied one.

The one finding that materially matters is **not** classic SSRF — it's a push-subscription **ownership** bug (Lane H) that lets an unrelated authenticated user silently take over another user's push subscription row through completely ordinary use of a shared device, with no attacker sophistication required.

---

## 2. External-call matrix (Lane G)

| Caller                                                                                                | Destination                                              | User-controlled?                                                        | Timeout/AbortSignal               | Redirect policy                  | Response size limit | SSRF control                                                                                                                                                 | Tests                                                                                      |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------- | -------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `lib/security/headers-scanner.ts:351` `scanURLHeaders` (via `app/api/security/scan-headers/route.ts`) | Arbitrary HTTP(S) URL                                    | **Yes**, but pre-validated                                              | 8s `AbortController`              | `manual` (not followed)          | N/A (HEAD only)     | Full blocklist: scheme, credentials, port, literal private/loopback/link-local/metadata IPs, `.local`/.internal`/.localhost`, DNS-resolved private addresses | `tests/api/security-scan-headers.route.test.ts`, `tests/cloudflare/dns-resolution.test.ts` |
| `app/api/maps/place-details/route.ts:79`                                                              | `places.googleapis.com` (hardcoded)                      | No                                                                      | 8s `AbortSignal.timeout`          | default (follow)                 | No explicit cap     | N/A — fixed host                                                                                                                                             | —                                                                                          |
| `app/api/maps/place-search/route.ts:106`                                                              | `places.googleapis.com` (hardcoded)                      | No                                                                      | 8s                                | default                          | No explicit cap     | N/A — fixed host                                                                                                                                             | —                                                                                          |
| `app/api/maps/routes/route.ts:262`                                                                    | `routes.googleapis.com` (hardcoded)                      | No                                                                      | 12s                               | default                          | No explicit cap     | N/A — fixed host                                                                                                                                             | —                                                                                          |
| `app/api/navigate/route.ts:325`                                                                       | `ORS_BASE_URL` (env, default `api.openrouteservice.org`) | No (env only)                                                           | 10s                               | default                          | No explicit cap     | N/A — fixed/env host, geofenced input                                                                                                                        | tests present under `tests/api`                                                            |
| `app/api/csp-report/route.ts:147`                                                                     | `CSP_REPORT_WEBHOOK` (env)                               | No (env only)                                                           | **None**                          | default                          | No explicit cap     | N/A — env host                                                                                                                                               | —                                                                                          |
| `lib/security/ip-anomaly-detection.ts:103` `getIPGeolocation`                                         | `http://ip-api.com` (hardcoded, **plaintext**)           | Partial — `ip` param interpolated into path                             | None                              | default                          | No explicit cap     | Fixed host; skipped entirely in production via `NODE_ENV` check; **dead code, not wired to any route**                                                       | —                                                                                          |
| `lib/security/password-breach.ts:171` `checkPasswordBreach`                                           | `api.pwnedpasswords.com` (hardcoded)                     | No                                                                      | **None**                          | default                          | No explicit cap     | N/A — fixed host, k-anonymity prefix only                                                                                                                    | `app/api/security/check-password-breach/route.ts`                                          |
| `lib/security/sri-enhanced.ts:100` `generateSRIHashFromURL`                                           | Arbitrary URL (build-time param)                         | Yes, but **build-time-only tool**, not reachable from any runtime route | None                              | default                          | No explicit cap     | N/A — not runtime-reachable                                                                                                                                  | —                                                                                          |
| `lib/weather/providers/googleWeatherProvider.ts:22,26`                                                | `weather.googleapis.com` (hardcoded)                     | No                                                                      | None (relies on platform default) | default                          | No explicit cap     | N/A — fixed host                                                                                                                                             | —                                                                                          |
| `lib/weather/providers/openMeteoProvider.ts:24`                                                       | `api.open-meteo.com` (hardcoded)                         | No                                                                      | None                              | default                          | No explicit cap     | N/A — fixed host                                                                                                                                             | —                                                                                          |
| `lib/services/rateLimitService.ts:115` `UpstashRedisStore.command`                                    | Upstash REST URL (env)                                   | No (env only)                                                           | None                              | default                          | No explicit cap     | N/A — env host                                                                                                                                               | —                                                                                          |
| `lib/supabase/fetch.ts:50` `fetchWithTimeout`                                                         | Supabase project URL (env, used by supabase-js)          | No                                                                      | 15–20s                            | default (supabase-js controlled) | N/A                 | N/A — env host                                                                                                                                               | —                                                                                          |

---

## 3. Findings

### G-1 (P3) — `scan-headers` SSRF guard has a documented DNS-rebinding TOCTOU

**Files:** `app/api/security/scan-headers/route.ts:103-158,202-211`, `lib/security/headers-scanner.ts:346-371`, `lib/security/dns-resolution.ts`

`validateScanTarget()` resolves the hostname via `resolveHostAddresses()` (Node `dns/promises` under `nodejs_compat`, which resolves via Cloudflare's own DoH resolver) and rejects any private/loopback/link-local/ULA-resolving answer. `scanURLHeaders()` then performs its **own, separate** `fetch()`, which triggers a second, independent DNS resolution. An attacker who controls authoritative DNS for the target hostname (i.e., they own or can influence a domain the victim would ask the scanner to check) can return a public IP for the first lookup and a private/internal IP for the second (classic rebinding), landing the actual HEAD request on an internal address. This is called out explicitly in the code's own comment ("SECURITY BOUNDARY... cannot mathematically prevent DNS rebinding") and is a _residual_, not overlooked, risk. Endpoint requires authentication and is rate-limited (`securityScanLimiter`), so it's not anonymously reachable.

**Failure scenario:** Authenticated attacker registers a domain with a very low DNS TTL, has it resolve to a public IP the first time (validation) and to `169.254.169.254` or an RFC1918 address the second time (fetch), and submits it to `/api/security/scan-headers`.

**Fix:** Resolve once, then fetch by connecting directly to the validated IP (setting `Host`/SNI from the original hostname) instead of re-resolving via hostname; or pin the resolved IP into the request (e.g., via a custom `dispatcher`/`fetch` override that skips a second DNS lookup). If pinning isn't feasible in `workerd`, keep this as an accepted, documented residual risk (as it already is) but consider gating the endpoint to admins only, since it's the app's only user-directed outbound-fetch primitive.

### G-2 (P3) — Several fixed-host fetches lack a timeout, enabling a slow-upstream hang

**Files:** `app/api/csp-report/route.ts:147`, `lib/security/password-breach.ts:171`, `lib/services/rateLimitService.ts:115`, `lib/weather/providers/googleWeatherProvider.ts:22,26`, `lib/weather/providers/openMeteoProvider.ts:24`

None of these pass an `AbortSignal`/timeout. All target fixed, trusted (env- or code-configured) hosts, so this is not SSRF — but a slow or unresponsive upstream (webhook target, HIBP, Upstash, weather API) will hold the Worker's request open until the platform's own request/CPU ceiling kills it, rather than failing fast and returning a clean error. `lib/supabase/fetch.ts` already demonstrates the pattern the rest of the codebase should copy (`fetchWithTimeout`, 15–20s).

**Fix:** Wrap each with `AbortSignal.timeout(N)` consistent with the sibling routes that already do this (Google Places/Routes/ORS use 8-12s).

### G-3 (P3) — Dead-code SSRF-shaped path in IP anomaly detection

**Files:** `lib/security/ip-anomaly-detection.ts:78-136,414-447`

`getIPGeolocation(ip)` builds `http://ip-api.com/json/${ip}?...` from a caller-supplied `ip` string (via `handleIPAnomalyCheck`) with no format validation, over **plaintext HTTP**. It is explicitly skipped when `NODE_ENV === 'production'`, and `handleIPAnomalyCheck`/`analyzeRequestForAnomaly` are exported from `lib/security/index.ts` but **not wired into any `app/api` route** — confirmed via repo-wide search. `getIPHistory`/`addIPToHistory`/`cleanupIPHistory` are explicit stubs (comments say so), so the whole anomaly-detection feature is currently inert. No SSRF impact today because the code path never runs in production and is unreachable, but it's latent risk if someone wires it up later without re-reviewing it.

**Fix:** Either delete the dead module or, before enabling it, validate `ip` as a syntactic IPv4/IPv6 literal before interpolating into the URL, and switch to an HTTPS geolocation provider (or MaxMind, as the code comment already suggests) rather than relying on the `NODE_ENV` gate as the only safeguard.

### G-4 (P3) — No explicit upstream response size cap

**Files:** all Lane-G fetch call sites listed in the matrix above

Every upstream JSON/text response is consumed with unbounded `.json()`/`.text()`. All destinations are trusted first-party APIs (Google, ORS, HIBP, Open-Meteo, Upstash), so this is defense-in-depth rather than an active vulnerability — but a compromised or misbehaving upstream could return an excessive payload and pressure Worker memory.

**Fix:** Check `Content-Length` / stream with a byte cap before parsing, mirroring the request-side `BODY_SIZE_LIMITS` pattern already used in `app/api/_lib/response.ts`.

### G-5 (informational) — Platform-level SSRF mitigation should not be relied on as the primary control

`wrangler.jsonc` sets `compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"]`. Per Cloudflare docs, `global_fetch_strictly_public` governs Worker-to-Worker same-zone `fetch()` behavior (error 1042), and Workers' TCP-socket layer (`node:net` `connect()`) explicitly disallows Cloudflare IPs, `localhost`, and private network IPs (error 1021/1024) — but the documentation does not make an equally explicit, product-level guarantee that `fetch()` blanket-blocks all RFC1918/loopback/link-local destinations for arbitrary customer-supplied hostnames in every case. Treat the platform as **defense-in-depth**, not a substitute for the app-level validation already implemented in `scan-headers`. Recommend Cloudflare support confirm the exact `fetch()` behavior for private-IP literals and private-DNS-resolving hostnames before removing or weakening any app-level SSRF checks.

---

## 4. Findings — Lane H (email & push)

### H-1 (P1) — Push subscription ownership can be silently hijacked by any authenticated user on a shared device

**Files:** `app/api/push/subscription/route.ts:26-77`, `lib/supabase/admin.ts:40-59`, `supabase/migrations/20260313093000_add_web_push_infrastructure.sql:29-32`, `lib/store/notificationPreferencesStore.ts:186-224`, `components/layout/Header.tsx:652` (no unsubscribe on sign-out)

`POST /api/push/subscription` does:

```ts
const client = await getWritableClient(); // createAdminClient() ?? serverClient()
...
await client.from('push_subscriptions').upsert(
  { user_id: userId, endpoint: parsed.data.endpoint, p256dh_key: ..., auth_key: ... },
  { onConflict: 'endpoint' },
);
```

`getWritableClient()` prefers `createAdminClient()`, which uses `SUPABASE_SERVICE_ROLE_KEY` and **bypasses Row Level Security** (`lib/supabase/admin.ts:33` — "This client bypasses Row Level Security (RLS)"). This is the live production path since the service-role key is configured. The `push_subscriptions.endpoint` column is `UNIQUE` **database-wide**, not scoped per user (`endpoint text NOT NULL UNIQUE`, not `UNIQUE(user_id, endpoint)`). The RLS policy `"Users can update their own push subscriptions" USING (auth.uid() = user_id)` would normally block a cross-user reassignment — but it's never evaluated because the admin client sidesteps RLS entirely.

Net effect: **any two different authenticated users who submit the same `endpoint` value silently reassign that row's ownership to whichever user posted last.**

This isn't a hypothetical — it's the default, automatic behavior of this app on a shared browser:

1. `lib/store/notificationPreferencesStore.ts:186-224` (`initialize()`, run on every app load) automatically calls `notificationService.subscribeToPush()` whenever `Notification.permission === 'granted'` and `pushEnabled` is true (default `true`). Browser push permission is per-origin, not per-app-account — it persists across logins on a shared machine.
2. `subscribeToPush()` (`lib/services/notificationService.ts:192-231`) reuses the browser's _existing_ `PushManager` subscription (same `endpoint`, same keys) if one is already active, and POSTs it to the server tagged with whatever user is currently authenticated.
3. Sign-out (`components/layout/Header.tsx:652`, `supabase.auth.signOut()`) never calls `notificationService.unsubscribeFromPush()` — confirmed by search; there is no call site for `unsubscribeFromPush` outside `notificationPreferencesStore.ts`'s own toggle handler.

**Failure scenario:** Student A uses a shared campus/library computer, logs in, grants notification permission (`push_subscriptions` row: `user_id=A`, `endpoint=E`). A logs out (subscription is _not_ torn down). Student B later logs into their own account on the same browser; because permission is already `granted`, `initialize()` silently re-POSTs subscription `E` under B's session, flipping the row to `user_id=B`. From that point: (a) A's reminders silently stop being delivered anywhere (no error surfaced to A — availability/integrity loss), and (b) B's private reminder content (assignment/exam titles, unit codes, due times — see payload built in `app/api/cron/push-reminders/route.ts:75-86,120-132`) is pushed to that shared physical device and will pop up for whoever uses it next, including A. This requires no attacker skill — it is the default behavior of ordinary shared-device usage, which is a realistic pattern for this app's university-student audience.

**Fix:**

1. Change the unique constraint to `UNIQUE (user_id, endpoint)` (migration) and change `onConflict` to `'user_id,endpoint'`.
2. Before upserting under a _different_ candidate owner for an existing `endpoint`, explicitly delete/reassign only if the row is currently unowned or genuinely stale (e.g., delete rows for other users sharing that endpoint), rather than a silent blind overwrite — and consider surfacing this to the client (409) rather than silently succeeding.
3. Call `notificationService.unsubscribeFromPush()` in the sign-out flow (`Header.tsx`) so a device's subscription doesn't outlive the session that created it.
4. Stop routing this write through the RLS-bypassing admin client where a plain authenticated client (RLS-scoped) would do — the current design ignores its own RLS policies by construction.

### H-2 (P3, positive control) — DELETE is correctly scoped

**File:** `app/api/push/subscription/route.ts:93-98`

`DELETE` filters `.eq('user_id', userId).eq('endpoint', ...)`, so user A cannot delete user B's subscription even through the admin client. This doesn't mitigate H-1 (the bug is in `POST`/upsert), but confirms the write path was _intended_ to be ownership-scoped and the gap is an oversight, not a design choice.

### H-3 (P3) — Push failure counter never accumulates

**File:** `lib/server/push.ts:145-165`

On a non-404/410 send failure, the code does:

```ts
await admin.from('push_subscriptions').update({ ..., failure_count: 1 }).eq('id', subscription.id);
```

This hardcodes `failure_count: 1` instead of incrementing the stored value, so a chronically-failing subscription can never be identified/pruned by failure count alone (it also gets reset to `0` on any success). Not a security bug, but undermines the apparent intent of the column and any future failure-based cleanup logic.

**Fix:** `failure_count: (subscription.failure_count ?? 0) + 1`, using the already-selected row (the `SELECT` in `sendPushNotificationToUser` should include `failure_count`).

### H-4 (P3) — `web-push` Workerd compatibility is asserted, not proven, by CI

**Files:** `lib/server/push.ts:1`, `package.json:100`, `tests/cloudflare/node-compatibility.test.ts:1-34`

`node-compatibility.test.ts` only checks that `web-push` **imports and exposes `sendNotification`** under Node/Vitest — its own header comment says so explicitly: _"This is a Node-level check, not the authoritative Workerd proof."_ No test in the repo exercises `webpush.sendNotification`'s actual VAPID-JWT signing / `aes128gcm` payload encryption inside `workerd`. Given push is live in production and (per the cron code) apparently working, this is likely fine in practice, but it's an unverified assumption worth closing with a real `workerd`/Miniflare integration smoke test rather than relying on `npm run cf:build` + manual QA.

### H-5 (positive control) — Email/reset links use the canonical server-configured origin, not request headers

**Files:** `lib/services/emailService.ts:35-63`, `lib/platform/runtime.ts:75-89`, `lib/security/emailVerification.ts`, `app/api/auth/email/send-verification/route.ts:44`

`getEmailAppOrigin()`/`getConfiguredAppOrigin()` build the origin exclusively from `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` / Vercel host env vars, with placeholder detection (`isPlaceholder`) to refuse sending if the origin looks like an unconfigured template value. Verification/reset links are never derived from the request's `Host`/`X-Forwarded-Host`/`Origin` header, so host-header-injection into these emails is not possible. One inconsistency: `app/api/auth/email/send-verification/route.ts:44` builds `appUrl` directly from `process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'`, bypassing the shared placeholder guard used everywhere else — still env-sourced (not attacker-controlled) so low severity, but worth unifying (P3).

### H-6 (positive control) — Token handling

**File:** `lib/security/emailVerification.ts:56-148`

32 random bytes (256 bits), SHA-256 hashed at rest, 20-minute expiry, previous active tokens invalidated on a new request, and explicit "never log raw token" discipline honored in the actual `logger.info/error` calls (only `userId`/masked email are logged). No issues found.

### H-7 (P3) — `resend-verification` sender fallback could silently degrade deliverability

**File:** `lib/services/emailService.ts:69`

`fromAddress` defaults to `onboarding@resend.dev` if `VERIFICATION_EMAIL_FROM` is unset. Resend restricts that shared sandbox sender to the account owner's own verified address in many configurations, so if this env var were ever unset in production, verification/reset emails would silently fail to reach real users (the code treats Resend errors as soft failures — logs and returns `{success:false}`, callers largely respond with a generic success message to avoid enumeration, which means the failure could go unnoticed operationally). Recommend confirming `VERIFICATION_EMAIL_FROM` is set in the production secret store and adding an explicit startup/health check that flags use of the sandbox sender.

---

## 5. Findings — Lane I (cron & cleanup)

### I-1 (P2) — `CRON_SECRET` comparison is not constant-time, across all four protected routes

**Files:** `app/api/auth/email/cleanup/route.ts:17-22`, `app/api/auth/password/cleanup/route.ts:16-21`, `app/api/security/rate-limit/cleanup/route.ts:12-17`, `app/api/cron/push-reminders/route.ts:228-233`

All four routes use plain string inequality:

```ts
if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) { ... }
```

(`push-reminders` uses the equivalent `authHeader === \`Bearer ${cronSecret}\``). This is a textbook timing side-channel: JS string `===`/`!==`short-circuits on the first mismatched byte, so response latency leaks how many leading bytes of the guess were correct. All four routes are reachable over the public internet (confirmed:`docs/api/API_REFERENCE.md:672-673`documents`push-reminders`as`Public`; the three cleanup routes are also plain Next.js routes with no additional network-layer restriction, and are additionally invoked internally by the Cloudflare `scheduled()`handler using the same public route path).`push-reminders` is hit externally every 10 minutes by a GitHub Actions workflow (`.github/workflows/push-reminders-cron.yml`) over the public internet, making this the most exposed instance.

**Realistic exploitability:** network jitter typically dwarfs the sub-microsecond timing difference from a JS string comparison, so this is not "trivially exploitable" the way a P0/P1 timing bug would be — hence P2, matching the "material defect with concrete reachability" band, not higher.

**Fix:** Use a constant-time comparison, e.g. Node's `crypto.timingSafeEqual` on fixed-length buffers (hash both sides to a fixed length first if lengths can differ, to avoid the length-based early exit `timingSafeEqual` itself has). Centralize this in one shared helper used by all four routes instead of four hand-rolled copies.

### I-2 (P2) — `push-reminders` cron does unbounded, fully sequential per-user work with no batching or concurrency limit

**File:** `app/api/cron/push-reminders/route.ts:136-226`

`handlePushReminderCron()` loads **all** matching `user_preferences` rows with no `LIMIT`/pagination, then in a single `for` loop, sequentially `await`s: 2 more Supabase queries per user (`collectDeadlineReminders`, `collectEventReminders`), then per matched reminder, a `SELECT` against `push_reminder_deliveries`, a `sendPushNotificationToUser` call, and an `INSERT`. Nothing runs concurrently, and there is no cap on user count or reminder count per invocation. This job runs **every 10 minutes** via `.github/workflows/push-reminders-cron.yml`. As the user base grows, per-invocation wall time grows linearly with `(active users) × (matching reminders)`, and Cloudflare Workers enforce a CPU-time ceiling per invocation — a large enough table can cause the invocation to be killed mid-run, which (given the check-then-insert pattern below) can also produce partial/duplicate delivery.

**Fix:** Page through users (`range()`), and/or batch `Promise.all` in bounded chunks (e.g., 20 users at a time) instead of one giant sequential loop; consider moving to a Cloudflare Queue or Durable Object alarm-driven fan-out if the user base scales meaningfully.

### I-3 (P2) — `push-reminders` delivery de-duplication is check-then-insert, not atomic — duplicate sends possible under concurrent/overlapping runs

**File:** `app/api/cron/push-reminders/route.ts:181-215`

```ts
const { data: existingDelivery } = await admin.from('push_reminder_deliveries')
  .select('id').eq('reminder_key', reminder.reminderKey).maybeSingle();
if (existingDelivery) continue;
const result = await sendPushNotificationToUser(preference.user_id, reminder.payload);
...
await admin.from('push_reminder_deliveries').insert({ ... }); // unique on reminder_key
```

The `SELECT`-then-`sendNotification`-then-`INSERT` sequence is a race: if two invocations overlap (a GitHub Actions run that takes >10 minutes because of I-2, plus a manual `workflow_dispatch`, or any accidental double-trigger), both can pass the `existingDelivery` check for the same `reminder_key` before either inserts, and both will call `sendPushNotificationToUser` — the user receives the same deadline/event push twice. The `push_reminder_deliveries.reminder_key UNIQUE` constraint only prevents the _second delivery record from being written_; it does nothing to stop the push from already having been sent. Given I-2 makes long-running invocations plausible and the external scheduler fires every 10 minutes with no lock/skip-if-running semantics, this is concretely reachable, not theoretical.

**Fix:** Reserve the `reminder_key` with an `INSERT ... ON CONFLICT DO NOTHING` _before_ sending the push, and only send if the insert actually happened (i.e., treat the row as a lock, not an audit log written after the fact).

### I-4 (P3) — Possible double-scheduling of the three cleanup jobs via `pg_cron` _and_ the Cloudflare Worker cron trigger

**Files:** `supabase/migrations/20260213000000_email_verifications.sql:71-85`, `supabase/migrations/20260216193000_password_resets.sql:70-85`, `supabase/migrations/20260217093000_rate_limits.sql` (analogous), `wrangler.jsonc` (`triggers.crons: ["0 3 * * *", "10 3 * * *", "20 3 * * *"]`), `lib/cloudflare/scheduled.ts:12-16`

Each of the three cleanup migrations conditionally registers its **own** `pg_cron` schedule directly inside Postgres, at the _exact same_ UTC times the Worker's Cloudflare Cron Triggers now use (`0 3 * * *`, `10 3 * * *`, `20 3 * * *`):

```sql
IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
  PERFORM cron.schedule('cleanup-expired-email-verifications', '0 3 * * *',
    'SELECT public.cleanup_expired_email_verifications()');
END IF;
```

The cutover commit's stated goal is "only one scheduler is ever active" (Vercel Cron disabled, Cloudflare Cron Trigger active) — but that framing only accounts for the _HTTP-route_ schedulers. If the `pg_cron` extension happens to be enabled on the Supabase project (common on Supabase for background jobs), the database has been independently self-scheduling the identical cleanup **the whole time**, regardless of which HTTP scheduler was active, and will continue to run alongside the new Cloudflare trigger. Practically harmless here — each cleanup function is a single idempotent `DELETE ... WHERE expired`, safe to run twice concurrently — but it directly contradicts the documented "single scheduler" invariant and is worth closing so the next cron migration doesn't assume something false.

**Fix:** Confirm whether `pg_cron` is enabled on the production Supabase project (`SELECT * FROM pg_extension WHERE extname='pg_cron'` / `SELECT * FROM cron.job`); if so, either `cron.unschedule(...)` these three jobs now that the Worker owns the schedule, or explicitly decide DB-side cron is the source of truth and drop the Worker-side trigger instead — don't run both.

### I-5 (P3) — `push-reminders` is not covered by the app's own `CRON_ROUTE_BY_EXPRESSION`/`runScheduledJob` internal-dispatch pattern

**Files:** `lib/cloudflare/scheduled.ts:12-16`, `app/api/cron/push-reminders/route.ts`, `.github/workflows/push-reminders-cron.yml`

The three cleanup routes are invoked by the Worker's own `scheduled()` handler through an **internal** synthetic request (`https://syllabus-sync.internal/...`, never touching the public network) — see `lib/cloudflare/scheduled.ts:48`. `push-reminders` instead remains driven by an **external** GitHub Actions cron hitting the real public production URL every 10 minutes with a bearer token. This is a pre-existing design choice (documented in git history as a Vercel-Hobby-plan cron-frequency workaround, not part of this cutover), but it means `push-reminders` is the only cron surface that (a) is exposed to the public internet rather than invoked in-process, and (b) depends on a GitHub-repo-scoped secret (`PUSH_REMINDERS_CRON_SECRET`) matching the Worker's `CRON_SECRET` — a separate credential-management surface from the other three jobs that should be tracked explicitly (e.g., rotation of one without the other silently breaks reminders).

**Fix:** No urgent action required, but recommend either migrating `push-reminders` onto a true Cloudflare Cron Trigger (now that the platform supports sub-hour schedules) to get it out of the public-internet exposure class, or explicitly documenting it as an accepted exception.

---

## 6. What's solid (no action needed)

- `scan-headers` SSRF validation (`app/api/security/scan-headers/route.ts`) is genuinely well-built: auth-gated, rate-limited, scheme/credential/port checks, private/loopback/link-local/ULA/metadata blocklist, DNS-resolved-address check, manual redirects, timeout — with its one residual gap (DNS rebinding) explicitly documented in the code rather than silently ignored.
- Maps/routes/weather/ORS proxies all target fixed hostnames (hardcoded or env-configured), never a request-supplied host — no SSRF surface there regardless of input validation quality.
- Password-reset/verification link generation is fully origin-config-driven, immune to Host-header injection.
- Verification/reset token handling (generation, hashing, expiry, single-use invalidation, no-raw-token-in-logs) follows best practice throughout.
- `push_subscriptions` DELETE is correctly ownership-scoped even through the admin client.
