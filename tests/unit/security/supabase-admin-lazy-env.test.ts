/**
 * Reproduction for BA-0017.
 *
 * `lib/supabase/admin.ts` used to read `NEXT_PUBLIC_SUPABASE_URL` and
 * `SUPABASE_SERVICE_ROLE_KEY` into module-scope `const`s at import time.
 * That's fragile under OpenNext on Cloudflare Workers, which populates
 * `process.env` for a request once the module graph may already have been
 * evaluated — if this module's top-level code runs before the platform has
 * finished populating `process.env`, `createAdminClient()` is permanently
 * stuck treating the admin client as unconfigured for the rest of that
 * isolate's lifetime, since the stale empty-string consts are captured once
 * and never re-read.
 *
 * This is reproduced by importing the module fresh with the relevant env
 * vars unset (simulating "not populated yet"), then setting valid values
 * *after* import and calling `createAdminClient()` — which must succeed if
 * the env is read lazily, and was stuck returning `null` before the fix.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };
const VALID_URL = 'https://my-project.supabase.co';
const VALID_KEY = `eyJ${'a'.repeat(40)}`;

describe('BA-0017: lib/supabase/admin reads env lazily, not at module scope', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('createAdminClient() picks up env vars set after the module was first imported', async () => {
    // Import with the env vars still unset — mirrors a Worker isolate
    // evaluating this module before OpenNext has finished populating
    // process.env for the request.
    const { createAdminClient, isAdminClientAvailable } = await import('@/lib/supabase/admin');

    expect(isAdminClientAvailable()).toBe(false);
    expect(createAdminClient()).toBeNull();

    // Env vars become available afterward (e.g. a later point in the same
    // isolate's lifecycle, or a differently-ordered but still-valid request).
    process.env.NEXT_PUBLIC_SUPABASE_URL = VALID_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = VALID_KEY;

    expect(isAdminClientAvailable()).toBe(true);
    expect(createAdminClient()).not.toBeNull();
  });

  it('createAdminClient() stops working if env vars are cleared later (proves it re-reads, not caches "configured")', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = VALID_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = VALID_KEY;

    const { createAdminClient } = await import('@/lib/supabase/admin');
    expect(createAdminClient()).not.toBeNull();

    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(createAdminClient()).toBeNull();
  });
});
