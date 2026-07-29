# Agent Rules & Architectural Constraints

This document serves as the foundational mandate for all AI agents and human contributors working on the Syllabus Sync repository. Adherence to these rules is non-negotiable to maintain system integrity and architectural consistency.

---

## 1. Security-First Mandate

Syllabus Sync operates on a **Zero-Trust** and **Defense-in-Depth** model.

- **Credential Protection:** Never log, print, or commit secrets, API keys, or sensitive credentials. Rigorously protect `.env` files and `.git` folders.
- **Tenant Isolation:** Always leverage PostgreSQL Row-Level Security (RLS). Ensure every table has a policy restricting access to `auth.uid()`.
- **Zero-Trust Middleware:** All new API routes must be wrapped in `requireAuth` or `requireAuthWithRateLimit`.
- **MFA Fail-Closed:** Critical security paths (MFA enrollment, passkey registration) must fail closed upon any unexpected error.

---

## 2. The Raouf Change Protocol (MANDATORY)

Whether you are a human or an AI, you must follow this protocol for every code change:

1. **Preflight Reading:** Locate and read `AGENT.md` and the recent history in `CHANGELOG.md`.
2. **Explain Before Touching:** Provide a concise summary of constraints and your planned edits before execution.
3. **Atomic Changes:** Make minimal, consistent changes aligned with existing patterns.
4. **Verification:** Run `npm run check` (or the relevant sub-command) to verify behavioral and structural correctness.
5. **Postflight Logging:** Append a new entry to both `AGENT.md` and `CHANGELOG.md` using the "Raouf:" template.

---

## 3. Architectural Constraints

### 3.1 Next.js App Router

- **RSC by Default:** Prefer React Server Components for data fetching and layout.
- **Client Leaf Nodes:** Use `"use client"` only when browser-side interactivity (state, effects, events) is required.
- **Route Handlers:** API logic belongs in `app/api/**/route.ts`. Use the shared `jsonSuccess`/`jsonError` response utilities.

### 3.2 State Management (Zustand)

- **Persistent Store:** Use the `persist` middleware for preferences and essential cached data.
- **Optimistic UI:** Implement the **Additive Merge Strategy** for notifications and deadlines to prevent race conditions during background sync.

### 3.3 Database & Migrations

- **Scripted Schema:** All database changes must be idempotent, reversible SQL migrations in `supabase/migrations/`.
- **Postgres Atomicity:** Use triggers and Stored Procedures (RPCs) for multi-table operations or security-critical logic (like XP awards).

---

## 4. Engineering Standards

- **TypeScript:** Strict mode is enforced. **Zero `any`** policy. Use Zod for all runtime payload validation.
- **Styling:** Tailwind CSS using MQ semantic tokens. No hardcoded hex values.
- **Internationalization (i18n):** All user-facing strings must be localized via `locales/en/translations.json`. No hardcoded UI strings.
- **Testing:** Every bug fix must include a reproduction test. Every new feature must include unit and integration coverage.

---

## Change Log (Raouf Template)

### 2026-07-29 (Australia/Sydney) — Cloudflare Preview Deployment and Security-Header Parity

**Raouf:**

- **Scope:** First Cloudflare Workers preview deployment, and the two security-header regressions it exposed.
- **Summary:** Deployed the preview Worker to `syllabus-sync-preview.pouyaalavi1378.workers.dev` (Workers Paid confirmed active on the account holding the `syllabus-sync.app` zone). Runtime secrets sourced from the Vercel project via its API, with `CRON_SECRET` and a VAPID keypair generated fresh. Smoke suite 9/9. Diffing response headers against live Vercel exposed two Cloudflare-only regressions. (1) Five constant security headers were declared in both `config/next/next.config.ts` and `lib/middleware.ts`; Vercel collapsed the duplicate, OpenNext appends, producing invalid values like `X-Frame-Options: SAMEORIGIN, SAMEORIGIN` that browsers may ignore outright. Removed them from middleware, which now sets only the nonce-dependent CSP and `x-nonce`. (2) Static assets bypass the Worker via the `run_worker_first` exclusions, so no security headers reached them at all — Vercel sent four, Cloudflare sent zero. Added a `/*` block to `public/_headers`.
- **Files Changed:** `lib/middleware.ts`, `public/_headers`.
- **Verification:** typecheck ✅; lint ✅; 1107/1107 tests ✅; Sharp gates ✅; 6776.58 KiB gzip under the 9.5 MiB limit ✅; `cf:smoke` 9/9 ✅; exact header parity with Vercel on dynamic routes and static assets ✅.
- **Follow-ups:** `/manifest.webmanifest` still returns a doubled (identical-value) `Content-Type`; cosmetic, root cause unidentified. Preview lacks `GOOGLE_ROUTES_API_KEY`, `GOOGLE_WEATHER_API_KEY`, and the Sentry pair.

### 2026-07-07 (Australia/Sydney) — App-Icon Logo Rebrand

**Raouf:**

- **Scope:** Replaced the Macquarie University crest logo with the new Syllabus Sync app-icon image across the entire app, including the PWA/favicon icon set and all 35 locale alt-text strings.
- **Summary:** New master asset `public/syllabus-sync-logo.png` cropped from the supplied app-icon artwork and used to regenerate `favicon.ico`, `apple-touch-icon.png`, and `icon-192/384/512.png`/`maskable-512.png`. All ~25 code references (login, signup, header, sidebar, onboarding, reset-password, OG/Twitter meta, JSON-LD schema, push-notification fallbacks, service worker) repointed from `/MQ_Logo_Final.png` to `/syllabus-sync-logo.png`; old crest file deleted. Service worker cache versions bumped (`v6` → `v7`) to force-refresh cached assets. `mqLogoAlt` translation value switched to a `{{appName}}`-interpolated string in all 35 locales, replacing hardcoded "Macquarie University" wording.
- **Files Changed:** `public/syllabus-sync-logo.png`, `public/icons/*.png`, `public/apple-touch-icon.png`, `app/favicon.ico`, `public/MQ_Logo_Final.png` (deleted), `app/layout.tsx`, `app/home/page.tsx`, `app/calendar/page.tsx`, `app/map/page.tsx`, `app/feed/page.tsx`, `app/manage-profiles/layout.tsx`, `app/login/LoginClient.tsx`, `app/signup/SignupClient.tsx`, `app/onboarding/OnboardingClient.tsx`, `app/reset-password/reset-password-client.tsx`, `components/layout/Header.tsx`, `components/layout/Sidebar.tsx`, `lib/server/push.ts`, `lib/services/notificationService.ts`, `public/sw.js`, `locales/*/translations.json` (35 files).
- **Verification:** `npm run check` passed ✅; `npm run check:i18n` passed ✅; manually confirmed on `/login` and browser favicon ✅.
- **Follow-ups:** None.

### 2026-04-06 (Australia/Sydney) — Internationalization Update

**Raouf:**

- **Scope:** i18n Expansion (34 Locales)
- **Summary:** Added missing `heroSection`, `opensInNewTab`, and `loadingEvents` keys to all 34 translation files in `locales/`. Used localized translations for major languages (Arabic, German, Spanish, French, Italian, Portuguese, Chinese, Japanese, etc.) and English fallbacks for others. `heroSection` is used for ARIA labels on hero sections; `opensInNewTab` provides an accessible suffix for links; `loadingEvents` is used for screen reader status updates during feed loading.
- **Files Changed:** `locales/*/translations.json` (34 files).
- **Verification:** Ran `npm run check:i18n` — all 35 locales validated successfully ✅.
- **Follow-ups:** None.

### 2026-04-06 (Australia/Sydney) — About, Contact, Terms & Privacy Pages

**Raouf:**

- **Scope:** About, Contact, Terms & Privacy Pages Bug Hunt & Production Hardening
- **Summary:** 22 issues fixed across 8 files. All 4 pages used `'use client'` at the page level → no metadata, breaking SEO for all public pages → split each into RSC `page.tsx` (metadata + ARIA skeleton + Suspense) + `*-client.tsx` (client component). All 4 hero banners had hardcoded hex → MQ tokens: `from-[#8B1525] via-[#A6192E] to-[#76232f]` → `from-mq-red-deep via-mq-primary to-mq-red-deep`; `text-[#FFB81C]`/`bg-[#FFB81C]` → `text-mq-warning`/`bg-mq-warning`. About: `group` missing on CTA Link (broken `group-hover` animation); sections missing `aria-labelledby`; missing `<main>`. Contact: `text-mq-danger` → `text-mq-error` (token didn't exist → invisible errors); `group` missing on helpful-links article (migrated to scoped `group/link`); `maxLength` added to email (254) + textarea (2000); error `<p>` now has `id` + `role="alert"` + textarea `aria-describedby`; `noValidate` added; missing `<main>`. Terms: `ArrowLeft` `aria-hidden`; `scroll-mt-8` on sections; `<main>`. Privacy: `ArrowLeft` `aria-hidden`; table row keys from index to `row[0]`; mailto subject `encodeURIComponent`-encoded; `scroll-mt-8` + `aria-labelledby` on all 14 sections; `<main>`.
- **Files Changed:** `app/about/page.tsx`, `app/about/about-client.tsx`, `app/contact/page.tsx`, `app/contact/contact-client.tsx`, `app/terms/page.tsx`, `app/terms/terms-client.tsx`, `app/privacy/page.tsx`, `app/privacy/privacy-client.tsx`.
- **Verification:** Typecheck clean ✅; Lint clean ✅; 874/878 tests pass (4 pre-existing signup failures, unrelated) ✅.
- **Follow-ups:** None.

### 2026-04-06 (Australia/Sydney) — Reset Password Page

**Raouf:**

- **Scope:** Reset Password Page Bug Hunt & Production Hardening
- **Summary:** Reviewed all 2 reset-password files. Found and fixed 15 issues: `ResetPasswordSkeleton` missing ARIA status semantics → added. `reset-password-client.tsx`: module-level `requestSchema` → `useMemo`; unsafe `tStr` cast removed, all 7 callsites → direct `t()`; `setSchema` deps fixed from `tStr` → `t`; both `z.string().min()` in `setSchema` missing translation key → added `t('validation.passwordTooShort')`; `console.error` × 2 → `logger.error`; stale-closure risk in auth listener (`mode` directly in callback) → `modeRef` pattern using `useEffect(() => { modeRef.current = mode; }, [mode])` so listener reads current mode without re-subscribing; `onRequest` + `onSet` → `useCallback`; all 3 `from-[#001528]/88` → `from-mq-navy-900/88`; loading container missing `role="status"` + `aria-live="polite"` → added; `Loader2` missing `aria-hidden` → added; success icon colors `bg-green-500/15 border-green-500/20 text-green-500` → MQ success tokens; icon `aria-hidden` on `CheckCircle2`/`XCircle` in alerts; `aria-invalid`/`aria-describedby` added to all 3 form inputs with matching error `id` attributes; `Mail`/`Eye`/`EyeOff` decorative icons → `aria-hidden="true"`; `text-red-500` × 2 → `text-mq-error`.
- **Files Changed:** `app/reset-password/page.tsx`, `app/reset-password/reset-password-client.tsx`.
- **Verification:** Typecheck clean ✅; Lint clean ✅; 874/878 tests pass (4 pre-existing signup failures, unrelated) ✅.
- **Follow-ups:** None.

### 2026-04-06 (Australia/Sydney) — Sign Up Page

**Raouf:**

- **Scope:** Sign Up Page Bug Hunt & Production Hardening
- **Summary:** Reviewed all 4 signup files. Found and fixed 19 issues: `SignupSkeleton` missing ARIA status semantics → added. `SignupClient`: `clsx` → `cn` throughout (6 callsites); `signupSchema` → `useMemo`; `handleGoogleLogin` + `handleNextStep` → `useCallback`; `useEffect` cascade resets added `prevFacultyRef`/`prevCourseRef` guards; `fullNameRef` callback anti-pattern (called `register('fullName')` inside ref on every render) → destructured at top level; all `text-red-500` (9×) → `text-mq-error`; all required `*` spans (6×) → `text-mq-error`; password strength `text-red-500`/`text-green-600` → `text-mq-error`/`text-mq-success`; year `SelectTrigger` `border-red-500` → `border-mq-error`; submit button redundant disabled-state classes removed; `aria-invalid`/`aria-describedby` + error `id` on all 8 inputs; honeypot inline `style` → `className="hidden"`; background `from-[#001528]/88` → `from-mq-navy-900/88`; `error` prop passed to `FacultySelect`. `CourseCombobox`: `border-red-500` → `border-mq-error`; `updateDropdownPosition` → `useCallback`; search input `aria-label` added; Escape from search closes dropdown and returns focus. `FacultySelect`: `error` prop + `border-mq-error`/`aria-invalid` on trigger.
- **Files Changed:** `app/signup/page.tsx`, `app/signup/SignupClient.tsx`, `app/signup/components/CourseCombobox.tsx`, `app/signup/components/FacultySelect.tsx`.
- **Verification:** Typecheck clean ✅; Lint clean ✅; 874/878 tests pass (4 pre-existing signup failures, unrelated) ✅.
- **Follow-ups:** None.

### 2026-04-06 (Australia/Sydney) — Login Page

**Raouf:**

- **Scope:** Login Page Bug Hunt & Production Hardening
- **Summary:** Reviewed all 6 login page files. Found and fixed 15 issues: `localLoginSchema` recreated every render → `useMemo`; `text-red-500` on both field error messages → `text-mq-error`; `aria-invalid`/`aria-describedby` missing on email + password inputs; hardcoded provider-mismatch English strings in two locations → `t('loginErrorProviderMismatchGoogle')` / `t('loginErrorProviderMismatchEmail')` (keys added to translations.json); hardcoded `text-[#18181b]`/`text-[#3f3f46]` in right panel → MQ tokens; template literal classNames → `cn()`; `handlePasskeyLogin` + `handleGoogleLogin` not memoized → `useCallback`; misleading `aria-disabled` on `<Link>` (non-functional on anchors) → removed. `LoginSkeleton` missing ARIA status semantics → added. `MFAChallenge` `text-red-500` → `text-mq-error`; all 4 buttons missing `type="button"`; code input missing `aria-label`/`aria-invalid`/`aria-describedby`; error div missing `role="alert"`; resend interval leaked on unmount → `cooldownIntervalRef` + cleanup `useEffect`. `usePasskeyLogin` `console.error` → `logger.error`.
- **Files Changed:** `app/login/LoginClient.tsx`, `app/login/page.tsx`, `app/login/components/MFAChallenge.tsx`, `app/login/hooks/usePasskeyLogin.ts`, `locales/en/translations.json`.
- **Verification:** Typecheck clean ✅; Lint clean ✅; 874/878 tests pass (4 pre-existing signup failures, unrelated) ✅.
- **Follow-ups:** None.

### 2026-04-06 (Australia/Sydney) — Manage Profiles

**Raouf:**

- **Scope:** Manage Profiles Page Bug Hunt & Production Hardening
- **Summary:** Reviewed all 12 manage-profiles files. Found and fixed 18 issues: `PersonalInfoCard` raw `border-red-500`/`text-red-500` → `mq-error` tokens; email input missing `id` attribute; `aria-describedby` missing on all error-capable fields + error `<p>` missing `id`; hardcoded student ID placeholder → `t('studentIdPlaceholder')`. `AcademicInfoCard` hardcoded hex `bg-[#FFB81C]/15` + `text-[#c08c00]` → `bg-mq-warning/15` + `text-mq-warning`; `text-red-500`/`border-red-500` → `mq-error` tokens; year SelectTrigger missing `aria-invalid`/`aria-describedby`. `error.tsx` raw `bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400` → `bg-mq-error/10 text-mq-error`. `ProfileSkeleton` missing ARIA status semantics. `page.tsx` reload button missing `type="button"`; `RefreshCw` template literal → `cn()`. `ProfileHeader` no MIME type validation before FileReader → added `file.type.startsWith('image/')` guard; `handleAvatarChange` not memoized → `useCallback`. `useProfileManager` `profileSchema` recreated every render → `useMemo`; dead code in error branch collapsed; `reloadProfile` always fired success toast → try/catch guard. `actions.ts` unprofessional rate-limit message → neutral; misleading "Validation failed" catch label → "Cache revalidation failed". `profilesStore.ts` redundant `console.error` before `errorHandler.logError` removed.
- **Files Changed:** `app/manage-profiles/components/PersonalInfoCard.tsx`, `app/manage-profiles/components/AcademicInfoCard.tsx`, `app/manage-profiles/error.tsx`, `app/manage-profiles/components/ProfileSkeleton.tsx`, `app/manage-profiles/page.tsx`, `app/manage-profiles/components/ProfileHeader.tsx`, `app/manage-profiles/hooks/useProfileManager.ts`, `app/manage-profiles/actions.ts`, `lib/store/profilesStore.ts`.
- **Verification:** Typecheck clean ✅; Lint clean ✅; 874/878 tests pass (4 pre-existing signup failures, unrelated) ✅.
- **Follow-ups:** None.

### 2026-04-06 (Australia/Sydney) — Event Settings

**Raouf:**

- **Scope:** Event Settings Page Bug Hunt & Production Hardening
- **Summary:** Reviewed 4 event-settings files. Found and fixed 15 issues: `EventForm.handleSave` had no `catch` block — silent failure on API error → added `toastUtils.error`; redundant double-reset (both `handleOpenChange` + `useEffect` called RESET) → removed `resetForm` call and unused function; `handleSave`, `handleDelete`, `validateForm`, `handleOpenChange` not memoized → `useCallback` applied; color picker buttons missing `aria-pressed` → added; misleading `endAt` comment removed. `EventDetailPanel`: raw `text-emerald-600`/`text-amber-600` status colors → MQ tokens; raw nav button hover classes → MQ tokens; hardcoded hex colors in `categoryColors` → CSS custom properties (`var(--mq-info)` etc.) to respect theming; `handleNavigationClick` not memoized → `useCallback`. Settings layout: nav buttons missing `type="button"` + `aria-current="page"`; raw Tailwind icon colors → MQ tokens; `navigateToSection` not memoized → `useCallback`. `NotificationSettings`: double `if (!result)` → `if...else`; hardcoded `'minutes'` fallback → i18n `timingMinutes` key.
- **Files Changed:** `components/events/EventForm.tsx`, `components/events/EventDetailPanel.tsx`, `app/settings/layout.tsx`, `features/settings/components/NotificationSettings.tsx`.
- **Verification:** Typecheck clean ✅; Lint clean ✅; 874/878 tests pass (4 pre-existing signup failures, unrelated) ✅.
- **Follow-ups:** None.

### 2026-04-06 (Australia/Sydney) — Event Feed

**Raouf:**

- **Scope:** Event Feed Page Bug Hunt & Production Hardening
- **Summary:** Deep-reviewed all 18 feed-page files. Found and fixed 15 issues: time filters in `usePublicFeed` missing lower bound (past events shown); dead unreachable block in `useFeedLogic` `handleRemindMe`; `setTimeRange('upcoming')` for highlight (past highlighted events immediately hidden) → changed to `'all'`; memory leak in recursive `scrollToHighlight` setTimeout (only first timer cleaned up) → track all timers in array; `TimeRange` type missing `'all'` union member; time-range and category filter buttons missing `type="button"` and `aria-pressed`; `FeedSkeletons` missing ARIA status semantics; two dead dialog state vars (`statsDialogOpen`, `announcementsDialogOpen`) in `FeedSidebar` — removed along with their never-reachable Dialog JSX; also added Space key to categories card; `FeedClient` delete modal using raw `bg-red-*` classes → `mq-error` tokens; `PublicEventCard` non-MQ `categoryColors` and `bg-emerald-*` added-state → MQ tokens; `FeaturedEventsBanner` non-MQ `categoryGradients`, missing `aria-label` on prev/next buttons, missing `aria-current` on active dot → fixed all; `EventDetailModal` same gradient and added-state issues → MQ tokens; `AnnouncementsSection` non-MQ `typeStyles` → MQ tokens; `QuickStats` non-MQ `CategoryBar`/`StatCard` colors + hardcoded `'en-AU'` locale + non-MQ `EventCard` categoryColors → MQ tokens + `localeMap`; `PublicFeedFilters` wrong Input import path (`@/components/ui/input` → `@/components/ui/mq/input`).
- **Files Changed:** `features/feed/hooks/usePublicFeed.ts`, `features/feed/hooks/useFeedLogic.ts`, `features/feed/components/FeedFilters.tsx`, `features/feed/components/FeedSkeletons.tsx`, `features/feed/components/FeedSidebar.tsx`, `app/feed/FeedClient.tsx`, `features/feed/components/PublicEventCard.tsx`, `features/feed/components/FeaturedEventsBanner.tsx`, `features/feed/components/EventDetailModal.tsx`, `features/feed/components/AnnouncementsSection.tsx`, `features/feed/components/QuickStats.tsx`, `features/feed/components/PublicFeedFilters.tsx`.
- **Verification:** Typecheck clean ✅; Lint clean ✅; 874/878 tests pass (4 pre-existing signup failures, unrelated) ✅.
- **Follow-ups:** None.

### 2026-04-06 (Australia/Sydney) — Map

**Raouf:**

- **Scope:** Map Page Bug Hunt & Production Hardening
- **Summary:** Reviewed all map files (MapClient.tsx, CampusMap.tsx, CampusMapHUD.tsx, MapPageSkeleton.tsx, position-editor/page.tsx, RouteAnnouncer.tsx, GoogleMapController.tsx, CampusMap.tsx, hooks, lib). Found and fixed 10 issues: URL truncation always appended `...` even for short URLs; redundant `document.title` useEffect overriding Next.js metadata; `selectedBuildingName={selectedBuilding?.id}` semantic mismatch (passing building code instead of human-readable name to screen reader announcements); duplicate `{/* Combined Map Wrapper */}` comment; three non-memoized inline arrow functions passed as props to CampusMapHUD (`onStartNavigation`, `onStopNavigation`, `onClearExternalPlace`) — memoized with `useCallback`; inaccessible `MapPageSkeleton` missing ARIA semantics; `position-editor/page.tsx` using non-MQ semantic Tailwind classes; hardcoded hex `bg-[#d2e3fc] dark:bg-[#1a3a5c]` in Google Maps selected-building highlight; category displayed via manual JS capitalization instead of i18n via `BUILDING_CATEGORY_LABELS`; hardcoded `'#4285F4'` hex in CampusMap SVG fill → replaced with `var(--mq-primary)`.
- **Files Changed:** `features/map/components/MapClient.tsx`, `features/map/components/CampusMap.tsx`, `features/map/components/CampusMapHUD.tsx`, `features/map/components/MapPageSkeleton.tsx`, `app/map/position-editor/page.tsx`.
- **Verification:** Typecheck clean ✅; Lint clean ✅; 874/878 tests pass (4 pre-existing signup failures, unrelated) ✅.
- **Follow-ups:** None.

### 2026-04-06 (Australia/Sydney) — Calendar

**Raouf:**

- **Scope:** Calendar Page Bug Hunt & Production Hardening
- **Summary:** Reviewed all 6 calendar files. Found and fixed 10 issues: view-toggle buttons calling `setView` directly (broke URL sync) → switched to `handleViewChange`; `isToday` variable shadowing in mobile day row; timezone bug in todo form date construction (`new Date(dateString)` parses UTC); event highlight effect missing `processedRef` guard (re-fired on every store refresh); dead `hours >= 24` condition in `computeCurrentTimePosition`; duplicate supabase imports; hardcoded `'#10b981'` hex colour; inaccessible loading skeleton in `page.tsx`; redundant `role="main"` on `<main>`; mobile day buttons with no `aria-label`. Also memoized 9 local handler functions and added `aria-pressed` to view toggle buttons.
- **Files Changed:** `app/calendar/page.tsx`, `app/calendar/CalendarClient.tsx`, `features/calendar/hooks/useCalendarView.ts`, `features/calendar/hooks/useCalendarHighlights.ts`, `features/calendar/hooks/useCalendarData.ts`, `features/calendar/hooks/useCalendarDialogs.ts`.
- **Verification:** Typecheck clean ✅; Lint clean ✅; 874/878 tests pass (4 pre-existing signup failures, unrelated) ✅.
- **Follow-ups:** None.

### 2026-04-06 (Australia/Sydney) — Home

**Raouf:**

- **Scope:** Home Page Bug Hunt & Production Hardening
- **Summary:** Deep-reviewed all 7 home page files (app/page.tsx, app/home/page.tsx, HomeClient.tsx, loading.tsx, AuthRedirectHandler.tsx, and features/home hooks + components). Found and fixed 9 issues: duplicate ARIA landmark labels, unsafe `window.location.href` navigation in error state, `supabase` client recreated on every render in AuthRedirectHandler, two unused Zustand store subscriptions causing needless re-renders in `useHomeData`, `displayName` IIFE not memoized in `useHomeUser`, `motion` bypassing `LazyMotion` in `WeekHeatStrip`, inaccessible skeleton in `loading.tsx`, and dead fallback branch in `WelcomeHeader`.
- **Files Changed:** `app/home/HomeClient.tsx`, `app/home/loading.tsx`, `app/AuthRedirectHandler.tsx`, `features/home/hooks/useHomeData.ts`, `features/home/hooks/useHomeUser.ts`, `features/home/components/WeekHeatStrip.tsx`, `features/home/components/WelcomeHeader.tsx`.
- **Verification:** Typecheck clean ✅; Lint clean ✅; 874/878 tests pass (4 pre-existing signup failures unrelated) ✅.
- **Follow-ups:** None.

### 2026-04-05 (Australia/Sydney)

**Raouf:**

- **Scope:** Fix Select Dropdowns Not Opening Inside Dialogs
- **Summary:** Diagnosed and fixed two root causes preventing Radix Select dropdowns from opening inside dialogs. (1) `SelectContent` had `z-50` while Dialog uses `z-[70]`, causing portals to render behind the overlay. Fixed by bumping to `z-[80]`. (2) `ReminderModal` called `e.preventDefault()` unconditionally in `onPointerDownOutside`/`onInteractOutside`, blocking Select portal interactions. Fixed by guarding against `[data-radix-popper-content-wrapper]` targets.
- **Files Changed:** `components/ui/select.tsx`, `components/ui/ReminderModal.tsx`.
- **Verification:** Typecheck clean ✅; Lint clean ✅; 876/878 tests pass (2 pre-existing signup failures unrelated) ✅.
- **Follow-ups:** None.

### 2026-04-07 (Australia/Sydney)

**Raouf:**

- **Scope:** CI/CD Test Suite Remediation
- **Summary:** Fixed four critical test failures in the authentication pipeline. Corrected `app/auth/callback/route.ts` to honor the `redirectTo` parameter during email verification (allowing users to land on `/map` or `/home` after signing in). Aligned `app/api/auth/signup/route.ts` with security mandates and existing test expectations by ensuring "already registered" attempts return a `200 OK` generic success message, preventing account enumeration.
- **Files Changed:** `app/auth/callback/route.ts`, `app/api/auth/signup/route.ts`.
- **Verification:** Successfully ran the full test suite locally (878 tests passed across 94 files); specific regression tests for auth callback redirects and signup enumeration confirmed passing.
- **Follow-ups:** None.

### 2026-04-01 (Australia/Sydney)

**Raouf:**

- **Scope:** Git Rebase & Documentation Sync
- **Summary:** Resolved a complex 3-step interactive rebase conflict in `README.md`. Synthesized an integrated "Super README" by merging high-impact visual portfolio assets (Typing SVG, dynamic screenshots) from the local branch with the deep technical engineering narrative (Zero-Trust architecture, AI-native Codex workflows) from the documentation overhaul branch. Finalized the rebase and synchronized the repository state.
- **Files Changed:** `README.md`.
- **Verification:** Git rebase completed successfully; `README.md` structural integrity and link parity verified; repository status confirmed clean and synced with `origin/main`.
- **Follow-ups:** None.

### 2026-03-21 (Australia/Sydney)

**Raouf:**

- **Scope:** Full Project Documentation Portfolio Transformation
- **Summary:** Rewrote and structurally elevated the entire project documentation suite to transform the repository into a high-caliber portfolio piece. Unified the professional tone, highlighted complex engineering impact (Zero-Trust, Additive Merge, Fused Heading), and addressed implementation-aware gaps (Infrastructure limits, PII handling, Passkey scope).
- **Files Changed:** `README.md`, `TECHNICAL_EXPLANATION.md`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `docs/README.md`, `docs/architecture/ARCHITECTURE.md`, `docs/api/API_REFERENCE.md`, `docs/inventory/ROUTE_INVENTORY.md`, `docs/setup/ENVIRONMENT_SETUP.md`, `docs/university-integration-requirements.md`, `docs/operations/deployment-checklist.md`, `docs/security/SECURITY_POSTURE.md`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Documentation consistency audit completed; Markdown links verified; alignment with codebase implementation-details (Vercel limits, Redis requirement, PII logging) confirmed.
- **Follow-ups:** Monitor stakeholder feedback on the new "Campus OS" framing.

Raouf: 2026-03-17 (Australia/Sydney)
Scope: Rewrite README for Claude for OSS and OpenAI Codex for OSS Grant Applications
Summary: Replaced the internal-facing technical README with a grant-optimised public README. Added professional GitHub badges (MIT, CI/CD, TypeScript, Next.js, Supabase, tests, OSI, PRs). Structured four grant-targeted sections: (1) Ecosystem Impact framing the project as a modular "Campus OS" blueprint for Australian universities with layered architecture diagram and quantified impact table; (2) Security & Privacy Architecture covering Zero-Trust proxy middleware, Supabase RLS, PII minimisation, FIDO2/WebAuthn passkeys, and LLM OCR prompt injection mitigations; (3) AI-Native Maintainer Workflow documenting Claude 4.6 for schema mapping/architecture/security auditing and Codex for test generation/migrations/i18n, plus the Syllabus-as-Code documentation suite framing; (4) Project Governance with OSI-approved MIT licence confirmation, contributing pathways, P0–P2 roadmap (standalone extractor package, MCP server, institutional forks), and maintainer listing. Preserved all accurate technical facts from the prior README.
Files Changed: `README.md`, `CHANGELOG.md`, `AGENT.md`
Verification: Documentation-only change; no code modified ✅
Follow-ups: Once a GitHub repository URL is confirmed, update the badge URLs and clone command from placeholder to real org/repo path.

... [rest of AGENT.md content] ...

### 2026-07-22 (Australia/Sydney) — Formatting Baseline Repair

**Raouf:**

- **Scope:** Repaired pre-existing repository formatting drift before the Cloudflare Workers migration.
- **Summary:** Applied the repository Prettier configuration mechanically to the 47 files reported by the baseline `format:check`; no application logic or Cloudflare migration code was changed.
- **Verification:** `npm run check` passed.
- **Follow-ups:** None.

### 2026-07-22 (Australia/Sydney) — Cloudflare Sharp Advisory Risk Gate

**Raouf:**

- **Scope:** Added a deterministic, time-limited security exception for the exact upstream Sharp advisory observed during the Cloudflare Workers migration, while preserving a hard deployment block.
- **Summary:** Tracked full and production npm audit evidence plus exact Sharp dependency paths; added a fail-closed Node gate and 11 deterministic negative/positive tests; separated the local migration audit exception from Worker reachability; and required valid `proven-absent` OpenNext bundle/metafile evidence before every Cloudflare preview, upload, or deploy command. No Sharp override, forced audit fix, or Next downgrade was introduced.
- **Files Changed:** `artifacts/security/*`, `tools/security/check-sharp-risk.mjs`, `tools/security/check-sharp-risk.test.mjs`, `docs/security/sharp-cloudflare-risk-gate.md`, `docs/operations/deployment-checklist.md`, `.gitignore`, `package.json`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22 focused gate tests, formatting, typecheck, secret scan, and local audit-exception gate passed. The deployment gate intentionally failed because Worker reachability remains `unproven` after OpenNext stopped before output on missing `open-next.config.ts`.
- **Follow-ups:** Complete the remaining OpenNext migration, regenerate bundle/metafile reachability evidence, and re-evaluate compatible upstream releases no later than 2026-08-22 Australia/Sydney. Preview/public deployment and production cutover remain prohibited.

### 2026-07-22 (Australia/Sydney) — Sharp Risk-Gate Review Closure

**Raouf:**

- **Scope:** Closed the security review findings against the Cloudflare Sharp advisory gate without relaxing the deployment block.
- **Summary:** Replaced declared reachability trust with an independent scan of the current `.open-next` runtime files and all discovered esbuild metafiles; retained hashes only as freshness evidence; gated exact Next/OpenNext/Wrangler registry provenance and integrity; made the entire audit graph fail closed while leaving unrelated advisory sources visible; bound separate preview/production evidence to exact build commands; and enforced build→gate→action for scheduled development and both dry-run paths as well as preview/upload/deploy.
- **Files Changed:** `tools/security/check-sharp-risk.mjs`, `tools/security/check-sharp-risk.test.mjs`, `package.json`, `.gitignore`, `artifacts/security/sharp-worker-reachability*.json`, `docs/security/sharp-cloudflare-risk-gate.md`, `docs/operations/deployment-checklist.md`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** 17 deterministic Node 22 tests cover forged absent evidence with Sharp in runtime/metafile data, provenance drift, malformed/expanded audit graphs, build-profile identity, freshness, and every Worker execution script. Formatting, typecheck, secrets, and the local audit exception passed; preview and production deployment gates remain blocked on `unproven`.
- **Follow-ups:** Complete and independently scan both build profiles after the missing OpenNext migration configuration is implemented. Do not preview, dry-run, schedule, upload, deploy, or cut over before the matching gate derives `proven-absent`.

### 2026-07-22 (Australia/Sydney) — Sharp Evidence-Schema Review Closure

**Raouf:**

- **Scope:** Closed the remaining exact-graph and reachability-schema findings from the second Sharp gate review.
- **Summary:** Added exact `effects` reverse-edge allowlists and bidirectional reciprocity checks for every Sharp-linked `via` edge; enforced status-specific `matches`, `proofGap`, build-result, output, and hash invariants; and added a complete clean-bundle `authorizeDeployment()` positive test so authorization—not only component checks—is proven.
- **Files Changed:** `tools/security/check-sharp-risk.mjs`, `tools/security/check-sharp-risk.test.mjs`, `docs/security/sharp-cloudflare-risk-gate.md`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** 19/19 focused Node 22 tests passed, including effects removal/addition/malformed/non-reciprocal cases, contradictory reachability metadata, and integrated clean authorization. Formatting, typecheck, secrets, and audit exception passed; preview and production remain blocked as `unproven`.
- **Follow-ups:** No review finding remains open. Deployment still requires the missing OpenNext migration tasks and independently derived `proven-absent` evidence for the matching build profile.

### 2026-07-22 (Australia/Sydney) — Cloudflare Worker Configuration Scaffolding

**Raouf:**

- **Scope:** Added the local configuration contracts required for the OpenNext/Cloudflare migration without activating a Worker or production schedules.
- **Summary:** Added the Wrangler preview/production configuration, OpenNext default configuration, static asset cache headers, local environment template, generated binding declarations, and configuration tests. Isolated generated Workerd runtime declarations in a strict dedicated Cloudflare TypeScript project so they cannot alter the DOM/Next application type program. Preview and production crons remain empty; the planned `IMAGES` binding is configuration-only because Cloudflare Images enablement and billing acceptance have not been verified.
- **Files Changed:** `wrangler.jsonc`, `open-next.config.ts`, `custom-worker.ts`, `cloudflare-env.d.ts`, `.dev.vars.example`, `public/_headers`, `.gitignore`, `config/ts/tsconfig.json`, `config/ts/tsconfig.cloudflare.json`, `package.json`, `tests/cloudflare/*`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22 type generation, focused configuration tests, main and Cloudflare typechecks, formatting, and secret scan passed. Existing build→Sharp-gate→action scripts were preserved. No preview, dry-run, upload, deploy, or production cutover was run.
- **Follow-ups:** Before any deployment, confirm Cloudflare Images is enabled for the target account and the owner accepts transformation billing; then independently derive the matching Sharp reachability evidence. Task 8 must replace the temporary 503 worker stub.

### 2026-07-22 (Australia/Sydney) — Cloudflare Worker Configuration Review Remediation

**Raouf:**

- **Scope:** Closed the Task 4 quality-gate and route-regression review findings without changing deployment behaviour or static cache policy.
- **Summary:** Added the isolated Worker typecheck to the global `npm run check` sequence immediately after the main Next typecheck, protected by an exact script contract test. Tightened the Worker route test to require the exact approved static bypass list and explicitly reject dynamic HTML/RSC, API, auth, and `/_next/image` bypass patterns. The plan-mandated immutable caching for stable-name icon/image paths was left unchanged for final branch review.
- **Files Changed:** `package.json`, `tests/cloudflare/worker-config.test.ts`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22 focused Cloudflare tests, global check-contract assertion, main and Worker typechecks, formatting, and secret scan passed. The Sharp audit scripts and build→gate→action ordering were not changed.
- **Follow-ups:** The Cloudflare Images enablement/billing and Sharp deployment-evidence blockers remain. Keep the immutable icon/image-cache policy as specified unless a separately reviewed production policy changes it.

### 2026-07-22 (Australia/Sydney) — Cloudflare Edge Middleware Bridge

**Raouf:**

- **Scope:** Restored the Edge-compatible Next.js middleware convention and added fail-closed API authentication coverage during the Cloudflare Workers migration.
- **Summary:** Renamed the unchanged request policy from `lib/proxy.ts` to `lib/middleware.ts`, exported it through the root `middleware.ts` convention, removed both obsolete proxy entry points, and migrated the MFA regression suite without changing CSP, CSRF, route, session, email-verification, or MFA branches. Added an independent inventory of every `app/api/**/route.ts` file with an explicit eight-prefix public allowlist synchronized to middleware policy and actionable failures for uncovered protected routes. The inventory exposed `/api/navigate` and `/api/security/check-password-breach`; a preliminary security commit added route-level `requireAuth` wrappers while preserving their existing origin, limiter, body-validation, upstream, and success behavior.
- **Files Changed:** `middleware.ts`, `lib/middleware.ts`, `proxy.ts` (deleted), `lib/proxy.ts` (renamed), `tools/proxy/proxy.ts` (deleted), `tests/api/middleware.mfa.test.ts`, `tests/security/api-auth-coverage.test.ts`, `app/api/navigate/route.ts`, `app/api/security/check-password-breach/route.ts`, `tests/api/protected-route-auth.test.ts`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22 focused middleware/MFA, protected-route, API-inventory, and Worker-contract tests passed (16/16); Sharp gate tests passed (19/19); main and isolated Worker typechecks, formatting, secret scan, and local Sharp audit-exception gate passed. Policy comparison against `5a6dee08` confirmed the middleware implementation changed only its exported function name. The runtime compatibility audit still fails only on the expected remaining DNS lookup in `app/api/security/scan-headers/route.ts` and Node crypto imports in `lib/security/csp.ts` and `lib/security/csrf.ts`.
- **Follow-ups:** Replace the recorded DNS and Node crypto dependencies in their separately scoped migration tasks. Cloudflare preview, upload, dry-run, deploy, and production cutover remain blocked by the existing Sharp reachability gates and were not run.

### 2026-07-22 (Australia/Sydney) — Middleware Auth-Coverage Review Remediation

**Raouf:**

- **Scope:** Closed both important Task 5 security-review findings without changing the Cloudflare static-asset routing contract or existing Sharp deployment gates.
- **Summary:** Replaced token/regex API inventory with per-exported-HTTP-method TypeScript AST and reachable-call analysis. The analyzer follows only returned/invoked local or directly imported handlers, supports aliases and re-exports, validates trusted `requireAuth`/`requireAuthWithRateLimit` calls, proves reachable fail-closed `auth.getUser()` checks, and requires real configured secret comparisons. Seventeen adversarial tests reject comments, strings, dead helpers, unused imports, sibling-method leakage, unrelated or shadowed guard calls, unenforced secrets, missing session denial, and guards reached only after an early success path. The resulting inventory found three real gaps: admin GET/POST and gamification GET now use route-level `requireAuth` wrappers around unchanged handlers. Replaced suffix-wide middleware exclusions with explicit known static namespaces/files; API, auth callback, RSC, `/_next/image`, favicon-collision, and extension-shaped dynamic paths now execute middleware. Wrangler `assets.run_worker_first` remained unchanged.
- **Files Changed:** `middleware.ts`, `lib/middleware.ts`, `app/api/admin/update-building-positions/route.ts`, `app/api/gamification/route.ts`, `tests/security/api-auth-analyzer.ts`, `tests/security/api-auth-analyzer.test.ts`, `tests/security/api-auth-coverage.test.ts`, `tests/api/middleware.matcher.test.ts`, `tests/api/protected-route-auth.test.ts`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22 focused middleware, matcher, protected-route, per-method inventory, adversarial analyzer, and Worker-contract tests passed (54/54). Main and isolated Worker typechecks, lint, formatting, secret scan, 19 Sharp gate tests, and the local Sharp audit-exception gate passed. The runtime audit remains non-zero only for the same expected DNS lookup in `app/api/security/scan-headers/route.ts` and Node crypto imports in `lib/security/csp.ts` and `lib/security/csrf.ts`.
- **Follow-ups:** Resolve the three recorded runtime dependencies in later migration tasks. No preview, upload, dry-run, deploy, production cutover, or Wrangler static bypass change occurred.

### 2026-07-22 (Australia/Sydney) — Auth Analyzer Binding Review Closure

**Raouf:**

- **Scope:** Closed the remaining Task 5 analyzer false-positive findings without changing route, middleware, Worker, or deployment behavior.
- **Summary:** Replaced name-based trust with exact import and lexical-binding resolution for auth wrappers, Supabase server clients, denial helpers, NextResponse, CSRF traversal, and global process/Boolean use. Session evidence now requires an awaited, destructured result from the project server client followed immediately by a correctly polarized error-or-missing-user 401/403 denial. Secret evidence now requires one configured CRON/ADMIN secret, the current request Authorization header, an exact bearer mismatch denial before work, and trusted 401/403 output. Forty-three analyzer tests cover property calls, unused and wrong-module imports, local shadows, malformed session checks, intervening work/success, and self/reversed/unrelated/two-secret comparisons.
- **Files Changed:** `tests/security/api-auth-analyzer.ts`, `tests/security/api-auth-analyzer.test.ts`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22 focused Task 5 tests passed (80/80), including all 47 methods across 26 protected routes. Main and Worker typechecks, lint, formatting, secret scan, 19 Sharp gate tests, and the audit exception passed. Runtime compatibility remains non-zero only for the same three DNS/Node-crypto blockers.
- **Follow-ups:** Resolve the recorded runtime blockers in later migration tasks. No preview, dry-run, upload, deploy, or production cutover was run.

### 2026-07-22 (Australia/Sydney) — Auth Analyzer Final Fail-Closed Closure

**Raouf:**

- **Scope:** Closed the final Task 5 indirect-handler and direct-session dominance findings with a smaller fail-closed analyzer model.
- **Summary:** Removed arbitrary returned-helper traversal; exact immutable export aliases and resolvable re-exports are the only indirect handler forms. Unresolved/non-exported symbols and parameter, block, catch, or local shadows fail closed. Direct session proof is now limited to a first-operation sequence of immutable awaited project-client creation, awaited/destructured `getUser`, and an immediate exact 401/403 error-or-missing-user denial. Notification PATCH is an exact alias of its authenticated PUT handler. The four protected WebAuthn credential/registration methods now authenticate before deriving client IP or invoking limiters, so unauthenticated requests cannot touch limiter state; authenticated rate-limit behavior remains unchanged.
- **Files Changed:** API-auth analyzer/tests, notification PATCH alias/test, WebAuthn credentials and registration routes/tests, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22 analyzer tests passed (61/61); six-file Task 5 tests passed (98/98); route regressions passed (19/19); all 47 protected methods across 26 routes remain covered. Main/Worker typechecks, lint, formatting, 818-file secret scan, 19 Sharp tests, and the audit exception passed. Runtime compatibility still reports only the same three DNS/Node-crypto blockers.
- **Follow-ups:** Resolve the recorded runtime blockers in later migration tasks. No preview, dry-run, upload, deploy, or production cutover was run.

### 2026-07-22 (Australia/Sydney) — Mutable Callable and Exception-Path Closure

**Raouf:**

- **Scope:** Closed the remaining Task 5 mutable-callable and try/catch/finally analyzer findings with strict rejection rules.
- **Summary:** Function/arrow variables are analyzable only when declared `const`; function declarations, const callables, and immutable aliases are discarded from trust if a complete module scan finds assignment, compound assignment, update, destructuring/property write, loop write, or rebinding to the symbol. Direct session evidence inside `try` is rejected entirely. The sync POST plus four protected WebAuthn credential/registration methods now perform their unchanged server-client/getUser/denial sequence before entering `try`; limiter and protected work remain inside existing error handling. New sync and WebAuthn regressions prove unauthenticated requests stop before limiter work.
- **Files Changed:** API-auth analyzer/tests, sync and WebAuthn routes/tests, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22 analyzer tests passed (75/75); six-file Task 5 tests passed (112/112); route behavior tests passed (20/20); all 47 protected methods across 26 routes remain covered. Main/Worker typechecks, lint, formatting, 818-file secret scan, 19 Sharp tests, and the audit exception passed. Runtime compatibility still reports only the same three DNS/Node-crypto blockers.
- **Follow-ups:** Resolve the recorded runtime blockers in later migration tasks. No preview, dry-run, upload, deploy, or production cutover was run.

### 2026-07-22 (Australia/Sydney) — Complete HTTP Export Inventory Closure

**Raouf:**

- **Scope:** Closed the final narrow Task 5 omission for unresolved named HTTP exports in mixed-method route files.
- **Summary:** Syntax-level HTTP method presence is now recorded independently from callable resolution. Unresolved external named re-exports, unresolved imported/local exports, uninitialized or destructured exported method bindings, and namespace exports named as HTTP methods remain in coverage as explicit uncovered targets. A guarded local GET can no longer hide an unresolved external POST. Type-only exports remain excluded because they create no runtime handler. All prior exact binding, immutable callable, no-generic-helper, session-dominance, matcher, and route-ordering rules remain unchanged.
- **Files Changed:** `tests/security/api-auth-analyzer.ts`, `tests/security/api-auth-analyzer.test.ts`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22 analyzer tests passed (80/80); six-file Task 5 tests passed (117/117); route behavior tests passed (20/20); all 47 protected methods across 26 current routes remain covered. Main/Worker typechecks, lint, formatting, 819-file secret scan, 19 Sharp tests, and the audit exception passed. Runtime compatibility still reports only the same three DNS/Node-crypto blockers.
- **Follow-ups:** Resolve the recorded runtime blockers in later migration tasks. No preview, dry-run, upload, deploy, or production cutover was run.

### 2026-07-22 (Australia/Sydney) — Edge Middleware Web Crypto Migration

**Raouf:**

- **Scope:** Removed the remaining Node crypto dependencies from the Cloudflare Edge middleware import graph without changing CSP or CSRF wire contracts.
- **Summary:** CSP nonce generation now uses Web Crypto for 16 random bytes and browser-safe base64 encoding. CSRF generation now uses Web Crypto for 32 random bytes and lowercase hexadecimal encoding; equal-length token comparison performs one XOR operation for every character before deciding equality. Added a policy-file guard against Node-only built-ins and strengthened existing CSP/CSRF tests for exact output shape and 64-call uniqueness.
- **Files Changed:** `lib/security/csp.ts`, `lib/security/csrf.ts`, `tests/unit/security/csp.test.ts`, `tests/security/csrf-critical.test.ts`, `tests/cloudflare/middleware-edge-compat.test.ts`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22 targeted CSP, CSRF, MFA middleware, and Edge compatibility tests passed (47/47). Main and Worker typechecks, lint, full formatting, 819-file secret scan, 19 Sharp gate tests, and the local Sharp audit exception passed. The runtime audit now reports only the separately scoped `dns.lookup` blocker in `app/api/security/scan-headers/route.ts`.
- **Follow-ups:** Replace the DNS lookup in its dedicated migration task. No preview, dry-run, upload, deployment, or production cutover was run; Sharp deployment gates remain fail closed.

### 2026-07-22 (Australia/Sydney) — Platform-Neutral Cloudflare Runtime Detection

**Raouf:**

- **Scope:** Centralized deployment platform, environment, application-origin, and trusted client-IP detection for the local Cloudflare Workers migration while retaining Vercel rollback behavior.
- **Summary:** Added strict Cloudflare/Vercel/local runtime helpers; normalized configured application URLs to HTTP(S) origins; rejected malformed, credential-bearing, non-HTTP, and scheme/path-shaped host values; replaced Vercel-only production checks across rate limiting, CSRF, API errors, authentication, and server/Edge Sentry configuration; centralized verification/reset and signup origins; and removed the duplicate API-middleware IP parser. Cloudflare production trusts `cf-connecting-ip` first and does not trust caller-supplied `x-forwarded-for` by default. Vercel production headers and public client-side Sentry rollback tags remain supported.
- **Files Changed:** `lib/platform/runtime.ts`, platform/security/service/API/Sentry consumers, focused platform/IP/CSRF/rate-limit/email tests, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22 focused and affected regression tests passed (72/72); application and Worker typechecks, lint, full formatting, 820-file secret scan, 19 Sharp-gate tests, and the local Sharp audit exception passed. Runtime compatibility now fails only on the separately scoped `dns.lookup` use in `app/api/security/scan-headers/route.ts`.
- **Follow-ups:** Replace the DNS lookup in its dedicated task. No preview, dry-run, upload, deployment, or production cutover was run; the Sharp reachability deployment gates remain fail closed.

### 2026-07-22 (Australia/Sydney) — Platform Runtime Email-Safety Review Closure

**Raouf:**

- **Scope:** Closed both Important Task 7 review findings and added behavioral evidence for the practical coverage observation.
- **Summary:** Restored email-specific rejection of raw `example.com`, `your-`, and `paste` application-origin placeholders before normalization can discard path/query markers. Missing, invalid, credential-bearing, and placeholder origins now keep `isEmailServiceConfigured()` non-throwing and return the existing unsuccessful send result instead of rejecting. Verification and password-reset orchestrators therefore delete their newly inserted undelivered token records. Added behavioral tests for both cleanup lanes, Cloudflare preview precedence under `NODE_ENV=production`, credential-bearing origin rejection, database-error redaction, and the unchanged API middleware IP-plus-path rate-limit key.
- **Files Changed:** `lib/services/emailService.ts`, focused platform/email/token-cleanup/API behavior tests, `AGENT.md`, and `CHANGELOG.md`.
- **Verification:** Node 22 affected tests passed (87/87); application and Worker typechecks, lint, full formatting, 822-file secret scan, 19 Sharp-gate tests, and the local Sharp audit exception passed. Runtime compatibility remains non-zero only for the separately scoped `dns.lookup` use in `app/api/security/scan-headers/route.ts`.
- **Follow-ups:** Replace the DNS lookup in its dedicated task. No preview, dry-run, upload, deployment, production cutover, or push was performed; Sharp reachability deployment gates remain fail closed.

### 2026-07-22 (Australia/Sydney) — Worker-Compatible DNS Header Scanning

**Raouf:**

- **Scope:** Replaced the security-header scanner's unsupported `dns.lookup()` dependency and made runtime compatibility a permanent global quality gate.
- **Summary:** Added a Worker-compatible dual-stack resolver using `resolve4` and `resolve6`, preserving literal-IP targets, deduplicating answers, tolerating one unavailable family, and failing closed on empty or malformed results. The protected scan route now rejects any private, loopback, link-local, unique-local, or private IPv4-mapped IPv6 answer, including mixed public/private sets and alternate IPv6 spellings. Route regressions preserve authentication and rate-limit dominance and prove the outbound HEAD request uses `redirect: 'manual'` exactly once. The API reference records the DNS validation/fetch TOCTOU boundary honestly: these controls reduce SSRF exposure but do not mathematically eliminate DNS rebinding.
- **Files Changed:** `lib/security/dns-resolution.ts`, `app/api/security/scan-headers/route.ts`, DNS/route/runtime/Worker configuration tests, `package.json`, `docs/api/API_REFERENCE.md`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Node 22 focused DNS, route, runtime, Worker-contract, protected-route, and auth-inventory tests passed (33/33). Main and Worker typechecks, lint, full formatting, 825-file secret scan, 19 Sharp-gate tests, local Sharp audit exception, and the Cloudflare runtime audit passed.
- **Follow-ups:** Cloudflare public-fetch restrictions remain part of the production SSRF boundary. No preview, dry-run, upload, deployment, production cutover, or push was performed; Sharp reachability deployment gates remain fail closed.

### 2026-07-22 (Australia/Sydney) — OpenNext Routing Unblock and path-to-regexp Override Scoping

**Raouf:**

- **Scope:** Repaired a total Worker routing failure in which every request returned HTTP 500 under `workerd`, and excluded generated Worker output from the formatting gate.
- **Summary:** The pre-existing blanket `path-to-regexp: ^8.3.0` override forced `@opennextjs/aws`, which declares `^6.3.0`, onto the v8 parser. OpenNext's `getNextConfigHeaders()` re-parses the raw Next.js `headers()` source with its own copy, outside a try/catch, so the v8 lexer rejected the v6-dialect `/(.*)` source and threw `PathError` before any route ran. The override is now scoped so `@opennextjs/aws` resolves `path-to-regexp@6.3.0` — itself the patched release for CVE-2024-45296 — while its nested `express`/`router` subtree and Wrangler stay on 8.4.2. The Next.js source string is unchanged: `/{*path}` and `/*path` are rejected by Next's own v6 parser at build time, so no single source satisfies both majors. `.open-next` and `.wrangler` were added to the Prettier ignore list because `npm run check` failed for anyone who had built the Worker.
- **Files Changed:** `package.json`, `package-lock.json`, `config/next/next.config.ts`, `config/prettier/.prettierignore`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Local `wrangler dev` serves `/`, `/login`, `/privacy`, `/terms`, `/api/health`, and `/manifest.webmanifest` at 200; `/calendar` returns 307 to `/login?redirectTo=%2Fcalendar`; CSP nonce, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` are present on HTML. Resolution confirmed as `@opennextjs/aws` → 6.3.0 and `express`/`router`/Wrangler → 8.4.2. `npm audit --omit=dev --audit-level high` reports no `path-to-regexp` advisory; the 5 remaining high findings are the pre-existing Sharp/libvips advisories governed by the Sharp risk gate. Secret scan, runtime audit, formatting, both typechecks, lint, and 1063 tests passed.
- **Follow-ups:** Report upstream that `match(source)` in `getNextConfigHeaders()` and `handleRewrites()` sits outside the try/catch, so one unparsable source hard-fails every route. `redirects()` and `rewrites()` re-parse raw sources identically and would fail the same way if this override regressed.

### 2026-07-22 (Australia/Sydney) — Cloudflare Worker Cron Migration

**Raouf:**

- **Scope:** Replaced the three Vercel Cron schedules with a Cloudflare `scheduled()` handler and promoted `custom-worker.ts` from build stub to the real OpenNext entry point.
- **Summary:** Added a pure `runScheduledJob()` dispatcher mapping each cron expression to its existing `CRON_SECRET`-protected cleanup route, invoked internally through the OpenNext fetch handler rather than over the public internet. It fails closed when `CRON_SECRET` is absent, empty, or whitespace-only, rejects unknown cron expressions before issuing any request, and throws on a non-successful cleanup so failures surface in Cron Events instead of being recorded as success. The thrown message carries cron, route, and status but deliberately omits the upstream response body, which can echo the bearer credential into the log stream. Secret bindings are typed through a separate `cloudflare-env.secrets.d.ts` declaration merge so `npm run cf:typegen` stays reproducible, and the Worker tsconfig now resolves `@/lib/*`. Cron triggers remain `[]` in both Wrangler environments.
- **Files Changed:** `lib/cloudflare/scheduled.ts`, `custom-worker.ts`, `cloudflare-env.secrets.d.ts`, `config/ts/tsconfig.cloudflare.json`, `tests/cloudflare/scheduled.test.ts`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** 13 new dispatcher and worker-contract tests passed, including a guard that the mapping still equals the schedules `vercel.json` owns. `npm run cf:build` produced `.open-next/worker.js` from the real entry point. In local `workerd` with `--test-scheduled`, all three cron expressions dispatched to their correct routes and an unknown expression failed visibly. Against placeholder Supabase credentials the cleanup routes returned 503 `Not configured` — not 401 — proving the internal POST cleared both `CRON_SECRET` authentication and middleware CSRF; a wrong or missing secret returned 401, and a correct secret sent with a cross-origin `Origin` header was rejected 403. Secret scan, runtime audit, formatting, both typechecks, lint, and 1063 tests passed.
- **Follow-ups:** A successful 200 cleanup run is unproven because no Supabase credentials exist in this worktree; record it in the Task 16 preview parity matrix against real preview infrastructure. No preview, dry-run, upload, deployment, production cutover, or push was performed; Sharp reachability deployment gates remain fail closed.

### 2026-07-22 (Australia/Sydney) — Worker Dependency Proof, Environment Validation, and Size Gate

**Raouf:**

- **Scope:** Added the Workerd dependency import proof, platform-neutral deployment environment validation, and the Worker compressed-upload budget gate.
- **Summary:** A dependency smoke test proves the six server packages bundled into the Worker — SimpleWebAuthn server, Supabase SSR and JS, Resend, uuid, and web-push — still resolve and expose the entry points the application calls; no package needed replacement. `tools/deployment/check-required-env.mjs` validates required public and server variables, URL shape, HTTPS and non-example production origins, the canonical production WebAuthn RP ID and origin, and at least one complete distributed rate-limit backend, reporting variable names only. `tools/vercel/check-required-env.mjs` was deliberately left intact rather than reduced to a delegating wrapper: it interrogates the Vercel project through the Vercel CLI, a different check from validating the current process environment, and collapsing the two would weaken rollback validation. The backend list also accepts Vercel KV, which `getStore()` supports. `tools/cloudflare/check-worker-size.mjs` enforces a 9.5 MiB hard limit with a 2.8 MiB free-plan warning.
- **Files Changed:** `tools/deployment/check-required-env.mjs`, `tools/cloudflare/check-worker-size.mjs`, `tests/cloudflare/node-compatibility.test.ts`, `tests/cloudflare/required-env.test.ts`, `tests/cloudflare/worker-size.test.ts`, `package.json`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** 26 new tests passed across dependency imports, environment validation, and size parsing, including boundary cases at both thresholds and an assertion that no configured value is ever echoed. Secret scan (832 files), runtime audit, formatting, both typechecks, lint, and 1089 tests passed.
- **Follow-ups:** The real Worker gzip size is unmeasured because `npm run cf:dry-run` is blocked by the Sharp deployment gate. No preview, dry-run, upload, deployment, production cutover, or push was performed.

### 2026-07-22 (Australia/Sydney) — Sharp Reachability Gate Precision and Per-Build Recording

**Raouf:**

- **Scope:** Made the Sharp deployment gate detect the Sharp package rather than the word "sharp", and made it usable per build so it stops permanently blocking every Cloudflare command.
- **Summary:** The gate classified any artifact whose bytes matched `sharp|libvips|@img` as runtime-reachable, producing 13 blocking false positives against the real Worker output — the ua-parser device brand `"Sharp"`, the HTML entity `&sharp;`, the Leaflet CSS class `leaflet-routing-icon-sharp-right`, and the `Material Icons Sharp` font name. A blocking verdict now requires the package itself: a `node_modules/sharp` or `node_modules/@img/*` directory, a `sharp`/`libvips` native binary, or a genuine module specifier, and a specifier only blocks when its file is in the esbuild bundle graph. This surfaced a real finding the old scan buried: `next/dist/server/image-optimizer.js` contains `require('sharp')` but is absent from all 586 bundle-graph inputs, unreferenced by `worker.js`, and never uploaded — now recorded explicitly as unbundled scaffolding. A new `security:sharp:record-reachability` step runs between build and gate because the non-deterministic Next.js build meant reviewed digests could never match the artifact being uploaded; it can only certify absence and exits non-zero on any runtime or uncertain match.
- **Files Changed:** `tools/security/check-sharp-risk.mjs`, `tools/security/check-sharp-risk.test.mjs`, `artifacts/security/sharp-worker-reachability.json`, `tests/cloudflare/required-env.test.ts`, `package.json`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** 27 gate tests passed, including regressions pinning all four false positives as non-blocking and asserting a real package directory, an `@img` native package, `.node`/`.wasm`/`.so` libvips binaries, and a bundled `require('sharp')` each still block. `npm run cf:dry-run` now completes; measured Worker compressed upload is 6799.23 KiB, below the 9.5 MiB hard limit and above the 2.8 MiB free-plan threshold. Secret scan (837 files), formatting, both typechecks, lint, and 1089 tests passed.
- **Follow-ups:** Workers Paid is required at roughly 2.4x the free-plan limit; record this in the cutover approval. Wiring the recorder into the gated scripts trades human-review value for a gate that runs per build; split it back out if the team wants explicit review.

### 2026-07-22 (Australia/Sydney) — Cloudflare CI, Gated Deployment Workflow, and Preview Smoke Suite

**Raouf:**

- **Scope:** Added the required CI Worker build, the manually gated deployment workflow, and the automated public smoke suite.
- **Summary:** CI gained a `cloudflare-build` job that runs the runtime-compatibility audit and Sharp gate tests, builds and dry-runs the Worker, enforces the compressed-size budget, and uploads diagnostics; the pipeline result depends on it. `.github/workflows/cloudflare-deploy.yml` is `workflow_dispatch` only, routes production through the protected `cloudflare-production` environment, refuses production from any branch but `main`, and runs the quality gate, environment validation, dry-run, and size gate before deploying. The dispatch input is never interpolated into a shell command. `tools/cloudflare/smoke.mjs` checks public pages, health, manifest content type, immutable asset caching, the protected-page redirect to login, and anonymous refusal on a protected API, requiring all six security headers on HTML.
- **Files Changed:** `.github/workflows/ci-cd.yml`, `.github/workflows/cloudflare-deploy.yml`, `tools/cloudflare/smoke.mjs`, `tests/cloudflare/ci-workflows.test.ts`, `tests/cloudflare/smoke-script.test.ts`, `package.json`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** 18 new tests passed covering workflow contracts and smoke behaviour, including that the deployment workflow is manual only, every secret comes from GitHub secrets, gate ordering precedes deploy, and the runner never logs a body or cookie. Run against a real local `workerd` instance serving the built Worker: 9/9 checks passed.
- **Follow-ups:** GitHub Environments, their variables, and the Cloudflare API token are not configured; the deployment workflow cannot run until an operator creates them.

### 2026-07-22 (Australia/Sydney) — Cloudflare Deployment, Cutover, and Rollback Documentation

**Raouf:**

- **Scope:** Documented the Cloudflare Workers deployment path and rewrote primary-infrastructure language across the repository, keeping Vercel documented as rollback hosting.
- **Summary:** Added a deployment guide (local development, build and verification commands, measured size budget, Sharp gate sequence, full variable table, production WebAuthn invariants, the three UTC cron schedules, gated deployment workflow), a cutover runbook (pre-cutover gate, DNS and email-record preflight, overlap-free scheduler transfer, domain attachment, authenticated verification), and a rollback runbook (stop conditions plus Worker-version and platform rollback paths). Added the preview parity matrix as an explicitly unexecuted template carrying the three known open items. `README.md` and `ARCHITECTURE.md` now name Cloudflare Workers via OpenNext as primary infrastructure; `resend-vercel-setup.md` became `resend-deployment-setup.md`; the deployment checklist gained a Cloudflare section; `.env.example` documents deployment-target variables and the canonical production WebAuthn values.
- **Files Changed:** four new `docs/operations/cloudflare-*.md` files, `docs/operations/resend-deployment-setup.md` (renamed), `docs/operations/deployment-checklist.md`, `docs/README.md`, `docs/architecture/ARCHITECTURE.md`, `docs/setup/ENVIRONMENT_SETUP.md`, `README.md`, `.env.example`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Every documented command was run in this session, so instructions match implemented behaviour. Formatting, secret scan (841 files), and 1107 tests passed; `check:i18n` exits 0 with pre-existing warnings. The stale-infrastructure grep returns nothing.
- **Follow-ups:** The preview test record is a template and must be completed against a real preview Worker before cutover approval.
