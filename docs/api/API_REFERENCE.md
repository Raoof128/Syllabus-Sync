# API Reference

This document reflects the current `app/api/**/route.ts` surface in the repository.

## Conventions

- Most authenticated routes depend on Supabase session state.
- Mutation routes commonly validate payloads with Zod and apply rate limiting.
- Shared response helpers live under `app/api/_lib/`.
- Some routes are internal/operational and not intended for public client use.

## Auth And Account

| Method        | Path                               | Notes                         |
| ------------- | ---------------------------------- | ----------------------------- |
| `POST`        | `/api/auth/signup`                 | Sign-up flow                  |
| `POST`        | `/api/auth/signin`                 | Sign-in flow                  |
| `POST`        | `/api/auth/signout`                | Server-side sign-out cleanup  |
| `GET`         | `/api/auth/user`                   | Current user snapshot         |
| `POST`        | `/api/auth/password`               | Authenticated password change |
| `POST`        | `/api/auth/password/request-reset` | Request password reset        |
| `POST`        | `/api/auth/password/reset`         | Complete password reset       |
| `GET`, `POST` | `/api/auth/sessions`               | List/terminate sessions       |
| `POST`        | `/api/auth/onboarding`             | Save onboarding profile data  |

### Email Verification

| Method | Path                                  |
| ------ | ------------------------------------- |
| `POST` | `/api/auth/email/send-verification`   |
| `POST` | `/api/auth/email/resend-verification` |
| `POST` | `/api/auth/email/verify`              |

Internal cleanup route files also exist for email/password/rate-limit cleanup and are intended for operational use.

## MFA And Passkeys

### MFA

| Method | Path                             |
| ------ | -------------------------------- |
| `POST` | `/api/auth/mfa/enroll`           |
| `POST` | `/api/auth/mfa/verify`           |
| `POST` | `/api/auth/mfa/challenge`        |
| `POST` | `/api/auth/mfa/challenge-verify` |
| `GET`  | `/api/auth/mfa/status`           |
| `POST` | `/api/auth/mfa/unenroll`         |
| `POST` | `/api/auth/mfa/sms/enroll`       |
| `POST` | `/api/auth/mfa/sms/verify`       |

### Passkey / WebAuthn

| Method          | Path                                 |
| --------------- | ------------------------------------ |
| `POST`          | `/api/auth/passkey/options`          |
| `POST`          | `/api/auth/passkey/register-options` |
| `POST`          | `/api/auth/passkey/register`         |
| `POST`          | `/api/auth/passkey/verify`           |
| `POST`          | `/api/auth/passkey/status`           |
| `POST`          | `/api/webauthn/register/options`     |
| `POST`          | `/api/webauthn/register/verify`      |
| `POST`          | `/api/webauthn/authenticate/options` |
| `POST`          | `/api/webauthn/authenticate/verify`  |
| `GET`, `DELETE` | `/api/webauthn/credentials`          |

## Core User Data

| Method                          | Path                               | Notes                              |
| ------------------------------- | ---------------------------------- | ---------------------------------- |
| `GET`, `PUT`, `DELETE`          | `/api/profiles`                    | Current user profile               |
| `GET`, `PUT`                    | `/api/user-preferences`            | Preference record                  |
| `GET`, `POST`, `DELETE`         | `/api/notifications`               | List/create/clear notification set |
| `GET`, `PUT`, `PATCH`, `DELETE` | `/api/notifications/[id]`          | Single notification                |
| `PUT`                           | `/api/notifications/mark-all-read` | Bulk mark read                     |

## Academic Data

### Units

| Method          | Path              | Notes                                   |
| --------------- | ----------------- | --------------------------------------- |
| `GET`, `POST`   | `/api/units`      | Units plus schedule/class-time handling |
| `PUT`, `DELETE` | `/api/units/[id]` | Single unit                             |
| `POST`          | `/api/units/sync` | Sync/import path                        |

### Deadlines

| Method          | Path                  |
| --------------- | --------------------- |
| `GET`, `POST`   | `/api/deadlines`      |
| `PUT`, `DELETE` | `/api/deadlines/[id]` |

### Events

| Method          | Path               |
| --------------- | ------------------ |
| `GET`, `POST`   | `/api/events`      |
| `PUT`, `DELETE` | `/api/events/[id]` |

### Todos

| Method          | Path              |
| --------------- | ----------------- |
| `GET`, `POST`   | `/api/todos`      |
| `PUT`, `DELETE` | `/api/todos/[id]` |

## Product Features

| Method        | Path                         | Notes                              |
| ------------- | ---------------------------- | ---------------------------------- |
| `GET`, `POST` | `/api/gamification`          | Read and mutate gamification state |
| `POST`        | `/api/gamification/award-xp` | Award XP                           |
| `POST`        | `/api/sync`                  | Sync surface                       |
| `GET`         | `/api/weather`               | Server-side weather proxy          |
| `GET`, `POST` | `/api/audit`                 | Audit access and writes            |

## Navigation And Maps

| Method        | Path                                   | Notes                                             |
| ------------- | -------------------------------------- | ------------------------------------------------- |
| `POST`        | `/api/navigate`                        | Campus raster navigation via ORS or demo fallback |
| `POST`        | `/api/maps/routes`                     | Google Routes proxy                               |
| `POST`        | `/api/maps/place-search`               | Google place search proxy                         |
| `POST`        | `/api/maps/place-details`              | Google place details proxy                        |
| `POST`        | `/api/maps/dev-pin`                    | Dev-only building pin save path                   |
| `GET`, `POST` | `/api/admin/update-building-positions` | Admin building-position utility                   |

## Security And Operations

| Method | Path                                  | Notes                                     |
| ------ | ------------------------------------- | ----------------------------------------- |
| `GET`  | `/api/health`                         | Health/degraded status endpoint           |
| `POST` | `/api/security/check-password-breach` | Password breach check                     |
| `POST` | `/api/security/scan-headers`          | Header scan utility                       |
| `POST` | `/api/csp-report`                     | CSP report intake                         |
| `GET`  | `/api/auth/biometric`                 | Biometric/passkey-related capability path |
| `POST` | `/api/auth/biometric`                 | Biometric/passkey action path             |

## Notes From Reconciliation

- `/api/auth/onboarding` is `POST` only in code. It is not a `GET` endpoint.
- `/api/auth/mfa/unenroll` is `POST` in code, not `DELETE`.
- Units still use the `class_times` table alongside unit records; documentation should not collapse this away.
- Some cleanup route files exist for operational use without a standard exported REST method list in the same style as the public routes.
