import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const createAdminClientMock = vi.fn();
const createServerClientMock = vi.fn();

const mocks = vi.hoisted(() => ({
  signupLimiterMock: vi.fn(async (_id: string) => ({
    allowed: true,
    remaining: 10,
    resetIn: 3600,
    limit: 20,
  })),
  getClientIpMock: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => createAdminClientMock(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: async () => createServerClientMock(),
}));

vi.mock('@/lib/services/rateLimitService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/services/rateLimitService')>();
  return {
    ...actual,
    signupLimiter: (id: string) => mocks.signupLimiterMock(id),
  };
});

vi.mock('@/lib/security/ip', () => ({
  getClientIP: () => mocks.getClientIpMock(),
}));

function makeAdminClient(overrides?: Partial<any>) {
  const createUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  const deleteUser = vi.fn().mockResolvedValue({ error: null });
  const updateUserById = vi.fn().mockResolvedValue({ error: null });

  const from = vi.fn((table: string) => {
    if (table === 'app_config') {
      const chain: any = {};
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      chain.single = vi.fn(async () => ({ data: null, error: null }));
      return chain;
    }

    if (table === 'auth_audit_logs') {
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    }

    if (table === 'profiles' || table === 'gamification_profiles') {
      return {
        upsert: vi.fn().mockResolvedValue({ error: null }),
        delete: vi.fn().mockResolvedValue({ error: null }),
      };
    }

    if (table === 'email_verifications') {
      return {
        delete: vi.fn().mockResolvedValue({ error: null }),
      };
    }

    return {
      upsert: vi.fn().mockResolvedValue({ error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockResolvedValue({ error: null }),
    };
  });

  return {
    from,
    auth: { admin: { createUser, deleteUser, updateUserById } },
    ...overrides,
  };
}

describe('signup API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createAdminClientMock.mockReset();
    createServerClientMock.mockReset();
  });

  it('accepts the signup client payload (camelCase fields)', async () => {
    const adminClient = makeAdminClient();
    createAdminClientMock.mockReturnValue(adminClient);

    // Mock the server client with signUp that returns a user
    const signUpMock = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' }, session: null },
      error: null,
    });
    createServerClientMock.mockReturnValue({
      auth: { signUp: signUpMock },
      from: vi.fn(),
    });

    const { POST } = await import('@/app/api/auth/signup/route');

    const req = new NextRequest('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@example.com',
        password: 'A'.repeat(11) + '1',
        confirmPassword: 'A'.repeat(11) + '1',
        agreedToTerms: true,
        _gotcha: '',
        fullName: 'Test Student',
        studentId: '12345678',
        course: 'CS',
        year: '2026',
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    // In non-dev mode, it uses supabase.auth.signUp instead of admin createUser
    expect(signUpMock).toHaveBeenCalled();
  });

  it('treats the honeypot as a generic success and skips account creation', async () => {
    const adminClient = makeAdminClient();
    createAdminClientMock.mockReturnValue(adminClient);

    const signUpMock = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' }, session: null },
      error: null,
    });
    createServerClientMock.mockReturnValue({
      auth: { signUp: signUpMock },
      from: vi.fn(),
    });

    const { POST } = await import('@/app/api/auth/signup/route');

    const req = new NextRequest('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'bot@example.com',
        password: 'A'.repeat(11) + '1',
        confirmPassword: 'A'.repeat(11) + '1',
        agreedToTerms: true,
        _gotcha: 'hello',
        fullName: 'Bot',
        studentId: '0',
        course: '',
        year: '',
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    // Honeypot should prevent signup from happening
    expect(signUpMock).not.toHaveBeenCalled();
  });
});
