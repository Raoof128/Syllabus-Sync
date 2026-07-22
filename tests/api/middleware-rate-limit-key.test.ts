import { NextRequest, NextResponse } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(async () => ({
    allowed: true,
    remaining: 9,
    resetIn: 60,
    limit: 10,
  })),
  getClientIP: vi.fn(() => '203.0.113.20'),
}));

vi.mock('@/lib/services/rateLimitService', () => ({
  checkRateLimit: mocks.checkRateLimit,
  mutationLimiter: vi.fn(),
}));

vi.mock('@/lib/security/ip', () => ({
  getClientIP: mocks.getClientIP,
}));

import { rateLimit } from '@/app/api/_lib/middleware';

describe('API middleware rate-limit identity', () => {
  it('keeps the client-IP and pathname key shape with the shared IP parser', async () => {
    const request = new NextRequest('https://www.syllabus-sync.app/api/example?ignored=true');
    const handler = vi.fn(async () => NextResponse.json({ success: true }));

    const response = await rateLimit({
      windowMs: 60_000,
      maxRequests: 10,
      prefix: 'test-api',
    })(request, handler);

    expect(mocks.getClientIP).toHaveBeenCalledWith(request);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith('203.0.113.20:/api/example', {
      windowMs: 60_000,
      maxRequests: 10,
      prefix: 'test-api',
    });
    expect(handler).toHaveBeenCalledOnce();
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('9');
  });
});
