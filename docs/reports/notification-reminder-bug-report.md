# Bug Report: Notification & Reminder System — "Appears Then Disappears"

**Date:** 16 March 2026 (AEDT)
**Status:** In Progress — Final Fix Deployed, Awaiting Confirmation
**Severity:** High — Core UX feature broken
**Affected Area:** Bell notification dropdown, reminder scheduling, notification persistence

---

## 1. Problem Statement

When a user sets a reminder via the ReminderModal (bell icon on calendar items), the notification briefly appears in the Header bell dropdown, then **disappears after a few seconds**. The same issue affects reminder-fired notifications — when the reminder's scheduled time arrives, the alarm notification flashes in the bell and vanishes.

**User expectation:**

1. Set a reminder → a "Reminder Set" notification appears in the bell and **stays**
2. When the reminder time arrives → a "Reminder: {title}" notification appears in the bell and **stays**

**Actual behavior:**
Notifications appeared for 1–5 seconds then vanished from the bell dropdown.

---

## 2. Root Cause Analysis

The bug was caused by **multiple interacting issues** across 4 files, not a single root cause.

### 2.1 Race Condition: `loadNotifications` vs `addNotification` (Primary Cause)

**File:** `lib/store/notificationsStore.ts`

The notifications store uses an optimistic UI pattern:

- `addNotification` immediately adds a `temp-*` notification to the store, then POSTs to the API
- `loadNotifications` fetches all notifications from the server and **replaces** the entire store array

The **race condition:**

1. User sets reminder → `addNotification` adds `temp-123` to store → appears in bell
2. Modal closes → focus returns to page
3. Header's `focus` event handler calls `loadNotifications()`
4. `loadNotifications` GETs from server → server doesn't have the notification yet (POST still in-flight)
5. Merge logic **replaces** the store array with server data → `temp-123` is gone
6. Notification disappears from bell (~1 second after appearing)

The merge had a 10-second "grace window" to preserve recent notifications, but it was insufficient due to:

- Browser tab throttling extending timings
- `lastLoadedAt` invalidation causing immediate re-fetches
- The `_loadInFlight` concurrency guard not covering `addNotification` POSTs

### 2.2 Missing Bell Notification on Reminder Update

**File:** `components/ui/ReminderModal.tsx`

When updating an existing reminder (`existingReminderId` was truthy), `handleSave` called `updateReminder()` + toast but **skipped `addNotification()` entirely**. Only first-time reminder creation produced a bell notification.

### 2.3 Stale Closure Reference

**File:** `components/ui/ReminderModal.tsx`

`addNotification` was destructured from `useNotificationsStore()` (no selector — subscribes to ALL state changes) and used inside a `useCallback`. This created a potential stale closure where the function reference could be outdated.

### 2.4 Reminder Alarm Failing to Fire

**File:** `lib/hooks/useReminderChecker.ts`

The reminder checker had a **5-minute fire window** — if the browser tab was in the background (where `setInterval` is throttled to once/minute or suspended entirely), the checker missed the window. Missed reminders were **silently marked as notified** without ever firing.

Additionally:

- Browser notification required both `permissionStatus === 'granted'` AND `pushEnabled` — but `pushEnabled` controls server-sent push, not local alarms the user explicitly set
- `reschedulePending()` silently discarded expired pending reminders on page reload instead of firing them

### 2.5 Aggressive Notification Clearing on Auth Errors

**File:** `lib/store/notificationsStore.ts`

On transient 401 auth errors (token refresh, cold start race), `loadNotifications` cleared ALL non-temp, non-recent notifications from the store — wiping the bell clean.

### 2.6 Header Remount via Auth State Flicker

**File:** `app/client-layout.tsx`

The `ClientLayout` calls `checkAuth` on every window focus event. `checkAuth` calls `getBrowserAuthSnapshot()` (a network request to Supabase). If the auth check briefly returns no user (during token refresh), `isAuthenticated` flips to `false`, **unmounting the Header**. When auth resolves, `isAuthenticated` flips back to `true`, **remounting the Header**, which triggers `loadNotifications({ force: true })` — a forced server fetch that overwrites the store.

---

## 3. Fixes Applied (Chronological)

### Fix 1: Widen Reminder Fire Window (commit `72a37076`)

- **File:** `lib/hooks/useReminderChecker.ts`
- Widened fire window from 5 minutes to **24 hours**
- Reduced check interval from 30s to **15s**
- Added `visibilitychange` listener for immediate check on tab focus
- Decoupled browser notification from `pushEnabled` toggle
- Fixed `reschedulePending()` to fire missed reminders on page reload

### Fix 2: Bell Notification on All Reminder Actions (commit `a195c385`)

- **File:** `lib/hooks/useReminderChecker.ts`, `lib/store/notificationsStore.ts`, `components/layout/Header.tsx`
- `fireReminder` now fires in priority order: bell → toast → browser push (each in independent try-catch)
- Added `toastUtils.info()` as visible fallback when reminders fire
- Added `visibilitychange` listener to Header for notification reload
- Preserved all notifications on auth errors (instead of clearing)

### Fix 3: Always Create Bell Notification (commit `bbd9fed3`)

- **File:** `components/ui/ReminderModal.tsx`
- Both new AND updated reminders now create a bell notification
- Switched from hook-destructured `addNotification` to `useNotificationsStore.getState().addNotification()` (direct store access, no stale closures)
- Each `addNotification` call wrapped in try-catch

### Fix 4: Block Concurrent Loads During POST (commit `641667d2`)

- **File:** `lib/store/notificationsStore.ts`
- `addNotification` now sets `_loadInFlight = true` to block `loadNotifications` during the POST
- Widened merge grace window from 10s to **60s**
- Set `lastLoadedAt` after POST to prevent immediate refetch

### Fix 5: Fix lastLoadedAt Invalidation (commit `0c27b968`)

- **File:** `lib/store/notificationsStore.ts`
- Changed `lastLoadedAt = null` (which caused immediate refetches) to `lastLoadedAt = Date.now()` (marks data as fresh)

### Fix 6: Protected IDs Map (commit `dd71dbb7`)

- **File:** `lib/store/notificationsStore.ts`
- Added `_protectedIds` Map that tracks notification IDs for 2 minutes after creation
- `loadNotifications` merge preserves any notification whose ID is in the protection map

### Fix 7: Remove Focus/Visibility Handlers (commit `2c5de719`)

- **File:** `components/layout/Header.tsx`
- Removed focus and visibilitychange handlers that triggered `loadNotifications`
- Notification still disappeared — confirmed the trigger was the Header **remounting** (from `ClientLayout` auth state flicker), not focus events

### Fix 8: Additive Merge Strategy (commit `f4a6c215`) — **Current**

- **File:** `lib/store/notificationsStore.ts`
- **Rewrote `loadNotifications` merge to never remove existing notifications**
- Old strategy: filter current → replace with server data (lossy)
- New strategy: start with ALL current notifications → update existing with server data → add new from server → never delete
- Re-added focus handler since merge is now safe

---

## 4. Final Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    NOTIFICATION FLOW                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  User sets reminder                                     │
│       │                                                 │
│       ▼                                                 │
│  ReminderModal.handleSave()                             │
│       │                                                 │
│       ├──► remindersStore.addReminder()  (localStorage) │
│       │                                                 │
│       ├──► notificationsStore.addNotification()         │
│       │       │                                         │
│       │       ├──► Optimistic: add temp-* to store      │
│       │       │    (appears in bell immediately)        │
│       │       │                                         │
│       │       ├──► _protectedIds.set(tempId)            │
│       │       │    (2-minute protection from removal)   │
│       │       │                                         │
│       │       ├──► _loadInFlight = true                 │
│       │       │    (blocks concurrent loadNotifications)│
│       │       │                                         │
│       │       └──► POST /api/notifications              │
│       │            │                                    │
│       │            └──► On success: replace temp with   │
│       │                 server ID, transfer protection  │
│       │                                                 │
│       └──► toastUtils.success() (visible feedback)      │
│                                                         │
│  When reminder time arrives                             │
│       │                                                 │
│       ▼                                                 │
│  useReminderChecker (every 15s + visibilitychange)      │
│       │                                                 │
│       ├──► 1. Bell: addNotification() (highest priority)│
│       ├──► 2. Toast: toastUtils.info() (visual fallback)│
│       └──► 3. Browser push: sendNotification() (if      │
│            permission granted, independent of pushEnabled│
│                                                         │
│  loadNotifications (on mount, focus)                    │
│       │                                                 │
│       ▼                                                 │
│  ADDITIVE MERGE (never removes):                        │
│       ├──► Keep ALL current notifications               │
│       ├──► Update existing with server data             │
│       └──► Add new server notifications                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Files Changed

| File                                        | Changes                                                                            |
| ------------------------------------------- | ---------------------------------------------------------------------------------- |
| `lib/store/notificationsStore.ts`           | Additive merge, protected IDs, in-flight guard, auth error handling                |
| `lib/hooks/useReminderChecker.ts`           | 24h fire window, 15s interval, visibilitychange, toast fallback, bell-first firing |
| `lib/store/notificationPreferencesStore.ts` | Fire missed pending reminders on reload                                            |
| `components/ui/ReminderModal.tsx`           | Always create bell notification, direct store access                               |
| `components/layout/Header.tsx`              | Focus handler (safe with additive merge)                                           |

---

## 6. Lessons Learned

1. **Optimistic UI + server sync = race conditions.** The fundamental tension between "show it immediately" and "sync with server truth" requires an additive merge strategy, not a replace strategy.

2. **Focus events are treacherous.** Closing a modal returns focus to the page, which fires focus handlers that trigger data fetches. These fetches race with the just-completed action.

3. **Auth state flicker unmounts components.** `checkAuth` on focus can briefly set `isAuthenticated = false` during token refresh, unmounting the entire authenticated layout tree including the Header. The remount triggers `loadNotifications({ force: true })`, overwriting the store.

4. **Protection mechanisms stack.** A single fix (grace window, in-flight guard, protected IDs) wasn't sufficient because there were multiple independent triggers. The final fix (additive merge) is the only approach that works regardless of trigger.

5. **Browser tab throttling breaks `setInterval`.** The 5-minute fire window for reminders was too narrow because background tabs throttle timers. A 24-hour window with `visibilitychange` listener is more robust.

---

## 7. Testing

- **Unit tests:** 91 files, 857 tests — all passing
- **TypeScript:** `npx tsc --noEmit` — clean
- **Production deployment:** Verified on https://syllabus-sync-ashy.vercel.app

---

## 8. Status

**Awaiting user confirmation** that the additive merge strategy (Fix 8) resolves the "appears then disappears" issue. If the notification still disappears, the root cause is outside `loadNotifications` (possibly component unmount/remount from `ClientLayout` auth state, which would require persisting the notifications store to localStorage).
