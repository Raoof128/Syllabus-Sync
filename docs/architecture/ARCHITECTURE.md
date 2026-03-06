# Architecture Overview

> Syllabus Sync — Enterprise-Grade Campus Management Platform

## System Layers

```
┌──────────────────────────────────────────────────────────────┐
│  Client (Browser / PWA)                                      │
│  React 19 · Next.js 16 App Router · Zustand · Framer Motion │
├──────────────────────────────────────────────────────────────┤
│  Edge Layer (Vercel Middleware)                               │
│  HSTS · CSP · CSRF · Rate Limiting · Auth Guards             │
├──────────────────────────────────────────────────────────────┤
│  API Routes (Server Components + Route Handlers)             │
│  Zod Validation · Auth Middleware · Proxy Layer              │
├──────────────────────────────────────────────────────────────┤
│  External Services                                           │
│  Supabase (Postgres+RLS) · Resend · Google Maps Platform    │
│  Google Weather · ORS (campus mode only)                    │
└──────────────────────────────────────────────────────────────┘
```

## Directory Layout

| Directory     | Purpose                                                                            |
| ------------- | ---------------------------------------------------------------------------------- |
| `app/`        | Next.js App Router — pages, layouts, API routes                                    |
| `features/`   | Feature-first modules (map, calendar, settings, auth, gamification)                |
| `components/` | Shared UI primitives (`ui/`) and layout components (`layout/`)                     |
| `lib/`        | Core business logic — stores, security, services, hooks, utils                     |
| `tests/`      | Vitest test suite (unit, integration, security)                                    |
| `config/`     | Centralized tooling configs (ESLint, Prettier, Vitest, Tailwind, TypeScript, etc.) |
| `infra/`      | Docker, deployment assets                                                          |
| `docs/`       | Operations, policies, security, architecture                                       |
| `supabase/`   | Database migrations                                                                |
| `public/`     | Static assets, service worker, security.txt                                        |

## Key Architectural Decisions

### 1. Feature-First Organisation

Business logic is co-located in `features/` by domain (map, calendar, auth, gamification) rather than by file type. Shared components live in `components/`, shared utilities in `lib/`.

### 2. Server-Client Boundary

- **Server Components** handle data fetching and sensitive operations.
- **Client Components** (`"use client"`) handle interactivity, state, and browser APIs.
- **API Routes** proxy third-party keys (Google Weather, Google Routes, ORS) so secrets never reach the browser.

### 3. State Management (Zustand)

Each domain has a dedicated Zustand store (`lib/store/`). Stores use `persist` middleware with `partialize` to strip PII before writing to localStorage.

### 4. Security by Design

- **Defense in depth**: middleware-level headers, route-level auth guards, Zod input validation, database RLS policies.
- **CSRF**: double-submit cookie pattern on mutation routes.
- **Rate limiting**: distributed via Upstash Redis (production), in-memory fallback (development).
- **CSP**: SHA-256 hashed inline scripts — no `unsafe-inline`.

### 5. Provider Pattern for External APIs

Third-party integrations (weather, routing) implement a common `Provider` interface, making them swappable without client-side changes.

### 6. Campus-First Maps Architecture

- `building.ts` remains the canonical registry for campus destinations, aliases, and routing coordinates.
- The Leaflet campus renderer remains available for the local raster experience.
- Google mode now uses the Maps JavaScript API for map rendering and the Google Routes API for walk/drive/bike/transit route computation.
- `MapClient` still owns the layout shell, URL state, and shared HUD.

### 7. MQ Design System

Custom Tailwind tokens (`mq-*` prefix) encode Macquarie University brand colours, typography, and spacing. Dark mode via class strategy.

## Data Flow

```
Browser → Middleware (security headers, auth check)
       → API Route (Zod validation, rate limit, auth guard)
       → Provider / Supabase client (RLS-scoped query)
       → Response (Zod-validated, cached, Cache-Control headers)
```

## Authentication Flow

```
Signup → Email verification (Resend, SHA-256 token, 20-min expiry)
Login  → Supabase Auth (JWT) → optional MFA (TOTP / SMS) → session cookie
       → optional WebAuthn/Passkey registration
```

## Infrastructure

| Component      | Service                    | Notes                                        |
| -------------- | -------------------------- | -------------------------------------------- |
| Hosting        | Vercel (Edge + Serverless) | Automatic deployments from `main`            |
| Database       | Supabase (PostgreSQL 15)   | Row Level Security enforced                  |
| Rate Limiting  | Upstash Redis              | Distributed, fail-closed for auth            |
| Email          | Resend                     | Transactional verification emails            |
| Error Tracking | Sentry                     | Client + server + edge configs               |
| CI/CD          | GitHub Actions             | Lint, test, security scan, build, Lighthouse |
| Coverage       | Codecov                    | Tracked per PR                               |

## Related Documents

- [Security Policy](../../SECURITY.md)
- [Security Posture Report](../security/SECURITY_POSTURE.md)
- [Security Evidence Index](../security/SECURITY_EVIDENCE_INDEX.md)
- [Deployment Checklist](../operations/deployment-checklist.md)
- [API Reference](../api/API_REFERENCE.md)
