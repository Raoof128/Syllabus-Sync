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
- **CSRF Protection**: All mutation endpoints (POST/PUT/DELETE) validate the `Origin` header against an allowlist of trusted domains via middleware.
- **Schema Validation & XSS Prevention**: All API inputs are strictly validated using `zod`. Text fields are refined to reject common XSS vectors (e.g., `<script>`, `<html>`) at the schema level.
- **Body Size Limits**: JSON payloads are restricted to 100KB (and 10KB for auth) to prevent DoS attacks.

### 2. Infrastructure Security

- **Rate Limiting**: Distributed rate limiting using Upstash Redis (production) or in-memory (development). Limits are applied per IP and per user.
- **HSTS**: Strict Transport Security enforced via global middleware with a 1-year max-age.
- **CSP (Content Security Policy)**: Strict policy enforced globally. Inline scripts for theme and RTL are validated using pre-computed SHA-256 hashes, eliminating the need for `'unsafe-inline'`.
- **Enumeration Prevention**: Authentication endpoints (Signup/Signin) return generic success/error messages to prevent user account enumeration.

### 3. Database Security

- **RLS (Row Level Security)**: PostgreSQL policies ensure users can only `SELECT`, `INSERT`, `UPDATE`, or `DELETE` their own data.
- **Service Role Isolation**: High-privilege operations are restricted to server-side routes using the Supabase Service Role Key.

### 4. Code Quality

- **Secrets Scanning**: Automated scripts prevent the commitment of API keys or tokens.
- **Dependency Audits**: Regular `npm audit` and version pinning.
