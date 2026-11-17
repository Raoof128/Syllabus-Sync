/**
 * Regression guard for BA-0025.
 *
 * `public.webauthn_challenges` RLS policies
 * (20260207000000_add_webauthn_tables.sql, faithfully re-created rather than
 * fixed at 20260214003000_restore_missing_core_security_tables.sql) read:
 *
 *   CREATE POLICY "Users can view own challenges" ON public.webauthn_challenges
 *     FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
 *
 * with no `TO authenticated` clause, so the policy applies to `PUBLIC` —
 * which includes the `anon` role. Supabase's `anon` key is shipped in every
 * web bundle, and no table-level `REVOKE` narrows it back. Combined with the
 * `OR user_id IS NULL` branch (meant for pre-authentication challenge rows),
 * any unauthenticated caller can read, insert, or delete every in-flight
 * passkey ceremony system-wide via plain PostgREST calls — no signup
 * required.
 *
 * The app never queries this table from a client role at all: both reads and
 * writes go through `createAdminClient()` (service_role) in
 * `lib/security/webauthn.ts`, which bypasses RLS entirely. So the client-facing
 * policies serve no legitimate purpose and the correct fix is to remove them,
 * leaving only the service_role policy.
 *
 * This asserts against the migration chain rather than a live database, so it
 * runs in CI with no credentials: every policy that remains defined (created,
 * and not later dropped) on `public.webauthn_challenges` in the final
 * migration state must be scoped `TO service_role` only.
 */

import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase/migrations');
const TABLE = 'public.webauthn_challenges';

const CREATE_POLICY = new RegExp(
  `CREATE\\s+POLICY\\s+"([^"]+)"\\s+ON\\s+${TABLE.replace('.', '\\.')}\\s+FOR\\s+\\w+[\\s\\S]*?;`,
  'gi',
);
const DROP_POLICY = new RegExp(
  `DROP\\s+POLICY\\s+(?:IF\\s+EXISTS\\s+)?"([^"]+)"\\s+ON\\s+${TABLE.replace('.', '\\.')}`,
  'gi',
);

type PolicyState = { file: string; statement: string };

async function buildFinalPolicyState(): Promise<Map<string, PolicyState>> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  const state = new Map<string, PolicyState>();

  for (const file of files) {
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');

    // Order matters within a file: process drops and creates in source order.
    const events: Array<{ index: number; kind: 'create' | 'drop'; name: string; statement: string }> = [];
    for (const match of sql.matchAll(CREATE_POLICY)) {
      events.push({ index: match.index ?? 0, kind: 'create', name: match[1], statement: match[0] });
    }
    for (const match of sql.matchAll(DROP_POLICY)) {
      events.push({ index: match.index ?? 0, kind: 'drop', name: match[1], statement: match[0] });
    }
    events.sort((a, b) => a.index - b.index);

    for (const event of events) {
      if (event.kind === 'drop') {
        state.delete(event.name);
      } else {
        state.set(event.name, { file, statement: event.statement });
      }
    }
  }

  return state;
}

describe('BA-0025: webauthn_challenges policies must not be reachable without authentication', () => {
  it('finds webauthn_challenges policies in the migration chain', async () => {
    const state = await buildFinalPolicyState();
    // Guards the parser itself: if this stops matching (e.g. all policies
    // dropped and none recreated, or the regex breaks), the assertion below
    // would vacuously pass and the regression would go unnoticed.
    expect(state.size).toBeGreaterThan(0);
  });

  it('scopes every remaining policy to service_role only', async () => {
    const state = await buildFinalPolicyState();

    const unsafe = [...state.entries()]
      .filter(([, value]) => !/\bTO\s+service_role\b/i.test(value.statement))
      .map(([name, value]) => `${name} (last defined in ${value.file})`);

    expect(unsafe).toEqual([]);
  });
});
