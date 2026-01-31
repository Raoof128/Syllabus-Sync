# Changelog

All notable changes to **The Syllabus Sync** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

Raouf: 2026-01-31 (Australia/Sydney)
Scope: Map - Tier 1 (Visual Hierarchy & Depth)
Summary: Implemented Tier 1 map improvements (Soft Spatial UI) and resolved build errors.
- **Visual Hierarchy:** Enhanced `LayeredCard` with glassmorphism, multi-layered shadows, and inner lighting for 3D depth.
- **UX:** Grouped map actions (Share, Export) into a floating "LayeredCard" toolbar in `CampusMapHUD.tsx`.
- **Fix:** Resolved `CssSyntaxError` in `dark-mode.css` (missing closing brace).
- **Revert:** Reverted dark mode color refinements in `tokens.css` and `dark-mode.css` as per user request to maintain original color scheme.
Files: app/map/components/LayeredCard.tsx; app/map/CampusMapHUD.tsx; app/styles/tokens.css; app/styles/dark-mode.css.
Follow-ups: None.

Raouf: 2026-01-31 (Australia/Sydney)
Scope: Map - Dark Mode & Link Safety
Summary: Audited map dark-mode implementation and external navigation links.
- **Theming:** Removed hard-coded dark-mode overrides in `dark-mode.css` so MQ dark design tokens in `mq-tokens.css` fully control backgrounds, content colors, and primary accents.
- **Cards/Buttons:** Ensured `.dark .bg-white` and `.dark .bg-blue-600` now simply reuse `--c-card-background`, `--c-border`, and `--c-primary` token values instead of local HSL overrides.
- **Security/UX:** Updated the “Navigate to Google Maps” button for selected buildings to open links with `noopener,noreferrer` and use the `touch-optimized` utility class for better touch ergonomics.
Files: app/styles/dark-mode.css; app/map/CampusMapHUD.tsx.
Follow-ups: None.

Raouf: 2026-01-31 (Australia/Sydney)
Scope: Build - Dark Mode CSS
Summary: Re-validated `dark-mode.css` focus selector closure to prevent Tailwind CssSyntaxError.
Files: app/styles/dark-mode.css.
Follow-ups: None.

Raouf: 2026-01-31 (Australia/Sydney)
Scope: Build - Dark Mode CSS
Summary: Rewrote dark-mode form input and focus selector blocks to normalize brace closure and stabilize Tailwind parsing.
Files: app/styles/dark-mode.css.
Follow-ups: None.

Raouf: 2026-01-31 (Australia/Sydney)
Scope: Build - Dark Mode CSS
Summary: Simplified placeholder selector list in `dark-mode.css` to avoid Tailwind CssSyntaxError while preserving placeholder styling.
Files: app/styles/dark-mode.css.
Follow-ups: None.

---

Raouf: 2026-01-31 (Australia/Sydney)
Scope: Map - Tier 2 (Micro-Interactions) & Tier 3 (Touch/Gesture Polish)
Summary: Implemented advanced map interactions including marker pulse/drop-in animations, route dash animations, overlay toggle feedback, and touch optimizations.
- **Animations:** Added `marker-drop-in` (with hover/active states) and `route-dash` keyframes to `animations.css`.
- **Micro-Interactions:** Implemented ripple effect and bounce animation for overlay toggles in `MapClient.tsx`.
- **Haptics:** Integrated `triggerHaptic` for marker selection, overlay toggling, and building card selection.
- **Touch Polish:** Added `.touch-optimized` utility class for accessible touch targets (48px min).
Files: app/styles/animations.css; app/map/CampusMapHUD.tsx; app/map/MapClient.tsx; app/map/CampusMap.tsx.
Follow-ups: None.

Raouf: 2026-01-31 (Australia/Sydney)
Scope: Build - Dark Mode CSS
Summary: Resolved persistent `CssSyntaxError` by splitting comma-separated focus selectors in `dark-mode.css` into individual rules to stabilize parsing.
Files: app/styles/dark-mode.css.
Follow-ups: None.

Raouf: 2026-01-31 (Australia/Sydney)
Scope: QA - Linting & Console Cleanup
Summary: Fixed lint warnings and suppressed intentional console overrides.
- **Map:** Fixed boolean attribute usage and unused imports in `CampusMap.tsx` and `MapClient.tsx`.
- **Layout:** Suppressed linter warnings for intentional `console.error`/`info` overrides in `client-layout.tsx` (used for filtering Turbopack/DevTools noise).
- **A11y:** Handled keyboard event warning in `BuildingAutocomplete.tsx` (delegated to input).
Files: app/map/CampusMap.tsx; app/map/MapClient.tsx; app/client-layout.tsx; components/ui/BuildingAutocomplete.tsx.
Follow-ups: None.

---

Raouf: 2026-01-31 (Australia/Sydney)
Scope: Documentation - Console Logs Guide
Summary: Added documentation for common console logs and troubleshooting.
- **Docs:** Created `docs/LOGS_EXPLANATION.md` explaining React DevTools, HMR, and Rokt warnings.
- **QA:** Verified no internal "Rokt" references; confirmed warning is from external extension.
- **Verification:** `npm run check` passed.
Files: docs/LOGS_EXPLANATION.md.
Follow-ups: None.

---

Raouf: 2026-01-31 (Australia/Sydney)
Scope: QA - Critical Bug Fixes (Sidebar & Auth)
Summary: Resolved critical UI/functional regressions including Chrome sidebar visibility, API authentication, and console noise.
- **Fix:** Fixed Sidebar visibility in Chrome by increasing z-index of `.sidebar-shell` to 60 (above Header's 50).
- **Fix:** Resolved 401 Unauthorized errors on `api/notifications` by adding `credentials: 'include'` to `apiRequest` and implementing client-side redirect to login on 401 in `notificationsStore`.
- **Fix:** Fixed `next/image` aspect ratio warning in `LoginClient.tsx` and `Sidebar.tsx` by replacing `fill` with explicit dimensions and `w-auto h-auto` classes.
- **Fix:** Suppressed "Download React DevTools" and Chrome extension "Frame removed" errors in `client-layout.tsx`.
- **Verification:** `npm run check` passed successfully.
Files: app/styles/sidebar.css; lib/utils/api.ts; app/login/LoginClient.tsx; components/layout/Sidebar.tsx; lib/store/notificationsStore.ts; app/client-layout.tsx.
Follow-ups: None.

---

Raouf: 2026-01-31 (Australia/Sydney)
Scope: QA - Final Lint Cleanup
Summary: Resolved remaining lint warnings in `client-layout.tsx` and `BuildingAutocomplete.tsx`.
- **Fix:** Refined `no-console` suppresses in `client-layout.tsx` to target only restricted methods.
- **Fix:** Corrected placement of `jsx-a11y` ignores in `BuildingAutocomplete.tsx`.
- **Verification:** `npm run lint` now returns "Lint OK".
Files: app/client-layout.tsx; components/ui/BuildingAutocomplete.tsx.
Follow-ups: None.

---

Raouf: 2026-01-31 (Australia/Sydney)
Scope: Map - Tier 4 (Animations), Tier 5 (Polish), & Tier 6 (Layout)
Summary: Implemented major UX enhancements for the Map module including cinematic transitions, visual system upgrades, and responsive layout improvements.
- **Feature (Tier 4):** Added `flyTo` camera transitions and enhanced `MapSkeleton` with shimmer effects.
- **Feature (Tier 5):** Defined semantic Icon System in `globals.css` and improved `Badge` typography.
- **Feature (Tier 6):** Created responsive HUD with mobile bottom-sheet behavior and elastic drag.
- **Fix:** Resolved missing `AnimatePresence` and added `focus-ring` accessibility styles.
- **Verification:** Verified visually and via `npm run check`.
Files: app/map/CampusMap.tsx; app/map/MapSkeleton.tsx; app/styles/animations.css; app/globals.css; components/ui/mq/badge.tsx; app/map/CampusMapHUD.tsx.
Follow-ups: None.

---

Raouf: 2026-01-31 (Australia/Sydney)
Scope: Performance - Tier 7 Optimizations
Summary: Applied performance and accessibility tweaks to the Map module.
- **Perf:** Implemented marker icon caching in `mapUtils.ts` to reduce object creation.
- **A11y:** Added `prefers-reduced-motion` support to disable camera flying and simplify HUD animations.
- **Perf:** Confirmed use of GPU-accelerated `transform` properties for smooth 60fps animations.
- **Verification:** `npm run check` passed.
Files: lib/map/mapUtils.ts; app/map/CampusMap.tsx; app/map/CampusMapHUD.tsx.
Follow-ups: None.

