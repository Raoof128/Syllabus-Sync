# Production Deployment Runbook

> **Audience:** Engineers performing production releases of Syllabus Sync.
> **Last verified:** 2026-03-21

This runbook covers every step required to ship a release safely, verify it in production, and roll back if something goes wrong. Follow each section in order.

---

## Prerequisites

Before starting a release, confirm the following:

- You have write access to the `main` branch and the Vercel project.
- The Supabase CLI is installed and linked to the production project (`npx supabase link`).
- You have access to the Vercel Dashboard, Sentry Dashboard, and Supabase Dashboard.
- You are working from a clean `main` branch with all changes merged.

---

## 1. Environment Variable Audit

Open the Vercel project settings and confirm that every required variable is present for the **production** environment. Missing or stale values are the most common cause of post-deploy incidents.

| Category      | Variables                                                                                    | Notes                                                                  |
| :------------ | :------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| Database      | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`     | Service role key is server-side only.                                  |
| Rate Limiting | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `KV_REST_API_URL`, `KV_REST_API_TOKEN` | KV variables required by the production env check script.              |
| Email         | `RESEND_API_KEY`, `VERIFICATION_EMAIL_FROM`, `VERIFICATION_EMAIL_NAME`                       | Sender must be a verified domain in production.                        |
| Maps          | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAP_ID`, `GOOGLE_ROUTES_API_KEY`      | See the [Google Maps Platform Setup](./google-maps-platform-setup.md). |
| Security      | `CRON_SECRET` (min 32 chars), `NEXT_PUBLIC_APP_URL`, `CSRF_VALIDATION_ENABLED`               | Generate CRON_SECRET with `openssl rand -hex 32`.                      |
| WebAuthn      | `WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGIN`                                                          | Must match your production domain.                                     |
| Push          | `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`                         | Generate once with `npx web-push generate-vapid-keys`.                 |
| Observability | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`                | DSN must be active for the production environment.                     |

You can also validate variable names programmatically:

```bash
VERCEL_ENVIRONMENT=production npm run vercel:env:check
```

Refer to the [Environment Setup Guide](../setup/ENVIRONMENT_SETUP.md) for full variable specifications.

---

## 2. Database Migrations

Database schema changes are managed as timestamped, immutable SQL migration files in `supabase/migrations/`.

**Step 1 -- Review pending migrations:**

```bash
ls -lt supabase/migrations/ | head -20
```

Read through any migration files that have not yet been applied to production. Confirm that they are safe, idempotent, and do not drop data without a backup plan.

**Step 2 -- Apply migrations:**

```bash
npx supabase db push
```

**Step 3 -- Verify in the Supabase Dashboard:**

Open the SQL Editor or Table Editor and confirm that the expected tables, columns, RLS policies, and functions are present.

> **Warning:** The file `docs/database/database-schema.sql` is a reference snapshot only. Never use it to apply schema changes in production. The migration chain in `supabase/migrations/` is the single source of truth.

---

## 3. Quality Gate

Every production release must pass the full local integrity check before deployment. This runs secrets scanning, formatting checks, TypeScript compilation, ESLint, the Vitest test suite, and a production build.

```bash
npm run check
```

**All of the following must be true before proceeding:**

- [ ] Zero ESLint errors or warnings
- [ ] Zero TypeScript compilation errors
- [ ] All Vitest unit and integration tests pass (500+ tests)
- [ ] Next.js production build completes without errors
- [ ] No secrets detected in source files

If any check fails, fix the issue and re-run `npm run check` before continuing.

### 3.1 Cloudflare Sharp hard stop

Cloudflare preview, upload, deployment, and production cutover are blocked by the time-limited [Sharp advisory risk gate](../security/sharp-cloudflare-risk-gate.md). This is separate from the normal quality gate.

```bash
npm run security:sharp:audit-exception
npm run security:sharp:deployment-gate -- preview
npm run security:sharp:deployment-gate -- production
```

- [ ] The local audit-exception gate accepts only the recorded `GHSA-f88m-g3jw-g9cj` / source `1124066` evidence and has not expired.
- [ ] The matching Node 22 preview or production OpenNext build completed, and the gate independently scanned its current `.open-next` output plus every discovered esbuild metafile for `sharp`, `libvips`, and `@img`.
- [ ] Worker reachability is recorded as `proven-absent`; `unproven` and `proven-reachable` are both deployment failures.
- [ ] No forced Sharp override, `npm audit fix --force`, or Next.js downgrade was used.

The current preview evidence is `unproven` because the OpenNext build is blocked before output by the not-yet-implemented `open-next.config.ts` migration task; the production build was not attempted and is separately `unproven`. Local migration source work may continue after the audit-exception gate passes, but **do not run or bypass any `cf:preview`, `cf:upload*`, `cf:deploy*`, `cf:dev:scheduled`, or `cf:dry-run*` command** until all four items above are satisfied.

---

## 4. Deploy to Production

Syllabus Sync uses Vercel's immutable deployment model. Each deployment is an atomic snapshot that can be rolled back to instantly.

**Option A -- Git-triggered deploy (recommended):**

Push to the `main` branch. Vercel will build and deploy automatically.

```bash
git push origin main
```

**Option B -- CLI deploy:**

```bash
npx vercel --prod
```

Monitor the build in the Vercel Dashboard. Watch for:

- Build errors in the Vercel build log
- Source map upload failures in the Sentry release
- Function size warnings

---

## 5. Post-Deployment Smoke Tests

Run these checks against the live production URL immediately after the deployment completes.

### 5.1 Health Check

```bash
curl -s -o /dev/null -w "%{http_code}" https://your-production-domain.vercel.app/api/health
# Expected: 200
```

### 5.2 Security Headers

```bash
curl -sI https://your-production-domain.vercel.app | grep -iE "content-security-policy|strict-transport-security|x-frame-options|x-content-type-options"
```

Confirm that `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, and `X-Content-Type-Options` headers are all present.

### 5.3 Authentication Cycle

1. Open the production URL in an incognito browser window.
2. Sign up with a new test account (or use an existing test account).
3. Complete MFA enrollment if enabled.
4. Log out.
5. Log back in and confirm session is established.

### 5.4 Core Route Verification

Navigate to each of the following routes and confirm they render without client-side errors (check the browser console):

- `/home`
- `/calendar`
- `/map` (both raster and Google modes)
- `/feed`

### 5.5 Cron Endpoint Validation

Confirm that cron-protected endpoints reject unauthenticated requests:

```bash
curl -s -o /dev/null -w "%{http_code}" https://your-production-domain.vercel.app/api/auth/email/cleanup
# Expected: 401 (no Bearer token provided)
```

---

## 6. Monitoring Verification

After deployment, confirm that observability systems are receiving data:

- [ ] **Sentry:** New release appears in the Sentry Releases page. No new unhandled exceptions in the first 15 minutes.
- [ ] **Vercel Analytics:** Function invocations and Web Vitals data are flowing.
- [ ] **Supabase Dashboard:** Database connections are healthy. No unexpected spikes in query latency.

---

## 7. Rollback Procedure

If a critical regression is detected after deployment:

### Immediate Rollback (< 2 minutes)

1. Open the Vercel Dashboard and navigate to the **Deployments** tab.
2. Find the previous known-stable deployment (the one immediately before the current release).
3. Click the three-dot menu and select **Promote to Production**.
4. Vercel shifts traffic instantly -- no rebuild required.

### Database Rollback

If the regression was caused by a database migration:

1. Write and test a compensating migration that reverses the problematic changes.
2. Apply it with `npx supabase db push`.
3. Never manually edit production tables through the Supabase Dashboard without a documented reason.

### Post-Incident

1. Review the `audit_logs` table and Sentry error stream to identify the root cause.
2. Document the incident, root cause, and remediation steps.
3. If the fix is ready, go back to Step 3 (Quality Gate) and re-deploy.

---

## Quick Reference

```text
Pre-deploy:   npm run check              # Must pass cleanly
Deploy:       npx vercel --prod           # Or push to main
Smoke test:   curl /api/health            # Must return 200
Rollback:     Vercel Dashboard > Promote previous deployment
Migrations:   npx supabase db push        # Apply pending SQL
Env check:    VERCEL_ENVIRONMENT=production npm run vercel:env:check
```

---

## Cloudflare Workers (migration in progress)

The production host is migrating from Vercel to Cloudflare Workers. Until the seven-day stability
window closes, **Vercel remains the rollback target and must not be deleted**.

For Worker builds, environment separation, the Sharp reachability gate, scheduled jobs, and
deployment, follow [Cloudflare Workers Deployment](./cloudflare-workers-deployment.md).

For the production cutover and rollback procedures, follow the
[cutover runbook](./cloudflare-cutover-runbook.md) and the
[rollback runbook](./cloudflare-rollback-runbook.md). Preview evidence is recorded in the
[preview test record](./cloudflare-preview-test-record.md).

Cloudflare-specific facts that differ from the Vercel procedure above:

- Cron is owned by the Worker's `scheduled()` handler, not `vercel.json`. Never enable both.
- The client IP comes from `cf-connecting-ip`; caller-supplied `x-forwarded-for` is not trusted.
- Cron Triggers run in UTC.
- The Worker compressed upload must stay below 9.5 MiB. Last measured 6799.23 KiB, which is above
  the 2.8 MiB free-plan threshold, so **Workers Paid is required**.
