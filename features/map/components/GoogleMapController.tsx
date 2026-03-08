'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { Building } from '@/features/map/lib/buildings';
import { getBuildingGps } from '@/features/map/lib/buildings';
import type {
  GoogleComputedRoute,
  GoogleTravelMode,
  MapLatLng,
  ExternalDestination,
} from '@/lib/maps/google/types';
import GoogleRoutePanel from './GoogleRoutePanel';

const GoogleMapCanvas = dynamic(() => import('./GoogleMapCanvas'), { ssr: false });

interface RouteApiResponse {
  success: boolean;
  data?: GoogleComputedRoute;
  error?: { message: string };
}

interface Props {
  buildings: Building[];
  selectedBuilding?: Building;
  externalDestination: ExternalDestination | null;
}

export default function GoogleMapController({
  buildings,
  selectedBuilding,
  externalDestination,
}: Props) {
  const [userLocation, setUserLocation] = useState<MapLatLng | null>(null);
  const [route, setRoute] = useState<GoogleComputedRoute | null>(null);
  const [travelMode, setTravelMode] = useState<GoogleTravelMode>('WALK');
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const watchRef = useRef<number | null>(null);
  const lastKeyRef = useRef('');
  const lastGpsRef = useRef<MapLatLng | null>(null);

  // Minimum displacement (~11 m) before updating location state
  const GPS_MIN_DELTA = 0.0001;

  // GPS watch
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (p) => {
        const next = { lat: p.coords.latitude, lng: p.coords.longitude };
        const prev = lastGpsRef.current;
        if (
          prev &&
          Math.abs(next.lat - prev.lat) < GPS_MIN_DELTA &&
          Math.abs(next.lng - prev.lng) < GPS_MIN_DELTA
        ) {
          return; // skip trivial jitter
        }
        lastGpsRef.current = next;
        setUserLocation(next);
      },
      null,
      { enableHighAccuracy: true, maximumAge: 3000 },
    );
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  // Destination resolution
  const destination = useMemo<MapLatLng | null>(() => {
    if (externalDestination) {
      return { lat: externalDestination.lat, lng: externalDestination.lng };
    }
    if (selectedBuilding) {
      const gps = selectedBuilding.entranceLocation ?? selectedBuilding.location;
      return gps ? { lat: gps.lat, lng: gps.lng } : getBuildingGps(selectedBuilding);
    }
    return null;
  }, [externalDestination, selectedBuilding]);

  const destName = externalDestination?.label ?? selectedBuilding?.name ?? '';

  // Route fetch
  const fetchRoute = useCallback(
    async (origin: MapLatLng, dest: MapLatLng, mode: GoogleTravelMode) => {
      const key = `${origin.lat},${origin.lng}>${dest.lat},${dest.lng}|${mode}`;
      if (key === lastKeyRef.current) return;
      lastKeyRef.current = key;

      setIsLoadingRoute(true);
      setRouteError(null);
      try {
        const res = await fetch('/api/maps/routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ origin, destination: dest, travelMode: mode }),
        });
        const json = (await res.json()) as RouteApiResponse;
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error?.message ?? 'Route fetch failed');
        }
        setRoute(json.data);
      } catch (e) {
        setRouteError(e instanceof Error ? e.message : 'Routing error');
        setRoute(null);
        lastKeyRef.current = '';
      } finally {
        setIsLoadingRoute(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!destination || !userLocation) return;
    void fetchRoute(userLocation, destination, travelMode);
  }, [destination, userLocation, travelMode, fetchRoute]);

  // Reset route on destination change
  useEffect(() => {
    setRoute(null);
    setIsNavigating(false);
    lastKeyRef.current = '';
  }, [selectedBuilding?.id, externalDestination?.placeId]);

  return (
    <div className="relative h-full w-full">
      <GoogleMapCanvas
        buildings={buildings}
        selectedBuilding={selectedBuilding}
        externalDestination={externalDestination}
        userLocation={userLocation}
        route={route}
      />

      {destination && (
        <GoogleRoutePanel
          destinationName={destName}
          route={route}
          travelMode={travelMode}
          isNavigating={isNavigating}
          isLoadingRoute={isLoadingRoute}
          routeError={routeError}
          userLocation={userLocation}
          destination={destination}
          onTravelModeChange={(m) => {
            setTravelMode(m);
            lastKeyRef.current = '';
          }}
          onStartNavigation={() => setIsNavigating(true)}
          onStopNavigation={() => setIsNavigating(false)}
        />
      )}
    </div>
  );
}
