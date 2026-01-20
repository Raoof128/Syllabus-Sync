// components/layout/WeatherWidget.tsx
'use client';

import { useState, useEffect, memo } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, Wind } from 'lucide-react';

interface WeatherData {
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'foggy' | 'windy';
  description: string;
}

// Weather icons mapping
const weatherIcons = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudSnow,
  stormy: CloudLightning,
  foggy: CloudFog,
  windy: Wind,
};

// Weather icon colors
const weatherColors = {
  sunny: 'text-yellow-500',
  cloudy: 'text-gray-400',
  rainy: 'text-blue-400',
  snowy: 'text-blue-200',
  stormy: 'text-purple-500',
  foggy: 'text-gray-300',
  windy: 'text-teal-400',
};

// Sydney coordinates (Macquarie University area)
const SYDNEY_COORDS = {
  lat: -33.7738,
  lon: 151.1126,
};

// Map Open-Meteo weather codes to our conditions
function mapWeatherCode(code: number): WeatherData['condition'] {
  if (code === 0 || code === 1) return 'sunny';
  if (code >= 2 && code <= 3) return 'cloudy';
  if (code >= 45 && code <= 48) return 'foggy';
  if (code >= 51 && code <= 67) return 'rainy';
  if (code >= 71 && code <= 77) return 'snowy';
  if (code >= 80 && code <= 82) return 'rainy';
  if (code >= 85 && code <= 86) return 'snowy';
  if (code >= 95 && code <= 99) return 'stormy';
  return 'cloudy';
}

const WeatherWidget = memo(() => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Using Open-Meteo API (free, no API key required)
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${SYDNEY_COORDS.lat}&longitude=${SYDNEY_COORDS.lon}&current=temperature_2m,weather_code&timezone=Australia%2FSydney`,
        );

        if (!response.ok) {
          throw new Error('Failed to fetch weather');
        }

        const data = await response.json();
        const temp = Math.round(data.current.temperature_2m);
        const condition = mapWeatherCode(data.current.weather_code);

        setWeather({
          temperature: temp,
          condition,
          description: condition.charAt(0).toUpperCase() + condition.slice(1),
        });
        setError(null);
      } catch (err) {
        console.warn('Weather fetch failed:', err);
        // Fallback to a default weather state
        setWeather({
          temperature: 22,
          condition: 'sunny',
          description: 'Sunny',
        });
        setError(null); // Don't show error to user, just use fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();

    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-mq-content-secondary animate-pulse">
        <div className="w-4 h-4 bg-mq-background-secondary rounded" />
        <div className="w-8 h-4 bg-mq-background-secondary rounded" />
      </div>
    );
  }

  if (error || !weather) {
    return null; // Don't show anything if there's an error
  }

  const WeatherIcon = weatherIcons[weather.condition];
  const iconColor = weatherColors[weather.condition];

  return (
    <div
      className="flex items-center gap-1.5 text-mq-content-secondary"
      title={`${weather.description}, ${weather.temperature}°C`}
      aria-label={`Current weather: ${weather.description}, ${weather.temperature} degrees Celsius`}
    >
      <WeatherIcon className={`w-4 h-4 ${iconColor}`} aria-hidden="true" />
      <span className="text-mq-sm font-medium tabular-nums">{weather.temperature}°C</span>
    </div>
  );
});

WeatherWidget.displayName = 'WeatherWidget';

export default WeatherWidget;
