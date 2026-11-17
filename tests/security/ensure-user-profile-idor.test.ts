/**
 * Regression guard for BA-0022.
 *
 * `public.ensure_user_profile(p_user_id, p_email, p_full_name)` is
 * `SECURITY DEFINER` and `GRANT EXECUTE`d to `authenticated`, but its original
 * definition (20260109013302_disable_all_auth_triggers.sql) never checks that
 * the caller is the same user as `p_user_id`. Its sibling `create_user_profile()`
 * (same era) does check `IF p_user_id != auth.uid() THEN RAISE EXCEPTION`, so the
 * omission here is a real gap, not an intentional design choice.
 *
 * Any authenticated user can call
 * `supabase.rpc('ensure_user_profile', { p_user_id: '<victim>', p_email: 'x' })`
 * and overwrite the victim's `profiles.email` via the `ON CONFLICT DO UPDATE`
 * branch, since the row already exists for any signed-up victim.
 *
 * This asserts against the migration chain rather than a live database, so it
 * runs in CI with no credentials: the LAST `CREATE (OR REPLACE) FUNCTION
 * public.ensure_user_profile` body in migration order must contain an
 * ownership check comparing `auth.uid()` against `p_user_id` before it does
 * anything else.
 */

import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase/migrations');

/** Matches the full `CREATE (OR REPLACE) FUNCTION public.ensure_user_profile(...) ... AS $$ ... $$;` block. */
const ENSURE_USER_PROFILE_FN =
  /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+public\.ensure_user_profile\s*\([^)]*\)[\s\S]*?AS\s*\$\$([\s\S]*?)\$\$\s*;/gi;

/** An ownership check comparing the caller's uid to the target user id, in either operand order. */
const OWNERSHIP_CHECK =
  /(auth\.uid\(\)\s*(?:IS\s+DISTINCT\s+FROM|!=|<>)\s*p_user_id|p_user_id\s*(?:IS\s+DISTINCT\s+FROM|!=|<>)\s*auth\.uid\(\))/i;

type FnState = { file: string; body: string };

async function findFinalEnsureUserProfile(): Promise<FnState | null> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  let final: FnState | null = null;

  for (const file of files) {
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    for (const match of sql.matchAll(ENSURE_USER_PROFILE_FN)) {
      final = { file, body: match[1] };
    }
  }

  return final;
}

describe('BA-0022: ensure_user_profile must not allow cross-user overwrite', () => {
  it('finds ensure_user_profile in the migration chain', async () => {
    const final = await findFinalEnsureUserProfile();
    // Guards the parser itself: if this stops matching, the assertion below
    // would vacuously pass and the regression would go unnoticed.
    expect(final).not.toBeNull();
  });

  it('checks auth.uid() against p_user_id before writing profiles/gamification_profiles', async () => {
    const final = await findFinalEnsureUserProfile();
    expect(final).not.toBeNull();
    expect(final!.body).toMatch(OWNERSHIP_CHECK);
  });
});
