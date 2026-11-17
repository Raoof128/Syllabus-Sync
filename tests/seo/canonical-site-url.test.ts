/**
 * Reproduction for BA-0040 — found while red-teaming on 2026-07-30.
 *
 * `app/robots.ts` and `app/sitemap.ts` both built their base URL from
 * `UNIVERSITY_CONFIG.website`, which is `https://www.mq.edu.au`. Production
 * therefore served:
 *
 *   robots.txt  -> Sitemap: https://www.mq.edu.au/sitemap.xml
 *   sitemap.xml -> https://www.mq.edu.au/home, /calendar, /map, /feed, ...
 *
 * So the app advertised Macquarie University's domain as the canonical location
 * of its own pages. Verified live: `GET /robots.txt` returned the mq.edu.au
 * sitemap. That is an SEO defect (the real pages are never announced) and it
 * asserts ownership of URLs on a university domain the project does not control.
 *
 * `app/calendar/page.tsx` used the same constant for JSON-LD `url`, with a stale
 * `https://syllabus-sync.vercel.app` fallback left over from before the
 * Cloudflare cutover.
 *
 * The origin must come from the deployment environment, read at call time.
 * Module-scope capture is unsafe here for the reason recorded in
 * `lib/supabase/admin.ts` (BA-0017): OpenNext populates `process.env` at its own
 * point in isolate startup, so a value captured at import time can stay empty for
 * the isolate's whole life.
 */

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();

/**
 * Read a source file with comments removed.
 *
 * These assertions are about what the code *does*, and the fix for each finding
 * is documented in a comment that necessarily quotes the thing being forbidden
 * ("this used to be UNIVERSITY_CONFIG.website"). Matching raw text therefore
 * fails on a correct fix. Stripping comments first is the difference between
 * testing behaviour and testing prose.
 */
async function read(rel: string): Promise<string> {
  const raw = await readFile(path.resolve(ROOT, rel), 'utf8');
  return raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}

const PUBLIC_METADATA_FILES = ['app/robots.ts', 'app/sitemap.ts'] as const;

describe('BA-0040: public metadata must use this app’s own origin', () => {
  it.each(PUBLIC_METADATA_FILES)(
    '%s does not use the university domain as its base',
    async (rel) => {
      const source = await read(rel);
      expect(source).not.toMatch(/UNIVERSITY_CONFIG\.website/);
    },
  );

  it.each(PUBLIC_METADATA_FILES)('%s resolves the origin at call time', async (rel) => {
    const source = await read(rel);
    // Must consult the environment rather than a constant frozen at import.
    expect(source).toMatch(/getConfiguredAppOrigin\(\)/);
  });

  it('has no stale Vercel fallback left in calendar JSON-LD', async () => {
    const source = await read('app/calendar/page.tsx');
    expect(source).not.toMatch(/syllabus-sync\.vercel\.app/);
  });

  it('still points sitemap discovery at a sitemap path', async () => {
    // Guards over-correction: the fix must not drop the sitemap declaration.
    const robots = await read('app/robots.ts');
    expect(robots).toMatch(/sitemap:/);
    expect(robots).toMatch(/\/sitemap\.xml/);
  });
});
