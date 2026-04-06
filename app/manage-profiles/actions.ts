'use server';

import { profileSchema, ProfileFormValues } from './schema';
import { revalidatePath } from 'next/cache';
import { checkRateLimit } from '@/lib/utils/rate-limit';

export async function updateProfileAction(profileId: string, data: ProfileFormValues) {
  // 0. SECURITY: Rate Limiting
  const limit = await checkRateLimit(20, 60 * 1000);

  if (!limit.success) {
    return { success: false, error: 'Too many requests. Please try again later.' };
  }

  // 1. SECURITY: Validate inputs on the server again
  const parsed = profileSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  try {
    // 2. CACHE: Refresh the page data after the store persists via API
    revalidatePath('/manage-profiles');

    return { success: true, message: 'Profile updated.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `Cache revalidation failed: ${message}` };
  }
}
