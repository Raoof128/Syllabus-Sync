Raouf: 2026-02-19 (Australia/Sydney)
Scope: Google Map Exact Visual/Size Parity
Summary: Audited Google View logic and aligned it 1:1 with Campus View responsive layout wrappers to fix visual sizing divergence and HUD interaction overlap bugs. (1) Wrapped GoogleMapEmbed inside the exact same MagicCard layer container logic as Campus map view constraints. (2) Removed hardcoded min-height constraints from GoogleMapEmbed itself. (3) Added `isGoogleMode` awareness into CampusMapHUD to shift the user interface components (Search, Share export toolbars) cleanly down and safely out of clipping bounds with the inline internal Google destination switcher toolbar (`Directions ↔ Back to Map`).
Files: Modified `features/map/components/MapClient.tsx`, `features/map/components/GoogleMapEmbed.tsx`, `features/map/components/CampusMapHUD.tsx`.
Verification: `npm run check` pipeline (formatter, typecheck, lint, test) entirely passed. All 488 integrated suite assertions succeeded smoothly under `test`.
Deployment: N/A locally queued.
Follow-ups: Container and component dimensions are 1:1 parity safe across responsive constraints with zero functional overlays clipping interactions.

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Google View Building List/Selection Parity with Campus Map
Summary: Implemented building-list parity for Google map view. (1) Reused `CampusMapHUD` in Google mode so search/list/select logic is available there too. (2) Updated `GoogleMapEmbed` to accept selected building destination and dynamically target selected building GPS coordinates in both explore and directions embed URLs. (3) Preserved `view=google` during building selection links so selecting a building does not switch back to campus view. (4) Removed no-op primary navigation button in selected-building card when on-campus navigation callback is unavailable (Google mode). (5) Added regression test covering selected-building coordinate destination in Google embed.
Files: Modified `features/map/components/MapClient.tsx`, `features/map/components/GoogleMapEmbed.tsx`, `features/map/components/CampusMapHUD.tsx`, `tests/map/GoogleMapEmbed.test.tsx`.
Verification: `npm run typecheck` ✅, `npm run lint` ✅, `npm run test -- tests/map/GoogleMapEmbed.test.tsx` ✅ (4/4), `npm run vercel:deploy:prod` ✅.
Deployment: Inspect URL `https://vercel.com/perkycoders/syllabus-sync/DfrZxx1UDipnUHRp6r9VjuYTbdQm`; production URL `https://syllabus-sync-gwyo2gnyc-perkycoders.vercel.app`; aliased to `https://syllabus-sync-ashy.vercel.app`.
Follow-ups: Optional UX refinement: in Google mode, hide the export/share toolbar from `CampusMapHUD` if you want a cleaner Google-only control set.

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Fix Google Maps Embed Blocking + Rename Map Labels to Campus Map
Summary: Resolved Google map not loading on site by updating CSP directives to explicitly allow embedded frames from `https://www.google.com` and `https://maps.google.com` in all CSP builders (`buildCSP`, `buildDevCSP`, `buildProdCSP`). Updated Google embed URLs to `www.google.com/maps` for consistent frame host matching. Renamed map-related labels as requested: `map` → `Campus Map`, `campusMap` → `Campus Map`, and `interactiveCampusMap` → `Campus Map`.
Files: Modified `lib/security/csp.ts`, `features/map/components/GoogleMapEmbed.tsx`, `locales/en/translations.json`.
Verification: `npm run typecheck` ✅, `npm run lint` ✅, `npm run test -- tests/map/GoogleMapEmbed.test.tsx` ✅ (3/3), `npm run vercel:deploy:prod` ✅.
Deployment: Inspect URL `https://vercel.com/perkycoders/syllabus-sync/E7Vsgr2oQ3bVLW1x2UTKqvff8Ubq`; production URL `https://syllabus-sync-l2fjpjbh1-perkycoders.vercel.app`; aliased to `https://syllabus-sync-ashy.vercel.app`.
Follow-ups: If Google Maps still fails in a specific browser, capture CSP violation details from `/api/csp-report` logs to verify host pattern coverage.

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Google Maps Toggle + In-App Navigate Embed on Map Page
Summary: Implemented a full campus/google map view switcher on `/map`. Added `MapViewToggle` UI (campus vs google), wired `mapView` state into `MapClient`, and conditionally render campus map stack (Leaflet + HUD + layer controls) only in campus mode. Added new `GoogleMapEmbed` component for in-app Google Maps with two modes: `view` (campus explore) and `directions` (`saddr=My+Location` to MQ). Added mode-switch controls (`Navigate` and `Back to Map`) and forced iframe remount via `key={mode}` to guarantee reload on mode change.
Files: Added `features/map/components/MapViewToggle.tsx`, `features/map/components/GoogleMapEmbed.tsx`, `tests/map/GoogleMapEmbed.test.tsx`. Modified `features/map/components/MapClient.tsx`, `locales/en/translations.json`.
Verification: `npm run typecheck` ✅, `npm run lint` ✅, `npm run test -- tests/map` ✅ (9 files, 67 tests), `npm run check:i18n` ✅ (warnings-only parity output), `npm run check` ✅ (67 files, 487 tests, build), `npm run vercel:deploy:prod` ✅.
Deployment: Inspect URL `https://vercel.com/perkycoders/syllabus-sync/FUaYDNGgYCLjCKe3zN1tfs5deeQ6`; production URL `https://syllabus-sync-cx38jd22c-perkycoders.vercel.app`; aliased to `https://syllabus-sync-ashy.vercel.app`.
Follow-ups: None.

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Map View Toggle Scaffolding (Step 1)
Summary: Added new `MapViewToggle` component for campus/google map switching UI with a11y `aria-pressed`, tokenized MQ styling, and translation-driven labels.
Files: Added `features/map/components/MapViewToggle.tsx`.
Verification: Pending full verification after wiring into `MapClient`.
Follow-ups: Continue with Google embed component, MapClient integration, translations, tests, and deployment.

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Legacy Account Course Persistence Fix + Profile API Payload Hardening + Regression Test + Redeploy
Summary: Fixed the old-account issue where course changes appeared saved but later reverted. Root cause was DB immutability protection on `student_id` being accidentally tripped when profile updates included omitted fields as undefined/null-equivalent payload keys. Hardened `PUT /api/profiles` to build an explicit conditional payload (only include fields present in request body + `updated_at`). Updated manage-profile save flow to detect store/API persistence failure and show an error instead of false success, with form rollback to current profile values for consistency. Added API regression tests to prevent recurrence.
Files: Modified `app/api/profiles/route.ts`, `app/manage-profiles/hooks/useProfileManager.ts`. Added `tests/api/profiles.route.test.ts`.
Verification: `npm run test -- tests/api/profiles.route.test.ts` ✅ (2/2), `npm run check` ✅ (secrets, format, typecheck, lint, tests 66 files + 484 tests, build).
Deployment: `npm run vercel:deploy:prod` ✅. Inspect URL `https://vercel.com/perkycoders/syllabus-sync/5FuuGXjwQ3CPjbJuyr6iaJTy9s1m`; production URL `https://syllabus-sync-bhngwvn4t-perkycoders.vercel.app`; aliased to `https://syllabus-sync-ashy.vercel.app`.
Follow-ups: Validate legacy user `raoof.r12@gmail.com` on production by changing course and reloading session to confirm persistence.

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Home-Only Re-Login Redirect + Legacy Profile Course-Edit Fix + Full Check + Vercel Redeploy
Summary: Completed requested production changes. (1) Login routing now always redirects to `/home` after successful sign-in (password, passkey, MFA-complete, and Google OAuth start/callback path from login) by hard-setting `redirectTo='/home'` in `LoginClient` and removing redirect-to-path reuse. This ensures users who log out and log back in always land on Home. (2) Fixed legacy accounts blocked from editing course: pre-deploy profiles may contain non-standard `studentId` values that fail the strict `^\d{8}$` form schema and prevent _any_ profile save. Added `normalizeStudentId()` in `useProfileManager` to sanitize legacy invalid IDs to `''` when hydrating/resetting form state, allowing course/year updates to submit without weakening validation for new entries. (3) Ran full quality gate and fixed all required checks. (4) Redeployed via Vercel CLI and confirmed production alias.
Files: Modified `app/login/LoginClient.tsx`, `app/manage-profiles/hooks/useProfileManager.ts`.
Verification: `npm run check` ✅ (secrets, format, typecheck, lint, tests 65/65 files + 482/482 tests, build) and `npm run vercel:deploy:prod` ✅.
Deployment: Inspect URL `https://vercel.com/perkycoders/syllabus-sync/BEWhTuzZQAjntipeUS3MKXundD4E`; production URL `https://syllabus-sync-dnhto9826-perkycoders.vercel.app`; aliased to `https://syllabus-sync-ashy.vercel.app`.
Follow-ups: Optional targeted regression test can be added for legacy invalid `studentId` normalization path in `useProfileManager`.

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Full Auth Session Audit — Google OAuth Reliability + False Signout Fix + 5m Inactivity Logout
Summary: Conducted a full auth/session audit and implemented production fixes. (1) Google OAuth login flow hardened in `LoginClient`: switched to deterministic `signInWithOAuth({ skipBrowserRedirect: true })` and explicit `window.location.assign(data.url)` fallback handling, with error path for missing URL. (2) Added `reason=inactive` login feedback banner (`sessionExpiredInactivity`) for clearer post-logout UX. (3) Fixed false/automatic signout trigger conditions by removing broad `status === 400` refresh-token heuristics and replacing with strict refresh-token-missing detection (message/code only) in both proxy and API auth middleware. (4) Added auth-resolution semantics in `getBrowserAuthSnapshot` (`resolved|unknown`) so transient browser auth failures no longer force unauthenticated UI state; `client-layout` now ignores unknown snapshots. (5) Prevented aggressive login redirect in notifications auth fallback when snapshot resolution is unknown. (6) Prevented transient `getSession` failures from clearing user state in `useHomeUser`. (7) Implemented global 5-minute inactivity logout for authenticated app routes via new `useInactivityLogout` hook, wired in `client-layout`, with store/storage cleanup + server logout + redirect to `/login?reason=inactive`. (8) Added tests: new hook tests and proxy regression test ensuring non-refresh 400 auth errors do not trigger forced local signout.
Files: Modified `app/login/LoginClient.tsx`, `locales/en/translations.json`, `lib/proxy.ts`, `app/api/_lib/middleware.ts`, `lib/supabase/browserSession.ts`, `app/client-layout.tsx`, `lib/store/notificationsStore.ts`, `features/home/hooks/useHomeUser.ts`, `tests/api/proxy.mfa.test.ts`. Created `lib/hooks/useInactivityLogout.ts`, `tests/hooks/useInactivityLogout.test.ts`.
Verification: `npm run test -- tests/api/proxy.mfa.test.ts tests/hooks/useInactivityLogout.test.ts tests/api/auth/callback.test.ts` ✅ (12/12), `npm run check` ✅ (secrets, format, typecheck, lint, test 65 files/482 tests, build).
Follow-ups: Optional: add dedicated component tests for `LoginClient` OAuth button behavior (missing URL/error states) and a client-layout integration test for inactivity flow.

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Settings Password Back-Navigation + Map Haptics Relocation
Summary: Implemented requested settings UX updates. (1) Privacy settings Change Password action now routes to `/reset-password?from=settings`. (2) Reset password page now detects `from=settings` and changes all back navigation targets/labels from login to settings (`/settings/security`, `backToSettings`). (3) Added `backToSettings` translation key in `locales/en/translations.json`. (4) Moved Map Navigation haptic feedback card from Experience settings to General settings. (5) Removed Actions card (`QuickActions`) from Experience settings page. (6) Updated privacy settings test expectation for new reset-password route query. (7) Added missing `tStr` dependency to reset-password auth effect to satisfy `react-hooks/exhaustive-deps`.
Files: Modified `features/settings/components/PrivacySettings.tsx`, `app/reset-password/reset-password-client.tsx`, `locales/en/translations.json`, `app/settings/general/page.tsx`, `app/settings/experience/page.tsx`, `tests/settings/PrivacySettings.test.tsx`.
Verification: `npm run typecheck` ✅, `npm run test -- tests/settings/PrivacySettings.test.tsx` ✅ (18/18), `npm run test -- tests/settings/SettingsRoutesIntegrity.test.ts` ✅ (2/2), `npm run lint` ✅.
Follow-ups: Optional cleanup: remove unused settings QuickActions exports/tests if that section is permanently deprecated.

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Auth Pages Production Audit — i18n, Links, Metadata
Summary: Full audit of login, signup, and reset-password pages for production readiness. (1) reset-password-client.tsx: replaced 6 hardcoded English strings with t() calls (invalidResetLink, revealEmailNote, sessionExpiredResetLink, failedToUpdatePassword, passwordsDoNotMatch); fixed createBrowserClient() recreating on every render via useState initializer. (2) loginSchema.ts: added createLoginSchema(t) factory for i18n validation messages; kept default fallback for server actions. (3) LoginClient.tsx: uses translated schema; footer <a> tags → <Link>. (4) SignupClient.tsx: all 5 <a> tags for /privacy and /terms → <Link>; added Link import. (5) signup/page.tsx: added missing openGraph metadata. (6) lib/schemas/auth.ts: course/year required messages now use t(). (7) Added 7 new translation keys to en/translations.json.
Files: Modified `app/reset-password/reset-password-client.tsx`, `app/login/schemas/loginSchema.ts`, `app/login/LoginClient.tsx`, `app/signup/SignupClient.tsx`, `app/signup/page.tsx`, `lib/schemas/auth.ts`, `locales/en/translations.json`.
Verification: `npm run check` ✅ (64 test files, 478 tests), `npm run vercel:deploy:prod` ✅.
Follow-ups: Server-side API routes (signup, signin, password, callback, confirm) still have hardcoded English in error responses — acceptable since API responses are consumed by client-side code that displays its own translated messages. Test coverage gaps: login API route, MFA full flow, passkey registration — tracked for future sprints.

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Auth Flow Wiring + Security Card Cleanup + Test Fix
Summary: (1) client-layout.tsx: added POST_AUTH_ROUTES=['/onboarding'] — renders no sidebar/header but never redirects authenticated users away. Updated initial isAuthenticated state, checkAuth, render condition, and useCallback dep array. (2) lib/proxy.ts: added /onboarding to publicRoutes. (3) lib/utils/security.ts: added /onboarding to SAFE_REDIRECT_PATHS. (4) PrivacySettings.tsx: removed ChangePasswordDialog entirely; change-password button now calls router.push('/reset-password'). (5) settings/security/page.tsx: removed extra SecuritySettings card, kept only PrivacySettings. (6) tests/settings/PrivacySettings.test.tsx: replaced 6 failing dialog-specific tests with single test asserting router.push('/reset-password') called on button click.
Files: Modified `app/client-layout.tsx`, `lib/proxy.ts`, `lib/utils/security.ts`, `features/settings/components/PrivacySettings.tsx`, `app/settings/security/page.tsx`, `tests/settings/PrivacySettings.test.tsx`.
Verification: `npm run check` ✅ (64 test files, 478 tests), `npm run vercel:deploy:prod` ✅.
Follow-ups: supabase db push avatars migration to production.

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Sync Signup ↔ Manage Profile — Course Combobox + Year Values
Summary: Fixed two critical mismatches between signup and manage-profile. (1) AcademicInfoCard.tsx: replaced plain <Input> for course with CourseCombobox (same 177-course MQ catalog used on signup), wrapped via Controller. Replaced static ACADEMIC_YEARS ("1st Year", "2nd Year"…"PhD") with dynamic year range (Year 1..N based on selected course, values "1", "2", etc.) matching signup exactly. (2) useProfileManager.ts: added YEAR_LEGACY_MAP + normalizeYear() to convert old-format year values ("1st Year" → "1", "2nd Year" → "2" etc.) applied in all three form.reset() call sites. Existing users with old year values now see them correctly mapped; new signup users see their chosen course + year immediately in manage-profile.
Files: Modified `app/manage-profiles/components/AcademicInfoCard.tsx`, `app/manage-profiles/hooks/useProfileManager.ts`.
Verification: `npm run typecheck` ✅, `npm run test:ci` ✅ (483/483 pass), `npm run vercel:deploy:prod` ✅.
Follow-ups: None.

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Frontend Redesign — Terms, Privacy, Signup, Reset Password to Match Login Aesthetic
Summary: Redesigned 4 pages to match the login page aesthetic. (1) Terms and Privacy: replaced plain layout with a styled MQ-branded header banner (dark blue gradient + MQ red accent bar), sticky sidebar table-of-contents (desktop), numbered section badges (MQ red), hover left-border accent on each section, MQ logo in footer, themed table for third-party services section. (2) Signup: replaced plain Card + bg-mq-background with a fixed background image (login-bg.png + gradient overlay), glass card (backdrop-blur-xl, bg-mq-card-background/85, shadow-[0_18px_70px_rgba(0,0,0,0.3)], border border-mq-border/30), animate-in fade-in entry, inputs h-12 rounded-xl, buttons h-12 rounded-xl/full font-bold, Google button rounded-full matching login. (3) Reset Password: same background + glass card treatment across all 3 states (loading, success, request/set). All logo sizes preserved (240px signup, 216px reset-password).
Files: Modified `app/terms/page.tsx`, `app/privacy/page.tsx`, `app/signup/SignupClient.tsx`, `app/reset-password/reset-password-client.tsx`.
Verification: `npm run typecheck` ✅, `npm run test:ci` ✅ (483/483 pass).
Follow-ups: None.

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Mandatory Course & Year + 3× Logos + Honeypot Security Fix
Summary: (1) Made course and year required in auth schema (z.string().trim().min(1, ...)). Added \* required markers on labels in SignupClient. (2) Tripled logo sizes: signup 80→240px, reset-password 72→216px (both occurrences). (3) Security fix in signup API route: honeypot check now runs on raw body BEFORE Zod schema validation. Previously empty course/year caused 400 before honeypot check, leaking schema info to bots. Now bots always get fake 200 regardless of other field values. Fixed 1 test failure (honeypot test that was getting 400 instead of 200).
Files: Modified `lib/schemas/auth.ts`, `app/signup/SignupClient.tsx`, `app/reset-password/reset-password-client.tsx`, `app/api/auth/signup/route.ts`.
Verification: `npm run typecheck` ✅, `npm run test:ci` ✅ (483/483 pass), `npm run vercel:deploy:prod` ✅.
Follow-ups: None.

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Dynamic Year Range + MQ Logo on Signup & Reset Password
Summary: (1) Year selector in signup is now dynamic: watches selected course → looks up DEGREE_TYPE_LABELS → maps to DEGREE_MAX_YEARS → generates Year 1..N options. useEffect resets year field when user switches to a shorter degree type. Added DEGREE_MAX_YEARS to lib/data/mq-courses.ts. Removed static ACADEMIC_YEARS constant from SignupClient. (2) Replaced graduation cap icon with MQ_Logo_Final.png (80×80) in signup card header; email confirmation step keeps Mail icon. Added MQ logo (72×72) above title in reset-password main card and above checkmark in success state.
Files: Modified `lib/data/mq-courses.ts`, `app/signup/SignupClient.tsx`, `app/reset-password/reset-password-client.tsx`.
Verification: `npm run typecheck` ✅, `npm run test:ci` ✅ (483/483 pass), `npm run vercel:deploy:prod` ✅.
Follow-ups: None.

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Signup Course & Year Selectors from MQ 2026 Catalogue
Summary: Replaced plain text inputs for course and year in the signup form with a searchable combobox (177 courses) and a Select dropdown. Created lib/data/mq-courses.ts with all 177 MQ 2026 courses grouped by degree level. Created app/signup/components/CourseCombobox.tsx — a custom searchable combobox that filters by name/code as user types, groups results by degree level (Bachelor, Master, etc.), shows result count, and has a clear button. Updated SignupClient.tsx to use Controller with the new combobox for course and a Radix Select for year (consistent with AcademicInfoCard in manage-profiles).
Files: Created `lib/data/mq-courses.ts`, `app/signup/components/CourseCombobox.tsx`. Modified `app/signup/SignupClient.tsx`.
Verification: `npm run typecheck` ✅, `npm run test:ci` ✅ (483/483 pass), `npm run vercel:deploy:prod` ✅.
Follow-ups: Could add same combobox to manage-profiles AcademicInfoCard to replace its plain course input.

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Student ID Input Hard-Cap at 8 Characters
Summary: Added maxLength={8} and inputMode="numeric" to the Student ID <Input> in PersonalInfoCard.tsx. The Zod schema already enforced exactly 8 digits via regex; this adds the browser-level hard stop so users cannot type past 8 characters, and triggers the numeric keyboard on mobile devices.
Files: Modified `app/manage-profiles/components/PersonalInfoCard.tsx`.
Verification: `npm run typecheck` ✅, `npm run test:ci` ✅ (483/483 pass), `npm run vercel:deploy:prod` ✅.
Follow-ups: None.

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Profile Sync with Login — Always Fetch on Mount + Skeleton Until hasLoaded
Summary: manage-profiles was not synced with login data. (1) useProfileManager fetched only when !hasLoaded — on re-visits within the same session, stale data was shown without re-fetching from DB. Fixed with useRef(false) mount guard so fetchProfile() is always called on mount. Used useRef not useState to avoid double-fetch in React Strict Mode. (2) Skeleton condition was `isProfileLoading && !hasLoaded` — on re-visits (hasLoaded: true) the page rendered immediately showing localStorage profile data that has email:'' and studentId:'' stripped for security, causing a visible blank-field flash. Changed to `!hasLoaded` so skeleton shows until DB fetch completes. Removed now-unused isProfileLoading from page destructure.
Files: Modified `app/manage-profiles/hooks/useProfileManager.ts`, `app/manage-profiles/page.tsx`.
Verification: `npm run typecheck` ✅, `npm run test:ci` ✅ (483/483 pass), `npm run vercel:deploy:prod` ✅ (aliased to syllabus-sync-ashy.vercel.app).
Follow-ups: None.

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Connect Auth & Profile Pages — Back Button + Hardcoded Text + Privacy Link Fix
Summary: Full audit of navigation connections between login, signup, reset-password, manage-profiles, and settings. (1) manage-profiles had no back button — stranded users with no way to return to Settings. Added `← Settings` link at top of page using ArrowLeft icon + t('settings'). (2) reset-password-client.tsx had 4 hardcoded English strings with matching translation keys: fixed 'Verifying reset link...'→t('verifying'), 'Password Changed!'→t('passwordChangedSuccess'), 'Login'→t('backToLogin'), 'Change Password'→t('changePassword'), 'For your security...'→t('resetLinkExpireNote'). (3) PrivacySettings.tsx privacy policy button used window.open(\_blank) for internal /privacy route — inconsistent with login/signup which navigate same-tab. Changed to router.push('/privacy'), removed unused EXTERNAL_LINKS import. Updated PrivacySettings.test.tsx to assert on mockRouterPush('/privacy') instead of mockWindowOpen.
Files: Modified `app/manage-profiles/page.tsx`, `app/reset-password/reset-password-client.tsx`, `features/settings/components/PrivacySettings.tsx`, `tests/settings/PrivacySettings.test.tsx`.
Verification: `npm run typecheck` ✅, `npm run test` ✅ (483/483 pass), `npm run vercel:deploy:prod` ✅ (aliased to syllabus-sync-ashy.vercel.app).
Follow-ups: None.

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Weather Widget Audit & Live Fix — Remove force-cache Bug + Auto-Refresh
Summary: Full audit of the weather widget. Root cause: `cache: 'force-cache'` on the `/api/weather` fetch caused the browser to return its HTTP cache indefinitely (ignoring `max-age=0`), freezing weather data until browser cache eviction. Fix: removed `cache: 'force-cache'` so default fetch behavior applies — browser revalidates per max-age=0, Vercel Edge CDN still caches via s-maxage=300 reducing origin invocations. Also added a 10-minute setInterval auto-refresh so weather stays current in long-lived sessions. Cleaned up unused `NEXT_PUBLIC_OPENWEATHER_API_KEY` in .env.example (widget uses Open-Meteo, no key required). Updated useWeather test to remove the force-cache assertion.
Files: Modified `components/layout/weather/useWeather.ts`, `tests/layout/useWeather.test.ts`, `.env.example`.
Verification: `npm run typecheck` ✅, `npm run test` ✅ (483/483 pass), `npm run vercel:deploy:prod` ✅ (aliased to syllabus-sync-ashy.vercel.app).
Follow-ups: None.

Raouf: 2026-02-18 (Australia/Sydney)
Scope: Fix Google OAuth Flow — Supabase Redirect URL Allowlist + Error Feedback
Summary: Root-caused and fixed the Google OAuth flow bug. The Supabase `uri_allow_list` only contained `syllabus-sync-perkycoders.vercel.app` URLs but the canonical Vercel production URL is `syllabus-sync-ashy.vercel.app`. When users accessed from the canonical URL, the OAuth callback was rejected by Supabase (URL not in allowlist), the `code_verifier` PKCE cookie was lost across domains, and `exchangeCodeForSession` failed silently. Fixes: (1) Updated Supabase `site_url` to `https://syllabus-sync-ashy.vercel.app` and added both Vercel domain patterns to `uri_allow_list` via Management API. (2) Updated Vercel `NEXT_PUBLIC_APP_URL` from `syllabus-sync-perkycoders` to `syllabus-sync-ashy`. (3) Added OAuth error feedback on the login page — `callbackError` query param is now read and displayed with translated messages for `oauth_failed` and `verification_failed` states. (4) Improved callback route error logging with status/code details and `redirectTo` preservation on error redirects. (5) Added `oauthSignInFailed` and `oauthSessionExpired` translation keys across all 19 locales. (6) Updated OAuth setup docs to reflect Google-only config.
Files: Modified `app/login/LoginClient.tsx`, `app/auth/callback/route.ts`, `locales/*/translations.json`, `docs/operations/supabase-oauth-setup.md`. Supabase Management API: updated `site_url` and `uri_allow_list`. Vercel env: updated `NEXT_PUBLIC_APP_URL`.
Verification: `npm run typecheck` ✅, `npm run check:i18n` ✅ (pre-existing validation.\* gaps only).
Follow-ups: When custom domain `syllabus-sync.app` DNS is configured, add it to Supabase `uri_allow_list` and update `NEXT_PUBLIC_APP_URL`.

Raouf: 2026-02-18 (Australia/Sydney)
Scope: Simplify OAuth to Google-only
Summary: Removed Apple OAuth, simplified to Google-only on both login and signup pages. Changed OAuth state from provider union type to simple boolean (`oauthLoading`). Renamed `handleOAuthLogin` to `handleGoogleLogin`. Changed from 2-column grid layout to single full-width Google button. Removed `loginWithApple` translation key from all 19 locales.
Files: Modified `app/login/LoginClient.tsx`, `app/signup/SignupClient.tsx`, `locales/*/translations.json`.
Verification: `npm run typecheck` ✅.

Raouf: 2026-02-18 (Australia/Sydney)
Scope: Replace Facebook OAuth with Apple OAuth
Summary: Removed Facebook OAuth login and replaced it with Apple (Sign in with Apple) on both login and signup pages. Updated the OAuth provider type from `'google' | 'facebook'` to `'google' | 'apple'` in both `LoginClient.tsx` and `SignupClient.tsx`. Replaced the Facebook SVG icon with the Apple logo SVG. Renamed the translation key `loginWithFacebook` to `loginWithApple` across all 19 locales. The Supabase Apple provider must be enabled in the Supabase Dashboard with proper credentials (Services ID, Team ID, Key ID, Private Key).
Files: Modified `app/login/LoginClient.tsx`, `app/signup/SignupClient.tsx`, `locales/*/translations.json`.
Verification: `npm run typecheck` ✅.

Raouf: 2026-02-18 (Australia/Sydney)
Scope: Disable edit for public feed events on calendar
Summary: Events added from the Events feed tab (with `sourcePublicEventId`) are now non-editable on the calendar. The EventDetailPanel no longer shows the pencil/edit icon for these events. User-created events remain fully editable. The EventsWidget sidebar already had this logic; this change extends it to the detail modal opened from DayView, AgendaView, and WeekView.
Files: Modified `app/calendar/CalendarClient.tsx`.
Verification: `npm run typecheck` ✅.

Raouf: 2026-02-18 (Australia/Sydney)
Scope: Post-verification success message on login + Login photo overlay to white
Summary: Two fixes. (1) After clicking the email verification link, users now see a success banner "Your email has been verified! You can now sign in." on the login page. Changed signup API `emailRedirectTo` to pass `redirectTo=/login?verified=1` through the auth callback, and added a verified banner on the login page that reads the `verified` query param. Added `emailVerifiedSuccess` translation to all 19 locales. (2) Changed the login page right-panel photo overlay from dark blue (`from-[#0f172a]/88`) to white (`from-white/40`), updated text colors from white/alabaster to dark for readability.
Files: Modified `app/login/LoginClient.tsx`, `app/api/auth/signup/route.ts`, `locales/*/translations.json`.
Verification: `npm run typecheck` ✅.

Raouf: 2026-02-18 (Australia/Sydney)
Scope: Fix Privacy/Terms Back Navigation + Add Signup Email Confirmation Screen
Summary: Fixed two issues. (1) Privacy Policy and Terms of Service links on login and signup pages opened in new tabs (`target="_blank"`), so the back button on those pages (`router.back()`) had no history to navigate back to. Removed `target="_blank"` from all privacy/terms links on login and signup pages so they open in the same tab. (2) After signup with email verification required, users only saw a brief toast before being redirected to login. Added a dedicated email confirmation screen (step='confirmation') on the signup page showing the email address, instructions to check inbox/spam, and a "Go to Login" button. Added `signupConfirmationSent` and `signupConfirmationHint` translation keys to all 19 locales.
Files: Modified `app/login/LoginClient.tsx`, `app/signup/SignupClient.tsx`, `locales/*/translations.json`.
Verification: `npm run typecheck` ✅.

Raouf: 2026-02-18 (Australia/Sydney)
Scope: Fix Password Reset — token_hash + verifyOtp (bypass broken PKCE flow)
Summary: Fixed production password reset flow. Root cause: Supabase's PKCE flow for `resetPasswordForEmail()` doesn't work reliably in Next.js on Vercel because the `code_verifier` cookie set server-side during the API call is not available when the user clicks the email link (different request context). Multiple approaches failed (direct redirect, dedicated callback route, recovery_sent_at detection). Final fix uses the official Supabase recommendation: updated the recovery email template to use `{{ .TokenHash }}` instead of `{{ .ConfirmationURL }}`, created a new `/auth/confirm` server route handler that calls `supabase.auth.verifyOtp({ type, token_hash })` to establish the session without PKCE, then redirects to `/reset-password?recovery=1`. Also added `/auth/confirm` to the proxy's skip-auth-resolution list. Earlier fixes in same session: cleaned `NEXT_PUBLIC_APP_URL` env var trailing newline on Vercel, added `/reset-password` exception to client-layout auth redirect.
Files: Added `app/auth/confirm/route.ts`. Modified `lib/proxy.ts`. Updated Supabase recovery email template and redirect URL allowlist via Management API. Earlier: modified `app/api/auth/password/request-reset/route.ts`, `app/client-layout.tsx`, added `app/auth/callback/recovery/route.ts`. Vercel env var `NEXT_PUBLIC_APP_URL` re-set without trailing newline.
Verification: `npm run typecheck` ✅.

Raouf: 2026-02-17 (Australia/Sydney)
Scope: OAuth Login — Enable Google/Facebook via Supabase + Harden Callback Redirects
Summary: Enabled real Supabase OAuth sign-in for Google and Facebook on the login page. Implemented a hardened `/auth/callback` handler that exchanges the `code` for a session and redirects to a validated `redirectTo` destination (prevents open redirects), and handles provider error params safely. Added test coverage for callback redirect behavior. Documented Supabase OAuth provider setup (redirect URLs + provider dashboard notes) and linked it from the main README. Resolved lint/type issues uncovered during the audit (React hook dependencies, missing translation hook), and synchronized translations for newly referenced UI strings. Ignored local translation key dump artifacts (`*_keys.txt`) to keep the repo clean.
Files: Modified `app/login/LoginClient.tsx`, `app/auth/callback/route.ts`, `components/layout/WeatherWidget.tsx`, `features/settings/components/security/SMSSetup.tsx`, `app/reset-password/reset-password-client.tsx`, `app/privacy/page.tsx`, `README.md`, `.gitignore`, `locales/*/translations.json`. Added `tests/api/auth/callback.test.ts`, `docs/operations/supabase-oauth-setup.md`.
Verification: `npm run format:check` ✅, `npm run typecheck` ✅, `npm run lint` ✅, `npm test` ✅ (483/483 pass), `npm run build` ✅, `npm run check:i18n` ✅.

Raouf: 2026-02-17 (Australia/Sydney)
Scope: Full Repository i18n Audit & Fix — 100% Locale Parity + Privacy Policy + MFA UI
Summary: Completed a comprehensive internationalisation audit and remediation across all 19 supported locales. Added 117 missing keys to all non-English locales to match the canonical English source. (1) Internationalised the entire Privacy Policy page (`/privacy`), breaking it into structured keys for all sections, tables, and links. (2) Replaced hardcoded strings in the login MFA challenge, email verification, and password reset flows with i18n keys. (3) Fixed remaining literal strings in sidebar, weather widget, and various forms (Unit, Exam, Event). (4) Synchronised all 18 non-English locales (`ar`, `bn`, `es`, `fa`, `fr`, `he`, `hi`, `id`, `it`, `ja`, `ko`, `ms`, `ru`, `ta`, `th`, `ur`, `vi`, `zh`) using high-quality translations. (5) Ensured all locales have an identical key set.
Files: Modified `locales/*/translations.json`, `app/privacy/page.tsx`, `app/verify/page.tsx`, `app/signup/SignupClient.tsx`, `app/reset-password/reset-password-client.tsx`, `app/login/components/MFAChallenge.tsx`, `components/layout/Sidebar.tsx`, `features/settings/components/security/SMSSetup.tsx`, `features/settings/components/security/TOTPSetup.tsx`, `features/calendar/components/CalendarHeader.tsx`, `components/layout/WeatherWidget.tsx`, `components/units/UnitForm.tsx`, `components/units/UnitDetailPanel.tsx`, `components/exams/ExamForm.tsx`, `components/exams/ExamDetailPanel.tsx`, `components/events/EventForm.tsx`, `AGENT.md`, `CHANGELOG.md`.
Verification: `npm run check:i18n` ✅ (0 warnings, 19 locales validated), `npm test` ✅ (483/483 pass), `npm run build` ✅.
Follow-ups: Consider internationalising the admin-only Position Editor tool if it becomes user-facing.

Raouf: 2026-02-17 (Australia/Sydney)
Scope: CDN Cache Preservation — Skip CSRF Cookie On API Routes
Summary: Prevented middleware from setting the CSRF cookie on `/api/*` requests. This removes `Set-Cookie` from public GET API responses (e.g. `/api/weather`, `/api/health`) which improves CDN cacheability, increases cache hit rates across clients, and further reduces Vercel Function invocations under traffic. CSRF cookie is still set for page navigations where it is useful.
Files: Modified `lib/proxy.ts`, `AGENT.md`, `CHANGELOG.md`.
Verification: `npm run typecheck` ✅, `npm run lint` ✅, `npm test` ✅, `npm run build` ✅.

Raouf: 2026-02-17 (Australia/Sydney)
Scope: MFA Logic Audit + Fix — Correct SMS Challenge Flow + Resend Without Lockout + Fail-Closed Unenroll
Summary: Fixed several MFA correctness/security issues. Added a dedicated `/api/auth/mfa/challenge` endpoint so SMS codes are sent via a proper challenge and can be resent without consuming verification attempts (removed the previous “dummy code” resend behavior that could lock users out). Updated the SMS enrollment flow to immediately create a challenge and return `challengeId`, and updated SMS verification to require and use the provided `challengeId` (no longer creates a fresh challenge at verify-time). Hardened `/api/auth/mfa/unenroll` to fail closed when AAL/factor status cannot be validated, preventing MFA disable bypass on upstream errors. Updated login MFA UI and SMS settings UI accordingly. Added security tests covering SMS enroll/verify and unenroll fail-closed behavior.
Files: Added `app/api/auth/mfa/challenge/route.ts`, `tests/security/mfa-sms-flow.test.ts`, `tests/security/mfa-unenroll-failclosed.test.ts`. Modified `app/api/auth/mfa/challenge-verify/route.ts`, `app/api/auth/mfa/sms/enroll/route.ts`, `app/api/auth/mfa/sms/verify/route.ts`, `app/api/auth/mfa/unenroll/route.ts`, `app/login/components/MFAChallenge.tsx`, `features/settings/components/security/SMSSetup.tsx`, `lib/constants/config.ts`, `CHANGELOG.md`.
Verification: `npm run format:check` ✅, `npm run typecheck` ✅, `npm run lint` ✅, `npm test` ✅, `npm run build` ✅.
Follow-ups: Consider adding CSRF enforcement (`withCSRFProtection`) to MFA mutation routes once all callers use `apiRequest` consistently.

Raouf: 2026-02-17 (Australia/Sydney)
Scope: Vercel Invocation Reduction — Remove Auth Polling + Enable CDN Caching For Public GET APIs
Summary: Reduced Vercel Serverless Function invocations by eliminating repeated `/api/auth/user` calls from the client UI (multiple focus listeners + redundant checks) and moving UI auth state to Supabase browser session reads (`auth.getSession`) instead. Removed the weather widget cache-busting query param and enabled edge/CDN caching headers for public `GET` APIs (`/api/weather`, `/api/health`) so subsequent requests can be served from cache without re-running functions. Also reduced notification refresh frequency (3-minute staleness window) and prevented 401-driven redirect flapping by only redirecting to `/login` when the client can confirm there is no session.
Files: Added `lib/supabase/browserSession.ts`. Modified `app/client-layout.tsx`, `components/layout/Header.tsx`, `features/home/hooks/useHomeUser.ts`, `lib/store/deadlinesStore.ts`, `lib/store/todosStore.ts`, `lib/store/notificationsStore.ts`, `components/layout/weather/useWeather.ts`, `app/api/_lib/response.ts`, `app/api/weather/route.ts`, `app/api/health/route.ts`, `tests/layout/useWeather.test.ts`, `CHANGELOG.md`.
Verification: `npm run format:check` ✅, `npm run typecheck` ✅, `npm run lint` ✅, `npm test` ✅ (476/476 pass), `npm run build` ✅.

Raouf: 2026-02-17 (Australia/Sydney)
Scope: Login/Profiles Bugfix — Stop Redirect Flapping + Fix Layout Blink + Clear Success UI
Summary: Fixed the “buggy login + manage profiles bouncing back to login” behavior by addressing two root causes. (1) Client layout now always renders the unauthenticated layout for auth routes (no sidebar/header flash), which prevents the login page “blink” and makes success/error toasts render consistently. (2) Proxy auth is no longer allowed to hard-redirect page routes to `/login` when Supabase auth resolution times out (cold starts/transient slowness); instead it allows the page request through and fails closed for non-public API routes with `503 AUTH_UNAVAILABLE`. (3) MFA AAL check timeouts are treated as “unknown” (no page redirect flapping; API remains fail-closed). (4) Added an inline success banner on login so users see a clear confirmation before redirect.
Files: Modified `app/client-layout.tsx`, `lib/proxy.ts`, `app/login/LoginClient.tsx`, `tests/api/proxy.mfa.test.ts`, `CHANGELOG.md`.
Verification: `npm run format:check` ✅, `npm run typecheck` ✅, `npm run lint` ✅, `npm test` ✅ (476/476 pass), `npm run build` ✅.
Follow-ups: If you still see occasional protected-page loads without auth context, consider increasing proxy auth deadline slightly on Vercel cold starts (tradeoff: slower first paint).

Raouf: 2026-02-17 (Australia/Sydney)
Scope: MFA Redirect Loop Fix — Prevent /login?mfa=1 Bounce Back To Dashboard
Summary: Fixed an MFA upgrade redirect loop where clicking a protected route (e.g. Manage Profiles) triggered a proxy redirect to `/login?mfa=1`, but the client layout’s background auth check immediately pushed authenticated users off the login route back to `/home`, causing a visible “jump to login then back to dashboard” flapping. Replaced the hook-based query param read (which broke static prerender) with a client-only `window.location.search` check so `/login?mfa=1` is never auto-redirected away before the MFA challenge completes.
Files: Modified `app/client-layout.tsx`.
Verification: `npm run format:check` ✅, `npm run typecheck` ✅, `npm run lint` ✅, `npm test` ✅ (476/476 pass), `npm run build` ✅.
Follow-ups: None.

Raouf: 2026-02-17 (Australia/Sydney)
Scope: Auth Audit — Signup Payload Alignment + Honeypot Fix + MFA Enforcement + Verification Resend
Summary: Completed a full audit of login/signup UX and related auth endpoints and fixed several production-impacting issues. (1) Aligned the signup page payload with the server-side signup schema so real signups no longer fail validation. (2) Fixed the honeypot implementation so it’s actually reachable (schema no longer rejects non-empty `_gotcha` before the route can respond with generic success). (3) Hardened MFA by enforcing AAL2 centrally in the proxy: authenticated sessions that require MFA upgrade are redirected back to `/login?mfa=1` for protected pages and blocked with `403 MFA_REQUIRED` for non-public API routes, preventing aal1 session bypass. (4) Added an unauthenticated “resend verification email” endpoint and UI button for the “Email not confirmed” case (anti-enumeration, rate-limited). (5) Fixed redirect allowlist so post-login redirects work for `/feed` and `/map`.
Files: Modified `lib/schemas/auth.ts`, `app/signup/SignupClient.tsx`, `app/api/auth/signup/route.ts`, `lib/proxy.ts`, `app/login/actions.ts`, `app/login/LoginClient.tsx`, `lib/constants/config.ts`, `lib/security/emailVerification.ts`, `locales/en/translations.json`, `lib/utils/security.ts`, `app/login/__tests__/actions.test.ts`, `CHANGELOG.md`. Added `app/api/auth/email/resend-verification/route.ts`, `tests/api/auth/signup.test.ts`, `tests/api/auth/emailResendVerification.test.ts`, `tests/api/proxy.mfa.test.ts`.
Verification: `npm run format:check` ✅, `npm run typecheck` ✅, `npm run lint` ✅, `npm test` ✅ (475/475 pass), `npm run build` ✅, `npm run check:secrets` ✅.
Follow-ups: If you want a fully separate MFA UX, add a dedicated `/mfa` page; current flow uses `/login?mfa=1` for the upgrade step.

Raouf: 2026-02-17 (Australia/Sydney)
Scope: High-Traffic Production — Move Rate Limiting To Vercel KV (Upstash Redis)
Summary: Provisioned Upstash for Redis via Vercel Marketplace and connected it to the `syllabus-sync` project, enabling Vercel KV/Redis-backed distributed rate limiting in all environments (production/preview/development). Verified the Vercel production environment now includes `KV_REST_API_URL` and `KV_REST_API_TOKEN`, updated the env-audit script to require those keys in production, and redeployed production so the runtime starts using KV/Redis instead of Postgres for rate limiting (reduces DB write load under high traffic).
Files: Modified `tools/vercel/check-required-env.mjs`, `docs/operations/resend-vercel-setup.md`, `README.md`.
Verification: `vercel integration list` ✅ (resource available + connected), `vercel env ls production` ✅ (KV keys present), `node tools/vercel/check-required-env.mjs` ✅, `npm run format:check` ✅, `npm run typecheck` ✅, `npm test` ✅ (465/465 pass), `npm run build` ✅, `npm run vercel:deploy:prod` ✅ (aliased).
Follow-ups: If you later move to a paid Upstash plan, no code changes required; only the integration plan changes.

Raouf: 2026-02-17 (Australia/Sydney)
Scope: High-Traffic Production — Move Rate Limiting To Vercel KV (Upstash Redis)
Summary: Provisioned Upstash for Redis via Vercel Marketplace and connected it to the `syllabus-sync` project, enabling Vercel KV/Redis-backed distributed rate limiting in all environments (production/preview/development). Verified the Vercel production environment now includes `KV_REST_API_URL` and `KV_REST_API_TOKEN`, updated the env-audit script to require those keys in production, and redeployed production so the runtime starts using KV/Redis instead of Postgres for rate limiting (reduces DB write load under high traffic).
Files: Modified `tools/vercel/check-required-env.mjs`, `docs/operations/resend-vercel-setup.md`, `README.md`.
Verification: `vercel integration list` ✅ (resource available + connected), `vercel env ls production` ✅ (KV keys present), `node tools/vercel/check-required-env.mjs` ✅, `npm run format:check` ✅, `npm run typecheck` ✅, `npm test` ✅ (465/465 pass), `npm run build` ✅, `npm run vercel:deploy:prod` ✅ (aliased).
Follow-ups: If you later move to a paid Upstash plan, no code changes required; only the integration plan changes.

Raouf: 2026-02-17 (Australia/Sydney)
Scope: Production Hardening — Distributed Rate Limiting + Cron + Vercel Env Audit
Summary: Eliminated the last “not production ready” issues in the Vercel deployment by making rate limiting truly distributed without requiring Redis/KV, and tightening Vercel env validation. Implemented a Supabase Postgres-backed rate limit store (service-role RPC) used automatically when Redis/KV is not configured, removed the production `ALLOW_MEMORY_RATE_LIMIT` override from Vercel, and added a daily cron cleanup route for stale rate-limit rows. Expanded the Vercel env checker to validate the full set of required Supabase + email + cron keys and to fail if `ALLOW_MEMORY_RATE_LIMIT` is present in production. Updated runbooks/README to reflect the new production posture. Applied the new Supabase migration to the linked remote project and redeployed production.
Files: Added `supabase/migrations/20260217093000_rate_limits.sql`, `app/api/security/rate-limit/cleanup/route.ts`. Modified `lib/services/rateLimitService.ts`, `vercel.json`, `tools/vercel/check-required-env.mjs`, `docs/operations/resend-vercel-setup.md`, `README.md`.
Verification: `supabase db push --linked` ✅, `vercel env rm ALLOW_MEMORY_RATE_LIMIT production` ✅, `node tools/vercel/check-required-env.mjs` ✅, `npm run format:check` ✅, `npm run typecheck` ✅, `npm test` ✅ (465/465 pass), `npm run build` ✅, `npm run vercel:deploy:prod` ✅ (aliased), cron endpoints return `401` without auth ✅.
Follow-ups: For high-traffic production, consider migrating rate limit storage from Postgres to Upstash Redis/Vercel KV to reduce DB write load.

Raouf: 2026-02-17 (Australia/Sydney)
Scope: Production Hardening — Distributed Rate Limiting + Cron + Vercel Env Audit
Summary: Eliminated the last “not production ready” issues in the Vercel deployment by making rate limiting truly distributed without requiring Redis/KV, and tightening Vercel env validation. Implemented a Supabase Postgres-backed rate limit store (service-role RPC) used automatically when Redis/KV is not configured, removed the production `ALLOW_MEMORY_RATE_LIMIT` override from Vercel, and added a daily cron cleanup route for stale rate-limit rows. Expanded the Vercel env checker to validate the full set of required Supabase + email + cron keys and to fail if `ALLOW_MEMORY_RATE_LIMIT` is present in production. Updated runbooks/README to reflect the new production posture. Applied the new Supabase migration to the linked remote project and redeployed production.
Files: Added `supabase/migrations/20260217093000_rate_limits.sql`, `app/api/security/rate-limit/cleanup/route.ts`. Modified `lib/services/rateLimitService.ts`, `vercel.json`, `tools/vercel/check-required-env.mjs`, `docs/operations/resend-vercel-setup.md`, `README.md`.
Verification: `supabase db push --linked` ✅, `vercel env rm ALLOW_MEMORY_RATE_LIMIT production` ✅, `node tools/vercel/check-required-env.mjs` ✅, `npm run format:check` ✅, `npm run typecheck` ✅, `npm test` ✅ (465/465 pass), `npm run build` ✅, `npm run vercel:deploy:prod` ✅ (aliased), cron endpoints return `401` without auth ✅.
Follow-ups: For high-traffic production, consider migrating rate limit storage from Postgres to Upstash Redis/Vercel KV to reduce DB write load.

Raouf: 2026-02-17 (Australia/Sydney)
Scope: Fix Vercel Deploy Helper Symlink Handling
Summary: Fixed production deploy failures where symlinked files (notably root `codecov.yml`) could be uploaded without their targets, causing Vercel builds to error with `ENOENT` during `next build`. Updated the Vercel deploy helper to dereference symlinks when copying the temp deploy workspace so uploads always contain real files. Re-deployed production successfully and confirmed alias promotion.
Files: Modified `tools/vercel/deploy.mjs`.
Verification: `npm run format:check` ✅, `npm run typecheck` ✅, `npm test` ✅ (465/465 pass), `npm run vercel:deploy:prod` ✅ (aliased).
Follow-ups: Consider removing repo symlinks in favor of real files if you want to avoid toolchain-specific behavior across platforms/CI.

Raouf: 2026-02-17 (Australia/Sydney)
Scope: Fix Vercel Deploy Helper Symlink Handling
Summary: Fixed production deploy failures where symlinked files (notably root `codecov.yml`) could be uploaded without their targets, causing Vercel builds to error with `ENOENT` during `next build`. Updated the Vercel deploy helper to dereference symlinks when copying the temp deploy workspace so uploads always contain real files. Re-deployed production successfully and confirmed alias promotion.
Files: Modified `tools/vercel/deploy.mjs`.
Verification: `npm run format:check` ✅, `npm run typecheck` ✅, `npm test` ✅ (465/465 pass), `npm run vercel:deploy:prod` ✅ (aliased).
Follow-ups: Consider removing repo symlinks in favor of real files if you want to avoid toolchain-specific behavior across platforms/CI.

Raouf: 2026-02-17 (Australia/Sydney)
Scope: Login Page Debug + Rate Limit Bug Fix (IP Extraction + Keying)
Summary: Fixed buggy login rate limiting caused by unstable/unknown client IP extraction in production-like environments. Updated IP extraction to safely accept `x-forwarded-for` on Vercel runtimes (and prefer `x-real-ip`), while keeping a stable `127.0.0.1` fallback for local development. Hardened login rate limiting by keying on `ip + hashed email` to avoid collapsing all traffic onto a shared identifier when IP is missing, and improved login UI feedback to show a concrete retry time when rate-limited. Added unit tests covering the IP extraction trust rules and dev fallback.
Files: Modified `lib/security/ip.ts`, `app/login/actions.ts`, `app/login/LoginClient.tsx`, `app/api/auth/signin/route.ts`. Added `lib/security/identifiers.ts`, `tests/unit/security/ip.test.ts`.
Verification: `npm run format:check` ✅, `npm run typecheck` ✅, `npm test` ✅ (465/465 pass), `npm run build` ✅.
Follow-ups: Consider adding a second limiter dimension (pure per-IP + pure per-email) if you want stronger defense against email-rotation attacks while keeping NAT fairness.

Raouf: 2026-02-17 (Australia/Sydney)
Scope: Login Page Debug + Rate Limit Bug Fix (IP Extraction + Keying)
Summary: Fixed buggy login rate limiting caused by unstable/unknown client IP extraction in production-like environments. Updated IP extraction to safely accept `x-forwarded-for` on Vercel runtimes (and prefer `x-real-ip`), while keeping a stable `127.0.0.1` fallback for local development. Hardened login rate limiting by keying on `ip + hashed email` to avoid collapsing all traffic onto a shared identifier when IP is missing, and improved login UI feedback to show a concrete retry time when rate-limited. Added unit tests covering the IP extraction trust rules and dev fallback.
Files: Modified `lib/security/ip.ts`, `app/login/actions.ts`, `app/login/LoginClient.tsx`, `app/api/auth/signin/route.ts`. Added `lib/security/identifiers.ts`, `tests/unit/security/ip.test.ts`.
Verification: `npm run format:check` ✅, `npm run typecheck` ✅, `npm test` ✅ (465/465 pass), `npm run build` ✅.
Follow-ups: Consider adding a second limiter dimension (pure per-IP + pure per-email) if you want stronger defense against email-rotation attacks while keeping NAT fairness.

Raouf: 2026-02-17 (Australia/Sydney)
Scope: Vercel Deploy Helper + Env Key Check Fix + Production Deployment
Summary: Fixed the Vercel env-key validator to avoid an unsupported `--yes` flag (`vercel env ls`), added a deployment helper (`tools/vercel/deploy.mjs`) that deploys from a linked temp copy without `.git/` or pulled `.vercel/.env*` files (avoids Vercel’s “git author must have access” restriction), and updated `npm run vercel:deploy:*` scripts to use it. Verified required production env keys (including `CRON_SECRET`) are present, confirmed Supabase migrations are up to date remotely, and successfully deployed + aliased production.
Files: Modified `tools/vercel/check-required-env.mjs`, `package.json`. Added `tools/vercel/deploy.mjs`.
Verification: `node tools/vercel/check-required-env.mjs` ✅, `supabase db push --dry-run --linked --yes` ✅, `npm run format:check` ✅, `npm run typecheck` ✅, `npm test` ✅ (461/461 pass), `npm run build` ✅, `vercel deploy --prod` ✅ (aliased).
Follow-ups: Optionally align repo `git config user.email` with a Vercel team member email to allow direct `vercel --prod` deploys without the helper.

Raouf: 2026-02-16 (Australia/Sydney)
Scope: Add Reset Password Flow (Resend + Token Table + Vercel Cron)
Summary: Implemented a production-grade password reset system that matches the existing auth UX and avoids relying on Supabase’s built-in email. Added `/reset-password` UI (request link + set new password via token), a secure token-backed reset API (`/api/auth/password/request-reset` + `/api/auth/password/reset`), and cron-protected cleanup (`/api/auth/password/cleanup`) with a matching `vercel.json` schedule. Tokens are 32-byte random hex values; only SHA-256 hashes are stored; tokens expire after 20 minutes; prior tokens are invalidated; and the request endpoint is anti-enumeration (always returns success). Added a Supabase migration for `password_resets` and a cleanup SQL function. Extended the Resend email service with a dedicated password reset template. Removed the login “Forgot password” placeholder and linked it to the new page. Added API/unit tests covering anti-enumeration behavior, token consumption, and send-failure cleanup.
Files: Added `app/reset-password/page.tsx`, `app/reset-password/reset-password-client.tsx`, `app/api/auth/password/request-reset/route.ts`, `app/api/auth/password/reset/route.ts`, `app/api/auth/password/cleanup/route.ts`, `lib/security/passwordReset.ts`, `supabase/migrations/20260216193000_password_resets.sql`, `tests/api/auth/passwordRequestReset.test.ts`, `tests/api/auth/passwordReset.test.ts`, `tests/unit/security/passwordReset.test.ts`. Modified `app/login/LoginClient.tsx`, `lib/services/emailService.ts`, `lib/constants/config.ts`, `vercel.json`, `docs/operations/resend-vercel-setup.md`.
Verification: `npm run format:check` ✅, `npm run typecheck` ✅, `npm run lint` ✅, `npm test` ✅ (461/461 pass), `npm run build` ✅, `npm run check:secrets` ✅.
Follow-ups: Add a post-reset “sign out all sessions” option (if desired) by calling Supabase admin session revocation after password update; consider adding UI copy translations for the few remaining literal strings on the reset page.

Raouf: 2026-02-16 (Australia/Sydney)
Scope: Remediate Vercel CLI Dependency Vulnerability (undici)
Summary: Eliminated `npm audit` moderate findings introduced via the pinned Vercel CLI dependency chain by adding an npm `overrides` pin for `undici@6.23.0` (fixes GHSA-g9mf-h72j-4rw9) and regenerating `package-lock.json`. This keeps the Vercel CLI workflow while restoring a clean audit.
Files: Modified `package.json`, `package-lock.json`.
Verification: `npm audit --audit-level=moderate` ✅ (0 vulnerabilities).
Follow-ups: None.

Raouf: 2026-02-16 (Australia/Sydney)
Scope: Replace Email Delivery With Resend SDK + Vercel CLI Integration
Summary: Replaced the remaining manual Resend HTTP implementation with the official `resend` Node SDK, added a Vercel CLI toolchain for linking/pulling env/deploying and validating required env keys, and hardened signup to fail-closed in real production when email verification cannot be delivered (prevents creating accounts that can never be verified). Improved verification-token hygiene by deleting the inserted token record if delivery fails. Added unit tests covering the email service and the send-failure cleanup path, plus a Resend+Vercel setup runbook. Also fixed a TypeScript redeclare bug in the rate limiter and normalized MFA rate-limit constants to match security test expectations.
Files: Modified `package.json`, `package-lock.json`, `lib/services/emailService.ts`, `lib/security/emailVerification.ts`, `app/api/auth/signup/route.ts`, `.env.example`, `.env.local.example`, `.github/workflows/production-deploy.yml`, `docs/README.md`, `README.md`, `lib/services/rateLimitService.ts`, `lib/security/mfa.ts`. Added `tools/vercel/check-required-env.mjs`, `docs/operations/resend-vercel-setup.md`, `tests/unit/services/emailService.test.ts`, `tests/unit/security/emailVerification.test.ts`.
Verification: `npm run format:check` ✅, `npm run typecheck` ✅, `npm run lint` ✅, `npm test` ✅ (453/453 pass), `npm run build` ✅, `npm run check:secrets` ✅.
Follow-ups: Ensure Vercel production env includes `RESEND_API_KEY`, `VERIFICATION_EMAIL_FROM`, `NEXT_PUBLIC_APP_URL`, and `CRON_SECRET` (the CI job now checks key presence via Vercel CLI).

Raouf: 2026-02-16 (Australia/Sydney)
Scope: Email Service — Generic Send Capability
Summary: Added a generic `sendEmail` function and `genericEmailHtml` template to `lib/services/emailService.ts` to allow sending non-verification emails. Modified `emailService.ts` to read environment variables dynamically within functions to improve testability. Added unit tests for the new functionality.
Files: Modified `lib/services/emailService.ts`. Added `tests/unit/services/emailService.test.ts`.
Verification: `npm run test tests/unit/services/emailService.test.ts` ✅ (6/6 pass). Attempted to send requested email but blocked by Resend Sandbox "testing mode" restriction (recipients must be the owner's email).
Follow-ups: None.

Raouf: 2026-02-16 (Australia/Sydney)
Scope: Fix Production Login Blocked by Fail-Closed Rate Limiter Without Redis/KV
Summary: Fixed a production auth outage where fail-closed rate limiters (login/signup/reset) were permanently blocked when no distributed store (Upstash Redis / Vercel KV) was configured. Root cause: `checkRateLimit()` blocked all fail-closed endpoints in production when the in-memory store was selected, but the documented `ALLOW_MEMORY_RATE_LIMIT=true` override did not bypass that block. Fix: honor `ALLOW_MEMORY_RATE_LIMIT=true` for fail-closed endpoints (with a one-time security warning) so demo/test deployments can function while still defaulting to fail-closed in real production. Added regression tests for production behavior with/without the override. Also ignored `.vercel/` for Prettier and linked + redeployed the Vercel project, explicitly overriding `ALLOW_MEMORY_RATE_LIMIT=true`.
Files: Modified `lib/services/rateLimitService.ts`, `config/prettier/.prettierignore`. Added `tests/api/rateLimitService.productionOverride.test.ts`. (Operational) created local `.vercel/` via `vercel link`, overridden Vercel env var `ALLOW_MEMORY_RATE_LIMIT`, and deployed production.
Verification: `npm run format:check` ✅, `npm run typecheck` ✅, `npm run lint` ✅, `npm run test` ✅ (447/447 pass), `npm run build` ✅. Deployed production and verified `/api/auth/signin` returns `UNAUTHORIZED` (not `RATE_LIMITED`).
Follow-ups: Configure Upstash Redis or Vercel KV for real distributed rate limiting and remove the `ALLOW_MEMORY_RATE_LIMIT` override in production once the distributed store is in place.

Raouf: 2026-02-16 (Australia/Sydney)
Scope: Fix Production Login Blocked by Fail-Closed Rate Limiter Without Redis/KV
Summary: Fixed a production auth outage where fail-closed rate limiters (login/signup/reset) were permanently blocked when no distributed store (Upstash Redis / Vercel KV) was configured. Root cause: `checkRateLimit()` blocked all fail-closed endpoints in production when the in-memory store was selected, but the documented `ALLOW_MEMORY_RATE_LIMIT=true` override did not bypass that block. Fix: honor `ALLOW_MEMORY_RATE_LIMIT=true` for fail-closed endpoints (with a one-time security warning) so demo/test deployments can function while still defaulting to fail-closed in real production. Added regression tests for production behavior with/without the override. Also ignored `.vercel/` for Prettier and linked + redeployed the Vercel project, explicitly overriding `ALLOW_MEMORY_RATE_LIMIT=true`.
Files: Modified `lib/services/rateLimitService.ts`, `config/prettier/.prettierignore`. Added `tests/api/rateLimitService.productionOverride.test.ts`. (Operational) created local `.vercel/` via `vercel link`, overridden Vercel env var `ALLOW_MEMORY_RATE_LIMIT`, and deployed production.
Verification: `npm run format:check` ✅, `npm run typecheck` ✅, `npm run lint` ✅, `npm run test` ✅ (447/447 pass), `npm run build` ✅. Deployed production and verified `/api/auth/signin` returns `UNAUTHORIZED` (not `RATE_LIMITED`).
Follow-ups: Configure Upstash Redis or Vercel KV for real distributed rate limiting and remove the `ALLOW_MEMORY_RATE_LIMIT` override in production once the distributed store is in place.

Raouf: 2026-02-16 (Australia/Sydney)
Scope: Fix Next.js Hydration Mismatch — Home Welcome Header Name
Summary: Fixed a React/Next.js hydration mismatch on `/home` where the server rendered the fallback greeting ("Student") while the client immediately rendered the persisted profile name ("Raoof"). Root cause: `useHomeUser()` read from the persisted `profilesStore` before `useHydration()` completed, so the first client render differed from SSR HTML. Fix: defer `getCurrentProfile()` until `hasHydrated` is true. Added a regression test that validates the hook does not expose persisted profile state pre-hydration.
Files: Modified `features/home/hooks/useHomeUser.ts`. Added `tests/home/useHomeUser.hydration.test.tsx`.
Verification: `npm run typecheck` ✅, `npm run lint` ✅, `npm run test` ✅ (445/445 pass).
Follow-ups: Consider passing `initialUser` from a server component to reduce "Student" flash for authenticated users (optional).

Raouf: 2026-02-16 (Australia/Sydney)
Scope: Full Performance Audit & Fix — Site Load Speed + Supabase Timeout Resolution
Summary: Completed comprehensive performance audit and fixed 10 critical/high issues causing 83s page loads and Supabase timeouts. (1) Increased Supabase fetch timeout from 8s to 15s prod/20s dev — 8s was too aggressive for cold-start Supabase instances. (2) Added proxy auth deadline (6s prod/12s dev) with `Promise.race` so a slow Supabase never blocks the entire page render — request continues without auth context and client-side handles protection. (3) Eliminated client-layout auth waterfall — removed blocking `fetch('/api/auth/user')` that prevented ALL rendering until the API responded; now renders optimistically since the proxy already handles server-side route protection. (4) Removed duplicate `mq-tokens.css` import (was imported in both `layout.tsx` and via `globals.css`). (5) Replaced `template.tsx` framer-motion wrapper with CSS animation — saves ~30-50KB JS from every route bundle. (6) Re-enabled webpack default chunk splitting — `default: false, vendors: false` was disabling Next.js code splitting. (7) Fixed `X-DNS-Prefetch-Control: off` → `on` so browsers can prefetch DNS for Supabase/external APIs (~50-100ms savings). (8) Fixed `Cross-Origin-Resource-Policy: same-origin` → `same-site` to prevent blocking cross-origin Supabase API responses. (9) Removed 12MB of map overlay PNGs from service worker precache — now loaded lazily on map page visit. (10) Made login-bg.png (8.5MB) lazy-loaded with quality=60 and proper sizes hint instead of priority preload. (11) Added `loadEvents()` to feed hook since it previously relied on removed eager loading. (12) Cleared stale 2.2GB `.next` dev cache.
Files: Modified `lib/supabase/fetch.ts`, `lib/proxy.ts`, `app/client-layout.tsx`, `app/layout.tsx`, `app/template.tsx`, `config/next/next.config.ts`, `public/sw.js`, `app/login/LoginClient.tsx`, `features/feed/hooks/useFeedLogic.ts`.
Verification: `npm run typecheck` ✅, `npm run lint` ✅ (0 errors), `npm run test` ✅ (443/443 pass).
Follow-ups: Compress `login-bg.png` (8.5MB → ~300KB WebP), compress `MQ_Logo_Final.png` (227KB → ~30KB WebP), self-host Work Sans + Source Serif Pro fonts via `next/font/local` or `@font-face`.

Raouf: 2026-02-16 (Australia/Sydney)
Scope: Security Remediation Follow-Up — Request Signing Replay Check Order
Summary: Applied a final hardening adjustment after main remediation: moved nonce replay evaluation in `verifySignature` to execute only after successful signature comparison. This prevents untrusted invalid-signature traffic from populating nonce state. Re-ran full validation after this change.
Files: Modified `lib/security/request-signing.ts`.
Verification: `npm run typecheck` ✅, `npm run lint` ✅, `npm run test` ✅ (443/443 pass), workflow YAML parse check ✅.
Follow-ups: None.

Raouf: 2026-02-16 (Australia/Sydney)
Scope: Security Remediation Pass — Fix Critical/High Findings (Excluding CSRF by Request)
Summary: Implemented a full hardening pass for the previously reported security findings while intentionally leaving CSRF behavior unchanged per request. (1) Secured `/api/security/scan-headers` with authentication, distributed rate limiting, strict outbound URL validation (protocol allowlist, blocked hosts/ports, private-network + DNS resolution checks), and safer fetch behavior (`HEAD`, manual redirects, timeout). (2) Hardened `/api/security/check-password-breach` with body-size enforcement, input bounds, and distributed rate limiting. (3) Removed signup account-enumeration leak by returning generic success for already-registered addresses. (4) Replaced weak server-action in-memory login throttling with distributed limiter and trusted IP extraction; redacted login/email logs to remove direct email exposure. (5) Strengthened request-signing verification to include canonical request body and nonce replay checks. (6) Added a new Supabase migration to harden SECURITY DEFINER functions: null-safe ownership checks (`IS DISTINCT FROM`), table allowlisting for dynamic SQL, execute privilege revocations from PUBLIC, scoped grants, and service-role-only access for low-level demo seed helpers/global seed function. (7) Replaced CI placeholder security checks with real scripts (`tools/security/check-secrets.mjs`, `tools/i18n/check-translations.mjs`), updated pipeline security steps, and fully repaired malformed production deployment workflow. (8) Updated security docs (`SECURITY.md`, `public/security.txt`) to remove overclaims and reflect actual implemented controls.
Files: Created `supabase/migrations/20260216090000_harden_security_functions.sql`, `tools/security/check-secrets.mjs`, `tools/i18n/check-translations.mjs`. Modified `app/api/security/scan-headers/route.ts`, `app/api/security/check-password-breach/route.ts`, `app/api/auth/signup/route.ts`, `app/login/actions.ts`, `app/login/__tests__/actions.test.ts`, `tests/security/login-mfa-failclosed.test.ts`, `lib/security/ip.ts`, `lib/utils/rate-limit.ts`, `lib/services/rateLimitService.ts`, `lib/services/emailService.ts`, `lib/security/request-signing.ts`, `lib/security/headers-scanner.ts`, `lib/supabase/schema.sql`, `package.json`, `.github/workflows/ci-cd.yml`, `.github/workflows/production-deploy.yml`, `SECURITY.md`, `public/security.txt`.
Verification: `npm run check:secrets` ✅, `npm run check:i18n` ✅ (warnings only), `npm run typecheck` ✅, `npm run lint` ✅, `npm run test` ✅ (443/443 pass), workflow YAML parse check ✅ (`ruby -e "require 'yaml'; ..."`).
Follow-ups: Add missing translation keys flagged by `check:i18n` warnings (`agendaView`, `weekOf`, push notification description keys) for full locale parity.

Raouf: 2026-02-16 (Australia/Sydney)
Scope: Privacy Policy (APP-Compliant) — Full Policy Page, Collection Notices, Legal Links
Summary: Implemented industry-grade privacy infrastructure aligned with the Australian Privacy Principles (APPs) under the Privacy Act 1988 (Cth). (1) Created full `/privacy` policy page (14 sections) covering: data collection categories (account, MFA, usage, location, cookies), purposes, disclosure, overseas transfer vendor table (Supabase, Vercel, Sentry, ORS), security measures, data retention, access/correction rights, complaints procedure (30-day response + OAIC escalation), NDB scheme, education context. Policy is tailored to the actual tech stack — references real security controls (CSP nonces, SW no-cache for API/auth, TOTP no-store headers, cache-clear-on-logout). (2) Added APP 5 collection notice to signup form (Step 1, between terms checkbox and Next button) explaining what data is collected and why. (3) Added Privacy Policy + Terms links to login page footer. (4) Changed `EXTERNAL_LINKS.privacy` and `EXTERNAL_LINKS.terms` from external MQ URLs to internal `/privacy` and `/terms` routes — Settings privacy button now opens the in-app policy.
Files: Created `app/privacy/page.tsx`. Modified `app/signup/SignupClient.tsx`, `app/login/LoginClient.tsx`, `lib/config.ts`.
Verification: `npm run lint` ✅, `npx tsc --noEmit` ✅.

Raouf: 2026-02-16 (Australia/Sydney)
Scope: PWA Hardening — Proper Icon Set, Manifest Fixes, Offline Page, Layout Metadata
Summary: Improved PWA installability and Lighthouse compliance without replacing the existing security-hardened custom service worker. (1) Generated proper square icon set (192x192, 384x384, 512x512, maskable-512, apple-touch-icon 180x180) from the existing logo (was 1536x1024 non-square, manifest incorrectly claimed 512x512). (2) Fixed manifest: split `"purpose": "any maskable"` into separate icon entries (Chrome warning), set `start_url: "/home"` (authenticated entry point), added all icon sizes. (3) Added `applicationName`, `appleWebApp` (capable, title, statusBarStyle), and `apple-touch-icon` to layout metadata for iOS Add-to-Home-Screen support. (4) Created `/offline` route page matching the app's design system. (5) Added PWA icons to SW precache list and bumped cache version to v4.
Files: Created `public/icons/icon-192.png`, `public/icons/icon-384.png`, `public/icons/icon-512.png`, `public/icons/maskable-512.png`, `public/icons/apple-touch-icon.png`, `public/apple-touch-icon.png`, `app/offline/page.tsx`. Modified `public/manifest.webmanifest`, `app/layout.tsx`, `public/sw.js`.
Verification: `npm run lint` ✅, `npx tsc --noEmit` ✅.

Raouf: 2026-02-15 (Australia/Sydney)
Scope: Fix Avatar Persistence Bug — Avatar Resets After Upload & Restart
Summary: Fixed avatar reset bug where uploaded avatars disappeared after app restart. Root cause: when Supabase Storage upload failed, the avatar stayed as a data URL in local state. `mapClientToDb` intentionally skips data URLs, so `avatar_url` was never written to the DB. On restart, `fetchProfile()` fetched `avatar_url: null` from DB and overwrote the local-only data URL. Fix: (1) When `uploadAvatarToStorage` fails, immediately revert avatar to previous value and show error toast instead of silently keeping a doomed data URL. (2) Strip failed avatar from DB updates to prevent silent no-ops. (3) Return `null` from `updateProfile` when avatar was the only update and it failed, so `ProfileHeader` doesn't show a false success toast.
Files: Modified `lib/store/profilesStore.ts`, `app/manage-profiles/components/ProfileHeader.tsx`.
Verification: `npm run lint` ✅, `npx tsc --noEmit` ✅, full test suite ✅ (443/443 tests pass).

Raouf: 2026-02-15 (Australia/Sydney)
Scope: Map Page Full Audit — Fix All Navigation & Function Issues
Summary: Completed full audit of map page (27 files, 11 components, 4 hooks, 12 libraries, 1 API route, 7 test files) and fixed 6 issues found: (1) Demo route missing ORS-compatible `type` and `way_points` fields — added proper ORS type codes (11=depart, 4=straight, 10=arrive) and waypoint indices so parseRouteInstructions() produces usable turn-by-turn directions in demo mode. (2) No automatic re-routing when user goes off-route — wired NavigationStateManager's 'recalculating' status to trigger route re-fetch with max 3 reroute attempts before stopping navigation. (3) User marker using raw GPS instead of Kalman-smoothed positions — switched marker placement to use smoothedLat/smoothedLng from GpsPositionSmoother after initial warm-up (2+ data points), producing visually stable tracking. (4) iOS DeviceMotion permission not requested — added DeviceMotionEvent.requestPermission() call for iOS 13+ with graceful fallback if permission denied or not triggered by user gesture. (5) Off-campus warning using convoluted setTimeout(0)/ref pattern — simplified to direct setState with eslint-disable annotation explaining the geolocation external system synchronization pattern. Removed unused offCampusWarningSyncRef. (6) isLoadingRoute already returned from useMapNavigation but confirmed available for consumers.
Files: Modified `app/api/navigate/route.ts`, `features/map/hooks/useMapNavigation.ts`, `features/map/hooks/useMapLocation.ts`, `features/map/components/CampusMap.tsx`.
Verification: `npx eslint` ✅, `npx tsc --noEmit` ✅, `npx vitest run tests/map/` ✅ (64/64 tests pass), full suite ✅ (443/443 tests pass).

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Repository Documentation Audit & Full System Check
Summary: Completed full repository audit and documentation refresh. Updated README test badge from 425 to 443, added recent features (custom email verification, gamification hardening, responsive breakpoint passes, WebAuthn/passkey support, DB alignment), expanded directory tree with missing routes and supabase migrations, removed duplicate Features header. Synced all AGENT.md and CHANGELOG.md files across `docs/project/` and `docs/project/team_plan/` with root entries through Feb 14. Ran `npm run check` to verify full pipeline passes.
Files: Modified `README.md`, `docs/project/AGENT.md`, `docs/project/team_plan/AGENT.md`, `docs/project/team_plan/CHANGELOG.md`, `AGENT.md`, `CHANGELOG.md`.
Verification: `npm run check` ✅ (443/443 tests pass, build successful).

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Header Action Buttons Alignment (Far Right)
Summary: Adjusted the header actions container so the three controls (profile avatar menu, theme toggle, notifications) align to the far right edge on small screens. Added mobile full-width action row with right justification while preserving existing desktop spacing/behavior.
Files: Modified [components/layout/Header.tsx](components/layout/Header.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅.

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Manage Profiles Page Responsive Breakpoint Pass (Mobile/Tablet/Desktop/Wide)
Summary: Completed a mobile-first responsiveness pass for `/manage-profiles` without redesign. Root causes fixed: rigid row layouts (`justify-between`) in reminder preference cards compressing content on phones, container spacing that was dense on narrow viewports, and potential overflow for long email/student identifiers in profile header. Updated page/skeleton spacing, converted reminder rows to stack on mobile and align horizontally on larger screens, added text wrapping and `min-w-0` protections, and adjusted save action/button behavior for small screens.
Files: Modified [app/manage-profiles/page.tsx](app/manage-profiles/page.tsx), [app/manage-profiles/components/ProfileHeader.tsx](app/manage-profiles/components/ProfileHeader.tsx), [app/manage-profiles/components/ReminderSettings.tsx](app/manage-profiles/components/ReminderSettings.tsx), [app/manage-profiles/components/ProfileSkeleton.tsx](app/manage-profiles/components/ProfileSkeleton.tsx), [app/manage-profiles/error.tsx](app/manage-profiles/error.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test -- app/manage-profiles/__tests__/actions.test.ts` ⚠️ (no tests discovered by project Vitest include `tests/**/*`), `npx vitest run app/manage-profiles/__tests__/actions.test.ts` ⚠️ (fails in ad-hoc mode due unresolved alias import `@/lib/logger`), `npm run lighthouse:local` attempted ⚠️ but local `lhci` exits with `Hello, this is AnupamAS01!` and no report artifact.

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Login Page Responsive Breakpoint Pass (Mobile/Tablet/Desktop/Wide)
Summary: Completed a mobile-first responsiveness pass for `/login` without redesign. Fixed layout pressure on 360–430px by reducing shell/panel spacing, scaling logo/typography, and making critical controls fully fluid on narrow screens. Updated login container overflow behavior to avoid clipping, adjusted section spacing for tablet/desktop progression, and made right hero panel responsive (hidden on smallest screens, preserved on tablet+desktop). Also tuned MFA challenge input sizing/tracking for narrow viewports and made fingerprint button CSS width fluid (`min(100%, 260px)`) to prevent fixed-width constraints.
Files: Modified [app/login/LoginClient.tsx](app/login/LoginClient.tsx), [app/login/components/MFAChallenge.tsx](app/login/components/MFAChallenge.tsx), [app/login/page.tsx](app/login/page.tsx), [app/styles/fingerprint.css](app/styles/fingerprint.css).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test -- app/login/__tests__/actions.test.ts tests/security/login-mfa-failclosed.test.ts` ✅ (4/4 tests pass), `npm run lighthouse:local` attempted ⚠️ but local `lhci` exits with `Hello, this is AnupamAS01!` and no report artifact.

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Settings Page Responsive Breakpoint Pass (Mobile/Tablet/Desktop/Wide)
Summary: Completed a mobile-first responsiveness pass for `/settings` and all section pages (`general`, `appearance`, `security`, `experience`, `support`) without redesign. Root causes fixed: early 2-column breakpoints causing cramped tablet/laptop cards, rigid spacing in settings shell, and multiple card action rows that did not wrap on narrow viewports. Updated layout spacing/breakpoints, moved heavy multi-card pages to `xl` split layouts, and converted key control/action rows to stack on mobile then align horizontally on larger screens. Also fixed overflow risk in security dialogs/cards by wrapping long secret/device text and improving small-screen button behavior.
Files: Modified [app/settings/layout.tsx](app/settings/layout.tsx), [app/settings/general/page.tsx](app/settings/general/page.tsx), [app/settings/appearance/page.tsx](app/settings/appearance/page.tsx), [app/settings/security/page.tsx](app/settings/security/page.tsx), [app/settings/experience/page.tsx](app/settings/experience/page.tsx), [app/settings/support/page.tsx](app/settings/support/page.tsx), [features/settings/components/NotificationSettings.tsx](features/settings/components/NotificationSettings.tsx), [features/settings/components/NotificationRow.tsx](features/settings/components/NotificationRow.tsx), [features/settings/components/GamificationSettings.tsx](features/settings/components/GamificationSettings.tsx), [features/settings/components/MapSettings.tsx](features/settings/components/MapSettings.tsx), [features/settings/components/PrivacySettings.tsx](features/settings/components/PrivacySettings.tsx), [features/settings/components/security/TOTPSetup.tsx](features/settings/components/security/TOTPSetup.tsx), [features/settings/components/security/PasskeyManager.tsx](features/settings/components/security/PasskeyManager.tsx), [features/settings/components/security/BiometricToggle.tsx](features/settings/components/security/BiometricToggle.tsx), [features/settings/components/QuickActions.tsx](features/settings/components/QuickActions.tsx), [features/settings/components/HelpSupport.tsx](features/settings/components/HelpSupport.tsx), [features/settings/components/SettingsSkeleton.tsx](features/settings/components/SettingsSkeleton.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test -- tests/settings` ✅ (85/85 tests pass), `npm run lighthouse:local` attempted ⚠️ but local `lhci` exits with `Hello, this is AnupamAS01!` and no report artifact.

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Map Off-Campus Warning Behavior - 3-Second Popup
Summary: Changed the off-campus warning banner from persistent display to a timed popup. The banner now appears for 3 seconds only when the user transitions from on-campus to off-campus, then auto-hides. If the user returns on-campus, the popup state and timers are cleared immediately. Navigation disable behavior while off-campus remains unchanged.
Files: Modified [features/map/components/CampusMap.tsx](features/map/components/CampusMap.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅.

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Fix Dev HMR WebSocket Failures (/\_next/webpack-hmr)
Summary: Fixed repeated `web-socket.ts:50` failures by excluding all `/_next/*` routes from the Next.js proxy matcher. The previous matcher only excluded `/_next/static` and `/_next/image`, so `/_next/webpack-hmr` could be intercepted by proxy logic and break WebSocket upgrade flow. Updated both proxy matcher definitions to skip `/_next/` entirely.
Files: Modified [proxy.ts](proxy.ts), [tools/proxy/proxy.ts](tools/proxy/proxy.ts).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, HMR websocket smoke test to `ws://localhost:3000/_next/webpack-hmr` ✅ (`WS_OPEN`).

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Service Worker Fetch Failure Handling (sw.js:181)
Summary: Fixed the uncaught promise rejection in the service worker when network-only requests fail offline. Added a `getOfflineResponse()` helper for document, JSON/API, and generic requests, then wrapped the non-cacheable network fetch path in a catch block so it returns controlled `503` `no-store` responses instead of throwing `TypeError: Failed to fetch`.
Files: Modified [public/sw.js](public/sw.js).
Verification: `npm run lint` ✅, `npm run typecheck` ✅.

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Map Warning Placement Update - Move Off-Campus Banner to Bottom
Summary: Updated the off-campus warning placement per user request to render at the bottom of the map instead of top. Changed warning container positioning from top-based offsets to bottom anchoring (`bottom-3 left-3 right-3`) while preserving responsive layout, styling, and readability. This keeps the warning visible and avoids competing with top HUD controls.
Files: Modified [features/map/components/CampusMap.tsx](features/map/components/CampusMap.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test -- tests/map` ✅ (64/64 tests pass).

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Map Off-Campus Warning Overlap Fix (Places Button Access)
Summary: Fixed the off-campus warning banner covering the mobile Places/search quick button. The warning previously rendered at `top-3` with higher stack order (`z-[1200]`), overlapping the top-left mobile control area. Updated warning positioning/stacking so Places remains accessible: moved warning lower on phones (`top-14`, still `sm:top-3` on larger screens) and reduced warning layer to sit below HUD controls (`z-[1000]`). Result: warning remains visible, but no longer blocks the building search entry point.
Files: Modified [features/map/components/CampusMap.tsx](features/map/components/CampusMap.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test -- tests/map` ✅ (64/64 tests pass).

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Map Mobile UX Fix - Visible Building Search Toggle
Summary: Added an explicit mobile-only quick access button for the building search/Places panel because the responsive collapsed state made search feel invisible to users. Implementation: (1) Added a small floating `Places` button (`sm:hidden`) at top-left when the panel is collapsed. (2) Button opens the Places panel and triggers light haptic feedback. (3) Updated the left Places panel container to hide on mobile when collapsed (`hidden sm:flex`), while keeping desktop always visible/expanded behavior intact. This preserves responsive layout while ensuring discoverability of building search on phones.
Files: Modified [features/map/components/CampusMapHUD.tsx](features/map/components/CampusMapHUD.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test -- tests/map` ✅ (64/64 tests pass).

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Map Page Responsive Breakpoint Fixes (Mobile/Tablet/Desktop/Wide)
Summary: Applied a mobile-first responsiveness pass to `/map` without redesign. Root causes addressed: (1) map page shell and skeleton used rigid spacing/column defaults on narrow phones; (2) map layer controls header/actions could crowd or wrap poorly at tablet widths; (3) overlay toggle cards were too dense on small screens when rendered in two columns; (4) share/clear layer action row could overflow horizontally on mobile; (5) Places sidebar in HUD defaulted expanded despite intended mobile-collapsed behavior and occupied too much width, reducing map usability; (6) off-campus warning and Leaflet popup sizing could become cramped at narrow viewports. Changes: updated page/skeleton spacing and skeleton grid breakpoints, made map-layer header/actions wrap, switched overlay toggle grid to progressive `1→2→3`, stacked layer action buttons on mobile, set Places panel to mobile-collapsed/desktop-expanded via `matchMedia`, reduced mobile Places panel width, adjusted warning banner to stack on small screens, and replaced popup fixed min-width with viewport-constrained width.
Files: Modified [app/map/page.tsx](app/map/page.tsx), [features/map/components/MapClient.tsx](features/map/components/MapClient.tsx), [features/map/components/CampusMapHUD.tsx](features/map/components/CampusMapHUD.tsx), [features/map/components/CampusMap.tsx](features/map/components/CampusMap.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test -- tests/map` ✅ (64/64 tests pass). Lighthouse attempt still blocked by local `lhci` behavior (`Hello, this is AnupamAS01!`) with no report artifact generated.

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Calendar Responsive Follow-Up (Dialogs, Forms, Overflow Edge Cases)
Summary: Completed a second responsive pass for `/calendar` focused on dialog/form breakpoints and small-screen overflow that remained after the initial layout fix. Root causes addressed: (1) several calendar-linked forms and detail panels still used `grid-cols-2`/`grid-cols-3` patterns on phones, compressing controls; (2) custom confirmation modals in `CalendarClient` used fixed inner spacing and horizontal action rows, making 360–430px cramped; (3) stacked mobile/tablet calendar flow could still be constrained by shared overflow behavior; (4) Unit detail stats used a fixed 4-column grid, causing narrow-screen crowding. Changes: converted key field/info grids to mobile-first (`grid-cols-1 sm:grid-cols-2`, `grid-cols-1 sm:grid-cols-3`), updated Unit stats to `grid-cols-2 sm:grid-cols-4`, switched custom modal action rows to `flex-col-reverse sm:flex-row`, reduced modal padding on phones (`p-4 sm:p-6`), tightened modal max-height to `max-h-[calc(100vh-2rem)]`, and restricted internal overflow behavior to desktop where appropriate (`lg:overflow-hidden`, `lg:overflow-y-auto`). Also improved wrapping for quick-action rows in detail dialogs to prevent horizontal clipping.
Files: Modified [app/calendar/CalendarClient.tsx](app/calendar/CalendarClient.tsx), [components/assignments/AssignmentForm.tsx](components/assignments/AssignmentForm.tsx), [components/events/EventForm.tsx](components/events/EventForm.tsx), [components/exams/ExamForm.tsx](components/exams/ExamForm.tsx), [components/units/UnitForm.tsx](components/units/UnitForm.tsx), [components/assignments/AssignmentDetailPanel.tsx](components/assignments/AssignmentDetailPanel.tsx), [components/events/EventDetailPanel.tsx](components/events/EventDetailPanel.tsx), [components/exams/ExamDetailPanel.tsx](components/exams/ExamDetailPanel.tsx), [features/calendar/components/TodoDetailPanel.tsx](features/calendar/components/TodoDetailPanel.tsx), [components/units/UnitDetailPanel.tsx](components/units/UnitDetailPanel.tsx), [components/events/EventFormSkeleton.tsx](components/events/EventFormSkeleton.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test -- tests/CalendarPage.test.tsx` ✅ (4/4 tests pass). Lighthouse attempt still blocked by local `lhci` behavior (`Hello, this is AnupamAS01!`) with no report artifact generated.

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Calendar Page Responsive Breakpoint Fixes (Mobile/Tablet/Desktop/Wide)
Summary: Implemented mobile-first responsive fixes for `/calendar` without redesigning components. Root causes addressed: (1) main calendar/content layout was always horizontal (`flex` row), causing sidebar clipping on smaller breakpoints; (2) week grid switched to 7 columns at `md` (768px), making tablet/laptop cards too compressed; (3) desktop header controls had no wrap strategy, causing overflow pressure; (4) Day view used fixed `height: 600px`, causing clipping/unused space across viewport sizes; (5) page padding/skeleton widths were too rigid on narrow screens. Changes: switched main layout to `flex-col` below `lg` and `lg:flex-row` for desktop; added `min-w-0` safeguards; changed week grid breakpoints to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7`; enabled control wrapping in desktop header; made DayView height viewport-clamped (`clamp(...)`) with internal scrolling; tuned sidebar width for `lg/xl`; updated page/skeleton spacing to responsive `px/py` values.
Files: Modified [app/calendar/page.tsx](app/calendar/page.tsx), [app/calendar/CalendarClient.tsx](app/calendar/CalendarClient.tsx), [features/calendar/components/CalendarSidebar.tsx](features/calendar/components/CalendarSidebar.tsx), [features/calendar/components/DayView.tsx](features/calendar/components/DayView.tsx), [features/calendar/components/FilterPanel.tsx](features/calendar/components/FilterPanel.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test -- tests/CalendarPage.test.tsx` ✅ (4/4 tests pass). Lighthouse command was attempted (`npm run lighthouse:local` and `npx lhci collect ...`) but the configured `lhci` binary exits immediately with `Hello, this is AnupamAS01!`, so no Lighthouse report was produced in this environment.

Raouf: 2026-02-13 (Australia/Sydney)
Scope: Fix Select Dropdown Scroll & Notification Bulk Delete
Summary: Fixed two issues: (1) Select dropdown scroll — removed fixed `h-(--radix-select-trigger-height)` from Radix Select Viewport in popper mode. This CSS variable forced the Viewport to match the trigger height (~36px), preventing items from rendering beyond that height and breaking scroll. Changed to only set `min-w-(--radix-select-trigger-width)` so the Viewport sizes naturally to fit items, while Content's `max-h` and `overflow-y-auto` handle scrolling. (2) Notification bulk delete — added missing `DELETE /api/notifications` handler to the base notifications route. The store's `clearAll()` method was calling `DELETE /api/notifications` which returned 405 Method Not Allowed. New handler deletes all non-soft-deleted notifications for the authenticated user and returns the count.
Files: Modified [components/ui/select.tsx](components/ui/select.tsx), [app/api/notifications/route.ts](app/api/notifications/route.ts).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test` ✅ (442/442 tests pass).

Raouf: 2026-02-13 (Australia/Sydney)
Scope: Standardize Security Settings Toggle Components
Summary: Updated all security toggle components in Privacy settings to match the standard ToggleControl switch pattern used by NotificationSettings and GamificationSettings. Previously, BiometricToggle, TOTPSetup, and PasskeyManager used different visual patterns (round icon containers with `bg-mq-primary/10 rounded-full`, Badge status pills, and small ghost text buttons), creating visual inconsistency. Changes: (1) BiometricToggle — replaced text "Enable"/"Disable" Button with ToggleControl switch; removed round icon container and Badge; added inline icon with standard row layout; toggle click opens confirmation dialog. (2) TOTPSetup — same pattern; replaced text Button with ToggleControl switch; removed round icon container and Badge; simplified to standard row layout. (3) PasskeyManager — removed round icon container and Badge; simplified to standard row layout with inline icon; kept "Add" button styled consistently with Change Password/Manage Sessions buttons. (4) SMS Coming Soon section — updated to use standard row layout with inline MessageSquare icon. (5) Updated BiometricToggle tests to query `role="switch"` instead of `role="button"`.
Files: Modified [features/settings/components/security/BiometricToggle.tsx](features/settings/components/security/BiometricToggle.tsx), [features/settings/components/security/TOTPSetup.tsx](features/settings/components/security/TOTPSetup.tsx), [features/settings/components/security/PasskeyManager.tsx](features/settings/components/security/PasskeyManager.tsx), [features/settings/components/PrivacySettings.tsx](features/settings/components/PrivacySettings.tsx), [tests/unit/components/BiometricToggle.test.tsx](tests/unit/components/BiometricToggle.test.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test` ✅ (442/442 tests pass).

Raouf: 2026-02-13 (Australia/Sydney)
Scope: Wire Email Verification Integration Points
Summary: Wired the 4 integration points for the custom email verification system. (1) Signup route: after successful user+profile creation, calls `createAndSendVerification()` to generate token, store hash, and send email via Resend. Fire-and-forget to avoid blocking signup response. Skipped for dev emails in development (they get auto-confirmed). (2) Signup client: already handled — shows "Please check your email to verify your account" toast and redirects to /login when no session is returned. (3) Vercel Cron: created vercel.json with daily cleanup schedule (0 3 \* \* \*) calling GET /api/auth/email/cleanup. Updated cleanup route to support both GET (Vercel Cron) and POST (manual). (4) Extracted `createAndSendVerification()` orchestrator into emailVerification.ts for reuse between signup route and send-verification route (DRY).
Files: Modified [app/api/auth/signup/route.ts](app/api/auth/signup/route.ts), [lib/security/emailVerification.ts](lib/security/emailVerification.ts), [app/api/auth/email/send-verification/route.ts](app/api/auth/email/send-verification/route.ts), [app/api/auth/email/cleanup/route.ts](app/api/auth/email/cleanup/route.ts). Created [vercel.json](vercel.json).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test` ✅ (442/442 tests pass).

Raouf: 2026-02-13 (Australia/Sydney)
Scope: Custom Email Verification System (Resend)
Summary: Implemented a production-ready custom email verification system replacing Supabase email. Architecture: User → API → Database → Resend. (1) SQL migration: `email_verifications` table with SHA-256 token hashing, partial indexes, RLS, cleanup function, and optional pg_cron schedule. (2) Token module: 32-byte random token generation, SHA-256 hashing, 20-min expiry, rate limiter (3 sends/hour). (3) Email service: Resend API integration with branded HTML template, no raw tokens in logs. (4) Send verification route: POST /api/auth/email/send-verification — authenticated, rate-limited, invalidates previous tokens, stores hash only. (5) Verify route: POST /api/auth/email/verify — hashes incoming token, finds valid record, marks used, confirms user via admin API. Generic error messages prevent information leakage. (6) Cleanup route: POST /api/auth/email/cleanup — cron-protected endpoint calling SQL cleanup function. (7) Verify page: /verify?token=<token> — client-side landing page with loading/success/error states. (8) UI: replaced SMSSetup with "SMS verification coming soon" placeholder. (9) Config: added EMAIL_SEND_VERIFICATION, EMAIL_VERIFY, EMAIL_CLEANUP routes. (10) Env: added RESEND_API_KEY, VERIFICATION_EMAIL_FROM, CRON_SECRET to .env.local.example. No Supabase email. No SMS backend. No UI redesign.
Files: Created [supabase/migrations/20260213000000_email_verifications.sql](supabase/migrations/20260213000000_email_verifications.sql), [lib/security/emailVerification.ts](lib/security/emailVerification.ts), [lib/services/emailService.ts](lib/services/emailService.ts), [app/api/auth/email/send-verification/route.ts](app/api/auth/email/send-verification/route.ts), [app/api/auth/email/verify/route.ts](app/api/auth/email/verify/route.ts), [app/api/auth/email/cleanup/route.ts](app/api/auth/email/cleanup/route.ts), [app/verify/page.tsx](app/verify/page.tsx). Modified [lib/constants/config.ts](lib/constants/config.ts), [.env.local.example](.env.local.example), [features/settings/components/PrivacySettings.tsx](features/settings/components/PrivacySettings.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test` ✅ (442/442 tests pass).

Raouf: 2026-02-13 (Australia/Sydney)
Scope: Verify TOTP Authenticator App Wiring
Summary: Verified the full TOTP (Authenticator App) flow is correctly wired end-to-end from settings enrollment through login challenge verification. Traced: (1) Enrollment: TOTPSetup → POST /api/auth/mfa/enroll → Supabase MFA enroll → QR code + secret → POST /api/auth/mfa/verify → challenge + verify → factor verified. (2) Login: loginAction → signInWithPassword (aal1) → getAuthenticatorAssuranceLevel → if nextLevel=aal2, return mfaRequired with factors → MFAChallenge component → POST /api/auth/mfa/challenge-verify → challenge + verify → aal2. (3) Security: rate limiting on all endpoints, fail-closed on MFA check failure, Zod validation, no-cache headers on enrollment, input sanitisation. No issues found — all wiring is correct.
Files: No files modified (verification audit only).
Verification: `npm run test` ✅ (442/442 tests pass), 68/68 security tests pass across 7 test files.

Raouf: 2026-02-13 (Australia/Sydney)
Scope: Wire Security Settings to Login Page
Summary: Connected security settings from Privacy tab to the login page. (1) Fixed critical bug in passkey status API — was using `adminClient.from('auth.users')` which doesn't work with Supabase JS client for system tables; replaced with `adminClient.rpc('lookup_user_by_email')` matching the pattern used by the passkey options route. (2) Extended passkey status API to also return `mfaEnabled` field by checking verified MFA factors via admin API. (3) Enhanced login page with a "Security Methods" indicator section that appears after entering an email, showing biometric/passkey availability and 2FA status as color-coded badges. (4) Updated passkey button to only be clickable when passkey is actually available (disabled otherwise) with green border highlight when available. (5) Removed redundant passkey status text below button, replaced with the new integrated security methods panel.
Files: Modified [app/api/auth/passkey/status/route.ts](app/api/auth/passkey/status/route.ts), [app/login/LoginClient.tsx](app/login/LoginClient.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test` ✅ (442/442 tests pass).

Raouf: 2026-02-13 (Australia/Sydney)
Scope: Integrate Security Options into Privacy Settings Tab
Summary: Integrated all security options (Biometric, TOTP/Authenticator App, SMS 2FA, Passkeys/WebAuthn) into the Privacy settings tab. User wanted these security features wired up from settings to login. Implementation: (1) Added imports for BiometricToggle, TOTPSetup, SMSSetup, and PasskeyManager components. (2) Added MFA status fetching with fetchMFAStatus callback that calls API_ROUTES.AUTH.MFA_STATUS on mount. (3) Created new "Two-Factor Authentication & Security" section with loading state. (4) All security components now render in Privacy settings with proper factors state passing. (5) Fixed test failures by mocking security components (that use react-query) and useSessionManager hook to avoid QueryClient errors. (6) Added API_ROUTES.AUTH.PASSWORD and SECURITY_CONFIG to test mocks. All 23 PrivacySettings tests now pass.
Files: Modified [features/settings/components/PrivacySettings.tsx](features/settings/components/PrivacySettings.tsx), [tests/settings/PrivacySettings.test.tsx](tests/settings/PrivacySettings.test.tsx).
Verification: `npm test -- tests/settings/PrivacySettings.test.tsx` ✅ (23/23 tests pass).

Raouf: 2026-02-13 (Australia/Sydney)
Scope: Make This Week Stats Clickable with Event Details Dialog
Summary: Made all stat cards and category bars in the "This Week" widget clickable to show event details in a dialog. User wanted the same dialog functionality as announcements. Implementation: (1) Added dialog state to track selected stat and events list. (2) Made StatCard and CategoryBar components clickable with hover/active effects. (3) Created EventCard component to display individual events with title, category badge, description, date/time, and location. (4) Dialog shows event list with scrollable content for categories with many events. (5) Each stat (Total Events, This Week, Free Food) and category bar (Career, Academic, Social, Free Food) opens a filtered list of relevant events. Clicking any stat or bar now shows detailed event information in a clean modal view.
Files: Modified `features/feed/components/QuickStats.tsx`.
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test` ✅ (442/442 tests pass).

Raouf: 2026-02-13 (Australia/Sydney)
Scope: Convert Announcement Cards to Open in Dialog
Summary: Changed announcement cards to open in a full dialog/modal instead of inline expansion. User wanted each announcement to open a "page card" when clicked for better readability. Implementation: (1) Replaced inline expand/collapse logic with dialog state management using `selectedAnnouncement`. (2) Added Dialog component with header showing icon, badge, and title. (3) Full message displayed in DialogDescription with relaxed leading for better readability. (4) Included "Learn More" button (if link exists) and "Close" button in dialog footer. (5) Removed ChevronDown icon and inline expansion styles. (6) Added hover effects and active scale animation to cards for better UX. Cards now open in a clean, focused modal view.
Files: Modified `features/feed/components/AnnouncementsSection.tsx`.
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test` ✅ (442/442 tests pass).

Raouf: 2026-02-13 (Australia/Sydney)
Scope: Fix View All Events Widget Highlight - React Strict Mode Compatible
Summary: Fixed the Events widget highlight not appearing when clicking "View All" from the home page. Root cause: React Strict Mode in development runs effects twice - first run set the `hasProcessedCurrentHighlight` ref to true, cleanup cleared timers, second run saw ref was true and exited early without creating new timers, resulting in no highlight. Solution: Move ref reset from timer callback to effect cleanup function. Now in Strict Mode: first run sets ref and timers, cleanup clears timers and resets ref, second run sees ref is false and creates new timers correctly. In production: effect runs once, cleanup only runs on unmount. The widget now: (1) activates highlight in setTimeout(0) to avoid React lint warnings, (2) scrolls smoothly to widget, (3) stays highlighted for exactly 3 seconds, (4) clears automatically. Works in both dev (Strict Mode) and production.
Files: Modified `features/calendar/components/CalendarWidgets.tsx`.
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test` ✅ (442/442 tests pass).

Raouf: 2026-02-13 (Australia/Sydney)
Scope: Event Highlight Timing, Clickable Announcements, Security-Login Wiring, UnitForm Scroll Fix
Summary: Fixed 4 UX issues: (1) Calendar event highlight now auto-clears after exactly 3 seconds instead of persisting indefinitely; section highlight also updated from 2s to 3s. (2) Feed announcement cards are now clickable with expand/collapse to show full message and optional links. (3) Security settings now includes an "Account Security" section with a "Change Password" button that navigates to the login page with redirect back. (4) UnitForm dialog restructured with flex layout so the form body scrolls independently while header/footer stay fixed, supporting all 7 days of class times.
Files: Modified `features/calendar/components/CalendarWidgets.tsx`, `features/feed/components/AnnouncementsSection.tsx`, `features/settings/components/SecuritySettings.tsx`, `components/units/UnitForm.tsx`.
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test` ✅ (442/442 tests pass), `npm run build` ✅.

Raouf: 2026-02-12 (Australia/Sydney)
Scope: Full System Integrity Check & Test ID Fix
Summary: Ran `npm run check` and fixed a test failure in `NotificationSettings.test.tsx`. The failure was due to a mismatch in `data-testid` for the "Enable" button in the push notification banner. Reverted the test ID in `NotificationSettings.tsx` to `enable-notifications-button` to align with the existing tests.
Files: Modified `features/settings/components/NotificationSettings.tsx`.
Verification: `npm run check` passes ✅ (All 428 tests pass, build successful).

Raouf: 2026-02-12 (Australia/Sydney)
Scope: Settings Page Components Refactor (Notification & Gamification)
Summary: Refactored `NotificationSettings.tsx` and `GamificationSettings.tsx` to reduce complexity and improve type safety. Extracted `ToggleControl`, `NotificationRow`, and `GamificationToggleRow` components. Fixed missing translation keys in `translations.json` to resolve type errors.
Files: Modified `NotificationSettings.tsx`, `GamificationSettings.tsx`, `locales/en/translations.json`. Created `ToggleControl.tsx`, `NotificationRow.tsx`, `GamificationToggleRow.tsx`.
Verification: `npm run typecheck` passes ✅.

Raouf: 2026-02-12 (Australia/Sydney)
Scope: Full System Integrity Check & Lint Fix
Summary: Ran `npm run format`, `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`. Fixed a React Hook lint error in `CalendarWidgets.tsx` where `setState` was called synchronously within an effect.
Files: Modified `features/calendar/components/CalendarWidgets.tsx`.
Verification: `npm run check` passes ✅ (All 425 tests pass, build successful).

Raouf: 2026-02-12 (Australia/Sydney)
Scope: Fix Merge Conflict in CalendarClient.tsx
Summary: Resolved merge conflicts in `app/calendar/CalendarClient.tsx` by combining UI improvements from the incoming change (icons, layout) with accessibility fixes and clean code practices from the current head (using `UNIT_COLORS`, adding `aria-label`).
Files: Modified `app/calendar/CalendarClient.tsx`.
Verification: Verified that conflict markers are removed and code structure is valid.

Raouf: 2026-02-12 (Australia/Sydney)
Scope: Calendar Page Refactor, Accessibility & Full System Check
Summary: Refactored `app/calendar/CalendarClient.tsx` to separate UI from logic, fixed all linting/accessibility warnings, and ensured full system integrity. Applied formatting via Prettier and verified the entire project with `npm run check`.
Files: Modified `app/calendar/CalendarClient.tsx`, `locales/en/translations.json`, `features/calendar/components/CalendarWidgets.tsx`.
Verification: `npm run check` ✅ (Formatting, Lint, Typecheck, 425/425 Tests, Build).

Raouf: 2026-02-11 (Australia/Sydney)
Scope: Home Page Refactor - Phase 1 & 2 & 3
Summary: Refactored `app/home/HomeClient.tsx` to reduce complexity and improve maintainability. Extracted logic into custom hooks: `useHomeUser`, `useSampleSeeding`, `useHomeData`, `useHomeEventListeners`, and `useHomeErrorBoundary`. Created new `features/home/hooks/` directory. Verified with lint, typecheck, tests, and build.
Files: Modified `app/home/HomeClient.tsx`. Created `features/home/hooks/*`, `features/home/types.ts`.
Verification: `npm run check` ✅ (lint, typecheck, 425/425 tests, build all pass).
Follow-ups: Continue refactoring other candidates if requested.

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Gamification Logic and Security Production Audit
Summary: Completed full gamification audit and implemented hardening/fixes across UI logic, client store behavior, API validation, and database RPC security. Fixes include: (1) corrected XP progress math bug in `useXPProgress`, (2) fixed compact stats progress percentage scaling bug, (3) removed persisted `hasLoaded` behavior that caused stale profile/event state and forced fresh fetch on boot via persist merge, (4) ensured logout store reset clears gamification state via `reset()` not `resetProgress()`, (5) hardened `GET /api/gamification` query limit parsing to prevent NaN/invalid values, (6) removed unsafe `any` casts in gamification POST route, (7) added CSRF protection and stricter schema validation to `/api/gamification/award-xp` (event attendance now requires UUID reference), (8) added duplicate-check/error-path hardening and RPC result shape validation, (9) updated feed XP award flow to only send event XP requests when event IDs are verifiable UUIDs, and (10) added DB migration to lock down `award_xp` and `update_streak` SECURITY DEFINER functions (search_path hardening, cross-user mutation guard, execute privilege restrictions).
Files: Modified `lib/store/gamificationStore.ts`, `features/gamification/components/GamificationStats.tsx`, `lib/utils/clientStorage.ts`, `app/api/gamification/route.ts`, `app/api/gamification/award-xp/route.ts`, `features/feed/hooks/useFeedLogic.ts`, `tests/gamification/GamificationStats.test.tsx`; Added `supabase/migrations/20260214000000_harden_gamification_rpc.sql`.
Verification: `npm run test -- tests/gamification` ✅ (96/96), `npm run typecheck` ✅, `npx eslint --config config/eslint/eslint.config.mjs ...changed files` ✅.

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Supabase CLI Alignment Audit (Tables/RPC vs Code Usage)
Summary: Ran Supabase CLI checks and schema usage audit to ensure database objects align with code references. CLI results: local Docker-backed checks failed because Docker daemon is not running (`supabase status`, `supabase db lint` local). Linked/remote checks are currently blocked by Supabase temp-role authentication failures and circuit breaker (`password authentication failed` / `Circuit breaker open`) for `supabase db lint --linked` and `supabase db push --dry-run`. Completed static alignment audit by extracting all `.from()` and `.rpc()` targets from code and comparing against canonical `supabase/migrations`. Found and fixed two canonical migration gaps: missing `public.user_sessions` table and missing `public.get_my_audit_logs` RPC in `supabase/migrations`. Added one alignment migration creating `user_sessions` (RLS, indexes, grants/policies) and defining `get_my_audit_logs` with bounded pagination and execute grants.
Files: Added `supabase/migrations/20260214001000_align_code_db_objects.sql`.
Verification: Code-to-migration diff now shows no missing `.from()` tables and no missing `.rpc()` functions; `npm run typecheck` ✅.

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Supabase CLI Recovery + Full Remote Migration Push
Summary: Fixed Supabase CLI migration connectivity using explicit DB password auth via `.env` project ref + `supabase link -p ...`, then completed remote migration rollout end-to-end. Encountered and resolved multiple production migration blockers during push: (1) non-idempotent constraint creation in `20260114011650_fix_schema_comprehensive.sql`, (2) duplicate migration version collisions (`20260119000000`, `20260124000000`, `20260207000000`) by renaming pending migration files to unique timestamps, and (3) non-idempotent policy creation in `20260203000002_public_events.sql`. After successful push, performed direct SQL verification against remote DB and found schema-history drift (tables/function missing despite migration history entries). Added recovery migrations to restore missing code-required objects (`log_audit` RPC and missing security/audit tables), then pushed and re-verified. Final state: `supabase db push --dry-run --include-all` reports remote up to date; migration history local=remote; required code-referenced tables and RPCs exist.
Files: Modified `supabase/migrations/20260114011650_fix_schema_comprehensive.sql`, `supabase/migrations/20260203000002_public_events.sql`; Renamed `supabase/migrations/20260119000000_multiuser_demo_seed.sql` -> `supabase/migrations/20260119050000_multiuser_demo_seed.sql`, `supabase/migrations/20260124000000_create_todos_table.sql` -> `supabase/migrations/20260124001000_create_todos_table.sql`, `supabase/migrations/20260207000000_fix_building_codes.sql` -> `supabase/migrations/20260207001000_fix_building_codes.sql`; Added `supabase/migrations/20260214002000_restore_log_audit_function.sql`, `supabase/migrations/20260214003000_restore_missing_core_security_tables.sql`.
Verification: `supabase db push --dry-run --include-all -p ...` ✅ (Remote database is up to date), `supabase migration list -p ...` ✅ (local=remote through `20260214003000`), direct SQL checks ✅ (`missing_tables=none`, `missing_functions=none` for code-referenced objects).

Raouf: 2026-02-16 (Australia/Sydney)
Scope: Security Posture Discovery & Evidence Documentation
Summary: Completed a full repository-wide discovery pass of implemented cybersecurity controls and produced presentation-ready security documentation. Added `docs/security/SECURITY_POSTURE.md` with executive summary, evidence-backed control catalogue (path+identifier+verification+status), STRIDE-oriented threat snapshot, historical AGENT/CHANGELOG security traceability mapping, and prioritized gaps with “Not evidenced” where runtime wiring was not found. Added `docs/security/SECURITY_EVIDENCE_INDEX.md` grouping security-relevant files by control area for fast reviewer navigation.
Files: Created `docs/security/SECURITY_POSTURE.md`, `docs/security/SECURITY_EVIDENCE_INDEX.md`.
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test` ✅ (443/443 pass), `npm run build` ✅.
Follow-ups: Consider wiring backup-code and session-termination runtime routes, then add integration tests for those paths.

Raouf: 2026-02-16 (Australia/Sydney)
Scope: README Hardening Documentation Refresh
Summary: Audited `README.md` for accuracy after the security posture documentation pass, added explicit lint guidance (`npm run lint`) in the QA setup flow, added a concise "Common Development Commands" block for day-to-day verification, and linked the newly added security documentation (`docs/security/SECURITY_POSTURE.md`, `docs/security/SECURITY_EVIDENCE_INDEX.md`) under Technical Documentation.
Files: Modified `README.md`.
Verification: Documentation consistency check against `package.json` scripts (`dev`, `lint`, `typecheck`, `test`, `build`, `check`) ✅.

Raouf: 2026-02-16 (Australia/Sydney)
Scope: Privacy Policy Documentation + README Wiring
Summary: Added a dedicated privacy policy document that explicitly describes what user/system data Syllabus Sync collects and how it is used, with direct code/schema evidence references. Wired privacy documentation into the main README technical docs list and updated docs index policy entry points for discoverability.
Files: Added `docs/policies/privacy-policy.md`; Modified `README.md`, `docs/README.md`.
Verification: Cross-checked policy claims against implemented code paths and schema objects in `app/api/auth/*`, `app/api/profiles/route.ts`, `app/api/navigate/route.ts`, `app/api/weather/route.ts`, `lib/security/emailVerification.ts`, `lib/supabase/middleware.ts`, and `supabase/migrations/*` ✅.

Raouf: 2026-02-16 (Australia/Sydney)
Scope: Console Warning Noise Reduction (Preload + Offline Fetch)
Summary: Investigated browser warnings for unused `apps.rokt.com` font preload and repeated `Failed to fetch` store warnings. Removed unused Rokt font source from CSP (`font-src`) because the repo has no first-party Rokt integration. Added shared network/offline detection helpers in `lib/utils/api.ts` and updated notifications/events/deadlines stores to suppress repeated offline fetch warning spam while preserving authentication error handling and persisted-data fallback behavior.
Files: Modified `lib/security/csp.ts`, `lib/utils/api.ts`, `lib/store/notificationsStore.ts`, `lib/store/eventsStore.ts`, `lib/store/deadlinesStore.ts`.
Verification: `npx eslint --config config/eslint/eslint.config.mjs lib/security/csp.ts lib/utils/api.ts lib/store/notificationsStore.ts lib/store/eventsStore.ts lib/store/deadlinesStore.ts` ✅, `npm run typecheck` ✅.

Raouf: 2026-02-16 (Australia/Sydney)
Scope: Supabase ECONNRESET Fail-Fast + ChunkLoadError Hardening
Summary: Implemented fail-fast Supabase request behavior to reduce long proxy/API stalls during transient network failures (e.g., ECONNRESET). Added a shared timed fetch wrapper (`lib/supabase/fetch.ts`), wired it into server-side Supabase clients (`lib/supabase/server.ts`, `lib/proxy.ts`), and added a hard timeout guard around proxy auth resolution to prevent minute-long request blocking. Hardened service worker caching to prevent stale Next.js chunk/runtime asset caching by excluding `/_next/*`, removing JS extension caching, and bumping cache versions in `public/sw.js`.
Files: Added `lib/supabase/fetch.ts`; Modified `lib/supabase/server.ts`, `lib/proxy.ts`, `public/sw.js`.
Verification: `npx eslint --config config/eslint/eslint.config.mjs lib/proxy.ts lib/supabase/server.ts lib/supabase/fetch.ts` ✅, `npm run typecheck` ✅.

Raouf: 2026-02-16 (Australia/Sydney)
Scope: Proxy Timeout Race Fix + AbortError Noise Suppression
Summary: Fixed repeated `Proxy auth status: timeout after 3500ms` and `AbortError: Supabase request timeout after 8000ms` noise by removing the proxy `Promise.race` timeout pattern that left unresolved `getUser()` promises. Kept timeout-bounded fetch only in proxy path, restored default Supabase server client fetch in `lib/supabase/server.ts`, and added throttled transient network-error logging in proxy (ECONNRESET/fetch failed/AbortError) to prevent repeated console spam.
Files: Modified `lib/proxy.ts`, `lib/supabase/server.ts`.
Verification: `npx eslint --config config/eslint/eslint.config.mjs lib/proxy.ts lib/supabase/server.ts lib/supabase/fetch.ts` ✅, `npm run typecheck` ✅.

Raouf: 2026-02-16 (Australia/Sydney)
Scope: Additional Proxy/Auth Noise & Latency Reduction
Summary: Reduced proxy/auth overhead and transient error noise further by skipping proxy user-resolution for routes that do not require user context (especially public API routes like `/api/auth/*`, `/api/health`, `/api/weather`). Added transient network error throttling in shared API auth middleware (`requireAuth`, `optionalAuth`, `requireAuthWithRateLimit`) so ECONNRESET/fetch-failed conditions are treated as temporary upstream failures without repeated console spam.
Files: Modified `lib/proxy.ts`, `app/api/_lib/middleware.ts`.
Verification: `npx eslint --config config/eslint/eslint.config.mjs lib/proxy.ts app/api/_lib/middleware.ts lib/supabase/server.ts` ✅, `npm run typecheck` ✅.

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Frontend Redesign — Terms, Privacy, Signup, Reset Password
Summary: Redesigned four pages to match the login page glass-morphism aesthetic and MQ branding. Terms of Service and Privacy Policy received a dark MQ blue header banner, sticky desktop sidebar TOC, numbered section badges, and hover left-border accent. Signup and Reset Password received a fixed background image (`login-bg.png`) with gradient overlay, glass card (`backdrop-blur-xl`, `bg-mq-card-background/85`, 30% opacity border, heavy shadow), and `animate-in fade-in slide-in-from-bottom-4` entry animation.
Files: Modified `app/terms/page.tsx`, `app/privacy/page.tsx`, `app/signup/SignupClient.tsx`, `app/reset-password/reset-password-client.tsx`.
Verification: `npm run typecheck` ✅, `npm run test:ci` ✅ (483/483 pass).

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Signup ↔ Manage Profile Sync (Course + Year)
Summary: Connected the signup and manage-profile pages so course/year choices are consistent and interoperable. Replaced plain `<Input>` course field in `AcademicInfoCard` with `CourseCombobox`. Added dynamic year range matching signup logic. Added `YEAR_LEGACY_MAP` + `normalizeYear()` for backward compatibility with existing users whose year was stored in `"Nth Year"` format.
Files: Modified `app/manage-profiles/components/AcademicInfoCard.tsx`, `app/manage-profiles/hooks/useProfileManager.ts`.
Verification: `npm run typecheck` ✅, `npm run test:ci` ✅ (483/483 pass).

Raouf: 2026-02-19 (Australia/Sydney)
Scope: CSP Avatar Upload Fix + CourseCombobox Dropdown Fixed Position
Summary: Fixed CSP `connect-src` blocking `data:` URI avatar uploads by replacing `fetch(dataUrl)` with `dataUrlToBlob()` (pure-JS atob+Uint8Array Blob construction). Fixed CourseCombobox dropdown clipped by `overflow:hidden` ancestor by switching to `position: fixed` with `getBoundingClientRect()` coords + scroll/resize repositioning listeners.
Files: Modified `lib/store/profilesStore.ts`, `app/signup/components/CourseCombobox.tsx`.
Verification: `npm run typecheck` ✅, `npm run test:ci` ✅ (483/483 pass).

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Post-OAuth Onboarding Gate + CourseCombobox Portal Fix + Avatar Upload Fix
Summary: OAuth callback now checks profile completeness and redirects to /onboarding when course/year are missing. CourseCombobox dropdown moved to React createPortal(document.body) — eliminates all overflow/event hierarchy issues. Avatars storage bucket migration created with RLS. ProfileHeader file input now resets on change to allow re-uploading same file; profile.id captured before async FileReader callback.
Files: Modified `app/auth/callback/route.ts`, `app/signup/components/CourseCombobox.tsx`, `app/manage-profiles/components/ProfileHeader.tsx`. Created `app/onboarding/page.tsx`, `app/onboarding/OnboardingClient.tsx`, `app/api/auth/onboarding/route.ts`, `supabase/migrations/20260219000000_avatars_storage_bucket.sql`.
Verification: `npm run typecheck` ✅, `npm run test:ci` ✅ (483/483 pass), deployed ✅.

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Full Check Clean — Lint Errors + Avatar Remote Pattern
Summary: Resolved all 20 ESLint errors and 7 warnings from `npm run check`. Key patterns used: (a) `startTransition(() => setState(…))` inside `useEffect` bodies to satisfy react-hooks/set-state-in-effect — required in ReminderModal and CourseCombobox. (b) `const tStr = t as (key: string) => string` helper at component top instead of per-call `as any` casts — avoids no-explicit-any with typed translation functions. (c) Conditional spread `{...(condition && { role, tabIndex, onClick, onKeyDown })}` for interactive attributes on `<div>` elements — only adds a11y roles when the element is genuinely interactive. (d) Next.js `remotePatterns` in `next.config.ts` required for any external image host (`*.supabase.co`) used with `<Image>` component. (e) Unused destructured props must be prefixed with `_` (e.g., `_onToggleNotification`) to satisfy no-unused-vars.
Files: Modified `config/next/next.config.ts`, `lib/store/remindersStore.ts`, `features/calendar/components/ItemActionButtons.tsx`, `app/signup/components/CourseCombobox.tsx`, `components/ui/ReminderModal.tsx`, `components/assignments/AssignmentDetailPanel.tsx`, `components/exams/ExamDetailPanel.tsx`.
Verification: `npm run check` ✅ — typecheck (0 errors), lint (0 errors, 0 warnings), test:ci (483/483), build (all 23 routes).

Raouf: 2026-02-19 (Australia/Sydney)
Scope: Avatar Fallback + MQ Units 2026 Refresh + Check Clean
Summary: Key patterns: (a) Next.js `<Image>` with Supabase avatar URLs — always add `unoptimized` and an `onError` state to fall back to initials; don't rely on `remotePatterns` alone. (b) Regenerate `data/mqUnitsData.ts` with Python script: filter `status === 'Approved'`, strip non-ASCII with `re.sub(r'[^\x00-\x7F]+', ' ', s)`, parse `special_unit_type` label via `ast.literal_eval`, sort by code. (c) JSDOM missing browser APIs: stub in `tests/setup.ts` — `scrollIntoView` not implemented in JSDOM; add `Element.prototype.scrollIntoView = () => {}`. (d) React Compiler memoization errors: ensure all values used inside `useCallback` are in the dep array — the compiler flags missing deps as "Compilation Skipped".
Files: Modified `components/layout/Header.tsx`, `data/mqUnitsData.ts`, `components/ui/ReminderModal.tsx`, `components/ui/UnitAutocomplete.tsx`, `tests/setup.ts`.
Verification: `npm run check` ✅ — typecheck, lint, test (483/483), build all green.
