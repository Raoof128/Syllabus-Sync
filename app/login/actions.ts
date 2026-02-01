'use server';

import { createServerClient } from '@/lib/supabase/server';
import { loginSchema, LoginFormData } from './schemas/loginSchema';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { logger } from '@/lib/logger';

export async function loginAction(data: LoginFormData) {
  // 1. Validate Input (Zod)
  const result = loginSchema.safeParse(data);
  if (!result.success) {
    return { error: 'validation_error' }; // Return code, not string
  }

  // Log the attempt (Security)
  logger.info('Login attempt', { email: data.email });

  // 2. Security: Rate Limiting (5 attempts per min)
  const limit = await checkRateLimit(5, 60 * 1000);
  if (!limit.success) {
    logger.warn('Login rate limit exceeded', { email: data.email });
    return { error: 'rate_limit_exceeded' };
  }

  // 3. Auth: Supabase Login
  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    logger.error('Login failed', { error: error.message, email: data.email });
    return { error: 'invalid_credentials' };
  }

  logger.info('Login success', { email: data.email });
  return { success: true };
}
