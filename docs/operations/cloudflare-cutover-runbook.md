# Cloudflare Cutover Runbook

> **Audience:** The operator performing the production cutover, with the rollback runbook open.
> **This is never an unattended step.** It requires preview evidence, explicit owner approval, and
> a named operator present.

---

## Pre-cutover gate

Every item must be true before any traffic moves:

- [ ] Migration PR merged and all required checks green
- [ ] Preview parity matrix complete, with every failure resolved and re-run
- [ ] Production Worker deployed and **not** attached to any custom domain
- [ ] Production secrets and variables set and validated with `npm run deploy:env:check`
- [ ] Worker compressed upload below 9.5 MiB, and the Workers Paid plan active if above 2.8 MiB
- [ ] Current Vercel production healthy and retained
- [ ] Sharp reachability gate passing against the exact build being deployed
- [ ] Rollback operator identified and available
- [ ] Owner approval recorded, with date and name

---

## Infrastructure preflight

Before any production Worker or secret operation:

1. Confirm `syllabus-sync.app` is an active zone in the intended Cloudflare account.
2. Export and review the complete DNS record set: apex and `www`, MX, SPF, DKIM, DMARC, CAA,
   verification TXT records, and every non-web subdomain.
3. If authoritative nameservers are not already Cloudflare, stop. Write and validate a separate DNS
   migration runbook, lower relevant TTLs at least 24 hours ahead, and understand DNSSEC status
   before continuing.

Losing an MX or DKIM record during a hosting cutover breaks email delivery, which is far harder to
detect and reverse than a bad web deployment.

---

## 1. Confirm Supabase settings before traffic moves

```text
Site URL: https://www.syllabus-sync.app

Allowed redirect URLs:
https://www.syllabus-sync.app/auth/callback
https://www.syllabus-sync.app/auth/confirm
https://www.syllabus-sync.app/reset-password
https://syllabus-sync.app/auth/callback
https://syllabus-sync.app/auth/confirm
https://syllabus-sync.app/reset-password
```

Do not remove preview URLs until preview testing is finished.

---

## 2. Transfer scheduler ownership without overlap

1. Vercel → **Project Settings → Cron Jobs → Disable Cron Jobs**. Record the exact disable time.
2. Confirm no Vercel invocation starts after that time.
3. Merge the separately reviewed cutover change replacing `env.production.triggers.crons: []` with:

   ```json
   ["0 3 * * *", "10 3 * * *", "20 3 * * *"]
   ```

4. Deploy that exact merged commit:

   ```bash
   npm run cf:deploy:production
   ```

5. Confirm the Cloudflare dashboard lists exactly those three schedules **before** attaching the
   domain.

If any step fails, keep Vercel Cron disabled only long enough to diagnose safely, then re-enable it
before abandoning the cutover. Never leave both schedulers enabled.

---

## 3. Attach the canonical custom domain

1. Open the `syllabus-sync-production` Worker.
2. Add custom domain `www.syllabus-sync.app`.
3. Add `syllabus-sync.app`, or configure an apex-to-`www` redirect rule.
4. Ensure `www` is canonical.
5. Confirm TLS is active.

Do not delete the Vercel project or its deployment.

---

## 4. Verify DNS and TLS

```bash
dig +short www.syllabus-sync.app
curl -I https://www.syllabus-sync.app
curl -I https://syllabus-sync.app
```

Expect HTTPS to succeed, the apex to redirect to `https://www.syllabus-sync.app`, no certificate
error, and security headers present.

---

## 5. Run the smoke suite

```bash
npm run cf:smoke -- https://www.syllabus-sync.app
```

All checks must pass.

---

## 6. Critical authenticated checks

Immediately verify, in this order:

- [ ] Email/password login
- [ ] An **existing production passkey** (the highest-risk item — RP ID or origin drift orphans credentials)
- [ ] MFA challenge
- [ ] One authenticated API read
- [ ] One mutation with CSRF
- [ ] One map route
- [ ] Weather
- [ ] Verification and reset link generation, confirming links point at the canonical origin
- [ ] One push notification

---

## 7. Verify scheduled triggers

Confirm the production Worker dashboard lists exactly:

```text
0 3 * * *
10 3 * * *
20 3 * * *
```

Wrangler has no stable trigger-inspection command. Treat the merged `wrangler.jsonc`, the dashboard
trigger list, and the first successful production Cron Events as the three independent sources.
Invoke handlers manually only in local `workerd` — in production, verify through Cron Events and
Worker logs.

---

## 8. Record completion

Record and store with the release:

- Date and time in Australia/Sydney **and** UTC
- Worker version ID
- DNS and domain change made
- Smoke result
- Authenticated check result
- Operator name
- Rollback deadline

---

## Post-cutover monitoring

Vercel stays available for a **seven-day stability window**. Monitor Worker exceptions, CPU time
and limit failures, status distribution, p50/p95 latency, Sentry client and server errors, Supabase
auth errors, MFA `AUTH_UNAVAILABLE`, Upstash failures, email and push delivery failures, cron
outcomes, CSP reports, scanner DNS errors, and image optimisation errors.

Run the smoke suite daily and record the result. Confirm all three cron jobs succeed at least once.

The migration is stable only when, for seven consecutive days: no unresolved P0/P1 incident, no
auth/passkey/MFA regression, no material 5xx increase, p95 latency acceptable against the Vercel
baseline, all cron jobs succeeding, Sentry source maps resolving, Worker resource limits not
breached, and the smoke suite passing.
