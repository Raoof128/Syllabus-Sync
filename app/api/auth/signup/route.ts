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
import { z } from 'zod';

// SECURITY: Stronger password policy - min 12 chars for better security
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  // Direct fields (legacy format)
  fullName: z.string().min(1).optional(),
  studentId: z.string().optional(),
  course: z.string().optional(),
  year: z.string().optional(),
  // Nested options format (from frontend)
  options: z
    .object({
      data: z
        .object({
          full_name: z.string().optional(),
          student_id: z.string().optional(),
          course: z.string().optional(),
          year: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
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
    // SECURITY: Enforce body size limit for auth endpoints (10KB max)
    const { data: body, error: bodyError } = await parseJsonBody(request, BODY_SIZE_LIMITS.AUTH);
    if (bodyError) return bodyError;

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
    const { email, password, fullName, studentId, course, year, options } = parsed.data;

    // Extract profile data from either direct fields or nested options.data format
    const profileFullName = fullName || options?.data?.full_name || null;
    const profileStudentId = studentId || options?.data?.student_id || null;
    const profileCourse = course || options?.data?.course || null;
    const profileYear = year || options?.data?.year || null;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: profileFullName,
          // SECURITY: Don't store studentId in auth metadata, only in profiles table with RLS
        },
        emailRedirectTo: undefined,
      },
    });

    // Auto-confirm ONLY in development AND only for developer emails
    // Requires SUPABASE_SERVICE_ROLE_KEY to be configured
    if (data.user && !data.session && !error && isDevelopment && isDevEmail(email)) {
      const adminClient = createAdminClient();

      if (adminClient) {
        console.warn(`Development mode: auto-confirming developer email`);

        const { error: confirmError } = await adminClient.auth.admin.updateUserById(data.user.id, {
          email_confirm: true,
        });

        if (confirmError) {
          console.warn('Auto-confirmation failed:', confirmError.message);
        } else {
          // Try to create a session using the regular client
          const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword(
            {
              email,
              password,
            },
          );

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
      } else {
        console.warn(
          'Dev email auto-confirm skipped: SUPABASE_SERVICE_ROLE_KEY not configured.\n' +
            'Add the service role key to .env.local for auto-confirmation to work.',
        );
      }
    }

    // SECURITY: Always return success-like message to prevent account enumeration
    // Log actual errors server-side for debugging (sanitized)
    if (error) {
      console.warn('Signup error:', { email: `${email.substring(0, 3)}***`, code: error.status });
      // Return generic message to prevent enumeration
      const response = jsonSuccess({
        message: GENERIC_SIGNUP_SUCCESS,
      });
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      return response;
    }

    // Create profile as backup (auth trigger should have done this, but upsert ensures it exists)
    // The database has a trigger on auth.users that auto-creates profiles and gamification_profiles
    // This is a backup in case the trigger fails or is disabled
    if (data.user) {
      const adminClient = createAdminClient();
      if (adminClient) {
        const { error: profileError } = await adminClient.from('profiles').upsert(
          {
            id: data.user.id,
            email: data.user.email,
            full_name: profileFullName,
            student_id: profileStudentId,
            course: profileCourse,
            year: profileYear,
          },
          { onConflict: 'id' },
        );

        if (profileError) {
          console.warn('Profile creation failed:', profileError.message);
          // Don't fail signup - user can still use the app, profile will be created on first access
        } else {
          // Also create gamification_profile for the new user
          const { error: gamError } = await adminClient.from('gamification_profiles').upsert(
            {
              user_id: data.user.id,
              xp: 0,
              streak_days: 0,
              longest_streak: 0,
              last_activity_date: null,
            },
            { onConflict: 'user_id' },
          );

          if (gamError) {
            console.warn('Gamification profile creation failed:', gamError.message);
          }
        }
      } else {
        // Fallback: Try to create profile with regular client (relies on RLS INSERT policy)
        const { error: profileError } = await supabase.from('profiles').upsert(
          {
            id: data.user.id,
            email: data.user.email,
            full_name: profileFullName,
            student_id: profileStudentId,
            course: profileCourse,
            year: profileYear,
          },
          { onConflict: 'id' },
        );

        if (profileError) {
          console.warn('Profile creation (non-admin) failed:', profileError.message);
        } else {
          // Also create gamification_profile for the new user (non-admin fallback)
          const { error: gamError } = await supabase.from('gamification_profiles').upsert(
            {
              user_id: data.user.id,
              xp: 0,
              streak_days: 0,
              longest_streak: 0,
              last_activity_date: null,
            },
            { onConflict: 'user_id' },
          );

          if (gamError) {
            console.warn('Gamification profile creation (non-admin) failed:', gamError.message);
          }
        }
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
