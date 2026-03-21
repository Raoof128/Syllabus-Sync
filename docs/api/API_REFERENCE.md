# API Reference

This document provides a comprehensive technical reference for the Syllabus Sync REST API surface. All routes are implemented using Next.js App Router Handlers and are located under `app/api/**/route.ts`.

---

## 🔒 Security & Request Standards

### Authentication

Most authenticated routes depend on a valid Supabase session. Authentication is typically enforced via the `requireAuth` or `requireAuthWithRateLimit` middleware wrappers.

### Headers

- **Content-Type:** `application/json`
- **X-CSRF-Token:** Required for all mutation requests (POST, PUT, PATCH, DELETE). This is automatically handled by the `lib/utils/api.ts` utility.

### Rate Limiting

Security-critical endpoints (Auth, Security) implement strict, Redis-backed sliding-window rate limiting. Non-critical endpoints use a more relaxed threshold. Exceeding these limits returns a `429 Too Many Requests` response.

---

## 🔑 Authentication Endpoints

### `POST /api/auth/signup`

Creates a new student account.

- **Payload:** `{ email, password, fullName, studentId, course, year }`
- **Security:** Checks `HaveIBeenPwned` for breached passwords; triggers database-level profile creation.

### `POST /api/auth/signin`

Authenticates a user and establishes a session.

- **Payload:** `{ email, password }`
- **Security:** Enforces email verification gate and MFA/Passkey status checks.

### `POST /api/auth/mfa/enroll`

Initiates the enrollment process for a new MFA factor (TOTP).

- **Security:** Requires active AAL1 session.

---

## 👤 Profile & Preferences

### `GET /api/profiles`

Fetches the profile for the authenticated user.

- **Caching:** Returns `Cache-Control: private, max-age=0, must-revalidate` to ensure fresh data in Zustand while allowing browser-level revalidation.

### `PATCH /api/user-preferences`

Updates user-specific application preferences (Language, Reminders, Theme).

- **Payload:** Partial `UserPreferences` object.

---

## 📅 Academic Data

### `GET /api/units`

Returns a list of academic units for the authenticated user.

### `POST /api/units`

Creates a new academic unit and associated class times.

- **Payload:** `{ code, name, color, building, room, schedule }`

### `GET /api/deadlines`

Fetches all upcoming academic deadlines, calculated with stress-level indicators.

---

## 🗺️ Navigation & Location

### `GET /api/navigate`

Proxies requests to external routing engines (e.g., OpenRouteService) to provide high-accuracy campus pedestrian paths.

- **Security:** Validates origin and enforces geofencing boundaries.

### `GET /api/weather`

Fetches real-time campus weather data.

- **Security:** Rate-limited to prevent API key exhaustion.

---

## 🛡️ Security & Auditing

### `GET /api/audit`

Retrieves the audit log history for the authenticated user.

- **Query Params:** `limit`, `offset`, `action`, `severity`.

### `POST /api/security/scan-headers`

Analyzes the security headers of a given URL and returns a graded posture report.

- **Internal Use:** Powers the Security Center's external link validation.

---

## 🛠️ Error Handling

The API uses standardized JSON error responses:

```json
{
  "error": "error_code_identifier",
  "message": "Human-readable explanation of the error.",
  "status": 400
}
```

**Common Error Codes:**

- `unauthorized`: Session missing or expired.
- `forbidden`: Insufficient permissions (RLS violation).
- `bad_request`: Invalid payload (Zod validation failure).
- `rate_limit_exceeded`: Too many requests from this IP.
- `internal_error`: Unhandled server-side exception.
