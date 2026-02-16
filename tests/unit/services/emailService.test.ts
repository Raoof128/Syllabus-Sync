import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

let sendMock: ReturnType<typeof vi.fn>;

vi.mock('resend', () => {
  sendMock = vi.fn(async () => ({ data: { id: 'email_123' }, error: null }));
  return {
    Resend: class Resend {
      apiKey: string;
      emails: { send: typeof sendMock };
      constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.emails = { send: sendMock };
      }
    },
  };
});

function setEnv(next: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(next)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

describe('emailService (resend)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    sendMock?.mockClear?.();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('reports not configured when RESEND_API_KEY is missing', async () => {
    setEnv({
      RESEND_API_KEY: undefined,
      VERIFICATION_EMAIL_FROM: 'onboarding@resend.dev',
      VERIFICATION_EMAIL_NAME: 'Syllabus Sync',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    });

    const mod = await import('@/lib/services/emailService');
    expect(mod.isEmailServiceConfigured()).toBe(false);
  });

  it('uses NEXT_PUBLIC_APP_URL for verification links', async () => {
    setEnv({
      RESEND_API_KEY: 're_test_key_123',
      VERIFICATION_EMAIL_FROM: 'onboarding@resend.dev',
      VERIFICATION_EMAIL_NAME: 'Syllabus Sync',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      VERCEL_URL: undefined,
    });

    const mod = await import('@/lib/services/emailService');
    const res = await mod.sendVerificationEmail({ to: 'user@example.com', token: 'a'.repeat(64) });
    expect(res.success).toBe(true);
    expect(sendMock).toHaveBeenCalledTimes(1);
    const args = sendMock.mock.calls[0]?.[0] as any;
    expect(args.subject).toContain('Verify your email');
    expect(args.text).toContain('http://localhost:3000/verify?token=');
  });

  it('falls back to VERCEL_URL when NEXT_PUBLIC_APP_URL is not set', async () => {
    setEnv({
      RESEND_API_KEY: 're_test_key_123',
      VERIFICATION_EMAIL_FROM: 'onboarding@resend.dev',
      VERIFICATION_EMAIL_NAME: 'Syllabus Sync',
      NEXT_PUBLIC_APP_URL: undefined,
      VERCEL_URL: 'syllabus-sync.vercel.app',
    });

    const mod = await import('@/lib/services/emailService');
    const res = await mod.sendVerificationEmail({ to: 'user@example.com', token: 'b'.repeat(64) });
    expect(res.success).toBe(true);
    const args = sendMock.mock.calls[0]?.[0] as any;
    expect(args.text).toContain('https://syllabus-sync.vercel.app/verify?token=');
  });

  it('rejects invalid recipient email and does not call resend', async () => {
    setEnv({
      RESEND_API_KEY: 're_test_key_123',
      VERIFICATION_EMAIL_FROM: 'onboarding@resend.dev',
      VERIFICATION_EMAIL_NAME: 'Syllabus Sync',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    });

    const mod = await import('@/lib/services/emailService');
    const res = await mod.sendEmail({ to: 'not-an-email', subject: 'Hi', content: 'Hello' });
    expect(res.success).toBe(false);
    expect(sendMock).toHaveBeenCalledTimes(0);
  });
});
