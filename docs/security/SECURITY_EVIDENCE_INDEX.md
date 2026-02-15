# Security Evidence Index

This index groups security-relevant files for fast reviewer navigation.

## Authentication & Sessions
- `app/api/auth/signin/route.ts`
- `app/api/auth/signup/route.ts`
- `app/api/auth/signout/route.ts`
- `app/api/auth/sessions/route.ts`
- `app/api/auth/password/route.ts`
- `app/api/auth/user/route.ts`
- `app/login/actions.ts`
- `lib/supabase/middleware.ts`
- `lib/supabase/server.ts`
- `lib/supabase/admin.ts`
- `app/auth/callback/route.ts`

## MFA / TOTP / SMS
- `app/api/auth/mfa/enroll/route.ts`
- `app/api/auth/mfa/verify/route.ts`
- `app/api/auth/mfa/challenge-verify/route.ts`
- `app/api/auth/mfa/status/route.ts`
- `app/api/auth/mfa/unenroll/route.ts`
- `app/api/auth/mfa/sms/enroll/route.ts`
- `app/api/auth/mfa/sms/verify/route.ts`
- `lib/security/mfa.ts`
- `lib/security/two-factor-backup-codes.ts`

## Passkeys / WebAuthn
- `app/api/webauthn/register/options/route.ts`
- `app/api/webauthn/register/verify/route.ts`
- `app/api/webauthn/authenticate/options/route.ts`
- `app/api/webauthn/authenticate/verify/route.ts`
- `app/api/webauthn/credentials/route.ts`
- `lib/security/webauthn.ts`
- `app/api/auth/passkey/options/route.ts`
- `app/api/auth/passkey/verify/route.ts`
- `app/api/auth/passkey/register-options/route.ts`
- `app/api/auth/passkey/register/route.ts`
- `app/api/auth/passkey/status/route.ts`
- `app/api/auth/passkey/_lib.ts`
- `supabase/migrations/20260207000000_add_webauthn_tables.sql`
- `supabase/migrations/20260214003000_restore_missing_core_security_tables.sql`

## Authorization / Tenant Boundaries
- `app/api/_lib/middleware.ts`
- `app/api/units/route.ts`
- `app/api/units/[id]/route.ts`
- `app/api/events/route.ts`
- `app/api/events/[id]/route.ts`
- `app/api/deadlines/route.ts`
- `app/api/deadlines/[id]/route.ts`
- `app/api/todos/route.ts`
- `app/api/todos/[id]/route.ts`
- `app/api/notifications/route.ts`
- `app/api/notifications/[id]/route.ts`
- `lib/supabase/schema.sql`
- `supabase/migrations/20260216090000_harden_security_functions.sql`

## Input Validation / Output Safety
- `app/api/_lib/response.ts`
- `app/api/_lib/middleware.ts`
- `app/api/units/route.ts`
- `lib/schemas/auth.ts`
- `app/api/weather/route.ts`
- `app/api/navigate/route.ts`

## CSRF / CORS / Security Headers
- `lib/security/csrf.ts`
- `lib/utils/api.ts`
- `lib/proxy.ts`
- `config/next/next.config.ts`
- `app/api/_lib/middleware.ts`
- `lib/security/csp.ts`
- `lib/security/csp-enhanced.ts`
- `app/api/csp-report/route.ts`

## Rate Limiting / Abuse Prevention
- `lib/services/rateLimitService.ts`
- `lib/security/ip.ts`
- `lib/utils/rate-limit.ts`
- `app/api/security/scan-headers/route.ts`
- `app/api/security/check-password-breach/route.ts`
- `lib/security/password-breach.ts`
- `lib/security/headers-scanner.ts`

## Data Protection / Secrets / Privacy
- `.env.example`
- `.env.local.example`
- `.gitignore`
- `lib/supabase/admin.ts`
- `lib/services/emailService.ts`
- `lib/security/emailVerification.ts`
- `app/api/auth/email/send-verification/route.ts`
- `app/api/auth/email/verify/route.ts`
- `app/api/auth/email/cleanup/route.ts`

## Cache & Client Data Hygiene
- `public/sw.js`
- `lib/utils/clientStorage.ts`
- `lib/utils/serviceWorker.ts`
- `lib/store/profilesStore.ts`
- `app/api/auth/mfa/enroll/route.ts`

## Logging / Monitoring / Audit
- `lib/security/audit.ts`
- `app/api/audit/route.ts`
- `lib/utils/requestLogger.ts`
- `supabase/migrations/20260214002000_restore_log_audit_function.sql`
- `supabase/migrations/20260214003000_restore_missing_core_security_tables.sql`
- `supabase/migrations/20260201084007_add_audit_logging_and_feature_flags.sql`

## Dependency & Supply-Chain Controls
- `package.json`
- `package-lock.json`
- `tools/security/check-secrets.mjs`
- `.github/workflows/ci-cd.yml`
- `.github/workflows/production-deploy.yml`

## Deployment / Operations Hardening
- `.github/workflows/ci-cd.yml`
- `.github/workflows/production-deploy.yml`
- `config/next/next.config.ts`
- `vercel.json`
- `infra/docker/Dockerfile`
- `infra/docker/docker-compose.yml`
- `app/api/health/route.ts`

## Incident Readiness / Recovery Controls
- `app/api/auth/signup/route.ts` (signup kill switch consumption)
- `supabase/migrations/20260201084007_add_audit_logging_and_feature_flags.sql` (`app_config.signup_enabled`)
- `app/api/auth/email/cleanup/route.ts` (cron secret-protected cleanup)
- `vercel.json` (scheduled cleanup)
- `lib/security/session-termination.ts` (helpers present; runtime wiring not evidenced)
- `lib/security/two-factor-backup-codes.ts` (helpers present; runtime wiring not evidenced)

## Historical Security Documentation
- `AGENT.md`
- `CHANGELOG.md`
- `SECURITY.md`
- `public/security.txt`
