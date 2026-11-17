# Security Posture

**Checked against the code on 17 November 2026.** This document replaces an earlier "Security Posture and Hardening Report" that listed several controls as implemented when they existed only as unused modules, and that carried self-assessed OWASP and NIST tables. Those tables are removed. What follows is limited to what the code in this repository does today, with the file that shows it.

This is not a certification and not the result of an independent audit. The project's own audit records are under [`docs/backend-audit/`](../backend-audit/) and [`docs/runtime-audit/`](../runtime-audit/).

**System:** Syllabus Sync, a student planning application (Next.js, Supabase, deployed as a Cloudflare Worker).

---

## 1. Request path

```
Browser
   |  HTTPS (terminated by Cloudflare)
   v
Cloudflare Worker: lib/proxy.ts
   - per-request CSP nonce and security headers
   - origin and referer check on state-changing requests
   - for pages: session lookup, email-verification redirect, MFA redirect
   v
Route handlers: app/api/**
   - each route authenticates for itself (the proxy is not an API auth gate)
   - Zod validation, rate limiting, audit logging
   v
Supabase PostgreSQL
   - row-level security on every application table
   - SECURITY DEFINER functions for privileged operations
```

The proxy does not authenticate API requests. Every API route is responsible for its own authentication; see the [architecture guide](../architecture/ARCHITECTURE.md).

---

## 2. Controls in force

### 2.1 Authentication

| Control                 | What the code does                                                                                                                                                                                                                                                                                                        | Where                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Passkeys (WebAuthn)     | Registration and authentication ceremonies with server-issued, single-use challenges that expire after 5 minutes. The relying-party ID and origin come from `WEBAUTHN_RP_ID` and `WEBAUTHN_ORIGIN`; in production the code refuses to derive them from request headers. Credentials are stored in `webauthn_credentials`. | `lib/security/webauthn.ts`, `app/api/webauthn/**`                                                         |
| Legacy passkey routes   | An older set of routes under `app/api/auth/passkey/` stores credential data in the user's `user_metadata` instead of the table above. Both sets are present.                                                                                                                                                              | `app/api/auth/passkey/**`                                                                                 |
| TOTP and SMS factors    | Enrolment, challenge and verification through Supabase Auth.                                                                                                                                                                                                                                                              | `lib/security/mfa.ts`, `app/api/auth/mfa/**`                                                              |
| Email verification      | Hashed, single-use tokens with a 20-minute lifetime. The proxy redirects signed-in but unverified users to `/verify`.                                                                                                                                                                                                     | `lib/security/emailVerification.ts`, `app/api/auth/email/**`, `lib/proxy.ts`                              |
| Password reset          | Hashed tokens with a 20-minute lifetime. A token is consumed by an update guarded on `used = false`, so it cannot be used twice.                                                                                                                                                                                          | `lib/security/passwordReset.ts`, `app/api/auth/password/reset/route.ts`                                   |
| Breached-password check | New passwords at signup and at password reset are checked against Have I Been Pwned using the k-anonymity range API (only the first five characters of the SHA-1 hash leave the server). The check fails open if the service is unreachable.                                                                              | `lib/security/password-breach.ts`, `app/api/auth/signup/route.ts`, `app/api/auth/password/reset/route.ts` |
| Session handling        | Sign-out ends the current session. Changing the password revokes the user's other sessions through Supabase Auth. A sessions route signs out the current, the other, or all sessions.                                                                                                                                     | `app/api/auth/signout/route.ts`, `app/api/auth/password/route.ts`, `app/api/auth/sessions/route.ts`       |
| Account deletion        | Requires the account password (or, for accounts with no password, the account email typed as confirmation), writes an audit row first, then deletes the auth user so the database cascades remove the rest.                                                                                                               | `app/api/account/route.ts`                                                                                |

### 2.2 Authorization

| Control              | What the code does                                                                                                                                                                                                                                                    | Where                                                                                                                                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Row-level security   | Each of the 27 tables created by the migrations has an `ENABLE ROW LEVEL SECURITY` statement, counted on 17 November 2026. User-owned tables have policies keyed on `auth.uid()`; internal tables (tokens, rate-limit counters) have no policy for application roles. | `supabase/migrations/`                                                                                                                                                                                                                    |
| Privileged functions | Privileged operations run in `SECURITY DEFINER` functions. Later migrations add caller checks and pin `search_path` on the functions they touch.                                                                                                                      | `supabase/migrations/20260216090000_harden_security_functions.sql`, `supabase/migrations/20260729110000_harden_definer_guards_and_drop_permissive_policies.sql`, `supabase/migrations/20260729120000_harden_remaining_definer_guards.sql` |
| Service-role client  | Used only on the server, for operations that have no user session (token flows, account deletion).                                                                                                                                                                    | `lib/supabase/admin.ts`                                                                                                                                                                                                                   |
| Fresh-database build | CI builds a database from the migrations alone, so a migration set that cannot be replayed fails the build.                                                                                                                                                           | `tools/database/verify-fresh-build.sh`, `.github/workflows/ci-cd.yml`                                                                                                                                                                     |

### 2.3 Request integrity and browser protections

| Control                   | What the code does                                                                                                                                                                                                                                                                                                                                         | Where                                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Cross-site request checks | The proxy rejects state-changing requests whose `Origin` (or, failing that, `Referer`) is neither the request's own host nor a configured trusted origin. This is an origin check, not a double-submit token check: a `__Host-csrf` cookie is issued, and token validation exists in `lib/security/csrf.ts`, but only the two gamification routes call it. | `lib/proxy.ts`, `lib/security/csrf.ts`, `lib/security/trusted-origins.ts`                         |
| Content Security Policy   | A per-request nonce; `script-src` has no `unsafe-inline`. `style-src` keeps `unsafe-inline` because the map and styling libraries inject styles at run time.                                                                                                                                                                                               | `lib/security/csp.ts`                                                                             |
| Security headers          | `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and related headers are set by the proxy; static assets get theirs from `public/_headers`.                                                                                                                                               | `lib/proxy.ts`, `public/_headers`                                                                 |
| CSP violation reports     | An endpoint accepts browser CSP reports.                                                                                                                                                                                                                                                                                                                   | `app/api/csp-report/route.ts`                                                                     |
| Input validation          | Request bodies are parsed with a size limit (100 KB by default) and validated with Zod schemas before use.                                                                                                                                                                                                                                                 | `app/api/_lib/middleware.ts` (`parseJsonBody`), `lib/schemas/auth.ts`, schemas in the route files |
| Header scan endpoint      | Scans only two allowlisted project origins, so it cannot be pointed at arbitrary hosts.                                                                                                                                                                                                                                                                    | `lib/security/scan-target.ts`, `app/api/security/scan-headers/route.ts`                           |

### 2.4 Abuse prevention

Rate limiting is a fixed-window counter per key. The store is Upstash Redis or a compatible REST store when configured, otherwise a Postgres function; an in-memory store is refused in production for limiters marked fail-closed.

| Limiter                      | Window | Max requests | On store failure |
| ---------------------------- | ------ | ------------ | ---------------- |
| `loginLimiter`               | 15 min | 10           | deny             |
| `signupLimiter`              | 1 hour | 5            | deny             |
| `passwordResetLimiter`       | 1 hour | 10           | deny             |
| `passwordResetTokenLimiter`  | 15 min | 10           | deny             |
| `emailVerifyTokenLimiter`    | 15 min | 20           | deny             |
| `passkeyAuthLimiter`         | 15 min | 10           | deny             |
| `webauthnRegisterLimiter`    | 1 hour | 10           | deny             |
| `webauthnAuthLimiter`        | 15 min | 10           | deny             |
| `webauthnCredentialsLimiter` | 15 min | 20           | deny             |
| `passwordBreachLimiter`      | 1 min  | 50           | deny             |
| `securityScanLimiter`        | 1 min  | 20           | deny             |
| `apiLimiter`                 | 1 min  | 200          | allow            |
| `mutationLimiter`            | 1 min  | 60           | allow            |
| `bulkOperationLimiter`       | 1 min  | 10           | allow            |
| `passkeyStatusLimiter`       | 1 min  | 100          | allow            |

Source: `lib/services/rateLimitService.ts`, `lib/security/webauthn.ts`. In production the client IP is read from the platform's own header (`cf-connecting-ip` on Cloudflare); `x-forwarded-for` is not trusted there: `lib/security/ip.ts`.

Scheduled cleanup routes are protected by a bearer secret compared in constant time: `lib/security/constant-time-compare.ts`, `app/api/auth/email/cleanup/route.ts`.

### 2.5 Audit logging

The `audit_logs` table records security-relevant events with the actor, action, severity, IP address and user agent. Application roles can only add rows, through `SECURITY DEFINER` functions; row-level security denies them updates and deletes. It is not cryptographically tamper-evident: there is no hash chain, the service role can modify rows, and a retention function deletes old ones. Sensitive fields are removed before a payload is stored (`sanitizeForAudit`). Authentication events (sign-in, sign-out, account deletion) are logged through `lib/security/auth-audit.ts`.

Where: `lib/security/audit.ts`, `lib/security/auth-audit.ts`, `app/api/audit/route.ts`, `supabase/migrations/20260214002000_restore_log_audit_function.sql`.

Error reports sent to Sentry have request bodies and sensitive headers removed first: `lib/observability/sentry-scrub.ts`.

### 2.6 Supply chain

- `package-lock.json` is committed and CI installs with `npm ci`.
- CI runs `npm audit --omit=dev --audit-level high` and fails on a high or critical advisory in a production dependency.
- CI runs a secrets scanner over tracked files: `tools/security/check-secrets.mjs`.
- `.env*` files are ignored by git; `.env.example` documents the variables with placeholders.

### 2.7 Provided by the platforms, not by this code

Encryption of the database at rest, TLS termination and network-level denial-of-service protection are provided by Supabase and Cloudflare. This repository neither implements nor verifies them.

---

## 3. Present in the repository but not in force

These modules are exported from `lib/security/index.ts`, but no route, component or the proxy imports them, and nothing imports that index file. They are design work, not controls.

| Module                                                | What it would do                                                                                                            |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `lib/security/request-signing.ts`                     | HMAC request signing with a timestamp tolerance                                                                             |
| `lib/security/ip-anomaly-detection.ts`                | Velocity and geolocation checks on client IPs                                                                               |
| `lib/security/device-fingerprinting.ts`               | Device recognition                                                                                                          |
| `lib/security/two-factor-backup-codes.ts`             | MFA backup codes                                                                                                            |
| `lib/security/session-termination.ts`                 | Session tracking in a `user_sessions` table that nothing writes to (session revocation uses Supabase Auth instead, see 2.1) |
| `lib/security/sri.ts`, `lib/security/sri-enhanced.ts` | Subresource Integrity hashes for third-party scripts                                                                        |
| `lib/security/csp-enhanced.ts`                        | A hash-based CSP builder with reporting options                                                                             |
| `lib/security/dns-resolution.ts`                      | DNS resolution for scan targets (superseded by the allowlist in `scan-target.ts`; covered by a unit test only)              |

Consequences worth stating plainly: there are no MFA backup codes, no request signing, no device or IP anomaly detection, and third-party scripts are not loaded with integrity attributes.

---

## 4. Known limitations

- **No independent review.** The audit records in this repository were produced by the maintainers.
- **Two passkey implementations.** The legacy routes and the table-backed routes coexist; the legacy ones keep credential data in `user_metadata`.
- **Origin check instead of token check** for most state-changing routes, as described in 2.3.
- **Breached-password check** fails open when the lookup service is unreachable.
- **Audit log** is append-only for application roles and is not tamper-evident.
- **Open findings.** The dated audit folders list findings and their status at the time they were written. Some entries carry a later "Status" line where a subsequent change closed them; an entry without one should be read as not shown closed in this repository.

---

## 5. Operational switches

| Capability                                              | Where                                                                                                                 |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Signup kill switch (`app_config.signup_enabled`)        | `app/api/auth/signup/route.ts`, `supabase/migrations/20260201084007_add_audit_logging_and_feature_flags.sql`          |
| Revoke a user's sessions                                | `app/api/auth/sessions/route.ts`                                                                                      |
| Scheduled cleanup of expired tokens and rate-limit rows | Worker cron triggers in `wrangler.jsonc`, dispatched by `cloudflare/worker.js` to the secret-protected cleanup routes |
