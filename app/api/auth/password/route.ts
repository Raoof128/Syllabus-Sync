import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { jsonSuccess, jsonError, ERROR_CODES } from '@/app/api/_lib/response';
import { z } from 'zod';

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 5; // Max 5 attempts
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(userId: string): { allowed: boolean; remainingAttempts: number } {
  const now = Date.now();
  const record = rateLimitMap.get(userId);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remainingAttempts: RATE_LIMIT_MAX - 1 };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remainingAttempts: 0 };
  }

  record.count++;
  return { allowed: true, remainingAttempts: RATE_LIMIT_MAX - record.count };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonError('Not authenticated', 401, ERROR_CODES.UNAUTHORIZED);
    }

    // Check rate limit
    const { allowed, remainingAttempts } = checkRateLimit(user.id);
    if (!allowed) {
      return jsonError(
        'Too many password change attempts. Please try again in 15 minutes.',
        429,
        ERROR_CODES.RATE_LIMITED,
      );
    }

    // Parse and validate body
    const body = await request.json().catch(() => null);
    const parsed = passwordChangeSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return jsonError(
        firstError?.message || 'Invalid request data',
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    // Verify current password by attempting to sign in
    // This is done server-side to avoid session side effects on the client
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (verifyError) {
      return jsonError('Current password is incorrect', 400, ERROR_CODES.BAD_REQUEST, {
        remainingAttempts,
      });
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return jsonError(updateError.message, 400, ERROR_CODES.BAD_REQUEST);
    }

    // Clear rate limit on success
    rateLimitMap.delete(user.id);

    return jsonSuccess({
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Password change error:', error);
    return jsonError('Internal server error', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
