import { useEffect, useRef, useCallback } from 'react';
import { devLog } from '@/lib/utils/devLog';
import { PIXEL_BOUNDS, MAP_ASSET_VERSION } from '@/lib/map/constants';
import { mapOverlays, type MapOverlayId } from '@/lib/map/mapOverlays';
import type { Map as LeafletMap, ImageOverlay } from 'leaflet';

const mapLog = devLog.map;

interface MapOverlaysProps {
  mapInstance: LeafletMap | null;
  leafletModule: typeof import('leaflet') | null;
  activeOverlays: MapOverlayId[];
  overlaysReady: boolean;
}

// Helper to add cache-busting version to image path
const getVersionedImagePath = (imagePath: string): string => {
  const separator = imagePath.includes('?') ? '&' : '?';
  return `${imagePath}${separator}v=${MAP_ASSET_VERSION}`;
};

// Preload an image and return a promise with high quality settings
const preloadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    // Force high quality decoding
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

export function MapOverlays({
  mapInstance,
  leafletModule,
  activeOverlays,
  overlaysReady,
}: MapOverlaysProps) {
  const activeOverlayRefs = useRef<Map<MapOverlayId, ImageOverlay>>(new Map());
  const preloadedImages = useRef<Map<string, boolean>>(new Map());

  // Preload overlay images when they become active
  const preloadOverlayImage = useCallback(async (imagePath: string) => {
    const versionedPath = getVersionedImagePath(imagePath);
    if (preloadedImages.current.has(versionedPath)) return versionedPath;

    try {
      await preloadImage(versionedPath);
      preloadedImages.current.set(versionedPath, true);
      mapLog.log(`Preloaded overlay image: ${versionedPath}`);
      return versionedPath;
    } catch (error) {
      mapLog.log(`Failed to preload overlay: ${versionedPath}`, error);
      return versionedPath;
    }
  }, []);

  // Active overlay layers (parking, water, etc.)
  useEffect(() => {
    const currentOverlays = activeOverlayRefs.current;
    const clearAllOverlays = () => {
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

    if (!mapInstance || !leafletModule || !overlaysReady) {
      clearAllOverlays();
      return;
    }

    const addOverlays = async () => {
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

        // Add new overlays with preloading
        for (const overlayId of activeOverlays) {
          if (!currentOverlays.has(overlayId)) {
            const overlayConfig = mapOverlays.find((o) => o.id === overlayId);
            if (overlayConfig) {
              // Skip overlays that don't align with base map (different aspect ratio)
              // These would look distorted - better to show a warning or placeholder
              if (!overlayConfig.alignsWithBaseMap) {
                mapLog.log(`Overlay ${overlayId} has different aspect ratio, may appear distorted`);
              }

              // Preload image first for better quality and get versioned path
              const versionedPath = await preloadOverlayImage(overlayConfig.imagePath);

              // Use standard bounds for all overlays that align with base map
              // Start with 0 opacity and fade in for smooth transition
              const overlay = leafletModule.imageOverlay(versionedPath, PIXEL_BOUNDS, {
                opacity: 0, // Start invisible
                className: `map-overlay-layer ${!overlayConfig.alignsWithBaseMap ? 'overlay-different-aspect' : ''}`,
                interactive: false,
                zIndex: 100 + activeOverlays.indexOf(overlayId),
              });

              overlay.addTo(mapInstance);
              currentOverlays.set(overlayId, overlay);

              // Fade in smoothly after adding to map
              requestAnimationFrame(() => {
                setTimeout(() => {
                  overlay.setOpacity(overlayConfig.alignsWithBaseMap ? 0.92 : 0.85);
                }, 50);
              });

              mapLog.log(`Overlay ${overlayId} added with preloaded image`);
            }
          }
        }
      } catch (error) {
        mapLog.log('Error managing active overlays:', error);
      }
    };

    addOverlays();
  }, [mapInstance, leafletModule, overlaysReady, activeOverlays, preloadOverlayImage]);

  // Ensure overlays are cleaned up when component unmounts.
  useEffect(() => {
    const currentOverlays = activeOverlayRefs.current;
    return () => {
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
  }, [mapInstance]);

  return null;
}
