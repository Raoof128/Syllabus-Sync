'use client';

import {
  Car,
  Bike,
  Bus,
  Footprints,
  Navigation,
  X,
  ExternalLink,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { getLocaleString } from '@/lib/utils/locale';
import type { GoogleComputedRoute, GoogleTravelMode, MapLatLng } from '@/lib/maps/google/types';

interface Props {
  destinationName: string;
  route: GoogleComputedRoute | null;
  travelMode: GoogleTravelMode;
  isNavigating: boolean;
  isLoadingRoute: boolean;
  routeError: string | null;
  userLocation: MapLatLng | null;
  destination: MapLatLng | null;
  hasArrived: boolean;
  originLabel?: string;
  onTravelModeChange: (m: GoogleTravelMode) => void;
  onStartNavigation: () => void;
  onStopNavigation: () => void;
  onDismissArrival: () => void;
  onDismissRoute: () => void;
}

const MODES: {
  mode: GoogleTravelMode;
  labelKey: 'walk' | 'drive' | 'bike' | 'transit';
  Icon: React.ElementType;
}[] = [
  { mode: 'WALK', labelKey: 'walk', Icon: Footprints },
  { mode: 'DRIVE', labelKey: 'drive', Icon: Car },
  { mode: 'BICYCLE', labelKey: 'bike', Icon: Bike },
  { mode: 'TRANSIT', labelKey: 'transit', Icon: Bus },
];

const GMAPS_MODE: Record<GoogleTravelMode, string> = {
  WALK: 'walking',
  DRIVE: 'driving',
  BICYCLE: 'bicycling',
  TRANSIT: 'transit',
};

export default function GoogleRoutePanel({
  destinationName,
  route,
  travelMode,
  isNavigating,
  isLoadingRoute,
  routeError,
  userLocation,
  destination,
  hasArrived,
  originLabel: _originLabel,
  onTravelModeChange,
  onStartNavigation,
  onStopNavigation,
  onDismissArrival,
  onDismissRoute,
}: Props) {
  const { t, language } = useTypedTranslation();
  const [stepsExpanded, setStepsExpanded] = useState(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const locale = getLocaleString(language);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string =>
    new Intl.NumberFormat(locale, options).format(value);

  const fmtDuration = (totalSeconds: number): string => {
    const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));
    if (totalMinutes < 60) {
      return `${formatNumber(totalMinutes)} ${t('routeMinutesShort')}`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const parts = [`${formatNumber(hours)}${t('routeHoursShort')}`];

    if (minutes > 0) {
      parts.push(`${formatNumber(minutes)} ${t('routeMinutesShort')}`);
    }

    return parts.join(' ');
  };

  const fmtDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${formatNumber(meters / 1000, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} ${t('routeKilometersShort')}`;
    }

    return `${formatNumber(Math.round(meters))} ${t('routeMetersShort')}`;
  };

  const fmtEta = (totalSeconds: number): string =>
    new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(nowMs + totalSeconds * 1000));

  const handoffUrl =
    userLocation && destination
      ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destination.lat},${destination.lng}&travelmode=${GMAPS_MODE[travelMode]}`
      : null;

  // Arrival celebration
  if (hasArrived) {
    return (
      <div className="absolute bottom-4 left-1/2 z-[1000] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-green-200 bg-green-50/95 p-4 shadow-xl backdrop-blur dark:border-green-800 dark:bg-green-950/95">
        <div className="flex flex-col items-center gap-2 text-center">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          <p className="text-sm font-semibold text-green-800 dark:text-green-200">{t('arrived')}</p>
          <p className="text-xs text-green-600 dark:text-green-400">{destinationName}</p>
          <button
            onClick={onDismissArrival}
            className="mt-1 rounded-xl bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
          >
            {t('done')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-3 left-1/2 z-[1000] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl border border-mq-border bg-mq-card-background/95 shadow-xl backdrop-blur">
      {/* Compact header: destination name + close */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#ea4335]" />
          <p className="truncate text-sm font-semibold text-mq-content">{destinationName}</p>
        </div>
        <button
          onClick={isNavigating ? onStopNavigation : onDismissRoute}
          className="shrink-0 rounded-full p-1 text-mq-content-secondary transition-colors hover:bg-mq-hover-background hover:text-mq-content"
          aria-label={isNavigating ? t('stopNavigation') : t('closeDirections')}
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-3 pb-3">
        {/* Travel mode tabs — compact pill style */}
        {!isNavigating && (
          <div className="mb-2 flex gap-1">
            {MODES.map(({ mode, labelKey, Icon }) => {
              const label = t(labelKey);
              return (
                <button
                  key={mode}
                  onClick={() => onTravelModeChange(mode)}
                  aria-label={t('travelModeLabel', { mode: label })}
                  aria-pressed={travelMode === mode}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-full py-1.5 text-[11px] transition-colors ${
                    travelMode === mode
                      ? 'bg-[#d2e3fc] text-[#1a73e8] dark:bg-[#1a3a5c] dark:text-[#8ab4f8] font-semibold'
                      : 'bg-mq-background-secondary text-mq-content-secondary hover:bg-mq-hover-background'
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Waiting for location */}
        {!userLocation && !route && !isLoadingRoute && !routeError && (
          <div className="mb-2 flex items-center justify-center gap-2 text-xs text-mq-content-secondary">
            <Loader2 size={14} className="animate-spin" />
            {t('waitingForLocation')}
          </div>
        )}

        {/* Loading */}
        {isLoadingRoute && (
          <div className="mb-2 flex items-center justify-center gap-2 text-xs text-mq-content-secondary">
            <Loader2 size={14} className="animate-spin" />
            {t('loadingRoute')}
          </div>
        )}

        {/* Error */}
        {routeError && (
          <p className="mb-2 text-center text-xs text-red-600 dark:text-red-400">{routeError}</p>
        )}

        {/* Route summary + actions — compact single row */}
        {route && !isLoadingRoute && (
          <>
            {/* Next step highlight during navigation */}
            {isNavigating && route.steps.length > 0 && (
              <div className="mb-2 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-2 dark:border-blue-800 dark:bg-blue-950/80">
                <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                  {route.steps[0].instruction}
                </p>
                {route.steps[0].distanceMeters > 0 && (
                  <p className="mt-0.5 text-[10px] text-blue-600 dark:text-blue-400">
                    {fmtDistance(route.steps[0].distanceMeters)}
                  </p>
                )}
              </div>
            )}

            {/* Duration / distance row with actions */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-mq-content leading-tight">
                  {fmtDuration(route.durationSeconds)}
                </span>
                <span className="text-[10px] text-mq-content-tertiary">
                  {fmtDistance(route.distanceMeters)} · {t('eta')} {fmtEta(route.durationSeconds)}
                </span>
              </div>

              <div className="ml-auto flex items-center gap-1.5 shrink-0">
                {!isNavigating ? (
                  <button
                    onClick={onStartNavigation}
                    disabled={!route || isLoadingRoute}
                    className="flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-4 py-2 text-xs font-bold text-white shadow-md transition-colors hover:bg-[#1557b0] disabled:opacity-40"
                  >
                    <Navigation size={14} /> {t('start')}
                  </button>
                ) : (
                  <button
                    onClick={onStopNavigation}
                    className="flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white dark:bg-red-500"
                  >
                    <X size={14} /> {t('stop')}
                  </button>
                )}
                {handoffUrl && (
                  <a
                    href={handoffUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center rounded-full border border-mq-border p-2 text-mq-content-secondary transition-colors hover:bg-mq-hover-background"
                    aria-label={t('openInGoogleMaps')}
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>

            {/* Expandable step-by-step directions */}
            {route.steps.length > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => setStepsExpanded(!stepsExpanded)}
                  className="flex w-full items-center justify-between px-0.5 py-1 text-[11px] font-medium text-mq-content-secondary"
                >
                  <span>
                    {route.steps.length === 1
                      ? t('steps_one', { count: formatNumber(route.steps.length) })
                      : t('steps_other', { count: formatNumber(route.steps.length) })}
                  </span>
                  {stepsExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {stepsExpanded && (
                  <ol className="max-h-[160px] space-y-0.5 overflow-y-auto sm:max-h-[220px]">
                    {route.steps.map((step, i) => (
                      <li
                        key={i}
                        className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs ${
                          isNavigating && i === 0
                            ? 'border border-blue-200 bg-blue-50/60 dark:border-blue-800 dark:bg-blue-950/60'
                            : ''
                        }`}
                      >
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mq-background-secondary text-[9px] font-bold text-mq-content">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="leading-snug text-mq-content">{step.instruction}</p>
                          {(step.distanceMeters > 0 || step.transitLineName) && (
                            <p className="mt-0.5 text-[10px] text-mq-content-tertiary">
                              {step.distanceMeters > 0 && fmtDistance(step.distanceMeters)}
                              {step.transitLineName &&
                                `${step.distanceMeters > 0 ? ' \u00b7 ' : ''}${step.transitLineName}`}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
