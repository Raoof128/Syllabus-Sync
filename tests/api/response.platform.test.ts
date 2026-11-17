import { afterEach, describe, expect, it } from 'vitest';
import { handleDatabaseError } from '@/app/api/_lib/response';

describe('database error platform redaction', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('redacts internal details in Cloudflare production', async () => {
    process.env = {
      ...originalEnv,
      DEPLOYMENT_PLATFORM: 'cloudflare',
      DEPLOYMENT_ENV: 'production',
      NODE_ENV: 'production',
    };

    const response = handleDatabaseError(new Error('sensitive database details'));
    const body = await response.json();

    expect(body.error?.details).toBeUndefined();
  });

  it('keeps diagnostic details in Cloudflare preview despite production build mode', async () => {
    process.env = {
      ...originalEnv,
      DEPLOYMENT_PLATFORM: 'cloudflare',
      DEPLOYMENT_ENV: 'preview',
      NODE_ENV: 'production',
    };

    const response = handleDatabaseError(new Error('preview diagnostic'));
    const body = await response.json();

    expect(body.error?.details).toEqual({ originalError: 'preview diagnostic' });
  });
});
