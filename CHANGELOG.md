# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
