import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  jsonSuccess,
  jsonError,
  ERROR_CODES,
  parseJsonBody,
  BODY_SIZE_LIMITS,
} from '@/app/api/_lib/response';
import { signupLimiter } from '@/lib/services/rateLimitService';
import { getClientIP } from '@/lib/security/ip';
import { createSignupSchema } from '@/lib/schemas/auth';
import { logger } from '@/lib/logger';

// ============================================================================
// AUDIT LOGGING HELPER
// ============================================================================
async function logAuthEvent(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  event: string,
  meta: Record<string, unknown>,
  req: NextRequest,
) {
  // Skip logging if admin client is not available (graceful degradation)
  if (!supabaseAdmin) return;

  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  const ua = req.headers.get('user-agent') ?? 'unknown';

  // Fire and forget (don't await this, don't slow down the user)
  supabaseAdmin
    .from('auth_audit_logs')
    .insert({
      event_type: event,
      ip_address: ip,
      user_agent: ua,
      metadata: meta,
    })
    .then(({ error }) => {
      if (error) logger.error('Audit Log Failed:', error);
    });
}

// Developer emails that can bypass email confirmation in development
// SECURITY: Load from environment variable to avoid exposing emails in source code
const DEV_EMAILS = process.env.DEV_BYPASS_EMAILS
  ? process.env.DEV_BYPASS_EMAILS.split(',').map((e) => e.trim().toLowerCase())
  : [];

// SECURITY: Stricter production detection
const isRealProduction =
  process.env.VERCEL_ENV === 'production' ||
  (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV);
const isDevelopment = process.env.NODE_ENV === 'development' && !isRealProduction;

function isDevEmail(email: string): boolean {
  return DEV_EMAILS.some((devEmail) => email.toLowerCase() === devEmail);
}

// SECURITY: Generic message for all signup responses to prevent enumeration
const GENERIC_SIGNUP_SUCCESS =
  'If this email is not already registered, you will receive a confirmation email shortly.';

// Server-side translation stub (returns key or basic English)
const serverT = (key: string): string => {
  // Basic translations for server-side error messages
  const translations: Record<string, string> = {
    'validation.invalidEmail': 'Invalid email address',
    'validation.passwordTooShort': 'Password must be at least 12 characters',
    'validation.passwordUppercase': 'Password must contain at least one uppercase letter',
    'validation.passwordNumber': 'Password must contain at least one number',
    'validation.termsRequired': 'You must agree to the terms',
    'validation.fullNameRequired': 'Full name is required',
    'validation.studentIdRequired': 'Student ID is required',
    'validation.passwordsMismatch': 'Passwords do not match',
  };
  return translations[key] || key;
};

export async function POST(request: NextRequest) {
  const adminClient = createAdminClient();

  // ===========================================================================
  // KILL SWITCH: Check if signups are enabled (only if admin client available)
  // ===========================================================================
  if (adminClient) {
    const { data: config } = await adminClient
      .from('app_config')
      .select('value')
      .eq('key', 'signup_enabled')
      .single();

    if (config?.value === false) {
      // Log the blocked attempt for security monitoring
      logAuthEvent(adminClient, 'signup_blocked_kill_switch', {}, request);

      return jsonError(
        'Signups are temporarily disabled for maintenance.',
        503,
        ERROR_CODES.SERVICE_UNAVAILABLE,
      );
    }
  }

  // SECURITY: Rate limit by IP using distributed store (works in serverless)
  const clientIP = getClientIP(request);
  const { allowed, remaining, resetIn, limit } = await signupLimiter(clientIP);

  if (!allowed) {
    // AUDIT: Log rate limit hit for security monitoring
    logAuthEvent(adminClient, 'rate_limit_hit', { ip: clientIP, reset_in: resetIn }, request);

    const response = jsonError(
      `Too many signup attempts. Please try again later.`,
      429,
      ERROR_CODES.RATE_LIMITED,
      { retryAfter: resetIn },
    );
    // Add rate limit headers for client visibility
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', resetIn.toString());
    response.headers.set('Retry-After', resetIn.toString());
    return response;
  }

  try {
    // SECURITY: Enforce body size limit for auth endpoints (10KB max)
    const { data: body, error: bodyError } = await parseJsonBody(request, BODY_SIZE_LIMITS.AUTH);
    if (bodyError) return bodyError;

    // Use shared schema with server-side translation
    const schema = createSignupSchema(serverT);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      // Map validation errors to field-specific format for frontend
      const firstError = parsed.error.issues[0];
      const field = firstError.path[0]?.toString();

      // AUDIT: Log validation failure
      logAuthEvent(adminClient, 'signup_validation_fail', { target: field, ip: clientIP }, request);

      // Return specific validation errors with target field
      return jsonError(firstError.message, 400, ERROR_CODES.VALIDATION_ERROR, {
        target: field,
        details: parsed.error.flatten(),
      });
    }

    const { email, password, fullName, studentId, course, year, _gotcha } = parsed.data;

    // SECURITY: Server-side honeypot check
    if (_gotcha && _gotcha.length > 0) {
      // Lie to the bot - return generic success so they leave
      logger.warn('Honeypot triggered - bot detected', { ip: clientIP });

      // AUDIT: Log honeypot trigger
      logAuthEvent(
        adminClient,
        'honeypot_triggered',
        { ip: clientIP, gotcha_value: _gotcha },
        request,
      );

      return jsonSuccess({
        message: GENERIC_SIGNUP_SUCCESS,
      });
    }

    const supabase = await createServerClient();
    // adminClient already initialized at top for kill switch check

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          // SECURITY: Don't store sensitive data in auth metadata
        },
        emailRedirectTo: undefined,
      },
    });

    // Handle auth errors with specific field mapping
    if (authError) {
      logger.warn('Signup auth error:', {
        email: `${email.substring(0, 3)}***`,
        code: authError.status,
        message: authError.message,
      });

      // Map auth errors to specific fields
      const isAlreadyRegistered = authError.message.toLowerCase().includes('already registered');
      const target = isAlreadyRegistered ? 'email' : 'root';

      return jsonError(
        authError.message,
        isAlreadyRegistered ? 409 : 400,
        isAlreadyRegistered ? ERROR_CODES.CONFLICT : ERROR_CODES.BAD_REQUEST,
        { target },
      );
    }

    if (!authData.user) {
      throw new Error('User creation failed silently');
    }

    const userId = authData.user.id;
    let profileCreated = false;

    // Create profile atomically using admin client
    if (adminClient) {
      const { error: profileError } = await adminClient.from('profiles').upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          student_id: studentId,
          course: course || null,
          year: year || null,
        },
        { onConflict: 'id' },
      );

      if (profileError) {
        logger.error('Profile creation failed - initiating rollback:', {
          userId,
          error: profileError.message,
        });

        // CRITICAL: Rollback auth user to prevent orphaned accounts
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
        if (deleteError) {
          logger.error('CRITICAL: Rollback failed - orphaned auth user:', {
            userId,
            error: deleteError.message,
          });
        } else {
          logger.info('Rollback successful - deleted orphaned auth user:', { userId });

          // AUDIT: Log rollback execution
          logAuthEvent(
            adminClient,
            'rollback_executed',
            { user_id: userId, reason: 'profile_creation_failed' },
            request,
          );
        }

        return jsonError(
          'Failed to create student profile. Please try again.',
          500,
          ERROR_CODES.INTERNAL_ERROR,
          { target: 'root' },
        );
      }

      profileCreated = true;

      // Create gamification profile
      const { error: gamError } = await adminClient.from('gamification_profiles').upsert(
        {
          user_id: userId,
          xp: 0,
          streak_days: 0,
          longest_streak: 0,
          last_activity_date: null,
        },
        { onConflict: 'user_id' },
      );

      if (gamError) {
        logger.warn('Gamification profile creation failed:', gamError.message);
        // Non-critical - don't rollback for this
      }
    }

    // Fallback: Try with regular client if admin client not available
    if (!profileCreated) {
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          student_id: studentId,
          course: course || null,
          year: year || null,
        },
        { onConflict: 'id' },
      );

      if (profileError) {
        logger.error('Profile creation failed (non-admin):', {
          userId,
          error: profileError.message,
        });
        // Can't rollback without admin client - log for manual cleanup
      }
    }

    // Auto-confirm ONLY in development AND only for developer emails
    let session = null;
    if (authData.user && !authData.session && isDevelopment && isDevEmail(email)) {
      if (adminClient) {
        logger.info(`Development mode: auto-confirming developer email`);

        const { error: confirmError } = await adminClient.auth.admin.updateUserById(userId, {
          email_confirm: true,
        });

        if (!confirmError) {
          // Create session for auto-confirmed user
          const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword(
            {
              email,
              password,
            },
          );

          if (!sessionError && sessionData.session) {
            session = sessionData.session;
          }
        }
      }
    }

    // AUDIT: Log successful signup
    logAuthEvent(
      adminClient,
      'signup_success',
      {
        user_id: userId,
        email_domain: email.split('@')[1],
        has_session: !!session,
        ip: clientIP,
      },
      request,
    );

    // SECURITY: Always return generic success to prevent account enumeration
    const response = jsonSuccess({
      message: GENERIC_SIGNUP_SUCCESS,
      data: session ? { session, user: authData.user } : undefined,
    });
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    return response;
  } catch (error) {
    logger.error('Signup error:', error instanceof Error ? error.message : 'Unknown error');
    return jsonError('Internal server error', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
