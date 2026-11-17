/**
 * Reproduction for BA-0049 (P2) — orphaned, anon-reachable AI-quota surface.
 *
 * `sylla_ai_requests`, `sylla_active_generations` and four `sylla_*` functions
 * exist in production but appear in no migration file and have no calling code in
 * this repository. They were built for an AI chat/upload feature that has never
 * shipped.
 *
 * The two tables are inert: RLS is on with zero policies, so RLS default-deny
 * blocks client access despite both tables carrying broad grants to `anon` and
 * `authenticated`.
 *
 * The four functions are not inert. All are `SECURITY DEFINER` — which bypasses
 * RLS outright — and all four grant EXECUTE to `anon` and `authenticated`. Three
 * take a caller-supplied identifier with no ownership check, the same defect class
 * as BA-0029 and BA-0031:
 *
 *   sylla_reserve_chat_request(p_user_id, p_anon_id, p_ip_hash, ...)
 *       -> burn another user's daily AI quota, or rotate p_anon_id/p_ip_hash to
 *          evade one's own limit
 *   sylla_reserve_upload_request(p_user_id)
 *       -> consume another user's upload quota
 *   sylla_finalize_request(p_request_id, p_status, tokens...)
 *       -> mark another user's request succeeded/failed and set its token counts
 *   sylla_cleanup_old_ai_requests()
 *       -> anyone can trigger the retention delete
 *
 * Because no code calls them, the proportionate fix is to remove client reach
 * rather than drop the objects: `service_role` and `postgres` keep access, so the
 * feature can still be developed, and re-granting is one statement when it ships.
 * Dropping would be destructive to work this repo cannot see.
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

const FUNCTIONS = [
  'sylla_reserve_chat_request',
  'sylla_reserve_upload_request',
  'sylla_finalize_request',
  'sylla_cleanup_old_ai_requests',
] as const;

describe('BA-0049: the orphaned sylla_* surface must not be client-reachable', () => {
  it.each(FUNCTIONS)('revokes EXECUTE on %s from anon and authenticated', async (fn) => {
    const sql = await allMigrationSql();

    const literal = (role: string) =>
      new RegExp(
        `REVOKE\\s+(?:ALL|EXECUTE)[^;]*ON\\s+FUNCTION\\s+public\\.${fn}[^;]*FROM[^;]*\\b${role}\\b`,
        'i',
      );

    // `sylla_finalize_request` is revoked by a catalog-driven DO block rather than
    // a literal statement: its five argument types were never asserted, and a
    // wrong signature in a REVOKE is a silent no-op rather than an error. Accept
    // either form — the live catalog is what the migration's own verification
    // block checks, and it covers every sylla_* function including future ones.
    const dynamic = new RegExp(
      `proname\\s+LIKE\\s+'sylla%'[\\s\\S]*?REVOKE\\s+EXECUTE[\\s\\S]*?FROM\\s+anon,\\s*authenticated|` +
        `proname\\s*=\\s*'${fn}'[\\s\\S]{0,400}?REVOKE\\s+EXECUTE`,
      'i',
    );

    for (const role of ['anon', 'authenticated']) {
      const covered = literal(role).test(sql) || dynamic.test(sql);
      expect(covered, `${fn} must be revoked from ${role}, literally or via catalog sweep`).toBe(
        true,
      );
    }
  });

  it.each(['sylla_ai_requests', 'sylla_active_generations'])(
    'revokes table privileges on %s from client roles',
    async (table) => {
      const sql = await allMigrationSql();
      const re = new RegExp(
        `REVOKE\\s+ALL\\s+ON\\s+(?:TABLE\\s+)?public\\.${table}\\s+FROM[^;]*\\banon\\b`,
        'i',
      );
      expect(sql).toMatch(re);
    },
  );

  it('does not drop the objects', async () => {
    const sql = await allMigrationSql();
    // These belong to unshipped work this repo cannot see. Removing reach is
    // correct; destroying the objects is not ours to decide.
    expect(sql).not.toMatch(/DROP\s+TABLE[^;]*sylla_/i);
    expect(sql).not.toMatch(/DROP\s+FUNCTION[^;]*sylla_/i);
  });

  it('documents them so they are no longer untracked', async () => {
    const sql = await allMigrationSql();
    const block = sql.slice(sql.indexOf('BA-0049'));
    // The whole point is that these existed in production with no record.
    expect(block).toMatch(/sylla_ai_requests/);
    expect(block).toMatch(/sylla_active_generations/);
    for (const fn of FUNCTIONS) expect(block).toContain(fn);
  });
});
