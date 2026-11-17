# Development dependency advisory status

**Status, 17 November 2026.** After the lockfile update that came with the merge of the backend security work, `npm audit --omit=dev --audit-level high` passes (5 moderate advisories in production dependencies, none high or critical), and the full audit reports 22 moderate and 1 low, none high or critical. The chain described below no longer appears as high severity. The text that follows is the 3 October 2026 note, kept for the reasoning about not force-downgrading.

As of 2026-10-03 the production dependency audit reported zero vulnerabilities and the full audit reported five high-severity package entries in one development-only chain:

`eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`.

The reported `braces` issue is stack exhaustion from deeply nested patterns. These packages run in lint tooling, not in the deployed application bundle. `npm audit fix --force` proposes downgrading the Next.js ESLint plugin and config to 14.2.35, which is a breaking major mismatch with the app's Next.js 16 line. Do not apply that downgrade solely to clear the audit count. Recheck upstream patched versions and the full audit during routine dependency updates.

Vitest and Wrangler were updated to patched releases within their major lines, and the remaining compatible transitive audit fixes were applied. `npm ci` lockfile consistency, tests and both production builds are part of the validation gate.
