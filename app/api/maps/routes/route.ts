import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonError, jsonSuccess, ERROR_CODES } from '@/app/api/_lib/response';
import { getClientIP } from '@/lib/security/ip';
import { apiLimiter } from '@/lib/services/rateLimitService';
import { logger } from '@/lib/logger';
import { GOOGLE_ROUTES_FIELD_MASK } from '@/lib/maps/google/fieldMasks';
import type {
  GoogleComputedRoute,
  GoogleRouteStep,
  GoogleTravelMode,
} from '@/lib/maps/google/types';

const GOOGLE_ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 300;

const coordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const requestSchema = z.object({
  origin: coordinateSchema,
  destination: coordinateSchema,
  travelMode: z.enum(['WALK', 'DRIVE', 'BICYCLE', 'TRANSIT']).default('WALK'),
});

interface CachedRoute {
  data: GoogleComputedRoute;
  createdAt: number;
}

const routeCache = new Map<string, CachedRoute>();

function buildCacheKey(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  travelMode: GoogleTravelMode,
): string {
  return createHash('sha256')
    .update(
      `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}:${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}:${travelMode}`,
    )
    .digest('hex')
    .slice(0, 32);
}

function getCachedRoute(key: string): GoogleComputedRoute | null {
  const cached = routeCache.get(key);
  if (!cached) {
    return null;
  }

  if (Date.now() - cached.createdAt > CACHE_TTL_MS) {
    routeCache.delete(key);
    return null;
  }

  return cached.data;
}

function setCachedRoute(key: string, data: GoogleComputedRoute): void {
  if (routeCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = routeCache.keys().next().value;
    if (oldestKey) {
      routeCache.delete(oldestKey);
    }
  }

  routeCache.set(key, {
    data,
    createdAt: Date.now(),
  });
}

function parseDurationSeconds(duration?: string): number {
  if (!duration) return 0;
  const parsed = Number.parseFloat(duration.replace('s', ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatTransitInstruction(step: {
  navigationInstruction?: { instructions?: string };
  transitDetails?: {
    headsign?: string;
    transitLine?: {
      nameShort?: string;
      name?: string;
    };
    stopCount?: number;
  };
}): string {
  if (step.navigationInstruction?.instructions) {
    return step.navigationInstruction.instructions;
  }

  const lineName =
    step.transitDetails?.transitLine?.nameShort ?? step.transitDetails?.transitLine?.name;
  const headsign = step.transitDetails?.headsign;

  if (lineName && headsign) {
    return `Take ${lineName} toward ${headsign}`;
  }

  if (lineName) {
    return `Take ${lineName}`;
  }

  return 'Continue to your destination';
}

function normaliseRouteResponse(
  travelMode: GoogleTravelMode,
  route: {
    distanceMeters?: number;
    duration?: string;
    polyline?: { encodedPolyline?: string };
    legs?: Array<{
      steps?: Array<{
        distanceMeters?: number;
        staticDuration?: string;
        travelMode?: string;
        navigationInstruction?: { instructions?: string };
        transitDetails?: {
          headsign?: string;
          stopCount?: number;
          transitLine?: {
            nameShort?: string;
            name?: string;
          };
        };
      }>;
    }>;
  },
): GoogleComputedRoute {
  const steps: GoogleRouteStep[] =
    route.legs?.flatMap((leg) =>
      (leg.steps ?? []).map((step) => ({
        distanceMeters: step.distanceMeters ?? 0,
        durationSeconds: parseDurationSeconds(step.staticDuration),
        instruction: formatTransitInstruction(step),
        travelMode: step.travelMode,
        transitLineName:
          step.transitDetails?.transitLine?.nameShort ?? step.transitDetails?.transitLine?.name,
        transitHeadsign: step.transitDetails?.headsign,
        transitStopCount: step.transitDetails?.stopCount,
      })),
    ) ?? [];

  return {
    mode: travelMode,
    distanceMeters: route.distanceMeters ?? 0,
    durationSeconds: parseDurationSeconds(route.duration),
    encodedPolyline: route.polyline?.encodedPolyline ?? '',
    steps,
  };
}

function buildComputeRoutesBody(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  travelMode: GoogleTravelMode,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    origin: {
      location: {
        latLng: origin,
      },
    },
    destination: {
      location: {
        latLng: destination,
      },
    },
    travelMode,
    languageCode: 'en-AU',
    units: 'METRIC',
  };

  if (travelMode === 'DRIVE') {
    body.routingPreference = 'TRAFFIC_AWARE';
  }

  if (travelMode === 'TRANSIT') {
    body.departureTime = new Date().toISOString();
  }

  return body;
}

export async function POST(request: NextRequest) {
  const googleRoutesApiKey = process.env.GOOGLE_ROUTES_API_KEY;
  const clientIP = getClientIP(request);
  const { allowed, remaining, resetIn } = await apiLimiter(`google-routes:${clientIP}`);

  if (!allowed) {
    return jsonError(
      'Rate limit exceeded. Please wait before making more route requests.',
      429,
      ERROR_CODES.RATE_LIMITED,
      { retryAfter: resetIn },
    );
  }

  if (!googleRoutesApiKey) {
    return jsonError(
      'Google Routes API is not configured on the server.',
      503,
      ERROR_CODES.SERVICE_UNAVAILABLE,
    );
  }

  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError('Invalid route request payload.', 400, ERROR_CODES.VALIDATION_ERROR, {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { origin, destination, travelMode } = parsed.data;
    const cacheKey = buildCacheKey(origin, destination, travelMode);
    const cached = getCachedRoute(cacheKey);

    if (cached) {
      const response = jsonSuccess(cached);
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      return response;
    }

    const upstreamResponse = await fetch(GOOGLE_ROUTES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleRoutesApiKey,
        'X-Goog-FieldMask': GOOGLE_ROUTES_FIELD_MASK,
      },
      body: JSON.stringify(buildComputeRoutesBody(origin, destination, travelMode)),
      signal: AbortSignal.timeout(12000),
    });

    if (!upstreamResponse.ok) {
      const upstreamBody = await upstreamResponse.text();
      logger.error('Google Routes upstream error', {
        status: upstreamResponse.status,
        body: upstreamBody.slice(0, 300),
      });

      return jsonError(
        'Google routing service is temporarily unavailable.',
        upstreamResponse.status >= 500 ? 502 : upstreamResponse.status,
        ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      );
    }

    const upstreamJson = (await upstreamResponse.json()) as {
      routes?: Array<{
        distanceMeters?: number;
        duration?: string;
        polyline?: { encodedPolyline?: string };
        legs?: Array<{
          steps?: Array<{
            distanceMeters?: number;
            staticDuration?: string;
            travelMode?: string;
            navigationInstruction?: { instructions?: string };
            transitDetails?: {
              headsign?: string;
              stopCount?: number;
              transitLine?: {
                nameShort?: string;
                name?: string;
              };
            };
          }>;
        }>;
      }>;
    };

    const route = upstreamJson.routes?.[0];
    if (!route?.polyline?.encodedPolyline) {
      return jsonError('No route found for the requested trip.', 404, ERROR_CODES.NOT_FOUND);
    }

    const normalisedRoute = normaliseRouteResponse(travelMode, route);
    setCachedRoute(cacheKey, normalisedRoute);

    const response = jsonSuccess(normalisedRoute);
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Google Routes API proxy failed', {
      message,
      clientIP,
    });

    if (message.toLowerCase().includes('timeout') || message.toLowerCase().includes('abort')) {
      return jsonError('Google route request timed out.', 504, ERROR_CODES.TIMEOUT);
    }

    return jsonError('Unable to compute a route right now.', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
