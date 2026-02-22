import { useEffect, useState, useCallback } from "react";
import { useReducedMotion } from "framer-motion";
import {
  getBuildingCrsCoords,
  type Building,
} from "@/features/map/lib/buildings";
import { PIXEL_BOUNDS } from "@/features/map/lib/constants";
import { devLog } from "@/lib/utils/devLog";
import type { ReactLeafletModule } from "@/features/map/hooks/useLeafletLoader";
import type { LeafletModule } from "@/features/map/lib/leafletTypes";

const mapLog = devLog.map;

interface MapControllerProps {
  selectedBuilding?: Building;
  setMapInstance: (map: import("leaflet").Map) => void;
  reactLeafletModule: ReactLeafletModule;
  leafletModule: LeafletModule;
}

/**
 * MapController — child of MapContainer.
 * Captures the map instance, configures bounds/zoom, and flies to
 * the selected building when it changes.
 */
export function MapController({
  selectedBuilding,
  setMapInstance,
  reactLeafletModule,
  leafletModule,
}: MapControllerProps) {
  const map = reactLeafletModule.useMap();
  const prefersReducedMotion = useReducedMotion();
  const [isReady, setIsReady] = useState(false);

  const isMapReady = useCallback(
    (
      m: import("leaflet").Map | null | undefined,
    ): m is import("leaflet").Map => {
      if (!m) return false;
      try {
        const container = m.getContainer();
        if (!container || !container.parentNode) return false;
        if (!m.getCenter || !m.getZoom) return false;
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  // Register map instance once ready
  useEffect(() => {
    if (!map) return;
    const checkReady = () => {
      if (isMapReady(map)) {
        setIsReady(true);
        setMapInstance(map);
      }
    };
    checkReady();
    map.once("load", checkReady);
    return () => {
      map.off("load", checkReady);
    };
  }, [map, setMapInstance, isMapReady]);

  // Initial map configuration
  useEffect(() => {
    if (!isReady || !isMapReady(map)) return;
    try {
      map.zoomControl.setPosition("bottomright");
      map.setMaxBounds(PIXEL_BOUNDS);
      map.setMaxZoom(3);
      map.fitBounds(PIXEL_BOUNDS, { padding: [20, 20] });
      // Allow zooming out 1.5 levels below the fitted zoom so users
      // can see the full campus with some surrounding space.
      map.setMinZoom(map.getZoom() - 1.5);
    } catch (error) {
      mapLog.log("Map setup error:", error);
    }
  }, [map, isReady, isMapReady]);

  // Fly to selected building
  useEffect(() => {
    if (!isReady || !isMapReady(map) || !selectedBuilding) return;
    let popupTimeout: ReturnType<typeof setTimeout> | null = null;
    try {
      const buildingLatLng = getBuildingCrsCoords(selectedBuilding);
      const shouldAnimate = !prefersReducedMotion;

      map.flyTo(buildingLatLng, 1, {
        duration: shouldAnimate ? 1.5 : 0,
        easeLinearity: 0.25,
        paddingTopLeft: [0, 0],
        paddingBottomRight: [0, 0],
        animate: shouldAnimate,
      } as import("leaflet").ZoomPanOptions);

      const openPopupForBuilding = () => {
        try {
          const targetLatLng = getBuildingCrsCoords(selectedBuilding);
          map.eachLayer((layer) => {
            if (layer instanceof leafletModule.Marker) {
              const markerPos = layer.getLatLng();
              if (
                Math.abs(markerPos.lat - targetLatLng.lat) < 1 &&
                Math.abs(markerPos.lng - targetLatLng.lng) < 1
              ) {
                layer.openPopup();
              }
            }
          });
        } catch {
          // ignore popup open errors during rapid state changes/HMR
        }
      };

      popupTimeout = setTimeout(openPopupForBuilding, shouldAnimate ? 800 : 0);
    } catch (error) {
      mapLog.log("Building nav error:", error);
    }
    return () => {
      if (popupTimeout) clearTimeout(popupTimeout);
    };
  }, [
    selectedBuilding,
    map,
    isReady,
    prefersReducedMotion,
    leafletModule,
    isMapReady,
  ]);

  return null;
}
