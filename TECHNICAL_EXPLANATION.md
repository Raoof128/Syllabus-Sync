# Technical Explanation

## Purpose

Syllabus Sync is a Next.js App Router application that combines student productivity workflows with campus-aware navigation and account/security features. The repository is organized around a feature-first frontend, a route-handler API layer, and Supabase-backed persistence.

## How The App Boots

1. `app/layout.tsx` defines global metadata, security nonce usage, JSON-LD, and wraps the app in `QueryProvider`.
2. `app/client-layout.tsx` applies the authenticated application shell:
   - checks auth state
   - renders `Sidebar`, `Header`, `AppFooter`
   - registers the service worker
   - wires install/update/offline UX
   - applies inactivity logout for browser mode
3. `app/page.tsx` delegates the landing decision to `AuthRedirectHandler`.
4. Authenticated users are navigated into the main application routes such as `/home`, `/calendar`, `/map`, `/feed`, and `/settings/*`.

## Route Architecture

The route tree has two major layers:

- User-facing pages in `app/**/page.tsx`
- Server-side route handlers in `app/api/**/route.ts`

The primary authenticated navigation comes from `components/layout/Sidebar.tsx` and points to:

- `/home`
- `/calendar`
- `/map`
- `/feed`
- `/settings`

The settings area has its own route-local navigation in `app/settings/layout.tsx`:

- `/settings/general`
- `/settings/appearance`
- `/settings/security`
- `/settings/experience`
- `/settings/about`

## Frontend Module Structure

- `features/home`: dashboard widgets, quick actions, hydration/auth helpers
- `features/calendar`: calendar UI, widgets, add/edit flows, pending intent flow
- `features/map`: campus raster map, Google map mode, location/navigation helpers
- `features/settings`: settings sections, privacy/security controls, quick actions
- `features/feed`: public event feed logic and presentation
- `features/gamification`: XP, levels, streaks, notifications

Cross-cutting shared layers:

- `components/`: reusable UI/layout building blocks
- `lib/store/`: Zustand persistence and domain state
- `lib/security/`: CSP, CSRF, WebAuthn, MFA, audit, password and session utilities
- `lib/supabase/`: browser/server/admin clients and types

## Navigation And Map Model

The repository contains two distinct navigation modes:

### Campus Raster Mode

- UI surface: `features/map/components/CampusMap.tsx`
- Client orchestration: `features/map/components/MapClient.tsx`
- Routing API: `POST /api/navigate`
- Upstream provider: OpenRouteService
- Notes:
  - geofence enforcement is applied when ORS is configured
  - demo routing is generated when `ORS_API_KEY` is absent

### Google Mode

- UI surfaces: `GoogleMapCanvas`, `GoogleMapController`, `GoogleRoutePanel`
- Routing API: `POST /api/maps/routes`
- Search/detail proxies:
  - `POST /api/maps/place-search`
  - `POST /api/maps/place-details`
- Upstream providers: Google Maps JavaScript API and Google Routes API

Both modes share building metadata and route-selection state through `MapClient`.

## Backend And Data Model

The backend is implemented with Next.js route handlers plus Supabase:

- Supabase auth sessions for user identity
- Postgres with RLS for application data
- route-level validation with Zod in many handlers
- shared response helpers under `app/api/_lib`

Major data areas reflected in code:

- profiles
- user preferences
- units and `class_times`
- deadlines
- events
- todos
- notifications
- gamification
- audit/security tables
- WebAuthn and password reset flows

Canonical schema history lives in `supabase/migrations/`.

## Security Model

Security controls implemented in code include:

- security headers and nonce flow
- CSRF utilities
- rate limiting service
- passkey and MFA flows
- password reset and email verification flows
- audit utilities and supporting endpoints
- Sentry and health-check surfaces for runtime visibility

## Testing And Delivery

The checked-in QA stack in this repository is currently:

- Vitest + Testing Library for unit/integration coverage
- workflow validation in GitHub Actions
- Lighthouse job in CI

The main workflows are:

- `.github/workflows/ci-cd.yml`
- `.github/workflows/production-deploy.yml`

## Recommended Companion Docs

- [README.md](./README.md)
- [docs/architecture/ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md)
- [docs/api/API_REFERENCE.md](./docs/api/API_REFERENCE.md)
- [docs/reference/ROUTES_AND_NAVIGATION.md](./docs/reference/ROUTES_AND_NAVIGATION.md)
- [docs/reference/REPOSITORY_INVENTORY.md](./docs/reference/REPOSITORY_INVENTORY.md)
- [docs/operations/ENVIRONMENT_SETUP.md](./docs/operations/ENVIRONMENT_SETUP.md)
