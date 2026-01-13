// import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jsonSuccess, jsonError, ERROR_CODES } from '@/app/api/_lib/response';

const isProduction = process.env.NODE_ENV === 'production';

// Use admin client for health check to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: Request) {
  try {
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
