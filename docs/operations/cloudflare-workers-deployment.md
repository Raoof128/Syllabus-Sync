# Cloudflare Workers Deployment

> **Audience:** Engineers building, verifying, and deploying Syllabus Sync on Cloudflare Workers.
> **Status:** Migration in progress. Vercel remains the live production host and the rollback target.

Syllabus Sync runs as a single Cloudflare Worker produced by `@opennextjs/cloudflare` from the
existing Next.js App Router application. Supabase remains the database and authentication
authority. Nothing about the data layer changes when the host changes.

---

## 1. Local development

Normal application development is unchanged:

```bash
npm run dev
```

To exercise the application in the real Worker runtime (`workerd`) instead of the Node dev server:

```bash
npm run cf:preview
```

| Runtime          | Configuration file       | Tracked? |
| ---------------- | ------------------------ | -------- |
| `next dev`       | `.env.development.local` | No       |
| Wrangler/workerd | `.dev.vars`              | No       |
| Example template | `.dev.vars.example`      | Yes      |

`.dev.vars` must include `NEXTJS_ENV=development` so OpenNext loads development configuration, and
`CRON_SECRET` if you intend to exercise scheduled jobs locally.

---

## 2. Build and verification

```bash
npm run check                                                   # secrets, runtime audit, format, typecheck x2, lint, test, build
npm run cf:build                                                # OpenNext Worker bundle
npm run cf:dry-run                                              # build + Sharp gate + Wrangler dry-run
npm run check:worker-size -- .open-next/wrangler-dry-run.log    # compressed upload budget
npm run cf:smoke -- http://localhost:8787                       # public smoke suite
```

`npm run check` runs the Cloudflare runtime-compatibility audit, which fails the build if a
Node-only API that `workerd` does not implement reappears in the request path.

### Worker size budget

| Threshold | Value   | Effect                     |
| --------- | ------- | -------------------------- |
| Warning   | 2.8 MiB | Workers Paid plan required |
| Hard fail | 9.5 MiB | Deployment blocked         |

**Last measured: 6799.23 KiB gzip (≈6.64 MiB) on 22 July 2026.** This is under the hard limit and
over the free-plan threshold, so **Workers Paid is required**. Re-measure before cutover.

### Sharp reachability gate

`sharp` carries unpatched libvips advisories and must never reach the Worker bundle. Every
`cf:*` command that produces or ships a bundle runs, in order:

1. `cf:build` — produce `.open-next/`
2. `security:sharp:record-reachability` — scan that exact build and record evidence, refusing to
   write anything other than a proven-absent verdict
3. `security:sharp:deployment-gate` — re-verify digests and re-scan independently
4. the deploy, upload, preview, or dry-run action

A blocking verdict requires the package itself — a `node_modules/sharp` or `node_modules/@img/*`
directory, a `sharp`/`libvips` native binary, or a real module specifier inside the bundle graph.
Incidental appearances of the word "sharp" (device brands, HTML entities, CSS class names, font
names) are recorded as non-blocking. Cloudflare image optimisation uses the `IMAGES` binding, not
sharp.

---

## 3. Environment separation

Validate an environment without printing any value:

```bash
npm run deploy:env:check
```

| Variable                          | Build | Runtime | Secret | Preview | Production |
| --------------------------------- | ----- | ------- | ------ | ------- | ---------- |
| `NEXT_PUBLIC_SUPABASE_URL`        | Yes   | Yes     | No     | Yes     | Yes        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Yes   | Yes     | No     | Yes     | Yes        |
| `NEXT_PUBLIC_APP_URL`             | Yes   | Yes     | No     | Yes     | Yes        |
| `NEXT_PUBLIC_SITE_URL`            | Yes   | Yes     | No     | Yes     | Yes        |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Yes   | Yes     | No     | Yes     | Yes        |
| `NEXT_PUBLIC_GOOGLE_MAP_ID`       | Yes   | Yes     | No     | Yes     | Yes        |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`    | Yes   | Yes     | No     | Yes     | Yes        |
| `NEXT_PUBLIC_SENTRY_DSN`          | Yes   | Yes     | No     | Yes     | Yes        |
| `DEPLOYMENT_PLATFORM`             | Yes   | Yes     | No     | Yes     | Yes        |
| `DEPLOYMENT_ENV`                  | Yes   | Yes     | No     | Yes     | Yes        |
| `SUPABASE_SERVICE_ROLE_KEY`       | No    | Yes     | Yes    | Yes     | Yes        |
| `RESEND_API_KEY`                  | No    | Yes     | Yes    | Yes     | Yes        |
| `CRON_SECRET`                     | No    | Yes     | Yes    | Yes     | Yes        |
| `UPSTASH_REDIS_REST_URL`          | No    | Yes     | Yes    | Yes     | Yes        |
| `UPSTASH_REDIS_REST_TOKEN`        | No    | Yes     | Yes    | Yes     | Yes        |
| `GOOGLE_ROUTES_API_KEY`           | No    | Yes     | Yes    | Yes     | Yes        |
| `GOOGLE_WEATHER_API_KEY`          | No    | Yes     | Yes    | Yes     | Yes        |
| `ORS_API_KEY`                     | No    | Yes     | Yes    | Yes     | Yes        |
| `VAPID_PRIVATE_KEY`               | No    | Yes     | Yes    | Yes     | Yes        |
| `VAPID_SUBJECT`                   | No    | Yes     | Yes    | Yes     | Yes        |
| `SENTRY_AUTH_TOKEN`               | Yes   | No      | Yes    | Yes     | Yes        |
| `WEBAUTHN_RP_ID`                  | No    | Yes     | No     | Yes     | Yes        |
| `WEBAUTHN_ORIGIN`                 | No    | Yes     | No     | Yes     | Yes        |
| `CORS_ALLOWED_ORIGINS`            | No    | Yes     | No     | Yes     | Yes        |
| `CSRF_VALIDATION_ENABLED`         | No    | Yes     | No     | Yes     | Yes        |

Build-time and runtime values for every `NEXT_PUBLIC_*` and origin variable must be byte-for-byte
identical, or the client bundle and the Worker will disagree about the application origin.

At least one complete distributed rate-limit backend is required: Upstash Redis (preferred),
Vercel KV, or the Supabase Postgres fallback. `ALLOW_MEMORY_RATE_LIMIT` must never be set in
production.

---

## 4. Production WebAuthn invariants

```text
Canonical origin: https://www.syllabus-sync.app
RP ID:            syllabus-sync.app
Expected origin:  https://www.syllabus-sync.app
```

Changing the RP ID orphans every existing passkey — users would silently lose their credentials
with no recovery path. These values are enforced by `npm run deploy:env:check` in production.

Never test a production passkey against a `workers.dev` hostname. Register separate preview-only
test credentials instead.

---

## 5. Scheduled jobs

Cloudflare Cron Triggers run in **UTC**. The Worker's `scheduled()` handler maps each expression to
the existing `CRON_SECRET`-protected cleanup route and invokes it internally through the OpenNext
fetch handler:

| Cron expression | Route                              |
| --------------- | ---------------------------------- |
| `0 3 * * *`     | `/api/auth/email/cleanup`          |
| `10 3 * * *`    | `/api/auth/password/cleanup`       |
| `20 3 * * *`    | `/api/security/rate-limit/cleanup` |

An unknown expression, a missing `CRON_SECRET`, or a non-successful cleanup throws, so failures
appear in Cron Events and Worker logs rather than being recorded as success.

Both Wrangler environments ship with `triggers.crons: []`. Schedules are activated only by the
separately reviewed cutover change, and only after Vercel Cron has been disabled. **Never leave
both schedulers enabled.**

Test locally:

```bash
npm run cf:dev:scheduled
curl -i 'http://localhost:8787/cdn-cgi/handler/scheduled?cron=0+3+*+*+*'
```

---

## 6. Deploying

Prefer the manually dispatched GitHub workflow, which enforces the quality gate, environment
validation, the Sharp gate, and the size budget before deploying:

**Actions → Deploy Cloudflare Worker → Run workflow → preview | production**

Production additionally requires the `cloudflare-production` GitHub Environment to have owner
approval configured, and can only run from `main`.

The equivalent local commands:

```bash
npm run cf:deploy               # preview
npm run cf:deploy:production    # production
```

Attaching the production custom domain is always a separate operator action. See
[the cutover runbook](./cloudflare-cutover-runbook.md) and
[the rollback runbook](./cloudflare-rollback-runbook.md).
