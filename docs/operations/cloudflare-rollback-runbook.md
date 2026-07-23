# Cloudflare Rollback Runbook

> **Audience:** The on-call operator during a Cloudflare Workers incident.
> Read the stop conditions first, decide which of the two rollback paths applies, then execute.

Both platforms use the same Supabase backend, so **a hosting rollback does not require a database
rollback**. This assumption is invalidated by any schema change or irreversible data migration
shipped alongside the cutover — re-check before relying on it.

---

## Stop conditions

Roll back immediately if any of these is true:

- Production login unavailable for more than five minutes
- Existing production passkeys failing due to RP ID or origin mismatch
- MFA bypass or any fail-open behaviour
- CSRF enforcement absent
- A protected API returning data without authentication
- Persistent Worker 5xx above the agreed incident threshold
- Worker size or resource limits blocking deployment
- Critical cron jobs failing repeatedly
- Secrets appearing in logs or the client bundle

Do not deliberate on the security items. Roll back, then investigate.

---

## Path A — Worker code rollback

Use when the Cloudflare platform is healthy but the latest Worker version is bad.

```bash
npx wrangler deployments list --env production
npx wrangler rollback --env production
```

Select the last known-good version. Cloudflare creates a new active deployment at 100% traffic.

Verify:

```bash
npm run cf:smoke -- https://www.syllabus-sync.app
```

A Worker rollback reverts **code only**. It does not roll back Supabase data, Upstash state, Resend
delivery, or any external resource.

---

## Path B — Platform rollback to Vercel

Use when the Worker platform path itself is bad.

### B1. Transfer scheduler ownership back first

1. Remove or disable the three Cloudflare Cron Triggers.
2. Confirm the Cloudflare dashboard shows no active schedules.
3. Re-enable Vercel Cron Jobs.
4. Confirm the next Vercel invocation succeeds.

Never leave both schedulers enabled, even though the cleanup routines are safe to retry.

### B2. Move traffic

1. Detach `www.syllabus-sync.app` and the apex from `syllabus-sync-production`.
2. Reattach the domains to the retained Vercel project, or restore the prior DNS target.
3. Verify:

   ```bash
   npm run cf:smoke -- https://www.syllabus-sync.app
   ```

4. Confirm login, an existing passkey, MFA, one protected API, email links, and push.
5. Leave Supabase, Upstash, Resend, Google APIs, and the database untouched.

DNS propagation is not instant. Expect a period where both origins receive traffic; this is safe
because both serve the same application against the same backend, provided only one scheduler is
enabled.

---

## Incident record

Capture, while it is fresh:

- Trigger condition
- Detection time
- Rollback time
- Affected Worker version
- Affected feature
- Log excerpts, with secrets redacted
- User impact
- Root cause
- Fix PR
- Re-cutover criteria

---

## Re-cutover

Do not re-attempt the cutover until the root cause has a merged fix, the preview parity matrix has
been re-run against that fix, and owner approval has been recorded again. A second failed cutover
costs far more trust than a delayed one.
