import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/auth/biometric/route';

const createServerClientMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => createServerClientMock(),
}));

describe('auth biometric API', () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
  });

  it('returns 401 when unauthenticated', async () => {
    createServerClientMock.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
      })),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    });

    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('clears biometric metadata when disabling', async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    const deleteChain = {
      delete: vi.fn(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    deleteChain.delete.mockReturnValue(deleteChain);
    createServerClientMock.mockResolvedValue({
      from: vi.fn(() => deleteChain),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', user_metadata: {} } },
          error: null,
        }),
        updateUser,
      },
    });

    const request = new NextRequest('http://localhost/api/auth/biometric', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'content-length': '16' },
      body: JSON.stringify({ enabled: false }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.enabled).toBe(false);
    expect(updateUser).toHaveBeenCalled();
    expect(deleteChain.delete).toHaveBeenCalled();
  });

  it('treats DB-backed credentials as biometric enabled on GET', async () => {
    const selectChain = {
      select: vi.fn(),
      eq: vi.fn().mockResolvedValue({ count: 2, error: null }),
    };
    selectChain.select.mockReturnValue(selectChain);

    createServerClientMock.mockResolvedValue({
      from: vi.fn(() => selectChain),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', user_metadata: {} } },
          error: null,
        }),
      },
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.enabled).toBe(true);
    expect(json.data.credentialCount).toBe(2);
  });
});
