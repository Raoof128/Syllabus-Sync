'use client';

import { useEffect, useRef, useCallback } from 'react';
import { devLog } from '@/lib/utils/devLog';

const mapLog = devLog.map;

interface UseMapSimulationReturn {
  isSimulating: boolean;
  startSimulation: () => void;
  stopSimulation: () => void;
}

interface UseMapSimulationProps {
  enabled: boolean;
  routeCoordinates?: [number, number][];
  onUpdate: (lat: number, lng: number, heading: number, speed?: number) => void;
}

/**
 * useMapSimulation - Dev-only hook for simulating GPS movement along a route
 *
 * This hook is tree-shaken in production builds when enabled is false.
 * It creates a smooth simulation of user movement for testing navigation
 * without requiring actual GPS data.
 *
 * @example
 * const { isSimulating, startSimulation, stopSimulation } = useMapSimulation({
 *   enabled: process.env.NODE_ENV === 'development',
 *   routeCoordinates: navState?.routeCoordinates,
 *   onUpdate: (lat, lng, heading) => simulatePosition(lat, lng, heading, 1.4)
 * });
 */
export function useMapSimulation({
  enabled,
  routeCoordinates = [],
  onUpdate,
}: UseMapSimulationProps): UseMapSimulationReturn {
  const simulationRef = useRef<NodeJS.Timeout | null>(null);
  const isSimulatingRef = useRef(false);

  // Mock route for when no real route is available
  const mockRoute: [number, number][] = [
    [151.1131306, -33.7756994],
    [151.1135164, -33.7738842],
    [151.1134919, -33.7734389],
    [151.1131306, -33.7756994],
  ];

  const stopSimulation = useCallback(() => {
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
      simulationRef.current = null;
      isSimulatingRef.current = false;
      mapLog.log('Simulation stopped');
    }
  }, []);

  const startSimulation = useCallback(() => {
    // Toggle off if already running
    if (simulationRef.current) {
      stopSimulation();
      return;
    }

    const points = routeCoordinates.length > 0 ? routeCoordinates : mockRoute;
    let segmentIndex = 0;
    let progress = 0;
    const stepSize = 0.00004;

    isSimulatingRef.current = true;
    mapLog.log(`Simulation started with ${points.length} points`);

    simulationRef.current = setInterval(() => {
      if (segmentIndex >= points.length - 1) {
        stopSimulation();
        return;
      }

      const [lng1, lat1] = points[segmentIndex];
      const [lng2, lat2] = points[segmentIndex + 1];
      const dx = lng2 - lng1;
      const dy = lat2 - lat1;
      const len = Math.sqrt(dx * dx + dy * dy);

      progress += stepSize / (len || 1);

      if (progress >= 1) {
        progress = 0;
        segmentIndex++;
        return;
      }

      const curLng = lng1 + dx * progress;
      const curLat = lat1 + dy * progress;
      const heading = (Math.atan2(dx, dy) * 180) / Math.PI;
      const normalizedHeading = heading >= 0 ? heading : heading + 360;

      // Call the update callback with simulated position
      onUpdate(curLat, curLng, normalizedHeading, 1.4);
    }, 50);
    // mockRoute is defined within the hook but is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCoordinates, onUpdate, stopSimulation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
        simulationRef.current = null;
      }
    };
  }, []);

  // Return early if not enabled (tree-shaken in production)
  if (!enabled) {
    return { isSimulating: false, startSimulation: () => {}, stopSimulation: () => {} };
  }

  return {
    isSimulating: isSimulatingRef.current,
    startSimulation,
    stopSimulation,
  };
}

export default useMapSimulation;
