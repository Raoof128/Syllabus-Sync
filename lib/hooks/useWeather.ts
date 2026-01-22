import { useEffect, useState } from 'react';

type Vibe = 'hot' | 'cool' | 'windy' | 'rain';

interface WeatherData {
  temp: number;
  condition: string;
  location: string;
  vibe: Vibe;
  date: string;
  isDay: boolean;
  hourlyTemps: number[];
}

const determineVibe = (temp: number, condition: string, isDay: boolean): Vibe => {
  const mainCondition = condition.toLowerCase();

  if (mainCondition.includes('rain') || mainCondition.includes('drizzle') || mainCondition.includes('thunder')) {
    return 'rain';
  }
  if (mainCondition.includes('cloud') && temp < 20) {
    return 'windy';
  }
  if (!isDay) {
    return 'cool';
  }
  if (temp >= 25) {
    return 'hot';
  }
  return 'cool';
};

const mapWeatherCode = (code: number): string => {
  if (code === 0) return 'Clear';
  if ([1, 2, 3].includes(code)) return 'Cloudy';
  if ([45, 48].includes(code)) return 'Fog';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67].includes(code)) return 'Rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
  if ([80, 81, 82].includes(code)) return 'Showers';
  if ([95, 96, 99].includes(code)) return 'Thunder';
  return 'Clear';
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
        typeof data.date === 'string' &&
        typeof data.isDay === 'boolean' &&
        Array.isArray(data.hourlyTemps)
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
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m&timezone=auto`,
      );

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

      if (typeof tempValue !== 'number' || typeof weatherCode !== 'number' || (isDayValue !== 0 && isDayValue !== 1)) {
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
      const vibe = determineVibe(tempValue, condition, isDayValue === 1);

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
          await fetchWeather(fallbackCoords.latitude, fallbackCoords.longitude, fallbackCoords.label);
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
