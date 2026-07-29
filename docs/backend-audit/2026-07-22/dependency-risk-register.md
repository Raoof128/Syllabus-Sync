# Dependency Risk Register

Generated from `npm audit` at Phase 0. Raw audit JSON is deliberately not committed.

## Full tree (includes dev)

Totals: critical=0 high=12 moderate=5 low=1

| Package                               | Severity | Advisory | Title                                                                            | Vulnerable range          | Fix available                                                                  |
| ------------------------------------- | -------- | -------- | -------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------ |
| `@babel/core`                         | low      | 1123528  | @babel/core: Arbitrary File Read via sourceMappingURL Comment                    | `<=7.29.0`                | True                                                                           |
| `@opennextjs/aws`                     | high     |          | (transitive only)                                                                | `>=3.9.5`                 | {'name': '@opennextjs/cloudflare', 'version': '1.14.1', 'isSemVerMajor': True} |
| `@opennextjs/cloudflare`              | high     |          | (transitive only)                                                                | `0.3.0 - 0.6.6            |                                                                                | >=1.14.2`                    | {'name': '@opennextjs/cloudflare', 'version': '1.14.1', 'isSemVerMajor': True} |
| `@opentelemetry/core`                 | moderate | 1120821  | OpenTelemetry Core: Unbounded memory allocation in W3C Baggage propagation       | `<2.8.0`                  | {'name': '@sentry/nextjs', 'version': '6.3.5', 'isSemVerMajor': True}          |
| `@opentelemetry/instrumentation-http` | moderate |          | (transitive only)                                                                | `<=0.16.0                 |                                                                                | 0.19.1-alpha.7 - 0.218.0`    | {'name': '@sentry/nextjs', 'version': '6.3.5', 'isSemVerMajor': True}          |
| `@opentelemetry/resources`            | moderate |          | (transitive only)                                                                | `0.8.0 - 2.7.1`           | True                                                                           |
| `@opentelemetry/sdk-trace-base`       | moderate |          | (transitive only)                                                                | `<=2.7.1`                 | True                                                                           |
| `@sentry/nextjs`                      | high     |          | (transitive only)                                                                | `>=6.3.6`                 | {'name': '@sentry/nextjs', 'version': '6.3.5', 'isSemVerMajor': True}          |
| `@sentry/node`                        | moderate |          | (transitive only)                                                                | `8.0.0-alpha.1 - 10.53.1` | {'name': '@sentry/nextjs', 'version': '6.3.5', 'isSemVerMajor': True}          |
| `brace-expansion`                     | high     | 1124334  | brace-expansion: DoS via unbounded expansion length causing an out-of-memory pro | `<=5.0.7`                 | True                                                                           |
| `js-yaml`                             | high     | 1121860  | JS-YAML: Quadratic-complexity DoS in merge key handling via repeated aliases     | `>=4.0.0 <=4.1.1`         | True                                                                           |
| `js-yaml`                             | high     | 1123911  | js-yaml: YAML merge-key chains can force quadratic CPU consumption               | `>=4.0.0 <4.3.0`          | True                                                                           |
| `miniflare`                           | high     |          | (transitive only)                                                                | `<=0.0.0-fec45ed61        |                                                                                | 4.20250508.3 - 4.20260721.0` | True                                                                           |
| `next`                                | high     |          | (transitive only)                                                                | `>=9.3.4-canary.0`        | {'name': 'next', 'version': '9.3.3', 'isSemVerMajor': True}                    |
| `postcss`                             | high     | 1124252  | PostCSS: Arbitrary file read and information disclosure via attacker-controlled  | `<=8.5.11`                | {'name': 'next', 'version': '9.3.3', 'isSemVerMajor': True}                    |
| `postcss`                             | high     | 1124288  | PostCSS: Path Traversal in Previous Source Map Auto-Loading (sourceMappingURL) l | `<=8.5.17`                | {'name': 'next', 'version': '9.3.3', 'isSemVerMajor': True}                    |
| `sharp`                               | high     | 1124066  | sharp inherited vulnerabilities in libvips: CVE-2026-33327, CVE-2026-33328, CVE- | `<0.35.0`                 | {'name': 'next', 'version': '9.3.3', 'isSemVerMajor': True}                    |
| `vite`                                | high     | 1120786  | launch-editor: NTLMv2 hash disclosure via UNC path handling on Windows           | `>=8.0.0 <=8.0.15`        | True                                                                           |
| `vite`                                | high     | 1123527  | vite: `server.fs.deny` bypass on Windows alternate paths                         | `>=8.0.0 <=8.0.15`        | True                                                                           |
| `wrangler`                            | high     |          | (transitive only)                                                                | `<=0.0.0-7ae5dd357        |                                                                                | 4.16.0 - 4.113.0`            | True                                                                           |
| `ws`                                  | high     | 1123260  | ws: Memory exhaustion DoS from tiny fragments and data chunks                    | `>=7.0.0 <7.5.11`         | True                                                                           |

## Production only (`--omit=dev`)

Totals: critical=0 high=9 moderate=5 low=1

| Package                               | Severity | Advisory | Title                                                                            | Vulnerable range          | Fix available                                                                  |
| ------------------------------------- | -------- | -------- | -------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------ |
| `@babel/core`                         | low      | 1123528  | @babel/core: Arbitrary File Read via sourceMappingURL Comment                    | `<=7.29.0`                | True                                                                           |
| `@opennextjs/aws`                     | high     |          | (transitive only)                                                                | `>=3.9.5`                 | {'name': '@opennextjs/cloudflare', 'version': '1.14.1', 'isSemVerMajor': True} |
| `@opennextjs/cloudflare`              | high     |          | (transitive only)                                                                | `0.3.0 - 0.6.6            |                                                                                | >=1.14.2`                    | {'name': '@opennextjs/cloudflare', 'version': '1.14.1', 'isSemVerMajor': True} |
| `@opentelemetry/core`                 | moderate | 1120821  | OpenTelemetry Core: Unbounded memory allocation in W3C Baggage propagation       | `<2.8.0`                  | {'name': '@sentry/nextjs', 'version': '6.3.5', 'isSemVerMajor': True}          |
| `@opentelemetry/instrumentation-http` | moderate |          | (transitive only)                                                                | `<=0.16.0                 |                                                                                | 0.19.1-alpha.7 - 0.218.0`    | {'name': '@sentry/nextjs', 'version': '6.3.5', 'isSemVerMajor': True}          |
| `@opentelemetry/resources`            | moderate |          | (transitive only)                                                                | `0.8.0 - 2.7.1`           | True                                                                           |
| `@opentelemetry/sdk-trace-base`       | moderate |          | (transitive only)                                                                | `<=2.7.1`                 | True                                                                           |
| `@sentry/nextjs`                      | high     |          | (transitive only)                                                                | `>=6.3.6`                 | {'name': '@sentry/nextjs', 'version': '6.3.5', 'isSemVerMajor': True}          |
| `@sentry/node`                        | moderate |          | (transitive only)                                                                | `8.0.0-alpha.1 - 10.53.1` | {'name': '@sentry/nextjs', 'version': '6.3.5', 'isSemVerMajor': True}          |
| `brace-expansion`                     | high     | 1124334  | brace-expansion: DoS via unbounded expansion length causing an out-of-memory pro | `<=5.0.7`                 | True                                                                           |
| `miniflare`                           | high     |          | (transitive only)                                                                | `<=0.0.0-fec45ed61        |                                                                                | 4.20250508.3 - 4.20260721.0` | True                                                                           |
| `next`                                | high     |          | (transitive only)                                                                | `>=9.3.4-canary.0`        | {'name': 'next', 'version': '9.3.3', 'isSemVerMajor': True}                    |
| `postcss`                             | high     | 1124252  | PostCSS: Arbitrary file read and information disclosure via attacker-controlled  | `<=8.5.11`                | {'name': 'next', 'version': '9.3.3', 'isSemVerMajor': True}                    |
| `postcss`                             | high     | 1124288  | PostCSS: Path Traversal in Previous Source Map Auto-Loading (sourceMappingURL) l | `<=8.5.17`                | {'name': 'next', 'version': '9.3.3', 'isSemVerMajor': True}                    |
| `sharp`                               | high     | 1124066  | sharp inherited vulnerabilities in libvips: CVE-2026-33327, CVE-2026-33328, CVE- | `<0.35.0`                 | {'name': 'next', 'version': '9.3.3', 'isSemVerMajor': True}                    |
| `wrangler`                            | high     |          | (transitive only)                                                                | `<=0.0.0-7ae5dd357        |                                                                                | 4.16.0 - 4.113.0`            | True                                                                           |

## Reachability assessment

The master prompt (§2) recorded a hypothesis of "six high-severity npm audit
entries". That is **not reproducible at audit start**: `npm audit --omit=dev`
reports **10 high** entries. The count was not simply understated — the set has
changed, and `--omit=dev` does not separate build-time from runtime code.

What actually ships to the Worker is decided by the OpenNext bundle, not by
dependency classification:

| Package                                     | Severity | Enters Worker bundle? | Basis                                                                                                                                                                                    |
| ------------------------------------------- | -------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wrangler`                                  | high     | No                    | Deploy CLI, never bundled                                                                                                                                                                |
| `miniflare`                                 | high     | No                    | Local Workerd emulator, dev/deploy only                                                                                                                                                  |
| `@opennextjs/cloudflare`, `@opennextjs/aws` | high     | No                    | Build-time compiler                                                                                                                                                                      |
| `postcss` (×2)                              | high     | No                    | Build-time CSS pipeline; advisories are `sourceMappingURL` file-read/path-traversal, requiring attacker-controlled build input                                                           |
| `next`                                      | high     | Partially             | Runtime portions are bundled; advisory range is transitive and the fix path proposes a downgrade to 9.3.3, which is not viable                                                           |
| `@sentry/nextjs`                            | high     | Yes                   | Runtime SDK; suggested fix is a semver-major downgrade to 6.3.5                                                                                                                          |
| `brace-expansion`                           | high     | Unproven              | Transitive utility; needs bundle-graph confirmation                                                                                                                                      |
| `sharp`                                     | high     | **No — proven**       | Advisory 1124066 (libvips CVE-2026-33327/33328/…). The repository's Sharp reachability gate scans the exact build output and metafile and records "proven absent from the Worker bundle" |

`npm audit fix --force` is **not** run, per §3 of the prompt: every proposed fix
above is a semver-major downgrade (`next@9.3.3`, `@sentry/nextjs@6.3.5`,
`@opennextjs/cloudflare@1.14.1`) that would break the runtime contract.

### Open work for this register

Bundle-graph reachability is asserted from package role for every row except
`sharp`, which has direct scan evidence. Confirming `brace-expansion`,
`@sentry/nextjs`, and the runtime `next` surface against `.open-next` output is
tracked as a Phase 5 Lane K task, and until then those rows are **unproven, not
cleared**.
