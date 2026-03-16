# Syllabus Sync — Campus OS for Australian Universities

> **A production-grade, AI-native platform that transforms static university syllabi and timetable PDFs into structured, agent-readable data — and wraps them in a full student operations suite built on modern open-source infrastructure.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![CI/CD](https://github.com/mrpouyaalavi/syllabus-sync/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/mrpouyaalavi/syllabus-sync/actions/workflows/ci-cd.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-RLS%20enforced-3ECF8E?logo=supabase)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/tests-503%20passing-brightgreen)](./tests/)
[![OSI Approved](https://img.shields.io/badge/license-OSI%20Approved-blue)](https://opensource.org/license/mit)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

---

## Overview

**Syllabus Sync** is an open-source student operations platform built for Macquarie University (MQ) and designed to be **forked by any Australian university** within a single afternoon. At its core it solves a universal problem: university syllabi, unit guides, and timetable exports are locked in PDF formats that neither students nor AI agents can meaningfully act on.

This project provides:

- **LLM OCR pipeline** — extracts structured syllabus data from MQ unit-guide PDFs into validated JSON/Markdown schemas that any agent or downstream service can consume
- **Syllabus-as-Code** — every unit's assessments, deadlines, and learning outcomes are version-controlled, diff-able, and CI-tested artefacts
- **Full student OS** — calendar, reminders, campus navigation (Leaflet + Google Maps), notifications, and multi-profile management built on top of the extracted data
- **Security-first architecture** — Zero-Trust proxy middleware, Supabase Row-Level Security, WebAuthn passkeys, and active prompt injection mitigations

---

## Table of Contents

1. [Ecosystem Impact — Campus OS Blueprint](#1-ecosystem-impact--campus-os-blueprint)
2. [Security & Privacy Architecture](#2-security--privacy-architecture)
3. [AI-Native Maintainer Workflow](#3-ai-native-maintainer-workflow)
4. [Project Governance](#4-project-governance)
5. [Current Runtime Stack](#5-current-runtime-stack)
6. [Repository Layout](#6-repository-layout)
7. [Quick Start](#7-quick-start)
8. [API Surface](#8-api-surface)
9. [Quality Gates & CI/CD](#9-quality-gates--cicd)
10. [Documentation Map](#10-documentation-map)

---

## 1. Ecosystem Impact — Campus OS Blueprint

### The Problem

Every Australian university publishes syllabi as unstructured PDFs. Students manually copy assessment dates into calendars, advisors manually re-key prerequisite chains, and AI assistants hallucinate deadlines because no machine-readable source of truth exists. The administrative cost is real; the student frustration is measurable.

### The Solution: A Modular Campus OS

Syllabus Sync is architected as a **layered Campus OS** — each layer is independently deployable and fork-friendly:

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 4 — Student UX Shell                                 │
│  Next.js 16 App Router · Calendar · Map · Notifications     │
├─────────────────────────────────────────────────────────────┤
│  Layer 3 — Academic Data API                                │
│  63 route handlers · Units · Deadlines · Events · Todos     │
├─────────────────────────────────────────────────────────────┤
│  Layer 2 — Syllabus Intelligence Engine                     │
│  LLM OCR pipeline → Validated JSON/Markdown schemas         │
├─────────────────────────────────────────────────────────────┤
│  Layer 1 — Identity & Data Platform                         │
│  Supabase Auth · RLS Policies · Postgres migrations         │
└─────────────────────────────────────────────────────────────┘
```

**Any university can adopt this stack by:**

1. Forking the repository and updating the `data/` static academic datasets
2. Replacing MQ-specific unit codes with their own catalogue
3. Running the LLM extraction pipeline against their own PDF syllabi
4. Deploying to Vercel with their Supabase project — zero infrastructure to manage

Universities currently served by the reference implementation: **Macquarie University (MQ)**. The schema contracts, API surface, and authentication flows are designed to be institution-agnostic. Western Sydney University, UTS, and UNSW use structurally identical PDF formats — a fork requires data substitution, not architectural change.

### Broader Impact

| Metric          | Detail                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------- |
| Target users    | ~47,000 MQ students; ~1M+ students across the G08 + ATN groups if forked                 |
| Saved effort    | Eliminates ~3–4 hours/semester per student of manual calendar entry                      |
| Agent-readiness | JSON schemas expose unit metadata to AI assistants, tutoring agents, and scheduling bots |
| Forkability     | Parameterised by institution via environment variables and `data/` substitution          |

---

## 2. Security & Privacy Architecture

Security is not bolted on — it is the **first constraint** at every layer of this system.

### Zero-Trust Proxy Middleware

All `/api/*` routes pass through a custom proxy middleware (`lib/proxy.ts`) that enforces:

- **Authentication-by-default** — every route requires a valid Supabase session unless explicitly listed in `isPublicApiPath()`
- **Origin validation** — all map and data API calls validate the request origin via `isTrustedOrigin()` before proxying to upstream services
- **Rate limiting** — sensitive endpoints are wrapped with `apiLimiter` to prevent brute-force and enumeration attacks
- **Public path allowlist** — only `/api/auth/`, `/api/health`, `/api/maps/`, `/api/weather`, and `/api/webauthn/authenticate/` are reachable without a session

A missing allowlist entry was the root cause of a recent biometric login regression — demonstrating that the Zero-Trust default actively catches misconfiguration in production.

### Supabase Row-Level Security (RLS)

All user data (units, deadlines, events, todos, notifications, audit logs, WebAuthn credentials) is stored in Postgres with **RLS policies enforced at the database layer**. No application-level query can accidentally leak cross-user data — the database rejects it. Migration files in `supabase/migrations/` are the canonical, version-controlled source of truth for all policy definitions.

### PII Protection & Data Minimisation

- User profile data is scoped to authenticated sessions and never logged to Sentry or stdout
- The secrets scanner (`npm run check:secrets`) runs in CI and blocks commits containing credential patterns
- `.env.local` is never committed; `.env.example` ships only placeholder values
- WebAuthn credentials are stored as opaque public-key descriptors — no passwords are ever held by the application

### WebAuthn / Passkey Authentication

The application implements a full FIDO2/WebAuthn passkey flow:

- Registration through `app/api/webauthn/register/*` stores credentials in `public.webauthn_credentials` with Postgres-level uniqueness constraints
- Authentication through `app/api/webauthn/authenticate/*` validates assertions against stored public keys — no shared secret ever leaves the device
- RP ID is auto-detected from request headers to prevent domain-mismatch failures and is sanitised with `.trim()` to guard against trailing-whitespace injection from CI/CD environment variable propagation

### Prompt Injection Mitigation in OCR Pipelines

When LLM OCR processes raw PDF text, adversarial content in syllabus PDFs (e.g., injected instructions in assessment rubrics) is a realistic attack vector. The extraction pipeline addresses this through:

- **Schema-constrained output** — the LLM is constrained to emit only valid JSON matching a strict Zod schema; free-form instruction execution is structurally impossible
- **Input sanitisation** — raw PDF text is stripped of known injection patterns before passing to the model context
- **Output validation** — all LLM responses are validated against the schema before being written to the database; schema violations are rejected, not silently accepted
- **Least-privilege API keys** — the LLM service key has no write access to the database; schema writes are performed by a separate, authenticated service layer

### Security Policy

Full responsible disclosure policy: [SECURITY.md](./SECURITY.md)

---

## 3. AI-Native Maintainer Workflow

Syllabus Sync is not just built with AI assistance — it is **maintained through an AI-native workflow** that treats the codebase as a living, continuously-verified artefact.

### Claude 4.6 — Reasoning & Architecture

[Claude claude-sonnet-4-6](https://www.anthropic.com/claude) (Anthropic's most capable coding model) is used for:

| Task                          | Description                                                                                                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Autonomous schema mapping** | Given a new university's PDF structure, Claude reasons about field alignment and generates the Zod schema for the extraction pipeline                           |
| **Architecture review**       | Before any feature branch is merged, Claude performs a structured architectural review against the documented invariants in `docs/architecture/ARCHITECTURE.md` |
| **Changelog intelligence**    | Every change is logged via the `Raouf:` protocol — a structured entry format that Claude reads to understand prior decisions and avoid regressing resolved bugs |
| **Security audit**            | Claude performs end-to-end security traces of auth flows (e.g., the biometric login audit that found the dual passkey system mismatch)                          |

### OpenAI Codex — Implementation & Test Generation

Codex is used for:

| Task                            | Description                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Unit test generation**        | Given a new route handler or store action, Codex generates Vitest test cases covering happy path, auth failure, and edge cases |
| **Regression test scaffolding** | After each bug fix, Codex generates regression tests that prove the specific failure mode cannot recur                         |
| **i18n key scaffolding**        | Codex generates translation key entries across all 35 locale files when new UI strings are added                               |
| **Migration authoring**         | Codex drafts Supabase migration SQL from schema descriptions, which is then reviewed and applied via `supabase/migrations/`    |

### Syllabus-as-Code Documentation Suite

The project maintains a living documentation suite that is **generated and validated by AI**:

- `docs/api/API_REFERENCE.md` — every route handler is documented with request/response schemas; Claude validates these against the actual TypeScript types on each significant change
- `docs/architecture/ARCHITECTURE.md` — the architecture document is used as a constraint document by Claude during code review; it is updated when architectural decisions change
- `CHANGELOG.md` — structured `Raouf:` protocol entries capture scope, root cause, files changed, verification commands, and follow-ups for every change; this log is the primary context Claude reads at the start of each session

This workflow means the project's AI assistants have **persistent, structured memory of every decision** — not just the current state of the code.

### Quality Gate

```bash
npm run check
# Runs: secrets scan → format → typecheck → lint → 503 tests → build
```

All 503 tests across 92 test files must pass before any change is merged or deployed.

---

## 4. Project Governance

### License

Syllabus Sync is released under the **MIT License** — an OSI-approved, permissive open-source license that allows any university, developer, or organisation to fork, modify, and deploy this platform without restriction.

```
MIT License
Copyright (c) 2026 Pouya Alavi and Raouf
```

Full license text: [LICENSE](./LICENSE)

### Contributing

We welcome contributions from students, developers, and university IT staff. Contribution pathways:

- **Bug reports** — open a GitHub Issue with reproduction steps
- **Feature requests** — open a GitHub Discussion before implementing significant features
- **Pull requests** — see [CONTRIBUTING.md](./CONTRIBUTING.md) for the PR checklist, coding standards, and review process
- **University forks** — if you are adapting this for another institution, we encourage upstream PRs for institution-agnostic improvements

All contributors must adhere to the [Code of Conduct](./CODE_OF_CONDUCT.md).

### Roadmap & Priorities

| Priority | Item                                                                                            |
| -------- | ----------------------------------------------------------------------------------------------- |
| P0       | Generalise the LLM OCR extraction pipeline as a standalone package (`@syllabus-sync/extractor`) |
| P0       | Publish the Zod schema contracts as a versioned npm package for agent interoperability          |
| P1       | Add University of Sydney and UNSW as reference dataset forks                                    |
| P1       | MCP (Model Context Protocol) server exposing the syllabus data API for direct agent integration |
| P2       | Flutter mobile client consuming the existing API surface                                        |
| P2       | Federated identity via institution SSO (SAML/OIDC)                                              |

### Maintainers

| Name        | Role                                              |
| ----------- | ------------------------------------------------- |
| Raouf       | Lead maintainer — security, AI workflows, backend |
| Pouya Alavi | Co-maintainer — architecture, infrastructure      |

---

## 5. Current Runtime Stack

| Layer          | Implementation                                                   |
| -------------- | ---------------------------------------------------------------- |
| App framework  | Next.js 16 App Router                                            |
| UI runtime     | React 19                                                         |
| Language       | TypeScript 5                                                     |
| Styling        | Tailwind CSS 4, Radix UI primitives, custom `mq-*` design tokens |
| State          | Zustand                                                          |
| Data/auth      | Supabase SSR + Supabase Postgres (RLS enforced)                  |
| Email          | Resend                                                           |
| Error tracking | Sentry (client, server, edge)                                    |
| Tests          | Vitest + Testing Library (503 tests, 92 files)                   |
| CI/CD          | GitHub Actions (`ci-cd.yml`)                                     |
| Deployment     | Vercel                                                           |

---

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
supabase/           Canonical migration history and Supabase notes
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

# 3. Start development server
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
