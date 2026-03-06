import { WeatherResult, WeatherCurrent, WeatherHourly } from './types';

/**
 * Maps Google Weather API weatherCondition.type → WMO-compatible code.
 * This lets the existing determineVibe() in constants.ts work unchanged.
 */
const GOOGLE_TYPE_TO_WMO: Record<string, number> = {
  // Clear / Cloudy
  CLEAR: 0,
  MOSTLY_CLEAR: 1,
  PARTLY_CLOUDY: 2,
  MOSTLY_CLOUDY: 3,
  CLOUDY: 3,

  // Wind
  WINDY: 3, // no direct WMO wind code; maps to "overcast" → vibe 'windy' via fallthrough

  // Rain
  WIND_AND_RAIN: 61,
  LIGHT_RAIN_SHOWERS: 80,
  CHANCE_OF_SHOWERS: 80,
  SCATTERED_SHOWERS: 80,
  RAIN_SHOWERS: 81,
  HEAVY_RAIN_SHOWERS: 82,
  LIGHT_TO_MODERATE_RAIN: 61,
  MODERATE_TO_HEAVY_RAIN: 63,
  RAIN: 63,
  LIGHT_RAIN: 61,
  HEAVY_RAIN: 65,
  RAIN_PERIODICALLY_HEAVY: 65,

  // Snow
  LIGHT_SNOW_SHOWERS: 85,
  CHANCE_OF_SNOW_SHOWERS: 85,
  SCATTERED_SNOW_SHOWERS: 85,
  SNOW_SHOWERS: 85,
  HEAVY_SNOW_SHOWERS: 86,
  LIGHT_TO_MODERATE_SNOW: 71,
  MODERATE_TO_HEAVY_SNOW: 73,
  SNOW: 73,
  LIGHT_SNOW: 71,
  HEAVY_SNOW: 75,
  SNOWSTORM: 75,
  SNOW_PERIODICALLY_HEAVY: 75,
  HEAVY_SNOW_STORM: 75,
  BLOWING_SNOW: 77,

  // Mixed
  RAIN_AND_SNOW: 66,

  // Hail
  HAIL: 96,
  HAIL_SHOWERS: 96,

  // Thunderstorm
  THUNDERSTORM: 95,
  THUNDERSHOWER: 95,
  LIGHT_THUNDERSTORM_RAIN: 95,
  SCATTERED_THUNDERSTORMS: 95,
  HEAVY_THUNDERSTORM: 99,
};

function toWmoCode(type?: string): number {
  if (!type) return 0;
  return GOOGLE_TYPE_TO_WMO[type] ?? 0;
}

function toConditionLabel(type?: string, description?: string): string {
  if (description) return description;
  if (!type || type === 'TYPE_UNSPECIFIED') return 'Unknown';
  // Convert enum to title case: LIGHT_RAIN → Light rain
  return type
    .split('_')
    .map((w, i) => (i === 0 ? w.charAt(0) + w.slice(1).toLowerCase() : w.toLowerCase()))
    .join(' ');
}

// --- Raw Google API response types ---

interface GoogleTemperature {
  degrees: number;
  unit?: string;
}

interface GoogleWeatherCondition {
  type?: string;
  description?: { text?: string };
  iconBaseUri?: string;
}

interface GooglePrecipitation {
  probability?: { percent?: number };
  qpf?: { quantity?: number; unit?: string };
}

interface GoogleWind {
  speed?: { value?: number; unit?: string };
  direction?: { degrees?: number; cardinal?: string };
  gust?: { value?: number; unit?: string };
}

interface GoogleCurrentConditions {
  currentTime?: string;
  timeZone?: { id?: string };
  isDaytime?: boolean;
  weatherCondition?: GoogleWeatherCondition;
  temperature?: GoogleTemperature;
  feelsLikeTemperature?: GoogleTemperature;
  precipitation?: GooglePrecipitation;
  wind?: GoogleWind;
  relativeHumidity?: number;
  cloudCover?: number;
}

interface GoogleForecastHour {
  interval?: { startTime?: string; endTime?: string };
  displayDateTime?: {
    year?: number;
    month?: number;
    day?: number;
    hours?: number;
    utcOffset?: string;
  };
  isDaytime?: boolean;
  weatherCondition?: GoogleWeatherCondition;
  temperature?: GoogleTemperature;
  feelsLikeTemperature?: GoogleTemperature;
  precipitation?: GooglePrecipitation;
  wind?: GoogleWind;
}

interface GoogleHourlyResponse {
  forecastHours?: GoogleForecastHour[];
  timeZone?: { id?: string };
}

// --- Normalizers ---

export function normalizeGoogleCurrent(data: unknown): {
  current: WeatherCurrent;
  timezone: string;
} {
  const d = data as GoogleCurrentConditions;

  const wmoCode = toWmoCode(d.weatherCondition?.type);

  const current: WeatherCurrent = {
    temperature: d.temperature?.degrees ?? 0,
    apparentTemperature: d.feelsLikeTemperature?.degrees ?? d.temperature?.degrees ?? 0,
    precipitationProbability: d.precipitation?.probability?.percent ?? 0,
    windSpeed: d.wind?.speed?.value ?? 0,
    weatherCode: wmoCode,
    isDay: d.isDaytime ?? true,
    condition: toConditionLabel(d.weatherCondition?.type, d.weatherCondition?.description?.text),
  };

  return {
    current,
    timezone: d.timeZone?.id ?? 'Australia/Sydney',
  };
}

export function normalizeGoogleHourly(data: unknown): WeatherHourly | undefined {
  const d = data as GoogleHourlyResponse;
  const hours = d.forecastHours;

  if (!hours || hours.length === 0) return undefined;

  const sliced = hours.slice(0, 12);

  return {
    time: sliced.map((h) => h.interval?.startTime ?? ''),
    temperature: sliced.map((h) => h.temperature?.degrees ?? 0),
    precipitationProbability: sliced.map((h) => h.precipitation?.probability?.percent ?? 0),
    weatherCode: sliced.map((h) => toWmoCode(h.weatherCondition?.type)),
    windSpeed: sliced.map((h) => h.wind?.speed?.value ?? 0),
  };
}

export function normalizeGoogleResponse(currentData: unknown, hourlyData: unknown): WeatherResult {
  const { current, timezone } = normalizeGoogleCurrent(currentData);
  const hourly = normalizeGoogleHourly(hourlyData);

  return {
    current,
    hourly,
    timezone,
    source: 'google-weather',
    timestamp: Date.now(),
    modelUsed: 'google-deepmind',
  };
}
