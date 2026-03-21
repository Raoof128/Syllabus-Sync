<div align="center">

<!-- Typing animation -->
[![Typing SVG](https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=20&duration=2800&pause=700&color=6366F1&center=true&vCenter=true&width=860&lines=Campus+OS+for+Australian+Universities;Syllabus+PDFs+%E2%86%92+Structured+Data+%E2%86%92+Student+Productivity;Next.js+16+%C2%B7+React+19+%C2%B7+TypeScript+%C2%B7+Supabase;Enterprise+Security+%C2%B7+19+Languages+%C2%B7+WCAG+2.1+AA)](https://readme-typing-svg.demolab.com)

<!-- Badges -->
![License: MIT](https://img.shields.io/badge/License-MIT-f59e0b?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js_16-000?style=for-the-badge&logo=nextdotjs)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Tests](https://img.shields.io/badge/503_Tests-Vitest-6E9F18?style=for-the-badge)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0f172a,30:6366f1,60:22c55e,100:0f172a&height=2" width="100%"/>

<br/>

# Syllabus Sync — Enterprise-Grade Campus OS Blueprint

> **A production-ready, AI-native platform that transforms static university infrastructure into a secure, high-performance, and cohesive student experience.**

Syllabus Sync is an open-source student operations platform that transforms university syllabus PDFs into structured, machine-readable data — wrapping them in a modern, security-focused productivity application built for university students.

Built initially for **Macquarie University**, it unifies scheduling, deadline tracking, campus navigation, and student engagement into a single, highly secure, edge-delivered web application. This project serves as a comprehensive portfolio piece demonstrating advanced full-stack engineering, rigorous cybersecurity implementations, and AI-native development workflows.

**[🔗 Live Demo](https://syllabus-sync-ashy.vercel.app)** &nbsp;·&nbsp; **[📖 Docs](./docs/README.md)** &nbsp;·&nbsp; **[🔐 Security](./SECURITY.md)** &nbsp;·&nbsp; **[🤝 Contributing](./CONTRIBUTING.md)**

<br/>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0f172a,30:6366f1,60:22c55e,100:0f172a&height=2" width="100%"/>

<br/>

## 🎯 High-Level Impact & Value Proposition

Traditional university systems are fragmented, leading to missed deadlines, poor campus discoverability, and sub-optimal student experiences. Syllabus Sync solves this by providing:

- **Unified Academic Management:** Seamless integration of enrolled units, class times, and assessment deadlines with stress-aware predictive tracking.
- **Advanced Campus Navigation:** Real-time, fused-heading campus navigation combining OpenStreetMap (Leaflet) and Google Maps Embed APIs, tailored for high-accuracy pedestrian routing.
- **Enterprise-Grade Security:** A defense-in-depth architecture featuring WebAuthn (Passkeys), hardware-backed MFA, Zero-Trust middleware, and strict Row-Level Security (RLS).
- **Gamified Engagement:** Secure, anti-abuse XP and streak mechanics to incentivize academic consistency.

<br/>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0f172a,30:6366f1,60:22c55e,100:0f172a&height=2" width="100%"/>

<br/>

## Screenshots

<div align="center">

| Dashboard | Calendar |
|:---:|:---:|
| <img width="400" alt="Dashboard" src="https://github.com/user-attachments/assets/837072a4-ee98-4d6f-9157-1fdf8ed56a6c"/> | <img width="400" alt="Calendar" src="https://github.com/user-attachments/assets/77548321-6501-4569-9ddf-b9b2bdfce841"/> |

| Campus Map (Leaflet) | Campus Map (Google Maps) |
|:---:|:---:|
| <img width="400" alt="Campus map" src="https://github.com/user-attachments/assets/fde5eae3-c08a-4d07-a4b1-f9fae80383d2"/> | <img width="400" alt="Google map" src="https://github.com/user-attachments/assets/ecf4f6e9-a341-4467-b54e-1c476bff5c49"/> |

</div>

<br/>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0f172a,30:6366f1,60:22c55e,100:0f172a&height=2" width="100%"/>

<br/>

## Key Features

```
╔══════════════════════════════════════════════════════════════════════╗
║  📄  Syllabus PDF → Structured JSON/Markdown via OCR + LLM pipeline ║
║  🗓  Intelligent calendar with automated workload & stress analysis  ║
║  🗺  Dual-engine navigation: Leaflet + Google Maps, real-time GPS    ║
║  🔐  MFA (TOTP + WebAuthn/Passkey), RLS, CSRF, and rate limiting     ║
║  🌍  19 languages · Full RTL · WCAG 2.1 AA · 360px–2560px            ║
║  🎮  Gamification: XP, leaderboards, streaks, achievement system     ║
║  🔔  Context-aware notifications with multi-channel delivery         ║
║  ⚡  CI/CD via GitHub Actions · 503 tests · Vercel Edge deployment   ║
╚══════════════════════════════════════════════════════════════════════╝
```

<br/>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0f172a,30:6366f1,60:22c55e,100:0f172a&height=2" width="100%"/>

<br/>

## 🏗️ Technical Architecture Overview

Syllabus Sync is built on a modern, edge-ready tech stack designed for scalability, type safety, and rapid iteration.

### The Stack

<div align="center">

**[ FRONTEND ]**
[![Next.js](https://img.shields.io/badge/Next.js_16-000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://skillicons.dev/icons?i=ts&theme=dark)](https://www.typescriptlang.org)
[![Tailwind CSS](https://skillicons.dev/icons?i=tailwind&theme=dark)](https://tailwindcss.com)

**[ BACKEND & DATABASE ]**
[![Supabase](https://skillicons.dev/icons?i=supabase&theme=dark)](https://supabase.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)

**[ DEVOPS & TOOLING ]**
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)](https://git-scm.com)

**[ TESTING ]**
[![Vitest](https://img.shields.io/badge/Vitest-6366f1?style=for-the-badge&logo=vitest&logoColor=ffffff)](https://vitest.dev)
[![Playwright](https://img.shields.io/badge/Playwright-22c55e?style=for-the-badge&logo=playwright&logoColor=ffffff)](https://playwright.dev)

</div>

### Key Architectural Decisions

1. **Edge-First Security Middleware:** All routing passes through Vercel Edge Middleware, enforcing authentication state, email verification gates, CSRF protection, and rate-limiting before requests hit serverless compute.
2. **Distributed Rate Limiting:** The platform uses Upstash Redis for distributed rate limiting, ensuring consistency across serverless instances.
3. **Database-Level Atomicity:** Critical operations are handled via PostgreSQL triggers to guarantee data integrity and prevent orphaned records.
4. **Optimistic UI with Additive Server Sync:** Complex state uses an optimistic update pattern backed by an additive merge strategy to eliminate race conditions.

<br/>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0f172a,30:6366f1,60:22c55e,100:0f172a&height=2" width="100%"/>

<br/>

## 🔒 Security Posture & Hardening

Security is a **core design constraint**, featuring a defense-in-depth architecture aligned with industry best practices.

- **Authentication:** FIDO2 WebAuthn (Passkeys), hardware-backed MFA (TOTP), and strict session termination.
- **Authorization:** Absolute tenant isolation via PostgreSQL Row-Level Security (RLS) at the query execution layer.
- **Defense-in-Depth:** Content Security Policy (CSP), Subresource Integrity (SRI), and API request signing.
- **Data Protection:** Encryption at rest (AES-256) and in transit (TLS 1.3).
- **Auditability:** Tamper-evident audit logging for all sensitive system and user operations.

Full details: [SECURITY.md](./SECURITY.md)

<br/>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0f172a,30:6366f1,60:22c55e,100:0f172a&height=2" width="100%"/>

<br/>

## 🤖 AI-Native Engineering Workflow

Developed using the **Raouf Change Protocol**, a rigorous, AI-native development methodology orchestrating agents for production-grade software engineering.

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

- `docs/api/API_REFERENCE.md` — every route handler is documented with request/responses; Claude validates these against TypeScript types.
- `docs/architecture/ARCHITECTURE.md` — the architecture document is used as a constraint document by Claude during code review.
- `CHANGELOG.md` — structured `Raouf:` protocol entries capture scope, root cause, and verification for every change.

This workflow means the project's AI assistants have **persistent, structured memory of every decision** — not just the current state of the code.

<br/>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0f172a,30:6366f1,60:22c55e,100:0f172a&height=2" width="100%"/>

<br/>

## 🎯 Project Governance

### License

Syllabus Sync is released under the **MIT License** — an OSI-approved, permissive open-source license.

### Contributing

We welcome contributions from students, developers, and university IT staff. See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

### Roadmap & Priorities

| Priority | Item |
| -------- | ---- |
| P0 | Generalise the LLM OCR extraction pipeline as a standalone package (`@syllabus-sync/extractor`) |
| P0 | Publish the Zod schema contracts as a versioned npm package |
| P1 | Add University of Sydney and UNSW as reference dataset forks |
| P1 | MCP (Model Context Protocol) server exposing the syllabus data API |

### Maintainers

| Name | Role |
| --- | --- |
| Mohammad Raouf Abedini | Lead maintainer — security, AI workflows, backend |
| Mohammad Pouya Alavi Naeini | Co-maintainer — architecture, infrastructure |

<br/>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0f172a,30:6366f1,60:22c55e,100:0f172a&height=2" width="100%"/>

<br/>

## ⚡ Current Runtime Stack

| Layer | Implementation |
| --- | --- |
| App framework | Next.js 16 App Router |
| UI runtime | React 19 |
| Styling | Tailwind CSS 4, Radix UI primitives |
| State | Zustand |
| Data/auth | Supabase SSR + Supabase Postgres (RLS enforced) |
| Tests | Vitest + Testing Library (503 tests, 92 files) |
| CI/CD | GitHub Actions (`ci-cd.yml`) |
| Deployment | Vercel |

<br/>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0f172a,30:6366f1,60:22c55e,100:0f172a&height=2" width="100%"/>

<br/>

## Repository Layout

```text
app/                Next.js routes, layouts, 63 API route handlers
components/         Shared UI and layout components
config/             ESLint, Next, Prettier, Sentry, Tailwind, TS, Vitest, Lighthouse
data/               Static academic data (unit catalogue, building maps)
docs/               Architecture, operations, API, policy, security, reference docs
features/           Feature-first client modules (home, calendar, map, settings, auth)
infra/              Docker assets
lib/                Stores, hooks, services, security, utilities, Supabase clients
locales/            35 locale dictionaries
public/             Static assets, icons, map tiles, overlays, service worker
supabase/           Canonical migration history
tests/              Vitest suites (92 files, 503 tests)
tools/              Repo utilities (i18n, security, exports, load testing)
```

<br/>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0f172a,30:6366f1,60:22c55e,100:0f172a&height=2" width="100%"/>

<br/>

## Quick Start

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

### Quality Assurance

```bash
npm run check
# Runs: secrets scan → format → typecheck → lint → 503 tests → build
```

<br/>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0f172a,30:6366f1,60:22c55e,100:0f172a&height=2" width="100%"/>

<br/>

## Documentation Map

| Document | Path |
|---|---|
| Architecture | [docs/architecture/ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md) |
| Technical explanation | [TECHNICAL_EXPLANATION.md](./TECHNICAL_EXPLANATION.md) |
| API reference | [docs/api/API_REFERENCE.md](./docs/api/API_REFERENCE.md) |
| Security policy | [SECURITY.md](./SECURITY.md) |
| Contributing | [CONTRIBUTING.md](./CONTRIBUTING.md) |
| Docs index | [docs/README.md](./docs/README.md) |

<br/>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0f172a,30:6366f1,60:22c55e,100:0f172a&height=2" width="100%"/>

<br/>

## Acknowledgements

Built with the support of the open-source community. This project benefits from:

- [Supabase](https://supabase.com/) for the open-source backend and RLS infrastructure
- [Vercel](https://vercel.com/) for deployment infrastructure
- [Anthropic Claude](https://www.anthropic.com/claude) for AI-assisted architecture and security auditing
- [OpenAI Codex](https://openai.com/codex) for automated test generation

<br/>

<div align="center">

### `> ping --authors`

```
> Target     : Pouya Alavi Naeini — Front-end Developer , Raouf Abedini — Back-end Developer
> University : Macquarie University, Sydney, NSW
> Status     : [●] ONLINE — open to grad & junior opportunities
```

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-6366f1?style=for-the-badge&logo=linkedin&logoColor=ffffff&labelColor=0f172a)](https://www.linkedin.com/in/pouya-alavi/)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-22c55e?style=for-the-badge&logo=github&logoColor=ffffff&labelColor=0f172a)](https://github.com/mrpouyaalavi)
[![Email](https://img.shields.io/badge/Email-Contact-f59e0b?style=for-the-badge&logo=gmail&logoColor=09090b&labelColor=0f172a)](mailto:pouyaalavi1378@gmail.com)

<br/>

*Syllabus Sync is an independent open-source project and is not officially affiliated with Macquarie University.*

</div>
