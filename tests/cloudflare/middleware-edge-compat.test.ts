import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const EDGE_POLICY_FILES = [
  'middleware.ts',
  'lib/middleware.ts',
  'lib/security/csp.ts',
  'lib/security/csrf.ts',
];

describe('Cloudflare middleware policy-file compatibility', () => {
  it.each(EDGE_POLICY_FILES)('%s does not import Node-only built-ins', async (path) => {
    const content = await readFile(path, 'utf8');

    expect(content).not.toMatch(
      /from\s+['"](?:node:)?(?:crypto|fs|path|net|dns|tls|child_process)['"]/,
    );
    expect(content).not.toMatch(
      /require\(['"](?:node:)?(?:crypto|fs|path|net|dns|tls|child_process)['"]\)/,
    );
  });

  it('does not retain the Node-runtime proxy entry point', async () => {
    await expect(readFile('proxy.ts', 'utf8')).rejects.toThrow();
  });
});
