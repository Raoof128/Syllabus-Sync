# Syllabus Sync — Backend, Security and Runtime Audit, 2026-09-28

**Branch:** `claude/kind-mccarthy-qhi6sm`
**Starting commit:** `0fecd030`
**Target:** production at `https://www.syllabus-sync.app` (Next.js App Router, OpenNext →
Cloudflare Workers, Supabase Postgres)
**Predecessors:** 2026-07-22 (BA-0001…BA-0051), 2026-08-02 (BA-0052…BA-0058). This pass
continues the numbering at **BA-0059**.

---

## 1. Executive summary

The backend was in better shape than most: middleware fails closed for every non-public API
route, cross-user RLS held for all 16 user-owned tables under a real replay, every
`SECURITY DEFINER` function pins `search_path` and refuses a foreign `auth.uid()`, and the
predecessor fixes (BA-0006, BA-0048, BA-0052, BA-0056) all still hold.

It was not production-ready, for four reasons this pass found and fixed:

1. **BA-0059 (P1) — a stolen session could mint a permanent passkey backdoor.** The
   predecessor's BA-0002 fix closed one route that accepted client-supplied key material. The
   underlying storage stayed writable: `webauthn_credentials` kept owner INSERT/UPDATE
   policies, and login still trusted `user_metadata.biometric_*`, which Supabase lets the
   account holder rewrite directly. Proven with SQL against a Supabase-faithful replay, and
   independently re-found by a separate audit lane.
2. **BA-0060 (P2) — the rate-limit store was callable by `anon`.** Under Supabase's default
   function grant, `ratelimit_set()` let anyone zero any limiter key. The 2026-08-02 audit
   recorded this as REFUTED because its replay did not reproduce that default grant. The CI
   fresh-build gate had the same blind spot and now reproduces it.
3. **BA-0068 (P1, operational) — nothing could be deployed.** The Sharp audit exception
   expired on 2026-08-22, so every gated `cf:deploy*` script has failed closed since then.
   Upgrading to Next 16.3.6 (which also fixes two critical Next advisories) moves both Sharp
   copies to patched releases. The gate now recognises that state explicitly and still
   requires Worker reachability to be proven absent.
4. **BA-0061 (P2) — no server-side error ever reached Sentry.** There was no
   `instrumentation.ts`, so the server and edge configs were never loaded.

Remaining risk is concentrated in one architectural gap that should not be fixed blind
(**BA-0069, P1 open**: MFA is enforced only in Next.js, not in the database) and in owner
actions that code cannot perform. See §6.

## 2. Baseline

```
git rev-parse HEAD    0fecd0309ed621244cd7e982945025958e5c99a7
node / npm            v22.22.2 / 10.9.7   (engines: >=22 <23)
npm ci                exit 0
npm run check         155 test files, 1343 tests passed; build step
                      interrupted by this audit's own concurrent edits (see §5)
npm audit             16 advisories: 1 critical (next), 9 high, 5 moderate, 1 low
sharp audit gate      FAILS at HEAD: "Sharp audit exception expired after 2026-08-22"
```

## 3. Technology and documentation matrix

Versions are the resolved lockfile versions. Upstream facts were checked against first-party
sources on 2026-09-28; where a page could not be fetched through the network proxy, that is
stated.

| Technology                                          | Before → after        | Key 2026 upstream facts                                                                                                                                                                                                                                                                                                                                                | Repo compliance                                                                                                                                                                                                                                |
| --------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js                                             | 16.2.12 → **16.3.6**  | 16.2.x receives no further patches. GHSA-2xp9-vwfh-vxw4 and GHSA-p293-qw3h-jr36 (critical, fixed 16.3.3); GHSA-vcvr-r3jv-pc5j (`next/og`, fixed 16.3.6). `middleware.ts` is deprecated in favour of `proxy.ts`, which is Node-only.                                                                                                                                    | Upgraded. `middleware.ts` kept deliberately: Edge middleware is what OpenNext supports; Node proxy is experimental there. Repo does not import `next/og`.                                                                                      |
| @opennextjs/cloudflare                              | 1.20.2 → **1.20.6**   | 1.20.6 requires `next >=16.3.3` and `wrangler ^4.125.0`, so it has to move with Next.                                                                                                                                                                                                                                                                                  | Upgraded together.                                                                                                                                                                                                                             |
| vinext                                              | not used              | 1.0.0-beta; README says not yet a drop-in replacement; Cloudflare recommends it for new apps and migration "when compatibility allows". No Sentry support yet.                                                                                                                                                                                                         | **KEEP OPENNEXT** (§7).                                                                                                                                                                                                                        |
| Wrangler / Workers                                  | 4.115.0 → **4.142.0** | `nodejs_compat` becomes default only from compatibility date 2026-08-04; this repo's date (2026-07-22) needs the explicit flag, which it has. `vars`, `services`, `images` are non-inheritable and are redefined under `env.production`. Client cannot spoof `CF-Connecting-IP`; X-Forwarded-For is appended to, so its first entry is client-chosen.                  | Compliant; BA-0062 fixed the XFF use.                                                                                                                                                                                                          |
| Supabase (`supabase-js` 2.104, `@supabase/ssr` 0.8) | unchanged             | `getUser()` revalidates with Auth; `getClaims()` verifies locally and cannot see revocation until expiry. `user_metadata` is user-writable and must not drive authorisation. Legacy `anon`/`service_role` keys deprecated by end of 2026 in favour of `sb_publishable_`/`sb_secret_`. From **2026-10-30** new `public` tables are no longer auto-granted to API roles. | Server auth uses `getUser()` throughout (correct for revocation-sensitive routes). BA-0059 removed the `user_metadata` trust. BA-0066 accepts `sb_secret_`. New migrations in this pass only revoke, so the grant change does not affect them. |
| PostgreSQL                                          | 15/16 semantics       | `REVOKE … FROM PUBLIC` does not remove a direct grant to `anon`.                                                                                                                                                                                                                                                                                                       | BA-0060.                                                                                                                                                                                                                                       |
| @simplewebauthn/server                              | 13.3.0 → **13.3.3**   | GHSA-6hxq-p678-4hr2 (low; attestation trust chain) fixed in 13.3.2. `requireUserVerification` defaults to true. Counter 0 is normal for synced passkeys.                                                                                                                                                                                                               | Upgraded. App uses `attestationType: 'none'`, so the advisory was not reachable.                                                                                                                                                               |
| Resend 6.x                                          | unchanged             | Returns `{ data, error }`; supports `idempotencyKey`.                                                                                                                                                                                                                                                                                                                  | Not re-audited in depth this pass (§6).                                                                                                                                                                                                        |
| @sentry/nextjs 10.69                                | unchanged             | Server and edge init **require** `instrumentation.ts`; `sendDefaultPii` defaults to false. Cloudflare support is documented but described as alpha.                                                                                                                                                                                                                    | BA-0061 fixed.                                                                                                                                                                                                                                 |
| Vitest                                              | 4.1.5 (unchanged)     | GHSA-82fw-gwwq-j7x9 (moderate, dev-only) fixed in 4.1.11.                                                                                                                                                                                                                                                                                                              | npm's arborist fails resolving the upgrade (`edgesOut` on the jsdom → canvas peer set). Dev-only; recorded.                                                                                                                                    |

## 4. Architecture map (as verified)

```
browser ─► Cloudflare edge (sets CF-Connecting-IP) ─► custom-worker.ts
            │                                          ├─ fetch → OpenNext handler
            │                                          └─ scheduled → lib/cloudflare/scheduled.ts
            │                                               → CRON_SECRET-bearing self-request
            ▼
  middleware.ts (Edge) = lib/middleware.ts
    ├─ origin/referer CSRF check on POST/PUT/PATCH/DELETE (lib/security/csrf.ts)
    ├─ supabase.auth.getUser() with 6 s deadline; unresolved → 503/redirect (fail closed)
    ├─ AAL check; unresolved → 503/redirect (fail closed)
    └─ public API allowlist: /api/auth/*, /api/health, /api/cron/*, rate-limit cleanup,
       /api/csp-report, /api/webauthn/authenticate/*   (maps/weather removed, BA-0065)
            ▼
  route handler: requireAuth / getUser() again (defence in depth, enforced by
  tests/security/api-auth-coverage.test.ts) → Zod → rate limit → Supabase
            ▼
  Supabase: user client (RLS) | service-role client (bypasses RLS; server only)
            ▼
  Postgres: grants → RLS policies → SECURITY DEFINER RPCs (auth.uid() guards)
```

Trust boundaries that matter:

- **`/api/auth/*` is outside the middleware session and AAL gate.** Routes there that act on
  an existing session must enforce step-up themselves (BA-0064 adds a shared helper).
- **Supabase's own REST and Auth endpoints are a second front door.** Anything the anon key
  plus a user JWT can reach directly bypasses the Next.js layer entirely. BA-0059 and
  BA-0069 are both instances of this.
- **Service role** is used for pre-auth lookups, token claims, WebAuthn storage and admin
  operations. No caller-supplied user id reaches it without a binding check (verified for
  every call site; the WebAuthn verify route binds credential to challenge user, BA-0056).

## 5. Findings ledger

| ID      | Sev    | Component                                                            | Status                                                  |
| ------- | ------ | -------------------------------------------------------------------- | ------------------------------------------------------- |
| BA-0059 | **P1** | WebAuthn storage                                                     | **Fixed & verified**                                    |
| BA-0060 | P2     | Postgres grants / rate limiting                                      | **Fixed & verified**                                    |
| BA-0061 | P2     | Observability                                                        | **Fixed**                                               |
| BA-0062 | P3     | Rate-limit keys                                                      | **Fixed & verified**                                    |
| BA-0063 | P2     | Rate-limit store atomicity                                           | **Fixed & verified** (fake Upstash; live smoke pending) |
| BA-0064 | P2     | Step-up MFA under `/api/auth/*`                                      | **Fixed & verified**                                    |
| BA-0065 | P2     | Paid-API proxies                                                     | **Fixed & verified**                                    |
| BA-0066 | P3     | Key-format forward compatibility; bundle secret scan                 | **Fixed & verified**                                    |
| BA-0067 | P2     | Dependencies (Next criticals et al.)                                 | **Fixed** (16 → 5 advisories, 0 prod-high)              |
| BA-0068 | P1     | Deployment pipeline (expired Sharp gate)                             | **Fixed & verified**                                    |
| BA-0069 | P1     | MFA not enforced at the database layer                               | **Open — needs design**                                 |
| BA-0070 | P3     | `/auth/confirm` login CSRF                                           | Open                                                    |
| BA-0071 | P3     | Passkey status discloses `mfaEnabled`                                | Open (UX decision)                                      |
| BA-0072 | P4     | `award_xp` self-callable without a reference id                      | Accepted (no cross-user visibility)                     |
| BA-0073 | P4     | Signup re-enriches an _unconfirmed_ account's profile                | Accepted                                                |
| BA-0074 | P3     | Verification-email resend: per-address cap                           | **Fixed & verified**                                    |
| BA-0075 | P3     | Push endpoints must be https                                         | **Fixed & verified**                                    |
| BA-0076 | P4     | API responses private by default; weather no longer `public`         | **Fixed & verified**                                    |
| BA-0004 | P2     | (predecessor) unauthorised passkey binding via `/api/auth/passkey/*` | **Closed** by BA-0059 (routes removed)                  |
| BA-0003 | P3     | (predecessor) duplicate RP-ID/origin resolver                        | **Closed** (duplicate removed)                          |

### BA-0059 (P1) — passkey key material writable without a ceremony

**Root cause.** Two storage paths the login ceremony trusted were writable by the account
holder:

1. `supabase/migrations/20260207000000` and `20260214003000` created
   `"Users can insert own credentials"` and `"Users can update own credentials"` on
   `webauthn_credentials`. No later migration touched them.
2. `/api/webauthn/authenticate/{options,verify}` fell back to
   `user_metadata.biometric_{credential_id,public_key}`. Supabase's own
   `PUT /auth/v1/user` lets the user write `user_metadata`; the legacy register route did
   exactly that with only the user's session, which proves it.

**Proof (replay with Supabase default grants, as authenticated Alice):**

```
INSERT INTO webauthn_credentials (...) VALUES (<alice>, 'planted-cred', 'ATTACKER_SOFTWARE_KEY', ...)
  → 1 row
UPDATE webauthn_credentials SET public_key='ATTACKER_KEY_2' WHERE user_id=<alice>
  → 2 rows
```

**Impact.** Anyone holding a user's access token for a moment (XSS, a stolen cookie, an
unlocked laptop) could plant a software-generated key and keep passwordless sign-in
indefinitely. It survives a password reset and "sign out everywhere". For accounts without
TOTP this is full, durable account takeover.

**Secondary defect in the same surface.** `/api/auth/passkey/{options,verify}` kept the
challenge and the target user id in unsigned client cookies, so the "expected" challenge was
caller-chosen. With synced passkeys (counter always 0) one captured assertion could be
replayed indefinitely. These routes had no frontend caller.

**Fix.**

- `20260928000000_lock_webauthn_credential_writes.sql`: drops the two policies, revokes
  INSERT/UPDATE/TRUNCATE from `authenticated` and everything from `anon`; owners keep SELECT
  and DELETE. Self-verifying.
- `storeCredential()` writes through the service role, only after
  `verifyRegistrationResponse` succeeds against a consumed, user-bound challenge; a failed
  count no longer reads as "under the limit".
- Login no longer reads `user_metadata` credentials anywhere.
- Removed `/api/auth/passkey/{options,verify,register,register-options}` and the duplicate
  `_lib.ts`; `useBiometrics` now uses the DB-backed `/api/webauthn/register/*` flow.

**After (same replay):** INSERT and UPDATE → `permission denied`; owner SELECT/DELETE work;
service-role insert works; Bob sees 0 of Alice's rows.

**Compatibility.** A passkey that exists _only_ as a legacy `user_metadata` credential stops
working for sign-in; the user signs in with their password and re-enables biometrics once.
This is unavoidable: an attacker-planted metadata key is indistinguishable from a legitimate
one, so none can be migrated.

**Tests:** `tests/security/webauthn-credential-write-path.test.ts` (7),
`webauthn-cross-user-credential.test.ts` (+2), `webauthn-auth-options.test.ts` (inverted),
`webauthn-anchors-fail-closed.test.ts` (duplicate stays gone), post-build invariant in
`tools/database/verify-fresh-build.sh`. All shown to fail on the original code.

### BA-0060 (P2) — definer functions executable by anon

Supabase grants EXECUTE on new functions directly to `anon`. Migrations that revoke only
`FROM PUBLIC` leave that grant. Under a replay reproducing the default:

```
SET ROLE anon; SELECT ratelimit_set('login:probe',0,0,0);   → succeeds
```

Twelve definer functions were anon-callable; the rate-limit four were exploitable (bypass
brute-force limits, or exhaust a victim's key) whenever the Postgres store is active — which
`getStore()` selects whenever the Upstash/KV variables are absent. The others refuse a NULL
`auth.uid()` (verified: no rows returned or changed).

**Fix.** `20260928000100_revoke_anon_execute_on_definer_functions.sql` revokes `anon` from
**every** definer function in `public` (generic loop, not a list) and `authenticated` from
the four rate-limit functions. Trigger functions are safe to revoke: Postgres checks EXECUTE
at `CREATE TRIGGER`, not when the trigger fires.

**Gate fix.** `verify-fresh-build.sh` now reproduces the default function grant, and asserts
after building that no definer function is anon-executable and no client role can write
`webauthn_credentials`. Shown to fail with either migration removed.

### BA-0061 (P2) — server and edge Sentry never initialised

`@sentry/nextjs` injects only the client config. The installed SDK says so itself: _"An
instrumentation file is required for the Sentry SDK to be initialized on the server."_ The
repository had no `instrumentation.ts`, so no route-handler, RSC or middleware error ever
reached Sentry, and the scrubbing added on 2026-08-17 for those runtimes never ran. Added
`instrumentation.ts` (`register()` + lazy `onRequestError`). Test:
`tests/unit/security/sentry-instrumentation-wired.test.ts`.

### BA-0062 (P3) — limiter keys from client-controlled X-Forwarded-For

`/api/auth/password/reset` and `/api/auth/email/verify` keyed on
`x-forwarded-for.split(',')[0]`. Cloudflare appends to a client-sent XFF, so the first entry
is attacker-chosen and rotating it gave unlimited attempts. Now `getClientIP()`. On
Cloudflare, `getClientIP()` also no longer falls back to client-settable `X-Real-IP` when
`CF-Connecting-IP` is absent. Tokens are high-entropy, so this was a limiter bypass rather
than a practical brute force.

### BA-0063 (P2) — Upstash limiter not atomic, and fail-open on read errors

`increment()` was GET-then-SET on a JSON value: a parallel burst all read the same count and
all passed. `get()` also mapped store errors to "no entry", so a failed read started a fresh
window and a `failClosed` limiter admitted the request. Replaced with one Lua `EVAL`
(INCR + PEXPIRE) whose errors propagate to the fail-closed policy. The counter lives under
`<key>:n`, so in-flight JSON values from the old implementation cannot make INCR error and
lock users out during rollout. Test: 25 concurrent requests against a limit of 5 admit
exactly 5 (the original admits more); a partial outage (GET failing) no longer resets the
window.

**Not proven against live Upstash** (no credentials in this environment). Upstash's REST
API supports `EVAL`; confirm with one sign-in on preview before production.

### BA-0064 (P2) — step-up MFA missing on session-bound `/api/auth/*` routes

Because `/api/auth/*` is exempt from the middleware AAL gate, an attacker with only the
password of an MFA-protected account could change that password, revoke all the owner's
other sessions, or enrol an additional TOTP/SMS factor. New
`app/api/_lib/aal.ts::requireAal2IfEnrolled()` (the fail-closed logic `mfa/unenroll`
already used) is applied to password change, sessions (`others`/`global` only — signing
yourself out always works), and both enrol routes (first enrolment unaffected).

Also fixed: the password route re-verified the current password with `signInWithPassword`
on the **cookie-bound** client, replacing the caller's AAL2 session with a new AAL1 one
mid-request. It now uses a throwaway, non-persisting client and revokes the session it
creates.

### BA-0065 (P2) — paid Google Maps/Weather proxies open to anyone

`/api/maps/*` and `/api/weather` were on the public list, and their only gate
(`isTrustedOrigin`) returns true when Origin and Referer are both absent — i.e. plain curl.
Every caller renders only inside the authenticated app shell (`app/client-layout.tsx:254`),
so they now sit behind the session and AAL gate, wrap `requireAuth`, and `/api/maps` lost
its CSRF exemption. The dev-only `/api/maps/dev-pin`, which rewrites a source file, was
reachable by any website a developer visited; it is now authenticated too.

### BA-0066 (P3) — key-format forward compatibility; secrets in the client bundle

`createAdminClient()` accepted only `eyJ…` keys, so rotating to an `sb_secret_…` key would
silently disable every admin-backed route. `check-public-env.mjs` required a legacy anon JWT
in the bundle, so migrating to `sb_publishable_…` would fail the deploy gate. Both now accept
the new formats, and the bundle check **fails** if it finds an `sb_secret_` key or any JWT
whose payload role is `service_role`.

### BA-0067 (P2) — dependency advisories

`npm audit` 16 → 5. Production-scope `npm audit --omit=dev --audit-level high` (the CI gate)
now exits 0. Changes: next 16.3.6, @opennextjs/cloudflare 1.20.6, wrangler 4.142.0,
@simplewebauthn/server 13.3.3, @next/\* 16.3.6, override floors raised for undici (7.29),
brace-expansion (5.0.9) and fast-uri (3.1.6), and a same-major override for nanoid (3.3.18).
Remaining five are dev/build-only: vitest/@vitest/mocker (npm arborist bug blocks the
resolve), js-yaml under the exact-pinned `@eslint/eslintrc@3.2.0`, and their parents.

Reachability of the Next criticals on this deployment: the Windows RCE does not apply to
Workers; the AVIF/Image-Optimisation RCE is very likely unreachable because OpenNext uses the
Cloudflare `IMAGES` binding rather than Sharp in the Worker (the reachability gate proves
Sharp absent). The upgrade is still the only supported remediation.

### BA-0068 (P1, operational) — the deployment gate had been failing for five weeks

The Sharp audit exception expired on 2026-08-22 and `evaluateDeploymentGate()` requires it,
so every `cf:deploy*`, `cf:upload*` and `cf:preview` run has failed closed since, for both
profiles. That is the same pattern as BA-0058: a fix merged is not a fix deployed.

The dependency upgrade moves both Sharp copies to patched releases (`0.35.5` under Next,
`0.35.4` under Miniflare). `evaluateSharpRemediation()` recognises that state and skips the
exception, failing closed on any version below 0.35.4, any unparseable or pre-release
version, malformed evidence, or any Sharp-linked advisory in either audit report. It does
**not** relax the Worker reachability scan. Six new gate tests; the vitest lockfile test now
asserts the committed lockfile is remediated.

This touches an owner-governed control (the 2026-07-22 owner decision). The decision
anticipated exactly this: _"Reassess upstream compatibility and Worker bundle reachability
before any deployment."_ Upstream now declares a patched Sharp; reachability is still
enforced. Owner review of `tools/security/check-sharp-risk.mjs` is requested.

### BA-0069 (P1, open) — MFA is enforced only in Next.js

`grep -rn aal supabase/migrations` returns nothing. An attacker with a password for an
MFA-protected account can sign in directly against Supabase Auth, receive an AAL1 JWT, and
read or write every user table through PostgREST with the public anon key. The Next.js AAL
gate never sees the request.

**Why not fixed here.** The documented Supabase pattern is a RESTRICTIVE policy on every user
table comparing `auth.jwt()->>'aal'` with whether the user has a verified factor. Getting it
wrong locks every user out of all data, and several legitimate AAL1 reads exist before
step-up (for example `/api/auth/user` on the MFA login screen). It needs a staging project
with real Supabase Auth to validate; the local replay stubs `auth.jwt()`. Recommended
approach: one `SECURITY DEFINER` helper `public.mfa_satisfied()` (reads `auth.mfa_factors`
as owner, returns true when no verified factor exists or the JWT is `aal2`), plus a
RESTRICTIVE `USING (public.mfa_satisfied())` policy per user table, rolled out table by table
behind a staging soak.

### BA-0070 … BA-0073

- **BA-0070 (P3)** `/auth/confirm` accepts any `type` and caller-supplied `token_hash`, so a
  link carrying an attacker's own token signs the victim into the attacker's account (login
  CSRF). The open-redirect half is already fixed. Restricting `type` does not close it (an
  attacker's own recovery token has the same effect); a real fix needs a same-browser nonce,
  which Supabase's token-hash flow does not provide.
- **BA-0071 (P3)** `/api/auth/passkey/status` returns `mfaEnabled` for real accounts, which
  discloses existence and MFA status. The login UI consumes it; removing it is a UX decision.
- **BA-0072 (P4)** `award_xp()` is intentionally executable by `authenticated`; with a NULL
  reference id there is no dedup, so a user can inflate their own XP. No leaderboard or
  cross-user view exists in the app, so it affects only the user's own display.
- **BA-0073 (P4)** Signup for an address that exists but is _unconfirmed_ re-upserts that
  profile and resets its XP. Confirmed accounts are already protected by the `identities`
  check; unconfirmed accounts hold negligible data.

### BA-0074 … BA-0076 (fixed)

- **BA-0074 (P3)** `resend-verification` was limited per IP + address only, so rotating IPs
  let anyone who registered a victim's address flood that inbox, and every send invalidates
  the previous token. Added a per-address limiter (3× the per-IP budget per hour) that IP
  rotation cannot reset.
- **BA-0075 (P3)** Push subscriptions accepted any URL; the reminder cron POSTs to it
  server-side. Now https-only. Impact was limited on Workers (`global_fetch_strictly_public`).
- **BA-0076 (P4)** Verified against the built app: route handlers emit **no**
  `Cache-Control` (only `/api/health` set one), so signed-in JSON such as `/api/auth/user`
  carried no caching directive. Cloudflare does not edge-cache Worker responses by default,
  so no cross-user leak was demonstrated. `jsonSuccess`/`jsonError` now default to
  `private, no-store` unless the route sets its own. `/api/weather` changed from
  `public, s-maxage=300` to `private, max-age=300`, since a shared cache honouring `public`
  could serve an authenticated route's response to a caller who never passed the gate.

### Claims checked and not accepted

| Claim (source)                                                                                         | Verdict                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Upstream research: "no `instrumentation.ts` means server Sentry never starts"                          | **Confirmed** (BA-0061) from the installed SDK source, not the docs alone.                                                                     |
| DB lane: "the fresh-build script's claim that adding the default function grant breaks two migrations" | **Confirmed false**: 82/82 apply with it.                                                                                                      |
| Route lane: "Upstash GET→SET race and fail-open read"                                                  | **Confirmed** by test against a faithful fake (BA-0063).                                                                                       |
| Route lane: "open redirect in `/auth/confirm`" (predecessor item)                                      | **Already fixed**; same-origin resolution.                                                                                                     |
| Route lane: "cross-user cache leakage via missing `Cache-Control`"                                     | **Not established as a leak.** The header is indeed absent (BA-0076, now hardened), but Cloudflare does not cache Worker responses by default. |

## 6. Remaining risks

**Confirmed, unresolved:** BA-0069 (P1), BA-0070, BA-0071 (P3), BA-0072, BA-0073 (P4).
Password reset still does not revoke other sessions (predecessor follow-up). Two
incompatible `parseJsonBody` helpers remain in `app/api/_lib/`.

**Could not be tested here:**

- Live Supabase: whether production's function ACLs match the replay (the replay reproduces
  Supabase's documented defaults; the 2026-08-02 settling query in that report still
  applies). No production database was read or written.
- Live Upstash `EVAL` (BA-0063) — smoke a sign-in on preview first.
- Real WebAuthn ceremonies in a browser after the `useBiometrics` switch.
- Resend delivery, idempotency and bounce handling (not re-audited this pass).

**Operational (owner actions):**

1. Apply migrations `20260928000000` and `20260928000100` to production.
2. Deploy. The gate now permits it; nothing merged since 2026-08-22 has shipped.
3. Tell users with a legacy-only biometric passkey to re-enable it once.
4. Before **2026-10-30**, any new migration creating a `public` table must include explicit
   GRANTs (Supabase stops auto-granting).
5. Plan the move to `sb_publishable_` / `sb_secret_` keys before the end-of-2026 deprecation.

## 7. OpenNext vs vinext

**KEEP OPENNEXT.** vinext is `1.0.0-beta`, its own README warns of compatibility gaps,
Sentry has no vinext integration, and this application depends on Edge middleware, a custom
Worker entry with a scheduled handler, Cloudflare bindings and Sentry. OpenNext 1.20.6
supports Next 16.3 and is the path Cloudflare documents for existing apps. Reassess when
vinext reaches GA. Separately, do not rename `middleware.ts` to `proxy.ts` yet: Next's
`proxy.ts` is Node-only, and OpenNext treats Node middleware as experimental.

## 8. Verification

All on the final tree, Node v22.22.2.

| Gate                                                                            | Result                                                                                                                                                                  |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check:secrets`                                                         | pass (941 files)                                                                                                                                                        |
| `npm run check:cloudflare-runtime`                                              | pass                                                                                                                                                                    |
| `npm run format:check`                                                          | pass                                                                                                                                                                    |
| `npm run typecheck` / `typecheck:cloudflare`                                    | pass / pass                                                                                                                                                             |
| `npm run lint`                                                                  | 0 errors, 2 pre-existing warnings in files this pass did not touch                                                                                                      |
| `npm run test`                                                                  | **1387 passed, 161 files** (baseline 1343 / 155; 0 failed, 0 skipped added)                                                                                             |
| `npm run build` (Next 16.3.6, webpack)                                          | pass, 88 static pages                                                                                                                                                   |
| `npm run check`                                                                 | **exit 0**                                                                                                                                                              |
| `npm run test:sharp-risk-gate`                                                  | 33/33 (27 existing + 6 new)                                                                                                                                             |
| `tools/database/verify-fresh-build.sh` (PostgreSQL 16, Supabase default grants) | **applied=82 failed=0**; post-build invariants hold; each invariant fails with its migration removed                                                                    |
| `npm run cf:dry-run` (preview)                                                  | **exit 0** — Sharp proven absent, deployment gate passed, 6674.83 KiB gzip                                                                                              |
| `npm run cf:dry-run:production`                                                 | **exit 0** — Sharp proven absent, deployment gate passed, 6671.85 KiB gzip                                                                                              |
| Sharp deployment gate at the **starting** commit                                | **fails** (exception expired) — BA-0068                                                                                                                                 |
| `npm audit`                                                                     | 16 → 5 (all dev/build-only)                                                                                                                                             |
| `npm audit --omit=dev --audit-level high` (CI gate)                             | exit 0 (was 1)                                                                                                                                                          |
| `check-public-env`                                                              | forbidden-secret scan clean; required-value checks fail **only because this sandbox has no `NEXT_PUBLIC_*` values** to inline. Must pass in the real build environment. |
| `npm run test:coverage`, `deploy:env:check`, `cf:smoke`                         | not run — need real credentials or a deployed Worker                                                                                                                    |

Regression proofs: every new security test was run against the pre-fix code and failed
there (passkey planting, malformed clientDataJSON, XFF keys, Upstash burst and partial
outage, DB invariants). Behavioural SQL for BA-0059/0060 ran before and after the migrations
on the same replay, including controls that legitimate paths still work (owner list/delete,
service-role insert, schedules via the definer helpers, public events as anon, XP RPC).
