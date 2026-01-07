import { NextRequest } from 'next/server';
import { jsonError, jsonSuccess, ERROR_CODES } from '@/app/api/_lib/response';

// Use server-only env var (no NEXT_PUBLIC_ prefix) for security
// The API key should only be set via ORS_API_KEY on the server
const ORS_API_KEY = process.env.ORS_API_KEY;
const ORS_BASE_URL =
  process.env.ORS_BASE_URL || 'https://api.openrouteservice.org/v2/directions/foot-walking/geojson';

/**
 * Validates that a coordinate object has valid lat/lng values
 */
function isValidCoordinate(coord: unknown): coord is { lat: number; lng: number } {
  if (typeof coord !== 'object' || coord === null) {
    return false;
  }

  const { lat, lng } = coord as { lat?: unknown; lng?: unknown };

  // Check types
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false;
  }

  // Check for NaN or Infinity
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }

  // Validate lat/lng ranges
  // Latitude: -90 to 90
  // Longitude: -180 to 180
  if (lat < -90 || lat > 90) {
    return false;
  }
  if (lng < -180 || lng > 180) {
    return false;
  }

  return true;
}

export async function POST(request: NextRequest) {
  if (!ORS_API_KEY) {
    return jsonError(
      'Server configuration error: Missing API Key',
      500,
      ERROR_CODES.INTERNAL_ERROR,
    );
  }

  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return jsonError('Invalid request body', 400, ERROR_CODES.BAD_REQUEST);
    }

    const { start, end } = body;

    if (!start || !end) {
      return jsonError('Missing start or end coordinates', 400, ERROR_CODES.BAD_REQUEST);
    }

    if (!isValidCoordinate(start)) {
      return jsonError(
        'Invalid start coordinates. Expected { lat: number, lng: number } with lat in [-90, 90] and lng in [-180, 180]',
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    if (!isValidCoordinate(end)) {
      return jsonError(
        'Invalid end coordinates. Expected { lat: number, lng: number } with lat in [-90, 90] and lng in [-180, 180]',
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const orsResponse = await fetch(ORS_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: ORS_API_KEY,
      },
      body: JSON.stringify({
        coordinates: [
          [start.lng, start.lat],
          [end.lng, end.lat],
        ],
        instructions: true,
      }),
    });

    if (!orsResponse.ok) {
      const errText = await orsResponse.text();
      console.error('ORS Upstream Error:', orsResponse.status, errText);
      return jsonError(
        `ORS Gateway Error: ${orsResponse.status}`,
        orsResponse.status >= 500 ? 502 : orsResponse.status,
        ERROR_CODES.EXTERNAL_SERVICE_ERROR,
        { upstream: errText },
      );
    }

    const data = await orsResponse.json();
    return jsonSuccess(data);
  } catch (error) {
    console.error('Navigate Proxy error:', error);
    return jsonError('Internal Server Error', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
