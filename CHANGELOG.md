# Changelog

All notable changes to this project will be documented in this file.

---

### Raouf: Sharp Evidence-Schema Review Closure — 2026-07-22

**Scope:** Closed the remaining reverse-edge and contradictory-evidence findings in the Sharp deployment gate.

**Summary:** The full six-package Sharp graph now gates exact `effects` sets and bidirectional reciprocity with every normalized `via` edge. Reachability evidence now has exact status-specific invariants: clean evidence requires empty string matches and no proof gap; reachable evidence requires matches; unproven evidence requires a proof gap and no output. The focused suite now proves a complete clean `authorizeDeployment()` success path and all new negative cases.

**Verification:** 19/19 Node 22 focused tests passed; format, typecheck, staged secret scan, and audit exception passed; preview and production gates remain expected failures on `unproven`.

**Follow-ups:** Deployment remains blocked until the OpenNext migration produces independently scanned, profile-matched `proven-absent` evidence.

---

### Raouf: Sharp Risk-Gate Review Closure — 2026-07-22

**Scope:** Closed all security review findings in the Cloudflare Sharp advisory release gate.

**Summary:** The gate now independently derives runtime reachability from current `.open-next` bytes and every actual esbuild metafile instead of trusting declared status/matches; SHA-256 remains freshness-only. Exact approved Next/OpenNext/Wrangler registry URLs and integrities are enforced, the full npm audit graph is structurally validated and traversed, preview/production evidence is command-bound, and scheduled development plus both dry-run scripts now use build→matching gate→action. The offline suite expanded to 17 adversarial cases.

**Verification:** Node 22 focused tests, formatting, typecheck, staged secret scan, and local audit-exception gate passed. Both deployment profiles remain intentionally blocked because reachability is `unproven`.

**Follow-ups:** Complete the missing OpenNext configuration and require independently derived `proven-absent` evidence for the exact preview or production build before any Cloudflare execution.

---

### Raouf: Cloudflare Sharp Advisory Risk Gate — 2026-07-22

**Scope:** Added a narrowly scoped upstream Sharp advisory exception for local Cloudflare migration work while retaining a fail-closed deployment gate.

**Summary:** Captured tracked full/production npm audits and exact dependency paths for `GHSA-f88m-g3jw-g9cj` (source `1124066`, High, `sharp <0.35.0`); added deterministic audit and Worker-reachability validation with 11 cases; wired every Cloudflare preview/upload/deploy script through the deployment gate; documented the 2026-08-22 Australia/Sydney expiry and exact unblock conditions. No forced Sharp override, forced audit fix, or Next downgrade was made.

**Verification:** Node 22 focused tests, formatting, typecheck, secret scan, and local audit-exception gate passed. The OpenNext build stopped before output because `open-next.config.ts` is not yet implemented, leaving reachability `unproven`; the deployment gate correctly failed and deployment remains prohibited.

**Follow-ups:** Complete the OpenNext migration, inspect `.open-next` and its esbuild metafile, record `proven-absent` Worker evidence, and reassess compatible upstream releases before expiry.

---

### Raouf: App-Icon Logo Rebrand — 2026-07-07

**Scope:** Replaced the Macquarie University crest logo with the new Syllabus Sync app-icon image across the entire app.

**Summary:** Cropped the supplied app-icon artwork (rounded-square, red/white building + book motif) into an edge-to-edge square master and regenerated the full PWA/favicon icon set (`favicon.ico`, `apple-touch-icon.png`, `icon-192/384/512.png`, `maskable-512.png`) from it. Repointed all ~25 code references — login, signup, header, sidebar, onboarding, reset-password, OG/Twitter meta images, the JSON-LD organization schema, and the push-notification icon fallback in both `lib/server/push.ts` and `lib/services/notificationService.ts` — from `/MQ_Logo_Final.png` to the new `/syllabus-sync-logo.png`, then deleted the old crest file. Updated `public/sw.js`'s precache list and push-notification fallback to the new path and bumped its cache versions (`syllabus-sync-v6` → `v7`, `-static-v6` → `-static-v7`, `-dynamic-v6` → `-dynamic-v7`) so installed service workers fetch the new assets instead of serving the stale crest from cache. Rewrote the `mqLogoAlt` translation value in all 35 locale files from a hardcoded "Macquarie University logo" translation to a `{{appName}}`-interpolated string (matching the existing `welcomeTo` pattern), and updated all 10 call sites to pass `{ appName: APP_CONFIG.name }`, so alt text now reads "Syllabus Sync Logo" (localized) instead of the old university-crest wording.

**Files Changed:** `public/syllabus-sync-logo.png` (new), `public/icons/icon-192.png`, `public/icons/icon-384.png`, `public/icons/icon-512.png`, `public/icons/maskable-512.png`, `public/apple-touch-icon.png`, `public/icons/apple-touch-icon.png`, `app/favicon.ico`, `public/MQ_Logo_Final.png` (deleted), `app/layout.tsx`, `app/home/page.tsx`, `app/calendar/page.tsx`, `app/map/page.tsx`, `app/feed/page.tsx`, `app/manage-profiles/layout.tsx`, `app/login/LoginClient.tsx`, `app/signup/SignupClient.tsx`, `app/onboarding/OnboardingClient.tsx`, `app/reset-password/reset-password-client.tsx`, `components/layout/Header.tsx`, `components/layout/Sidebar.tsx`, `lib/server/push.ts`, `lib/services/notificationService.ts`, `public/sw.js`, `locales/*/translations.json` (35 files).

**Verification:** `npm run check` passed (secrets, format, typecheck, lint, test, build) ✅; `npm run check:i18n` passed ✅; manually confirmed the new icon renders on `/login` and as the browser favicon ✅.

**Follow-ups:** None.

---

### Raouf: Formatting Baseline Repair — 2026-07-22

**Scope:** Pre-existing formatting-only baseline repair before the Cloudflare Workers migration.

**Summary:** Applied the repository Prettier configuration mechanically to the 47 files reported by the baseline `format:check`. No application logic or Cloudflare migration code changed.

**Verification:** `npm run check` passed.

**Follow-ups:** None.

---

### Raouf: CI/CD Test Suite Remediation — 2026-04-07

**Scope:** Resolved authentication pipeline test failures causing CI blockages.

1.  **Fixed Auth Redirect Logic:** Updated `app/auth/callback/route.ts` to correctly prioritize and honor the `redirectTo` parameter (e.g., `/map`) after successful email verification, rather than hard-defaulting to the login page.
2.  **Anti-Enumeration Compliance:** Modified `app/api/auth/signup/route.ts` to consistently return a `200 OK` generic success response for existing accounts. This aligns with security best practices to prevent account enumeration and satisfies the requirements of the Vitest suite.
3.  **Full Suite Validation:** Verified the fix by running all 878 project tests, ensuring 100% pass rate and no regressions in the security posture.

**Files Changed:**

- `app/auth/callback/route.ts`
- `app/api/auth/signup/route.ts`

**Verification:**

- `npm run test` (878/878 passed) ✅
- Manual verification of signup flow logic ✅

---

### Raouf: About, Contact, Terms & Privacy Pages Bug Hunt & Production Hardening — 2026-04-06

**Scope:** Bug fixes, SEO, accessibility, design token compliance, and performance across 4 public pages.

**Summary:** Deep-reviewed all 4 public pages. Found and fixed 22 issues across 8 files (4 RSC wrappers + 4 client components). All 4 pages were `'use client'` at the page file level — metadata could not be exported, breaking SEO for all public-facing pages. Resolved by splitting each page into an RSC `page.tsx` (exports `metadata` + `Suspense` wrapper with ARIA-compliant loading skeleton) and a `*-client.tsx` (client component, following the established pattern from login/signup/reset-password). All 4 hero banners had hardcoded hex colors: `from-[#8B1525] via-[#A6192E] to-[#76232f]` → `from-mq-red-deep via-mq-primary to-mq-red-deep`; `text-[#FFB81C]` → `text-mq-warning`; `bg-[#FFB81C]/10` → `bg-mq-warning/10`; `bg-[#FFB81C]` → `bg-mq-warning`; `from-[#76232f]/50` → `from-mq-red-deep/50`. About page: CTA `<Link>` missing `group` class — `group-hover:translate-x-0.5` on `ArrowRight` never fired → added `group`; sections missing `aria-labelledby` and h2s missing matching `id` attributes → added; missing `<main>` landmark → added. Contact page: `text-mq-danger` used for error text — this token is NOT defined in the Tailwind config (only `mq-error` exists), making error messages invisible → corrected to `text-mq-error`; helpful-links `<article>` missing `group` class — `group-hover:opacity-100` on `ArrowRight` never fired → migrated to scoped `group/link` + `group-hover/link:opacity-100` pattern; email input and feedback textarea had no `maxLength` → added `maxLength={254}` and `maxLength={2000}`; error `<p>` missing `id` + `role="alert"` and textarea missing `aria-describedby` → error never announced to screen readers, fixed with matching `id="feedback-error"` and `aria-describedby`; added `noValidate` to form (browser native validation bypassed in favour of custom); missing `<main>` landmark → added. Terms page: `ArrowLeft` icon missing `aria-hidden="true"` → added; all `<section>` elements missing `scroll-mt-8` — TOC anchor links scrolled the heading behind the sticky nav → added; sections now have `aria-labelledby` + h2 `id` pairs; missing `<main>` → added. Privacy page: `ArrowLeft` icon missing `aria-hidden="true"` → added; `TABLE_ROWS` extracted to module-level constant, table rows now keyed by `row[0]` (stable translation key) instead of array index; privacy complaint `mailto:` subject not `encodeURIComponent`-encoded — spaces in subject broke some email clients → computed `privacyComplaintHref` with encoded subject in component body; `scroll-mt-8` added to all 14 sections; `aria-labelledby` + h2 `id` on all 14 sections; missing `<main>` → added.

**Files Changed:** `app/about/page.tsx`, `app/about/about-client.tsx` (new), `app/contact/page.tsx`, `app/contact/contact-client.tsx` (new), `app/terms/page.tsx`, `app/terms/terms-client.tsx` (new), `app/privacy/page.tsx`, `app/privacy/privacy-client.tsx` (new).

**Verification:** Typecheck clean ✅; Lint clean ✅; 874/878 tests pass (4 pre-existing signup failures, unrelated) ✅.

**Follow-ups:** None.

---

### Raouf: Reset Password Page Bug Hunt & Production Hardening — 2026-04-06

**Scope:** Bug fixes, performance, accessibility, i18n/token compliance, and code quality across 2 reset-password page files.

**Summary:** Deep-reviewed all 2 reset-password files. Found and fixed 15 issues: `page.tsx` `ResetPasswordSkeleton` missing `role="status"`, `aria-busy="true"`, `aria-label` ARIA semantics → added. `reset-password-client.tsx`: module-level `requestSchema` recreated on every import → moved into component as `useMemo`; unsafe `tStr = t as (key: string) => string` cast used across 7 callsites → removed cast, replaced all `tStr(...)` with direct `t(...)` (typed); `setSchema` dep array referenced `tStr` instead of `t` → fixed; both `z.string().min()` validation calls in `setSchema` missing translation key → added `t('validation.passwordTooShort')`; `console.error` × 2 on auth/code exchange errors → `logger.error`; `setMode` called directly in auth listener creating stale closure risk on every mode change → replaced with `modeRef` pattern: `modeRef` synced via `useEffect(() => { modeRef.current = mode; }, [mode])` and listener reads `modeRef.current` without re-subscribing; `onRequest` not memoized → `useCallback([t])`; `onSet` not memoized → `useCallback([isAuthenticated, supabase.auth, t])`; auth listener had `mode` in dependency array (caused unnecessary re-subscribe on each mode transition) → removed from deps; all 3 `from-[#001528]/88` hardcoded hex in gradient overlays → `from-mq-navy-900/88`; loading container missing `role="status"` + `aria-live="polite"` → added; `Loader2` missing `aria-hidden="true"` → added; success state `bg-green-500/15 border-green-500/20 text-green-500` → `bg-mq-success/15 border-mq-success/20 text-mq-success`; icon `aria-hidden` missing on `CheckCircle2`/`XCircle` in alerts; `aria-invalid`/`aria-describedby` missing on all 3 form inputs (email, newPassword, confirmPassword) → added with matching `id` on error paragraphs; `Mail`/`Eye`/`EyeOff` decorative icons missing `aria-hidden="true"` → added; both `text-red-500` error paragraph classes → `text-mq-error`.

**Files Changed:** `app/reset-password/page.tsx`, `app/reset-password/reset-password-client.tsx`.

**Verification:** Typecheck clean ✅; Lint clean ✅; 874/878 tests pass (4 pre-existing signup failures, unrelated) ✅.

**Follow-ups:** None.

---

### Raouf: Sign Up Page Bug Hunt & Production Hardening — 2026-04-06

**Scope:** Bug fixes, performance, accessibility, i18n/token compliance, and code quality across 4 signup page files.

**Summary:** Deep-reviewed all 4 signup page files. Found and fixed 19 issues: `page.tsx` `SignupSkeleton` missing `role="status"`, `aria-busy="true"`, `aria-label` ARIA semantics → added. `SignupClient.tsx`: replaced `import clsx from 'clsx'` with `import { cn } from '@/lib/utils'` (project standard — tailwind-merge wrapper) and updated all 6 `clsx()` callsites to `cn()`; `signupSchema` recreated every render → `useMemo`; `handleGoogleLogin` not memoized → `useCallback`; `handleNextStep` not memoized → `useCallback`; `useEffect` faculty/course cascade resets fired on mount (setting empty to empty is harmless but antipattern) → added `prevFacultyRef`/`prevCourseRef` guards; `fullNameRef` callback called `register('fullName')` inside the ref on every render → destructured `registerFullNameRef` + `registerFullNameProps` at top level; all `text-red-500` on error messages (9 occurrences) → `text-mq-error`; all required `*` asterisks (6 occurrences) `text-red-500` → `text-mq-error`; password strength label `text-red-500`/`text-green-600` → `text-mq-error`/`text-mq-success`; year `SelectTrigger` `border-red-500` → `border-mq-error` + added `aria-invalid`/`aria-describedby`; submit button redundant `opacity-50 cursor-not-allowed` class (already handled by `disabled`) → removed; `aria-invalid`/`aria-describedby` added to all 8 form inputs with matching `id` on error paragraphs; honeypot `style={{ display: 'none' }}` inline style → `className="hidden"`; background gradient `from-[#001528]/88` hardcoded hex → `from-mq-navy-900/88`; passed `error={!!errors.faculty}` to `FacultySelect` (previously had no way to show red trigger border on validation). `CourseCombobox.tsx`: `border-red-500` → `border-mq-error`; `updateDropdownPosition` not memoized (called in effect and toggle handler) → `useCallback` + added to useEffect dep array; search input missing `aria-label` → added; Escape key on search input didn't close dropdown and return focus → added `onKeyDown` handler. `FacultySelect.tsx`: added `error?: boolean` prop and conditional `border-mq-error`/`border-mq-border` + `aria-invalid` on the trigger.

**Files Changed:** `app/signup/page.tsx`, `app/signup/SignupClient.tsx`, `app/signup/components/CourseCombobox.tsx`, `app/signup/components/FacultySelect.tsx`.

**Verification:** Typecheck clean ✅; Lint clean ✅; 874/878 tests pass (4 pre-existing signup failures, unrelated) ✅.

**Follow-ups:** None.

---

### Raouf: Login Page Bug Hunt & Production Hardening — 2026-04-06

**Scope:** Bug fixes, performance, accessibility, i18n completeness, and design token compliance across 4 login page files.

**Summary:** Deep-reviewed all 6 login page files. Found and fixed 15 issues: `LoginClient.tsx` had `localLoginSchema` recreated on every render → `useMemo`; `text-red-500` on email/password error messages → `text-mq-error`; `aria-invalid`/`aria-describedby` missing on both form inputs; hardcoded English provider-mismatch error strings in two separate locations — `onSubmit` handler and `callbackError` banner → both now use `t('loginErrorProviderMismatchGoogle')` / `t('loginErrorProviderMismatchEmail')` (keys added to `locales/en/translations.json`); hardcoded hex `text-[#18181b]`/`text-[#3f3f46]` in right panel hero copy → `text-mq-content`/`text-mq-content-secondary`; template literal `className` on passkey badge, MFA badge, and passkey button → `cn()`; `handlePasskeyLogin` not memoized → `useCallback`; `handleGoogleLogin` not memoized → `useCallback`; misleading `aria-disabled` on `<Link>` tag (attribute is non-functional on anchors and doesn't prevent navigation) → removed. `page.tsx` `LoginSkeleton` missing `role="status"`, `aria-busy="true"`, `aria-label` ARIA semantics → added. `MFAChallenge.tsx` error container used `text-red-500` → `text-mq-error`; all 4 buttons missing `type="button"` → added; code input missing `aria-label`, `aria-describedby`, `aria-invalid` → added; error container missing `role="alert"` → added; resend cooldown `setInterval` had no cleanup on unmount — if component unmounted mid-countdown the interval continued running → added `cooldownIntervalRef` (persisted in `useRef`) plus a cleanup `useEffect`. `usePasskeyLogin.ts` had `console.error(err)` on catch → `logger.error`.

**Files Changed:** `app/login/LoginClient.tsx`, `app/login/page.tsx`, `app/login/components/MFAChallenge.tsx`, `app/login/hooks/usePasskeyLogin.ts`, `locales/en/translations.json`.

**Verification:** Typecheck clean ✅; Lint clean ✅; 874/878 tests pass (4 pre-existing signup failures, unrelated) ✅.

**Follow-ups:** None.

---

### Raouf: Manage Profiles Page Bug Hunt & Production Hardening — 2026-04-06

**Scope:** Bug fixes, performance, accessibility, design token compliance, and security hardening across 9 manage-profiles files.

**Summary:** Deep-reviewed all 12 manage-profiles files. Found and fixed 18 issues: `PersonalInfoCard` had `border-red-500`/`text-red-500` error styling → `border-mq-error`/`text-mq-error`; email input missing `id="email"` breaking Label association; `aria-describedby` missing on all three fields with error states → added with matching `id` on error paragraphs; hardcoded student ID placeholder `"12345678"` → `t('studentIdPlaceholder')`. `AcademicInfoCard` had hardcoded hex colors `bg-[#FFB81C]/15` + `text-[#c08c00]` on section icon → `bg-mq-warning/15` + `text-mq-warning`; `text-red-500`/`border-red-500` error styling on all three fields → `mq-error` tokens; `aria-describedby` and `aria-invalid` missing from year SelectTrigger. `error.tsx` had `bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400` → `bg-mq-error/10 text-mq-error`. `ProfileSkeleton` missing `role="status"`, `aria-busy="true"`, `aria-label` ARIA semantics. `page.tsx` reload button missing `type="button"`; `RefreshCw` className used string template literal instead of `cn()` utility — fixed both. `ProfileHeader` missing file MIME type validation (only size was checked — non-image files could be uploaded) → added `file.type.startsWith('image/')` guard; `handleAvatarChange` not memoized → `useCallback`. `useProfileManager` had `profileSchema` recreated on every render → `useMemo`; dead code in `onSubmit` error branch where first `if` set `errorMessage` to the same default value → collapsed to single `else if`; `reloadProfile` always fired success toast even when `fetchProfile()` threw → wrapped in try/catch. `actions.ts` had unprofessional rate-limit error message → neutral language; misleading catch label "Validation failed" on a `revalidatePath` error → corrected to "Cache revalidation failed"; hardcoded success message tidied. `profilesStore.ts` had redundant `console.error` immediately before `errorHandler.logError` → removed; hardcoded verbose avatar error toast → shortened.

**Files Changed:** `app/manage-profiles/components/PersonalInfoCard.tsx`, `app/manage-profiles/components/AcademicInfoCard.tsx`, `app/manage-profiles/error.tsx`, `app/manage-profiles/components/ProfileSkeleton.tsx`, `app/manage-profiles/page.tsx`, `app/manage-profiles/components/ProfileHeader.tsx`, `app/manage-profiles/hooks/useProfileManager.ts`, `app/manage-profiles/actions.ts`, `lib/store/profilesStore.ts`.

**Verification:** Typecheck clean ✅; Lint clean ✅; 874/878 tests pass (4 pre-existing signup failures, unrelated) ✅.

**Follow-ups:** None.

---

### Raouf: Event Settings Page Bug Hunt & Production Hardening — 2026-04-06

**Scope:** Bug fixes, performance, accessibility, and MQ token compliance across 4 event-settings files

1. **`EventForm.tsx` — silent failure on save:** `handleSave` had no `catch` block — if `addEvent`/`updateEvent` threw, the dialog stayed open with the spinner stuck and the user received zero feedback. Added `catch` with `toastUtils.error`.
2. **`EventForm.tsx` — redundant double-reset:** `handleOpenChange` called `resetForm()` when `newOpen === true`, but the `useEffect` already dispatches RESET whenever `open` changes. Removed the redundant `resetForm()` call (and the now-unused `resetForm` function).
3. **`EventForm.tsx` — `handleSave`, `handleDelete`, `validateForm` not memoized:** All three were recreated on every render; `handleSave` and `handleDelete` are passed as `onClick` props. Wrapped all three in `useCallback` with correct dependency arrays. `handleOpenChange` also memoized.
4. **`EventForm.tsx` — color picker missing `aria-pressed`:** Screen readers had no way to identify which color is currently selected. Added `aria-pressed={color === colorOption.value}` to each color button.
5. **`EventForm.tsx` — misleading dead comment on `endAt`:** `endAt: undefined // Could be parsed from "2:00 PM - 4:00 PM" format` was misleading — the input is `type="time"` (HH:MM only). Removed the misleading comment.
6. **`EventDetailPanel.tsx` — non-MQ status colors:** `text-emerald-600` (today) and `text-amber-600` (tomorrow) replaced with `text-mq-success` and `text-mq-warning`.
7. **`EventDetailPanel.tsx` — non-MQ navigation button hover classes:** `hover:text-emerald-600 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20` replaced with `hover:text-mq-success hover:bg-mq-success/10`.
8. **`EventDetailPanel.tsx` — hardcoded hex colors in `useMemo`:** The category dot colors used hex strings (`#3B82F6`, `#8B5CF6`, etc.) in `style={{ backgroundColor }}`. Replaced with CSS custom properties (`var(--mq-info)`, `var(--mq-purple)`, `var(--mq-success)`, `var(--mq-warning)`, `var(--mq-primary)`) to respect theming.
9. **`EventDetailPanel.tsx` — `handleNavigationClick` not memoized:** Passed to a `button`'s `onClick` but recreated every render. Wrapped in `useCallback`.
10. **`app/settings/layout.tsx` — nav buttons missing `type="button"`:** Both mobile and desktop nav buttons lacked `type="button"`, risking accidental form submission. Added to all buttons.
11. **`app/settings/layout.tsx` — nav buttons missing `aria-current="page"`:** Screen readers couldn't identify the active settings section. Added `aria-current={isActive ? 'page' : undefined}` to all nav buttons.
12. **`app/settings/layout.tsx` — raw Tailwind colors for section icons:** `text-blue-500`, `text-purple-500`, `text-green-500`, `text-amber-500`, `text-slate-500` replaced with MQ tokens: `text-mq-info`, `text-mq-purple`, `text-mq-success`, `text-mq-warning`, `text-mq-content-secondary`.
13. **`app/settings/layout.tsx` — `navigateToSection` not memoized:** Recreated on every render and passed as `onClick` to multiple buttons. Wrapped in `useCallback([router])`.
14. **`NotificationSettings.tsx` — double `if (!result)` pattern:** Two separate `if` checks on the same `result` value was confusing and implied independent logic. Refactored to a clean `if...else`.
15. **`NotificationSettings.tsx` — hardcoded `'minutes'` in timing fallback:** `${minutes} minutes` bypassed i18n. Replaced with `t('timingMinutes', { minutes })`.

**Files Changed:**

- `components/events/EventForm.tsx`
- `components/events/EventDetailPanel.tsx`
- `app/settings/layout.tsx`
- `features/settings/components/NotificationSettings.tsx`

**Verification:**

- TypeScript: `npm run typecheck` — clean ✅
- Lint: `npm run lint` — Lint OK ✅
- Tests: 874/878 passed ✅ (4 pre-existing signup failures, unrelated)

---

### Raouf: Event Feed Page Bug Hunt & Production Hardening — 2026-04-06

**Scope:** Bug fixes, performance, accessibility, type safety, i18n, and MQ token compliance across 12 feed files

1. **`usePublicFeed.ts` — time filters showed past events:** `today`, `week`, and `month` branches had no lower bound, so past events leaked through. Fixed by adding `>= startOfDay` (today) and `>= now` (week/month) guards, plus a proper `endOfDay` window for today.
2. **`useFeedLogic.ts` — dead code block:** The second `if (remindedEvents.has(eventId))` check at line 138 was unreachable — the identical guard at line 115 already returned early. Removed the dead block.
3. **`useFeedLogic.ts` — wrong `timeRange` for highlight:** `setTimeRange('upcoming')` meant highlighted past events were immediately filtered out. Changed to `setTimeRange('all')` so the highlighted event is always visible regardless of time.
4. **`useFeedLogic.ts` — memory leak in recursive `scrollToHighlight`:** Only the first `setTimeout` was returned in the cleanup function; the recursive retry and the 5 s clear timer were never cancelled on unmount. Replaced with a `timers[]` array that `clearTimeout`s every timer in the cleanup.
5. **`FeedFilters.tsx` — `TimeRange` type missing `'all'`:** Added `'all'` to the union so the `setTimeRange('all')` call in `useFeedLogic` is type-safe.
6. **`FeedFilters.tsx` — filter/time buttons missing `type="button"` and `aria-pressed`:** Both the time-range toggle buttons and category chip buttons lacked `type="button"` (could submit a parent form) and `aria-pressed` (screen readers had no active-state indication). Added both to all buttons.
7. **`FeedSkeletons.tsx` — loading skeleton invisible to screen readers:** `FeedSkeletons` had no ARIA semantics. Wrapped in a `<div role="status" aria-busy="true" aria-label="Loading events">` to match the project pattern.
8. **`FeedSidebar.tsx` — dead `statsDialogOpen` and `announcementsDialogOpen` states:** Both state variables were declared and their dialogs rendered, but no UI element ever toggled them open. Removed both state variables and their Dialog JSX. Also added Space key support (`e.key === ' '`) to the categories card `onKeyDown`.
9. **`FeedClient.tsx` — hardcoded red color classes in delete modal:** `bg-red-100`, `text-red-500`, and `bg-red-500 hover:bg-red-600` violated the "no hardcoded hex/raw Tailwind colors" rule. Replaced with `bg-mq-error/10`, `ring-mq-error/20`, `text-mq-error`, `bg-mq-error hover:bg-mq-error/90`.
10. **`PublicEventCard.tsx` — non-MQ `categoryColors` and `bg-emerald-600` added-state:** All category color classes (`bg-blue-50`, `text-blue-700`, etc.) replaced with MQ tokens (`bg-mq-info/10 text-mq-info border-mq-info/20`, etc.). The "added to calendar" button state `bg-emerald-600 hover:bg-emerald-700` replaced with `bg-mq-success hover:bg-mq-success/90 border-mq-success`. Also simplified the redundant `categoryStyle.bg.replace(...)` no-op to `categoryStyle.bg`.
11. **`FeaturedEventsBanner.tsx` — non-MQ `categoryGradients`, missing nav/dot ARIA:** `from-blue-600 to-blue-800` etc. replaced with `from-mq-info to-mq-info/70` etc. Previous/next nav buttons missing `aria-label` and `aria-hidden` on their icons. Dot buttons missing `type="button"` and `aria-current`.
12. **`EventDetailModal.tsx` — non-MQ `categoryStyles` gradients and `bg-emerald-600` added-state:** `from-blue-500 to-blue-700` etc. replaced with `from-mq-info to-mq-info/70` etc. Added-state button `bg-emerald-600 hover:bg-emerald-600` replaced with `bg-mq-success hover:bg-mq-success/90 border-mq-success`.
13. **`AnnouncementsSection.tsx` — non-MQ `typeStyles` colors:** `bg-emerald-500`, `bg-blue-500`, `bg-amber-500`, `bg-purple-500` and their `text-` / `hover:border-` variants replaced with MQ tokens (`bg-mq-success`, `bg-mq-info`, `bg-mq-warning`, `bg-mq-purple`).
14. **`QuickStats.tsx` — non-MQ `CategoryBar` colors, non-MQ `StatCard` color, and hardcoded `'en-AU'` locale:** `bg-blue-500`, `bg-emerald-500`, `bg-purple-500`, `bg-amber-500` in `CategoryBar` replaced with `bg-mq-info`, `bg-mq-success`, `bg-mq-purple`, `bg-mq-warning`. `text-purple-500/bg-purple-500/10` in `StatCard` replaced with `text-mq-purple/bg-mq-purple/10`. `EventCard` hardcoded `'en-AU'` in both `toLocaleTimeString` and `toLocaleDateString`; replaced with a `localeMap` driven by `useTypedTranslation().language`. `EventCard` `categoryColors` also replaced with MQ tokens. Merged two `useTypedTranslation()` calls into one.
15. **`PublicFeedFilters.tsx` — wrong Input import path:** `@/components/ui/input` (base shadcn) replaced with `@/components/ui/mq/input` (MQ-themed wrapper) for visual consistency.

**Files Changed:**

- `features/feed/hooks/usePublicFeed.ts`
- `features/feed/hooks/useFeedLogic.ts`
- `features/feed/components/FeedFilters.tsx`
- `features/feed/components/FeedSkeletons.tsx`
- `features/feed/components/FeedSidebar.tsx`
- `app/feed/FeedClient.tsx`
- `features/feed/components/PublicEventCard.tsx`
- `features/feed/components/FeaturedEventsBanner.tsx`
- `features/feed/components/EventDetailModal.tsx`
- `features/feed/components/AnnouncementsSection.tsx`
- `features/feed/components/QuickStats.tsx`
- `features/feed/components/PublicFeedFilters.tsx`

**Verification:**

- TypeScript: `npm run typecheck` — clean (no source-file errors) ✅
- Lint: `npm run lint` — Lint OK ✅
- Tests: 874/878 passed ✅ (4 pre-existing signup failures, unrelated)

---

### Raouf: Map Page Bug Hunt & Production Hardening — 2026-04-06

**Scope:** Bug fixes, performance, accessibility, type safety, and i18n compliance across 5 map files

1. **`MapClient.tsx` — URL truncation always appended `...`:** `copyShareableURL` used `url.toString().substring(0, 50)}...` unconditionally, appending `...` even for short URLs. Fixed by only adding the ellipsis when `urlStr.length > 50`.
2. **`MapClient.tsx` — redundant `document.title` effect:** A `useEffect` set `document.title` at runtime, which is redundant with (and can flicker against) the `metadata` export in `app/map/page.tsx` that Next.js App Router already injects as a `<title>` tag. Removed the effect.
3. **`MapClient.tsx` — `selectedBuildingName` semantic mismatch:** `RouteAnnouncer` received `selectedBuilding?.id` (e.g. "C5C") as the building name for screen reader announcements (e.g. "Navigating to C5C"). Fixed by passing `selectedBuilding?.name` (the human-readable English name).
4. **`MapClient.tsx` — duplicate comment:** `{/* Combined Map Wrapper */}` appeared twice on consecutive lines (646–647). Removed the duplicate.
5. **`MapClient.tsx` — non-memoized CampusMapHUD callbacks:** Three inline arrow functions were passed as props to `CampusMapHUD` — `onStartNavigation`, `onStopNavigation`, and `onClearExternalPlace` — recreated on every render, forcing unnecessary child re-renders. Extracted and memoized all three with `useCallback`.
6. **`MapPageSkeleton.tsx` — inaccessible loading skeleton:** The outer `<div>` had no ARIA semantics, making the page-level Suspense fallback invisible to screen readers. Added `role="status"`, `aria-label={t('loadingMap')}`, and `aria-busy="true"`.
7. **`position-editor/page.tsx` — non-MQ semantic Tailwind classes:** `PositionEditorLoading` used `bg-gray-100 dark:bg-gray-900` (background), `text-gray-600 dark:text-gray-400` (text), and `border-red-600` (spinner). Replaced with `bg-mq-background`, `text-mq-content-secondary`, and `border-mq-primary`.
8. **`CampusMapHUD.tsx` — hardcoded hex colours:** The Google Maps-mode selected building highlight used `bg-[#d2e3fc] dark:bg-[#1a3a5c]`. Replaced with `bg-mq-primary/15 dark:bg-mq-primary/10` to use the MQ primary token.
9. **`CampusMapHUD.tsx` — category capitalized in JSX instead of i18n:** The selected building card displayed the category using `charAt(0).toUpperCase() + slice(1)` (raw JavaScript string manipulation, bypassing i18n). Fixed by importing `BUILDING_CATEGORY_LABELS` from `@/features/map/lib/buildings` and using `t(BUILDING_CATEGORY_LABELS[selectedBuilding.category])`, consistent with how `CampusMap.tsx` already renders the same data. Also merged the two separate `@/features/map/lib/buildings` import lines into one.
10. **`CampusMap.tsx` — hardcoded `#4285F4` hex in SVG fill:** The "locate me" button SVG used `fill="#4285F4"` (Google blue) to indicate GPS found. Replaced with `fill="var(--mq-primary)"` to respect the MQ brand token system.

**Files Changed:**

- `features/map/components/MapClient.tsx`
- `features/map/components/MapPageSkeleton.tsx`
- `features/map/components/CampusMapHUD.tsx`
- `features/map/components/CampusMap.tsx`
- `app/map/position-editor/page.tsx`

**Verification:**

- TypeScript: `npm run typecheck` — clean (no map-source errors) ✅
- Lint: `npm run lint` — clean ✅
- Tests: 874/878 passed ✅ (4 pre-existing signup failures, unrelated)

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

---

### Raouf: Internationalization Update — 2026-04-06

**Scope:** i18n Expansion (34 Locales)

**Summary:** Added missing `heroSection`, `opensInNewTab`, and `loadingEvents` keys to all 34 translation files in `locales/`. Used localized translations for major languages (Arabic, German, Spanish, French, Italian, Portuguese, Chinese, Japanese, etc.) and English fallbacks for others. `heroSection` is used for ARIA labels on hero sections; `opensInNewTab` provides an accessible suffix for links; `loadingEvents` is used for screen reader status updates during feed loading.

**Files Changed:** `locales/*/translations.json` (34 files).

**Verification:** Ran `npm run check:i18n` — all 35 locales validated successfully ✅.

**Follow-ups:** None.

---

### Raouf: Cloudflare Worker Configuration Scaffolding — 2026-07-22

**Scope:** Added local OpenNext and Cloudflare Worker configuration scaffolding only; no Worker deployment or cron activation occurred.

**Summary:** Added preview and production Wrangler configuration, OpenNext default configuration, static cache-header policy, a tracked safe local-variable template, and reproducible generated Worker binding types. Added tests for custom-worker routing, compatibility flags, static assets, image binding, self-reference, empty cron triggers, and cache headers. Generated Workerd types are isolated from the Next DOM program in a separate strict TypeScript project, preserving both application and Worker type safety.

**Files Changed:** `wrangler.jsonc`, `open-next.config.ts`, `custom-worker.ts`, `cloudflare-env.d.ts`, `.dev.vars.example`, `public/_headers`, `.gitignore`, `config/ts/tsconfig.json`, `config/ts/tsconfig.cloudflare.json`, `package.json`, `tests/cloudflare/*`, `AGENT.md`, `CHANGELOG.md`.

**Verification:** Node 22 `npm run cf:typegen`, focused Vitest configuration tests, `npm run typecheck`, `npm run typecheck:cloudflare`, focused Prettier check, and `npm run check:secrets` passed. Existing build→Sharp deployment-gate→action ordering remains unchanged.

**Follow-ups:** Cloudflare Images enablement and transformation-billing acceptance are externally unverified, so `IMAGES` is planned configuration only and deployment remains blocked. Keep both cron lists empty until the separately reviewed Vercel-Cron cutover. Task 8 replaces the temporary 503 worker stub.

---

### Raouf: Cloudflare Worker Configuration Review Remediation — 2026-07-22

**Scope:** Closed the Task 4 quality-gate and route-contract review findings without changing deployment behavior or the plan-mandated static-cache policy.

**Summary:** Added the isolated Worker typecheck to the global `npm run check` sequence immediately after the main Next typecheck and protected that exact sequence with a contract test. Tightened the Worker configuration test to require the complete approved static bypass list and reject dynamic HTML/RSC, API, auth, and `/_next/image` bypass patterns.

**Files Changed:** `package.json`, `tests/cloudflare/worker-config.test.ts`, `AGENT.md`, `CHANGELOG.md`.

**Verification:** Node 22 focused Cloudflare tests, package-script contract assertion, main and Worker typechecks, formatting, and secret scan passed. Sharp audit scripts and build→gate→action ordering are unchanged.

**Follow-ups:** The review's immutable stable-name icon/image cache observation is intentionally left unchanged because Task 4 mandates that header policy; address it only in a separately reviewed production policy change. Images enablement/billing and Sharp deployment-evidence blockers remain.

---

### Raouf: Cloudflare Edge Middleware Bridge — 2026-07-22

**Scope:** Restored the Edge-compatible middleware entry point and added fail-closed API authentication coverage.

**Summary:** Renamed the existing request policy to `lib/middleware.ts`, exported it from the root `middleware.ts` convention, removed obsolete proxy entry points, and migrated the MFA regression suite without changing route, CSP, CSRF, session, email-verification, or MFA policy. Added a complete API-route authentication inventory with an explicit middleware-aligned public allowlist. The inventory found two protected utility routes without route-level evidence; `/api/navigate` and `/api/security/check-password-breach` now use `requireAuth` before their unchanged limiter and handler logic.

**Files Changed:** `middleware.ts`, `lib/middleware.ts`, removed proxy entry points, middleware/API-auth tests, the two protected utility routes, `AGENT.md`, and `CHANGELOG.md`.

**Verification:** On Node 22, 16 focused middleware, route-auth, inventory, and Worker-contract tests passed; 19 Sharp gate tests passed; main and isolated Worker typechecks, formatting, secret scan, and local Sharp audit-exception gate passed. The runtime audit records only the expected remaining DNS blocker in the security-header scanner and Node crypto blockers in CSP/CSRF. No Cloudflare execution or deployment command was run.

**Follow-ups:** Resolve the recorded runtime blockers in their separately scoped migration tasks. Existing Sharp reachability and deployment gates remain unchanged and fail closed.

---

### Raouf: Middleware Auth-Coverage Review Remediation — 2026-07-22

**Scope:** Closed the Task 5 method-coverage and extension-shaped middleware-bypass findings.

**Summary:** Replaced raw-token API inventory with TypeScript AST analysis for each exported HTTP method, including reachable local/imported handlers, aliases, re-exports, trusted auth wrappers, fail-closed session checks, and real secret enforcement. Seventeen adversarial analyzer tests cover the review's false-positive classes and early-success bypasses. The stricter inventory exposed admin GET/POST and gamification GET; all three now enter route-level `requireAuth` before their unchanged handlers. Root matching and library policy now bypass only explicit known static namespaces and exact public files, so API/auth/RSC/HTML and extension-shaped dynamic paths execute middleware. Cloudflare Wrangler asset routing remains unchanged.

**Files Changed:** Middleware matcher/policy, three protected HTTP methods, AST analyzer/inventory tests, matcher and route-auth regressions, `AGENT.md`, and `CHANGELOG.md`.

**Verification:** Node 22 focused tests passed (54/54), including the Task 4 Worker contract. Main and isolated Worker typechecks, lint, formatting, secrets, 19 Sharp gate tests, and the local Sharp audit-exception gate passed. Runtime compatibility still reports only the expected DNS scanner and CSP/CSRF Node-crypto blockers.

**Follow-ups:** Resolve those three runtime dependencies in later migration tasks. Deployment gates remain fail-closed and no Cloudflare execution or deployment command was run.

---

### Raouf: Auth Analyzer Binding Review Closure — 2026-07-22

**Scope:** Closed the remaining Task 5 analyzer identity, session-dominance, and secret-comparison findings.

**Summary:** Auth wrappers and non-auth traversal are now accepted only through exact symbol-resolved imports. Direct session checks require the actual project Supabase server client, awaited destructuring, an immediate correctly polarized error-or-missing-user condition, and a trusted 401/403 denial. Scheduler/admin secret checks require one configured secret, the current request Authorization header, exact bearer comparison polarity, and denial before work. The adversarial analyzer suite expanded to 43 cases covering property calls, wrong modules, unused imports, shadows, partial session negations, early work/success, and self/reversed/unrelated/two-secret comparisons.

**Files Changed:** API-auth analyzer and adversarial tests, `AGENT.md`, and `CHANGELOG.md`.

**Verification:** Node 22 Task 5 focused tests passed (80/80); all 47 protected exported methods across 26 protected routes remain green. Main and isolated Worker typechecks, lint, formatting, secrets, 19 Sharp tests, and the local audit exception passed. The runtime audit still reports only the three previously recorded DNS/Node-crypto blockers.

**Follow-ups:** Resolve those runtime dependencies in later tasks. No Cloudflare execution or deployment command was run.

---

### Raouf: Auth Analyzer Final Fail-Closed Closure — 2026-07-22

**Scope:** Closed the final Task 5 indirect-handler binding and direct-session dominance findings.

**Summary:** Removed generic returned-helper call chasing and retained only exact immutable export aliases and fully resolved re-exports. Unresolved/non-exported symbols plus parameter, block, catch, and local shadows now fail closed. Direct session evidence must be the first three-statement sequence: immutable awaited project server-client creation, awaited/destructured `getUser`, then immediate exact 401/403 error-or-missing-user denial. Notification PATCH is now the exact authenticated PUT alias. The four protected WebAuthn credential and registration methods authenticate before IP/limiter work, with regressions proving unauthenticated requests do not touch limiter state.

**Files Changed:** API-auth analyzer/tests, notification route/test, WebAuthn credential/registration routes/tests, `AGENT.md`, and `CHANGELOG.md`.

**Verification:** Node 22 analyzer tests passed (61/61), six-file Task 5 tests passed (98/98), and route regressions passed (19/19). All 47 protected methods remain green. Main and Worker typechecks, lint, formatting, secrets, 19 Sharp tests, and the audit exception passed; runtime blockers remain the same three DNS/Node-crypto findings.

**Follow-ups:** Resolve those runtime dependencies in later tasks. No Cloudflare execution or deployment command was run.

---

### Raouf: Mutable Callable and Exception-Path Closure — 2026-07-22

**Scope:** Closed the remaining Task 5 callable mutability and try-wrapped session-proof findings.

**Summary:** Only `const` function/arrow variables may be analyzed, and a complete module scan invalidates function declarations, const callables, or aliases with assignment, compound, update, destructuring/property, loop, or rebinding writes. Try-wrapped session evidence is rejected outright. Sync POST and the four protected WebAuthn credential/registration methods now execute their exact session proof before `try`, while limiter and protected work retain their existing guarded error-handling paths. Route tests prove unauthenticated requests stop before limiter work.

**Files Changed:** API-auth analyzer/tests, sync and WebAuthn routes/tests, `AGENT.md`, and `CHANGELOG.md`.

**Verification:** Node 22 analyzer tests passed (75/75), six-file Task 5 tests passed (112/112), and route behavior tests passed (20/20). All 47 protected methods remain green. Main and Worker typechecks, lint, formatting, secrets, 19 Sharp tests, and the audit exception passed; runtime blockers remain the same three DNS/Node-crypto findings.

**Follow-ups:** Resolve those runtime dependencies in later tasks. No Cloudflare execution or deployment command was run.

---

### Raouf: Complete HTTP Export Inventory Closure — 2026-07-22

**Scope:** Closed the final Task 5 mixed-method omission for unresolved named HTTP exports.

**Summary:** The analyzer now records syntax-level HTTP method presence separately from callable identity. Unresolved external named re-exports, unresolved imported/local exports, uninitialized and destructured method exports, and namespace exports named as HTTP methods are returned as explicit uncovered methods. A covered local GET therefore cannot hide an unresolved external POST. Type-only exports remain correctly excluded, and all previously closed binding, mutability, dominance, and matcher findings remain unchanged.

**Files Changed:** API-auth analyzer/tests, `AGENT.md`, and `CHANGELOG.md`.

**Verification:** Node 22 analyzer tests passed (80/80), six-file Task 5 tests passed (117/117), and route behavior tests passed (20/20). All 47 current protected methods remain green. Main and Worker typechecks, lint, formatting, 819-file secret scan, 19 Sharp tests, and the audit exception passed; runtime blockers remain the same three DNS/Node-crypto findings.

**Follow-ups:** Resolve those runtime dependencies in later tasks. No Cloudflare execution or deployment command was run.

---

### Raouf: Edge Middleware Web Crypto Migration — 2026-07-22

**Scope:** Removed the remaining Node crypto dependencies from the Cloudflare Edge middleware import graph without changing CSP or CSRF wire contracts.

**Summary:** CSP nonce generation now uses Web Crypto for 16 random bytes and browser-safe base64 encoding. CSRF generation now uses Web Crypto for 32 random bytes and lowercase hexadecimal encoding; equal-length token comparison performs one XOR operation for every character before deciding equality. Added a policy-file guard against Node-only built-ins and strengthened existing CSP/CSRF tests for exact output shape and 64-call uniqueness.

**Files Changed:** `lib/security/csp.ts`, `lib/security/csrf.ts`, `tests/unit/security/csp.test.ts`, `tests/security/csrf-critical.test.ts`, `tests/cloudflare/middleware-edge-compat.test.ts`, `AGENT.md`, `CHANGELOG.md`.

**Verification:** Node 22 targeted CSP, CSRF, MFA middleware, and Edge compatibility tests passed (47/47). Main and Worker typechecks, lint, full formatting, 819-file secret scan, 19 Sharp gate tests, and the local Sharp audit exception passed. The runtime audit now reports only the separately scoped `dns.lookup` blocker in `app/api/security/scan-headers/route.ts`.

**Follow-ups:** Replace the DNS lookup in its dedicated migration task. No preview, dry-run, upload, deployment, or production cutover was run; Sharp deployment gates remain fail closed.

---

### Raouf: Platform-Neutral Cloudflare Runtime Detection — 2026-07-22

**Scope:** Centralized deployment platform, environment, application-origin, and trusted client-IP detection for the local Cloudflare Workers migration while retaining Vercel rollback behavior.

**Summary:** Added strict Cloudflare/Vercel/local runtime helpers; normalized configured application URLs to HTTP(S) origins; rejected malformed, credential-bearing, non-HTTP, and scheme/path-shaped host values; replaced Vercel-only production checks across rate limiting, CSRF, API errors, authentication, and server/Edge Sentry configuration; centralized verification/reset and signup origins; and removed the duplicate API-middleware IP parser. Cloudflare production trusts `cf-connecting-ip` first and does not trust caller-supplied `x-forwarded-for` by default. Vercel production headers and public client-side Sentry rollback tags remain supported.

**Files Changed:** `lib/platform/runtime.ts`, platform/security/service/API/Sentry consumers, focused platform/IP/CSRF/rate-limit/email tests, `AGENT.md`, and `CHANGELOG.md`.

**Verification:** Node 22 focused and affected regression tests passed (72/72); application and Worker typechecks, lint, full formatting, 820-file secret scan, 19 Sharp-gate tests, and the local Sharp audit exception passed. Runtime compatibility now fails only on the separately scoped `dns.lookup` use in `app/api/security/scan-headers/route.ts`.

**Follow-ups:** Replace the DNS lookup in its dedicated task. No preview, dry-run, upload, deployment, or production cutover was run; the Sharp reachability deployment gates remain fail closed.

---

### Raouf: Platform Runtime Email-Safety Review Closure — 2026-07-22

**Scope:** Closed both Important Task 7 review findings and added behavioral evidence for the practical coverage observation.

**Summary:** Restored email-specific rejection of raw `example.com`, `your-`, and `paste` application-origin placeholders before normalization can discard path/query markers. Missing, invalid, credential-bearing, and placeholder origins now keep `isEmailServiceConfigured()` non-throwing and return the existing unsuccessful send result instead of rejecting. Verification and password-reset orchestrators therefore delete their newly inserted undelivered token records. Added behavioral tests for both cleanup lanes, Cloudflare preview precedence under `NODE_ENV=production`, credential-bearing origin rejection, database-error redaction, and the unchanged API middleware IP-plus-path rate-limit key.

**Files Changed:** `lib/services/emailService.ts`, focused platform/email/token-cleanup/API behavior tests, `AGENT.md`, and `CHANGELOG.md`.

**Verification:** Node 22 affected tests passed (87/87); application and Worker typechecks, lint, full formatting, 822-file secret scan, 19 Sharp-gate tests, and the local Sharp audit exception passed. Runtime compatibility remains non-zero only for the separately scoped `dns.lookup` use in `app/api/security/scan-headers/route.ts`.

**Follow-ups:** Replace the DNS lookup in its dedicated task. No preview, dry-run, upload, deployment, production cutover, or push was performed; Sharp reachability deployment gates remain fail closed.

---

### Raouf: Worker-Compatible DNS Header Scanning — 2026-07-22

**Scope:** Replaced the security-header scanner's unsupported `dns.lookup()` dependency and made runtime compatibility a permanent global quality gate.

**Summary:** Added a Worker-compatible dual-stack resolver using `resolve4` and `resolve6`, preserving literal-IP targets, deduplicating answers, tolerating one unavailable family, and failing closed on empty or malformed results. The protected scan route now rejects any private, loopback, link-local, unique-local, or private IPv4-mapped IPv6 answer, including mixed public/private sets and alternate IPv6 spellings. Route regressions preserve authentication and rate-limit dominance and prove the outbound HEAD request uses `redirect: 'manual'` exactly once. The API reference records the DNS validation/fetch TOCTOU boundary honestly: these controls reduce SSRF exposure but do not mathematically eliminate DNS rebinding.

**Files Changed:** `lib/security/dns-resolution.ts`, `app/api/security/scan-headers/route.ts`, DNS/route/runtime/Worker configuration tests, `package.json`, `docs/api/API_REFERENCE.md`, `AGENT.md`, `CHANGELOG.md`.

**Verification:** Node 22 focused DNS, route, runtime, Worker-contract, protected-route, and auth-inventory tests passed (33/33). Main and Worker typechecks, lint, full formatting, 825-file secret scan, 19 Sharp-gate tests, local Sharp audit exception, and the Cloudflare runtime audit passed.

**Follow-ups:** Cloudflare public-fetch restrictions remain part of the production SSRF boundary. No preview, dry-run, upload, deployment, production cutover, or push was performed; Sharp reachability deployment gates remain fail closed.

### Raouf: OpenNext Routing Unblock — path-to-regexp Override Scoping — 2026-07-22

**Scope:** Repaired a total Worker routing failure in which every request returned HTTP 500 under `workerd`, and excluded generated Worker output from the formatting gate.

**Summary:** The pre-existing blanket `path-to-regexp: ^8.3.0` override forced `@opennextjs/aws`, which declares `^6.3.0`, onto the v8 parser. OpenNext's `getNextConfigHeaders()` re-parses the raw Next.js `headers()` source with its own copy and does so outside a try/catch, so the v8 lexer rejected the v6-dialect `/(.*)` source and threw `PathError` on every request before any route ran. The override is now scoped so `@opennextjs/aws` resolves `path-to-regexp@6.3.0` — itself the patched release for CVE-2024-45296 — while its nested `express`/`router` subtree and Wrangler stay on 8.4.2. The Next.js source string is unchanged; `/{*path}` and `/*path` were rejected by Next's own v6 parser at build time, so no single source satisfies both majors. `.open-next` and `.wrangler` were added to the Prettier ignore list because `npm run check` failed for anyone who had built the Worker.

**Files Changed:** `package.json`, `package-lock.json`, `config/next/next.config.ts`, `config/prettier/.prettierignore`, `AGENT.md`, `CHANGELOG.md`.

**Verification:** Local `wrangler dev` now serves `/`, `/login`, `/privacy`, `/terms`, `/api/health`, and `/manifest.webmanifest` at 200; `/calendar` returns 307 to `/login?redirectTo=%2Fcalendar`; CSP nonce, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` are present on HTML. Dependency resolution confirmed as `@opennextjs/aws` → 6.3.0 and `express`/`router`/Wrangler → 8.4.2. `npm audit --omit=dev --audit-level high` reports no `path-to-regexp` advisory; the 5 remaining high findings are the pre-existing Sharp/libvips advisories governed by the Sharp risk gate (19 gate tests and the local audit exception passed). Secret scan, runtime audit, formatting, both typechecks, lint, and 1063 tests passed.

**Follow-ups:** Worth reporting upstream that `match(source)` in `getNextConfigHeaders()` and `handleRewrites()` sits outside the try/catch, so one unparsable source hard-fails every route. `redirects()` and `rewrites()` re-parse raw sources on the same path and would fail identically if the override regressed. No preview, dry-run, upload, deployment, production cutover, or push was performed.

### Raouf: Cloudflare Worker Cron Migration — 2026-07-22

**Scope:** Replaced the three Vercel Cron schedules with a Cloudflare `scheduled()` handler and promoted `custom-worker.ts` from build stub to the real OpenNext entry point.

**Summary:** Added a pure `runScheduledJob()` dispatcher mapping each cron expression to its existing `CRON_SECRET`-protected cleanup route, invoked internally through the OpenNext fetch handler rather than over the public internet. It fails closed when `CRON_SECRET` is absent, empty, or whitespace-only, rejects unknown cron expressions before any request is issued, and throws on a non-successful cleanup so failures surface in Cron Events instead of being recorded as success. Deviating from the plan, the thrown message carries cron, route, and status but not the upstream response body, which can echo the bearer credential into the log stream. Secret bindings are typed through a separate `cloudflare-env.secrets.d.ts` declaration merge so `npm run cf:typegen` stays reproducible, and the Worker tsconfig now resolves `@/lib/*`. Cron triggers remain `[]` in both Wrangler environments; scheduler ownership transfers only in the separately reviewed cutover change.

**Files Changed:** `lib/cloudflare/scheduled.ts`, `custom-worker.ts`, `cloudflare-env.secrets.d.ts`, `config/ts/tsconfig.cloudflare.json`, `tests/cloudflare/scheduled.test.ts`, `AGENT.md`, `CHANGELOG.md`.

**Verification:** 13 new dispatcher and worker-contract tests passed, including a guard that the mapping still equals the schedules `vercel.json` owns. `npm run cf:build` produced `.open-next/worker.js` from the real entry point. In local `workerd` with `--test-scheduled`, all three cron expressions dispatched to their correct routes and an unknown expression failed visibly. Against placeholder Supabase credentials the cleanup routes returned 503 `Not configured` — not 401 — proving the internal POST cleared both `CRON_SECRET` authentication and middleware CSRF; a wrong or missing secret returned 401, and a correct secret sent with a cross-origin `Origin` header was rejected 403. Secret scan, runtime audit, formatting, both typechecks, lint, and 1063 tests passed.

**Follow-ups:** A successful 200 cleanup run is unproven because no Supabase credentials exist in this worktree; it must be recorded in the Task 16 preview parity matrix against real preview infrastructure. No preview, dry-run, upload, deployment, production cutover, or push was performed; Sharp reachability deployment gates remain fail closed.

### Raouf: Worker Dependency Proof, Environment Validation, and Size Gate — 2026-07-22

**Scope:** Added the Workerd dependency import proof, platform-neutral deployment environment validation, and the Worker compressed-upload budget gate.

**Summary:** A dependency smoke test proves the six server packages bundled into the Worker — SimpleWebAuthn server, Supabase SSR and JS, Resend, uuid, and web-push — still resolve and expose the entry points the application calls; no package needed replacement. `tools/deployment/check-required-env.mjs` validates required public and server variables, URL shape, HTTPS and non-example production origins, the canonical production WebAuthn RP ID and origin, and at least one complete distributed rate-limit backend, reporting variable names only. Deviating from the plan, `tools/vercel/check-required-env.mjs` was left intact rather than reduced to a delegating wrapper: it interrogates the Vercel project through the Vercel CLI, which is a different check from validating the current process environment, and collapsing the two would weaken rollback validation. The rate-limit backend list also accepts Vercel KV, which `getStore()` supports and the plan omitted. `tools/cloudflare/check-worker-size.mjs` parses the gzip measurement from Wrangler dry-run output and enforces a 9.5 MiB hard limit with a 2.8 MiB free-plan warning.

**Files Changed:** `tools/deployment/check-required-env.mjs`, `tools/cloudflare/check-worker-size.mjs`, `tests/cloudflare/node-compatibility.test.ts`, `tests/cloudflare/required-env.test.ts`, `tests/cloudflare/worker-size.test.ts`, `package.json`, `AGENT.md`, `CHANGELOG.md`.

**Verification:** 26 new tests passed across dependency imports, environment validation, and size parsing, including boundary cases at both thresholds and an assertion that no configured value is ever echoed into output. Secret scan (832 files), runtime audit, formatting, both typechecks, lint, and 1089 tests passed.

**Follow-ups:** The real Worker gzip size is still unmeasured because `npm run cf:dry-run` is blocked by the Sharp deployment gate; see the reachability finding recorded separately. No preview, dry-run, upload, deployment, production cutover, or push was performed.
