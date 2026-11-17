/**
 * Regression guard for BA-0021.
 *
 * A Postgres view without `security_invoker = true` runs as its owner, so RLS on
 * the underlying tables does not apply to callers. `public.user_details` is
 * granted to `authenticated` and selects from `profiles`, so losing the option
 * exposes every user's email, full name and student ID to any logged-in user.
 *
 * That option has already been lost twice — set in 20260113000000, restored in
 * 20260226000000, then dropped again by 20260304100000, which recreated the view
 * to add a column and did not carry the option forward. Both regressions came
 * from a DROP/CREATE that looked routine.
 *
 * This asserts against the migration chain rather than a live database, so it
 * runs in CI with no credentials: for every view, the final definition wins, and
 * that definition must either set the option inline or be followed by a
 * migration that sets it.
 */

import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase/migrations');

/** `CREATE VIEW x AS` / `CREATE OR REPLACE VIEW x AS`, capturing the name. */
const CREATE_VIEW = /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+((?:[\w.]+))/gi;
/** `ALTER VIEW x SET (security_invoker = true)`. */
const ALTER_SET_INVOKER =
  /ALTER\s+VIEW\s+(?:IF\s+EXISTS\s+)?([\w.]+)[\s\S]{0,200}?security_invoker\s*=\s*true/gi;

type ViewState = { file: string; hasInvoker: boolean };

async function buildFinalViewState(): Promise<Map<string, ViewState>> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  const state = new Map<string, ViewState>();

  for (const file of files) {
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');

    // A later definition replaces whatever came before it.
    for (const match of sql.matchAll(CREATE_VIEW)) {
      const name = match[1].toLowerCase();
      // Does this specific statement carry the option before its terminating `;`?
      const after = sql.slice(match.index ?? 0);
      const statement = after.slice(0, after.indexOf(';') + 1 || after.length);
      state.set(name, { file, hasInvoker: /security_invoker\s*=\s*true/i.test(statement) });
    }

    // A later ALTER can repair an earlier definition.
    for (const match of sql.matchAll(ALTER_SET_INVOKER)) {
      const name = match[1].toLowerCase();
      const previous = state.get(name);
      if (previous) state.set(name, { ...previous, hasInvoker: true });
    }

    // The catalog-driven repair migration fixes every public view at once.
    if (/relkind\s*=\s*'v'/i.test(sql) && /security_invoker\s*=\s*true/i.test(sql)) {
      for (const [name, value] of state) state.set(name, { ...value, hasInvoker: true });
    }
  }

  return state;
}

describe('BA-0021: views must not bypass RLS', () => {
  it('finds the user_details view in the migration chain', async () => {
    const state = await buildFinalViewState();
    // Guards the parser itself: if this stops matching, the assertion below
    // would vacuously pass and the regression would go unnoticed.
    expect([...state.keys()]).toContain('public.user_details');
  });

  it('leaves every view with security_invoker enabled in its final state', async () => {
    const state = await buildFinalViewState();

    const exposed = [...state.entries()]
      .filter(([, value]) => !value.hasInvoker)
      .map(([name, value]) => `${name} (last defined in ${value.file})`);

    expect(exposed).toEqual([]);
  });
});
