# Design: Notification Accuracy, Profile Reload Speed, Auth Flow Hardening

**Date:** 2026-03-14
**Status:** Approved

---

## Task 1 — Notification Message Accuracy

### 1.1 Fix class reminder tag (High)

**File:** `lib/services/notificationService.ts:449`
**Bug:** Tag uses `class-${unitCode}-${Date.now()}` — every invocation creates a unique tag, defeating the `wasRecentlySent()` 5-minute cooldown. Multiple class reminders fire within 5 minutes since tags always differ.
**Fix:** Change to `class-${unitCode}-${classId}` (or `class-${unitCode}-${dayOfWeek}-${startTime}` if classId unavailable). Stable tag per class session.

### 1.2 Audit all notification tags

Verify every tag pattern is stable and dedup-safe:

- `deadline-${deadlineId}` — already stable
- `event-${eventId}` — already stable
- `class-${unitCode}-${Date.now()}` — broken, fix in 1.1
- Audit all other `sendNotification()` call sites for non-deterministic tag components

### 1.3 Fix `relatedId` null guard in Header (High)

**File:** `components/layout/Header.tsx:91-107`
**Bug:** `isNotificationOverdue()` checks `notification.relatedId` but if undefined, `find()` returns undefined and overdue badge silently never shows.
**Fix:** Early return `false` when `relatedId` is falsy. Dev-mode warning for notifications missing `relatedId`.

### 1.4 Fix push payload messages (Medium)

**File:** `app/api/cron/push-reminders/route.ts`

- Deadline: title `"Deadline: ${deadline.title}"`, body includes due time
- Event: title `"${event.title}"`, body includes location

### 1.5 Ensure `relatedId` in cron push data

**File:** `app/api/cron/push-reminders/route.ts`
**Bug:** Push payload `data` sends `id` but not `relatedId`. Notifications in store miss `relatedId` → Header overdue detection fails.
**Fix:** Add `relatedId: deadline.id` / `relatedId: event.id` to data payload.

---

## Task 2 — Profile Reload Speed

### 2.1 SWR-like caching in profilesStore (High)

**File:** `lib/store/profilesStore.ts`

- Add `lastFetched: number | null` to state
- `shouldRefetch()` helper: true if `lastFetched` null or older than 60s
- Guard `fetchProfile()` with `shouldRefetch()` — skip if fresh, unless `force: true`
- Set `lastFetched = Date.now()` after successful fetch
- Reset `lastFetched = null` on logout/clear

### 2.2 Optimistic update consistency (Medium)

**File:** `lib/store/profilesStore.ts`

- Extend optimistic update pattern to all profile fields (not just avatar)
- Store pre-update snapshot, rollback on API error

### 2.3 Cache-Control headers (Low)

**File:** `app/api/profiles/route.ts`

- GET response: `Cache-Control: private, max-age=0, must-revalidate`
- Prevents browser caching stale data; Zustand handles client caching

### 2.4 ReminderSettings refresh (Medium)

**File:** `app/manage-profiles/components/ReminderSettings.tsx`

- After push preference toggle, call `profilesStore.fetchProfile({ force: true })`
- Prevents stale email preference display after push toggle

---

## Task 3 — Auth Flow Hardening

### 3.1 Email verification gate in middleware (High)

**File:** `lib/supabase/middleware.ts`

- After `getUser()`, check `user.email_confirmed_at`
- If null and route is protected, redirect to `/verify?reason=unverified`
- **Whitelist (no check):** `/login`, `/verify`, `/api/auth/*`, `/api/health`, `/_next/static`, `/_next/image`, `favicon.ico`, `/maps`
- Critical: without asset whitelist, unverified users hit redirect loop or unstyled verify page

### 3.2 Explicit email check in login action (High)

**File:** `app/login/actions.ts`

- After `signInWithPassword()`, explicitly check `user.email_confirmed_at`
- If not confirmed, return `{ error: 'email_not_confirmed' }` — don't rely on Supabase error string parsing
- Keep existing resend button UX in LoginClient

### 3.3 Signup atomicity via Postgres trigger (High)

**File:** New SQL migration

- Create `after insert` trigger on `auth.users` → auto-insert blank `public.profiles` row
- Database-level atomicity, zero orphan risk
- Remove API-level rollback logic from `app/api/auth/signup/route.ts`

### 3.4 MFA — no change needed

Fail-closed pattern is correct. Server-side rate limiting (5/15min per IP) provides real enforcement. Client 5-attempt limit is UX guard only.

### 3.5 Signout cleanup audit (Verify only)

- Verify `resetAllStores()` + `clearAllClientStorage()` clears all 8 stores
- Verify `onAuthStateChange` triggers cleanup on `SIGNED_OUT`
- No code changes unless gap found

### 3.6 Session redirect via auth event listener (Low)

**File:** `app/login/LoginClient.tsx`

- Replace `setTimeout(800ms)` hack with `onAuthStateChange` listener
- Redirect on `SIGNED_IN` event when session is fully mounted
- Event-driven, no timing assumptions

### 3.7 Error state UX (Medium)

- Verify wrong password shows "Invalid credentials" (not raw Supabase error)
- Verify expired verification token shows "Link expired" + resend button
- Fix any raw error leaks

---

## Files Changed Summary

| File                                                  | Task | Changes                                     |
| ----------------------------------------------------- | ---- | ------------------------------------------- |
| `lib/services/notificationService.ts`                 | 1    | Fix class tag, audit all tags               |
| `components/layout/Header.tsx`                        | 1    | relatedId null guard                        |
| `app/api/cron/push-reminders/route.ts`                | 1    | Fix push payload titles/body, add relatedId |
| `lib/store/profilesStore.ts`                          | 2    | SWR caching, optimistic rollback            |
| `app/api/profiles/route.ts`                           | 2    | Cache-Control header                        |
| `app/manage-profiles/components/ReminderSettings.tsx` | 2    | Force refresh after toggle                  |
| `lib/supabase/middleware.ts`                          | 3    | email_confirmed_at gate + asset whitelist   |
| `app/login/actions.ts`                                | 3    | Explicit email check                        |
| `app/api/auth/signup/route.ts`                        | 3    | Remove rollback logic                       |
| New SQL migration                                     | 3    | Postgres trigger for profile auto-creation  |
| `app/login/LoginClient.tsx`                           | 3    | onAuthStateChange redirect                  |

## What's NOT changing

- Signout cleanup (already solid — 8 stores cleared)
- MFA fail-closed pattern (correct as-is)
- Event/deadline notification tags (already stable)
- `public/sw.js` (push handling is fine, fallback is acceptable)
