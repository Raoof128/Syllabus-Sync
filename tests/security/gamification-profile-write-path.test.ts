/**
 * Reproduction for BA-0028 — a regression introduced by BA-0026's own fix.
 *
 * 20260729090300 revokes INSERT and UPDATE on `public.gamification_profiles`
 * from `authenticated` to close the self-service XP tampering vector. That is
 * the right call, but `app/api/gamification/route.ts` creates a missing
 * gamification profile with a direct
 *
 *     supabase.from('gamification_profiles').insert({ user_id: userId })
 *
 * on a client built by `createServerClient()` — i.e. running as `authenticated`,
 * the very role being revoked. Applying the migration without changing this
 * call turns a first-time profile fetch into a 500 for any user who does not
 * already have a gamification row.
 *
 * Confirmed against production on 2026-07-29: `authenticated` currently holds
 * INSERT on the table, which is why this path works today and would stop
 * working the moment the revoke lands.
 *
 * The fix is not to restore the grant — it is to route the write through a
 * `SECURITY DEFINER` function that creates a row only for `auth.uid()`, which
 * bypasses the revoke without reopening the tampering vector.
 *
 * These are static assertions over source and migrations, so they run in CI
 * with no database.
 */

import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const MIGRATIONS_DIR = path.resolve(ROOT, 'supabase/migrations');

/** API routes that touch gamification state as the signed-in user. */
const USER_SCOPED_ROUTES = [
  'app/api/gamification/route.ts',
  'app/api/gamification/award-xp/route.ts',
];

/** `.from('gamification_profiles')` followed by a write verb before the statement ends. */
const DIRECT_WRITE =
  /\.from\(\s*['"]gamification_profiles['"]\s*\)[\s\S]{0,200}?\.(insert|update|upsert|delete)\s*\(/gi;

async function allMigrationSql(): Promise<string> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  const parts = await Promise.all(
    files.map((f) => readFile(path.join(MIGRATIONS_DIR, f), 'utf8')),
  );
  return parts.join('\n');
}

describe('BA-0028: gamification profile creation must survive the authenticated revoke', () => {
  it('revokes INSERT/UPDATE on gamification_profiles from authenticated', async () => {
    const sql = await allMigrationSql();
    // Guards the premise. If this stops matching, the assertions below are
    // about a constraint that no longer exists and would pass vacuously.
    expect(sql).toMatch(
      /REVOKE\s+[^;]*\bUPDATE\b[^;]*ON\s+(?:public\.)?gamification_profiles\s+FROM[^;]*\bauthenticated\b/i,
    );
  });

  it.each(USER_SCOPED_ROUTES)('does not write gamification_profiles as the user in %s', async (rel) => {
    const source = await readFile(path.resolve(ROOT, rel), 'utf8');

    const offenders = [...source.matchAll(DIRECT_WRITE)].map((m) => {
      const line = source.slice(0, m.index).split('\n').length;
      return `${rel}:${line} .${m[1]}()`;
    });

    // Reads are fine — SELECT is deliberately left granted. Only writes break.
    expect(offenders).toEqual([]);
  });

  it('provides a SECURITY DEFINER replacement scoped to auth.uid()', async () => {
    const sql = await allMigrationSql();

    const fn =
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.ensure_my_gamification_profile\s*\([\s\S]*?\$\$([\s\S]*?)\$\$/i.exec(
        sql,
      );

    expect(fn, 'expected public.ensure_my_gamification_profile to exist').not.toBeNull();

    const body = fn![1];
    // It must insert for the caller only. A function taking a user id from the
    // client would re-open the very IDOR that BA-0022 just closed.
    expect(body).toMatch(/auth\.uid\(\)/i);
    expect(body).toMatch(/INSERT\s+INTO\s+public\.gamification_profiles/i);

    expect(sql).toMatch(
      /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.ensure_my_gamification_profile[^;]*TO[^;]*authenticated/i,
    );
  });
});
