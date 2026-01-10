/**
 * Admin API: Update Building Positions
 *
 * SECURITY: This endpoint directly modifies source code files.
 * DEVELOPMENT ONLY - completely disabled in production.
 *
 * Multiple layers of protection:
 * 1. HARD PRODUCTION BLOCK - returns 404 immediately in production (cannot be bypassed)
 * 2. NODE_ENV check (must be 'development')
 * 3. ADMIN_API_ENABLED env var must be explicitly set to 'true'
 * 4. Building ID allowlist validation (prevents arbitrary regex injection)
 * 5. Position value bounds checking
 *
 * POST /api/admin/update-building-positions
 * Body: { changes: [{ id: string, position: [number, number] }] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { jsonSuccess, jsonError, ERROR_CODES } from '@/app/api/_lib/response';
import { parseJsonBody } from '@/app/api/_lib/middleware';

// ============================================================================
// CRITICAL SECURITY: HARD PRODUCTION BLOCK
// ============================================================================
// This block CANNOT be bypassed by any environment variable.
// The endpoint will simply not exist in production.
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================

// SECURITY: Multiple checks required for this dangerous endpoint
const isDevelopment = process.env.NODE_ENV === 'development';
const isAdminEnabled = process.env.ADMIN_API_ENABLED === 'true';
const adminSecretToken = process.env.ADMIN_SECRET_TOKEN;
const isEndpointAllowed = isDevelopment && isAdminEnabled;

// SECURITY: Validate admin token header (additional layer of protection)
function validateAdminToken(request: NextRequest): boolean {
  // In development without token configured, allow access (for local dev)
  if (!adminSecretToken && isDevelopment) {
    return true;
  }
  // If token is configured, it must match
  if (adminSecretToken) {
    const providedToken = request.headers.get('x-admin-token');
    return providedToken === adminSecretToken;
  }
  return false;
}

// SECURITY: Allowlist of valid building IDs (prevents regex injection)
// This list should match the building IDs in lib/map/buildings.ts
const ALLOWED_BUILDING_IDS = [
  '1CC',
  '4AW',
  '6ER',
  '7W',
  '9W',
  '10H',
  '12SC',
  '14SCO',
  '17CC',
  '19SL',
  '25W',
  '27W',
  'LIBRARY',
  'WALANGA',
  'LOTUS',
  'IGLU',
  'MACQUARIE_CENTRE',
  'MQ_METRO',
  'SPORT_AQUATIC',
  // Add any other valid building IDs here
];

// SECURITY: Position bounds (Macquarie University campus area)
const POSITION_BOUNDS = {
  minX: -500,
  maxX: 500,
  minY: -500,
  maxY: 500,
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function isValidBuildingId(id: string): boolean {
  if (typeof id !== 'string') return false;
  // Check against allowlist
  return ALLOWED_BUILDING_IDS.includes(id.toUpperCase());
}

function isValidPosition(position: unknown): position is [number, number] {
  if (!Array.isArray(position)) return false;
  if (position.length !== 2) return false;
  if (typeof position[0] !== 'number' || typeof position[1] !== 'number') return false;
  if (!Number.isFinite(position[0]) || !Number.isFinite(position[1])) return false;

  // Bounds checking
  if (position[0] < POSITION_BOUNDS.minX || position[0] > POSITION_BOUNDS.maxX) return false;
  if (position[1] < POSITION_BOUNDS.minY || position[1] > POSITION_BOUNDS.maxY) return false;

  return true;
}

// ============================================================================
// TYPES
// ============================================================================

interface PositionUpdate {
  id: string;
  position: [number, number];
}

interface RequestBody {
  changes: PositionUpdate[];
}

// ============================================================================
// API HANDLERS
// ============================================================================

export async function POST(request: NextRequest) {
  // CRITICAL: Hard block in production - cannot be bypassed by any env var
  if (IS_PRODUCTION) {
    return new NextResponse(null, { status: 404 });
  }

  // SECURITY: Multi-layer check - must pass ALL conditions
  if (!isDevelopment) {
    console.warn('Admin API blocked: Not in development mode');
    return jsonError(
      'This endpoint is only available in development mode',
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  if (!isAdminEnabled) {
    console.warn('Admin API blocked: ADMIN_API_ENABLED not set to true');
    return jsonError(
      'Admin API is disabled. Set ADMIN_API_ENABLED=true in .env.local to enable.',
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  // SECURITY: Validate admin token if configured
  if (!validateAdminToken(request)) {
    console.warn('Admin API blocked: Invalid or missing admin token');
    return jsonError(
      'Invalid admin token. Provide X-Admin-Token header.',
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  try {
    // SECURITY: Parse JSON with size limit (50KB for building position updates)
    const parseResult = await parseJsonBody<RequestBody>(request, 50 * 1024);
    if (!parseResult.success) {
      return jsonError(parseResult.error, 400, ERROR_CODES.VALIDATION_ERROR);
    }
    const body = parseResult.data;

    // Validate request body structure
    if (!body.changes || !Array.isArray(body.changes) || body.changes.length === 0) {
      return jsonError(
        'Invalid request body. Expected { changes: [{ id: string, position: [x, y] }] }',
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    // SECURITY: Limit number of changes per request (DoS prevention)
    if (body.changes.length > 50) {
      return jsonError(
        'Too many changes. Maximum 50 per request.',
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    // Validate each change against allowlist
    const validatedChanges: PositionUpdate[] = [];
    const invalidIds: string[] = [];

    for (const change of body.changes) {
      // SECURITY: Validate building ID against allowlist
      if (!isValidBuildingId(change.id)) {
        invalidIds.push(change.id);
        continue;
      }

      // SECURITY: Validate position bounds
      if (!isValidPosition(change.position)) {
        return jsonError(
          `Invalid position for building ${change.id}. Must be [x, y] within bounds.`,
          400,
          ERROR_CODES.VALIDATION_ERROR,
        );
      }

      validatedChanges.push({
        id: change.id.toUpperCase(),
        position: [Math.round(change.position[0]), Math.round(change.position[1])],
      });
    }

    if (invalidIds.length > 0) {
      return jsonError(
        `Invalid building IDs: ${invalidIds.join(', ')}. Use valid building codes.`,
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    if (validatedChanges.length === 0) {
      return jsonError('No valid changes to apply', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // Read the buildings.ts file
    const buildingsPath = path.join(process.cwd(), 'lib/map/buildings.ts');

    // SECURITY: Verify file exists and is in expected location
    try {
      await fs.access(buildingsPath);
    } catch {
      return jsonError('Buildings file not found', 500, ERROR_CODES.INTERNAL_ERROR);
    }

    let content = await fs.readFile(buildingsPath, 'utf-8');

    // Track successful updates
    const updatedBuildings: string[] = [];
    const failedBuildings: string[] = [];

    // Apply each validated position change
    for (const change of validatedChanges) {
      const { id, position } = change;

      // SECURITY: Use exact string matching with escaped ID (no regex injection possible)
      // Since we validated against allowlist, the ID is safe
      const idPattern = new RegExp(`id:\\s*['"]${id}['"]`, 'i');
      const idMatch = content.match(idPattern);

      if (!idMatch || idMatch.index === undefined) {
        failedBuildings.push(id);
        continue;
      }

      // Find the position array after this ID (within the same object)
      const afterId = content.substring(idMatch.index);
      const positionMatch = afterId.match(/position:\s*\[(-?\d+),\s*(-?\d+)\]/);

      if (!positionMatch || positionMatch.index === undefined) {
        failedBuildings.push(id);
        continue;
      }

      // Calculate absolute position in the content
      const absolutePosition = idMatch.index + positionMatch.index;
      const originalText = positionMatch[0];
      const newText = `position: [${position[0]}, ${position[1]}]`;

      // Replace in content
      content =
        content.substring(0, absolutePosition) +
        newText +
        content.substring(absolutePosition + originalText.length);

      updatedBuildings.push(id);
    }

    // Write back to file
    await fs.writeFile(buildingsPath, content, 'utf-8');

    // eslint-disable-next-line no-console
    console.log(`Admin API: Updated ${updatedBuildings.length} building positions`);

    // Create summary
    const summary = {
      totalRequested: body.changes.length,
      successful: updatedBuildings.length,
      failed: failedBuildings.length,
      updatedBuildings,
      failedBuildings,
      message:
        failedBuildings.length > 0
          ? `Updated ${updatedBuildings.length} buildings. Failed to update: ${failedBuildings.join(', ')}`
          : `Successfully updated ${updatedBuildings.length} building positions`,
    };

    return jsonSuccess(summary);
  } catch (error) {
    console.error('Error updating building positions:', error);

    // SECURITY: Don't leak error details even in dev
    return jsonError('Failed to update building positions', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}

// GET endpoint to check if the service is available
export async function GET() {
  // CRITICAL: Hard block in production - cannot be bypassed by any env var
  if (IS_PRODUCTION) {
    return new NextResponse(null, { status: 404 });
  }

  if (!isEndpointAllowed) {
    return jsonError(
      'This endpoint is only available in development mode with ADMIN_API_ENABLED=true',
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  return jsonSuccess({
    available: true,
    message: 'Building position update API is ready',
    usage: 'POST with { changes: [{ id: string, position: [x, y] }] }',
    allowedBuildings: ALLOWED_BUILDING_IDS,
    positionBounds: POSITION_BOUNDS,
  });
}
