# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Raouf: Map Page Audit Round 2 — 4 Findings Fixed — 2026-02-10

**Scope:** Follow-up file-by-file audit of map module, fixing remaining issues from previous audit
**Type:** Bug fix / Performance / Code quality

#### Fixes Applied

1. **Wrapped `centerOnUser` in `useCallback`** (`useMapLocation.ts`) — was a plain function creating a new reference every render; now memoized with proper deps (`mapInstance`, `isMapReady`, `locationStatus`)
2. **Replaced `console.error` with `mapLog.error`** (`CampusMap.tsx`) — campus image load error handler used raw `console.error`; now uses the project's `devLog.map` utility for consistent logging
3. **Added `ImageOverlay` to `ReactLeafletComponents` type** (`leafletTypes.ts`) — interface was missing `ImageOverlay` which is used in `CampusMap.tsx`; also added JSDoc cross-reference to the runtime `ReactLeafletModule` type
4. **Added `AbortController` to ORS route fetch** (`useMapNavigation.ts`, `lib/services/ors.ts`) — replaced boolean `active` flag with proper `AbortController`; in-flight fetch requests are now cancelled on effect cleanup; added `AbortError` handling in `fetchORSRoute`

#### Files Changed

- `app/map/hooks/useMapLocation.ts` — `centerOnUser` wrapped in `useCallback`
- `app/map/CampusMap.tsx` — `console.error` → `mapLog.error`
- `lib/map/leafletTypes.ts` — added `ImageOverlay` to `ReactLeafletComponents`
- `lib/services/ors.ts` — added optional `signal` param, `AbortError` handling
- `app/map/hooks/useMapNavigation.ts` — `AbortController` replaces boolean flag
- `tests/map/useMapNavigation.test.ts` — updated assertion to expect `AbortSignal`

### Raouf: Map Page Production Audit — 25 Findings Fixed — 2026-02-09

**Scope:** Full file-by-file audit of map page module (30+ files), all findings fixed
**Type:** Bug fix / Performance / Security / Accessibility / Architecture

#### Fixes Applied (by severity)

**High (3):**

- **Fixed stale closure in navigation state subscription** — `useMapNavigation.ts` callback captured mutable values; now uses refs and registers once
- **Fixed unnecessary ORS route refetches** — removed `isNavigating` from route effect deps; toggling navigation no longer triggers API calls
- **Fixed server route cache memory leak** — `ipCacheCount` in `navigate/route.ts` now decrements on TTL expiry and eviction; added `clientIP` tracking to cache entries

**Medium (12):**

- **Fixed duplicate `@keyframes shimmer`** — two definitions in `animations.css` (background-position vs transform) overwrote each other; renamed second to `shimmer-translate`
- **Removed duplicate overlay management** — deleted `useMapOverlays.ts` hook (duplicate of `MapOverlays.tsx` component)
- **Fixed async overlay race condition** — `MapOverlays.tsx` now uses `aborted` flag to prevent stale overlay additions after deps change
- **Fixed popup string matching** — `CampusMap.tsx` now matches markers by CRS position instead of brittle popup content string matching
- **Fixed URL/store overlay sync** — now reacts to `searchParams` changes (supports browser back/forward) with loop guard
- **Fixed map readiness timeout** — increased to 5s, shows notice instead of silently hiding failed map
- **Added aria-labels to HUD buttons** — Share/Export buttons now accessible when text hidden on mobile
- **Removed drag="y" from buildings list** — prevented conflict with native overflow-y-auto scrolling
- **Removed `will-change: contents`** — from `.leaflet-overlay-pane` in `leaflet.css` (GPU memory risk on mobile)
- **Removed singleton NavigationStateManager** — `getNavigationManager()`/`resetNavigationManager()` conflicted with per-component instances
- **Gated `simulatePosition` for production** — early-returns in prod, dev-only function
- **Fixed `RouteAnnouncer` type mismatch** — removed `'arrived'` from `locationStatus` (arrival via `navState` only)

**Low (5):**

- **Gated geospatialCalibration `console.warn`** — only logs RMSE in non-production
- **Derived `validOverlays` from source** — `mapStore.ts` now imports overlay IDs from `mapOverlays` instead of hardcoded array
- **Added passive flag to DeviceMotion listener** — prevents perf warnings
- **Cleared existing timeout in MapErrorBoundary** — prevents queuing multiple retry timeouts
- **Removed unused `isNavigating` prop** — from `useMapLocation` interface (fallback logic sufficient)

**Other:**

- Applied Prettier formatting to 16 files
- Fixed flaky CSRF perf test threshold (100ms → 500ms for 1000 crypto operations)
- **Fixed lint warning** in `useMapNavigation.ts` (removed unused `eslint-disable`)
- **Fixed format check failure** by adding `logs/` to `.prettierignore`

#### Verification

- `npm run check` ✅ (secrets, format, typecheck, lint, 411/411 tests, build all pass)

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
