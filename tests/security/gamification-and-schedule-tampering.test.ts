/**
 * Regression guard for BA-0026 (three independent sub-findings, reported
 * together by Lane D).
 *
 * This asserts against the migration chain rather than a live database, so it
 * runs in CI with no credentials.
 */

import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase/migrations');

async function allMigrationsSql(): Promise<{ files: string[]; combined: string }> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  let combined = '';
  for (const file of files) {
    combined += `\n-- FILE:${file}\n`;
    combined += await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
  }
  return { files, combined };
}

/**
 * Sub-finding 1: `gamification_profiles` — the UPDATE policy only checks
 * `auth.uid() = user_id`, not which columns/values are being written, and no
 * WITH CHECK bounds `xp`/`streak_days` to what `award_xp()`/`update_streak()`
 * would have computed. A user can
 * `supabase.from('gamification_profiles').update({ xp: 999999999 })` directly
 * via PostgREST, bypassing the anti-cheat RPCs entirely
 * (20260124000000_complete_schema_initialization.sql:276,334; untouched by
 * 20260214000000_harden_gamification_rpc.sql, which only hardened the
 * functions, not the table grant).
 *
 * Fix: revoke direct INSERT/UPDATE on the table from `authenticated`. All
 * mutation must go through the SECURITY DEFINER, ownership-checked
 * `award_xp()`/`update_streak()` functions, which bypass RLS as the table
 * owner regardless of the client-role grant.
 */
describe('BA-0026a: gamification_profiles must not be directly writable by authenticated', () => {
  it('finds gamification_profiles granted INSERT/UPDATE to authenticated somewhere in the chain', async () => {
    const { combined } = await allMigrationsSql();
    // Guards the parser itself.
    expect(combined).toMatch(
      /GRANT\s+SELECT,\s*INSERT,\s*UPDATE\s+ON\s+public\.gamification_profiles\s+TO\s+authenticated/i,
    );
  });

  it('ends with INSERT and UPDATE revoked from authenticated on gamification_profiles', async () => {
    const { files } = await allMigrationsSql();
    let insertGranted = false;
    let updateGranted = false;

    for (const file of files) {
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      if (/GRANT\s+[^;]*\bINSERT\b[^;]*ON\s+public\.gamification_profiles\s+TO\s+authenticated/i.test(sql)) {
        insertGranted = true;
      }
      if (/GRANT\s+[^;]*\bUPDATE\b[^;]*ON\s+public\.gamification_profiles\s+TO\s+authenticated/i.test(sql)) {
        updateGranted = true;
      }
      if (/REVOKE\s+[^;]*\bINSERT\b[^;]*ON\s+public\.gamification_profiles\s+FROM\s+authenticated/i.test(sql)) {
        insertGranted = false;
      }
      if (/REVOKE\s+[^;]*\bUPDATE\b[^;]*ON\s+public\.gamification_profiles\s+FROM\s+authenticated/i.test(sql)) {
        updateGranted = false;
      }
    }

    expect({ insertGranted, updateGranted }).toEqual({ insertGranted: false, updateGranted: false });
  });
});

/**
 * Sub-finding 2: `on_deadline_completed()` fires `award_xp()` on every
 * `false -> true` transition of `deadlines.completed`, and nothing stops a
 * user from toggling it back to false and true again to re-earn
 * `deadline_completed`/`deadline_early` XP indefinitely
 * (20260114014506_schema_cleanup_and_normalization.sql). `xp_events` never
 * had a UNIQUE constraint on `(user_id, event_type, reference_id)`.
 *
 * Fix: a UNIQUE index as a backstop, plus an idempotency check inside
 * `award_xp()` that returns early when a reference_id has already been
 * awarded for that event type.
 */
describe('BA-0026b: duplicate deadline-completion XP must be prevented', () => {
  it('finds award_xp in the migration chain', async () => {
    const { combined } = await allMigrationsSql();
    expect(combined).toMatch(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.award_xp/i);
  });

  it('adds a unique index guarding (user_id, event_type, reference_id) on xp_events', async () => {
    const { combined } = await allMigrationsSql();
    expect(combined).toMatch(
      /CREATE\s+UNIQUE\s+INDEX[^;]*ON\s+public\.xp_events\s*\(\s*user_id\s*,\s*event_type\s*,\s*reference_id\s*\)/i,
    );
  });

  it('the final award_xp() body short-circuits when the reference_id was already awarded', async () => {
    const { files } = await allMigrationsSql();
    let finalBody: string | null = null;

    const FN =
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.award_xp\s*\([^)]*\)[\s\S]*?AS\s*\$\$([\s\S]*?)\$\$\s*;/gi;

    for (const file of files) {
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      for (const match of sql.matchAll(FN)) {
        finalBody = match[1];
      }
    }

    expect(finalBody).not.toBeNull();
    expect(finalBody).toMatch(/p_reference_id[\s\S]{0,300}xp_events/i);
    expect(finalBody).toMatch(/already_awarded/i);
  });
});

/**
 * Sub-finding 3: `schedule_members` — "Schedule owners can update members" has
 * a USING clause that only checks the schedule belongs to the caller; it has
 * no WITH CHECK, so Postgres reuses the USING predicate for the new row too,
 * leaving `user_id` and `role` completely unconstrained. A schedule owner can
 * `update schedule_members set user_id = '<arbitrary-uuid>', role = 'owner'`
 * to hijack a membership row or self-grant co-ownership
 * (20260220100000_realtime_offline.sql:79-83).
 *
 * Fix: an explicit WITH CHECK that blocks granting 'owner' through a bare
 * UPDATE, plus a trigger that blocks reassigning an existing row's user_id
 * outside of service_role (RLS WITH CHECK alone cannot compare OLD vs NEW).
 */
describe('BA-0026c: schedule_members must not allow reassignment to arbitrary users/roles', () => {
  it('finds the schedule owners update policy in the migration chain', async () => {
    const { combined } = await allMigrationsSql();
    expect(combined).toMatch(/"Schedule owners can update members"/i);
  });

  it('the final update policy has a WITH CHECK that blocks self-granting owner', async () => {
    const { files } = await allMigrationsSql();
    let finalStatement: string | null = null;

    const POLICY =
      /CREATE\s+POLICY\s+"Schedule owners can update members"\s+ON\s+public\.schedule_members\s+FOR\s+UPDATE[\s\S]*?;/gi;

    for (const file of files) {
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      for (const match of sql.matchAll(POLICY)) {
        finalStatement = match[0];
      }
    }

    expect(finalStatement).not.toBeNull();
    expect(finalStatement).toMatch(/WITH\s+CHECK/i);
    expect(finalStatement).toMatch(/role\s*(?:<>|!=)\s*'owner'/i);
  });

  it('adds a trigger that blocks reassigning an existing membership to a different user', async () => {
    const { combined } = await allMigrationsSql();
    expect(combined).toMatch(
      /CREATE\s+TRIGGER\s+\w+[\s\S]{0,200}BEFORE\s+UPDATE[\s\S]{0,200}ON\s+public\.schedule_members/i,
    );
    expect(combined).toMatch(/NEW\.user_id\s+IS\s+DISTINCT\s+FROM\s+OLD\.user_id/i);
  });
});
