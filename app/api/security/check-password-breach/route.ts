/**
 * Password Breach Check API Endpoint
 *
 * SECURITY: This endpoint checks if a password has been exposed in data breaches
 * using the Have I Been Pwned (HIBP) API with k-anonymity.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkPasswordBreach } from '@/lib/security/password-breach';
import { jsonError, ERROR_CODES } from '@/app/api/_lib/response';
import { logger } from '@/lib/logger';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return jsonError('Password is required', 400, ERROR_CODES.BAD_REQUEST);
    }

    // Validate password length
    if (password.length < 1) {
      return jsonError('Password cannot be empty', 400, ERROR_CODES.BAD_REQUEST);
    }

    // Check password breach
    const result = await checkPasswordBreach(password);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    logger.error('Password breach check error:', error);
    return jsonError('Failed to check password breach', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
