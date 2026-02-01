import type { PasswordStrength } from '@/lib/types';

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
