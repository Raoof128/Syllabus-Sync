# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Raouf: 2026-01-28 (Feed Improvements: Phase 1 & 2 Polish)

- **Summary**: Polished the "Feed Improvements Blueprint" by synchronizing card colors with the global design system and unifying card dimensions. Ensured all new translation keys are strictly confined to the English locale.
- **Files Changed**:
  - `components/feed/FeedEventCard.tsx`: Wrapped cards in `MagicCard` with `isLiquidEnhanced` and switched to `bg-mq-card-background`. Added minimum height constraints for text elements to ensure layout uniformity.
  - `locales/en/translations.json`: Verified and consolidated all feed-related keys.
- **Verification**:
  - `npm run check`: Passed (Lint, Types, Format, Build, Tests).
- **Follow-ups**: None.

### Raouf: 2026-01-28 (Feed Improvements: Phase 1 & 2)

- **Summary**: Implemented the "Feed Improvements Blueprint" Phases 1 & 2. Overhauled the feed page with a sticky filter bar, advanced search/sort/filter logic, redesigned event cards with "Campus Style" anatomy, and a modular sticky sidebar.
- **Files Changed**:
  - `app/feed/FeedClient.tsx`: Refactored to coordinate new sub-components and manage complex filter state.
  - `components/feed/FeedFilters.tsx`: Created sticky filter bar with search, sort, and time range.
  - `components/feed/FeedEventCard.tsx`: Created new event card with "Remind me" and map deep-links.
  - `components/feed/FeedSidebar.tsx`: Extracted sidebar logic into a reusable component.
  - `locales/en/translations.json`: Added keys for search, sort, filters, and card actions.
- **Verification**:
  - `npm run check`: Passed (Lint, Types, Format, Build, Tests).
- **Follow-ups**: Phase 3 (Sidebar "Quick actions") and Phase 4 (Reminders polish).

### Raouf: 2026-01-28 (HUD Cleanup & Settings Polish)

- **Summary**: Refined the Map HUD by removing redundant "Today" and status/crowd widgets. Polished the Settings layout by fixing background visibility and removing unused imports.
- **Files Changed**:
  - `app/map/CampusMapHUD.tsx`: Removed "Today" button and status grids.
  - `app/settings/layout.tsx`: Added `MovingMeshBackground` and cleaned up styles.
- **Verification**:
  - `npm run check`: Passed (Lint, Types, Format, Build, Tests).
- **Follow-ups**: None.

### Raouf: 2026-01-28 (Settings Page Modularization)

- **Summary**: Refactored the Settings page into distinct sub-routes for General, Appearance, Security, Experience, and Support. Fixed the "Hero Header" background animation visibility.
- **Files Changed**:
  - `app/settings/layout.tsx`: Created a shared layout with sticky sidebar and hero shell.
  - `app/settings/page.tsx`: Redirects to `/settings/general`.
  - `app/settings/[section]/page.tsx`: Created individual page components for each section.
- **Verification**:
  - `npm run check`: Passed (Lint, Types, Format, Build, Tests).
- **Follow-ups**: None.

### Raouf: 2026-01-28 (Settings UI Overhaul)

- **Summary**: Transformed the Settings page into a modern, 2-column layout with a sticky sidebar, categorized sections, and a hero header shell.
- **Files Changed**:
  - `app/settings/page.tsx`: Implemented `SettingsContent` with responsive grid, scroll spy, and section grouping.
  - `app/settings/components/index.ts`: Verified exports.
- **Verification**:
  - `npm run check`: Passed (Lint, Types, Format, Build, Tests).
- **Follow-ups**: None.

### Raouf: 2026-01-28 (Map HUD & Navigation Polish)

- **Summary**: Refined the Map HUD by adding navigation actions and fixing UI overlaps. Integrated external Google Maps linking and improved in-app navigation triggers.
- **Files Changed**:
  - `app/map/CampusMap.tsx`: Shifted "Center on User" button when building card is visible to prevent overlap. Added `cn` utility.
  - `app/map/CampusMapHUD.tsx`: Added "Navigate on Campus Map" (scroll-to-action) and "Navigate to Google Maps" (external link) buttons.
  - `locales/en/translations.json`: Added `navigateOnCampus` and `navigateToGoogleMaps` keys.
- **Verification**:
  - `npm run check`: Passed (Lint, Types, Format, Build, Tests).
- **Follow-ups**: None.

### Raouf: 2026-01-28 (Map UI Redesign: Sales Territory Style)

- **Summary**: Redesigned Campus Map UI to follow a modern "Sales Territory" HUD style. Replaced separate bottom/top cards with a unified map overlay HUD.
- **Files Changed**:
  - `app/map/MapClient.tsx`: Injected `CampusMapHUD`, removed redundant `Selected Building Banner` and `Campus Buildings Quick Reference` cards.
  - `app/map/CampusMapHUD.tsx`: Created new HUD component with floating sidebar, search, and details card.
  - `locales/en/translations.json`: Added "Share" and "Places" keys.
- **Verification**:
  - `npm run check`: Passed (Lint, Types, Format, Build, Tests).
- **Follow-ups**: None.

### Raouf: 2026-01-28 (Full Codebase Audit & Polish)

- **Summary**: Performed a comprehensive codebase audit, verifying security, testing, and code quality. Resolved lingering lint warnings and purity issues in calendar components. Updated audit report to reflect healthy state.
- **Files Changed**:
  - `app/calendar/CalendarClient.tsx`: Fixed unused variables, boolean attributes, and string templates.
  - `components/calendar/ItemActionButtons.tsx`: Addressed React purity check warning.
  - `audit-report.md`: Updated with latest verification results (Excellent scores).
- **Verification**:
  - `npm run check`: Passed (Lint, Types, Format, Build, Tests).
  - `npm audit`: Passed (0 vulnerabilities).
- **Follow-ups**: None.

### Raouf: 2026-01-27 (React 19 Test Migration & Cleanup)

- **Summary**: Migrated test suite to support React 19 by removing deprecated `react-dom/test-utils` usage. Performed deep codebase cleanup by removing temporary test files and fixing broken imports.
- **Files Changed**:
  - `tests/settings/PrivacySettings.test.tsx`: Migrated to `React.act`.
  - `tests/gamification/LevelUpNotification.test.tsx`: Migrated to `React.act`.
  - `app/login/LoginClient.tsx`: Removed broken reference to deleted `TestWeather` component.
  - `next.config.ts`: Added `openAnalyzer: false` for better CI/CD bundle analysis.
  - `app/test-weather/`, `app/api/test-weather/`: Deleted temporary test files.
- **Verification**:
  - `npm run check`: Passed (Linting, Formatting, Typecheck, Tests, Build).
- **Follow-ups**: None.

### Raouf: 2026-01-27 (Codebase Audit & Cleanup)

- **Summary**: Conducted full codebase audit including linting, type checking, and security scan. Fixed linting errors and cleaned up unused code.
- **Files Changed**:
  - `app/api/deadlines/route.ts`: Removed unused eslint-disable.
  - `app/api/events/route.ts`: Removed unused imports/directives.
  - `app/api/notifications/route.ts`: Removed unused imports/directives.
  - `app/api/todos/route.ts`: Removed unused eslint-disable.
  - `app/calendar/CalendarClient.tsx`: Fixed `set-state-in-effect` lint error.
  - `audit-report.md`: Updated with latest findings.
- **Verification**:
  - `npm run lint`: Passed (0 errors, 0 warnings).
  - `npm run typecheck`: Passed.
  - `npm audit`: Passed (0 vulnerabilities).
- **Follow-ups**: React 19 test migration recommended (see `audit-report.md`).

### Raouf: 2026-01-27 (i18n Audit & Fix)

- **Summary**: Performed repository-wide internationalisation audit. Identified and fixed 18 missing translation keys related to the "To-Do List" feature across all 18 non-English locales.
- **Files Changed**:
  - `locales/*/translations.json` (Updated 18 files with missing keys)
  - `CHANGELOG.md` (Created)
- **Verification**:
  - Ran `npm run check:i18n`: All 19 locales now have 100% key coverage (1458 keys).
  - Manual review of `app/calendar/CalendarClient.tsx` and core layout components confirmed `t()` usage.
- **Follow-ups**: None.
