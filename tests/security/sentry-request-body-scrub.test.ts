/**
 * Q6 (external security and privacy review, 2026-08-17): Sentry `beforeSend`
 * stripped headers only, never request bodies.
 *
 * The reviewer's observation was precise: `POST /api/security/check-password-breach`
 * takes a plaintext password in its JSON body, and the `beforeSend` hooks in
 * config/sentry/*.ts removed `authorization` and `cookie` and nothing else.
 *
 * Nothing was leaking at the time, because `sendDefaultPii` is not set anywhere
 * and defaults to false in @sentry/nextjs 10.x, so the SDK does not attach
 * request bodies. But that is a library default, not a control. One
 * `sendDefaultPii: true` — or one integration that attaches request data — and
 * a plaintext password ships to a third party.
 *
 * These tests assert the control rather than the default, and assert it against
 * all three configs, including the edge config which had no `beforeSend` at all.
 */

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  scrubSentryEvent,
  CREDENTIAL_BEARING_PATHS,
  type ScrubbableEvent,
} from '@/lib/observability/sentry-scrub';

const SENTRY_CONFIG_DIR = path.resolve(process.cwd(), 'config/sentry');

describe('scrubSentryEvent', () => {
  it('removes the request body, which is where the plaintext password lives', () => {
    const event: ScrubbableEvent = {
      request: {
        url: 'https://www.syllabus-sync.app/api/profiles',
        data: { password: 'hunter2', note: 'anything at all' },
      },
    };

    scrubSentryEvent(event);

    expect(event.request?.data).toBeUndefined();
  });

  it('drops the entire request for credential-bearing paths', () => {
    for (const credentialPath of CREDENTIAL_BEARING_PATHS) {
      const event: ScrubbableEvent = {
        request: {
          url: `https://www.syllabus-sync.app${credentialPath}`,
          data: { password: 'hunter2' },
          headers: { 'user-agent': 'test' },
        },
      };

      scrubSentryEvent(event);

      expect(event.request, `${credentialPath} must not survive scrubbing`).toBeUndefined();
    }
  });

  it('matches credential paths inside absolute URLs carrying a query string', () => {
    const event: ScrubbableEvent = {
      request: {
        url: 'https://www.syllabus-sync.app/api/security/check-password-breach?retry=1',
        data: { password: 'hunter2' },
      },
    };

    scrubSentryEvent(event);

    expect(event.request).toBeUndefined();
  });

  it('removes cookies and query string, which carry sessions and recovery tokens', () => {
    const event: ScrubbableEvent = {
      request: {
        url: 'https://www.syllabus-sync.app/dashboard',
        cookies: { 'sb-access-token': 'real-token' },
        query_string: 'token=recovery-token-value',
      },
    };

    scrubSentryEvent(event);

    expect(event.request?.cookies).toBeUndefined();
    expect(event.request?.query_string).toBeUndefined();
  });

  it('removes sensitive headers in either casing', () => {
    const event: ScrubbableEvent = {
      request: {
        url: 'https://www.syllabus-sync.app/dashboard',
        headers: {
          authorization: 'Bearer real-token',
          Cookie: 'sb-access-token=real-token',
          'x-csrf-token': 'csrf',
          'user-agent': 'keep me',
        },
      },
    };

    scrubSentryEvent(event);

    expect(event.request?.headers?.authorization).toBeUndefined();
    expect(event.request?.headers?.Cookie).toBeUndefined();
    expect(event.request?.headers?.['x-csrf-token']).toBeUndefined();
    expect(event.request?.headers?.['user-agent']).toBe('keep me');
  });

  it('leaves an event with no request untouched rather than throwing', () => {
    const event: ScrubbableEvent = {};
    expect(() => scrubSentryEvent(event)).not.toThrow();
    expect(scrubSentryEvent(event)).toEqual({});
  });

  it('returns the same object so it can be a beforeSend return value', () => {
    const event: ScrubbableEvent = { request: { url: '/dashboard' } };
    expect(scrubSentryEvent(event)).toBe(event);
  });
});

/**
 * The unit tests above prove the scrubber works. These prove it is actually
 * wired in — the original defect was not a broken scrubber but an absent one,
 * and on the edge config an absent `beforeSend` entirely.
 */
describe('sentry configs call the scrubber', () => {
  const configs = [
    'sentry.client.config.ts',
    'sentry.server.config.ts',
    'sentry.edge.config.ts',
  ] as const;

  for (const config of configs) {
    it(`${config} defines beforeSend and calls scrubSentryEvent`, async () => {
      const source = await readFile(path.join(SENTRY_CONFIG_DIR, config), 'utf8');

      expect(source, `${config} must define a beforeSend hook`).toMatch(/beforeSend\s*\(/);
      expect(source, `${config} must call the shared scrubber`).toMatch(/scrubSentryEvent\(/);
      expect(source, `${config} must import the shared scrubber`).toMatch(
        /from '@\/lib\/observability\/sentry-scrub'/,
      );
    });
  }

  it('no config enables sendDefaultPii, which would attach request bodies upstream of beforeSend', async () => {
    for (const config of configs) {
      const source = await readFile(path.join(SENTRY_CONFIG_DIR, config), 'utf8');
      expect(source, `${config} must not set sendDefaultPii`).not.toMatch(
        /sendDefaultPii\s*:\s*true/,
      );
    }
  });
});
