import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { jsonSuccess, jsonError } from '@/app/api/_lib/response';
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = signinSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError('Invalid signin data', 400);
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
      return jsonError(error.message, 400);
    }

    return jsonSuccess({
      user: data.user,
      session: data.session,
      message: 'Signin successful',
    });
  } catch (error) {
    console.error('Signin error:', error);
    return jsonError('Internal server error', 500);
  }
}
