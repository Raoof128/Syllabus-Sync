### Raouf: Manage Profiles Responsive Breakpoint Pass - 2026-02-14

**Scope:** Make `/manage-profiles` responsive across phone, tablet, laptop, and wide breakpoints.
**Type:** UI Responsiveness - Layout/Overflow

#### Root Causes

1. Multiple preference/reminder rows used rigid `justify-between` horizontal layouts, causing compression on 360–430px screens.
2. Manage profile containers/skeleton used dense fixed padding that reduced small-screen readability.
3. Profile header summary did not explicitly guard long email/student id text from overflow pressure.
4. Save-action area did not adapt button width for narrow layouts.

#### Changes Applied

1. **Page-level spacing (`app/manage-profiles/page.tsx`)**
   - Updated empty-state and main-page containers to mobile-first padding/spacing.
   - Tuned empty-state heading/icon sizes for phone widths.
   - Updated save button to responsive width (`w-full sm:w-auto`).

2. **Profile header overflow hardening (`app/manage-profiles/components/ProfileHeader.tsx`)**
   - Made avatar size responsive on small screens.
   - Added `min-w-0` and `break-all` handling for email/student id content.
   - Scaled title text for smaller viewports.

3. **Reminder settings row responsiveness (`app/manage-profiles/components/ReminderSettings.tsx`)**
   - Converted all top-level preference and reminder rows from fixed horizontal layout to stacked mobile layout with `sm:` horizontal alignment.
   - Added `min-w-0`, `break-words`, icon `flex-shrink-0`, and explicit toggle wrappers to prevent text/control collisions.
   - Kept existing card visuals and control behavior unchanged.

4. **Skeleton and error state fit**
   - `ProfileSkeleton.tsx`: mobile-first container spacing.
   - `error.tsx`: switched to `min-h` + mobile padding for safer small-screen rendering.

#### Files Changed

- `app/manage-profiles/page.tsx`
- `app/manage-profiles/components/ProfileHeader.tsx`
- `app/manage-profiles/components/ReminderSettings.tsx`
- `app/manage-profiles/components/ProfileSkeleton.tsx`
- `app/manage-profiles/error.tsx`

#### Verification

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run test -- app/manage-profiles/__tests__/actions.test.ts` ⚠️ No tests discovered by configured Vitest include (`tests/**/*`)
- `npx vitest run app/manage-profiles/__tests__/actions.test.ts` ⚠️ Fails in ad-hoc mode due unresolved alias import (`@/lib/logger`) outside project test config path mapping
- `npm run lighthouse:local` attempted ⚠️ but local `lhci` exits with `Hello, this is AnupamAS01!` and no report artifact is generated in this environment.

---

### Raouf: Login Page Responsive Breakpoint Pass - 2026-02-14

**Scope:** Make `/login` fully responsive across phone, tablet, laptop, and wide breakpoints.
**Type:** UI Responsiveness - Layout/Overflow

#### Root Causes

1. Login shell used rigid spacing and fullscreen overflow behavior that could cause cramped/clipped layout on 360–430px.
2. Left auth panel used large default paddings and logo sizing on phones.
3. Right hero panel always rendered, creating excessive vertical footprint on small devices.
4. MFA challenge code input used large fixed typography/tracking, reducing comfort on narrow widths.
5. Fingerprint login control relied on fixed CSS width (`200px`) instead of fluid constraints.

#### Changes Applied

1. **Login shell and panel spacing (`app/login/LoginClient.tsx`)**
   - Added mobile-first outer padding and responsive min-height handling.
   - Updated container overflow strategy to avoid horizontal clipping while keeping desktop behavior.
   - Reduced left-panel paddings on phones and scaled logo/title sizing responsively.
   - Made primary form actions and OAuth buttons fluid (`w-full`, responsive text sizing).

2. **Hero panel responsiveness (`app/login/LoginClient.tsx`)**
   - Hid right hero panel on smallest screens (`hidden md:block`) to prioritize login usability.
   - Preserved hero panel on tablet/desktop with responsive text sizing and spacing.

3. **MFA challenge mobile fit (`app/login/components/MFAChallenge.tsx`)**
   - Tuned heading/icon and verification input sizing for narrow viewports.
   - Reduced input letter-spacing on phones and improved error text wrapping.

4. **Skeleton and control fluidity**
   - Updated login skeleton spacing/logo sizing (`app/login/page.tsx`) for phone widths.
   - Made fingerprint button base width fluid in CSS (`app/styles/fingerprint.css`) using `width: min(100%, 260px)` with small-screen height/font tuning.

#### Files Changed

- `app/login/LoginClient.tsx`
- `app/login/components/MFAChallenge.tsx`
- `app/login/page.tsx`
- `app/styles/fingerprint.css`

#### Verification

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run test -- app/login/__tests__/actions.test.ts tests/security/login-mfa-failclosed.test.ts` ✅ (4/4 tests pass)
- `npm run lighthouse:local` attempted ⚠️ but local `lhci` exits with `Hello, this is AnupamAS01!` and no report artifact is generated in this environment.

---

### Raouf: Settings Page Responsive Breakpoint Pass - 2026-02-14

**Scope:** Make `/settings` pages fully responsive across phone, tablet, laptop, and wide breakpoints.
**Type:** UI Responsiveness - Layout/Overflow

#### Root Causes

1. Settings subpages used early `md:grid-cols-2` splits, causing cramped cards on tablets and narrower laptops.
2. Settings shell spacing/heading alignment used rigid values (`ml-[44px]`, larger default paddings) that reduced small-screen readability.
3. Multiple card rows used non-wrapping `justify-between` action layouts, causing compression/overflow with long labels and controls.
4. Security card internals had overflow risk for long passkey/totp text (manual secret/device metadata) on narrow screens.

#### Changes Applied

1. **Settings shell & section pages**
   - Updated shell spacing and title sizing in `app/settings/layout.tsx` to mobile-first `px/py` values.
   - Made subtitle alignment responsive (`sm:ml-[44px]` only).
   - Improved content area resilience with `min-w-0` and adjusted min-height.
   - Updated section grids:
     - `security` and `experience` now split to 2 columns at `xl` (not `md`).
     - `general`, `appearance`, `support` use tighter mobile-first spacing.

2. **Card action rows**
   - Converted key settings rows from fixed horizontal layouts to stacked mobile layouts with `sm:` horizontal alignment:
     - Notification permission banner + master toggle
     - Notification row toggles and timing select
     - Privacy card actions (change password, manage sessions, privacy policy)
     - Map settings haptic toggle row
     - Biometric/TOTP/Passkey top rows
     - Gamification reset row
   - Added mobile full-width button behavior where needed (`w-full sm:w-auto`).

3. **Overflow hardening**
   - TOTP manual secret row now wraps (`flex-wrap`, `break-all`, `max-w-full`).
   - Passkey credential rows now stack on mobile and allow device metadata to wrap.
   - Quick actions now support wrapped labels and auto-height rows.
   - Help/support action buttons now full-width on mobile.
   - Settings skeleton updated with mobile-first padding/gaps and single-column progress skeleton on phones.

#### Files Changed

- `app/settings/layout.tsx`
- `app/settings/general/page.tsx`
- `app/settings/appearance/page.tsx`
- `app/settings/security/page.tsx`
- `app/settings/experience/page.tsx`
- `app/settings/support/page.tsx`
- `features/settings/components/NotificationSettings.tsx`
- `features/settings/components/NotificationRow.tsx`
- `features/settings/components/GamificationSettings.tsx`
- `features/settings/components/MapSettings.tsx`
- `features/settings/components/PrivacySettings.tsx`
- `features/settings/components/security/TOTPSetup.tsx`
- `features/settings/components/security/PasskeyManager.tsx`
- `features/settings/components/security/BiometricToggle.tsx`
- `features/settings/components/QuickActions.tsx`
- `features/settings/components/HelpSupport.tsx`
- `features/settings/components/SettingsSkeleton.tsx`

#### Verification

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run test -- tests/settings` ✅ (85/85 tests pass)
- `npm run lighthouse:local` attempted ⚠️ but local `lhci` exits with `Hello, this is AnupamAS01!` and no report artifact is generated in this environment.

---

### Raouf: Map Off-Campus Warning 3-Second Popup - 2026-02-14

**Scope:** Replace persistent off-campus banner with a timed popup.
**Type:** UX Fix - Map Warning Behavior

#### Changes Applied

1. Added local popup state and timer refs in `CampusMap.tsx`:
   - `showOffCampusWarning`
   - transition tracking (`wasOffCampusRef`)
   - timeout cleanup refs
2. Updated off-campus effect logic:
   - show warning only when transitioning to off-campus
   - auto-hide warning after 3 seconds
   - clear popup/timers immediately when returning on-campus
3. Updated warning render condition:
   - from `isOffCampus` to `showOffCampusWarning`
4. Added cleanup for all warning timers on unmount.

#### Files Changed

- `features/map/components/CampusMap.tsx`

#### Verification

- `npm run lint` ✅
- `npm run typecheck` ✅

---

### Raouf: Dev HMR WebSocket Stability Fix - 2026-02-14

**Scope:** Fix repeated `web-socket.ts:50` errors for `/_next/webpack-hmr`.
**Type:** Bug Fix - Dev Tooling / Next.js Proxy

#### Root Cause

The proxy matcher excluded only `/_next/static` and `/_next/image`, but not `/_next/webpack-hmr`. As a result, HMR websocket requests could be routed through proxy logic and fail to upgrade reliably.

#### Changes Applied

1. Updated root proxy matcher in `proxy.ts`:
   - from `/_next/static|_next/image`
   - to `/_next/` (exclude all Next internals, including HMR websocket endpoint)
2. Updated `tools/proxy/proxy.ts` matcher to the same pattern for consistency and future maintainability.
3. Updated matcher comments to document that `/_next/` exclusion includes HMR websocket traffic.

#### Files Changed

- `proxy.ts`
- `tools/proxy/proxy.ts`

#### Verification

- `npm run lint` ✅
- `npm run typecheck` ✅
- Live HMR websocket smoke test ✅ (`ws://localhost:3000/_next/webpack-hmr` opened successfully)

---

### Raouf: Service Worker Fetch Failure Handling - 2026-02-14

**Scope:** Fix `sw.js:181` uncaught `TypeError: Failed to fetch` for network-only routes.
**Type:** Bug Fix - PWA / Service Worker

#### Root Cause

The network-only branch (`!isCacheable(url)`) called `fetch(request)` without rejection handling. When offline or when a request failed at the network layer, the promise rejection surfaced as an uncaught error in the service worker.

#### Changes Applied

1. Added `getOfflineResponse(request)` in `public/sw.js` to return safe `503` responses with `Cache-Control: no-store` for:
   - document/navigation requests (minimal offline HTML response)
   - JSON/API requests (JSON error payload)
   - other non-cacheable requests (empty `503` response)
2. Wrapped the non-cacheable `fetch(request)` path in `.catch(...)` and returned `getOfflineResponse(request)` to prevent unhandled promise rejections.

#### Files Changed

- `public/sw.js`

#### Verification

- `npm run lint` ✅
- `npm run typecheck` ✅

---

### Raouf: Map Warning Moved to Bottom — 2026-02-14

**Scope:** Move the off-campus warning banner to the bottom of the map.
**Type:** UI Adjustment — Positioning

#### Change Applied

1. **Warning position update (`features/map/components/CampusMap.tsx`)**
   - Repositioned off-campus warning from top placement to bottom placement:
     - from top-based offsets
     - to `bottom-3 left-3 right-3`
   - Kept existing styling and responsive stacking behavior intact.

#### Files Changed

- `features/map/components/CampusMap.tsx`

#### Verification

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run test -- tests/map` ✅ (64/64 tests pass)

---

### Raouf: Map Off-Campus Warning Overlap Fix — 2026-02-14

**Scope:** Prevent off-campus warning from blocking mobile Places/search access on `/map`.
**Type:** UI Responsiveness — Layering/Position Fix

#### Root Cause

The off-campus warning banner was positioned at `top-3` with `z-[1200]`, which overlaid the mobile top-left Places quick button and made building search hard to access.

#### Changes Applied

1. **Warning offset on mobile**
   - Changed warning top offset to `top-14` on small screens, while keeping `sm:top-3` on larger screens.

2. **Layer priority adjustment**
   - Lowered warning layer from `z-[1200]` to `z-[1000]` so HUD controls remain interactive.

#### Files Changed

- `features/map/components/CampusMap.tsx`

#### Verification

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run test -- tests/map` ✅ (64/64 tests pass)

---

### Raouf: Map Mobile Search Toggle Visibility Fix — 2026-02-14

**Scope:** Ensure building search is discoverable in responsive/mobile mode on `/map`.
**Type:** UI Responsiveness — UX Fix

#### Root Cause

After responsive updates, the Places panel was collapsed on mobile by default and users could miss where to open building search.

#### Changes Applied

1. **Mobile quick access button (`features/map/components/CampusMapHUD.tsx`)**
   - Added a small floating `Places` button (`sm:hidden`) at top-left when the panel is collapsed.
   - Button opens the panel and triggers light haptic feedback.

2. **Collapsed panel visibility behavior**
   - Left Places panel is now hidden on mobile when collapsed and remains available on desktop:
     - `!isPlacesPanelExpanded && 'hidden sm:flex'`
   - This keeps map view clean while preserving obvious entry point for search.

#### Files Changed

- `features/map/components/CampusMapHUD.tsx`

#### Verification

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run test -- tests/map` ✅ (64/64 tests pass)

---

### Raouf: Map Page Responsive Breakpoint Fixes — 2026-02-14

**Scope:** Make `/map` fully responsive across phone/tablet/laptop/wide breakpoints without redesign.
**Type:** UI Responsiveness — Layout/Overflow

#### Root Causes Found

1. Map page shell and skeleton used rigid spacing and dense default grids on narrow devices.
2. Map layers header/actions could crowd at intermediate widths due non-wrapping layout.
3. Overlay toggle cards rendered as two columns at all small widths, compressing content on phones.
4. Active-layer action row (`Copy Link` / `Clear All`) could overflow horizontally.
5. HUD Places panel defaulted expanded on mobile (contrary to intended behavior) and consumed excessive viewport width.
6. Off-campus warning and selected-building popup width constraints could become tight on narrow screens.

#### Changes Applied

1. **Map page shell/skeleton (`app/map/page.tsx`)**
   - Updated skeleton container spacing to mobile-first: `px-3 py-4 sm:p-4`.
   - Made heading skeleton widths fluid (`w-full max-w-*`).
   - Building skeleton grid now progressive: `grid-cols-1 sm:grid-cols-2 md:grid-cols-4`.

2. **Map page main layout controls (`features/map/components/MapClient.tsx`)**
   - Updated page section spacing to mobile-first (`px-3 py-4 sm:p-4`).
   - Scaled heading typography for phones: `text-mq-2xl sm:text-mq-3xl`.
   - Refactored map-layer header row to wrap on small widths (no control crowding).
   - Overlay toggle grid now progressive: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
   - Active-layer action row now stacks on mobile and aligns horizontally on larger screens.

3. **HUD responsiveness (`features/map/components/CampusMapHUD.tsx`)**
   - Implemented intended behavior: Places panel collapsed by default on mobile, expanded on desktop (`matchMedia('(min-width: 640px)')` sync).
   - Reduced mobile Places panel width to avoid overlap pressure with top-right toolbar:
     - `w-[min(240px,calc(100vw-24px))]` on mobile
     - `sm:w-[min(320px,calc(100vw-24px))]` on larger sizes.

4. **Map overlays/readability (`features/map/components/CampusMap.tsx`)**
   - Off-campus warning banner now stacks text on mobile (`flex-col`) and restores row layout on larger screens.
   - Selected-building popup content width changed from fixed min/max widths to viewport-constrained width:
     - `w-[min(320px,calc(100vw-5rem))]`.

#### Files Changed

- `app/map/page.tsx`
- `features/map/components/MapClient.tsx`
- `features/map/components/CampusMapHUD.tsx`
- `features/map/components/CampusMap.tsx`

#### Verification

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run test -- tests/map` ✅ (64/64 tests pass)
- `npm run lighthouse:local` attempted, but local `lhci` still exits with `Hello, this is AnupamAS01!` and does not generate a report artifact in this environment.

---

### Raouf: Calendar Responsive Follow-Up (Dialogs & Forms) — 2026-02-14

**Scope:** Complete calendar-page responsiveness by fixing remaining dialog/form breakpoint issues.
**Type:** UI Responsiveness — Follow-up

#### Additional Root Causes Found

1. Several calendar-linked forms/details still used fixed multi-column grids on phone widths (`grid-cols-2`, `grid-cols-3`, `grid-cols-4`).
2. Custom delete/todo modals in `CalendarClient` used large fixed padding and horizontal action rows, crowding 360–430px screens.
3. Main calendar wrapper overflow behavior could still constrain stacked mobile/tablet flow.
4. Quick-action rows in detail panels did not wrap when content/actions were long.

#### Changes Applied

1. **Calendar wrapper + custom modals (`app/calendar/CalendarClient.tsx`)**
   - Made overflow behavior breakpoint-aware for stacked layouts:
     - Wrapper now uses desktop-only hidden overflow: `lg:overflow-hidden`.
     - Main pane uses desktop-only internal scrolling: `lg:overflow-y-auto lg:overflow-x-hidden`.
   - Updated all custom confirm/todo modal panels:
     - `p-6 -> p-4 sm:p-6`
     - `max-h-[90vh] -> max-h-[calc(100vh-2rem)]`
     - action rows now stack on mobile: `flex-col-reverse sm:flex-row sm:justify-end`

2. **Forms (mobile-first field grids)**
   - `components/assignments/AssignmentForm.tsx`: date/time row `grid-cols-1 sm:grid-cols-2`
   - `components/events/EventForm.tsx`: date/time and building/room rows `grid-cols-1 sm:grid-cols-2`; delete-confirm inline row now wraps
   - `components/exams/ExamForm.tsx`: building/room and date/time rows `grid-cols-1 sm:grid-cols-2`
   - `components/units/UnitForm.tsx`:
     - location row `grid-cols-1 sm:grid-cols-2`
     - class-time row changed to mobile-first stacking with `sm:flex-row`
     - day/start/end controls `grid-cols-1 sm:grid-cols-3`

3. **Detail dialogs (card grids + action wrapping)**
   - `components/assignments/AssignmentDetailPanel.tsx`
   - `components/events/EventDetailPanel.tsx`
   - `components/exams/ExamDetailPanel.tsx`
   - `features/calendar/components/TodoDetailPanel.tsx`
   - For all above:
     - dialog max-height updated to `max-h-[calc(100vh-2rem)]`
     - top action rows now wrap (`flex-wrap`, `gap-3`)
     - info-card grids now `grid-cols-1 sm:grid-cols-2`
   - `TodoDetailPanel`: due-date card span adjusted to `col-span-1 sm:col-span-2` to prevent narrow-grid overflow.

4. **Unit detail + skeleton**
   - `components/units/UnitDetailPanel.tsx`:
     - dialog max-height updated to `max-h-[calc(100vh-2rem)]`
     - header row/actions now wrap on small screens
     - stats grid `grid-cols-2 sm:grid-cols-4`
   - `components/events/EventFormSkeleton.tsx`: placeholder grid `grid-cols-1 sm:grid-cols-2`

#### Files Changed

- `app/calendar/CalendarClient.tsx`
- `components/assignments/AssignmentForm.tsx`
- `components/events/EventForm.tsx`
- `components/exams/ExamForm.tsx`
- `components/units/UnitForm.tsx`
- `components/assignments/AssignmentDetailPanel.tsx`
- `components/events/EventDetailPanel.tsx`
- `components/exams/ExamDetailPanel.tsx`
- `features/calendar/components/TodoDetailPanel.tsx`
- `components/units/UnitDetailPanel.tsx`
- `components/events/EventFormSkeleton.tsx`

#### Verification

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run test -- tests/CalendarPage.test.tsx` ✅ (4/4 tests pass)
- `npm run lighthouse:local` attempted again, but local `lhci` still exits with `Hello, this is AnupamAS01!` and produces no report artifact in this environment.

---

### Raouf: Calendar Page Responsive Breakpoint Fixes — 2026-02-14

**Scope:** Make `/calendar` fully responsive across phone/tablet/laptop/wide breakpoints without redesign.
**Type:** UI Responsiveness — Layout/Overflow

#### Root Causes Found

1. Main content + sidebar container stayed in horizontal flex mode at all sizes, which could clip/hide sidebar widgets on smaller breakpoints.
2. Week view used `md:grid-cols-7`, forcing a dense 7-column calendar starting at 768px.
3. Desktop header controls had no wrapping strategy, causing overflow pressure at intermediate widths.
4. Day view used fixed `height: 600px`, causing clipping on short screens and poor scaling on larger ones.
5. Calendar page and skeleton spacing used rigid padding/widths that were less resilient on narrow phones.

#### Changes Applied

1. **Calendar page spacing (`app/calendar/page.tsx`)**
   - Updated main container to responsive spacing: `px-3 py-4 sm:px-6 sm:py-6`.
   - Updated skeleton widths/padding to avoid narrow-screen overflow.

2. **Main calendar layout (`app/calendar/CalendarClient.tsx`)**
   - Changed main body wrapper to `flex-col` on mobile/tablet and `lg:flex-row` on larger screens.
   - Added `min-w-0` to primary scroll container to prevent flex overflow.
   - Updated week grid breakpoints to progressive columns: `1 -> 2 -> 3 -> 7` (`xl` for 7-day layout).
   - Improved header responsiveness: wrapped desktop control groups and reduced rigid spacing.
   - Improved mobile header wrapping/truncation for long month text.

3. **Sidebar sizing (`features/calendar/components/CalendarSidebar.tsx`)**
   - Kept full width below `lg`, and tuned desktop width to `lg:w-[22rem] xl:w-96` for better laptop balance.

4. **Day view viewport fitting (`features/calendar/components/DayView.tsx`)**
   - Replaced fixed `height: 600px` with responsive clamped heights:
     - `h-[clamp(28rem,65vh,52rem)]`
     - `md:h-[clamp(32rem,68vh,56rem)]`
   - Kept internal scroll behavior and prevented horizontal overflow.

5. **Filter action alignment (`features/calendar/components/FilterPanel.tsx`)**
   - Adjusted action row span/alignment so controls don’t crowd at tablet/laptop widths.

#### Files Changed

- `app/calendar/page.tsx`
- `app/calendar/CalendarClient.tsx`
- `features/calendar/components/CalendarSidebar.tsx`
- `features/calendar/components/DayView.tsx`
- `features/calendar/components/FilterPanel.tsx`

#### Verification

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run test -- tests/CalendarPage.test.tsx` ✅ (4/4 tests pass)
- Lighthouse attempted via `npm run lighthouse:local` and direct `npx lhci collect ...`, but the configured `lhci` command exits immediately with `Hello, this is AnupamAS01!` in this environment, so no report artifact was generated.

---

### Raouf: Fix Select Dropdown Scroll & Notification Bulk Delete — 2026-02-13

**Scope:** Fix two bugs — non-scrollable Select dropdown and missing notification clear endpoint.
**Type:** Bug Fix — UI / API

#### Changes Applied

1. **Select Dropdown Scroll Fix (select.tsx)**: Removed fixed `h-(--radix-select-trigger-height)` from the Radix Select Viewport in popper mode. This CSS variable forced the Viewport to match the trigger height (~36px), preventing items from rendering and scroll from working. The Viewport now sizes naturally to fit its children, while the Content's `max-h` and `overflow-y-auto` constrain and scroll the dropdown.

2. **Notification Bulk Delete (notifications/route.ts)**: Added missing `DELETE /api/notifications` handler. The store's `clearAll()` method was calling `DELETE /api/notifications` which returned 405 Method Not Allowed because only GET and POST were exported. New handler authenticates the user, deletes all their non-soft-deleted notifications, and returns the deleted count.

#### Files Changed

- `components/ui/select.tsx`
- `app/api/notifications/route.ts`

#### Verification

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run test` ✅ (442/442 tests pass)

---

### Raouf: Standardize Security Settings Toggle Components — 2026-02-13

**Scope:** Fix visual inconsistency in Privacy settings security toggles.
**Type:** UI Polish — Settings Page

**Changes:**

- **BiometricToggle**: Replaced text "Enable"/"Disable" ghost button with standard `ToggleControl` switch. Removed round icon container and Badge pills. Toggle opens confirmation dialog.
- **TOTPSetup**: Same treatment — replaced text button with `ToggleControl` switch, removed round icon container and Badge.
- **PasskeyManager**: Removed round icon container and Badge. Simplified to standard row layout with inline icon. "Add" button styled consistently with other settings buttons.
- **SMS Coming Soon**: Updated to standard row layout with inline `MessageSquare` icon.
- **Tests**: Updated BiometricToggle tests to query `role="switch"` instead of `role="button"`.

**Files:** `BiometricToggle.tsx`, `TOTPSetup.tsx`, `PasskeyManager.tsx`, `PrivacySettings.tsx`, `BiometricToggle.test.tsx`
**Verification:** lint ✅, typecheck ✅, 442/442 tests ✅

---

### Raouf: Custom Email Verification System — 2026-02-13

**Scope:** Replace Supabase email verification with a fully custom flow using Resend.
**Type:** Feature — Security Infrastructure

#### Architecture

`User → API → Database → Resend (email provider)`

No Supabase email service. No Supabase OTP. No magic links.

#### Deliverables

1. **SQL Migration** (`supabase/migrations/20260213000000_email_verifications.sql`):
   - `email_verifications` table with UUID PK, `user_id`, `token_hash` (SHA-256), `expires_at`, `used`, `created_at`
   - Partial indexes for fast token lookup, cleanup, and per-user invalidation
   - RLS enabled (service_role only)
   - `cleanup_expired_email_verifications()` SQL function
   - Optional `pg_cron` daily schedule (3:00 AM UTC)

2. **Token Utility** (`lib/security/emailVerification.ts`):
   - `generateVerificationToken()` — 32 random bytes, hex
   - `hashToken()` — SHA-256 hash (only hash stored in DB)
   - `getTokenExpiry()` — 20-minute expiry
   - `emailVerifySendLimiter` — 3 sends per hour per user, fail-closed

3. **Email Service** (`lib/services/emailService.ts`):
   - Resend API integration (`RESEND_API_KEY`)
   - Branded HTML template (Macquarie University crimson header, verify button, footer)
   - `sendVerificationEmail({ to, token })` — raw token in URL, never logged

4. **Send Verification Route** (`POST /api/auth/email/send-verification`):
   - Authenticated (requires session)
   - Rate-limited (3/hour via `emailVerifySendLimiter`)
   - Invalidates previous active tokens for the user
   - Generates new token, stores SHA-256 hash, sends email via Resend

5. **Verify Route** (`POST /api/auth/email/verify`):
   - Hashes incoming token, finds non-used + non-expired record
   - Marks token used (atomic update with race condition guard)
   - Confirms user via `adminClient.auth.admin.updateUserById()` with `email_confirm: true`
   - Generic "Invalid or expired verification link" for all failure cases (no info leakage)

6. **Cleanup Route** (`POST /api/auth/email/cleanup`):
   - Protected by `CRON_SECRET` bearer token
   - Calls `cleanup_expired_email_verifications()` RPC
   - Returns deleted count

7. **Verify Page** (`/verify?token=<raw_token>`):
   - Client-side landing page with loading → success/error states
   - Validates token format before sending to API
   - Links back to login on success or failure

8. **UI Update** (`PrivacySettings.tsx`):
   - Replaced `<SMSSetup>` component with "SMS verification coming soon" placeholder
   - Greyed out card with "Coming Soon" badge

9. **Config**:
   - Added `EMAIL_SEND_VERIFICATION`, `EMAIL_VERIFY`, `EMAIL_CLEANUP` to `API_ROUTES.AUTH`
   - Added `RESEND_API_KEY`, `VERIFICATION_EMAIL_FROM`, `CRON_SECRET` to `.env.local.example`

#### Security Constraints Met

- HTTPS only (token in URL, verified server-side)
- No raw tokens stored (SHA-256 only)
- 20-minute token expiry (no long-lived tokens)
- Tokens marked used after verification (no reuse)
- Generic error messages (no information leakage)
- Zod validation on all inputs
- Raw tokens never logged
- Rate limiting: 3 sends/hour, fail-closed
- Cron endpoint protected by shared secret

#### Files Changed

- `supabase/migrations/20260213000000_email_verifications.sql` (new)
- `lib/security/emailVerification.ts` (new)
- `lib/services/emailService.ts` (new)
- `app/api/auth/email/send-verification/route.ts` (new)
- `app/api/auth/email/verify/route.ts` (new)
- `app/api/auth/email/cleanup/route.ts` (new)
- `app/verify/page.tsx` (new)
- `lib/constants/config.ts` (modified)
- `.env.local.example` (modified)
- `features/settings/components/PrivacySettings.tsx` (modified)

#### Verification

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run test` ✅ (442/442 tests pass)

---

### Raouf: Verify TOTP Authenticator App Wiring — 2026-02-13

**Scope:** Audit and verify the full Authenticator App (TOTP) flow is correctly wired from settings to login.
**Type:** Verification / Security Audit

#### Findings

**Status: Fully Wired & Working** — No issues found.

1. **Enrollment Flow (Settings → Privacy Tab)**:
   - `TOTPSetup.tsx` → `POST /api/auth/mfa/enroll` → Supabase `mfa.enroll({ factorType: 'totp' })`
   - Returns QR code, secret, URI with `Cache-Control: no-store` (prevents TOTP secret caching)
   - User enters 6-digit code → `POST /api/auth/mfa/verify` → `mfa.challenge()` + `mfa.verify()` → factor verified
   - Unenroll via `POST /api/auth/mfa/unenroll` requires aal2 re-authentication

2. **Login Flow**:
   - `loginAction()` → `signInWithPassword()` (aal1) → `getAuthenticatorAssuranceLevel()`
   - If `nextLevel === 'aal2'` && `currentLevel === 'aal1'` → returns `mfaRequired: true` with verified factors
   - `MFAChallenge` component renders → user enters code → `POST /api/auth/mfa/challenge-verify`
   - Server creates challenge + verifies → session upgraded to aal2 → redirect to /home
   - **Fail-closed**: If MFA check throws, login is blocked (prevents MFA bypass)

3. **Security Controls**:
   - Rate limiting: 5 verify attempts/15min, 10 enrollments/hour, 5 unenrollments/hour
   - Zod validation on all endpoints (UUID factorId, 6-digit numeric code)
   - Client-side: 5 max attempts, auto-cancel after max failures
   - Factor switcher supports both TOTP and SMS

4. **Test Coverage**: 68/68 security tests pass (mfa.test.ts, mfa-status.test.ts, totp-enroll-cachecontrol.test.ts, login-mfa-failclosed.test.ts, webauthn tests)

---

### Raouf: Wire Security Settings to Login Page — 2026-02-13

**Scope:** Connect security settings from Privacy tab to the login page with visual indicators.
**Type:** Bug Fix / Feature Enhancement

#### Changes Applied

1. **Passkey Status API Bug Fix (passkey/status/route.ts)**:
   - **Bug:** Was using `adminClient.from('auth.users')` which silently fails with Supabase JS client (can't query system tables). This caused the biometric login button to always show "disabled" on the login page.
   - **Fix:** Replaced with `adminClient.rpc('lookup_user_by_email')` RPC call, matching the working pattern from the passkey options route.
   - **Enhancement:** Now also returns `mfaEnabled` field by checking verified MFA factors via `adminClient.auth.admin.mfa.listFactors()`.

2. **Login Page Security Indicators (LoginClient.tsx)**:
   - Added a "Security Methods" panel that appears after the user enters a valid email
   - Shows color-coded badges for:
     - **Biometric Login**: green badge when passkey/biometric is registered, grey when not
     - **2FA Status**: green "2FA Enabled" badge when TOTP/SMS is set up, grey "2FA Off" when not
   - Updated passkey button: disabled when passkey is unavailable, highlighted with green border when available
   - Removed redundant passkey status text, replaced with integrated security methods panel

#### Files Changed

- `app/api/auth/passkey/status/route.ts`
- `app/login/LoginClient.tsx`

#### Verification

- `npm run lint` ✅
- `npm run typecheck` ✅
- `npm run test` ✅ (442/442 tests pass)

---

### Raouf: Integrate Security Options into Privacy Settings Tab — 2026-02-13

**Scope:** Add all security options to Privacy settings tab with full test coverage.
**Type:** Feature Integration / Test Fix

#### Changes Applied

1. **Security Components Integration (PrivacySettings.tsx)**: Integrated all multi-factor authentication and security options into the Privacy settings tab:
   - Added BiometricToggle component for fingerprint/face ID authentication
   - Added TOTPSetup component for authenticator app 2FA (Google Authenticator, Authy, etc.)
   - Added SMSSetup component for SMS-based 2FA
   - Added PasskeyManager component for WebAuthn/FIDO2 passkeys
   - Implemented MFA status fetching with `fetchMFAStatus` callback that calls `/api/auth/mfa/status`
   - Added loading state while fetching MFA factors
   - Created new "Two-Factor Authentication & Security" section with Shield icon

2. **Test Suite Fixes (PrivacySettings.test.tsx)**: Fixed all 23 tests that were failing due to react-query dependency:
   - Mocked security components (BiometricToggle, TOTPSetup, SMSSetup, PasskeyManager) to avoid QueryClient errors
   - Mocked `useSessionManager` hook with controllable state for session-related tests
   - Added API_ROUTES.AUTH.MFA_STATUS and API_ROUTES.AUTH.PASSWORD to config mock
   - Added SECURITY_CONFIG with MIN_PASSWORD_LENGTH to config mock
   - Updated all tests to mock MFA status fetch on component mount
   - Updated session tests to use mocked hook instead of expecting direct fetch calls
   - Fixed async/await patterns in act() calls for proper state update handling

#### Files Changed

- `features/settings/components/PrivacySettings.tsx`
- `tests/settings/PrivacySettings.test.tsx`

#### Verification

- `npm test -- tests/settings/PrivacySettings.test.tsx` ✅ (23/23 tests pass)
- All security components properly integrated
- MFA status fetching works correctly
- Tests are robust with proper mocking

---

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
