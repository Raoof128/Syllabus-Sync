import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  apiLimiter: vi.fn(),
  passwordBreachLimiter: vi.fn(),
  checkPasswordBreach: vi.fn(),
}));

vi.mock('@/app/api/_lib/middleware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/app/api/_lib/middleware')>();
  return { ...actual, requireAuth: mocks.requireAuth };
});

vi.mock('@/lib/services/rateLimitService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/services/rateLimitService')>();
  return {
    ...actual,
    apiLimiter: mocks.apiLimiter,
    passwordBreachLimiter: mocks.passwordBreachLimiter,
  };
});

vi.mock('@/lib/security/password-breach', () => ({
  checkPasswordBreach: mocks.checkPasswordBreach,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

function navigationRequest(startLat: number): NextRequest {
  return new NextRequest('http://localhost:3000/api/navigate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
    },
    body: JSON.stringify({
      start: { lat: startLat, lng: 151.112 },
      end: { lat: startLat + 0.001, lng: 151.113 },
    }),
  });
}

function breachRequest(password: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/security/check-password-breach', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
    },
    body: JSON.stringify({ password }),
  });
}

describe('protected API route-level authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.apiLimiter.mockResolvedValue({ allowed: true, remaining: 9, resetIn: 60, limit: 10 });
    mocks.passwordBreachLimiter.mockResolvedValue({
      allowed: true,
      remaining: 4,
      resetIn: 60,
      limit: 5,
    });
    mocks.checkPasswordBreach.mockResolvedValue({ isBreached: false, count: 0 });
  });

  it.each([
    {
      label: 'navigation',
      loadHandler: async () => (await import('@/app/api/navigate/route')).POST,
      request: () => navigationRequest(-33.77),
      protectedWork: mocks.apiLimiter,
    },
    {
      label: 'password breach',
      loadHandler: async () =>
        (await import('@/app/api/security/check-password-breach/route')).POST,
      request: () => breachRequest('correct horse battery staple'),
      protectedWork: mocks.passwordBreachLimiter,
    },
    {
      label: 'gamification profile',
      loadHandler: async () => (await import('@/app/api/gamification/route')).GET,
      request: () => new NextRequest('http://localhost:3000/api/gamification'),
      protectedWork: mocks.apiLimiter,
    },
    {
      label: 'admin availability',
      loadHandler: async () =>
        (await import('@/app/api/admin/update-building-positions/route')).GET,
      request: () => new NextRequest('http://localhost:3000/api/admin/update-building-positions'),
    },
    {
      label: 'admin position update',
      loadHandler: async () =>
        (await import('@/app/api/admin/update-building-positions/route')).POST,
      request: () =>
        new NextRequest('http://localhost:3000/api/admin/update-building-positions', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            origin: 'http://localhost:3000',
          },
          body: JSON.stringify({ changes: [] }),
        }),
    },
  ])('rejects unauthenticated $label requests before protected work', async (scenario) => {
    mocks.requireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 }),
    );
    const handler = await scenario.loadHandler();

    const response = await handler(scenario.request());

    expect(response.status).toBe(401);
    expect(mocks.requireAuth).toHaveBeenCalledTimes(1);
    if ('protectedWork' in scenario) {
      expect(scenario.protectedWork).not.toHaveBeenCalled();
    }
  });

  it('preserves the authorized navigation demo response and limiter headers', async () => {
    mocks.requireAuth.mockImplementationOnce(async (request, handler) => handler('user-1'));
    const { POST } = await import('@/app/api/navigate/route');

    const response = await POST(navigationRequest(-33.772));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Cache')).toBe('DEMO');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('9');
    expect(body.success).toBe(true);
    expect(body.data.type).toBe('FeatureCollection');
  });

  it('preserves the authorized password breach response and limiter headers', async () => {
    mocks.requireAuth.mockImplementationOnce(async (request, handler) => handler('user-1'));
    const { POST } = await import('@/app/api/security/check-password-breach/route');

    const response = await POST(breachRequest('correct horse battery staple'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('4');
    expect(body).toEqual({
      success: true,
      result: { isBreached: false, count: 0 },
    });
  });
});
