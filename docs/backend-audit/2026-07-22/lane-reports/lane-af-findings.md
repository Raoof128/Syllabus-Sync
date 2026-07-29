# Lane A + Lane F Findings — Request Policy / Middleware & CSRF/CSP/IP/Rate-Limits

Target: `/Users/raoof.r12/Desktop/Raouf/MQ_Research/Syllabus-Sync-backend-audit`
Stack: Next.js App Router on Cloudflare Workers (OpenNext), Supabase Auth. **Live in production.**

Scope reviewed: `middleware.ts`, `lib/middleware.ts`, `lib/supabase/middleware.ts`, `lib/supabase/fetch.ts`,
`app/api/_lib/middleware.ts`, `lib/platform/runtime.ts`, all 21 files in `lib/security/**`, plus representative
callers (`app/calendar/page.tsx`, `app/home/page.tsx`, `app/api/auth/mfa/*`, `app/api/auth/password/route.ts`,
`lib/utils/security.ts`, `lib/services/rateLimitService.ts`, `lib/utils/rate-limit.ts`, `next.config.ts`).

Severity key: **P0** trivially exploitable auth bypass/data exposure · **P1** high-impact exploitable ·
**P2** material weakness with concrete reachability · **P3** low impact / hardening.

---

## Summary table

| # | Severity | Area | One-line |
|---|----------|------|----------|
| 1 | P1 | Lane A | Protected page routes are served (not redirected) when Supabase `auth.getUser()` times out or errors — fails **open** |
| 2 | P1 | Lane A | MFA/AAL "unknown" (timeout) is silently treated as "no upgrade needed" on page routes — fails **open** (API routes correctly fail closed) |
| 3 | P2 | Lane A | If Supabase env config is invalid, **all** protected API routes bypass auth entirely (page routes correctly fail closed) |
| 4 | P2 | Lane F | `session-termination.ts` (kills other sessions on password change) is dead code — password change does **not** revoke other sessions |
| 5 | P2 | Lane A | The `/api/auth/*` public-API allowlist decentralizes auth+AAL2 enforcement to each handler; verified current handlers are correct, but the pattern is a footgun |
| 6 | P3 | Lane A | Most `NextResponse.redirect()` calls in middleware skip `setSecurityHeaders()` (CSP/nonce missing on redirects) |
| 7 | P3 | Lane F | Client IP extraction falls back to attacker-controllable `x-real-ip` when the trusted per-platform header is absent |
| 8 | P3 | Lane F | `isValidRedirect()` uses `string.startsWith(origin)` instead of proper origin parsing (no working bypass found; whitelist backstops it) |
| 9 | P3 | Lane F | 8 of 21 `lib/security/**` files are unwired dead code, creating false confidence (2FA backup codes, IP anomaly detection, device fingerprinting, request signing, SRI, session termination) |
| 10 | P3 | Cloudflare | Module-scope mutable globals persist across requests in a reused isolate: log-throttle timestamps, singleton rate-limit store, an isolate-local (non-distributed) nonce replay store, and a password-hash breach cache |
| 11 | P3 | Lane A | Middleware's 6s auth race doesn't cancel the underlying Supabase fetch; the 15s `fetchWithTimeout` keeps running detached after the response is sent |
| 12 | P3 | Lane F | `setCSRFCookie` gates the `Secure` attribute on raw `process.env.NODE_ENV` instead of the shared `isProductionDeployment()` helper used everywhere else |
| 13 | P3 | Lane F | CSRF exempt/trusted-origin lists reference `/api/webhooks` and `https://maps.googleapis.com` that have no live receiving route/mechanism — inert now, footgun later |

**Direct answer: does any auth/MFA path fail open? Yes** — two distinct paths (page-route auth resolution, and page-route MFA/AAL resolution) fail open when the corresponding Supabase call is slow/errors. The **API route layer correctly fails closed** for the same conditions (503 `AUTH_UNAVAILABLE`), so no protected *data* is exposed via these two findings, but the *page shell/route gating* itself is bypassed — a real, reproducible control gap. See #1 and #2.

---

## Lane A — Request policy / middleware

### 1. [P1] Protected page routes fail open on auth-resolution timeout/error

**File/line:** `lib/middleware.ts:204-260`, `lib/middleware.ts:315-322`

```ts
// line 204
const PROXY_AUTH_DEADLINE_MS = process.env.NODE_ENV === 'development' ? 12_000 : 6_000;
...
const result = await Promise.race([authPromise, timeoutPromise]);
if (result && 'data' in result) { authResolution = 'resolved'; ... }
else { /* timed out */ }
...
// line 315
if (isProtectedRoute && !user && !publicRoutes.some((route) => path.startsWith(route))) {
  if (authResolution === 'unknown') {
    return response;               // <-- serves the protected page, no redirect
  }
  const redirectUrl = new URL('/login', request.url);
  ...
}
```

**Root cause:** `supabase.auth.getUser()` is raced against a 6s (prod) timeout. If the timeout wins, or the call throws something not classified as a transient/refresh-token error, `authResolution` stays `'unknown'` and `user` stays `null`. The subsequent gate explicitly special-cases `authResolution === 'unknown'` to **let the request through** rather than redirect to `/login`. This is the *only* branch in the whole function that treats "we don't know if you're authenticated" as "let them in."

**Why it matters:** Route pages such as `app/calendar/page.tsx` (verified: no server-side auth check at all — it renders `CalendarClient` unconditionally) and `app/home/page.tsx` (swallows its own auth check in a `try/catch` — `// Fall back to client-side auth`) have **no independent server-side gate**. The root middleware is the sole enforcement point for those routes. When it fails open, the full page shell/JS bundle for a protected route is served to an unauthenticated visitor.

**Failure scenario:** Any condition that slows or errors Supabase's `/auth/v1/user` call for ≥6s — a Supabase incident, an edge-region cold start, network jitter between the Worker and Supabase — causes every unauthenticated visitor hitting a protected route during that window to receive the protected page instead of a login redirect. This is not purely theoretical on Cloudflare Workers: cold-start TLS handshake + upstream latency can plausibly exceed 6s under load.

**Blast-radius note:** Actual protected *data* is not exposed by this alone, because `CalendarClient`/`HomeClient` fetch their data through API routes, and the API-route layer of this same file correctly fails closed (`isApiRoute && !isPublicApi && !user && authResolution === 'unknown'` → 503, line 349-356). So this is a route-gating bypass, not a direct data leak — but it is still a genuine, reproducible authorization control failure and a bad precedent (the one asymmetric "fail open" branch in an otherwise fail-closed function).

**Minimal fix:** Treat `authResolution === 'unknown'` the same as "not authenticated" for protected page routes — redirect to `/login` (optionally with a distinct `?reason=auth_unavailable` so the login page can show a retry message) instead of returning `response`.

---

### 2. [P1] MFA/AAL "unknown" fails open on protected page routes (asymmetric vs. API routes)

**File/line:** `lib/middleware.ts:274-297` (AAL resolution), `lib/middleware.ts:324-329` (protected-page gate), contrast with `lib/middleware.ts:331-338` (API-route gate)

```ts
// line 274
let requiresMfaUpgrade = false;
let mfaResolution: 'resolved' | 'unknown' = 'unknown';
if (user && (isProtectedRoute || isAuthRoute || (isApiRoute && !isPublicApi))) {
  const MFA_AAL_DEADLINE_MS = process.env.NODE_ENV === 'development' ? 4000 : 2500;
  try {
    const result = await Promise.race([aalPromise, timeoutPromise]);
    if (result && 'data' in result) {
      mfaResolution = 'resolved';
      requiresMfaUpgrade = aal?.nextLevel === 'aal2' && aal?.currentLevel === 'aal1';
    }
  } catch (err) { logger.warn('...MFA status unknown', ...); }
}
...
// line 324 — PAGE route gate: only checks requiresMfaUpgrade, never checks mfaResolution
if (isProtectedRoute && user && requiresMfaUpgrade) {
  return redirect to /login?mfa=1 ...
}
...
// line 331 — API route gate: explicitly checks mfaResolution === 'unknown' and fails closed
if (isApiRoute && !isPublicApi && user && mfaResolution === 'unknown') {
  return 503 AUTH_UNAVAILABLE;
}
```

**Root cause:** `requiresMfaUpgrade` is initialized to `false` and is only ever set `true` inside the `mfaResolution === 'resolved'` branch. When the AAL check times out (2.5s in prod) or throws, `mfaResolution` stays `'unknown'` and `requiresMfaUpgrade` stays `false` — its default, non-upgraded value. The protected-page gate at line 324 only inspects `requiresMfaUpgrade`; it has no equivalent of the API-route gate's explicit `mfaResolution === 'unknown'` check. So an aal1-only session that genuinely needs aal2 sails through to the protected page whenever the AAL check is slow, while the exact same condition on an API route correctly returns 503.

**Why it matters:** This is precisely the "unknown must fail closed" requirement called out in the audit brief, and the codebase gets it right for API routes but wrong for page routes — a clear, checkable inconsistency, not a judgment call.

**Failure scenario:** A session holder who has enrolled MFA but is only at aal1 (e.g., a stolen/replayed session cookie captured before the user completed their second factor, or a user who never finished their aal2 challenge) reaches a protected page without ever being redirected to the MFA step, whenever the AAL check is slow. As with #1, downstream API calls made from that page still correctly gate on MFA (line 340: `isApiRoute && !isPublicApi && user && requiresMfaUpgrade` → 403), so this is a route-gating/UX bypass rather than a direct data leak, but it is a real, named violation of the stated security invariant.

**Minimal fix:** Mirror the API-route pattern on the page-route gate: `if (isProtectedRoute && user && (requiresMfaUpgrade || mfaResolution === 'unknown')) { redirect to /login?mfa=1 }`.

---

### 3. [P2] All protected API routes bypass auth entirely if Supabase env config resolves invalid

**File/line:** `lib/middleware.ts:149-173`

```ts
const hasValidUrl = supabaseUrl && supabaseUrl.includes('supabase.co') && !supabaseUrl.includes('your-project-id');
const hasValidKey = supabaseAnonKey && (supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.startsWith('sb_')) && ...;

if (!hasValidUrl || !hasValidKey) {
  ...
  if (isProtectedRoute) {
    return NextResponse.redirect(...);   // fail CLOSED for page routes
  }
  return response;                       // <-- fail OPEN for everything else, incl. protected API routes
}
```

**Root cause:** The "Supabase not configured" guard only special-cases `isProtectedRoute` (page routes). For an API route requiring auth (`isApiRoute && !isPublicApi`), the function falls through to `return response` with **no** 401/503 and **no** auth check at all — the entire auth/MFA gate below this block (lines 175-365) is never reached because `!hasValidUrl || !hasValidKey` returns early.

**Why it matters:** This requires an operational precondition (a bad Supabase URL/anon key at runtime) that shouldn't happen in stable production, but if it does — e.g. during a botched secret rotation, a truncated Wrangler secret, or a wrong-environment deploy — the failure mode for API routes is "silently disable all auth" rather than "fail closed like the page-route branch two lines above it already does."

**Minimal fix:** Apply the same fail-closed treatment used for `isProtectedRoute` to `isApiRoute && !isPublicApi` in this block (return 401/503 `AUTH_UNAVAILABLE` with `setSecurityHeaders()`), instead of `return response`.

---

### 4. [P2] `/api/auth/*` is entirely exempt from middleware's auth+MFA gate

**File/line:** `lib/middleware.ts:41-52` (`isPublicApiPath`), contrast `lib/security/csrf.ts:243-250` (`CSRF_EXEMPT_PREFIXES`, which only exempts `/api/auth/callback` and `/api/auth/confirm`, not the whole prefix)

```ts
function isPublicApiPath(path: string): boolean {
  return (
    path.startsWith('/api/auth/') ||   // <-- entire prefix, not just signin/signup/callback
    ...
  );
}
```

**Root cause:** Every route under `/api/auth/` (which includes `mfa/enroll`, `mfa/unenroll`, `mfa/verify`, `password`, `sessions`, `user`, `biometric`, `passkey`, `onboarding` — 12 sub-trees) is classified as public, so the middleware never resolves the user or checks AAL for these paths. CSRF protection is still correctly applied (the CSRF exempt list is narrower and correctly scoped to `callback`/`confirm`), but the auth/MFA boundary is fully delegated to each individual route handler.

**Verification performed:** I spot-checked `app/api/auth/mfa/enroll/route.ts` and `app/api/auth/mfa/unenroll/route.ts` and `app/api/auth/password/route.ts` — all three correctly call `supabase.auth.getUser()` themselves, and `mfa/unenroll` additionally re-verifies `aal.currentLevel === 'aal2'` before allowing an MFA factor to be removed, explicitly failing closed on error ("SECURITY: Fail closed if we cannot determine AAL/factors"). **These specific routes are implemented correctly.**

**Why it's still a finding:** The security boundary here is not centrally enforced — it's a convention that every future route added under `/api/auth/*` must remember to independently authenticate and, where relevant, re-check AAL2. A single route added without that check would silently run with no auth at all, and nothing in the middleware would catch it. Given the middleware already has all the machinery to enforce this centrally for every other path prefix, this is an avoidable structural risk.

**Minimal fix:** Narrow `isPublicApiPath`'s auth-prefix exemption to the specific pre-auth endpoints that truly need it (`/api/auth/signin`, `/api/auth/signup`, `/api/auth/callback`, `/api/auth/confirm`, `/api/auth/password/request-reset`, `/api/auth/password/reset`, MFA challenge/verify endpoints that are legitimately reachable at aal1), rather than the whole `/api/auth/` tree.

---

### 5. [P3] Inconsistent security headers on redirect/error responses

**File/line:** `lib/middleware.ts` — compare the following:

- Has `setSecurityHeaders(...)`: line 269 (verify-email redirect), lines 332-336 (`AUTH_UNAVAILABLE` 503), lines 341-346 (`MFA_REQUIRED` 403), line 354 (`AUTH_UNAVAILABLE` 503), line 363 (`UNAUTHORIZED` 401).
- **Missing** `setSecurityHeaders(...)`: line 170 (`/login` redirect when Supabase misconfigured), line 308 (`/login?mfa=1` redirect from an auth route), line 311 (`/home` redirect from an auth route), line 321 (`/login?redirectTo=` redirect for unauthenticated protected-route access), line 328 (`/login?mfa=1&redirectTo=` redirect for MFA upgrade).

**Root cause:** `setSecurityHeaders()` (CSP + `x-nonce`) is applied ad hoc per branch instead of once at a single choke point before any `return`. Roughly half of the redirect branches were never updated to call it.

**Impact:** Real-world impact is low — these are 3xx responses with empty/negligible bodies, and the base headers (`X-Frame-Options`, HSTS, `X-Content-Type-Options`, etc.) are applied separately and unconditionally by `config/next/next.config.ts:99-129` (`headers()` matches `/(.*)`) regardless of middleware. The gap is specifically the CSP/nonce header, which has no attacker-controllable content to protect on an empty redirect body. Flagging per the audit's explicit ask and because it's an easy, cheap fix that removes an inconsistency an auditor would otherwise have to keep re-verifying.

**Minimal fix:** Wrap every `NextResponse.redirect()` construction in the middleware through one helper, e.g. `const withHeaders = (res: NextResponse) => { setSecurityHeaders(res.headers); return res; }`, and route every early return through it.

---

### 6. [P3] Detached upstream fetch after the 6s auth race times out

**File/line:** `lib/middleware.ts:208-214`, `lib/supabase/fetch.ts:36-54`

The middleware races `supabase.auth.getUser()` against a 6s timer using `Promise.race`. If the timer wins, the function moves on — but the underlying `fetchWithTimeout()` call (own timeout: 15s prod, `lib/supabase/fetch.ts:7-8`) is not aborted; nothing in the race cancels it. The real Supabase fetch keeps running for up to 15s after the middleware has already returned a response. In a reused Cloudflare Worker isolate this is orphaned work that doesn't affect the current response but consumes isolate CPU/IO budget and can pile up under sustained Supabase latency. Not independently exploitable, but worth fixing alongside #1 (which is triggered by the same condition) — abort the `AbortController` tied to that fetch when the race's timeout branch is taken.

---

## Lane F — CSRF / CSP / IP / rate limits

### 7. [P3] IP extraction has a client-controllable fallback header

**File/line:** `lib/security/ip.ts:110-128`

```ts
if (production) {
  if (platform === "cloudflare") {
    const cloudflareIp = headers.get("cf-connecting-ip");
    if (cloudflareIp && isValidIP(cloudflareIp)) return cloudflareIp;
  }
  if (platform === "vercel") { ... }

  const realIp = headers.get("x-real-ip");     // <-- runs for ANY platform, including 'cloudflare' and 'unknown'
  if (realIp && isValidIP(realIp)) return realIp;

  if (platform === "vercel" || trustForwardedFor) { ... }
}
```

**Root cause:** `x-real-ip` is checked unconditionally after the platform-specific branches, regardless of platform. `x-real-ip` is not a header Cloudflare or Vercel authenticate/overwrite for this app (it's conventionally set by a reverse proxy like nginx, which isn't in this stack) — if it's ever present on an inbound request, it is client-supplied and trusted verbatim. Additionally, `getDeploymentPlatform()` (`lib/platform/runtime.ts:38-49`) determines the platform from `env.DEPLOYMENT_PLATFORM`, and if that variable were ever unset/misconfigured in production, `platform` resolves to `'unknown'` and the `cf-connecting-ip` branch is skipped entirely, leaving `x-real-ip` as the primary (spoofable) source.

**Current live risk: low.** I verified `wrangler.jsonc:39,60` sets `"DEPLOYMENT_PLATFORM": "cloudflare"` for the deployed Worker, and Cloudflare's edge always sets/overwrites `cf-connecting-ip` for genuine edge traffic (a client cannot make this header absent). So under the current, correctly configured deployment, the `x-real-ip` fallback path is not reachable by an external client. I'm flagging this as a hardening item, not a live bypass.

**Minimal fix:** When `platform === 'cloudflare'`, don't fall through to `x-real-ip` at all — either return `'unknown'` (the existing fail-safe) if `cf-connecting-ip` is absent, or add an explicit assertion/alert, since a missing `cf-connecting-ip` on a Cloudflare deployment is itself an anomaly worth surfacing rather than silently trusting a client header.

---

### 8. [P3] `isValidRedirect` uses string-prefix matching instead of origin parsing

**File/line:** `lib/utils/security.ts:19-35`

```ts
const isBaseUrl = url.startsWith(APP_CONFIG.url);       // string prefix, not origin equality
...
const path = url.split('?')[0].replace(APP_CONFIG.url, '');
return SAFE_REDIRECT_PATHS.some((safePath) => path.startsWith(safePath));
```

**Root cause:** `startsWith(APP_CONFIG.url)` treats `https://syllabus-sync.example.com.evil.com/...` as matching `https://syllabus-sync.example.com`, since JS string prefix matching doesn't respect domain boundaries (classic `startsWith`-based origin-check anti-pattern).

**Verification performed:** I attempted to construct a bypass. The function requires the *remainder* after stripping the `APP_CONFIG.url` prefix to itself start with one of `SAFE_REDIRECT_PATHS` (`/home`, `/dashboard`, etc.). Every attacker-domain construction I tried (`...example.com.evil.com/home`, `...example.com@evil.com/home`, `...example.com/home@evil.com`) either fails the whitelist step (remainder doesn't start with a safe path) or, when it does pass, resolves to a same-origin path (browsers parse `@`/extra path segments as part of the path/host of the *original* origin, not a redirect elsewhere). **I did not find a working open-redirect bypass** — the whitelist in step 3 backstops the weak check in step 1/2. Also confirmed the one place I found `redirectTo` reaching `window.location.href` directly (`app/login/LoginClient.tsx:81,162,169,208,513`) is a hardcoded `'/home'` constant, not attacker-controlled.

**Why still worth fixing:** The check is fragile — any future relaxation of `SAFE_REDIRECT_PATHS` (e.g., adding a very short/generic entry) or any code path that uses `isValidRedirect` without the whitelist re-check could reopen this. Replace with proper parsing: `try { new URL(url, APP_CONFIG.url).origin === APP_CONFIG.url } catch { false }`.

---

### 9. [P3] 8 of 21 `lib/security/**` modules are unwired dead code

**Evidence:** grep for each module's exported handlers across `app/**` found **zero** call sites for:
- `lib/security/device-fingerprinting.ts`
- `lib/security/ip-anomaly-detection.ts`
- `lib/security/sri.ts`, `lib/security/sri-enhanced.ts`
- `lib/security/request-signing.ts`
- `lib/security/two-factor-backup-codes.ts`
- `lib/security/session-termination.ts`
- `lib/supabase/middleware.ts` (`createClient`/`updateSession`/`getAuthenticatedUser` — superseded by the inline client in `lib/middleware.ts`)

All of these are re-exported through the `lib/security/index.ts` barrel file (giving the *impression* they're part of the active security posture) but have no corresponding API route. Confirmed there is no `app/api/security/backup-codes/*`, no `app/api/security/sessions/*`, and nothing importing `verifySignature`/`withSignatureVerification`. `lib/security/csp.ts` additionally exports `buildProdCSP()`/`buildDevCSP()`/`buildCSP()` with `script-src 'self' 'unsafe-inline' ...` (only `buildNonceCSP()` is actually used by `lib/middleware.ts:124`) — dead code that contradicts the nonce-based policy actually enforced in production and could be wired in by mistake later.

**Concrete consequence (see finding #4 above):** because `session-termination.ts` is dead, `app/api/auth/password/route.ts` (verified, lines 71-84) changes the password via `supabase.auth.updateUser()` and returns success **without revoking any other active session/refresh token**. If an attacker has a stolen session (via device theft, token leak, etc.), a legitimate password change by the victim does not evict the attacker — despite the codebase containing a purpose-built module (`terminateAllOtherSessions`/`handlePasswordChange`) whose docstring explicitly claims "prevents session hijacking after password changes." This is a real gap between documented intent and actual behavior.

**Minimal fix:** Either wire `handlePasswordChange`/`terminateAllOtherSessions` into `app/api/auth/password/route.ts` after a successful `updateUser()` call (Supabase Admin API: `supabase.auth.admin.signOut(userId, 'others')`/refresh-token revocation, or the custom `user_sessions` table logic already written), or remove the dead modules and note the gap in `SECURITY.md` if session revocation-on-password-change is intentionally out of scope for now. Also delete/gate the unused `buildProdCSP`/`buildDevCSP`/`buildCSP` exports so a future CSP change can't silently pick the weaker policy.

---

### 10. [P3] Cloudflare isolate-scoped mutable module-scope state

Per the audit's explicit Cloudflare-specific ask, module-scope `let`/`Map`/`Set` values that persist across requests in a reused Worker isolate:

| Location | State | Assessment |
|---|---|---|
| `lib/middleware.ts:8` / `app/api/_lib/middleware.ts:14` | `let lastTransientProxyAuthLogAt` / `lastTransientAuthLogAt` | Benign — only throttles a `console.warn`, but is unsynchronized shared mutable state read/written by concurrent requests on the same isolate (harmless race, just occasionally over/under-logs). |
| `lib/services/rateLimitService.ts:294-295` | `let storeInstance`, `let memoryOverrideWarningShown` | Intentional singleton caching (avoids re-resolving the backend/env on every call). Not a bug — flagged only because it's exactly the kind of state the audit asked to surface. |
| `lib/security/request-signing.ts:436` | `const nonceStore = new Map<string, number>()` | **Dead code today** (see #9), but if this module is ever wired up for replay protection, an isolate-local `Map` provides **no real distributed replay protection** — a Worker can spin up many isolates, each with its own empty `nonceStore`, so a replayed signed request routed to a different isolate would not be recognized as a replay. The module's own comment acknowledges this ("In production, use Redis or database") but the code was never updated. |
| `lib/security/password-breach.ts:55-58` | `const breachCache = new Map<string, {...}>()` | **Live code** (used by `app/api/security/check-password-breach`). Caches the SHA-1 hash of every checked password for up to 24h (or until 1000 entries force a sweep), shared across all users whose requests land on the same isolate. Not the plaintext password, but it is password-derived material retained well past the request lifecycle — a data-minimization concern rather than a direct exploit path (would require a separate memory-disclosure primitive to read isolate memory). |

**Minimal fix:** No urgent action required given #9 makes the nonce-store risk currently inert. If request signing is ever activated, back `isNonceUsed` with the same distributed store used for rate limiting (Upstash/KV/Postgres) before relying on it for replay protection. Consider shrinking `breachCache`'s TTL/size or keying it in a way that doesn't retain hashes past the single request.

---

### 11. [P3] `setCSRFCookie` uses raw `NODE_ENV` instead of the shared platform helper

**File/line:** `lib/security/csrf.ts:342-352`

```ts
export function setCSRFCookie(response: NextResponse, token?: string): void {
  ...
  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",   // <-- raw NODE_ENV, not isProductionDeployment()
    sameSite: "strict",
    maxAge: CSRF_TOKEN_MAX_AGE,
    path: "/",
  });
}
```

The cookie name is `__Host-csrf`, which per the `__Host-` prefix spec **requires** `Secure` (plus `Path=/` and no `Domain` attribute, both satisfied here). Every other production-detection point in this codebase (`withCSRFProtection` two lines above in the same file, `getClientIPFromHeaders`, `getStore()`) uses the shared `isProductionDeployment()` helper from `lib/platform/runtime.ts`, which checks `DEPLOYMENT_ENV`/`VERCEL_ENV`/`NODE_ENV` with fallbacks. This one function instead checks the raw `process.env.NODE_ENV === "production"` string.

**Impact:** Low today — Next.js production builds reliably bake `NODE_ENV=production` into the compiled output, so this should be true in the actual deployed Worker regardless of Wrangler env vars. But it's an inconsistency: if `NODE_ENV` is ever not exactly `"production"` while the app is still serving real traffic (e.g., a preview/staging deploy on the production domain), the `__Host-csrf` cookie would be set without `Secure`, which browsers **silently refuse to store** for a `__Host-`-prefixed name — breaking the double-submit-cookie check for the two routes that actually rely on it (`app/api/gamification/route.ts`, `app/api/gamification/award-xp/route.ts` — confirmed via grep as the only two callers of `withCSRFProtection`/`validateCSRFToken`).

**Minimal fix:** `secure: isProductionDeployment()` for consistency with the rest of the codebase.

---

### 12. [P3] CSRF/allowlist entries reference paths and origins with no live counterpart

- `lib/security/csrf.ts:249` (`CSRF_EXEMPT_PREFIXES`) includes `/api/webhooks`, but `lib/middleware.ts:41-52` (`isPublicApiPath`) does **not** include `/api/webhooks`, and no `app/api/webhooks/*` route exists today (confirmed). If a webhook route (e.g., Stripe) is added later under that path without also updating `isPublicApiPath`, it will be CSRF-exempt but still blocked by the auth-required gate (`401 Unauthorized` before the handler's own signature verification ever runs) — a footgun for the next integration.
- `lib/security/csrf.ts:267` (`getTrustedOrigins()`) adds `https://maps.googleapis.com` as a CSRF-trusted origin for inbound POSTs. There is no mechanism by which a browser would ever send `Origin: https://maps.googleapis.com` on a request to this app (Origin reflects the *page's* origin, not a resource it loads), so this entry is currently inert. It doesn't create a live bypass, but it's an unnecessary widening of the trust set that should be removed or documented.

---

## What was checked and found sound (no finding)

- **CSRF token comparison** (`lib/security/csrf.ts:55-64`, `secureCompare`) and the request-signing HMAC comparison (`lib/security/request-signing.ts:283-294`, `constantTimeCompare`) are both proper length-check-then-XOR-accumulate constant-time comparisons. No timing-attack-vulnerable `===`/`.equals()` comparison of secrets was found anywhere in scope (token/password-reset/email-verify flows all compare **hashes via DB-side `.eq()`**, not JS string equality, which is a reasonable and common pattern).
- **Distributed rate limiter** (`lib/services/rateLimitService.ts`) correctly probes Upstash Redis → Vercel/Upstash-compatible KV → Supabase Postgres RPC before ever falling back to an in-memory store, and explicitly **fails closed** (`allowed: false`) for any limiter configured `failClosed: true` (login, signup, password reset, MFA verify/enroll/unenroll, passkey auth, email/password reset token consumption) when running in production with only a memory store, unless an explicit `ALLOW_MEMORY_RATE_LIMIT=true` override is set. This matches the audit's "does it silently fall back to in-memory" concern — it does not, for the endpoints that matter.
- **`__Host-` cookie prefix mechanics** are otherwise correct: `path: "/"`, no `Domain` set, `sameSite: "strict"`.
- **Origin/Host spoofing:** `validateCSRF()` (`lib/security/csrf.ts:297-333`) and `validateOrigin()` compare `new URL(origin).host === host` (strict equality, not substring/includes), correctly rejecting `Origin` values that merely contain the expected host as a substring. `X-Forwarded-*` headers are not used anywhere for trust decisions in the CSRF path — only `Origin`/`Referer`/`Host`.
- **MFA enforcement design at the API layer** (as opposed to the page layer covered in finding #2) correctly fails closed on unknown AAL (`503`) and correctly forbids on required-but-not-completed upgrade (`403`).
- **CSP** actually served in production (`buildNonceCSP`, `lib/security/csp.ts:46-98`, wired via `lib/middleware.ts:124`) has no `unsafe-eval` in production and no `unsafe-inline` for `script-src` (nonce-based); `style-src 'unsafe-inline'` is present but documented and low-risk relative to script injection.

---

## Minimal-fix checklist (priority order)

1. `lib/middleware.ts:315-322` — redirect (don't pass through) when `authResolution === 'unknown'` for protected page routes.
2. `lib/middleware.ts:324-329` — also redirect when `mfaResolution === 'unknown'` for protected page routes (mirror the API-route gate at line 331).
3. `lib/middleware.ts:172` — fail closed (401/503) instead of `return response` for `isApiRoute && !isPublicApi` when Supabase env config is invalid.
4. Wire `terminateAllOtherSessions`/session revocation into `app/api/auth/password/route.ts` after a successful password change, or explicitly document the gap.
5. Narrow `isPublicApiPath`'s `/api/auth/` exemption to the specific pre-auth routes that need it.
6. Route all middleware redirects through a single header-setting helper.
7. `lib/security/csrf.ts:347` — use `isProductionDeployment()` instead of raw `NODE_ENV`.
8. `lib/utils/security.ts:26` — replace `startsWith` origin check with `new URL(...).origin` equality.
9. Remove or clearly quarantine the 8 dead `lib/security/**` modules (or wire them up) so the module list reflects what's actually protecting production.
