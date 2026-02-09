# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Raouf: Map Zoom Shake Fix + Extended Zoom Out — 2026-02-10

**Scope:** Fix map shaking on zoom + allow more zoom out
**Type:** Bug fix / UX improvement

#### Issues Fixed

1. **Map shaking/jitter on zoom** (`leaflet.css`) — Three CSS rules fought Leaflet's internal JS-driven zoom animation:
   - `.leaflet-zoom-animated { transition: transform 0.25s ... }` — CSS transition competed with Leaflet's programmatic transform updates, causing the image to oscillate.
   - `.leaflet-image-layer { transform: translateZ(0); will-change: opacity, transform }` — Forced a compositor layer with a competing static transform.
   - `.leaflet-overlay-pane { transform: translateZ(0); will-change: transform }` — Same issue on the overlay pane.
   All three removed. Leaflet manages its own transforms; CSS must not override them.

2. **Zoom-out too restrictive** (`MapController.tsx`) — `map.setMinZoom(map.getZoom())` after `fitBounds` locked the minimum zoom to the exact fitted level, preventing any zoom out. Changed to `map.getZoom() - 1.5` to allow 1.5 zoom levels below the fitted campus view.

3. **Edge rubber-banding** (`CampusMap.tsx`) — `maxBoundsViscosity={0.5}` caused an elastic bounce when panning near map edges, contributing to the shaking feel. Changed to `1.0` (hard stop, no bounce).

#### Files Changed

- `app/styles/leaflet.css` — Removed `transition`, `transform: translateZ(0)`, and `will-change` from `.leaflet-zoom-animated`, `.leaflet-image-layer`, and `.leaflet-overlay-pane`
- `app/map/components/MapController.tsx` — `setMinZoom(getZoom() - 1.5)` instead of `setMinZoom(getZoom())`
- `app/map/CampusMap.tsx` — `maxBoundsViscosity={1.0}` instead of `0.5`

#### Verification

- `npm run check` ✅ (secrets, format, typecheck, lint, 423/423 tests, build)

---

### Raouf: Map Layer Crash Fix — 2026-02-10

**Scope:** Fix crash when toggling map overlay layers
**Type:** Bug fix

#### Bugs Fixed

1. **URL↔store infinite loop** (`MapClient.tsx`) — Effect 1 (URL→store sync) included `activeOverlays` in its dependency array. When user toggled an overlay OFF, the effect re-fired, saw the stale URL still had the old layer, and re-added it to the store — undoing the toggle. This caused state thrashing / "Maximum update depth exceeded". **Fix:** Removed `activeOverlays` from effect 1 deps. Added a ref-based lock (`syncLockRef`) with `queueMicrotask` release so the two sync effects (URL→store, store→URL) never fight.

2. **Pane remount stale DOM reference** (`MapOverlays.tsx`) — Component returned `null` when no overlays were active, unmounting the `<Pane>`. On re-toggle, `map.createPane('campus-overlays')` returned the old Leaflet reference whose DOM element had been removed by React unmount. ImageOverlay then rendered into a stale/detached DOM node. **Fix:** Pane is now always mounted when `overlaysReady` is true; only the ImageOverlay children are conditional.

#### Files Changed

- `app/map/MapClient.tsx` — Rewrote URL↔store sync with ref lock, removed `activeOverlays` from URL→store effect deps
- `app/map/components/MapOverlays.tsx` — Pane always rendered when ready, removed unused `mapOverlays` import

#### Verification

- `npm run check` ✅ (secrets, format, typecheck, lint, 423/423 tests, build)

---

### Raouf: Map Overlay System Rebuild — 2026-02-10

**Scope:** End-to-end rebuild of map overlay layers
**Type:** Feature rebuild / Infrastructure

#### Changes Applied

1. **PDF→PNG build script** (`scripts/build-overlays.sh`) — Converts source PDFs in `maps/source/` to transparent overlay PNGs at 300 DPI using Poppler (`pdftoppm`) + ImageMagick (`magick`). Removes white background with 12% fuzz. Outputs to `public/maps/overlays/`. Added `npm run build:overlays` script in `package.json`.

2. **Overlay registry** (`lib/map/mapOverlays.ts`) — Complete rewrite. New `MapOverlayConfig` type with `labelKey`/`descKey` (i18n), `type: 'image'`, `url` (versioned), `bounds` (PIXEL_BOUNDS), `opacity`, `zIndex`, `color`. `MAP_OVERLAY_IDS` const array for canonical ordering. `mapOverlayById` Map for O(1) lookup. `normaliseOverlayIds()` — filters invalid, dedupes, orders by registry. 4 overlays: parking, drinking_water, accessibility, special_permits.

3. **State store** (`lib/store/mapStore.ts`) — `setOverlays()` and `toggleOverlay()` now normalise through `normaliseOverlayIds()`. Store version bumped 1→2 with migration that re-normalises to drop stale IDs (exam, walk, water, permits). `overlaysToURLParam()` outputs stable registry-ordered strings.

4. **Declarative rendering** (`app/map/components/MapOverlays.tsx`) — Complete rewrite from imperative Leaflet `addLayer/removeLayer` to declarative react-leaflet `<Pane>` + `<ImageOverlay>`. Pane has `pointer-events: none`. No async preloading, no refs, no race conditions. 47 lines total.

5. **ReactLeafletModule** — Added `Pane` to `ReactLeafletModule` interface (`useLeafletLoader.ts`) and `ReactLeafletComponents` (`leafletTypes.ts`). `Pane` loaded dynamically alongside other react-leaflet components.

6. **MapClient.tsx** — Updated `OVERLAY_ICONS` (4 entries, removed exam/walk). Overlay toggles now use `overlay.labelKey`/`descKey` instead of `as TranslationKey` casting. Removed `alignsWithBaseMap` warning badge. Removed unused `TranslationKey` import. Updated image prefetch to use `overlay.url`.

7. **CampusMap.tsx** — `MapOverlays` now receives `reactLeafletModule` prop instead of `mapInstance`/`leafletModule`.

8. **i18n** — Renamed overlay keys: `overlay_water_*` → `overlay_drinking_water_*`, `overlay_permits_*` → `overlay_special_permits_*`. Removed `overlay_exam_*` and `overlay_walk_*` keys. Updated all 19 locale files.

9. **Tests** (`tests/map/mapOverlays.test.ts`) — 12 new tests: registry integrity, normalisation (empty, invalid, duplicates, ordering, all valid), URL parsing (empty, valid, invalid), URL param generation (ordering, empty).

10. **Documentation** (`docs/map-overlays.md`) — How overlays are generated, where PNGs live, how to add a new overlay, architecture table, URL sync description, gotchas, QA checklist.

#### Files Changed

- `scripts/build-overlays.sh` — **new** PDF→PNG conversion script
- `package.json` — added `build:overlays` script
- `lib/map/mapOverlays.ts` — complete rewrite (4 overlays, new types)
- `lib/store/mapStore.ts` — normalised setOverlays, store v2 migration
- `app/map/components/MapOverlays.tsx` — declarative rewrite
- `app/map/MapClient.tsx` — updated icons, toggle UI, prefetch
- `app/map/CampusMap.tsx` — updated MapOverlays props
- `lib/hooks/useLeafletLoader.ts` — added Pane
- `lib/map/leafletTypes.ts` — added Pane
- `locales/*/translations.json` (×19) — updated overlay keys
- `tests/map/mapOverlays.test.ts` — **new** 12 tests
- `docs/map-overlays.md` — **new** documentation
- `public/maps/overlays/` — 4 new overlay PNGs generated

#### Verification

- `npm run check` ✅ (secrets, format, typecheck, lint, 423/423 tests, build)
- `npm run build:overlays` ✅ (all 4 PNGs generated)

---

### Raouf: Map Page Architectural Follow-ups — 4 Refactors — 2026-02-10

**Scope:** Completing all deferred architectural follow-ups from map page audits
**Type:** Refactor / i18n / Code quality

#### Changes Applied

1. **i18n `BUILDING_CATEGORY_LABELS`** (`buildings.ts`) — changed from hardcoded English strings (`Record<BuildingCategory, string>`) to translation keys (`Record<BuildingCategory, TranslationKey>`). Updated `CampusMap.tsx` to pass labels through `t()`. Maps: academic→categoryTeaching, services→categoryServices, health→categoryHealth, food→categoryFood, sports→categorySports, venue→categoryVenues, research→categoryResearch, residential→categoryHousing, other→categoryOther.

2. **Refactored `MotionLink = m.create(Link)`** (`CampusMapHUD.tsx`) — removed fragile `m.create(Link)` wrapper that could break across Next.js/framer-motion upgrades. Replaced with `m.div` wrapper + standard `Link` child, preserving all animation behavior (variants, whileHover, whileTap, animate).

3. **Extracted `MapController` from `useMemo`** (`CampusMap.tsx` → `components/MapController.tsx`) — moved the component defined inside `useMemo` to a standalone module-level component. Receives `reactLeafletModule` and `leafletModule` as props. Contains its own `isMapReady` check. Removed unused `useReducedMotion` import from CampusMap. Fixed exposed lint error (`setOverlaysReady` in effect body) by deriving `mapValid` outside the effect.

4. **i18n hardcoded strings in `MapErrorBoundary`** — added `translations` prop to the class component with fallback defaults. Created `TranslatedMapErrorBoundary` functional wrapper that calls `useSafeTranslation()` and passes translations down. Updated `MapClient.tsx` and `withMapErrorBoundary` HOC to use the translated wrapper. Added 5 new translation keys to all 19 locale files: `mapFailedToLoad`, `mapLoadErrorDescription`, `technicalDetails`, `reloadPage`, `mapErrorPersistHelp`.

#### Files Changed

- `lib/map/buildings.ts` — `BUILDING_CATEGORY_LABELS` values changed to `TranslationKey`
- `app/map/CampusMap.tsx` — `t(BUILDING_CATEGORY_LABELS[…])`, removed inline MapController, removed `useReducedMotion` import, fixed overlays ready lint error
- `app/map/CampusMapHUD.tsx` — removed `m.create(Link)`, replaced `MotionLink` with `m.div` + `Link`
- `app/map/components/MapController.tsx` — **new file**, extracted standalone component
- `app/map/MapErrorBoundary.tsx` — added `translations` prop, `TranslatedMapErrorBoundary` wrapper
- `app/map/MapClient.tsx` — import `TranslatedMapErrorBoundary` instead of `MapErrorBoundary`
- `locales/*/translations.json` (×19) — added 5 new keys

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
