/**
 * Regression guard for BA-0059.
 *
 * Passkey public keys are the thing /api/webauthn/authenticate/verify trusts to
 * mint a session, so the only way one may enter storage is a completed
 * registration ceremony (verifyRegistrationResponse against a server-issued,
 * single-use, user-bound challenge).
 *
 * Two storage paths broke that rule:
 *
 *  1. `public.webauthn_credentials` carried "Users can insert own credentials"
 *     and "Users can update own credentials" policies, so a stolen access token
 *     plus the public anon key could POST/PATCH a software-generated key
 *     straight through PostgREST.
 *  2. The legacy `user_metadata.biometric_*` slot, which the account holder can
 *     rewrite through Supabase's own PUT /auth/v1/user, was accepted as a
 *     credential source by the login ceremony.
 *
 * (2) is covered in webauthn-cross-user-credential.test.ts and
 * webauthn-auth-options.test.ts. This file covers (1) at both layers: the
 * migration chain's final policy state, and the application write path.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Database layer: final policy state of the migration chain
// ---------------------------------------------------------------------------

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'supabase/migrations');

const CREATE_POLICY =
  /CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+public\.webauthn_credentials\s+FOR\s+(\w+)([\s\S]*?);/gi;
const DROP_POLICY =
  /DROP\s+POLICY\s+(?:IF\s+EXISTS\s+)?"([^"]+)"\s+ON\s+public\.webauthn_credentials/gi;

type PolicyState = { file: string; command: string; body: string };

async function buildFinalPolicyState(): Promise<Map<string, PolicyState>> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  const state = new Map<string, PolicyState>();

  for (const file of files) {
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    const events: Array<{
      index: number;
      kind: 'create' | 'drop';
      name: string;
      command?: string;
      body?: string;
    }> = [];
    for (const m of sql.matchAll(CREATE_POLICY)) {
      events.push({
        index: m.index ?? 0,
        kind: 'create',
        name: m[1],
        command: m[2].toUpperCase(),
        body: m[3],
      });
    }
    for (const m of sql.matchAll(DROP_POLICY)) {
      events.push({ index: m.index ?? 0, kind: 'drop', name: m[1] });
    }
    events.sort((a, b) => a.index - b.index);

    for (const e of events) {
      if (e.kind === 'drop') state.delete(e.name);
      else state.set(e.name, { file, command: e.command ?? '', body: e.body ?? '' });
    }
  }
  return state;
}

describe('webauthn_credentials — no client write path in the final migration state', () => {
  it('leaves no INSERT, UPDATE or ALL policy reachable by a client role', async () => {
    const state = await buildFinalPolicyState();
    const clientWritable = [...state.entries()].filter(
      ([, p]) =>
        ['INSERT', 'UPDATE', 'ALL'].includes(p.command) && !/\bTO\s+service_role\b/i.test(p.body),
    );
    expect(clientWritable.map(([name, p]) => `${name} (${p.file})`)).toEqual([]);
  });

  it('keeps owner SELECT and DELETE — listing and removing passkeys still work', async () => {
    const state = await buildFinalPolicyState();
    const commands = [...state.values()].map((p) => p.command);
    expect(commands).toContain('SELECT');
    expect(commands).toContain('DELETE');
  });

  it('revokes the table-level INSERT/UPDATE grant, not just the policies', async () => {
    // RLS is one layer; BA-0055 is the standing reason not to rely on it alone.
    const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
    const all = (
      await Promise.all(files.map((f) => readFile(path.join(MIGRATIONS_DIR, f), 'utf8')))
    ).join('\n');
    expect(all).toMatch(
      /REVOKE\s+INSERT,\s*UPDATE[^;]*ON\s+TABLE\s+public\.webauthn_credentials\s+FROM\s+authenticated/i,
    );
    expect(all).toMatch(/REVOKE\s+ALL\s+ON\s+TABLE\s+public\.webauthn_credentials\s+FROM\s+anon/i);
  });
});

// ---------------------------------------------------------------------------
// Application layer: storeCredential writes only through the service role
// ---------------------------------------------------------------------------

const adminInsert = vi.fn();
const adminCountEq = vi.fn();
const userClientFrom = vi.fn();
let adminAvailable = true;

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () =>
    adminAvailable
      ? {
          from: () => ({
            select: () => ({ eq: adminCountEq }),
            insert: adminInsert,
          }),
        }
      : null,
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: async () => ({ from: userClientFrom }),
}));

import { storeCredential, MAX_PASSKEYS_PER_USER } from '@/lib/security/webauthn';

const params = {
  userId: 'user-1',
  credentialId: 'cred-1',
  publicKey: 'pk',
  counter: 0,
  transports: ['internal'],
  deviceName: 'Laptop',
};

describe('storeCredential (BA-0059)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminAvailable = true;
    adminCountEq.mockResolvedValue({ count: 0, error: null });
    adminInsert.mockResolvedValue({ error: null });
  });

  it('inserts through the service-role client and never the session client', async () => {
    await storeCredential(params);

    expect(adminInsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', credential_id: 'cred-1', public_key: 'pk' }),
    );
    expect(userClientFrom).not.toHaveBeenCalled();
  });

  it('fails closed when the service-role client is unavailable', async () => {
    adminAvailable = false;
    await expect(storeCredential(params)).rejects.toThrow();
    expect(adminInsert).not.toHaveBeenCalled();
  });

  it('does not read a failed count as "under the passkey limit"', async () => {
    adminCountEq.mockResolvedValue({ count: null, error: { message: 'boom' } });
    await expect(storeCredential(params)).rejects.toThrow();
    expect(adminInsert).not.toHaveBeenCalled();
  });

  it('enforces the per-user passkey limit', async () => {
    adminCountEq.mockResolvedValue({ count: MAX_PASSKEYS_PER_USER, error: null });
    await expect(storeCredential(params)).rejects.toThrow(/Maximum/);
    expect(adminInsert).not.toHaveBeenCalled();
  });
});
