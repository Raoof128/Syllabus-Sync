'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, ImageOverlay } from 'leaflet';
import { PIXEL_BOUNDS } from '@/lib/map/constants';
import { mapOverlays, type MapOverlayId } from '@/lib/map/mapOverlays';
import { devLog } from '@/lib/utils/devLog';

const mapLog = devLog.map;

interface UseMapOverlaysOptions {
  /** The Leaflet map instance */
  map: LeafletMap | null;
  /** The Leaflet module (L) */
  leafletModule: typeof import('leaflet') | null;
  /** Array of active overlay IDs */
  activeOverlays: MapOverlayId[];
  /** Whether the map is ready for overlay operations */
  isReady?: boolean;
}

interface UseMapOverlaysReturn {
  /** Whether overlays are currently being managed */
  isManaging: boolean;
  /** Get all active overlay layers */
  getActiveLayers: () => Map<MapOverlayId, ImageOverlay>;
  /** Manually add an overlay by ID */
  addOverlay: (overlayId: MapOverlayId) => void;
  /** Manually remove an overlay by ID */
  removeOverlay: (overlayId: MapOverlayId) => void;
}

/**
 * Map Overlays Hook - The Clothes
 *
 * Manages dynamic overlay layers (parking, water, accessibility, etc.)
 * with automatic add/remove based on activeOverlays array.
 *
 * Features:
 * - Automatic sync of overlay layers with activeOverlays state
 * - Efficient add/remove (only changes what's needed)
 * - Cleanup on unmount
 * - Manual add/remove functions for imperative control
 *
 * @example
 * const map = useMap(); // from react-leaflet
 * const { addOverlay, removeOverlay } = useMapOverlays({
 *   map,
 *   leafletModule: L,
 *   activeOverlays: ['parking', 'water'],
 *   isReady: mapReady
 * });
 *
 * // Add overlay imperatively
 * addOverlay('accessibility');
 */
export function useMapOverlays({
  map,
  leafletModule,
  activeOverlays,
  isReady = true,
}: UseMapOverlaysOptions): UseMapOverlaysReturn {
  const layersRef = useRef<Map<MapOverlayId, ImageOverlay>>(new Map());
  const [isManaging, setIsManaging] = useState(false);

  // Sync active overlays with map layers
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!map || !leafletModule || !isReady) {
      setIsManaging(false);
      return;
    }

    setIsManaging(true);
    const currentLayers = layersRef.current;

    try {
      // Remove layers that are no longer active
      currentLayers.forEach((layer, id) => {
        if (!activeOverlays.includes(id)) {
          try {
            if (map.hasLayer(layer)) {
              map.removeLayer(layer);
            }
          } catch {
            // Ignore removal errors
          }
          currentLayers.delete(id);
          mapLog.log(`Overlay ${id} removed`);
        }
      });

      // Add new layers
      activeOverlays.forEach((overlayId) => {
        if (!currentLayers.has(overlayId)) {
          const overlayConfig = mapOverlays.find((o) => o.id === overlayId);
          if (overlayConfig) {
            const layer = leafletModule.imageOverlay(overlayConfig.imagePath, PIXEL_BOUNDS, {
              opacity: 0.85,
              className: 'map-overlay-layer',
            });
            layer.addTo(map);
            currentLayers.set(overlayId, layer);
            mapLog.log(`Overlay ${overlayId} added`);
          }
        }
      });
    } catch (error) {
      mapLog.log('Error managing overlays:', error);
    }

    // Cleanup on unmount or dependency change
    return () => {
      currentLayers.forEach((layer) => {
        try {
          if (map && map.hasLayer(layer)) {
            map.removeLayer(layer);
          }
        } catch {
          // Silently ignore cleanup errors during HMR
        }
      });
      currentLayers.clear();
      setIsManaging(false);
    };
  }, [map, leafletModule, activeOverlays, isReady]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Manual add overlay
  const addOverlay = (overlayId: MapOverlayId) => {
    if (!map || !leafletModule) return;

    const currentLayers = layersRef.current;
    if (currentLayers.has(overlayId)) return; // Already added

    const overlayConfig = mapOverlays.find((o) => o.id === overlayId);
    if (!overlayConfig) return;

    try {
      const layer = leafletModule.imageOverlay(overlayConfig.imagePath, PIXEL_BOUNDS, {
        opacity: 0.85,
        className: 'map-overlay-layer',
      });
      layer.addTo(map);
      currentLayers.set(overlayId, layer);
      mapLog.log(`Overlay ${overlayId} manually added`);
    } catch (error) {
      mapLog.log(`Error manually adding overlay ${overlayId}:`, error);
    }
  };

  // Manual remove overlay
  const removeOverlay = (overlayId: MapOverlayId) => {
    if (!map) return;

    const currentLayers = layersRef.current;
    const layer = currentLayers.get(overlayId);
    if (!layer) return;

    try {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
      currentLayers.delete(overlayId);
      mapLog.log(`Overlay ${overlayId} manually removed`);
    } catch (error) {
      mapLog.log(`Error manually removing overlay ${overlayId}:`, error);
    }
  };

  // Getter for active layers
  const getActiveLayers = () => new Map(layersRef.current);

  return {
    isManaging,
    getActiveLayers,
    addOverlay,
    removeOverlay,
  };
}

export default useMapOverlays;
