'use client';

import {
  Car,
  Bike,
  Bus,
  Footprints,
  Loader2,
  Navigation,
  RouteIcon,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/mq/badge';
import { Button } from '@/components/ui/mq/button';
import type { GoogleComputedRoute, GoogleTravelMode } from '@/lib/maps/google/types';
import { useSafeTranslation } from '@/lib/hooks/useSafeTranslation';

interface GoogleRoutePanelProps {
  selectedBuildingLabel?: string;
  route: GoogleComputedRoute | null;
  travelMode: GoogleTravelMode;
  isLoading: boolean;
  error: string | null;
  hasArrived: boolean;
  isNavigating: boolean;
  onStartNavigation: () => void;
  onTravelModeChange: (mode: GoogleTravelMode) => void;
  onStopNavigation: () => void;
}

const TRAVEL_MODE_ICONS: Record<GoogleTravelMode, typeof Footprints> = {
  WALK: Footprints,
  DRIVE: Car,
  BICYCLE: Bike,
  TRANSIT: Bus,
};

export function GoogleRoutePanel({
  selectedBuildingLabel,
  route,
  travelMode,
  isLoading,
  error,
  hasArrived,
  isNavigating,
  onStartNavigation,
  onTravelModeChange,
  onStopNavigation,
}: GoogleRoutePanelProps) {
  const { safeT } = useSafeTranslation();

  const travelModes: Array<{ mode: GoogleTravelMode; labelKey: string; fallback: string }> = [
    { mode: 'WALK', labelKey: 'walk', fallback: 'Walk' },
    { mode: 'DRIVE', labelKey: 'drive', fallback: 'Drive' },
    { mode: 'BICYCLE', labelKey: 'bike', fallback: 'Bike' },
    { mode: 'TRANSIT', labelKey: 'transit', fallback: 'Transit' },
  ];

  return (
    <div className="absolute bottom-20 left-3 right-3 z-[1100] pointer-events-none sm:right-auto sm:w-[360px]">
      <div className="pointer-events-auto rounded-mq-xl border border-mq-border bg-mq-card-background/95 p-4 shadow-xl backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              {hasArrived ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <RouteIcon className="h-4 w-4 text-mq-primary" />
              )}
              <p className="text-sm font-semibold text-mq-content">
                {hasArrived
                  ? safeT('navigationArrived', 'You have arrived!')
                  : safeT('routePlanner', 'Route Planner')}
              </p>
            </div>
            <p className="mt-1 text-xs text-mq-content-secondary">
              {hasArrived
                ? selectedBuildingLabel
                : selectedBuildingLabel
                  ? `${safeT('navigateTo', 'Navigate to')} ${selectedBuildingLabel}`
                  : safeT('selectBuildingToNavigate', 'Select a building to navigate.')}
            </p>
          </div>
          {isNavigating && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={onStopNavigation}
              aria-label={safeT('stopNavigation', 'Stop navigation')}
            >
              <Navigation className="h-4 w-4" />
              {safeT('stopNavigation', 'Stop')}
            </Button>
          )}
        </div>

        {/* Travel mode selector */}
        <div className="mt-4 flex flex-wrap gap-2">
          {travelModes.map(({ mode, labelKey, fallback }) => {
            const active = mode === travelMode;
            const Icon = TRAVEL_MODE_ICONS[mode];
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onTravelModeChange(mode)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-mq-primary bg-mq-primary text-white'
                    : 'border-mq-border bg-mq-background-secondary text-mq-content hover:bg-mq-hover-background'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {safeT(labelKey, fallback)}
              </button>
            );
          })}
        </div>

        {/* Start navigation button */}
        {!isNavigating && !hasArrived && (
          <Button
            variant="primary"
            size="sm"
            className="mt-4 w-full gap-2"
            onClick={onStartNavigation}
          >
            <Navigation className="h-4 w-4" />
            {safeT('startTurnByTurn', 'Start navigation')}
          </Button>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="mt-4 flex items-center gap-2 rounded-mq-lg bg-mq-background-secondary px-3 py-3 text-sm text-mq-content-secondary">
            <Loader2 className="h-4 w-4 animate-spin text-mq-primary" />
            {safeT('loadingRoute', 'Loading route...')}
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="mt-4 rounded-mq-lg border border-mq-danger/20 bg-mq-danger/5 px-3 py-3 text-sm text-mq-content">
            {error}
          </div>
        )}

        {/* Arrived state */}
        {hasArrived && (
          <div className="mt-4 rounded-mq-lg border border-green-500/20 bg-green-500/5 px-3 py-3 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500" />
            <p className="text-sm font-semibold text-mq-content">
              {safeT('navigationArrived', 'You have arrived at your destination.')}
            </p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={onStopNavigation}>
              {safeT('close', 'Close')}
            </Button>
          </div>
        )}

        {/* Route info + steps */}
        {route && !isLoading && !error && !hasArrived && (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="neutral">{formatDistance(route.distanceMeters)}</Badge>
              <Badge variant="neutral">{formatDuration(route.durationSeconds)}</Badge>
              {isNavigating && (
                <Badge variant="neutral" className="bg-mq-primary/10 text-mq-primary">
                  ETA {formatEta(route.durationSeconds)}
                </Badge>
              )}
            </div>

            <ol className="mt-4 max-h-48 space-y-2 overflow-y-auto pr-1">
              {route.steps.slice(0, 8).map((step, index) => (
                <li
                  key={`${step.instruction}-${index}`}
                  className="rounded-mq-lg bg-mq-background-secondary px-3 py-2"
                >
                  <p className="text-sm font-medium text-mq-content">{step.instruction}</p>
                  <p className="mt-1 text-xs text-mq-content-secondary">
                    {formatDistance(step.distanceMeters)} · {formatDuration(step.durationSeconds)}
                  </p>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}

function formatDistance(distanceMeters: number): string {
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(1)} km`;
  }

  return `${Math.round(distanceMeters)} m`;
}

function formatDuration(durationSeconds: number): string {
  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  return `${minutes} min`;
}

function formatEta(durationSeconds: number): string {
  const arrival = new Date(Date.now() + durationSeconds * 1000);
  return arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
