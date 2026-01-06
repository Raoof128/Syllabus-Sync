import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { jsonSuccess, jsonError } from '@/app/api/_lib/response';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError('Invalid signup data', 400);
    }

    const supabase = await createServerClient();
    const { email, password, fullName, studentId } = parsed.data;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          student_id: studentId,
        },
        // Auto-confirm email for development
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
          return jsonSuccess({
            user: sessionData.user,
            session: sessionData.session,
            message: 'Signup successful (auto-confirmed for development)',
          });
        }
      }
    }

    if (error) {
      return jsonError(error.message, 400);
    }

    // Create profile record if user was created
    if (data.user && !data.user.email_confirmed_at) {
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

    return jsonSuccess({
      user: data.user,
      session: data.session,
      message: data.session
        ? 'Signup successful'
        : 'Please check your email to confirm your account',
    });
  } catch (error) {
    console.error('Signup error:', error);
    return jsonError('Internal server error', 500);
  }
}
