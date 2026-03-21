# Architecture Overview

## System Summary

Syllabus Sync is engineered as a secure, high-performance "Campus OS" using the Next.js 16 App Router paradigm. It merges an authenticated student productivity suite (scheduling, deadlines) with advanced location-aware services (fused-heading campus navigation), all backed by a Zero-Trust, edge-protected Supabase infrastructure.

### The Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS, Shadcn UI
- **State Management:** Zustand (persistent, optimistic UI patterns)
- **Backend & Database:** Supabase (PostgreSQL, GoTrue Auth, Storage)
- **Infrastructure:** Vercel (Edge Middleware, Serverless API)
- **Mapping:** Leaflet (OpenStreetMap) combined with Google Maps Embed API

---

## 1. Application Flow & The Request Lifecycle

### 1.1 The Edge Gateway (`lib/proxy.ts` / `middleware.ts`)

Before any request hits the application logic, it must pass through the Vercel Edge Middleware. This is our Zero-Trust boundary.

- **Classification:** Requests are categorized (Auth, Public, Protected, API, Static).
- **Session Resolution:** The Supabase session is verified at the edge. We use a fail-fast fetch wrapper (`lib/supabase/fetch.ts`) to prevent upstream network latency from blocking the edge function.
- **Email Gate:** Unverified users attempting to access protected routes are intercepted and redirected to `/verify`.
- **Security Headers:** Strict CSP, HSTS, and cross-origin headers are injected.

### 1.2 Route Handling & The App Router

The application strictly separates Server Components from Client Components to optimize payload size.

- **Server Components:** Used for data fetching, layout generation, and rendering static shells (e.g., `app/home/page.tsx`).
- **Client Components:** Used only at the leaf nodes where interactivity is required (e.g., `features/home/components/EventsFeed.tsx`).

### 1.3 The API Layer (`app/api/**`)

Our Next.js API routes act as a secure proxy to the database.

- **Protection:** All non-public routes are wrapped in `requireAuth` or `requireAuthWithRateLimit`, enforcing CSRF checks and session validation.
- **Validation:** Every request payload is strictly parsed using Zod schemas.
- **Atomicity:** Complex mutations (like XP awards) are delegated to PostgreSQL Stored Procedures (RPCs) to ensure atomicity and prevent race conditions.

---

## 2. Core Architectural Pillars

### 2.1 Defense-in-Depth Security

We do not rely solely on the API layer for authorization.

- **Row-Level Security (RLS):** Every table in the PostgreSQL database has RLS enabled. The database engine itself verifies that `auth.uid()` matches the required policy before executing any query, eliminating IDOR vulnerabilities.
- **Modern Auth:** We support FIDO2 WebAuthn (Passkeys) for hardware-backed security, alongside traditional MFA (TOTP/SMS).

### 2.2 Optimistic UI & Additive Merging

To ensure a snappy, app-like feel on slow campus networks, we employ optimistic UI updates via Zustand.

- **The Challenge:** Optimistic updates can be overwritten if a background data fetch completes before the server acknowledges the mutation.
- **The Solution:** We implemented an **Additive Merge Strategy**. When syncing with the server, we preserve locally created items (protected by temporary IDs and an `_loadInFlight` guard) and merge them with confirmed server data, preventing UI flickering and data loss.

### 2.3 Highly Accurate Campus Navigation

Standard HTML5 Geolocation is insufficient for precise pedestrian routing on campus.

- **Heading Fusion Algorithm:** Our custom `useMapLocation` hook fuses GPS heading data (when moving quickly), movement-derived vector smoothing, and DeviceOrientation compass data (when stationary) to provide a stable, highly accurate directional cone.
- **Outlier Rejection:** We dynamically discard GPS samples with severe coordinate jumps or low accuracy scores to prevent the map marker from erratically bouncing across buildings.

---

## Further Reading

- [Technical Explanation](../../TECHNICAL_EXPLANATION.md): Deep-dive into specific implementations and bug resolutions.
- [Security Posture](../security/SECURITY_POSTURE.md): Complete catalogue of implemented security controls.
- [Route Inventory](../inventory/ROUTE_INVENTORY.md): Mapping of the Next.js App Router structure.
