# Deployment Checklist

This checklist reflects the current repository structure and deployment workflows.

## 1. Environment

- [ ] Copy `.env.example` to `.env.local` for local verification
- [ ] Populate required Supabase variables
- [ ] Populate required Google Maps/Routes variables if Google map mode is needed
- [ ] Populate `RESEND_API_KEY` and verification email sender if email flows are needed
- [ ] Populate `CRON_SECRET` for protected cron/cleanup routes
- [ ] Populate Sentry variables if release monitoring is required

See also: [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)

## 2. Database

- [ ] Treat `supabase/migrations/` as the authoritative schema history
- [ ] Review pending migrations before deployment
- [ ] Apply migrations through Supabase CLI or your controlled database rollout path
- [ ] Use `docs/database/database-schema.sql` only as a schema snapshot/reference, not as the canonical deployment sequence

## 3. Static Validation

- [ ] `npm install`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run check:secrets`
- [ ] `npm run check:i18n`
- [ ] `npm run build`

If you want the full local gate:

```bash
npm run check
```

## 4. CI/CD Alignment

Verify the deployment target matches the committed workflows:

- `.github/workflows/ci-cd.yml`
- `.github/workflows/production-deploy.yml`

The production workflow expects Vercel and validates these secrets before deployment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 5. Runtime Verification

- [ ] `GET /api/health` returns `healthy` or an intentional `degraded` state
- [ ] Auth flows work: signup/login/logout/password reset
- [ ] Primary authenticated routes render: `/home`, `/calendar`, `/map`, `/feed`, `/settings/general`
- [ ] Notifications, profiles, and user preferences load for an authenticated user
- [ ] Map routing works for the configured mode:
  - campus mode: `/api/navigate`
  - Google mode: `/api/maps/routes`

## 6. Post-Deploy Checks

- [ ] Confirm the Vercel deployment is serving the expected environment
- [ ] Confirm Sentry DSN and source-map flow if Sentry is enabled
- [ ] Confirm service worker behavior does not serve stale app chunks after deploy
- [ ] Confirm protected cron/cleanup endpoints are using the expected secret header flow

## 7. Things This Checklist Explicitly Avoids

This document intentionally does not repeat older, stale deployment assumptions that no longer match the repository, such as:

- treating `docs/database/database-schema.sql` as the only deployment path
- describing Netlify as an equivalent committed deployment target
- assuming outdated unit/location field mappings without checking the current route handlers
