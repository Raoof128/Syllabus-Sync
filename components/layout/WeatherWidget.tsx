'use client';

import { memo, useState, useEffect } from 'react';
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
import { useWeather } from './weather/useWeather';
import { SYDNEY_REGIONS } from './weather/constants';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';

const WeatherWidget = memo(() => {
  const { t } = useTypedTranslation();
  const { weatherData, loading, error, selectedRegion, handleRegionChange, retry } = useWeather();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
        onClick={retry}
        className="h-7 px-3 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 flex items-center justify-center gap-1 shadow-sm text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
      >
        <AlertCircle className="w-3 h-3" aria-hidden="true" />
        <span className="text-[9px] font-medium">{t('retry')}</span>
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
                onClick={() => {
                  handleRegionChange(region);
                  setIsDropdownOpen(false);
                }}
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

WeatherWidget.displayName = 'WeatherWidget';

export default WeatherWidget;
