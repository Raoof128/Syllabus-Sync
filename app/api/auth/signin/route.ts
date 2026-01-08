import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { jsonSuccess, jsonError, ERROR_CODES } from '@/app/api/_lib/response';
import { z } from 'zod';

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
// RATE LIMITING - Per-IP limits to prevent brute-force attacks
// ============================================================================
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 5; // Max attempts per window
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

function getClientIP(request: NextRequest): string {
  // Trust x-forwarded-for only in production behind a known proxy
  // In development or direct access, use a fallback
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  // Use the first IP in x-forwarded-for chain (original client)
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  if (realIp) return realIp;

  return 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();

  // Clean up expired entries periodically (10% chance)
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

// Generic error message to prevent account enumeration
const GENERIC_AUTH_ERROR = 'Invalid email or password';

export async function POST(request: NextRequest) {
  // SECURITY: Rate limit by IP to prevent brute-force attacks
  const clientIP = getClientIP(request);
  const { allowed, remaining, resetIn } = checkRateLimit(clientIP);

  if (!allowed) {
    return jsonError(
      `Too many login attempts. Please try again in ${Math.ceil(resetIn / 60)} minutes.`,
      429,
      ERROR_CODES.RATE_LIMITED,
      { retryAfter: resetIn },
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = signinSchema.safeParse(body);

    if (!parsed.success) {
      // SECURITY: Don't reveal validation details, use generic error
      return jsonError(GENERIC_AUTH_ERROR, 400, ERROR_CODES.BAD_REQUEST);
    }

    const supabase = await createServerClient();
    const { email, password } = parsed.data;

    // Try password signin first
    let { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Auto-confirm ONLY in development AND only for developer emails
    if (
      error &&
      error.message.includes('Email not confirmed') &&
      isDevelopment &&
      isDevEmail(email)
    ) {
      console.warn(`🔧 Development mode: auto-confirming developer email (${email})...`);

      // Get user by email to confirm
      const { data: users, error: userError } = await supabase.auth.admin.listUsers();

      if (!userError && users) {
        const user = users.users.find((u: { email?: string }) => u.email === email);
        if (user) {
          // Confirm the email
          await supabase.auth.admin.updateUserById(user.id, {
            email_confirm: true,
          });

          // Try signin again
          const retryResult = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (!retryResult.error) {
            data = retryResult.data;
            error = null;
          }
        }
      }
    }

    if (error) {
      // SECURITY: Return generic error to prevent account enumeration
      // Log the actual error server-side for debugging
      console.warn('Signin failed:', {
        email: `${email.substring(0, 3)}***`,
        error: error.message,
      });
      const response = jsonError(GENERIC_AUTH_ERROR, 401, ERROR_CODES.UNAUTHORIZED);
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      return response;
    }

    const response = jsonSuccess({
      user: data.user,
      session: data.session,
      message: 'Signin successful',
    });
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    return response;
  } catch (error) {
    console.error('Signin error:', error);
    return jsonError('Internal server error', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
