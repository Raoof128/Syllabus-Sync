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
