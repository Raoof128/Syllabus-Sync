import { NextRequest } from 'next/server';
import { jsonSuccess, jsonError, ERROR_CODES } from '@/app/api/_lib/response';
import { apiLimiter } from '@/lib/services/rateLimitService';
import { getClientIP } from '@/lib/security/ip';
import { logger } from '@/lib/logger';
import { GoogleWeatherProvider } from '@/lib/weather/providers/googleWeatherProvider';
import { z } from 'zod';
import { WeatherResult } from '@/lib/weather/types';

/**
 * Weather API Proxy Endpoint
 *
 * SECURITY: Proxies requests to Google Weather API.
 * The API key is kept server-side only (not NEXT_PUBLIC_).
 */

// Cache weather data for 5 minutes (current) to 15 minutes (hourly)
const weatherCache = new Map<string, { data: WeatherResult; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes standard ttl
const EDGE_CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=60';

// Lazy-init provider at runtime (not build time) to avoid breaking page collection
let _provider: GoogleWeatherProvider | null = null;
function getProvider(): GoogleWeatherProvider {
  if (!_provider) {
    const key = process.env.GOOGLE_WEATHER_API_KEY;
    if (!key) throw new Error('GOOGLE_WEATHER_API_KEY environment variable is required');
    _provider = new GoogleWeatherProvider(key);
  }
  return _provider;
}

// 4.1 Validate response schema (Sanity Checks)
const WeatherResultSchema = z.object({
  current: z.object({
    temperature: z.number().min(-15).max(55),
    apparentTemperature: z.number().min(-25).max(65),
    precipitationProbability: z.number().min(0).max(100),
    windSpeed: z.number().min(0).max(200),
    weatherCode: z.number(),
    isDay: z.boolean(),
    condition: z.string(),
  }),
  hourly: z
    .object({
      time: z.array(z.string()),
      temperature: z.array(z.number()),
      precipitationProbability: z.array(z.number()),
      weatherCode: z.array(z.number()),
      windSpeed: z.array(z.number()),
    })
    .optional(),
  timezone: z.string(),
  source: z.string(),
  timestamp: z.number(),
  modelUsed: z.string().optional(),
});

export async function GET(request: NextRequest) {
  // SECURITY: Rate limit weather API requests
  const clientIP = getClientIP(request);
  const { allowed, resetIn } = await apiLimiter(`weather:${clientIP}`);

  if (!allowed) {
    return jsonError(
      'Rate limit exceeded. Please try again later.',
      429,
      ERROR_CODES.RATE_LIMITED,
      { retryAfter: resetIn },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  // Validate required parameters
  if (!lat || !lon) {
    return jsonError('Missing required parameters: lat and lon', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  // Validate coordinate format
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    return jsonError(
      'Invalid coordinates: lat and lon must be numbers',
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return jsonError('Coordinates out of range', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  // Create cache key (rounded to 4 decimal places, ~11m precision as requested)
  const roundedLat = Math.round(latitude * 10000) / 10000;
  const roundedLon = Math.round(longitude * 10000) / 10000;
  const cacheKey = `${roundedLat},${roundedLon}`;

  // Check cache
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return jsonSuccess(cached.data, 200, undefined, {
      headers: {
        'Cache-Control': EDGE_CACHE_CONTROL,
      },
    });
  }

  try {
    const start = Date.now();

    const weatherData = await getProvider().getWeather({
      lat: roundedLat,
      lon: roundedLon,
    });

    // 4.2 Sanity thresholds via Zod
    const validatedData = WeatherResultSchema.parse(weatherData);

    // Update cache
    weatherCache.set(cacheKey, {
      data: validatedData,
      timestamp: Date.now(),
    });

    // Logging for observability (6.1)
    logger.info('Weather fetched successfully', {
      source: 'Google-Weather',
      model: validatedData.modelUsed,
      lat: roundedLat,
      lon: roundedLon,
      latencyMs: Date.now() - start,
    });

    // Clean up old cache entries periodically
    if (Math.random() < 0.1) {
      const now = Date.now();
      for (const [key, value] of weatherCache.entries()) {
        if (now - value.timestamp > CACHE_TTL_MS * 3) {
          weatherCache.delete(key);
        }
      }
    }

    return jsonSuccess(validatedData, 200, undefined, {
      headers: {
        'Cache-Control': EDGE_CACHE_CONTROL,
      },
    });
  } catch (error) {
    logger.error('Weather API error:', error);

    // Fallback to cache if available, even if stale (sanity check fallback)
    if (cached) {
      logger.info('Falling back to stale weather cache due to API error');
      return jsonSuccess({ ...cached.data, isStaleFallback: true }, 200, undefined, {
        headers: { 'Cache-Control': 'no-cache' },
      });
    }

    return jsonError('Failed to fetch weather data', 503, ERROR_CODES.EXTERNAL_SERVICE_ERROR);
  }
}
