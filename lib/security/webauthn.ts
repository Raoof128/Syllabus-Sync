/**
 * WebAuthn Server-Side Helpers
 *
 * SECURITY: Handles WebAuthn credential storage, challenge management,
 * and cryptographic verification using a dedicated database table
 * (not user_metadata). Supports multiple passkeys per user.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { createRateLimiter } from '@/lib/services/rateLimitService';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Challenge expiry time in minutes */
export const CHALLENGE_EXPIRY_MINUTES = 5;

/** Maximum passkeys per user */
export const MAX_PASSKEYS_PER_USER = 10;

// ============================================================================
// RATE LIMITERS
// ============================================================================

export const webauthnRegisterLimiter = createRateLimiter({
  prefix: 'webauthn-register',
  windowMs: 60 * 60 * 1000,
  maxRequests: 10,
  failClosed: true,
});

export const webauthnAuthLimiter = createRateLimiter({
  prefix: 'webauthn-auth',
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  failClosed: true,
});

export const webauthnCredentialsLimiter = createRateLimiter({
  prefix: 'webauthn-creds',
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  failClosed: true,
});

// ============================================================================
// TYPES
// ============================================================================

export interface WebAuthnCredential {
  id: string;
  userId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  transports: string[];
  deviceName: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface WebAuthnChallenge {
  id: string;
  challenge: string;
  type: 'registration' | 'authentication';
  userId: string | null;
  expiresAt: string;
}

// ============================================================================
// CHALLENGE MANAGEMENT
// ============================================================================

/**
 * Store a WebAuthn challenge in the database with a 5-minute expiry.
 */
export async function storeChallenge(
  challenge: string,
  type: 'registration' | 'authentication',
  userId: string | null,
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) throw new Error('Admin client not configured');

  const expiresAt = new Date(Date.now() + CHALLENGE_EXPIRY_MINUTES * 60 * 1000).toISOString();

  const { error } = await admin.from('webauthn_challenges').insert({
    challenge,
    type,
    user_id: userId,
    expires_at: expiresAt,
  });

  if (error) {
    logger.error('Failed to store WebAuthn challenge:', error);
    throw new Error('Failed to store challenge');
  }
}

/**
 * Retrieve and consume a challenge (one-time use).
 */
export async function consumeChallenge(
  challenge: string,
  type: 'registration' | 'authentication',
): Promise<WebAuthnChallenge | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  // Claim the challenge with a single atomic DELETE ... RETURNING. Reading and
  // then deleting in two statements let two concurrent callers both observe the
  // row before either delete committed, and discarding the delete result meant a
  // failed delete silently left the challenge usable until it expired. Returning
  // a row here is therefore proof that this caller — and only this caller —
  // removed it.
  const { data, error } = await admin
    .from('webauthn_challenges')
    .delete()
    .eq('challenge', challenge)
    .eq('type', type)
    .gt('expires_at', new Date().toISOString())
    .select()
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    challenge: data.challenge,
    type: data.type,
    userId: data.user_id,
    expiresAt: data.expires_at,
  };
}

// ============================================================================
// CREDENTIAL MANAGEMENT
// ============================================================================

/**
 * Store a new WebAuthn credential.
 */
export async function storeCredential(params: {
  userId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  transports: string[];
  deviceName: string;
}): Promise<void> {
  const supabase = await createServerClient();

  // Check max passkeys limit
  const { count } = await supabase
    .from('webauthn_credentials')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', params.userId);

  if (count !== null && count >= MAX_PASSKEYS_PER_USER) {
    throw new Error(`Maximum of ${MAX_PASSKEYS_PER_USER} passkeys reached`);
  }

  const { error } = await supabase.from('webauthn_credentials').insert({
    user_id: params.userId,
    credential_id: params.credentialId,
    public_key: params.publicKey,
    counter: params.counter,
    transports: params.transports,
    device_name: params.deviceName,
  });

  if (error) {
    logger.error('Failed to store WebAuthn credential:', error);
    throw new Error('Failed to save passkey');
  }
}

/**
 * Get all credentials for a user.
 */
export async function getCredentialsForUser(userId: string): Promise<WebAuthnCredential[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from('webauthn_credentials')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map(mapDbCredential);
}

/**
 * Get a specific credential by credential_id (for authentication).
 */
export async function getCredentialById(credentialId: string): Promise<WebAuthnCredential | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from('webauthn_credentials')
    .select('*')
    .eq('credential_id', credentialId)
    .limit(1)
    .single();

  if (error || !data) return null;

  return mapDbCredential(data);
}

/**
 * Update the counter for a credential after authentication.
 */
export async function updateCredentialCounter(
  credentialId: string,
  newCounter: number,
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const update = admin
    .from('webauthn_credentials')
    .update({
      counter: newCounter,
      last_used_at: new Date().toISOString(),
    })
    .eq('credential_id', credentialId);

  // Where the authenticator maintains a real counter, only ever move it
  // forwards: an unguarded write would let a replayed assertion rewind it and
  // erase the very signal that proves a replay happened. Synced platform
  // passkeys (iCloud Keychain, Google Password Manager) always report 0, and
  // @simplewebauthn skips its counter check in that case — guarding those would
  // match no rows and silently stop `last_used_at` from advancing, so they take
  // the unguarded path.
  const { error } = newCounter > 0 ? await update.lt('counter', newCounter) : await update;

  if (error) {
    logger.error('Failed to update credential counter:', error);
  }
}

/**
 * Delete a credential.
 */
export async function deleteCredential(userId: string, credentialDbId: string): Promise<boolean> {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('webauthn_credentials')
    .delete()
    .eq('id', credentialDbId)
    .eq('user_id', userId);

  if (error) {
    logger.error('Failed to delete credential:', error);
    return false;
  }

  return true;
}

// ============================================================================
// HELPERS
// ============================================================================

function mapDbCredential(data: Record<string, unknown>): WebAuthnCredential {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    credentialId: data.credential_id as string,
    publicKey: data.public_key as string,
    counter: Number(data.counter ?? 0),
    transports: (data.transports as string[]) ?? [],
    deviceName: (data.device_name as string) ?? 'Passkey',
    createdAt: data.created_at as string,
    lastUsedAt: (data.last_used_at as string) ?? null,
  };
}

/**
 * SECURITY (BA-0003): see the matching note in app/api/auth/passkey/_lib.ts.
 * `WEBAUTHN_RP_ID`/`WEBAUTHN_ORIGIN` are the anchors that bind an assertion to
 * this site; falling back to the caller's own `Host`/`Origin` made the origin
 * check compare an attacker-supplied value against itself. Fails closed on any
 * deployed runtime, host-derived fallback kept for local development only.
 *
 * Read inside the function, never at module scope (BA-0017).
 */
const isDeployedRuntime = () => process.env.NODE_ENV === 'production';

/**
 * Get RP ID from environment, or from the request host in local development.
 */
export function getRelyingPartyId(host: string): string {
  // Use env override if set (for production), trimming whitespace/newlines
  const envRpId = process.env.WEBAUTHN_RP_ID?.trim();
  if (envRpId) return envRpId;

  if (isDeployedRuntime()) {
    throw new Error(
      'WEBAUTHN_RP_ID is not configured; refusing to derive the RP ID from request headers',
    );
  }

  // Extract hostname without port
  return host.split(':')[0];
}

/**
 * Get expected origin from environment, or from the request in local development.
 */
export function getExpectedOrigin(requestOrigin: string): string {
  const envOrigin = process.env.WEBAUTHN_ORIGIN?.trim();
  if (envOrigin) return envOrigin;

  if (isDeployedRuntime()) {
    throw new Error(
      'WEBAUTHN_ORIGIN is not configured; refusing to trust the caller-supplied Origin header',
    );
  }

  return requestOrigin;
}
