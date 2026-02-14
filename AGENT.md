Raouf: 2026-02-14 (Australia/Sydney)
Scope: Header Action Buttons Alignment (Far Right)
Summary: Adjusted the header actions container so the three controls (profile avatar menu, theme toggle, notifications) align to the far right edge on small screens. Added mobile full-width action row with right justification while preserving existing desktop spacing/behavior.
Files: Modified [components/layout/Header.tsx](components/layout/Header.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅.

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Manage Profiles Page Responsive Breakpoint Pass (Mobile/Tablet/Desktop/Wide)
Summary: Completed a mobile-first responsiveness pass for `/manage-profiles` without redesign. Root causes fixed: rigid row layouts (`justify-between`) in reminder preference cards compressing content on phones, container spacing that was dense on narrow viewports, and potential overflow for long email/student identifiers in profile header. Updated page/skeleton spacing, converted reminder rows to stack on mobile and align horizontally on larger screens, added text wrapping and `min-w-0` protections, and adjusted save action/button behavior for small screens.
Files: Modified [app/manage-profiles/page.tsx](app/manage-profiles/page.tsx), [app/manage-profiles/components/ProfileHeader.tsx](app/manage-profiles/components/ProfileHeader.tsx), [app/manage-profiles/components/ReminderSettings.tsx](app/manage-profiles/components/ReminderSettings.tsx), [app/manage-profiles/components/ProfileSkeleton.tsx](app/manage-profiles/components/ProfileSkeleton.tsx), [app/manage-profiles/error.tsx](app/manage-profiles/error.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test -- app/manage-profiles/__tests__/actions.test.ts` ⚠️ (no tests discovered by project Vitest include `tests/**/*`), `npx vitest run app/manage-profiles/__tests__/actions.test.ts` ⚠️ (fails in ad-hoc mode due unresolved alias import `@/lib/logger`), `npm run lighthouse:local` attempted ⚠️ but local `lhci` exits with `Hello, this is AnupamAS01!` and no report artifact.

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Login Page Responsive Breakpoint Pass (Mobile/Tablet/Desktop/Wide)
Summary: Completed a mobile-first responsiveness pass for `/login` without redesign. Fixed layout pressure on 360–430px by reducing shell/panel spacing, scaling logo/typography, and making critical controls fully fluid on narrow screens. Updated login container overflow behavior to avoid clipping, adjusted section spacing for tablet/desktop progression, and made right hero panel responsive (hidden on smallest screens, preserved on tablet+desktop). Also tuned MFA challenge input sizing/tracking for narrow viewports and made fingerprint button CSS width fluid (`min(100%, 260px)`) to prevent fixed-width constraints.
Files: Modified [app/login/LoginClient.tsx](app/login/LoginClient.tsx), [app/login/components/MFAChallenge.tsx](app/login/components/MFAChallenge.tsx), [app/login/page.tsx](app/login/page.tsx), [app/styles/fingerprint.css](app/styles/fingerprint.css).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test -- app/login/__tests__/actions.test.ts tests/security/login-mfa-failclosed.test.ts` ✅ (4/4 tests pass), `npm run lighthouse:local` attempted ⚠️ but local `lhci` exits with `Hello, this is AnupamAS01!` and no report artifact.

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Settings Page Responsive Breakpoint Pass (Mobile/Tablet/Desktop/Wide)
Summary: Completed a mobile-first responsiveness pass for `/settings` and all section pages (`general`, `appearance`, `security`, `experience`, `support`) without redesign. Root causes fixed: early 2-column breakpoints causing cramped tablet/laptop cards, rigid spacing in settings shell, and multiple card action rows that did not wrap on narrow viewports. Updated layout spacing/breakpoints, moved heavy multi-card pages to `xl` split layouts, and converted key control/action rows to stack on mobile then align horizontally on larger screens. Also fixed overflow risk in security dialogs/cards by wrapping long secret/device text and improving small-screen button behavior.
Files: Modified [app/settings/layout.tsx](app/settings/layout.tsx), [app/settings/general/page.tsx](app/settings/general/page.tsx), [app/settings/appearance/page.tsx](app/settings/appearance/page.tsx), [app/settings/security/page.tsx](app/settings/security/page.tsx), [app/settings/experience/page.tsx](app/settings/experience/page.tsx), [app/settings/support/page.tsx](app/settings/support/page.tsx), [features/settings/components/NotificationSettings.tsx](features/settings/components/NotificationSettings.tsx), [features/settings/components/NotificationRow.tsx](features/settings/components/NotificationRow.tsx), [features/settings/components/GamificationSettings.tsx](features/settings/components/GamificationSettings.tsx), [features/settings/components/MapSettings.tsx](features/settings/components/MapSettings.tsx), [features/settings/components/PrivacySettings.tsx](features/settings/components/PrivacySettings.tsx), [features/settings/components/security/TOTPSetup.tsx](features/settings/components/security/TOTPSetup.tsx), [features/settings/components/security/PasskeyManager.tsx](features/settings/components/security/PasskeyManager.tsx), [features/settings/components/security/BiometricToggle.tsx](features/settings/components/security/BiometricToggle.tsx), [features/settings/components/QuickActions.tsx](features/settings/components/QuickActions.tsx), [features/settings/components/HelpSupport.tsx](features/settings/components/HelpSupport.tsx), [features/settings/components/SettingsSkeleton.tsx](features/settings/components/SettingsSkeleton.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test -- tests/settings` ✅ (85/85 tests pass), `npm run lighthouse:local` attempted ⚠️ but local `lhci` exits with `Hello, this is AnupamAS01!` and no report artifact.

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Map Off-Campus Warning Behavior - 3-Second Popup
Summary: Changed the off-campus warning banner from persistent display to a timed popup. The banner now appears for 3 seconds only when the user transitions from on-campus to off-campus, then auto-hides. If the user returns on-campus, the popup state and timers are cleared immediately. Navigation disable behavior while off-campus remains unchanged.
Files: Modified [features/map/components/CampusMap.tsx](features/map/components/CampusMap.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅.

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Fix Dev HMR WebSocket Failures (/\_next/webpack-hmr)
Summary: Fixed repeated `web-socket.ts:50` failures by excluding all `/_next/*` routes from the Next.js proxy matcher. The previous matcher only excluded `/_next/static` and `/_next/image`, so `/_next/webpack-hmr` could be intercepted by proxy logic and break WebSocket upgrade flow. Updated both proxy matcher definitions to skip `/_next/` entirely.
Files: Modified [proxy.ts](proxy.ts), [tools/proxy/proxy.ts](tools/proxy/proxy.ts).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, HMR websocket smoke test to `ws://localhost:3000/_next/webpack-hmr` ✅ (`WS_OPEN`).

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Service Worker Fetch Failure Handling (sw.js:181)
Summary: Fixed the uncaught promise rejection in the service worker when network-only requests fail offline. Added a `getOfflineResponse()` helper for document, JSON/API, and generic requests, then wrapped the non-cacheable network fetch path in a catch block so it returns controlled `503` `no-store` responses instead of throwing `TypeError: Failed to fetch`.
Files: Modified [public/sw.js](public/sw.js).
Verification: `npm run lint` ✅, `npm run typecheck` ✅.

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Map Warning Placement Update - Move Off-Campus Banner to Bottom
Summary: Updated the off-campus warning placement per user request to render at the bottom of the map instead of top. Changed warning container positioning from top-based offsets to bottom anchoring (`bottom-3 left-3 right-3`) while preserving responsive layout, styling, and readability. This keeps the warning visible and avoids competing with top HUD controls.
Files: Modified [features/map/components/CampusMap.tsx](features/map/components/CampusMap.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test -- tests/map` ✅ (64/64 tests pass).

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Map Off-Campus Warning Overlap Fix (Places Button Access)
Summary: Fixed the off-campus warning banner covering the mobile Places/search quick button. The warning previously rendered at `top-3` with higher stack order (`z-[1200]`), overlapping the top-left mobile control area. Updated warning positioning/stacking so Places remains accessible: moved warning lower on phones (`top-14`, still `sm:top-3` on larger screens) and reduced warning layer to sit below HUD controls (`z-[1000]`). Result: warning remains visible, but no longer blocks the building search entry point.
Files: Modified [features/map/components/CampusMap.tsx](features/map/components/CampusMap.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test -- tests/map` ✅ (64/64 tests pass).

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Map Mobile UX Fix - Visible Building Search Toggle
Summary: Added an explicit mobile-only quick access button for the building search/Places panel because the responsive collapsed state made search feel invisible to users. Implementation: (1) Added a small floating `Places` button (`sm:hidden`) at top-left when the panel is collapsed. (2) Button opens the Places panel and triggers light haptic feedback. (3) Updated the left Places panel container to hide on mobile when collapsed (`hidden sm:flex`), while keeping desktop always visible/expanded behavior intact. This preserves responsive layout while ensuring discoverability of building search on phones.
Files: Modified [features/map/components/CampusMapHUD.tsx](features/map/components/CampusMapHUD.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test -- tests/map` ✅ (64/64 tests pass).

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Map Page Responsive Breakpoint Fixes (Mobile/Tablet/Desktop/Wide)
Summary: Applied a mobile-first responsiveness pass to `/map` without redesign. Root causes addressed: (1) map page shell and skeleton used rigid spacing/column defaults on narrow phones; (2) map layer controls header/actions could crowd or wrap poorly at tablet widths; (3) overlay toggle cards were too dense on small screens when rendered in two columns; (4) share/clear layer action row could overflow horizontally on mobile; (5) Places sidebar in HUD defaulted expanded despite intended mobile-collapsed behavior and occupied too much width, reducing map usability; (6) off-campus warning and Leaflet popup sizing could become cramped at narrow viewports. Changes: updated page/skeleton spacing and skeleton grid breakpoints, made map-layer header/actions wrap, switched overlay toggle grid to progressive `1→2→3`, stacked layer action buttons on mobile, set Places panel to mobile-collapsed/desktop-expanded via `matchMedia`, reduced mobile Places panel width, adjusted warning banner to stack on small screens, and replaced popup fixed min-width with viewport-constrained width.
Files: Modified [app/map/page.tsx](app/map/page.tsx), [features/map/components/MapClient.tsx](features/map/components/MapClient.tsx), [features/map/components/CampusMapHUD.tsx](features/map/components/CampusMapHUD.tsx), [features/map/components/CampusMap.tsx](features/map/components/CampusMap.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test -- tests/map` ✅ (64/64 tests pass). Lighthouse attempt still blocked by local `lhci` behavior (`Hello, this is AnupamAS01!`) with no report artifact generated.

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Calendar Responsive Follow-Up (Dialogs, Forms, Overflow Edge Cases)
Summary: Completed a second responsive pass for `/calendar` focused on dialog/form breakpoints and small-screen overflow that remained after the initial layout fix. Root causes addressed: (1) several calendar-linked forms and detail panels still used `grid-cols-2`/`grid-cols-3` patterns on phones, compressing controls; (2) custom confirmation modals in `CalendarClient` used fixed inner spacing and horizontal action rows, making 360–430px cramped; (3) stacked mobile/tablet calendar flow could still be constrained by shared overflow behavior; (4) Unit detail stats used a fixed 4-column grid, causing narrow-screen crowding. Changes: converted key field/info grids to mobile-first (`grid-cols-1 sm:grid-cols-2`, `grid-cols-1 sm:grid-cols-3`), updated Unit stats to `grid-cols-2 sm:grid-cols-4`, switched custom modal action rows to `flex-col-reverse sm:flex-row`, reduced modal padding on phones (`p-4 sm:p-6`), tightened modal max-height to `max-h-[calc(100vh-2rem)]`, and restricted internal overflow behavior to desktop where appropriate (`lg:overflow-hidden`, `lg:overflow-y-auto`). Also improved wrapping for quick-action rows in detail dialogs to prevent horizontal clipping.
Files: Modified [app/calendar/CalendarClient.tsx](app/calendar/CalendarClient.tsx), [components/assignments/AssignmentForm.tsx](components/assignments/AssignmentForm.tsx), [components/events/EventForm.tsx](components/events/EventForm.tsx), [components/exams/ExamForm.tsx](components/exams/ExamForm.tsx), [components/units/UnitForm.tsx](components/units/UnitForm.tsx), [components/assignments/AssignmentDetailPanel.tsx](components/assignments/AssignmentDetailPanel.tsx), [components/events/EventDetailPanel.tsx](components/events/EventDetailPanel.tsx), [components/exams/ExamDetailPanel.tsx](components/exams/ExamDetailPanel.tsx), [features/calendar/components/TodoDetailPanel.tsx](features/calendar/components/TodoDetailPanel.tsx), [components/units/UnitDetailPanel.tsx](components/units/UnitDetailPanel.tsx), [components/events/EventFormSkeleton.tsx](components/events/EventFormSkeleton.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test -- tests/CalendarPage.test.tsx` ✅ (4/4 tests pass). Lighthouse attempt still blocked by local `lhci` behavior (`Hello, this is AnupamAS01!`) with no report artifact generated.

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Calendar Page Responsive Breakpoint Fixes (Mobile/Tablet/Desktop/Wide)
Summary: Implemented mobile-first responsive fixes for `/calendar` without redesigning components. Root causes addressed: (1) main calendar/content layout was always horizontal (`flex` row), causing sidebar clipping on smaller breakpoints; (2) week grid switched to 7 columns at `md` (768px), making tablet/laptop cards too compressed; (3) desktop header controls had no wrap strategy, causing overflow pressure; (4) Day view used fixed `height: 600px`, causing clipping/unused space across viewport sizes; (5) page padding/skeleton widths were too rigid on narrow screens. Changes: switched main layout to `flex-col` below `lg` and `lg:flex-row` for desktop; added `min-w-0` safeguards; changed week grid breakpoints to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7`; enabled control wrapping in desktop header; made DayView height viewport-clamped (`clamp(...)`) with internal scrolling; tuned sidebar width for `lg/xl`; updated page/skeleton spacing to responsive `px/py` values.
Files: Modified [app/calendar/page.tsx](app/calendar/page.tsx), [app/calendar/CalendarClient.tsx](app/calendar/CalendarClient.tsx), [features/calendar/components/CalendarSidebar.tsx](features/calendar/components/CalendarSidebar.tsx), [features/calendar/components/DayView.tsx](features/calendar/components/DayView.tsx), [features/calendar/components/FilterPanel.tsx](features/calendar/components/FilterPanel.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test -- tests/CalendarPage.test.tsx` ✅ (4/4 tests pass). Lighthouse command was attempted (`npm run lighthouse:local` and `npx lhci collect ...`) but the configured `lhci` binary exits immediately with `Hello, this is AnupamAS01!`, so no Lighthouse report was produced in this environment.

Raouf: 2026-02-13 (Australia/Sydney)
Scope: Fix Select Dropdown Scroll & Notification Bulk Delete
Summary: Fixed two issues: (1) Select dropdown scroll — removed fixed `h-(--radix-select-trigger-height)` from Radix Select Viewport in popper mode. This CSS variable forced the Viewport to match the trigger height (~36px), preventing items from rendering beyond that height and breaking scroll. Changed to only set `min-w-(--radix-select-trigger-width)` so the Viewport sizes naturally to fit items, while Content's `max-h` and `overflow-y-auto` handle scrolling. (2) Notification bulk delete — added missing `DELETE /api/notifications` handler to the base notifications route. The store's `clearAll()` method was calling `DELETE /api/notifications` which returned 405 Method Not Allowed. New handler deletes all non-soft-deleted notifications for the authenticated user and returns the count.
Files: Modified [components/ui/select.tsx](components/ui/select.tsx), [app/api/notifications/route.ts](app/api/notifications/route.ts).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test` ✅ (442/442 tests pass).

Raouf: 2026-02-13 (Australia/Sydney)
Scope: Standardize Security Settings Toggle Components
Summary: Updated all security toggle components in Privacy settings to match the standard ToggleControl switch pattern used by NotificationSettings and GamificationSettings. Previously, BiometricToggle, TOTPSetup, and PasskeyManager used different visual patterns (round icon containers with `bg-mq-primary/10 rounded-full`, Badge status pills, and small ghost text buttons), creating visual inconsistency. Changes: (1) BiometricToggle — replaced text "Enable"/"Disable" Button with ToggleControl switch; removed round icon container and Badge; added inline icon with standard row layout; toggle click opens confirmation dialog. (2) TOTPSetup — same pattern; replaced text Button with ToggleControl switch; removed round icon container and Badge; simplified to standard row layout. (3) PasskeyManager — removed round icon container and Badge; simplified to standard row layout with inline icon; kept "Add" button styled consistently with Change Password/Manage Sessions buttons. (4) SMS Coming Soon section — updated to use standard row layout with inline MessageSquare icon. (5) Updated BiometricToggle tests to query `role="switch"` instead of `role="button"`.
Files: Modified [features/settings/components/security/BiometricToggle.tsx](features/settings/components/security/BiometricToggle.tsx), [features/settings/components/security/TOTPSetup.tsx](features/settings/components/security/TOTPSetup.tsx), [features/settings/components/security/PasskeyManager.tsx](features/settings/components/security/PasskeyManager.tsx), [features/settings/components/PrivacySettings.tsx](features/settings/components/PrivacySettings.tsx), [tests/unit/components/BiometricToggle.test.tsx](tests/unit/components/BiometricToggle.test.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test` ✅ (442/442 tests pass).

Raouf: 2026-02-13 (Australia/Sydney)
Scope: Wire Email Verification Integration Points
Summary: Wired the 4 integration points for the custom email verification system. (1) Signup route: after successful user+profile creation, calls `createAndSendVerification()` to generate token, store hash, and send email via Resend. Fire-and-forget to avoid blocking signup response. Skipped for dev emails in development (they get auto-confirmed). (2) Signup client: already handled — shows "Please check your email to verify your account" toast and redirects to /login when no session is returned. (3) Vercel Cron: created vercel.json with daily cleanup schedule (0 3 \* \* \*) calling GET /api/auth/email/cleanup. Updated cleanup route to support both GET (Vercel Cron) and POST (manual). (4) Extracted `createAndSendVerification()` orchestrator into emailVerification.ts for reuse between signup route and send-verification route (DRY).
Files: Modified [app/api/auth/signup/route.ts](app/api/auth/signup/route.ts), [lib/security/emailVerification.ts](lib/security/emailVerification.ts), [app/api/auth/email/send-verification/route.ts](app/api/auth/email/send-verification/route.ts), [app/api/auth/email/cleanup/route.ts](app/api/auth/email/cleanup/route.ts). Created [vercel.json](vercel.json).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test` ✅ (442/442 tests pass).

Raouf: 2026-02-13 (Australia/Sydney)
Scope: Custom Email Verification System (Resend)
Summary: Implemented a production-ready custom email verification system replacing Supabase email. Architecture: User → API → Database → Resend. (1) SQL migration: `email_verifications` table with SHA-256 token hashing, partial indexes, RLS, cleanup function, and optional pg_cron schedule. (2) Token module: 32-byte random token generation, SHA-256 hashing, 20-min expiry, rate limiter (3 sends/hour). (3) Email service: Resend API integration with branded HTML template, no raw tokens in logs. (4) Send verification route: POST /api/auth/email/send-verification — authenticated, rate-limited, invalidates previous tokens, stores hash only. (5) Verify route: POST /api/auth/email/verify — hashes incoming token, finds valid record, marks used, confirms user via admin API. Generic error messages prevent information leakage. (6) Cleanup route: POST /api/auth/email/cleanup — cron-protected endpoint calling SQL cleanup function. (7) Verify page: /verify?token=<token> — client-side landing page with loading/success/error states. (8) UI: replaced SMSSetup with "SMS verification coming soon" placeholder. (9) Config: added EMAIL_SEND_VERIFICATION, EMAIL_VERIFY, EMAIL_CLEANUP routes. (10) Env: added RESEND_API_KEY, VERIFICATION_EMAIL_FROM, CRON_SECRET to .env.local.example. No Supabase email. No SMS backend. No UI redesign.
Files: Created [supabase/migrations/20260213000000_email_verifications.sql](supabase/migrations/20260213000000_email_verifications.sql), [lib/security/emailVerification.ts](lib/security/emailVerification.ts), [lib/services/emailService.ts](lib/services/emailService.ts), [app/api/auth/email/send-verification/route.ts](app/api/auth/email/send-verification/route.ts), [app/api/auth/email/verify/route.ts](app/api/auth/email/verify/route.ts), [app/api/auth/email/cleanup/route.ts](app/api/auth/email/cleanup/route.ts), [app/verify/page.tsx](app/verify/page.tsx). Modified [lib/constants/config.ts](lib/constants/config.ts), [.env.local.example](.env.local.example), [features/settings/components/PrivacySettings.tsx](features/settings/components/PrivacySettings.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test` ✅ (442/442 tests pass).

Raouf: 2026-02-13 (Australia/Sydney)
Scope: Verify TOTP Authenticator App Wiring
Summary: Verified the full TOTP (Authenticator App) flow is correctly wired end-to-end from settings enrollment through login challenge verification. Traced: (1) Enrollment: TOTPSetup → POST /api/auth/mfa/enroll → Supabase MFA enroll → QR code + secret → POST /api/auth/mfa/verify → challenge + verify → factor verified. (2) Login: loginAction → signInWithPassword (aal1) → getAuthenticatorAssuranceLevel → if nextLevel=aal2, return mfaRequired with factors → MFAChallenge component → POST /api/auth/mfa/challenge-verify → challenge + verify → aal2. (3) Security: rate limiting on all endpoints, fail-closed on MFA check failure, Zod validation, no-cache headers on enrollment, input sanitisation. No issues found — all wiring is correct.
Files: No files modified (verification audit only).
Verification: `npm run test` ✅ (442/442 tests pass), 68/68 security tests pass across 7 test files.

Raouf: 2026-02-13 (Australia/Sydney)
Scope: Wire Security Settings to Login Page
Summary: Connected security settings from Privacy tab to the login page. (1) Fixed critical bug in passkey status API — was using `adminClient.from('auth.users')` which doesn't work with Supabase JS client for system tables; replaced with `adminClient.rpc('lookup_user_by_email')` matching the pattern used by the passkey options route. (2) Extended passkey status API to also return `mfaEnabled` field by checking verified MFA factors via admin API. (3) Enhanced login page with a "Security Methods" indicator section that appears after entering an email, showing biometric/passkey availability and 2FA status as color-coded badges. (4) Updated passkey button to only be clickable when passkey is actually available (disabled otherwise) with green border highlight when available. (5) Removed redundant passkey status text below button, replaced with the new integrated security methods panel.
Files: Modified [app/api/auth/passkey/status/route.ts](app/api/auth/passkey/status/route.ts), [app/login/LoginClient.tsx](app/login/LoginClient.tsx).
Verification: `npm run lint` ✅, `npm run typecheck` ✅, `npm run test` ✅ (442/442 tests pass).

Raouf: 2026-02-13 (Australia/Sydney)
Scope: Integrate Security Options into Privacy Settings Tab
Summary: Integrated all security options (Biometric, TOTP/Authenticator App, SMS 2FA, Passkeys/WebAuthn) into the Privacy settings tab. User wanted these security features wired up from settings to login. Implementation: (1) Added imports for BiometricToggle, TOTPSetup, SMSSetup, and PasskeyManager components. (2) Added MFA status fetching with fetchMFAStatus callback that calls API_ROUTES.AUTH.MFA_STATUS on mount. (3) Created new "Two-Factor Authentication & Security" section with loading state. (4) All security components now render in Privacy settings with proper factors state passing. (5) Fixed test failures by mocking security components (that use react-query) and useSessionManager hook to avoid QueryClient errors. (6) Added API_ROUTES.AUTH.PASSWORD and SECURITY_CONFIG to test mocks. All 23 PrivacySettings tests now pass.
Files: Modified [features/settings/components/PrivacySettings.tsx](features/settings/components/PrivacySettings.tsx), [tests/settings/PrivacySettings.test.tsx](tests/settings/PrivacySettings.test.tsx).
Verification: `npm test -- tests/settings/PrivacySettings.test.tsx` ✅ (23/23 tests pass).

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

Raouf: 2026-02-14 (Australia/Sydney)
Scope: Gamification Logic and Security Production Audit
Summary: Completed full gamification audit and implemented hardening/fixes across UI logic, client store behavior, API validation, and database RPC security. Fixes include: (1) corrected XP progress math bug in `useXPProgress`, (2) fixed compact stats progress percentage scaling bug, (3) removed persisted `hasLoaded` behavior that caused stale profile/event state and forced fresh fetch on boot via persist merge, (4) ensured logout store reset clears gamification state via `reset()` not `resetProgress()`, (5) hardened `GET /api/gamification` query limit parsing to prevent NaN/invalid values, (6) removed unsafe `any` casts in gamification POST route, (7) added CSRF protection and stricter schema validation to `/api/gamification/award-xp` (event attendance now requires UUID reference), (8) added duplicate-check/error-path hardening and RPC result shape validation, (9) updated feed XP award flow to only send event XP requests when event IDs are verifiable UUIDs, and (10) added DB migration to lock down `award_xp` and `update_streak` SECURITY DEFINER functions (search_path hardening, cross-user mutation guard, execute privilege restrictions).
Files: Modified `lib/store/gamificationStore.ts`, `features/gamification/components/GamificationStats.tsx`, `lib/utils/clientStorage.ts`, `app/api/gamification/route.ts`, `app/api/gamification/award-xp/route.ts`, `features/feed/hooks/useFeedLogic.ts`, `tests/gamification/GamificationStats.test.tsx`; Added `supabase/migrations/20260214000000_harden_gamification_rpc.sql`.
Verification: `npm run test -- tests/gamification` ✅ (96/96), `npm run typecheck` ✅, `npx eslint --config config/eslint/eslint.config.mjs ...changed files` ✅.
