import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PUT } from '@/app/api/profiles/route';

const createServerClientMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => createServerClientMock(),
}));

// Mock requireAuthWithRateLimit to pass through to handler with userId
vi.mock('@/app/api/_lib/middleware', () => ({
  requireAuth: (_request: Request, handler: (userId: string) => Promise<Response>) =>
    handler('user-1'),
  requireAuthWithRateLimit: (_request: Request, handler: (userId: string) => Promise<Response>) =>
    handler('user-1'),
}));

type UpdateResult = {
  data: Record<string, unknown> | null;
  error: { message?: string } | null;
};

function createProfilesTable(result: UpdateResult) {
  const chain: {
    update: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
  } = {
    update: vi.fn(),
    eq: vi.fn(),
    select: vi.fn(),
    single: vi.fn(async () => result),
  };

  chain.update.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);

  return chain;
}

describe('profiles API route', () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
  });

  it('does not include student_id when updating course/year only', async () => {
    const profilesTable = createProfilesTable({
      data: {
        id: 'user-1',
        course: 'Cybersecurity',
        year: '2',
      },
      error: null,
    });

    createServerClientMock.mockResolvedValue({
      from: vi.fn(() => profilesTable),
    });

    const request = new Request('http://localhost/api/profiles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course: 'Cybersecurity',
        year: '2',
      }),
    });

    const response = await PUT(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.course).toBe('Cybersecurity');
    expect(json.data.year).toBe('2');

    const updatePayload = profilesTable.update.mock.calls[0][0] as Record<string, unknown>;
    expect(updatePayload.course).toBe('Cybersecurity');
    expect(updatePayload.year).toBe('2');
    expect(updatePayload.updated_at).toEqual(expect.any(String));
    expect(updatePayload).not.toHaveProperty('student_id');
  });

  it('returns 403 when immutable fields are rejected by DB trigger', async () => {
    const profilesTable = createProfilesTable({
      data: null,
      error: { message: 'Cannot modify student_id after it has been set' },
    });

    createServerClientMock.mockResolvedValue({
      from: vi.fn(() => profilesTable),
    });

    const request = new Request('http://localhost/api/profiles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: '12345678',
      }),
    });

    const response = await PUT(request);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(JSON.stringify(json)).toContain('Cannot modify protected fields');
  });
});
