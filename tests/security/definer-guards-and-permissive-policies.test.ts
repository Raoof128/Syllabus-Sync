/**
 * Reproduction for BA-0029 and BA-0030, both found by running Supabase's own
 * advisors against production after the first four audit migrations landed.
 *
 * ---------------------------------------------------------------------------
 * BA-0029 (P0): `auth.role() = 'authenticated'` guards are skipped for `anon`.
 *
 * `ensure_user_profile()` and `award_xp()` are SECURITY DEFINER and guard
 * themselves with:
 *
 *     IF auth.role() = 'authenticated' AND auth.uid() IS DISTINCT FROM p_user_id
 *
 * For an anonymous caller `auth.role()` is `'anon'`, so the whole condition is
 * false and the guard never fires. `REVOKE ALL ON FUNCTION ... FROM PUBLIC`
 * does not shut this out, because Supabase grants EXECUTE to `anon` and
 * `authenticated` *explicitly* — revoking PUBLIC leaves those grants intact.
 *
 * Confirmed against production 2026-07-29 with only the publishable anon key:
 *
 *     POST /rest/v1/rpc/award_xp {"p_user_id":"<any>","p_event_type":"<bogus>"}
 *     -> {"code":"P0001","message":"Unknown XP event type: ..."}
 *
 * Reaching the event-type lookup proves the ownership guard was bypassed; a
 * valid event type would have awarded XP to an arbitrary user, and the same
 * shape against `ensure_user_profile` overwrites any user's profile email.
 *
 * The guard must be fail-closed: deny unless the caller is service_role (or an
 * admin/migration connection, where `auth.role()` is NULL) or is operating on
 * its own `auth.uid()`.
 *
 * ---------------------------------------------------------------------------
 * BA-0030 (P0): duplicate permissive policies with `USING (true)`.
 *
 * `events`, `deadlines`, `units` and `class_times` each carry BOTH a correct
 * owner-scoped policy AND a `<table>_{select,insert,update,delete}` policy
 * whose USING/WITH CHECK is literally `true`. Postgres ORs permissive policies
 * together, so the always-true one wins and the owner check is dead weight:
 * any authenticated user can UPDATE or DELETE any other user's rows.
 *
 * (Reads are not currently reachable by `anon` — it holds no table-level
 * SELECT grant on these four, verified by a 401/42501 from PostgREST — but the
 * write path is fully open to every logged-in account.)
 *
 * Both are asserted against the migration chain so they run in CI without
 * credentials.
 */

import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase/migrations');

/**
 * Functions that take a caller-supplied user id and must not trust `anon`.
 *
 * `update_streak` and `log_audit` were found by sweeping the catalog for the
 * pattern rather than fixing the two the advisors happened to name — a
 * catalogue sweep, not a checklist. `log_audit` is the worst of the four: it
 * writes `audit_logs` rows attributed to an arbitrary `p_user_id`, so an
 * anonymous caller could forge another user's audit trail.
 */
const GUARDED_FUNCTIONS = ['ensure_user_profile', 'award_xp', 'update_streak', 'log_audit'] as const;

/** Definer functions that must not be callable by the anon key at all. */
const ANON_REVOKED_FUNCTIONS = [
  'ensure_user_profile',
  'award_xp',
  'update_streak',
  'log_audit',
  'get_xp_leaderboard',
  'get_my_deadline_analytics',
  'get_my_activity_summary',
  'ensure_my_gamification_profile',
] as const;

const ALWAYS_TRUE_POLICIES = [
  ['events', 'events_select'],
  ['events', 'events_insert'],
  ['events', 'events_update'],
  ['events', 'events_delete'],
  ['deadlines', 'deadlines_select'],
  ['deadlines', 'deadlines_insert'],
  ['deadlines', 'deadlines_update'],
  ['deadlines', 'deadlines_delete'],
  ['units', 'units_select'],
  ['units', 'units_insert'],
  ['units', 'units_update'],
  ['units', 'units_delete'],
  ['class_times', 'class_times_select'],
  ['class_times', 'class_times_insert'],
  ['class_times', 'class_times_update'],
  ['class_times', 'class_times_delete'],
] as const;

async function allMigrationSql(): Promise<string> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  const parts = await Promise.all(files.map((f) => readFile(path.join(MIGRATIONS_DIR, f), 'utf8')));
  return parts.join('\n');
}

/**
 * SQL from the BA-0030 remediation onwards only.
 *
 * The policy assertions below must NOT be made against the whole chain.
 * 20260114011650 already contains `DROP POLICY IF EXISTS "events_select"`, yet
 * production still had that policy when this was written — the chain and the
 * database disagree, so a whole-chain search passes vacuously while the hole
 * stays open. Anchoring on the remediation migration keeps the guard honest.
 */
const REMEDIATION_FROM = '20260729110000';

async function remediationSql(): Promise<string> {
  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.sql') && f >= REMEDIATION_FROM)
    .sort();
  const parts = await Promise.all(files.map((f) => readFile(path.join(MIGRATIONS_DIR, f), 'utf8')));
  return parts.join('\n');
}

/** Body of the LAST definition of `name` in migration order — the effective one. */
async function finalFunctionBody(name: string): Promise<string | null> {
  const sql = await allMigrationSql();
  const re = new RegExp(
    `CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+public\\.${name}\\s*\\([\\s\\S]*?AS\\s*\\$\\$([\\s\\S]*?)\\$\\$`,
    'gi',
  );
  const matches = [...sql.matchAll(re)];
  return matches.length ? matches[matches.length - 1][1] : null;
}

describe('BA-0029: SECURITY DEFINER guards must be fail-closed against anon', () => {
  it.each(GUARDED_FUNCTIONS)('%s does not gate its ownership check on auth.role() = authenticated', async (fn) => {
    const body = await finalFunctionBody(fn);
    expect(body, `expected public.${fn} in the migration chain`).not.toBeNull();

    // The exact bypassable shape: the guard only engages when the caller is
    // 'authenticated', so 'anon' walks straight past it.
    expect(body).not.toMatch(/auth\.role\(\)\s*=\s*'authenticated'/i);
  });

  it.each(GUARDED_FUNCTIONS)('%s rejects a caller with no auth.uid()', async (fn) => {
    const body = await finalFunctionBody(fn);
    expect(body).not.toBeNull();

    // Fail-closed: an anonymous caller has a NULL uid and must be denied rather
    // than falling through to the body.
    //
    // Accepts either spelling. log_audit assigns `v_actor_id := auth.uid()` and
    // null-checks the variable, so the literal `auth.uid() IS NULL` never
    // appears even though the guard is correct.
    expect(body).toMatch(/(?:auth\.uid\(\)|v_actor_id)\s+IS\s+NULL/i);

    // ...and the null check must actually gate a denial, not just be read.
    expect(body).toMatch(/RAISE\s+EXCEPTION/i);
  });

  it.each(ANON_REVOKED_FUNCTIONS)('revokes EXECUTE on %s from anon explicitly', async (fn) => {
    const sql = await allMigrationSql();
    // REVOKE ... FROM PUBLIC is NOT sufficient — Supabase grants anon directly.
    const re = new RegExp(
      `REVOKE\\s+(?:ALL|EXECUTE)[^;]*ON\\s+FUNCTION\\s+public\\.${fn}\\s*\\([^)]*\\)[^;]*FROM[^;]*\\banon\\b`,
      'i',
    );
    expect(sql).toMatch(re);
  });

  it('also revokes PUBLIC on log_audit, which anon inherits', async () => {
    const sql = await allMigrationSql();
    // The converse of the rule above: revoking `anon` alone left log_audit
    // reachable, because it carried a separate explicit grant to PUBLIC. An
    // anon probe still entered the function body and was stopped only by the
    // fail-closed guard. Both grants have to go.
    expect(sql).toMatch(
      /REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.log_audit\s*\([^)]*\)\s*FROM\s+PUBLIC/i,
    );
  });
});

describe('BA-0030: no permissive policy may be unconditionally true', () => {
  it.each(ALWAYS_TRUE_POLICIES)('drops the always-true policy %s.%s', async (table, policy) => {
    const sql = await remediationSql();
    const re = new RegExp(
      `DROP\\s+POLICY\\s+(?:IF\\s+EXISTS\\s+)?"${policy}"\\s+ON\\s+(?:public\\.)?${table}`,
      'i',
    );
    expect(sql).toMatch(re);
  });

  it('keeps an owner-scoped replacement for every table it touches', async () => {
    const sql = await allMigrationSql();
    // Guards against "fixing" this by dropping all policies and leaving the
    // table unreachable, or by re-adding another blanket true.
    for (const table of ['events', 'deadlines', 'units', 'class_times']) {
      const owner = new RegExp(`ON\\s+(?:public\\.)?${table}[\\s\\S]{0,400}?auth\\.uid\\(\\)`, 'i');
      expect(sql, `expected an auth.uid()-scoped policy for ${table}`).toMatch(owner);
    }
  });
});
