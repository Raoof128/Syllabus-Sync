'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Building } from '@/features/map/lib/buildings';
import { getBuildingGps } from '@/features/map/lib/buildings';
import { GoogleMapCanvas } from './GoogleMapCanvas';
import { GoogleRoutePanel } from './GoogleRoutePanel';
import type { GoogleComputedRoute, GoogleTravelMode, MapLatLng } from '@/lib/maps/google/types';
import { useSafeTranslation } from '@/lib/hooks/useSafeTranslation';

const ARRIVAL_THRESHOLD_METERS = 30;
const ROUTE_RECALC_DISTANCE_METERS = 50;
const ROUTE_RECALC_INTERVAL_MS = 15_000;

export interface GoogleMapRef {
  startNavigation: () => void;
  stopNavigation: () => void;
  isNavigating: boolean;
}

interface GoogleMapControllerProps {
  buildings: Building[];
  selectedBuilding?: Building;
  travelMode: GoogleTravelMode;
  onTravelModeChange: (mode: GoogleTravelMode) => void;
  onSelectBuilding?: (building: Building) => void;
  onNavStateChange?: (state: {
    isNavigating: boolean;
    status: 'idle' | 'navigating' | 'recalculating' | 'arrived' | 'error';
    remainingDistance?: number;
    etaSeconds?: number;
  }) => void;
}

interface RouteApiResponse {
  success: boolean;
  data?: GoogleComputedRoute;
  error?: {
    message: string;
  };
}

function haversineDistance(a: MapLatLng, b: MapLatLng): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export const GoogleMapController = forwardRef<GoogleMapRef, GoogleMapControllerProps>(
  (
    {
      buildings,
      selectedBuilding,
      travelMode,
      onTravelModeChange,
      onSelectBuilding,
      onNavStateChange,
    },
    ref,
  ) => {
    const { safeT } = useSafeTranslation();
    const [userLocation, setUserLocation] = useState<MapLatLng | null>(null);
    const [userHeading, setUserHeading] = useState<number | null>(null);
    const [route, setRoute] = useState<GoogleComputedRoute | null>(null);
    const [routeError, setRouteError] = useState<string | null>(null);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [hasArrived, setHasArrived] = useState(false);
    const geolocationWatchRef = useRef<number | null>(null);
    const headingWatchRef = useRef<{ remove: () => void } | null>(null);
    const lastUserLocationRef = useRef<MapLatLng | null>(null);
    const lastRouteRequestKeyRef = useRef<string | null>(null);
    const lastRouteLocationRef = useRef<MapLatLng | null>(null);
    const lastRouteTimeRef = useRef<number>(0);
    const routesConfigurationFailedRef = useRef(false);

    const destination = useMemo(() => {
      if (!selectedBuilding) return null;
      const location =
        selectedBuilding.entranceLocation ??
        selectedBuilding.location ??
        getBuildingGps(selectedBuilding);
      return {
        label: selectedBuilding.id,
        lat: location.lat,
        lng: location.lng,
      };
    }, [selectedBuilding]);

    const ensureUserLocation = useCallback(async (): Promise<MapLatLng> => {
      if (lastUserLocationRef.current) {
        return lastUserLocationRef.current;
      }

      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        throw new Error(safeT('locationNotAvailable', 'Location not available.'));
      }

      return new Promise<MapLatLng>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const nextLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            lastUserLocationRef.current = nextLocation;
            setUserLocation(nextLocation);
            resolve(nextLocation);
          },
          () => {
            reject(new Error(safeT('locationAccessDenied', 'Location access denied.')));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000,
          },
        );
      });
    }, [safeT]);

    const computeRoute = useEffectEvent(async (forceRecalc = false) => {
      if (!destination) {
        setRoute(null);
        setRouteError(null);
        return;
      }

      try {
        const origin = await ensureUserLocation();
        const requestKey = [
          travelMode,
          origin.lat.toFixed(5),
          origin.lng.toFixed(5),
          destination.lat.toFixed(5),
          destination.lng.toFixed(5),
        ].join(':');

        // Check if we should skip this request
        if (!forceRecalc) {
          if (routesConfigurationFailedRef.current) return;
          if (
            lastRouteRequestKeyRef.current === requestKey &&
            (route !== null || routeError !== null)
          ) {
            return;
          }
        }

        lastRouteRequestKeyRef.current = requestKey;
        lastRouteLocationRef.current = origin;
        lastRouteTimeRef.current = Date.now();
        setIsLoadingRoute(true);
        setRouteError(null);

        const response = await fetch('/api/maps/routes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            origin,
            destination: {
              lat: destination.lat,
              lng: destination.lng,
            },
            travelMode,
          }),
        });

        const json = (await response.json()) as RouteApiResponse;
        if (!response.ok || !json.success || !json.data) {
          const message = json.error?.message || safeT('routeUnavailable', 'Route unavailable.');
          if (response.status === 503) {
            routesConfigurationFailedRef.current = true;
          }
          throw new Error(message);
        }

        routesConfigurationFailedRef.current = false;
        setRoute(json.data);
        setHasArrived(false);
      } catch (error) {
        setRoute(null);
        setRouteError(
          error instanceof Error ? error.message : safeT('routeUnavailable', 'Route unavailable.'),
        );
      } finally {
        setIsLoadingRoute(false);
      }
    });

    const startNavigation = useCallback(() => {
      if (!selectedBuilding) {
        setRouteError(safeT('selectBuildingToNavigate', 'Select a building to navigate.'));
        return;
      }

      routesConfigurationFailedRef.current = false;
      lastRouteRequestKeyRef.current = null;
      lastRouteLocationRef.current = null;
      setHasArrived(false);
      setIsNavigating(true);
    }, [safeT, selectedBuilding]);

    const stopNavigation = useCallback(() => {
      setIsNavigating(false);
      setRoute(null);
      setRouteError(null);
      setHasArrived(false);
      lastRouteRequestKeyRef.current = null;
      lastRouteLocationRef.current = null;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        startNavigation,
        stopNavigation,
        get isNavigating() {
          return isNavigating;
        },
      }),
      [isNavigating, startNavigation, stopNavigation],
    );

    // Geolocation watch — always active to show user's position
    useEffect(() => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        return;
      }

      geolocationWatchRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const nextLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          const last = lastUserLocationRef.current;
          if (last) {
            const latDiff = Math.abs(last.lat - nextLocation.lat);
            const lngDiff = Math.abs(last.lng - nextLocation.lng);
            if (latDiff < 0.00001 && lngDiff < 0.00001) {
              return;
            }
          }

          lastUserLocationRef.current = nextLocation;
          setUserLocation(nextLocation);

          // Update heading from position if available
          if (position.coords.heading !== null && Number.isFinite(position.coords.heading)) {
            setUserHeading(position.coords.heading);
          }
        },
        () => {
          setRouteError(
            (current) => current ?? safeT('locationAccessDenied', 'Location access denied.'),
          );
        },
        {
          enableHighAccuracy: true,
          maximumAge: 3000,
          timeout: 10000,
        },
      );

      return () => {
        if (geolocationWatchRef.current !== null) {
          navigator.geolocation.clearWatch(geolocationWatchRef.current);
        }
      };
    }, [safeT]);

    // Device orientation for compass heading (mobile)
    useEffect(() => {
      if (typeof window === 'undefined') return;

      const handleOrientation = (event: DeviceOrientationEvent) => {
        // Use webkitCompassHeading for iOS, alpha for Android
        const heading =
          (event as DeviceOrientationEvent & { webkitCompassHeading?: number })
            .webkitCompassHeading ?? (event.alpha !== null ? (360 - event.alpha) % 360 : null);

        if (heading !== null && Number.isFinite(heading)) {
          setUserHeading(heading);
        }
      };

      window.addEventListener('deviceorientation', handleOrientation, true);
      headingWatchRef.current = {
        remove: () => window.removeEventListener('deviceorientation', handleOrientation, true),
      };

      return () => {
        headingWatchRef.current?.remove();
        headingWatchRef.current = null;
      };
    }, []);

    // Initial route computation when navigation starts or destination/mode changes
    useEffect(() => {
      if (!isNavigating) return;
      void computeRoute();
    }, [destination?.lat, destination?.lng, isNavigating, travelMode]);

    // Live route recalculation when user moves significantly during navigation
    useEffect(() => {
      if (!isNavigating || !userLocation || !destination || hasArrived) return;

      // Check arrival
      const distToDestination = haversineDistance(userLocation, {
        lat: destination.lat,
        lng: destination.lng,
      });

      if (distToDestination < ARRIVAL_THRESHOLD_METERS) {
        setHasArrived(true);
        return;
      }

      // Check if we need to recalculate: user moved far enough and enough time passed
      const lastRouteLocation = lastRouteLocationRef.current;
      const timeSinceLastRoute = Date.now() - lastRouteTimeRef.current;

      if (lastRouteLocation && timeSinceLastRoute > ROUTE_RECALC_INTERVAL_MS) {
        const distFromLastRoute = haversineDistance(userLocation, lastRouteLocation);
        if (distFromLastRoute > ROUTE_RECALC_DISTANCE_METERS) {
          lastRouteRequestKeyRef.current = null; // Force new request
          void computeRoute(true);
        }
      }
    }, [userLocation, isNavigating, destination, hasArrived]);

    // Reset configuration-failed ref when destination or travel mode changes
    useEffect(() => {
      routesConfigurationFailedRef.current = false;
      lastRouteRequestKeyRef.current = null;
    }, [destination?.lat, destination?.lng, travelMode]);

    // Stop navigation when building is deselected
    useEffect(() => {
      if (!selectedBuilding) {
        stopNavigation();
      }
    }, [selectedBuilding, stopNavigation]);

    // Notify parent of navigation state changes
    useEffect(() => {
      onNavStateChange?.({
        isNavigating,
        status: hasArrived
          ? 'arrived'
          : routeError
            ? 'error'
            : isLoadingRoute
              ? 'recalculating'
              : isNavigating
                ? 'navigating'
                : 'idle',
        remainingDistance: route?.distanceMeters,
        etaSeconds: route?.durationSeconds,
      });
    }, [
      hasArrived,
      isLoadingRoute,
      isNavigating,
      onNavStateChange,
      route?.distanceMeters,
      route?.durationSeconds,
      routeError,
    ]);

    return (
      <div className="relative h-full w-full">
        <GoogleMapCanvas
          buildings={buildings}
          selectedBuilding={selectedBuilding}
          userLocation={userLocation}
          userHeading={userHeading}
          route={route}
          isNavigating={isNavigating}
          onSelectBuilding={onSelectBuilding}
        />
        {selectedBuilding && (
          <GoogleRoutePanel
            selectedBuildingLabel={selectedBuilding.id}
            route={route}
            travelMode={travelMode}
            isLoading={isLoadingRoute}
            error={routeError}
            hasArrived={hasArrived}
            isNavigating={isNavigating}
            onStartNavigation={startNavigation}
            onTravelModeChange={onTravelModeChange}
            onStopNavigation={stopNavigation}
          />
        )}
      </div>
    );
  },
);

GoogleMapController.displayName = 'GoogleMapController';
