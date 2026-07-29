/**
 * Regression guard for BA-0023.
 *
 * `mv_deadline_analytics`, `mv_user_activity_summary` and `mv_xp_leaderboard`
 * are materialized views granted `SELECT` to `authenticated`
 * (20260114000000_add_missing_materialized_views.sql,
 * 20260124000000_complete_schema_initialization.sql). A materialized view is a
 * physically-stored snapshot: it cannot carry RLS or `security_invoker` at
 * all, so granting `SELECT` to `authenticated` hands every row of every
 * user's analytics to every logged-in user with no way to filter it.
 *
 * `anon` holds the same grant. That role is the publishable key shipped in the
 * web bundle, so the exposure is not merely cross-user — it is unauthenticated.
 * Verified against production on 2026-07-29: a plain
 * `GET /rest/v1/mv_xp_leaderboard` carrying only the anon key returned HTTP 200.
 * It returned zero rows only because the matviews have never been REFRESHed;
 * the first refresh would serve every user's analytics to the open internet.
 * Both roles must therefore be revoked, and the guard must fail if either is
 * left behind.
 *
 * The only correct remedy for a materialized view is to revoke the direct
 * grant and serve the data through a `SECURITY DEFINER` function (or a plain
 * view over one) that filters by `auth.uid()`.
 *
 * This asserts against the migration chain rather than a live database, so it
 * runs in CI with no credentials: for each matview, the final GRANT/REVOKE
 * statement touching a client role wins, and it must be a REVOKE. A
 * same-or-later migration must also grant `authenticated` execute on a
 * replacement function that reads that matview.
 */

import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase/migrations');

const MATVIEWS = ['mv_deadline_analytics', 'mv_user_activity_summary', 'mv_xp_leaderboard'] as const;

/** The two roles a client can reach the Data API as. Both must end up revoked. */
const CLIENT_ROLES = ['anon', 'authenticated'] as const;

/**
 * Matches a GRANT/REVOKE of SELECT (or ALL) touching `view` and naming `role`.
 *
 * Deliberately tolerant of the forms these migrations actually use: several
 * matviews listed in one statement, several roles listed in one `TO`/`FROM`
 * clause, and `ALL`/`ALL PRIVILEGES` in place of an explicit `SELECT`. Anchored
 * on `[^;]*` so it cannot run past the end of the statement into the next one.
 */
function aclRegex(action: 'GRANT' | 'REVOKE', view: string, role: string): RegExp {
  const preposition = action === 'GRANT' ? 'TO' : 'FROM';
  return new RegExp(
    `${action}\\s+(?:SELECT|ALL(?:\\s+PRIVILEGES)?)\\s+ON[^;]*\\b${view}\\b[^;]*${preposition}[^;]*\\b${role}\\b`,
    'i',
  );
}

type GrantState = { file: string; granted: boolean };

/** Final ACL state per `${view}:${role}`; a later statement supersedes an earlier one. */
async function buildFinalGrantState(): Promise<Map<string, GrantState>> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  const state = new Map<string, GrantState>();

  for (const file of files) {
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    for (const view of MATVIEWS) {
      for (const role of CLIENT_ROLES) {
        const key = `${view}:${role}`;
        if (aclRegex('GRANT', view, role).test(sql)) state.set(key, { file, granted: true });
        if (aclRegex('REVOKE', view, role).test(sql)) state.set(key, { file, granted: false });
      }
    }
  }

  return state;
}

describe('BA-0023: materialized views must not be directly granted to client roles', () => {
  it('finds all three matviews granted to authenticated somewhere in the chain', async () => {
    const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
    const everGranted = new Set<string>();
    for (const file of files) {
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      for (const view of MATVIEWS) {
        if (aclRegex('GRANT', view, 'authenticated').test(sql)) everGranted.add(view);
      }
    }
    // Guards the parser itself: if this stops matching, the assertions below
    // would vacuously pass and the regression would go unnoticed.
    expect([...everGranted].sort()).toEqual([...MATVIEWS].sort());
  });

  it.each(CLIENT_ROLES)('ends with %s revoked from every matview', async (role) => {
    const state = await buildFinalGrantState();

    // A matview never mentioned for this role counts as STILL GRANTED, not as
    // absent. `anon` holds the grant on production without any migration having
    // written it (Supabase's default schema grants), so silence in the chain is
    // exactly the case that must fail.
    const stillGranted = MATVIEWS.filter((view) => state.get(`${view}:${role}`)?.granted !== false);

    expect(stillGranted).toEqual([]);
  });

  it('grants authenticated execute on a replacement function for each matview', async () => {
    const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
    let sqlAll = '';
    for (const file of files) {
      sqlAll += await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      sqlAll += '\n';
    }

    for (const view of MATVIEWS) {
      // A function whose body reads the matview, with EXECUTE granted to authenticated.
      const readsView = new RegExp(`FUNCTION\\s+public\\.\\w+[\\s\\S]{0,600}?FROM\\s+public\\.${view}`, 'i');
      expect(sqlAll, `expected a function reading ${view}`).toMatch(readsView);
    }
    expect(sqlAll).toMatch(/GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.get_my_deadline_analytics/i);
    expect(sqlAll).toMatch(/GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.get_my_activity_summary/i);
    expect(sqlAll).toMatch(/GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.get_xp_leaderboard/i);
  });
});
