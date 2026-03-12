/**
 * CSP Module Tests
 */
import { describe, it, expect } from 'vitest';
import {
  generateNonce,
  buildNonceCSP,
  buildCSP,
  buildDevCSP,
  buildProdCSP,
  getCSP,
  THEME_SCRIPT,
  RTL_SCRIPT,
  CSP_SCRIPT_HASHES,
} from '@/lib/security/csp';

describe('generateNonce', () => {
  it('generates a base64 string', () => {
    const nonce = generateNonce();
    expect(typeof nonce).toBe('string');
    expect(nonce.length).toBeGreaterThan(0);
  });

  it('generates unique nonces', () => {
    expect(generateNonce()).not.toBe(generateNonce());
  });
});

describe('buildNonceCSP', () => {
  it('includes nonce in script-src', () => {
    const csp = buildNonceCSP('test-nonce');
    expect(csp).toContain("'nonce-test-nonce'");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'self'");
  });
});

describe('buildCSP', () => {
  it('includes script hashes', () => {
    const csp = buildCSP();
    for (const hash of Object.values(CSP_SCRIPT_HASHES)) {
      expect(csp).toContain(`'${hash}'`);
    }
  });

  it('accepts additional sources', () => {
    const csp = buildCSP({
      additionalScriptSrc: ['https://cdn.example.com'],
      additionalConnectSrc: ['https://api.custom.com'],
    });
    expect(csp).toContain('https://cdn.example.com');
    expect(csp).toContain('https://api.custom.com');
  });

  it('includes report directives', () => {
    const csp = buildCSP({ reportUri: 'https://r.example.com', reportTo: 'endpoint' });
    expect(csp).toContain('report-uri https://r.example.com');
    expect(csp).toContain('report-to endpoint');
  });

  it('omits upgrade-insecure when false', () => {
    expect(buildCSP({ upgradeInsecure: false })).not.toContain('upgrade-insecure');
  });
});

describe('buildDevCSP', () => {
  it('includes unsafe-eval and websockets', () => {
    const csp = buildDevCSP();
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain('ws://localhost:*');
  });
});

describe('buildProdCSP', () => {
  it('includes upgrade-insecure and Sentry', () => {
    const csp = buildProdCSP();
    expect(csp).toContain('upgrade-insecure-requests');
    expect(csp).toContain('https://*.sentry.io');
  });
});

describe('getCSP', () => {
  it('returns a valid CSP string', () => {
    const csp = getCSP();
    expect(csp).toContain("default-src 'self'");
  });
});

describe('CSP script constants', () => {
  it('THEME_SCRIPT and RTL_SCRIPT are defined', () => {
    expect(THEME_SCRIPT).toContain('theme');
    expect(RTL_SCRIPT).toContain('language');
  });
});
