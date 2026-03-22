# Syllabus Sync — Campus OS for Australian Universities

An open-source student operations platform that transforms university syllabus PDFs into structured, machine-readable data and wraps them in a modern student productivity app.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Next.js](https://img.shields.io/badge/Next.js-000?logo=nextdotjs)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?logo=tailwindcss&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-Vitest-6E9F18)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF)

## Live Demo

[Open the app](https://syllabus-sync-ashy.vercel.app)

## Overview

Syllabus Sync is an open-source platform designed to help students and universities turn static syllabus and timetable PDFs into structured, machine-readable data.

Built initially for Macquarie University, the platform combines academic planning, reminders, campus navigation, secure authentication, and multilingual support in a modern full-stack application. The project is designed to be adaptable for other institutions by replacing academic datasets and configuring environment variables.

At its core, Syllabus Sync aims to solve a common problem across universities: important academic information is often locked inside PDFs that are difficult for students, systems, and AI tools to use effectively.

## Why Syllabus Sync?

University unit guides and timetables often contain valuable information such as:

- assessment deadlines
- learning outcomes
- unit requirements
- lecture and tutorial timing
- campus and location details

However, this information is usually published in static PDF format. Students often need to manually copy deadlines into calendars, track assessments by hand, or repeatedly check multiple systems.

Syllabus Sync addresses this by converting academic information into structured, usable data and building student-facing features on top of it.

## Key Features

- Extracts syllabus data from PDF unit guides into structured JSON and Markdown
- Academic planning and deadline tracking
- Calendar, reminders, and notifications
- Campus navigation and map support
- Secure authentication with MFA and WebAuthn
- Multilingual and student-focused user experience
- Multi-profile support
- Version-controlled academic data workflows
- CI-tested full-stack application architecture

## Core Capabilities

### 1. Syllabus Data Extraction

Syllabus Sync includes an OCR- and LLM-assisted pipeline that converts university syllabus content into structured formats for downstream systems, applications, or AI workflows.

### 2. Student Productivity Tools

The application provides a student-focused interface for managing:

- academic deadlines
- calendar events
- reminders
- notifications
- unit-related information

### 3. Campus Navigation

Students can access campus-related support features such as maps and routing tools to improve navigation and day-to-day planning.

### 4. Secure User Management

The platform includes modern authentication and security measures, including:

- Supabase authentication
- Row-Level Security (RLS)
- MFA support
- WebAuthn / passkey flows
- protected API routing
- rate limiting and request validation

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4
- Radix UI
- Zustand

### Backend / Data

- Supabase
- PostgreSQL
- Supabase Auth
- Row-Level Security (RLS)

### Tooling / Quality

- Vitest
- Testing Library
- ESLint
- Prettier
- GitHub Actions
- Vercel
- Sentry

### Integrations

- Google Maps
- OpenRouteService
- Resend

## Architecture Summary

Syllabus Sync is structured as a layered full-stack platform:

### Layer 1 — Identity & Data Platform

- Supabase Auth
- PostgreSQL
- Row-Level Security policies
- migration-based schema management

### Layer 2 — Syllabus Intelligence Layer

- OCR / LLM-assisted extraction pipeline
- schema validation
- structured syllabus output

### Layer 3 — Academic Data API

- route handlers for units, deadlines, todos, events, notifications, profiles, and related services

### Layer 4 — Student UX Shell

- responsive Next.js application
- calendar, reminders, map tools, preferences, and account flows

## Security Highlights

Security is treated as a core design constraint across the system.

Key measures include:

- authentication-by-default API protection
- trusted origin validation for selected requests
- rate limiting on sensitive endpoints
- Supabase Row-Level Security for user data isolation
- secrets scanning in CI
- environment variable separation with `.env.example`
- WebAuthn / passkey support
- schema validation for structured extraction workflows

For full details, see [SECURITY.md](./SECURITY.md).

## Screenshots

Add screenshots here.

Suggested screenshots:

- Home/dashboard
- Calendar or deadline view
- Campus map/navigation page
- Mobile responsive layout

Example:

```md
![Dashboard](./docs/images/dashboard.png)
![Calendar](./docs/images/calendar.png)
![Map](./docs/images/map.png)
```


## 6. Repository Layout

```text
app/                Next.js routes, layouts, 63 API route handlers
components/         Shared UI and layout components
config/             ESLint, Next, Prettier, Sentry, Tailwind, TS, Vitest, Lighthouse
data/               Static academic data (unit catalogue, building maps)
docs/               Architecture, operations, API, policy, security, reference docs
features/           Feature-first client modules (home, calendar, map, settings, feed, auth)
infra/              Docker assets
lib/                Stores, hooks, services, security, utilities, Supabase clients
locales/            35 locale dictionaries
public/             Static assets, icons, map tiles, overlays, service worker
Supabase/           Canonical migration history and Supabase notes
tests/              Vitest suites (92 files)
tools/              Repo utilities (i18n, security, exports, Vercel, load testing)
```

Full inventory: [docs/reference/REPOSITORY_INVENTORY.md](./docs/reference/REPOSITORY_INVENTORY.md)

---

## 7. Quick Start

```bash
# 1. Clone and install
git clone https://github.com/mrpouyaalavi/syllabus-sync.git
cd syllabus-sync
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in Supabase, Google Maps, and Resend credentials

# 3. Start the development server
npm run dev
```

### Required Environment Variables

| Group          | Variables                                                                                |
| -------------- | ---------------------------------------------------------------------------------------- |
| Supabase       | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Google Maps    | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAP_ID`, `GOOGLE_ROUTES_API_KEY`  |
| Campus routing | `ORS_API_KEY`                                                                            |
| Weather        | `GOOGLE_WEATHER_API_KEY`                                                                 |
| Email          | `RESEND_API_KEY`, `VERIFICATION_EMAIL_FROM`, `VERIFICATION_EMAIL_NAME`                   |
| Security       | `CRON_SECRET`, `WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGIN`                                       |
| Observability  | Sentry DSN and auth variables                                                            |

Full setup guide: [docs/operations/ENVIRONMENT_SETUP.md](./docs/operations/ENVIRONMENT_SETUP.md)

---

## 8. API Surface

63 route handlers under `app/api/`, including:

- Auth and account lifecycle, MFA, WebAuthn passkeys
- Units, deadlines, events, todos, notifications
- Profiles and user preferences
- Weather, audit, sync, health
- Campus navigation (Leaflet/ORS) and Google Maps routing
- Security utilities and admin-only tools

Full reference: [docs/api/API_REFERENCE.md](./docs/api/API_REFERENCE.md)

---

## 9. Quality Gates & CI/CD

### Local

```bash
npm run check
# secrets scan → prettier → tsc → eslint → vitest (503 tests) → next build
```

### CI Pipeline (`.github/workflows/ci-cd.yml`)

| Step             | Tool                                     |
| ---------------- | ---------------------------------------- |
| Type check       | `tsc --noEmit`                           |
| Lint             | ESLint with strict config                |
| Test coverage    | Vitest with coverage report              |
| Dependency audit | `npm audit`                              |
| Secrets scan     | Custom pattern scanner                   |
| i18n validation  | Key completeness check across 35 locales |
| Build            | `next build --webpack`                   |
| Lighthouse       | Performance/accessibility score gate     |

---

## 10. Documentation Map

| Document              | Path                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| Architecture          | [docs/architecture/ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md)                         |
| Technical explanation | [TECHNICAL_EXPLANATION.md](./TECHNICAL_EXPLANATION.md)                                           |
| API reference         | [docs/api/API_REFERENCE.md](./docs/api/API_REFERENCE.md)                                         |
| Environment setup     | [docs/operations/ENVIRONMENT_SETUP.md](./docs/operations/ENVIRONMENT_SETUP.md)                   |
| Google Maps setup     | [docs/operations/google-maps-platform-setup.md](./docs/operations/google-maps-platform-setup.md) |
| Resend / Vercel setup | [docs/operations/resend-vercel-setup.md](./docs/operations/resend-vercel-setup.md)               |
| Supabase OAuth setup  | [docs/operations/supabase-oauth-setup.md](./docs/operations/supabase-oauth-setup.md)             |
| Routes & navigation   | [docs/reference/ROUTES_AND_NAVIGATION.md](./docs/reference/ROUTES_AND_NAVIGATION.md)             |
| Repository inventory  | [docs/reference/REPOSITORY_INVENTORY.md](./docs/reference/REPOSITORY_INVENTORY.md)               |
| Docs index            | [docs/README.md](./docs/README.md)                                                               |
| Security policy       | [SECURITY.md](./SECURITY.md)                                                                     |
| Contributing          | [CONTRIBUTING.md](./CONTRIBUTING.md)                                                             |
| Code of conduct       | [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)                                                       |
| License               | [LICENSE](./LICENSE)                                                                             |

---

## Acknowledgements

Built with the support of the open-source community. This project benefits from:

- [Anthropic Claude](https://www.anthropic.com/claude) for AI-assisted architecture, security auditing, and schema mapping
- [OpenAI Codex](https://openai.com/codex) for automated test generation and migration authoring
- [Supabase](https://supabase.com/) for the open-source backend and RLS infrastructure
- [Vercel](https://vercel.com/) for deployment infrastructure

---

_Syllabus Sync is an independent open-source project and is not officially affiliated with Macquarie University._
