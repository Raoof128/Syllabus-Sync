import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { jsonSuccess, jsonError, ERROR_CODES } from '@/app/api/_lib/response';
import { signupLimiter } from '@/lib/services/rateLimitService';
import { z } from 'zod';

// SECURITY: Stronger password policy - min 12 chars for better security
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  fullName: z.string().min(1).optional(),
  studentId: z.string().optional(),
});

// Developer emails that can bypass email confirmation in development
// SECURITY: Load from environment variable to avoid exposing emails in source code
const DEV_EMAILS = process.env.DEV_BYPASS_EMAILS
  ? process.env.DEV_BYPASS_EMAILS.split(',').map((e) => e.trim().toLowerCase())
  : [];

const isDevelopment = process.env.NODE_ENV === 'development';

function isDevEmail(email: string): boolean {
  return DEV_EMAILS.some((devEmail) => email.toLowerCase() === devEmail);
}

// ============================================================================
// SECURE IP EXTRACTION
// ============================================================================
// SECURITY: Only trust verified proxy headers in production
// - x-vercel-forwarded-for: Set by Vercel's edge network (cannot be spoofed)
// - cf-connecting-ip: Set by Cloudflare (cannot be spoofed)
// - x-forwarded-for: Only trusted in development or as last resort
// ============================================================================
function getClientIP(request: NextRequest): string {
  const isProduction = process.env.NODE_ENV === 'production';

  // In production, prefer verified proxy headers that cannot be spoofed
  if (isProduction) {
    // Vercel's verified header (highest trust)
    const vercelIp = request.headers.get('x-vercel-forwarded-for');
    if (vercelIp) {
      const firstIp = vercelIp.split(',')[0].trim();
      if (firstIp && isValidIP(firstIp)) return firstIp;
    }

    // Cloudflare's verified header
    const cfIp = request.headers.get('cf-connecting-ip');
    if (cfIp && isValidIP(cfIp)) return cfIp;
  }

  // In development or as fallback, use standard headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp && isValidIP(firstIp)) return firstIp;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp && isValidIP(realIp)) return realIp;

  return 'unknown';
}

// Basic IP format validation to prevent injection
function isValidIP(ip: string): boolean {
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 pattern (simplified)
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

// SECURITY: Generic message for all signup responses to prevent enumeration
const GENERIC_SIGNUP_SUCCESS =
  'If this email is not already registered, you will receive a confirmation email shortly.';

export async function POST(request: NextRequest) {
  // SECURITY: Rate limit by IP using distributed store (works in serverless)
  const clientIP = getClientIP(request);
  const { allowed, remaining, resetIn } = await signupLimiter(clientIP);

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
      console.warn(`Development mode: auto-confirming developer email`);

      const { error: confirmError } = await supabase.auth.admin.updateUserById(data.user.id, {
        email_confirm: true,
      });

      if (confirmError) {
        console.warn('Auto-confirmation failed');
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
    // Log actual errors server-side for debugging (sanitized)
    if (error) {
      console.warn('Signup error:', { email: `${email.substring(0, 3)}***`, code: error.status });
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
        console.warn('Profile creation failed:', profileError.code);
      }
    }

    // SECURITY: Always return success-like message to prevent account enumeration
    const response = jsonSuccess({
      message: data.session ? 'Signup successful' : GENERIC_SIGNUP_SUCCESS,
    });
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    return response;
  } catch (error) {
    console.error('Signup error:', error instanceof Error ? error.message : 'Unknown error');
    return jsonError('Internal server error', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
