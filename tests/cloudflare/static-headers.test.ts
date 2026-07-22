import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('Cloudflare static headers', () => {
  it('sets immutable caching for hashed Next assets and app icons', async () => {
    const headers = await readFile('public/_headers', 'utf8');

    expect(headers).toContain('/_next/static/*');
    expect(headers).toContain('Cache-Control: public,max-age=31536000,immutable');
    expect(headers).toContain('/icons/*');
    expect(headers).toContain('/images/*');
    expect(headers).toContain('/manifest.webmanifest');
    expect(headers).toContain('Content-Type: application/manifest+json');
  });
});
