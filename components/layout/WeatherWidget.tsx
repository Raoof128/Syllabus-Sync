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
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { useWeather } from '@/lib/hooks/useWeather';

const WeatherWidget = memo(() => {
  const { weatherData, loading, error } = useWeather();

  const styles = {
    sunny: {
      gradient: 'from-amber-400 via-orange-400 to-yellow-500',
      icon: <Sun className="w-10 h-10 text-white drop-shadow-lg" />,
      label: 'Golden Hour',
      textColor: 'text-white',
    },
    cloudy: {
      gradient: 'from-slate-400 via-gray-400 to-zinc-500',
      icon: <Cloud className="w-10 h-10 text-white drop-shadow-md" />,
      label: 'Overcast',
      textColor: 'text-white',
    },
    rainy: {
      gradient: 'from-blue-600 via-indigo-600 to-cyan-600',
      icon: <CloudRain className="w-10 h-10 text-white drop-shadow-md" />,
      label: 'Rainy Vibe',
      textColor: 'text-white',
    },
    thunder: {
      gradient: 'from-purple-900 via-slate-900 to-indigo-950',
      icon: (
        <CloudLightning className="w-10 h-10 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" />
      ),
      label: 'Storm Mode',
      textColor: 'text-white',
    },
    snowy: {
      gradient: 'from-blue-100 via-slate-100 to-indigo-200',
      icon: <Snowflake className="w-10 h-10 text-blue-500" />,
      label: 'Chill Zone',
      textColor: 'text-slate-900',
    },
    windy: {
      gradient: 'from-teal-400 via-emerald-400 to-cyan-500',
      icon: <Wind className="w-10 h-10 text-white" />,
      label: 'Breezy',
      textColor: 'text-white',
    },
    night: {
      gradient: 'from-[#0a0f2d] via-purple-950 to-black',
      icon: (
        <Moon className="w-10 h-10 text-indigo-200 drop-shadow-[0_0_10px_rgba(199,210,254,0.5)]" />
      ),
      label: 'Lunar',
      textColor: 'text-indigo-100',
    },
  };
  type StyleKey = keyof typeof styles;

  if (loading) {
    return (
      <div className="w-64 h-12 rounded-full bg-mq-background-secondary animate-pulse flex items-center justify-center shadow-inner">
        <span className="text-mq-content-tertiary font-semibold tracking-[0.2em] text-[10px]">
          LOADING VIBES...
        </span>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="w-64 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center gap-2 shadow-sm px-4">
        <AlertCircle className="text-red-400 w-4 h-4" aria-hidden="true" />
        <span className="text-red-400 text-[10px] font-bold text-center leading-tight line-clamp-2">
          {error || 'Weather unavailable.'}
        </span>
      </div>
    );
  }

  const currentStyle = styles[weatherData.vibe as StyleKey] ?? styles.sunny;
  const textColor = currentStyle.textColor ?? 'text-white';
  const label = currentStyle.label ?? weatherData.condition;
  const icon = currentStyle.icon;

  return (
    <div
      className={`
        relative overflow-hidden
        flex items-center justify-between
        w-64 h-14 rounded-full shadow-xl mq-liquid-glass
        bg-gradient-to-r ${currentStyle.gradient}
        px-5 transition-all duration-500 hover:scale-[1.02]
        group
      `}
      title={`${weatherData.condition} · ${weatherData.temp}°C · ${weatherData.location} · ${weatherData.date}`}
      aria-label={`Current weather in ${weatherData.location}: ${weatherData.condition}, ${weatherData.temp} degrees Celsius`}
    >
      <div className="relative z-10 flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 blur-xl bg-white/20 opacity-60" aria-hidden="true" />
          <div className="relative">{icon}</div>
        </div>
        <div className={`text-left z-10 ${textColor}`}>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
            <span>{label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black tracking-tight leading-none tabular-nums drop-shadow-sm">
              {weatherData.temp}°
            </span>
            <div className="flex items-center gap-2 text-[10px] opacity-80">
              {weatherData.hourlyTemps.length > 0 ? (
                <svg viewBox="0 0 60 22" className="h-6 w-14">
                  {(() => {
                    const temps = weatherData.hourlyTemps.slice(0, 6);
                    const min = Math.min(...temps);
                    const max = Math.max(...temps);
                    const range = max - min || 1;
                    const points = temps
                      .map((t, idx) => {
                        const x = (idx / Math.max(temps.length - 1, 1)) * 60;
                        const y = 20 - ((t - min) / range) * 16;
                        return `${x},${y}`;
                      })
                      .join(' ');
                    return (
                      <>
                        <polyline
                          points={points}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="opacity-70"
                        />
                        {temps.map((t, idx) => {
                          const x = (idx / Math.max(temps.length - 1, 1)) * 60;
                          const y = 20 - ((t - min) / range) * 16;
                          return <circle key={idx} cx={x} cy={y} r="2" className="opacity-80" />;
                        })}
                      </>
                    );
                  })()}
                </svg>
              ) : (
                <span className="uppercase tracking-[0.12em]">Calm air</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/15 via-white/5 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] bg-[length:12px_12px] opacity-30 pointer-events-none" />
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 translate-y-6 group-hover:translate-y-0 transition-transform duration-300">
        <div className="flex items-center gap-1 bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-full shadow-inner">
          <MapPin className="w-3 h-3 text-white" aria-hidden="true" />
          <span className="text-[9px] text-white font-bold">{weatherData.location}</span>
        </div>
      </div>
    </div>
  );
});

WeatherWidget.displayName = 'WeatherWidget';

export default WeatherWidget;
