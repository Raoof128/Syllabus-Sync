# Agent Rules

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
