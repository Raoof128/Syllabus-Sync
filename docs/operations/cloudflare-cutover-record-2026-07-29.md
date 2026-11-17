# Cloudflare Cutover Record — 2026-07-29

> Completed record for the production cutover of Syllabus Sync from Vercel to
> Cloudflare Workers. Retain with the release.

## Timing

| Event                             | Australia/Sydney         | UTC                  |
| --------------------------------- | ------------------------ | -------------------- |
| Vercel Cron disabled              | 2026-07-29 16:31:41 AEST | 2026-07-29T06:31:41Z |
| Cloudflare cron triggers deployed | 2026-07-29 16:33 AEST    | 2026-07-29T06:33Z    |
| Custom domain attached            | 2026-07-29 16:34:17 AEST | 2026-07-29T06:34:17Z |
| Verification complete             | 2026-07-29 16:35 AEST    | 2026-07-29T06:35Z    |

DNS gap between deleting the Vercel `CNAME` and the Workers custom domain
creating its own record: **0.9 seconds**.

## Identifiers

- Worker: `syllabus-sync-production`
- Worker version ID: `2e584cab-591e-4537-b6cd-cf2475d63fb4`
- Custom domain ID: `dcc47c21057702b9851694f67bbfacb21659ad54`
- Cloudflare account: `d630de5216d2cdc67a6497b7fc709ea4`
- Zone: `syllabus-sync.app` (`896915eb7d6a09165f73ffbb5141a42a`)
- Cutover commit: `7b5fdcd8` — activated production cron triggers
- Compressed upload: 6776.32 KiB gzip (limit 9.5 MiB; Workers Paid active)

## DNS change

`www.syllabus-sync.app` `CNAME` → `d7d1c31a817c29cd.vercel-dns-017.com`
(record `b7cce34a2feaf709ef24b6cc815725dc`) was deleted, and the Workers custom
domain created its own record in the same zone. Restoring that CNAME is the
traffic rollback.

## Verification results

| Check                              | Result                                             |
| ---------------------------------- | -------------------------------------------------- |
| `dig www.syllabus-sync.app`        | Cloudflare (`172.67.175.232`, `104.21.64.36`)      |
| Response origin                    | `server: cloudflare`, `cf-ray: …-SYD`              |
| HTTPS                              | 200, certificate valid (`ssl_verify_result=0`)     |
| `npm run cf:smoke`                 | **9/9 passed**                                     |
| `/api/health`                      | `{"status":"healthy","database":"connected"}`      |
| Security headers, dynamic route    | 5 present, each exactly once                       |
| Security headers, static asset     | 4 present                                          |
| Cron triggers on production Worker | `0 3 * * *`, `10 3 * * *`, `20 3 * * *`            |
| Scheduler overlap                  | none — Vercel disabled before Cloudflare activated |

## Outstanding

- **Apex `syllabus-sync.app` is still served by Vercel.** It returns
  `308 → https://www.syllabus-sync.app/`, so user-facing behaviour is correct
  and `www` remains canonical, but the apex still depends on the Vercel project.
  It must be moved to a Cloudflare redirect rule (or attached to the Worker)
  before Vercel is decommissioned.
- **The preview parity matrix in `cloudflare-preview-test-record.md` was never
  executed.** Cutover proceeded on owner instruction with that gate unmet.
  Authenticated flows — email/password login, existing production passkeys, MFA
  challenge, authenticated API reads, CSRF-protected mutations, verification and
  reset email links, and push delivery — remain **unverified on Workers** and
  must be exercised manually now that traffic is live.
- Feature-gated variables absent in production: `GOOGLE_ROUTES_API_KEY`,
  `GOOGLE_WEATHER_API_KEY`, `SENTRY_AUTH_TOKEN`. Google route proxy, the weather
  widget, and Sentry source-map upload are unavailable. Vercel production also
  lacked these, so this is parity, not a regression.

## Rollback

Vercel remains deployed and is the rollback target for a seven-day stability
window ending **2026-08-05**. See `cloudflare-rollback-runbook.md`. Path B
requires disabling the three Cloudflare cron triggers, re-enabling Vercel Cron,
and restoring the `www` CNAME recorded above.
