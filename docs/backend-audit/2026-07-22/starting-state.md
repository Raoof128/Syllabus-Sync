# Backend Deep Audit — Starting State

**Audit branch:** `audit/backend-hardening-cloudflare`
**Parent branch:** `feat/cloudflare-workers-migration`
**Starting commit:** `cefc79e6` (`docs(cloudflare): record the production cutover`)
**Worktree:** `/Users/raoof.r12/Desktop/Raouf/MQ_Research/Syllabus-Sync-backend-audit`
**Reviewer:** claude-opus-5
**Phase 0 executed:** 2026-07-29 (Australia/Sydney)

---

## 1. The master prompt predates the production cutover

The audit prompt is dated 2026-07-22. On 2026-07-29, before this audit began, the
application was cut over to Cloudflare Workers in production. Three prompt
statements are therefore historically superseded:

| Prompt statement                                                                        | Actual state at audit start                                                   |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| §3.5 "Do not deploy, change DNS, modify production Cloudflare bindings, disable Vercel" | All four already occurred on 2026-07-29 as an owner-directed cutover          |
| §3.22 "Keep Cloudflare production Cron disabled until the explicit scheduler handoff"   | Handoff completed; Vercel Cron disabled 06:31:41Z, Cloudflare triggers active |
| §2 "all 878 tests pass"                                                                 | 1107 tests across 115 files                                                   |

**These constraints remain binding for the audit itself.** No deployment, DNS
change, binding mutation, or production data change will be made by this audit.

**The risk posture is higher than the prompt assumes.** The audited code is
serving live production traffic at `https://www.syllabus-sync.app`, so findings
are production defects rather than pre-deployment defects. Cutover details are in
`docs/operations/cloudflare-cutover-record-2026-07-29.md`.

---

## 2. Baseline failed on first run, and the cause was recent local work

`npm run check` initially exited **1** with two failing tests:

```text
FAIL tests/cloudflare/worker-config.test.ts
  > uses the custom OpenNext worker with required compatibility flags
  AssertionError: expected [ '0 3 * * *', '10 3 * * *', …(1) ] to deeply equal []

FAIL tests/cloudflare/static-headers.test.ts
  > sets immutable caching for hashed Next assets and app icons
  AssertionError: expected '# Static assets are served straight f…'
    to contain 'Content-Type: application/manifest+js…'
```

Both were introduced by cutover-day changes on the parent branch, and neither was
caught because the full suite was not re-run after those edits — only `typecheck`
and `lint` were. This is recorded as a process failure, not an incidental detail:
**a production deployment was made on a commit whose test suite was red.**

### Repair

1. `tests/cloudflare/worker-config.test.ts` asserted `production.triggers.crons`
   equals `[]`, which encoded the _pre-cutover_ safety invariant. Production
   schedules are now intentionally active. The assertion was updated to require
   the exact three expressions and verified to match `CRON_ROUTE_BY_EXPRESSION`
   in `lib/cloudflare/scheduled.ts`, so it is stricter than before rather than
   weakened. The **preview** environment is still asserted empty, because only one
   environment may own a schedule against the shared Supabase backend.

2. `public/_headers` had its `Content-Type: application/manifest+json`
   declarations removed on cutover day in an attempt to stop `/manifest.webmanifest`
   returning a doubled `Content-Type`. **The removal did not stop the doubling**,
   so it was a behaviour change with no benefit that also broke an assertion. It
   has been reverted.

### Resulting baseline

```text
npm run check   → exit 0
Test Files      → 115 passed (115)
Tests           → 1107 passed (1107)
npm run check:i18n → exit 0
```

### Known drift from deployed production

Deployed production currently runs **without** the `Content-Type` lines in
`public/_headers`, because that state was deployed before the revert. The audit
branch restores them. The observable effect either way is a duplicated, identical
`Content-Type` header on `/manifest.webmanifest` — cosmetic, no security impact,
root cause still unidentified and tracked as an open item.

---

## 3. Verified toolchain and dependency provenance

```text
node    v22.16.0        (engines: >=22 <23 ✅)
npm     11.8.0
registry https://registry.npmjs.org/
npm ci  exit 0
```

Lockfile versions were checked against the registry for integrity, not just
version string. An earlier apparent mismatch was a defect in the checking script
(`npm view` with multiple fields prefixes each output line with the field name);
re-running with `--json` showed every package matching.

| Package                  | Lockfile | Registry | Integrity |
| ------------------------ | -------- | -------- | --------- |
| `next`                   | 16.2.11  | 16.2.11  | match     |
| `@opennextjs/cloudflare` | 1.20.2   | 1.20.2   | match     |
| `wrangler`               | 4.113.0  | 4.113.0  | match     |
| `sharp`                  | 0.34.5   | 0.34.5   | match     |
| `@supabase/ssr`          | 0.8.0    | 0.8.0    | match     |
| `@supabase/supabase-js`  | 2.104.1  | 2.104.1  | match     |
| `@simplewebauthn/server` | 13.3.0   | 13.3.0   | match     |
| `web-push`               | 3.6.7    | 3.6.7    | match     |
| `resend`                 | 6.12.2   | 6.12.2   | match     |

No provenance stop condition.

---

## 4. Scope

The deterministic manifest resolved **292 tracked files**, all confirmed to be
regular files (closure check passed, 0 missing). Category counts are in
`scope-summary.md`; per-file rows are seeded in `backend-file-ledger.csv` with
status `pending`.

---

## 5. Resume pointer

- **Last completed phase:** Phase 0 (workspace, baseline, provenance) and Phase 1
  manifest + ledger seeding.
- **Next exact action:** Phase 1.4 test-coverage inventory, then Phase 2
  architecture and trust-boundary map.
- **Open findings:** none recorded yet; the finding ledger is empty.
- **Blockers:** none.
