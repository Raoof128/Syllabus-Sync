import { beforeEach, describe, expect, it, vi } from 'vitest';

const createServerClientMock = vi.fn();
const mutationLimiterMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => createServerClientMock(),
}));

vi.mock('@/lib/services/rateLimitService', () => ({
  mutationLimiter: (...args: unknown[]) => mutationLimiterMock(...args),
}));

import { POST } from '@/app/api/sync/route';

describe('sync authentication dominance', () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
    mutationLimiterMock.mockReset();
  });

  it('rejects an unauthenticated request before mutation rate limiting', async () => {
    createServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    });

    const response = await POST(
      new Request('http://localhost/api/sync', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ exposed: true }),
      }),
    );

    expect(response.status).toBe(401);
    expect(mutationLimiterMock).not.toHaveBeenCalled();
  });
});
