// import { NextRequest } from 'next/server';
import { jsonSuccess, jsonError, ERROR_CODES } from '@/app/api/_lib/response';
import { createAdminClient } from '@/lib/supabase/admin';

const isProduction = process.env.NODE_ENV === 'production';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: Request) {
  try {
    const supabaseAdmin = createAdminClient();

    if (!supabaseAdmin) {
      // If admin client can't be initialized (e.g. during build or missing env),
      // return a simulated healthy status in dev/build, or error in prod
      if (!isProduction) {
        return jsonSuccess({
          status: 'healthy',
          database: 'not_configured (dev/build mode)',
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version || 'dev',
        });
      }

      return jsonError('Database configuration missing', 500, ERROR_CODES.INTERNAL_ERROR);
    }

    // Simple query to test database connectivity using admin client
    // Querying 'profiles' table with limit 1 is lightweight
    const { error } = await supabaseAdmin
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (error) {
      // SECURITY: Don't expose database error details in production
      // Log the actual error server-side for debugging
      console.error('Health check DB error:', error.message, error.code);

      return jsonError(
        'Service temporarily unavailable',
        503,
        ERROR_CODES.DATABASE_ERROR,
        // Only include details in development
        isProduction ? undefined : { hint: 'Database connection issue' },
      );
    }

    return jsonSuccess({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      // SECURITY: Don't expose version in production (recon information)
      ...(isProduction ? {} : { version: process.env.npm_package_version || 'dev' }),
    });
  } catch (error) {
    // SECURITY: Log detailed error server-side only
    console.error('Health check error:', error);

    return jsonError(
      'Service temporarily unavailable',
      503,
      ERROR_CODES.INTERNAL_ERROR,
      // Only include details in development
      isProduction ? undefined : { hint: 'Internal error' },
    );
  }
}
