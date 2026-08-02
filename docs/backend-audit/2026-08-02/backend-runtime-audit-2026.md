# Syllabus Sync — Backend and Runtime Audit, 2026-08-02

**Auditor:** claude-fable-5
**Branch:** `audit/backend-hardening-cloudflare`
**Starting commit:** `f9393714`
**Target:** production at `https://www.syllabus-sync.app` (Next.js 16.2.11 App Router,
OpenNext → Cloudflare Workers, Supabase Postgres)
**Predecessor:** the 2026-07-22 audit (`docs/backend-audit/2026-07-22/`), 51 findings
(BA-0001…BA-0051), 43 closed, 5 open, 3 accepted risks.

---

## 1. Executive summary

This pass was scoped as a re-audit: verify the predecessor's open findings, then sweep
for what it missed. That framing was chosen deliberately, because the predecessor's own
record shows it reported a live P0 as _absent_ twice (BA-0048), each time by trusting a
derived object or a supplied list instead of the underlying state.

Applying that lesson — check the real system, not a description of it — surfaced **three
defects the predecessor did not report**, one of which has been breaking a shipped
feature in production for over five months.

The method that found them was not code reading. It was:

1. **Read-only probing of live production** with the public anon key (the same key
   shipped in the browser bundle), and
2. **Replaying all 78 migrations against a clean PostgreSQL 15.18**, which no previous
   pass had done.

Both are cheap. Neither had been done.

### Headline findings

| ID      | Sev    | Finding                                                                                                                                             | Status                                |
| ------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| BA-0052 | **P1** | Mutually recursive RLS policies make `schedules` and `schedule_members` permanently unqueryable; the sharing feature has been dead since 2026-02-20 | **Fixed & verified**                  |
| BA-0053 | **P1** | 6 of 78 migrations fail on a clean database — a fresh environment cannot be built from the migration set at all                                     | Reported, fix scoped                  |
| BA-0054 | P2     | Bidirectional schema drift: production holds objects no migration creates, and migrations define objects that exist nowhere                         | Reported                              |
| BA-0055 | P2     | `anon` retains table-level SELECT/UPDATE/DELETE grants on 11 tables, including `password_resets`, `backup_codes` and `webauthn_credentials`         | Reported (RLS-contained — see caveat) |
| BA-0056 | **P0** | WebAuthn verify never binds the presented credential to the challenge's user — any account with a passkey can be taken over                         | **Fixed & verified**                  |
| BA-0057 | **P1** | Two regressions introduced by my own migration repair: `audit_settings` without RLS, and duplicate `log_audit` overloads breaking signup            | **Fixed & verified**                  |
| BA-0027 | P2     | Confirmed with a reproduction. Was an unverified "candidate" in the predecessor ledger                                                              | Confirmed                             |

### Verdict

**FAIL at first assessment; CONDITIONAL PASS after remediation.**

A parallel audit lane found, and I independently confirmed, a **P0 WebAuthn account
takeover** (BA-0056): any user with a self-serve account could obtain a valid session for
any account that has a passkey. That is now fixed and proven. Had this pass stopped at my
own solo findings, it would have been missed.

Beyond that: no other live cross-user data exposure was found. The BA-0048 fix holds under
direct test, and every sensitive table proved RLS-contained when probed with real seeded
rows rather than assumed to be. Four of the five P0/P1 findings reported by the RLS lane
were **refuted** under testing (§11.3) — reporting them would have meant shipping false
criticals.

The migration set could not build a working database at all, which meant there was no
reproducible path to a new environment and therefore no tested disaster-recovery path. That
is now fixed and gated in CI.

Remaining blocker to a clean pass: eight backend domains were never examined (storage,
email runtime, job idempotency, privacy/retention, observability, performance,
backup/restore, deployment pipeline), and BA-0004 remains open pending an owner decision.

## 2. Baseline (captured before any change)

Run with the pinned toolchain (`.nvmrc` = 22; the ambient shell had Node 26, which
violates `engines: >=22 <23` — using it would have invalidated the baseline):

```
node v22.16.0, npm 11.8.0
npm run check  → exit 0
Test Files     → 141 passed (141)
Tests          → 1260 passed (1260)
Production build → success, 91 static pages
```

Working tree carried one uncommitted change (`artifacts/security/sharp-worker-reachability.production.json`,
a rebuild timestamp/hash refresh). No baseline failures. The predecessor's green baseline
reproduces.

**The suite being green is itself a finding.** 1260 tests pass while a production feature
returns HTTP 500 on every call (BA-0052). No test executes SQL against a real database;
all database tests are static analyses of migration text. That is why a five-month-old
total feature outage was invisible to CI.

---

## 3. BA-0052 (P1) — RLS policy recursion; `schedules` unusable since 2026-02-20

### Evidence

`supabase/migrations/20260220100000_realtime_offline.sql` creates a two-node cycle:

```sql
-- lines 43-47
CREATE POLICY "Users can view shared schedules"
  ON public.schedules FOR SELECT
  USING (
    id IN (SELECT schedule_id FROM public.schedule_members WHERE user_id = auth.uid())
  );

-- lines 67-71
CREATE POLICY "Schedule owners can view all members"
  ON public.schedule_members FOR SELECT
  USING (
    schedule_id IN (SELECT id FROM public.schedules WHERE owner_id = auth.uid())
  );
```

Reading either table evaluates the other's policies, which re-evaluate the first.
PostgreSQL aborts the statement with `42P17`.

**Live production, read-only PostgREST call with the anon key:**

```
schedules         status=500  {"code":"42P17","message":"infinite recursion detected in policy for relation \"schedules\""}
schedule_members  status=500  {"code":"42P17","message":"infinite recursion detected in policy for relation \"schedule_members\""}
```

**Reproduced locally for the `authenticated` role** (clean PostgreSQL 15.18, all
migrations replayed, `request.jwt.claim.sub` set to a real user id):

```
ERROR:  infinite recursion detected in policy for relation "schedules"
```

That second step matters: it establishes the failure is not an anon-only artefact. Every
signed-in user has been affected.

### Impact

`app/api/sync/route.ts:139` looks up `schedule_members` to decide whether the caller may
edit an event on a shared schedule:

```ts
const { data: membership } = await supabase
  .from('schedule_members')
  .select('role')
  .eq('schedule_id', event.schedule_id)
  .eq('user_id', user.id)
  .maybeSingle();
```

The destructure takes only `data` and **discards `error`**. The 42P17 failure is
swallowed, `membership` becomes `null`, and the subsequent check refuses a legitimate
collaborator with 403. So it fails **closed** — an availability and correctness defect,
not a privilege escalation. It is also entirely silent: nothing logged, no alert.

I checked the other seven sites in `app/api` and `lib` that discard a Supabase `error`
the same way. All are ownership-scoped (`.eq('user_id', userId)`), so none fails open.
Verified rather than assumed.

### Fix

`supabase/migrations/20260802010000_fix_schedules_rls_recursion.sql` breaks the cycle
with two `SECURITY DEFINER` helpers. Because a definer function runs as its owner, it is
not subject to the caller's RLS, so the cross-table lookup no longer re-enters policy
evaluation.

Neither helper accepts a user identifier — each answers only "does the _current_ caller
stand in this relationship to this schedule id?" That is what keeps this fix out of the
IDOR class the predecessor repeatedly found (BA-0029, BA-0031, BA-0049), where definer
functions took a caller-supplied user id and never checked ownership. `search_path` is
pinned on both.

**One correction was forced by testing.** The first version granted `EXECUTE` only to
`service_role`, on my assumption that policy evaluation does not require the caller to
hold it. That is wrong: PostgreSQL enforces `EXECUTE` against the _calling_ role for
functions referenced in a policy, and the migration's own verification block caught it —

```
ERROR: BA-0052 verification failed: ... (SQLSTATE 42501: permission denied for function is_schedule_member)
```

— turning the recursion into a different breakage. `authenticated` now holds `EXECUTE`;
`anon` deliberately does not.

### Verification

The verification block was run against the **pre-fix** state first, and failed as
designed, so it is not vacuous:

```
ERROR: BA-0052 verification failed: schedules/schedule_members still not queryable
       under RLS (SQLSTATE 42P17: infinite recursion detected in policy for relation "schedules")
```

After applying, against seeded users under the `authenticated` role:

| Check                                                  | Result                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------- |
| Alice (owner) sees her schedule / its members          | 1 / 1 ✅                                                                  |
| Bob (member) sees the shared schedule / his membership | 1 / 1 ✅ — works for the first time since 2026-02-20                      |
| Bob self-promotes to `owner`                           | 0 rows ✅                                                                 |
| Alice (owner) promotes Bob to `owner`                  | `new row violates row-level security policy` ✅ (BA-0026 guard preserved) |
| Unrelated third user sees schedules / members          | 0 / 0 ✅ (no new leak)                                                    |
| Bob's final role                                       | still `editor` ✅                                                         |

Regression test: `tests/security/rls-policy-recursion.test.ts`, 4 tests. Proven
non-vacuous — with the fix migration removed all 4 fail, and the generic detector names
the offending tables:

```
AssertionError: RLS policy recursion detected for: schedules, schedule_members
```

The fourth test builds the policy cross-reference graph from the **final** state of all
migrations (replaying DROP/CREATE in order) and fails on _any_ cycle, not just this one —
following this project's own repeatedly-learned lesson that enumerated lists miss the next
instance.

---

## 4. BA-0053 (P1) — a fresh database cannot be built from the migrations

No previous pass replayed the migration set. Doing so against a clean PostgreSQL 15.18,
with a Supabase-equivalent bootstrap (roles `anon`/`authenticated`/`service_role`, `auth`
and `storage` schemas, `auth.uid()`, `storage.foldername()`, the `supabase_realtime`
publication):

```
APPLIED = 72   FAILED = 6   TOTAL = 78
```

An initial run showed 9 failures; 3 were gaps in my own bootstrap stub and were corrected
before reporting. The remaining 6 are genuine:

| Migration                                                   | Failure                                                        | Why it matters                                               |
| ----------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| `20260114013519_add_soft_deletes_constraints_seeds.sql:286` | `column "week_start" does not exist`                           | **This is BA-0027, confirmed.** See §5.                      |
| `20260124000000_complete_schema_initialization.sql:285`     | `policy "Users can view their own profile" ... already exists` | Non-idempotent — directly violates AGENT.md §3.3             |
| `20260129000000_add_audit_logging.sql:70`                   | `functions in index predicate must be marked IMMUTABLE`        | Can never apply anywhere. See below.                         |
| `20260216090000_harden_security_functions.sql:161`          | `function public.seed_demo_events() does not exist`            | A **security-hardening** migration dying halfway             |
| `20260326000000_enable_rls_edge_response_cache.sql:27`      | `relation "public.edge_response_cache" does not exist`         | Guards line 13 with `IF EXISTS` but not the `CREATE POLICY`s |
| `20260730130000_lock_down_orphaned_sylla_surface.sql:38`    | `relation "public.sylla_ai_requests" does not exist`           | Locks down tables no migration creates                       |

Each migration runs in a transaction, so **everything after the failure point is lost**.

### The audit-logging migration has never applied, anywhere

```sql
-- 20260129000000_add_audit_logging.sql:69-70
CREATE INDEX IF NOT EXISTS idx_audit_logs_recent ON public.audit_logs(created_at DESC)
WHERE created_at > now() - interval '7 days';
```

`now()` is STABLE, not IMMUTABLE, and PostgreSQL rejects it in an index predicate. This
statement fails on every PostgreSQL version. It sits at line 70 of a 340-line migration,
so everything below it — the `audit_settings` table, `log_audit()`, `cleanup_old_audit_logs()`,
`audit_trigger()`, all four `audit_logs` policies including the explicit
`"No updates to audit logs"` / `"No deletes to audit logs"` append-only pair, and the
`recent_audit_activity` and `security_audit_events` views — never ran.

This is confirmed independently against production, where all three durable objects are
absent (PostgREST `PGRST205`):

```
audit_settings          exists_in_prod=false (404)
recent_audit_activity   exists_in_prod=false (404)
security_audit_events   exists_in_prod=false (404)
```

The fresh build produces exactly the same 30 public objects as production — the same
migration fails identically in both places. `audit_logs` and `log_audit()` exist only
because two later migrations named `..._restore_missing_core_security_tables.sql` and
`..._restore_log_audit_function.sql` patched them back by hand; those restores never
covered the other three objects. The naming of those "restore" migrations is fully
explained by this failure.

**Consequence for a claim in the project record.** The changelog states audit logs are
protected and characterises the empty `audit_logs` table as "a coverage gap, not a
breakage". The coverage conclusion is right, but the designed append-only _control_
(`"No updates to audit logs"`, `"No deletes to audit logs"`) does not exist in production.
Append-only currently holds only by RLS default-deny — no permissive UPDATE/DELETE policy
exists, so writes are refused anyway. I verified this behaviourally rather than trusting
either the code or the changelog: as an authenticated user, `UPDATE` and `DELETE` against
another user's `audit_logs` row both affected 0 rows and the row survived. The property is
real; the mechanism the design intended is not.

### Half of a security-hardening migration never runs

`20260216090000_harden_security_functions.sql` fails at line 161 of 365. Lost below that
point: `REVOKE EXECUTE` on `seed_demo_units`, `seed_demo_deadlines`, `seed_demo_class_times`,
`seed_demo_notifications` from `PUBLIC` and `authenticated`; the definition and grants of
`seed_demo_data_for_user(uuid)`; and the definition and grants of `clear_user_data(uuid)` —
a destructive function.

This is a **cascade**: it fails only because `seed_demo_events()` is defined below the
failure point of `20260114013519`, which itself fails. One broken migration disables a
second one's security hardening.

Whether production is missing these revocations could not be settled from here — it
requires `pg_proc`/`pg_default_acl` access that the anon key does not grant. The settling
query is given in §8.

---

## 5. BA-0027 (P2) — confirmed, with a reproduction

The predecessor left this as an unverified "candidate". It is real, and worse than
described.

`20260114000000_add_missing_materialized_views.sql:8` creates `mv_deadline_analytics`
keyed on `user_id`:

```sql
CREATE MATERIALIZED VIEW public.mv_deadline_analytics AS
SELECT d.user_id, COUNT(*) AS total_deadlines, ... GROUP BY d.user_id;
```

`20260114013519_add_soft_deletes_constraints_seeds.sql:269` then redefines it with a
richer schema — but with `IF NOT EXISTS`, so it **silently no-ops**:

```sql
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_deadline_analytics AS
SELECT date_trunc('week', d.due_date) AS week_start, d.user_id, d.priority, d.type, ...
```

Line 286 then indexes a column the surviving definition does not have:

```
ERROR:  column "week_start" does not exist
```

So the consequence is not merely a stale matview, as the candidate note supposed — it is a
hard migration abort that also destroys the rest of that file (soft-delete constraints and
seeds). The predecessor's instinct to reject the proposed "fix" — editing an
already-applied historical migration — was correct; the correct repair is a new forward
migration that drops and recreates the matview.

---

## 6. BA-0055 (P2) — residual `anon` grants, and the reason they are _not_ an exposure

Probing production read-only with the anon key produced a clean split. Tables returning
`401 permission denied` versus tables returning `200`/`204`:

| anon reaches (grant retained)                                                                                                                                                                                                                    | anon blocked (grant revoked)                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app_config`, `audit_logs`, `auth_audit_logs`, `backup_codes`, `email_verifications`, `password_resets`, `rate_limits`, `webauthn_challenges`, `webauthn_credentials`, `public_events`, `edge_response_cache`, `schedules`_, `schedule_members`_ | `profiles`, `xp_config`, `todos`, `user_sessions`, `push_subscriptions`, `units`, `class_times`, `deadlines`, `events`, `notifications`, `user_preferences`, `gamification_profiles`, `xp_events`, `mv_*` |

\* reached policy evaluation and returned 42P17, which is itself proof the grant is held.

The discriminator is exactly whether some migration ever issued `REVOKE ... FROM anon`.
Tables in the left column never did. `rate_limits` is the instructive case — it _did_
attempt a revoke:

```sql
-- 20260217093000_rate_limits.sql:109
revoke all on table public.rate_limits from public;
```

Revoking from the `PUBLIC` pseudo-role does **not** remove a privilege granted directly to
`anon`, which is how Supabase provisions the role. The author's intent was correct and the
statement was ineffective; the live probe is what exposed the difference.

### Why this is P2 and not P0

I did not assume RLS contains these. I tested it, locally, with real rows seeded into the
sensitive tables:

| Test (role)                                                        | Result                                          |
| ------------------------------------------------------------------ | ----------------------------------------------- |
| `anon` reads `password_resets` holding 1 real token                | **0 rows** ✅                                   |
| `anon` reads `email_verifications` holding 1 real token            | **0 rows** ✅                                   |
| `anon` reads `audit_logs` holding 1 real row                       | **0 rows** ✅                                   |
| `anon` deletes a real reset token                                  | 0 rows; **token intact afterwards** ✅          |
| Bob (authenticated) reads Alice's `password_resets` / `audit_logs` | **0 / 0** ✅                                    |
| Bob updates / deletes Alice's `audit_logs` row                     | 0 / 0; **row intact** ✅                        |
| Alice reads all `profiles`                                         | **1 row — her own only** ✅ (BA-0048 fix holds) |
| Alice reassigns her `unit` to Bob                                  | `new row violates row-level security policy` ✅ |

So RLS is doing its job on every one of these tables, and there is no live exposure. The
finding is that **RLS is the only layer** on the most sensitive tables in the system —
password reset tokens, MFA backup codes, WebAuthn credentials — while fourteen
less-sensitive tables get two layers. The defence is inverted relative to the risk.

That matters here more than it would elsewhere, because this codebase's own history is a
record of that single layer failing silently: BA-0048 (permissive `USING (true)` beside a
correct policy), BA-0021 (`security_invoker` lost across DROP/CREATE, twice). The
recommended repair is a blanket `REVOKE ... FROM anon` sweep over every table not
intentionally public, plus a test asserting it — not a per-table fix.

---

## 7. BA-0054 (P2) — bidirectional schema drift

Objects in **production** that no migration creates:

```
sylla_ai_requests         exists (401 — grants revoked by BA-0049 ✅)
sylla_active_generations  exists (401 — grants revoked ✅)
edge_response_cache       exists (200 to anon — RLS-contained, 0 rows)
```

Objects **migrations define** that exist in neither production nor a fresh build:
`audit_settings`, `recent_audit_activity`, `security_audit_events` (all downstream of the
§4 failure).

`edge_response_cache` is contained in production — `20260326000000` enables RLS and
creates service*role-only policies, and anon reads 0 rows — but the table is created by no
migration, so the fresh build has no such table and that migration hard-fails. Unmanaged
schema is how the `sylla*\*`surface reached production carrying`SECURITY DEFINER`functions granted to`anon` (BA-0049), so this is a recurring pattern rather than a
one-off.

---

## 8. What could not be verified from here, and the query that settles it

The audit ran with the **public anon key only**. `.env.local` contains no service-role
key, and Cloudflare's Workers secrets API is write-only, so the following are open:

1. Whether production is missing the `REVOKE EXECUTE` statements lost to the §4 cascade.
2. Whether the `pg_cron` half of BA-0011 is actually scheduled (needs `cron.job`).
3. The final policy/grant state of production as opposed to what migrations imply.

One query, run as service_role, settles all three:

```sql
SELECT n.nspname, p.proname, p.prosecdef, pg_get_functiondef(p.oid) ~ 'search_path' AS pins_path,
       array_to_string(p.proacl, ',') AS acl
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' ORDER BY p.proname;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

SELECT table_name, grantee, privilege_type FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee IN ('anon','authenticated') ORDER BY table_name;

SELECT * FROM cron.job;   -- settles BA-0011
```

**No production data was created, modified or deleted by this audit.** Write reachability
was established with zero-row filters (`?id=eq.<impossible-uuid>`), which prove the grant
without touching a row; every destructive test was run against the local replica.

---

## 9. Status of the predecessor's open findings

| ID      | Predecessor status     | This pass                                                     |
| ------- | ---------------------- | ------------------------------------------------------------- |
| BA-0027 | candidate (unverified) | **CONFIRMED** with reproduction (§5)                          |
| BA-0003 | validated (P3)         | Unchanged — latent fail-open, contained by env vars being set |
| BA-0004 | candidate              | **CONFIRMED, raised to P1** — see §9.1                        |
| BA-0006 | candidate              | **CONFIRMED and FIXED** — see §9.2                            |
| BA-0011 | validated (P2)         | Cannot be closed without `cron.job` — see §8                  |

### 9.1 BA-0004 — CONFIRMED (P1): a second passkey-registration surface bypasses the AAL2 gate

The middleware does enforce MFA on API routes, and fails closed:

```ts
// lib/middleware.ts
if (isApiRoute && !isPublicApi && user && requiresMfaUpgrade) {
  return NextResponse.json({ error: 'MFA required', code: 'MFA_REQUIRED' }, { status: 403 });
}
```

But `isPublicApiPath()` exempts an entire prefix:

```ts
// lib/middleware.ts:43
path.startsWith('/api/auth/') ||
```

**There are two passkey-registration surfaces, and only one is behind the gate:**

| Surface                                           | Behind the MFA gate?   | Own AAL check? |
| ------------------------------------------------- | ---------------------- | -------------- |
| `/api/webauthn/register/options\|verify`          | yes                    | none           |
| `/api/auth/passkey/register`, `/register-options` | **no** (exempt prefix) | **none**       |

Neither performs its own assurance check — I grepped all three route files for
`getAuthenticatorAssuranceLevel`, `listFactors` and `aal` and found none. The gated pair is
protected only by the middleware, and the `/api/auth/passkey/*` pair is protected by nothing.

**Attack.** An attacker holding an AAL1-only session for a victim who has MFA enrolled — the
exact situation MFA exists to defend, i.e. a stolen password or session cookie — calls
`POST /api/auth/passkey/register-options` then `/register`, and enrols their own passkey. The
`/api/webauthn/register/*` path would have returned 403 `MFA_REQUIRED`. The result is durable
attacker-controlled authentication on an MFA-protected account.

Raised from P2 because the control it defeats is the one guarding compromised credentials, and
the bypass is a plain prefix mismatch rather than a subtle race.

**Why the exemption exists, and why the fix needs a decision.** `/api/auth/*` must be reachable
before authentication for `signin`, `signup`, `request-reset`, `reset`, `email/verify` and the
passkey _login_ ceremony. The blanket prefix was the quick way to achieve that. The repair is to
replace the prefix with an explicit allow-list of genuinely pre-auth endpoints, leaving
`passkey/register*`, `mfa/enroll`, `mfa/sms/enroll`, `sessions` and `password` (change) gated.

I have **not** shipped that change. It alters the reachability of 28 auth routes, and getting it
wrong locks every user out of login — a worse outcome than the finding. It needs the owner's
decision on which surface is canonical (the duplicate `/api/auth/passkey/*` and
`/api/webauthn/*` implementations are themselves a finding) and a full auth-flow exercise.

For contrast, `POST /api/auth/mfa/unenroll` is exempt from the same gate but is **correctly**
protected: it rate-limits, authenticates, and explicitly requires AAL2 when verified factors
exist, failing closed if AAL cannot be determined. That is the pattern the passkey registration
routes should follow, and it shows the exemption is survivable where routes self-enforce.

### 9.2 BA-0006 — CONFIRMED and FIXED (P2): token claims decided by error, not row count

Both `app/api/auth/password/reset/route.ts` and `app/api/auth/email/verify/route.ts` filtered
the claiming UPDATE with `.eq('used', false)` and both carried a comment asserting atomicity:

```ts
// "Mark token as used (atomic guard)"
const { error: updateError } = await adminClient
  .from('password_resets')
  .update({ used: true })
  .eq('id', record.id)
  .eq('used', false);

if (updateError) {
  /* ... */
}
```

The guard was real; its verdict was discarded. A conditional UPDATE matching **zero** rows is
not an error — it succeeds having changed nothing. So two concurrent requests could both pass
the step-1 lookup while the token still read unused, both reach the claim, and the loser would
see `updateError === null` and go on to reset the password (or confirm the email) with an
already-spent token.

Fixed by appending `.select('id')` so PostgREST returns the affected rows, and requiring exactly
one. A loser receives the same generic "invalid or expired" response as any other failure, so
nothing is disclosed about which case was hit.

Verified non-vacuous: with the row-count check removed the losing request returns **HTTP 200**
and the password is reset from a spent token; with it, 400 and `updateUserById` is never called.
Commit `bf21ad19`.

---

## 10. Prioritised remediation backlog

| #   | Finding | Action                                                                            | Risk if deferred                                         |
| --- | ------- | --------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | BA-0052 | **Done.** Apply `20260802010000` to production                                    | Sharing stays dead                                       |
| 2   | BA-0053 | Repair all 6 migrations; add CI job that builds a fresh DB from scratch every run | No reproducible environment, no tested recovery path     |
| 3   | BA-0053 | Re-apply the lost `REVOKE EXECUTE` set as a fresh forward migration               | Seed/destructive functions may be client-callable        |
| 4   | BA-0055 | Blanket `REVOKE ... FROM anon` sweep + asserting test                             | Single-layer defence on tokens and MFA codes             |
| 5   | BA-0027 | Forward migration dropping and recreating `mv_deadline_analytics`                 | Migration set stays unrunnable                           |
| 6   | BA-0054 | Bring `edge_response_cache` and `sylla_*` under migration control                 | Unmanaged schema recurs                                  |
| 7   | —       | Add one integration test that runs real SQL against a real database               | This class of defect stays invisible to 1260 green tests |

Item 7 is the structural one. Every finding in this report was found by executing
something — a query against production, or a migration against a real database — and none
of them were visible to a suite that only reads migration text.

---

## 11. Parallel lane results, and what survived verification

Six audit lanes ran in parallel and reported late. Their findings are recorded here **with
my own verdict on each**, because several did not survive testing. Every claim below was
re-checked against source or against a live database before being accepted or rejected.

### 11.1 BA-0056 (P0) — CONFIRMED and FIXED: WebAuthn account takeover

Reported by the API lane, independently confirmed, fixed in `00f80ab5`. This is the most
serious finding of either audit pass.

`POST /api/webauthn/authenticate/verify` brought two identities together and never
compared them. `userId` came from the consumed challenge — the account being logged
_into_, derived from a client-supplied email. `dbCredential` came from
`getCredentialById()`, which queries `webauthn_credentials` by `credential_id` alone
through the service-role client, bypassing RLS and every user scope. The public key handed
to `verifyAuthenticationResponse` came from that row; the session was minted for `userId`.

`grep` confirms `dbCredential.userId` was never read anywhere in the codebase, though
`mapDbCredential()` populates it.

**Attack:** an attacker with a self-serve account holding one passkey requests a challenge
for the victim's email, discards the returned `allowCredentials`, signs the challenge with
their _own_ authenticator on the real origin, and posts it. The signature is genuine, so
verification passes — against the attacker's key — and a valid Supabase session for the
victim is returned. No origin spoofing, no victim interaction, and both endpoints are in
`isPublicApiPath`, so no session is needed to reach them.

**Proven non-vacuous:** with the binding check removed the cross-user assertion returns
**HTTP 200** and a session is minted for the victim; with it, 401, and neither
`generateLink` nor `verifyOtp` is reached.

### 11.2 BA-0057 (P1) — regressions my own repair introduced, caught and fixed

Repairing the audit-logging migration (§4) made a file apply that had never applied
anywhere. That is correct, but it materialised two defects that were dormant only because
the file was unrunnable. **Neither was visible in the diff; both were found by building a
database and exercising it.**

1. **`audit_settings` had no RLS** — the only table in the schema never given it. Creating
   it created an exposure: as `anon`, `SELECT` returned a real row and
   `UPDATE ... SET value='0'` reported `UPDATE 1`. Now locked to `service_role`.
2. **Duplicate `log_audit` overloads broke signup.** The migration declares a 7-argument
   `log_audit` whose parameters are a strict prefix of the canonical 10-argument version.
   Every call site passes 6–7 arguments, matching both. `handle_new_user_safe()` calls it,
   so `INSERT INTO auth.users` raised _"function public.log_audit(...) is not unique"_ and
   **no profile row was created** — signup would have broken for every new user.

The lesson is the same one this audit keeps relearning: applying a migration is not
evidence it is correct; only exercising the result is.

### 11.3 Claims that did NOT survive verification

The RLS lane reported five P0/P1 findings. **Four are refuted**, and I record that plainly
because acting on them would have meant shipping false criticals.

| Claim                                                                                                                                                          | Verdict              | Evidence                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0: `UPDATE` policies with `USING` and no `WITH CHECK` allow handing a `webauthn_credentials` row to a victim → account takeover ("13 policies, only 3 fixed") | **REFUTED**          | PostgreSQL uses the `USING` expression **as** the `WITH CHECK` expression when the latter is omitted. Tested live: as Alice, `UPDATE webauthn_credentials SET user_id='<bob>'` → `ERROR: new row violates row-level security policy`; final owner still Alice. The whole finding class evaporates. |
| P1: `ratelimit_set/increment/get`, `cleanup_expired_rate_limits` client-callable                                                                               | **REFUTED**          | Catalog sweep of `pg_proc.proacl` on a built database: none is EXECUTE-able by `anon`/`authenticated`/PUBLIC.                                                                                                                                                                                      |
| P1: `purge_deleted_records(-99999)` destroys every user's soft-deleted rows                                                                                    | **REFUTED**          | Same sweep — not client-executable.                                                                                                                                                                                                                                                                |
| P1: `refresh_analytics_views()` → `get_xp_leaderboard()` leaks the whole user base                                                                             | **REFUTED**          | Same sweep — `refresh_analytics_views` is not client-executable, so the chain does not start.                                                                                                                                                                                                      |
| P1: anon rewrites `audit_settings`, then `cleanup_old_audit_logs()` wipes the audit trail                                                                      | **PARTLY CONFIRMED** | The table half was real (§11.2) and is fixed. The chain half is refuted: `cleanup_old_audit_logs` is not client-executable (catalog count = 0).                                                                                                                                                    |

The lane's reasoning was that `REVOKE ... FROM PUBLIC` never removes Supabase's direct
`anon` grant. That is true **for tables** — it is exactly BA-0055 — but not for
**functions**, which get their default `EXECUTE` via `PUBLIC` under plain PostgreSQL
semantics, so revoking `FROM PUBLIC` is effective. Generalising a table-level fact to
functions produced four false criticals.

The lane was also wrong that `audit_settings` exists in production carrying real rows: I
probed it directly and PostgREST returns `PGRST205` — it does not exist there, precisely
because the migration that creates it has never applied.

### 11.4 A fair challenge to my own reasoning, accepted

The open-findings lane pointed out that my migration replay was **error-tolerant** — it
continued past each failure — so "that migration has never applied anywhere" does not
follow from the replay alone. That is correct, and the two claims should be separated:

- _The migration cannot apply_ — established directly. It fails on its own with two
  deterministic, version-independent SQL errors.
- _It has never applied in production_ — carried by the independent observation that all
  three of its durable objects are absent there.

The conclusion holds; the inference chain as I first wrote it was sloppy. Recorded rather
than quietly corrected.

### 11.5 BA-0004 — re-scoped, and the lane's analysis is better than mine

I rated this a P1 step-up-MFA bypass. The open-findings lane traced the redemption path
and showed the impact is different: `/api/auth/passkey/verify` mints a session via
`generateLink` + `verifyOtp`, which yields **AAL1**, and `nextLevel` stays `aal2` while the
victim's TOTP factor exists — so the attacker is still gated at the AAL boundary.

The real harm is **persistence**, and it is arguably worse than a momentary bypass: the
password-reset route writes only `password_reset_at` / `password_reset_method` into
`user_metadata`, and Supabase merges metadata shallowly, so an attacker-planted
`biometric_credential_id` **survives a password reset** — it outlives standard incident
response. The legacy route also overwrites the victim's own passkey slot, causing lockout.

**Corrected: P2, recategorised from "step-up bypass" to "unauthorized authenticator binding
and persistence."** Still unfixed for the reason given in §9.1 — the repair changes
reachability for 28 auth routes and needs an owner decision.

### 11.6 Other lane findings recorded, not yet fixed

| Sev | Finding                                                                                                                                                                                                                                                                                                                                                                                                  | Location                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| P2  | **Open redirect.** `next` is validated only with `startsWith('/')`, so `//evil.example` passes and `new URL()` resolves it to an external origin. The correct helper (`isValidRedirect`, which rejects `//`) already exists and is used by the sibling callback route.                                                                                                                                   | `app/auth/confirm/route.ts:19-22`                     |
| P2  | **Unauthenticated abuse of a paid Google API key.** `/api/maps/*` is public and CSRF-exempt; the only gate is `isTrustedOrigin`, which **returns `true` when both Origin and Referer are absent** — so plain `curl` passes. Rotating IPs bills the project's Google account.                                                                                                                             | `lib/security/ip.ts:177-184`                          |
| P2  | **BA-0003 under-scoped.** A _second_ copy of the fail-open WebAuthn RP-ID/origin helpers exists at `app/api/auth/passkey/_lib.ts:8-19`; fixing only `lib/security/webauthn.ts` leaves half the surface. The deploy gate also checks GitHub Actions **variables** while the Worker reads **secrets**, so a correctly-set variable with an unset secret passes CI and still falls back to request headers. | two files                                             |
| P3  | **BA-0011 premise was wrong.** Only two of three pg_cron jobs overlap the Cloudflare schedule, and both are idempotent `DELETE ... WHERE expires_at < now()`. No migration schedules rate-limit cleanup at all. The finding worth keeping is the inverse: `webauthn_challenges` cleanup exists **only** as pg_cron, with no Cloudflare counterpart.                                                      | three migrations                                      |
| P3  | Non-constant-time admin-token comparison; in dev with no token set it returns `true` for any authenticated user. Production-blocked at line 233.                                                                                                                                                                                                                                                         | `app/api/admin/update-building-positions/route.ts:50` |

The API lane also verified there are **no IDOR findings** across the other 64 routes and
**no mass assignment anywhere** — every update path enumerates columns or relies on Zod
key-stripping, and `sync` adds a per-table field allowlist.

### 11.7 BA-0027 — additions that change the fix

Two refinements worth carrying into the reconciliation migration:

- `CREATE UNIQUE INDEX **IF NOT EXISTS**` does not save the statement: PostgreSQL resolves
  column references before the name-existence short-circuit, so it still raises. Exactly
  one statement breaks the replay, not three.
- The three matview access functions are `RETURNS SETOF <matview>`, so they **block the
  drop** (`cannot drop ... because other objects depend on it`). The forward migration must
  drop those functions first, then the matviews, then recreate and re-apply the revokes.
  **Do not use `DROP ... CASCADE`** — it would silently take the access-control functions
  with it.
- **Trap:** the intended `mv_user_activity_summary` definition selects `p.email`, and
  matviews support neither RLS nor `security_invoker`. Materialising it while any
  `GRANT SELECT ... TO authenticated` is live would recreate BA-0023 as a full email
  disclosure. The current no-op is accidentally suppressing that.
