import { NextRequest } from 'next/server';
import { jsonSuccess, jsonError, ERROR_CODES } from '@/app/api/_lib/response';
import { apiLimiter } from '@/lib/services/rateLimitService';
import { getClientIP } from '@/lib/security/ip';

/**
 * Weather API Proxy Endpoint
 *
 * SECURITY: This endpoint proxies requests to OpenWeather API, keeping the API key
 * server-side and never exposing it to the client. This prevents:
 * - API key theft from client-side code
 * - Unauthorized usage of our API quota
 * - Man-in-the-middle attacks on API credentials
 */

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Cache weather data for 10 minutes to reduce API calls
const weatherCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

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

  // Check if API key is configured
  if (!OPENWEATHER_API_KEY) {
    console.error('Weather API: OPENWEATHER_API_KEY not configured');
    return jsonError(
      'Weather service temporarily unavailable',
      503,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR,
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const units = searchParams.get('units') || 'metric';

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

  // SECURITY: Validate units parameter to prevent injection
  const validUnits = ['metric', 'imperial', 'standard'];
  if (!validUnits.includes(units)) {
    return jsonError('Invalid units parameter', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  // Create cache key (rounded to 2 decimal places to improve cache hit rate)
  const roundedLat = Math.round(latitude * 100) / 100;
  const roundedLon = Math.round(longitude * 100) / 100;
  const cacheKey = `${roundedLat},${roundedLon},${units}`;

  // Check cache
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return jsonSuccess(cached.data);
  }

  try {
    // Fetch weather data from OpenWeather API
    const weatherUrl = new URL(`${OPENWEATHER_BASE_URL}/weather`);
    weatherUrl.searchParams.set('lat', latitude.toString());
    weatherUrl.searchParams.set('lon', longitude.toString());
    weatherUrl.searchParams.set('units', units);
    weatherUrl.searchParams.set('appid', OPENWEATHER_API_KEY);

    const response = await fetch(weatherUrl.toString(), {
      headers: {
        Accept: 'application/json',
      },
      // Cache for 5 minutes at edge
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error('OpenWeather API error:', {
        status: response.status,
        statusText: response.statusText,
      });

      if (response.status === 401) {
        return jsonError(
          'Weather service authentication failed',
          503,
          ERROR_CODES.EXTERNAL_SERVICE_ERROR,
        );
      }

      return jsonError(
        'Weather service temporarily unavailable',
        503,
        ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      );
    }

    const weatherData = await response.json();

    // SECURITY: Only return safe, sanitized data to the client
    // Don't expose raw API response which might contain sensitive info
    const sanitizedData = {
      weather: weatherData.weather?.[0] || null,
      main: {
        temp: weatherData.main?.temp,
        feels_like: weatherData.main?.feels_like,
        humidity: weatherData.main?.humidity,
        pressure: weatherData.main?.pressure,
      },
      wind: {
        speed: weatherData.wind?.speed,
        deg: weatherData.wind?.deg,
      },
      visibility: weatherData.visibility,
      clouds: weatherData.clouds?.all,
      name: weatherData.name,
      sys: {
        sunrise: weatherData.sys?.sunrise,
        sunset: weatherData.sys?.sunset,
      },
      timezone: weatherData.timezone,
      dt: weatherData.dt,
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
    console.error('Weather API fetch error:', error);
    return jsonError('Failed to fetch weather data', 503, ERROR_CODES.EXTERNAL_SERVICE_ERROR);
  }
}
