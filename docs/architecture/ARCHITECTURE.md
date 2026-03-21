# System Architecture

**System:** Syllabus Sync -- A Secure, Edge-First Campus Platform
**Author:** Raouf
**Audience:** Engineers, Architects, and Technical Reviewers

---

## 1. Technology Stack

| Layer              | Technology                                          | Rationale                                                                                    |
| :----------------- | :-------------------------------------------------- | :------------------------------------------------------------------------------------------- |
| **Runtime**        | Next.js 16 (App Router), React 19                   | Server Components reduce client JS payload; edge middleware enables pre-application security |
| **State**          | Zustand 5 (persistent stores)                       | Lightweight, framework-agnostic, supports optimistic UI patterns without boilerplate         |
| **Database**       | Supabase (PostgreSQL 15, GoTrue Auth, PostgREST)    | RLS-native, integrated auth, real-time subscriptions, eliminates custom backend              |
| **Infrastructure** | Vercel (Edge Middleware, Serverless Functions)      | Zero-config scaling, edge network for middleware, instant rollback deployments               |
| **Rate Limiting**  | Upstash Redis (REST) / Supabase PostgreSQL fallback | Stateless REST API works in serverless; no persistent connections required                   |
| **Mapping**        | Leaflet (OpenStreetMap) + Google Maps API (proxied) | Leaflet for custom campus rendering; Google for routing and place search                     |
| **Styling**        | Tailwind CSS, Shadcn UI                             | Utility-first for consistency; Shadcn for accessible, composable components                  |
| **Observability**  | Sentry (Edge + Server + Client)                     | Unified error tracking across all three Next.js runtimes                                     |

---

## 2. Request Lifecycle

Every request follows the same path through the system. There are no exceptions.

```
Client Request
      |
      v
+---------------------+
| Vercel Edge Network  |
+---------------------+
      |
      v
+---------------------+    Static asset?
| Edge Middleware      | ──────────────────> Serve from CDN (bypass all logic)
| (lib/proxy.ts)       |
+---------------------+
      |
      | 1. Inject security headers (CSP nonce, HSTS, X-Frame-Options)
      | 2. Validate CSRF token (double-submit cookie, __Host- prefix)
      | 3. Classify route (public / auth / protected / API)
      | 4. Resolve session (Supabase JWT, 6s deadline)
      | 5. Check email verification status
      | 6. Check MFA assurance level (AAL1 vs AAL2)
      |
      v
+---------------------+
| Route Decision      |
+---------------------+
      |
      |-- Public route ──────> Serve page (no auth required)
      |-- Auth route + user ──> Redirect to /home (already logged in)
      |-- Protected + no user -> Redirect to /login
      |-- API + no auth ──────> 401 Unauthorized
      |-- API + auth timeout ──> 503 Auth Unavailable (retry)
      |-- API + MFA required ──> 403 MFA Required
      |
      v
+---------------------+
| Application Layer   |
| (Server Components  |
|  or API Routes)     |
+---------------------+
      |
      v
+---------------------+
| API Middleware       |   For API routes only:
| (app/api/_lib/       |   - Re-validate session (defense-in-depth)
|  middleware.ts)      |   - CSRF origin check on mutations
+---------------------+   - Rate limiting (distributed, per-endpoint)
      |                    - Zod schema validation
      v
+---------------------+
| Supabase PostgreSQL  |   - RLS enforces tenant isolation at query level
| (Row-Level Security) |   - Triggers enforce data invariants
+---------------------+   - RPCs enforce business logic atomicity
```

### Why This Matters

The edge middleware acts as a single enforcement point. Every request -- page navigation, API call, prefetch -- transits through `lib/proxy.ts`. This eliminates the class of vulnerabilities where a developer adds a new route and forgets to add an auth check. The `isPublicApiPath()` allowlist is a deny-by-default gate: routes must be explicitly opted out of authentication.

---

## 3. Core Components

### 3.1 The Proxy Middleware Auth Gate

**File:** `lib/proxy.ts`

This is the most security-critical file in the codebase. It implements:

- **Route classification.** Routes are categorized as static, public, auth, protected, or API. The classification determines which checks are applied.
- **Session resolution with deadline.** The Supabase JWT is validated with a 6-second timeout in production. If the upstream auth service is slow or unreachable, the proxy makes a conservative decision (redirect to login for pages, 503 for APIs) rather than hanging.
- **Email verification gate.** Users with unverified emails are intercepted at the edge and redirected to `/verify`, preventing incomplete accounts from accessing protected features.
- **MFA enforcement.** Users with enrolled MFA factors who have not completed the second factor are redirected to the MFA challenge page. API routes return 403 with a `MFA_REQUIRED` code.
- **Security header injection.** CSP (with per-request nonce), HSTS (with preload), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy are set on every response.

### 3.2 API Route Protection

**File:** `app/api/_lib/middleware.ts`

API routes use a `requireAuth` wrapper that provides a second layer of defense:

- Re-validates the user session (the edge already validated it, but defense-in-depth means not trusting the previous layer).
- Validates CSRF origin headers on mutation methods (POST, PUT, PATCH, DELETE).
- Applies per-endpoint rate limiting via the distributed rate limiting service.

This double-validation is intentional. The edge middleware operates on JWT claims that may be cached; the API middleware performs a fresh session check against Supabase.

### 3.3 Distributed Rate Limiting

**File:** `lib/services/rateLimitService.ts`

The service uses a sliding-window counter algorithm with pluggable storage backends:

| Backend              | Environment | Trade-off                                              |
| :------------------- | :---------- | :----------------------------------------------------- |
| Upstash Redis (REST) | Production  | Lowest latency, purpose-built for serverless           |
| Vercel KV            | Production  | Alternative to Upstash, same REST protocol             |
| Supabase PostgreSQL  | Production  | Higher latency, but distributed; no additional service |
| In-memory Map        | Development | Fast, but useless across serverless isolates           |

**Fail-closed enforcement.** Security-critical limiters (login, signup, password reset, passkey auth, token verification) are configured with `failClosed: true`. If the store is unreachable, these endpoints reject all requests. This prevents a Redis outage from becoming a brute-force opportunity.

**Preset configurations:**

| Endpoint        | Window     | Max Requests | Fail Mode |
| :-------------- | :--------- | :----------- | :-------- |
| Signup          | 1 hour     | 20           | Closed    |
| Login           | 15 minutes | 50           | Closed    |
| Password reset  | 1 hour     | 10           | Closed    |
| Passkey auth    | 15 minutes | 50           | Closed    |
| General API     | 1 minute   | 200          | Open      |
| Mutations       | 1 minute   | 60           | Open      |
| Bulk operations | 1 minute   | 10           | Open      |

### 3.4 State Management (Zustand Stores)

Client-side state uses Zustand with persistent stores. The key architectural pattern is **optimistic UI with additive server sync**:

1. User performs an action. The store immediately updates the UI with a temporary ID.
2. A POST request is sent to the server.
3. A concurrency guard (`_loadInFlight`) blocks background refresh calls from overwriting the optimistic state.
4. A protected ID map (`_protectedIds`) marks optimistic items as immune to server-sync overwrites.
5. When the server confirms the creation, the temporary ID is replaced with the server ID, and the protection transfers.
6. The merge function is additive: it updates existing items, adds new server items, and preserves protected local items. It never deletes items that the server has not yet acknowledged.

This solves the race condition where a background focus-triggered refresh overwrites a just-created item before the POST completes.

### 3.5 Database Architecture

**Row-Level Security (RLS)** is enabled on every table. Policies enforce `auth.uid()` matching at the query execution level, independent of application logic.

**Key database patterns:**

- **Signup trigger (`on_auth_user_created`).** A PostgreSQL trigger creates a `public.profiles` row within the same transaction as the `auth.users` insert, guaranteeing atomicity. No orphaned auth records can exist.
- **Gamification RPC (`award_xp`).** Defined as `SECURITY DEFINER` with caller validation (`auth.uid()` must match target), preventing client-side XP tampering.
- **Audit logging (`log_audit`).** Records actor, action, old/new data, IP, and User Agent for all sensitive mutations. Data payloads are sanitized; IP addresses are stored for forensic capability.

---

## 4. Authentication Architecture

The system supports multiple authentication methods, layered for both security and usability:

| Method           | Implementation                     | Use Case                                       |
| :--------------- | :--------------------------------- | :--------------------------------------------- |
| Email + Password | Supabase GoTrue                    | Default signup/login                           |
| FIDO2 WebAuthn   | Passkeys (platform authenticators) | Passwordless biometric login (FaceID, TouchID) |
| TOTP MFA         | Authenticator app (Google Auth)    | Second factor for password-based login         |
| SMS MFA          | Phone-based OTP                    | Fallback second factor                         |

**WebAuthn scope decision.** `authenticatorAttachment` is set to `'platform'` only. This restricts passkeys to the device's built-in biometric (no roaming YubiKeys). The trade-off: reduced hardware compatibility in exchange for a zero-friction login flow that students will actually adopt on mobile devices.

**Session lifecycle.** Sessions are managed via Supabase JWTs stored in HttpOnly cookies. The edge middleware validates tokens on every request. Password resets trigger global session invalidation. MFA enrollment upgrades the required assurance level from AAL1 to AAL2.

---

## 5. Campus Navigation Architecture

The map system (`features/map/`) replaces standard embedded maps with a custom Leaflet implementation optimized for campus boundaries.

**Client architecture:**

- `GoogleMapController` -- orchestrates map state and user interactions.
- `GoogleMapCanvas` -- renders the Leaflet map with campus-specific tile layers.
- `GoogleRoutePanel` -- displays turn-by-turn navigation powered by Google Routes API.

**Heading fusion.** The `useMapLocation` hook fuses GPS heading (high velocity), movement-derived vectors (walking speed), and DeviceOrientation compass data (stationary) to produce a stable directional indicator. Outlier rejection discards GPS samples with improbable coordinate jumps.

**API proxy pattern.** Google Maps API calls are proxied through server-side routes (`/api/maps/routes`, `/api/maps/place-search`, `/api/maps/place-details`). This keeps API keys server-side, enables rate limiting, and allows origin validation. These routes are listed in `isPublicApiPath()` to serve unauthenticated campus map views.

---

## 6. Serverless Scaling Considerations

| Concern               | Solution                                                                                      |
| :-------------------- | :-------------------------------------------------------------------------------------------- |
| **Cold starts**       | Server Components pre-render static shells; client hydration is minimal                       |
| **Edge timeouts**     | Fail-fast fetch wrapper (15s), auth deadline (6s), MFA deadline (2.5s)                        |
| **State isolation**   | No in-memory state in production; rate limiting and sessions use external stores              |
| **Connection limits** | Upstash Redis REST API (no persistent connections); Supabase connection pooling via PostgREST |
| **Cost under abuse**  | Edge middleware rejects unauthorized traffic before serverless function invocation            |

---

## Further Reading

- [Technical Explanation](../../TECHNICAL_EXPLANATION.md) -- Deep-dive into engineering decisions, trade-offs, and the rationale behind each architectural choice.
- [Security Posture Report](../security/SECURITY_POSTURE.md) -- Complete catalogue of implemented security controls with STRIDE threat model.
- [Route Inventory](../inventory/ROUTE_INVENTORY.md) -- Mapping of the Next.js App Router structure.
