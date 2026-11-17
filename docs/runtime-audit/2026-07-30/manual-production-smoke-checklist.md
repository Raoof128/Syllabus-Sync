# Manual production smoke checklist

These flows cannot be automated safely from an audit: they create real accounts,
send real mail, register real authenticators, or deliver real push
notifications. Everything here is deliberately left for a human to run.

Most of this list is **not new**. The 2026-07-29 cutover record states that the
preview parity matrix was never executed and that authenticated flows on Workers
remain unverified; the cutover proceeded on owner instruction. That debt is still
outstanding, so the list below is the concrete form of it, plus the items this
audit added.

## Before you start

- [ ] Deploy the branch. Several fixes cannot be observed until deployed —
      `public/_headers` ships with the static assets, and the Sharp gate
      re-approval only matters at deploy time.
      `npm run cf:deploy:production` (verified working: `cf:dry-run:production`
      exits 0 as of this audit).
- [ ] Record the deployed version id and the time you started.
- [ ] Use a throwaway inbox you control. Do not use a real student address.
- [ ] Have the rollback runbook open: `docs/operations/cloudflare-rollback-runbook.md`.

Evidence: for each item record **date/time, actor, result (pass/fail), and the
observed value** (status code, redirect target, header, or screenshot).

---

## A. Signup → verification → first sign-in

This is the flow the 2026-07-30 signup audit fixed but never exercised end to
end on Workers, and a live signup has still never been run there.

| #   | Step                                      | Expected                                                                                                                                                                                                                               | Result |
| --- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| A1  | Sign up with a fresh address              | 200, generic success message (anti-enumeration: the same message whether or not the address exists)                                                                                                                                    |        |
| A2  | Verification email arrives                | Arrives within ~2 min. **Note the From address and whether it landed in spam** — currently sent via Gmail SMTP as `Perkycoders <perkycoders@gmail.com>`, which cannot DKIM-align with `syllabus-sync.app` (see risk register)          |        |
| A3  | Click the verification link               | Lands on `/login?verified=1` and the green "email verified" banner renders. This is the specific thing that was broken until `1301734f`                                                                                                |        |
| A4  | You are NOT signed in after A3            | The callback drops the session it minted; you should be on the login form                                                                                                                                                              |        |
| A5  | Sign in with the new account              | Reaches `/home`                                                                                                                                                                                                                        |        |
| A6  | Re-click the SAME verification link       | Rejected as invalid/expired — **this is the RTA-0004 single-use fix**; it must not succeed twice                                                                                                                                       |        |
| A7  | Sign up again with the SAME address       | Same generic success message as A1, no account-exists disclosure                                                                                                                                                                       |        |
| A8  | Request a resend, then use the FIRST link | Behaviour is defined by whichever token the flow issued; record what happens. The initial and resent mails use two different mechanisms and lifetimes (native `?code=` at 3600s vs custom `?token=` at 20 min) — see the risk register |        |

## B. Password reset

| #   | Step                                                                     | Expected                                                                                                                                                            | Result |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| B1  | Request a reset for a real account                                       | Generic success regardless of whether the address exists                                                                                                            |        |
| B2  | Complete the reset with a new password                                   | Success; you can sign in with the new password                                                                                                                      |        |
| B3  | Re-use the SAME reset link                                               | Rejected — **RTA-0004 single-use fix**                                                                                                                              |        |
| B4  | **Sign in on a second device BEFORE resetting, then reset on the first** | ⚠️ The second device's session is expected to **survive** — this is RTA-0008, a known open gap. Confirm the behaviour so the risk is quantified rather than assumed |        |
| B5  | Try to reset to a known-breached password (e.g. `password123456`)        | Refused with the breach message. If `api.pwnedpasswords.com` is unreachable it **fails open by design** and the password is accepted — that is intended             |        |
| B6  | Change password from inside the app (not reset)                          | Other sessions ARE revoked (BA-0005) — contrast with B4                                                                                                             |        |

## C. MFA and passkeys

Note there are **two parallel passkey stacks** with different middleware posture
(RTA-0015): `/api/auth/passkey/*` is on the public allowlist and exempt from the
AAL2 gate; `/api/webauthn/*` is not.

| #   | Step                                                           | Expected                                                                                                                                                                                                                                                        | Result |
| --- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| C1  | Enrol TOTP MFA                                                 | Succeeds; QR renders; codes verify                                                                                                                                                                                                                              |        |
| C2  | Sign out and sign in with MFA                                  | AAL2 challenge required before protected routes                                                                                                                                                                                                                 |        |
| C3  | Enter a wrong TOTP code repeatedly                             | Rate limited (`mfaVerifyLimiter`), not unbounded                                                                                                                                                                                                                |        |
| C4  | Unenrol MFA                                                    | Requires current AAL2; fails closed on error                                                                                                                                                                                                                    |        |
| C5  | Register a passkey                                             | Succeeds. **RTA-0005 check:** this is the flow that would break if `WEBAUTHN_RP_ID`/`WEBAUTHN_ORIGIN` were missing from the Worker — it now refuses rather than trusting request headers, so a failure here means the anchors are unset, which is worth knowing |        |
| C6  | Sign in with the passkey from C5                               | Succeeds                                                                                                                                                                                                                                                        |        |
| C7  | **Existing passkeys registered before the cutover still work** | Succeeds — the RP ID is unchanged across the move, but this has never been verified live                                                                                                                                                                        |        |
| C8  | Delete a passkey                                               | Succeeds; it can no longer be used                                                                                                                                                                                                                              |        |
| C9  | SMS MFA enrol + verify (if enabled)                            | Succeeds; rate limited                                                                                                                                                                                                                                          |        |

## D. CSRF, headers and sessions

| #   | Step                                                              | Expected                                                                                                                     | Result |
| --- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------ |
| D1  | Replay any authenticated mutation with a foreign `Origin`         | Rejected                                                                                                                     |        |
| D2  | `curl -I https://www.syllabus-sync.app/manifest.webmanifest`      | **`content-type: application/manifest+json` exactly once** — this is the RTA-0009 fix and can only be confirmed after deploy |        |
| D3  | Install the PWA                                                   | Installs cleanly (the doubled Content-Type in D2 was a plausible cause of install failures)                                  |        |
| D4  | Confirm `__Host-csrf` cookie attributes                           | `Secure`, `Path=/`, no `Domain`                                                                                              |        |
| D5  | Inactivity logout                                                 | Fires as configured                                                                                                          |        |
| D6  | Sign out, then press Back                                         | No cached authenticated page or private API response is served — service-worker cache isolation                              |        |
| D7  | Sign in as user A, sign out, sign in as user B on the same device | **User B never sees any of user A's cached data** (stores, notifications, deadlines)                                         |        |

## E. Scheduled work

| #   | Step                                                         | Expected                                                                                                                                       | Result |
| --- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| E1  | Confirm the three cleanup crons fired                        | Cloudflare → Worker → Cron Events shows `0 3 * * *`, `10 3 * * *`, `20 3 * * *` succeeding                                                     |        |
| E2  | ⚠️ Deadline reminders                                        | **Expected to NOT fire** — RTA-0003: `/api/cron/push-reminders` has no scheduler at all. Confirm, then decide whether to enable it             |        |
| E3  | If E2 is enabled later: verify no double-send                | The dedup is insert-based (BA-0015); confirm one notification per reminder                                                                     |        |
| E4  | Check whether `pg_cron` is installed on the Supabase project | RTA-0011: if present, two of its jobs duplicate the Cloudflare crons at the same minute. `SELECT jobname, schedule FROM cron.job;` (read-only) |        |

## F. Third-party dependencies

| #   | Step                         | Expected                                                                               | Result |
| --- | ---------------------------- | -------------------------------------------------------------------------------------- | ------ |
| F1  | Campus map loads             | Google Maps SDK initialises (needs `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` inlined at build) |        |
| F2  | Place search / routes        | Return results, not 503                                                                |        |
| F3  | Weather widget               | Returns data, not 503                                                                  |        |
| F4  | Sentry receives a test error | Appears in the project (or is confirmed intentionally disabled)                        |        |

---

## Sign-off

|                     |     |
| ------------------- | --- |
| Deployed version id |     |
| Run by              |     |
| Date/time started   |     |
| Date/time completed |     |
| Items failed        |     |
| Rolled back?        |     |

Any failure in **A3, A6, B3, C5, C7, D2, D6 or D7** should be treated as
blocking, because each maps directly to a fix or a control this audit relied on.
