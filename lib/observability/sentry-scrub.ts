/**
 * Sentry event scrubbing.
 *
 * Raised by the external security and privacy review (Q6, 2026-08-17): the
 * `beforeSend` hooks in all three Sentry configs removed the `authorization`
 * and `cookie` headers and nothing else. Request *bodies* were never touched.
 *
 * That mattered because `POST /api/security/check-password-breach` accepts a
 * plaintext password in its JSON body. Nothing was leaking, because
 * `sendDefaultPii` is not set anywhere and defaults to `false` in
 * `@sentry/nextjs` 10.x, so the SDK does not attach request bodies. But that
 * is a library default, not a control we own: one `sendDefaultPii: true`, or
 * one integration that attaches request data, and a plaintext password would
 * have been shipped to a third party with nothing in its way.
 *
 * This module makes the removal explicit and testable, so the guarantee no
 * longer depends on a default staying the way it is today.
 *
 * Scope deliberately kept narrow — this strips the transport-level carriers of
 * user secrets (body, cookies, query string, auth headers) and, for paths known
 * to carry credentials, the whole request object. It is not a general PII
 * scrubber and should not be sold as one.
 */

/**
 * Structural shape of the parts of a Sentry event this module touches.
 *
 * Declared structurally rather than imported from `@sentry/nextjs` so that this
 * module stays free of the SDK: the configs import Sentry dynamically (and
 * alias it out of the bundle entirely when no DSN is set), and a static type
 * import here would undo that.
 */
export interface ScrubbableEvent {
  request?: {
    url?: string;
    headers?: Record<string, string>;
    cookies?: unknown;
    data?: unknown;
    query_string?: unknown;
  };
}

/**
 * Request paths whose bodies carry credentials outright.
 *
 * For these, the entire `request` object is dropped rather than trimmed. A
 * stack trace is still useful without knowing which password produced it, and
 * partial redaction of a credential-bearing payload is a weaker promise than
 * simply not sending it.
 *
 * Matched as substrings against `event.request.url`, so query strings and
 * absolute origins do not defeat them.
 */
export const CREDENTIAL_BEARING_PATHS: readonly string[] = [
  '/api/security/check-password-breach',
  '/api/auth/password',
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/mfa',
  '/api/auth/passkey',
  '/api/auth/biometric',
];

/** Headers removed from every event, regardless of path. */
const SENSITIVE_HEADERS: readonly string[] = [
  'authorization',
  'cookie',
  'set-cookie',
  'x-csrf-token',
  'proxy-authorization',
];

function isCredentialBearing(url: string | undefined): boolean {
  if (!url) return false;
  return CREDENTIAL_BEARING_PATHS.some((path) => url.includes(path));
}

/**
 * Remove request-borne secrets from a Sentry event, in place.
 *
 * Returns the same object it was given so it can be used directly as the
 * return value of a `beforeSend` hook.
 */
export function scrubSentryEvent<T extends ScrubbableEvent>(event: T): T {
  const request = event.request;
  if (!request) return event;

  // Credential-bearing endpoints: drop the request entirely. Nothing about the
  // payload of a password check is worth the risk of shipping it.
  if (isCredentialBearing(request.url)) {
    delete event.request;
    return event;
  }

  // The body. This is the gap the review found: `sendDefaultPii` defaulting to
  // false is what keeps bodies out today, and this is what keeps them out if
  // that default is ever overridden.
  delete request.data;

  // Cookies carry the session, in a different field to the `cookie` header.
  delete request.cookies;

  // Query strings carry recovery and verification tokens on the auth callbacks.
  delete request.query_string;

  if (request.headers) {
    // Match on the normalised key rather than deleting a fixed list of spellings.
    // Header casing is not normalised across runtimes — the Workers runtime,
    // Node and the browser disagree — so `Cookie`, `cookie` and `COOKIE` can all
    // appear. Deleting `cookie` and `COOKIE` by name (the first version of this
    // function) left `Cookie` in place, which its own test caught.
    for (const key of Object.keys(request.headers)) {
      if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
        delete request.headers[key];
      }
    }
  }

  return event;
}
