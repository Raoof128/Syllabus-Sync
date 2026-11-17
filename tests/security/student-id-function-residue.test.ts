/**
 * Reproduction for BA-0051 (P1) — I broke two production functions while fixing
 * BA-0050, and my own verification did not catch it.
 *
 * BA-0050 dropped `profiles.student_id`. To drop it I had to recreate
 * `public.user_details`, which selected the column, so the view went from 15
 * columns to 14. Two functions still referenced the column afterwards:
 *
 *   get_my_profile()
 *       RETURNS TABLE(... student_id text ...)  -- still declares 15 columns
 *       body: RETURN QUERY SELECT * FROM public.user_details ...  -- now yields 14
 *     PL/pgSQL compares the row against the declared result type as each row is
 *     returned, so this raises 42804 "structure of query does not match function
 *     result type" for ANY caller that matches a row.
 *
 *   create_user_profile(p_user_id, p_email, p_full_name, p_student_id)
 *       body: INSERT INTO public.profiles (id, email, full_name, student_id)
 *     Raises 42703 undefined_column at plan time.
 *
 * Both confirmed against production on 2026-07-30 by impersonating a real session
 * inside a transaction that was rolled back.
 *
 * WHY MY BA-0050 VERIFICATION MISSED IT. I checked that the column was gone from
 * the table and from the view, that `security_invoker` survived, and that a live
 * signup returned 200. Every one of those passed. I never asked the catalog which
 * *other* objects mentioned the column. Signup passed because it goes through
 * `ensure_user_profile`, which never referenced student_id; `get_my_profile` has no
 * caller in the app, so nothing failed loudly. A dropped column is not a contained
 * change: it is a contract change for every function, view, index and constraint
 * that names it, and only the catalog knows the full list.
 *
 * The same lesson as BA-0048, in a new place: sweep the catalog, do not enumerate
 * what you happen to remember.
 *
 * These assertions read the migration chain and evaluate the LAST definition of
 * each function, because that is the effective state. Reading any earlier
 * definition is the mistake BA-0021 made.
 */

import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase/migrations');

async function migrationsInOrder(): Promise<{ file: string; sql: string }[]> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  return Promise.all(
    files.map(async (file) => ({
      file,
      sql: await readFile(path.join(MIGRATIONS_DIR, file), 'utf8'),
    })),
  );
}

/** Strip SQL line and block comments, so a comment explaining the fix cannot satisfy or break an assertion. */
function stripComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '');
}

/**
 * The last `CREATE [OR REPLACE] FUNCTION public.<name>` body in migration order,
 * which is the definition production ends up with.
 */
async function effectiveDefinition(fn: string): Promise<string> {
  const bodies: string[] = [];
  for (const { sql } of await migrationsInOrder()) {
    const re = new RegExp(
      `CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+public\\.${fn}\\s*\\([\\s\\S]*?\\$\\$;`,
      'gi',
    );
    for (const m of stripComments(sql).matchAll(re)) bodies.push(m[0]);
  }
  expect(bodies.length, `no migration defines public.${fn}`).toBeGreaterThan(0);
  return bodies[bodies.length - 1];
}

describe('BA-0051: no function may still reference the dropped student_id column', () => {
  it('get_my_profile does not declare student_id in its result type', async () => {
    const def = await effectiveDefinition('get_my_profile');
    expect(def).not.toMatch(/student_id/i);
  });

  it('get_my_profile selects explicit columns rather than SELECT *', async () => {
    // SELECT * into a declared TABLE type is the precise mechanism that broke:
    // the view changed shape and the function kept its old contract silently.
    const def = await effectiveDefinition('get_my_profile');
    expect(def).not.toMatch(/SELECT\s+\*\s+FROM\s+public\.user_details/i);
    expect(def).toMatch(/ud\.id/i);
  });

  it('create_user_profile neither accepts nor inserts a student_id', async () => {
    const def = await effectiveDefinition('create_user_profile');
    expect(def).not.toMatch(/student_id/i);
  });

  it('keeps both functions owner-scoped', async () => {
    // Guards over-correction: the repair must not drop the ownership checks that
    // stop these SECURITY DEFINER functions becoming an IDOR.
    expect(await effectiveDefinition('create_user_profile')).toMatch(/auth\.uid\(\)/);
    expect(await effectiveDefinition('get_my_profile')).toMatch(/auth\.uid\(\)/);
  });

  it('revokes anon EXECUTE on both, since neither is reachable without a session', async () => {
    const all = (await migrationsInOrder()).map((m) => stripComments(m.sql)).join('\n');
    for (const fn of ['get_my_profile', 'create_user_profile']) {
      const re = new RegExp(
        `REVOKE\\s+(?:ALL|EXECUTE)[^;]*ON\\s+FUNCTION\\s+public\\.${fn}[^;]*FROM[^;]*\\banon\\b`,
        'i',
      );
      expect(all, `${fn} must have client reach revoked from anon`).toMatch(re);
    }
  });

  it('no migration leaves student_id inside any function body', async () => {
    // The catalog sweep, expressed against the chain: after the drop migration,
    // nothing may define a function that names the column.
    const migrations = await migrationsInOrder();
    const dropIndex = migrations.findIndex((m) => /ALTER TABLE[\s\S]*DROP COLUMN[\s\S]*student_id/i.test(m.sql));
    expect(dropIndex, 'no migration drops profiles.student_id').toBeGreaterThan(-1);

    const offenders: string[] = [];
    for (const { file, sql } of migrations.slice(dropIndex)) {
      const clean = stripComments(sql);
      for (const m of clean.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION[\s\S]*?\$\$;/gi)) {
        if (/student_id/i.test(m[0])) offenders.push(file);
      }
    }
    expect([...new Set(offenders)]).toEqual([]);
  });
});
