import { headers } from 'next/headers';

type RateLimitStore = Map<string, { count: number; expiresAt: number }>;
const rateLimitMap: RateLimitStore = new Map();

export async function checkRateLimit(limit: number = 10, windowMs: number = 60 * 1000) {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || 'unknown';
  const now = Date.now();

  const record = rateLimitMap.get(ip);

  // Clean up expired
  if (record && now > record.expiresAt) {
    rateLimitMap.delete(ip);
  }

  const current = rateLimitMap.get(ip) || { count: 0, expiresAt: now + windowMs };

  if (current.count >= limit) {
    return { success: false, remaining: 0 };
  }

  rateLimitMap.set(ip, {
    count: current.count + 1,
    expiresAt: current.expiresAt,
  });

  return { success: true, remaining: limit - (current.count + 1) };
}
