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
    status: 'idle' | 'navigating' | 'recalculating' | 'error';
    remainingDistance?: number;
  }) => void;
}

interface RouteApiResponse {
  success: boolean;
  data?: GoogleComputedRoute;
  error?: {
    message: string;
  };
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
    const [route, setRoute] = useState<GoogleComputedRoute | null>(null);
    const [routeError, setRouteError] = useState<string | null>(null);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const geolocationWatchRef = useRef<number | null>(null);
    const lastUserLocationRef = useRef<MapLatLng | null>(null);
    const lastRouteRequestKeyRef = useRef<string | null>(null);
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

    const computeRoute = useEffectEvent(async () => {
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

        if (
          routesConfigurationFailedRef.current ||
          (lastRouteRequestKeyRef.current === requestKey && (route !== null || routeError !== null))
        ) {
          return;
        }

        lastRouteRequestKeyRef.current = requestKey;
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
      setIsNavigating(true);
    }, [safeT, selectedBuilding]);

    const stopNavigation = useCallback(() => {
      setIsNavigating(false);
      setRoute(null);
      setRouteError(null);
      lastRouteRequestKeyRef.current = null;
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
        },
        () => {
          setRouteError(
            (current) => current ?? safeT('locationAccessDenied', 'Location access denied.'),
          );
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000,
        },
      );

      return () => {
        if (geolocationWatchRef.current !== null) {
          navigator.geolocation.clearWatch(geolocationWatchRef.current);
        }
      };
    }, [safeT]);

    useEffect(() => {
      if (!isNavigating) return;
      void computeRoute();
    }, [destination?.lat, destination?.lng, isNavigating, travelMode]);

    useEffect(() => {
      routesConfigurationFailedRef.current = false;
      lastRouteRequestKeyRef.current = null;
    }, [destination?.lat, destination?.lng, travelMode]);

    useEffect(() => {
      if (!selectedBuilding) {
        stopNavigation();
      }
    }, [selectedBuilding, stopNavigation]);

    useEffect(() => {
      onNavStateChange?.({
        isNavigating,
        status: routeError
          ? 'error'
          : isLoadingRoute
            ? 'recalculating'
            : isNavigating
              ? 'navigating'
              : 'idle',
        remainingDistance: route?.distanceMeters,
      });
    }, [isLoadingRoute, isNavigating, onNavStateChange, route?.distanceMeters, routeError]);

    return (
      <div className="relative h-full w-full">
        <GoogleMapCanvas
          buildings={buildings}
          selectedBuilding={selectedBuilding}
          userLocation={userLocation}
          route={route}
          onSelectBuilding={onSelectBuilding}
        />
        {selectedBuilding && (
          <GoogleRoutePanel
            selectedBuildingLabel={selectedBuilding.id}
            route={route}
            travelMode={travelMode}
            isLoading={isLoadingRoute}
            error={routeError}
            onTravelModeChange={onTravelModeChange}
            onStopNavigation={stopNavigation}
          />
        )}
      </div>
    );
  },
);

GoogleMapController.displayName = 'GoogleMapController';
