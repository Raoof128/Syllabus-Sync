'use client';

import { Car, Bike, Bus, Footprints, Navigation, X, ExternalLink } from 'lucide-react';
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
  onTravelModeChange: (m: GoogleTravelMode) => void;
  onStartNavigation: () => void;
  onStopNavigation: () => void;
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
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
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
  onTravelModeChange,
  onStartNavigation,
  onStopNavigation,
}: Props) {
  const handoffUrl =
    userLocation && destination
      ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destination.lat},${destination.lng}&travelmode=${GMAPS_MODE[travelMode]}`
      : null;

  return (
    <div className="absolute bottom-4 left-1/2 z-[1000] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur">
      {/* Destination */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Destination</p>
          <p className="truncate text-sm font-semibold">{destinationName}</p>
        </div>
        {isNavigating && (
          <button
            onClick={onStopNavigation}
            className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-destructive"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Travel mode tabs */}
      <div className="mb-3 flex gap-1">
        {MODES.map(({ mode, label, Icon }) => (
          <button
            key={mode}
            onClick={() => onTravelModeChange(mode)}
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

      {/* Route info */}
      {isLoadingRoute && (
        <p className="mb-2 text-center text-xs text-muted-foreground">Calculating route...</p>
      )}
      {routeError && <p className="mb-2 text-center text-xs text-destructive">{routeError}</p>}
      {route && !isLoadingRoute && (
        <div className="mb-3 flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
          <span className="text-sm font-bold">{fmtDuration(route.durationSeconds)}</span>
          <span className="text-xs text-muted-foreground">{fmtDistance(route.distanceMeters)}</span>
        </div>
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
          >
            <ExternalLink size={14} /> Maps
          </a>
        )}
      </div>
    </div>
  );
}
