# Architecture Overview

## System Summary

Syllabus Sync is a Next.js App Router application that combines:

- authenticated student productivity flows
- campus and Google-backed map navigation
- Supabase-backed data and auth
- security-focused API route handlers
- a feature-first client architecture

## Runtime Layers

```text
Browser / PWA
  -> app/layout.tsx + app/client-layout.tsx
  -> feature modules, shared components, Zustand stores
  -> Next.js route handlers under app/api
  -> Supabase / Google Maps / Google Routes / Google Weather / Resend / ORS
```

## Bootstrap Path

1. `app/layout.tsx`
   - metadata
   - nonce-aware theme and RTL bootstrap scripts
   - JSON-LD organization schema
   - `QueryProvider`
2. `app/client-layout.tsx`
   - auth gating
   - top-level app shell
   - service worker registration
   - offline/update/install UX
   - inactivity logout
3. `app/page.tsx`
   - redirect decision surface via `AuthRedirectHandler`

## Frontend Structure

| Area          | Current responsibility                                     |
| ------------- | ---------------------------------------------------------- |
| `app/`        | Pages, layouts, route handlers                             |
| `features/`   | Feature-specific UI logic and orchestration                |
| `components/` | Shared UI and layout primitives                            |
| `lib/`        | Stores, hooks, security, services, utils, Supabase clients |
| `locales/`    | Translation dictionaries                                   |
| `tests/`      | Vitest suites                                              |

## Route And Navigation Architecture

Primary authenticated navigation is controlled by `components/layout/Sidebar.tsx`:

- `/home`
- `/calendar`
- `/map`
- `/feed`
- `/settings`

Route-local settings navigation is controlled by `app/settings/layout.tsx`:

- `/settings/general`
- `/settings/appearance`
- `/settings/security`
- `/settings/experience`
- `/settings/about`

Public/auth-adjacent routes are handled separately in `app/client-layout.tsx`, which treats these as non-shell flows:

- auth routes: `/login`, `/signup`, `/reset-password`
- public routes: `/terms`, `/privacy`, `/verify`, `/about`, `/contact`
- post-auth route: `/onboarding`

## Map Architecture

### Shared Coordinator

- `features/map/components/MapClient.tsx`

Owns shared map shell state, query-parameter flow, mode switching, HUD coordination, and building selection.

### Campus Raster Mode

- Leaflet-based rendering
- ORS-backed `POST /api/navigate`
- fallback demo route generation if `ORS_API_KEY` is missing

### Google Mode

- Google Maps JavaScript API rendering
- Google Routes API proxy via `POST /api/maps/routes`
- supporting proxies:
  - `POST /api/maps/place-search`
  - `POST /api/maps/place-details`

## Data And Persistence

Primary persistence is Supabase/Postgres. Canonical schema evolution lives in `supabase/migrations/`.

Main data domains backed by code:

- profiles
- user preferences
- units
- class times
- deadlines
- events
- todos
- notifications
- gamification
- audit/security support tables
- passkeys and password reset records

## Security Architecture

Implemented security layers visible in code:

- CSP and security header utilities
- CSRF helpers
- rate limiting
- password reset and email verification flows
- MFA and WebAuthn/passkeys
- audit and health-check endpoints
- route-level auth middleware and validation helpers

## Delivery And Observability

| Concern           | Current implementation                               |
| ----------------- | ---------------------------------------------------- |
| CI                | `.github/workflows/ci-cd.yml`                        |
| Production deploy | `.github/workflows/production-deploy.yml`            |
| Error tracking    | Sentry config in `config/sentry/` plus root wrappers |
| Health endpoint   | `GET /api/health`                                    |
| Docker            | `infra/docker/`                                      |
| Vercel scripts    | `tools/vercel/` and `package.json`                   |

## Related Documents

- [/Users/raoof.r12/Desktop/Raouf/MQ_Project/syllabus-sync/TECHNICAL_EXPLANATION.md](/Users/raoof.r12/Desktop/Raouf/MQ_Project/syllabus-sync/TECHNICAL_EXPLANATION.md)
- [/Users/raoof.r12/Desktop/Raouf/MQ_Project/syllabus-sync/docs/reference/ROUTES_AND_NAVIGATION.md](/Users/raoof.r12/Desktop/Raouf/MQ_Project/syllabus-sync/docs/reference/ROUTES_AND_NAVIGATION.md)
- [/Users/raoof.r12/Desktop/Raouf/MQ_Project/syllabus-sync/docs/reference/REPOSITORY_INVENTORY.md](/Users/raoof.r12/Desktop/Raouf/MQ_Project/syllabus-sync/docs/reference/REPOSITORY_INVENTORY.md)
- [/Users/raoof.r12/Desktop/Raouf/MQ_Project/syllabus-sync/docs/api/API_REFERENCE.md](/Users/raoof.r12/Desktop/Raouf/MQ_Project/syllabus-sync/docs/api/API_REFERENCE.md)
