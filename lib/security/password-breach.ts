/**
 * Password Breach Checking
 *
 * SECURITY: This module provides password breach checking using the Have I Been Pwned (HIBP) API.
 * It checks if a password has been exposed in data breaches without sending the actual password.
 *
 * Implementation:
 * - Uses k-anonymity model (password is hashed before sending)
 * - Checks against HIBP Pwned Passwords API
 * - Caches results to reduce API calls
 * - Provides breach count for risk assessment
 */

import crypto from 'crypto';

// ============================================================================
// CONSTANTS
// ============================================================================

const HIBP_API_URL = 'https://api.pwnedpasswords.com/range/';
const HIBP_USER_AGENT = 'Syllabus-Sync-Security-Check';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================================
// TYPES
// ============================================================================

export interface BreachCheckResult {
  /** Whether the password has been breached */
  isBreached: boolean;
  /** Number of times the password has been found in breaches */
  breachCount: number;
  /** Risk level based on breach count */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** Timestamp of the check */
  checkedAt: Date;
}

export interface BreachCheckOptions {
  /** Whether to use cached results */
  useCache?: boolean;
  /** Custom API URL (for testing) */
  apiUrl?: string;
}

// ============================================================================
// CACHE
// ============================================================================

/**
 * In-memory cache for breach check results
 * In production, use Redis or database for distributed caching
 */
const breachCache = new Map<string, { result: BreachCheckResult; expiresAt: number }>();

/**
 * Get cached breach check result
 */
function getCachedResult(passwordHash: string): BreachCheckResult | null {
  const cached = breachCache.get(passwordHash);
  if (!cached) {
    return null;
  }

  if (Date.now() > cached.expiresAt) {
    breachCache.delete(passwordHash);
    return null;
  }

  return cached.result;
}

/**
 * Cache breach check result
 */
function cacheResult(passwordHash: string, result: BreachCheckResult): void {
  breachCache.set(passwordHash, {
    result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  // Clean up old cache entries periodically
  if (breachCache.size > 1000) {
    const now = Date.now();
    for (const [hash, entry] of breachCache.entries()) {
      if (now > entry.expiresAt) {
        breachCache.delete(hash);
      }
    }
  }
}

/**
 * Clear the breach cache
 */
export function clearBreachCache(): void {
  breachCache.clear();
}

// ============================================================================
// PASSWORD HASHING
// ============================================================================

/**
 * Hash a password using SHA-1 (required by HIBP API)
 * The password is hashed before sending to the API to protect user privacy
 *
 * @param password - The password to hash
 * @returns SHA-1 hash in uppercase hexadecimal
 */
function hashPassword(password: string): string {
  const hash = crypto.createHash('sha1').update(password, 'utf8').digest('hex');
  return hash.toUpperCase();
}

/**
 * Get the prefix and suffix of a password hash
 * The prefix (first 5 characters) is sent to the API
 * The suffix (remaining characters) is used to match against the response
 *
 * @param passwordHash - The full SHA-1 hash
 * @returns Object with prefix and suffix
 */
function splitHash(passwordHash: string): { prefix: string; suffix: string } {
  return {
    prefix: passwordHash.substring(0, 5),
    suffix: passwordHash.substring(5),
  };
}

// ============================================================================
// BREACH CHECKING
// ============================================================================

/**
 * Check if a password has been breached using the HIBP API
 *
 * @param password - The password to check
 * @param options - Check options
 * @returns Promise resolving to breach check result
 */
export async function checkPasswordBreach(
  password: string,
  options: BreachCheckOptions = {}
): Promise<BreachCheckResult> {
  const { useCache = true, apiUrl = HIBP_API_URL } = options;

  // Validate password
  if (!password || password.length === 0) {
    throw new Error('Password cannot be empty');
  }

  // Hash the password
  const passwordHash = hashPassword(password);
  const { prefix, suffix } = splitHash(passwordHash);

  // Check cache
  if (useCache) {
    const cached = getCachedResult(passwordHash);
    if (cached) {
      return cached;
    }
  }

  try {
    // Fetch breach data from HIBP API
    const response = await fetch(`${apiUrl}${prefix}`, {
      method: 'GET',
      headers: {
        'User-Agent': HIBP_USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`HIBP API error: ${response.status} ${response.statusText}`);
    }

    // Parse response (format: "SUFFIX:COUNT\nSUFFIX:COUNT\n...")
    const responseText = await response.text();
    const lines = responseText.split('\n').filter((line) => line.trim() !== '');

    // Find matching suffix
    let breachCount = 0;
    for (const line of lines) {
      const [lineSuffix, countStr] = line.split(':');
      if (lineSuffix === suffix) {
        breachCount = parseInt(countStr, 10);
        break;
      }
    }

    // Determine risk level
    const riskLevel = getRiskLevel(breachCount);

    // Create result
    const result: BreachCheckResult = {
      isBreached: breachCount > 0,
      breachCount,
      riskLevel,
      checkedAt: new Date(),
    };

    // Cache result
    if (useCache) {
      cacheResult(passwordHash, result);
    }

    return result;
  } catch (error) {
    console.error('Password breach check error:', error);
    // Return safe default on error
    return {
      isBreached: false,
      breachCount: 0,
      riskLevel: 'low',
      checkedAt: new Date(),
    };
  }
}

/**
 * Get risk level based on breach count
 *
 * @param breachCount - Number of breaches
 * @returns Risk level
 */
function getRiskLevel(breachCount: number): 'low' | 'medium' | 'high' | 'critical' {
  if (breachCount === 0) {
    return 'low';
  } else if (breachCount < 10) {
    return 'medium';
  } else if (breachCount < 100) {
    return 'high';
  } else {
    return 'critical';
  }
}

// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

/**
 * Validate a password against breach database
 * Returns true if the password is safe (not breached)
 *
 * @param password - The password to validate
 * @param options - Check options
 * @returns Promise resolving to validation result
 */
export async function validatePasswordSafety(
  password: string,
  options: BreachCheckOptions = {}
): Promise<{ safe: boolean; result: BreachCheckResult }> {
  const result = await checkPasswordBreach(password, options);
  return {
    safe: !result.isBreached,
    result,
  };
}

/**
 * Check multiple passwords for breaches
 * Useful for bulk validation or password strength testing
 *
 * @param passwords - Array of passwords to check
 * @param options - Check options
 * @returns Promise resolving to array of breach check results
 */
export async function checkMultiplePasswords(
  passwords: string[],
  options: BreachCheckOptions = {}
): Promise<BreachCheckResult[]> {
  const results = await Promise.all(
    passwords.map((password) => checkPasswordBreach(password, options))
  );
  return results;
}

// ============================================================================
// PASSWORD STRENGTH ASSESSMENT
// ============================================================================

/**
 * Assess password strength considering breach status
 *
 * @param password - The password to assess
 * @param options - Check options
 * @returns Promise resolving to strength assessment
 */
export async function assessPasswordStrength(
  password: string,
  options: BreachCheckOptions = {}
): Promise<{
  score: number; // 0-4
  strength: 'very weak' | 'weak' | 'fair' | 'strong' | 'very strong';
  breachResult: BreachCheckResult;
  suggestions: string[];
}> {
  // Check breach status
  const breachResult = await checkPasswordBreach(password, options);

  // Calculate base strength score (0-4)
  let score = calculateBaseStrength(password);

  // Reduce score if breached
  if (breachResult.isBreached) {
    score = Math.max(0, score - 2);
  }

  // Get strength label
  const strength = getStrengthLabel(score);

  // Generate suggestions
  const suggestions = generatePasswordSuggestions(password, breachResult);

  return {
    score,
    strength,
    breachResult,
    suggestions,
  };
}

/**
 * Calculate base password strength score (0-4)
 * Based on length, complexity, and variety
 */
function calculateBaseStrength(password: string): number {
  let score = 0;

  // Length
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Complexity
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  // Variety
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  const varietyCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (varietyCount >= 3) score++;

  // Normalize to 0-4
  return Math.min(4, Math.floor(score / 2));
}

/**
 * Get strength label from score
 */
function getStrengthLabel(score: number): 'very weak' | 'weak' | 'fair' | 'strong' | 'very strong' {
  const labels: ('very weak' | 'weak' | 'fair' | 'strong' | 'very strong')[] = [
    'very weak',
    'weak',
    'fair',
    'strong',
    'very strong',
  ];
  return labels[Math.max(0, Math.min(4, score))];
}

/**
 * Generate password suggestions
 */
function generatePasswordSuggestions(
  password: string,
  breachResult: BreachCheckResult
): string[] {
  const suggestions: string[] = [];

  if (breachResult.isBreached) {
    suggestions.push('This password has been exposed in data breaches. Choose a different password.');
  }

  if (password.length < 12) {
    suggestions.push('Use at least 12 characters for better security.');
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    suggestions.push('Mix uppercase and lowercase letters.');
  }

  if (!/[0-9]/.test(password)) {
    suggestions.push('Include numbers.');
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    suggestions.push('Add special characters (!@#$%^&*).');
  }

  if (suggestions.length === 0) {
    suggestions.push('Your password is strong!');
  }

  return suggestions;
}

// ============================================================================
// API ENDPOINT INTEGRATION
// ============================================================================

/**
 * API route handler for password breach checking
 * Use this in /api/security/check-password-breach
 */
export async function handlePasswordBreachCheck(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return Response.json(
        { error: { code: 'MISSING_PASSWORD', message: 'Password is required' } },
        { status: 400 }
      );
    }

    const result = await checkPasswordBreach(password);

    return Response.json({ result });
  } catch (error) {
    console.error('Password breach check error:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to check password' } },
      { status: 500 }
    );
  }
}
