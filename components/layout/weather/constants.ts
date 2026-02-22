import { SydneyRegion, Vibe } from "./types";

export const SYDNEY_REGIONS: SydneyRegion[] = [
  { id: "macquarie", name: "Macquarie Uni", lat: -33.7738, lon: 151.1126 },
  { id: "sydney-cbd", name: "Sydney CBD", lat: -33.8688, lon: 151.2093 },
  { id: "north-sydney", name: "North Sydney", lat: -33.839, lon: 151.207 },
  { id: "parramatta", name: "Parramatta", lat: -33.8151, lon: 151.0011 },
  { id: "chatswood", name: "Chatswood", lat: -33.7969, lon: 151.1803 },
  { id: "bondi", name: "Bondi", lat: -33.8915, lon: 151.2767 },
  { id: "manly", name: "Manly", lat: -33.797, lon: 151.287 },
] as const;

export const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "Clear sky",
  1: "Partly cloudy",
  2: "Cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail",
};

export const mapWeatherCode = (code: number, isDay: boolean = true): string => {
  // For clear conditions at night, return "Clear" instead of "Clear sky"
  if (!isDay && code === 0) {
    return "Clear";
  }
  return WEATHER_CODE_LABELS[code] || "Windy";
};

export const determineVibe = (weatherCode: number, isDay: boolean): Vibe => {
  // At night, show 'night' vibe for clear/cloudy conditions, but show actual weather for rain/snow/thunder
  if (!isDay) {
    // Show 'night' for clear/cloudy conditions
    if (weatherCode === 0 || [1, 2, 3].includes(weatherCode)) return "night";
    // For severe weather, show the actual weather condition even at night
    if (
      [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)
    )
      return "rainy";
    if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return "snowy";
    if ([95, 96, 99].includes(weatherCode)) return "thunder";
    return "night"; // Default to night for windy or other conditions at night
  }
  if (weatherCode === 0) return "sunny";
  if ([1, 2, 3].includes(weatherCode)) return "cloudy";
  if (
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)
  )
    return "rainy";
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return "snowy";
  if ([95, 96, 99].includes(weatherCode)) return "thunder";
  return "windy";
};
