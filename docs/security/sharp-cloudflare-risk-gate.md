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

The owner-approved package provenance is fail-closed against `package-lock.json`:

| Package                         | Exact registry tarball                                                      | Exact integrity                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `next@16.2.11`                  | `https://registry.npmjs.org/next/-/next-16.2.11.tgz`                        | `sha512-B339zaqbyK8cmxhoAvLrcwoabwCP1wz21zSzfqxqXAemTu2BXnH7tQnfcglKv1vnMUIDBc+Hth7XODQriTZiRQ==` |
| `@opennextjs/cloudflare@1.20.2` | `https://registry.npmjs.org/@opennextjs/cloudflare/-/cloudflare-1.20.2.tgz` | `sha512-iFBjABnaDk3be27F5EpxyMLMGPbVnnArFx5I3Y8Rf6BSx5nBV8h0UuJiMKrx3+whDU5ahIy4d8sfbvWvMiF1Kg==` |
| `wrangler@4.113.0`              | `https://registry.npmjs.org/wrangler/-/wrangler-4.113.0.tgz`                | `sha512-ROGzSloJv0y21It6Oc9LaruNcu1tdiQ/XzL3Jc3YkFjzXEMXzTqVhA8vQaGMTdZHTjFP0PVcwAHNgaw3gXu4wA==` |

## Exploit conditions and constraints

The upstream Sharp advisory applies when Sharp before 0.35.0 processes untrusted input. Its inherited libvips issues are:

- `CVE-2026-33327`: malformed VIPS dimensions can cause integer overflow and a heap-based buffer overflow.
- `CVE-2026-33328`: malformed GIF dimensions can cause integer overflow on 32-bit systems.
- `CVE-2026-35590`: malformed EXIF tag groups can cause an out-of-bounds read/null-pointer crash.
- `CVE-2026-35591`: a crafted JPEG/JPEG2000 tile within a TIFF can cause a heap-based buffer overflow.

The current repository evidence proves dependency presence, not Worker exploitability. The Node 22 OpenNext build stops before output because `open-next.config.ts` has not yet been created by the migration. Therefore `.open-next` and an esbuild metafile do not exist, so no claim that Sharp is absent from the Worker can be made. Reachability is `unproven`, which is a deployment-blocking proof gap.

Forcing `sharp@0.35.3` would violate Miniflare's exact `0.34.5` constraint and Next's `<0.35.0` compatible range. npm's force plan downgrades Next to `14.2.35`. Neither is an approved remediation.

## Gates

`npm run security:sharp:audit-exception` is the local-work gate. It validates the structure of every vulnerability entry, traverses the complete `via` graph from the Sharp advisory, and compares the resulting six-package subgraph to the exact allowlist. It also checks the exact registry tarballs/integrities above. Malformed entries, an added Sharp-linked consumer, changed edges/nodes/ranges/sources, severity increase, provenance drift, or expiry fail closed. Direct advisory sources outside the Sharp-linked graph remain counted and visible; this exception does not exempt them or replace the normal audit policy.

`npm run security:sharp:deployment-gate -- preview` and `-- production` bind authorization to `npm run cf:build` and `npm run cf:build:production`, respectively. The gate does not trust declared status or `matches`. It independently walks the current `.open-next` tree, discovers and parses every actual `metafile*.json` / `*.meta.json` esbuild metafile, and checks input paths/imports plus output paths/imports/inputs. It separately scans runtime filenames and bytes for `sharp`, `libvips`, and `@img`.

The reachability classification is conservative:

- A match in executable/runtime artifacts (`.js`, `.mjs`, `.cjs`, `.json`, `.wasm`, `.node`), a runtime path, or a structured metafile reachability field is `proven-reachable` and fails.
- Matches confined to recognized tooling-only `.map`, `.txt`, `.md`, or `.log` files are reported but are not runtime evidence when all metafiles are structurally clean.
- A missing/malformed metafile, an unclassified artifact match, unsupported filesystem entry, unrecognized metafile string, or scan error is `unproven` and fails.
- Only a complete scan with no runtime match or uncertainty derives `proven-absent`.

SHA-256 output/metafile checks remain an additional freshness binding; hashes never substitute for the independent scan. Contradictory caller-supplied `proven-absent` evidence fails whenever current bytes show a match. Preview, upload, deploy, scheduled Worker development, and both dry-run paths all execute matching build, gate, then action; a failed build or gate cannot reach Cloudflare execution.

The exception is valid through **2026-08-22 Australia/Sydney** and fails at `2026-08-23T00:00:00+10:00` even if nothing else changes.

## Exact unblock conditions

Before preview, upload, public deployment, or production cutover:

1. Upgrade through compatible Next/OpenNext/Wrangler/Miniflare releases that resolve Sharp to a patched version without a forced override or Next downgrade, then recapture and review both npm audits and the dependency paths; **or** retain the unchanged time-limited exception while completing the remaining conditions.
2. Complete the matching `npm run cf:build` or `npm run cf:build:production` under Node 22 with non-secret build-safe values.
3. Search the generated `.open-next` output for `sharp`, `libvips`, and `@img`, inspect the OpenNext/esbuild metafile, and record `proven-absent` evidence. Any reachable match remains a hard block.
4. Pass the focused tests, secret scan, formatting, typecheck, local audit exception, and deployment gate before invoking a Cloudflare preview/upload/deploy script.

Evidence is tracked in `artifacts/security/`. Refreshing it is a security review task; do not hand-edit evidence to make a gate pass.
