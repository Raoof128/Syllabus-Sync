# Routes And Navigation

This document reconciles the user-visible navigation model with the current App Router implementation.

## Bootstrap And Shells

### Root Layout

`app/layout.tsx` is the global bootstrap boundary. It sets metadata, viewport, manifest links, theme/RTL bootstrap scripts, JSON-LD organization metadata, and wraps the tree with `QueryProvider` and `ClientLayout`.

### Redirect Entry Route

`app/page.tsx` mounts `AuthRedirectHandler`. `/` should be documented as:

- the Supabase redirect landing route
- a recovery/PKCE/auth forwarding surface
- not a brochure page or neutral dashboard index

### Shell Selection

`app/client-layout.tsx` chooses between shells based on pathname:

| Route class | Routes                                                | Shell behavior                                                   |
| ----------- | ----------------------------------------------------- | ---------------------------------------------------------------- |
| Auth        | `/login`, `/signup`, `/reset-password`                | no sidebar/header/footer                                         |
| Public      | `/terms`, `/privacy`, `/verify`, `/about`, `/contact` | no sidebar/header/footer                                         |
| Post-auth   | `/onboarding`                                         | no sidebar/header/footer                                         |
| Protected   | all other app routes                                  | sidebar, header, footer, offline indicator, toaster, sync dialog |

## Top-Level Navigation

The canonical top-level navigation lives in `components/layout/Sidebar.tsx`.

| Label source | Route       |
| ------------ | ----------- |
| `home`       | `/home`     |
| `calendar`   | `/calendar` |
| `navigation` | `/map`      |
| `feed`       | `/feed`     |
| `settings`   | `/settings` |

The sidebar also exposes a gamification deep link:

- `GAMIFICATION_SETTINGS_ROUTE = /settings/experience`

Desktop and mobile sidebar variants share the same route targets.

## Header And Secondary Navigation

`components/layout/Header.tsx` provides access to:

- the root redirect route via logo/home link
- notifications
- theme toggle
- manage profile route
- account actions

Settings quick actions are defined separately in `features/settings/constants.ts` and point to:

- `/home`
- `/calendar`
- `/feed`
- `/map`
- `/manage-profiles`

## Nested Settings Navigation

`app/settings/page.tsx` redirects to `/settings/general`.

`app/settings/layout.tsx` owns nested section navigation for:

- `/settings/general`
- `/settings/appearance`
- `/settings/security`
- `/settings/experience`
- `/settings/about`

This is the current settings router contract and is covered by `tests/settings/SettingsRoutesIntegrity.test.ts`.

## Feature Route Behavior

### `/home`

- server entry: `app/home/page.tsx`
- client runtime: `app/home/HomeClient.tsx`
- quick-add orchestration now uses state, then routes to `/calendar`
- some widget links still rely on query params for focused highlighting

### `/calendar`

- server entry: `app/calendar/page.tsx`
- client runtime: `app/calendar/CalendarClient.tsx`
- receives legacy query params from widgets and cards
- also consumes the pending calendar intent store for state-driven quick-add

### `/map`

- server entry: `app/map/page.tsx`
- client runtime: `features/map/components/MapClient.tsx`
- default campus map mode
- Google map mode via `?view=google`
- additional URL state:
  - `building`
  - `autonav`
  - `focused`
  - `layers`

### `/feed`

- server entry: `app/feed/page.tsx`
- client runtime: `features/feed/components/PublicFeedClient.tsx`
- feed cards can deep-link into `/map` and `/calendar`

### `/manage-profiles`

- dedicated profile management route
- reachable from settings quick actions and header profile surfaces

### `/map/position-editor`

- standalone specialized route under the map namespace
- should be treated as a niche tool route, not core primary navigation

## Navigation-Related Test Coverage

Current route integrity coverage exists in:

- `tests/settings/SettingsRoutesIntegrity.test.ts`
- `tests/settings/QuickActions.test.tsx`

These tests currently prove:

- each settings section target has an `app/.../page.tsx`
- each settings quick action target resolves to a page
- the gamification badge target remains `/settings/experience`

## Documentation Rules Going Forward

Route docs in this repository should state:

- `/` is an auth redirect processor
- `/settings` is a route family with a redirecting index
- top-level nav sources of truth are `Sidebar.tsx` and `features/settings/constants.ts`
- `/map` is partially URL-state driven
- route integrity tests exist and should be updated with any navigation changes
