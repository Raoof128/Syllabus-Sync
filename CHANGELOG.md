# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Raouf: 2026-01-28 (Calendar Upgrade: Foundation & Views)

- **Summary**: Implemented the "Calendar Upgrade Blueprint" Phase 1 and started Phase 2. The Calendar is now structured with a "Sticky Layout" featuring a proper Header, Sidebar with widgets, and Main View Area. Moved widgets to a dedicated component and added support for View Switching (Week/Day/Agenda) and Todos in the sidebar.
- **Files Changed**:
  - `app/calendar/CalendarClient.tsx`: Massive refactor. Implemented new layout, View State, and removed inline widgets.
  - `components/calendar/CalendarHeader.tsx`: Created new component for navigation and view controls.
  - `components/calendar/CalendarSidebar.tsx`: Created new component for sticky sidebar layout.
  - `components/calendar/CalendarWidgets.tsx`: Extracted and updated widgets (Units, Deadlines, Events, Todos) with non-glass styling.
- **Verification**:
  - `npm run check`: Passed (Lint, Types, Format, Build, Tests).
- **Follow-ups**: Implement core "Day" and "Agenda" views, refine "Week" view visuals (reduce grid clutter), and add "Privacy Mode".

### Raouf: 2026-01-29 (Australia/Sydney) - Calendar Views Implementation

- **Summary**: Implemented the "Day" and "Agenda" views for the calendar. Created `DayView` for a detailed hourly schedule and `AgendaView` for a chronological list of items. Refactored `CalendarClient` to use these views and added a `FilterPanel` for toggling visibility of units, deadlines, and events.
- **Files Changed**:
  - `components/calendar/DayView.tsx`: Created detailed day view component.
  - `components/calendar/AgendaView.tsx`: Created agenda list view component.
  - `components/calendar/FilterPanel.tsx`: Created filter panel component.
  - `app/calendar/CalendarClient.tsx`: Integrated new views and filter logic.
  - `lib/calendar-utils.ts`: extracted shared calendar logic.
  - `components/ui/mq/switch.tsx`: Created switch component.
- **Verification**: `npm run build` (pass).
- **Follow-ups**: Address remaining styling polish, drag-and-drop if needed, and further mobile responsiveness optimizations.

### Raouf: 2026-01-28 (Feed Sticky Stacking & Sidebar)

- **Summary**: Implemented "Gen Z" style stacking cards for the feed events and refined the sidebar sticky behavior.
  - **Sidebar**: Updated to use `sticky top-[88px] h-fit` for a cleaner sticky interaction without internal scrolling.
  - **Feed Events**: Wrapped events in `sticky` articles with dynamic `top` offsets to create a stacking deck effect as the user scrolls.
- **Files Changed**:
  - `components/feed/FeedSidebar.tsx`: Simplified sticky structure.
  - `app/feed/FeedClient.tsx`: Implemented sticky stacking card logic.
- **Verification**:
  - `npm run check`: Passed (Lint, Types, Format, Build, Tests).
- **Follow-ups**: None.

### Raouf: 2026-01-28 (Feed Sticky Sidebar Polish)

- **Summary**: Refined Feed Sidebar sticky behavior by removing the internal scrollbar (`overflow-y-auto`) as requested. The sidebar now sticks cleanly to the top (`top-[88px]`) and uses the main page scrollbar. Added `transition-all` for smoother resizing if needed.
- **Files Changed**:
  - `components/feed/FeedSidebar.tsx`: Removed overflow/max-height constraints.
- **Verification**:
  - `npm run check`: Passed (Lint, Types, Format, Build, Tests).
- **Follow-ups**: None.

### Raouf: 2026-01-28 (Feed Sticky Sidebar & Event Keys)

- **Summary**: Fixed the Feed Sidebar sticky behavior by restructuring the layout (removed `items-start` from grid, wrapped sidebar content in a sticky container). Also added missing translation keys for sample events to ensure full i18n coverage.
- **Files Changed**:
  - `app/feed/FeedClient.tsx`: Removed `items-start` from grid container to allow sidebar column to stretch.
  - `components/feed/FeedSidebar.tsx`: Refactored sticky positioning to apply to the inner content container rather than the aside element.
  - `locales/en/translations.json`: Added keys for event titles and descriptions.
- **Verification**:
  - `npm run check`: Passed (Lint, Types, Format, Build, Tests).
- **Follow-ups**: None.

### Raouf: 2026-01-28 (Feed & Settings i18n Audit)

- **Summary**: Conducted a comprehensive audit of hardcoded strings in `app/feed` and `app/settings`. Extracted all user-facing text to `locales/en/translations.json` and refactored components to use `t()`. Also polished the Feed Sidebar sticky behavior and card styling to match the global theme.
- **Files Changed**:
  - `app/settings/layout.tsx`: Replaced hardcoded navigation labels with translation keys.
  - `components/feed/FeedSidebar.tsx`: Enhanced sticky positioning (`top-[88px]`) and updated card styling to `bg-mq-card-background`.
  - `locales/en/translations.json`: Added keys for settings navigation, feed categories, and sample events.
- **Verification**:
  - `npm run check`: Passed (Lint, Types, Format, Build, Tests).
- **Follow-ups**: None.

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

### Raouf: 2026-01-29 (Australia/Sydney) - Calendar Views Polish & FilterPanel

- **Summary**: Refined "Day" and "Agenda" views implementation with consistent deadline coloring and visual improvements. Polished the FilterPanel component layout.
- **Files Changed**:
  - `lib/calendar-utils.ts`: Added `getDeadlineColor` helper to standardize coloring logic.
  - `app/calendar/CalendarClient.tsx`: Updated key logic and integrated standardized coloring.
  - `components/calendar/DayView.tsx`: Implemented `getDeadlineColor` and fixed formatting.
  - `components/calendar/AgendaView.tsx`: Implemented `getDeadlineColor` for agenda items.
  - `components/calendar/FilterPanel.tsx`: Renamed header and removed unused imports.
- **Verification**: `npm run build` (pass).
- **Follow-ups**: None.

### Raouf: 2026-01-29 (Australia/Sydney) - Calendar Sticky Headers

- **Status**: ✅ Complete - Implemented sticky navigation and day headers.
- **Scope**: UX Improvement - Calendar Scroll Behavior.
- **Summary**: Applied `sticky` positioning to the Calendar Header and Week Day Headers within the `WeekView`. Added `backdrop-blur-md` and adjusted `z-index` to ensure headers float above the scrolling time grid. Removed `overflow-hidden` from the main container to correctly support sticky behavior.
- **Files**: `app/calendar/CalendarClient.tsx`.
- **Verification**: `npm run check` (pass).
- **Follow-ups**: None.

### Raouf: 2026-01-29 (Australia/Sydney) - Calendar Viewport Scroll

- **Status**: ✅ Complete - Unbound calendar scroll to viewport.
- **Scope**: UX Improvement - Calendar Scroll Behavior.
- **Summary**: Removed `overflow-auto` and fixed `maxHeight` constraints from the Calendar Grid (both Desktop and Mobile). This allows the calendar to expand fully and use the main window scrollbar, enabling proper sticky header behavior relative to the viewport.
- **Files**: `app/calendar/CalendarClient.tsx`.
- **Verification**: `npm run check` (pass).
- **Follow-ups**: None.

### Raouf: 2026-01-29 (Australia/Sydney) - Todo Fix & Calendar Polish

- **Status**: ✅ Complete - Todo Edit added & Cards Polished.
- **Scope**: UX - Calendar Widgets & View.
- **Summary**:
  - **Todo Edit**: Added "Edit" icon and functionality to the Todo widget.
  - **Card Readability**: Updated Event and Deadline cards in Calendar Grid (Desktop & Mobile) to expand on hover (`hover:h-auto hover:z-50`), allowing full text visibility without truncation issues. Removed aggressive default truncation to improve readability.
- **Files**: `components/calendar/CalendarWidgets.tsx`, `app/calendar/CalendarClient.tsx`.
- **Verification**: `npm run check` (pass).
- **Follow-ups**: None.

### Raouf: 2026-01-29 (Australia/Sydney) - Todo Add & Sidebar Width

- **Status**: ✅ Complete.
- **Scope**: UX - Calendar Todo Widget & Sidebar.
- **Summary**:
  - **Todo Add**: Implemented "Add Task" functionality. Added a "+" button to the Todo widget header, reused the Edit Todo modal for creating new tasks.
  - **Sidebar Width**: Increased Calendar Sidebar width from `w-80` (320px) to `w-96` (384px) to prevent widget content truncation and afford more readability.
- **Files**: `app/calendar/CalendarClient.tsx`, `components/calendar/CalendarWidgets.tsx`, `components/calendar/CalendarSidebar.tsx`.
- **Verification**: `npm run check` (pass).
- **Follow-ups**: None.

### Raouf: 2026-01-29 (Australia/Sydney) - Calendar Scroll & Navigation
- **Status**: ✅ Complete.
- **Scope**: UX - Calendar Interactivity.
- **Summary**:
    - **Navigation Buttons**: Removed desktop "Previous Week / Today / Next Week" buttons per request.
    - **Calendar Grid**: Restored internal scrolling container (`overflow-auto`) with fixed height (`calc(100vh-140px)`) to provide "map-like" 2D scrolling (vertical and horizontal) for the timetable view.
    - **Sticky Headers**: Updated sticky offsets to align with the new scroll container context.
- **Files**: `app/calendar/CalendarClient.tsx`.
- **Verification**: `npm run check` (pass).
- **Follow-ups**: None.
