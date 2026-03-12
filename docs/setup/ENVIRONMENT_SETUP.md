# Environment And Setup

This guide reflects the current repository structure, scripts, workflows, and route dependencies.

## Runtime Requirements

- Node.js `>=22 <23`
- npm `>=10`
- Supabase project for auth, database, storage, and RPC-backed operations
- Google Cloud project for Google map mode and weather
- Optional Upstash Redis for production-grade distributed rate limiting

## Local Setup

```bash
git clone https://github.com/mrpouyaalavi/syllabus-sync.git
cd syllabus-sync
npm install
cp .env.example .env.local
```

## Environment Variables By Capability

### Core application

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

### Google map mode

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_GOOGLE_MAP_ID`
- `GOOGLE_ROUTES_API_KEY`

These power `/map?view=google`, `/api/maps/routes`, `/api/maps/place-search`, and `/api/maps/place-details`.

### Campus routing

- `ORS_API_KEY`

Used only by `/api/navigate` for campus raster mode.

### Weather

- `GOOGLE_WEATHER_API_KEY`

Used by `/api/weather`.

### Email and cron cleanup

- `RESEND_API_KEY`
- `VERIFICATION_EMAIL_FROM`
- `VERIFICATION_EMAIL_NAME`
- `CRON_SECRET`

`CRON_SECRET` protects:

- `/api/auth/email/cleanup`
- `/api/auth/password/cleanup`
- `/api/security/rate-limit/cleanup`

### WebAuthn and security

- `WEBAUTHN_RP_ID`
- `WEBAUTHN_ORIGIN`
- `CSRF_VALIDATION_ENABLED`

### Production rate limiting

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Database Initialization

Use `supabase/migrations/` as the canonical source of truth.

Recommended workflow:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Legacy schema snapshots under `docs/database/` are reference artifacts, not the primary migration workflow.

## Verification Workflow

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Full local gate:

```bash
npm run check
```

## Route-Specific Smoke Checks

After setup, validate:

1. `/login` loads the public/auth shell.
2. `/home` loads the protected shell.
3. `/settings` redirects to `/settings/general`.
4. `/map` loads campus mode.
5. `/map?view=google` loads Google mode if Google env vars are present.
6. `/api/health` returns success.

## Deployment References

- `vercel.json` defines cron schedules and static header rules.
- `.github/workflows/ci-cd.yml` defines CI validation on `main` and `develop`.
- `.github/workflows/production-deploy.yml` defines the production deployment workflow.
- `infra/docker/README.md` documents the Docker-based runtime path.
