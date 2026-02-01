/**
 * Device Fingerprinting
 *
 * SECURITY: This module provides device fingerprinting capabilities for enhanced security.
 * Device fingerprints help detect suspicious login attempts and prevent account takeover.
 *
 * Implementation:
 * - Client-side fingerprint generation
 * - Server-side fingerprint verification
 * - Fingerprint storage and comparison
 * - Anomaly detection
 */

import crypto from 'crypto';
import { logger } from '@/lib/logger';


// ============================================================================
// TYPES
// ============================================================================

export interface DeviceFingerprint {
  /** Unique fingerprint identifier */
  id: string;
  /** User agent string */
  userAgent: string;
  /** Screen resolution */
  screenResolution: string;
  /** Color depth */
  colorDepth: number;
  /** Timezone */
  timezone: string;
  /** Language */
  language: string;
  /** Platform */
  platform: string;
  /** Touch support */
  touchSupport: boolean;
  /** WebGL renderer */
  webglRenderer?: string;
  /** Canvas fingerprint */
  canvasFingerprint?: string;
  /** Timestamp */
  createdAt: Date;
}

export interface FingerprintVerificationResult {
  /** Whether the fingerprint matches */
  matches: boolean;
  /** Confidence score (0-1) */
  confidence: number;
  /** Differences found */
  differences: string[];
  /** Is this a new device? */
  isNewDevice: boolean;
}

export interface FingerprintStorage {
  userId: string;
  fingerprintId: string;
  fingerprint: DeviceFingerprint;
  lastSeen: Date;
  isTrusted: boolean;
}

// ============================================================================
// CLIENT-SIDE FINGERPRINT GENERATION
// ============================================================================

/**
 * Generate a device fingerprint on the client side
 * This function should be called in the browser
 *
 * @returns Promise resolving to device fingerprint
 */
export async function generateClientFingerprint(): Promise<DeviceFingerprint> {
  if (typeof window === 'undefined') {
    throw new Error('Device fingerprinting can only be performed in the browser');
  }

  const fingerprint: Partial<DeviceFingerprint> = {
    userAgent: navigator.userAgent,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    colorDepth: window.screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    touchSupport: 'ontouchstart' in window,
    createdAt: new Date(),
  };

  // Get WebGL renderer (if available)
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        fingerprint.webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch {
    // WebGL not available
  }

  // Get canvas fingerprint (if available)
  try {
    fingerprint.canvasFingerprint = generateCanvasFingerprint();
  } catch {
    // Canvas fingerprinting not available
  }

  // Generate unique ID
  fingerprint.id = generateFingerprintId(fingerprint as DeviceFingerprint);

  return fingerprint as DeviceFingerprint;
}

/**
 * Generate a canvas fingerprint
 * This is a simplified version for demonstration
 */
function generateCanvasFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return '';
  }

  // Draw some text
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillStyle = '#f60';
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = '#069';
  ctx.fillText('Syllabus Sync', 2, 15);
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
  ctx.fillText('Device Fingerprint', 4, 45);

  // Get data URL and hash it
  const dataUrl = canvas.toDataURL();
  return crypto.createHash('sha256').update(dataUrl).digest('hex');
}

/**
 * Generate a unique fingerprint ID from device attributes
 */
function generateFingerprintId(fingerprint: DeviceFingerprint): string {
  const data = [
    fingerprint.userAgent,
    fingerprint.screenResolution,
    fingerprint.colorDepth,
    fingerprint.timezone,
    fingerprint.language,
    fingerprint.platform,
    fingerprint.touchSupport,
    fingerprint.webglRenderer || '',
    fingerprint.canvasFingerprint || '',
  ].join('|');

  return crypto.createHash('sha256').update(data).digest('hex');
}

// ============================================================================
// SERVER-SIDE FINGERPRINT VERIFICATION
// ============================================================================

/**
 * Verify a device fingerprint against stored fingerprints
 *
 * @param userId - The user ID
 * @param fingerprint - The fingerprint to verify
 * @param storedFingerprints - Array of stored fingerprints for the user
 * @returns Verification result
 */
export function verifyFingerprint(
  userId: string,
  fingerprint: DeviceFingerprint,
  storedFingerprints: FingerprintStorage[]
): FingerprintVerificationResult {
  // Find matching fingerprint
  const matchingFingerprint = storedFingerprints.find(
    (stored) => stored.fingerprintId === fingerprint.id
  );

  // If no match, this is a new device
  if (!matchingFingerprint) {
    return {
      matches: false,
      confidence: 0,
      differences: ['New device detected'],
      isNewDevice: true,
    };
  }

  // Compare fingerprint attributes
  const differences: string[] = [];
  const stored = matchingFingerprint.fingerprint;

  // Compare user agent
  if (stored.userAgent !== fingerprint.userAgent) {
    differences.push('User agent changed');
  }

  // Compare screen resolution
  if (stored.screenResolution !== fingerprint.screenResolution) {
    differences.push('Screen resolution changed');
  }

  // Compare color depth
  if (stored.colorDepth !== fingerprint.colorDepth) {
    differences.push('Color depth changed');
  }

  // Compare timezone
  if (stored.timezone !== fingerprint.timezone) {
    differences.push('Timezone changed');
  }

  // Compare language
  if (stored.language !== fingerprint.language) {
    differences.push('Language changed');
  }

  // Compare platform
  if (stored.platform !== fingerprint.platform) {
    differences.push('Platform changed');
  }

  // Compare touch support
  if (stored.touchSupport !== fingerprint.touchSupport) {
    differences.push('Touch support changed');
  }

  // Calculate confidence score
  const totalAttributes = 8;
  const matchingAttributes = totalAttributes - differences.length;
  const confidence = matchingAttributes / totalAttributes;

  // Determine if fingerprint matches
  const matches = differences.length <= 2; // Allow minor differences

  return {
    matches,
    confidence,
    differences,
    isNewDevice: false,
  };
}

/**
 * Check if a device is trusted
 * A device is trusted if it has been used successfully multiple times
 */
export function isDeviceTrusted(
  fingerprintId: string,
  storedFingerprints: FingerprintStorage[]
): boolean {
  const stored = storedFingerprints.find((fp) => fp.fingerprintId === fingerprintId);
  return stored?.isTrusted || false;
}

// ============================================================================
// FINGERPRINT STORAGE
// ============================================================================

/**
 * Store a device fingerprint
 * This should be called after successful authentication
 */
export async function storeFingerprint(
  userId: string,
  fingerprint: DeviceFingerprint,
  isTrusted: boolean = false
): Promise<void> {
  // In a real implementation, this would store to a database
  // For now, we'll use in-memory storage
  void {
    userId,
    fingerprintId: fingerprint.id,
    fingerprint,
    lastSeen: new Date(),
    isTrusted,
  };

  // Store in database (implementation depends on your setup)
  // await db.fingerprints.upsert({ userId, fingerprintId: fingerprint.id, ... });
}

/**
 * Get stored fingerprints for a user
 */
export async function getStoredFingerprints(
  _userId: string
): Promise<FingerprintStorage[]> {
  // In a real implementation, this would fetch from a database
  // For now, return empty array
  return [];
}

/**
 * Mark a device as trusted
 */
export async function markDeviceAsTrusted(
  _userId: string,
  _fingerprintId: string
): Promise<void> {
  // In a real implementation, this would update the database
  // await db.fingerprints.update({ userId, fingerprintId }, { isTrusted: true });
}

/**
 * Remove a device fingerprint
 */
export async function removeFingerprint(
  _userId: string,
  _fingerprintId: string
): Promise<void> {
  // In a real implementation, this would delete from the database
  // await db.fingerprints.delete({ userId, fingerprintId });
}

// ============================================================================
// ANOMALY DETECTION
// ============================================================================

/**
 * Detect anomalies in device fingerprint
 * Returns true if the fingerprint shows signs of tampering or suspicious activity
 */
export function detectFingerprintAnomalies(
  fingerprint: DeviceFingerprint
): string[] {
  const anomalies: string[] = [];

  // Check for suspicious user agent
  if (fingerprint.userAgent.includes('bot') ||
      fingerprint.userAgent.includes('crawler') ||
      fingerprint.userAgent.includes('spider')) {
    anomalies.push('Suspicious user agent detected');
  }

  // Check for inconsistent screen resolution
  const [width, height] = fingerprint.screenResolution.split('x').map(Number);
  if (width < 320 || height < 240) {
    anomalies.push('Unusually small screen resolution');
  }

  // Check for missing WebGL (common in headless browsers)
  if (!fingerprint.webglRenderer) {
    anomalies.push('WebGL not available (possible headless browser)');
  }

  // Check for missing canvas fingerprint
  if (!fingerprint.canvasFingerprint) {
    anomalies.push('Canvas fingerprinting not available');
  }

  return anomalies;
}

/**
 * Check if a fingerprint should be flagged for review
 */
export function shouldFlagFingerprint(
  fingerprint: DeviceFingerprint,
  storedFingerprints: FingerprintStorage[]
): boolean {
  // Check for anomalies
  const anomalies = detectFingerprintAnomalies(fingerprint);
  if (anomalies.length > 0) {
    return true;
  }

  // Check if this is a new device
  const isNewDevice = !storedFingerprints.some(
    (stored) => stored.fingerprintId === fingerprint.id
  );

  if (isNewDevice && storedFingerprints.length > 0) {
    return true;
  }

  return false;
}

// ============================================================================
// CLIENT-SIDE UTILITY
// ============================================================================

/**
 * Get device fingerprint as a JSON string
 * Use this to send the fingerprint to the server
 */
export async function getFingerprintForServer(): Promise<string> {
  const fingerprint = await generateClientFingerprint();
  return JSON.stringify(fingerprint);
}

/**
 * Store fingerprint in localStorage for later use
 */
export async function cacheFingerprintLocally(): Promise<void> {
  try {
    const fingerprint = await generateClientFingerprint();
    localStorage.setItem('device-fingerprint', JSON.stringify(fingerprint));
  } catch (error) {
    logger.error('Failed to cache fingerprint:', error);
  }
}

/**
 * Get cached fingerprint from localStorage
 */
export function getCachedFingerprint(): DeviceFingerprint | null {
  try {
    const cached = localStorage.getItem('device-fingerprint');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    logger.error('Failed to get cached fingerprint:', error);
  }
  return null;
}
