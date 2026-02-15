# Security Posture & Hardening Report

Generated: 2026-02-16  
Repository: `syllabus-sync`

## Executive Summary
This report documents security controls that are currently implemented and evidenced in code/configuration. Coverage includes authentication/session handling, MFA/TOTP/SMS, WebAuthn/passkeys, authorization and tenant boundaries, input validation, CSRF/CORS/security headers, abuse controls, data handling, cache behavior for sensitive data, logging/audit, dependency/CI controls, deployment hardening, and incident-readiness components.

Intentionally not covered in this pass:
- External managed-platform internals that are not in-repo (Supabase infrastructure hardening internals, Vercel platform internals, CDN/TLS edge configuration beyond in-repo headers and workflow settings).
- New feature design/redesign (documentation-only pass as requested).

## Control Catalogue
| Control | Purpose | Evidence (path + identifier/snippet) | Verification | Status |
|---|---|---|---|---|
| Authentication login flow hardening | Reduce brute force and credential enumeration | `app/api/auth/signin/route.ts` `loginLimiter(clientIP)` + generic `GENERIC_AUTH_ERROR`; `parseJsonBody(...BODY_SIZE_LIMITS.AUTH)`; zod schema | Code inspection; login flow tests in `app/login/__tests__/actions.test.ts` and `tests/security/login-mfa-failclosed.test.ts` | Implemented |
| Signup anti-enumeration + abuse controls | Prevent account existence leakage and bot abuse | `app/api/auth/signup/route.ts` `GENERIC_SIGNUP_SUCCESS`; honeypot `_gotcha`; `signupLimiter(clientIP)`; kill switch read from `app_config` key `signup_enabled` | Code inspection; change trace in `AGENT.md`/`CHANGELOG.md` (2026-02-16 remediation entry) | Implemented |
| Session cookie hardening | Store auth tokens in secure cookie flags | `lib/supabase/middleware.ts` sets `sb-access-token` + `sb-refresh-token` with `httpOnly: true`, `sameSite: 'lax'`, `secure` in production | Code inspection; runtime browser cookie attributes check | Implemented |
| Logout/session API | Server-side session invalidation | `app/api/auth/signout/route.ts` `supabase.auth.signOut()`; `app/api/auth/sessions/route.ts` POST validates `scope` then `supabase.auth.signOut({ scope })` | `tests/api/auth/sessions.test.ts` validates auth checks and scope handling | Implemented (scope-based) |
| MFA TOTP enrollment/verification | Step-up authentication and AAL2 enforcement | `app/api/auth/mfa/enroll/route.ts` `supabase.auth.mfa.enroll({ factorType: 'totp' })`; `verify/route.ts` and `challenge-verify/route.ts` do challenge+verify; `lib/security/mfa.ts` strict limiters (`failClosed: true`) | `tests/security/mfa-status.test.ts`, `tests/security/mfa.test.ts`, `tests/security/login-mfa-failclosed.test.ts` | Implemented |
| TOTP secret cache prevention | Prevent intermediaries/browser proxies from caching TOTP secret material | `app/api/auth/mfa/enroll/route.ts` sets `Cache-Control: no-store, no-cache, must-revalidate` and `Pragma: no-cache` | `tests/security/totp-enroll-cachecontrol.test.ts` | Implemented |
| MFA SMS | Optional phone factor with validation and throttling | `app/api/auth/mfa/sms/enroll/route.ts` validates E.164 and uses `smsSendLimiter`; `sms/verify/route.ts` uses `mfaVerifyLimiter` | Code inspection; endpoint behavior reproduces with invalid payload and 429 scenarios | Implemented |
| WebAuthn/passkeys (new table-backed flow) | Phishing-resistant authentication with challenge expiry and replay resistance | `app/api/webauthn/*`; `lib/security/webauthn.ts` `storeChallenge(...)`, `consumeChallenge(...)` one-time delete, `MAX_PASSKEYS_PER_USER`, counter updates | `tests/security/webauthn-auth-options.test.ts`, `tests/security/webauthn-credentials.test.ts` | Implemented |
| Legacy passkey cookie flow | Backward compatibility for earlier biometric metadata path | `app/api/auth/passkey/_lib.ts` challenge/user cookies `httpOnly`, `sameSite: 'strict'`, `secure` prod; `passkey/verify/route.ts` verifies assertion and updates counter | Code inspection; existing tests for biometric/session routes | Implemented (legacy path retained) |
| Route-level authz guards | Enforce authenticated access to protected APIs | `app/api/_lib/middleware.ts` `requireAuth` and `requireAuthWithRateLimit`; widespread usage across `app/api/*` | Code inspection; many API route tests exercise 401 behavior | Implemented |
| Object/tenant boundary checks in API queries | Prevent BOLA/IDOR at query layer | Representative: `app/api/units/[id]/route.ts` `.eq('id', id).eq('user_id', userId)`; similar in `events`, `deadlines`, `todos`, `notifications` | Code inspection + repository-wide grep for `eq('user_id', userId)` | Implemented |
| Database RLS boundary enforcement | Enforce tenant isolation even if API query filtering regresses | `lib/supabase/schema.sql` enables RLS on core tables + policies `USING (auth.uid() = user_id)` / owner constraints | Schema inspection; Supabase migration history includes RLS restoration/hardening entries | Implemented |
| SECURITY DEFINER function hardening | Prevent privilege misuse in database functions | `supabase/migrations/20260216090000_harden_security_functions.sql`: `IS DISTINCT FROM auth.uid()` checks, table allowlist for `restore_deleted`, execute revokes/grants | Migration inspection; linked in 2026-02-16 changelog hardening entry | Implemented |
| Input schema validation + XSS pattern filtering | Reduce malformed input and simple script-tag payload risks | `app/api/units/route.ts` zod schema uses regex disallowing `<`/`>` on text fields; `lib/schemas/auth.ts` strips HTML from `fullName` | Code inspection; API validation tests in `tests/api/middleware.test.ts` | Implemented |
| Query/body abuse controls | Prevent oversized payload DoS and malformed JSON parsing | `app/api/_lib/response.ts` + `app/api/_lib/middleware.ts` body-size checks (default 100KB, auth 10KB) and parse guards | Code inspection; middleware tests in `tests/api/middleware.test.ts` | Implemented |
| SQL-like search sanitization | Prevent wildcard/escape manipulation in `ilike` queries | `app/api/units/route.ts` `sanitizeSearchInput` escaping `%`, `_`, `\\` before `.or(...ilike...)` | Code inspection | Implemented |
| CSRF defenses (token + origin) | Mitigate cross-site state-changing requests | `lib/security/csrf.ts` double-submit token (`__Host-csrf`, `x-csrf-token`) + origin/referer checks; `lib/proxy.ts` sets CSRF cookie when absent; `lib/utils/api.ts` auto-attaches header for mutation requests | `tests/security/csrf-critical.test.ts` + manual mutation request with missing header/origin | Partially implemented |
| CORS allowlist enforcement | Prevent arbitrary-origin credentialed requests | `app/api/_lib/middleware.ts` `cors(...)` sanitizes wildcard when `credentials=true`, validates origin allowlist | Code inspection; manual preflight test with allowed/denied origin | Implemented |
| Browser security headers | Mitigate XSS, clickjacking, sniffing, mixed-content downgrade | `lib/proxy.ts` sets CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy; `config/next/next.config.ts` adds complementary static headers (`COOP`, `CORP`, etc.) | Manual `curl -I`/browser network header inspection | Implemented |
| CSP violation reporting | Detect attempted policy bypasses/XSS vectors | `app/api/csp-report/route.ts` accepts reports, sanitizes fields, optional webhook; `lib/security/csp.ts` includes `report-uri`/`report-to` directives | Code inspection; manual POST of CSP report payload | Implemented (limited rate-limit backend) |
| Brute-force/rate-limit framework | Protect auth and mutation endpoints against abuse | `lib/services/rateLimitService.ts` distributed store (Upstash/KV), fail-closed for sensitive endpoints, production memory-store guard | `tests/api/rateLimitService.test.ts`; endpoint behavior with 429s in security tests | Implemented |
| SSRF hardening for scanner endpoint | Prevent internal network probing via user-supplied URL | `app/api/security/scan-headers/route.ts` validates protocol, blocks local hosts/ports, DNS resolution checks against private IPs | Code inspection; manual test with `http://127.0.0.1` returns 400 | Implemented |
| Password breach checking (k-anonymity) | Detect compromised passwords without sending raw password to HIBP | `lib/security/password-breach.ts` SHA-1 prefix/suffix range query to HIBP; `app/api/security/check-password-breach/route.ts` adds validation + limiter | Code inspection; manual endpoint call and rate-limit behavior | Implemented |
| Secrets handling and admin-key isolation | Keep privileged keys server-side only | `.env.example`/`.env.local.example` warns `SUPABASE_SERVICE_ROLE_KEY` server-only; `lib/supabase/admin.ts` server-side admin client; `.gitignore` ignores `.env*` except template | Code inspection; CI secret scan command in workflows | Implemented |
| Secret scanning in CI | Catch committed credentials before deploy | `tools/security/check-secrets.mjs` + `package.json` script `check:secrets`; invoked in `.github/workflows/ci-cd.yml` and `production-deploy.yml` | Workflow inspection; local command run documented below | Implemented |
| Dependency risk gate | Detect vulnerable packages | `.github/workflows/ci-cd.yml` runs `npm audit --audit-level high`; `.github/workflows/production-deploy.yml` runs `npm audit --omit=dev --audit-level=high`; lockfile present (`package-lock.json`) | Workflow inspection; local audit command optional | Implemented |
| Sensitive-cache controls (client) | Reduce post-logout data remnants | `public/sw.js` `NO_CACHE_PATHS` include `/api/`, `/auth/`, app pages; network-only + offline `no-store`; `lib/utils/clientStorage.ts` and `lib/utils/serviceWorker.ts` clear storage/caches | `tests/security/totp-enroll-cachecontrol.test.ts` (header example) + manual logout/cache-clear checks | Implemented |
| PII minimization in persisted local profile store | Avoid storing direct identifiers in persisted Zustand payload | `lib/store/profilesStore.ts` `partialize` blanks `studentId` and `email` before persistence | Code inspection | Implemented |
| Audit trail + forensic controls | Preserve security event traceability | `app/api/audit/route.ts` authenticated read/write via RPC; `lib/security/audit.ts` sanitizes sensitive keys with `[REDACTED]`; migrations create `audit_logs` and `auth_audit_logs` with RLS | Code inspection; migration and endpoint behavior review | Implemented |
| Deployment pipeline hardening | Prevent insecure deployments and missing-secret rollout | `.github/workflows/production-deploy.yml` validates required secrets before build/deploy; runs lint/typecheck/tests/build/security checks; deploy gating | Workflow inspection | Implemented |
| Incident readiness kill switch | Allow emergency signup shutdown | `app/api/auth/signup/route.ts` reads `app_config.signup_enabled` and returns 503 when false; migrations define `app_config` + policy | Code inspection + DB flag toggle reproduction steps | Implemented |
| Cron-protected cleanup | Token hygiene for verification artifacts | `app/api/auth/email/cleanup/route.ts` requires `Authorization: Bearer ${CRON_SECRET}` before cleanup RPC; `vercel.json` schedules daily cleanup | Code inspection; manual unauthorized vs authorized request behavior | Implemented |
| Email verification account recovery path | Verify ownership before account activation | `lib/security/emailVerification.ts` hash-only token storage + 20 min expiry + invalidation; `app/api/auth/email/verify/route.ts` generic failure responses | Code inspection; historical change trace (`CHANGELOG.md` Custom Email Verification section) | Implemented |
| Backup-code recovery runtime path | Provide MFA recovery when device unavailable | Database object + helper logic exist: `lib/security/two-factor-backup-codes.ts`, `supabase/migrations/...backup_codes...` | Code search shows no mounted `app/api/security/backup-codes/*` routes | Not evidenced (runtime wiring) |
| Server-side session termination utility wiring | Invalidate other sessions after security events/password changes | Helpers exist in `lib/security/session-termination.ts` (`terminateAllOtherSessions`, `handleTerminateSessions`) | Code search shows no consuming API route wiring in `app/api/*` | Not evidenced (runtime wiring) |
| Enhanced CSP helper usage | Runtime use of `lib/security/csp-enhanced.ts` features (report-only helpers) | Helper exists/exported via `lib/security/index.ts`; active proxy uses `lib/security/csp.ts` | Code search shows no runtime invocation of `applyCSPHeaders`/enhanced builder in request path | Not evidenced (runtime usage) |

## Threat Model Snapshot (STRIDE-Oriented)
### Top Risks and Mitigations Evidenced
| Risk | Primary Threat Class | Mitigations Found | Evidence |
|---|---|---|---|
| Credential stuffing / brute force on auth surfaces | Spoofing, DoS | Per-IP/user rate limits with fail-closed on sensitive paths; generic auth errors; body-size caps | `lib/services/rateLimitService.ts`, `app/api/auth/signin/route.ts`, `app/login/actions.ts` |
| Cross-tenant data access (BOLA/IDOR) | Elevation of Privilege, Information Disclosure | Route guards + user-scoped query predicates + DB RLS policies | `app/api/_lib/middleware.ts`, `app/api/*/[id]/route.ts`, `lib/supabase/schema.sql` |
| MFA bypass during transient upstream failure | Elevation of Privilege | Fail-closed login behavior when MFA assurance check fails | `app/login/actions.ts` (`mfa_check_failed` path), `tests/security/login-mfa-failclosed.test.ts` |
| SSRF through security scanning feature | Tampering, Information Disclosure | URL allowlisting, blocked internal hosts/ports, DNS/private-IP checks, authenticated and rate-limited access | `app/api/security/scan-headers/route.ts` |
| XSS/clickjacking/data exfil via browser context | Tampering, Information Disclosure | CSP + frame restrictions + security headers + input validation constraints | `lib/proxy.ts`, `lib/security/csp.ts`, `config/next/next.config.ts`, `app/api/units/route.ts` |
| Sensitive artifacts retained client-side | Information Disclosure | Service worker no-cache policy for sensitive paths; explicit storage/cache clearing helpers; TOTP no-store response headers | `public/sw.js`, `lib/utils/clientStorage.ts`, `lib/utils/serviceWorker.ts`, `app/api/auth/mfa/enroll/route.ts` |

## Historical Security Change Traceability (AGENT/CHANGELOG → Code Evidence)
| Historical Entry | Claimed Security Change | Current Code Evidence |
|---|---|---|
| `AGENT.md` / `CHANGELOG.md` 2026-02-16 “Security Remediation Pass (excluding CSRF)” | SSRF hardening, rate-limit hardening, Supabase SECURITY DEFINER hardening, CI secret scanning | `app/api/security/scan-headers/route.ts`; `lib/services/rateLimitService.ts`; `supabase/migrations/20260216090000_harden_security_functions.sql`; `tools/security/check-secrets.mjs`; `.github/workflows/ci-cd.yml` |
| `CHANGELOG.md` 2026-02-13 “Custom Email Verification System” | SHA-256 hashed token flow, expiry, rate-limit, cron cleanup | `lib/security/emailVerification.ts`; `app/api/auth/email/verify/route.ts`; `app/api/auth/email/send-verification/route.ts`; `app/api/auth/email/cleanup/route.ts`; `vercel.json` |
| `AGENT.md` 2026-02-13 “Verify TOTP wiring” | End-to-end MFA setup and challenge verification with no-store + fail-closed checks | `app/api/auth/mfa/enroll/route.ts`; `app/api/auth/mfa/challenge-verify/route.ts`; `app/login/actions.ts`; `tests/security/totp-enroll-cachecontrol.test.ts`; `tests/security/login-mfa-failclosed.test.ts` |
| `CHANGELOG.md` 2026-02-14 “Supabase DB alignment + rollout” | Missing security tables/functions restored and RLS alignment | `supabase/migrations/20260214001000_align_code_db_objects.sql`; `supabase/migrations/20260214002000_restore_log_audit_function.sql`; `supabase/migrations/20260214003000_restore_missing_core_security_tables.sql` |

## Gaps & Next Hardening Steps
### High
- Backup-code runtime endpoints are not evidenced as mounted in `app/api`.
  - Evidence: backup-code logic exists in `lib/security/two-factor-backup-codes.ts`, but no `app/api/security/backup-codes/*` route files were found.
  - Recommendation: add authenticated API routes and UI wiring for generate/list/validate/regenerate flows, with dedicated rate limits and tests.
- Session-termination helpers are not evidenced as integrated with password-change/security workflows.
  - Evidence: `lib/security/session-termination.ts` provides handlers, but no `app/api` route imports/use found.
  - Recommendation: wire a protected endpoint and invoke termination-on-password-change policy; add integration tests for session invalidation.

### Medium
- CSRF control coverage is partial/heterogeneous.
  - Evidence: core CSRF module exists (`lib/security/csrf.ts`) and client header injection exists (`lib/utils/api.ts`), but some mutation routes explicitly rely on Supabase cookie behavior comments instead of full token middleware (`app/api/units/route.ts`).
  - Recommendation: standardize CSRF enforcement strategy per route class and document explicit exceptions. (No behavior changes performed in this pass.)
- CSP report endpoint uses in-memory rate limiting and wildcard CORS for report ingestion.
  - Evidence: `app/api/csp-report/route.ts` uses `Map` for limiter and `Access-Control-Allow-Origin: *` in OPTIONS.
  - Recommendation: move report rate-limiting to distributed limiter and consider stricter origin/report validation policy.

### Low
- Enhanced CSP helper module is present but not evidenced in runtime request path.
  - Evidence: `lib/security/csp-enhanced.ts` exports `applyCSPHeaders`, but proxy currently calls `getCSP` from `lib/security/csp.ts`.
  - Recommendation: remove dead path or adopt one canonical CSP module to reduce drift.
- Dependency version specifiers are broad (`^`) though lockfile is present.
  - Evidence: `package.json` dependency ranges with lockfile enforcement via `npm ci`.
  - Recommendation: keep lockfile disciplined and add automated dependency update policy plus periodic SCA review cadence.

## Verification
### Commands Run
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

### Command Results
- `npm run lint` passed (`Lint OK`).
- `npm run typecheck` passed (no TypeScript errors).
- `npm run test` passed (`50` test files, `443/443` tests). Note: non-fatal React `act(...)` warnings were printed in some UI tests.
- `npm run build` passed (Next.js production build completed; static/dynamic route manifest generated).

### Manual Security Validation Checklist
- Authentication/session
  - Attempt login with invalid credentials repeatedly until 429; confirm generic auth message and rate-limit headers.
  - Login successfully; verify auth cookies are `HttpOnly`, `SameSite`, and `Secure` (prod).
  - Call `POST /api/auth/sessions` with `{ "scope": "global" }`; verify session revocation response.
- MFA/TOTP
  - Start TOTP enrollment via `POST /api/auth/mfa/enroll`; confirm `Cache-Control: no-store, no-cache, must-revalidate` and `Pragma: no-cache`.
  - Verify challenge with invalid code returns validation error and rate limit triggers after repeated attempts.
- Rate limiting and abuse protection
  - Hit `POST /api/security/check-password-breach` repeatedly to confirm 429 behavior and `Retry-After`.
  - Submit blocked scan targets (`http://127.0.0.1`, internal hostnames) to `POST /api/security/scan-headers`; verify rejection.
- Cache/no-store
  - Inspect service worker behavior for `/api/*` and `/auth/*` requests; confirm network-only and no cache persistence.
  - Logout and verify local/session/indexedDB/cache clear routines executed.
- Security headers
  - Run `curl -I https://<host>` and validate presence of CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP.
