import { NextRequest, NextResponse } from 'next/server';

export const PASSKEY_CHALLENGE_COOKIE = 'passkey_challenge';
export const PASSKEY_USER_COOKIE = 'passkey_user';

const cookieMaxAgeSeconds = 5 * 60;

/**
 * SECURITY (BA-0003): `WEBAUTHN_RP_ID` and `WEBAUTHN_ORIGIN` are the two values
 * that bind a WebAuthn assertion to *this* site. Both used to fall back to the
 * request's own `Host`/`Origin` header whenever the variable was missing, which
 * makes the check circular: the server compared the origin inside
 * `clientDataJSON` against an origin the caller also supplied, so the
 * comparison could not fail and the binding was worth nothing.
 *
 * These are configured in production, so the hole is latent rather than live —
 * but "latent" here depends entirely on `process.env` being populated, and
 * BA-0017 is the standing proof that this cannot be assumed on Workers: an
 * isolate that comes up with an empty `process.env` silently downgraded itself
 * to header-derived anchors instead of refusing to serve.
 *
 * So these fail closed on any deployed runtime and keep the host-derived
 * fallback only for local development, where `localhost` has no stable value to
 * configure. Every caller already wraps these in try/catch, so throwing
 * surfaces as the route's generic error rather than an unhandled rejection —
 * which is the behaviour AGENT.md mandates for passkey registration.
 *
 * Read inside the function, never at module scope (BA-0017).
 */
const isDeployedRuntime = () => process.env.NODE_ENV === 'production';

export const getRpId = (request: NextRequest) => {
  const envRpId = process.env.WEBAUTHN_RP_ID?.trim();
  if (envRpId) return envRpId;
  if (isDeployedRuntime()) {
    throw new Error(
      'WEBAUTHN_RP_ID is not configured; refusing to derive the RP ID from request headers',
    );
  }
  const host = request.headers.get('host') ?? new URL(request.url).hostname;
  return host.split(':')[0];
};

export const getOrigin = (request: NextRequest) => {
  const envOrigin = process.env.WEBAUTHN_ORIGIN?.trim();
  if (envOrigin) return envOrigin;
  if (isDeployedRuntime()) {
    throw new Error(
      'WEBAUTHN_ORIGIN is not configured; refusing to trust the caller-supplied Origin header',
    );
  }
  return request.headers.get('origin') ?? new URL(request.url).origin;
};

export const setPasskeyCookies = (response: NextResponse, challenge: string, userId: string) => {
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: cookieMaxAgeSeconds,
    path: '/',
  };

  response.cookies.set(PASSKEY_CHALLENGE_COOKIE, challenge, cookieOptions);
  response.cookies.set(PASSKEY_USER_COOKIE, userId, cookieOptions);
};

export const clearPasskeyCookies = (response: NextResponse) => {
  response.cookies.set(PASSKEY_CHALLENGE_COOKIE, '', { maxAge: 0, path: '/' });
  response.cookies.set(PASSKEY_USER_COOKIE, '', { maxAge: 0, path: '/' });
};

export const bufferToBase64Url = (buffer: ArrayBuffer | Uint8Array) => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Buffer.from(bytes).toString('base64url');
};

export const base64UrlToBuffer = (value: string) => {
  return Buffer.from(value, 'base64url');
};

export const uuidToBuffer = (uuid: string) => {
  const normalized = uuid.replace(/-/g, '');
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  }
  return Buffer.from(bytes);
};
