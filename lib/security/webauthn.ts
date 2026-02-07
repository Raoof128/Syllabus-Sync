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

  const expiresAt = new Date(
    Date.now() + CHALLENGE_EXPIRY_MINUTES * 60 * 1000,
  ).toISOString();

  const { error } = await admin
    .from('webauthn_challenges')
    .insert({
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

  const { data, error } = await admin
    .from('webauthn_challenges')
    .select('*')
    .eq('challenge', challenge)
    .eq('type', type)
    .gt('expires_at', new Date().toISOString())
    .limit(1)
    .single();

  if (error || !data) return null;

  // Delete the challenge (one-time use)
  await admin
    .from('webauthn_challenges')
    .delete()
    .eq('id', data.id);

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

  const { error } = await supabase
    .from('webauthn_credentials')
    .insert({
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
export async function getCredentialsForUser(
  userId: string,
): Promise<WebAuthnCredential[]> {
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
export async function getCredentialById(
  credentialId: string,
): Promise<WebAuthnCredential | null> {
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

  const { error } = await admin
    .from('webauthn_credentials')
    .update({
      counter: newCounter,
      last_used_at: new Date().toISOString(),
    })
    .eq('credential_id', credentialId);

  if (error) {
    logger.error('Failed to update credential counter:', error);
  }
}

/**
 * Delete a credential.
 */
export async function deleteCredential(
  userId: string,
  credentialDbId: string,
): Promise<boolean> {
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
 * Get RP ID from environment or request host.
 */
export function getRelyingPartyId(host: string): string {
  // Use env override if set (for production)
  const envRpId = process.env.WEBAUTHN_RP_ID;
  if (envRpId) return envRpId;

  // Extract hostname without port
  return host.split(':')[0];
}

/**
 * Get expected origin from environment or request.
 */
export function getExpectedOrigin(requestOrigin: string): string {
  const envOrigin = process.env.WEBAUTHN_ORIGIN;
  if (envOrigin) return envOrigin;
  return requestOrigin;
}
