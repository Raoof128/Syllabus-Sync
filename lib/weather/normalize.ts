import { WeatherResult, WeatherCurrent, WeatherHourly } from './types';

// Map WMO Weather codes to human readable conditions
export function getWeatherCondition(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';

  if (code === 45 || code === 48) return 'Fog';

  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 56 && code <= 57) return 'Freezing Drizzle';

  if (code === 61) return 'Slight rain';
  if (code === 63) return 'Moderate rain';
  if (code === 65) return 'Heavy rain';
  if (code >= 66 && code <= 67) return 'Freezing Rain';

  if (code >= 71 && code <= 75) return 'Snow fall';
  if (code === 77) return 'Snow grains';

  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 85 && code <= 86) return 'Snow showers';

  if (code === 95) return 'Thunderstorm';
  if (code >= 96 && code <= 99) return 'Thunderstorm with hail';

  return 'Unknown';
}

interface RawOpenMeteo {
  current?: {
    temperature_2m: number;
    apparent_temperature: number;
    precipitation_probability: number;
    wind_speed_10m: number;
    weather_code: number;
    is_day: number;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
    wind_speed_10m: number[];
  };
  timezone?: string;
}

export function normalizeOpenMeteoResponse(data: unknown): WeatherResult {
  const d = data as RawOpenMeteo;
  const current = d.current;
  const hourly = d.hourly;

  const currentData: WeatherCurrent = {
    temperature: current?.temperature_2m ?? 0,
    apparentTemperature: current?.apparent_temperature ?? current?.temperature_2m ?? 0,
    precipitationProbability:
      current?.precipitation_probability ?? hourly?.precipitation_probability?.[0] ?? 0,
    windSpeed: current?.wind_speed_10m ?? 0,
    weatherCode: current?.weather_code ?? 0,
    isDay: current?.is_day === 1,
    condition: getWeatherCondition(current?.weather_code ?? 0),
  };

  let hourlyData: WeatherHourly | undefined = undefined;

  if (hourly) {
    hourlyData = {
      time: hourly.time?.slice(0, 12) ?? [],
      temperature: hourly.temperature_2m?.slice(0, 12) ?? [],
      precipitationProbability: hourly.precipitation_probability?.slice(0, 12) ?? [],
      weatherCode: hourly.weather_code?.slice(0, 12) ?? [],
      windSpeed: hourly.wind_speed_10m?.slice(0, 12) ?? [],
    };
  }

  return {
    current: currentData,
    hourly: hourlyData,
    timezone: d.timezone ?? 'Australia/Sydney',
    source: 'open-meteo',
    timestamp: Date.now(),
    modelUsed: 'best_match', // We requested best_match
  };
}
