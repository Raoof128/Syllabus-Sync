# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development commands

### Environment & setup

- Node.js **22+** is required (enforced via `engines` in `package.json`).
- Install dependencies:
  - `npm install` (local development)
  - `npm ci` (CI-style, reproducible installs)
- Environment config (local):
  - `cp .env.example .env.local`
  - Fill Supabase, Upstash Redis, and any other required secrets.
- Database bootstrap (as per `README.md`):
  - Run `database-schema.sql` in the Supabase SQL editor to apply schema/RLS.
  - Additional DB helpers live under `scripts/` (for example `scripts/setup-database.js`).

### Running the app

- Start dev server (Next.js 16 + Turbopack):
  - `npm run dev`
- Dev server without Turbopack (fallback if tooling struggles):
  - `npm run dev:safe`
- Production build and serve:
  - `npm run build`
  - `npm start`

### Linting, formatting, and type checking

- ESLint across `app/`, `components/`, `lib/`, `data/`:
  - `npm run lint`
- TypeScript type checking:
  - `npm run typecheck`
- Prettier:
  - Format in-place: `npm run format`
  - Check only: `npm run format:check`
- Security / quality checks used in CI:
  - Secrets guard: `npm run check:secrets` (runs `scripts/check-no-secret-prints.js`)
  - i18n completeness: `npm run check:i18n`
  - Bundle analysis (non-fatal in CI): `npm run analyze`
- Full pre-flight pipeline (local analogue of CI stages):
  - `npm run check` (secrets → format check → typecheck → lint → tests → build)

### Tests (Vitest, Testing Library)

- Run the full unit/component test suite once (jsdom):
  - `npm run test`
- Watch mode while developing tests:
  - `npm run test:watch`
- With coverage (used in CI):
  - `npm run test:coverage`
- Run a single test file with Vitest (recommended pattern):
  - `npm run test -- tests/UnitCard.test.tsx`
- Run a single test case by name:
  - `npm run test -- tests/UnitCard.test.tsx -t "renders unit details"`

### End‑to‑end, accessibility, and Lighthouse

- Playwright E2E + accessibility suite (uses `playwright.config.ts`):
  - `npm run test:e2e` (targets `tests/e2e.spec.ts` and `tests/accessibility.spec.ts`)
- Accessibility-only run via grep:
  - `npm run test:accessibility`
- Focused Playwright spec or test (when you need to narrow down):
  - `npx playwright test tests/e2e.spec.ts -g "navigates calendar week view"`
- Lighthouse CI (used in the main CI/CD pipeline):
  - `npm run lighthouse`
  - Local collection helper: `npm run lighthouse:local` (manages dev server/ports automatically)

### CI/CD reference

- GitHub Actions pipelines in `.github/workflows/` run, in various jobs:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test:coverage`
  - `npm audit --audit-level moderate`
  - `node scripts/validate-csp-hashes.mjs`
  - `npm run check:i18n`
  - `npm run analyze`
  - `npm run build`
  - Playwright accessibility tests (`npx playwright test --grep "accessibility" --workers=5`)
  - Lighthouse CI against a built app

## High‑level architecture

### System overview

- Full‑stack **Next.js 16 (App Router)** application with **React 19** on the frontend.
- Backend logic implemented as **Next.js API routes** under `app/api/`, talking to **Supabase PostgreSQL** (with strict Row Level Security) and **Upstash Redis** for distributed rate limiting.
- Offline‑aware, PWA‑style UX with service‑worker driven notifications and offline state via persisted Zustand stores.
- Rich visual layer (“Apple Liquid Glass” aesthetic) built from custom Tailwind tokens, CSS modules, and animation helpers.

For deeper diagrams and rationale, see `docs/ARCHITECTURE.md` and the high‑level overview in `README.md`.

### Routing and UI composition (`app/` + `components/`)

- **Route structure (`app/`)**
  - Each major feature has its own route segment, typically with a server‑driven `page.tsx` and a client‑side `*Client.tsx` container:
    - `app/home/` – main dashboard
    - `app/calendar/` – calendar and deadline views
    - `app/map/` – campus map and navigation flows (including `position-editor/` tools)
    - `app/settings/` – user/account, notification, appearance, privacy, and gamification settings
    - `app/login/`, `app/signup/`, `app/test-auth/` – auth flows and diagnostics
  - Global entrypoints such as `app/layout.tsx`, `app/client-layout.tsx`, `app/globals.css`, `app/styles/*.css`, `app/mq-tokens.css` define the overall shell, theme tokens, and page‑level transitions.
- **Presentation components (`components/`)**
  - UI primitives under `components/ui/` (and MQ‑branded variants under `components/ui/mq/`) wrap Radix UI, Tailwind, and local animation utilities. They are the building blocks for all higher‑level UIs.
  - Layout components in `components/layout/` (e.g. `Header`, `Sidebar`, `WeatherWidget`) are consumed by route‑level layout/client components.
  - Feature‑oriented subtrees (`components/home/`, `components/calendar/`, `components/gamification/`, `components/units/`, etc.) are **dumb/presentational** where possible and take data/handlers from Zustand stores or `app/*Client` containers.
  - Cross‑cutting UX elements live in `components/ui` (e.g. `LiquidGlassCard`, `MeshGradient`, `OfflineIndicator`, `KeyboardShortcuts`), and should be reused rather than re‑implementing visual behavior.

### State management & domain logic (`lib/`)

- **Zustand stores (`lib/store/`)**
  - Each core domain (units, deadlines, events, notifications, profiles, map, gamification, theme, language) has a dedicated store file, following a consistent pattern:
    - typed state shape
    - async actions that call the relevant `app/api` endpoints
    - optimistic updates and rollback on failure where needed
    - `persist` middleware for offline‑first behavior and migrations
  - When adding new domain state, mirror this pattern and keep side‑effects in the store layer rather than inside components.
- **Service layer (`lib/services/`)**
  - Encapsulates integration with external or cross‑cutting services:
    - `ors.ts` – OpenRouteService client used both by the navigation API and map features.
    - `rateLimitService.ts` – shared rate‑limiting primitives, used by the API middleware to enforce per‑IP / per‑user quotas.
    - `notificationService.ts` – notification scheduling/management on the client side.
  - Prefer adding new external integrations here and consuming them from API routes or stores, instead of calling external services from React components.
- **Security and configuration**
  - `lib/security/csrf.ts` and `lib/security/csp.ts` centralize CSRF and CSP logic; **do not** duplicate header or origin checks elsewhere.
  - `lib/config.ts`, `lib/constants.ts`, and `lib/proxy.ts` hold environment‑specific configuration, shared constants, and proxy helpers.
  - Supabase client access is funneled through `lib/supabase/{client,server,admin}.ts`; prefer these over raw SDK instantiation.
- **Map and geospatial logic (`lib/map/` + `data/`)**
  - `lib/map/*` contains campus‑specific geospatial helpers (buildings, overlays, calibration, navigation helpers).
  - `data/MQ_Full.geojson`, `data/mq-exports/*`, and `data/mq-pdfs/*` provide OSM‑derived building data and official MQ map PDFs.
  - Python/Node scripts in `scripts/` (e.g. `mq_maps_download.py`, `osm_mq_buildings.py`, `process_buildings.cjs`) are used to regenerate these assets and are tightly coupled to `lib/map`.

### API design and backend patterns (`app/api/`)

- All backend endpoints live under `app/api/`, grouped by domain (`auth`, `units`, `deadlines`, `notifications`, `events`, `gamification`, `navigate`, etc.).
- **Shared API toolkit (`app/api/_lib/`)** – **always** use these helpers when touching API routes:
  - `middleware.ts`
    - `requireAuth` / `optionalAuth` handle Supabase auth and, for mutation methods, CSRF origin validation.
    - `requireAuthWithRateLimit` composes auth + CSRF + per‑user rate limiting (via `mutationLimiter`).
    - `rateLimit` applies IP‑based rate limiting for public/read endpoints and annotates responses with `X-RateLimit-*` headers.
  - `response.ts`
    - Defines the canonical `ApiResponse` shape and error codes.
    - `jsonSuccess`, `jsonError`, `jsonUnauthorized`, `jsonForbidden`, `jsonNotFound`, `jsonPaginated` enforce consistent response formats.
    - `handleValidationError` (for Zod) and `handleDatabaseError` centralize error mapping and logging.
    - `BODY_SIZE_LIMITS` and `checkBodySize` provide standard body‑size enforcement; use these for any endpoint accepting significant payloads.
  - `versioning.ts`
    - `getApiVersion`, `apiVersioning`, and `createVersionedRoute` implement header/path‑based API versioning (current stable: `v1`).
    - For new versions of existing endpoints, prefer `createVersionedRoute` over branching on headers manually.
  - `mappers.ts`
    - Maps raw Supabase rows → typed domain objects (`Unit`, `Deadline`, `Event`, `Notification`) and provides the inverse `serialize*` helpers.
    - Encodes backwards‑compatibility logic for schema migrations (e.g. old flat vs new JSONB location fields).
- When creating or modifying endpoints:
  - Route handlers should be thin: validate input, call domain logic (via `lib/*`), and return responses using `_lib/response` helpers.
  - Always go through Supabase helpers in `lib/supabase/*` instead of using ad‑hoc clients.
  - Respect RLS and per‑user scoping; ensure `user_id` is set when serializing user‑owned entities.

### Internationalization, notifications, and gamification

- **i18n**
  - Centralized in `lib/i18n/translations.ts` and locale JSON files; supports 19 languages including RTL.
  - `useTranslation` hook in `lib/hooks/useTranslation.ts` (and related helpers) provide the standard way to access translations in React components.
  - CLI and maintenance scripts for translation coverage/live audits are under `scripts/` (`check-i18n-completeness.cjs`, `i18n_audit.cjs`, etc.) and are wired into CI via `npm run check:i18n`.
- **Notifications**
  - Backend endpoints under `app/api/notifications/` are responsible for CRUD and read/unread state.
  - Frontend scheduling and browser notification logic is handled via `lib/hooks/useNotificationScheduler.ts`, `lib/utils/serviceWorker.ts`, and `lib/services/notificationService.ts`.
- **Gamification**
  - API endpoints under `app/api/gamification/` award XP and surface gamification data.
  - UI components in `components/gamification/` (e.g. `GamificationStats`, `LevelBadge`, `XPProgressBar`) read from `lib/store/gamificationStore.ts`.
  - Server‑side tamper protection is implemented in the DB schema/RLS and reflected in the mapping/serialization code.

### Testing layout

- **Vitest**
  - Configured via `vitest.config.ts` with `jsdom` environment and `tests/setup.ts`.
  - Unit/component tests live under `tests/**/*.{test,spec}.{ts,tsx}`; E2E/accessibility specs (`tests/e2e.spec.ts`, `tests/accessibility.spec.ts`) are excluded from Vitest and run via Playwright.
- **Playwright**
  - Config in `playwright.config.ts` uses `npm run dev` as a webServer and exercises `e2e` + accessibility specs across desktop and mobile browsers.
- The test suite covers stores, API utilities, UI components, and key accessibility flows; new tests should follow the existing patterns in `tests/` rather than introducing new test harnesses.

## Project documentation

- `README.md` – high‑level product overview, setup instructions, and feature list.
- `docs/ARCHITECTURE.md` – detailed architecture, security model, and testing strategy (primary reference for system‑wide design decisions).
- `docs/api.md` – API contract (auth, response format, error codes, major resource endpoints, versioning).
- `Team_Plan/AGENT.md` – running log of recent agent‑driven changes; consult and update this file when you make significant, non‑trivial modifications (especially around map/navigation).
