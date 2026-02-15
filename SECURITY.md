# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.0.x   | ✅ Yes    |
| < 1.0   | ❌ No     |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately via GitHub Security Advisories or by contacting the maintainers directly. **Do not create public issues for security vulnerabilities.**

## Security Architecture

Syllabus Sync implements a multi-layered security model:

### 1. Request Validation

- **Global Security Middleware**: A root-level `middleware.ts` enforces security headers across the entire application, including HSTS, X-Frame-Options, and CSP.
- **CSRF/Origin Validation**: Origin validation is enabled on mutation routes that use shared API middleware. Some authentication and integration flows rely on explicit route-level controls to preserve Supabase compatibility.
- **Schema Validation & XSS Prevention**: All API inputs are strictly validated using `zod`. Text fields are refined to reject common XSS vectors (e.g., `<script>`, `<html>`) at the schema level.
- **Body Size Limits**: JSON payloads are restricted to 100KB (and 10KB for auth) to prevent DoS attacks.
- **Open Redirect Prevention**: Login redirect URLs are validated against a whitelist of allowed paths and dangerous schemes are blocked.

### 2. Infrastructure Security

- **Rate Limiting**: Distributed rate limiting using Upstash Redis (production) or in-memory (development). Limits are applied per IP and per user. Rate limiting uses `VERCEL_ENV` for reliable production detection.
- **HSTS**: Strict Transport Security enforced via global middleware with a 1-year max-age.
- **CSP (Content Security Policy)**: Strict policy enforced globally. Inline scripts for theme and RTL are validated using pre-computed SHA-256 hashes, eliminating the need for `'unsafe-inline'`.
- **Enumeration Prevention**: Authentication endpoints (Signup/Signin) return generic success/error messages to prevent user account enumeration.
- **X-Powered-By Disabled**: Server technology identification is disabled to reduce attack surface.
- **API Key Proxying**: Third-party API keys (e.g., OpenWeather) are proxied through server-side endpoints, never exposed to clients.

### 3. Database Security

- **RLS (Row Level Security)**: PostgreSQL policies ensure users can only `SELECT`, `INSERT`, `UPDATE`, or `DELETE` their own data.
- **Service Role Isolation**: High-privilege operations are restricted to server-side routes using the Supabase Service Role Key.
- **Error Message Sanitization**: Database error details are only exposed in development, never in production.

### 4. Code Quality

- **Secrets Scanning**: CI runs repository secret-pattern scanning before build/deploy stages.
- **Dependency Audits**: Regular `npm audit` and version pinning.
- **CI Security Checks**: Production security validation runs in CI/CD pipeline before deployment.

### 5. Production Detection

The application uses `VERCEL_ENV` for reliable production environment detection:

```typescript
const isRealProduction =
  process.env.VERCEL_ENV === 'production' ||
  (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV);
```

This ensures security features (CSRF, rate limiting, dev bypasses) cannot be circumvented by manipulating `NODE_ENV` locally.

## Required Environment Variables for Production

| Variable                        | Required | Purpose                      |
| ------------------------------- | -------- | ---------------------------- |
| `UPSTASH_REDIS_REST_URL`        | Yes      | Distributed rate limiting    |
| `UPSTASH_REDIS_REST_TOKEN`      | Yes      | Distributed rate limiting    |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | Database connection          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Client-side database access  |
| `SUPABASE_SERVICE_ROLE_KEY`     | Yes      | Server-side admin operations |
| `OPENWEATHER_API_KEY`           | Optional | Weather functionality        |

## Development vs Production

| Feature                    | Development                      | Production                  |
| -------------------------- | -------------------------------- | --------------------------- |
| Dev email bypass           | Enabled (with DEV_BYPASS_EMAILS) | **Always disabled**         |
| Origin/CSRF route controls | Applied by middleware/route      | Applied by middleware/route |
| Rate limiting              | In-memory (fallback)             | **Requires Redis**          |
| Error details              | Exposed                          | **Hidden**                  |
| Database errors            | Detailed                         | **Generic message only**    |
