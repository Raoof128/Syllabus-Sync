# Routes and Navigation

Technical reference for the Syllabus Sync navigation model, shell architecture, and URL-state conventions.

---

## Root Layout

`app/layout.tsx` is the global bootstrap boundary. It provides:

- HTML metadata, viewport, and manifest links
- Theme and RTL bootstrap scripts (runs before paint to prevent FOUC)
- JSON-LD organization metadata for SEO
- `QueryProvider` (React Query) and `ClientLayout` wrappers

---

## Shell Selection

`app/client-layout.tsx` inspects the current pathname and selects a shell variant:

| Route Class | Matched Routes                                        | Shell                                                                   |
| :---------- | :---------------------------------------------------- | :---------------------------------------------------------------------- |
| Auth        | `/login`, `/signup`, `/reset-password`                | Bare (no chrome)                                                        |
| Public      | `/terms`, `/privacy`, `/verify`, `/about`, `/contact` | Bare (no chrome)                                                        |
| Post-auth   | `/onboarding`                                         | Bare (no chrome)                                                        |
| Protected   | All other app routes                                  | Full (sidebar, header, footer, offline indicator, toaster, sync dialog) |

---

## Entry Route

`app/page.tsx` mounts `AuthRedirectHandler`. The root path `/` is:

- The Supabase redirect landing route for OAuth, PKCE, and email confirmation callbacks
- A recovery and auth-forwarding surface
- Not a brochure page or dashboard index

Authenticated users hitting `/` are redirected to `/home`. Unauthenticated users are redirected to `/login`.

---

## Primary Navigation

### Sidebar

Source of truth: `components/layout/Sidebar.tsx`

| i18n Key     | Route       | Purpose                |
| :----------- | :---------- | :--------------------- |
| `home`       | `/home`     | Dashboard and widgets  |
| `calendar`   | `/calendar` | Schedule and deadlines |
| `navigation` | `/map`      | Campus map and routing |
| `feed`       | `/feed`     | Events and social feed |
| `settings`   | `/settings` | Preferences hub        |

The sidebar also exposes a gamification deep link to `/settings/experience`.

Desktop and mobile sidebar variants share identical route targets.

### Header

`components/layout/Header.tsx` provides access to:

- Root redirect via logo / home link
- Notification bell
- Theme toggle
- Profile management (`/manage-profiles`)
- Account actions (sign out)

### Settings Quick Actions

Defined in `features/settings/constants.ts`:

| Target             | Description         |
| :----------------- | :------------------ |
| `/home`            | Return to dashboard |
| `/calendar`        | Open calendar       |
| `/feed`            | Open feed           |
| `/map`             | Open map            |
| `/manage-profiles` | Profile management  |

---

## Settings Navigation

`app/settings/page.tsx` redirects to `/settings/general`.

`app/settings/layout.tsx` renders nested section navigation:

| Section Route          | Label      | Content                                       |
| :--------------------- | :--------- | :-------------------------------------------- |
| `/settings/general`    | General    | Language, reminders, notification preferences |
| `/settings/appearance` | Appearance | Theme, color scheme, display density          |
| `/settings/security`   | Security   | MFA, passkeys, sessions, security audit log   |
| `/settings/experience` | Experience | XP profile, streak, level progress, badges    |
| `/settings/about`      | About      | Version, licenses, credits                    |

This is the settings router contract. It is enforced by `tests/settings/SettingsRoutesIntegrity.test.ts`.

---

## Feature Route Behavior

### `/home`

- **Server entry:** `app/home/page.tsx`
- **Client runtime:** `app/home/HomeClient.tsx`
- Quick-add orchestration uses state, then routes to `/calendar`
- Widget links may use query parameters for focused highlighting

### `/calendar`

- **Server entry:** `app/calendar/page.tsx`
- **Client runtime:** `app/calendar/CalendarClient.tsx`
- Receives legacy query parameters from widgets and cards
- Consumes the pending calendar intent store for state-driven quick-add

### `/map`

- **Server entry:** `app/map/page.tsx`
- **Client runtime:** `features/map/components/MapClient.tsx`
- Default mode: campus SVG map
- Google Maps mode: `?view=google`
- URL state parameters:

| Parameter  | Type    | Description                                |
| :--------- | :------ | :----------------------------------------- |
| `view`     | string  | `google` to switch to Google Maps renderer |
| `building` | string  | Pre-select a building by identifier        |
| `autonav`  | boolean | Auto-start navigation on load              |
| `focused`  | boolean | Highlight the selected building            |
| `layers`   | string  | Toggle map layer visibility                |

### `/feed`

- **Server entry:** `app/feed/page.tsx`
- **Client runtime:** `features/feed/components/PublicFeedClient.tsx`
- Feed cards can deep-link into `/map` (building navigation) and `/calendar` (event scheduling)

### `/manage-profiles`

- Dedicated profile management route
- Reachable from settings quick actions and header profile menu

### `/map/position-editor`

- Standalone admin tool under the map namespace
- Used for adjusting building GPS coordinates
- Not part of primary navigation

---

## Route Protection

### Page Routes

The proxy middleware (`lib/proxy.ts`) enforces access control:

1. **Protected routes** (`/home`, `/calendar`, `/feed`, `/map`, `/settings`, `/manage-profiles`) require an authenticated Supabase session. Unauthenticated users are redirected to `/login?redirectTo={path}`.
2. **Auth routes** (`/login`, `/signup`, `/reset-password`) redirect authenticated users to `/home` (unless MFA step-up is pending).
3. **Email verification gate** -- authenticated users without a confirmed email are redirected to `/verify?reason=unverified`.
4. **MFA gate** -- users with enrolled MFA factors at AAL1 are redirected to `/login?mfa=1` to complete the step-up challenge.

### API Routes

See the [API Reference](../api/API_REFERENCE.md) for the complete public vs. authenticated endpoint classification.

---

## Navigation-Related Test Coverage

| Test File                                        | Coverage                                                         |
| :----------------------------------------------- | :--------------------------------------------------------------- |
| `tests/settings/SettingsRoutesIntegrity.test.ts` | Verifies every settings section target has an `app/.../page.tsx` |
| `tests/settings/QuickActions.test.tsx`           | Verifies every quick-action target resolves to a page            |
| `tests/api/proxy.mfa.test.ts`                    | Verifies proxy auth, MFA, and email verification gates           |

These tests are part of the `npm run check` quality gate. Any navigation change must be reflected in them.
