import { useEffect, useRef } from 'react';
import { devLog } from '@/lib/utils/devLog';
import { PIXEL_BOUNDS } from '@/lib/map/constants';
import { mapOverlays, type MapOverlayId } from '@/lib/map/mapOverlays';
import type { Map as LeafletMap, ImageOverlay } from 'leaflet';

const mapLog = devLog.map;

interface MapOverlaysProps {
  mapInstance: LeafletMap | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  leafletModule: any;
  activeOverlays: MapOverlayId[];
  overlaysReady: boolean;
}

export function MapOverlays({
  mapInstance,
  leafletModule,
  activeOverlays,
  overlaysReady,
}: MapOverlaysProps) {
  const activeOverlayRefs = useRef<Map<MapOverlayId, ImageOverlay>>(new Map());

  // Active overlay layers (parking, water, etc.)
  useEffect(() => {
    if (!mapInstance || !leafletModule || !overlaysReady) return;

    const currentOverlays = activeOverlayRefs.current;

    try {
      // Remove overlays that are no longer active
      currentOverlays.forEach((overlay, id) => {
        if (!activeOverlays.includes(id)) {
          try {
            if (mapInstance.hasLayer(overlay)) {
              mapInstance.removeLayer(overlay);
            }
          } catch {
            // Ignore removal errors
          }
          currentOverlays.delete(id);
        }
      });

      // Add new overlays
      activeOverlays.forEach((overlayId) => {
        if (!currentOverlays.has(overlayId)) {
          const overlayConfig = mapOverlays.find((o) => o.id === overlayId);
          if (overlayConfig) {
            const overlay = leafletModule.imageOverlay(overlayConfig.imagePath, PIXEL_BOUNDS, {
              opacity: 0.85,
              className: 'map-overlay-layer',
            });
            overlay.addTo(mapInstance);
            currentOverlays.set(overlayId, overlay);
            mapLog.log(`Overlay ${overlayId} added via native Leaflet (CRS.Simple)`);
          }
        }
      });
    } catch (error) {
      mapLog.log('Error managing active overlays:', error);
    }

    return () => {
      // Cleanup all active overlays
      currentOverlays.forEach((overlay) => {
        try {
          if (mapInstance && mapInstance.hasLayer(overlay)) {
            mapInstance.removeLayer(overlay);
          }
        } catch {
          // Silently ignore cleanup errors during HMR
        }
      });
      currentOverlays.clear();
    };
  }, [mapInstance, leafletModule, overlaysReady, activeOverlays]);

  return null;
}
