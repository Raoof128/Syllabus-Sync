# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.0.x   | ✅ Yes     |
| < 1.0   | ❌ No      |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately via GitHub Security Advisories or by contacting the maintainers directly. **Do not create public issues for security vulnerabilities.**

## Security Architecture

Syllabus Sync implements a multi-layered security model:

### 1. Request Validation
- **CSRF Protection**: All mutation endpoints (POST/PUT/DELETE) validate the `Origin` and `Referer` headers against an allowlist of trusted domains.
- **Schema Validation**: All API inputs are validated using `zod` to prevent injection and malformed data.
- **Body Size Limits**: JSON payloads are restricted to 100KB to prevent DoS attacks.

### 2. Infrastructure Security
- **Rate Limiting**: Distributed rate limiting using Upstash Redis (production) or in-memory (development).
- **HSTS**: Strict Transport Security enforced in production.
- **CSP**: Content Security Policy implemented to prevent XSS and clickjacking.

### 3. Database Security
- **RLS (Row Level Security)**: PostgreSQL policies ensure users can only `SELECT`, `INSERT`, `UPDATE`, or `DELETE` their own data.
- **Service Role Isolation**: High-privilege operations are restricted to server-side routes using the Supabase Service Role Key.

### 4. Code Quality
- **Secrets Scanning**: Automated scripts prevent the commitment of API keys or tokens.
- **Dependency Audits**: Regular `npm audit` and version pinning.
