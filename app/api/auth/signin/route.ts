import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { jsonSuccess, jsonError, ERROR_CODES } from '@/app/api/_lib/response';
import { loginLimiter } from '@/lib/services/rateLimitService';
import { z } from 'zod';

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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

// Generic error message to prevent account enumeration
const GENERIC_AUTH_ERROR = 'Invalid email or password';

export async function POST(request: NextRequest) {
  // SECURITY: Rate limit by IP using distributed store (works in serverless)
  const clientIP = getClientIP(request);
  const { allowed, remaining, resetIn } = await loginLimiter(clientIP);

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
    // Requires SUPABASE_SERVICE_ROLE_KEY to be configured
    if (
      error &&
      error.message.includes('Email not confirmed') &&
      isDevelopment &&
      isDevEmail(email)
    ) {
      const adminClient = createAdminClient();

      if (adminClient) {
        console.warn(`🔧 Development mode: auto-confirming developer email...`);

        // Get user by email to confirm
        const { data: users, error: userError } = await adminClient.auth.admin.listUsers();

        if (!userError && users) {
          const user = users.users.find((u: { email?: string }) => u.email === email);
          if (user) {
            // Confirm the email using admin client
            const { error: confirmError } = await adminClient.auth.admin.updateUserById(user.id, {
              email_confirm: true,
            });

            if (!confirmError) {
              // Try signin again with regular client
              const retryResult = await supabase.auth.signInWithPassword({
                email,
                password,
              });

              if (!retryResult.error) {
                data = retryResult.data;
                error = null;
              }
            } else {
              console.warn('Auto-confirmation failed:', confirmError.message);
            }
          }
        }
      } else {
        console.warn(
          'Dev email auto-confirm skipped: SUPABASE_SERVICE_ROLE_KEY not configured.\n' +
            'Add the service role key to .env.local for auto-confirmation to work.',
        );
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
