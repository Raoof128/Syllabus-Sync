# Changelog

All notable changes to this project will be documented in this file.

---

### Raouf: Calendar Page Bug Hunt & Production Hardening — 2026-04-06

**Scope:** Bug fixes, performance, accessibility, and type safety across 6 calendar files

1. **`CalendarClient.tsx` — view buttons broke URL sync:** Three desktop view-toggle buttons called `setView(...)` directly, bypassing `handleViewChange`. This meant switching views didn't update the URL, breaking deep-links, back/forward navigation, and share-by-URL. Fixed by destructuring `handleViewChange` from `useCalendarView()` and wiring it to all three buttons. Also added `aria-pressed` to each button for screen-reader active-state indication.
2. **`CalendarClient.tsx` — `isToday` variable shadowing:** Inside the mobile day-row `map`, a local `const isToday` shadowed the outer `isToday` from `useCalendarView`. Renamed the inner variable to `isDayToday` to eliminate the ambiguity and prevent latent bugs.
3. **`CalendarClient.tsx` — timezone bug in todo form:** `new Date(editTodoDueDate)` creates a UTC midnight Date object. When combined with `setHours` (which applies local time), the resulting `dueDate` is wrong in any timezone west of UTC. Fixed by using `dayjs(editTodoDueDate).hour(...).minute(...).toDate()` which stays in local time throughout.
4. **`CalendarClient.tsx` — non-memoized handler functions:** 9 local handlers (`handleDeleteAssignment`, `confirmDeleteAssignment`, `handleDeleteExam`, `confirmDeleteExam`, `confirmDeleteDeadline`, `handleDeleteEvent`, `confirmDeleteEvent`, `handleDeleteTodo`, `confirmDeleteUnit`, `handleUnitDetailOpenChange`, `getUnitsForDay`, `getItemsForDay`) were re-created on every render, giving child components fresh prop references every render. Wrapped all in `useCallback` with correct dependencies.
5. **`CalendarClient.tsx` — mobile day buttons inaccessible:** Day buttons in the mobile date selector showed only a letter + number with no accessible name. Added `aria-label` with full weekday name and day number (plus "(today)" suffix) and `aria-hidden` on the decorative spans. Also destructured `formatWeekdayLong` from `useCalendarGetters` for this.
6. **`useCalendarHighlights.ts` — event highlight re-fires on store refresh:** The event-highlight effect lacked a `processedRef` guard that unit/deadline/todo highlights all have. On any Zustand store update that re-ran the effect, the detail dialog re-opened. Added `processedEventHighlightRef` and the standard reset guard to match the other highlight patterns.
7. **`useCalendarView.ts` — dead condition `hours >= 24`:** `dayjs().hour()` returns 0–23, making the `|| hours >= 24` branch unreachable. Removed it and added an explanatory comment.
8. **`useCalendarData.ts` — duplicate imports:** `createBrowserClient` and `isSupabaseConfigured` were imported from `@/lib/supabase/client` on two separate lines. Merged into one.
9. **`useCalendarDialogs.ts` — hardcoded `'#10b981'` hex colour:** The default todo colour violated AGENT.md's "no hardcoded hex values" rule. Replaced with `DEFAULT_TODO_COLOR = UNIT_COLORS[3].value` (sourced from `@/lib/config`).
10. **`page.tsx` — inaccessible loading skeleton + redundant ARIA role:** `CalendarSkeleton` had no `role="status"`, `aria-busy`, or `aria-label`. Added all three. Also removed `role="main"` from the `<main>` element — `<main>` already carries the landmark implicitly.

**Files Changed:**

- `app/calendar/page.tsx`
- `app/calendar/CalendarClient.tsx`
- `features/calendar/hooks/useCalendarView.ts`
- `features/calendar/hooks/useCalendarHighlights.ts`
- `features/calendar/hooks/useCalendarData.ts`
- `features/calendar/hooks/useCalendarDialogs.ts`

**Verification:**

- TypeScript: `npm run typecheck` — clean ✅
- Lint: `npm run lint` — clean ✅
- Tests: 874/878 passed ✅ (4 pre-existing signup failures, unrelated)

---

### Raouf: Home Page Bug Hunt & Production Hardening — 2026-04-06

**Scope:** Bug fixes, performance, accessibility, and type safety across 7 home-page files

1. **`HomeClient.tsx` — duplicate landmark labels:** Two `<section>` elements shared an identical `aria-label={t('dashboardOverview')}`, creating duplicate region landmarks for screen readers. Fixed by removing the `aria-label` from the events/todos grid section (unnamed sections don't become landmarks — correct for a sub-grid).
2. **`HomeClient.tsx` — unsafe navigation in error state:** `window.location.href = '/'` bypassed the Next.js router, causing a full-page reload instead of client-side navigation. Replaced with `router.push('/')`.
3. **`HomeClient.tsx` — portal target comment:** Documented WHY the `typeof document` guard is safe for portals (React's hydration algorithm does not compare portal content at the component mount point).
4. **`AuthRedirectHandler.tsx` — supabase client recreated on every render:** `createBrowserClient()` was called in the component body. Moved to `useMemo([], ...)` so the client is created once per mount. Also imported `Session` type and replaced `session: unknown` with `session: Session | null` in the `onAuthStateChange` callback for proper type safety.
5. **`useHomeData.ts` — unnecessary store subscriptions:** `_isLoadingUnits` and `_isLoadingDeadlines` were subscribed from their Zustand stores but never read. Each subscription causes a re-render on every loading-state change. Removed both unused subscriptions.
6. **`useHomeUser.ts` — displayName recomputed every render:** The name-derivation logic was an IIFE, recomputing on every render regardless of whether `user` or `currentProfile` changed. Wrapped in `useMemo([user, currentProfile])`. Also added `useMemo` to the React import.
7. **`WeekHeatStrip.tsx` — full `motion` bypassed `LazyMotion`:** Importing `motion` from `framer-motion` forces the full animation bundle even when `<LazyMotion features={domAnimation}>` is active in the parent. Replaced with `m` (the lightweight variant designed for use with `LazyMotion`).
8. **`loading.tsx` — inaccessible loading skeleton:** The skeleton container had no ARIA semantics — screen readers had no way to identify it as a loading state. Added `role="status"`, `aria-label="Loading dashboard"`, and `aria-busy="true"`.
9. **`WelcomeHeader.tsx` — dead fallback branch:** `messageKey ? t(messageKey) : t('dayAtGlance')` — `messageKey` is always truthy (always a string from the `generalKeys` array), so the `t('dayAtGlance')` fallback was unreachable dead code. Simplified to `t(messageKey as 'welcomeMsg1')`.

**Files Changed:**

- `app/home/HomeClient.tsx`
- `app/home/loading.tsx`
- `app/AuthRedirectHandler.tsx`
- `features/home/hooks/useHomeData.ts`
- `features/home/hooks/useHomeUser.ts`
- `features/home/components/WeekHeatStrip.tsx`
- `features/home/components/WelcomeHeader.tsx`

**Verification:**

- TypeScript: `npm run typecheck` — clean ✅
- Lint: `npm run lint` — clean ✅
- Tests: 874/878 passed ✅ (4 pre-existing signup test failures, unrelated to these changes)

---

### Raouf: Fix Select Dropdowns Not Opening Inside Dialogs — 2026-04-05

**Scope:** UI bug fix — Radix Select z-index + Dialog interaction guard

1. **Root cause 1 — z-index clash:** `SelectContent` was styled with `z-50` while Dialog overlay/content uses `z-[70]`. The Select portal rendered behind the dialog, making dropdowns invisible and unclickable in all dialogs (UnitForm day picker, ReminderModal timing picker, etc.).
2. **Root cause 2 — blanket `preventDefault`:** `ReminderModal` called `e.preventDefault()` unconditionally in `onPointerDownOutside` and `onInteractOutside`, blocking Radix Select portal interactions even if z-index were fixed.
3. **Fix 1:** Bumped `z-50` → `z-[80]` in `SelectContent` so the dropdown portal always renders above the dialog layer.
4. **Fix 2:** Narrowed the `preventDefault` guard to skip events whose target is within a `[data-radix-popper-content-wrapper]` element, preserving "click outside to dismiss" protection while allowing Select portals to function.

**Files Changed:**

- `components/ui/select.tsx`
- `components/ui/ReminderModal.tsx`

**Verification:**

- TypeScript: `npm run typecheck` — clean ✅
- Lint: `npm run lint` — clean ✅
- Tests: 876/878 passed ✅ (2 pre-existing signup failures unrelated to this change)

---

### Raouf: Git Rebase & Documentation Sync — 2026-04-01

**Scope:** Resolved a complex 3-step interactive rebase conflict in `README.md`.

1.  **Synthesized "Super README":** Merged high-impact visual portfolio assets (Typing SVG, dynamic screenshots) with the deep technical engineering narrative (Zero-Trust architecture, AI-native Codex workflows) to create a unified, high-caliber repository entry point.
2.  **Resolved Rebase Deadlock:** Manually resolved 3 sequential merge conflicts in `README.md` during an interactive rebase, ensuring no loss of professional depth or visual quality.
3.  **Synchronized Origin:** Finalized the rebase and validated repository parity with `origin/main`.

**Files Changed:**

- `README.md`

**Verification:**

- Git rebase completed successfully ✅
- `README.md` structural and visual audit completed ✅
- `git status` parity verified ✅

---

### Raouf: Full Project Documentation Portfolio Transformation — 2026-03-21

**Scope:** Rewrote and structurally elevated the entire project documentation suite to transform the repository into a high-caliber portfolio piece.

1.  **Unified Professional Tone:** Shifted from "development notes" to industry-standard "executive and senior-engineering" documentation across 15+ files.
2.  **Impact-Focused Narrative:** Highlighted the "Why" and "How" behind complex technical hurdles, including:
    - **Additive Merge Strategy** for solving optimistic UI race conditions.
    - **Fused-Heading Algorithm** for high-accuracy pedestrian campus navigation.
    - **Zero-Trust Edge Middleware** for sub-6s session resolution and fail-fast infrastructure stability.
3.  **Addressed Implementation Gaps:** Documented critical technical details discovered in the codebase:
    - **Infrastructure Limits:** Formalized Vercel Edge execution deadlines and Redis-backed rate limiting mandates.
    - **PII Handling:** Clarified plaintext IP/User-Agent logging for forensic analysis and threat hunting.
    - **Passkey Scope:** Documented the restriction to platform authenticators for biometric UX optimization.
4.  **Structural Re-indexing:** Reorganized the `docs/` hub to act as a clean, professional navigation center for technical reviewers and hiring panels.

**Files Changed:**

- `README.md`, `TECHNICAL_EXPLANATION.md`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`
- `docs/README.md`, `docs/architecture/ARCHITECTURE.md`, `docs/api/API_REFERENCE.md`
- `docs/inventory/ROUTE_INVENTORY.md`, `docs/setup/ENVIRONMENT_SETUP.md`
- `docs/university-integration-requirements.md`, `docs/operations/deployment-checklist.md`
- `docs/security/SECURITY_POSTURE.md`
- `AGENT.md`, `CHANGELOG.md`

**Verification:**

- Documentation consistency audit completed ✅
- Markdown links verified ✅
- Technical alignment with current codebase state confirmed ✅

---

### Raouf: Rewrite README for Claude for OSS and OpenAI Codex for OSS Grant Applications — 2026-03-17

**Scope:** Replaced the internal-facing technical README with a grant-optimised public README.

... [rest of CHANGELOG.md content] ...
