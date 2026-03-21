# Technical Explanation & Architecture Deep-Dive

## Purpose

Syllabus Sync is engineered as a blueprint for a modern, secure "Campus OS." This document provides a deep dive into the system's internal mechanics, architectural decisions, and the technical hurdles overcome during its development. It is intended for senior engineers, security architects, and technical reviewers evaluating the platform's production readiness.

## 1. System Architecture & The Edge-First Paradigm

### 1.1 Next.js App Router & Server Components

The application leverages the Next.js 16 App Router, heavily utilizing React Server Components (RSC) to minimize the client-side JavaScript payload.

**Why RSC?** By rendering data-heavy components (like the initial user profile, daily schedule, and complex settings layouts) on the server, we significantly reduce Time to Interactive (TTI) on mobile devices—crucial for students navigating campus on cellular networks.

### 1.2 The Supabase Ecosystem & RLS

We chose Supabase (PostgreSQL) as the backend, specifically for its tight integration with GoTrue auth and PostgREST.

**The Security Hurdle:** Traditional API-layer authorization is prone to human error (e.g., forgetting a `WHERE user_id = ?` clause, leading to IDOR vulnerabilities).
**The Solution:** We implement strict Row-Level Security (RLS) directly within PostgreSQL. Even if an API route is compromised or poorly written, the database engine enforces tenant isolation at the query execution level. No query can read or mutate data unless the `auth.uid()` matches the required policy.

## 2. Zero-Trust Security & Middleware Pipeline

Security in Syllabus Sync is not an afterthought; it is enforced at the edge before requests reach the application logic.

### 2.1 Edge Middleware (`lib/proxy.ts` / `middleware.ts`)

Every incoming request passes through the Vercel Edge Middleware. This layer acts as our Zero-Trust gateway:

1. **Route Classification:** Determines if a route is public, protected, or an API endpoint.
2. **Session Validation:** Extracts the Supabase JWT and validates the session.
3. **Email Verification Gate:** Unverified users attempting to access protected routes are intercepted at the edge and redirected to `/verify`.
4. **Security Headers:** Injects dynamic Content Security Policy (CSP), Strict-Transport-Security (HSTS), and Cross-Origin policies.

#### Infrastructure Scaling & Edge Limits

Vercel Edge functions have strict execution time limits. To prevent upstream Supabase latency (e.g., `ECONNRESET`) from hanging the edge function and causing 504 Gateway Timeouts:

- We engineered a **Fail-Fast Fetch Wrapper** (`lib/supabase/fetch.ts`) with a hard `15,000ms` limit.
- The proxy auth resolution implements an aggressive **`6,000ms` deadline** in production (`PROXY_AUTH_DEADLINE_MS`). If Supabase fails to validate the session within 6 seconds, the proxy fails closed or falls back to an unauthenticated state, preserving edge stability during traffic spikes.

### 2.2 API Hardening & CSRF Protection

API routes (`app/api/**`) employ a shared `requireAuth` wrapper. This wrapper enforces:

- **Session state:** Validating the user JWT.
- **CSRF Origin Checks:** Ensuring `Origin` or `Referer` headers match the allowed application domain.
- **Distributed Rate Limiting:** IP-based anomaly detection and rate limiting (`lib/services/rateLimitService.ts`).
  - _Architectural Note:_ In serverless environments, in-memory rate limiting fails because state isn't shared across instances. Our architecture **mandates Upstash Redis** for production rate limiting, explicitly failing-closed if Redis is unconfigured, preventing bypass attacks during scaling events.

## 3. State Management & Optimistic UI Concurrency

A core UX requirement is that the app feels instantaneous, even on poor campus Wi-Fi. We use Zustand for global state management with aggressive optimistic updates.

### 3.1 The Race Condition Hurdle

Optimistic UI introduces a classic race condition:

1. User creates a reminder → Client instantly updates UI (`temp-id`).
2. Client sends POST request to server.
3. Concurrently, a background focus event triggers a full GET `/api/notifications` refresh.
4. The GET request completes _before_ the POST is processed, overwriting the local state and causing the optimistic notification to vanish.

### 3.2 The Additive Merge Solution

To solve this, we implemented an **Additive Merge Strategy** in `notificationsStore.ts`.
Instead of the standard "replace local state with server state" pattern, our store:

- Keeps all current notifications.
- Updates existing ones with server data.
- Adds new ones from the server.
- Employs a `_protectedIds` map and an `_loadInFlight` concurrency guard to ensure optimistic items survive background polling until the server confirms their creation.

## 4. Identity, Gamification & Database Atomicity

### 4.1 FIDO2 WebAuthn (Passkeys)

We implemented hardware-backed authentication to reduce password fatigue and enhance security.

- **Authenticator Scope:** The WebAuthn configuration explicitly restricts `authenticatorAttachment` to `'platform'`. This limits passkeys to the user's built-in device authenticators (FaceID, TouchID, Windows Hello), prioritizing a frictionless, biometric UX over cross-platform roaming authenticators (like physical YubiKeys).

### 4.2 Securing the RPC Layer (Gamification)

The app includes XP and streak mechanics. Client-controlled XP awards are inherently vulnerable to tampering.

- **Function:** `award_xp(user_id, amount, source)`
- **Security:** Functions are defined as `SECURITY DEFINER SET search_path = public`. Public execution is revoked; only `authenticated` users can call it.
- **Validation:** The RPC validates that the caller `auth.uid()` matches the target `user_id`, preventing cross-user mutation (IDOR).

### 4.3 Signup Atomicity via Postgres Triggers

Initially, creating a user profile alongside the Auth record was done via sequential API calls in the signup route. This risked creating orphaned Auth users if the profile insertion failed.
**The Fix:** We implemented a PostgreSQL trigger (`on_auth_user_created`) that automatically inserts a blank `public.profiles` row whenever a row is inserted into `auth.users`. This guarantees database-level atomicity.

### 4.4 Centralized Audit Logging

All sensitive mutations are recorded via the `log_audit` RPC into the `audit_logs` table.

- **PII Handling Note:** While highly sensitive data (like passwords or API keys) within the `old_data`/`new_data` JSON payloads is redacted via `sanitizeForAudit` in the client utilities, **IP addresses and User Agents are currently logged and stored in plaintext** (cast to `inet` and `text` respectively) to facilitate IP anomaly detection and security incident response.

## 5. Fused-Heading Campus Navigation

The Campus Map (`features/map/`) is a critical feature, replacing standard Google Maps with a custom Leaflet implementation optimized for campus boundaries.

### 5.1 The Navigation Accuracy Hurdle

Standard HTML5 Geolocation provides inaccurate headings when a user is walking slowly or stopped.

### 5.2 The Heading Fusion Algorithm

We implemented a sophisticated `useMapLocation` hook that fuses multiple data sources to provide a highly accurate "Blue Dot" directional cone:

1. **GPS Heading:** Used only when velocity is high.
2. **Movement-Derived Heading:** Calculated by smoothing the vector between the last N coordinates.
3. **Compass Fallback (DeviceOrientation):** Used when the user is stationary.
4. **Outlier Rejection:** Discards GPS samples with massive coordinate jumps and low accuracy scores, preventing the map from wildly jumping across campus.

## 6. Development Operations & Observability

- **Strict Quality Gates:** CI/CD enforces 0 ESLint warnings, strict TypeScript compilation, and 100% passing tests (Vitest + Playwright) before deployment.
- **Sentry Integration:** Comprehensive error tracking across Edge, Server, and Client environments.
- **Secret Scanning:** Automated pre-commit hooks (`tools/security/check-secrets.mjs`) prevent accidental credential leakage.

---

_For a complete map of the codebase, refer to the [Repository Inventory](./docs/inventory/ROUTE_INVENTORY.md)._
