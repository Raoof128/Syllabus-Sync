# Notification Accuracy, Profile Reload Speed, Auth Flow Hardening — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix notification message accuracy (duplicate class reminders, stale push payloads, missing overdue badges), add SWR caching to profile store for faster reloads, and harden the auth flow (email verification gate, signup atomicity via Postgres trigger, event-driven session redirect).

**Architecture:** Surgical fixes across 3 subsystems. Task 1 fixes client-side notification tags and server-side push payloads. Task 2 adds `lastFetched` timestamp to Zustand profilesStore for stale-while-revalidate. Task 3 adds `email_confirmed_at` checks at both proxy (middleware) and login action layers, replaces API rollback with a Postgres trigger, and replaces setTimeout-based redirect with `onAuthStateChange`.

**Tech Stack:** Next.js 16 App Router, TypeScript, Zustand, Supabase (auth + DB + RLS), Web Push (VAPID), Vitest

---

## Task 1: Fix class reminder notification tag

**Files:**

- Modify: `lib/services/notificationService.ts:437-456`
- Modify: `lib/store/notificationPreferencesStore.ts:406,588` (call sites)
- Test: `tests/stores-notification-prefs.test.ts`

**Step 1: Update `sendClassReminder` signature to accept a stable identifier**

The current signature is `(unitCode, unitName, building, room, startTime: string)`. The `startTime` is a formatted display string like "10:30 AM". We need a stable identifier for the tag. Since there's no `classId`, use `classTime.getTime()` which is already available at the call sites.

Change signature to:

```typescript
async sendClassReminder(
  unitCode: string,
  unitName: string,
  building: string,
  room: string,
  startTime: string,
  classTimestamp: number, // epoch ms — stable per class session
): Promise<boolean> {
```

Change tag from:

```typescript
tag: `class-${unitCode}-${Date.now()}`,
```

to:

```typescript
tag: `class-${unitCode}-${classTimestamp}`,
```

**Step 2: Update call sites in notificationPreferencesStore**

At line ~406:

```typescript
notificationService.sendClassReminder(
  unitCode,
  unitName,
  building,
  room,
  timeStr,
  classTime.getTime(),
);
```

At line ~588:

```typescript
notificationService.sendClassReminder(
  reminder.payload.unitCode as string,
  reminder.payload.unitName as string,
  reminder.payload.building as string,
  reminder.payload.room as string,
  timeStr,
  reminder.payload.classTime as number,
);
```

**Step 3: Update test mock**

In `tests/stores-notification-prefs.test.ts:25`, the mock signature accepts any args, so no change needed. Verify tests pass.

**Step 4: Run tests**

Run: `npx vitest run tests/stores-notification-prefs.test.ts`
Expected: PASS

**Step 5: Audit all other tags**

Verify in `notificationService.ts`:

- `deadline-${deadlineId}` (line 425) — stable, no change
- `event-${eventId}` (line 472) — stable, no change
- `class-${unitCode}-${classTimestamp}` (line 449) — now fixed

No other `sendNotification` call sites exist outside the service.

**Step 6: Commit**

```bash
git add lib/services/notificationService.ts lib/store/notificationPreferencesStore.ts
git commit -m "fix(notifications): replace Date.now() with stable classTimestamp in class reminder tag

Prevents duplicate class notifications from bypassing the 5-minute cooldown.
The tag now uses the class session's epoch timestamp instead of current time."
```

---

## Task 2: Fix relatedId null guard in Header overdue detection

**Files:**

- Modify: `components/layout/Header.tsx:91-107`

**Step 1: Add null guard to isNotificationOverdue**

The current code already checks `notification.relatedId` before `find()`, which handles the falsy case. However, the issue is that notifications created by the cron push system may have `relatedId` in `data.id` but NOT in the notification's `relatedId` field. The real fix is twofold:

1. The Header code is already correctly guarded — `notification.relatedId` is checked before use (lines 92, 99). If relatedId is falsy, it falls through to `return false` at line 106. **No code change needed here.**

2. The real problem is Task 1.5 — the cron push payloads don't include `relatedId` in the notification data, so when these notifications are stored, `relatedId` is never set. This is fixed in Task 4.

**Step 2: Verify no change needed**

Read the code again to confirm lines 92 and 99 both short-circuit correctly on falsy relatedId. Confirmed — the `&&` operator handles this.

**No commit needed for this task — the Header guard is already correct.**

---

## Task 3: Fix push payload messages and add relatedId

**Files:**

- Modify: `app/api/cron/push-reminders/route.ts:59-120`

**Step 1: Fix deadline push payload**

Change lines 64-73 from:

```typescript
payload: {
  title: `Deadline Reminder: ${deadline.unit_code}`,
  body: `"${deadline.title}" is due soon`,
  url: '/calendar',
  tag: `deadline-${deadline.id}`,
  data: {
    type: 'deadline',
    id: deadline.id,
  },
},
```

to:

```typescript
payload: {
  title: `Deadline: ${deadline.title}`,
  body: `${deadline.unit_code} — due ${new Date(deadline.due_date).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
  url: '/calendar',
  tag: `deadline-${deadline.id}`,
  data: {
    type: 'deadline',
    id: deadline.id,
    relatedId: deadline.id,
  },
},
```

**Step 2: Fix event push payload**

Change lines 108-119 from:

```typescript
payload: {
  title: 'Event Reminder',
  body: event.location
    ? `${event.title} is starting soon at ${event.location}`
    : `${event.title} is starting soon`,
  url: '/feed',
  tag: `event-${event.id}`,
  data: {
    type: 'event',
    id: event.id,
  },
},
```

to:

```typescript
payload: {
  title: event.title,
  body: event.location
    ? `Starting soon at ${event.location} — ${new Date(event.start_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}`
    : `Starting soon — ${new Date(event.start_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}`,
  url: '/feed',
  tag: `event-${event.id}`,
  data: {
    type: 'event',
    id: event.id,
    relatedId: event.id,
  },
},
```

**Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 4: Commit**

```bash
git add app/api/cron/push-reminders/route.ts
git commit -m "fix(push): improve push notification payloads with real titles, times, and relatedId

Deadline push now shows assignment title + formatted due date instead of generic 'is due soon'.
Event push now shows event title instead of generic 'Event Reminder'.
Both payloads now include relatedId in data for overdue detection in Header."
```

---

## Task 4: Add SWR-like caching to profilesStore

**Files:**

- Modify: `lib/store/profilesStore.ts`
- Test: `tests/stores-profiles.test.ts`

**Step 1: Add `lastFetched` to state type and initial state**

In `ProfilesState` interface (line 64), add:

```typescript
lastFetched: number | null;
```

In store initial state (after line 252), add:

```typescript
lastFetched: null,
```

**Step 2: Update `fetchProfile` signature and add stale check**

Change `fetchProfile` signature from:

```typescript
fetchProfile: () => Promise<void>;
```

to:

```typescript
fetchProfile: (options?: { force?: boolean }) => Promise<void>;
```

At the top of the `fetchProfile` implementation (line 313), change:

```typescript
fetchProfile: async () => {
  if (get().isLoading) return;

  set({ isLoading: true });
```

to:

```typescript
fetchProfile: async (options) => {
  if (get().isLoading) return;

  // SWR: skip fetch if data is fresh (< 60s) unless forced
  const { lastFetched } = get();
  if (!options?.force && lastFetched && Date.now() - lastFetched < 60_000) {
    return;
  }

  set({ isLoading: true });
```

**Step 3: Set lastFetched on successful fetch**

After line 356 (where `hasLoaded: true` is set inside the successful profile update), add `lastFetched: Date.now()`:

```typescript
return {
  profiles: newProfiles,
  currentProfileId: dbProfile.id,
  hasLoaded: true,
  lastFetched: Date.now(),
};
```

Also in the else branch (line 360):

```typescript
set({ hasLoaded: true, lastFetched: Date.now() });
```

**Step 4: Reset lastFetched in clearProfiles and reset**

In `clearProfiles` (line 527):

```typescript
clearProfiles: () => {
  set({
    profiles: [],
    currentProfileId: null,
    hasLoaded: false,
    lastFetched: null,
  });
},
```

In `reset` (line 535):

```typescript
reset: () => {
  set({
    profiles: [],
    currentProfileId: null,
    hasLoaded: false,
    isLoading: false,
    lastFetched: null,
  });
},
```

**Step 5: Exclude lastFetched from localStorage persistence**

In `partialize` (line 547), `lastFetched` is not persisted by default since it's not in the partialize return. Verify this — the partialize only returns `profiles` and `currentProfileId`. Correct, no change needed.

**Step 6: Run tests**

Run: `npx vitest run tests/stores-profiles.test.ts`
Expected: PASS (mock fetchProfile calls should still work)

**Step 7: Commit**

```bash
git add lib/store/profilesStore.ts
git commit -m "feat(profiles): add SWR-like caching to profilesStore

Skips refetch if data is less than 60 seconds old unless force: true.
Resets lastFetched on clear/reset to ensure fresh data after logout."
```

---

## Task 5: Add Cache-Control header to profiles GET

**Files:**

- Modify: `app/api/profiles/route.ts:35-86`

**Step 1: Add Cache-Control to GET response**

After the successful `jsonSuccess(profile)` return (line 80), we need to add headers. Since `jsonSuccess` returns a `NextResponse`, modify the return to add the header.

Change line 80:

```typescript
return jsonSuccess(profile);
```

to:

```typescript
const response = jsonSuccess(profile);
response.headers.set('Cache-Control', 'private, max-age=0, must-revalidate');
return response;
```

Do the same for the auto-created profile response (line 74):

```typescript
const response = jsonSuccess(newProfile);
response.headers.set('Cache-Control', 'private, max-age=0, must-revalidate');
return response;
```

And the null response (line 71):

```typescript
const response = jsonSuccess(null);
response.headers.set('Cache-Control', 'private, max-age=0, must-revalidate');
return response;
```

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
git add app/api/profiles/route.ts
git commit -m "fix(profiles): add Cache-Control headers to profiles GET

Prevents browser from caching stale profile data. Zustand store
handles client-side caching via lastFetched timestamp."
```

---

## Task 6: ReminderSettings force refresh after toggle

**Files:**

- Modify: `app/manage-profiles/components/ReminderSettings.tsx`

**Step 1: Add fetchProfile to store selectors**

At the top of the component where store selectors are used (~line 38-43), add:

```typescript
const fetchProfile = useProfilesStore((state) => state.fetchProfile);
```

**Step 2: Trigger force refresh after email preference toggle**

Find the function that handles email preference toggles (the `updateProfile` call for notifications/emailReminders). After the `await updateProfile(...)` call, add:

```typescript
// Force refresh to keep both stores in sync
await fetchProfile({ force: true });
```

**Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 4: Commit**

```bash
git add app/manage-profiles/components/ReminderSettings.tsx
git commit -m "fix(profiles): force profile refresh after reminder preference toggle

Prevents stale email preference display when push notification
toggles are changed in ReminderSettings."
```

---

## Task 7: Email verification gate in proxy (middleware)

**Files:**

- Modify: `lib/proxy.ts:224-311`

**Step 1: Add email verification check after user is resolved**

After line 262 (after `authResolution` is set and `user` is populated), before the MFA check block, add the email verification gate:

```typescript
// Email verification gate — redirect unverified users to /verify
if (user && isProtectedRoute && authResolution === 'resolved') {
  const emailConfirmed = user.email_confirmed_at;
  if (!emailConfirmed) {
    const redirectUrl = new URL('/verify', request.url);
    redirectUrl.searchParams.set('reason', 'unverified');
    const verifyResponse = NextResponse.redirect(redirectUrl);
    setSecurityHeaders(verifyResponse.headers);
    return verifyResponse;
  }
}
```

This is placed AFTER the user resolution but BEFORE MFA checks. The `isProtectedRoute` check already excludes `/login`, `/verify`, `/api/*`, etc. The `config.matcher` in `proxy.ts` already excludes `_next/static`, `favicon.ico`, and static file extensions. The `isStaticFile` check at line 77-81 also handles static assets. So no additional whitelist is needed — the existing routing logic already handles it.

**Step 2: Verify whitelist coverage**

Confirm these paths are NOT in `protectedRoutes` and therefore skip the check:

- `/login` — in `authRoutes`, not `protectedRoutes` ✓
- `/verify` — in `publicRoutes`, not `protectedRoutes` ✓
- `/api/*` — handled by `isApiRoute`, not `protectedRoutes` ✓
- `/_next/*` — excluded by config.matcher ✓
- `favicon.ico` — excluded by config.matcher ✓
- `/maps` — NOT in `protectedRoutes` (it's `/map` singular) ✓
- Static files — handled by `isStaticFile` check at line 77-81 ✓

**Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 4: Commit**

```bash
git add lib/proxy.ts
git commit -m "fix(auth): add email verification gate in proxy middleware

Redirects unverified users to /verify?reason=unverified on protected routes.
Existing route classification already excludes /login, /verify, /api/*, static assets."
```

---

## Task 8: Explicit email check in login action

**Files:**

- Modify: `app/login/actions.ts:58-76`

**Step 1: Replace Supabase error string parsing with explicit check**

After `signInWithPassword` succeeds (line 64 — after the `if (error)` block), add an explicit `email_confirmed_at` check. Change the block starting at line 58:

```typescript
// 3. Auth: Supabase Login
const supabase = await createServerClient();
const { data: signInData, error } = await supabase.auth.signInWithPassword({
  email: result.data.email,
  password: result.data.password,
});

if (error) {
  const message = error.message ?? '';
  logger.error('Login failed', { error: message, email_hint: emailHint });

  // Email-not-confirmed is only returned after correct credentials, so this
  // does not leak account existence. It enables a resend-verification UX.
  if (message.toLowerCase().includes('email not confirmed')) {
    return { error: 'email_not_confirmed' };
  }

  return { error: 'invalid_credentials' };
}

// Explicit email verification check — don't rely on Supabase error string parsing
if (signInData?.user && !signInData.user.email_confirmed_at) {
  logger.warn('Login blocked: email not verified', { email_hint: emailHint });
  return { error: 'email_not_confirmed' };
}
```

Note: We keep the existing string-based check as a belt-and-suspenders approach (some Supabase configurations block the signIn entirely for unverified emails). The new explicit check catches the case where signIn succeeds but email isn't confirmed.

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: Run existing login MFA test**

Run: `npx vitest run tests/security/login-mfa-failclosed.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add app/login/actions.ts
git commit -m "fix(auth): add explicit email_confirmed_at check in login action

No longer relies solely on Supabase error string parsing for email verification.
Explicitly checks user.email_confirmed_at after successful signInWithPassword."
```

---

## Task 9: Signup atomicity via Postgres trigger

**Files:**

- Create: `supabase/migrations/20260314_auto_create_profile_trigger.sql`
- Modify: `app/api/auth/signup/route.ts` (simplify profile creation)

**Step 1: Create the Postgres trigger migration**

```sql
-- Auto-create a profiles row when a new auth user is created.
-- This guarantees atomicity at the database level — no orphaned auth users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop existing trigger if it exists (idempotent)
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**Step 2: Simplify signup route profile creation**

In `app/api/auth/signup/route.ts`, the profile creation block (lines 273-340) can be simplified. The trigger handles the base case, but the signup route can still upsert to set additional fields (student_id, faculty, course, year) that aren't in user_metadata:

Change the profile creation block to use upsert without rollback:

```typescript
// Profile is auto-created by Postgres trigger on auth.users insert.
// Upsert here to set additional fields from the signup form.
if (adminClient) {
  const { error: profileError } = await adminClient.from('profiles').upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      student_id: studentId,
      faculty: faculty || null,
      course: course || null,
      year: year || null,
    },
    { onConflict: 'id' },
  );

  if (profileError) {
    // Non-critical: trigger already created base profile.
    // Log but don't rollback — user can update profile later.
    logger.warn('Profile enrichment failed (trigger created base profile):', {
      userId,
      error: profileError.message,
    });
  }

  // Create gamification profile (non-critical)
  const { error: gamError } = await adminClient.from('gamification_profiles').upsert(
    {
      user_id: userId,
      xp: 0,
      streak_days: 0,
      longest_streak: 0,
      last_activity_date: null,
    },
    { onConflict: 'user_id' },
  );

  if (gamError) {
    logger.warn('Gamification profile creation failed:', gamError.message);
  }
}
```

Remove the rollback `deleteUser` block entirely (lines 293-312).

**Step 3: Apply migration to Supabase**

Run: `npx supabase db push` (or apply via Supabase dashboard SQL editor)

**Step 4: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 5: Commit**

```bash
git add supabase/migrations/20260314_auto_create_profile_trigger.sql app/api/auth/signup/route.ts
git commit -m "fix(auth): replace API rollback with Postgres trigger for signup atomicity

Database trigger on auth.users insert auto-creates profiles row.
Eliminates orphaned auth user risk entirely. Signup route simplified
to upsert additional fields (student_id, faculty, etc.) on top of
the trigger-created base profile."
```

---

## Task 10: Session redirect via onAuthStateChange

**Files:**

- Modify: `app/login/LoginClient.tsx:131-141`

**Step 1: Add onAuthStateChange listener for redirect**

Replace the setTimeout block (lines 132-141):

```typescript
setIsSuccess(true);
toastUtils.success(t('welcomeBack'), t('loginSuccess'));

// Full page navigation to ensure auth cookies are fully propagated
setTimeout(() => {
  window.location.href = redirectTo;
}, 800);
```

with:

```typescript
setIsSuccess(true);
toastUtils.success(t('welcomeBack'), t('loginSuccess'));

// Listen for auth state change to redirect when session is fully mounted
const { createBrowserClient } = await import('@/lib/supabase/client');
const supabase = createBrowserClient();
const {
  data: { subscription },
} = supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN') {
    subscription.unsubscribe();
    window.location.href = redirectTo;
  }
});

// Fallback: if event doesn't fire within 2s, redirect anyway
setTimeout(() => {
  subscription.unsubscribe();
  window.location.href = redirectTo;
}, 2000);
```

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
git add app/login/LoginClient.tsx
git commit -m "fix(auth): replace setTimeout redirect with onAuthStateChange listener

Redirects on SIGNED_IN event when session is fully mounted.
2-second fallback timeout ensures redirect even if event is missed."
```

---

## Task 11: Signout cleanup audit (verify only)

**Files:**

- Read: `app/client-layout.tsx`
- Read: `lib/utils/clientStorage.ts`

**Step 1: Verify store cleanup coverage**

Read `lib/utils/clientStorage.ts` and verify all 8 Zustand stores are cleared:

1. unitsStore
2. deadlinesStore
3. eventsStore
4. profilesStore
5. notificationsStore
6. gamificationStore
7. todosStore
8. notificationPreferencesStore

**Step 2: Verify onAuthStateChange subscription**

Read `app/client-layout.tsx` and verify:

- `onAuthStateChange` listens for `SIGNED_OUT` event
- Triggers `resetAllStores()` + `clearAllClientStorage()`

**Step 3: Document findings**

If all 8 stores are cleared and auth state change triggers cleanup: no changes needed.
If a gap is found: create a fix task.

**No commit expected unless a gap is found.**

---

## Task 12: Error state UX audit (verify only)

**Step 1: Verify wrong password error message**

Read `app/login/LoginClient.tsx` — confirm `invalid_credentials` maps to `t('loginErrorInvalidCredentials')` (line 106). Confirmed from code read.

**Step 2: Verify expired verification token**

Read `app/verify/page.tsx` — confirm expired token shows user-friendly message with resend option.

**Step 3: Document findings**

If all error states show user-friendly messages: no changes needed.
If raw Supabase errors leak: create a fix.

**No commit expected unless an issue is found.**

---

## Task 13: Final verification

**Step 1: Run full quality gate**

Run: `npm run check`
Expected: All checks pass (secrets, format, typecheck, lint, test, build)

**Step 2: Review all changes**

Run: `git diff main --stat`
Verify only expected files changed.

**Step 3: Final commit if formatting needed**

If prettier/lint auto-fixes are needed:

```bash
npx prettier --write --config config/prettier/.prettierrc.json --ignore-path config/prettier/.prettierignore .
git add -A && git commit -m "style: format"
```
