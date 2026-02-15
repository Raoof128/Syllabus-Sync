/**
 * API Request Signing
 *
 * SECURITY: This module provides request signing capabilities for API endpoints.
 * Request signing ensures that requests haven't been tampered with in transit.
 *
 * Implementation:
 * - HMAC-SHA256 signature generation
 * - Timestamp-based nonce prevention
 * - Request body validation
 * - Signature verification middleware
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// CONSTANTS
// ============================================================================

const SIGNATURE_HEADER = 'x-signature';
const TIMESTAMP_HEADER = 'x-timestamp';
const NONCE_HEADER = 'x-nonce';
const SIGNATURE_VERSION = 'v1';
const SIGNATURE_ALGORITHM = 'sha256';
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// TYPES
// ============================================================================

export interface SignedRequestOptions {
  /** API secret key for signing */
  secretKey: string;
  /** Request body (if any) */
  body?: string;
  /** HTTP method */
  method: string;
  /** Request path */
  path: string;
  /** Query parameters */
  query?: Record<string, string>;
  /** Custom headers to include in signature */
  headers?: Record<string, string>;
}

export interface SignatureVerificationResult {
  valid: boolean;
  reason?: string;
  timestamp?: number;
  nonce?: string;
}

// ============================================================================
// SIGNATURE GENERATION
// ============================================================================

/**
 * Generate a signature for an API request
 *
 * @param options - Signing options
 * @returns The signature string
 */
export function generateSignature(options: SignedRequestOptions): string {
  const { secretKey, body = '', method, path, query = {}, headers = {} } = options;

  // Build canonical string
  const canonicalString = buildCanonicalString({
    method,
    path,
    query,
    headers,
    body,
  });

  // Generate HMAC-SHA256 signature
  const hmac = crypto.createHmac(SIGNATURE_ALGORITHM, secretKey);
  hmac.update(canonicalString);
  const signature = hmac.digest('base64');

  return `${SIGNATURE_VERSION}:${signature}`;
}

/**
 * Build canonical string for signing
 * This ensures consistent signature generation across different implementations
 */
function buildCanonicalString(options: {
  method: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: string;
}): string {
  const { method, path, query, headers, body } = options;

  // Normalize method to uppercase
  const normalizedMethod = method.toUpperCase();

  // Normalize path (remove trailing slash)
  const normalizedPath = path.replace(/\/$/, '') || '/';

  // Sort query parameters
  const sortedQuery = Object.keys(query)
    .sort()
    .map((key) => `${key}=${encodeURIComponent(query[key])}`)
    .join('&');

  // Sort headers (lowercase keys)
  const sortedHeaders = Object.keys(headers)
    .sort()
    .map((key) => `${key.toLowerCase()}:${headers[key]}`)
    .join('\n');

  // Build canonical string
  const parts = [
    normalizedMethod,
    normalizedPath,
    sortedQuery,
    sortedHeaders,
    body,
  ];

  return parts.join('\n');
}

/**
 * Generate signing headers for a request
 *
 * @param options - Signing options
 * @returns Headers object with signature, timestamp, and nonce
 */
export function generateSigningHeaders(options: SignedRequestOptions): Record<string, string> {
  const timestamp = Date.now();
  const nonce = generateNonce();

  const signature = generateSignature({
    ...options,
    headers: {
      ...options.headers,
      [TIMESTAMP_HEADER]: timestamp.toString(),
      [NONCE_HEADER]: nonce,
    },
  });

  return {
    [SIGNATURE_HEADER]: signature,
    [TIMESTAMP_HEADER]: timestamp.toString(),
    [NONCE_HEADER]: nonce,
  };
}

/**
 * Generate a cryptographically secure nonce
 */
function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

// ============================================================================
// SIGNATURE VERIFICATION
// ============================================================================

/**
 * Verify a signed request
 *
 * @param request - The request to verify
 * @param secretKey - The secret key used for signing
 * @returns Verification result
 */
export async function verifySignature(
  request: NextRequest,
  secretKey: string
): Promise<SignatureVerificationResult> {
  // Get signature headers
  const signatureHeader = request.headers.get(SIGNATURE_HEADER);
  const timestampHeader = request.headers.get(TIMESTAMP_HEADER);
  const nonceHeader = request.headers.get(NONCE_HEADER);

  // Check if signature is present
  if (!signatureHeader) {
    return { valid: false, reason: 'Missing signature header' };
  }

  // Parse signature
  const signatureParts = signatureHeader.split(':');
  if (signatureParts.length !== 2) {
    return { valid: false, reason: 'Invalid signature format' };
  }

  const [version, signature] = signatureParts;

  // Check signature version
  if (version !== SIGNATURE_VERSION) {
    return { valid: false, reason: `Unsupported signature version: ${version}` };
  }

  // Check timestamp
  if (!timestampHeader) {
    return { valid: false, reason: 'Missing timestamp header' };
  }

  const timestamp = parseInt(timestampHeader, 10);
  if (isNaN(timestamp)) {
    return { valid: false, reason: 'Invalid timestamp format' };
  }

  const now = Date.now();
  const timestampDiff = Math.abs(now - timestamp);

  if (timestampDiff > TIMESTAMP_TOLERANCE_MS) {
    return {
      valid: false,
      reason: `Timestamp too old or too new (diff: ${timestampDiff}ms)`,
    };
  }

  // Reconstruct canonical string
  const method = request.method;
  const path = request.nextUrl.pathname;
  const query: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  // Get headers (exclude signature headers)
  const headers: Record<string, string> = {};
  for (const [key, value] of request.headers.entries()) {
    if (
      key.toLowerCase() !== SIGNATURE_HEADER &&
      key.toLowerCase() !== TIMESTAMP_HEADER &&
      key.toLowerCase() !== NONCE_HEADER
    ) {
      headers[key] = value;
    }
  }

  // Read body from a request clone so downstream handlers can still consume the body.
  const body = await getCanonicalBody(request);

  // Generate expected signature
  const expectedSignature = generateSignature({
    secretKey,
    method,
    path,
    query,
    headers,
    body,
  });

  // Compare signatures (constant-time comparison)
  if (!constantTimeCompare(signature, expectedSignature.split(':')[1])) {
    return { valid: false, reason: 'Signature mismatch' };
  }

  // Check nonce after signature validation.
  if (nonceHeader && isNonceUsed(nonceHeader)) {
    return { valid: false, reason: 'Replay detected: nonce already used' };
  }

  return {
    valid: true,
    timestamp,
    nonce: nonceHeader || undefined,
  };
}

/**
 * Constant-time comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Middleware to verify signed requests
 * Use this in API routes that require request signing
 */
export function withSignatureVerification(
  secretKey: string,
  handler: (request: NextRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    // Verify signature
    const result = await verifySignature(request, secretKey);

    if (!result.valid) {
      console.warn('Signature verification failed:', result.reason);
      return NextResponse.json(
        {
          error: {
            code: 'SIGNATURE_INVALID',
            message: result.reason || 'Invalid signature',
          },
        },
        { status: 401 }
      );
    }

    // Signature is valid, proceed with handler
    return handler(request);
  };
}

/**
 * Build a deterministic body string for signature verification.
 * Text-based requests are signed as plain text; binary payloads are signed as base64.
 */
async function getCanonicalBody(request: NextRequest): Promise<string> {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return '';
  }

  const requestClone = request.clone();
  const contentType = requestClone.headers.get('content-type') ?? '';

  if (
    contentType.includes('application/json') ||
    contentType.startsWith('text/') ||
    contentType.includes('application/x-www-form-urlencoded')
  ) {
    return requestClone.text();
  }

  const rawBody = await requestClone.arrayBuffer();
  return Buffer.from(rawBody).toString('base64');
}

// ============================================================================
// CLIENT-SIDE SIGNING
// ============================================================================

/**
 * Sign a fetch request on the client side
 * Use this for making signed API requests from the browser
 *
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param secretKey - The secret key for signing
 * @returns Fetch options with signature headers
 */
export async function signFetchRequest(
  url: string,
  options: RequestInit = {},
  secretKey: string
): Promise<RequestInit> {
  const urlObj = new URL(url);
  const method = options.method || 'GET';
  const body =
    typeof options.body === 'string'
      ? options.body
      : options.body instanceof URLSearchParams
        ? options.body.toString()
        : options.body
          ? JSON.stringify(options.body)
          : '';

  // Build query parameters
  const query: Record<string, string> = {};
  urlObj.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  // Get headers
  const headers: Record<string, string> = {};
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  // Generate signing headers
  const signingHeaders = generateSigningHeaders({
    secretKey,
    method,
    path: urlObj.pathname,
    query,
    headers,
    body,
  });

  // Merge headers
  const finalHeaders = new Headers({
    ...headers,
    ...signingHeaders,
    'Content-Type': 'application/json',
  });

  return {
    ...options,
    headers: finalHeaders,
  };
}

// ============================================================================
// NONCE MANAGEMENT (for replay attack prevention)
// ============================================================================

/**
 * In-memory nonce store (for development)
 * In production, use Redis or database
 */
const nonceStore = new Map<string, number>();

/**
 * Check if a nonce has been used before
 * This is a simplified implementation for development
 * In production, use a persistent store with TTL
 */
export function isNonceUsed(nonce: string): boolean {
  const timestamp = nonceStore.get(nonce);
  if (timestamp) {
    return true;
  }

  // Store nonce with expiration
  nonceStore.set(nonce, Date.now());

  // Clean up old nonces (older than 10 minutes)
  const now = Date.now();
  for (const [storedNonce, storedTimestamp] of nonceStore.entries()) {
    if (now - storedTimestamp > 10 * 60 * 1000) {
      nonceStore.delete(storedNonce);
    }
  }

  return false;
}

/**
 * Clear expired nonces
 * Call this periodically to prevent memory leaks
 */
export function clearExpiredNonces(): void {
  const now = Date.now();
  const expirationTime = 10 * 60 * 1000; // 10 minutes

  for (const [nonce, timestamp] of nonceStore.entries()) {
    if (now - timestamp > expirationTime) {
      nonceStore.delete(nonce);
    }
  }
}
