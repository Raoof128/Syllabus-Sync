// import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { jsonSuccess, jsonError, ERROR_CODES } from '@/app/api/_lib/response';

const isProduction = process.env.NODE_ENV === 'production';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: Request) {
  try {
    // Test database connection
    const supabase = await createServerClient();

    // Simple query to test database connectivity
    const { error } = await supabase.from('units').select('count', { count: 'exact', head: true });

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
