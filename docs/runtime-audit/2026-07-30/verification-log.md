# Verification log — runtime audit 2026-07-30

All commands run from the repository root on macOS (Darwin 25.6.0).

## Toolchain

The repo requires Node `>=22 <23` (`.nvmrc` = 22). **The shell default was Node
v26.5.0**, which is outside that range, so every command in this audit was run
with `PATH="/opt/homebrew/opt/node@22/bin:$PATH"`:

| Tool                   | Version      |
| ---------------------- | ------------ |
| node                   | v22.23.2     |
| npm                    | 10.9.8       |
| next                   | 16.2.12      |
| wrangler               | 4.115.0      |
| @opennextjs/cloudflare | 1.20.2       |
| miniflare              | 4.20260722.1 |

`npm ci` was re-run under Node 22 before baselining, because the previous
install had been made with the out-of-range default and native ABI mismatches
would have made every result untrustworthy.

## Starting state

|                       |                                                                 |
| --------------------- | --------------------------------------------------------------- |
| Branch created        | `audit/full-runtime-hardening-2026-07-30`                       |
| Base commit           | `1301734f185c1aab3cd0b2112a010b75e585597a` (`main`)             |
| Working tree at start | clean                                                           |
| Test baseline         | 143 files / 1269 tests                                          |
| Migrations            | 78                                                              |
| Locales               | 35                                                              |
| API route handlers    | 65 under `app/api` (+3 non-API route handlers under `app/auth`) |

## Baseline gates — BEFORE any change

Recorded first, per the rule that baseline failures must be preserved as
evidence rather than repaired silently.

| Gate                             | Exit  | Time | Notes                                                       |
| -------------------------------- | ----- | ---- | ----------------------------------------------------------- |
| `check:secrets`                  | 0     | 1s   | 913 files scanned                                           |
| `check:cloudflare-runtime`       | 0     | 0s   |                                                             |
| `format:check`                   | 0     | 8s   |                                                             |
| `typecheck`                      | 0     | 3s   |                                                             |
| `typecheck:cloudflare`           | 0     | 1s   |                                                             |
| `lint`                           | 0     | 11s  | 1 pre-existing warning (unused `IdCard`)                    |
| `test`                           | 0     | 31s  | 143 files / 1269 tests                                      |
| `check:i18n`                     | 0     | 0s   | reports 34 locales × 8 missing keys; **exits 0 regardless** |
| `test:sharp-risk-gate`           | 0     | 0s   | 27/27                                                       |
| `security:sharp:audit-exception` | **1** | 0s   | **BASELINE FAILURE — see below**                            |
| `build`                          | 0     | 48s  |                                                             |

### The one baseline failure

```
Sharp audit-exception gate failed:
- Sharp dependency path changed at next@16.2.11 -> optional sharp.
- Sharp dependency path changed at wrangler@4.113.0 -> miniflare.
- Sharp dependency path changed at miniflare@4.20260721.0 -> sharp.
- Approved registry provenance or integrity changed for Next 16.2.11.
- Approved registry provenance or integrity changed for Wrangler 4.113.0.
```

This was not reporting-only. `evaluateDeploymentGate` delegates to
`evaluateAuditException`, so the deploy path inherited it:

```
$ node tools/security/check-sharp-risk.mjs deployment production   -> EXIT 1
$ node tools/security/check-sharp-risk.mjs deployment preview      -> EXIT 1
```

Every gated `cf:*` script (`cf:dry-run`, `cf:preview`, `cf:upload`,
`cf:deploy`, `cf:deploy:production`) was therefore blocked for both profiles:
**production could not be released.** Filed as RTA-0001.

Note that `npm run check` exits 0 while this is broken — it does not include
`security:sharp:audit-exception` or `check:worker-size` (RTA-0012).

### Supply-chain baseline

`npm audit`: **5 high**, 0 critical, 0 moderate/low, reducing to two root
causes — `postcss` (2 advisories, fixed in 8.5.18, pinned to 8.5.10 by an
override) and `sharp`/libvips (4 CVEs). npm's proposed remedy for both was
`next@14.2.35`, a semver-major downgrade from 16.2.12.

Two `sharp` copies exist: `node_modules/sharp` 0.34.5 (Next's **optional**
build-time image dependency — the advisory-affected one) and
`node_modules/miniflare/node_modules/sharp` 0.35.2 (**outside** the `<0.35.0`
advisory range, so contributing no exposure).

### CI baseline

`gh run list` showed the CI/CD Pipeline **failing on both recent commits**
(`1301734f`, `6d9a3ac9`). Job outcomes for run 30513673331:

| Job                     | Result                        |
| ----------------------- | ----------------------------- |
| Test Suite (22.x)       | success                       |
| Security Checks         | **failure** (`Run npm audit`) |
| Production Build        | **skipped**                   |
| Cloudflare Worker Build | **skipped**                   |
| Lighthouse Performance  | **skipped**                   |

`build` and `cloudflare-build` both declare `needs: [test, security]`, so one
unactionable advisory skipped all build and Worker verification — which is why
the deploy-blocking RTA-0001 was invisible to CI. Filed as RTA-0002.

## Live production checks (read-only)

Performed against production with GET/HEAD only. No accounts created, no mail
sent, no data modified, no fuzzing.

| Check                                      | Result                                                                                                                                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `https://www.syllabus-sync.app/login`      | HTTP/2 200, `server: cloudflare`                                                                                                                                                                                         |
| Security headers (dynamic)                 | HSTS preload, CSP with per-request nonce, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` — all single-valued, no duplication |
| `Cache-Control` on `/login`                | `private, no-cache, no-store, max-age=0, must-revalidate`                                                                                                                                                                |
| Static asset `/icons/icon-192.png`         | 200 + the four baseline security headers + `immutable` cache                                                                                                                                                             |
| `/api/health`                              | `{"success":true,"data":{"status":"healthy","database":"connected"}}`                                                                                                                                                    |
| Protected page `/home` unauthenticated     | 307 → `/login?redirectTo=%2Fhome`                                                                                                                                                                                        |
| Protected API `/api/units` unauthenticated | 401                                                                                                                                                                                                                      |
| Unknown API `/api/does-not-exist`          | 401 (deny-by-default precedes routing)                                                                                                                                                                                   |
| Malformed JSON → `/api/auth/signup`        | 400                                                                                                                                                                                                                      |
| `DELETE /api/health`                       | 405                                                                                                                                                                                                                      |
| Apex `https://syllabus-sync.app/`          | 308 → www, `server: Vercel` (RTA-0017)                                                                                                                                                                                   |
| `/manifest.webmanifest`                    | `content-type: application/manifest+json, application/manifest+json` — **doubled** (RTA-0009)                                                                                                                            |

## Final gates — AFTER all changes

| Gate                             | Exit  | Time | Result                                                                                              |
| -------------------------------- | ----- | ---- | --------------------------------------------------------------------------------------------------- |
| `check:secrets`                  | 0     | 0s   |                                                                                                     |
| `check:cloudflare-runtime`       | 0     | 1s   |                                                                                                     |
| `format:check`                   | 0     | 7s   |                                                                                                     |
| `typecheck`                      | 0     | 4s   | (first run exited 2 — TS2493 in a new test; fixed in `81261c12`)                                    |
| `typecheck:cloudflare`           | 0     | 1s   |                                                                                                     |
| `lint`                           | 0     | 12s  | same 1 pre-existing warning                                                                         |
| `test`                           | 0     | 24s  | **147 files / 1289 tests** (from 143/1269)                                                          |
| `test:coverage`                  | 0     | 28s  | statements 53.33, branches 43.51, functions 55.98, lines 53.77 — all above thresholds (50/39/50/50) |
| `check:i18n`                     | 0     | 0s   | unchanged 8-key gap; no new drift                                                                   |
| `test:sharp-risk-gate`           | 0     | 0s   | 27/27                                                                                               |
| `security:sharp:audit-exception` | **0** | 0s   | **baseline failure resolved**                                                                       |
| `build`                          | 0     | 38s  | compiled successfully                                                                               |
| `cf:dry-run`                     | **0** | 57s  | Worker 6791.21 KiB gzip                                                                             |
| `cf:dry-run:production`          | **0** | 76s  | **production deploy path verified**                                                                 |
| `check:worker-size`              | 0     | —    | 6791.21 KiB; prints a free-plan warning and exits 0 (paid tier)                                     |

`npm audit` after the postcss fix: **4 high** (from 5), all one root cause
(sharp/libvips via Next's optional image dependency).

## Commands attempted and blocked

| Command                                                            | Why not run                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wrangler secret list --env production`                            | The available OAuth token lacks secret-read permission in the account holding the zone, and `CLOUDFLARE_API_TOKEN` is not set in this shell. Worker config was therefore read from `wrangler.jsonc`; no secret value was ever printed or requested. |
| `cf:deploy` / `cf:preview` / `cf:upload`                           | Deployment is explicitly out of scope. Only `--dry-run` was used.                                                                                                                                                                                   |
| `npx supabase db push`                                             | Migrations must not be applied. No live database was contacted.                                                                                                                                                                                     |
| Live catalogue queries (`pg_cron` job list, RLS/definer state)     | Not performed in this pass. RTA-0010 and RTA-0011 are therefore assessed from the migration chain only and are marked accordingly.                                                                                                                  |
| Authenticated production flows (signup, login, passkey, MFA, push) | Would create real accounts and send real mail. Deferred to `manual-production-smoke-checklist.md`.                                                                                                                                                  |
| `npm run lighthouse`                                               | Requires a running server and would not add signal beyond the build.                                                                                                                                                                                |

## Per-file review coverage

The scope manifest distinguishes files **read in full** from files covered only
by **automated extraction**. Eight read-only subagents were dispatched to read
every file in the runtime-relevant tree — auth API, remaining API, `lib/` +
middleware + Worker entry, the full ordered migration chain, `app/` pages and
server actions, `features/` + `components/` + the service worker, `config/` +
`tools/` + CI + deploy config, and the `tests/` tree. Their per-file verdicts
are what the manifest records; the machine-generated inventories
(`runtime-inventory.csv`, `route-security-matrix.csv`,
`environment-contract.csv`, `external-io-matrix.csv`,
`database-security-matrix.csv`) are enumeration, not review, and are labelled as
such.

## Git state

```
$ git log --oneline main..HEAD
81261c12 test(security): type the HIBP fetch spy so tsc can index its call args
8b8c5f0e fix(security): bound the HIBP breach lookup so it cannot hang signup
afe854ee fix(cloudflare): stop serving a doubled Content-Type on the webmanifest
46c0d4ed fix(deps): clear both PostCSS advisories by unpinning postcss from 8.5.10
d7036029 test(cloudflare): pin cron ownership, incl. the orphaned push-reminders route
999a11c9 fix(security): fail closed when the WebAuthn origin/RP anchors are unset (BA-0003)
59e1894b fix(auth): make password-reset and email-verify tokens genuinely single-use (BA-0006)
b0b8cd7a fix(security): re-approve the Sharp supply-chain gate so production can deploy
```

Nothing was pushed. Nothing was deployed. No secret was printed, logged, or
committed.

## Migration applied to production — 2026-07-30

The hardening migration was applied on the owner's explicit instruction, using
the Supabase CLI. Recorded here in full, including the first attempt failing.

**Pre-check.** `supabase migration list --linked` showed exactly one pending
migration — `20260730180000`, with an empty `remote` column. Every other entry
matched local↔remote, so `db push` could only apply this one file. That check
mattered: a backlog would have dragged in the chain's known replay blockers.

**First attempt: FAILED, and rolled back cleanly.**

```
Applying migration 20260730180000_...sql
LegacyDbPushApplyError: Failed to execute statement. At statement: 3
```

My bug. I had guarded the DDL block against `audit_settings` being absent but
left the verification block asserting `'public.audit_settings'::regclass`, which
raises 42P01 when the table does not exist. Confirmed the rollback was atomic
before retrying: both target functions still `UNPINNED` with
`anon,authenticated` EXECUTE, and `schema_migrations` still topped out at
`20260730160000` — the migration was not recorded. Failing closed rather than
half-applying is the designed behaviour and it held.

**Second attempt: applied.** The Docker errors in the output are a warning about
caching a local migrations catalog, not the apply.

**Post-apply verification (read-only):**

| Check                                           | Result                                                            |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| `schema_migrations` head                        | `20260730180000`                                                  |
| `purge_deleted_records(integer)`                | `search_path=public`; client EXECUTE **NONE**                     |
| `refresh_analytics_views()`                     | `search_path=public`; client EXECUTE **NONE**                     |
| `service_role` EXECUTE on both                  | **retained** — not over-revoked                                   |
| `definers_unpinned`                             | **6 → 0**                                                         |
| `tables_without_rls`                            | 0                                                                 |
| Live triggers on `profiles`/`units`/`deadlines` | all three still attached, `tgenabled = 'O'`, functions now pinned |
| `cf:smoke`                                      | **9/9 passed**                                                    |
| `/api/health`                                   | `status: healthy`, `database: connected`                          |

The `audit_settings` block was a no-op in production, as expected — the table
does not exist there. It remains correct for a chain-built environment.
