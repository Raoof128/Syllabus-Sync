'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useMap } from 'react-leaflet';
import { CAMPUS_CENTER_PIXEL, PIXEL_BOUNDS } from '@/lib/map/constants';
import { pixelToCrsSimple } from '@/lib/map/buildings';
import type { Building } from '@/lib/map/buildings';
import type { Map as LeafletMap } from 'leaflet';
import { devLog } from '@/lib/utils/devLog';

const mapLog = devLog.map;

interface MapControllerProps {
  selectedBuildingProp?: Building;
  setMapInstanceProp: (map: LeafletMap) => void;
  isMapReady: (map: LeafletMap | null) => boolean;
  leafletModule: typeof import('leaflet') | null;
}

/**
 * MapController - Handles map view, zoom, and bounds logic
 *
 * This component should be rendered inside a MapContainer and uses the useMap hook
 * from react-leaflet to control the map instance. It handles:
 * - Initial map setup (center, zoom, bounds)
 * - Smooth transitions to selected buildings
 * - Reduced motion preferences
 *
 * @example
 * <MapContainer>
 *   <MapController
 *     selectedBuildingProp={selectedBuilding}
 *     setMapInstanceProp={setMapInstance}
 *     isMapReady={isMapReady}
 *     leafletModule={leafletModule}
 *   />
 * </MapContainer>
 */
export function MapController({
  selectedBuildingProp,
  setMapInstanceProp,
  isMapReady,
  leafletModule,
}: MapControllerProps) {
  const map = useMap();

  const prefersReducedMotion = useReducedMotion();
  const [isReady, setIsReady] = useState(false);

  // Initial map setup
  useEffect(() => {
    if (!map) return;

    const checkReady = () => {
      if (isMapReady(map)) {
        setIsReady(true);
        setMapInstanceProp(map);
      }
    };

    checkReady();
    map.once('load', checkReady);

    return () => {
      map.off('load', checkReady);
    };
  }, [map, setMapInstanceProp, isMapReady]);

  // Set initial view and bounds
  useEffect(() => {
    if (!isReady || !isMapReady(map)) return;

    try {
      map.setView(CAMPUS_CENTER_PIXEL, 0);
      map.setMaxBounds(PIXEL_BOUNDS);
      map.setMinZoom(-2);
      map.setMaxZoom(2);
    } catch (error) {
      mapLog.log('Map setup error:', error);
    }
  }, [map, isReady, isMapReady]);

  // Fly to selected building
  useEffect(() => {
    if (!isReady || !isMapReady(map) || !selectedBuildingProp) return;

    try {
      const buildingLatLng = pixelToCrsSimple(
        selectedBuildingProp.position[0],
        selectedBuildingProp.position[1],
      );

      // Smooth transition to building (Tier 4: Contextual Animations)
      // Tier 7: Reduced Motion Respect
      const shouldAnimate = !prefersReducedMotion;

      map.flyTo(buildingLatLng, 1, {
        duration: shouldAnimate ? 1.5 : 0,
        easeLinearity: 0.25,
        paddingTopLeft: [0, 0],
        paddingBottomRight: [0, 0],
        animate: shouldAnimate,
      } as import('leaflet').ZoomPanOptions);

      // Open popup if marker exists for this building
      if (leafletModule) {
        map.eachLayer((layer: import('leaflet').Layer) => {
          if (layer instanceof leafletModule.Marker) {
            const marker = layer;
            const popupContent = marker.getPopup()?.getContent();
            if (
              popupContent &&
              typeof popupContent === 'string' &&
              popupContent.includes(selectedBuildingProp.id)
            ) {
              // Slight delay to allow flyTo to start
              setTimeout(() => marker.openPopup(), 800);
            }
          }
        });
      }
    } catch (error) {
      mapLog.log('Building nav error:', error);
    }
  }, [selectedBuildingProp, map, isReady, prefersReducedMotion, leafletModule, isMapReady]);

  return null;
}

export default MapController;
