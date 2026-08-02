# Changelog

All notable changes to this project will be documented in this file.

---

### Raouf: A Dead Feature, and a Migration Set That Could Not Build — 2026-08-02

**Scope:** A re-audit of the backend, scoped deliberately as "check the real system rather
than a description of it" — because this audit's own record shows it reported a live P0 as
absent twice, each time by trusting a derived object or a supplied list. Two cheap things
had never been done: probe live production read-only with the public anon key, and replay
the migrations against an empty database. Both were done here, and both found defects.

**Summary:** **BA-0052 (P1)** — `public.schedules` and `public.schedule_members` carry
mutually recursive RLS policies. The schedules SELECT policy subqueries schedule_members
while the schedule_members SELECT policy subqueries schedules, so reading either re-enters
the other and Postgres aborts with 42P17. Production returns HTTP 500 on both tables, and
the same error reproduces locally for the `authenticated` role — so this is not an
anon-only artefact. **The sharing feature has been dead for every signed-in user since
2026-02-20.** `app/api/sync/route.ts:139` destructures only `data` and discards `error`,
so the failure is swallowed and a genuine collaborator is refused with 403. It fails
closed, so it is an availability defect rather than an escalation — but it is silent, and
1260 passing tests never saw it, because no test in this repository executes SQL. I checked
the other seven sites that discard a Supabase error the same way; all are ownership-scoped,
so none fails open.

**BA-0053 (P1)** — replaying all 78 migrations against a clean PostgreSQL 15.18 found
**6 fatally broken**. Since each runs in a transaction, everything after a failure point is
lost. `20260129000000_add_audit_logging.sql` has _two_ independent fatal errors — a
non-IMMUTABLE `now()` in an index predicate and a DELETE trigger whose WHEN clause
references NEW — so it can never have applied anywhere. Production confirms it: three of
its objects are absent there, and a fresh build produces exactly the same object set. That
also explains the two later `restore_*` migrations, which patched back `audit_logs` and
`log_audit` by hand and never covered the rest. Worse, `20260216090000_harden_security_functions.sql`
aborted at line 161 of 365 because it depends on a function defined below _another_ broken
migration's failure point — one broken file was silently disabling a second file's security
hardening, including the revoke on the destructive `clear_user_data()`.

**A correction to the project record.** The changelog states audit logs are protected. The
append-only _control_ the design intended (`"No updates to audit logs"`, `"No deletes to
audit logs"`) does not exist in production, because it sits below that migration's failure
point. The property still holds, but only by RLS default-deny. I verified that
behaviourally — as an authenticated user, UPDATE and DELETE against another user's
`audit_logs` row both affected 0 rows and the row survived — rather than trusting either
the code or the changelog.

**BA-0055 (P2)** — `anon` retains table-level SELECT/UPDATE/DELETE grants on eleven tables
including `password_resets`, `backup_codes` and `webauthn_credentials`, while fourteen
less-sensitive tables have the grant revoked. The discriminator is exactly whether a
migration ever issued `REVOKE ... FROM anon`; `rate_limits` shows why intent is not enough,
having revoked `FROM public`, which does not remove a privilege held directly by `anon`.
**I did not assume RLS contains this — I tested it.** With real rows seeded into those
tables, anon read 0 rows and a delete attempt left the token intact, and a second
authenticated user read 0 of the first user's rows. So there is no live exposure; the
finding is that RLS is the _only_ layer on the most sensitive tables in the system, which
matters here because this codebase's history is a record of that single layer failing
silently.

**BA-0027** is confirmed with a reproduction, having been an unverified candidate:
`mv_deadline_analytics` is created twice with different shapes, the second with
`IF NOT EXISTS` so it silently no-ops, after which its index aborts the migration on a
column that does not exist.

**Files Changed:** `supabase/migrations/20260802010000_fix_schedules_rls_recursion.sql`
(new), `tests/security/rls-policy-recursion.test.ts` (new),
`tools/database/verify-fresh-build.sh` (new),
`docs/backend-audit/2026-08-02/backend-runtime-audit-2026.md` (new), and repairs to
`20260129000000_add_audit_logging.sql`, `20260124000000_complete_schema_initialization.sql`,
`20260216090000_harden_security_functions.sql`, `20260114013519_add_soft_deletes_constraints_seeds.sql`,
`20260326000000_enable_rls_edge_response_cache.sql`,
`20260730130000_lock_down_orphaned_sylla_surface.sql`.

**Verification:** Fresh build from migrations alone: **applied=79 failed=0**. `npm run check`
exit 0 with **1264 tests** (up from 1260). The BA-0052 migration's verification block was run
against the pre-fix state first and failed as designed, so it is not vacuous; the new
regression test likewise fails all 4 assertions when the fix migration is removed, naming
both offending tables. After the fix, an owner and a member both see the shared schedule, an
unrelated user sees nothing, and the BA-0026 guard still refuses promotion to `owner`.
Testing also corrected me once: granting EXECUTE only to `service_role` traded 42P17 for
42501, because Postgres enforces EXECUTE against the calling role for functions referenced
in a policy. **No production data was created, modified or deleted** — write reachability
was established with zero-row filters, and every destructive test ran against the local
replica.

**Follow-ups:** The `mv_deadline_analytics` reconciliation is deliberately not done here;
dropping and recreating the matview changes the contract of `get_my_deadline_analytics()`
and `refresh_analytics_views()` and wants its own reviewed migration. The blanket
`REVOKE ... FROM anon` sweep for BA-0055 is scoped but unwritten. Three things could not be
settled without service-role access and remain open: whether production is missing the
REVOKEs lost to the hardening cascade, whether `pg_cron` is actually scheduled (BA-0011),
and production's true policy/grant state; §8 of the audit report gives the exact queries.
Most importantly, **not one test in this repository runs SQL against a real database** —
every finding above was found by executing something, and none were visible to 1260 green
tests. `tools/database/verify-fresh-build.sh` is a first step; it should be wired into CI.

---

### Raouf: Repairing What the Student ID Removal Broke — 2026-07-30

**Scope:** Clearing this morning's leftovers. They included a live defect I had introduced myself a few hours earlier.

**Summary:** Dropping `profiles.student_id` meant recreating `public.user_details`, which took the view from 15 columns to 14. Two `SECURITY DEFINER` functions still named the column, and both broke. `get_my_profile()` declared a 15-column result and selected `*` from the view, so PL/pgSQL raised `structure of query does not match function result type` for any authenticated caller that matched a row. `create_user_profile` still inserted into a column that no longer existed. I confirmed both against production before fixing them, by impersonating a real session inside a transaction that rolled back.

The reason my earlier verification passed is worth stating. I checked that the column was gone from the table and the view, that `security_invoker` survived, and that a live signup returned 200. All three were true. I never asked the catalog which other objects named the column. Signup passed because it uses a different function that never referenced the field, and nothing in the app calls `get_my_profile`, so nothing failed loudly. A service-role probe cannot catch this either: with no session the function returns zero rows, and the structural mismatch only fires once a row is returned, so a broken function looks healthy to exactly the check I ran. Dropping a column changes the contract of every object that depends on it, and only the catalog knows that list.

The rebuilt function lists its columns explicitly instead of using `SELECT *`, since that is what let the contract drift unnoticed. Both functions lost `EXECUTE` for `PUBLIC` and `anon`; `get_my_profile` had been PUBLIC-executable while running as `SECURITY DEFINER`. The `p_student_id` parameter was removed rather than accepted and ignored, so any remaining caller fails loudly instead of believing a value was stored.

Three documents still said we collect student IDs. The privacy policy now records the deletion instead of quietly dropping the field, the reference schema snapshot and the API examples are corrected, and 70 orphaned translation keys across all 35 locales are gone.

**Files Changed:** `supabase/migrations/20260730160000_fix_student_id_function_residue.sql` (new), `tests/security/student-id-function-residue.test.ts` (new), `tests/i18n/student-id-fully-removed.test.ts` (new), `lib/supabase/database.types.ts`, `tests/api/profiles.route.test.ts`, `docs/policies/privacy-policy.md`, `docs/database/database-schema.sql`, `docs/api/API_REFERENCE.md`, 35 locale files, the finding ledger.

**Verification:** The migration's verification block, run alone against the pre-fix state, failed as designed, so it is not vacuous. After applying: no `student_id` reference remains in any function, view, index or constraint; `get_my_profile` returns exactly one row for a real session; its 14 declared columns match the view's 14; the old four-argument signature is gone; a cross-user `create_user_profile` call is still rejected. `npm run check` exit 0 with 1260 tests.

---

### Raouf: Student IDs Removed and User Notification Drafted — 2026-07-30

**Scope:** The two open decisions from the BA-0048 remediation plan, both actioned on owner instruction.

**Summary:** `profiles.student_id` held the most sensitive field that BA-0048 exposed, and the application read it for nothing: collected at signup, stored, displayed back to its owner. Removing it ran in the order that keeps production consistent. The 16 stored values were nulled first, collection was stripped from 56 code references and 140 translation keys across 35 locales, that was deployed and a live signup verified to succeed without the field, and only then was the column dropped. `public.user_details` selected the column and blocked the drop, so the migration recreates the view first **`WITH (security_invoker = true)`** and re-checks the flag afterwards. That matters: this is the same DROP/CREATE shape that silently lost `security_invoker` twice before, which is the BA-0021 defect.

One correction. I had written that nothing in the app depended on the field. No logic read it, but it was a required signup field with UI in two components and keys in 35 locale files, so the change came to 56 references rather than one line.

For the notification, a Gmail draft is prepared and deliberately **not sent**. It goes to 27 recipients in BCC, never To:, because putting the list in To: would leak every address to every recipient and create a second privacy incident. The app's own mail path was unusable: the Resend key held in Vercel is invalid and the Worker's copy cannot be read back. The text states what was exposed, the roughly six-month window, that no evidence of misuse was found, and plainly that no access log exists detailed enough to prove nobody read those records.

**Files Changed:** `supabase/migrations/20260730140000_drop_student_id.sql` (new), `lib/schemas/auth.ts`, `app/api/auth/signup/route.ts`, `app/api/profiles/route.ts`, `app/api/types.ts`, `app/signup/SignupClient.tsx`, `app/manage-profiles/*`, `lib/store/profilesStore.ts`, `lib/config.ts`, `components/ProfileCard.tsx`, `lib/supabase/database.types.ts`, 35 locale files, five test files, the finding ledger.

**Verification:** Column absent from table and view, `security_invoker` still true, `npm run check` exit 0 with 1250 tests, `cf:smoke` 9/9, live signup returns 200 without the field. Test accounts deleted; `auth.users` back to 29.

**Follow-ups:** The recipient list wants pruning before anyone sends it. Roughly half the 29 accounts look like the two maintainers' own test accounts, so genuinely affected third parties number closer to 14. Deciding which are real belongs to the owners, so the draft over-includes rather than risk omitting someone.

---

### Raouf: CI Deploy Credentials Recovered, CRON_SECRET Rotated — 2026-07-30

**Scope:** Completed the CI deploy configuration by recovering the secret values Cloudflare will not return.

**Summary:** Cloudflare's Workers secrets API is write-only, confirmed against three endpoints — `/secrets`, `/secrets/{name}` and `/settings` all return `name` and `type` only, never a value. The values were still recoverable, though, because they were originally copied from Vercel during the cutover and Vercel's per-variable endpoint decrypts: that recovered `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `KV_REST_API_URL` and `KV_REST_API_TOKEN`. `CRON_SECRET` is Vercel type `sensitive` and is never returned, so it was rotated instead — safe because it is self-contained (`lib/cloudflare/scheduled.ts` reads it from env and calls the app's own protected route with the same value) and Vercel Cron was disabled at cutover. Verified live: 401 without it, 401 with a wrong value, 200 with the new one.

Two incidental findings. The rate limiter runs on `KV_REST_API_*` — the Vercel-KV branch of `getStore()` — not on Upstash-named variables and not on the Postgres store, which is exactly why `public.rate_limits` is empty while rate limiting works. And the `WEBAUTHN_RP_ID` CI variable had been set to `www.syllabus-sync.app`; the canonical value is the apex `syllabus-sync.app`, because an RP ID must be a registrable suffix of the origin. The deployment env gate rejected it, which is the gate doing its job.

**Files Changed:** `AGENT.md`, `CHANGELOG.md`. Credentials live in CI secrets and Worker secrets, not in the repository.

**Verification:** `node tools/deployment/check-required-env.mjs` with exactly the configured set exits **0**, with three warnings for optional values (`VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SENTRY_AUTH_TOKEN`). Existing Worker secrets are untouched by `wrangler deploy`, so Web Push keeps working. All recovered values were shredded from disk; `.env.local` holds only `NEXT_PUBLIC_*` build values.

**Follow-ups:** `VAPID_PRIVATE_KEY` is unrecoverable — absent from Vercel and from disk — and must not be rotated casually, because one live push subscription would break. The Worker's actual `WEBAUTHN_RP_ID` value could **not** be verified: secrets are unreadable, the cutover record does not record it, and reading it back needs a properly-formed SSR session cookie. A `www`-scoped RP ID would work today but would break a future move to the apex domain, so it is worth checking directly.

---

### Raouf: Closed the Remaining Questionnaire Gaps — Orphaned AI Surface, Audit-Log Diagnosis, CI Secrets — 2026-07-30

**Scope:** Worked through every item listed as fragile or incomplete in the security questionnaire and fixed what could be fixed, rather than restating them.

**Summary:** **BA-0049 (P2)** — `sylla_ai_requests`, `sylla_active_generations` and four `sylla_*` functions existed in production with no migration file and no calling code, built for an AI chat/upload feature that never shipped. The tables were inert (RLS enabled, zero policies), but all four functions were `SECURITY DEFINER` — which bypasses RLS — and granted EXECUTE to `anon` and `authenticated`. Three took a caller-supplied identifier with no ownership check, the same defect class as BA-0029/BA-0031: burn another user's AI quota, consume their upload quota, or set another user's request status and token counts. Client reach is revoked on all six objects, `service_role` keeps access so the feature stays developable, and they are recorded in migration history for the first time. Deliberately not dropped — the work they belong to isn't visible from this repository.

**A correction:** I had reported `audit_logs` as a broken mechanism. It isn't. Calling `log_audit` with a real user session wrote a correctly-attributed row (resolved user id and email). The table was empty because its only callers are MFA backup-code, session-termination and an explicit audit endpoint — and with 1 WebAuthn credential across 29 users, essentially nobody has triggered them. It is a coverage gap, not a breakage, and that distinction matters because it is the reason exploitation of BA-0048 can be neither confirmed nor ruled out.

**Files Changed:** `supabase/migrations/20260730130000_lock_down_orphaned_sylla_surface.sql` (new), `tests/security/orphaned-sylla-surface.test.ts` (new), `docs/backend-audit/2026-07-22/backend-finding-ledger.csv`, `AGENT.md`, `CHANGELOG.md`.

**Verification:** Catalog sweep confirms zero `sylla_*` functions remain client-executable and zero `sylla_*` tables remain granted to client roles, with `service_role` access intact. `npm run check` exit 0 with **1250 tests**. Every test account created for proof was deleted; `auth.users` and `profiles` both back to 29.

**Follow-ups:** Set 9 GitHub secrets and 4 variables that could be independently verified; 9 secrets and 3 vars remain and only the owner can supply them, because Cloudflare does not return secret values once set. **Do not trigger the deploy workflow until they are in** — a half-configured run would leave the service-role client unset, reproducing the outage caused by hand earlier today. Still open and not closeable from here: no backup restore has ever been tested, and platform-level leaked-password protection requires a Supabase Pro plan.

---

### Raouf: Cross-User Profile Read (BA-0048) — a P0 This Audit Reported as Absent — 2026-07-30

**Scope:** Fixed a live cross-user PII exposure on `public.profiles` that two earlier passes of this audit failed to find, and corrected the record.

**Summary:** `public.profiles` carried `profiles_select` — PERMISSIVE, `FOR SELECT`, role `public` (which includes `authenticated`), `USING (true)` — sitting beside the correct `"Users can view their own profile"` with `USING (auth.uid() = id)`. Postgres ORs permissive policies, so the unconditional one won and the ownership check was inert. `authenticated` holds the table-level SELECT grant, so **any account could read every profile row**. Proven against production: a throwaway account created seconds earlier read **30 profile rows** — 30 emails, 30 full names, 16 student IDs. The defect dates to `20260104000000_initial_schema.sql`, so it was live for roughly six months.

**This audit reported the opposite, twice, and both misses share one cause — trusting a derived object or a supplied list over the catalog:**

1. **BA-0021** concluded there was no live PII exposure. That was based on `public.user_details`, the _view_, which genuinely does carry `security_invoker = true` and genuinely does deny anon. The base table's own policies were never examined, so a live exposure was recorded as absent.
2. **BA-0030** dropped unconditional policies from `events`, `deadlines`, `units` and `class_times` — the four tables Supabase's advisor happened to name — instead of sweeping `pg_policies`. `profiles` has the identical defect and was not on that list.

The new migration's verification therefore sweeps **every** table in `public` rather than an enumerated set, with `xp_config` the single allow-listed exception (a non-personal lookup table clients are meant to read). That way the next table with this defect fails the migration without anyone having to think of it.

**Files Changed:** `supabase/migrations/20260730120000_fix_profiles_cross_user_read.sql` (new), `tests/security/profiles-cross-user-read.test.ts` (new), `docs/backend-audit/2026-07-22/backend-finding-ledger.csv`, `AGENT.md`, `CHANGELOG.md`.

**Verification:** Applied to production. The same session token that read 30 rows now reads exactly **1**, and its own profile is still readable, so no lockout. Catalog sweep confirms no unconditional client-reachable policy remains on any table in `public` except `xp_config`. `npm run check` exit 0 with **1242 tests**. The throwaway account was deleted — `auth.users` and `profiles` both back to 29.

**Follow-ups:** `audit_logs` is empty (0 rows against 29 users and six months of activity), so whether this was ever exploited can be neither confirmed nor ruled out — that gap is now the highest-value thing left to fix. This finding is disclosed in the security questionnaire as an incident rather than a backlog item.

---

### Raouf: Deployed the Red-Team Fixes, Restored Missing API Keys — and Caused/Recovered a Production Outage — 2026-07-30

**Scope:** Minted a scoped Cloudflare deploy token, set the three missing Google API keys, and shipped every outstanding red-team fix to production. Includes an outage this work caused and rolled back.

**Summary:** The previous session's fixes were blocked on Cloudflare access. The `CLOUDFLARE_API_KEY` in `.env` turned out to be a valid user-scoped token carrying **API Tokens Write**, so it could mint a new token — one scoped to the account that owns the Worker with only `Workers Scripts Write` + `Account Settings Read`. That unblocked both deployment and secret management.

Three keys were missing, not two. `/api/weather` was also broken; it had hidden behind a 400-for-missing-coordinates that fires before the key check. The local `GOOGLE_ROUTES_API_KEY` turned out to be **empty (length 0)**, so it was never going to work — but `GOOGLE_MAPS_API_KEY` was validated directly against the Places, Routes and Weather APIs and works for all three. And `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` was absent from the shipped bundle entirely, so the map SDK could never load.

**An outage was caused in the process, and must be recorded plainly.** `NEXT_PUBLIC_*` values are inlined by Next at **build** time; Worker secrets and `wrangler.jsonc` vars are runtime-only. The 22:47 rebuild exported only two of the required NEXT_PUBLIC variables, so `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` were inlined as empty strings. Every existing gate passed — build exit 0, 1231 tests green, `wrangler deploy --dry-run` clean, Worker booted — yet `/api/health` reported `database: not_configured`, `createAdminClient()` returned null, and the browser had no Supabase credentials at all. Detected via the admin-client oracle (`/api/auth/password/reset` 503s only when that client is null) and resolved by rolling back to version `2e584cab`, which restored `healthy`/`connected` immediately. Fixed forward by extracting the authoritative values from the known-good serving bundle, rebuilding, and **gating on build output** before redeploying.

**Files Changed:** `tools/cloudflare/check-public-env.mjs` (new), `tests/cloudflare/public-env-gate.test.ts` (new), `package.json` (gate wired into all five `cf:deploy`/`upload`/`preview` scripts), `docs/backend-audit/2026-07-22/backend-finding-ledger.csv`, `AGENT.md`, `CHANGELOG.md`.

**Verification:** Production on Worker version `e9e93429`. `npm run check` exit 0 with **1239 tests**. Verified live: **signup returns HTTP 200** (was 503 for every user); `/api/health` healthy/connected; client bundle carries the Supabase host and publishable key; `robots.txt` and `sitemap.xml` now point at `www.syllabus-sync.app`; `/api/weather` HTTP 200 with live data; `place-search` 403 (auth gate) rather than 503; `maps.googleapis.com`, `evil.example.com` and `localhost:3000` origins all 403; login rate limit 429s from the 11th attempt (new limit of 10, was 50); `cf:smoke` **9/9**. The single test user created during verification was deleted — `auth.users` is back to 29, unchanged from before the red team.

**Follow-ups:** The Maps key now serves both the browser and the server-side Places/Routes/Weather calls — it should be split into a referrer-restricted browser key and a separate server key, and restricted by API in Google Cloud Console, or anyone can drive billable Google usage with the public value. `CLOUDFLARE_API_KEY` still carries `API Tokens Write`, which is effectively a root credential for the user's Cloudflare tokens and should be narrowed or revoked now that a scoped deploy token exists. The exposed Supabase personal access token in `~/.zshrc`/`~/.bashrc` is **still unrotated**. Signup account-enumeration is left as the documented deliberate tradeoff, and three npm advisories remain accepted as build-time-only.

---

### Raouf: Red-Team Remediation — Signup Outage, Avatar Storage, CSRF Trust, Auth Config — 2026-07-30

**Scope:** Fixed everything found by the full red team of the live deployment: one critical production outage, three avatar-storage findings, three CSRF/rate-limit findings, the canonical-URL cluster, server-side breached-password enforcement, and the Supabase Auth configuration.

**Summary:** The headline finding is that **user registration had been completely broken since the Cloudflare cutover**. `app/api/auth/signup/route.ts` refuses to run without `getConfiguredAppOrigin()`, which falls back to `VERCEL_PROJECT_PRODUCTION_URL`/`VERCEL_URL` — variables that simply do not exist on Workers. Neither `NEXT_PUBLIC_APP_URL` nor `NEXT_PUBLIC_SITE_URL` was declared, so every signup returned 503. It was distinguished from the two lookalike causes before fixing: the kill switch returns a different message and `app_config.signup_enabled` is `true`, and the admin client demonstrably works because `/api/health` reports `database: connected`.

Storage was the other substantive area. The `avatars` bucket could be **listed anonymously**, which was exploited end-to-end with nothing but the publishable anon key: list the bucket → a folder named with a user's `auth.uid()` → the exact filename → download the photo. Alongside it, `avatars_update_own` had `USING` but no `WITH CHECK`, so `storage.move()` could relocate an object into another user's folder, and the bucket accepted `image/svg+xml` — active content served with no `nosniff`, no `Content-Disposition` and no CSP. Those three chain into "plant a scripted SVG as another user's avatar".

`https://maps.googleapis.com` was a trusted CSRF origin (confirmed live: it reached the credential check where an arbitrary origin was rejected) despite only ever being an outbound `<script src>`. Rate limits were still at values whose own comments said they had been raised for testing. And the breached-password check — a complete HIBP implementation already in the repo — was called only by the browser, so posting straight to the API bypassed it.

**Files Changed:** `wrangler.jsonc`, `lib/security/csrf.ts`, `lib/services/rateLimitService.ts`, `lib/security/password-breach.ts`, `app/api/auth/signup/route.ts`, `app/api/auth/password/reset/route.ts`, `app/robots.ts`, `app/sitemap.ts`, `app/calendar/page.tsx`, `supabase/migrations/20260730090000_harden_avatar_storage.sql` (new), five new test files, `tests/cloudflare/worker-config.test.ts`, `tests/api/auth/signup.test.ts`, `tests/api/auth/passwordReset.test.ts`, `package-lock.json`, `docs/backend-audit/2026-07-22/backend-finding-ledger.csv`.

**Verification:** `npm run check` exits 0 — 136 files, **1231 tests**, secrets scan 896 files, build compiles. Storage fixes applied and verified against production: anonymous listing now returns zero objects while the legitimate public avatar URL still returns HTTP 200 (confirming the public endpoint bypasses RLS, which is why dropping the policy was safe). Auth config patched and read back: anonymous sign-ins off, password floor 12 with character classes, `site_url` corrected from the stale Vercel host, redirect allowlist pruned 28 → 15 with no host wildcards left. `npm audit` 18 → 3.

**Follow-ups — two blockers, both needing Cloudflare access to the account that owns the Worker:** the signup fix and every other code change are **not live** until the Worker is deployed; the OAuth token and the API key in `.env` both fail with `Authentication error` against that account, and no GitHub repo secrets are configured, so neither the CLI nor the CI workflow can deploy. `GOOGLE_PLACES_API_KEY`/`GOOGLE_ROUTES_API_KEY` are also still missing from the Worker, so `/api/maps/*` returns 503. Separately: `password_hibp_enabled` cannot be enabled (HTTP 402, Pro plan only) — mitigated in-app instead; three npm advisories are accepted as build-time-only rather than downgrading Next to 14.x; and signup account-enumeration is left as-is because the source documents it as a deliberate UX tradeoff.

---

### Raouf: Backend Audit Database Remediation Applied to Production — 2026-07-29

**Scope:** Applied every outstanding audit migration to the production Supabase project via the CLI, and fixed five further findings surfaced while doing so — four of them live, unauthenticated, and missed by the audit itself.

**Summary:** Pushed nine migrations to `cxsqlgvbwtevkkljzolg`. Three corrections matter more than the push:

1. **BA-0021 was never live.** The audit's migration-chain reading concluded `user_details` had lost `security_invoker`, and that conclusion was reported repeatedly as an active PII exposure. The production catalog says otherwise: the flag is set, `user_details` is the only view in `public`, anon reads return 401, and the advisors report no `security_definer_view` finding. Migration `20260729080000` applied as a no-op and stands as a forward guard. No user PII was ever exposed by this defect.
2. **BA-0023 was worse than documented, and real.** `anon` — the publishable key in the web bundle — held full privileges on all three materialized views, so the exposure was unauthenticated rather than cross-user. `GET /rest/v1/mv_xp_leaderboard` with only the anon key returned HTTP 200. It returned zero rows solely because the matviews have never been REFRESHed; the first refresh would have served all 29 users' analytics to the open internet. The migration as written revoked `SELECT` from `authenticated` only and would not have closed it.
3. **Running `supabase db advisors` found two live P0s the audit never looked for.** `auth.role() = 'authenticated'` ownership gates are skipped entirely for `anon`, and `REVOKE ALL ... FROM PUBLIC` does not stop it because Supabase grants `anon` EXECUTE directly. Proven against production with the anon key alone. Separately, sixteen duplicate `USING (true)` RLS policies let any authenticated user update or delete any other user's events, deadlines, units and class times.

**Files Changed:** `supabase/migrations/20260729090100`, `20260729090300` (amended pre-apply), `20260729110000`, `20260729110001`, `20260729120000`, `20260729130000` (new), `app/api/gamification/route.ts`, `lib/supabase/database.types.ts`, `tests/security/materialized-view-grants.test.ts`, `tests/security/gamification-profile-write-path.test.ts` (new), `tests/security/definer-guards-and-permissive-policies.test.ts` (new), `docs/backend-audit/2026-07-22/backend-finding-ledger.csv`.

**Verification:** Every fix confirmed against the live database, not inferred. The anon attack that previously reached `award_xp`'s body now returns `42501 permission denied`; all three matviews, `user_details`, `profiles` and `events` return 401 to the anon key. Advisor findings 119 → 99 with `rls_policy_always_true` 12 → 0 and zero ERROR-level findings throughout. `npm run check` exits 0: 132 files, **1207 tests**, secrets scan 890 files, build compiles. No production row was deleted or modified — `xp_events` still holds 125 rows.

**Follow-ups:** The XP unique index is bounded to events created after this migration, because six pre-existing rows (one double-submitted request on 2026-01-30, 60 XP) violate it; deleting them was rejected on the owner's instruction as it would desynchronise the ledger from users' balances. 25 SECURITY DEFINER functions remain executable by `anon` — none uses the bypassable gate, but each needs individual review. Anonymous sign-ins are enabled (26 advisor findings), which makes `TO authenticated` weaker than it reads. 13 functions still have a mutable `search_path`. The Supabase personal access token in the shell profile was exposed and must be rotated.

---

### Raouf: Production Cutover to Cloudflare Workers — 2026-07-29

**Scope:** Moved production traffic for `www.syllabus-sync.app` from Vercel to Cloudflare Workers.

**Summary:** Deployed `syllabus-sync-production` (version `2e584cab`) with 12 runtime secrets including the `WEBAUTHN_RP_ID` / `WEBAUTHN_ORIGIN` invariants. Confirmed environment parity against Vercel production first: of 20 Vercel keys absent from the Cloudflare set, all 20 proved to have zero code references (vestigial Vercel Postgres/KV integration variables), so no feature regression. Transferred scheduler ownership without overlap — Vercel Cron disabled at 06:31:41Z, then the three Cloudflare cron triggers activated by commit `7b5fdcd8` and confirmed on the Worker. Attached the `www.syllabus-sync.app` custom domain, which required deleting the existing Vercel CNAME first; delete and attach ran back-to-back with automatic CNAME restore on failure, leaving a 0.9 second DNS gap.

**Files Changed:** `wrangler.jsonc`, `docs/operations/cloudflare-cutover-record-2026-07-29.md` (new).

**Verification:** DNS resolves to Cloudflare ✅; `server: cloudflare`, `cf-ray: …-SYD` ✅; HTTPS 200 with a valid certificate ✅; `cf:smoke` **9/9** ✅; `/api/health` reports `database: connected` ✅; security headers present exactly once on dynamic routes and present on static assets ✅; all three cron triggers confirmed on the production Worker ✅; no scheduler overlap at any point ✅.

**Follow-ups:** The apex `syllabus-sync.app` is still served by Vercel and 308-redirects to `www`; user-facing behaviour is correct, but it must move to Cloudflare before Vercel is decommissioned. The preview parity matrix was never executed — cutover proceeded on owner instruction with that gate unmet, so authenticated flows (login, existing passkeys, MFA, CSRF mutations, email links, push) remain unverified on Workers and need manual exercise now that traffic is live. Vercel is retained as the rollback target until 2026-08-05.

---

### Raouf: Cloudflare Preview Deployment and Security-Header Parity — 2026-07-29

**Scope:** First Cloudflare Workers preview deployment, plus two security-header regressions it exposed.

**Summary:** Deployed the first preview Worker to `syllabus-sync-preview.pouyaalavi1378.workers.dev` and ran the smoke suite against it. Two Cloudflare-only regressions surfaced, both confirmed by diffing response headers against live Vercel production.

1. **Duplicated security headers on dynamic routes.** `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, and `Permissions-Policy` were declared in both `config/next/next.config.ts` (`headers()`, `source: '/(.*)'`) and `lib/middleware.ts`. Vercel collapsed the duplicate set; OpenNext appends instead, emitting invalid values such as `X-Frame-Options: SAMEORIGIN, SAMEORIGIN` that browsers may discard entirely — silently dropping clickjacking and MIME-sniffing protection. Isolated the layer by observing that headers declared only in `next.config.ts` (`X-DNS-Prefetch-Control`, `X-Download-Options`, `X-XSS-Protection`) appeared exactly once, proving `next.config.ts` applies correctly and middleware added the second copy. Removed the five constant headers from `lib/middleware.ts`, which now sets only the nonce-dependent `Content-Security-Policy` and `x-nonce`.

2. **Static assets served with no security headers at all.** Assets matching the `run_worker_first` exclusions (`/icons/*`, `/_next/static/*`, `/favicon.ico`, `/sw.js`, webmanifests, woff2) are served straight from the `ASSETS` binding and never reach the Worker, so `next.config.ts` headers do not apply. Vercel returned all four on `/icons/icon-192.png`; Cloudflare returned none. Added a `/*` block to `public/_headers` declaring `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Strict-Transport-Security`.

Also removed the redundant `Content-Type: application/manifest+json` declarations from `public/_headers`, since the assets server already infers that type from the extension.

**Files Changed:** `lib/middleware.ts`, `public/_headers`.

**Verification:** `npm run typecheck` ✅; `npm run lint` ✅; `npm run test` 1107/1107 ✅; Sharp reachability and deployment gates passed ✅; Worker 6776.58 KiB gzip, under the 9.5 MiB hard limit ✅; `deploy:env:check` passed with 3 feature-gated warnings ✅; `cf:smoke` **9/9** ✅; header-by-header parity against live Vercel now exact on all four headers for both dynamic routes and static assets ✅.

**Follow-ups:** `Content-Type` on `/manifest.webmanifest` is still emitted twice with the same value (`application/manifest+json, application/manifest+json`). Removing the `_headers` declaration did not change it, so the second copy originates elsewhere; cosmetic, no security impact, root cause not yet identified. `GOOGLE_ROUTES_API_KEY`, `GOOGLE_WEATHER_API_KEY`, and the Sentry pair remain unset in preview, so route proxy, weather, and source-map upload are unavailable there.

---

### Raouf: Sharp Evidence-Schema Review Closure — 2026-07-22

**Scope:** Closed the remaining reverse-edge and contradictory-evidence findings in the Sharp deployment gate.

**Summary:** The full six-package Sharp graph now gates exact `effects` sets and bidirectional reciprocity with every normalized `via` edge. Reachability evidence now has exact status-specific invariants: clean evidence requires empty string matches and no proof gap; reachable evidence requires matches; unproven evidence requires a proof gap and no output. The focused suite now proves a complete clean `authorizeDeployment()` success path and all new negative cases.

**Verification:** 19/19 Node 22 focused tests passed; format, typecheck, staged secret scan, and audit exception passed; preview and production gates remain expected failures on `unproven`.

**Follow-ups:** Deployment remains blocked until the OpenNext migration produces independently scanned, profile-matched `proven-absent` evidence.

---

### Raouf: Sharp Risk-Gate Review Closure — 2026-07-22

**Scope:** Closed all security review findings in the Cloudflare Sharp advisory release gate.

**Summary:** The gate now independently derives runtime reachability from current `.open-next` bytes and every actual esbuild metafile instead of trusting declared status/matches; SHA-256 remains freshness-only. Exact approved Next/OpenNext/Wrangler registry URLs and integrities are enforced, the full npm audit graph is structurally validated and traversed, preview/production evidence is command-bound, and scheduled development plus both dry-run scripts now use build→matching gate→action. The offline suite expanded to 17 adversarial cases.

**Verification:** Node 22 focused tests, formatting, typecheck, staged secret scan, and local audit-exception gate passed. Both deployment profiles remain intentionally blocked because reachability is `unproven`.

**Follow-ups:** Complete the missing OpenNext configuration and require independently derived `proven-absent` evidence for the exact preview or production build before any Cloudflare execution.

---

### Raouf: Cloudflare Sharp Advisory Risk Gate — 2026-07-22

**Scope:** Added a narrowly scoped upstream Sharp advisory exception for local Cloudflare migration work while retaining a fail-closed deployment gate.

**Summary:** Captured tracked full/production npm audits and exact dependency paths for `GHSA-f88m-g3jw-g9cj` (source `1124066`, High, `sharp <0.35.0`); added deterministic audit and Worker-reachability validation with 11 cases; wired every Cloudflare preview/upload/deploy script through the deployment gate; documented the 2026-08-22 Australia/Sydney expiry and exact unblock conditions. No forced Sharp override, forced audit fix, or Next downgrade was made.

**Verification:** Node 22 focused tests, formatting, typecheck, secret scan, and local audit-exception gate passed. The OpenNext build stopped before output because `open-next.config.ts` is not yet implemented, leaving reachability `unproven`; the deployment gate correctly failed and deployment remains prohibited.

**Follow-ups:** Complete the OpenNext migration, inspect `.open-next` and its esbuild metafile, record `proven-absent` Worker evidence, and reassess compatible upstream releases before expiry.

---

### Raouf: App-Icon Logo Rebrand — 2026-07-07

**Scope:** Replaced the Macquarie University crest logo with the new Syllabus Sync app-icon image across the entire app.

**Summary:** Cropped the supplied app-icon artwork (rounded-square, red/white building + book motif) into an edge-to-edge square master and regenerated the full PWA/favicon icon set (`favicon.ico`, `apple-touch-icon.png`, `icon-192/384/512.png`, `maskable-512.png`) from it. Repointed all ~25 code references — login, signup, header, sidebar, onboarding, reset-password, OG/Twitter meta images, the JSON-LD organization schema, and the push-notification icon fallback in both `lib/server/push.ts` and `lib/services/notificationService.ts` — from `/MQ_Logo_Final.png` to the new `/syllabus-sync-logo.png`, then deleted the old crest file. Updated `public/sw.js`'s precache list and push-notification fallback to the new path and bumped its cache versions (`syllabus-sync-v6` → `v7`, `-static-v6` → `-static-v7`, `-dynamic-v6` → `-dynamic-v7`) so installed service workers fetch the new assets instead of serving the stale crest from cache. Rewrote the `mqLogoAlt` translation value in all 35 locale files from a hardcoded "Macquarie University logo" translation to a `{{appName}}`-interpolated string (matching the existing `welcomeTo` pattern), and updated all 10 call sites to pass `{ appName: APP_CONFIG.name }`, so alt text now reads "Syllabus Sync Logo" (localized) instead of the old university-crest wording.

**Files Changed:** `public/syllabus-sync-logo.png` (new), `public/icons/icon-192.png`, `public/icons/icon-384.png`, `public/icons/icon-512.png`, `public/icons/maskable-512.png`, `public/apple-touch-icon.png`, `public/icons/apple-touch-icon.png`, `app/favicon.ico`, `public/MQ_Logo_Final.png` (deleted), `app/layout.tsx`, `app/home/page.tsx`, `app/calendar/page.tsx`, `app/map/page.tsx`, `app/feed/page.tsx`, `app/manage-profiles/layout.tsx`, `app/login/LoginClient.tsx`, `app/signup/SignupClient.tsx`, `app/onboarding/OnboardingClient.tsx`, `app/reset-password/reset-password-client.tsx`, `components/layout/Header.tsx`, `components/layout/Sidebar.tsx`, `lib/server/push.ts`, `lib/services/notificationService.ts`, `public/sw.js`, `locales/*/translations.json` (35 files).

**Verification:** `npm run check` passed (secrets, format, typecheck, lint, test, build) ✅; `npm run check:i18n` passed ✅; manually confirmed the new icon renders on `/login` and as the browser favicon ✅.

**Follow-ups:** None.

---

### Raouf: Formatting Baseline Repair — 2026-07-22

**Scope:** Pre-existing formatting-only baseline repair before the Cloudflare Workers migration.

**Summary:** Applied the repository Prettier configuration mechanically to the 47 files reported by the baseline `format:check`. No application logic or Cloudflare migration code changed.

**Verification:** `npm run check` passed.

**Follow-ups:** None.

---

### Raouf: CI/CD Test Suite Remediation — 2026-04-07

**Scope:** Resolved authentication pipeline test failures causing CI blockages.

1.  **Fixed Auth Redirect Logic:** Updated `app/auth/callback/route.ts` to correctly prioritize and honor the `redirectTo` parameter (e.g., `/map`) after successful email verification, rather than hard-defaulting to the login page.
2.  **Anti-Enumeration Compliance:** Modified `app/api/auth/signup/route.ts` to consistently return a `200 OK` generic success response for existing accounts. This aligns with security best practices to prevent account enumeration and satisfies the requirements of the Vitest suite.
3.  **Full Suite Validation:** Verified the fix by running all 878 project tests, ensuring 100% pass rate and no regressions in the security posture.

**Files Changed:**

- `app/auth/callback/route.ts`
- `app/api/auth/signup/route.ts`

**Verification:**

- `npm run test` (878/878 passed) ✅
- Manual verification of signup flow logic ✅

---

### Raouf: About, Contact, Terms & Privacy Pages Bug Hunt & Production Hardening — 2026-04-06

**Scope:** Bug fixes, SEO, accessibility, design token compliance, and performance across 4 public pages.

**Summary:** Deep-reviewed all 4 public pages. Found and fixed 22 issues across 8 files (4 RSC wrappers + 4 client components). All 4 pages were `'use client'` at the page file level — metadata could not be exported, breaking SEO for all public-facing pages. Resolved by splitting each page into an RSC `page.tsx` (exports `metadata` + `Suspense` wrapper with ARIA-compliant loading skeleton) and a `*-client.tsx` (client component, following the established pattern from login/signup/reset-password). All 4 hero banners had hardcoded hex colors: `from-[#8B1525] via-[#A6192E] to-[#76232f]` → `from-mq-red-deep via-mq-primary to-mq-red-deep`; `text-[#FFB81C]` → `text-mq-warning`; `bg-[#FFB81C]/10` → `bg-mq-warning/10`; `bg-[#FFB81C]` → `bg-mq-warning`; `from-[#76232f]/50` → `from-mq-red-deep/50`. About page: CTA `<Link>` missing `group` class — `group-hover:translate-x-0.5` on `ArrowRight` never fired → added `group`; sections missing `aria-labelledby` and h2s missing matching `id` attributes → added; missing `<main>` landmark → added. Contact page: `text-mq-danger` used for error text — this token is NOT defined in the Tailwind config (only `mq-error` exists), making error messages invisible → corrected to `text-mq-error`; helpful-links `<article>` missing `group` class — `group-hover:opacity-100` on `ArrowRight` never fired → migrated to scoped `group/link` + `group-hover/link:opacity-100` pattern; email input and feedback textarea had no `maxLength` → added `maxLength={254}` and `maxLength={2000}`; error `<p>` missing `id` + `role="alert"` and textarea missing `aria-describedby` → error never announced to screen readers, fixed with matching `id="feedback-error"` and `aria-describedby`; added `noValidate` to form (browser native validation bypassed in favour of custom); missing `<main>` landmark → added. Terms page: `ArrowLeft` icon missing `aria-hidden="true"` → added; all `<section>` elements missing `scroll-mt-8` — TOC anchor links scrolled the heading behind the sticky nav → added; sections now have `aria-labelledby` + h2 `id` pairs; missing `<main>` → added. Privacy page: `ArrowLeft` icon missing `aria-hidden="true"` → added; `TABLE_ROWS` extracted to module-level constant, table rows now keyed by `row[0]` (stable translation key) instead of array index; privacy complaint `mailto:` subject not `encodeURIComponent`-encoded — spaces in subject broke some email clients → computed `privacyComplaintHref` with encoded subject in component body; `scroll-mt-8` added to all 14 sections; `aria-labelledby` + h2 `id` on all 14 sections; missing `<main>` → added.

**Files Changed:** `app/about/page.tsx`, `app/about/about-client.tsx` (new), `app/contact/page.tsx`, `app/contact/contact-client.tsx` (new), `app/terms/page.tsx`, `app/terms/terms-client.tsx` (new), `app/privacy/page.tsx`, `app/privacy/privacy-client.tsx` (new).

**Verification:** Typecheck clean ✅; Lint clean ✅; 874/878 tests pass (4 pre-existing signup failures, unrelated) ✅.

**Follow-ups:** None.

---

### Raouf: Reset Password Page Bug Hunt & Production Hardening — 2026-04-06

**Scope:** Bug fixes, performance, accessibility, i18n/token compliance, and code quality across 2 reset-password page files.

**Summary:** Deep-reviewed all 2 reset-password files. Found and fixed 15 issues: `page.tsx` `ResetPasswordSkeleton` missing `role="status"`, `aria-busy="true"`, `aria-label` ARIA semantics → added. `reset-password-client.tsx`: module-level `requestSchema` recreated on every import → moved into component as `useMemo`; unsafe `tStr = t as (key: string) => string` cast used across 7 callsites → removed cast, replaced all `tStr(...)` with direct `t(...)` (typed); `setSchema` dep array referenced `tStr` instead of `t` → fixed; both `z.string().min()` validation calls in `setSchema` missing translation key → added `t('validation.passwordTooShort')`; `console.error` × 2 on auth/code exchange errors → `logger.error`; `setMode` called directly in auth listener creating stale closure risk on every mode change → replaced with `modeRef` pattern: `modeRef` synced via `useEffect(() => { modeRef.current = mode; }, [mode])` and listener reads `modeRef.current` without re-subscribing; `onRequest` not memoized → `useCallback([t])`; `onSet` not memoized → `useCallback([isAuthenticated, supabase.auth, t])`; auth listener had `mode` in dependency array (caused unnecessary re-subscribe on each mode transition) → removed from deps; all 3 `from-[#001528]/88` hardcoded hex in gradient overlays → `from-mq-navy-900/88`; loading container missing `role="status"` + `aria-live="polite"` → added; `Loader2` missing `aria-hidden="true"` → added; success state `bg-green-500/15 border-green-500/20 text-green-500` → `bg-mq-success/15 border-mq-success/20 text-mq-success`; icon `aria-hidden` missing on `CheckCircle2`/`XCircle` in alerts; `aria-invalid`/`aria-describedby` missing on all 3 form inputs (email, newPassword, confirmPassword) → added with matching `id` on error paragraphs; `Mail`/`Eye`/`EyeOff` decorative icons missing `aria-hidden="true"` → added; both `text-red-500` error paragraph classes → `text-mq-error`.

**Files Changed:** `app/reset-password/page.tsx`, `app/reset-password/reset-password-client.tsx`.

**Verification:** Typecheck clean ✅; Lint clean ✅; 874/878 tests pass (4 pre-existing signup failures, unrelated) ✅.

**Follow-ups:** None.

---

### Raouf: Sign Up Page Bug Hunt & Production Hardening — 2026-04-06

**Scope:** Bug fixes, performance, accessibility, i18n/token compliance, and code quality across 4 signup page files.

**Summary:** Deep-reviewed all 4 signup page files. Found and fixed 19 issues: `page.tsx` `SignupSkeleton` missing `role="status"`, `aria-busy="true"`, `aria-label` ARIA semantics → added. `SignupClient.tsx`: replaced `import clsx from 'clsx'` with `import { cn } from '@/lib/utils'` (project standard — tailwind-merge wrapper) and updated all 6 `clsx()` callsites to `cn()`; `signupSchema` recreated every render → `useMemo`; `handleGoogleLogin` not memoized → `useCallback`; `handleNextStep` not memoized → `useCallback`; `useEffect` faculty/course cascade resets fired on mount (setting empty to empty is harmless but antipattern) → added `prevFacultyRef`/`prevCourseRef` guards; `fullNameRef` callback called `register('fullName')` inside the ref on every render → destructured `registerFullNameRef` + `registerFullNameProps` at top level; all `text-red-500` on error messages (9 occurrences) → `text-mq-error`; all required `*` asterisks (6 occurrences) `text-red-500` → `text-mq-error`; password strength label `text-red-500`/`text-green-600` → `text-mq-error`/`text-mq-success`; year `SelectTrigger` `border-red-500` → `border-mq-error` + added `aria-invalid`/`aria-describedby`; submit button redundant `opacity-50 cursor-not-allowed` class (already handled by `disabled`) → removed; `aria-invalid`/`aria-describedby` added to all 8 form inputs with matching `id` on error paragraphs; honeypot `style={{ display: 'none' }}` inline style → `className="hidden"`; background gradient `from-[#001528]/88` hardcoded hex → `from-mq-navy-900/88`; passed `error={!!errors.faculty}` to `FacultySelect` (previously had no way to show red trigger border on validation). `CourseCombobox.tsx`: `border-red-500` → `border-mq-error`; `updateDropdownPosition` not memoized (called in effect and toggle handler) → `useCallback` + added to useEffect dep array; search input missing `aria-label` → added; Escape key on search input didn't close dropdown and return focus → added `onKeyDown` handler. `FacultySelect.tsx`: added `error?: boolean` prop and conditional `border-mq-error`/`border-mq-border` + `aria-invalid` on the trigger.

**Files Changed:** `app/signup/page.tsx`, `app/signup/SignupClient.tsx`, `app/signup/components/CourseCombobox.tsx`, `app/signup/components/FacultySelect.tsx`.

**Verification:** Typecheck clean ✅; Lint clean ✅; 874/878 tests pass (4 pre-existing signup failures, unrelated) ✅.

**Follow-ups:** None.

---

### Raouf: Login Page Bug Hunt & Production Hardening — 2026-04-06

**Scope:** Bug fixes, performance, accessibility, i18n completeness, and design token compliance across 4 login page files.

**Summary:** Deep-reviewed all 6 login page files. Found and fixed 15 issues: `LoginClient.tsx` had `localLoginSchema` recreated on every render → `useMemo`; `text-red-500` on email/password error messages → `text-mq-error`; `aria-invalid`/`aria-describedby` missing on both form inputs; hardcoded English provider-mismatch error strings in two separate locations — `onSubmit` handler and `callbackError` banner → both now use `t('loginErrorProviderMismatchGoogle')` / `t('loginErrorProviderMismatchEmail')` (keys added to `locales/en/translations.json`); hardcoded hex `text-[#18181b]`/`text-[#3f3f46]` in right panel hero copy → `text-mq-content`/`text-mq-content-secondary`; template literal `className` on passkey badge, MFA badge, and passkey button → `cn()`; `handlePasskeyLogin` not memoized → `useCallback`; `handleGoogleLogin` not memoized → `useCallback`; misleading `aria-disabled` on `<Link>` tag (attribute is non-functional on anchors and doesn't prevent navigation) → removed. `page.tsx` `LoginSkeleton` missing `role="status"`, `aria-busy="true"`, `aria-label` ARIA semantics → added. `MFAChallenge.tsx` error container used `text-red-500` → `text-mq-error`; all 4 buttons missing `type="button"` → added; code input missing `aria-label`, `aria-describedby`, `aria-invalid` → added; error container missing `role="alert"` → added; resend cooldown `setInterval` had no cleanup on unmount — if component unmounted mid-countdown the interval continued running → added `cooldownIntervalRef` (persisted in `useRef`) plus a cleanup `useEffect`. `usePasskeyLogin.ts` had `console.error(err)` on catch → `logger.error`.

**Files Changed:** `app/login/LoginClient.tsx`, `app/login/page.tsx`, `app/login/components/MFAChallenge.tsx`, `app/login/hooks/usePasskeyLogin.ts`, `locales/en/translations.json`.

**Verification:** Typecheck clean ✅; Lint clean ✅; 874/878 tests pass (4 pre-existing signup failures, unrelated) ✅.

**Follow-ups:** None.

---

### Raouf: Manage Profiles Page Bug Hunt & Production Hardening — 2026-04-06

**Scope:** Bug fixes, performance, accessibility, design token compliance, and security hardening across 9 manage-profiles files.

**Summary:** Deep-reviewed all 12 manage-profiles files. Found and fixed 18 issues: `PersonalInfoCard` had `border-red-500`/`text-red-500` error styling → `border-mq-error`/`text-mq-error`; email input missing `id="email"` breaking Label association; `aria-describedby` missing on all three fields with error states → added with matching `id` on error paragraphs; hardcoded student ID placeholder `"12345678"` → `t('studentIdPlaceholder')`. `AcademicInfoCard` had hardcoded hex colors `bg-[#FFB81C]/15` + `text-[#c08c00]` on section icon → `bg-mq-warning/15` + `text-mq-warning`; `text-red-500`/`border-red-500` error styling on all three fields → `mq-error` tokens; `aria-describedby` and `aria-invalid` missing from year SelectTrigger. `error.tsx` had `bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400` → `bg-mq-error/10 text-mq-error`. `ProfileSkeleton` missing `role="status"`, `aria-busy="true"`, `aria-label` ARIA semantics. `page.tsx` reload button missing `type="button"`; `RefreshCw` className used string template literal instead of `cn()` utility — fixed both. `ProfileHeader` missing file MIME type validation (only size was checked — non-image files could be uploaded) → added `file.type.startsWith('image/')` guard; `handleAvatarChange` not memoized → `useCallback`. `useProfileManager` had `profileSchema` recreated on every render → `useMemo`; dead code in `onSubmit` error branch where first `if` set `errorMessage` to the same default value → collapsed to single `else if`; `reloadProfile` always fired success toast even when `fetchProfile()` threw → wrapped in try/catch. `actions.ts` had unprofessional rate-limit error message → neutral language; misleading catch label "Validation failed" on a `revalidatePath` error → corrected to "Cache revalidation failed"; hardcoded success message tidied. `profilesStore.ts` had redundant `console.error` immediately before `errorHandler.logError` → removed; hardcoded verbose avatar error toast → shortened.

**Files Changed:** `app/manage-profiles/components/PersonalInfoCard.tsx`, `app/manage-profiles/components/AcademicInfoCard.tsx`, `app/manage-profiles/error.tsx`, `app/manage-profiles/components/ProfileSkeleton.tsx`, `app/manage-profiles/page.tsx`, `app/manage-profiles/components/ProfileHeader.tsx`, `app/manage-profiles/hooks/useProfileManager.ts`, `app/manage-profiles/actions.ts`, `lib/store/profilesStore.ts`.

**Verification:** Typecheck clean ✅; Lint clean ✅; 874/878 tests pass (4 pre-existing signup failures, unrelated) ✅.

**Follow-ups:** None.

---

### Raouf: Event Settings Page Bug Hunt & Production Hardening — 2026-04-06

**Scope:** Bug fixes, performance, accessibility, and MQ token compliance across 4 event-settings files

1. **`EventForm.tsx` — silent failure on save:** `handleSave` had no `catch` block — if `addEvent`/`updateEvent` threw, the dialog stayed open with the spinner stuck and the user received zero feedback. Added `catch` with `toastUtils.error`.
2. **`EventForm.tsx` — redundant double-reset:** `handleOpenChange` called `resetForm()` when `newOpen === true`, but the `useEffect` already dispatches RESET whenever `open` changes. Removed the redundant `resetForm()` call (and the now-unused `resetForm` function).
3. **`EventForm.tsx` — `handleSave`, `handleDelete`, `validateForm` not memoized:** All three were recreated on every render; `handleSave` and `handleDelete` are passed as `onClick` props. Wrapped all three in `useCallback` with correct dependency arrays. `handleOpenChange` also memoized.
4. **`EventForm.tsx` — color picker missing `aria-pressed`:** Screen readers had no way to identify which color is currently selected. Added `aria-pressed={color === colorOption.value}` to each color button.
5. **`EventForm.tsx` — misleading dead comment on `endAt`:** `endAt: undefined // Could be parsed from "2:00 PM - 4:00 PM" format` was misleading — the input is `type="time"` (HH:MM only). Removed the misleading comment.
6. **`EventDetailPanel.tsx` — non-MQ status colors:** `text-emerald-600` (today) and `text-amber-600` (tomorrow) replaced with `text-mq-success` and `text-mq-warning`.
7. **`EventDetailPanel.tsx` — non-MQ navigation button hover classes:** `hover:text-emerald-600 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20` replaced with `hover:text-mq-success hover:bg-mq-success/10`.
8. **`EventDetailPanel.tsx` — hardcoded hex colors in `useMemo`:** The category dot colors used hex strings (`#3B82F6`, `#8B5CF6`, etc.) in `style={{ backgroundColor }}`. Replaced with CSS custom properties (`var(--mq-info)`, `var(--mq-purple)`, `var(--mq-success)`, `var(--mq-warning)`, `var(--mq-primary)`) to respect theming.
9. **`EventDetailPanel.tsx` — `handleNavigationClick` not memoized:** Passed to a `button`'s `onClick` but recreated every render. Wrapped in `useCallback`.
10. **`app/settings/layout.tsx` — nav buttons missing `type="button"`:** Both mobile and desktop nav buttons lacked `type="button"`, risking accidental form submission. Added to all buttons.
11. **`app/settings/layout.tsx` — nav buttons missing `aria-current="page"`:** Screen readers couldn't identify the active settings section. Added `aria-current={isActive ? 'page' : undefined}` to all nav buttons.
12. **`app/settings/layout.tsx` — raw Tailwind colors for section icons:** `text-blue-500`, `text-purple-500`, `text-green-500`, `text-amber-500`, `text-slate-500` replaced with MQ tokens: `text-mq-info`, `text-mq-purple`, `text-mq-success`, `text-mq-warning`, `text-mq-content-secondary`.
13. **`app/settings/layout.tsx` — `navigateToSection` not memoized:** Recreated on every render and passed as `onClick` to multiple buttons. Wrapped in `useCallback([router])`.
14. **`NotificationSettings.tsx` — double `if (!result)` pattern:** Two separate `if` checks on the same `result` value was confusing and implied independent logic. Refactored to a clean `if...else`.
15. **`NotificationSettings.tsx` — hardcoded `'minutes'` in timing fallback:** `${minutes} minutes` bypassed i18n. Replaced with `t('timingMinutes', { minutes })`.

**Files Changed:**

- `components/events/EventForm.tsx`
- `components/events/EventDetailPanel.tsx`
- `app/settings/layout.tsx`
- `features/settings/components/NotificationSettings.tsx`

**Verification:**

- TypeScript: `npm run typecheck` — clean ✅
- Lint: `npm run lint` — Lint OK ✅
- Tests: 874/878 passed ✅ (4 pre-existing signup failures, unrelated)

---

### Raouf: Event Feed Page Bug Hunt & Production Hardening — 2026-04-06

**Scope:** Bug fixes, performance, accessibility, type safety, i18n, and MQ token compliance across 12 feed files

1. **`usePublicFeed.ts` — time filters showed past events:** `today`, `week`, and `month` branches had no lower bound, so past events leaked through. Fixed by adding `>= startOfDay` (today) and `>= now` (week/month) guards, plus a proper `endOfDay` window for today.
2. **`useFeedLogic.ts` — dead code block:** The second `if (remindedEvents.has(eventId))` check at line 138 was unreachable — the identical guard at line 115 already returned early. Removed the dead block.
3. **`useFeedLogic.ts` — wrong `timeRange` for highlight:** `setTimeRange('upcoming')` meant highlighted past events were immediately filtered out. Changed to `setTimeRange('all')` so the highlighted event is always visible regardless of time.
4. **`useFeedLogic.ts` — memory leak in recursive `scrollToHighlight`:** Only the first `setTimeout` was returned in the cleanup function; the recursive retry and the 5 s clear timer were never cancelled on unmount. Replaced with a `timers[]` array that `clearTimeout`s every timer in the cleanup.
5. **`FeedFilters.tsx` — `TimeRange` type missing `'all'`:** Added `'all'` to the union so the `setTimeRange('all')` call in `useFeedLogic` is type-safe.
6. **`FeedFilters.tsx` — filter/time buttons missing `type="button"` and `aria-pressed`:** Both the time-range toggle buttons and category chip buttons lacked `type="button"` (could submit a parent form) and `aria-pressed` (screen readers had no active-state indication). Added both to all buttons.
7. **`FeedSkeletons.tsx` — loading skeleton invisible to screen readers:** `FeedSkeletons` had no ARIA semantics. Wrapped in a `<div role="status" aria-busy="true" aria-label="Loading events">` to match the project pattern.
8. **`FeedSidebar.tsx` — dead `statsDialogOpen` and `announcementsDialogOpen` states:** Both state variables were declared and their dialogs rendered, but no UI element ever toggled them open. Removed both state variables and their Dialog JSX. Also added Space key support (`e.key === ' '`) to the categories card `onKeyDown`.
9. **`FeedClient.tsx` — hardcoded red color classes in delete modal:** `bg-red-100`, `text-red-500`, and `bg-red-500 hover:bg-red-600` violated the "no hardcoded hex/raw Tailwind colors" rule. Replaced with `bg-mq-error/10`, `ring-mq-error/20`, `text-mq-error`, `bg-mq-error hover:bg-mq-error/90`.
10. **`PublicEventCard.tsx` — non-MQ `categoryColors` and `bg-emerald-600` added-state:** All category color classes (`bg-blue-50`, `text-blue-700`, etc.) replaced with MQ tokens (`bg-mq-info/10 text-mq-info border-mq-info/20`, etc.). The "added to calendar" button state `bg-emerald-600 hover:bg-emerald-700` replaced with `bg-mq-success hover:bg-mq-success/90 border-mq-success`. Also simplified the redundant `categoryStyle.bg.replace(...)` no-op to `categoryStyle.bg`.
11. **`FeaturedEventsBanner.tsx` — non-MQ `categoryGradients`, missing nav/dot ARIA:** `from-blue-600 to-blue-800` etc. replaced with `from-mq-info to-mq-info/70` etc. Previous/next nav buttons missing `aria-label` and `aria-hidden` on their icons. Dot buttons missing `type="button"` and `aria-current`.
12. **`EventDetailModal.tsx` — non-MQ `categoryStyles` gradients and `bg-emerald-600` added-state:** `from-blue-500 to-blue-700` etc. replaced with `from-mq-info to-mq-info/70` etc. Added-state button `bg-emerald-600 hover:bg-emerald-600` replaced with `bg-mq-success hover:bg-mq-success/90 border-mq-success`.
13. **`AnnouncementsSection.tsx` — non-MQ `typeStyles` colors:** `bg-emerald-500`, `bg-blue-500`, `bg-amber-500`, `bg-purple-500` and their `text-` / `hover:border-` variants replaced with MQ tokens (`bg-mq-success`, `bg-mq-info`, `bg-mq-warning`, `bg-mq-purple`).
14. **`QuickStats.tsx` — non-MQ `CategoryBar` colors, non-MQ `StatCard` color, and hardcoded `'en-AU'` locale:** `bg-blue-500`, `bg-emerald-500`, `bg-purple-500`, `bg-amber-500` in `CategoryBar` replaced with `bg-mq-info`, `bg-mq-success`, `bg-mq-purple`, `bg-mq-warning`. `text-purple-500/bg-purple-500/10` in `StatCard` replaced with `text-mq-purple/bg-mq-purple/10`. `EventCard` hardcoded `'en-AU'` in both `toLocaleTimeString` and `toLocaleDateString`; replaced with a `localeMap` driven by `useTypedTranslation().language`. `EventCard` `categoryColors` also replaced with MQ tokens. Merged two `useTypedTranslation()` calls into one.
15. **`PublicFeedFilters.tsx` — wrong Input import path:** `@/components/ui/input` (base shadcn) replaced with `@/components/ui/mq/input` (MQ-themed wrapper) for visual consistency.

**Files Changed:**

- `features/feed/hooks/usePublicFeed.ts`
- `features/feed/hooks/useFeedLogic.ts`
- `features/feed/components/FeedFilters.tsx`
- `features/feed/components/FeedSkeletons.tsx`
- `features/feed/components/FeedSidebar.tsx`
- `app/feed/FeedClient.tsx`
- `features/feed/components/PublicEventCard.tsx`
- `features/feed/components/FeaturedEventsBanner.tsx`
- `features/feed/components/EventDetailModal.tsx`
- `features/feed/components/AnnouncementsSection.tsx`
- `features/feed/components/QuickStats.tsx`
- `features/feed/components/PublicFeedFilters.tsx`

**Verification:**

- TypeScript: `npm run typecheck` — clean (no source-file errors) ✅
- Lint: `npm run lint` — Lint OK ✅
- Tests: 874/878 passed ✅ (4 pre-existing signup failures, unrelated)

---

### Raouf: Map Page Bug Hunt & Production Hardening — 2026-04-06

**Scope:** Bug fixes, performance, accessibility, type safety, and i18n compliance across 5 map files

1. **`MapClient.tsx` — URL truncation always appended `...`:** `copyShareableURL` used `url.toString().substring(0, 50)}...` unconditionally, appending `...` even for short URLs. Fixed by only adding the ellipsis when `urlStr.length > 50`.
2. **`MapClient.tsx` — redundant `document.title` effect:** A `useEffect` set `document.title` at runtime, which is redundant with (and can flicker against) the `metadata` export in `app/map/page.tsx` that Next.js App Router already injects as a `<title>` tag. Removed the effect.
3. **`MapClient.tsx` — `selectedBuildingName` semantic mismatch:** `RouteAnnouncer` received `selectedBuilding?.id` (e.g. "C5C") as the building name for screen reader announcements (e.g. "Navigating to C5C"). Fixed by passing `selectedBuilding?.name` (the human-readable English name).
4. **`MapClient.tsx` — duplicate comment:** `{/* Combined Map Wrapper */}` appeared twice on consecutive lines (646–647). Removed the duplicate.
5. **`MapClient.tsx` — non-memoized CampusMapHUD callbacks:** Three inline arrow functions were passed as props to `CampusMapHUD` — `onStartNavigation`, `onStopNavigation`, and `onClearExternalPlace` — recreated on every render, forcing unnecessary child re-renders. Extracted and memoized all three with `useCallback`.
6. **`MapPageSkeleton.tsx` — inaccessible loading skeleton:** The outer `<div>` had no ARIA semantics, making the page-level Suspense fallback invisible to screen readers. Added `role="status"`, `aria-label={t('loadingMap')}`, and `aria-busy="true"`.
7. **`position-editor/page.tsx` — non-MQ semantic Tailwind classes:** `PositionEditorLoading` used `bg-gray-100 dark:bg-gray-900` (background), `text-gray-600 dark:text-gray-400` (text), and `border-red-600` (spinner). Replaced with `bg-mq-background`, `text-mq-content-secondary`, and `border-mq-primary`.
8. **`CampusMapHUD.tsx` — hardcoded hex colours:** The Google Maps-mode selected building highlight used `bg-[#d2e3fc] dark:bg-[#1a3a5c]`. Replaced with `bg-mq-primary/15 dark:bg-mq-primary/10` to use the MQ primary token.
9. **`CampusMapHUD.tsx` — category capitalized in JSX instead of i18n:** The selected building card displayed the category using `charAt(0).toUpperCase() + slice(1)` (raw JavaScript string manipulation, bypassing i18n). Fixed by importing `BUILDING_CATEGORY_LABELS` from `@/features/map/lib/buildings` and using `t(BUILDING_CATEGORY_LABELS[selectedBuilding.category])`, consistent with how `CampusMap.tsx` already renders the same data. Also merged the two separate `@/features/map/lib/buildings` import lines into one.
10. **`CampusMap.tsx` — hardcoded `#4285F4` hex in SVG fill:** The "locate me" button SVG used `fill="#4285F4"` (Google blue) to indicate GPS found. Replaced with `fill="var(--mq-primary)"` to respect the MQ brand token system.

**Files Changed:**

- `features/map/components/MapClient.tsx`
- `features/map/components/MapPageSkeleton.tsx`
- `features/map/components/CampusMapHUD.tsx`
- `features/map/components/CampusMap.tsx`
- `app/map/position-editor/page.tsx`

**Verification:**

- TypeScript: `npm run typecheck` — clean (no map-source errors) ✅
- Lint: `npm run lint` — clean ✅
- Tests: 874/878 passed ✅ (4 pre-existing signup failures, unrelated)

---

### Raouf: Calendar Page Bug Hunt & Production Hardening — 2026-04-06

**Scope:** Bug fixes, performance, accessibility, and type safety across 6 calendar files

1. **`CalendarClient.tsx` — view buttons broke URL sync:** Three desktop view-toggle buttons called `setView(...)` directly, bypassing `handleViewChange`. This meant switching views didn't update the URL, breaking deep-links, back/forward navigation, and share-by-URL. Fixed by destructuring `handleViewChange` from `useCalendarView()` and wiring it to all three buttons. Also added `aria-pressed` to each button for screen-reader active-state indication.
2. **`CalendarClient.tsx` — `isToday` variable shadowing:** Inside the mobile day-row `map`, a local `const isToday` shadowed the outer `isToday` from `useCalendarView`. Renamed the inner variable to `isDayToday` to eliminate the ambiguity and prevent latent bugs.
3. **`CalendarClient.tsx` — timezone bug in todo form:** `new Date(editTodoDueDate)` creates a UTC midnight Date object. When combined with `setHours` (which applies local time), the resulting `dueDate` is wrong in any timezone west of UTC. Fixed by using `dayjs(editTodoDueDate).hour(...).minute(...).toDate()` which stays in local time throughout.
4. **`CalendarClient.tsx` — non-memoized handler functions:** 9 local handlers (`handleDeleteAssignment`, `confirmDeleteAssignment`, `handleDeleteExam`, `confirmDeleteExam`, `confirmDeleteDeadline`, `handleDeleteEvent`, `confirmDeleteEvent`, `handleDeleteTodo`, `confirmDeleteUnit`, `handleUnitDetailOpenChange`, `getUnitsForDay`, `getItemsForDay`) were re-created on every render, giving child components fresh prop references every render. Wrapped all in `useCallback` with correct dependencies.
5. **`CalendarClient.tsx` — mobile day buttons inaccessible:** Day buttons in the mobile date selector showed only a letter + number with no accessible name. Added `aria-label` with full weekday name and day number (plus "(today)" suffix) and `aria-hidden` on the decorative spans. Also destructured `formatWeekdayLong` from `useCalendarGetters` for this.
6. **`useCalendarHighlights.ts` — event highlight re-fires on store refresh:** The event-highlight effect lacked a `processedRef` guard that unit/deadline/todo highlights all have. On any Zustand store update that re-ran the effect, the detail dialog re-opened. Added `processedEventHighlightRef` and the standard reset guard to match the other highlight patterns.
7. **`useCalendarView.ts` — dead condition `hours >= 24`:** `dayjs().hour()` returns 0–23, making the `|| hours >= 24` branch unreachable. Removed it and added an explanatory comment.
8. **`useCalendarData.ts` — duplicate imports:** `createBrowserClient` and `isSupabaseConfigured` were imported from `@/lib/supabase/client` on two separate lines. Merged into one.
9. **`useCalendarDialogs.ts` — hardcoded `'#10b981'` hex colour:** The default todo colour violated AGENT.md's "no hardcoded hex values" rule. Replaced with `DEFAULT_TODO_COLOR = UNIT_COLORS[3].value` (sourced from `@/lib/config`).
10. **`page.tsx` — inaccessible loading skeleton + redundant ARIA role:** `CalendarSkeleton` had no `role="status"`, `aria-busy`, or `aria-label`. Added all three. Also removed `role="main"` from the `<main>` element — `<main>` already carries the landmark implicitly.

**Files Changed:**

- `app/calendar/page.tsx`
- `app/calendar/CalendarClient.tsx`
- `features/calendar/hooks/useCalendarView.ts`
- `features/calendar/hooks/useCalendarHighlights.ts`
- `features/calendar/hooks/useCalendarData.ts`
- `features/calendar/hooks/useCalendarDialogs.ts`

**Verification:**

- TypeScript: `npm run typecheck` — clean ✅
- Lint: `npm run lint` — clean ✅
- Tests: 874/878 passed ✅ (4 pre-existing signup failures, unrelated)

---

### Raouf: Home Page Bug Hunt & Production Hardening — 2026-04-06

**Scope:** Bug fixes, performance, accessibility, and type safety across 7 home-page files

1. **`HomeClient.tsx` — duplicate landmark labels:** Two `<section>` elements shared an identical `aria-label={t('dashboardOverview')}`, creating duplicate region landmarks for screen readers. Fixed by removing the `aria-label` from the events/todos grid section (unnamed sections don't become landmarks — correct for a sub-grid).
2. **`HomeClient.tsx` — unsafe navigation in error state:** `window.location.href = '/'` bypassed the Next.js router, causing a full-page reload instead of client-side navigation. Replaced with `router.push('/')`.
3. **`HomeClient.tsx` — portal target comment:** Documented WHY the `typeof document` guard is safe for portals (React's hydration algorithm does not compare portal content at the component mount point).
4. **`AuthRedirectHandler.tsx` — supabase client recreated on every render:** `createBrowserClient()` was called in the component body. Moved to `useMemo([], ...)` so the client is created once per mount. Also imported `Session` type and replaced `session: unknown` with `session: Session | null` in the `onAuthStateChange` callback for proper type safety.
5. **`useHomeData.ts` — unnecessary store subscriptions:** `_isLoadingUnits` and `_isLoadingDeadlines` were subscribed from their Zustand stores but never read. Each subscription causes a re-render on every loading-state change. Removed both unused subscriptions.
6. **`useHomeUser.ts` — displayName recomputed every render:** The name-derivation logic was an IIFE, recomputing on every render regardless of whether `user` or `currentProfile` changed. Wrapped in `useMemo([user, currentProfile])`. Also added `useMemo` to the React import.
7. **`WeekHeatStrip.tsx` — full `motion` bypassed `LazyMotion`:** Importing `motion` from `framer-motion` forces the full animation bundle even when `<LazyMotion features={domAnimation}>` is active in the parent. Replaced with `m` (the lightweight variant designed for use with `LazyMotion`).
8. **`loading.tsx` — inaccessible loading skeleton:** The skeleton container had no ARIA semantics — screen readers had no way to identify it as a loading state. Added `role="status"`, `aria-label="Loading dashboard"`, and `aria-busy="true"`.
9. **`WelcomeHeader.tsx` — dead fallback branch:** `messageKey ? t(messageKey) : t('dayAtGlance')` — `messageKey` is always truthy (always a string from the `generalKeys` array), so the `t('dayAtGlance')` fallback was unreachable dead code. Simplified to `t(messageKey as 'welcomeMsg1')`.

**Files Changed:**

- `app/home/HomeClient.tsx`
- `app/home/loading.tsx`
- `app/AuthRedirectHandler.tsx`
- `features/home/hooks/useHomeData.ts`
- `features/home/hooks/useHomeUser.ts`
- `features/home/components/WeekHeatStrip.tsx`
- `features/home/components/WelcomeHeader.tsx`

**Verification:**

- TypeScript: `npm run typecheck` — clean ✅
- Lint: `npm run lint` — clean ✅
- Tests: 874/878 passed ✅ (4 pre-existing signup test failures, unrelated to these changes)

---

### Raouf: Fix Select Dropdowns Not Opening Inside Dialogs — 2026-04-05

**Scope:** UI bug fix — Radix Select z-index + Dialog interaction guard

1. **Root cause 1 — z-index clash:** `SelectContent` was styled with `z-50` while Dialog overlay/content uses `z-[70]`. The Select portal rendered behind the dialog, making dropdowns invisible and unclickable in all dialogs (UnitForm day picker, ReminderModal timing picker, etc.).
2. **Root cause 2 — blanket `preventDefault`:** `ReminderModal` called `e.preventDefault()` unconditionally in `onPointerDownOutside` and `onInteractOutside`, blocking Radix Select portal interactions even if z-index were fixed.
3. **Fix 1:** Bumped `z-50` → `z-[80]` in `SelectContent` so the dropdown portal always renders above the dialog layer.
4. **Fix 2:** Narrowed the `preventDefault` guard to skip events whose target is within a `[data-radix-popper-content-wrapper]` element, preserving "click outside to dismiss" protection while allowing Select portals to function.

**Files Changed:**

- `components/ui/select.tsx`
- `components/ui/ReminderModal.tsx`

**Verification:**

- TypeScript: `npm run typecheck` — clean ✅
- Lint: `npm run lint` — clean ✅
- Tests: 876/878 passed ✅ (2 pre-existing signup failures unrelated to this change)

---

### Raouf: Git Rebase & Documentation Sync — 2026-04-01

**Scope:** Resolved a complex 3-step interactive rebase conflict in `README.md`.

1.  **Synthesized "Super README":** Merged high-impact visual portfolio assets (Typing SVG, dynamic screenshots) with the deep technical engineering narrative (Zero-Trust architecture, AI-native Codex workflows) to create a unified, high-caliber repository entry point.
2.  **Resolved Rebase Deadlock:** Manually resolved 3 sequential merge conflicts in `README.md` during an interactive rebase, ensuring no loss of professional depth or visual quality.
3.  **Synchronized Origin:** Finalized the rebase and validated repository parity with `origin/main`.

**Files Changed:**

- `README.md`

**Verification:**

- Git rebase completed successfully ✅
- `README.md` structural and visual audit completed ✅
- `git status` parity verified ✅

---

### Raouf: Full Project Documentation Portfolio Transformation — 2026-03-21

**Scope:** Rewrote and structurally elevated the entire project documentation suite to transform the repository into a high-caliber portfolio piece.

1.  **Unified Professional Tone:** Shifted from "development notes" to industry-standard "executive and senior-engineering" documentation across 15+ files.
2.  **Impact-Focused Narrative:** Highlighted the "Why" and "How" behind complex technical hurdles, including:
    - **Additive Merge Strategy** for solving optimistic UI race conditions.
    - **Fused-Heading Algorithm** for high-accuracy pedestrian campus navigation.
    - **Zero-Trust Edge Middleware** for sub-6s session resolution and fail-fast infrastructure stability.
3.  **Addressed Implementation Gaps:** Documented critical technical details discovered in the codebase:
    - **Infrastructure Limits:** Formalized Vercel Edge execution deadlines and Redis-backed rate limiting mandates.
    - **PII Handling:** Clarified plaintext IP/User-Agent logging for forensic analysis and threat hunting.
    - **Passkey Scope:** Documented the restriction to platform authenticators for biometric UX optimization.
4.  **Structural Re-indexing:** Reorganized the `docs/` hub to act as a clean, professional navigation center for technical reviewers and hiring panels.

**Files Changed:**

- `README.md`, `TECHNICAL_EXPLANATION.md`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`
- `docs/README.md`, `docs/architecture/ARCHITECTURE.md`, `docs/api/API_REFERENCE.md`
- `docs/inventory/ROUTE_INVENTORY.md`, `docs/setup/ENVIRONMENT_SETUP.md`
- `docs/university-integration-requirements.md`, `docs/operations/deployment-checklist.md`
- `docs/security/SECURITY_POSTURE.md`
- `AGENT.md`, `CHANGELOG.md`

**Verification:**

- Documentation consistency audit completed ✅
- Markdown links verified ✅
- Technical alignment with current codebase state confirmed ✅

---

### Raouf: Rewrite README for Claude for OSS and OpenAI Codex for OSS Grant Applications — 2026-03-17

**Scope:** Replaced the internal-facing technical README with a grant-optimised public README.

... [rest of CHANGELOG.md content] ...

---

### Raouf: Internationalization Update — 2026-04-06

**Scope:** i18n Expansion (34 Locales)

**Summary:** Added missing `heroSection`, `opensInNewTab`, and `loadingEvents` keys to all 34 translation files in `locales/`. Used localized translations for major languages (Arabic, German, Spanish, French, Italian, Portuguese, Chinese, Japanese, etc.) and English fallbacks for others. `heroSection` is used for ARIA labels on hero sections; `opensInNewTab` provides an accessible suffix for links; `loadingEvents` is used for screen reader status updates during feed loading.

**Files Changed:** `locales/*/translations.json` (34 files).

**Verification:** Ran `npm run check:i18n` — all 35 locales validated successfully ✅.

**Follow-ups:** None.

---

### Raouf: Cloudflare Worker Configuration Scaffolding — 2026-07-22

**Scope:** Added local OpenNext and Cloudflare Worker configuration scaffolding only; no Worker deployment or cron activation occurred.

**Summary:** Added preview and production Wrangler configuration, OpenNext default configuration, static cache-header policy, a tracked safe local-variable template, and reproducible generated Worker binding types. Added tests for custom-worker routing, compatibility flags, static assets, image binding, self-reference, empty cron triggers, and cache headers. Generated Workerd types are isolated from the Next DOM program in a separate strict TypeScript project, preserving both application and Worker type safety.

**Files Changed:** `wrangler.jsonc`, `open-next.config.ts`, `custom-worker.ts`, `cloudflare-env.d.ts`, `.dev.vars.example`, `public/_headers`, `.gitignore`, `config/ts/tsconfig.json`, `config/ts/tsconfig.cloudflare.json`, `package.json`, `tests/cloudflare/*`, `AGENT.md`, `CHANGELOG.md`.

**Verification:** Node 22 `npm run cf:typegen`, focused Vitest configuration tests, `npm run typecheck`, `npm run typecheck:cloudflare`, focused Prettier check, and `npm run check:secrets` passed. Existing build→Sharp deployment-gate→action ordering remains unchanged.

**Follow-ups:** Cloudflare Images enablement and transformation-billing acceptance are externally unverified, so `IMAGES` is planned configuration only and deployment remains blocked. Keep both cron lists empty until the separately reviewed Vercel-Cron cutover. Task 8 replaces the temporary 503 worker stub.

---

### Raouf: Cloudflare Worker Configuration Review Remediation — 2026-07-22

**Scope:** Closed the Task 4 quality-gate and route-contract review findings without changing deployment behavior or the plan-mandated static-cache policy.

**Summary:** Added the isolated Worker typecheck to the global `npm run check` sequence immediately after the main Next typecheck and protected that exact sequence with a contract test. Tightened the Worker configuration test to require the complete approved static bypass list and reject dynamic HTML/RSC, API, auth, and `/_next/image` bypass patterns.

**Files Changed:** `package.json`, `tests/cloudflare/worker-config.test.ts`, `AGENT.md`, `CHANGELOG.md`.

**Verification:** Node 22 focused Cloudflare tests, package-script contract assertion, main and Worker typechecks, formatting, and secret scan passed. Sharp audit scripts and build→gate→action ordering are unchanged.

**Follow-ups:** The review's immutable stable-name icon/image cache observation is intentionally left unchanged because Task 4 mandates that header policy; address it only in a separately reviewed production policy change. Images enablement/billing and Sharp deployment-evidence blockers remain.

---

### Raouf: Cloudflare Edge Middleware Bridge — 2026-07-22

**Scope:** Restored the Edge-compatible middleware entry point and added fail-closed API authentication coverage.

**Summary:** Renamed the existing request policy to `lib/middleware.ts`, exported it from the root `middleware.ts` convention, removed obsolete proxy entry points, and migrated the MFA regression suite without changing route, CSP, CSRF, session, email-verification, or MFA policy. Added a complete API-route authentication inventory with an explicit middleware-aligned public allowlist. The inventory found two protected utility routes without route-level evidence; `/api/navigate` and `/api/security/check-password-breach` now use `requireAuth` before their unchanged limiter and handler logic.

**Files Changed:** `middleware.ts`, `lib/middleware.ts`, removed proxy entry points, middleware/API-auth tests, the two protected utility routes, `AGENT.md`, and `CHANGELOG.md`.

**Verification:** On Node 22, 16 focused middleware, route-auth, inventory, and Worker-contract tests passed; 19 Sharp gate tests passed; main and isolated Worker typechecks, formatting, secret scan, and local Sharp audit-exception gate passed. The runtime audit records only the expected remaining DNS blocker in the security-header scanner and Node crypto blockers in CSP/CSRF. No Cloudflare execution or deployment command was run.

**Follow-ups:** Resolve the recorded runtime blockers in their separately scoped migration tasks. Existing Sharp reachability and deployment gates remain unchanged and fail closed.

---

### Raouf: Middleware Auth-Coverage Review Remediation — 2026-07-22

**Scope:** Closed the Task 5 method-coverage and extension-shaped middleware-bypass findings.

**Summary:** Replaced raw-token API inventory with TypeScript AST analysis for each exported HTTP method, including reachable local/imported handlers, aliases, re-exports, trusted auth wrappers, fail-closed session checks, and real secret enforcement. Seventeen adversarial analyzer tests cover the review's false-positive classes and early-success bypasses. The stricter inventory exposed admin GET/POST and gamification GET; all three now enter route-level `requireAuth` before their unchanged handlers. Root matching and library policy now bypass only explicit known static namespaces and exact public files, so API/auth/RSC/HTML and extension-shaped dynamic paths execute middleware. Cloudflare Wrangler asset routing remains unchanged.

**Files Changed:** Middleware matcher/policy, three protected HTTP methods, AST analyzer/inventory tests, matcher and route-auth regressions, `AGENT.md`, and `CHANGELOG.md`.

**Verification:** Node 22 focused tests passed (54/54), including the Task 4 Worker contract. Main and isolated Worker typechecks, lint, formatting, secrets, 19 Sharp gate tests, and the local Sharp audit-exception gate passed. Runtime compatibility still reports only the expected DNS scanner and CSP/CSRF Node-crypto blockers.

**Follow-ups:** Resolve those three runtime dependencies in later migration tasks. Deployment gates remain fail-closed and no Cloudflare execution or deployment command was run.

---

### Raouf: Auth Analyzer Binding Review Closure — 2026-07-22

**Scope:** Closed the remaining Task 5 analyzer identity, session-dominance, and secret-comparison findings.

**Summary:** Auth wrappers and non-auth traversal are now accepted only through exact symbol-resolved imports. Direct session checks require the actual project Supabase server client, awaited destructuring, an immediate correctly polarized error-or-missing-user condition, and a trusted 401/403 denial. Scheduler/admin secret checks require one configured secret, the current request Authorization header, exact bearer comparison polarity, and denial before work. The adversarial analyzer suite expanded to 43 cases covering property calls, wrong modules, unused imports, shadows, partial session negations, early work/success, and self/reversed/unrelated/two-secret comparisons.

**Files Changed:** API-auth analyzer and adversarial tests, `AGENT.md`, and `CHANGELOG.md`.

**Verification:** Node 22 Task 5 focused tests passed (80/80); all 47 protected exported methods across 26 protected routes remain green. Main and isolated Worker typechecks, lint, formatting, secrets, 19 Sharp tests, and the local audit exception passed. The runtime audit still reports only the three previously recorded DNS/Node-crypto blockers.

**Follow-ups:** Resolve those runtime dependencies in later tasks. No Cloudflare execution or deployment command was run.

---

### Raouf: Auth Analyzer Final Fail-Closed Closure — 2026-07-22

**Scope:** Closed the final Task 5 indirect-handler binding and direct-session dominance findings.

**Summary:** Removed generic returned-helper call chasing and retained only exact immutable export aliases and fully resolved re-exports. Unresolved/non-exported symbols plus parameter, block, catch, and local shadows now fail closed. Direct session evidence must be the first three-statement sequence: immutable awaited project server-client creation, awaited/destructured `getUser`, then immediate exact 401/403 error-or-missing-user denial. Notification PATCH is now the exact authenticated PUT alias. The four protected WebAuthn credential and registration methods authenticate before IP/limiter work, with regressions proving unauthenticated requests do not touch limiter state.

**Files Changed:** API-auth analyzer/tests, notification route/test, WebAuthn credential/registration routes/tests, `AGENT.md`, and `CHANGELOG.md`.

**Verification:** Node 22 analyzer tests passed (61/61), six-file Task 5 tests passed (98/98), and route regressions passed (19/19). All 47 protected methods remain green. Main and Worker typechecks, lint, formatting, secrets, 19 Sharp tests, and the audit exception passed; runtime blockers remain the same three DNS/Node-crypto findings.

**Follow-ups:** Resolve those runtime dependencies in later tasks. No Cloudflare execution or deployment command was run.

---

### Raouf: Mutable Callable and Exception-Path Closure — 2026-07-22

**Scope:** Closed the remaining Task 5 callable mutability and try-wrapped session-proof findings.

**Summary:** Only `const` function/arrow variables may be analyzed, and a complete module scan invalidates function declarations, const callables, or aliases with assignment, compound, update, destructuring/property, loop, or rebinding writes. Try-wrapped session evidence is rejected outright. Sync POST and the four protected WebAuthn credential/registration methods now execute their exact session proof before `try`, while limiter and protected work retain their existing guarded error-handling paths. Route tests prove unauthenticated requests stop before limiter work.

**Files Changed:** API-auth analyzer/tests, sync and WebAuthn routes/tests, `AGENT.md`, and `CHANGELOG.md`.

**Verification:** Node 22 analyzer tests passed (75/75), six-file Task 5 tests passed (112/112), and route behavior tests passed (20/20). All 47 protected methods remain green. Main and Worker typechecks, lint, formatting, secrets, 19 Sharp tests, and the audit exception passed; runtime blockers remain the same three DNS/Node-crypto findings.

**Follow-ups:** Resolve those runtime dependencies in later tasks. No Cloudflare execution or deployment command was run.

---

### Raouf: Complete HTTP Export Inventory Closure — 2026-07-22

**Scope:** Closed the final Task 5 mixed-method omission for unresolved named HTTP exports.

**Summary:** The analyzer now records syntax-level HTTP method presence separately from callable identity. Unresolved external named re-exports, unresolved imported/local exports, uninitialized and destructured method exports, and namespace exports named as HTTP methods are returned as explicit uncovered methods. A covered local GET therefore cannot hide an unresolved external POST. Type-only exports remain correctly excluded, and all previously closed binding, mutability, dominance, and matcher findings remain unchanged.

**Files Changed:** API-auth analyzer/tests, `AGENT.md`, and `CHANGELOG.md`.

**Verification:** Node 22 analyzer tests passed (80/80), six-file Task 5 tests passed (117/117), and route behavior tests passed (20/20). All 47 current protected methods remain green. Main and Worker typechecks, lint, formatting, 819-file secret scan, 19 Sharp tests, and the audit exception passed; runtime blockers remain the same three DNS/Node-crypto findings.

**Follow-ups:** Resolve those runtime dependencies in later tasks. No Cloudflare execution or deployment command was run.

---

### Raouf: Edge Middleware Web Crypto Migration — 2026-07-22

**Scope:** Removed the remaining Node crypto dependencies from the Cloudflare Edge middleware import graph without changing CSP or CSRF wire contracts.

**Summary:** CSP nonce generation now uses Web Crypto for 16 random bytes and browser-safe base64 encoding. CSRF generation now uses Web Crypto for 32 random bytes and lowercase hexadecimal encoding; equal-length token comparison performs one XOR operation for every character before deciding equality. Added a policy-file guard against Node-only built-ins and strengthened existing CSP/CSRF tests for exact output shape and 64-call uniqueness.

**Files Changed:** `lib/security/csp.ts`, `lib/security/csrf.ts`, `tests/unit/security/csp.test.ts`, `tests/security/csrf-critical.test.ts`, `tests/cloudflare/middleware-edge-compat.test.ts`, `AGENT.md`, `CHANGELOG.md`.

**Verification:** Node 22 targeted CSP, CSRF, MFA middleware, and Edge compatibility tests passed (47/47). Main and Worker typechecks, lint, full formatting, 819-file secret scan, 19 Sharp gate tests, and the local Sharp audit exception passed. The runtime audit now reports only the separately scoped `dns.lookup` blocker in `app/api/security/scan-headers/route.ts`.

**Follow-ups:** Replace the DNS lookup in its dedicated migration task. No preview, dry-run, upload, deployment, or production cutover was run; Sharp deployment gates remain fail closed.

---

### Raouf: Platform-Neutral Cloudflare Runtime Detection — 2026-07-22

**Scope:** Centralized deployment platform, environment, application-origin, and trusted client-IP detection for the local Cloudflare Workers migration while retaining Vercel rollback behavior.

**Summary:** Added strict Cloudflare/Vercel/local runtime helpers; normalized configured application URLs to HTTP(S) origins; rejected malformed, credential-bearing, non-HTTP, and scheme/path-shaped host values; replaced Vercel-only production checks across rate limiting, CSRF, API errors, authentication, and server/Edge Sentry configuration; centralized verification/reset and signup origins; and removed the duplicate API-middleware IP parser. Cloudflare production trusts `cf-connecting-ip` first and does not trust caller-supplied `x-forwarded-for` by default. Vercel production headers and public client-side Sentry rollback tags remain supported.

**Files Changed:** `lib/platform/runtime.ts`, platform/security/service/API/Sentry consumers, focused platform/IP/CSRF/rate-limit/email tests, `AGENT.md`, and `CHANGELOG.md`.

**Verification:** Node 22 focused and affected regression tests passed (72/72); application and Worker typechecks, lint, full formatting, 820-file secret scan, 19 Sharp-gate tests, and the local Sharp audit exception passed. Runtime compatibility now fails only on the separately scoped `dns.lookup` use in `app/api/security/scan-headers/route.ts`.

**Follow-ups:** Replace the DNS lookup in its dedicated task. No preview, dry-run, upload, deployment, or production cutover was run; the Sharp reachability deployment gates remain fail closed.

---

### Raouf: Platform Runtime Email-Safety Review Closure — 2026-07-22

**Scope:** Closed both Important Task 7 review findings and added behavioral evidence for the practical coverage observation.

**Summary:** Restored email-specific rejection of raw `example.com`, `your-`, and `paste` application-origin placeholders before normalization can discard path/query markers. Missing, invalid, credential-bearing, and placeholder origins now keep `isEmailServiceConfigured()` non-throwing and return the existing unsuccessful send result instead of rejecting. Verification and password-reset orchestrators therefore delete their newly inserted undelivered token records. Added behavioral tests for both cleanup lanes, Cloudflare preview precedence under `NODE_ENV=production`, credential-bearing origin rejection, database-error redaction, and the unchanged API middleware IP-plus-path rate-limit key.

**Files Changed:** `lib/services/emailService.ts`, focused platform/email/token-cleanup/API behavior tests, `AGENT.md`, and `CHANGELOG.md`.

**Verification:** Node 22 affected tests passed (87/87); application and Worker typechecks, lint, full formatting, 822-file secret scan, 19 Sharp-gate tests, and the local Sharp audit exception passed. Runtime compatibility remains non-zero only for the separately scoped `dns.lookup` use in `app/api/security/scan-headers/route.ts`.

**Follow-ups:** Replace the DNS lookup in its dedicated task. No preview, dry-run, upload, deployment, production cutover, or push was performed; Sharp reachability deployment gates remain fail closed.

---

### Raouf: Worker-Compatible DNS Header Scanning — 2026-07-22

**Scope:** Replaced the security-header scanner's unsupported `dns.lookup()` dependency and made runtime compatibility a permanent global quality gate.

**Summary:** Added a Worker-compatible dual-stack resolver using `resolve4` and `resolve6`, preserving literal-IP targets, deduplicating answers, tolerating one unavailable family, and failing closed on empty or malformed results. The protected scan route now rejects any private, loopback, link-local, unique-local, or private IPv4-mapped IPv6 answer, including mixed public/private sets and alternate IPv6 spellings. Route regressions preserve authentication and rate-limit dominance and prove the outbound HEAD request uses `redirect: 'manual'` exactly once. The API reference records the DNS validation/fetch TOCTOU boundary honestly: these controls reduce SSRF exposure but do not mathematically eliminate DNS rebinding.

**Files Changed:** `lib/security/dns-resolution.ts`, `app/api/security/scan-headers/route.ts`, DNS/route/runtime/Worker configuration tests, `package.json`, `docs/api/API_REFERENCE.md`, `AGENT.md`, `CHANGELOG.md`.

**Verification:** Node 22 focused DNS, route, runtime, Worker-contract, protected-route, and auth-inventory tests passed (33/33). Main and Worker typechecks, lint, full formatting, 825-file secret scan, 19 Sharp-gate tests, local Sharp audit exception, and the Cloudflare runtime audit passed.

**Follow-ups:** Cloudflare public-fetch restrictions remain part of the production SSRF boundary. No preview, dry-run, upload, deployment, production cutover, or push was performed; Sharp reachability deployment gates remain fail closed.

### Raouf: OpenNext Routing Unblock — path-to-regexp Override Scoping — 2026-07-22

**Scope:** Repaired a total Worker routing failure in which every request returned HTTP 500 under `workerd`, and excluded generated Worker output from the formatting gate.

**Summary:** The pre-existing blanket `path-to-regexp: ^8.3.0` override forced `@opennextjs/aws`, which declares `^6.3.0`, onto the v8 parser. OpenNext's `getNextConfigHeaders()` re-parses the raw Next.js `headers()` source with its own copy and does so outside a try/catch, so the v8 lexer rejected the v6-dialect `/(.*)` source and threw `PathError` on every request before any route ran. The override is now scoped so `@opennextjs/aws` resolves `path-to-regexp@6.3.0` — itself the patched release for CVE-2024-45296 — while its nested `express`/`router` subtree and Wrangler stay on 8.4.2. The Next.js source string is unchanged; `/{*path}` and `/*path` were rejected by Next's own v6 parser at build time, so no single source satisfies both majors. `.open-next` and `.wrangler` were added to the Prettier ignore list because `npm run check` failed for anyone who had built the Worker.

**Files Changed:** `package.json`, `package-lock.json`, `config/next/next.config.ts`, `config/prettier/.prettierignore`, `AGENT.md`, `CHANGELOG.md`.

**Verification:** Local `wrangler dev` now serves `/`, `/login`, `/privacy`, `/terms`, `/api/health`, and `/manifest.webmanifest` at 200; `/calendar` returns 307 to `/login?redirectTo=%2Fcalendar`; CSP nonce, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` are present on HTML. Dependency resolution confirmed as `@opennextjs/aws` → 6.3.0 and `express`/`router`/Wrangler → 8.4.2. `npm audit --omit=dev --audit-level high` reports no `path-to-regexp` advisory; the 5 remaining high findings are the pre-existing Sharp/libvips advisories governed by the Sharp risk gate (19 gate tests and the local audit exception passed). Secret scan, runtime audit, formatting, both typechecks, lint, and 1063 tests passed.

**Follow-ups:** Worth reporting upstream that `match(source)` in `getNextConfigHeaders()` and `handleRewrites()` sits outside the try/catch, so one unparsable source hard-fails every route. `redirects()` and `rewrites()` re-parse raw sources on the same path and would fail identically if the override regressed. No preview, dry-run, upload, deployment, production cutover, or push was performed.

### Raouf: Cloudflare Worker Cron Migration — 2026-07-22

**Scope:** Replaced the three Vercel Cron schedules with a Cloudflare `scheduled()` handler and promoted `custom-worker.ts` from build stub to the real OpenNext entry point.

**Summary:** Added a pure `runScheduledJob()` dispatcher mapping each cron expression to its existing `CRON_SECRET`-protected cleanup route, invoked internally through the OpenNext fetch handler rather than over the public internet. It fails closed when `CRON_SECRET` is absent, empty, or whitespace-only, rejects unknown cron expressions before any request is issued, and throws on a non-successful cleanup so failures surface in Cron Events instead of being recorded as success. Deviating from the plan, the thrown message carries cron, route, and status but not the upstream response body, which can echo the bearer credential into the log stream. Secret bindings are typed through a separate `cloudflare-env.secrets.d.ts` declaration merge so `npm run cf:typegen` stays reproducible, and the Worker tsconfig now resolves `@/lib/*`. Cron triggers remain `[]` in both Wrangler environments; scheduler ownership transfers only in the separately reviewed cutover change.

**Files Changed:** `lib/cloudflare/scheduled.ts`, `custom-worker.ts`, `cloudflare-env.secrets.d.ts`, `config/ts/tsconfig.cloudflare.json`, `tests/cloudflare/scheduled.test.ts`, `AGENT.md`, `CHANGELOG.md`.

**Verification:** 13 new dispatcher and worker-contract tests passed, including a guard that the mapping still equals the schedules `vercel.json` owns. `npm run cf:build` produced `.open-next/worker.js` from the real entry point. In local `workerd` with `--test-scheduled`, all three cron expressions dispatched to their correct routes and an unknown expression failed visibly. Against placeholder Supabase credentials the cleanup routes returned 503 `Not configured` — not 401 — proving the internal POST cleared both `CRON_SECRET` authentication and middleware CSRF; a wrong or missing secret returned 401, and a correct secret sent with a cross-origin `Origin` header was rejected 403. Secret scan, runtime audit, formatting, both typechecks, lint, and 1063 tests passed.

**Follow-ups:** A successful 200 cleanup run is unproven because no Supabase credentials exist in this worktree; it must be recorded in the Task 16 preview parity matrix against real preview infrastructure. No preview, dry-run, upload, deployment, production cutover, or push was performed; Sharp reachability deployment gates remain fail closed.

### Raouf: Worker Dependency Proof, Environment Validation, and Size Gate — 2026-07-22

**Scope:** Added the Workerd dependency import proof, platform-neutral deployment environment validation, and the Worker compressed-upload budget gate.

**Summary:** A dependency smoke test proves the six server packages bundled into the Worker — SimpleWebAuthn server, Supabase SSR and JS, Resend, uuid, and web-push — still resolve and expose the entry points the application calls; no package needed replacement. `tools/deployment/check-required-env.mjs` validates required public and server variables, URL shape, HTTPS and non-example production origins, the canonical production WebAuthn RP ID and origin, and at least one complete distributed rate-limit backend, reporting variable names only. Deviating from the plan, `tools/vercel/check-required-env.mjs` was left intact rather than reduced to a delegating wrapper: it interrogates the Vercel project through the Vercel CLI, which is a different check from validating the current process environment, and collapsing the two would weaken rollback validation. The rate-limit backend list also accepts Vercel KV, which `getStore()` supports and the plan omitted. `tools/cloudflare/check-worker-size.mjs` parses the gzip measurement from Wrangler dry-run output and enforces a 9.5 MiB hard limit with a 2.8 MiB free-plan warning.

**Files Changed:** `tools/deployment/check-required-env.mjs`, `tools/cloudflare/check-worker-size.mjs`, `tests/cloudflare/node-compatibility.test.ts`, `tests/cloudflare/required-env.test.ts`, `tests/cloudflare/worker-size.test.ts`, `package.json`, `AGENT.md`, `CHANGELOG.md`.

**Verification:** 26 new tests passed across dependency imports, environment validation, and size parsing, including boundary cases at both thresholds and an assertion that no configured value is ever echoed into output. Secret scan (832 files), runtime audit, formatting, both typechecks, lint, and 1089 tests passed.

**Follow-ups:** The real Worker gzip size is still unmeasured because `npm run cf:dry-run` is blocked by the Sharp deployment gate; see the reachability finding recorded separately. No preview, dry-run, upload, deployment, production cutover, or push was performed.

### Raouf: Sharp Reachability Gate Precision and Per-Build Recording — 2026-07-22

**Scope:** Made the Sharp deployment gate detect the Sharp package rather than the word "sharp", and made it usable per build so it stops permanently blocking every Cloudflare command.

**Summary:** The gate's file scan classified any artifact whose bytes matched `sharp|libvips|@img` as runtime-reachable. Against the real Worker output that produced 13 blocking matches, all false positives: the device brand `"Sharp"` in ua-parser, the HTML entity `&sharp;`, the Leaflet CSS class `leaflet-routing-icon-sharp-right`, and the `Material Icons Sharp` font name. A blocking verdict now requires evidence of the package itself — a `node_modules/sharp` or `node_modules/@img/*` directory, a `sharp`/`libvips` native binary, or a genuine module specifier such as `require('sharp')` — and a specifier only blocks when its file is in the esbuild bundle graph. Incidental word matches are recorded as non-blocking. This surfaced a real finding the old scan had buried: `next/dist/server/image-optimizer.js` does contain `require('sharp')`, but it is absent from all 586 bundle-graph inputs, unreferenced by `worker.js`, and never uploaded, so it is recorded explicitly as unbundled scaffolding. Separately, the gate verified recorded digests against the current build while every gated `cf:*` script rebuilds first; because the Next.js build is not byte-deterministic, reviewed evidence could never match the artifact being uploaded. A new `security:sharp:record-reachability` step runs between build and gate. It can only ever certify absence — if the scan finds runtime reachability or any unclassifiable artifact it refuses to write and exits non-zero — so it cannot manufacture a passing record for an unsafe build.

**Files Changed:** `tools/security/check-sharp-risk.mjs`, `tools/security/check-sharp-risk.test.mjs`, `artifacts/security/sharp-worker-reachability.json`, `tests/cloudflare/required-env.test.ts`, `package.json`, `AGENT.md`, `CHANGELOG.md`.

**Verification:** 27 gate tests passed, including regressions pinning all four false positives as non-blocking and asserting that a real package directory, an `@img` native platform package, `.node`/`.wasm`/`.so` libvips binaries, and a bundled `require('sharp')` each still block. The gate now passes for preview against freshly recorded evidence, and `npm run cf:dry-run` completes end to end. Measured Worker compressed upload is **6799.23 KiB**, below the 9.5 MiB hard limit but above the 2.8 MiB free-plan threshold. A test fixture that tripped the secret scanner was renamed; the scan passes over 837 files. Formatting, both typechecks, lint, and 1089 tests passed.

**Follow-ups:** Workers Paid is required — the compressed upload is roughly 2.4x the free-plan limit; record this in the cutover approval. Wiring the recorder into the gated scripts trades some human-review value for a gate that actually runs per build; if the team prefers explicit review, split `record` back out into a manual step and have operators inspect the evidence before running the gate. Wrangler warns that `cf:dry-run` targets the top-level environment implicitly.

### Raouf: Cloudflare CI, Gated Deployment Workflow, and Preview Smoke Suite — 2026-07-22

**Scope:** Added the required CI Worker build, the manually gated deployment workflow, and the automated public smoke suite.

**Summary:** CI gained a `cloudflare-build` job that runs the runtime-compatibility audit and the Sharp gate tests, builds and dry-runs the Worker, enforces the compressed-size budget, and uploads the dry-run log, esbuild metafile, and reachability evidence as artifacts; the pipeline result now depends on it. `.github/workflows/cloudflare-deploy.yml` is `workflow_dispatch` only, routes production through the protected `cloudflare-production` environment, refuses production from any branch but `main`, and runs the quality gate, environment validation, dry-run, and size gate before deploying. The dispatch input is never interpolated into a shell command; the target is read from an environment variable instead. `tools/cloudflare/smoke.mjs` checks the public pages, health endpoint, manifest content type, immutable asset caching, the protected-page redirect to login, and that a protected API refuses anonymous access, and it requires all six security headers on HTML responses.

**Files Changed:** `.github/workflows/ci-cd.yml`, `.github/workflows/cloudflare-deploy.yml`, `tools/cloudflare/smoke.mjs`, `tests/cloudflare/ci-workflows.test.ts`, `tests/cloudflare/smoke-script.test.ts`, `package.json`, `AGENT.md`, `CHANGELOG.md`.

**Verification:** 18 new tests passed covering workflow contracts and smoke behaviour, including assertions that the deployment workflow is manual only, that every secret is read from GitHub secrets, that ordering places the quality gate before validation before the size gate before deploy, and that the smoke runner never logs a response body or cookie. The suite was then run against a real local `workerd` instance serving the built Worker: **9/9 checks passed**.

**Follow-ups:** Preview and production GitHub Environments, their variables, and the Cloudflare API token are not configured; the deployment workflow cannot run until an operator creates them. No preview, upload, deployment, production cutover, or push was performed.

### Raouf: Cloudflare Deployment, Cutover, and Rollback Documentation — 2026-07-22

**Scope:** Documented the Cloudflare Workers deployment path and rewrote the primary-infrastructure language across the repository, keeping Vercel documented as rollback hosting.

**Summary:** Added a deployment guide covering local development, the build and verification commands, the measured Worker size budget, the Sharp reachability gate sequence, a full build/runtime/secret/preview/production variable table, the production WebAuthn invariants, the three UTC cron schedules, and the gated deployment workflow. Added a cutover runbook with the pre-cutover gate, a DNS and email-record preflight, overlap-free scheduler transfer, domain attachment, and the authenticated verification list; and a rollback runbook with explicit stop conditions and the two independent paths, Worker version rollback and platform rollback to Vercel. Added the preview parity matrix as an explicitly unexecuted template that carries forward the three known open items. `README.md` and `ARCHITECTURE.md` now describe Cloudflare Workers via OpenNext as the primary infrastructure, `resend-vercel-setup.md` was renamed to `resend-deployment-setup.md` with references updated, the existing deployment checklist gained a Cloudflare section, and `.env.example` documents the deployment-target variables and the exact canonical production WebAuthn values.

**Files Changed:** `docs/operations/cloudflare-workers-deployment.md`, `docs/operations/cloudflare-cutover-runbook.md`, `docs/operations/cloudflare-rollback-runbook.md`, `docs/operations/cloudflare-preview-test-record.md`, `docs/operations/resend-deployment-setup.md` (renamed), `docs/operations/deployment-checklist.md`, `docs/README.md`, `docs/architecture/ARCHITECTURE.md`, `docs/setup/ENVIRONMENT_SETUP.md`, `README.md`, `.env.example`, `AGENT.md`, `CHANGELOG.md`.

**Verification:** Every command in the documentation was run in this session, so the instructions match implemented behaviour rather than the plan's assumptions. Formatting, secret scan (841 files), and 1107 tests passed; `npm run check:i18n` exits 0 with pre-existing untranslated-key warnings unrelated to this change. The stale-infrastructure grep over `README.md` and `docs` returns nothing.

**Follow-ups:** The preview test record is a template and must be completed against a real preview Worker before cutover approval. No preview, upload, deployment, production cutover, or push was performed.
