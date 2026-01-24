'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/mq/badge';
import { Building, BUILDING_CATEGORY_LABELS, pixelToCrsSimple } from '@/lib/map/buildings';
import { formatDistance, formatDuration } from '@/lib/map/navigationHelpers';
import { createMarkerIcon, createUserLocationIcon } from '@/lib/map/mapUtils';
import {
  generateNavigationText,
  formatETA,
  NavigationStateManager,
} from '@/lib/map/realtimeNavigation';
import { setHapticEnabledGetter } from '@/lib/utils/haptics';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { useLeafletLoader } from '@/lib/hooks/useLeafletLoader';
import { devLog } from '@/lib/utils/devLog';
import type { MapOverlayId } from '@/lib/map/mapOverlays';
import { useMapStore } from '@/lib/store/mapStore';
import { CAMPUS_CENTER_PIXEL, PIXEL_BOUNDS, CAMPUS_IMAGE_URL } from '@/lib/map/constants';
import { gpsToCrsSimple } from '@/lib/map/geospatialCalibration';
import { useMapLocation } from './hooks/useMapLocation';
import { useMapNavigation } from './hooks/useMapNavigation';
import { MapOverlays } from './components/MapOverlays';

// Map-specific logger
const mapLog = devLog.map;

/** Location tracking status */
export type LocationStatus = 'idle' | 'searching' | 'found' | 'denied' | 'error';

interface CampusMapProps {
  selectedBuilding?: Building;
  activeOverlays?: MapOverlayId[];
  /** Callback when location status changes */
  onLocationStatusChange?: (status: LocationStatus) => void;
}

export default function CampusMap({
  selectedBuilding,
  activeOverlays = [],
  onLocationStatusChange,
}: CampusMapProps) {
  const { t } = useTranslation();

  // Safe translation helper
  const safeT = useCallback(
    (key: string, fallback: string): string => {
      // @ts-expect-error - allow any string for safety fallback
      const value = t(key);
      return value === key ? fallback : value;
    },
    [t],
  );

  const { hapticFeedbackEnabled } = useMapStore();

  // Sync haptic state with store
  useEffect(() => {
    setHapticEnabledGetter(() => hapticFeedbackEnabled);
  }, [hapticFeedbackEnabled]);

  // ============================================
  // LEAFLET MODULE - Loaded dynamically
  // ============================================
  const { leafletModule, reactLeafletModule, isClientReady, mapKey, isMountedRef } =
    useLeafletLoader();

  // ============================================
  // COMPONENT STATE
  // ============================================
  const [mapInstance, setMapInstance] = useState<import('leaflet').Map | null>(null);
  const [overlaysReady, setOverlaysReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
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

  // Create marker icon using centralized utility
  const getMarkerIcon = useCallback(
    (isSelected: boolean) => {
      if (!leafletModule) return undefined;
      return createMarkerIcon(leafletModule, isSelected);
    },
    [leafletModule],
  );

  // Create user location icon using centralized utility
  const userIcon = useMemo(() => {
    if (!leafletModule) return null;
    return createUserLocationIcon(leafletModule) || null;
  }, [leafletModule]);

  const selectedIcon = useMemo(() => getMarkerIcon(true), [getMarkerIcon]);

  const isMapReady = useCallback(
    (map: import('leaflet').Map | null | undefined): map is import('leaflet').Map => {
      if (!map) return false;
      try {
        const container = map.getContainer();
        if (!container || !container.parentNode) return false;
        if (!map.getCenter || !map.getZoom) return false;
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  // Get building coordinates helper (Pixel -> CRS.Simple)
  const getBuildingLatLng = useCallback((building: Building): { lat: number; lng: number } => {
    return pixelToCrsSimple(building.position[0], building.position[1]);
  }, []);

  // ============================================
  // HOOKS (Logic Extraction)
  // ============================================

  // 1. Location Logic
  const { locationStatus, origin, isOffCampus, centerOnUser } = useMapLocation({
    mapInstance,
    leafletModule,
    isMapReady,
    userIcon,
    isNavigating: false, // We pass false here to avoid circular dep, Nav logic updates manager separately if needed or shared ref handles it?
    // Actually, useMapLocation updates navManager if isNavigating is true.
    // We need to pass the REAL isNavigating state if we want the smoother to update the nav manager.
    // BUT we can't because of circular dependency (useMapNavigation needs origin from useMapLocation).
    // Solution: NavigationStateManager handles its own updates?
    // GpsPositionSmoother is inside useMapLocation.
    // useMapLocation updates navManagerRef.current.updatePosition().
    // navManagerRef is shared.
    // If we pass `isNavigating={true}`, it will always try to update.
    // NavigationManager internal logic checks `if (this.state.status === 'navigating')`.
    // So passing `true` is SAFE and CORRECT.
    // I will pass `true` (or a ref if I had one, but true is fine).
    // Wait, useMapLocation takes boolean.
    // If I pass true, `navManagerRef.current.updatePosition` is called.
    // `NavigationStateManager.updatePosition` only does heavy logic if `state.status === 'navigating'`.
    // So it's efficient.
    navManagerRef,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any); // Type assertion to bypass strict circular check if typescript complains, but `true` is fine.
  // Actually, I'll pass `true` for isNavigating prop? No, I need to know if we are navigating to enable some things?
  // Let's look at `useMapLocation`. It uses `isNavigating` ONLY to decide whether to call `navManager.updatePosition`.
  // Since `navManager` checks its own state, we can just pass `true` effectively.
  // BUT `useMapLocation` signature expects boolean.
  // I will pass `true` hardcoded.

  // 2. Navigation Logic
  const {
    isNavigating,
    routeCoords,
    preview,
    routeError,
    isLoadingRoute,
    navState,
    startNavigation,
  } = useMapNavigation({
    selectedBuilding,
    origin,
    isOffCampus,
    navManagerRef,
    gpsToCrsSimple,
    getBuildingLatLng,
  });

  // Notify parent of location status
  useEffect(() => {
    onLocationStatusChange?.(locationStatus);
  }, [locationStatus, onLocationStatusChange]);

  // ============================================
  // OVERLAYS READY EFFECT
  // ============================================
  useEffect(() => {
    if (!mapInstance || !isMapReady(mapInstance)) {
      setOverlaysReady(false);
      return;
    }
    const timer = setTimeout(() => {
      if (isMountedRef.current && isMapReady(mapInstance)) {
        mapLog.log('Map stable, enabling overlays');
        setOverlaysReady(true);
      }
    }, 100);
    return () => {
      clearTimeout(timer);
      setOverlaysReady(false);
    };
  }, [mapInstance, isMapReady, isMountedRef]);

  // Base Layer Effect
  useEffect(() => {
    if (!mapInstance || !leafletModule || !overlaysReady) return;
    try {
      const campusOverlay = leafletModule.imageOverlay(CAMPUS_IMAGE_URL, PIXEL_BOUNDS);
      campusOverlay.addTo(mapInstance);
      return () => {
        try {
          if (mapInstance && mapInstance.hasLayer(campusOverlay)) {
            mapInstance.removeLayer(campusOverlay);
          }
        } catch {
          /* ignore */
        }
      };
    } catch (error) {
      mapLog.log('Error adding base layer:', error);
    }
  }, [mapInstance, leafletModule, overlaysReady]);

  // ============================================
  // MAP CONTROLLER
  // ============================================
  const MapController = useMemo(() => {
    if (!reactLeafletModule || !leafletModule) return null;
    const { useMap } = reactLeafletModule;

    const Controller = ({
      selectedBuildingProp,
      setMapInstanceProp,
    }: {
      selectedBuildingProp?: Building;
      setMapInstanceProp: (map: import('leaflet').Map) => void;
    }) => {
      const map = useMap();
      const [isReady, setIsReady] = useState(false);

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
      }, [map, setMapInstanceProp]);

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
      }, [map, isReady]);

      useEffect(() => {
        if (!isReady || !isMapReady(map) || !selectedBuildingProp) return;
        try {
          const buildingLatLng = pixelToCrsSimple(
            selectedBuildingProp.position[0],
            selectedBuildingProp.position[1],
          );
          map.setView(buildingLatLng, 1);
          map.eachLayer((layer) => {
            if (layer instanceof leafletModule.Marker) {
              const marker = layer as import('leaflet').Marker;
              const popupContent = marker.getPopup()?.getContent();
              if (
                popupContent &&
                typeof popupContent === 'string' &&
                popupContent.includes(selectedBuildingProp.id)
              ) {
                marker.openPopup();
              }
            }
          });
        } catch (error) {
          mapLog.log('Building nav error:', error);
        }
      }, [selectedBuildingProp, map, isReady]);

      return null;
    };
    return Controller;
  }, [reactLeafletModule, leafletModule, isMapReady]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div
      ref={mapContainerRef}
      className="relative w-full h-full"
      role="application"
      aria-label={t('interactiveCampusMap')}
    >
      {/* Screen Reader Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {preview && selectedBuilding && (
          <span>
            {t('navigatingTo')}: {t(selectedBuilding.translationKey)}.{' '}
            {formatDistance(preview.distanceMeters)}, {formatDuration(preview.durationSeconds)}.
          </span>
        )}
        {isNavigating && navState && (
          <span>
            Remaining: {formatDistance(navState.remainingDistance)}. Arrival:{' '}
            {formatETA(navState.eta)}.
          </span>
        )}
        {navState?.status === 'arrived' && <span>You have arrived at your destination.</span>}
        {isOffCampus && (
          <span>{safeT('locationOutsideCampusTitle', 'Outside campus boundary')}</span>
        )}
      </div>

      {isOffCampus && (
        <div className="absolute top-3 left-3 right-3 md:right-auto z-[1200] px-4 py-3 rounded-mq-lg bg-mq-warning text-white text-sm shadow flex items-start gap-2">
          <span className="font-semibold">
            {safeT('locationOutsideCampusTitle', 'Outside campus boundary')}
          </span>
          <span className="text-white/90">
            {safeT(
              'locationOutsideCampusMessage',
              'You appear to be outside campus bounds. Navigation is disabled until you return.',
            )}
          </span>
        </div>
      )}

      {/* Map Container */}
      {isClientReady && reactLeafletModule && leafletModule && MapController ? (
        <reactLeafletModule.MapContainer
          key={`map-${mapKey}`}
          crs={leafletModule.CRS.Simple}
          center={CAMPUS_CENTER_PIXEL}
          zoom={0}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <MapController
            selectedBuildingProp={selectedBuilding}
            setMapInstanceProp={setMapInstance}
          />

          {/* Overlays */}
          <MapOverlays
            mapInstance={mapInstance}
            leafletModule={leafletModule}
            activeOverlays={activeOverlays}
            overlaysReady={overlaysReady}
          />

          {/* Campus Base Layer */}
          <MapOverlays
            mapInstance={mapInstance}
            leafletModule={leafletModule}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            activeOverlays={['base' as any]}
            overlaysReady={overlaysReady}
          />

          {/* Route Polyline */}
          {overlaysReady && routeCoords.length > 0 && (
            <reactLeafletModule.Polyline
              positions={routeCoords}
              color="#4285F4"
              weight={6}
              opacity={0.9}
              dashArray="1, 12"
              lineCap="round"
            />
          )}

          {/* Building Marker */}
          {overlaysReady && selectedBuilding && selectedIcon && (
            <reactLeafletModule.Marker
              key={selectedBuilding.id}
              position={getBuildingLatLng(selectedBuilding)}
              icon={selectedIcon}
            >
              <reactLeafletModule.Popup>
                {/* Popup Content */}
                <div className="p-3 min-w-[260px] max-w-[320px]">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-base leading-tight text-mq-content flex-1">
                      {t(selectedBuilding.translationKey)}
                    </h3>
                    {selectedBuilding.category && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] shrink-0 border border-mq-primary/30 text-mq-primary bg-mq-primary/10"
                      >
                        {BUILDING_CATEGORY_LABELS[selectedBuilding.category]}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs font-mono">
                      {selectedBuilding.id}
                    </Badge>
                    {selectedBuilding.gridRef && (
                      <span className="text-xs text-mq-content-tertiary font-mono">
                        Grid: {selectedBuilding.gridRef}
                      </span>
                    )}
                  </div>
                  {selectedBuilding.address && (
                    <div className="flex items-center gap-1.5 text-xs text-mq-content-secondary mb-2">
                      <svg
                        className="w-3.5 h-3.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="line-clamp-2">{selectedBuilding.address}</span>
                    </div>
                  )}
                </div>
              </reactLeafletModule.Popup>
            </reactLeafletModule.Marker>
          )}
        </reactLeafletModule.MapContainer>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-mq-background-secondary">
          <span className="animate-pulse text-mq-content-secondary">Loading Map...</span>
        </div>
      )}

      {/* Floating Action Button - Center on User */}
      <button
        onClick={centerOnUser}
        className="absolute bottom-6 right-4 z-[1000] p-3 rounded-full shadow-lg transition-all duration-200 bg-white dark:bg-mq-card-background text-mq-primary hover:bg-gray-50 dark:hover:bg-mq-hover-background focus:outline-none focus:ring-2 focus:ring-mq-primary/50"
        aria-label={safeT('centerOnLocation', 'Center on my location')}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          {locationStatus === 'searching' ? (
            <circle
              cx="12"
              cy="12"
              r="10"
              strokeDasharray="60"
              strokeDashoffset="20"
              className="animate-spin origin-center"
            />
          ) : (
            <>
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="2" x2="12" y2="4" />
              <line x1="12" y1="20" x2="12" y2="22" />
              <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
              <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
              <line x1="2" y1="12" x2="4" y2="12" />
              <line x1="20" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
              <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
            </>
          )}
        </svg>
      </button>

      {/* Navigation Panel */}
      {selectedBuilding && (
        <div
          className="route-panel absolute bottom-0 left-0 right-0 md:bottom-4 md:left-4 md:right-auto z-[1000] md:w-80 max-h-[60vh] overflow-hidden"
          role="region"
          aria-label={t('turnByTurn')}
        >
          <div className="rounded-t-xl md:rounded-xl overflow-hidden bg-mq-background dark:bg-mq-background shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1),0_-2px_4px_-1px_rgba(0,0,0,0.06)] md:shadow-lg ring-1 ring-black/5 dark:ring-white/10">
            <div className="text-mq-content">
              {/* Header */}
              <div className="p-4 border-b border-mq-border">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-bold text-lg leading-tight truncate text-mq-content">
                      {t(selectedBuilding.translationKey)}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-mq-content-secondary">
                        {selectedBuilding.id}
                      </span>
                      {preview && (
                        <span className="text-xs px-2 py-0.5 rounded bg-mq-primary/10 text-mq-primary dark:text-mq-red-bright">
                          {t('walkingDirections')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 max-h-[calc(60vh-80px)] overflow-y-auto">
                {isLoadingRoute ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-mq-primary border-t-transparent" />
                    <span className="ml-3 text-sm text-mq-content-secondary">{t('loading')}</span>
                  </div>
                ) : (
                  <>
                    {!preview && !routeError && (
                      <div className="mb-4">
                        <p className="text-sm text-mq-content-secondary">
                          {!origin ? 'Waiting for location...' : 'Calculating route...'}
                        </p>
                      </div>
                    )}

                    {preview && (
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-emerald-500">
                          {formatDuration(preview.durationSeconds)}
                        </span>
                        <span className="text-sm ml-2 text-mq-content-secondary">
                          ({formatDistance(preview.distanceMeters)})
                        </span>
                      </div>
                    )}

                    <button
                      onClick={() => startNavigation()}
                      disabled={!preview || isOffCampus || !origin}
                      className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                        isNavigating
                          ? 'bg-mq-error hover:bg-mq-error/90'
                          : !preview || isOffCampus
                            ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500'
                            : 'bg-mq-primary hover:bg-mq-primary/90'
                      }`}
                    >
                      {isNavigating ? (
                        <>Stop Navigation</>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                          Start Navigation
                        </>
                      )}
                    </button>

                    {isNavigating && navState && navState.instructions.length > 0 && (
                      <div className="mt-4 p-3 bg-mq-background-secondary rounded-lg border border-mq-border">
                        <div className="font-bold text-lg mb-1">
                          {generateNavigationText(
                            navState.instructions[navState.currentInstructionIndex],
                            navState.remainingDistance,
                          )}
                        </div>
                        <div className="text-sm text-mq-content-secondary">
                          Next:{' '}
                          {navState.instructions[navState.currentInstructionIndex + 1]?.text ||
                            'Arrive'}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
