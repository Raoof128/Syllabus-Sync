# Route Inventory

Code-backed route inventory for the current Next.js App Router surface.

## Page Routes

| Route                  | Source                             |
| ---------------------- | ---------------------------------- |
| `/`                    | `app/page.tsx`                     |
| `/about`               | `app/about/page.tsx`               |
| `/calendar`            | `app/calendar/page.tsx`            |
| `/contact`             | `app/contact/page.tsx`             |
| `/feed`                | `app/feed/page.tsx`                |
| `/home`                | `app/home/page.tsx`                |
| `/login`               | `app/login/page.tsx`               |
| `/manage-profiles`     | `app/manage-profiles/page.tsx`     |
| `/map`                 | `app/map/page.tsx`                 |
| `/map/position-editor` | `app/map/position-editor/page.tsx` |
| `/offline`             | `app/offline/page.tsx`             |
| `/onboarding`          | `app/onboarding/page.tsx`          |
| `/privacy`             | `app/privacy/page.tsx`             |
| `/reset-password`      | `app/reset-password/page.tsx`      |
| `/settings`            | `app/settings/page.tsx`            |
| `/settings/about`      | `app/settings/about/page.tsx`      |
| `/settings/appearance` | `app/settings/appearance/page.tsx` |
| `/settings/experience` | `app/settings/experience/page.tsx` |
| `/settings/general`    | `app/settings/general/page.tsx`    |
| `/settings/security`   | `app/settings/security/page.tsx`   |
| `/signup`              | `app/signup/page.tsx`              |
| `/terms`               | `app/terms/page.tsx`               |
| `/verify`              | `app/verify/page.tsx`              |

## Layout Routes

| Route scope        | Source                           | Notes                        |
| ------------------ | -------------------------------- | ---------------------------- |
| global             | `app/layout.tsx`                 | metadata, scripts, providers |
| shell selector     | `app/client-layout.tsx`          | public vs protected shell    |
| `/manage-profiles` | `app/manage-profiles/layout.tsx` | feature-specific layout      |
| `/settings`        | `app/settings/layout.tsx`        | nested settings shell        |

## Route Handlers

### Core app and feature APIs

| Path                         | Methods       |
| ---------------------------- | ------------- |
| `/api/health`                | `GET`         |
| `/api/sync`                  | `POST`        |
| `/api/weather`               | `GET`         |
| `/api/user-preferences`      | `GET`, `PUT`  |
| `/api/gamification`          | `GET`, `POST` |
| `/api/gamification/award-xp` | `POST`        |
| `/api/audit`                 | `GET`, `POST` |

### Academic data

| Path                               | Methods                         |
| ---------------------------------- | ------------------------------- |
| `/api/units`                       | `GET`, `POST`                   |
| `/api/units/[id]`                  | `PUT`, `DELETE`                 |
| `/api/units/sync`                  | `POST`                          |
| `/api/deadlines`                   | `GET`, `POST`                   |
| `/api/deadlines/[id]`              | `PUT`, `DELETE`                 |
| `/api/events`                      | `GET`, `POST`                   |
| `/api/events/[id]`                 | `PUT`, `DELETE`                 |
| `/api/todos`                       | `GET`, `POST`                   |
| `/api/todos/[id]`                  | `PUT`, `DELETE`                 |
| `/api/profiles`                    | `GET`, `PUT`, `DELETE`          |
| `/api/notifications`               | `GET`, `POST`, `DELETE`         |
| `/api/notifications/[id]`          | `GET`, `PUT`, `PATCH`, `DELETE` |
| `/api/notifications/mark-all-read` | `PUT`                           |

### Authentication and security

| Path                                  | Methods           |
| ------------------------------------- | ----------------- |
| `/api/auth/signup`                    | `POST`            |
| `/api/auth/signin`                    | `POST`            |
| `/api/auth/signout`                   | `POST`            |
| `/api/auth/user`                      | `GET`             |
| `/api/auth/password`                  | `POST`            |
| `/api/auth/password/request-reset`    | `POST`            |
| `/api/auth/password/reset`            | `POST`            |
| `/api/auth/password/cleanup`          | `GET`, `POST`     |
| `/api/auth/sessions`                  | `GET`, `POST`     |
| `/api/auth/onboarding`                | `POST`            |
| `/api/auth/biometric`                 | `GET`, `POST`     |
| `/api/auth/email/send-verification`   | `POST`            |
| `/api/auth/email/resend-verification` | `POST`            |
| `/api/auth/email/verify`              | `POST`            |
| `/api/auth/email/cleanup`             | `GET`, `POST`     |
| `/api/auth/mfa/status`                | `GET`             |
| `/api/auth/mfa/enroll`                | `POST`            |
| `/api/auth/mfa/verify`                | `POST`            |
| `/api/auth/mfa/challenge`             | `POST`            |
| `/api/auth/mfa/challenge-verify`      | `POST`            |
| `/api/auth/mfa/unenroll`              | `POST`            |
| `/api/auth/mfa/sms/enroll`            | `POST`            |
| `/api/auth/mfa/sms/verify`            | `POST`            |
| `/api/auth/passkey/options`           | `POST`            |
| `/api/auth/passkey/register-options`  | `POST`            |
| `/api/auth/passkey/register`          | `POST`            |
| `/api/auth/passkey/status`            | `POST`            |
| `/api/auth/passkey/verify`            | `POST`            |
| `/api/webauthn/register/options`      | `POST`            |
| `/api/webauthn/register/verify`       | `POST`            |
| `/api/webauthn/authenticate/options`  | `POST`            |
| `/api/webauthn/authenticate/verify`   | `POST`            |
| `/api/webauthn/credentials`           | `GET`, `DELETE`   |
| `/api/security/check-password-breach` | `POST`            |
| `/api/security/scan-headers`          | `POST`            |
| `/api/security/rate-limit/cleanup`    | `GET`, `POST`     |
| `/api/csp-report`                     | `POST`, `OPTIONS` |

### Maps and admin tooling

| Path                                   | Methods       |
| -------------------------------------- | ------------- |
| `/api/navigate`                        | `POST`        |
| `/api/maps/routes`                     | `POST`        |
| `/api/maps/place-search`               | `POST`        |
| `/api/maps/place-details`              | `POST`        |
| `/api/maps/dev-pin`                    | `POST`        |
| `/api/admin/update-building-positions` | `GET`, `POST` |

## Route Integrity Tests

- `tests/settings/SettingsRoutesIntegrity.test.ts`
- `tests/settings/QuickActions.test.tsx`

Any change to settings section paths or quick action destinations should update those tests together with the route docs.
