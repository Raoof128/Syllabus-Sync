# Cloudflare Preview Test Record

> **Status: TEMPLATE — not yet executed.** No preview environment exists at the time of writing.
> This record must be completed against a deployed preview Worker before production cutover is
> approved. No item may be marked passed on the strength of a successful build alone.
>
> A failed item must record: reproduction steps, a Worker log excerpt with secrets redacted, the
> linked fix commit, and the re-run result.

- Commit:
- Worker version:
- Preview origin:
- Supabase project (staging or production-with-approval):
- Tested at:
- Tester:

---

## Automated

- [ ] `npm run check`
- [ ] `npm run check:i18n`
- [ ] `npm run cf:build`
- [ ] `npm run cf:dry-run`
- [ ] `npm run check:worker-size -- .open-next/wrangler-dry-run.log`
- [ ] `npm run cf:smoke -- "$PREVIEW_ORIGIN"`

## Authentication

- [ ] Email/password signup
- [ ] Email verification
- [ ] Email/password login
- [ ] Logout
- [ ] Expired refresh-token recovery
- [ ] Reset-password request
- [ ] Reset-password completion
- [ ] Google OAuth callback, when enabled
- [ ] Unverified account redirected to `/verify`
- [ ] Authenticated user redirected away from `/login`

## MFA

- [ ] TOTP enrolment
- [ ] TOTP challenge
- [ ] Invalid challenge rejected
- [ ] Protected page redirects to MFA challenge when AAL2 required
- [ ] Protected API returns `MFA_REQUIRED`
- [ ] MFA resolution failure returns `AUTH_UNAVAILABLE`
- [ ] MFA unenrol remains fail-closed

## WebAuthn

> Register **preview-only** credentials. Never test a production passkey against `workers.dev`.

- [ ] Register preview-only passkey
- [ ] Authenticate with preview-only passkey
- [ ] Registration without session rejected
- [ ] Authentication options remain public
- [ ] Origin mismatch rejected
- [ ] RP ID mismatch rejected

## Security controls

- [ ] CSP nonce changes per HTML request
- [ ] CSP blocks unauthorised inline script
- [ ] CSRF cookie is `__Host-`, Secure, Path `/`, no Domain
- [ ] Missing CSRF header rejected on protected mutation
- [ ] Cross-origin mutation rejected
- [ ] `cf-connecting-ip` drives anonymous rate-limit identity
- [ ] Spoofed `x-forwarded-for` does not override the Cloudflare IP
- [ ] Critical rate limiter fails closed when Upstash and Supabase are both unavailable
- [ ] Supabase RLS prevents cross-user access
- [ ] Service-role key absent from the client bundle
- [ ] No secrets in Worker logs

## Core application

- [ ] Dashboard
- [ ] Calendar read
- [ ] Calendar create/update/delete
- [ ] Units read/sync
- [ ] Deadlines create/update/delete
- [ ] Todos create/update/delete
- [ ] Feed/events
- [ ] Profiles
- [ ] Preferences
- [ ] Gamification
- [ ] Notifications
- [ ] Offline/PWA reload
- [ ] Service worker update

## Maps and weather

- [ ] Leaflet map
- [ ] Google Maps JavaScript loader
- [ ] Google Routes server proxy
- [ ] ORS navigation server proxy
- [ ] Weather server proxy
- [ ] Geofence behaviour
- [ ] SSRF scanner rejects private targets
- [ ] Security header scanner accepts a public target

## Email and push

- [ ] Verification email
- [ ] Password reset email
- [ ] Email links use the preview origin
- [ ] Push subscription create
- [ ] Push notification delivery
- [ ] Invalid push subscription cleanup (404/410 removed)
- [ ] `VAPID_PRIVATE_KEY` absent from logs

## Scheduled jobs

> Local `workerd` has already proven cron routing, `CRON_SECRET` authentication, CSRF pass-through,
> and visible failure on an unknown expression. What remains unproven is a **successful 200 cleanup
> against a real Supabase project** — that is what these items must establish.

- [ ] Email-token cleanup returns 200 and deletes expected rows
- [ ] Password-token cleanup returns 200 and deletes expected rows
- [ ] Rate-limit cleanup returns 200 and deletes expected rows
- [ ] Wrong `CRON_SECRET` rejected with 401
- [ ] Unknown cron expression fails visibly in Cron Events

## Observability

- [ ] Worker logs available
- [ ] Sentry client exception captured
- [ ] Sentry server exception captured
- [ ] Source maps resolve
- [ ] No repeated auth timeout noise
- [ ] No cross-request I/O error

## Performance

Capture five cold and twenty warm requests for `/`, `/login`, and `/api/health` against both
origins:

```bash
for path in / /login /api/health; do
  for run in $(seq 1 20); do
    curl -sS -o /dev/null \
      -w "$path run=$run status=%{http_code} total=%{time_total}\n" \
      "https://www.syllabus-sync.app$path"
  done
done | tee /tmp/vercel-baseline.txt
```

Repeat against `$PREVIEW_ORIGIN` into `/tmp/cloudflare-preview.txt`.

- [ ] Home p95 acceptable versus the Vercel baseline
- [ ] Login p95 acceptable versus the Vercel baseline
- [ ] API p95 acceptable versus the Vercel baseline
- [ ] Worker CPU limit not exceeded
- [ ] Worker compressed upload below 9.5 MiB
- [ ] Lighthouse budgets not regressed

---

## Known items carried into this record

| Item                   | Detail                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| Workers Paid required  | Measured compressed upload is 6799.23 KiB, about 2.4x the 2.8 MiB free-plan threshold.         |
| Cron 200 path unproven | Local testing used placeholder Supabase credentials, so cleanup returned 503 `Not configured`. |
| Image optimisation     | Uses the Cloudflare `IMAGES` binding; confirm transformation billing is accepted.              |
