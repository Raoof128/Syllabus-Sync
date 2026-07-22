# Sharp Advisory Risk Gate for Cloudflare Migration

**Status:** Local migration work may continue. Cloudflare preview, upload, public deployment, and production cutover are prohibited.

**Owner decision (2026-07-22, Australia/Sydney):** Do not force Sharp 0.35.3, run `npm audit fix --force`, or downgrade Next.js. Reassess upstream compatibility and Worker bundle reachability before any deployment.

## Recorded advisory

The only accepted Sharp exception is GitHub advisory [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj), npm audit source `1124066`:

| Field                     | Recorded value                                                           |
| ------------------------- | ------------------------------------------------------------------------ |
| npm package               | `sharp`                                                                  |
| Severity                  | High                                                                     |
| Vulnerable Sharp range    | `<0.35.0`                                                                |
| Patched Sharp range       | `>=0.35.0`                                                               |
| Installed Sharp           | `0.34.5`                                                                 |
| Inherited libvips CVEs    | `CVE-2026-33327`, `CVE-2026-33328`, `CVE-2026-35590`, `CVE-2026-35591`   |
| Vulnerable installed node | `node_modules/sharp`                                                     |
| Full audit                | Present; six High propagation entries in a total of 16 findings          |
| Production-only audit     | Present; the same six High propagation entries in a total of 13 findings |

The exact propagated audit paths, all present in both audit files, are:

| Audit package            | Vulnerable range                                 | Via                                       | Installed node                        |
| ------------------------ | ------------------------------------------------ | ----------------------------------------- | ------------------------------------- |
| `sharp`                  | `<0.35.0`                                        | source `1124066`                          | `node_modules/sharp`                  |
| `next`                   | `9.5.6-canary.0 - 10.0.7 \|\| >=14.3.0-canary.0` | `sharp`                                   | `node_modules/next`                   |
| `miniflare`              | `<=0.0.0-fec45ed61 \|\| >=4.20250508.3`          | `sharp`                                   | `node_modules/miniflare`              |
| `wrangler`               | `<=0.0.0-7ae5dd357 \|\| >=4.16.0`                | `miniflare`                               | `node_modules/wrangler`               |
| `@opennextjs/aws`        | `>=3.9.13`                                       | `next`                                    | `node_modules/@opennextjs/aws`        |
| `@opennextjs/cloudflare` | `0.3.0 - 0.6.6 \|\| >=1.2.0`                     | `@opennextjs/aws`, `next`, and `wrangler` | `node_modules/@opennextjs/cloudflare` |

The installed dependency ancestry is also fixed by the gate:

- `next@16.2.11 -> optional sharp@0.34.5` (`next` declares `^0.34.5`)
- `wrangler@4.113.0 -> miniflare@4.20260721.0 -> sharp@0.34.5` (both edges are exact)

## Exploit conditions and constraints

The upstream Sharp advisory applies when Sharp before 0.35.0 processes untrusted input. Its inherited libvips issues are:

- `CVE-2026-33327`: malformed VIPS dimensions can cause integer overflow and a heap-based buffer overflow.
- `CVE-2026-33328`: malformed GIF dimensions can cause integer overflow on 32-bit systems.
- `CVE-2026-35590`: malformed EXIF tag groups can cause an out-of-bounds read/null-pointer crash.
- `CVE-2026-35591`: a crafted JPEG/JPEG2000 tile within a TIFF can cause a heap-based buffer overflow.

The current repository evidence proves dependency presence, not Worker exploitability. The Node 22 OpenNext build stops before output because `open-next.config.ts` has not yet been created by the migration. Therefore `.open-next` and an esbuild metafile do not exist, so no claim that Sharp is absent from the Worker can be made. Reachability is `unproven`, which is a deployment-blocking proof gap.

Forcing `sharp@0.35.3` would violate Miniflare's exact `0.34.5` constraint and Next's `<0.35.0` compatible range. npm's force plan downgrades Next to `14.2.35`. Neither is an approved remediation.

## Gates

`npm run security:sharp:audit-exception` is the local-work gate. It accepts only the recorded advisory source, metadata, maximum severity, vulnerable ranges, audit nodes, and dependency ancestry. It fails closed on missing/malformed evidence, drift, a new source, increased severity, or expiry. Passing it does not approve deployment and does not suppress unrelated npm audit findings.

`npm run security:sharp:deployment-gate` runs the audit exception checks and additionally requires valid, completed-build evidence that Sharp, libvips, and `@img` artifacts are proven absent from the Worker bundle and metafile. It verifies SHA-256 digests of the reviewed output tree and metafile against the just-built files, preventing stale evidence from authorizing a changed bundle. `unproven` or `proven-reachable` both fail. All Cloudflare preview, upload, and deploy scripts run the build first, then this gate, and only then the requested deployment action; a failed build or gate cannot reach the action.

The exception is valid through **2026-08-22 Australia/Sydney** and fails at `2026-08-23T00:00:00+10:00` even if nothing else changes.

## Exact unblock conditions

Before preview, upload, public deployment, or production cutover:

1. Upgrade through compatible Next/OpenNext/Wrangler/Miniflare releases that resolve Sharp to a patched version without a forced override or Next downgrade, then recapture and review both npm audits and the dependency paths; **or** retain the unchanged time-limited exception while completing the remaining conditions.
2. Complete `npm run cf:build` under Node 22 with non-secret build-safe values.
3. Search the generated `.open-next` output for `sharp`, `libvips`, and `@img`, inspect the OpenNext/esbuild metafile, and record `proven-absent` evidence. Any reachable match remains a hard block.
4. Pass the focused tests, secret scan, formatting, typecheck, local audit exception, and deployment gate before invoking a Cloudflare preview/upload/deploy script.

Evidence is tracked in `artifacts/security/`. Refreshing it is a security review task; do not hand-edit evidence to make a gate pass.
