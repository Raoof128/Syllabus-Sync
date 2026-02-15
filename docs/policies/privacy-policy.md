# Privacy Policy

Last updated: 2026-02-16

This Privacy Policy explains what data Syllabus Sync collects, how it is used, and where it is processed. It is a technical, implementation-aware policy for the current codebase.

## Scope

This policy applies to:

- The Syllabus Sync web application
- API routes under `app/api/*`
- Database objects managed through `supabase/migrations/*`

## What We Collect and Why

| Data Category                         | What We Collect                                                                                  | Why We Collect It                                                | Primary Code/Schema Evidence                                                                                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account and identity data             | Email address, authentication account identifier, password-based auth (handled by Supabase Auth) | Account creation, login, session management                      | `app/api/auth/signup/route.ts`, `app/api/auth/signin/route.ts`, `supabase/migrations/20260104000000_initial_schema.sql`                                                                 |
| Profile data                          | `full_name`, `student_id`, `course`, `year`, `avatar_url`, `email`                               | Personalize the user profile and academic dashboard              | `app/api/profiles/route.ts`, `docs/database/database-schema.sql` (`public.profiles`)                                                                                                    |
| Academic planning data                | Units, class times, deadlines, events, todos                                                     | Core app functionality for planning and scheduling               | `docs/database/database-schema.sql` (`public.units`, `public.class_times`, `public.deadlines`, `public.events`), `supabase/migrations/20260124001000_create_todos_table.sql`            |
| Notification data                     | In-app notifications and notification preferences (email/push toggles, reminder timing)          | Deliver reminders and in-app alerts                              | `docs/database/database-schema.sql` (`public.notifications`, `public.user_preferences`), `lib/store/notificationPreferencesStore.ts`                                                    |
| Security and audit data               | Audit event metadata, IP address, user agent, action and severity logs                           | Security monitoring, abuse detection, and incident investigation | `app/api/audit/route.ts`, `supabase/migrations/20260214003000_restore_missing_core_security_tables.sql` (`public.audit_logs`, `public.auth_audit_logs`)                                 |
| MFA and authentication hardening data | MFA factors (TOTP/SMS via Supabase), passkey credential material, WebAuthn challenge records     | Account security and strong authentication                       | `app/api/auth/mfa/*`, `app/api/webauthn/*`, `supabase/migrations/20260214003000_restore_missing_core_security_tables.sql` (`public.webauthn_credentials`, `public.webauthn_challenges`) |
| Email verification data               | Token hash, user ID, expiry, used flag                                                           | Verify email ownership and prevent token replay                  | `lib/security/emailVerification.ts`, `app/api/auth/email/verify/route.ts`, `supabase/migrations/20260213000000_email_verifications.sql`                                                 |
| Device/session metadata               | Session device label (derived from user-agent), session scope operations, session cookies        | User session display and session control                         | `app/api/auth/sessions/route.ts`, `lib/supabase/middleware.ts`                                                                                                                          |
| Location/coordinates (feature-based)  | Latitude/longitude provided for routing and weather features                                     | Navigation routing and weather display                           | `app/api/navigate/route.ts`, `app/api/weather/route.ts`, `features/map/hooks/useMapLocation.ts`                                                                                         |
| Client-side preference and cache data | Theme/language and selected persisted app state in browser storage                               | UX continuity and offline/resume behavior                        | `lib/utils/clientStorage.ts`, `lib/store/*Store.ts` (persist middleware), `public/sw.js`                                                                                                |

## How We Use Data

We use data to:

- Create and authenticate accounts
- Provide academic planning features (units, deadlines, events, todos)
- Deliver reminders and user-selected notifications
- Secure accounts with MFA, passkeys, CSRF protections, and abuse controls
- Monitor reliability and security events
- Support map routing and weather features when users invoke those features

We do not sell personal data in this codebase.

## Cookies and Client Storage

The app uses:

- Secure session cookies for authentication (`sb-access-token`, `sb-refresh-token`)
- CSRF cookie (`__Host-csrf`) for mutation protection
- Browser `localStorage` for persisted UI/preferences and selected cached state
- Browser `sessionStorage` and Service Worker cache, with explicit clearing controls on logout

Evidence:

- `lib/supabase/middleware.ts`
- `lib/security/csrf.ts`
- `lib/utils/clientStorage.ts`
- `public/sw.js`

## Security Controls Relevant to Privacy

Implemented controls include:

- Row Level Security (RLS) for user-scoped data access in PostgreSQL
- Input validation and size limits for API requests
- Rate limiting for auth and sensitive endpoints
- Token hashing for email verification
- Cache-control/no-store behavior for sensitive MFA enrollment responses

Evidence:

- `supabase/migrations/20260114011650_fix_schema_comprehensive.sql`
- `app/api/_lib/middleware.ts`
- `lib/services/rateLimitService.ts`
- `lib/security/emailVerification.ts`
- `app/api/auth/mfa/enroll/route.ts`

## Third-Party Processors and External Services

| Service                                   | Purpose                             | Data Shared                                                              |
| ----------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| Supabase                                  | Authentication, database, storage   | Account identifiers, app data, security/audit records needed by features |
| Resend                                    | Transactional email verification    | User email address and verification message content                      |
| OpenRouteService                          | Route generation for map navigation | Route coordinates submitted by user action                               |
| Open-Meteo                                | Weather retrieval                   | Coordinates used for weather lookup                                      |
| Upstash Redis / Vercel KV (if configured) | Distributed rate-limit counters     | Derived request identifiers and counter state                            |
| Sentry (if enabled)                       | Error and performance monitoring    | Runtime diagnostic metadata and error context                            |

Evidence:

- `lib/services/emailService.ts`
- `app/api/navigate/route.ts`
- `app/api/weather/route.ts`
- `lib/services/rateLimitService.ts`
- `config/sentry/sentry.client.config.ts`
- `config/sentry/sentry.server.config.ts`
- `config/sentry/sentry.edge.config.ts`

## Retention and Deletion

Retention behavior evidenced in code:

- Email verification tokens expire in 20 minutes.
- WebAuthn challenges default to 5-minute expiry.
- In-memory route and weather caches use 5-minute TTL.
- Local client storage is cleared on logout by dedicated utilities.

Some long-term retention periods are not currently codified in code or migrations (for example, global audit log retention windows). Those should be defined in policy and enforced with scheduled deletion jobs.

Evidence:

- `lib/security/emailVerification.ts`
- `supabase/migrations/20260214003000_restore_missing_core_security_tables.sql`
- `app/api/navigate/route.ts`
- `app/api/weather/route.ts`
- `lib/utils/clientStorage.ts`

## User Controls

Available user controls include:

- Update/delete profile (`/api/profiles`)
- Sign out current/all sessions (`/api/auth/sessions`, `/api/auth/signout`)
- Password change (`/api/auth/password`)
- MFA enrollment/verification/unenrollment (`/api/auth/mfa/*`)
- Data export from client state (settings export utility)

Evidence:

- `app/api/profiles/route.ts`
- `app/api/auth/sessions/route.ts`
- `app/api/auth/signout/route.ts`
- `app/api/auth/password/route.ts`
- `app/api/auth/mfa/*`
- `lib/hooks/useDataExport.ts`

## Known Policy Gaps to Address

- Define and enforce explicit retention windows for audit/security logs.
- Add a formal data-subprocessor list in deployment docs (environment-specific).
- Document legal basis and jurisdiction-specific rights text for production legal review.

## Contact

For privacy or data-protection questions, use the security contact process documented in:

- `SECURITY.md`
- `docs/policies/security-policy.md`
