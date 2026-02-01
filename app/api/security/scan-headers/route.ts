/**
 * Security Headers Scan API Endpoint
 *
 * SECURITY: This endpoint scans a URL for security headers
 * and provides recommendations for improvements.
 */

import { NextRequest, NextResponse } from 'next/server';
import { scanURLHeaders, generateSecurityReport } from '@/lib/security/headers-scanner';
import { jsonError, ERROR_CODES } from '@/app/api/_lib/response';
import { logger } from '@/lib/logger';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return jsonError('URL is required', 400, ERROR_CODES.BAD_REQUEST);
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return jsonError('Invalid URL format', 400, ERROR_CODES.BAD_REQUEST);
    }

    // Scan URL
    const result = await scanURLHeaders(url);

    return NextResponse.json({
      success: true,
      result,
      report: generateSecurityReport(result, url),
    });
  } catch (error) {
    logger.error('Header scan error:', error);
    return jsonError('Failed to scan headers', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
