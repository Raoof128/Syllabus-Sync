'use server';

import { profileSchema, ProfileFormValues } from './schema';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { headers } from 'next/headers';

// Simple in-memory rate limit (or use Redis/Upstash for production)
const rateLimitMap = new Map<string, number>();

// Mock DB delay - remove this in production
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function updateProfileAction(profileId: string, data: ProfileFormValues) {
  // 0. SECURITY: Rate Limiting
  let ip = 'unknown';
  try {
    const headersList = await headers();
    ip = headersList.get('x-forwarded-for') || 'unknown';
  } catch {
    // Fallback for non-request contexts (like tests if not mocked, though we should mock)
    logger.warn('Could not determine IP for rate limiting');
  }

  const windowMs = 60 * 1000; // 1 minute

  // Get requests for this IP
  const requests = rateLimitMap.get(ip) || 0;

  if (requests > 20) {
    // Max 20 updates per minute
    return { success: false, error: 'Too many requests. Chill out, hacker.' };
  }

  // Reset/Increment
  rateLimitMap.set(ip, requests + 1);
  setTimeout(() => rateLimitMap.delete(ip), windowMs);

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
