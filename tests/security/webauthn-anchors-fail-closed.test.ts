import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getRelyingPartyId, getExpectedOrigin } from '@/lib/security/webauthn';
import { getRpId, getOrigin } from '@/app/api/auth/passkey/_lib';

/**
 * BA-0003 regression cover.
 *
 * `WEBAUTHN_RP_ID` and `WEBAUTHN_ORIGIN` are the values that bind an assertion
 * to this site. Both resolvers — and there are two parallel implementations,
 * one per passkey stack — used to fall back to the request's own `Host`/`Origin`
 * header when the variable was missing. That makes the verification circular:
 * the origin inside `clientDataJSON` is compared against an origin the caller
 * also controls, so the comparison cannot fail and the binding is worthless.
 *
 * Production does set both, so this was latent — but only as long as
 * `process.env` is populated, and BA-0017 is the standing proof that an
 * OpenNext/Workers isolate can come up without it. Under that failure the old
 * code silently downgraded to attacker-controlled anchors instead of refusing.
 */

const ANCHORS = ['WEBAUTHN_RP_ID', 'WEBAUTHN_ORIGIN'] as const;

describe('WebAuthn origin/RP anchors fail closed on deployed runtimes', () => {
  const saved: Record<string, string | undefined> = {};
  let savedNodeEnv: string | undefined;

  beforeEach(() => {
    for (const key of ANCHORS) saved[key] = process.env[key];
    savedNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    for (const key of ANCHORS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
    // NODE_ENV is readonly in the Next types but writable at runtime.
    const mutableEnv = process.env as Record<string, string | undefined>;
    if (savedNodeEnv === undefined) delete mutableEnv.NODE_ENV;
    else mutableEnv.NODE_ENV = savedNodeEnv;
  });

  const setDeployed = (deployed: boolean) => {
    // NODE_ENV is readonly in the Next types but writable at runtime; both
    // deployed Workers (preview and production) report 'production'.
    (process.env as Record<string, string>).NODE_ENV = deployed ? 'production' : 'development';
  };

  const attackerRequest = () =>
    new NextRequest('https://evil.example/api/auth/passkey/verify', {
      headers: { host: 'evil.example', origin: 'https://evil.example' },
    });

  describe('lib/security/webauthn.ts (used by /api/webauthn/*)', () => {
    it('refuses a header-derived RP ID when WEBAUTHN_RP_ID is missing', () => {
      delete process.env.WEBAUTHN_RP_ID;
      setDeployed(true);
      expect(() => getRelyingPartyId('evil.example')).toThrow(/WEBAUTHN_RP_ID/);
    });

    it('refuses a caller-supplied expected origin when WEBAUTHN_ORIGIN is missing', () => {
      delete process.env.WEBAUTHN_ORIGIN;
      setDeployed(true);
      expect(() => getExpectedOrigin('https://evil.example')).toThrow(/WEBAUTHN_ORIGIN/);
    });

    it('uses the configured anchors and ignores the request entirely', () => {
      process.env.WEBAUTHN_RP_ID = 'syllabus-sync.app';
      process.env.WEBAUTHN_ORIGIN = 'https://www.syllabus-sync.app';
      setDeployed(true);
      expect(getRelyingPartyId('evil.example')).toBe('syllabus-sync.app');
      expect(getExpectedOrigin('https://evil.example')).toBe('https://www.syllabus-sync.app');
    });

    it('still derives from the host in local development', () => {
      delete process.env.WEBAUTHN_RP_ID;
      delete process.env.WEBAUTHN_ORIGIN;
      setDeployed(false);
      expect(getRelyingPartyId('localhost:3000')).toBe('localhost');
      expect(getExpectedOrigin('http://localhost:3000')).toBe('http://localhost:3000');
    });
  });

  describe('app/api/auth/passkey/_lib.ts (used by /api/auth/passkey/*)', () => {
    it('refuses a header-derived RP ID when WEBAUTHN_RP_ID is missing', () => {
      delete process.env.WEBAUTHN_RP_ID;
      setDeployed(true);
      expect(() => getRpId(attackerRequest())).toThrow(/WEBAUTHN_RP_ID/);
    });

    it('refuses the caller-supplied Origin header when WEBAUTHN_ORIGIN is missing', () => {
      delete process.env.WEBAUTHN_ORIGIN;
      setDeployed(true);
      expect(() => getOrigin(attackerRequest())).toThrow(/WEBAUTHN_ORIGIN/);
    });

    it('uses the configured anchors and ignores the request entirely', () => {
      process.env.WEBAUTHN_RP_ID = 'syllabus-sync.app';
      process.env.WEBAUTHN_ORIGIN = 'https://www.syllabus-sync.app';
      setDeployed(true);
      expect(getRpId(attackerRequest())).toBe('syllabus-sync.app');
      expect(getOrigin(attackerRequest())).toBe('https://www.syllabus-sync.app');
    });

    it('still derives from the request in local development', () => {
      delete process.env.WEBAUTHN_RP_ID;
      delete process.env.WEBAUTHN_ORIGIN;
      setDeployed(false);
      const local = new NextRequest('http://localhost:3000/api/auth/passkey/verify', {
        headers: { host: 'localhost:3000', origin: 'http://localhost:3000' },
      });
      expect(getRpId(local)).toBe('localhost');
      expect(getOrigin(local)).toBe('http://localhost:3000');
    });
  });

  it('treats an empty or whitespace-only anchor as missing, not as a value', () => {
    // A blank Worker var must not be accepted as a configured anchor — that is
    // exactly the BA-0017 shape this guard exists to survive.
    process.env.WEBAUTHN_RP_ID = '   ';
    setDeployed(true);
    expect(() => getRelyingPartyId('evil.example')).toThrow(/WEBAUTHN_RP_ID/);
  });
});
