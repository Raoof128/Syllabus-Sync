# Contributing to Syllabus Sync

**Enterprise-Grade Development Guidelines for Industry Professionals**

Syllabus Sync operates under strict engineering standards. We treat this repository as a production-grade enterprise application, prioritizing security, type safety, and architectural consistency.

This document outlines the required workflows and quality gates for all contributions.

---

## 1. The AI-Native Workflow (Raouf Change Protocol)

We employ an AI-native development methodology. Whether you are a human developer or an AI agent, you must adhere to the **Raouf Change Protocol** before submitting code.

1. **Preflight Reading:** You must read `AGENT.md` (for architectural constraints) and the `CHANGELOG.md` (to understand recent context) before writing a line of code.
2. **Explain Before Touching:** Formulate a minimal, surgical plan. Do not perform sweeping refactors outside the scope of your specific feature or bug fix.
3. **Atomic Commits:** Keep changes small and reviewable.
4. **Postflight Logging:** Every significant PR must be accompanied by an update to the `CHANGELOG.md` detailing the scope, files changed, and verification steps.

## 2. Quality Gates & The `check` Pipeline

No code is merged unless it passes our comprehensive, zero-tolerance quality gate. Before opening a PR, you **must** run:

```bash
npm run check
```

This command acts as your primary reviewer, executing:

- **Secrets Scan:** `tools/security/check-secrets.mjs` ensures no API keys or credentials are leaked.
- **Formatter:** Prettier ensures exact stylistic consistency.
- **Typecheck:** `tsc --noEmit` verifies strict TypeScript compliance. We enforce a **Zero `any`** policy.
- **Linter:** ESLint must return 0 errors and 0 warnings.
- **Test Suite:** Vitest executes all unit and integration tests.
- **Build:** Next.js production build verifies route integrity and Server Component constraints.

_If `npm run check` fails, your PR will not be reviewed._

## 3. Architectural & Style Constraints

### Frontend (Next.js & React)

- **App Router:** We strictly use the Next.js 16 App Router. Prefer React Server Components (RSC) for data fetching and layout. Use `"use client"` only at the leaf nodes where interactivity is required.
- **Styling:** Tailwind CSS is mandatory. Do not use hardcoded hex values; you must use the semantic MQ tokens (e.g., `bg-mq-card-background`) defined in `tailwind.config.ts`.
- **State Management:** Use Zustand for global state. Complex state mutations should employ optimistic UI patterns with additive server merging to prevent race conditions.

### Backend (Supabase & API)

- **Zero-Trust Middleware:** All new API routes must be wrapped in `requireAuth` or `requireAuthWithRateLimit` to inherit CSRF protection and session validation.
- **Database Migrations:** Never modify the Supabase schema via the UI. All database changes must be scripted as idempotent, reversible SQL migrations in `supabase/migrations/`.
- **Row-Level Security (RLS):** Every new table must have RLS enabled, with policies restricting access to `auth.uid()`.
- **RPCs over APIs:** For complex, multi-table transactions (like gamification XP awards), prefer PostgreSQL Stored Procedures (RPCs) with `SECURITY DEFINER` over thick Next.js API logic.

## 4. Testing Mandate

A feature is incomplete without automated verification.

- **Unit Tests:** All utilities, hooks, and complex components must be tested via Vitest. Mock external dependencies (like Supabase or standard browser APIs) robustly in `tests/setup.ts`.
- **Integration Tests:** API routes must have integration coverage proving both the success path and the failure paths (e.g., unauthenticated, invalid payload, rate-limited).
- **Test Coverage:** We aim for high branch coverage on critical paths (Auth, Notifications, Mapping).

## 5. Submitting Your Pull Request

1. Branch from `develop` (or `main` if instructed).
2. Use conventional commit messages (e.g., `feat(map): add fused heading`, `fix(auth): resolve race condition in signup`).
3. Fill out the Pull Request template entirely, providing links to the relevant issue, before/after screenshots (for UI changes), and the output of your `npm run check`.
4. Request review from the core maintainers.

Thank you for helping us build a robust, secure Campus OS!
