/**
 * Reproduction for BA-0034, BA-0035 and BA-0036 — found by red-teaming the live
 * deployment on 2026-07-29/30.
 *
 * ---------------------------------------------------------------------------
 * BA-0034 (P1): the `avatars` bucket could be listed anonymously.
 *
 * `avatars_select_public` granted SELECT on `storage.objects` to the `public`
 * role for the whole bucket. A public bucket does NOT need that for its
 * `/object/public/...` URLs to work — the public endpoint bypasses RLS — so the
 * only thing the policy enabled was enumeration. Proven end-to-end against
 * production with nothing but the publishable anon key:
 *
 *   POST /storage/v1/object/list/avatars {"prefix":""}      -> 200, folder = a user UUID
 *   POST /storage/v1/object/list/avatars {"prefix":"<uuid>"} -> 200, exact filename
 *   GET  /storage/v1/object/public/avatars/<uuid>/<file>     -> 200, the photo
 *
 * Folder names are `auth.uid()` values, so this leaked the user-id list as well
 * as every profile photo.
 *
 * ---------------------------------------------------------------------------
 * BA-0035 (P1): `avatars_update_own` had USING but no WITH CHECK.
 *
 * USING constrained which row you may update; with no WITH CHECK, Postgres does
 * not constrain the row you may update it INTO. `storage.from('avatars').move()`
 * issues an UPDATE on `storage.objects.name`, so a user could relocate their own
 * object into another user's `auth.uid()` folder — planting content that then
 * serves as that user's avatar.
 *
 * ---------------------------------------------------------------------------
 * BA-0036 (P2): `image/svg+xml` was allowed on a public bucket.
 *
 * SVG is active content. Storage serves it with `Content-Type: image/svg+xml`
 * and — verified against production — no `X-Content-Type-Options`, no
 * `Content-Disposition: attachment` and no CSP, so script inside a stored SVG
 * executes on direct navigation. Chained with BA-0035 that becomes "plant a
 * scripted SVG as another user's avatar". No SVG had been uploaded yet, so
 * removing the type costs nothing.
 *
 * Asserted against the migration chain so this runs in CI without credentials.
 */

import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase/migrations');

async function allMigrationSql(): Promise<string> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  const parts = await Promise.all(files.map((f) => readFile(path.join(MIGRATIONS_DIR, f), 'utf8')));
  return parts.join('\n');
}

describe('BA-0034: the avatars bucket must not be anonymously listable', () => {
  it('drops the bucket-wide public SELECT policy', async () => {
    const sql = await allMigrationSql();
    expect(sql).toMatch(
      /DROP\s+POLICY\s+(?:IF\s+EXISTS\s+)?"?avatars_select_public"?\s+ON\s+storage\.objects/i,
    );
  });

  it('does not reintroduce a public-role SELECT policy on storage.objects', async () => {
    const sql = await allMigrationSql();
    // A replacement scoped `TO authenticated` would be acceptable; `TO public`
    // (or a policy with no TO clause, which means PUBLIC) is what was wrong.
    //
    // Only the FINAL state counts. The chain necessarily still contains the
    // original `CREATE POLICY "avatars_select_public"`, because migrations are
    // append-only — what matters is that a later migration drops it.
    const created = [
      ...sql.matchAll(/CREATE\s+POLICY\s+"?([\w-]+)"?\s+ON\s+storage\.objects([\s\S]{0,400}?);/gi),
    ];
    const offenders = created
      .filter(([, , body]) => /FOR\s+SELECT/i.test(body) && !/TO\s+authenticated/i.test(body))
      .filter(([, name], _i) => {
        const createdAt = sql.indexOf(`CREATE POLICY "${name}"`);
        const dropRe = new RegExp(
          `DROP\\s+POLICY\\s+(?:IF\\s+EXISTS\\s+)?"?${name}"?\\s+ON\\s+storage\\.objects`,
          'gi',
        );
        // Surviving = no DROP for it appears after its last CREATE.
        return ![...sql.matchAll(dropRe)].some((m) => (m.index ?? -1) > createdAt);
      })
      .map(([, name]) => name);
    expect(offenders).toEqual([]);
  });
});

describe('BA-0035: avatar UPDATE must constrain the destination row', () => {
  it('recreates avatars_update_own with a WITH CHECK clause', async () => {
    const sql = await allMigrationSql();

    // Two traps here, both hit while writing this:
    //  - `m` + `$` anchored to end-of-line and truncated the match before
    //    WITH CHECK. The statement has no internal semicolons, so non-greedy to
    //    the first `;` is correct.
    //  - `.exec()` returns the FIRST match, which is the historical policy that
    //    lacks WITH CHECK. Migrations are append-only, so the LAST definition is
    //    the effective one.
    const matches = [
      ...sql.matchAll(
        /CREATE\s+POLICY\s+"?avatars_update_own"?\s+ON\s+storage\.objects([\s\S]*?);/gi,
      ),
    ];
    expect(matches.length, 'expected avatars_update_own to be recreated').toBeGreaterThan(0);

    const body = matches[matches.length - 1][1];
    expect(body).toMatch(/WITH\s+CHECK/i);
    // Both halves must pin the folder to the caller, otherwise the move is still
    // possible in one direction.
    const usingClause = /USING\s*\(([\s\S]*?)\)\s*WITH\s+CHECK/i.exec(body);
    const checkClause = /WITH\s+CHECK\s*\(([\s\S]*)$/i.exec(body);
    expect(usingClause?.[1]).toMatch(/auth\.uid\(\)/i);
    expect(checkClause?.[1]).toMatch(/auth\.uid\(\)/i);
  });
});

describe('BA-0036: the public avatars bucket must not accept active content', () => {
  it('removes image/svg+xml from the allowed mime types', async () => {
    const sql = await allMigrationSql();

    const update =
      /UPDATE\s+storage\.buckets\s+SET[\s\S]{0,400}?allowed_mime_types[\s\S]{0,400}?;/i.exec(sql);
    expect(update, 'expected an UPDATE narrowing allowed_mime_types').not.toBeNull();

    const statement = update![0];
    expect(statement).toMatch(/'avatars'/);
    expect(statement).not.toMatch(/svg/i);
    // The raster types the app actually uses must survive.
    for (const kept of ['image/jpeg', 'image/png', 'image/webp']) {
      expect(statement).toContain(kept);
    }
  });
});
