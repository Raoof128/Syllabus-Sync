/**
 * Reproduction for BA-0048 (P0) — the finding this audit twice failed to see.
 *
 * `public.profiles` carries `profiles_select`: PERMISSIVE, FOR SELECT, role
 * `public` (which `authenticated` is a member of), `USING (true)`. Alongside it
 * sits the correct `"Users can view their own profile"` with
 * `USING (auth.uid() = id)`. Postgres ORs permissive policies together, so the
 * unconditional one wins and the ownership check is dead weight. `authenticated`
 * holds the table-level SELECT grant, so every logged-in user can read every
 * row.
 *
 * PROVEN against production on 2026-07-30. A throwaway account created seconds
 * earlier, with no relationship to any other user, read **30 profile rows** —
 * every user's email and full name, plus 16 student IDs.
 *
 * Why it was missed twice:
 *
 *  1. BA-0021 concluded there was no live PII exposure. That conclusion was
 *     drawn from `public.user_details` (the view), which genuinely does carry
 *     `security_invoker = true` and genuinely does deny anon. The base table's
 *     own policies were never examined, so the exposure was reported as absent
 *     when it was live the whole time.
 *  2. BA-0030 dropped always-true policies from `events`, `deadlines`, `units`
 *     and `class_times` — the four tables Supabase's advisor happened to name —
 *     instead of sweeping the catalog. `profiles` has the identical defect and
 *     was not in that list.
 *
 * Both failures share a cause: trusting a derived object or a supplied list over
 * the catalog. Hence the sweep below is written against every table in `public`
 * rather than an enumerated set, so the next table with this defect fails here
 * without anyone having to think of it.
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

describe('BA-0048: profiles must not be readable across users', () => {
  it('drops the unconditional profiles_select policy', async () => {
    const sql = await allMigrationSql();
    expect(sql).toMatch(
      /DROP\s+POLICY\s+(?:IF\s+EXISTS\s+)?"?profiles_select"?\s+ON\s+(?:public\.)?profiles/i,
    );
  });

  it('keeps an ownership-scoped SELECT policy on profiles', async () => {
    const sql = await allMigrationSql();
    // Guards over-correction: dropping every SELECT policy would lock users out
    // of their own profile.
    expect(sql).toMatch(/ON\s+(?:public\.)?profiles[\s\S]{0,300}?auth\.uid\(\)\s*=\s*id/i);
  });

  it('verifies by catalog sweep rather than an enumerated table list', async () => {
    const sql = await allMigrationSql();

    // The remediation migration must assert against pg_policies across the whole
    // schema. A fix that only names `profiles` would repeat the BA-0030 mistake.
    const remediation = sql.slice(sql.indexOf('BA-0048'));
    expect(remediation).toMatch(/pg_policies/i);
    expect(remediation).toMatch(/permissive/i);
    // Must consider the client-reachable roles, not just one of them.
    expect(remediation).toMatch(/anon/i);
    expect(remediation).toMatch(/authenticated/i);
  });
});
