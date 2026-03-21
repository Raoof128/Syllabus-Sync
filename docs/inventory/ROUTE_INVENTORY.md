# Route & System Inventory

This document provides a code-backed inventory of the Syllabus Sync application surface, mapping user-facing routes to their respective source implementation within the Next.js App Router.

---

## 🖥️ Page Routes (User Surface)

These routes render the application's UI and are managed by the `ClientLayout` shell selection logic.

| Route         | Implementation            | Visibility | Purpose                                         |
| :------------ | :------------------------ | :--------- | :---------------------------------------------- |
| `/`           | `app/page.tsx`            | Public     | Auth redirect handler and landing logic.        |
| `/login`      | `app/login/page.tsx`      | Auth       | Authentication entry point (Email/Passkey).     |
| `/signup`     | `app/signup/page.tsx`     | Auth       | New student account registration.               |
| `/home`       | `app/home/page.tsx`       | Protected  | Primary dashboard and widget overview.          |
| `/calendar`   | `app/calendar/page.tsx`   | Protected  | Academic schedule and deadline management.      |
| `/map`        | `app/map/page.tsx`        | Protected  | Campus navigation and building search.          |
| `/feed`       | `app/feed/page.tsx`       | Protected  | Real-time campus events and social feed.        |
| `/settings`   | `app/settings/page.tsx`   | Protected  | User preferences hub (General, Security, i18n). |
| `/onboarding` | `app/onboarding/page.tsx` | Post-Auth  | Profile completion gate for new/OAuth users.    |
| `/verify`     | `app/verify/page.tsx`     | Public     | Email verification and landing surface.         |

---

## 🔌 API Route Handlers (REST Surface)

All API endpoints are located under `app/api/` and enforce standardized security wrappers.

### Core Resources

- `/api/units`: Unit and class schedule management.
- `/api/deadlines`: Academic assessment tracking.
- `/api/events`: Campus event discovery.
- `/api/profiles`: User profile data and avatar storage management.
- `/api/user-preferences`: App settings persistence.

### Security & Identity

- `/api/auth/**`: MFA, WebAuthn, registration, and session management.
- `/api/audit`: Tamper-evident user activity logging.
- `/api/security/rate-limit/cleanup`: Maintenance task for expiring rate-limit buckets.
- `/api/security/check-password-breach`: Integration with HIBP.

### Location & Integration

- `/api/navigate`: Pedestrian routing proxy with geofencing.
- `/api/weather`: Campus-specific meteorological data.
- `/api/cron/**`: Scheduled tasks for push notifications and data cleanup.

---

## 🏗️ Directory Structure Overview

The repository follows a feature-modular organization to ensure long-term maintainability.

- **`app/`**: Next.js App Router (Pages, API Handlers, Layouts).
- **`features/`**: Modular logic, components, and hooks grouped by domain (e.g., `features/map`).
- **`components/`**: Shared UI primitives (`components/ui`) and layout shells (`components/layout`).
- **`lib/`**: Core infrastructure, including `lib/security`, `lib/supabase`, and `lib/store` (Zustand).
- **`supabase/`**: Idempotent SQL migrations and seed data.
- **`config/`**: Centralized tool configurations (ESLint, Prettier, Tailwind, Vitest).
- **`tests/`**: Unified test suite covering unit, integration, and E2E scenarios.

---

## 🧪 Route Integrity Verification

Route consistency is enforced via automated tests:

- `tests/settings/SettingsRoutesIntegrity.test.ts`
- `tests/api/proxy.mfa.test.ts`

Any modification to the route tree must be reflected in these tests to pass the `npm run check` quality gate.
