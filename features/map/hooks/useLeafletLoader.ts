/**
 * useLeafletLoader - Custom hook for dynamically loading Leaflet modules on client side
 *
 * This hook handles:
 * - Dynamic CSS imports for Leaflet and Leaflet Routing Machine
 * - Dynamic module imports for Leaflet and react-leaflet
 * - Fixing default marker icon paths
 * - Client-side readiness state management
 *
 * @returns Object containing leaflet module, react-leaflet components, and loading state
 */
"use client";

import { useEffect, useState, useRef } from "react";
import { errorHandler } from "@/lib/utils/errorHandling";
import { devLog } from "@/lib/utils/devLog";

const mapLog = devLog.map;

// Type for react-leaflet components we use
export interface ReactLeafletModule {
  MapContainer: typeof import("react-leaflet").MapContainer;
  Marker: typeof import("react-leaflet").Marker;
  Popup: typeof import("react-leaflet").Popup;
  Polyline: typeof import("react-leaflet").Polyline;
  ImageOverlay: typeof import("react-leaflet").ImageOverlay;
  Pane: typeof import("react-leaflet").Pane;
  useMap: typeof import("react-leaflet").useMap;
  useMapEvents: typeof import("react-leaflet").useMapEvents;
}

export interface UseLeafletLoaderResult {
  /** The Leaflet module (L) - null until loaded */
  leafletModule: typeof import("leaflet") | null;
  /** React-Leaflet components - null until loaded */
  reactLeafletModule: ReactLeafletModule | null;
  /** True when all modules are loaded and ready */
  isClientReady: boolean;
  /** Incremented when map needs to be re-rendered */
  mapKey: number;
  /** Reference to check if component is still mounted */
  isMountedRef: React.MutableRefObject<boolean>;
}

export function useLeafletLoader(): UseLeafletLoaderResult {
  const [leafletModule, setLeafletModule] = useState<
    typeof import("leaflet") | null
  >(null);
  const [reactLeafletModule, setReactLeafletModule] =
    useState<ReactLeafletModule | null>(null);
  const [isClientReady, setIsClientReady] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const loadLeaflet = async () => {
      try {
        // Import CSS first (using dynamic import for CSS modules)
        await import("leaflet/dist/leaflet.css");
        await import("leaflet-routing-machine/dist/leaflet-routing-machine.css");

        // Import Leaflet
        const L = await import("leaflet");

        // Import react-leaflet components
        const RL = await import("react-leaflet");

        if (!isMountedRef.current) return;

        // Fix default marker icons
        delete (
          L.default.Icon.Default.prototype as unknown as {
            _getIconUrl?: unknown;
          }
        )._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: "/images/leaflet/marker-icon-2x.png",
          iconUrl: "/images/leaflet/marker-icon.png",
          shadowUrl: "/images/leaflet/marker-shadow.png",
        });

        setLeafletModule(L.default as unknown as typeof import("leaflet"));
        setReactLeafletModule({
          MapContainer: RL.MapContainer,
          Marker: RL.Marker,
          Popup: RL.Popup,
          Polyline: RL.Polyline,
          ImageOverlay: RL.ImageOverlay,
          Pane: RL.Pane,
          useMap: RL.useMap,
          useMapEvents: RL.useMapEvents,
        });

        // Generate new key to force clean mount
        setMapKey((prev) => prev + 1);

        // Small delay to ensure everything is ready
        setTimeout(() => {
          if (isMountedRef.current) {
            setIsClientReady(true);
          }
        }, 100);
      } catch (error) {
        mapLog.log("Failed to load Leaflet modules:", error);
        errorHandler.logError(
          error instanceof Error
            ? error
            : new Error("Failed to load map modules"),
          "Map Loading",
          "medium",
        );
      }
    };

    loadLeaflet();

    return () => {
      isMountedRef.current = false;
      setIsClientReady(false);
    };
  }, []);

  return {
    leafletModule,
    reactLeafletModule,
    isClientReady,
    mapKey,
    isMountedRef,
  };
}

/**
 * Helper to check if a Leaflet map instance is valid and ready
 * Useful for guarding operations on the map instance
 */
export function isMapReady(
  map: import("leaflet").Map | null | undefined,
): boolean {
  if (!map) return false;
  try {
    if (!map.getContainer) return false;
    const container = map.getContainer();
    if (!container || !container.isConnected) return false;
    if (!map.getCenter || !map.getZoom) return false;
    return true;
  } catch {
    return false;
  }
}
