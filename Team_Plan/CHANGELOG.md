# Changelog

All notable changes to **The Syllabus Sync** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

Raouf: 2026-01-30 (Australia/Sydney)
Scope: Home - Layout Refactor & Design Overhaul (Phases 0-4)
Summary: Transformed Home route to a solid-surface, designed product. Replaced glass effects with consistent `CardSolid`/`CardMuted` variants. Implemented route-level loading (`loading.tsx`), Week Heat-Strip (wow element), and Hero header (workload badge + primary action). Standardized interaction (hover effects, typography). Added missing translation keys and reduced motion support.
Files: app/home/page.tsx; app/home/loading.tsx; app/home/HomeClient.tsx; components/home/HomeCard.tsx; components/home/WeekHeatStrip.tsx; components/home/WelcomeHeader.tsx; components/home/HomeKpiStrip.tsx; components/home/TodaySchedule.tsx; components/units/UnitCard.tsx; lib/config.ts; locales/en/translations.json; app/mq-tokens.css.
Verification: Verified no `mq-liquid-glass` usage in Home route. Verified component integration and linter passes.
Follow-ups: None.

---

Raouf: 2026-01-30 (Australia/Sydney)
Scope: Security - Comprehensive Security Enhancements (12 items)
Summary: Implemented 12 security enhancements including Subresource Integrity (SRI) for CDN assets, CSP reporting, database audit logging, API request signing, password breach checking, device fingerprinting, session termination on password change, IP anomaly detection, security headers scanning, password strength indicator, 2FA backup codes, and security.txt file.
Files: lib/security/sri.ts; lib/security/csp.ts; app/api/csp-report/route.ts; lib/security/audit.ts; app/api/audit/route.ts; lib/supabase/migrations/002_security_audit_logging.sql; lib/security/request-signing.ts; lib/security/password-breach.ts; app/api/security/check-password-breach/route.ts; lib/security/device-fingerprinting.ts; lib/security/session-termination.ts; lib/security/ip-anomaly-detection.ts; lib/security/headers-scanner.ts; app/api/security/scan-headers/route.ts; components/security/PasswordStrengthIndicator.tsx; lib/security/two-factor-backup-codes.ts; public/security.txt; lib/security/index.ts; docs/SECURITY_ENHANCEMENTS.md; SECURITY_IMPLEMENTATION_SUMMARY.md.
Verification: `npx tsc --noEmit` (pass).
Follow-ups: Integrate security modules into existing authentication flows and configure CSP headers in production.

---

Raouf: 2026-01-26 (Australia/Sydney)
Scope: UI - Map building toggle + toast palette.
Summary: Made building cards toggle selection off when clicked again and normalized toast surfaces to the standard card background/border with current text color.
Files: app/map/MapClient.tsx; components/ui/toast.tsx.
Verification: `npm run check` (pass; tests emit expected circular JSON warning in response-critical tests and in-memory rate-limit warning).
Follow-ups: None.

Raouf: 2026-01-26 (Australia/Sydney)
Scope: UI - Card palette normalization across pages.
Summary: Added solid card backgrounds/borders to empty states and calendar skeletons, normalized calendar list items and unit/assignment panels to theme card backgrounds, and moved icon color handling to inherit current text color.
Files: app/calendar/CalendarClient.tsx; app/calendar/page.tsx; components/ui/EmptyState.tsx; components/units/UnitDetailPanel.tsx; components/assignments/AssignmentDetailPanel.tsx; app/manage-profiles/page.tsx; components/layout/WeatherWidget.tsx.
Verification: Not run (not requested).
Follow-ups: None.

Raouf: 2026-01-26 (Australia/Sydney)
Scope: UI - Calendar card palette override.
Summary: Overrode dark-mode calendar card background/border variables to use core theme tokens and removed remaining hue-specific SVG classes in calendar UI.
Files: app/calendar/CalendarClient.tsx; app/styles/dark-mode.css; app/styles/liquid-glass.css.
Verification: Chrome DevTools MCP: calendar main panel and cards now compute `background-color` as `rgb(55, 58, 54)` with `border-color` `rgb(113, 115, 107)`; `svg` stroke inherits current text color.
Follow-ups: None.

Raouf: 2026-01-26 (Australia/Sydney)
Scope: UI - Calendar card palette normalization.
Summary: Normalized calendar card backgrounds to mq tokens, aligned borders to `border-mq-border`, and removed hue-specific SVG classes so icons inherit text color.
Files: app/calendar/CalendarClient.tsx.
Verification: Not run (not requested).
Follow-ups: None.
