import { NextRequest } from 'next/server';
import { jsonError, jsonSuccess, ERROR_CODES } from '@/app/api/_lib/response';
import { requireAuth } from '@/app/api/_lib/middleware';
import { createHash } from 'crypto';

// Use server-only env var (no NEXT_PUBLIC_ prefix) for security
// The API key should only be set via ORS_API_KEY on the server
const ORS_API_KEY = process.env.ORS_API_KEY;
const ORS_BASE_URL =
  process.env.ORS_BASE_URL || 'https://api.openrouteservice.org/v2/directions/foot-walking/geojson';

// ============================================================================
// CAMPUS GEOFENCE - Macquarie University bounds
// ============================================================================
// Prevents abuse by rejecting requests for routes outside campus area
const CAMPUS_BOUNDS = {
  minLat: -33.785, // South boundary
  maxLat: -33.765, // North boundary
  minLng: 151.105, // West boundary
  maxLng: 151.135, // East boundary
};

// Generous buffer (2km) around campus for nearby transit stops, parking, etc.
const GEOFENCE_BUFFER_KM = 2;
const KM_PER_DEGREE_LAT = 111.32;
const KM_PER_DEGREE_LNG = 111.32 * Math.cos((-33.775 * Math.PI) / 180); // ~93km at this latitude

const EXTENDED_BOUNDS = {
  minLat: CAMPUS_BOUNDS.minLat - GEOFENCE_BUFFER_KM / KM_PER_DEGREE_LAT,
  maxLat: CAMPUS_BOUNDS.maxLat + GEOFENCE_BUFFER_KM / KM_PER_DEGREE_LAT,
  minLng: CAMPUS_BOUNDS.minLng - GEOFENCE_BUFFER_KM / KM_PER_DEGREE_LNG,
  maxLng: CAMPUS_BOUNDS.maxLng + GEOFENCE_BUFFER_KM / KM_PER_DEGREE_LNG,
};

// ============================================================================
// RATE LIMITING - Per-user limits to prevent API key abuse
// ============================================================================
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 30; // Max requests per user per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window

function checkUserRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(userId);

  // Clean up expired entries periodically
  if (Math.random() < 0.1) {
    for (const [key, val] of rateLimitStore.entries()) {
      if (val.resetTime < now) rateLimitStore.delete(key);
    }
  }

  if (!record || now > record.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
}

// ============================================================================
// ROUTE CACHING - Prevent duplicate ORS API calls
// ============================================================================
interface CachedRoute {
  data: unknown;
  timestamp: number;
}
const routeCache = new Map<string, CachedRoute>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

function getCacheKey(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
): string {
  // Round to 5 decimal places (~1m precision) for cache hits
  const coords = `${start.lat.toFixed(5)},${start.lng.toFixed(5)}-${end.lat.toFixed(5)},${end.lng.toFixed(5)}`;
  return createHash('sha256').update(coords).digest('hex').substring(0, 16);
}

function getCachedRoute(key: string): unknown | null {
  const cached = routeCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    routeCache.delete(key);
    return null;
  }
  return cached.data;
}

function setCachedRoute(key: string, data: unknown): void {
  // Evict oldest entries if cache is full
  if (routeCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = routeCache.keys().next().value;
    if (oldestKey) routeCache.delete(oldestKey);
  }
  routeCache.set(key, { data, timestamp: Date.now() });
}

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

/**
 * Validates that coordinates are within the campus geofence
 */
function isWithinGeofence(coord: { lat: number; lng: number }): boolean {
  return (
    coord.lat >= EXTENDED_BOUNDS.minLat &&
    coord.lat <= EXTENDED_BOUNDS.maxLat &&
    coord.lng >= EXTENDED_BOUNDS.minLng &&
    coord.lng <= EXTENDED_BOUNDS.maxLng
  );
}

export async function POST(request: NextRequest) {
  // SECURITY: Require authentication to prevent anonymous abuse
  return requireAuth(request, async (userId: string) => {
    // SECURITY: Rate limit per user
    const { allowed, remaining } = checkUserRateLimit(userId);
    if (!allowed) {
      return jsonError(
        'Rate limit exceeded. Please wait before making more navigation requests.',
        429,
        ERROR_CODES.RATE_LIMITED,
        { retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000) },
      );
    }

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

      // SECURITY: Validate coordinates are within campus geofence
      if (!isWithinGeofence(start) || !isWithinGeofence(end)) {
        return jsonError(
          'Coordinates must be within the Macquarie University campus area',
          400,
          ERROR_CODES.VALIDATION_ERROR,
        );
      }

      // Check cache first
      const cacheKey = getCacheKey(start, end);
      const cachedData = getCachedRoute(cacheKey);
      if (cachedData) {
        const response = jsonSuccess(cachedData);
        response.headers.set('X-Cache', 'HIT');
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        return response;
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
          `Navigation service temporarily unavailable`,
          orsResponse.status >= 500 ? 502 : orsResponse.status,
          ERROR_CODES.EXTERNAL_SERVICE_ERROR,
        );
      }

      const data = await orsResponse.json();

      // Cache the successful response
      setCachedRoute(cacheKey, data);

      const response = jsonSuccess(data);
      response.headers.set('X-Cache', 'MISS');
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      return response;
    } catch (error) {
      console.error('Navigate Proxy error:', error);
      return jsonError('Internal Server Error', 500, ERROR_CODES.INTERNAL_ERROR);
    }
  });
}
