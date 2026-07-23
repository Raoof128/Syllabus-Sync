import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('Cloudflare runtime compatibility audit', () => {
  it('reports no unsupported runtime patterns', () => {
    const output = execFileSync(
      process.execPath,
      ['tools/cloudflare/check-runtime-compat.mjs', '--json'],
      { encoding: 'utf8' },
    );

    const result = JSON.parse(output) as {
      ok: boolean;
      violations: Array<{ path: string; rule: string }>;
    };

    expect(result).toEqual({ ok: true, violations: [] });
  });
});
