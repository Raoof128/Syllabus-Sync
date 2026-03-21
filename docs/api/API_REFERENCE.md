# API Reference

Complete reference for the Syllabus Sync REST API. All endpoints are implemented as Next.js App Router handlers under `app/api/`.

**Base URL:** `https://syllabus-sync.vercel.app/api` (production) | `http://localhost:3000/api` (development)

---

## Request Standards

### Content Type

All request bodies must be sent as `application/json`. Maximum body sizes are enforced per endpoint category:

| Category          | Max Body Size |
| :---------------- | :------------ |
| Auth endpoints    | 10 KB         |
| Admin endpoints   | 50 KB         |
| General endpoints | 100 KB        |
| File uploads      | 5 MB          |

### Authentication

API routes enforce authentication through a layered middleware stack:

1. **Proxy layer** (`lib/proxy.ts`) -- the Next.js middleware intercepts all requests, resolves Supabase sessions, and rejects unauthenticated calls to protected API routes with `401`.
2. **Route-level middleware** (`app/api/_lib/middleware.ts`) -- individual handlers use `requireAuth`, `requireAuthWithRateLimit`, or `optionalAuth` wrappers for defense in depth.

Include a valid Supabase session cookie with every request. The client SDK handles this automatically.

### CSRF Protection

All mutation requests (`POST`, `PUT`, `PATCH`, `DELETE`) require valid origin headers. The proxy layer validates the `Origin` / `Referer` header against a trusted origin allowlist. A `__Host-csrf` cookie is set automatically for browser clients.

### Rate Limiting

Rate limits use a Redis-backed sliding-window algorithm. When a limit is exceeded, the API returns `429` with a `Retry-After`-equivalent body field. Successful responses on rate-limited endpoints include these headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 842
```

| Limiter               | Scope               | Typical Window              |
| :-------------------- | :------------------ | :-------------------------- |
| `loginLimiter`        | Per-IP + email hash | Strict (auth security)      |
| `signupLimiter`       | Per-IP              | Strict (auth security)      |
| `securityScanLimiter` | Per-IP              | Strict                      |
| `mutationLimiter`     | Per-user + endpoint | Moderate (write operations) |
| `apiLimiter`          | Per-IP              | Relaxed (general reads)     |

---

## Response Format

### Success

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-03-21T10:00:00.000Z",
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 142,
      "totalPages": 3
    }
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "fields": { "email": ["Invalid email address"] }
    }
  },
  "meta": {
    "timestamp": "2026-03-21T10:00:00.000Z"
  }
}
```

### Error Codes

| Code                     | HTTP Status | Description                                                          |
| :----------------------- | :---------- | :------------------------------------------------------------------- |
| `BAD_REQUEST`            | 400         | Malformed request or missing required fields                         |
| `UNAUTHORIZED`           | 401         | Missing or expired session                                           |
| `FORBIDDEN`              | 403         | CSRF validation failed or insufficient permissions                   |
| `NOT_FOUND`              | 404         | Requested resource does not exist                                    |
| `CONFLICT`               | 409         | Duplicate resource (unique constraint violation) or version conflict |
| `VALIDATION_ERROR`       | 400 / 413   | Zod schema validation failure or body too large                      |
| `RATE_LIMITED`           | 429         | Too many requests from this client                                   |
| `INTERNAL_ERROR`         | 500         | Unhandled server exception                                           |
| `DATABASE_ERROR`         | 500         | Database operation failure (details redacted in production)          |
| `EXTERNAL_SERVICE_ERROR` | 502 / 503   | Upstream service (ORS, Google, HIBP) failure                         |
| `TIMEOUT`                | 504         | Upstream request timed out                                           |
| `AUTH_UNAVAILABLE`       | 503         | Auth service temporarily unreachable                                 |
| `MFA_REQUIRED`           | 403         | Session requires MFA step-up to AAL2                                 |

---

## Authentication & Identity

### Registration

| Method | Endpoint           | Auth   | Rate Limit               |
| :----- | :----------------- | :----- | :----------------------- |
| `POST` | `/api/auth/signup` | Public | `signupLimiter` (per-IP) |

**Request body:**

```json
{
  "email": "student@students.mq.edu.au",
  "password": "SecureP@ss123",
  "fullName": "Jane Smith",
  "studentId": "46012345",
  "course": "Bachelor of IT",
  "year": "2"
}
```

Triggers HaveIBeenPwned breach check on the password hash prefix. On success, creates a Supabase user and a corresponding `profiles` row via database trigger. Returns the created user object.

### Sign In

| Method | Endpoint           | Auth   | Rate Limit                      |
| :----- | :----------------- | :----- | :------------------------------ |
| `POST` | `/api/auth/signin` | Public | `loginLimiter` (per-IP + email) |

**Request body:**

```json
{
  "email": "student@students.mq.edu.au",
  "password": "SecureP@ss123"
}
```

Verifies credentials, enforces email verification gate, and checks MFA enrollment status. Returns a generic `"Invalid email or password"` message on failure to prevent account enumeration.

### Sign Out

| Method | Endpoint            | Auth   | Rate Limit |
| :----- | :------------------ | :----- | :--------- |
| `POST` | `/api/auth/signout` | Public | None       |

Destroys the active Supabase session.

### Current User

| Method | Endpoint         | Auth   | Rate Limit |
| :----- | :--------------- | :----- | :--------- |
| `GET`  | `/api/auth/user` | Public | None       |

Returns the currently authenticated user object, or `null` if no session exists.

### Session Management

| Method | Endpoint             | Auth   | Rate Limit |
| :----- | :------------------- | :----- | :--------- |
| `GET`  | `/api/auth/sessions` | Public | None       |
| `POST` | `/api/auth/sessions` | Public | None       |

List active sessions or terminate a specific session.

### Onboarding

| Method | Endpoint               | Auth   | Rate Limit |
| :----- | :--------------------- | :----- | :--------- |
| `POST` | `/api/auth/onboarding` | Public | None       |

Completes the post-registration onboarding flow (profile details, preferences).

---

## Multi-Factor Authentication (MFA)

All MFA endpoints are under the `/api/auth/` public path prefix for session bootstrapping purposes.

### TOTP Enrollment

| Method | Endpoint                 | Auth         | Rate Limit |
| :----- | :----------------------- | :----------- | :--------- |
| `POST` | `/api/auth/mfa/enroll`   | AAL1 session | None       |
| `POST` | `/api/auth/mfa/verify`   | AAL1 session | None       |
| `POST` | `/api/auth/mfa/unenroll` | AAL2 session | None       |

`enroll` returns a TOTP secret and QR code URI. `verify` confirms enrollment with a 6-digit code. `unenroll` removes the factor.

### TOTP Challenge

| Method | Endpoint                         | Auth         | Rate Limit |
| :----- | :------------------------------- | :----------- | :--------- |
| `POST` | `/api/auth/mfa/challenge`        | AAL1 session | None       |
| `POST` | `/api/auth/mfa/challenge-verify` | AAL1 session | None       |

Initiates and verifies a TOTP challenge to upgrade the session from AAL1 to AAL2.

### SMS MFA

| Method | Endpoint                   | Auth         | Rate Limit |
| :----- | :------------------------- | :----------- | :--------- |
| `POST` | `/api/auth/mfa/sms/enroll` | AAL1 session | None       |
| `POST` | `/api/auth/mfa/sms/verify` | AAL1 session | None       |

Enroll and verify a phone number for SMS-based MFA.

### MFA Status

| Method | Endpoint               | Auth         | Rate Limit |
| :----- | :--------------------- | :----------- | :--------- |
| `GET`  | `/api/auth/mfa/status` | AAL1 session | None       |

Returns the user's current Authenticator Assurance Level (`aal1` or `aal2`) and enrolled factor types.

---

## WebAuthn / Passkeys

Passwordless authentication using the WebAuthn standard.

### Registration

| Method | Endpoint                             | Auth          | Rate Limit |
| :----- | :----------------------------------- | :------------ | :--------- |
| `POST` | `/api/auth/passkey/register-options` | Public        | None       |
| `POST` | `/api/auth/passkey/register`         | Public        | None       |
| `POST` | `/api/auth/passkey/status`           | Public        | None       |
| `POST` | `/api/webauthn/register/options`     | Authenticated | None       |
| `POST` | `/api/webauthn/register/verify`      | Authenticated | None       |

### Authentication

| Method | Endpoint                             | Auth   | Rate Limit |
| :----- | :----------------------------------- | :----- | :--------- |
| `POST` | `/api/auth/passkey/options`          | Public | None       |
| `POST` | `/api/auth/passkey/verify`           | Public | None       |
| `POST` | `/api/webauthn/authenticate/options` | Public | None       |
| `POST` | `/api/webauthn/authenticate/verify`  | Public | None       |

### Credential Management

| Method   | Endpoint                    | Auth          | Rate Limit |
| :------- | :-------------------------- | :------------ | :--------- |
| `GET`    | `/api/webauthn/credentials` | Authenticated | None       |
| `DELETE` | `/api/webauthn/credentials` | Authenticated | None       |

### Biometric

| Method | Endpoint              | Auth   | Rate Limit |
| :----- | :-------------------- | :----- | :--------- |
| `GET`  | `/api/auth/biometric` | Public | None       |
| `POST` | `/api/auth/biometric` | Public | None       |

---

## Email Verification

| Method | Endpoint                              | Auth   | Rate Limit |
| :----- | :------------------------------------ | :----- | :--------- |
| `POST` | `/api/auth/email/send-verification`   | Public | None       |
| `POST` | `/api/auth/email/resend-verification` | Public | None       |
| `POST` | `/api/auth/email/verify`              | Public | None       |

---

## Password Management

| Method | Endpoint                           | Auth   | Rate Limit |
| :----- | :--------------------------------- | :----- | :--------- |
| `POST` | `/api/auth/password`               | Public | None       |
| `POST` | `/api/auth/password/request-reset` | Public | None       |
| `POST` | `/api/auth/password/reset`         | Public | None       |

`request-reset` sends a password reset email. `reset` processes the token and sets the new password. The base `/password` endpoint handles authenticated password changes.

---

## Profiles

| Method   | Endpoint        | Auth          | Rate Limit        | Description                                                              |
| :------- | :-------------- | :------------ | :---------------- | :----------------------------------------------------------------------- |
| `GET`    | `/api/profiles` | Authenticated | None              | Fetch the current user's profile. Auto-creates if missing.               |
| `PUT`    | `/api/profiles` | Authenticated | `mutationLimiter` | Update profile fields (name, student ID, faculty, course, year, avatar). |
| `DELETE` | `/api/profiles` | Authenticated | `mutationLimiter` | Delete the user's profile and preferences.                               |

**Response header:** `Cache-Control: private, max-age=0, must-revalidate`

**PUT request body:**

```json
{
  "full_name": "Jane Smith",
  "student_id": "46012345",
  "faculty": "Science and Engineering",
  "course": "Bachelor of IT",
  "year": "3",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

---

## User Preferences

| Method | Endpoint                | Auth          | Rate Limit        | Description                                                                    |
| :----- | :---------------------- | :------------ | :---------------- | :----------------------------------------------------------------------------- |
| `GET`  | `/api/user-preferences` | Authenticated | None              | Fetch notification and reminder preferences. Auto-creates defaults if missing. |
| `PUT`  | `/api/user-preferences` | Authenticated | `mutationLimiter` | Update one or more preference fields.                                          |

**PUT request body (all fields optional):**

```json
{
  "notifications_enabled": true,
  "email_notifications": true,
  "push_notifications": false,
  "deadline_notifications_enabled": true,
  "class_notifications_enabled": true,
  "event_notifications_enabled": true,
  "deadline_reminder_timing_minutes": 60,
  "class_reminder_timing_minutes": 15,
  "event_reminder_timing_minutes": 30
}
```

---

## Academic Units

| Method   | Endpoint          | Auth          | Rate Limit        | Description                                              |
| :------- | :---------------- | :------------ | :---------------- | :------------------------------------------------------- |
| `GET`    | `/api/units`      | Authenticated | None              | List units with class schedules (paginated, searchable). |
| `POST`   | `/api/units`      | Authenticated | `mutationLimiter` | Create a unit with associated class times.               |
| `PUT`    | `/api/units/:id`  | Authenticated | `mutationLimiter` | Update a unit and its schedule.                          |
| `DELETE` | `/api/units/:id`  | Authenticated | `mutationLimiter` | Soft-delete a unit.                                      |
| `POST`   | `/api/units/sync` | Authenticated | `mutationLimiter` | Bulk sync units from external source.                    |

**GET query parameters:**

| Param       | Type    | Default      | Description                                    |
| :---------- | :------ | :----------- | :--------------------------------------------- |
| `search`    | string  | --           | Filter by unit code or name (case-insensitive) |
| `limit`     | integer | 50           | Results per page (1--100)                      |
| `offset`    | integer | 0            | Pagination offset                              |
| `sortBy`    | enum    | `created_at` | Sort field: `code`, `name`, `created_at`       |
| `sortOrder` | enum    | `desc`       | Sort direction: `asc`, `desc`                  |

**POST request body:**

```json
{
  "code": "COMP2000",
  "name": "Software Engineering",
  "color": "#3B82F6",
  "location": {
    "building": "9 Wallys Walk",
    "room": "320"
  },
  "schedule": [
    { "day": "Monday", "startTime": "09:00", "endTime": "11:00" },
    { "day": "Wednesday", "startTime": "09:00", "endTime": "11:00" }
  ]
}
```

Building names are validated against the 118 supported campus buildings. Invalid buildings return `400`.

---

## Deadlines

| Method   | Endpoint             | Auth          | Rate Limit        | Description                                                          |
| :------- | :------------------- | :------------ | :---------------- | :------------------------------------------------------------------- |
| `GET`    | `/api/deadlines`     | Authenticated | None              | List all deadlines ordered by due date.                              |
| `POST`   | `/api/deadlines`     | Authenticated | `mutationLimiter` | Create a deadline. Auto-creates the unit if `unitCode` is not found. |
| `PUT`    | `/api/deadlines/:id` | Authenticated | `mutationLimiter` | Update a deadline.                                                   |
| `DELETE` | `/api/deadlines/:id` | Authenticated | `mutationLimiter` | Soft-delete a deadline.                                              |

**POST request body:**

```json
{
  "title": "Assignment 2",
  "unitCode": "COMP2000",
  "dueDate": "2026-04-15T23:59:00.000Z",
  "priority": "High",
  "type": "Assignment",
  "building": "9 Wallys Walk",
  "room": "110"
}
```

| Field      | Type | Required                   | Options                                      |
| :--------- | :--- | :------------------------- | :------------------------------------------- |
| `priority` | enum | No (default: `Medium`)     | `Low`, `Medium`, `High`, `Urgent`            |
| `type`     | enum | No (default: `Assignment`) | `Assignment`, `Exam`, `Quiz`, `Presentation` |

---

## Events

| Method   | Endpoint          | Auth          | Rate Limit        | Description                            |
| :------- | :---------------- | :------------ | :---------------- | :------------------------------------- |
| `GET`    | `/api/events`     | Authenticated | None              | List all events ordered by start time. |
| `POST`   | `/api/events`     | Authenticated | `mutationLimiter` | Create a campus event.                 |
| `PUT`    | `/api/events/:id` | Authenticated | `mutationLimiter` | Update an event.                       |
| `DELETE` | `/api/events/:id` | Authenticated | `mutationLimiter` | Soft-delete an event.                  |

**POST request body:**

```json
{
  "title": "Career Fair 2026",
  "description": "Annual engineering career fair",
  "location": "MUSE",
  "building": "MUSE",
  "category": "Career",
  "startAt": "2026-04-20T10:00:00.000Z",
  "endAt": "2026-04-20T16:00:00.000Z",
  "allDay": false
}
```

Categories: `Career`, `Social`, `Academic`, `Free Food`.

---

## Todos

| Method   | Endpoint         | Auth          | Rate Limit        | Description                    |
| :------- | :--------------- | :------------ | :---------------- | :----------------------------- |
| `GET`    | `/api/todos`     | Authenticated | None              | List all todos (newest first). |
| `POST`   | `/api/todos`     | Authenticated | `mutationLimiter` | Create a todo.                 |
| `PUT`    | `/api/todos/:id` | Authenticated | `mutationLimiter` | Update a todo.                 |
| `DELETE` | `/api/todos/:id` | Authenticated | `mutationLimiter` | Soft-delete a todo.            |

**POST request body:**

```json
{
  "title": "Review lecture notes",
  "description": "Chapters 5-7 for COMP2000",
  "priority": "High",
  "dueDate": "2026-04-10T17:00:00.000Z",
  "notificationEnabled": true,
  "color": "#EF4444"
}
```

---

## Notifications

| Method   | Endpoint                           | Auth          | Rate Limit        | Description                                 |
| :------- | :--------------------------------- | :------------ | :---------------- | :------------------------------------------ |
| `GET`    | `/api/notifications`               | Authenticated | None              | List notifications (paginated, filterable). |
| `POST`   | `/api/notifications`               | Authenticated | `mutationLimiter` | Create a notification.                      |
| `DELETE` | `/api/notifications`               | Authenticated | `mutationLimiter` | Soft-delete all notifications for the user. |
| `GET`    | `/api/notifications/:id`           | Authenticated | None              | Fetch a single notification.                |
| `PUT`    | `/api/notifications/:id`           | Authenticated | `mutationLimiter` | Update a notification (e.g., mark as read). |
| `PATCH`  | `/api/notifications/:id`           | Authenticated | `mutationLimiter` | Partial update on a notification.           |
| `DELETE` | `/api/notifications/:id`           | Authenticated | `mutationLimiter` | Soft-delete a single notification.          |
| `PUT`    | `/api/notifications/mark-all-read` | Authenticated | `mutationLimiter` | Mark all notifications as read.             |

**GET query parameters:**

| Param    | Type    | Default | Description                                    |
| :------- | :------ | :------ | :--------------------------------------------- |
| `type`   | enum    | --      | Filter: `deadline`, `event`, `class`, `system` |
| `read`   | boolean | --      | Filter by read status                          |
| `limit`  | integer | 50      | Results per page (1--100)                      |
| `offset` | integer | 0       | Pagination offset                              |

---

## Gamification

| Method | Endpoint                     | Auth          | Rate Limit          | Description                                             |
| :----- | :--------------------------- | :------------ | :------------------ | :------------------------------------------------------ |
| `GET`  | `/api/gamification`          | Optional      | `apiLimiter`        | Fetch XP profile. Returns demo data if unauthenticated. |
| `POST` | `/api/gamification`          | Authenticated | `apiLimiter` + CSRF | Record user activity and update streak.                 |
| `POST` | `/api/gamification/award-xp` | Authenticated | `apiLimiter`        | Award XP for a specific action.                         |

**GET query parameters:**

| Param    | Type    | Default | Description                           |
| :------- | :------ | :------ | :------------------------------------ |
| `events` | boolean | `false` | Include recent XP event history       |
| `limit`  | integer | 10      | Number of XP events to return (1--50) |

Level calculation uses a progressive curve: `level = floor(sqrt(xp / 25)) + 1`, capped at level 100.

---

## Navigation & Location

### Pedestrian Routing (OpenRouteService)

| Method | Endpoint        | Auth   | Rate Limit            | Description                                         |
| :----- | :-------------- | :----- | :-------------------- | :-------------------------------------------------- |
| `POST` | `/api/navigate` | Public | `apiLimiter` (per-IP) | Compute a pedestrian route between two coordinates. |

**Request body:**

```json
{
  "start": { "lat": -33.7738, "lng": 151.1126 },
  "end": { "lat": -33.7745, "lng": 151.1152 }
}
```

Security features:

- **Geofencing:** Coordinates must fall within the campus area (5 km buffer in production, 50 km in development).
- **Response caching:** Routes are cached for 5 minutes (SHA-256 key, ~1 m coordinate precision).
- **Per-IP cache limits:** Maximum 20 cached routes per IP to prevent cache flooding.
- **Demo mode:** Returns synthetic straight-line routes when `ORS_API_KEY` is not configured.

Response headers include `X-Cache: HIT | MISS | DEMO`.

### Google Maps Proxies

Server-side proxies that keep the `GOOGLE_ROUTES_API_KEY` off the client.

| Method | Endpoint                  | Auth   | Rate Limit   | Description                                   |
| :----- | :------------------------ | :----- | :----------- | :-------------------------------------------- |
| `POST` | `/api/maps/routes`        | Public | `apiLimiter` | Compute routes via Google Routes API.         |
| `POST` | `/api/maps/place-search`  | Public | `apiLimiter` | Search for places via Google Places API.      |
| `POST` | `/api/maps/place-details` | Public | `apiLimiter` | Fetch place details via Google Places API.    |
| `POST` | `/api/maps/dev-pin`       | Public | `apiLimiter` | Development tool for pinning map coordinates. |

All maps endpoints validate the request origin via `isTrustedOrigin` and enforce IP-based rate limiting.

### Weather

| Method | Endpoint       | Auth   | Rate Limit            | Description                                              |
| :----- | :------------- | :----- | :-------------------- | :------------------------------------------------------- |
| `GET`  | `/api/weather` | Public | `apiLimiter` (per-IP) | Fetch current and hourly weather via Google Weather API. |

**Query parameters:**

| Param | Type  | Required | Description             |
| :---- | :---- | :------- | :---------------------- |
| `lat` | float | Yes      | Latitude (-90 to 90)    |
| `lon` | float | Yes      | Longitude (-180 to 180) |

Cached for 5 minutes at ~11 m coordinate precision. Falls back to stale cache on upstream failure. Response includes `Cache-Control: public, s-maxage=300, stale-while-revalidate=60`.

---

## Offline Sync

| Method | Endpoint    | Auth          | Rate Limit        | Description                                                               |
| :----- | :---------- | :------------ | :---------------- | :------------------------------------------------------------------------ |
| `POST` | `/api/sync` | Authenticated | `mutationLimiter` | Process a queued offline mutation with version-based conflict resolution. |

**Request body:**

```json
{
  "type": "UPDATE",
  "table": "deadlines",
  "recordId": "550e8400-e29b-41d4-a716-446655440000",
  "data": { "title": "Updated title", "completed": true },
  "clientVersion": 3
}
```

| Field                | Type    | Description                                        |
| :------------------- | :------ | :------------------------------------------------- |
| `type`               | enum    | `CREATE`, `UPDATE`, `DELETE`                       |
| `table`              | enum    | `events`, `deadlines`, `todos`                     |
| `clientVersion`      | integer | Client-side version counter for conflict detection |
| `data._forceVersion` | boolean | Override conflict resolution (last-write-wins)     |

Returns `409 Conflict` when `clientVersion < serverVersion`, including the server's current data for client-side resolution.

---

## Audit Logs

| Method | Endpoint     | Auth          | Rate Limit | Description                        |
| :----- | :----------- | :------------ | :--------- | :--------------------------------- |
| `GET`  | `/api/audit` | Authenticated | None       | Fetch paginated audit log history. |
| `POST` | `/api/audit` | Authenticated | None       | Log a custom audit event.          |

**GET query parameters:**

| Param       | Type     | Default | Description                           |
| :---------- | :------- | :------ | :------------------------------------ |
| `limit`     | integer  | 100     | Results per page (1--1000)            |
| `offset`    | integer  | 0       | Pagination offset                     |
| `action`    | enum     | --      | Filter by action type                 |
| `severity`  | enum     | --      | Filter: `info`, `warning`, `critical` |
| `startDate` | ISO 8601 | --      | Start of date range                   |
| `endDate`   | ISO 8601 | --      | End of date range                     |

Supported actions: `CREATE`, `READ`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `PASSWORD_CHANGE`, `PASSWORD_RESET`, `EMAIL_CHANGE`, `MFA_ENABLE`, `MFA_DISABLE`, `SETTINGS_CHANGE`, `SECURITY_EVENT`, `RATE_LIMIT_EXCEEDED`, `IP_ANOMALY_DETECTED`, `SUSPICIOUS_ACTIVITY`, and others.

---

## Security

### Password Breach Check

| Method | Endpoint                              | Auth          | Rate Limit            | Description                                          |
| :----- | :------------------------------------ | :------------ | :-------------------- | :--------------------------------------------------- |
| `POST` | `/api/security/check-password-breach` | Authenticated | `securityScanLimiter` | Check a password hash prefix against HaveIBeenPwned. |

### Security Header Scanner

| Method | Endpoint                     | Auth          | Rate Limit            | Description                                                                     |
| :----- | :--------------------------- | :------------ | :-------------------- | :------------------------------------------------------------------------------ |
| `POST` | `/api/security/scan-headers` | Authenticated | `securityScanLimiter` | Analyze security headers of an external URL and return a graded posture report. |

Blocks requests to internal hosts (`localhost`, `127.0.0.1`, `169.254.169.254`, etc.) and sensitive ports (22, 3306, 5432, 6379, etc.) to prevent SSRF.

---

## Push Notifications

| Method   | Endpoint                 | Auth          | Rate Limit        | Description                       |
| :------- | :----------------------- | :------------ | :---------------- | :-------------------------------- |
| `POST`   | `/api/push/subscription` | Authenticated | `mutationLimiter` | Register a Web Push subscription. |
| `DELETE` | `/api/push/subscription` | Authenticated | `mutationLimiter` | Unregister a push subscription.   |

---

## Admin

| Method | Endpoint                               | Auth          | Rate Limit | Description                           |
| :----- | :------------------------------------- | :------------ | :--------- | :------------------------------------ |
| `GET`  | `/api/admin/update-building-positions` | Authenticated | None       | List current building positions.      |
| `POST` | `/api/admin/update-building-positions` | Authenticated | None       | Bulk-update building GPS coordinates. |

---

## Infrastructure

### Health Check

| Method | Endpoint      | Auth   | Rate Limit | Description                               |
| :----- | :------------ | :----- | :--------- | :---------------------------------------- |
| `GET`  | `/api/health` | Public | None       | Database connectivity and service status. |

Returns `healthy`, `degraded`, or `503` depending on database reachability. Version information is suppressed in production to prevent reconnaissance.

### CSP Report

| Method    | Endpoint          | Auth   | Rate Limit | Description                                                       |
| :-------- | :---------------- | :----- | :--------- | :---------------------------------------------------------------- |
| `POST`    | `/api/csp-report` | Public | None       | Receives Content-Security-Policy violation reports from browsers. |
| `OPTIONS` | `/api/csp-report` | Public | None       | CORS preflight.                                                   |

### Cron Jobs

| Method | Endpoint                   | Auth   | Rate Limit | Description                                   |
| :----- | :------------------------- | :----- | :--------- | :-------------------------------------------- |
| `GET`  | `/api/cron/push-reminders` | Public | None       | Trigger scheduled push notification delivery. |
| `POST` | `/api/cron/push-reminders` | Public | None       | Trigger scheduled push notification delivery. |

### Rate Limit Cleanup

The file at `/api/security/rate-limit/cleanup` provides a maintenance task for expiring stale rate-limit buckets. Invoked by scheduled infrastructure.

---

## Public vs. Authenticated Routes

The proxy middleware (`lib/proxy.ts`) designates the following API path prefixes as **public** (no session required):

| Path Prefix                        | Reason                                          |
| :--------------------------------- | :---------------------------------------------- |
| `/api/auth/*`                      | Session bootstrapping (login, signup, MFA)      |
| `/api/health`                      | Infrastructure monitoring                       |
| `/api/maps/*`                      | Navigation proxies (rate-limited by IP instead) |
| `/api/weather`                     | Weather data (rate-limited by IP instead)       |
| `/api/cron/*`                      | Scheduled tasks (secured by Vercel cron secret) |
| `/api/security/rate-limit/cleanup` | Infrastructure maintenance                      |
| `/api/csp-report`                  | Browser CSP violation reporting                 |
| `/api/webauthn/authenticate/*`     | Passkey authentication flow                     |

All other `/api/*` routes return `401 Unauthorized` without a valid Supabase session.
