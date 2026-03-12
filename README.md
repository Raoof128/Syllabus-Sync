# Syllabus Sync

Production-grade Next.js 16 application for Macquarie University student planning, campus navigation, notifications, and profile management.

## What This Repository Actually Contains

- Next.js 16 App Router application with 23 user-facing routes under `app/`
- 63 API route handlers under `app/api/`
- Supabase-backed auth, profile, academic, notification, audit, and security flows
- Dual map stack:
  - Campus raster mode via Leaflet + ORS-backed `/api/navigate`
  - Google mode via Maps JavaScript API + `/api/maps/routes`
- Feature-first frontend modules in `features/`
- Shared UI/layout primitives in `components/`
- Zustand stores in `lib/store/`
- 35 locale directories in `locales/`
- 92 test files across app, API, security, map, settings, stores, and utilities

## Current Runtime Stack

| Layer             | Implementation in this repo                                      |
| ----------------- | ---------------------------------------------------------------- |
| App framework     | Next.js 16 App Router                                            |
| UI runtime        | React 19                                                         |
| Language          | TypeScript 5                                                     |
| Styling           | Tailwind CSS 4, Radix UI primitives, custom `mq-*` design tokens |
| State             | Zustand                                                          |
| Data/auth         | Supabase SSR + Supabase Postgres                                 |
| Email             | Resend                                                           |
| Error tracking    | Sentry config for client, server, and edge                       |
| Tests             | Vitest + Testing Library                                         |
| CI/CD             | GitHub Actions (`ci-cd.yml`, `production-deploy.yml`)            |
| Deployment target | Vercel                                                           |

## App Bootstrap And Entry Points

- `app/layout.tsx`: root metadata, nonce-aware inline theme/RTL scripts, JSON-LD, `QueryProvider`
- `app/client-layout.tsx`: auth gate, sidebar/header shell, service worker registration, install prompt, offline/update UI
- `app/page.tsx`: root redirect surface via `AuthRedirectHandler`
- `components/layout/Sidebar.tsx`: primary authenticated navigation for `/home`, `/calendar`, `/map`, `/feed`, `/settings`
- `app/settings/layout.tsx`: secondary settings navigation for `/settings/general`, `/appearance`, `/security`, `/experience`, `/about`

## User-Facing Routes

Primary pages present in code:

- `/`
- `/about`
- `/calendar`
- `/contact`
- `/feed`
- `/home`
- `/login`
- `/manage-profiles`
- `/map`
- `/map/position-editor`
- `/offline`
- `/onboarding`
- `/privacy`
- `/reset-password`
- `/settings`
- `/settings/about`
- `/settings/appearance`
- `/settings/experience`
- `/settings/general`
- `/settings/security`
- `/signup`
- `/terms`
- `/verify`

Route behavior details live in [docs/reference/ROUTES_AND_NAVIGATION.md](./docs/reference/ROUTES_AND_NAVIGATION.md).

## API Surface

This repository currently exposes 63 route handlers under `app/api/`, including:

- Auth and account lifecycle
- MFA and passkeys
- Units, deadlines, events, todos, notifications
- Profiles and user preferences
- Weather, audit, sync, health
- Campus and Google map routing
- Security utilities and admin-only map tools

Canonical API documentation: [docs/api/API_REFERENCE.md](./docs/api/API_REFERENCE.md)

## Repository Layout

```text
app/                Next.js routes, layouts, route handlers
components/         Shared UI and layout components
config/             ESLint, Next, Prettier, Sentry, Tailwind, TS, Vitest, Lighthouse
data/               Static academic data
docs/               Architecture, operations, API, policy, security, reference docs
features/           Feature-first client modules (home, calendar, map, settings, feed, auth)
infra/              Docker assets
lib/                Stores, hooks, services, security, utilities, Supabase clients
locales/            35 locale dictionaries
public/             Static assets, icons, map tiles, overlays, service worker
supabase/           Canonical migration history and Supabase notes
tests/              Vitest suites
tools/              Repo utilities for i18n, security, exports, Vercel, load testing
```

Detailed inventory: [docs/reference/REPOSITORY_INVENTORY.md](./docs/reference/REPOSITORY_INVENTORY.md)

## Environment And Setup

1. Install Node.js 22.x and npm.
2. Copy `.env.example` to `.env.local`.
3. Configure the variables required for your intended feature set.
4. Install dependencies and start the app.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Important environment groups reflected in code:

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Google Maps: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAP_ID`, `GOOGLE_ROUTES_API_KEY`
- Campus routing: `ORS_API_KEY`
- Weather: `GOOGLE_WEATHER_API_KEY`
- Email: `RESEND_API_KEY`, `VERIFICATION_EMAIL_FROM`, `VERIFICATION_EMAIL_NAME`
- Security/runtime: `CRON_SECRET`, `WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGIN`, optional Upstash Redis vars
- Observability: Sentry DSN/auth variables

Canonical setup docs:

- [docs/operations/ENVIRONMENT_SETUP.md](./docs/operations/ENVIRONMENT_SETUP.md)
- [docs/operations/google-maps-platform-setup.md](./docs/operations/google-maps-platform-setup.md)
- [docs/operations/resend-vercel-setup.md](./docs/operations/resend-vercel-setup.md)
- [docs/operations/supabase-oauth-setup.md](./docs/operations/supabase-oauth-setup.md)

## Database Source Of Truth

The source of truth is `supabase/migrations/`, not the legacy schema snapshot alone.

- Use `supabase/migrations/` for real schema history.
- `docs/database/database-schema.sql` is a reference snapshot, useful for review but not the authoritative migration chain.
- Repo-level Supabase notes: [supabase/README.md](./supabase/README.md)

## Development Commands

```bash
npm run dev
npm run dev:turbo
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run format:check
npm run check
npm run export:flutter-map-assets
```

## Quality Gates

Implemented checks in this repository:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:coverage`
- `npm run check:secrets`
- `npm run check:i18n`
- `npm run build`

CI workflows:

- `.github/workflows/ci-cd.yml`: typecheck, lint, coverage, npm audit, secrets scan, i18n check, build, Lighthouse
- `.github/workflows/production-deploy.yml`: build validation, tests, secrets validation, Vercel deploy, post-deploy verification

## Documentation Map

- Architecture: [docs/architecture/ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md)
- Technical explanation: [TECHNICAL_EXPLANATION.md](./TECHNICAL_EXPLANATION.md)
- API reference: [docs/api/API_REFERENCE.md](./docs/api/API_REFERENCE.md)
- Environment setup: [docs/operations/ENVIRONMENT_SETUP.md](./docs/operations/ENVIRONMENT_SETUP.md)
- Routes and navigation: [docs/reference/ROUTES_AND_NAVIGATION.md](./docs/reference/ROUTES_AND_NAVIGATION.md)
- Repository inventory: [docs/reference/REPOSITORY_INVENTORY.md](./docs/reference/REPOSITORY_INVENTORY.md)
- Docs index: [docs/README.md](./docs/README.md)
- Security policy: [SECURITY.md](./SECURITY.md)
- Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Code of conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- License: [LICENSE](./LICENSE)

## Known Documentation Corrections Made In This Pass

This README intentionally avoids earlier stale claims that were not backed by the current repo, including:

- Tailwind 3 wording while `package.json` uses Tailwind 4
- Turbopack as the default runtime while default scripts use webpack-based `next dev --webpack` and `next build --webpack`
- Playwright as an active repo test layer even though the current checked-in test/config surface is Vitest-focused
- Manual schema initialization as the primary path instead of the canonical `supabase/migrations/` history
