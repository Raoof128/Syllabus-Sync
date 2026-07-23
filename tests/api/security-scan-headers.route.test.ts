import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  resolveHostAddresses: vi.fn(),
  securityScanLimiter: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn().mockResolvedValue({
    auth: { getUser: mocks.getUser },
  }),
}));

vi.mock('@/lib/security/dns-resolution', () => ({
  resolveHostAddresses: mocks.resolveHostAddresses,
}));

vi.mock('@/lib/services/rateLimitService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/services/rateLimitService')>();
  return { ...actual, securityScanLimiter: mocks.securityScanLimiter };
});

vi.mock('@/lib/security/ip', () => ({
  getClientIP: vi.fn().mockReturnValue('203.0.113.50'),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn() },
}));

function scanRequest(url = 'https://example.com/path'): NextRequest {
  return new NextRequest('http://localhost:3000/api/security/scan-headers', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
    },
    body: JSON.stringify({ url }),
  });
}

describe('POST /api/security/scan-headers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mocks.securityScanLimiter.mockResolvedValue({
      allowed: true,
      remaining: 19,
      resetIn: 60,
      limit: 20,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects unauthenticated requests before rate limiting, DNS, or fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const { POST } = await import('@/app/api/security/scan-headers/route');

    const response = await POST(scanRequest());

    expect(response.status).toBe(401);
    expect(mocks.securityScanLimiter).not.toHaveBeenCalled();
    expect(mocks.resolveHostAddresses).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects rate-limited requests before DNS or fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    mocks.securityScanLimiter.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetIn: 30,
      limit: 20,
    });
    const { POST } = await import('@/app/api/security/scan-headers/route');

    const response = await POST(scanRequest());

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('30');
    expect(mocks.resolveHostAddresses).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['private IPv4', ['10.0.0.1']],
    ['IPv4 loopback', ['127.0.0.1']],
    ['IPv4 link-local metadata', ['169.254.169.254']],
    ['IPv6 loopback', ['::1']],
    ['expanded IPv6 loopback', ['0:0:0:0:0:0:0:1']],
    ['IPv6 unique-local', ['fc00::1']],
    ['IPv6 link-local', ['fe80::1']],
    ['IPv4-mapped IPv6 loopback', ['::ffff:127.0.0.1']],
    ['hex-encoded IPv4-mapped IPv6 loopback', ['::ffff:7f00:1']],
    ['mixed public and private answers', ['203.0.113.10', '10.0.0.1']],
  ])('rejects %s resolution before fetch', async (_label, addresses) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    mocks.resolveHostAddresses.mockResolvedValue(addresses);
    const { POST } = await import('@/app/api/security/scan-headers/route');

    const response = await POST(scanRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe('Target resolves to a private network address');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns the exact stable resolution error when both DNS families fail', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    mocks.resolveHostAddresses.mockRejectedValue(new Error('Unable to resolve target host'));
    const { POST } = await import('@/app/api/security/scan-headers/route');

    const response = await POST(scanRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe('Unable to resolve target host');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a bracketed IPv6 loopback literal before DNS or fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/security/scan-headers/route');

    const response = await POST(scanRequest('http://[::1]/'));

    expect(response.status).toBe(400);
    expect(mocks.resolveHostAddresses).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('scans a public answer without following a redirect to loopback', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: 'http://127.0.0.1/' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    mocks.resolveHostAddresses.mockResolvedValue(['203.0.113.10']);
    const { POST } = await import('@/app/api/security/scan-headers/route');

    const response = await POST(scanRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.result).toMatchObject({ grade: 'F' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/path',
      expect.objectContaining({
        method: 'HEAD',
        redirect: 'manual',
        signal: expect.any(AbortSignal),
      }),
    );
  });
});
