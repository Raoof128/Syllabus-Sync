import { readFile, readdir } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

/**
 * RTA-0024 / RTA-0025 regression cover, asserted over the ordered migration
 * chain (the same approach the other BA-#### migration tests use).
 *
 * Two gaps this locks:
 *
 * 1. `public.audit_settings` was the ONLY table in the chain that never got
 *    ENABLE ROW LEVEL SECURITY — 27 CREATE TABLE targets against 26 enables,
 *    and it was the entire delta. It also never received a REVOKE. Chained with
 *    `cleanup_old_audit_logs()` — SECURITY DEFINER, reading its retention window
 *    from that table, with no GRANT or REVOKE anywhere — a caller holding only
 *    the publishable anon key could set the retention to 0 and then invoke the
 *    function to destroy the security audit log.
 *
 * 2. Five SECURITY DEFINER functions were client-reachable with no ownership
 *    check. Three had no REVOKE at all; two had only `REVOKE ... FROM PUBLIC`,
 *    which BA-0032 already established is insufficient in this project because
 *    Supabase issues DIRECT grants to anon and authenticated.
 *
 * These are migration-text assertions, so they prove the CHAIN is correct, not
 * that production is. The chain and production are known to diverge (BA-0030,
 * BA-0048, BA-0049), and the migration carries its own catalog-level
 * verification block for that reason.
 */

const MIGRATIONS_DIR = 'supabase/migrations';

async function orderedMigrations(): Promise<{ file: string; sql: string }[]> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  return Promise.all(
    files.map(async (file) => ({
      file,
      sql: await readFile(`${MIGRATIONS_DIR}/${file}`, 'utf8'),
    })),
  );
}

/** Strips `--` line comments so prose cannot satisfy a regex. */
function stripComments(sql: string): string {
  return sql.replace(/--[^\n]*/g, '');
}

describe('every table in the chain ends with RLS enabled', () => {
  it('leaves no CREATE TABLE target without ENABLE ROW LEVEL SECURITY', async () => {
    const migrations = await orderedMigrations();
    const created = new Set<string>();
    const enabled = new Set<string>();

    for (const { sql } of migrations) {
      const body = stripComments(sql);
      for (const m of body.matchAll(
        /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z_]+)/gi,
      )) {
        created.add(m[1]);
      }
      for (const m of body.matchAll(
        /alter\s+table\s+(?:public\.)?([a-z_]+)\s+enable\s+row\s+level\s+security/gi,
      )) {
        enabled.add(m[1]);
      }
    }

    // Non-vacuous: a parsing failure would make `created` empty and pass.
    expect(created.size).toBeGreaterThan(20);

    const missing = [...created].filter((t) => !enabled.has(t)).sort();
    expect(missing).toEqual([]);
  });

  it('revokes client access to audit_settings, which has no user-scoped policy', async () => {
    const migrations = await orderedMigrations();
    const all = migrations.map(({ sql }) => stripComments(sql)).join('\n');

    // The table holds operator configuration, so service_role is the only
    // legitimate consumer — RLS with no policy plus an explicit revoke.
    expect(all).toMatch(/revoke\s+all\s+on\s+table\s+public\.audit_settings\s+from\s+anon/i);
    expect(all).toMatch(
      /revoke\s+all\s+on\s+table\s+public\.audit_settings\s+from\s+authenticated/i,
    );
  });
});

describe('client-reachable SECURITY DEFINER functions are revoked from anon and authenticated', () => {
  // Each of these is SECURITY DEFINER with no ownership check, and each has
  // zero or one repository callers.
  const FUNCTIONS = [
    'cleanup_old_audit_logs',
    'add_sample_class_times',
    'purge_deleted_records',
    'refresh_analytics_views',
    'cleanup_expired_webauthn_challenges',
  ];

  it.each(FUNCTIONS)('%s is revoked from both client roles', async (fn) => {
    const migrations = await orderedMigrations();
    const all = migrations.map(({ sql }) => stripComments(sql)).join('\n');

    // The hardening migration revokes these through a catalog-driven DO block,
    // so assert on the loop's function list rather than a literal REVOKE
    // statement per function.
    const hardening = migrations.find((m) =>
      m.file.includes('close_audit_settings_rls_and_unguarded_definers'),
    );
    expect(hardening, 'the hardening migration must be present').toBeDefined();
    expect(hardening!.sql).toContain(`'${fn}'`);

    // And the loop must revoke from the two roles Supabase grants directly —
    // REVOKE FROM PUBLIC alone is what BA-0032 proved insufficient here.
    expect(hardening!.sql).toMatch(/FROM anon/);
    expect(hardening!.sql).toMatch(/FROM authenticated/);
    expect(all).toMatch(/GRANT EXECUTE ON FUNCTION %s TO service_role/);
  });

  it('pins search_path on every SECURITY DEFINER function via a catalog sweep', async () => {
    const migrations = await orderedMigrations();
    const hardening = migrations.find((m) =>
      m.file.includes('close_audit_settings_rls_and_unguarded_definers'),
    );

    // Catalog-driven rather than a hand-list, so a definer added later without a
    // pin is caught by the migration's own verification block. Eight had
    // accumulated precisely because earlier passes only pinned what they touched.
    expect(hardening!.sql).toMatch(/prosecdef/);
    expect(hardening!.sql).toMatch(/ALTER FUNCTION %s SET search_path = public/);
    expect(hardening!.sql).toMatch(/RAISE EXCEPTION 'SECURITY DEFINER functions without/);
  });
});
