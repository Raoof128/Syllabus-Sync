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
import { useState } from 'react';
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
  originLabel,
  onTravelModeChange,
  onStartNavigation,
  onStopNavigation,
  onDismissArrival,
  onDismissRoute,
}: Props) {
  const [stepsCollapsed, setStepsCollapsed] = useState(false);

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
    <div className="absolute bottom-4 left-1/2 z-[1000] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-border bg-background/95 shadow-xl backdrop-blur">
      {/* Header with close button */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div className="flex items-stretch gap-3 min-w-0">
          {/* Origin/destination vertical connector */}
          <div className="flex flex-col items-center py-0.5">
            <div className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-white bg-[#4285F4] shadow-sm" />
            <div className="my-0.5 w-0.5 flex-1 bg-muted-foreground/25" />
            <div className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-white bg-[#ea4335] shadow-sm" />
          </div>
          <div className="flex flex-col justify-between min-w-0 py-0.5">
            <p className="truncate text-xs text-muted-foreground">
              {originLabel || 'Your location'}
            </p>
            <p className="truncate text-sm font-semibold">{destinationName}</p>
          </div>
        </div>
        <button
          onClick={isNavigating ? onStopNavigation : onDismissRoute}
          className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={isNavigating ? 'Stop navigation' : 'Close directions'}
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-4 py-3">
        {/* Travel mode tabs */}
        {!isNavigating && (
          <div className="mb-3 flex gap-1">
            {MODES.map(({ mode, label, Icon }) => (
              <button
                key={mode}
                onClick={() => onTravelModeChange(mode)}
                aria-label={`Travel mode: ${label}`}
                aria-pressed={travelMode === mode}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-xs transition-colors ${
                  travelMode === mode
                    ? 'bg-[#d2e3fc] text-[#1a73e8] dark:bg-[#1a3a5c] dark:text-[#8ab4f8] font-semibold'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Waiting for location */}
        {!userLocation && !route && !isLoadingRoute && !routeError && (
          <div className="mb-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={14} className="animate-spin" />
            Waiting for your location...
          </div>
        )}

        {/* Loading */}
        {isLoadingRoute && (
          <div className="mb-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={14} className="animate-spin" />
            Calculating route...
          </div>
        )}

        {/* Error */}
        {routeError && <p className="mb-3 text-center text-xs text-destructive">{routeError}</p>}

        {/* Route info */}
        {route && !isLoadingRoute && (
          <>
            {/* Duration / ETA / distance summary */}
            <div className="mb-3 flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5">
              <div className="flex flex-col">
                <span className="text-base font-bold">{fmtDuration(route.durationSeconds)}</span>
                <span className="text-[10px] text-muted-foreground">
                  ETA {fmtEta(route.durationSeconds)}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {fmtDistance(route.distanceMeters)}
              </span>
            </div>

            {/* Next step highlight during navigation */}
            {isNavigating && route.steps.length > 0 && (
              <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-2.5 dark:border-blue-800 dark:bg-blue-950/80">
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

            {/* Step-by-step directions — visible by default, collapsible */}
            {route.steps.length > 0 && (
              <div className="mb-3">
                <button
                  onClick={() => setStepsCollapsed(!stepsCollapsed)}
                  className="mb-1 flex w-full items-center justify-between px-1 text-xs font-medium text-muted-foreground"
                >
                  <span>
                    {route.steps.length} step{route.steps.length !== 1 ? 's' : ''}
                  </span>
                  {stepsCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
                {!stepsCollapsed && (
                  <ol className="max-h-[180px] space-y-0.5 overflow-y-auto sm:max-h-[260px]">
                    {route.steps.map((step, i) => (
                      <li
                        key={i}
                        className={`flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-xs ${
                          isNavigating && i === 0
                            ? 'border border-blue-200 bg-blue-50/60 dark:border-blue-800 dark:bg-blue-950/60'
                            : ''
                        }`}
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="leading-snug text-foreground/80">{step.instruction}</p>
                          {(step.distanceMeters > 0 || step.transitLineName) && (
                            <p className="mt-0.5 text-[10px] text-muted-foreground/70">
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

        {/* Actions */}
        <div className="flex gap-2">
          {!isNavigating ? (
            <button
              onClick={onStartNavigation}
              disabled={!route || isLoadingRoute}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1a73e8] py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#1557b0] disabled:opacity-40"
            >
              <Navigation size={16} /> Start
            </button>
          ) : (
            <button
              onClick={onStopNavigation}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive py-3 text-sm font-bold text-destructive-foreground"
            >
              <X size={16} /> Stop
            </button>
          )}
          {handoffUrl && (
            <a
              href={handoffUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-border px-4 py-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
              aria-label="Open in Google Maps"
            >
              <ExternalLink size={14} /> Maps
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
