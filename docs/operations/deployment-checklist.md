# Production Deployment & Release Runbook

This document outlines the mandatory procedures and quality gates for deploying Syllabus Sync to production. We follow a **Stable-by-Default** release strategy, ensuring that every deployment is verifiable and reversible.

---

## 1. Pre-Flight Environment Validation

Before initiating a release, ensure the following environment variables are correctly configured in your production provider (e.g., Vercel):

- [ ] **Database:** `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] **Infrastructure:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- [ ] **Email:** `RESEND_API_KEY`, `RESEND_SENDER_EMAIL`
- [ ] **Security:** `CRON_SECRET` (Minimum 32 chars), `NEXT_PUBLIC_APP_URL`
- [ ] **Observability:** `SENTRY_DSN` (Must be active and configured for the `production` environment)

_Refer to the [Environment Setup Guide](../setup/ENVIRONMENT_SETUP.md) for variable specifications._

---

## 2. Database Migration Sequence

We treat database schema changes as immutable, versioned migrations.

1. **Review Schema:** Audit `supabase/migrations/` for any pending SQL scripts.
2. **Execution:** Apply migrations using the Supabase CLI:
   ```bash
   npx supabase db push
   ```
3. **Verification:** Confirm migration success via the Supabase Dashboard.
   _Warning: Never use `database-schema.sql` for deployment; it is a reference snapshot only._

---

## 3. The Quality Gate (`npm run check`)

Every production release must pass the local system integrity check. This ensures zero regressions in type safety, linting, and behavioral tests.

```bash
npm run check
```

**Success Criteria:**

- 0 ESLint errors or warnings.
- 0 TypeScript compilation errors.
- 100% passing Vitest unit and integration tests.
- Successful Next.js production build.

---

## 4. Deployment Execution (Vercel)

We utilize Vercel's immutable deployment model.

1. **Trigger Build:** Push to the `main` branch or use the Vercel CLI:
   ```bash
   vercel --prod
   ```
2. **Build Monitoring:** Observe the Sentry dashboard for any "Build Error" or "Source Map" alerts.
3. **Atomic Cutover:** Vercel automatically handles the traffic shift once health checks pass.

---

## 5. Post-Deployment Verification (Smoke Tests)

Execute the following checks against the live production URL:

- **Health Check:** `GET /api/health` should return `200 OK`.
- **Auth Cycle:** Perform a full Signup -> MFA Enroll -> Logout -> Login cycle.
- **Route Integrity:** Verify `/home`, `/calendar`, `/map`, and `/feed` render without client-side exceptions.
- **Security Headers:** Run a `curl -I` and verify `Content-Security-Policy` and `Strict-Transport-Security` are present.

---

## 6. Incident Response & Rollback

If critical regressions are detected post-deploy:

1. **Immediate Rollback:** Use the Vercel Dashboard to redeploy the previous known-stable build. This shift is instantaneous and does not require a new build.
2. **Audit Logs:** Review the `audit_logs` table and Sentry issues to identify the root cause.
3. **Post-Mortem:** Document the failure in a new report under `docs/reports/`.

---

_For a detailed mapping of routes, refer to the [Route Inventory](../inventory/ROUTE_INVENTORY.md)._
