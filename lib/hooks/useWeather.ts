import { useEffect, useState } from 'react';

// Weather code type definitions for consistency
export enum WeatherCode {
  CLEAR_SKY = 0,
  PARTLY_CLOUDY = 1,
  CLOUDY = 2,
  OVERCAST = 3,
  FOGGY = 45,
  RIME_FOG = 48,
  LIGHT_DRIZZLE = 51,
  MODERATE_DRIZZLE = 53,
  DENSE_DRIZZLE = 55,
  LIGHT_FREEZING_DRIZZLE = 56,
  DENSE_FREEZING_DRIZZLE = 57,
  SLIGHT_RAIN = 61,
  MODERATE_RAIN = 63,
  HEAVY_RAIN = 65,
  LIGHT_FREEZING_RAIN = 66,
  HEAVY_FREEZING_RAIN = 67,
  SLIGHT_SNOW = 71,
  MODERATE_SNOW = 73,
  HEAVY_SNOW = 75,
  SNOW_GRAINS = 77,
  SLIGHT_RAIN_SHOWERS = 80,
  MODERATE_RAIN_SHOWERS = 81,
  VIOLENT_RAIN_SHOWERS = 82,
  SLIGHT_SNOW_SHOWERS = 85,
  HEAVY_SNOW_SHOWERS = 86,
  THUNDERSTORM = 95,
  THUNDERSTORM_WITH_HAIL = 96,
  THUNDERSTORM_WITH_HEAVY_HAIL = 99,
}

type Vibe = 'sunny' | 'cloudy' | 'rainy' | 'thunder' | 'snowy' | 'windy' | 'night';

interface WeatherData {
  temp: number;
  condition: string;
  location: string;
  vibe: Vibe;
  date: string;
  isDay: boolean;
  hourlyTemps: number[];
}

const VALID_VIBES: Vibe[] = ['sunny', 'cloudy', 'rainy', 'thunder', 'snowy', 'windy', 'night'];

const WEATHER_CODE_LABELS: Record<number, string> = {
  [WeatherCode.CLEAR_SKY]: 'Clear sky',
  [WeatherCode.PARTLY_CLOUDY]: 'Partly cloudy',
  [WeatherCode.CLOUDY]: 'Cloudy',
  [WeatherCode.OVERCAST]: 'Overcast',
  [WeatherCode.FOGGY]: 'Foggy',
  [WeatherCode.RIME_FOG]: 'Rime fog',
  [WeatherCode.LIGHT_DRIZZLE]: 'Light drizzle',
  [WeatherCode.MODERATE_DRIZZLE]: 'Moderate drizzle',
  [WeatherCode.DENSE_DRIZZLE]: 'Dense drizzle',
  [WeatherCode.LIGHT_FREEZING_DRIZZLE]: 'Light freezing drizzle',
  [WeatherCode.DENSE_FREEZING_DRIZZLE]: 'Dense freezing drizzle',
  [WeatherCode.SLIGHT_RAIN]: 'Slight rain',
  [WeatherCode.MODERATE_RAIN]: 'Moderate rain',
  [WeatherCode.HEAVY_RAIN]: 'Heavy rain',
  [WeatherCode.LIGHT_FREEZING_RAIN]: 'Light freezing rain',
  [WeatherCode.HEAVY_FREEZING_RAIN]: 'Heavy freezing rain',
  [WeatherCode.SLIGHT_SNOW]: 'Slight snow',
  [WeatherCode.MODERATE_SNOW]: 'Moderate snow',
  [WeatherCode.HEAVY_SNOW]: 'Heavy snow',
  [WeatherCode.SNOW_GRAINS]: 'Snow grains',
  [WeatherCode.SLIGHT_RAIN_SHOWERS]: 'Slight rain showers',
  [WeatherCode.MODERATE_RAIN_SHOWERS]: 'Moderate rain showers',
  [WeatherCode.VIOLENT_RAIN_SHOWERS]: 'Violent rain showers',
  [WeatherCode.SLIGHT_SNOW_SHOWERS]: 'Slight snow showers',
  [WeatherCode.HEAVY_SNOW_SHOWERS]: 'Heavy snow showers',
  [WeatherCode.THUNDERSTORM]: 'Thunderstorm',
  [WeatherCode.THUNDERSTORM_WITH_HAIL]: 'Thunderstorm with hail',
  [WeatherCode.THUNDERSTORM_WITH_HEAVY_HAIL]: 'Thunderstorm with heavy hail',
};

const determineVibe = (weatherCode: number, isDay: boolean): Vibe => {
  if (!isDay) return 'night';
  if (weatherCode === WeatherCode.CLEAR_SKY) return 'sunny';
  if ([WeatherCode.PARTLY_CLOUDY, WeatherCode.CLOUDY, WeatherCode.OVERCAST].includes(weatherCode))
    return 'cloudy';
  if (
    [
      WeatherCode.LIGHT_DRIZZLE,
      WeatherCode.MODERATE_DRIZZLE,
      WeatherCode.DENSE_DRIZZLE,
      WeatherCode.LIGHT_FREEZING_DRIZZLE,
      WeatherCode.DENSE_FREEZING_DRIZZLE,
      WeatherCode.SLIGHT_RAIN,
      WeatherCode.MODERATE_RAIN,
      WeatherCode.HEAVY_RAIN,
      WeatherCode.LIGHT_FREEZING_RAIN,
      WeatherCode.HEAVY_FREEZING_RAIN,
      WeatherCode.SLIGHT_RAIN_SHOWERS,
      WeatherCode.MODERATE_RAIN_SHOWERS,
      WeatherCode.VIOLENT_RAIN_SHOWERS,
    ].includes(weatherCode)
  )
    return 'rainy';
  if (
    [
      WeatherCode.SLIGHT_SNOW,
      WeatherCode.MODERATE_SNOW,
      WeatherCode.HEAVY_SNOW,
      WeatherCode.SNOW_GRAINS,
      WeatherCode.SLIGHT_SNOW_SHOWERS,
      WeatherCode.HEAVY_SNOW_SHOWERS,
    ].includes(weatherCode)
  )
    return 'snowy';
  if (
    [
      WeatherCode.THUNDERSTORM,
      WeatherCode.THUNDERSTORM_WITH_HAIL,
      WeatherCode.THUNDERSTORM_WITH_HEAVY_HAIL,
    ].includes(weatherCode)
  )
    return 'thunder';
  return 'windy';
};

const mapWeatherCode = (code: number): string => {
  return WEATHER_CODE_LABELS[code] || 'Windy';
};

export const useWeather = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const cacheKey = 'mq-weather-cache';
    const cacheTtlMs = 10 * 60 * 1000;
    const fallbackCoords = { latitude: -33.8688, longitude: 151.2093, label: 'Sydney' };
    const validateData = (data: WeatherData | null): data is WeatherData => {
      return (
        !!data &&
        typeof data.temp === 'number' &&
        typeof data.condition === 'string' &&
        typeof data.location === 'string' &&
        typeof data.vibe === 'string' &&
        VALID_VIBES.includes(data.vibe as Vibe) &&
        typeof data.date === 'string' &&
        typeof data.isDay === 'boolean' &&
        Array.isArray(data.hourlyTemps) &&
        data.hourlyTemps.every((v) => typeof v === 'number')
      );
    };

    const formatLocation = (timezone?: string) => {
      if (typeof timezone !== 'string' || !timezone) return fallbackCoords.label;
      const parts = timezone.split('/');
      return parts[parts.length - 1]?.replace('_', ' ') || fallbackCoords.label;
    };

    const formatDate = (timezone?: string) => {
      const tz = timezone || 'UTC';
      const formatter = new Intl.DateTimeFormat('en-AU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: tz,
      });
      return formatter.format(new Date());
    };

    const readCache = () => {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (!cached) return null;
        const parsed = JSON.parse(cached) as { timestamp: number; data: WeatherData };
        if (!parsed?.timestamp || !parsed?.data) return null;
        if (Date.now() - parsed.timestamp > cacheTtlMs) return null;
        if (!validateData(parsed.data)) return null;
        return parsed.data;
      } catch {
        return null;
      }
    };

    const fetchWeather = async (latitude: number, longitude: number, preferredLabel?: string) => {
      const response = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);

      if (!response.ok) {
        throw new Error('Weather service unreachable.');
      }

      const data = await response.json();
      const tempValue = data?.current_weather?.temperature;
      const weatherCode = data?.current_weather?.weathercode;
      const isDayValue = data?.current_weather?.is_day;
      const timezoneValue = data?.timezone as string | undefined;
      const hourlyTimes = data?.hourly?.time as string[] | undefined;
      const hourlyTempsRaw = data?.hourly?.temperature_2m as number[] | undefined;

      if (
        typeof tempValue !== 'number' ||
        typeof weatherCode !== 'number' ||
        (isDayValue !== 0 && isDayValue !== 1)
      ) {
        throw new Error('Weather data unavailable.');
      }

      const hourlyTemps = (() => {
        if (!Array.isArray(hourlyTimes) || !Array.isArray(hourlyTempsRaw)) return [];
        const now = Date.now();
        const pairs = hourlyTimes
          .map((t, idx) => ({ ts: Date.parse(t), temp: hourlyTempsRaw[idx] }))
          .filter((p) => Number.isFinite(p.ts) && typeof p.temp === 'number');
        const future = pairs.filter((p) => p.ts >= now - 15 * 60 * 1000);
        return future.slice(0, 6).map((p) => Math.round(p.temp));
      })();

      const condition = mapWeatherCode(weatherCode);
      const vibe = determineVibe(weatherCode, isDayValue === 1);

      const nextData: WeatherData = {
        temp: Math.round(tempValue),
        condition,
        location: preferredLabel ?? formatLocation(timezoneValue),
        vibe,
        date: formatDate(timezoneValue),
        isDay: isDayValue === 1,
        hourlyTemps,
      };

      if (!isMounted) return;

      setWeatherData(nextData);
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: nextData }));
      } catch {
        // Ignore cache write errors (private mode, quota, etc).
      }
    };

    const cachedData = readCache();
    if (cachedData) {
      setWeatherData(cachedData);
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    if (!navigator.geolocation) {
      (async () => {
        try {
          await fetchWeather(
            fallbackCoords.latitude,
            fallbackCoords.longitude,
            fallbackCoords.label,
          );
          setError('Geolocation not supported. Showing default location.');
        } catch {
          setError('Geolocation not supported by this browser.');
        } finally {
          setLoading(false);
        }
      })();
      return () => {
        isMounted = false;
      };
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          await fetchWeather(latitude, longitude);

          if (!isMounted) return;
          setError(null);
        } catch (err) {
          if (!isMounted) return;
          const message = err instanceof Error ? err.message : 'Failed to load weather.';
          setError(message);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      },
      async () => {
        if (!isMounted) return;
        try {
          const { latitude, longitude, label } = fallbackCoords;
          await fetchWeather(latitude, longitude, label);
          setError('Location permission denied. Showing default city.');
        } catch {
          setError('Location permission denied. Enable access to see local weather.');
        } finally {
          setLoading(false);
        }
      },
      { timeout: 8000 },
    );

    return () => {
      isMounted = false;
    };
  }, []);

  return { weatherData, loading, error };
};
