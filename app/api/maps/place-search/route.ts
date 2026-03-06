import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonError, jsonSuccess, ERROR_CODES, parseJsonBody } from '@/app/api/_lib/response';
import { getClientIP, isTrustedOrigin } from '@/lib/security/ip';
import { apiLimiter } from '@/lib/services/rateLimitService';
import { logger } from '@/lib/logger';

const GOOGLE_AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';

const AUTOCOMPLETE_FIELD_MASK = [
  'suggestions.placePrediction.placeId',
  'suggestions.placePrediction.text',
  'suggestions.placePrediction.structuredFormat',
  'suggestions.placePrediction.distanceMeters',
].join(',');

const requestSchema = z.object({
  query: z.string().min(2).max(200),
  sessionToken: z.string().max(100).optional(),
});

export interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  distanceMeters?: number;
}

interface AutocompleteSuggestion {
  placePrediction?: {
    placeId?: string;
    text?: { text?: string };
    structuredFormat?: {
      mainText?: { text?: string };
      secondaryText?: { text?: string };
    };
    distanceMeters?: number;
  };
}

// MQ campus centre for location biasing
const CAMPUS_CENTRE = { latitude: -33.7742, longitude: 151.1127 };
const BIAS_RADIUS_METERS = 5000;

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return jsonError('Forbidden.', 403, ERROR_CODES.FORBIDDEN);
  }

  const apiKey = process.env.GOOGLE_ROUTES_API_KEY;
  const clientIP = getClientIP(request);
  const { allowed, remaining, resetIn } = await apiLimiter(`place-search:${clientIP}`);

  if (!allowed) {
    return jsonError(
      'Rate limit exceeded. Please wait before searching.',
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
      return jsonError('Invalid search request.', 400, ERROR_CODES.VALIDATION_ERROR, {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { query, sessionToken } = parsed.data;

    const autocompleteBody: Record<string, unknown> = {
      input: query,
      languageCode: 'en-AU',
      regionCode: 'AU',
      includedRegionCodes: ['AU'],
      locationBias: {
        circle: {
          center: CAMPUS_CENTRE,
          radius: BIAS_RADIUS_METERS,
        },
      },
      origin: CAMPUS_CENTRE,
    };

    if (sessionToken) {
      autocompleteBody.sessionToken = sessionToken;
    }

    const upstreamResponse = await fetch(GOOGLE_AUTOCOMPLETE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': AUTOCOMPLETE_FIELD_MASK,
      },
      body: JSON.stringify(autocompleteBody),
      signal: AbortSignal.timeout(8000),
    });

    if (!upstreamResponse.ok) {
      const upstreamBody = await upstreamResponse.text();
      logger.error('Google Places Autocomplete upstream error', {
        status: upstreamResponse.status,
        body: upstreamBody.slice(0, 300),
      });

      return jsonError(
        'Google Places search is temporarily unavailable.',
        upstreamResponse.status >= 500 ? 502 : upstreamResponse.status,
        ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      );
    }

    const upstreamJson = (await upstreamResponse.json()) as {
      suggestions?: AutocompleteSuggestion[];
    };

    const suggestions: PlaceSuggestion[] = (upstreamJson.suggestions ?? [])
      .filter((s) => s.placePrediction?.placeId)
      .map((s) => ({
        placeId: s.placePrediction!.placeId!,
        mainText:
          s.placePrediction!.structuredFormat?.mainText?.text ??
          s.placePrediction!.text?.text ??
          '',
        secondaryText: s.placePrediction!.structuredFormat?.secondaryText?.text ?? '',
        distanceMeters: s.placePrediction!.distanceMeters,
      }));

    const response = jsonSuccess(suggestions);
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Place search proxy failed', { message, clientIP });

    if (message.toLowerCase().includes('timeout') || message.toLowerCase().includes('abort')) {
      return jsonError('Place search request timed out.', 504, ERROR_CODES.TIMEOUT);
    }

    return jsonError('Unable to search places right now.', 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
