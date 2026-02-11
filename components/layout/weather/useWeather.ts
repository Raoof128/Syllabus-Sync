import { useState, useEffect, useCallback } from 'react';
import { SydneyRegion, WeatherData } from './types';
import { SYDNEY_REGIONS, mapWeatherCode, determineVibe } from './constants';

const STORAGE_KEY = 'mq-weather-region';
const CACHE_KEY_PREFIX = 'mq-weather-cache-';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const useWeather = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<SydneyRegion>(SYDNEY_REGIONS[0]);

  // Load saved region preference
  useEffect(() => {
    try {
      const savedRegionId = localStorage.getItem(STORAGE_KEY);
      if (savedRegionId) {
        const region = SYDNEY_REGIONS.find((r) => r.id === savedRegionId);
        if (region) {
          setSelectedRegion(region);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const fetchWeather = useCallback(async (region: SydneyRegion, forceRefresh = false) => {
    setLoading(true);
    setError(null);

    // Check cache first
    if (!forceRefresh) {
      try {
        const cacheKey = `${CACHE_KEY_PREFIX}${region.id}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as { timestamp: number; data: WeatherData };
          if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
            setWeatherData(parsed.data);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Ignore cache read errors
      }
    }

    try {
      const response = await fetch(
        `/api/weather?lat=${region.lat}&lon=${region.lon}&_t=${Date.now()}`,
      );

      if (!response.ok) {
        throw new Error('Weather service unreachable');
      }

      const apiResponse = await response.json();
      const data = apiResponse?.data;

      const tempValue = data?.current_weather?.temperature;
      const weatherCode = data?.current_weather?.weathercode;
      const isDayValue = data?.current_weather?.is_day;

      if (
        typeof tempValue !== 'number' ||
        typeof weatherCode !== 'number' ||
        (isDayValue !== 0 && isDayValue !== 1)
      ) {
        throw new Error('Invalid weather data');
      }

      const condition = mapWeatherCode(weatherCode);
      const vibe = determineVibe(weatherCode, isDayValue === 1);

      const newData: WeatherData = {
        temp: Math.round(tempValue),
        condition,
        location: region.name,
        vibe,
        isDay: isDayValue === 1,
        timestamp: Date.now(),
      };

      setWeatherData(newData);

      // Cache the result
      try {
        const cacheKey = `${CACHE_KEY_PREFIX}${region.id}`;
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: newData }));
      } catch {
        // Ignore cache write errors
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Weather unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch weather when region changes
  useEffect(() => {
    fetchWeather(selectedRegion);
  }, [selectedRegion, fetchWeather]);

  const handleRegionChange = useCallback((region: SydneyRegion) => {
    setSelectedRegion(region);
    try {
      localStorage.setItem(STORAGE_KEY, region.id);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  return {
    weatherData,
    loading,
    error,
    selectedRegion,
    handleRegionChange,
    retry: () => fetchWeather(selectedRegion, true),
  };
};
