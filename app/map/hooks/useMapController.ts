'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { Map as LeafletMap } from 'leaflet';
import { CAMPUS_CENTER_PIXEL, PIXEL_BOUNDS } from '@/lib/map/constants';
import { pixelToCrsSimple } from '@/lib/map/buildings';
import type { Building } from '@/lib/map/buildings';
import { devLog } from '@/lib/utils/devLog';

const mapLog = devLog.map;

interface UseMapControllerOptions {
  /** The Leaflet map instance */
  map: LeafletMap | null;
  /** Currently selected building to fly to */
  selectedBuilding?: Building;
  /** Whether the map is ready for operations */
  isReady?: boolean;
  /** Callback when map instance is set up */
  onMapReady?: (map: LeafletMap) => void;
}

interface UseMapControllerReturn {
  /** Whether the map controller has finished initialization */
  isInitialized: boolean;
  /** Fly to a specific building */
  flyToBuilding: (building: Building) => void;
  /** Reset view to campus center */
  resetView: () => void;
}

/**
 * Map Controller Hook - The Brain
 *
 * Handles map initialization, view constraints, and smooth transitions.
 * This hook centralizes all map view logic that was previously scattered
 * across useEffect spaghetti in UI components.
 *
 * Features:
 * - Automatic map initialization (center, bounds, zoom constraints)
 * - Smooth flyTo transitions for building selection
 * - Respects prefers-reduced-motion accessibility setting
 * - Idempotent operations (safe to call multiple times)
 *
 * @example
 * const map = useMap(); // from react-leaflet
 * const { isInitialized, flyToBuilding } = useMapController({
 *   map,
 *   selectedBuilding,
 *   onMapReady: (m) => console.log('Map ready:', m)
 * });
 */
export function useMapController({
  map,
  selectedBuilding,
  isReady = true,
  onMapReady,
}: UseMapControllerOptions): UseMapControllerReturn {
  const prefersReducedMotion = useReducedMotion();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize map view and constraints
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!map || !isReady) return;

    try {
      // Set initial view and constraints
      map.setView(CAMPUS_CENTER_PIXEL, 0);
      map.setMaxBounds(PIXEL_BOUNDS);
      map.setMinZoom(-2);
      map.setMaxZoom(2);

      setIsInitialized(true);
      onMapReady?.(map);

      mapLog.log('Map controller initialized');
    } catch (error) {
      mapLog.log('Map initialization error:', error);
    }
  }, [map, isReady, onMapReady]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Fly to selected building
  useEffect(() => {
    if (!map || !isInitialized || !selectedBuilding) return;

    try {
      const buildingLatLng = pixelToCrsSimple(
        selectedBuilding.position[0],
        selectedBuilding.position[1],
      );

      // Smooth transition with reduced motion respect
      const shouldAnimate = !prefersReducedMotion;

      map.flyTo(buildingLatLng, 1, {
        duration: shouldAnimate ? 1.5 : 0,
        easeLinearity: 0.25,
        paddingTopLeft: [0, 0],
        paddingBottomRight: [0, 0],
        animate: shouldAnimate,
      } as import('leaflet').ZoomPanOptions);

      mapLog.log('Flying to building:', selectedBuilding.id);
    } catch (error) {
      mapLog.log('Fly to building error:', error);
    }
  }, [map, selectedBuilding, isInitialized, prefersReducedMotion]);

  // Manual fly to building function
  const flyToBuilding = (building: Building) => {
    if (!map || !isInitialized) return;

    try {
      const buildingLatLng = pixelToCrsSimple(building.position[0], building.position[1]);
      const shouldAnimate = !prefersReducedMotion;

      map.flyTo(buildingLatLng, 1, {
        duration: shouldAnimate ? 1.5 : 0,
        easeLinearity: 0.25,
        animate: shouldAnimate,
      } as import('leaflet').ZoomPanOptions);
    } catch (error) {
      mapLog.log('Manual fly to building error:', error);
    }
  };

  // Reset view to campus center
  const resetView = () => {
    if (!map || !isInitialized) return;

    try {
      const shouldAnimate = !prefersReducedMotion;
      map.flyTo(CAMPUS_CENTER_PIXEL, 0, {
        duration: shouldAnimate ? 1 : 0,
        animate: shouldAnimate,
      } as import('leaflet').ZoomPanOptions);
    } catch (error) {
      mapLog.log('Reset view error:', error);
    }
  };

  return {
    isInitialized,
    flyToBuilding,
    resetView,
  };
}

export default useMapController;
