# Agent Rules

Raouf: 2026-02-08 (Australia/Sydney)
Scope: Deploy security audit migration + env vars + cleanup
Summary: Deployed `20260208000000_security_audit_fixes.sql` migration to remote Supabase via `supabase db push`. Fixed nested `$$` dollar-quoting in pg_cron `DO` block (changed inner `$$...$$` to `$cron$...$cron$` and outer `DO $$` to `DO $outer$`). Repaired migration history: marked 16 remote-only migrations as reverted, 20 local migrations as applied, then pushed the security audit migration successfully. Set `WEBAUTHN_RP_ID=localhost` and `WEBAUTHN_ORIGIN=http://localhost:3000` in `.env.local` for development. Added documented WEBAUTHN env var section to `.env.example`. Formatted `CHANGELOG.md` with Prettier.
Files: Modified 3 files: `supabase/migrations/20260208000000_security_audit_fixes.sql` (dollar-quoting fix), `.env.local` (added WEBAUTHN vars), `.env.example` (added documented WEBAUTHN section).
Verification: `npm run check` ✅ (secrets, format, typecheck, lint, 411/411 tests, build all pass). `supabase db push` ✅ (migration applied to remote).
Follow-ups: (1) Enable pg_cron extension in Supabase Dashboard (Database → Extensions) then run the cron.schedule SQL manually. (2) Set `WEBAUTHN_RP_ID` and `WEBAUTHN_ORIGIN` to production domain in hosting platform env vars (e.g., Vercel).

Raouf: 2026-02-08 (Australia/Sydney)
Scope: Security Audit — Settings → Security (MFA + WebAuthn hardening)
Summary: Full security audit of the 2-Step Verification implementation. Identified 8 findings (1 critical, 3 high, 2 medium, 2 info). **Fixes applied:** (1) **CRITICAL: Replaced `admin.listUsers()` in WebAuthn authenticate/options** — was loading ALL users into memory (DoS vector) and silently failing for users #51+ (functional bug). Created `lookup_user_by_email` RPC function (SECURITY DEFINER, service_role only) and migration. (2) **HIGH: MFAChallenge.tsx re-routed through server API** — was calling Supabase MFA API directly from browser, bypassing server-side rate limiting (5 attempts/15 min). Now uses `/api/auth/mfa/challenge-verify` server route. (3) **HIGH: Login MFA check changed from fail-open to fail-closed** — a network/service error during MFA status check was silently bypassing MFA; now blocks login with `mfa_check_failed` error. (4) **HIGH: Added rate limiting to WebAuthn credentials GET/DELETE** — was unprotected, allowing rapid credential enumeration or deletion. Added `webauthnCredentialsLimiter` (20 req / 15 min, fail-closed). (5) **MEDIUM: Added `Cache-Control: no-store` to TOTP enroll response** — response contains TOTP secret + QR code that must not be cached by proxies. (6) **LOW: PasskeyManager.tsx now uses `API_ROUTES` constants** instead of hardcoded strings. Added 15 new tests across 3 new test files covering all fixes.
Files: Created 4 files: `supabase/migrations/20260208000000_security_audit_fixes.sql`, `tests/security/webauthn-auth-options.test.ts`, `tests/security/login-mfa-failclosed.test.ts`, `tests/security/totp-enroll-cachecontrol.test.ts`. Modified 8 files: `authenticate/options/route.ts`, `MFAChallenge.tsx`, `actions.ts`, `credentials/route.ts`, `webauthn.ts`, `enroll/route.ts`, `PasskeyManager.tsx`, `webauthn-credentials.test.ts`.
Verification: `npm run check` ✅ (secrets, format, typecheck, lint, 411/411 tests, build all pass).
Follow-ups: (1) Run `supabase db push` to apply the `lookup_user_by_email` RPC function. (2) Set `WEBAUTHN_RP_ID` and `WEBAUTHN_ORIGIN` env vars in production. (3) Enable pg_cron extension in Supabase Dashboard for automatic WebAuthn challenge cleanup.

Raouf: 2026-02-07 (Australia/Sydney)
Scope: 2-Step Verification — full MFA + WebAuthn implementation
Summary: Implemented comprehensive 3-phase multi-factor authentication: (1) **TOTP MFA** — enrollment, verification, challenge-verify, status, and unenroll API routes using Supabase Auth built-in MFA; `TOTPSetup.tsx` settings UI with QR code and manual secret; `MFAChallenge.tsx` login component; modified `loginAction` to detect enrolled factors and return challenge state; modified `LoginClient.tsx` to render MFA challenge when `aal2` is required. (2) **SMS MFA** — enrollment and verification API routes via Supabase phone factor; `SMSSetup.tsx` settings UI with E.164 phone input and resend cooldown; MFA challenge supports factor switching between TOTP and SMS. (3) **WebAuthn/Passkeys** — created `webauthn_credentials`, `webauthn_challenges`, and `backup_codes` DB tables with RLS; WebAuthn register + authenticate API routes storing credentials in DB (not `user_metadata`); credentials management API (list + delete); `PasskeyManager.tsx` supporting up to 10 passkeys per user; backwards-compatible with legacy `user_metadata` credentials. Created `lib/security/mfa.ts` (rate limiters, validators, types, helpers) and `lib/security/webauthn.ts` (challenge storage, credential CRUD, RP config). Added 12 API route constants. Updated `SecuritySettings.tsx` to include TOTP, SMS, Passkey, and BiometricToggle sections. Added 29 new tests across 3 test files.
Files: Created 23 files (see CHANGELOG.md). Modified: `LoginClient.tsx`, `actions.ts`, `SecuritySettings.tsx`, `config.ts`, `authenticate/verify/route.ts`.
Verification: `npm run check` ✅ (secrets, format, typecheck, lint, 396/396 tests, build all pass).
Follow-ups: (1) Enable MFA in Supabase Dashboard (Authentication > MFA). (2) Configure SMS provider (Twilio/MessageBird) for Phase 2. (3) Set `NEXT_PUBLIC_WEBAUTHN_RP_ID` and `NEXT_PUBLIC_WEBAUTHN_ORIGIN` env vars for production. (4) Run `supabase db push` or `supabase migration up` to apply the WebAuthn migration.

Raouf: 2026-02-08 (Australia/Sydney)
Scope: Map tile sharpness, responsive layout, touch isolation
Summary: (1) **Fixed blurry map image** — added `image-rendering: crisp-edges` / `-webkit-optimize-contrast` to `.leaflet-image-layer` and `.leaflet-overlay-pane img` so the 4678×3307 campus raster isn't bilinear-smoothed by CSS scaling. Set `zoomSnap: 0.5` and `zoomDelta: 0.5` on MapContainer so zoom levels snap to half-integer steps (reduces fractional-zoom blur). Raised `maxZoom` from 2→3 so users can inspect detail at near-native pixel density. Enabled `scrollWheelZoom` (was `false`) plus explicit `touchZoom` and `dragging` for proper desktop and mobile interaction. (2) **Responsive map container** — replaced fixed `md:h-[500px] lg:h-[600px]` with `md:h-[clamp(420px,55vh,600px)] lg:h-[clamp(500px,60vh,720px)]` so the map scales with viewport. Added `landscape:h-[60svh] landscape:min-h-[280px]` for mobile landscape support. Updated page-level skeleton to match. (3) **Touch isolation** — added `touch-action: none` to `.leaflet-container` to prevent page scrolling while panning/pinching the map. Added focus outline for keyboard accessibility. (4) Applied Prettier formatting to leaflet.css. (5) `npm run check` all passed.
Files: `app/styles/leaflet.css`, `app/map/CampusMap.tsx`, `app/map/MapClient.tsx`, `app/map/page.tsx`.
Verification: `npm run check` ✅ (secrets, format, typecheck, lint, 367/367 tests, build all pass).
Follow-ups: (1) Consider generating a 2× (9356×6614) campus raster for true retina sharpness. (2) Consider adding Leaflet.GestureHandling plugin for "Use ⌘+scroll to zoom" UX on embedded maps.

Raouf: 2026-02-08 (Australia/Sydney)
Scope: Dev tools removal, HUD badge removal, dark-mode search input fix
Summary: (1) Removed the dev-mode map developer tools button (`DebugControls` component), its file, the `useMapSimulation` hook, and the `handleSimulate` callback from `CampusMap.tsx`. Cleaned up barrel export from `app/map/hooks/index.ts` and removed `openMapDeveloperTools`/`closeMapDeveloperTools` i18n keys from all 19 locale files. (2) Removed the buildings-count `<Badge variant="secondary">` from the HUD Places header. (3) Fixed dark-mode search card: changed search input background from `bg-mq-card-background` (same as card = invisible) to `bg-mq-input-background` (#151515 in dark mode for proper contrast), and replaced undefined `var(--mq-primary-alpha-5)` inline animation color with `color-mix(in srgb, var(--mq-primary) 10%, transparent)` for correct selected-item background in both themes. (4) Applied Prettier to 5 unformatted files. (5) `npm run check` all passed.
Files: `app/map/CampusMap.tsx`, `app/map/CampusMapHUD.tsx`, `app/map/hooks/index.ts`, `locales/*/translations.json`, `app/calendar/CalendarClient.tsx`, `components/calendar/DayView.tsx`, `components/exams/ExamForm.tsx`. Deleted: `app/map/components/DebugControls.tsx`, `app/map/hooks/useMapSimulation.ts`.
Verification: `npm run check` ✅ (secrets, format, typecheck, lint, 367/367 tests, build all pass).
Follow-ups: None.

Raouf: 2026-02-07 (Australia/Sydney)
Scope: Selected-pin indicator, dark-mode search polish, zoom controls
Summary: (1) Added a dedicated selected-building location indicator (animated pulse ring) rendered on top of the selected building pin so selection is immediately visible after choosing from the buildings list. (2) Improved map search quality by filtering against normalized translated building names plus id/name/tags/address fields, and polished dark-mode search UX with clearer input styling, result-count badge sync, and a clear-search button. (3) Enabled map zoom controls and moved them to bottom-right to avoid overlap with the left HUD panel. (4) Ran full validation with `npm run check` and fixed formatting issue by applying Prettier.
Files: `app/map/CampusMap.tsx`, `app/map/CampusMapHUD.tsx`, `app/map/MapClient.tsx`, `app/styles/leaflet.css`.
Verification: `npm run check` ✅ (format, typecheck, lint, tests, build all pass).
Follow-ups: None.

Raouf: 2026-02-07 (Australia/Sydney)
Scope: Map pin stability + responsive light/dark polish
Summary: (1) Hardened Leaflet marker behavior so selected pins reliably stay on top and hover interactions no longer interfere with map placement (`riseOnHover`, `riseOffset`, `zIndexOffset`). (2) Removed marker hover/active scale transforms from the pin animation class to prevent transform-related marker jitter/position issues. (3) Improved map responsiveness on small screens with `svh`-based map/HUD sizing and better sidebar text truncation. (4) Increased zoom control touch target sizing for mobile in both light and dark themes. (5) Ran full validation via `npm run check` — all stages passed.
Files: `app/map/CampusMap.tsx`, `app/map/CampusMapHUD.tsx`, `app/map/MapClient.tsx`, `app/styles/animations.css`, `app/styles/leaflet.css`.
Verification: `npm run check` ✅ (format, typecheck, lint, tests, build all pass).
Follow-ups: None.

Raouf: 2026-02-07 (Australia/Sydney)
Scope: Map dark/light mode polish, pin rendering fix, responsive improvements
Summary: (1) **Fixed red pins not rendering** — root cause was CSS `animate-marker-drop-in` animation using `transform` with `forwards` fill mode, which overrode Leaflet's inline `transform: translate3d()` positioning. Fixed by removing transform from keyframes (opacity-only animation), removing `forwards` fill mode, and switching hover/active from `transform: scale()` to standalone `scale` property. (2) **Dark/light mode unified** — replaced hardcoded `bg-white`/`hover:bg-gray-50` with `bg-mq-card-background`/`hover:bg-mq-hover-background` on center-on-user button; updated Leaflet popup backgrounds from raw CSS vars (`--c-background`/`--c-charcoal-800`) to `--mq-card-background` token; added popup tip styling and text color; added dark mode zoom control hover state. (3) **Responsive** — limited HUD sidebar max-height to 50% on mobile to prevent it from eating the entire map view. (4) `npm run check` all passed.
Files: `app/styles/animations.css`, `app/map/CampusMap.tsx`, `app/styles/leaflet.css`, `app/map/CampusMapHUD.tsx`.
Verification: `npm run check` ✅ (exit code 0).
Follow-ups: None.

Raouf: 2026-02-07 (Australia/Sydney)
Scope: Map pin alignment fix, navigation audit, API verification
Summary: (1) Fixed building pins misaligned by 110px — building.position[] values lacked the GCP-calibrated X offset. Added `BUILDING_PIXEL_OFFSET_X = 110` constant to buildings.ts and updated `getBuildingCrsCoords()` to apply it. Updated CampusMap.tsx to use `getBuildingCrsCoords` instead of raw `pixelToCrsSimple`. (2) Audited navigation pipeline end-to-end: ORS route fetching, GPS→CRS.Simple coordinate conversion, Kalman smoothing, off-route detection, turn-by-turn instructions — all correct. (3) Verified map API endpoints: `/api/health` ✅, `/api/navigate` correctly requires auth + rate limiting + geofence + ORS proxy. (4) `npm run check` all passed.
Files: `lib/map/buildings.ts`, `app/map/CampusMap.tsx`.
Verification: `npm run check` ✅ (exit code 0), 52/52 map tests passed.
Follow-ups: None.

Raouf: 2026-02-07 (Australia/Sydney)
Scope: Map page cleanup — debug overlay removal, red pin markers, live-location verification
Summary: (1) Removed debug image-failed overlay, MapImageLoadTimeout component, and 4 related state variables from CampusMap.tsx. (2) Added red pin markers for ALL buildings (not just selected) using getMarkerIcon with popups showing name/category/grid/address. (3) Verified live-location logic in useMapLocation.ts — Kalman smoothing, campus bounds, GPS→CRS.Simple transform, and NavigationStateManager feeding are all correct. (4) Ran npm run check — all passed (secrets, formatting, typecheck, lint, tests, build).
Files: `app/map/CampusMap.tsx`.
Verification: `npm run check` ✅ (exit code 0).
Follow-ups: None.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Check pipeline formatting fix
Summary: Ran Prettier on `PublicFeedClient.tsx` to resolve `format:check` failure in the `npm run check` pipeline.
Files: `components/feed/PublicFeedClient.tsx`.
Verification: Pending full `npm run check` rerun.
Follow-ups: None.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Lint warning cleanup
Summary: Removed remaining lint warnings by converting memoized function expressions to arrow callbacks and replacing debug `console.log` usage with `console.warn` in units store.
Files: `components/feed/PublicEventCard.tsx`, `components/feed/QuickStats.tsx`, `lib/store/unitsStore.ts`.
Verification: Pending full `npm run check` rerun.
Follow-ups: None.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: PublicEventCard syntax fix
Summary: Fixed arrow-function syntax in `PublicEventCard` memo callback after callback-style refactor.
Files: `components/feed/PublicEventCard.tsx`.
Verification: Pending full `npm run check` rerun.
Follow-ups: None.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: PublicEventCard formatting
Summary: Applied Prettier formatting to `PublicEventCard.tsx` to satisfy `format:check`.
Files: `components/feed/PublicEventCard.tsx`.
Verification: Pending full `npm run check` rerun.
Follow-ups: None.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Memo component display names
Summary: Added explicit `displayName` properties for memoized arrow components to satisfy `react/display-name` lint rules.
Files: `components/feed/PublicEventCard.tsx`, `components/feed/QuickStats.tsx`.
Verification: Pending full `npm run check` rerun.
Follow-ups: None.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Repo-wide i18n audit and parity fix
Summary: Completed full locale parity against English, added missing translation coverage across all locales, fixed placeholder mismatches, and replaced hardcoded public-feed/map aria strings with translation keys.
Files: `components/feed/PublicFeedClient.tsx`, `app/map/MapClient.tsx`, `app/map/components/DebugControls.tsx`, `locales/*/translations.json`.
Verification: Locale parity script reports zero missing/empty/placeholder-mismatch keys for all locales vs English.
Follow-ups: Run full lint/typecheck after broader workspace formatting changes settle.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Public feed i18n callback polish
Summary: Corrected callback indentation in add-to-calendar success branch to keep control flow readable and consistent.
Files: `components/feed/PublicFeedClient.tsx`.
Verification: `npm run typecheck` ✅.
Follow-ups: None.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Position editor title attributes i18n
Summary: Replaced remaining hardcoded `title` attributes in position editor controls with translation keys and propagated translations across all locales.
Files: `app/map/position-editor/PositionEditorClient.tsx`, `locales/*/translations.json`.
Verification: `npm run check:i18n` ✅; `npm run typecheck` ✅.
Follow-ups: Remaining literal placeholder is numeric-only (`"12345678"`), not user-facing copy.

## Project Context

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS + shadcn/ui components
- Supabase for backend
- Leaflet for maps
- Zustand for state management

## Code Style

- Use TypeScript strict mode
- Follow existing component patterns
- Use `@/lib/` aliases for imports
- Prefer named exports over default exports
- Use translation keys from `@/lib/i18n/translations`

## File Organization

- Components: `components/` with subdirectories by feature
- Hooks: `lib/hooks/`
- Utilities: `lib/utils/`
- Map logic: `lib/map/`
- Security: `lib/security/`

## Testing

- Run `npm run check` before committing (tests + typecheck + lint)
- All changes must pass existing tests
- Add tests for new features in `tests/` directory

## Performance

- Use React.memo for expensive components
- Lazy load heavy modules (Leaflet, charts)
- Use `requestIdleCallback` for non-critical work
- Preload critical assets with `ReactDOM.preload`

## Security

- Follow CSP guidelines in `lib/security/csp.ts`
- Never expose secrets in client code
- Use hash-based inline script validation
- Update CSP hashes when modifying inline scripts

## Accessibility

- WCAG 2.1 AA compliance required
- Use proper ARIA attributes
- Support keyboard navigation
- Respect `prefers-reduced-motion`
- Test with screen readers

## Change Logging

- Use the Raouf change protocol
- Update CHANGELOG.md with every change
- Include: date (Australia/Sydney), scope, summary, files, verification

## Git Workflow

- Do NOT commit unless explicitly asked
- Check `git status` and `git diff` before committing
- Follow conventional commit messages
- Never use force push to main

## Map Module Specifics

- Use CRS.Simple for pixel-based campus map
- Building positions are in image pixels [x, y] where y=0 is TOP
- Convert to CRS.Simple using `pixelToCrsSimple(x, y)` which inverts Y
- Keep coordinate transformations in `lib/map/buildings.ts`
- Map constants in `lib/map/constants.ts` must stay in sync with image dimensions

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Map Audit - Verification Pass
Summary: Completed verification for the map audit fixes. Typecheck, lint, map test suite, and production build (webpack mode) all pass.
Files: `app/map/*`, `app/layout.tsx`, `app/mq-tokens.css`, `locales/en/translations.json`, `tests/map/useMapNavigation.test.ts`.
Verification: `npm run typecheck` ✅; `npm run lint` ✅ (only pre-existing non-map warnings remain); `npx vitest run tests/map` ✅ (52/52); `npx next build --webpack` ✅.
Follow-ups: Turbopack `next build` in this environment remained non-diagnostic/stalled, so webpack build was used as the release-safety signal.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: i18n - Remove Duplicate Translation Key
Summary: Removed duplicate `buildingsFound` entry from English locale to keep translation keys single-source and deterministic.
Files: `locales/en/translations.json`.
Verification: Not run yet (pending full map audit).
Follow-ups: None.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Map Overlays - Lint-Safe Cleanup Refs
Summary: Resolved hook cleanup warnings by capturing overlay ref maps outside cleanup closures in both overlay lifecycle implementations.
Files: `app/map/components/MapOverlays.tsx`, `app/map/hooks/useMapOverlays.ts`.
Verification: Not run yet (pending full map audit).
Follow-ups: None.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Map Position Editor - Keyboard/Timer Robustness
Summary: Added `R` shortcut support for resetting selected building positions, prevented timer leaks by tracking/clearing copy/save timers, and improved input focus guards for keyboard shortcuts.
Files: `app/map/position-editor/PositionEditorClient.tsx`.
Verification: Not run yet (pending full map audit).
Follow-ups: None.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Map Hooks - Overlay Lifecycle Stability
Summary: Fixed overlay lifecycle churn by avoiding full teardown on every dependency change and restricting full cleanup to readiness changes/unmount.
Files: `app/map/components/MapOverlays.tsx`, `app/map/hooks/useMapOverlays.ts`.
Verification: Not run yet (pending full map audit).
Follow-ups: None.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Map Simulation + Debug Controls - Runtime Leaks
Summary: Fixed simulation state tracking to use React state (not stale refs) and corrected requestAnimationFrame cleanup in debug FPS monitor to prevent animation-frame leaks.
Files: `app/map/hooks/useMapSimulation.ts`, `app/map/components/DebugControls.tsx`.
Verification: Not run yet (pending full map audit).
Follow-ups: None.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Build - Remove Google Fonts Build Fetch
Summary: Removed `next/font/google` usage (build-time network dependency) and defined the required `--font-*` variables via MQ tokens so builds succeed in offline/locked-down environments.
Files: `app/layout.tsx`, `app/mq-tokens.css`.
Verification: Not run yet (pending full repo check).
Follow-ups: Optionally self-host Work Sans / Source Serif Pro under `public/fonts/` and switch to `next/font/local` for full offline runtime fidelity.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Map Tests - Align Toast Expectations
Summary: Updated `useMapNavigation` unit test to assert the user-facing fallback strings emitted by `safeT`, instead of raw translation keys.
Files: `tests/map/useMapNavigation.test.ts`.
Verification: Not run yet (pending full map audit).
Follow-ups: None.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Map - Hook Dependency Cleanup
Summary: Resolved a `react-hooks/exhaustive-deps` warning by removing unnecessary outer-scope dependencies from the MapController effect dependency list.
Files: `app/map/CampusMap.tsx`.
Verification: Not run yet (pending full map audit).
Follow-ups: None.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Map Client - i18n Pan/Zoom Hint
Summary: Replaced hard-coded pan/zoom hint copy with `mapPanZoomHint` translation key.
Files: `app/map/MapClient.tsx`, `locales/en/translations.json`.
Verification: Not run yet (pending full map audit).
Follow-ups: None.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Map - i18n Navigation Announcements
Summary: Localized navigation progress and arrival announcements (and the in-map “Next” label) using translation keys instead of hard-coded English.
Files: `app/map/CampusMap.tsx`, `locales/en/translations.json`.
Verification: Not run yet (pending full map audit).
Follow-ups: Consider adding these keys to other locale files to avoid English fallback.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Map - i18n Loading Fallback
Summary: Removed hard-coded “Loading Map...” fallback copy and reused existing `loadingMap` translation key.
Files: `app/map/CampusMap.tsx`.
Verification: Not run yet (pending full map audit).
Follow-ups: None.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Map Skeleton - i18n Loading Copy
Summary: Removed hard-coded loading strings in the map skeleton components and reused existing translation keys for visible and screen-reader text.
Files: `app/map/MapSkeleton.tsx`.
Verification: Not run yet (pending full map audit).
Follow-ups: None.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Map Navigation - Safe Toast Copy
Summary: Prevented user-facing toasts from showing raw translation keys by switching `useMapNavigation` to `useSafeTranslation` and `safeT` fallbacks.
Files: `app/map/hooks/useMapNavigation.ts`.
Verification: Not run yet (pending full map audit).
Follow-ups: Consider adding missing navigation toast keys to locale files.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Map Client - Reduced Motion Respect
Summary: Disabled non-essential overlay toggle animations (hover/tap/ripple/icon wiggle) when `prefers-reduced-motion` is enabled.
Files: `app/map/MapClient.tsx`.
Verification: Not run yet (pending full map audit).
Follow-ups: None.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Map - A11y Container Role
Summary: Replaced `role=\"application\"` with `role=\"region\"` on the campus map container to avoid screen reader mode hijacking and reduce accessibility audit flags.
Files: `app/map/CampusMap.tsx`.
Verification: Not run yet (pending full map audit).
Follow-ups: None.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Map - Cleanup Marker Popup Delay
Summary: Prevented stale timers by adding cleanup for delayed marker popup opening after `flyTo`, avoiding incorrect popups during rapid building selection changes.
Files: `app/map/CampusMap.tsx`.
Verification: Not run yet (pending full map audit).
Follow-ups: None.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Map Client - Safe Preload Side Effect
Summary: Moved `ReactDOM.preload(CAMPUS_IMAGE_URL)` into a one-time `useEffect` to avoid render-time side effects and repeated preload calls.
Files: `app/map/MapClient.tsx`.
Verification: Not run yet (pending full map audit).
Follow-ups: None.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Map HUD - i18n Search Result Announcement
Summary: Localized the screen-reader search result count announcement (removed hard-coded English) using new `buildingsFound` translation key with `{{count}}` interpolation.
Files: `app/map/CampusMapHUD.tsx`, `locales/en/translations.json`.
Verification: Not run yet (pending full map audit).
Follow-ups: Consider adding `buildingsFound` to non-English locale files to avoid English fallback.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Map HUD - Preserve Overlay Query Param
Summary: Preserved the active `layers` query param when selecting/deselecting buildings so overlay state remains shareable and stable across Map HUD navigation.
Files: `app/map/CampusMapHUD.tsx`.
Verification: Not run yet (pending full map audit).
Follow-ups: None.

Raouf: 2026-02-06 (Australia/Sydney)
Scope: Map - Navigation Live Updates + i18n Cleanup
Summary: Fixed live navigation state not updating by ensuring geolocation feeds NavigationStateManager when navigation is active; removed the `@ts-expect-error` translation hack in `useMapLocation` by switching to `useSafeTranslation`.
Files: `app/map/hooks/useMapLocation.ts`.
Verification: Not run yet (pending full map audit).
Follow-ups: Add a unit test covering geolocation -> nav manager update wiring.

Raouf: 2026-02-02 (Australia/Sydney)
Scope: Map - Audit Fixes (Navigation, UX, Cleanup)
Summary: Fixed navigation instructions and ORS coordinate handling, aligned geofence bounds, improved overlay panel accessibility, enabled export, adjusted search behavior and hint text, reduced debug noise, and removed unused map controller variants.
Files: `lib/services/ors.ts`, `app/map/hooks/useMapNavigation.ts`, `app/api/navigate/route.ts`, `app/map/MapClient.tsx`, `app/map/CampusMapHUD.tsx`, `app/map/CampusMap.tsx`, `app/map/hooks/index.ts`, deleted `app/map/components/MapCore.tsx`, `app/map/components/MapController.tsx`, `app/map/hooks/useMapController.ts`.
Verification: Not run (not requested).
Follow-ups: None.

Raouf: 2026-02-02 (Australia/Sydney)
Scope: Map - Campus Image Load Reliability
Summary: Reworked campus image overlay to use React-Leaflet `ImageOverlay` for more reliable loading and built-in lifecycle handling.
Files: `app/map/CampusMap.tsx`.
Verification: Not run (not requested).
Follow-ups: None.

Raouf: 2026-02-02 (Australia/Sydney)
Scope: Map - Image Load Diagnostics
Summary: Added readiness fallback and image-load failure overlay to help diagnose blank map screens.
Files: `app/map/CampusMap.tsx`, `app/map/MapClient.tsx`.
Verification: Not run (not requested).
Follow-ups: Confirm whether image overlay now renders in affected environment.

Raouf: 2026-02-02 (Australia/Sydney)
Scope: Map - Cache Busting for Campus Image
Summary: Versioned campus map image URL to bypass stale caches and aligned position editor with shared map constant.
Files: `lib/map/constants.ts`, `app/map/position-editor/PositionEditorClient.tsx`, `public/sw.js`.
Verification: Not run (not requested).
Follow-ups: Validate image loads in affected environment.

Raouf: 2026-02-02 (Australia/Sydney)
Scope: Map - Image Load Timeout Diagnostics
Summary: Added a timeout fallback to surface when the base map image never fires a load/error event.
Files: `app/map/CampusMap.tsx`.
Verification: Not run (not requested).
Follow-ups: Confirm if timeout overlay appears in affected environment.

Raouf: 2026-02-02 (Australia/Sydney)
Scope: Map - Image Fetch Diagnostic + Blob Fallback
Summary: Added a no-store fetch for campus image and fallback to blob URL when load failures occur; surfaced HTTP status in diagnostics.
Files: `app/map/CampusMap.tsx`.
Verification: Not run (not requested).
Follow-ups: Check diagnostic for HTTP status to pinpoint root cause.

Raouf: 2026-02-02 (Australia/Sydney)
Scope: Map - Image Diagnostics (Content-Type + Preview)
Summary: Added content-type/size diagnostics and an inline image preview to determine if Leaflet or the asset pipeline is failing.
Files: `app/map/CampusMap.tsx`.
Verification: Not run (not requested).
Follow-ups: Verify whether the debug preview renders.

Raouf: 2026-02-02 (Australia/Sydney)
Scope: Map - Image Overlay Mount Fix
Summary: Ensured Leaflet `ImageOverlay` only renders after blob URL is ready and remounts on URL change.
Files: `app/map/CampusMap.tsx`.
Verification: Not run (not requested).
Follow-ups: Confirm campus image renders on map.

Raouf: 2026-02-02 (Australia/Sydney)
Scope: Map - Initial Zoom Fit
Summary: Fit campus image bounds to the viewport on initial load to prevent a tiny overlay.
Files: `app/map/CampusMap.tsx`.
Verification: Not run (not requested).
Follow-ups: Confirm map fills the container on first render.

Raouf: 2026-02-07 (Australia/Sydney)
Scope: Map Page Full Audit + Supabase Connectivity Verification
Summary: Completed file-by-file audit of every map page file (17 files across app/map/, app/map/components/, app/map/hooks/, app/map/position-editor/, lib/store/mapStore.ts, lib/map/constants.ts, app/api/navigate/route.ts). All files pass TypeScript strict-mode typecheck (0 errors), ESLint (0 errors), and all 52 map tests pass. Linked Supabase CLI to project ref `cxsqlgvbwtevkkljzolg`, verified REST API (PostgREST v14.1), Auth endpoint, and Storage endpoint all respond correctly. Queried `public_events` table successfully — data flows end-to-end. Migration list shows expected local/remote drift but no blockers. No code changes required — map module is in a clean, healthy state.
Files: No files modified (audit-only).
Verification: `npm run typecheck` ✅ (0 errors); `npx eslint app/map/` ✅ (0 errors); `npx vitest run tests/map` ✅ (52/52 passed); Supabase REST API ✅; Supabase Auth ✅; Supabase Storage ✅; `supabase migration list` ✅.
Follow-ups: (1) Some local migrations exist only remotely and vice versa — run `supabase db push` when ready to sync. (2) Docker Desktop required for `supabase db dump`/`supabase status` locally. (3) Storage buckets are empty — no map assets stored in Supabase Storage (map raster served from `/public/maps/`).
