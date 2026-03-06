import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonError, jsonSuccess, ERROR_CODES, parseJsonBody } from '@/app/api/_lib/response';
import { getClientIP, isTrustedOrigin } from '@/lib/security/ip';
import { apiLimiter } from '@/lib/services/rateLimitService';
import { logger } from '@/lib/logger';

const PLACE_DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'primaryType',
].join(',');

const requestSchema = z.object({
  placeId: z.string().min(1).max(300),
  sessionToken: z.string().max(100).optional(),
});

export interface PlaceDetails {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  primaryType?: string;
}

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return jsonError('Forbidden.', 403, ERROR_CODES.FORBIDDEN);
  }

  const apiKey = process.env.GOOGLE_ROUTES_API_KEY;
  const clientIP = getClientIP(request);
  const { allowed, remaining, resetIn } = await apiLimiter(`place-details:${clientIP}`);

  if (!allowed) {
    return jsonError(
      'Rate limit exceeded. Please wait before requesting details.',
      429,
      ERROR_CODES.RATE_LIMITED,
      { retryAfter: resetIn },
    );
  }

  if (!apiKey) {
    return jsonError(
      'Google Places API is not configured on the server.',
      503,
      ERROR_CODES.SERVICE_UNAVAILABLE,
    );
  }

  try {
    const { data: body, error: bodyError } = await parseJsonBody(request);
    if (bodyError) return bodyError;
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError('Invalid request.', 400, ERROR_CODES.VALIDATION_ERROR, {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { placeId, sessionToken } = parsed.data;

    const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
    if (sessionToken) {
      url.searchParams.set('sessionToken', sessionToken);
    }

    const upstreamResponse = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': PLACE_DETAILS_FIELD_MASK,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!upstreamResponse.ok) {
      const upstreamBody = await upstreamResponse.text();
      logger.error('Google Place Details upstream error', {
        status: upstreamResponse.status,
        body: upstreamBody.slice(0, 300),
      });

      if (upstreamResponse.status === 404) {
        return jsonError('Place not found.', 404, ERROR_CODES.NOT_FOUND);
      }

      return jsonError(
        'Google Place Details service is temporarily unavailable.',
        upstreamResponse.status >= 500 ? 502 : upstreamResponse.status,
        ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      );
    }

    const upstreamJson = (await upstreamResponse.json()) as {
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
      primaryType?: string;
    };

    if (upstreamJson.location?.latitude == null || upstreamJson.location?.longitude == null) {
      return jsonError('Place has no coordinates.', 404, ERROR_CODES.NOT_FOUND);
    }

    const details: PlaceDetails = {
      placeId: upstreamJson.id ?? placeId,
      displayName: upstreamJson.displayName?.text ?? 'Unknown place',
      formattedAddress: upstreamJson.formattedAddress ?? '',
      lat: upstreamJson.location.latitude,
      lng: upstreamJson.location.longitude,
      primaryType: upstreamJson.primaryType,
    };

    const response = jsonSuccess(details);
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Place details proxy failed', { message, clientIP });

    if (message.toLowerCase().includes('timeout') || message.toLowerCase().includes('abort')) {
      return jsonError('Place details request timed out.', 504, ERROR_CODES.TIMEOUT);
    }

    return jsonError('Unable to fetch place details right now.', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
