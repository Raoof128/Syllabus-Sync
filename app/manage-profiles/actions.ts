'use server';

import { profileSchema, ProfileFormValues } from './schema';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/utils/rate-limit';

// Mock DB delay - remove this in production
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function updateProfileAction(profileId: string, data: ProfileFormValues) {
  // 0. SECURITY: Rate Limiting
  const limit = await checkRateLimit(20, 60 * 1000);

  if (!limit.success) {
    return { success: false, error: 'Too many requests. Chill out, hacker.' };
  }

  // 1. SECURITY: Validate inputs on the server again
  const parsed = profileSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  try {
    // 2. DB OPERATION: Replace this with your actual DB call
    // await prisma.userProfile.update({ where: { id: profileId }, data: parsed.data });

    await delay(500); // Fake delay
    logger.info('Server saving:', parsed.data);

    // 3. CACHE: Refresh the page data
    revalidatePath('/manage-profiles');

    return { success: true, message: 'Profile updated successfully' };
  } catch (error) {
    logger.error('Database update failed:', error);
    return { success: false, message: 'Database connection failed' };
  }
}
