/**
 * Admin API: Update Building Positions
 *
 * This endpoint directly modifies lib/map/buildings.ts with new position values.
 * DEVELOPMENT ONLY - disabled in production for security.
 *
 * POST /api/admin/update-building-positions
 * Body: { changes: [{ id: string, position: [number, number] }] }
 */

import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { jsonSuccess, jsonError, ERROR_CODES } from '@/app/api/_lib/response';

// Security: Only allow in development
const isDevelopment = process.env.NODE_ENV === 'development';

interface PositionUpdate {
  id: string;
  position: [number, number];
}

interface RequestBody {
  changes: PositionUpdate[];
}

export async function POST(request: NextRequest) {
  // Security check: Block in production
  if (!isDevelopment) {
    return jsonError(
      'This endpoint is only available in development mode',
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  try {
    const body: RequestBody = await request.json();

    // Validate request body
    if (!body.changes || !Array.isArray(body.changes) || body.changes.length === 0) {
      return jsonError(
        'Invalid request body. Expected { changes: [{ id: string, position: [x, y] }] }',
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    // Validate each change
    for (const change of body.changes) {
      if (!change.id || typeof change.id !== 'string') {
        return jsonError(`Invalid building ID: ${change.id}`, 400, ERROR_CODES.VALIDATION_ERROR);
      }
      if (
        !Array.isArray(change.position) ||
        change.position.length !== 2 ||
        typeof change.position[0] !== 'number' ||
        typeof change.position[1] !== 'number'
      ) {
        return jsonError(
          `Invalid position for building ${change.id}`,
          400,
          ERROR_CODES.VALIDATION_ERROR,
        );
      }
    }

    // Read the buildings.ts file
    const buildingsPath = path.join(process.cwd(), 'lib/map/buildings.ts');
    let content = await fs.readFile(buildingsPath, 'utf-8');

    // Track successful updates
    const updatedBuildings: string[] = [];
    const failedBuildings: string[] = [];

    // Apply each position change
    for (const change of body.changes) {
      const { id, position } = change;

      // Create regex to find the building's position line
      // Match pattern: id: 'BUILDING_ID', ... position: [x, y],
      // We need to find the building block and update its position

      // Strategy: Find the building by ID, then find its position array
      // Building format in the file:
      //   {
      //     id: 'XXX',
      //     ...
      //     position: [x, y],
      //     ...
      //   },

      // Find the building entry and update its position
      const idPattern = new RegExp(`id:\\s*['"]${id}['"]`);
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

    return jsonError(
      error instanceof Error ? error.message : 'Failed to update building positions',
      500,
      ERROR_CODES.INTERNAL_ERROR,
      isDevelopment ? { stack: error instanceof Error ? error.stack : undefined } : undefined,
    );
  }
}

// GET endpoint to check if the service is available
export async function GET() {
  if (!isDevelopment) {
    return jsonError(
      'This endpoint is only available in development mode',
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  return jsonSuccess({
    available: true,
    message: 'Building position update API is ready',
    usage: 'POST with { changes: [{ id: string, position: [x, y] }] }',
  });
}
