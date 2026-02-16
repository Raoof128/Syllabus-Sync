# Resend + Vercel Setup (Email)

This project sends transactional email (email verification and password reset) via **Resend** and is deployed on **Vercel**.

## Required Environment Variables

Set these in Vercel: Project -> Settings -> Environment Variables.

- `RESEND_API_KEY` (secret)
- `VERIFICATION_EMAIL_FROM` (e.g., `onboarding@resend.dev` in development; a verified sender in production)
- `VERIFICATION_EMAIL_NAME` (e.g., `Syllabus Sync`)
- `NEXT_PUBLIC_APP_URL` (recommended; fallback uses `VERCEL_URL`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (secret, required for admin auth operations and distributed rate limiting)
- `CRON_SECRET` (secret, used to protect cron endpoints)

## Vercel CLI (Recommended)

The repo includes pinned Vercel CLI tooling:

```bash
npm run vercel:link
npm run vercel:env:pull
```

### Add/Update Env Vars With Vercel CLI

Example (production):

```bash
vercel env add RESEND_API_KEY production
vercel env add VERIFICATION_EMAIL_FROM production
vercel env add VERIFICATION_EMAIL_NAME production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add CRON_SECRET production
```

Notes:

- `vercel env add` will prompt for the value and does not print it back.
- Prefer setting `NEXT_PUBLIC_APP_URL` to your primary domain (e.g., `https://syllabus-sync.dev`).

### Validate Required Keys Exist On Vercel

This checks **names only** (no secret values):

```bash
VERCEL_ENVIRONMENT=production npm run vercel:env:check
```

## Cron Security

`vercel.json` configures scheduled calls to internal routes (e.g., verification/password-reset token cleanup).

The cleanup route requires:

- `CRON_SECRET` to be set on Vercel
- Requests to include `Authorization: Bearer <CRON_SECRET>`

Vercel Cron Jobs support this header when `CRON_SECRET` is configured.

## Rate Limiting (Production)

This repo includes a distributed rate limiter that prefers (in order):

1. Upstash Redis (recommended at higher traffic): `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
2. Vercel KV (compatible REST env vars): `KV_REST_API_URL`, `KV_REST_API_TOKEN`
3. Supabase Postgres (default fallback if `SUPABASE_SERVICE_ROLE_KEY` is configured)

Avoid setting `ALLOW_MEMORY_RATE_LIMIT` in production.
