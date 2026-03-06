# API Reference

> Syllabus Sync REST API — All routes are under `/api/`.

## Conventions

- **Authentication**: Most endpoints require a valid Supabase session cookie. Unauthenticated requests return `401`.
- **Rate Limiting**: All endpoints are rate-limited per IP. Auth-sensitive routes have stricter limits.
- **Validation**: Request bodies are validated with Zod. Invalid input returns `400` with field-level errors.
- **CSRF**: Mutation methods (`POST`, `PUT`, `PATCH`, `DELETE`) require a valid CSRF token header.
- **Responses**: All responses follow `{ success, data?, error?, code? }` shape.

---

## Authentication

| Method | Path                               | Auth | Description                   |
| ------ | ---------------------------------- | ---- | ----------------------------- |
| POST   | `/api/auth/signup`                 | No   | Register a new account        |
| POST   | `/api/auth/signin`                 | No   | Sign in with email + password |
| POST   | `/api/auth/signout`                | Yes  | Sign out (invalidate session) |
| GET    | `/api/auth/user`                   | Yes  | Get current user profile      |
| POST   | `/api/auth/password`               | Yes  | Change password               |
| POST   | `/api/auth/password/request-reset` | No   | Request password reset email  |
| POST   | `/api/auth/password/reset`         | No   | Reset password with token     |
| GET    | `/api/auth/sessions`               | Yes  | List active sessions          |
| POST   | `/api/auth/sessions`               | Yes  | Terminate sessions by scope   |
| GET    | `/api/auth/onboarding`             | Yes  | Get/set onboarding status     |

### Email Verification

| Method | Path                                  | Auth | Description               |
| ------ | ------------------------------------- | ---- | ------------------------- |
| POST   | `/api/auth/email/send-verification`   | Yes  | Send verification email   |
| POST   | `/api/auth/email/resend-verification` | Yes  | Resend verification email |
| POST   | `/api/auth/email/verify`              | No   | Verify email with token   |

### MFA (TOTP / SMS)

| Method | Path                             | Auth | Description               |
| ------ | -------------------------------- | ---- | ------------------------- |
| POST   | `/api/auth/mfa/enroll`           | Yes  | Start TOTP enrollment     |
| POST   | `/api/auth/mfa/verify`           | Yes  | Verify TOTP code          |
| POST   | `/api/auth/mfa/challenge`        | Yes  | Request MFA challenge     |
| POST   | `/api/auth/mfa/challenge-verify` | Yes  | Verify challenge response |
| GET    | `/api/auth/mfa/status`           | Yes  | Get MFA enrollment status |
| DELETE | `/api/auth/mfa/unenroll`         | Yes  | Remove MFA factor         |
| POST   | `/api/auth/mfa/sms/enroll`       | Yes  | Enroll SMS factor         |
| POST   | `/api/auth/mfa/sms/verify`       | Yes  | Verify SMS code           |

### WebAuthn / Passkeys

| Method | Path                                 | Auth | Description                 |
| ------ | ------------------------------------ | ---- | --------------------------- |
| GET    | `/api/webauthn/register/options`     | Yes  | Get registration options    |
| POST   | `/api/webauthn/register/verify`      | Yes  | Verify registration         |
| GET    | `/api/webauthn/authenticate/options` | No   | Get authentication options  |
| POST   | `/api/webauthn/authenticate/verify`  | No   | Verify authentication       |
| GET    | `/api/webauthn/credentials`          | Yes  | List registered credentials |
| DELETE | `/api/webauthn/credentials`          | Yes  | Remove a credential         |

---

## Academic Data

### Units

| Method | Path              | Auth | Description                     |
| ------ | ----------------- | ---- | ------------------------------- |
| GET    | `/api/units`      | Yes  | List user's enrolled units      |
| POST   | `/api/units`      | Yes  | Create a unit with class times  |
| GET    | `/api/units/[id]` | Yes  | Get unit by ID                  |
| PUT    | `/api/units/[id]` | Yes  | Update a unit                   |
| DELETE | `/api/units/[id]` | Yes  | Delete a unit                   |
| POST   | `/api/units/sync` | Yes  | Sync units from external source |

### Deadlines

| Method | Path                  | Auth | Description        |
| ------ | --------------------- | ---- | ------------------ |
| GET    | `/api/deadlines`      | Yes  | List all deadlines |
| POST   | `/api/deadlines`      | Yes  | Create a deadline  |
| GET    | `/api/deadlines/[id]` | Yes  | Get deadline by ID |
| PUT    | `/api/deadlines/[id]` | Yes  | Update a deadline  |
| DELETE | `/api/deadlines/[id]` | Yes  | Delete a deadline  |

### Events

| Method | Path               | Auth | Description        |
| ------ | ------------------ | ---- | ------------------ |
| GET    | `/api/events`      | No   | List public events |
| POST   | `/api/events`      | Yes  | Create an event    |
| GET    | `/api/events/[id]` | No   | Get event by ID    |
| PUT    | `/api/events/[id]` | Yes  | Update an event    |
| DELETE | `/api/events/[id]` | Yes  | Delete an event    |

### Todos

| Method | Path              | Auth | Description   |
| ------ | ----------------- | ---- | ------------- |
| GET    | `/api/todos`      | Yes  | List todos    |
| POST   | `/api/todos`      | Yes  | Create a todo |
| PUT    | `/api/todos/[id]` | Yes  | Update a todo |
| DELETE | `/api/todos/[id]` | Yes  | Delete a todo |

---

## User Data

### Profiles

| Method | Path            | Auth | Description           |
| ------ | --------------- | ---- | --------------------- |
| GET    | `/api/profiles` | Yes  | Get user profile      |
| PUT    | `/api/profiles` | Yes  | Update profile fields |
| DELETE | `/api/profiles` | Yes  | Delete profile        |

### User Preferences

| Method | Path                    | Auth | Description          |
| ------ | ----------------------- | ---- | -------------------- |
| GET    | `/api/user-preferences` | Yes  | Get user preferences |
| PUT    | `/api/user-preferences` | Yes  | Update preferences   |

### Notifications

| Method | Path                               | Auth | Description            |
| ------ | ---------------------------------- | ---- | ---------------------- |
| GET    | `/api/notifications`               | Yes  | List notifications     |
| POST   | `/api/notifications`               | Yes  | Create a notification  |
| PUT    | `/api/notifications/[id]`          | Yes  | Mark notification read |
| DELETE | `/api/notifications/[id]`          | Yes  | Delete notification    |
| PUT    | `/api/notifications/mark-all-read` | Yes  | Mark all read          |

---

## Features

### Gamification

| Method | Path                         | Auth | Description            |
| ------ | ---------------------------- | ---- | ---------------------- |
| GET    | `/api/gamification`          | Yes  | Get XP, level, streaks |
| POST   | `/api/gamification/award-xp` | Yes  | Award XP for an action |

### Weather

| Method | Path                       | Auth | Description                 |
| ------ | -------------------------- | ---- | --------------------------- |
| GET    | `/api/weather?lat=X&lon=Y` | No   | Get weather for coordinates |

**Query Parameters:**

- `lat` (required): Latitude (-90 to 90)
- `lon` (required): Longitude (-180 to 180)

**Response:** Current conditions + 12-hour forecast with WMO-compatible weather codes.
Cached for 5 minutes. Powered by Google Weather API (server-side proxy).

### Navigation

| Method | Path               | Auth | Description                                          |
| ------ | ------------------ | ---- | ---------------------------------------------------- |
| POST   | `/api/navigate`    | No   | Get campus-raster walking route between points       |
| POST   | `/api/maps/routes` | No   | Get Google-mode route between origin and destination |

**`/api/navigate` Body:** `{ start: { lat, lng }, end: { lat, lng } }`
Campus mode only. Proxied through OpenRouteService with server-side key handling.

**`/api/maps/routes` Body:** `{ origin: { lat, lng }, destination: { lat, lng }, travelMode?: 'WALK' | 'DRIVE' | 'BICYCLE' | 'TRANSIT' }`
Google-mode routing endpoint. Proxied through the Google Routes API with field-masked responses and server-side key handling.

---

## Operations

### Sync

| Method | Path        | Auth | Description    |
| ------ | ----------- | ---- | -------------- |
| POST   | `/api/sync` | Yes  | Full data sync |

### Health

| Method | Path          | Auth | Description                |
| ------ | ------------- | ---- | -------------------------- |
| GET    | `/api/health` | No   | Health check (returns 200) |

### Security Utilities

| Method | Path                                  | Auth | Description                 |
| ------ | ------------------------------------- | ---- | --------------------------- |
| POST   | `/api/security/check-password-breach` | Yes  | Check password against HIBP |
| POST   | `/api/security/scan-headers`          | Yes  | Scan URL security headers   |

### Audit

| Method | Path         | Auth | Description            |
| ------ | ------------ | ---- | ---------------------- |
| GET    | `/api/audit` | Yes  | Read audit log entries |
| POST   | `/api/audit` | Yes  | Write audit log entry  |

### Admin

| Method | Path                                   | Auth | Description                   |
| ------ | -------------------------------------- | ---- | ----------------------------- |
| POST   | `/api/admin/update-building-positions` | Yes  | Update campus building coords |

---

## Error Codes

| Code                     | HTTP Status | Meaning                                         |
| ------------------------ | ----------- | ----------------------------------------------- |
| `VALIDATION_ERROR`       | 400         | Request body/params failed Zod validation       |
| `UNAUTHORIZED`           | 401         | Missing or invalid session                      |
| `FORBIDDEN`              | 403         | CSRF failure or insufficient permissions        |
| `NOT_FOUND`              | 404         | Resource does not exist or not owned by user    |
| `RATE_LIMITED`           | 429         | Too many requests — check `Retry-After` header  |
| `EXTERNAL_SERVICE_ERROR` | 503         | Upstream service (weather, routing) unavailable |

## Rate Limits

| Endpoint Group        | Limit       | Window     |
| --------------------- | ----------- | ---------- |
| Auth (login, signup)  | 5 requests  | 15 minutes |
| MFA verification      | 5 attempts  | 15 minutes |
| General API           | 60 requests | 1 minute   |
| Weather               | 30 requests | 1 minute   |
| Password breach check | 10 requests | 1 minute   |
