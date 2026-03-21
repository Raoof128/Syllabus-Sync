# Agent Rules & Architectural Constraints

This document serves as the foundational mandate for all AI agents and human contributors working on the Syllabus Sync repository. Adherence to these rules is non-negotiable to maintain system integrity and architectural consistency.

---

## 1. Security-First Mandate

Syllabus Sync operates on a **Zero-Trust** and **Defense-in-Depth** model.

- **Credential Protection:** Never log, print, or commit secrets, API keys, or sensitive credentials. Rigorously protect `.env` files and `.git` folders.
- **Tenant Isolation:** Always leverage PostgreSQL Row-Level Security (RLS). Ensure every table has a policy restricting access to `auth.uid()`.
- **Zero-Trust Middleware:** All new API routes must be wrapped in `requireAuth` or `requireAuthWithRateLimit`.
- **MFA Fail-Closed:** Critical security paths (MFA enrollment, passkey registration) must fail closed upon any unexpected error.

---

## 2. The Raouf Change Protocol (MANDATORY)

Whether you are a human or an AI, you must follow this protocol for every code change:

1. **Preflight Reading:** Locate and read `AGENT.md` and the recent history in `CHANGELOG.md`.
2. **Explain Before Touching:** Provide a concise summary of constraints and your planned edits before execution.
3. **Atomic Changes:** Make minimal, consistent changes aligned with existing patterns.
4. **Verification:** Run `npm run check` (or the relevant sub-command) to verify behavioral and structural correctness.
5. **Postflight Logging:** Append a new entry to both `AGENT.md` and `CHANGELOG.md` using the "Raouf:" template.

---

## 3. Architectural Constraints

### 3.1 Next.js App Router

- **RSC by Default:** Prefer React Server Components for data fetching and layout.
- **Client Leaf Nodes:** Use `"use client"` only when browser-side interactivity (state, effects, events) is required.
- **Route Handlers:** API logic belongs in `app/api/**/route.ts`. Use the shared `jsonSuccess`/`jsonError` response utilities.

### 3.2 State Management (Zustand)

- **Persistent Store:** Use the `persist` middleware for preferences and essential cached data.
- **Optimistic UI:** Implement the **Additive Merge Strategy** for notifications and deadlines to prevent race conditions during background sync.

### 3.3 Database & Migrations

- **Scripted Schema:** All database changes must be idempotent, reversible SQL migrations in `supabase/migrations/`.
- **Postgres Atomicity:** Use triggers and Stored Procedures (RPCs) for multi-table operations or security-critical logic (like XP awards).

---

## 4. Engineering Standards

- **TypeScript:** Strict mode is enforced. **Zero `any`** policy. Use Zod for all runtime payload validation.
- **Styling:** Tailwind CSS using MQ semantic tokens. No hardcoded hex values.
- **Internationalization (i18n):** All user-facing strings must be localized via `locales/en/translations.json`. No hardcoded UI strings.
- **Testing:** Every bug fix must include a reproduction test. Every new feature must include unit and integration coverage.

---

## Change Log (Raouf Template)

### 2026-03-21 (Australia/Sydney)

**Raouf:**

- **Scope:** Full Project Documentation Portfolio Transformation
- **Summary:** Rewrote and structurally elevated the entire project documentation suite to transform the repository into a high-caliber portfolio piece. Unified the professional tone, highlighted complex engineering impact (Zero-Trust, Additive Merge, Fused Heading), and addressed implementation-aware gaps (Infrastructure limits, PII handling, Passkey scope).
- **Files Changed:** `README.md`, `TECHNICAL_EXPLANATION.md`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `docs/README.md`, `docs/architecture/ARCHITECTURE.md`, `docs/api/API_REFERENCE.md`, `docs/inventory/ROUTE_INVENTORY.md`, `docs/setup/ENVIRONMENT_SETUP.md`, `docs/university-integration-requirements.md`, `docs/operations/deployment-checklist.md`, `docs/security/SECURITY_POSTURE.md`, `AGENT.md`, `CHANGELOG.md`.
- **Verification:** Documentation consistency audit completed; Markdown links verified; alignment with codebase implementation-details (Vercel limits, Redis requirement, PII logging) confirmed.
- **Follow-ups:** Monitor stakeholder feedback on the new "Campus OS" framing.

Raouf: 2026-03-17 (Australia/Sydney)
Scope: Rewrite README for Claude for OSS and OpenAI Codex for OSS Grant Applications
Summary: Replaced the internal-facing technical README with a grant-optimised public README. Added professional GitHub badges (MIT, CI/CD, TypeScript, Next.js, Supabase, tests, OSI, PRs). Structured four grant-targeted sections: (1) Ecosystem Impact framing the project as a modular "Campus OS" blueprint for Australian universities with layered architecture diagram and quantified impact table; (2) Security & Privacy Architecture covering Zero-Trust proxy middleware, Supabase RLS, PII minimisation, FIDO2/WebAuthn passkeys, and LLM OCR prompt injection mitigations; (3) AI-Native Maintainer Workflow documenting Claude 4.6 for schema mapping/architecture/security auditing and Codex for test generation/migrations/i18n, plus the Syllabus-as-Code documentation suite framing; (4) Project Governance with OSI-approved MIT licence confirmation, contributing pathways, P0–P2 roadmap (standalone extractor package, MCP server, institutional forks), and maintainer listing. Preserved all accurate technical facts from the prior README.
Files Changed: `README.md`, `CHANGELOG.md`, `AGENT.md`
Verification: Documentation-only change; no code modified ✅
Follow-ups: Once a GitHub repository URL is confirmed, update the badge URLs and clone command from placeholder to real org/repo path.

... [rest of AGENT.md content] ...
