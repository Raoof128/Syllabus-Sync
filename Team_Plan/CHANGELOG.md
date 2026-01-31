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
Scope: QA - Auth Logs & Image Fixes
Summary: Resolved console errors and warnings to ensure a clean developer experience.
- **QA/Fix:** Suppressed "Refresh Token Not Found" errors in `lib/supabase/middleware.ts` to prevent server log spam (handled silently as expected for expired sessions).
- **QA/Fix:** Fixed `next/image` aspect ratio warning in `Sidebar.tsx` by enforcing `width: auto` style on resized logo.
- **Verification:** `npm run check` passed successfully (0 errors).
Files: lib/supabase/middleware.ts; components/layout/Sidebar.tsx.
Follow-ups: None.

---

Raouf: 2026-01-31 (Australia/Sydney)
Scope: Home - Solid Surface Polish & Gamification QA
Summary: Final polish of Home route to ensure 100% Solid Surface compliance and resolved all QA findings.
- **UI/UX:** Replaced remaining `glass` variant in `QuickActions` with `secondary` solid style.
- **QA/Fix:** Fixed `GamificationStats` test failures by adding `data-testid` and fixing missing translation keys (`streakTooltip`, `streakDay`, etc.).
- **Verification:** `npm run check` passed successfully (0 errors).
Files: components/home/QuickActions.tsx; components/gamification/GamificationStats.tsx; locales/en/translations.json.
Follow-ups: None.

---

Raouf: 2026-01-30 (Australia/Sydney)
Scope: UI - Solid Surface Migration & QA
Summary: Migrated core layout to Solid Surface design and resolved linting/formatting issues.
- **UI/UX:** Removed all Liquid Glass effects from `Sidebar`, `Header`, and global `layout.tsx`.
- **UI/UX:** Implemented `CardSolid` and `CardMuted` variants across the Home route.
- **UI/UX:** Improved `WeekHeatStrip` with staggered animations and reduced-motion support.
- **QA/Fix:** Fixed `@vite/client` 404 errors in proxy.
- **QA/Fix:** Resolved linting warnings and verified build stability with `npm run check`.
- **Verification:** `npm run check` passed successfully.
Files: components/layout/Sidebar.tsx; components/layout/Header.tsx; app/layout.tsx; app/home/HomeClient.tsx; components/home/WeekHeatStrip.tsx; lib/proxy.ts; app/calendar/CalendarClient.tsx.
Follow-ups: None.

---

Raouf: 2026-01-30 (Australia/Sydney)
Scope: Home - Heat-Strip Accessibility Polish
Summary: Improved Week Heat-Strip accessibility and screen reader support.
- **UX/Accessibility:** Added descriptive `aria-label` metadata to each Heat-Strip day link so assistive technologies announce the full date and class/deadline counts instead of a single-letter label.
- **Verification:** `npm run check` (pass; tests, typecheck, build).
Files: components/home/WeekHeatStrip.tsx.
Follow-ups: None.

---

Raouf: 2026-01-30 (Australia/Sydney)
Scope: Home - Lint & QA Hardening
Summary: Cleaned up codebase for production.
- **QA:** Removed unused imports and variables in `HomeClient.tsx`, `loading.tsx`, `EventsFeed.tsx`, `WeekHeatStrip.tsx`, and `UnitCard.tsx`.
- **Verification:** `npm run check` passed with 0 warnings.
Files: app/home/HomeClient.tsx; app/home/loading.tsx; components/home/EventsFeed.tsx; components/home/WeekHeatStrip.tsx; components/units/UnitCard.tsx.
Follow-ups: None.

---

Raouf: 2026-01-30 (Australia/Sydney)
Scope: Home - Performance, Accessibility, & QA (Phases 5-9)
Summary: Hardened Home route for production.
- **Performance:** Updated `loading.tsx` skeleton to perfectly match final layout (Header -> KPI -> Heat-Strip -> Grid) to minimize CLS. Verified memoization and hydration stability.
- **Accessibility:** Added `focus-visible` rings to interactive elements (Heat-Strip days).
- **Correctness:** Verified removal of page-level Suspense in favor of route-level loading.
Files: app/home/loading.tsx; app/home/page.tsx; components/home/WeekHeatStrip.tsx.
Verification: Passed `npm run check`. Visual verification of skeleton and focus states.
Follow-ups: None.

---
