# Remediation summary — runtime audit 2026-07-30

Thirteen atomic commits on `audit/full-runtime-hardening-2026-07-30`, branched
from `main` at `1301734f`. Nothing pushed, nothing deployed, no migration
applied.

Test suite moved **143 files / 1269 tests → 152 files / 1319 tests**. Every fix
below ships a regression test, and in each case the test was confirmed to FAIL
against the pre-fix code for the expected reason before the fix was applied.

---

## 1. `b0b8cd7a` — Sharp supply-chain gate re-approved (RTA-0001, P1)

**Production could not be deployed at all.** The gate's approved dependency
ancestry and registry provenance still pinned Next 16.2.11, Wrangler 4.113.0 and
miniflare 4.20260721.0, while the committed lockfile installs Next 16.2.12,
Wrangler 4.115.0 and miniflare 4.20260722.1. Because `evaluateDeploymentGate`
delegates to `evaluateAuditException`, this was not reporting-only: every gated
`cf:*` script failed closed for **both** profiles.

Re-approved against provenance read from the committed lockfile. Two things were
learned while doing it and are now encoded:

- miniflare's nested Sharp moved to **0.35.2**, outside the `<0.35.0` advisory
  range, so it contributes no exposure. Pinned so a downgrade back into the
  affected range must be re-approved.
- The remaining advisory is attributable solely to `node_modules/sharp@0.34.5`,
  Next's **optional** build-time image dependency.

**Root cause of the silent drift, and the more important fix:** the gate's own
suite validates a _synthetic_ lockfile fixture, and nothing in `npm run check`
reads the real `package-lock.json`. The tests stayed green while the lockfile
moved underneath them, and the breakage surfaced only at deploy time. Added
`tests/security/sharp-gate-provenance-matches-lockfile.test.ts`, which binds the
approved constants to the committed lockfile so the next bump fails inside
`npm run check`. It asserts on provenance/ancestry errors only — deliberately
not `ok === true`, because the exception is time-boxed and is _supposed_ to start
failing after 2026-08-22.

Verified: `cf:dry-run` **and** `cf:dry-run:production` both exit 0.

## 2. `59e1894b` — Tokens made genuinely single-use (RTA-0004 / BA-0006, P2)

Password reset and email verification both looked a token up with
`.eq('used', false)`, then flipped it with
`.update({used:true}).eq('id',…).eq('used',false)` under comments claiming the
write was _"atomic"_ and an _"extra guard against race condition"_.

It guarded nothing. PostgREST reports a zero-row UPDATE as success
(`error: null`), and neither route asked which rows changed — so when two
requests raced on one token, both passed the lookup, both issued the UPDATE, and
the loser proceeded to the privileged side effect: resetting a password or
confirming an address off a token already spent.

Fixed by making the UPDATE the gate it was documented to be: terminate with
`.select('id')` and reject when no row was claimed, reusing the existing generic
"Invalid or expired" message so _already consumed_ stays indistinguishable from
_not found_.

Both zero-row cases failed **"expected 200 to be 400"** against the old code.
Carried from 2026-07-22 as BA-0006 status `candidate`; now confirmed in both
routes and closed.

## 3. `999a11c9` — WebAuthn anchors fail closed (RTA-0005 / BA-0003, P2)

`WEBAUTHN_RP_ID` and `WEBAUTHN_ORIGIN` bind an assertion to this site. Both
resolvers — there are two, one per parallel passkey stack — fell back to the
request's own `Host`/`Origin` header when the variable was missing, which makes
verification **circular**: the origin inside `clientDataJSON` is compared against
an origin the caller also supplied, so the comparison cannot fail.

Production sets both, so the hole was latent — but "latent" rested entirely on
`process.env` being populated, and BA-0017 is the standing proof that an
OpenNext/Workers isolate can come up without it. Under that failure the old code
silently downgraded to attacker-controlled anchors instead of refusing.

Both resolvers now throw on any deployed runtime when the anchor is missing or
blank, keeping the host-derived fallback only for local development. All eight
callsites already wrap these in `try/catch`, so this surfaces as each route's
generic error — the fail-closed behaviour AGENT.md mandates.

Carried from 2026-07-22 as BA-0003 status `validated`, never fixed.

## 4. `d7036029` — Cron ownership pinned (RTA-0003, P1 — gap recorded, not closed)

Two invariants nothing covered:

- `scheduled.test.ts` cross-checks the dispatcher against **`vercel.json`**, the
  retained _rollback target_. Nothing checked it against `wrangler.jsonc`, the
  platform actually serving production since the cutover.
- Nothing asserted that a `CRON_SECRET`-authenticated route _has_ a scheduler.
  BA-0016 removed the GitHub Actions schedule that was the only caller of
  `/api/cron/push-reminders` — correctly; it was an unreconciled fourth
  scheduler with unset secrets that had failed every 10 minutes (0 successes in
  its last 300 runs). But the route was never adopted into the Cloudflare
  triggers, so it went from _duplicated_ to _orphaned_: **deadline reminders now
  have no way to fire at all**, and the route's own batch cap documents a
  10-minute cadence it no longer has.

Deliberately does **not** enable a trigger — that resumes real push delivery to
real users and is the owner's call. The gap is pinned as an explicit exception
carrying its reason, so any _new_ cron-authenticated route added without an owner
fails the suite, and giving this route an owner forces the stale exception to be
removed.

## 5. `46c0d4ed` — Both PostCSS advisories cleared (RTA-0007, P2)

Two of the five high advisories were PostCSS, fixed upstream in 8.5.18. npm's
proposed remedy was `next@14.2.35` — a major downgrade — which is why the
2026-07-22 audit filed them as unreachable build-time risk and moved on.

That was right about reachability and wrong about the remedy. Nothing required
8.5.10: the devDependency range was already `^8.5.6` and the pin came from an
`overrides.next.postcss` entry. Lifting it to `^8.5.25` clears both without
touching Next. **5 → 4 high advisories.**

Guarded against a silently-broken CSS pipeline: 250 KB main stylesheet with MQ
custom properties, Tailwind utilities and autoprefixer output all present.

This does **not** turn CI green — see RTA-0002.

## 6. `afe854ee` — Webmanifest Content-Type de-duplicated (RTA-0009, P2)

Root cause for the 2026-07-29 follow-up recorded as _"doubled Content-Type,
cosmetic, root cause unidentified"_.

Neither mysterious nor cosmetic: `public/_headers` declared `Content-Type` for
`/manifest.webmanifest` twice — an exact-path rule and a `/*.webmanifest` glob —
and Cloudflare applies every matching rule and **appends**. Verified live:
production served `application/manifest+json, application/manifest+json`. A
comma-joined `Content-Type` is not a valid media type, so a browser may reject
it, costing PWA installability.

Added a test that models Cloudflare's apply-every-match semantics and asserts no
single-value header is set by more than one matching rule across six
representative paths, plus non-vacuous controls that the media type is still
declared exactly once and the `/*` block still carries the four baseline
security headers.

## 7. `8b8c5f0e` — HIBP lookup bounded (RTA-0006, P2)

`isPasswordBreachBlocked` guards signup and password reset, and its own docblock
states the check fails open specifically so `api.pwnedpasswords.com` _"must not
be able to take registration and password reset down with it."_

Documented but not implemented. The `fetch` had no timeout and no abort signal,
so the fail-open path covered a dependency that _fails_ but not one that
_hangs_: the promise never settled and the request sat inside the
password-setting path until the platform killed it.

Added `AbortSignal.timeout(2500)`, sized against the middleware's 6s production
auth budget. Confirmed the test catches the old behaviour — with the signal
removed it dies with **"Test timed out in 10000ms"**, reproducing the stall
rather than asserting a shape. Two non-vacuous controls included: a
known-breached password is still refused, and an error status still fails open.

Found by inventorying every outbound host and checking each caller for a
timeout — this was the one with neither, in front of account creation.

## 8. `1073e4da` — P0: cross-user WebAuthn credential confusion (RTA-0026)

**Unauthenticated full account takeover** against any user who has registered a
passkey. Found this pass; absent from every prior audit. Two independent lanes
reached it separately, and I re-verified it line by line before touching code.

`/api/webauthn/authenticate/verify` took IDENTITY from one source and the
VERIFYING PUBLIC KEY from another, and never reconciled them:

```
userId       = storedChallenge.userId          <- whoever the caller named at
                                                  authenticate/options
dbCredential = getCredentialById(response.id)  <- GLOBAL lookup on credential_id,
                                                  no user_id filter
```

So: register a passkey on your own account, ask for a challenge bound to the
victim's email, sign it with your OWN authenticator, and the server verifies the
signature against YOUR public key — then calls `generateLink` + `verifyOtp` for
the VICTIM and sets their session cookie on your client. No password, no MFA, no
victim interaction, and `/api/webauthn/authenticate/` is on the public allowlist
so the edge never saw it.

`@simplewebauthn` cannot catch it — `verifyAuthenticationResponse` only asserts
`id === rawId`, never comparing the response's credential id against the record
it was handed. `credential_id` is UNIQUE, so it was deterministic, not
probabilistic.

Fixed with the ownership assertion the sibling `register/verify` has always had,
placed AHEAD of the crypto and the session mint. The legacy `user_metadata`
branch was already safe: it reads the credential id off the challenge user's own
record, so identity and key share one source.

Reproduced first: the cross-user case returned 200 with the crypto having run.
**There was no test covering this route at all** — which is the shape of the
whole gap: challenge issuance, challenge single-use, RP-ID anchoring and
enumeration resistance are all well covered, and the step that converts a
credential into a session was not.

## 9. `e8ce242c` — Open redirect + session fixation on /auth/confirm (RTA-0027)

`next.startsWith('/')` is not a same-origin test: it accepts a protocol-relative
value, and `new URL('//evil.example', <route>)` resolves to
`https://evil.example/`. Because the redirect runs AFTER `verifyOtp` establishes a
session, an attacker could send a victim a genuine `syllabus-sync.app` link
carrying the attacker's own `token_hash`, land them on an attacker-controlled
page, and leave their browser signed into the attacker's account.

`isValidRedirect` was deliberately NOT reused: `SAFE_REDIRECT_PATHS` lacks
`/reset-password`, which is exactly where recovery must land, so the "obvious"
fix would have broken the one destination this route serves. Validated by
resolved origin instead — stricter than a prefix test and allowlist-free.

## 10. `10a13cc5` — Remaining unbounded fetches bounded (RTA-0028)

The HIBP fix closed one instance; sweeping every outbound call found three more,
one worse. `UpstashRedisStore.command()` had no signal, and `checkRateLimit`
awaits the store BEFORE the handler runs — so a stalled Upstash/KV endpoint hangs
every login, signup, password reset, MFA verify and passkey auth in the isolate,
and `failClosed: true` never fires because a hang throws nothing. Plus three
weather fetches: `next: { revalidate: 300 }` does not bound a request, and there
is no incremental cache on Workers to dedupe it.

## 11. `f6ea500e` — audit_settings RLS + unguarded definers (RTA-0029) — UNAPPLIED

`public.audit_settings` is the only one of 27 chain tables that never receives
`ENABLE ROW LEVEL SECURITY`, and `cleanup_old_audit_logs()` — SECURITY DEFINER,
reading its retention window from that table — has no GRANT or REVOKE anywhere.
Chained, the anon key can set retention to 0 and destroy the security audit
trail. Four more definers are client-reachable with no ownership check; two have
only `REVOKE FROM PUBLIC`, which BA-0032 already proved insufficient here.

They escaped the BA-0029/0031/0049 sweeps because those sweeps grep for a
_broken_ guard and these have none — a blind spot worth naming.

Also pins `search_path` on every unpinned definer via a catalog sweep. **This
migration ships unapplied and must be pushed.**

## 12. `81261c12` — Test spy typed

The HIBP spy was declared with no parameters, so `mock.calls[0][1]` failed `tsc`
with TS2493. Vitest ran green either way; only `npm run typecheck` caught it.

---

## Deliberately not changed

| Item                                                     | Why                                                                                                                                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| CI advisory policy (RTA-0002)                            | Deciding which advisories CI may tolerate is a security-policy call. Changing it unilaterally would read as weakening a gate.         |
| Enabling the push-reminders trigger (RTA-0003)           | Resumes real push delivery to real users; scheduled-trigger changes are outside a code-only pass.                                     |
| Password-reset session revocation (RTA-0008)             | Needs a `SECURITY DEFINER` function over `auth.refresh_tokens` (a migration) or a GoTrue change. Migrations must not be applied here. |
| Pinning `search_path` on 11 definer functions (RTA-0010) | Needs a migration, and several are trigger functions where a wrong pin changes behaviour. Live catalogue state was not queried.       |
| Unscheduling the duplicated `pg_cron` jobs (RTA-0011)    | Needs confirmation that `pg_cron` is installed on the live project.                                                                   |
| Narrowing `.prettierignore` (RTA-0013)                   | Would reformat many files at once — exactly the mass-format the brief forbids.                                                        |
| Migrating 21 routes to the guard wrappers (RTA-0014)     | Broad refactor; edge CSRF still applies, so it is defence-in-depth.                                                                   |
| Consolidating the two passkey stacks (RTA-0015)          | Architectural change, not a defect fix.                                                                                               |
| Excluding `dev-pin` from production builds (RTA-0016)    | The `NODE_ENV` guard already fails closed; this is bundle hygiene.                                                                    |
| Supabase SMTP → Resend                                   | Outward-facing change to a live third-party project; owner decision.                                                                  |
