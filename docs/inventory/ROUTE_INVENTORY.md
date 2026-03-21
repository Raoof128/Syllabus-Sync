# Route Inventory

Complete inventory of the Syllabus Sync application surface area, mapping every user-facing page and API endpoint to its source implementation.

---

## Page Routes

All pages are implemented as Next.js App Router pages under `app/`.

### Public Pages

| Route      | Implementation         | Description                                                                                                        |
| :--------- | :--------------------- | :----------------------------------------------------------------------------------------------------------------- |
| `/`        | `app/page.tsx`         | Auth redirect handler. Processes Supabase PKCE callbacks, recovery links, and OAuth redirects. Not a landing page. |
| `/verify`  | `app/verify/page.tsx`  | Email verification status and landing surface.                                                                     |
| `/about`   | `app/about/page.tsx`   | About page.                                                                                                        |
| `/contact` | `app/contact/page.tsx` | Contact information.                                                                                               |
| `/terms`   | `app/terms/page.tsx`   | Terms of service.                                                                                                  |
| `/privacy` | `app/privacy/page.tsx` | Privacy policy.                                                                                                    |
| `/offline` | `app/offline/page.tsx` | Offline fallback (service worker).                                                                                 |

### Auth Pages

Rendered without sidebar, header, or footer.

| Route             | Implementation                | Description                                                                        |
| :---------------- | :---------------------------- | :--------------------------------------------------------------------------------- |
| `/login`          | `app/login/page.tsx`          | Sign-in form with email/password and passkey support. MFA challenge when `?mfa=1`. |
| `/signup`         | `app/signup/page.tsx`         | New student account registration.                                                  |
| `/reset-password` | `app/reset-password/page.tsx` | Password reset flow.                                                               |

### Post-Auth Pages

| Route         | Implementation            | Description                                      |
| :------------ | :------------------------ | :----------------------------------------------- |
| `/onboarding` | `app/onboarding/page.tsx` | Profile completion gate for new and OAuth users. |

### Protected Pages

Rendered with the full application shell (sidebar, header, footer, offline indicator, sync dialog).

| Route                  | Implementation                     | Description                                                                                           |
| :--------------------- | :--------------------------------- | :---------------------------------------------------------------------------------------------------- |
| `/home`                | `app/home/page.tsx`                | Primary dashboard with widget overview and quick-add actions.                                         |
| `/calendar`            | `app/calendar/page.tsx`            | Academic schedule, deadline management, and calendar views.                                           |
| `/map`                 | `app/map/page.tsx`                 | Campus map with building search, two rendering modes (campus SVG and Google Maps via `?view=google`). |
| `/map/position-editor` | `app/map/position-editor/page.tsx` | Admin tool for adjusting building GPS coordinates.                                                    |
| `/feed`                | `app/feed/page.tsx`                | Campus events and social feed with deep links to `/map` and `/calendar`.                              |
| `/manage-profiles`     | `app/manage-profiles/page.tsx`     | Profile management (avatar, student details).                                                         |
| `/settings`            | `app/settings/page.tsx`            | Redirects to `/settings/general`.                                                                     |
| `/settings/general`    | `app/settings/general/page.tsx`    | General preferences (language, reminders).                                                            |
| `/settings/appearance` | `app/settings/appearance/page.tsx` | Theme and display settings.                                                                           |
| `/settings/security`   | `app/settings/security/page.tsx`   | MFA enrollment, passkey management, active sessions, security audit log.                              |
| `/settings/experience` | `app/settings/experience/page.tsx` | Gamification profile, XP history, streak tracking.                                                    |
| `/settings/about`      | `app/settings/about/page.tsx`      | Application version, open-source licenses, and credits.                                               |

### Map URL State

The `/map` page accepts URL parameters for deep linking:

| Parameter  | Purpose                                                        |
| :--------- | :------------------------------------------------------------- |
| `view`     | Rendering mode (`google` for Google Maps, omit for campus SVG) |
| `building` | Pre-select a building by identifier                            |
| `autonav`  | Automatically start navigation to the selected building        |
| `focused`  | Highlight a specific building on load                          |
| `layers`   | Toggle map layers                                              |

---

## Shell Architecture

The root layout (`app/layout.tsx`) sets global metadata, viewport, manifest, theme/RTL bootstrap scripts, and JSON-LD organization data. It wraps the tree with `QueryProvider` and `ClientLayout`.

`ClientLayout` (`app/client-layout.tsx`) selects the shell based on the current pathname:

| Shell | Routes                                                                                                       | Rendering                                                        |
| :---- | :----------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------- |
| Bare  | `/login`, `/signup`, `/reset-password`, `/onboarding`, `/verify`, `/terms`, `/privacy`, `/about`, `/contact` | No sidebar, header, or footer                                    |
| Full  | All other app routes                                                                                         | Sidebar, header, footer, offline indicator, toaster, sync dialog |

---

## Sidebar Navigation

Source of truth: `components/layout/Sidebar.tsx`

| Label Key    | Route       | Icon     |
| :----------- | :---------- | :------- |
| `home`       | `/home`     | Home     |
| `calendar`   | `/calendar` | Calendar |
| `navigation` | `/map`      | Map      |
| `feed`       | `/feed`     | Feed     |
| `settings`   | `/settings` | Settings |

Gamification deep link: `/settings/experience`

Desktop and mobile sidebar variants render identical route targets.

---

## API Routes

67 route handlers across 22 resource domains. See [API Reference](../api/API_REFERENCE.md) for complete endpoint documentation.

### Summary by Domain

| Domain           | Prefix                  | Endpoints | Auth Model                                          |
| :--------------- | :---------------------- | :-------- | :-------------------------------------------------- |
| Authentication   | `/api/auth/*`           | 21        | Public (session bootstrap)                          |
| WebAuthn         | `/api/webauthn/*`       | 5         | Mixed (public auth flow + authenticated management) |
| Units            | `/api/units/*`          | 4         | Authenticated                                       |
| Deadlines        | `/api/deadlines/*`      | 3         | Authenticated                                       |
| Events           | `/api/events/*`         | 3         | Authenticated                                       |
| Todos            | `/api/todos/*`          | 3         | Authenticated                                       |
| Notifications    | `/api/notifications/*`  | 5         | Authenticated                                       |
| Profiles         | `/api/profiles`         | 3         | Authenticated                                       |
| User Preferences | `/api/user-preferences` | 2         | Authenticated                                       |
| Gamification     | `/api/gamification/*`   | 3         | Optional / Authenticated                            |
| Navigation       | `/api/navigate`         | 1         | Public (IP rate-limited)                            |
| Maps             | `/api/maps/*`           | 4         | Public (IP rate-limited, origin-validated)          |
| Weather          | `/api/weather`          | 1         | Public (IP rate-limited)                            |
| Audit            | `/api/audit`            | 2         | Authenticated                                       |
| Sync             | `/api/sync`             | 1         | Authenticated                                       |
| Security         | `/api/security/*`       | 3         | Authenticated                                       |
| Push             | `/api/push/*`           | 2         | Authenticated                                       |
| Admin            | `/api/admin/*`          | 2         | Authenticated                                       |
| Health           | `/api/health`           | 1         | Public                                              |
| CSP Report       | `/api/csp-report`       | 2         | Public                                              |
| Cron             | `/api/cron/*`           | 2         | Public (Vercel cron secret)                         |

---

## Route Integrity Tests

Route consistency is enforced by automated tests in the CI quality gate (`npm run check`):

| Test File                                        | Validates                                                       |
| :----------------------------------------------- | :-------------------------------------------------------------- |
| `tests/settings/SettingsRoutesIntegrity.test.ts` | Every settings section target resolves to an `app/.../page.tsx` |
| `tests/settings/QuickActions.test.tsx`           | Every settings quick-action target resolves to a page           |
| `tests/api/proxy.mfa.test.ts`                    | Proxy middleware auth and MFA gate behavior                     |

Any modification to the route tree or navigation constants must be reflected in these tests.
