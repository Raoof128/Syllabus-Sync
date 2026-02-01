import type { PasswordStrength } from '@/lib/types';
import { APP_CONFIG } from '@/lib/config';

// Centralized whitelist - easier to manage
export const SAFE_REDIRECT_PATHS = [
  '/dashboard',
  '/calendar',
  '/units',
  '/manage-profiles',
  '/settings',
  '/setup',
] as const;

export function isValidRedirect(url: string | null): boolean {
  if (!url) return false;

  // 1. Check if it's a relative path (starts with / but not //)
  const isRelative = url.startsWith('/') && !url.startsWith('//');

  // 2. Allow base URL
  const isBaseUrl = url.startsWith(APP_CONFIG.url);

  if (!isRelative && !isBaseUrl) return false;

  // 3. Whitelist check (Optional: Strict Mode)
  // Remove query params for checking
  const path = url.split('?')[0].replace(APP_CONFIG.url, '');

  return SAFE_REDIRECT_PATHS.some((safePath) => path.startsWith(safePath));
}

// Password strength calculation
// Note: feedback messages should be added to translations.ts for full i18n support
export function calculatePasswordStrength(password: string): {
  strength: PasswordStrength;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  }

  if (password.length >= 12) {
    score += 1;
  }

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score += 1;
  }

  if (/\d/.test(password)) {
    score += 1;
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  }

  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
  }

  let strength: PasswordStrength;
  if (score <= 1) {
    strength = 'weak';
  } else if (score === 2) {
    strength = 'fair';
  } else if (score === 3) {
    strength = 'good';
  } else {
    strength = 'strong';
  }

  return { strength, score: Math.min(score, 4), feedback };
}
