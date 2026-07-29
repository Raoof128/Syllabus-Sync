# Reference Baseline

**Retrieved:** 2026-07-29 (Australia/Sydney)

## Status of external documentation retrieval

The master prompt (§4) requires re-checking current official documentation for
Cloudflare Workers/OpenNext, Next.js Route Handlers and Proxy, Supabase SSR, and
Supabase RLS before making framework-specific assumptions.

**This retrieval has not yet been performed in this audit segment.** No
framework-specific assumption has been acted on, and no code has been changed on
the basis of assumed framework behaviour. The only source changes so far are the
two baseline repairs documented in `starting-state.md`, both of which are
verified against in-repository evidence (`lib/cloudflare/scheduled.ts` and the
existing test assertions) rather than against external documentation.

Pending URLs to retrieve and record deltas from:

- https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- https://opennext.js.org/cloudflare
- https://opennext.js.org/cloudflare/howtos/custom-worker
- https://opennext.js.org/cloudflare/howtos/workerd
- https://nextjs.org/docs/app/getting-started/route-handlers
- https://nextjs.org/docs/app/getting-started/proxy
- current official Next.js security/authentication guidance
- https://supabase.com/docs/guides/auth/server-side
- https://supabase.com/docs/guides/database/postgres/row-level-security

## In-repository versions this audit is pinned to

| Package                  | Version  |
| ------------------------ | -------- |
| `next`                   | 16.2.11  |
| `@opennextjs/cloudflare` | 1.20.2   |
| `wrangler`               | 4.113.0  |
| `@supabase/ssr`          | 0.8.0    |
| `@supabase/supabase-js`  | 2.104.1  |
| `@simplewebauthn/server` | 13.3.0   |
| `sharp`                  | 0.34.5   |
| Node                     | v22.16.0 |

Wrangler self-reports an available upgrade to 4.115.0; not applied during audit.
