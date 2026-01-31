import {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { Badge } from '@/components/ui/mq/badge';
import { cn } from '@/lib/utils';
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
import { DebugControls } from './components/DebugControls';

// Map-specific logger
const mapLog = devLog.map;

/** Location tracking status */
export type LocationStatus = 'idle' | 'searching' | 'found' | 'denied' | 'error';

export interface CampusMapRef {
  startNavigation: () => void;
  stopNavigation: () => void;
  isNavigating: boolean;
}

interface CampusMapProps {
  selectedBuilding?: Building;
  activeOverlays?: MapOverlayId[];
  /** Callback when location status changes */
  onLocationStatusChange?: (status: LocationStatus) => void;
}

const CampusMap = forwardRef<CampusMapRef, CampusMapProps>(
  ({ selectedBuilding, activeOverlays = [], onLocationStatusChange }, ref) => {
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
        return createMarkerIcon(leafletModule, isSelected, 'animate-marker-drop-in');
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
    const { locationStatus, origin, isOffCampus, centerOnUser, simulatePosition } = useMapLocation({
      mapInstance,
      leafletModule,
      isMapReady,
      userIcon,
      isNavigating: false,
      navManagerRef,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // 2. Navigation Logic
    const {
      isNavigating,
      routeCoords,
      preview,
      // routeError, // unused in minimal overlay
      navState,
      startNavigation,
      stopNavigation,
    } = useMapNavigation({
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

    // Simulation Logic
    const simulationRef = useRef<NodeJS.Timeout | null>(null);

    const handleSimulate = useCallback(() => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
        simulationRef.current = null;
        return;
      }

      const mockRoute: [number, number][] = [
        [151.1131306, -33.7756994],
        [151.1135164, -33.7738842],
        [151.1134919, -33.7734389],
        [151.1131306, -33.7756994],
      ];

      const points =
        (navState?.routeCoordinates?.length ?? 0) > 0 ? navState!.routeCoordinates : mockRoute;
      let segmentIndex = 0;
      let progress = 0;
      const stepSize = 0.00004;

      simulationRef.current = setInterval(() => {
        if (segmentIndex >= points.length - 1) {
          if (simulationRef.current) {
            clearInterval(simulationRef.current);
            simulationRef.current = null;
          }
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

        simulatePosition?.(curLat, curLng, heading >= 0 ? heading : heading + 360, 1.4);
      }, 50);
    }, [navState, simulatePosition]);

    useEffect(
      () => () => {
        if (simulationRef.current) clearInterval(simulationRef.current);
      },
      [],
    );

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

            // Smooth transition to building (Tier 4: Contextual Animations)
            map.flyTo(buildingLatLng, 1, {
              duration: 1.5,
              easeLinearity: 0.25,
              paddingTopLeft: [0, 0], // Can adjust based on sidebar
              paddingBottomRight: [0, 0],
              animate: true,
            } as import('leaflet').ZoomPanOptions);

            map.eachLayer((layer) => {
              if (layer instanceof leafletModule.Marker) {
                const marker = layer as import('leaflet').Marker;
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
                className="animate-route-dash"
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
          className={cn(
            'absolute z-[1000] p-3 rounded-full shadow-lg transition-all duration-200 bg-white dark:bg-mq-card-background text-mq-primary hover:bg-gray-50 dark:hover:bg-mq-hover-background focus:outline-none focus:ring-2 focus:ring-mq-primary/50',
            selectedBuilding
              ? 'bottom-[220px] right-4 sm:bottom-6 sm:right-[320px]'
              : 'bottom-6 right-4',
          )}
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

        {/* Minimal Instructions Overlay (only when navigating) */}
        {isNavigating && navState && navState.instructions.length > 0 && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] w-full max-w-md px-4 pointer-events-none">
            <div className="bg-mq-card-background border border-mq-border shadow-lg rounded-xl p-4 pointer-events-auto">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold text-lg text-mq-content">
                    {generateNavigationText(
                      navState.instructions[navState.currentInstructionIndex],
                      navState.remainingDistance,
                    )}
                  </div>
                  <div className="text-sm text-mq-content-secondary">
                    Next:{' '}
                    {navState.instructions[navState.currentInstructionIndex + 1]?.text || 'Arrive'}
                  </div>
                </div>
                <button
                  onClick={stopNavigation}
                  className="p-1 rounded-full hover:bg-mq-background-secondary text-mq-content-secondary"
                  aria-label="Stop navigation"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex gap-4 text-sm font-medium text-mq-content-secondary border-t border-mq-border pt-2 mt-2">
                <span>{formatDistance(navState.remainingDistance)}</span>
                <span>{formatETA(navState.eta)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Developer Tools */}
        {process.env.NODE_ENV === 'development' && (
          <DebugControls
            onSimulate={handleSimulate}
            isNavigating={isNavigating}
            navState={navState}
            locationStatus={locationStatus}
            isOffCampus={isOffCampus}
          />
        )}
      </div>
    );
  },
);

CampusMap.displayName = 'CampusMap';

export default CampusMap;
