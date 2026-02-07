# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Raouf: Deploy Security Audit Migration + Env Setup — 2026-02-08

**Scope:** Deploy `lookup_user_by_email` RPC, set WebAuthn env vars, fix migration SQL
**Type:** DevOps / Deployment

- **Deployed** `20260208000000_security_audit_fixes.sql` migration to remote Supabase
- **Fixed** nested `$$` dollar-quoting in pg_cron DO block (`$outer$` / `$cron$` alternate quoting)
- **Repaired** migration history (16 remote-only → reverted, 20 local → applied)
- **Added** `WEBAUTHN_RP_ID` and `WEBAUTHN_ORIGIN` env vars to `.env.local` (localhost defaults)
- **Documented** WEBAUTHN env vars in `.env.example` with production guidance

### Raouf: Security Audit — Settings → Security — 2026-02-08

**Scope:** Full security audit of MFA + WebAuthn implementation  
**Type:** Security (hardening)

#### Audit Findings (8 total: 1 critical, 3 high, 2 medium, 2 info)

| #   | Severity | Finding                                                                     | Status                              |
| --- | -------- | --------------------------------------------------------------------------- | ----------------------------------- |
| 1   | CRITICAL | `admin.listUsers()` loads all users into memory (DoS + fails for >50 users) | ✅ Fixed                            |
| 2   | HIGH     | MFAChallenge.tsx bypasses server-side rate limiting                         | ✅ Fixed                            |
| 3   | HIGH     | Login MFA check is fail-open (network error bypasses MFA)                   | ✅ Fixed                            |
| 4   | HIGH     | WebAuthn credentials endpoints have no rate limiting                        | ✅ Fixed                            |
| 5   | MEDIUM   | TOTP enroll response missing Cache-Control: no-store                        | ✅ Fixed                            |
| 6   | LOW      | PasskeyManager uses hardcoded URL strings                                   | ✅ Fixed                            |
| 7   | INFO     | Challenge consumption not scoped by user_id in DB query                     | Acceptable (validated at app layer) |
| 8   | INFO     | No automated cleanup of expired WebAuthn challenges                         | ✅ Migration added                  |

#### Fixes Applied

- Replaced `adminClient.auth.admin.listUsers()` with `lookup_user_by_email` RPC function
- Re-routed MFAChallenge.tsx through `/api/auth/mfa/challenge-verify` server endpoint
- Changed login MFA status check from fail-open to fail-closed
- Added `webauthnCredentialsLimiter` rate limiter (20 req / 15 min, fail-closed)
- Added `Cache-Control: no-store` + `Pragma: no-cache` to TOTP enroll response
- Replaced hardcoded URLs in PasskeyManager.tsx with `API_ROUTES` constants
- Added pg_cron scheduled cleanup for expired WebAuthn challenges

#### Files Created (4)

- `supabase/migrations/20260208000000_security_audit_fixes.sql`
- `tests/security/webauthn-auth-options.test.ts` (7 tests)
- `tests/security/login-mfa-failclosed.test.ts` (4 tests)
- `tests/security/totp-enroll-cachecontrol.test.ts` (2 tests)

#### Files Modified (8)

- `app/api/webauthn/authenticate/options/route.ts` — RPC-based user lookup
- `app/login/components/MFAChallenge.tsx` — server-side MFA verification
- `app/login/actions.ts` — MFA fail-closed
- `app/api/webauthn/credentials/route.ts` — rate limiting on GET/DELETE
- `lib/security/webauthn.ts` — added credentials rate limiter
- `app/api/auth/mfa/enroll/route.ts` — Cache-Control headers
- `app/settings/components/security/PasskeyManager.tsx` — API_ROUTES constants
- `tests/security/webauthn-credentials.test.ts` — updated with rate limiting tests

#### Verification

- `npm run check` ✅ (secrets, format, typecheck, lint, 411/411 tests, build)

### Raouf: 2-Step Verification (MFA + WebAuthn) — 2026-02-07

**Scope:** Full 3-phase multi-factor authentication implementation  
**Type:** Feature (major)

#### Phase 1 — TOTP (Authenticator App 2FA)

- Added TOTP enrollment, verification, challenge, and unenroll API routes
- Added MFA status API route for retrieving enrollment state
- Added `TOTPSetup.tsx` settings component with QR code, manual secret, and verification flow
- Added `MFAChallenge.tsx` login component for TOTP code entry during sign-in
- Modified `loginAction` to detect MFA factors and return challenge state
- Modified `LoginClient.tsx` to render MFA challenge when required

#### Phase 2 — SMS Verification (Optional Fallback)

- Added SMS enrollment and verification API routes via Supabase phone factor
- Added `SMSSetup.tsx` settings component with E.164 phone entry and code verification
- MFA challenge component supports switching between TOTP and SMS factors

#### Phase 3 — Passkeys / WebAuthn (Custom DB-Backed)

- Created `webauthn_credentials` and `webauthn_challenges` Supabase tables with RLS
- Created `backup_codes` table (prepared for future use)
- Added WebAuthn register (options + verify) and authenticate (options + verify) API routes
- Added credentials management API route (list + delete passkeys)
- Added `PasskeyManager.tsx` settings component for adding/naming/removing passkeys
- Supports multiple passkeys per user (up to 10)
- Backwards-compatible with legacy `user_metadata` passkey storage

#### Infrastructure & Utilities

- Created `lib/security/mfa.ts` — rate limiters, validators, types, phone masking
- Created `lib/security/webauthn.ts` — challenge storage, credential CRUD, RP config
- Added 12 new API route constants to `lib/constants/config.ts`
- Updated `SecuritySettings.tsx` to include TOTP, SMS, and Passkey sections

#### Tests

- Added `tests/security/mfa.test.ts` — 19 tests for MFA validators and helpers
- Added `tests/security/mfa-status.test.ts` — 4 tests for MFA status API
- Added `tests/security/webauthn-credentials.test.ts` — 6 tests for credentials API

#### Files Created (20)

- `lib/security/mfa.ts`
- `lib/security/webauthn.ts`
- `app/api/auth/mfa/enroll/route.ts`
- `app/api/auth/mfa/verify/route.ts`
- `app/api/auth/mfa/challenge-verify/route.ts`
- `app/api/auth/mfa/status/route.ts`
- `app/api/auth/mfa/unenroll/route.ts`
- `app/api/auth/mfa/sms/enroll/route.ts`
- `app/api/auth/mfa/sms/verify/route.ts`
- `app/api/webauthn/register/options/route.ts`
- `app/api/webauthn/register/verify/route.ts`
- `app/api/webauthn/authenticate/options/route.ts`
- `app/api/webauthn/authenticate/verify/route.ts`
- `app/api/webauthn/credentials/route.ts`
- `supabase/migrations/20260207000000_add_webauthn_tables.sql`
- `app/settings/components/security/TOTPSetup.tsx`
- `app/settings/components/security/SMSSetup.tsx`
- `app/settings/components/security/PasskeyManager.tsx`
- `app/login/components/MFAChallenge.tsx`
- `CHANGELOG.md`

#### Files Modified (5)

- `app/login/LoginClient.tsx` — MFA challenge integration
- `app/login/actions.ts` — MFA detection after password auth
- `app/settings/components/SecuritySettings.tsx` — Added MFA/WebAuthn sections
- `lib/constants/config.ts` — 12 new API route constants
- `app/api/webauthn/authenticate/verify/route.ts` — `let` → `const` lint fix

#### Verification

- `npm run check` passes: secrets ✓ format ✓ typecheck ✓ lint ✓ test (396/396) ✓ build ✓
