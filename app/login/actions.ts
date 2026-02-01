'use server';

import { createServerClient } from '@/lib/supabase/server';
import { loginSchema, LoginFormData } from './schemas/loginSchema';
import { checkRateLimit } from '@/lib/utils/rate-limit';

export async function loginAction(data: LoginFormData) {
  // 1. Validate Input (Zod)
  const result = loginSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Invalid data format' };
  }

  // 2. Security: Rate Limiting (5 attempts per min)
  const limit = await checkRateLimit(5, 60 * 1000);
  if (!limit.success) {
    return { error: 'Too many login attempts. Please try again in a minute.' };
  }

  // 3. Auth: Supabase Login
  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    // Return generic error for security, or specific if needed
    // We'll return the error message for now to maintain UX parity (Invalid credentials etc)
    // In production, you might want to obscure this ("Invalid email or password")
    return { error: error.message };
  }

  // 4. Success: Redirect handles the rest
  // Note: We return success here, client handles redirect for smooth UX
  // or use redirect() here if not using client-side toast.
  return { success: true };
}
