// import { NextRequest } from 'next/server';
import { jsonSuccess, jsonError, ERROR_CODES } from '@/app/api/_lib/response';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

const isProduction = process.env.NODE_ENV === 'production';
const EDGE_CACHE_CONTROL = 'public, max-age=0, s-maxage=30, stale-while-revalidate=30';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: Request) {
  try {
    const supabaseAdmin = createAdminClient();

    if (!supabaseAdmin) {
      // If admin client can't be initialized (e.g. during build or missing env),
      // return a degraded but healthy status to prevent container restart loops
      return jsonSuccess(
        {
          status: 'degraded',
          database: 'not_configured',
          timestamp: new Date().toISOString(),
          ...(isProduction ? {} : { version: process.env.npm_package_version || 'dev' }),
        },
        200,
        undefined,
        { headers: { 'Cache-Control': EDGE_CACHE_CONTROL } },
      );
    }

    // Simple query to test database connectivity using admin client
    // Querying 'profiles' table with limit 1 is lightweight
    const { error } = await supabaseAdmin
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (error) {
      // SECURITY: Don't expose database error details in production
      // Log the actual error server-side for debugging
      logger.error('Health check DB error:', error.message, error.code);

      // Return degraded status with 200 to prevent container restart loops
      return jsonSuccess(
        {
          status: 'degraded',
          database: 'disconnected',
          timestamp: new Date().toISOString(),
          ...(isProduction ? {} : { hint: 'Database connection issue' }),
        },
        200,
        undefined,
        { headers: { 'Cache-Control': EDGE_CACHE_CONTROL } },
      );
    }

    return jsonSuccess(
      {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
        // SECURITY: Don't expose version in production (recon information)
        ...(isProduction ? {} : { version: process.env.npm_package_version || 'dev' }),
      },
      200,
      undefined,
      { headers: { 'Cache-Control': EDGE_CACHE_CONTROL } },
    );
  } catch (error) {
    // SECURITY: Log detailed error server-side only
    logger.error('Health check error:', error);

    return jsonError(
      'Service temporarily unavailable',
      503,
      ERROR_CODES.INTERNAL_ERROR,
      // Only include details in development
      isProduction ? undefined : { hint: 'Internal error' },
    );
  }
}
