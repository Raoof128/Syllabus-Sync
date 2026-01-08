import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { jsonSuccess, jsonError, ERROR_CODES } from '@/app/api/_lib/response';
import { z } from 'zod';

// SECURITY: Stronger password policy - min 12 chars for better security
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  fullName: z.string().min(1).optional(),
  studentId: z.string().optional(),
});

// Developer emails that can bypass email confirmation in development
const DEV_EMAILS = [
  'raouf@mq.edu.au',
  'pouya@mq.edu.au',
  'kit@mq.edu.au',
  // Add any other dev emails here
];

const isDevelopment = process.env.NODE_ENV === 'development';

function isDevEmail(email: string): boolean {
  return DEV_EMAILS.some((devEmail) => email.toLowerCase() === devEmail.toLowerCase());
}

// ============================================================================
// RATE LIMITING - Per-IP limits to prevent signup abuse
// ============================================================================
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 3; // Max signups per window (stricter than signin)
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour window

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  if (realIp) return realIp;

  return 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();

  // Clean up expired entries periodically
  if (Math.random() < 0.1) {
    for (const [key, val] of rateLimitStore.entries()) {
      if (val.resetTime < now) rateLimitStore.delete(key);
    }
  }

  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX - 1,
      resetIn: Math.ceil(RATE_LIMIT_WINDOW / 1000),
    };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    const resetIn = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, resetIn };
  }

  record.count++;
  const resetIn = Math.ceil((record.resetTime - now) / 1000);
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count, resetIn };
}

// SECURITY: Generic message for all signup responses to prevent enumeration
const GENERIC_SIGNUP_SUCCESS =
  'If this email is not already registered, you will receive a confirmation email shortly.';

export async function POST(request: NextRequest) {
  // SECURITY: Rate limit by IP to prevent signup abuse
  const clientIP = getClientIP(request);
  const { allowed, remaining, resetIn } = checkRateLimit(clientIP);

  if (!allowed) {
    return jsonError(
      `Too many signup attempts. Please try again later.`,
      429,
      ERROR_CODES.RATE_LIMITED,
      { retryAfter: resetIn },
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      // Return specific validation errors for password length (helps UX)
      const passwordError = parsed.error.issues.find((i) => i.path.includes('password'));
      if (passwordError) {
        return jsonError(passwordError.message, 400, ERROR_CODES.VALIDATION_ERROR);
      }
      return jsonError('Invalid signup data', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const supabase = await createServerClient();
    const { email, password, fullName, studentId } = parsed.data;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          // SECURITY: Don't store studentId in auth metadata, only in profiles table with RLS
        },
        emailRedirectTo: undefined,
      },
    });

    // Auto-confirm ONLY in development AND only for developer emails
    if (data.user && !data.session && !error && isDevelopment && isDevEmail(email)) {
      console.warn(`🔧 Development mode: auto-confirming developer email (${email})...`);

      const { error: confirmError } = await supabase.auth.admin.updateUserById(data.user.id, {
        email_confirm: true,
      });

      if (confirmError) {
        console.warn('Auto-confirmation failed:', confirmError);
      } else {
        // Try to create a session
        const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!sessionError && sessionData.session) {
          const response = jsonSuccess({
            user: sessionData.user,
            session: sessionData.session,
            message: 'Signup successful (auto-confirmed for development)',
          });
          response.headers.set('X-RateLimit-Remaining', remaining.toString());
          return response;
        }
      }
    }

    // SECURITY: Don't reveal if email already exists - return same message regardless
    // Log actual errors server-side for debugging
    if (error) {
      console.warn('Signup error:', { email: `${email.substring(0, 3)}***`, error: error.message });
    }

    // Create profile record if user was created (only store studentId in protected profiles table)
    if (data.user && studentId) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName,
        student_id: studentId,
      });

      if (profileError) {
        console.warn('Profile creation failed:', profileError);
      }
    }

    // SECURITY: Always return success-like message to prevent account enumeration
    const response = jsonSuccess({
      message: data.session ? 'Signup successful' : GENERIC_SIGNUP_SUCCESS,
    });
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return jsonError('Internal server error', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
