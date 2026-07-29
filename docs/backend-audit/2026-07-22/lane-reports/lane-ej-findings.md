# Lane E + Lane J Findings — Syllabus Sync Backend Audit

Scope: `app/api/auth/**`, `app/api/webauthn/**`, `app/auth/**`, `app/login/actions.ts`,
`lib/security/{webauthn,emailVerification,passwordReset,mfa,two-factor-backup-codes,
session-termination,audit}.ts`, `app/api/audit/route.ts`, export/deletion surfaces.

Repo audited (read-only): `/Users/raoof.r12/Desktop/Raouf/MQ_Research/Syllabus-Sync-backend-audit`

Known finding **not re-reported**: BA-0001 — `consumeChallenge()` in `lib/security/webauthn.ts:106-134`
does a non-atomic SELECT-then-DELETE and discards the DELETE result (P2). Its siblings are
reported below as BA-0004.

---

## Summary table

| ID | Title | Severity | Lane |
|----|-------|----------|------|
| BA-0002 | Unverified "biometric" credential planting → persistent auth backdoor | **P1** | E |
| BA-0003 | New WebAuthn/passkey enrollment does not require AAL2 step-up | P2 | E |
| BA-0004 | Password-reset / email-verify token consumption discards UPDATE result (sibling of BA-0001) | P2 | E |
| BA-0005 | Password change/reset does not revoke other sessions (dead session-termination module) | P2 | E |
| BA-0006 | Duplicate, inconsistent passkey implementations (architectural root cause of BA-0002/0003) | P3 | E |
| BA-0007 | Audit log self-forgery, no rate limit on `POST /api/audit` | P2 | J |
| BA-0008 | No account-deletion / erasure flow exists (scope gap, not a defect) | Info | J |
| BA-0009 | Client-side JSON "export" — no CSV/formula-injection surface, blocklist sanitization | Info | J |
| BA-0010 | Signup account-enumeration is a documented, deliberate UX trade-off | Info/P3 | E |

---

## BA-0002 — Unverified "biometric" credential planting → persistent auth backdoor (P1)

**Files:**
- `app/api/auth/biometric/route.ts:70-140` (vulnerable write path)
- `app/api/auth/passkey/verify/route.ts:59-136` (consumes the planted metadata to mint a session)
- `app/api/webauthn/authenticate/verify/route.ts:85-157` (also has a "legacy user_metadata"
  fallback that consumes the same planted metadata)

**Root cause:**

`POST /api/auth/biometric` is a *second, parallel* passkey-enable endpoint (independent of the
correctly-implemented `/api/webauthn/register/*` and `/api/auth/passkey/register*` ceremony
flows). It requires only a valid session (`supabase.auth.getUser()`), then writes
client-supplied values straight into `user_metadata` with **zero WebAuthn verification** —
`verifyRegistrationResponse` is never called, no challenge is issued or consumed:

```ts
// app/api/auth/biometric/route.ts:90-121
const { enabled, credentialId, publicKey, counter, transports } = parsed.data;
if (enabled && (!credentialId || !publicKey)) { ... }
...
const { error: updateError } = await supabase.auth.updateUser({
  data: {
    biometric_enabled: enabled,
    biometric_credential_id: enabled ? (credentialId ?? null) : null,
    biometric_public_key: enabled ? (publicKey ?? null) : null,
    biometric_counter: enabled ? (counter ?? 0) : null,
    biometric_transports: enabled ? (transports ?? null) : null,
    ...
```

`credentialId`/`publicKey` are attacker-chosen strings from the request body — there is no
proof the caller's browser ever performed a WebAuthn ceremony, let alone that a real
authenticator produced that key pair. Nothing stops the caller from generating a P-256 key
pair offline and submitting the public half.

This metadata is then trusted as a genuine passkey by **two** live login endpoints:

```ts
// app/api/auth/passkey/verify/route.ts:72-96
const credentialId = metadata.biometric_credential_id as string | undefined;
const publicKey = metadata.biometric_public_key as string | undefined;
...
const verification = await verifyAuthenticationResponse({ ... credential: { id: credentialId, publicKey: base64UrlToBuffer(publicKey), counter, transports } ... });
...
// mints a full session via generateLink({type:'magiclink'}) + verifyOtp
```

```ts
// app/api/webauthn/authenticate/verify/route.ts:85-107
// Fallback: check legacy user_metadata
if (!dbCredential) {
  const metaCredId = metadata.biometric_credential_id as string | undefined;
  if (metaCredId === credentialId) { isLegacyCredential = true; legacyPublicKey = ...; }
}
```

Since `verifyAuthenticationResponse` only checks a cryptographic signature against the stored
public key (no attestation, no hardware requirement), an attacker who holds the matching
private key can fabricate a valid `AuthenticationResponseJSON` **offline**, with no browser or
authenticator involved, and complete login.

**Concrete failure scenario:**

1. Attacker obtains any transient authenticated context for the victim's account — e.g. a
   stolen/leaked session cookie, an XSS on any page (reads `document.cookie` for the CSRF
   double-submit token and replays it), a shared/public device, or a malicious browser
   extension. This is a lower bar than full credential theft — it does not require the
   password or MFA.
2. Attacker generates an EC key pair locally and calls
   `POST /api/auth/biometric {"enabled":true,"credentialId":"<self-chosen>","publicKey":"<own pubkey>","counter":0}`
   using the victim's session. No CSRF token is needed if the request has no `Origin`/`Referer`
   header (curl-style — `lib/security/csrf.ts` `validateOrigin()` explicitly allows this:
   *"No origin + no referer = non-browser (curl, Postman, service worker) → allow"*).
3. The victim's `user_metadata.biometric_credential_id/biometric_public_key` now points at a
   key the attacker controls, with `biometric_enabled: true`.
4. At any later time — including **after the victim changes their password** — the attacker
   signs a fabricated authentication response with their private key and calls
   `POST /api/auth/passkey/verify` (or `/api/webauthn/authenticate/verify`, which explicitly
   falls back to this same metadata). Both mint a full session via Supabase magic-link
   `generateLink` + `verifyOtp`, with **no password and no MFA step required**.
5. Result: persistent, password-independent account access implanted from a single transient
   compromise, survivable across password resets.

**Required attacker capability:** one authenticated request as the victim (via XSS, cookie
theft, shared device, or similar) at any point in time. No cross-user primitive is needed
beyond that — this is what elevates a temporary foothold into permanent account takeover.

**Fix:**
- Delete/disable the `enabled:true` branch of `POST /api/auth/biometric` (or require it to go
  through `verifyRegistrationResponse` with a server-stored, single-use challenge exactly like
  `/api/webauthn/register/verify`).
- Remove the "legacy user_metadata" fallback from
  `app/api/webauthn/authenticate/verify/route.ts` once credentials are migrated to
  `webauthn_credentials`, or at minimum require that fallback's public key to have been set
  through a real ceremony.
- Audit existing `user_metadata.biometric_*` rows for any that were never produced via a real
  `verifyRegistrationResponse` call, and revoke them.

---

## BA-0003 — New WebAuthn/passkey enrollment does not require AAL2 step-up (P2)

**Files:**
- `app/api/webauthn/register/options/route.ts:33-105`
- `app/api/webauthn/register/verify/route.ts:33-148`
- `app/api/auth/passkey/register-options/route.ts:9-52`
- `app/api/auth/passkey/register/route.ts:28-94`
- `lib/middleware.ts:41-52`, `274-347`

**Root cause:** all four "add a new authenticator" endpoints check only
`supabase.auth.getUser()`; none call `supabase.auth.mfa.getAuthenticatorAssuranceLevel()`. This
matters because the global middleware step-up gate does not cover them either:
`isPublicApiPath()` (`lib/middleware.ts:41-52`) treats **every** path under `/api/auth/` as
public for the purposes of `shouldResolveUser`/`requiresMfaUpgrade`, so the
`if (isApiRoute && !isPublicApi && user && requiresMfaUpgrade)` 403 gate at
`lib/middleware.ts:340-347` never fires for these routes. Only
`app/api/auth/mfa/unenroll/route.ts:58-99` opts in to its own explicit AAL2 check — enrollment
of a *new* factor has no equivalent guard anywhere.

**Concrete failure scenario:** an attacker who has hijacked a session that is only at `aal1`
(e.g. a stolen cookie captured before the legitimate user completed their TOTP/SMS challenge,
or a session obtained via BA-0002's own bypass) can add a brand-new WebAuthn credential or
biometric backdoor to an MFA-protected account without ever presenting the second factor. This
directly compounds BA-0002: the account's real MFA is irrelevant to planting the backdoor.

**Fix:** require `aal.currentLevel === 'aal2'` before issuing registration options / accepting
a registration verification whenever the account already has one or more verified MFA/WebAuthn
factors — mirroring the existing pattern in `mfa/unenroll`.

---

## BA-0004 — Password-reset / email-verify token consumption discards UPDATE result (P2, sibling of BA-0001)

**Files:**
- `app/api/auth/password/reset/route.ts:63-90`
- `app/api/auth/email/verify/route.ts:68-96`
- (dead-code sibling, not currently reachable: `lib/security/two-factor-backup-codes.ts:217-253` `consumeBackupCode()`)

**Root cause:** this is the same "read-then-write without verifying the write" defect class as
BA-0001, one level removed. Both live routes do:

```ts
// app/api/auth/password/reset/route.ts:63-90
const { data: record } = await adminClient.from('password_resets')
  .select('id, user_id').eq('token_hash', tokenHash).eq('used', false)
  .gt('expires_at', ...).limit(1).single();
...
// 2) Mark token as used (atomic guard)
const { error: updateError } = await adminClient.from('password_resets')
  .update({ used: true }).eq('id', record.id).eq('used', false);
if (updateError) { ...500... }
// falls through to change the password regardless of how many rows the UPDATE touched
```

The `.eq('used', false)` guard on the UPDATE is a correct compare-and-swap *at the SQL level*,
but the Supabase JS client only returns an `error`, not the affected row count, unless
`.select()` is chained (default `Prefer: return=minimal` → PostgREST returns 204 with no error
even when 0 rows matched). The code never checks this, so it cannot tell "I consumed the
token" apart from "someone else already consumed it a moment ago." The code comment ("atomic —
prevents double-use race condition") is therefore inaccurate: the guard exists in SQL but its
result is never observed by the application, exactly mirroring the discarded `DELETE` result in
`consumeChallenge()` (BA-0001).

**Concrete failure scenario:** two near-simultaneous `POST` requests carrying the *same* valid
reset/verification token (e.g. an email-security scanner prefetching the link at the same
moment the user clicks it, or a duplicate form submission/replay by anyone who has seen the
token) can both pass the initial SELECT, both issue the guarded UPDATE, and — because neither
checks whether its own UPDATE actually matched a row — both proceed to call
`adminClient.auth.admin.updateUserById()`, i.e. both requests "succeed" even though only one of
them actually flipped `used=false → true` in the database. Impact is narrower than BA-0001
(requires already knowing/possessing the valid token, and the practical effect of a double
password-set/double email-confirm is limited), but it is the same unverified-consumption defect
the audit was asked to search for, and it undermines the stated single-use guarantee.

**Fix:** chain `.select('id')` on the guarded UPDATE and check that exactly one row came back
before proceeding; treat zero rows as "token already consumed" (same generic error as the
lookup-miss case).

---

## BA-0005 — Password change/reset does not revoke other sessions (P2)

**Files:**
- `app/api/auth/password/route.ts:71-84` (authenticated in-app password change)
- `app/api/auth/password/reset/route.ts:92-99` (forgot-password token flow)
- `lib/security/session-termination.ts` (implements the missing behavior, but is dead code)

**Root cause:** neither password-change path calls anything to invalidate other active
sessions/refresh tokens after a successful change. `supabase.auth.updateUser({password})` and
`adminClient.auth.admin.updateUserById(id, {password})` do not implicitly revoke other
sessions. The codebase already contains a purpose-built module for this —
`lib/security/session-termination.ts` (`handlePasswordChange`, `terminateAllOtherSessions`,
`terminateAllSessions`) — complete with audit logging, but it is **not imported or called from
any live route** (confirmed via repo-wide grep; only re-exported from the `lib/security/index.ts`
barrel, itself unused for this purpose). `app/api/auth/sessions/route.ts` also only lists a
synthetic single "current-session" entry and has no way to enumerate/revoke other sessions
either.

**Concrete failure scenario:** an attacker with a previously-stolen session cookie retains
access even after the legitimate user notices the compromise and "secures their account" by
resetting their password — the standard advice to affected users does not actually work here.

**Fix:** wire `handlePasswordChange()` (or `supabase.auth.admin.signOut(userId, 'others')` /
equivalent global-refresh-token revocation) into both `app/api/auth/password/route.ts` and
`app/api/auth/password/reset/route.ts` after a successful password update.

---

## BA-0006 — Duplicate, inconsistent passkey implementations (P3, architectural)

**Files:** `lib/security/webauthn.ts` + `app/api/webauthn/**` (DB-table-backed, multi-credential,
proper ceremony) vs. `app/api/auth/passkey/**` + `app/api/auth/biometric/route.ts`
(`user_metadata`-backed, single-credential, cookie-based challenge storage).

Two independently-maintained "passkey" systems exist side by side, reachable via different
route prefixes, with different credential storage, different challenge storage (DB table vs.
httpOnly cookie), and different security postures. This duplication is the direct root cause
enabling BA-0002 and BA-0003: the weaker system was left reachable as a live API surface even
though the frontend (`lib/hooks/useBiometrics.ts`) only exercises the properly-verified
`PASSKEY_REGISTER_OPTIONS`/`PASSKEY_REGISTER` ceremony for enabling, never
`BIOMETRIC_TOGGLE` with `enabled:true`. An unused-by-the-UI backend route is still a fully
reachable, unauthenticated-ceremony attack surface for any direct API client.

**Fix:** consolidate on the `webauthn_credentials`-table implementation and remove the
`user_metadata`-based one entirely (routes, cookies helpers, and the `legacy` fallback branch
in `authenticate/verify`).

---

## BA-0007 — Audit log self-forgery, no rate limit on `POST /api/audit` (P2, Lane J)

**File:** `app/api/audit/route.ts:147-236`; SQL: `supabase/migrations/20260214002000_restore_log_audit_function.sql`

**Root cause:** `POST /api/audit` lets any authenticated user insert an `audit_logs` row with
fully attacker-chosen `action` (any of the ~20 enumerated action types, including
`PASSWORD_CHANGE`, `MFA_DISABLE`, `DELETE`, `SUSPICIOUS_ACTIVITY`), `tableName`, `recordId`,
`oldData`, `newData`, and `metadata` — arbitrary free-form JSON. The underlying `log_audit(...)`
SQL function correctly pins `user_id := COALESCE(p_user_id, auth.uid())` and rejects any attempt
to write another user's `user_id` (`RAISE EXCEPTION` if mismatched), so **cross-user forgery is
blocked**. However, nothing validates that `oldData`/`newData`/`tableName`/`recordId`
correspond to anything that actually happened, and — unlike every other mutating endpoint in
this codebase (signin, signup, MFA, passkey, password reset, etc., all of which use
`createRateLimiter`) — **this route has no rate limiter at all**.

**Concrete failure scenario:**
1. A user under scrutiny (e.g. an abuse/policy investigation, or someone who wants to obscure
   what they actually did) can inject fabricated, benign-looking entries into their own
   official audit trail, or fabricate entries that contradict what really happened — directly
   undermining "audit trail integrity" as a control, since the trail is meant to be an
   independent record, not something the subject can author.
2. With no rate limit, the same user can flood their own audit log with junk rows (unbounded
   loop of `POST /api/audit`), burying genuine security-relevant entries in noise and pushing
   real events out of the default page window seen by `GET /api/audit`, and consuming storage.

**Fix:** rate-limit `POST /api/audit` like every other mutation route; restrict the
client-writable action set to genuinely client-side-only events (the doc comment already says
"primary audit logging happens server-side via database triggers" — client-writable audit
categories should be a small allowlist, e.g. `EXPORT`/`SETTINGS_CHANGE`, not the full enum
including `DELETE`/`PASSWORD_CHANGE`/`SUSPICIOUS_ACTIVITY`); consider a `source: 'client'` flag
persisted on client-submitted rows so reviewers can distinguish self-reported entries from
server-generated ones.

---

## BA-0008 — No account-deletion / erasure flow exists (Informational, Lane J scope gap)

Exhaustive search (`deleteUser`, `admin.deleteUser`, `DELETE FROM auth.users`, "account
deletion", "GDPR", settings pages, `PrivacySettingsPage.tsx`) turned up **no account-deletion
or data-erasure endpoint anywhere in the codebase**. `PrivacySettingsPage.tsx` renders only a
`PrivacySettings` component with no deletion action found. This means the Lane J checks for
deletion transactionality, storage-object cleanup, and orphaned-row cleanup are not assessable
— there is nothing implemented to assess. This is a product/functionality gap rather than a
vulnerability, but is flagged because Lane J scope assumes such a flow exists.

---

## BA-0009 — Client-side JSON "export" has no CSV/formula-injection surface (Informational)

**File:** `lib/hooks/useDataExport.ts:1-116`

The only "export" feature is entirely client-side: it reads already-loaded Zustand store state
(units, deadlines, gamification, preferences) and downloads it as a `Blob` of pretty-printed
JSON. There is no server round-trip, no CSV/XLSX generation, and therefore no spreadsheet
formula-injection surface (`=`, `+`, `-`, `@` leading characters are irrelevant to a `.json`
download opened as text/JSON, not imported into Excel/Sheets as tabular data). `sanitizeData()`
recursively drops any object key whose name *contains* `token`, `password`, `secret`,
`sessionid`, `auth`, or `key` — a coarse denylist rather than an allowlist. It does not
strip PII fields (email, student ID, etc.) because those are presumably intended to be
exportable user data; this is a reasonable design choice, not a defect, but is noted since the
denylist approach means any future field added to these stores whose name doesn't match one of
those substrings will be exported by default (fail-open-by-omission for *future* sensitive
fields, not a currently exploitable issue).

---

## BA-0010 — Signup account-enumeration is a documented trade-off (Informational/P3)

**File:** `app/api/auth/signup/route.ts:63-68`

Unlike signin/password-reset (both anti-enumeration, verified: identical generic responses
regardless of account existence — `app/api/auth/signin/route.ts:187-196`,
`app/api/auth/password/request-reset/route.ts:22-26`), signup explicitly returns
`ACCOUNT_EXISTS_MESSAGE` ("An account with this email already exists...") when the email is
already registered, rather than the generic success message. This is called out in-code as a
conscious UX trade-off, mitigated by IP rate-limiting (`signupLimiter`) and an honeypot field.
Recorded here for completeness since Lane E explicitly asks about enumeration; not a new
finding, just confirmation the trade-off is intentional and bounded (rate-limited, not
unlimited probing).

---

## Positive findings (things that are correctly implemented)

- Password-reset and email-verification tokens are 32 random bytes (CSPRNG via
  `crypto.randomBytes`), and **only SHA-256 hashes are ever persisted**
  (`lib/security/passwordReset.ts:48-57`, `lib/security/emailVerification.ts:60-70`); raw
  tokens are only ever placed in the outbound email body. Expiry is 20 minutes and enforced via
  `gt('expires_at', now)` on every lookup.
- `app/login/actions.ts:171-180` fails **closed** on MFA-status-check errors ("blocking login
  (fail-closed)") rather than defaulting to allowing sign-in.
- `app/api/auth/mfa/unenroll/route.ts:58-99` fails closed on AAL/factor-list lookup errors and
  correctly requires `aal2` before disabling MFA when factors exist.
- CSRF: double-submit cookie (`__Host-csrf`) + Origin/Referer validation is present and applied
  at `lib/middleware.ts:117-122` for all state-changing methods, with a defensible allowlist of
  origins; `secureCompare()` in `lib/security/csrf.ts:53-64` is constant-time.
- `getRelyingPartyId`/`getExpectedOrigin` in `lib/security/webauthn.ts:279-295` prefer a
  server-side environment variable over request-supplied host/origin, avoiding trivial RP-ID
  spoofing via the `Host` header (though `app/api/auth/passkey/_lib.ts:8-19` has the same
  pattern but only used by the weaker BA-0002/0006 system).
- `isValidRedirect()` (`lib/utils/security.ts:19-35`) was analyzed for open-redirect bypasses
  (prefix-match tricks, userinfo `@` tricks, `new URL(input, base)` absolute-URL-wins
  behavior) — the combination of a strict relative-path check and a literal safe-path
  allowlist applied to the residual string correctly rejects every bypass attempted during this
  review; no open redirect found.
- Rate limiters (`createRateLimiter`, fail-closed) are applied consistently to essentially every
  credential-testing endpoint (signin, signup, password reset request/consume, email verify
  consume, MFA challenge/verify/enroll/unenroll, SMS send/verify, passkey options/verify,
  WebAuthn register/authenticate) — the one notable exception is BA-0007 (`POST /api/audit`).
- `log_audit()` SQL function correctly enforces `user_id = auth.uid()` for authenticated
  callers, preventing cross-user audit-row forgery (see BA-0007 for the narrower
  self-forgery gap that remains).

---

## Answers to the standing questions

- **Are reset/verification tokens hashed at rest?** Yes — password-reset and email-verification
  tokens are SHA-256-hashed before storage; only the hash is persisted, raw tokens are never
  logged or stored (`lib/security/passwordReset.ts`, `lib/security/emailVerification.ts`).
- **Does any auth path fail open?** No MFA/AAL check fails open (login MFA check and
  `mfa/unenroll` both fail closed on errors). However, `POST /api/auth/biometric` (BA-0002) is
  functionally equivalent to a fail-open bypass by design: it accepts client-supplied
  credential material as trusted with zero cryptographic ceremony, and that trust is honored by
  two live login endpoints — this is the most serious issue in this lane.
