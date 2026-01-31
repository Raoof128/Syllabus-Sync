// components/layout/WeatherWidget.tsx
'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import {
  Sun,
  Moon,
  Wind,
  CloudRain,
  Cloud,
  CloudLightning,
  Snowflake,
  AlertCircle,
  MapPin,
  ChevronDown,
  Check,
} from 'lucide-react';

// Sydney region coordinates
const SYDNEY_REGIONS = [
  { id: 'macquarie', name: 'Macquarie Uni', lat: -33.7738, lon: 151.1126 },
  { id: 'sydney-cbd', name: 'Sydney CBD', lat: -33.8688, lon: 151.2093 },
  { id: 'north-sydney', name: 'North Sydney', lat: -33.839, lon: 151.207 },
  { id: 'parramatta', name: 'Parramatta', lat: -33.8151, lon: 151.0011 },
  { id: 'chatswood', name: 'Chatswood', lat: -33.7969, lon: 151.1803 },
  { id: 'bondi', name: 'Bondi', lat: -33.8915, lon: 151.2767 },
  { id: 'manly', name: 'Manly', lat: -33.797, lon: 151.287 },
] as const;

type SydneyRegion = (typeof SYDNEY_REGIONS)[number];
type Vibe = 'sunny' | 'cloudy' | 'rainy' | 'thunder' | 'snowy' | 'windy' | 'night';

interface WeatherData {
  temp: number;
  condition: string;
  location: string;
  vibe: Vibe;
  isDay: boolean;
}

const STORAGE_KEY = 'mq-weather-region';
const CACHE_KEY_PREFIX = 'mq-weather-cache-';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes - shorter for more accurate data

const WeatherWidget = memo(() => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<SydneyRegion>(SYDNEY_REGIONS[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  // Fetch weather data
  const fetchWeather = useCallback(async (region: SydneyRegion, forceRefresh = false) => {
    setLoading(true);
    setError(null);

    // Check cache first (unless force refresh)
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
      // Add timestamp to prevent any browser caching
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

  // Handle region selection
  const handleRegionChange = (region: SydneyRegion) => {
    setSelectedRegion(region);
    setIsDropdownOpen(false);
    // Force refresh when region changes
    fetchWeather(region, true);
    try {
      localStorage.setItem(STORAGE_KEY, region.id);
    } catch {
      // Ignore localStorage errors
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-weather-widget]')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen]);

  // Weather styles with improved icon sizes (w-4 h-4) for better visibility
  // and consistent text coloring for both light and dark modes
  const styles = {
    sunny: {
      gradient: 'from-amber-400 via-orange-400 to-yellow-500',
      icon: <Sun className="w-4 h-4 drop-shadow-sm" />,
      label: 'Sunny',
      textClass: 'text-amber-950',
    },
    cloudy: {
      gradient: 'from-slate-400 via-gray-400 to-zinc-500',
      icon: <Cloud className="w-4 h-4 drop-shadow-sm" />,
      label: 'Cloudy',
      textClass: 'text-slate-900',
    },
    rainy: {
      gradient: 'from-blue-500 via-indigo-500 to-cyan-500',
      icon: <CloudRain className="w-4 h-4 drop-shadow-sm" />,
      label: 'Rainy',
      textClass: 'text-white',
    },
    thunder: {
      gradient: 'from-purple-800 via-slate-800 to-indigo-900',
      icon: <CloudLightning className="w-4 h-4 drop-shadow-[0_0_4px_rgba(253,224,71,0.6)]" />,
      label: 'Stormy',
      textClass: 'text-white',
    },
    snowy: {
      gradient: 'from-blue-100 via-slate-100 to-indigo-200',
      icon: <Snowflake className="w-4 h-4" />,
      label: 'Snowy',
      textClass: 'text-slate-800',
    },
    windy: {
      gradient: 'from-teal-400 via-emerald-400 to-cyan-500',
      icon: <Wind className="w-4 h-4" />,
      label: 'Windy',
      textClass: 'text-teal-950',
    },
    night: {
      gradient: 'from-indigo-900 via-purple-900 to-slate-900',
      icon: <Moon className="w-4 h-4 drop-shadow-[0_0_6px_rgba(199,210,254,0.4)]" />,
      label: 'Night',
      textClass: 'text-white',
    },
  };
  type StyleKey = keyof typeof styles;

  if (loading) {
    return (
      <div className="h-7 px-3 rounded-full bg-mq-background-secondary animate-pulse flex items-center justify-center shadow-inner">
        <span className="text-mq-content-tertiary font-medium text-[9px]">Loading...</span>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <button
        onClick={() => fetchWeather(selectedRegion)}
        className="h-7 px-3 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 flex items-center justify-center gap-1 shadow-sm text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
      >
        <AlertCircle className="w-3 h-3" aria-hidden="true" />
        <span className="text-[9px] font-medium">Retry</span>
      </button>
    );
  }

  const currentStyle = styles[weatherData.vibe as StyleKey] ?? styles.sunny;
  const label = currentStyle.label ?? weatherData.condition;
  const icon = currentStyle.icon;
  const textClass = currentStyle.textClass ?? 'text-mq-content';

  return (
    <div className="relative" data-weather-widget>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`
          relative overflow-hidden
          flex items-center gap-1.5
          h-7 rounded-full shadow-sm
          bg-gradient-to-r ${currentStyle.gradient}
          px-2.5 transition-all duration-300 hover:scale-[1.03] hover:shadow-md
          border border-white/20
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mq-primary
        `}
        title={`${weatherData.condition} · ${weatherData.temp}°C · ${weatherData.location} (click to change location)`}
        aria-label={`Current weather in ${weatherData.location}: ${weatherData.condition}, ${weatherData.temp} degrees Celsius. Click to change location.`}
        aria-expanded={isDropdownOpen}
        aria-haspopup="listbox"
      >
        {/* Icon */}
        <div className={`relative shrink-0 ${textClass}`}>{icon}</div>

        {/* Temperature */}
        <div className={`flex items-center gap-1 ${textClass}`}>
          <span className="text-xs font-bold tabular-nums leading-none">{weatherData.temp}°</span>
          <span className="text-[9px] font-medium opacity-90 hidden xl:inline">{label}</span>
        </div>

        {/* Location indicator with dropdown chevron */}
        <div className={`flex items-center gap-0.5 ${textClass} opacity-75`}>
          <MapPin className="w-3 h-3" aria-hidden="true" />
          <ChevronDown
            className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </div>

        {/* Subtle overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
      </button>

      {/* Location Dropdown */}
      {isDropdownOpen && (
        <div className="absolute top-full right-0 mt-2 w-44 bg-mq-card-background border border-mq-border rounded-lg shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 border-b border-mq-border">
            <span className="text-[10px] font-semibold text-mq-content-tertiary uppercase tracking-wide">
              Select Location
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {SYDNEY_REGIONS.map((region) => (
              <button
                key={region.id}
                onClick={() => handleRegionChange(region)}
                className={`
                  w-full px-3 py-2 text-left text-sm flex items-center justify-between
                  transition-colors hover:bg-mq-background-secondary
                  ${selectedRegion.id === region.id ? 'bg-mq-primary/10 text-mq-primary font-medium' : 'text-mq-content'}
                `}
                role="option"
                aria-selected={selectedRegion.id === region.id}
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-mq-content-tertiary" />
                  {region.name}
                </span>
                {selectedRegion.id === region.id && (
                  <Check className="w-4 h-4 text-mq-primary" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// Weather code mapping
const WEATHER_CODE_LABELS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Partly cloudy',
  2: 'Cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with heavy hail',
};

const mapWeatherCode = (code: number): string => {
  return WEATHER_CODE_LABELS[code] || 'Windy';
};

const determineVibe = (weatherCode: number, isDay: boolean): Vibe => {
  if (!isDay) return 'night';
  if (weatherCode === 0) return 'sunny';
  if ([1, 2, 3].includes(weatherCode)) return 'cloudy';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) return 'rainy';
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return 'snowy';
  if ([95, 96, 99].includes(weatherCode)) return 'thunder';
  return 'windy';
};

WeatherWidget.displayName = 'WeatherWidget';

export default WeatherWidget;
