# Executive summary — full runtime audit, 2026-07-30

|                   |                                                                 |
| ----------------- | --------------------------------------------------------------- |
| Commit audited    | `1301734f185c1aab3cd0b2112a010b75e585597a` (`main`)             |
| Branch            | `audit/full-runtime-hardening-2026-07-30`                       |
| Toolchain         | Node 22.23.2 (the shell default was v26.5.0, outside `engines`) |
| Baseline          | 143 test files / 1269 tests; one pre-existing gate failure      |
| Final             | 152 test files / 1319 tests; full gate exit 0                   |
| Commits           | 13, atomic                                                      |
| Pushed / deployed | **No.** Nothing pushed, nothing deployed, no migration applied  |

## Verdict

**PASS WITH DEFERRED RISKS.**

Every P0 and P1 that could be closed by a code change is closed and verified.
Three items remain open and are genuinely the owner's to decide — two of them
active production problems, one an unapplied migration.

## The three things that matter most

**1. A P0 unauthenticated account takeover, now fixed.**
`/api/webauthn/authenticate/verify` derived the user's identity from the
challenge row but the verifying public key from an unfiltered global
`credential_id` lookup, and never checked that the two agreed. An attacker could
request a challenge for a victim's email, sign it with their own authenticator,
and be handed a session cookie for the victim — no password, no MFA, no victim
interaction, only the victim's email address and the fact that they own a
passkey. `/api/webauthn/authenticate/` is on the middleware's public allowlist,
so the edge never saw the request. `credential_id` is UNIQUE, so it was
deterministic. Two independent review lanes found it separately and it was
re-verified line by line before any change. **No test covered that route at
all** — which is the shape of the wider gap described below.

**2. Production was undeployable, and CI could not see it.**
The Sharp supply-chain gate still approved Next 16.2.11 / Wrangler 4.113.0 while
the committed lockfile installs 16.2.12 / 4.115.0. Because
`evaluateDeploymentGate` delegates to `evaluateAuditException`, this was not a
reporting-only failure: every gated `cf:*` script — dry-run, preview, upload,
deploy — failed closed on **both** profiles. Meanwhile CI's `Security Checks` job
fails on the formally accepted Sharp advisories, and `build` and
`cloudflare-build` both `needs: [test, security]`, so **Production Build,
Cloudflare Worker Build and Lighthouse have all been skipped**. No build
verification has run at all, which is exactly why the deploy breakage was
invisible. The gate is re-approved and both dry-runs now pass; the CI topology is
the owner's call (R1).

**3. Deadline reminders silently do not fire.**
BA-0016 correctly removed the GitHub Actions schedule that was the only caller of
`/api/cron/push-reminders` — it had failed every 10 minutes with 0 successes in
its last 300 runs. But the route was never adopted into the Cloudflare triggers,
which carry only the three cleanup expressions. The feature went from _duplicated_
to _orphaned_, and it fails with no failing job to notice. Pinned as a test
invariant rather than enabled, because enabling resumes real push delivery to
real users (R2).

## Findings

34 ledger entries. Severity counts include the disproved rows, which are recorded
deliberately so future auditors do not re-chase them.

| Severity | Count | Fixed | Deferred / validated | Disproved |
| -------- | ----- | ----- | -------------------- | --------- |
| P0       | 1     | 1     | —                    | —         |
| P1       | 6     | 2     | 2                    | 2         |
| P2       | 12    | 6     | 6                    | —         |
| P3       | 9     | —     | 8                    | 1         |
| P4       | 2     | —     | 2                    | —         |

### Fixed and fully verified

| ID       | Sev | Title                                                              | Commit     |
| -------- | --- | ------------------------------------------------------------------ | ---------- |
| RTA-0026 | P0  | Cross-user WebAuthn credential confusion → account takeover        | `1073e4da` |
| RTA-0001 | P1  | Sharp gate blocked every `cf:*` deploy path                        | `b0b8cd7a` |
| RTA-0029 | P3  | `audit_settings` RLS gap — **downgraded, replay-only** (see below) | `f6ea500e` |
| RTA-0004 | P2  | Reset/verify tokens double-spendable (BA-0006)                     | `59e1894b` |
| RTA-0005 | P2  | WebAuthn origin check was circular (BA-0003)                       | `999a11c9` |
| RTA-0006 | P2  | HIBP lookup unbounded — could hang signup                          | `8b8c5f0e` |
| RTA-0007 | P2  | PostCSS pinned to a vulnerable version                             | `46c0d4ed` |
| RTA-0027 | P2  | Open redirect + session fixation on `/auth/confirm`                | `e8ce242c` |
| RTA-0028 | P2  | Rate-limit store + weather fetches unbounded                       | `10a13cc5` |
| RTA-0009 | P2  | Webmanifest served a doubled `Content-Type`                        | `afe854ee` |
| RTA-0003 | P1  | push-reminders has no scheduler (**gap pinned, not closed**)       | `d7036029` |

### Disproved — recorded so they are not re-derived

- **"11 UPDATE policies lack `WITH CHECK`, allowing row-ownership reassignment"**
  (reported P1). PostgreSQL applies the `USING` expression to the **new** row when
  `WITH CHECK` is omitted, so `USING (auth.uid() = user_id)` already blocks
  reassignment. Worth recording carefully, because migration `20260730090000`
  (BA-0035) states the same incorrect rationale — the misconception is embedded in
  the repo. The genuine residual is that a user can reset their own spent backup
  codes' `used` flag, which changes no `user_id` (RTA-0032, latent — that module
  is unmounted).
- **"push-reminders cron is failing every 10 minutes"** — all failing runs predate
  the merge; BA-0016 had already removed the trigger. The real residual is the
  opposite problem (R2).
- **"`recent_audit_activity` / `security_audit_events` lack `security_invoker`"** —
  applied by a later migration than the `CREATE`, so a naive static pass
  mis-flags them.

## Live database verification — and a correction to my own P1

The database findings were originally reconstructed from the migration chain
alone. They have since been settled with **read-only catalogue queries against
production** (`supabase db query --linked`; no write, no migration applied), and
the chain turned out to disagree with production in both directions.

**I had to downgrade my own P1.** `audit_settings`, `cleanup_old_audit_logs()`
and `add_sample_class_times()` **do not exist in production**, and **no public
table lacks RLS** (0 rows). The audit-trail-destruction chain I filed is real
only for an environment built from the migration chain — a `supabase db reset`,
staging, or a DR rebuild. RTA-0029 is now P3, replay-only.

That same verification caught **a real bug in my own migration**: the
`ALTER TABLE public.audit_settings ...` was unguarded and would have raised
42P01 and aborted the push against production. It is now guarded.

**What is genuinely live instead (RTA-0033, P2):**
`purge_deleted_records(integer)` and `refresh_analytics_views()` are SECURITY
DEFINER, have no ownership check, have an unpinned `search_path`, and hold
`EXECUTE` for **both `anon` and `authenticated`** — verified through
`information_schema.role_routine_grants`. Neither has any application caller
(the only repository mentions are generated entries in `database.types.ts`).
`purge_deleted_records` takes a caller-controlled window, so a negative
`p_days_old` moves the cutoff into the future and hard-deletes every
soft-deleted row for every user. `20260114013519` issued only
`REVOKE ... FROM PUBLIC`, which BA-0032 had already established does not remove
Supabase's direct grants.

**Other things the queries settled:**

| Question                                                          | Answer                                                                                                                                                                                            |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `log_audit` overload ambiguity (RTA-0034)                         | **Disproved.** Production holds only the 10-arg form; no ambiguity. Replay-only.                                                                                                                  |
| pg_cron duplicating Cloudflare crons (RTA-0035)                   | **Confirmed live.** Installed, with two ACTIVE jobs at `0 3` and `10 3` — the exact Cloudflare expressions. The `*/15` webauthn-challenge job is absent, so that cleanup has **no owner at all**. |
| Unpinned `search_path` exploitable?                               | **No.** `anon`/`authenticated` hold USAGE but **not CREATE** on `public` and `extensions`, so a client role cannot hijack resolution. Defence-in-depth, as filed.                                 |
| BA-0030's "production still has all sixteen always-true policies" | **Resolved.** Only the documented `xp_config` exception remains.                                                                                                                                  |
| Objects production has that the chain lacks (RTA-0036)            | `favorite_buildings` and `edge_response_cache` — both with RLS on. The chain cannot rebuild production.                                                                                           |

**RTA-0031 is now proven, not argued.** Rather than rest on documentation, I ran
an RLS probe on a session-local temp table. The first attempt was **vacuous** —
`supabase db query` connects as `postgres`, which has `rolbypassrls`, so RLS
never applied and the reassignment "succeeded". Re-run under `SET ROLE
authenticated`, it was **BLOCKED**: `new row violates row-level security policy`,
with the value unchanged. PostgreSQL does apply `USING` to the new row when
`WITH CHECK` is omitted, so the reported reassignment vulnerability does not
exist — and migration `20260730090000` (BA-0035) states the same incorrect
rationale.

## Systemic pattern worth naming

The repo tests the controls _surrounding_ each credential operation extremely
well, and the operation itself hardly at all. Challenge issuance, challenge
single-use atomicity, RP-ID anchoring and enumeration resistance are all
genuinely covered — and the verify handler that consumes them had no test, which
is where the P0 lived. The same shape holds one layer up: every route is proven
to _call_ `requireAuth`, and `requireAuth` is never proven to _deny_ (it is
mocked away by the five tests that depend on it, and excluded from coverage).

## Verification

Full gate exit 0 after all changes: `check:secrets`, `check:cloudflare-runtime`,
`format:check`, `typecheck`, `typecheck:cloudflare`, `lint`, `test`
(152 files / 1319 tests), `test:coverage` (53.3 / 43.5 / 56.0 / 53.8, all above
thresholds), `check:i18n`, `test:sharp-risk-gate` (27/27),
`security:sharp:audit-exception`, `build`, `cf:dry-run`, **and
`cf:dry-run:production`** — the last three being the ones that previously could
not pass. Worker 6791 KiB gzip, under the enforced ceiling.

Every fix ships a regression test that was confirmed to fail against the pre-fix
code for the expected reason. Live production was checked read-only only: no
account created, no mail sent, no data modified, no fuzzing.

## Production actions required

1. **Deploy.** Several fixes cannot take effect otherwise — `public/_headers`
   ships with the static assets, and the gate re-approval only matters at deploy.
2. **Apply the migration** `20260730180000_close_audit_settings_rls_and_unguarded_definers.sql`.
   It ships unapplied by design and carries its own failing verification block.
   Its live value is revoking `anon`/`authenticated` EXECUTE on
   `purge_deleted_records` and `refresh_analytics_views` (RTA-0033) and pinning
   `search_path` on the six unpinned definers; the `audit_settings` block is a
   guarded no-op in production and corrects a chain-built environment.
3. **Run `manual-production-smoke-checklist.md`** — the flows that need real
   accounts, real mail and real authenticators, including the live signup on
   Workers that has still never been exercised.
4. **Decide the CI advisory policy** (R1) so build verification runs again.
5. **Decide whether to enable the push-reminders trigger** (R2).

## Deferred risks

Eleven open risks plus four lower-priority items in
`remaining-risk-register.md`. The ones with dates attached: the Sharp exception
**expires 2026-08-22** and will block deploys by design, and Vercel was retained
as rollback target only until **2026-08-05** while the apex is still served by
it. Also notable: server and edge Sentry never initialise (there is no root
`instrumentation.ts`, and `@sentry/nextjs` auto-injects only the client config),
so no server-side error reaches Sentry despite both `SECURITY.md` and
`CLAUDE.md` claiming that coverage — which also makes BA-0018's fix moot.

## Coverage honesty

Eight read-only agents read every file in the runtime-relevant tree and returned
per-file verdicts; `scope-manifest.txt` records those. The five CSV matrices are
machine-generated **enumeration, not review**, and are labelled as such. Four
bulk data files (`buildings.ts`, `locations.ts`, `gcpCalibration.ts`,
`realtimeNavigation.ts`) were reviewed structurally rather than line by line, and
that is flagged rather than overclaimed. Findings that rest on an assumption I
could not test — `pg_cron` being installed, `CREATE` being revoked on `public`,
whether preview shares production's Supabase project — say so instead of
resolving in the project's favour.

Two findings in this report came from the matrices rather than from reading code:
the unbounded HIBP fetch was found by inventorying every outbound host and
checking each caller for a timeout, and the doubled webmanifest `Content-Type`
was confirmed against live production.
