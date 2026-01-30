# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Raouf: 2026-01-30 (Australia/Sydney) - Security Enhancements Implementation

- **Summary**: Implemented comprehensive security enhancements across 12 areas including Subresource Integrity (SRI), CSP reporting, database audit logging, API request signing, password breach checking, device fingerprinting, session termination on password change, IP anomaly detection, security headers scanning, password strength indicator, 2FA backup codes, and security.txt file.
- **Files Changed**:
  - `lib/security/sri.ts`: Created SRI utilities for CDN asset integrity verification.
  - `lib/security/csp.ts`: Created Content Security Policy configuration and reporting.
  - `app/api/csp-report/route.ts`: Implemented CSP violation reporting endpoint.
  - `lib/security/audit.ts`: Created audit logging utilities for security events.
  - `app/api/audit/route.ts`: Implemented audit log API endpoint.
  - `lib/supabase/migrations/002_security_audit_logging.sql`: Created database migration for audit logs.
  - `lib/security/request-signing.ts`: Created HMAC-SHA256 request signing with replay attack prevention.
  - `lib/security/password-breach.ts`: Created password breach checking using Have I Been Pwned API.
  - `app/api/security/check-password-breach/route.ts`: Implemented password breach checking endpoint.
  - `lib/security/device-fingerprinting.ts`: Created device fingerprinting for browser identification.
  - `lib/security/session-termination.ts`: Created session management and termination utilities.
  - `lib/security/ip-anomaly-detection.ts`: Created IP anomaly detection with geolocation tracking.
  - `lib/security/headers-scanner.ts`: Created security headers scanning utilities.
  - `app/api/security/scan-headers/route.ts`: Implemented security headers scanning endpoint.
  - `components/security/PasswordStrengthIndicator.tsx`: Created password strength indicator component.
  - `lib/security/two-factor-backup-codes.ts`: Created 2FA backup codes generation and validation.
  - `public/security.txt`: Created RFC 9116 compliant security.txt file.
  - `lib/security/index.ts`: Created central export for all security modules.
  - `docs/SECURITY_ENHANCEMENTS.md`: Created comprehensive security documentation.
  - `SECURITY_IMPLEMENTATION_SUMMARY.md`: Created implementation overview.
- **Verification**: `npx tsc --noEmit` (pass).
- **Follow-ups**: Integrate security modules into existing authentication flows and configure CSP headers in production.

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

### Raouf: 2026-01-29 (Australia/Sydney) - Feed Stability & Dropdown Fixes

- **Summary**: Resolved critical UI bugs in the Feed where dropdown menus (Edit/Delete) on lower cards were inaccessible or positioned incorrectly.
  - **Dropdown Menu**: Removed manual `translate-x` overrides and `sticky` props that interfered with Radix UI's portal positioning logic, ensuring menus render correctly regardless of scroll position or parent transforms.
- **Files Changed**:
  - `components/ui/dropdown-menu.tsx`: Simplified positioning logic.
- **Verification**:
  - `npm run check`: Passed (Lint, Types, Format, Build, Tests).
- **Follow-ups**: None.

### Raouf: 2026-01-29 (Australia/Sydney) - Feed Dropdown Reliability Hardening

- **Summary**: Further hardened the event feed dropdown behavior so edit/delete menus open reliably on all cards, including lower items near the viewport edges. Removed the `hideWhenDetached` flag from the Radix `DropdownMenu` content wrapper to avoid premature unmounting when the trigger is inside complex sticky layouts while retaining collision boundaries.
- **Files Changed**:
  - `components/ui/dropdown-menu.tsx`: Removed `hideWhenDetached` from dropdown content.
- **Verification**:
  - `npm run check`: Passed (Lint, Types, Format, Build, Tests).
- **Follow-ups**: None.

### Raouf: 2026-01-29 (Australia/Sydney) - Feed Event Title & Settings Hover

- **Summary**: Fixed a missing English translation for the sample Career Fair event so it no longer renders the raw `event_careerFair2026_title` key, and improved the readability of responsive Settings navigation pills by switching their hover background to `bg-mq-card-background`.
- **Files Changed**:
  - `locales/en/translations.json`: Added `event_careerFair2026_title`.
  - `app/settings/layout.tsx`: Updated mobile nav hover background to card background.
- **Verification**:
  - `npm run check`: Passed (Lint, Types, Format, Build, Tests).
- **Follow-ups**: None.

### Raouf: 2026-01-29 (Australia/Sydney) - Settings Mobile Nav Contrast

- **Summary**: Further improved the contrast of Settings section pills on small screens by using `bg-mq-card-background` plus a subtle border for inactive pills so their labels remain readable against the blurred background while keeping the active pill style unchanged.
- **Files Changed**:
  - `app/settings/layout.tsx`: Adjusted inactive mobile pill background and border.
- **Verification**: `npm run check` (pass).
- **Follow-ups**: None.

### Raouf: 2026-01-29 (Australia/Sydney) - SSH MCP Configuration Update

- **Summary**: Configured the `ssh-mcp` server with specific connection details for the Linux server at `185.253.73.145`. Updated authentication parameters to use the provided password and default root user.
- **Files Changed**:
  - `.gemini/settings.json`: Updated `ssh-mcp` arguments with host, user, and password.
- **Verification**: Verified JSON syntax using Node.js.
- **Follow-ups**: None.
