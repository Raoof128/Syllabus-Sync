### Raouf: Custom Email Verification System — 2026-02-13

**Scope:** Replace Supabase email verification with a fully custom flow using Resend.
**Type:** Feature — Security Infrastructure

#### Architecture

`User → API → Database → Resend (email provider)`

No Supabase email service. No Supabase OTP. No magic links.

#### Deliverables

1. **SQL Migration** (`supabase/migrations/20260213000000_email_verifications.sql`):
   - `email_verifications` table with UUID PK, `user_id`, `token_hash` (SHA-256), `expires_at`, `used`, `created_at`
   - Partial indexes for fast token lookup, cleanup, and per-user invalidation
   - RLS enabled (service_role only)
   - `cleanup_expired_email_verifications()` SQL function
   - Optional `pg_cron` daily schedule (3:00 AM UTC)

2. **Token Utility** (`lib/security/emailVerification.ts`):
   - `generateVerificationToken()` — 32 random bytes, hex
   - `hashToken()` — SHA-256 hash (only hash stored in DB)
   - `getTokenExpiry()` — 20-minute expiry
   - `emailVerifySendLimiter` — 3 sends per hour per user, fail-closed

3. **Email Service** (`lib/services/emailService.ts`):
   - Resend API integration (`RESEND_API_KEY`)
   - Branded HTML template (Macquarie University crimson header, verify button, footer)
   - `sendVerificationEmail({ to, token })` — raw token in URL, never logged

4. **Send Verification Route** (`POST /api/auth/email/send-verification`):
   - Authenticated (requires session)
   - Rate-limited (3/hour via `emailVerifySendLimiter`)
   - Invalidates previous active tokens for the user
   - Generates new token, stores SHA-256 hash, sends email via Resend

5. **Verify Route** (`POST /api/auth/email/verify`):
   - Hashes incoming token, finds non-used + non-expired record
   - Marks token used (atomic update with race condition guard)
   - Confirms user via `adminClient.auth.admin.updateUserById()` with `email_confirm: true`
   - Generic "Invalid or expired verification link" for all failure cases (no info leakage)

6. **Cleanup Route** (`POST /api/auth/email/cleanup`):
   - Protected by `CRON_SECRET` bearer token
   - Calls `cleanup_expired_email_verifications()` RPC
   - Returns deleted count

7. **Verify Page** (`/verify?token=<raw_token>`):
   - Client-side landing page with loading → success/error states
   - Validates token format before sending to API
   - Links back to login on success or failure

8. **UI Update** (`PrivacySettings.tsx`):
   - Replaced `<SMSSetup>` component with "SMS verification coming soon" placeholder
   - Greyed out card with "Coming Soon" badge

9. **Config**:
   - Added `EMAIL_SEND_VERIFICATION`, `EMAIL_VERIFY`, `EMAIL_CLEANUP` to `API_ROUTES.AUTH`
   - Added `RESEND_API_KEY`, `VERIFICATION_EMAIL_FROM`, `CRON_SECRET` to `.env.local.example`

#### Security Constraints Met

- HTTPS only (token in URL, verified server-side)
- No raw tokens stored (SHA-256 only)
- 20-minute token expiry (no long-lived tokens)
- Tokens marked used after verification (no reuse)
- Generic error messages (no information leakage)
- Zod validation on all inputs
- Raw tokens never logged
- Rate limiting: 3 sends/hour, fail-closed
- Cron endpoint protected by shared secret

#### Files Changed

- `supabase/migrations/20260213000000_email_verifications.sql` (new)
- `lib/security/emailVerification.ts` (new)
- `lib/services/emailService.ts` (new)
- `app/api/auth/email/send-verification/route.ts` (new)
- `app/api/auth/email/verify/route.ts` (new)
- `app/api/auth/email/cleanup/route.ts` (new)
- `app/verify/page.tsx` (new)
- `lib/constants/config.ts` (modified)
- `.env.local.example` (modified)
- `features/settings/components/PrivacySettings.tsx` (modified)

#### Verification

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run test` ✅ (442/442 tests pass)

---

### Raouf: Verify TOTP Authenticator App Wiring — 2026-02-13

**Scope:** Audit and verify the full Authenticator App (TOTP) flow is correctly wired from settings to login.
**Type:** Verification / Security Audit

#### Findings

**Status: Fully Wired & Working** — No issues found.

1. **Enrollment Flow (Settings → Privacy Tab)**:
   - `TOTPSetup.tsx` → `POST /api/auth/mfa/enroll` → Supabase `mfa.enroll({ factorType: 'totp' })`
   - Returns QR code, secret, URI with `Cache-Control: no-store` (prevents TOTP secret caching)
   - User enters 6-digit code → `POST /api/auth/mfa/verify` → `mfa.challenge()` + `mfa.verify()` → factor verified
   - Unenroll via `POST /api/auth/mfa/unenroll` requires aal2 re-authentication

2. **Login Flow**:
   - `loginAction()` → `signInWithPassword()` (aal1) → `getAuthenticatorAssuranceLevel()`
   - If `nextLevel === 'aal2'` && `currentLevel === 'aal1'` → returns `mfaRequired: true` with verified factors
   - `MFAChallenge` component renders → user enters code → `POST /api/auth/mfa/challenge-verify`
   - Server creates challenge + verifies → session upgraded to aal2 → redirect to /home
   - **Fail-closed**: If MFA check throws, login is blocked (prevents MFA bypass)

3. **Security Controls**:
   - Rate limiting: 5 verify attempts/15min, 10 enrollments/hour, 5 unenrollments/hour
   - Zod validation on all endpoints (UUID factorId, 6-digit numeric code)
   - Client-side: 5 max attempts, auto-cancel after max failures
   - Factor switcher supports both TOTP and SMS

4. **Test Coverage**: 68/68 security tests pass (mfa.test.ts, mfa-status.test.ts, totp-enroll-cachecontrol.test.ts, login-mfa-failclosed.test.ts, webauthn tests)

---

### Raouf: Wire Security Settings to Login Page — 2026-02-13

**Scope:** Connect security settings from Privacy tab to the login page with visual indicators.
**Type:** Bug Fix / Feature Enhancement

#### Changes Applied

1. **Passkey Status API Bug Fix (passkey/status/route.ts)**:
   - **Bug:** Was using `adminClient.from('auth.users')` which silently fails with Supabase JS client (can't query system tables). This caused the biometric login button to always show "disabled" on the login page.
   - **Fix:** Replaced with `adminClient.rpc('lookup_user_by_email')` RPC call, matching the working pattern from the passkey options route.
   - **Enhancement:** Now also returns `mfaEnabled` field by checking verified MFA factors via `adminClient.auth.admin.mfa.listFactors()`.

2. **Login Page Security Indicators (LoginClient.tsx)**:
   - Added a "Security Methods" panel that appears after the user enters a valid email
   - Shows color-coded badges for:
     - **Biometric Login**: green badge when passkey/biometric is registered, grey when not
     - **2FA Status**: green "2FA Enabled" badge when TOTP/SMS is set up, grey "2FA Off" when not
   - Updated passkey button: disabled when passkey is unavailable, highlighted with green border when available
   - Removed redundant passkey status text, replaced with integrated security methods panel

#### Files Changed

- `app/api/auth/passkey/status/route.ts`
- `app/login/LoginClient.tsx`

#### Verification

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run test` ✅ (442/442 tests pass)

---

### Raouf: Integrate Security Options into Privacy Settings Tab — 2026-02-13

**Scope:** Add all security options to Privacy settings tab with full test coverage.
**Type:** Feature Integration / Test Fix

#### Changes Applied

1. **Security Components Integration (PrivacySettings.tsx)**: Integrated all multi-factor authentication and security options into the Privacy settings tab:
   - Added BiometricToggle component for fingerprint/face ID authentication
   - Added TOTPSetup component for authenticator app 2FA (Google Authenticator, Authy, etc.)
   - Added SMSSetup component for SMS-based 2FA
   - Added PasskeyManager component for WebAuthn/FIDO2 passkeys
   - Implemented MFA status fetching with `fetchMFAStatus` callback that calls `/api/auth/mfa/status`
   - Added loading state while fetching MFA factors
   - Created new "Two-Factor Authentication & Security" section with Shield icon

2. **Test Suite Fixes (PrivacySettings.test.tsx)**: Fixed all 23 tests that were failing due to react-query dependency:
   - Mocked security components (BiometricToggle, TOTPSetup, SMSSetup, PasskeyManager) to avoid QueryClient errors
   - Mocked `useSessionManager` hook with controllable state for session-related tests
   - Added API_ROUTES.AUTH.MFA_STATUS and API_ROUTES.AUTH.PASSWORD to config mock
   - Added SECURITY_CONFIG with MIN_PASSWORD_LENGTH to config mock
   - Updated all tests to mock MFA status fetch on component mount
   - Updated session tests to use mocked hook instead of expecting direct fetch calls
   - Fixed async/await patterns in act() calls for proper state update handling

#### Files Changed

- `features/settings/components/PrivacySettings.tsx`
- `tests/settings/PrivacySettings.test.tsx`

#### Verification

- `npm test -- tests/settings/PrivacySettings.test.tsx` ✅ (23/23 tests pass)
- All security components properly integrated
- MFA status fetching works correctly
- Tests are robust with proper mocking

---

### Raouf: Event Highlight, Clickable Announcements, Security Wiring & UnitForm Scroll — 2026-02-13

**Scope:** Fix 4 UX issues across calendar, feed, settings, and unit form.
**Type:** Bug Fix / Enhancement

#### Changes Applied

1. **Event Highlight Timing (CalendarWidgets.tsx)**: Fixed `animate-pulse` highlight persisting indefinitely when navigating from Home "View All" to calendar. Added `eventHighlightDismissed` state with a 3-second auto-clear timeout. Also updated section highlight from 2s to 3s for consistency.
2. **Clickable Announcement Cards (AnnouncementsSection.tsx)**: Announcement cards in the feed sidebar are now interactive. Clicking a card expands it to show the full message text (removes `line-clamp-2`) and reveals optional links. Includes a chevron indicator, keyboard accessibility, and `aria-expanded` state.
3. **Security Settings to Login Page (SecuritySettings.tsx)**: Added an "Account Security" section with a "Change Password" button that navigates to `/login?redirectTo=/settings/security`, allowing users to re-authenticate and return to settings.
4. **UnitForm Scroll Fix (UnitForm.tsx)**: Restructured the dialog layout from `overflow-y-auto` on the entire dialog to a flex column layout (`flex flex-col overflow-hidden`) where only the form body scrolls (`flex-1 overflow-y-auto min-h-0`). Header and footer remain fixed. Supports adding class times for all 7 days (Monday–Sunday) without overflow issues.

#### Files Changed

- `features/calendar/components/CalendarWidgets.tsx`
- `features/feed/components/AnnouncementsSection.tsx`
- `features/settings/components/SecuritySettings.tsx`
- `components/units/UnitForm.tsx`

#### Verification

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run test` ✅ (442/442 tests pass)
- `npm run build` ✅

---

### Raouf: Full System Integrity Check & Test Fix — 2026-02-12

**Scope:** Run full project verification and fix test regression.
**Type:** Quality Assurance / Maintenance

#### Changes Applied

1.  **Full Verification**: Successfully ran the entire verification suite:
    - `npm run format`: Ensured consistent code style.
    - `npm run lint`: Verified all lint rules.
    - `npm run typecheck`: Verified all TypeScript types.
    - `npm run test`: All 428 tests passed.
    - `npm run build`: Production build completed successfully.
2.  **Test Fix**: Fixed a regression in `NotificationSettings.tsx` where a `data-testid` was changed, causing unit tests to fail. Restored the expected test ID `enable-notifications-button`.

#### Files Changed

- `features/settings/components/NotificationSettings.tsx`

#### Verification

- `npm run check` ✅ (All steps passing)

### Raouf: Settings Page Components Refactor — 2026-02-12

**Scope:** Refactor settings components for reusability and type safety.
**Type:** Refactor / Bug Fix

#### Changes Applied

1.  **Component Refactoring**:
    - Extracted `ToggleControl` and `NotificationRow` from `NotificationSettings.tsx`.
    - Created `GamificationToggleRow` to reduce duplication in `GamificationSettings.tsx`.
2.  **Type Safety & i18n**:
    - Fixed missing translation keys in `translations.json` causing type errors.
    - Enforced strict type checking for setting keys.

#### Files Changed

- `features/settings/components/NotificationSettings.tsx`
- `features/settings/components/GamificationSettings.tsx`
- `features/settings/components/ToggleControl.tsx` (New)
- `features/settings/components/NotificationRow.tsx` (New)
- `features/settings/components/GamificationToggleRow.tsx` (New)
- `locales/en/translations.json`

#### Verification

- `npm run lint` passed ✅
- `npm run typecheck` passed ✅

### Raouf: Full System Integrity Check — 2026-02-12

**Scope:** Run full project verification and fix remaining lint issues.
**Type:** Quality Assurance / Maintenance

#### Changes Applied

1.  **Full Verification**: Successfully ran the entire verification suite:
    - `npm run format`: Ensured consistent code style.
    - `npm run lint`: Identified and fixed a cascading render issue.
    - `npm run typecheck`: Verified all TypeScript types.
    - `npm run test`: All 425 tests passed.
    - `npm run build`: Production build completed successfully.
2.  **Lint Fix**: Refactored `CalendarWidgets.tsx` to move a `setState` call into a `setTimeout` within an effect to avoid cascading renders and satisfy `react-hooks/set-state-in-effect`.

#### Files Changed

- `features/calendar/components/CalendarWidgets.tsx`

#### Verification

- `npm run check` ✅ (All steps passing)

### Raouf: Fix Merge Conflict in Calendar — 2026-02-12

**Scope:** Resolve merge conflicts in `app/calendar/CalendarClient.tsx`.
**Type:** Bug Fix / Refactor

#### Changes Applied

1.  **Resolved Conflicts**: Fixed merge conflicts in `CalendarClient.tsx` related to the Todo editing form.
2.  **Combined Improvements**:
    - Adopted the improved UI layout with icons from the refactor branch.
    - Retained accessibility improvements (`aria-label`) and code cleanup (`UNIT_COLORS`) from the main branch.

#### Files Changed

- `app/calendar/CalendarClient.tsx`

#### Verification

- Manual verification of code structure and conflict resolution.

### Raouf: Calendar Page Refactor, Accessibility & Full System Check — 2026-02-12

**Scope:** Refactor `CalendarClient.tsx`, resolve all linting/accessibility warnings, and verify system integrity.
**Type:** Refactoring / Accessibility / Quality Assurance

#### Changes Applied

1.  **Modular Refactor**: Extracted non-UI logic from `CalendarClient.tsx` into specialized hooks.
2.  **Accessibility (A11y)**: Added keyboard listeners, roles, and tab indexing to interactive calendar elements.
3.  **i18n**: Fixed missing translation keys in `translations.json`.
4.  **Formatting**: Ran Prettier across the codebase to ensure consistent style.
5.  **Full Verification**: Verified the entire project using `npm run check`, ensuring all tests pass and the production build is stable.

#### Files Changed

- `app/calendar/CalendarClient.tsx` (simplified & accessible)
- `features/calendar/components/CalendarWidgets.tsx` (updated refs)
- `locales/en/translations.json` (fixed missing keys)
- Multiple files formatted via Prettier.

#### Verification

- `npm run check` ✅ (Formatting, Lint, Typecheck, 425/425 Tests, Build)

### Raouf: Home Page Refactor — 2026-02-11

**Scope:** Refactor `HomeClient.tsx` into smaller composable hooks.
**Type:** Refactoring / Code Quality

#### Changes Applied

1.  Identified `HomeClient.tsx` as a high-priority refactor target due to multiple responsibilities (Auth, Data, UI, Events).
2.  Extracted logic into 5 new custom hooks in `features/home/hooks/`:
    - `useHomeUser`: Auth state and profile logic.
    - `useSampleSeeding`: Local storage and sample data seeding.
    - `useHomeData`: Store selectors and initial data loading.
    - `useHomeEventListeners`: Window event listeners (FAB actions).
    - `useHomeErrorBoundary`: Error boundary state and recovery logic.
3.  Refactored `HomeClient.tsx` to use these hooks, reducing file size and complexity.

#### Files Changed

- `app/home/HomeClient.tsx` (simplified)
- `features/home/hooks/index.ts` (new)
- `features/home/hooks/useHomeUser.ts` (new)
- `features/home/hooks/useSampleSeeding.ts` (new)
- `features/home/hooks/useHomeData.ts` (new)
- `features/home/hooks/useHomeEventListeners.ts` (new)
- `features/home/hooks/useHomeErrorBoundary.ts` (new)
- `features/home/types.ts` (new)

#### Verification

- `npm run check` ✅ (lint, typecheck, 425/425 tests, build)
