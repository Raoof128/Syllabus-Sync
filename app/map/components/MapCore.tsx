'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Building } from '@/lib/map/buildings';
import type { MapOverlayId } from '@/lib/map/mapOverlays';
import { useLeafletLoader } from '@/lib/hooks/useLeafletLoader';
import { useMapLocation } from '../hooks/useMapLocation';
import { useMapNavigation } from '../hooks/useMapNavigation';
import { useMapSimulation } from '../hooks/useMapSimulation';
import { MapController } from './MapController';
import { MapOverlays } from './MapOverlays';
import { createMarkerIcon, createUserLocationIcon } from '@/lib/map/mapUtils';
import { pixelToCrsSimple } from '@/lib/map/buildings';
import { gpsToCrsSimple } from '@/lib/map/geospatialCalibration';
import { NavigationStateManager } from '@/lib/map/realtimeNavigation';
import { CAMPUS_CENTER_PIXEL } from '@/lib/map/constants';
import { useRef, useEffect } from 'react';

import type { LocationStatus, CampusMapRef } from '../CampusMap';
import { forwardRef, useImperativeHandle } from 'react';
import type { Map as LeafletMap } from 'leaflet';

interface MapCoreProps {
  selectedBuilding?: Building;
  activeOverlays?: MapOverlayId[];
  onLocationStatusChange?: (status: LocationStatus) => void;
}

/**
 * MapCore - Pure Leaflet wrapper component
 *
 * This is a "dumb" component that only cares about receiving props and rendering Leaflet.
 * All logic is handled through custom hooks:
 * - useMapLocation: GPS location tracking
 * - useMapNavigation: Route calculation and navigation
 * - useMapSimulation: Dev-only GPS simulation (tree-shaken in prod)
 *
 * The MapController component handles map view, zoom, and bounds.
 *
 * @example
 * <MapCore
 *   selectedBuilding={selectedBuilding}
 *   activeOverlays={['parking', 'water']}
 *   onLocationStatusChange={setLocationStatus}
 * />
 */
const MapCore = forwardRef<CampusMapRef, MapCoreProps>(
  ({ selectedBuilding, activeOverlays = [], onLocationStatusChange }, ref) => {
    // ============================================
    // LEAFLET MODULE - Loaded dynamically
    // ============================================
    const { leafletModule, reactLeafletModule, isClientReady, isMountedRef } = useLeafletLoader();

    // ============================================
    // COMPONENT STATE
    // ============================================
    const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
    const [overlaysReady, setOverlaysReady] = useState(false);
    const navManagerRef = useRef<NavigationStateManager | null>(null);

    // Initialize Navigation Manager
    useEffect(() => {
      navManagerRef.current = new NavigationStateManager();
      return () => {
        if (navManagerRef.current) {
          navManagerRef.current.stopNavigation();
          navManagerRef.current = null;
        }
      };
    }, []);

    // Helper to check if map is ready
    const isMapReady = useCallback((map: LeafletMap | null | undefined): map is LeafletMap => {
      if (!map) return false;
      try {
        const container = map.getContainer();
        if (!container || !container.parentNode) return false;
        if (!map.getCenter || !map.getZoom) return false;
        return true;
      } catch {
        return false;
      }
    }, []);

    // Get building coordinates helper (Pixel -> CRS.Simple)
    const getBuildingLatLng = useCallback((building: Building): { lat: number; lng: number } => {
      return pixelToCrsSimple(building.position[0], building.position[1]);
    }, []);

    // ============================================
    // HOOKS (Logic Extraction)
    // ============================================

    // Create marker icons
    const getMarkerIcon = useCallback(
      (isSelected: boolean) => {
        if (!leafletModule) return undefined;
        return createMarkerIcon(leafletModule, isSelected, 'animate-marker-drop-in');
      },
      [leafletModule],
    );

    const userIcon = useMemo(() => {
      if (!leafletModule) return null;
      return createUserLocationIcon(leafletModule) || null;
    }, [leafletModule]);

    const selectedIcon = useMemo(() => getMarkerIcon(true), [getMarkerIcon]);

    // 1. Location Logic
    const { locationStatus, origin, isOffCampus, simulatePosition } = useMapLocation({
      mapInstance,
      leafletModule,
      isMapReady,
      userIcon,
      navManagerRef,
    });

    // 2. Navigation Logic
    const { isNavigating, routeCoords, navState, startNavigation, stopNavigation } =
      useMapNavigation({
        selectedBuilding,
        origin,
        isOffCampus,
        navManagerRef,
        gpsToCrsSimple,
        getBuildingLatLng,
      });

    // Expose navigation control to parent
    useImperativeHandle(ref, () => ({
      startNavigation,
      stopNavigation,
      isNavigating,
    }));

    // 3. Dev-only simulation (tree-shaken in prod if set up right)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { startSimulation, stopSimulation } = useMapSimulation({
      enabled: process.env.NODE_ENV === 'development',
      routeCoordinates: navState?.routeCoordinates,
      onUpdate: simulatePosition,
    });

    // Notify parent of location status
    useEffect(() => {
      onLocationStatusChange?.(locationStatus);
    }, [locationStatus, onLocationStatusChange]);

    // Overlays ready effect - synchronize map ready state
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
      if (!mapInstance || !isMapReady(mapInstance)) {
        setOverlaysReady(false);
        return;
      }
      const timer = setTimeout(() => {
        if (isMountedRef.current && isMapReady(mapInstance)) {
          setOverlaysReady(true);
        }
      }, 100);
      return () => {
        clearTimeout(timer);
        setOverlaysReady(false);
      };
    }, [mapInstance, isMapReady, isMountedRef]);
    /* eslint-enable react-hooks/set-state-in-effect */

    // ============================================
    // RENDER
    // ============================================
    if (!isClientReady || !reactLeafletModule || !leafletModule) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-mq-background-secondary">
          <span className="animate-pulse text-mq-content-secondary">Loading Map...</span>
        </div>
      );
    }

    const { MapContainer, Marker, Popup, Polyline } = reactLeafletModule;

    return (
      <MapContainer
        crs={leafletModule.CRS.Simple}
        center={CAMPUS_CENTER_PIXEL}
        zoom={0}
        zoomControl={false}
        scrollWheelZoom={false}
        doubleClickZoom="center"
        inertia
        inertiaDeceleration={3000}
        maxBoundsViscosity={0.5}
        style={{ height: '100%', width: '100%' }}
      >
        <MapController
          selectedBuildingProp={selectedBuilding}
          setMapInstanceProp={setMapInstance}
          isMapReady={isMapReady}
          leafletModule={leafletModule}
        />

        {/* Overlays */}
        <MapOverlays
          mapInstance={mapInstance}
          leafletModule={leafletModule}
          activeOverlays={activeOverlays}
          overlaysReady={overlaysReady}
        />

        {/* Route Polyline */}
        {overlaysReady && routeCoords.length > 0 && (
          <Polyline
            positions={routeCoords}
            color="#4285F4"
            weight={6}
            opacity={0.9}
            dashArray="1, 12"
            lineCap="round"
            className="animate-route-dash"
          />
        )}

        {/* Building Marker */}
        {overlaysReady && selectedBuilding && selectedIcon && (
          <Marker
            key={selectedBuilding.id}
            position={getBuildingLatLng(selectedBuilding)}
            icon={selectedIcon}
          >
            <Popup>
              <div className="p-3 min-w-[260px] max-w-[320px]">
                <h3 className="font-bold text-base mb-2">{selectedBuilding.name}</h3>
                <p className="text-sm text-gray-600">{selectedBuilding.description}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    );
  },
);

MapCore.displayName = 'MapCore';

export default MapCore;
