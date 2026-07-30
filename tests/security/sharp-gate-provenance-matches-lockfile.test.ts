import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { evaluateAuditException as untypedGate } from '../../tools/security/check-sharp-risk.mjs';

// The gate is plain .mjs, so its inferred signature loses the evidence
// parameters. Narrow it here rather than weakening the test with `any`.
const evaluateAuditException = untypedGate as unknown as (input: {
  fullAudit: unknown;
  productionAudit: unknown;
  lockfile: unknown;
  now?: Date;
}) => { ok: boolean; errors: string[] };

const repoRoot = resolve(__dirname, '../..');
const readJson = (relativePath: string) =>
  JSON.parse(readFileSync(resolve(repoRoot, relativePath), 'utf8'));

/**
 * Why this test exists.
 *
 * The Sharp risk gate keeps its approved dependency ancestry and registry
 * provenance in constants (EXPECTED_DEPENDENCY_PATHS / EXPECTED_PROVENANCE).
 * `tools/security/check-sharp-risk.test.mjs` exercises that logic against a
 * SYNTHETIC lockfile fixture, so it stayed green while the real
 * `package-lock.json` drifted underneath it — Next 16.2.11 -> 16.2.12,
 * Wrangler 4.113.0 -> 4.115.0, miniflare 4.20260721.0 -> 4.20260722.1.
 *
 * Nothing in `npm run check` reads the real lockfile, so the drift was invisible
 * until a deploy was attempted: `evaluateDeploymentGate` delegates to
 * `evaluateAuditException`, so EVERY gated `cf:*` script (dry-run, preview,
 * upload, deploy) failed closed for both profiles and production could not be
 * released at all.
 *
 * This test binds the approved constants to the committed lockfile so the next
 * dependency bump fails here — inside `npm run check`, where it is cheap to
 * see — instead of at the deploy gate.
 *
 * Deliberately expiry-agnostic: the exception is time-boxed and is SUPPOSED to
 * start failing after 2026-08-22, so asserting `ok === true` would turn a
 * designed fail-closed into a spurious test failure. Only provenance and
 * ancestry drift are asserted here.
 */
describe('Sharp risk gate — approved provenance tracks the committed lockfile', () => {
  const result = evaluateAuditException({
    fullAudit: readJson('artifacts/security/npm-audit-full.json'),
    productionAudit: readJson('artifacts/security/npm-audit-production.json'),
    lockfile: readJson('package-lock.json'),
  });
  const errors: string[] = result.errors;

  it('records no dependency-ancestry drift against the real lockfile', () => {
    expect(errors.filter((e) => /dependency path changed/i.test(e))).toEqual([]);
  });

  it('records no registry provenance or integrity drift against the real lockfile', () => {
    expect(errors.filter((e) => /provenance or integrity changed/i.test(e))).toEqual([]);
  });

  it('keeps the lockfile readable as gate evidence', () => {
    // A malformed/unsupported lockfile makes every other assertion vacuously
    // pass, so fail loudly rather than silently skipping the real check.
    expect(errors.filter((e) => /package-lock evidence/i.test(e))).toEqual([]);
  });
});
