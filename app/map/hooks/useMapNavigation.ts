import { useState, useEffect, useCallback } from 'react';
import { toastUtils } from '@/lib/utils/toast';
import { devLog } from '@/lib/utils/devLog';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { fetchORSRoute } from '@/lib/services/ors';
import {
  parseRouteInstructions,
  NavigationStateManager,
  type NavigationState,
  type RouteInstruction,
} from '@/lib/map/realtimeNavigation';
import { formatDistance, formatDuration, type RoutePreview } from '@/lib/map/navigationHelpers';
import { getBuildingGps, type Building } from '@/lib/map/buildings';
import type { TranslationKey } from '@/lib/i18n/translations';

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
  const { t } = useTypedTranslation();

  // State
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]); // Pixel coords for display [lat, lng]
  const [gpsRouteCoords, setGpsRouteCoords] = useState<[number, number][]>([]); // GPS coords for logic [lng, lat]
  const [preview, setPreview] = useState<RoutePreview | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [navState, setNavState] = useState<NavigationState | null>(null);
  const [routeInstructions, setRouteInstructions] = useState<RouteInstruction[]>([]);

  // Subscribe to navigation manager state
  useEffect(() => {
    if (navManagerRef.current) {
      navManagerRef.current.setOnStateChange((state) => {
        setNavState(state);
        if (state.status === 'arrived' && isNavigating) {
          mapLog.log('User arrived at destination!');
          toastUtils.success(
            t('arrived' as TranslationKey) || 'Arrived!',
            selectedBuilding?.name || '',
          );
          setIsNavigating(false);
        }
      });
    }
  }, [navManagerRef, isNavigating, selectedBuilding, t]);

  // Start Navigation
  const startNavigation = useCallback(() => {
    if (isOffCampus) {
      toastUtils.warning(
        t('locationOutsideCampusTitle' as TranslationKey) || 'Outside campus boundary',
        t('locationOutsideCampusMessage' as TranslationKey) ||
          'Navigation is disabled while you are outside campus.',
      );
      return;
    }
    if (!gpsRouteCoords.length || !preview || !navManagerRef.current) {
      toastUtils.warning(t('noRouteAvailable' as TranslationKey) || 'No route available');
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
      t('navigationStarted' as TranslationKey) || 'Navigation started',
      `${formatDistance(preview.distanceMeters)} • ${formatDuration(preview.durationSeconds)}`,
    );
  }, [isOffCampus, gpsRouteCoords, preview, navManagerRef, t]);

  const stopNavigation = useCallback(() => {
    if (navManagerRef.current) {
      navManagerRef.current.stopNavigation();
    }
    setIsNavigating(false);
    setNavState(null);
    mapLog.log('Navigation stopped');
  }, [navManagerRef]);

  // Route Fetching Effect
  useEffect(() => {
    let active = true;

    async function updateRoute() {
      if (!selectedBuilding || !origin) {
        setPreview(null);
        setRouteCoords([]);
        setGpsRouteCoords([]);
        setRouteInstructions([]);
        if (isNavigating) stopNavigation();
        return;
      }

      setIsLoadingRoute(true);
      const destGps = getBuildingGps(selectedBuilding);

      if (!destGps || !origin) {
        setIsLoadingRoute(false);
        return;
      }

      setRouteError(null);
      const { coordinates, preview: routeData, error, orsData } = await fetchORSRoute(
        origin,
        destGps,
      );

      if (!active) return;

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
      active = false;
      clearTimeout(timer);
    };
  }, [selectedBuilding, origin, isNavigating, stopNavigation, gpsToCrsSimple, getBuildingLatLng]);

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
