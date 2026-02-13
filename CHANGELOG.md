### Raouf: Event Highlight, Clickable Announcements, Security Wiring & UnitForm Scroll — 2026-02-13

**Scope:** Fix 4 UX issues across calendar, feed, settings, and unit form.
**Type:** Bug Fix / Enhancement

#### Changes Applied

1. **Event Highlight Timing (CalendarWidgets.tsx)**: Fixed `animate-pulse` highlight persisting indefinitely when navigating from Home "View All" to calendar. Added `eventHighlightDismissed` state with a 3-second auto-clear timeout. Also updated section highlight from 2s to 3s for consistency.
2. **Clickable Announcement Cards (AnnouncementsSection.tsx)**: Announcement cards in the feed sidebar are now interactive. Clicking a card expands it to show the full message text (removes `line-clamp-2`) and reveals optional links. Includes a chevron indicator, keyboard accessibility, and `aria-expanded` state.
3. **Security Settings to Login Page (SecuritySettings.tsx)**: Added an "Account Security" section with a "Change Password" button that navigates to `/login?redirectTo=/settings/security`, allowing users to re-authenticate and return to settings.
4. **UnitForm Scroll Fix (UnitForm.tsx)**: Restructured the dialog layout from `overflow-y-auto` on the entire dialog to a flex column layout (`flex flex-col overflow-hidden`) where only the form body scrolls (`flex-1 overflow-y-auto min-h-0`). Header and footer remain fixed. Supports adding class times for all 7 days (Monday–Sunday) without overflow issues.

#### Files Changed

- `features/calendar/components/CalendarWidgets.tsx`
- `features/feed/components/AnnouncementsSection.tsx`
- `features/settings/components/SecuritySettings.tsx`
- `components/units/UnitForm.tsx`

#### Verification

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run test` ✅ (442/442 tests pass)
- `npm run build` ✅

---

### Raouf: Full System Integrity Check & Test Fix — 2026-02-12

**Scope:** Run full project verification and fix test regression.
**Type:** Quality Assurance / Maintenance

#### Changes Applied

1.  **Full Verification**: Successfully ran the entire verification suite:
    - `npm run format`: Ensured consistent code style.
    - `npm run lint`: Verified all lint rules.
    - `npm run typecheck`: Verified all TypeScript types.
    - `npm run test`: All 428 tests passed.
    - `npm run build`: Production build completed successfully.
2.  **Test Fix**: Fixed a regression in `NotificationSettings.tsx` where a `data-testid` was changed, causing unit tests to fail. Restored the expected test ID `enable-notifications-button`.

#### Files Changed

- `features/settings/components/NotificationSettings.tsx`

#### Verification

- `npm run check` ✅ (All steps passing)

### Raouf: Settings Page Components Refactor — 2026-02-12

**Scope:** Refactor settings components for reusability and type safety.
**Type:** Refactor / Bug Fix

#### Changes Applied

1.  **Component Refactoring**:
    - Extracted `ToggleControl` and `NotificationRow` from `NotificationSettings.tsx`.
    - Created `GamificationToggleRow` to reduce duplication in `GamificationSettings.tsx`.
2.  **Type Safety & i18n**:
    - Fixed missing translation keys in `translations.json` causing type errors.
    - Enforced strict type checking for setting keys.

#### Files Changed

- `features/settings/components/NotificationSettings.tsx`
- `features/settings/components/GamificationSettings.tsx`
- `features/settings/components/ToggleControl.tsx` (New)
- `features/settings/components/NotificationRow.tsx` (New)
- `features/settings/components/GamificationToggleRow.tsx` (New)
- `locales/en/translations.json`

#### Verification

- `npm run lint` passed ✅
- `npm run typecheck` passed ✅

### Raouf: Full System Integrity Check — 2026-02-12

**Scope:** Run full project verification and fix remaining lint issues.
**Type:** Quality Assurance / Maintenance

#### Changes Applied

1.  **Full Verification**: Successfully ran the entire verification suite:
    - `npm run format`: Ensured consistent code style.
    - `npm run lint`: Identified and fixed a cascading render issue.
    - `npm run typecheck`: Verified all TypeScript types.
    - `npm run test`: All 425 tests passed.
    - `npm run build`: Production build completed successfully.
2.  **Lint Fix**: Refactored `CalendarWidgets.tsx` to move a `setState` call into a `setTimeout` within an effect to avoid cascading renders and satisfy `react-hooks/set-state-in-effect`.

#### Files Changed

- `features/calendar/components/CalendarWidgets.tsx`

#### Verification

- `npm run check` ✅ (All steps passing)

### Raouf: Fix Merge Conflict in Calendar — 2026-02-12

**Scope:** Resolve merge conflicts in `app/calendar/CalendarClient.tsx`.
**Type:** Bug Fix / Refactor

#### Changes Applied

1.  **Resolved Conflicts**: Fixed merge conflicts in `CalendarClient.tsx` related to the Todo editing form.
2.  **Combined Improvements**:
    - Adopted the improved UI layout with icons from the refactor branch.
    - Retained accessibility improvements (`aria-label`) and code cleanup (`UNIT_COLORS`) from the main branch.

#### Files Changed

- `app/calendar/CalendarClient.tsx`

#### Verification

- Manual verification of code structure and conflict resolution.

### Raouf: Calendar Page Refactor, Accessibility & Full System Check — 2026-02-12

**Scope:** Refactor `CalendarClient.tsx`, resolve all linting/accessibility warnings, and verify system integrity.
**Type:** Refactoring / Accessibility / Quality Assurance

#### Changes Applied

1.  **Modular Refactor**: Extracted non-UI logic from `CalendarClient.tsx` into specialized hooks.
2.  **Accessibility (A11y)**: Added keyboard listeners, roles, and tab indexing to interactive calendar elements.
3.  **i18n**: Fixed missing translation keys in `translations.json`.
4.  **Formatting**: Ran Prettier across the codebase to ensure consistent style.
5.  **Full Verification**: Verified the entire project using `npm run check`, ensuring all tests pass and the production build is stable.

#### Files Changed

- `app/calendar/CalendarClient.tsx` (simplified & accessible)
- `features/calendar/components/CalendarWidgets.tsx` (updated refs)
- `locales/en/translations.json` (fixed missing keys)
- Multiple files formatted via Prettier.

#### Verification

- `npm run check` ✅ (Formatting, Lint, Typecheck, 425/425 Tests, Build)

### Raouf: Home Page Refactor — 2026-02-11

**Scope:** Refactor `HomeClient.tsx` into smaller composable hooks.
**Type:** Refactoring / Code Quality

#### Changes Applied

1.  Identified `HomeClient.tsx` as a high-priority refactor target due to multiple responsibilities (Auth, Data, UI, Events).
2.  Extracted logic into 5 new custom hooks in `features/home/hooks/`:
    - `useHomeUser`: Auth state and profile logic.
    - `useSampleSeeding`: Local storage and sample data seeding.
    - `useHomeData`: Store selectors and initial data loading.
    - `useHomeEventListeners`: Window event listeners (FAB actions).
    - `useHomeErrorBoundary`: Error boundary state and recovery logic.
3.  Refactored `HomeClient.tsx` to use these hooks, reducing file size and complexity.

#### Files Changed

- `app/home/HomeClient.tsx` (simplified)
- `features/home/hooks/index.ts` (new)
- `features/home/hooks/useHomeUser.ts` (new)
- `features/home/hooks/useSampleSeeding.ts` (new)
- `features/home/hooks/useHomeData.ts` (new)
- `features/home/hooks/useHomeEventListeners.ts` (new)
- `features/home/hooks/useHomeErrorBoundary.ts` (new)
- `features/home/types.ts` (new)

#### Verification

- `npm run check` ✅ (lint, typecheck, 425/425 tests, build)
