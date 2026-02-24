import { headers } from 'next/headers';
import { checkRateLimit as checkDistributedRateLimit } from '@/lib/services/rateLimitService';
import { getClientIPFromHeaders } from '@/lib/security/ip';

export async function checkRateLimit(limit: number = 10, windowMs: number = 60 * 1000) {
  const headersList = await headers();
  const clientIp = getClientIPFromHeaders(headersList);
  const result = await checkDistributedRateLimit(clientIp, {
    prefix: 'server_action',
    windowMs,
    maxRequests: limit,
    failClosed: false,
  });

  return {
    success: result.allowed,
    remaining: result.remaining,
    resetIn: result.resetIn,
    limit: result.limit,
  };
}
