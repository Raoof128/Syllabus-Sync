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

  const styles = {
    sunny: {
      gradient: 'from-amber-400 via-orange-400 to-yellow-500',
      icon: <Sun className="w-3.5 h-3.5 drop-shadow-sm" />,
      label: 'Sunny',
    },
    cloudy: {
      gradient: 'from-slate-400 via-gray-400 to-zinc-500',
      icon: <Cloud className="w-3.5 h-3.5 drop-shadow-sm" />,
      label: 'Cloudy',
    },
    rainy: {
      gradient: 'from-blue-600 via-indigo-600 to-cyan-600',
      icon: <CloudRain className="w-3.5 h-3.5 drop-shadow-sm" />,
      label: 'Rainy',
    },
    thunder: {
      gradient: 'from-purple-900 via-slate-900 to-indigo-950',
      icon: <CloudLightning className="w-3.5 h-3.5 drop-shadow-[0_0_4px_rgba(253,224,71,0.6)]" />,
      label: 'Stormy',
    },
    snowy: {
      gradient: 'from-blue-100 via-slate-100 to-indigo-200',
      icon: <Snowflake className="w-3.5 h-3.5" />,
      label: 'Snowy',
    },
    windy: {
      gradient: 'from-teal-400 via-emerald-400 to-cyan-500',
      icon: <Wind className="w-3.5 h-3.5" />,
      label: 'Windy',
    },
    night: {
      gradient: 'from-[#0a0f2d] via-purple-950 to-black',
      icon: <Moon className="w-3.5 h-3.5 drop-shadow-[0_0_6px_rgba(199,210,254,0.4)]" />,
      label: 'Night',
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
      <div className="h-6 px-2 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 flex items-center justify-center gap-1 shadow-sm">
        <AlertCircle className="text-red-400 w-3 h-3" aria-hidden="true" />
        <span className="text-red-500 dark:text-red-400 text-[9px] font-medium">
          {error || 'Weather unavailable'}
        </span>
      </div>
    );
  }

  const currentStyle = styles[weatherData.vibe as StyleKey] ?? styles.sunny;
  const textStyle = { color: 'var(--mq-content)' } as const;
  const label = currentStyle.label ?? weatherData.condition;
  const icon = currentStyle.icon;

  return (
    <div
      data-slot="weather-widget"
      className={`
        relative overflow-hidden
        flex items-center gap-1.5
        h-6 rounded-full shadow-sm mq-liquid-glass
        bg-gradient-to-r ${currentStyle.gradient}
        px-2 transition-all duration-300 hover:scale-[1.02]
      `}
      title={`${weatherData.condition} · ${weatherData.temp}°C · ${weatherData.location}`}
      aria-label={`Current weather in ${weatherData.location}: ${weatherData.condition}, ${weatherData.temp} degrees Celsius`}
    >
      {/* Icon */}
      <div className="relative flex-shrink-0" style={textStyle}>
        {icon}
      </div>

      {/* Temperature and condition */}
      <div className="flex items-center gap-1" style={textStyle}>
        <span className="text-xs font-bold tabular-nums leading-none">{weatherData.temp}°</span>
        <span className="text-[9px] font-medium opacity-80 hidden xl:inline">{label}</span>
      </div>

      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
    </div>
  );
});

WeatherWidget.displayName = 'WeatherWidget';

export default WeatherWidget;
