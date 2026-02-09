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
import { Building, BUILDING_CATEGORY_LABELS, getBuildingCrsCoords } from '@/lib/map/buildings';
import { formatDistance, formatDuration } from '@/lib/map/navigationHelpers';
import { createMarkerIcon, createUserLocationIcon } from '@/lib/map/mapUtils';
import {
  generateNavigationText,
  formatETA,
  NavigationStateManager,
} from '@/lib/map/realtimeNavigation';
import { setHapticEnabledGetter } from '@/lib/utils/haptics';
import { useSafeTranslation } from '@/lib/hooks/useSafeTranslation';
import { useLeafletLoader } from '@/lib/hooks/useLeafletLoader';
import { devLog } from '@/lib/utils/devLog';
import type { MapOverlayId } from '@/lib/map/mapOverlays';
import { useMapStore } from '@/lib/store/mapStore';
import { CAMPUS_CENTER_PIXEL, PIXEL_BOUNDS, CAMPUS_IMAGE_URL } from '@/lib/map/constants';
import { gpsToCrsSimple } from '@/lib/map/geospatialCalibration';
import { useMapLocation } from './hooks/useMapLocation';
import { useMapNavigation } from './hooks/useMapNavigation';
import { MapOverlays } from './components/MapOverlays';
import { MapController } from './components/MapController';

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
  /** Callback when navigation state changes (for RouteAnnouncer) */
  onNavStateChange?: (state: {
    isNavigating: boolean;
    remainingDistance?: number;
    status?: 'idle' | 'navigating' | 'arrived' | 'off-route' | 'recalculating' | 'error';
  }) => void;
  /** Callback when map is fully ready (for smooth loading transitions) */
  onMapReady?: () => void;
}

const CampusMap = forwardRef<CampusMapRef, CampusMapProps>(
  (
    { selectedBuilding, activeOverlays = [], onLocationStatusChange, onNavStateChange, onMapReady },
    ref,
  ) => {
    const { t, safeT } = useSafeTranslation();

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
    const [overlayUrl, setOverlayUrl] = useState<string | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const navManagerRef = useRef<NavigationStateManager | null>(null);
    const hasNotifiedReadyRef = useRef(false);

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
    const selectedIndicatorIcon = useMemo(() => {
      if (!leafletModule) return null;
      return leafletModule.divIcon({
        className: 'selected-building-indicator-wrapper',
        html: '<span class="selected-building-indicator"></span>',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
    }, [leafletModule]);

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

    // Get building coordinates helper (uses GCP-calibrated offset)
    const getBuildingLatLng = useCallback((building: Building): { lat: number; lng: number } => {
      return getBuildingCrsCoords(building);
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
      navManagerRef,
    });

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

    // Notify parent of location status
    useEffect(() => {
      onLocationStatusChange?.(locationStatus);
    }, [locationStatus, onLocationStatusChange]);

    // Notify parent of navigation state changes (for RouteAnnouncer)
    useEffect(() => {
      onNavStateChange?.({
        isNavigating,
        remainingDistance: navState?.remainingDistance,
        status: navState?.status,
      });
    }, [isNavigating, navState, onNavStateChange]);

    // ============================================
    // OVERLAYS READY EFFECT
    // ============================================
    const mapValid = !!mapInstance && isMapReady(mapInstance);

    useEffect(() => {
      if (!mapValid || !mapInstance) {
        return;
      }
      if (!hasNotifiedReadyRef.current) {
        hasNotifiedReadyRef.current = true;
        onMapReady?.();
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
    }, [mapValid, mapInstance, isMapReady, isMountedRef, onMapReady]);

    // ============================================
    // RENDER
    // ============================================
    useEffect(() => {
      let revokedUrl: string | null = null;
      let active = true;

      const fetchImage = async () => {
        try {
          const response = await fetch(CAMPUS_IMAGE_URL, { cache: 'no-store' });
          if (!active) return;
          if (!response.ok) return;
          const blob = await response.blob();
          if (!active) return;

          const objectUrl = URL.createObjectURL(blob);
          revokedUrl = objectUrl;

          // Preload the image to ensure it's fully decoded before passing to Leaflet
          await new Promise<void>((resolve, reject) => {
            const img = new globalThis.Image();
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Image preload failed'));
            img.src = objectUrl;
          });

          if (!active) return;
          setOverlayUrl(objectUrl);
        } catch (error) {
          if (!active) return;
          mapLog.log('Campus image fetch failed:', error);
        }
      };

      fetchImage();

      return () => {
        active = false;
        if (revokedUrl) {
          URL.revokeObjectURL(revokedUrl);
        }
      };
    }, []);

    return (
      <div
        ref={mapContainerRef}
        className="relative w-full h-full"
        role="region"
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
              {t('navigationProgressAnnouncement', {
                distance: formatDistance(navState.remainingDistance),
                eta: formatETA(navState.eta),
              })}
            </span>
          )}
          {navState?.status === 'arrived' && <span>{t('navigationArrived')}</span>}
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
        {isClientReady && reactLeafletModule && leafletModule ? (
          <reactLeafletModule.MapContainer
            key={`map-${mapKey}`}
            crs={leafletModule.CRS.Simple}
            center={CAMPUS_CENTER_PIXEL}
            zoom={0}
            zoomControl
            scrollWheelZoom
            doubleClickZoom="center"
            touchZoom
            dragging
            zoomSnap={0.5}
            zoomDelta={0.5}
            inertia
            inertiaDeceleration={3000}
            maxBoundsViscosity={1.0}
            style={{ height: '100%', width: '100%' }}
          >
            <MapController
              selectedBuilding={selectedBuilding}
              setMapInstance={setMapInstance}
              reactLeafletModule={reactLeafletModule}
              leafletModule={leafletModule}
            />

            {/* Base Campus Layer */}
            {overlayUrl && (
              <reactLeafletModule.ImageOverlay
                key={overlayUrl}
                url={overlayUrl}
                bounds={PIXEL_BOUNDS}
                opacity={1}
                eventHandlers={{
                  load: () => {
                    mapLog.log('Campus map image loaded successfully');
                  },
                  error: () => {
                    mapLog.error('Campus map image failed to load:', CAMPUS_IMAGE_URL);
                  },
                }}
              />
            )}

            {/* Overlays */}
            <MapOverlays
              reactLeafletModule={reactLeafletModule}
              activeOverlays={activeOverlays}
              overlaysReady={overlaysReady}
            />

            {/* Route Polyline */}
            {overlaysReady && routeCoords.length >= 2 && (
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

            {/* Building Markers — only show marker for selected building */}
            {overlaysReady && selectedBuilding && selectedIcon && (
              <reactLeafletModule.Marker
                key={selectedBuilding.id}
                position={getBuildingLatLng(selectedBuilding)}
                icon={selectedIcon}
                riseOnHover
                riseOffset={420}
                zIndexOffset={1000}
              >
                <reactLeafletModule.Popup>
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
                          {t(BUILDING_CATEGORY_LABELS[selectedBuilding.category])}
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

            {/* Selected building location indicator */}
            {overlaysReady && selectedBuilding && selectedIndicatorIcon && (
              <reactLeafletModule.Marker
                position={getBuildingLatLng(selectedBuilding)}
                icon={selectedIndicatorIcon}
                interactive={false}
                keyboard={false}
                zIndexOffset={900}
              />
            )}
          </reactLeafletModule.MapContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-mq-background-secondary">
            <span className="animate-pulse text-mq-content-secondary">{t('loadingMap')}</span>
          </div>
        )}

        {/* Floating Action Button - Center on User - Positioned above zoom controls */}
        <button
          onClick={centerOnUser}
          className={cn(
            'absolute z-[1000] p-3 rounded-full shadow-lg transition-all duration-200 bg-mq-card-background text-mq-primary hover:bg-mq-hover-background focus:outline-none focus:ring-2 focus:ring-mq-primary/50',
            // Position above zoom controls (which are at bottom-right)
            // On mobile: above the selected building card if present
            // On desktop: always in bottom-right corner above zoom
            selectedBuilding
              ? 'bottom-[280px] right-4 sm:bottom-[140px] sm:right-4'
              : 'bottom-[140px] right-4',
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
                    {t('next')}:{' '}
                    {navState.instructions[navState.currentInstructionIndex + 1]?.text ||
                      t('arrive')}
                  </div>
                </div>
                <button
                  onClick={stopNavigation}
                  className="p-1 rounded-full hover:bg-mq-background-secondary text-mq-content-secondary"
                  aria-label={t('stopNavigation')}
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
      </div>
    );
  },
);

CampusMap.displayName = 'CampusMap';

export default CampusMap;
