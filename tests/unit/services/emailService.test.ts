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
    const res = await mod.sendVerificationEmail({
      to: 'user@example.com',
      token: 'a'.repeat(64),
    });
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
    const res = await mod.sendVerificationEmail({
      to: 'user@example.com',
      token: 'b'.repeat(64),
    });
    expect(res.success).toBe(true);
    const args = sendMock.mock.calls[0]?.[0] as any;
    expect(args.text).toContain('https://syllabus-sync.vercel.app/verify?token=');
  });

  it('uses the configured Cloudflare application origin', async () => {
    setEnv({
      RESEND_API_KEY: 're_test_key_123',
      VERIFICATION_EMAIL_FROM: 'onboarding@resend.dev',
      VERIFICATION_EMAIL_NAME: 'Syllabus Sync',
      DEPLOYMENT_PLATFORM: 'cloudflare',
      DEPLOYMENT_ENV: 'production',
      NEXT_PUBLIC_APP_URL: 'https://www.syllabus-sync.app/account',
      VERCEL_URL: undefined,
    });

    const mod = await import('@/lib/services/emailService');
    const res = await mod.sendVerificationEmail({
      to: 'user@example.com',
      token: 'c'.repeat(64),
    });
    expect(res.success).toBe(true);
    const args = sendMock.mock.calls[0]?.[0] as { text: string };
    expect(args.text).toContain('https://www.syllabus-sync.app/verify?token=');
    expect(args.text).not.toContain('/account/verify');
  });

  it('fails closed when a production application origin is not configured', async () => {
    setEnv({
      RESEND_API_KEY: 're_test_key_123',
      VERIFICATION_EMAIL_FROM: 'onboarding@resend.dev',
      VERIFICATION_EMAIL_NAME: 'Syllabus Sync',
      DEPLOYMENT_PLATFORM: 'cloudflare',
      DEPLOYMENT_ENV: 'production',
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_URL: undefined,
      NEXT_PUBLIC_SITE_URL: undefined,
      VERCEL_PROJECT_PRODUCTION_URL: undefined,
      VERCEL_BRANCH_URL: undefined,
      VERCEL_URL: undefined,
    });

    const mod = await import('@/lib/services/emailService');
    expect(mod.isEmailServiceConfigured()).toBe(false);
    await expect(
      mod.sendVerificationEmail({
        to: 'user@example.com',
        token: 'd'.repeat(64),
      }),
    ).resolves.toEqual({
      success: false,
      error: 'Email service not configured',
    });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it.each([
    ['direct example domain', { NEXT_PUBLIC_APP_URL: 'https://example.com/app' }],
    ['direct paste marker', { NEXT_PUBLIC_SITE_URL: 'https://paste-real-domain.test' }],
    ['Vercel your marker', { VERCEL_URL: 'your-app.vercel.app' }],
  ])('never sends token links to a %s placeholder origin', async (_label, placeholderEnv) => {
    setEnv({
      RESEND_API_KEY: 're_test_key_123',
      VERIFICATION_EMAIL_FROM: 'onboarding@resend.dev',
      VERIFICATION_EMAIL_NAME: 'Syllabus Sync',
      DEPLOYMENT_PLATFORM: 'cloudflare',
      DEPLOYMENT_ENV: 'production',
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_URL: undefined,
      NEXT_PUBLIC_SITE_URL: undefined,
      VERCEL_PROJECT_PRODUCTION_URL: undefined,
      VERCEL_BRANCH_URL: undefined,
      VERCEL_URL: undefined,
      ...placeholderEnv,
    });

    const mod = await import('@/lib/services/emailService');
    expect(mod.isEmailServiceConfigured()).toBe(false);
    await expect(
      mod.sendVerificationEmail({ to: 'user@example.com', token: 'e'.repeat(64) }),
    ).resolves.toMatchObject({ success: false });
    await expect(
      mod.sendPasswordResetEmail({ to: 'user@example.com', token: 'f'.repeat(64) }),
    ).resolves.toMatchObject({ success: false });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it.each(['not a URL', 'https://user:secret@real-domain.test/path'])(
    'returns the failure contract for invalid application origin %s',
    async (invalidOrigin) => {
      setEnv({
        RESEND_API_KEY: 're_test_key_123',
        VERIFICATION_EMAIL_FROM: 'onboarding@resend.dev',
        VERIFICATION_EMAIL_NAME: 'Syllabus Sync',
        DEPLOYMENT_PLATFORM: 'cloudflare',
        DEPLOYMENT_ENV: 'production',
        NODE_ENV: 'production',
        NEXT_PUBLIC_APP_URL: invalidOrigin,
        NEXT_PUBLIC_SITE_URL: undefined,
        VERCEL_PROJECT_PRODUCTION_URL: undefined,
        VERCEL_BRANCH_URL: undefined,
        VERCEL_URL: undefined,
      });

      const mod = await import('@/lib/services/emailService');
      expect(mod.isEmailServiceConfigured()).toBe(false);
      await expect(
        mod.sendVerificationEmail({ to: 'user@example.com', token: '1'.repeat(64) }),
      ).resolves.toMatchObject({ success: false });
      await expect(
        mod.sendPasswordResetEmail({ to: 'user@example.com', token: '2'.repeat(64) }),
      ).resolves.toMatchObject({ success: false });
      expect(sendMock).not.toHaveBeenCalled();
    },
  );

  it('rejects invalid recipient email and does not call resend', async () => {
    setEnv({
      RESEND_API_KEY: 're_test_key_123',
      VERIFICATION_EMAIL_FROM: 'onboarding@resend.dev',
      VERIFICATION_EMAIL_NAME: 'Syllabus Sync',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    });

    const mod = await import('@/lib/services/emailService');
    const res = await mod.sendEmail({
      to: 'not-an-email',
      subject: 'Hi',
      content: 'Hello',
    });
    expect(res.success).toBe(false);
    expect(sendMock).toHaveBeenCalledTimes(0);
  });
});
