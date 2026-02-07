# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

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
