// import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { jsonSuccess, jsonError } from '@/app/api/_lib/response';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: Request) {
  try {
    // Test database connection
    const supabase = await createServerClient();

    // Simple query to test database connectivity
    const { error } = await supabase.from('units').select('count', { count: 'exact', head: true });

    if (error) {
      return jsonError('Database connection failed', 500, 'DATABASE_ERROR', {
        message: error.message,
        code: error.code,
      });
    }

    return jsonSuccess({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.5.2',
    });
  } catch (error) {
    console.error('Health check error:', error);
    return jsonError('Health check failed', 500, 'INTERNAL_ERROR', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
