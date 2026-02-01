import { NextRequest } from 'next/server';
import { jsonSuccess, jsonError, ERROR_CODES } from '@/app/api/_lib/response';
import { apiLimiter } from '@/lib/services/rateLimitService';
import { getClientIP } from '@/lib/security/ip';
import { logger } from '@/lib/logger';

/**
 * Weather API Proxy Endpoint
 *
 * SECURITY: This endpoint proxies requests to Open-Meteo API, keeping the API
 * communication server-side to prevent CORS issues and provide consistent
 * data formatting.
 */

const OPENMETEO_BASE_URL = 'https://api.open-meteo.com/v1';

// Cache weather data for 5 minutes to reduce API calls while keeping data fresh
const weatherCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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

  // Create cache key (rounded to 2 decimal places to improve cache hit rate)
  const roundedLat = Math.round(latitude * 100) / 100;
  const roundedLon = Math.round(longitude * 100) / 100;
  const cacheKey = `${roundedLat},${roundedLon}`;

  // Check cache
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return jsonSuccess(cached.data);
  }

  try {
    // Fetch weather data from Open-Meteo API
    const weatherUrl = new URL(`${OPENMETEO_BASE_URL}/forecast`);
    weatherUrl.searchParams.set('latitude', latitude.toString());
    weatherUrl.searchParams.set('longitude', longitude.toString());
    weatherUrl.searchParams.set('current_weather', 'true');
    weatherUrl.searchParams.set('hourly', 'temperature_2m');
    weatherUrl.searchParams.set('timezone', 'auto');

    const response = await fetch(weatherUrl.toString(), {
      headers: {
        Accept: 'application/json',
      },
      // Cache for 5 minutes at edge
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      logger.error('Open-Meteo API error:', {
        status: response.status,
        statusText: response.statusText,
      });

      return jsonError(
        'Weather service temporarily unavailable',
        503,
        ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      );
    }

    const weatherData = await response.json();

    // SECURITY: Only return safe, sanitized data to the client
    const sanitizedData = {
      current_weather: {
        temperature: weatherData.current_weather?.temperature,
        weathercode: weatherData.current_weather?.weathercode,
        is_day: weatherData.current_weather?.is_day,
      },
      hourly: {
        time: weatherData.hourly?.time,
        temperature_2m: weatherData.hourly?.temperature_2m,
      },
      timezone: weatherData.timezone,
    };

    // Update cache
    weatherCache.set(cacheKey, {
      data: sanitizedData,
      timestamp: Date.now(),
    });

    // Clean up old cache entries periodically
    if (Math.random() < 0.1) {
      const now = Date.now();
      for (const [key, value] of weatherCache.entries()) {
        if (now - value.timestamp > CACHE_TTL_MS * 2) {
          weatherCache.delete(key);
        }
      }
    }

    return jsonSuccess(sanitizedData);
  } catch (error) {
    logger.error('Weather API fetch error:', error);
    return jsonError('Failed to fetch weather data', 503, ERROR_CODES.EXTERNAL_SERVICE_ERROR);
  }
}
