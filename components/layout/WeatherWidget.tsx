// components/layout/WeatherWidget.tsx
'use client';

import { memo } from 'react';
import {
  Sun,
  Moon,
  Wind,
  CloudRain,
  Cloud,
  CloudLightning,
  Snowflake,
  AlertCircle,
} from 'lucide-react';
import { useWeather } from '@/lib/hooks/useWeather';

const WeatherWidget = memo(() => {
  const { weatherData, loading, error } = useWeather();

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
      <div className="h-6 px-2 rounded-full bg-mq-background-secondary animate-pulse flex items-center justify-center shadow-inner">
        <span className="text-mq-content-tertiary font-medium text-[8px]">Loading...</span>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="h-6 px-2 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 flex items-center justify-center gap-1 shadow-sm text-red-500 dark:text-red-400">
        <AlertCircle className="w-3 h-3" aria-hidden="true" />
        <span className="text-[9px] font-medium">{error || 'Weather unavailable'}</span>
      </div>
    );
  }

  const currentStyle = styles[weatherData.vibe as StyleKey] ?? styles.sunny;
  const label = currentStyle.label ?? weatherData.condition;
  const icon = currentStyle.icon;
  const textClass = currentStyle.textClass ?? 'text-mq-content';

  return (
    <div
      data-slot="weather-widget"
      className={`
        relative overflow-hidden
        flex items-center gap-1.5
        h-7 rounded-full shadow-sm
        bg-gradient-to-r ${currentStyle.gradient}
        px-2.5 transition-all duration-300 hover:scale-[1.02]
        border border-white/20
      `}
      title={`${weatherData.condition} · ${weatherData.temp}°C · ${weatherData.location}`}
      aria-label={`Current weather in ${weatherData.location}: ${weatherData.condition}, ${weatherData.temp} degrees Celsius`}
    >
      {/* Icon */}
      <div className={`relative shrink-0 ${textClass}`}>{icon}</div>

      {/* Temperature and condition */}
      <div className={`flex items-center gap-1 ${textClass}`}>
        <span className="text-xs font-bold tabular-nums leading-none">{weatherData.temp}°</span>
        <span className="text-[9px] font-medium opacity-90 hidden xl:inline">{label}</span>
      </div>

      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
    </div>
  );
});

WeatherWidget.displayName = 'WeatherWidget';

export default WeatherWidget;
