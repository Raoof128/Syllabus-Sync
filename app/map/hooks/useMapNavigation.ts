import { useState, useEffect, useCallback, useRef } from 'react';
import { toastUtils } from '@/lib/utils/toast';
import { devLog } from '@/lib/utils/devLog';
import { useSafeTranslation } from '@/lib/hooks/useSafeTranslation';
import { fetchORSRoute } from '@/lib/services/ors';
import {
  parseRouteInstructions,
  NavigationStateManager,
  type NavigationState,
  type RouteInstruction,
} from '@/lib/map/realtimeNavigation';
import { formatDistance, formatDuration, type RoutePreview } from '@/lib/map/navigationHelpers';
import { getBuildingGps, type Building } from '@/lib/map/buildings';

const mapLog = devLog.map;

interface UseMapNavigationProps {
  selectedBuilding?: Building;
  origin: { lat: number; lng: number } | null;
  isOffCampus: boolean;
  navManagerRef: React.MutableRefObject<NavigationStateManager | null>;
  gpsToCrsSimple: (lat: number, lng: number) => { lat: number; lng: number } | null;
  getBuildingLatLng: (building: Building) => { lat: number; lng: number };
}

export function useMapNavigation({
  selectedBuilding,
  origin,
  isOffCampus,
  navManagerRef,
  gpsToCrsSimple,
  getBuildingLatLng,
}: UseMapNavigationProps) {
  const { safeT } = useSafeTranslation();

  // State
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]); // Pixel coords for display [lat, lng]
  const [gpsRouteCoords, setGpsRouteCoords] = useState<[number, number][]>([]); // GPS coords for logic [lng, lat]
  const [preview, setPreview] = useState<RoutePreview | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [navState, setNavState] = useState<NavigationState | null>(null);
  const [routeInstructions, setRouteInstructions] = useState<RouteInstruction[]>([]);

  const isNavigatingRef = useRef(isNavigating);
  const selectedBuildingRef = useRef(selectedBuilding);
  const stopNavigationRef = useRef<() => void>(() => {});

  useEffect(() => {
    isNavigatingRef.current = isNavigating;
  }, [isNavigating]);
  useEffect(() => {
    selectedBuildingRef.current = selectedBuilding;
  }, [selectedBuilding]);

  // Subscribe to navigation manager state (register once)
  useEffect(() => {
    const mgr = navManagerRef.current;
    if (!mgr) return;
    mgr.setOnStateChange((state) => {
      setNavState(state);
      if (state.status === 'arrived' && isNavigatingRef.current) {
        mapLog.log('User arrived at destination!');
        toastUtils.success(safeT('arrived', 'Arrived!'), selectedBuildingRef.current?.name || '');
        setIsNavigating(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navManagerRef]);

  // Start Navigation
  const startNavigation = useCallback(() => {
    if (isOffCampus) {
      toastUtils.warning(
        safeT('locationOutsideCampusTitle', 'Outside campus boundary'),
        safeT(
          'locationOutsideCampusMessage',
          'Navigation is disabled while you are outside campus.',
        ),
      );
      return;
    }
    if (!gpsRouteCoords.length || !preview || !navManagerRef.current) {
      toastUtils.warning(safeT('noRouteAvailable', 'No route available'));
      return;
    }

    // Parse instructions from the last ORS response (if any)
    const instructions = routeInstructions.length > 0 ? routeInstructions : [];

    // Pass REAL GPS coordinates to navigation manager
    // gpsRouteCoords are already [lng, lat] from ORS
    navManagerRef.current.startNavigation(gpsRouteCoords, instructions, preview.distanceMeters);
    setIsNavigating(true);

    mapLog.log('Navigation started', {
      totalDistance: preview.distanceMeters,
      estimatedTime: preview.durationSeconds,
    });

    toastUtils.success(
      safeT('navigationStarted', 'Navigation started'),
      `${formatDistance(preview.distanceMeters)} • ${formatDuration(preview.durationSeconds)}`,
    );
  }, [isOffCampus, gpsRouteCoords, preview, navManagerRef, routeInstructions, safeT]);

  const stopNavigation = useCallback(() => {
    if (navManagerRef.current) {
      navManagerRef.current.stopNavigation();
    }
    setIsNavigating(false);
    setNavState(null);
    mapLog.log('Navigation stopped');
  }, [navManagerRef]);

  useEffect(() => {
    stopNavigationRef.current = stopNavigation;
  }, [stopNavigation]);

  // Route Fetching Effect
  useEffect(() => {
    const controller = new AbortController();

    async function updateRoute() {
      if (!selectedBuilding || !origin) {
        setPreview(null);
        setRouteCoords([]);
        setGpsRouteCoords([]);
        setRouteInstructions([]);
        if (isNavigatingRef.current) stopNavigationRef.current();
        return;
      }

      setIsLoadingRoute(true);
      const destGps = getBuildingGps(selectedBuilding);

      if (!destGps || !origin) {
        setIsLoadingRoute(false);
        return;
      }

      setRouteError(null);
      const {
        coordinates,
        preview: routeData,
        error,
        orsData,
      } = await fetchORSRoute(origin, destGps, controller.signal);

      if (controller.signal.aborted) return;

      if (routeData && coordinates) {
        // coordinates from ORS are [lng, lat] GPS
        setGpsRouteCoords(coordinates as [number, number][]);

        // Convert to Pixel coords for Leaflet display [lat, lng]
        const pixelCoords = coordinates
          .map((c) => gpsToCrsSimple(c[1], c[0])) // gpsToCrsSimple(lat, lng)
          .filter((p): p is { lat: number; lng: number } => p !== null)
          .map((p) => [p.lat, p.lng] as [number, number]);

        // Add destination snap to visual route
        const destLatLng = getBuildingLatLng(selectedBuilding);
        pixelCoords.push([destLatLng.lat, destLatLng.lng]);

        setRouteCoords(pixelCoords);
        setPreview(routeData);
        setRouteInstructions(orsData ? parseRouteInstructions(orsData) : []);
      } else {
        setRouteError(error || 'Unknown error');
        setRouteCoords([]);
        setGpsRouteCoords([]);
        setPreview(null);
        setRouteInstructions([]);
      }
      setIsLoadingRoute(false);
    }

    const timer = setTimeout(updateRoute, 100);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [selectedBuilding, origin, gpsToCrsSimple, getBuildingLatLng]);

  return {
    isNavigating,
    setIsNavigating,
    startNavigation,
    stopNavigation,
    routeCoords,
    preview,
    routeError,
    isLoadingRoute,
    navState,
  };
}
