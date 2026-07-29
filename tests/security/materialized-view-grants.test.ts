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
 * The only correct remedy for a materialized view is to revoke the direct
 * grant and serve the data through a `SECURITY DEFINER` function (or a plain
 * view over one) that filters by `auth.uid()`.
 *
 * This asserts against the migration chain rather than a live database, so it
 * runs in CI with no credentials: for each matview, the final GRANT/REVOKE
 * statement touching `authenticated` wins, and it must be a REVOKE. A
 * same-or-later migration must also grant `authenticated` execute on a
 * replacement function that reads that matview.
 */

import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase/migrations');

const MATVIEWS = ['mv_deadline_analytics', 'mv_user_activity_summary', 'mv_xp_leaderboard'] as const;

function grantRegex(view: string): RegExp {
  return new RegExp(
    `GRANT\\s+SELECT\\s+ON\\s+(?:public\\.)?${view}\\s+TO\\s+authenticated`,
    'i',
  );
}

function revokeRegex(view: string): RegExp {
  return new RegExp(
    `REVOKE\\s+SELECT\\s+ON\\s+(?:public\\.)?${view}\\s+FROM\\s+authenticated`,
    'i',
  );
}

/** Also matches a REVOKE naming several matviews in one comma-separated statement. */
function revokeListRegex(view: string): RegExp {
  return new RegExp(`REVOKE\\s+SELECT\\s+ON[^;]*\\b${view}\\b[^;]*FROM\\s+authenticated`, 'i');
}

type GrantState = { file: string; granted: boolean };

async function buildFinalGrantState(): Promise<Map<string, GrantState>> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  const state = new Map<string, GrantState>();

  for (const file of files) {
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    for (const view of MATVIEWS) {
      if (grantRegex(view).test(sql)) state.set(view, { file, granted: true });
      if (revokeRegex(view).test(sql) || revokeListRegex(view).test(sql)) {
        state.set(view, { file, granted: false });
      }
    }
  }

  return state;
}

describe('BA-0023: materialized views must not be directly granted to authenticated', () => {
  it('finds all three matviews granted to authenticated somewhere in the chain', async () => {
    const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
    const everGranted = new Set<string>();
    for (const file of files) {
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      for (const view of MATVIEWS) {
        if (grantRegex(view).test(sql)) everGranted.add(view);
      }
    }
    // Guards the parser itself: if this stops matching, the assertions below
    // would vacuously pass and the regression would go unnoticed.
    expect([...everGranted].sort()).toEqual([...MATVIEWS].sort());
  });

  it('ends with authenticated revoked from every matview', async () => {
    const state = await buildFinalGrantState();

    const stillGranted = MATVIEWS.filter((view) => state.get(view)?.granted !== false);

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
