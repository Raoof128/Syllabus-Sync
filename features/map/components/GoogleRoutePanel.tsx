'use client';

import { useState } from 'react';
import {
  Car,
  Bike,
  Bus,
  Footprints,
  Navigation,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
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
  onTravelModeChange: (m: GoogleTravelMode) => void;
  onStartNavigation: () => void;
  onStopNavigation: () => void;
  onDismissArrival: () => void;
}

const MODES: { mode: GoogleTravelMode; label: string; Icon: React.ElementType }[] = [
  { mode: 'WALK', label: 'Walk', Icon: Footprints },
  { mode: 'DRIVE', label: 'Drive', Icon: Car },
  { mode: 'BICYCLE', label: 'Cycle', Icon: Bike },
  { mode: 'TRANSIT', label: 'Transit', Icon: Bus },
];

const GMAPS_MODE: Record<GoogleTravelMode, string> = {
  WALK: 'walking',
  DRIVE: 'driving',
  BICYCLE: 'bicycling',
  TRANSIT: 'transit',
};

function fmtDuration(totalSeconds: number): string {
  const m = Math.max(1, Math.round(totalSeconds / 60));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function fmtDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function fmtEta(totalSeconds: number): string {
  const eta = new Date(Date.now() + totalSeconds * 1000);
  return eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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
  onTravelModeChange,
  onStartNavigation,
  onStopNavigation,
  onDismissArrival,
}: Props) {
  const [showSteps, setShowSteps] = useState(false);

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
          <p className="text-sm font-semibold text-green-800 dark:text-green-200">
            You&apos;ve arrived!
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">{destinationName}</p>
          <button
            onClick={onDismissArrival}
            className="mt-1 rounded-xl bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 left-1/2 z-[1000] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur">
      {/* Destination */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex items-start gap-2">
          <MapPin size={14} className="mt-0.5 shrink-0 text-destructive" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Destination</p>
            <p className="truncate text-sm font-semibold">{destinationName}</p>
          </div>
        </div>
        {isNavigating && (
          <button
            onClick={onStopNavigation}
            className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-destructive"
            aria-label="Stop navigation"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Travel mode tabs */}
      {!isNavigating && (
        <div className="mb-3 flex gap-1">
          {MODES.map(({ mode, label, Icon }) => (
            <button
              key={mode}
              onClick={() => onTravelModeChange(mode)}
              aria-label={`Travel mode: ${label}`}
              aria-pressed={travelMode === mode}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-xs transition ${
                travelMode === mode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoadingRoute && (
        <div className="mb-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 size={14} className="animate-spin" />
          Calculating route...
        </div>
      )}

      {/* Error */}
      {routeError && <p className="mb-2 text-center text-xs text-destructive">{routeError}</p>}

      {/* Route info */}
      {route && !isLoadingRoute && (
        <>
          <div className="mb-3 flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
            <div className="flex flex-col">
              <span className="text-sm font-bold">{fmtDuration(route.durationSeconds)}</span>
              <span className="text-[10px] text-muted-foreground">
                ETA {fmtEta(route.durationSeconds)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {fmtDistance(route.distanceMeters)}
            </span>
          </div>

          {/* Next step during navigation */}
          {isNavigating && route.steps.length > 0 && (
            <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-2 dark:border-blue-800 dark:bg-blue-950/80">
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

          {/* Expandable step list */}
          {route.steps.length > 0 && !isNavigating && (
            <div className="mb-3">
              <button
                onClick={() => setShowSteps(!showSteps)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted/50"
              >
                <span>
                  {route.steps.length} step{route.steps.length !== 1 ? 's' : ''}
                </span>
                {showSteps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showSteps && (
                <ol className="mt-1 max-h-40 space-y-1 overflow-y-auto pl-1">
                  {route.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-muted-foreground">{step.instruction}</p>
                        {step.distanceMeters > 0 && (
                          <p className="text-[10px] text-muted-foreground/70">
                            {fmtDistance(step.distanceMeters)}
                            {step.transitLineName && ` \u00b7 ${step.transitLineName}`}
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

      {/* Actions */}
      <div className="flex gap-2">
        {!isNavigating ? (
          <button
            onClick={onStartNavigation}
            disabled={!route || isLoadingRoute}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            <Navigation size={15} /> Start
          </button>
        ) : (
          <button
            onClick={onStopNavigation}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground"
          >
            <X size={15} /> Stop
          </button>
        )}
        {handoffUrl && (
          <a
            href={handoffUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-xl border border-border px-3 py-2.5 text-xs text-muted-foreground hover:bg-muted"
            aria-label="Open in Google Maps"
          >
            <ExternalLink size={14} /> Maps
          </a>
        )}
      </div>
    </div>
  );
}
