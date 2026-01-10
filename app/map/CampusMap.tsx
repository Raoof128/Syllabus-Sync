'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/mq/badge';
import { Building, BUILDING_CATEGORY_LABELS } from '@/lib/map/buildings';
import {
  RoutePreview,
  formatDistance,
  formatDuration,
  openBestNavApp,
} from '@/lib/map/navigationHelpers';
import { fetchORSRoute } from '@/lib/services/ors';
import { toastUtils } from '@/lib/utils/toast';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { errorHandler } from '@/lib/utils/errorHandling';
import { devLog } from '@/lib/utils/devLog';
import type { TranslationKey } from '@/lib/i18n/translations';
import type { MapOverlayId } from '@/lib/map/mapOverlays';

// Map-specific logger
const mapLog = devLog.map;

// Map dimensions (image size)
const MAP_WIDTH = 4678;
const MAP_HEIGHT = 3307;

// Campus image path
const CAMPUS_IMAGE_URL = '/maps/raster/mq-campus.png';

// Macquarie University coordinates - aligned with OpenStreetMap data
// OSM bounding box: S:-33.7812113, N:-33.7674824, W:151.1052677, E:151.1203710
// Adjusted to match the campus map image overlay precisely
// The map image covers a slightly larger area than the campus itself
const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [-33.7825, 151.1045], // southwest (bottom-left) - slightly expanded
  [-33.7655, 151.1225], // northeast (top-right) - slightly expanded
];

// Fallback origin (Central Courtyard/Campus Hub - from OSM)
const CAMPUS_CENTRE = { lat: -33.7742, lng: 151.1127 };

// Overlay image paths
const OVERLAY_PATHS: Record<MapOverlayId, string> = {
  parking: '/maps/overlays/Campus-Map_parking.png',
  water: '/maps/overlays/Drinking-water.png',
  accessibility: '/maps/overlays/map_accessibility.png',
  permits: '/maps/overlays/map_special_permits_service_vehicles.png',
  exam: '/maps/overlays/Exam-Map-S22024.png',
};

interface CampusMapProps {
  selectedBuilding?: Building;
  coordPickerMode: boolean;
  onMapClick: (e: { latlng: { lat: number; lng: number } }) => void;
  activeOverlays?: MapOverlayId[];
}

export default function CampusMap({
  selectedBuilding,
  coordPickerMode,
  onMapClick,
  activeOverlays = [],
}: CampusMapProps) {
  const { t } = useTranslation();

  // ============================================
  // LEAFLET MODULE STATE - Loaded dynamically on client only
  // ============================================
  const [leafletModule, setLeafletModule] = useState<typeof import('leaflet') | null>(null);
  const [reactLeafletModule, setReactLeafletModule] = useState<{
    MapContainer: typeof import('react-leaflet').MapContainer;
    Marker: typeof import('react-leaflet').Marker;
    Popup: typeof import('react-leaflet').Popup;
    Polyline: typeof import('react-leaflet').Polyline;
    useMap: typeof import('react-leaflet').useMap;
    useMapEvents: typeof import('react-leaflet').useMapEvents;
  } | null>(null);

  // ============================================
  // COMPONENT STATE
  // ============================================
  const [mapInstance, setMapInstance] = useState<import('leaflet').Map | null>(null);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isClientReady, setIsClientReady] = useState(false);
  const [overlaysReady, setOverlaysReady] = useState(false);
  const [mapKey, setMapKey] = useState(0); // Key to force remount on HMR
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  // Hybrid Navigation State
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [preview, setPreview] = useState<RoutePreview | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Location Status State
  const [locationStatus, setLocationStatus] = useState<'searching' | 'found' | 'denied' | 'error'>(
    'searching',
  );

  const userMarkerRef = useRef<import('leaflet').Marker | null>(null);
  const accuracyCircleRef = useRef<import('leaflet').Circle | null>(null);
  const hasSetFallbackOrigin = useRef(false);

  // ============================================
  // LOAD LEAFLET MODULES ON CLIENT SIDE ONLY
  // ============================================
  useEffect(() => {
    isMountedRef.current = true;

    const loadLeaflet = async () => {
      try {
        // Import CSS first (using dynamic import for CSS modules)
        // @ts-expect-error - CSS imports don't have type declarations
        await import('leaflet/dist/leaflet.css');
        // @ts-expect-error - CSS imports don't have type declarations
        await import('leaflet-routing-machine/dist/leaflet-routing-machine.css');

        // Import Leaflet
        const L = await import('leaflet');

        // Import react-leaflet components
        const RL = await import('react-leaflet');

        if (!isMountedRef.current) return;

        // Fix default marker icons
        delete (L.default.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
          ._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: '/images/leaflet/marker-icon-2x.png',
          iconUrl: '/images/leaflet/marker-icon.png',
          shadowUrl: '/images/leaflet/marker-shadow.png',
        });

        setLeafletModule(L.default as unknown as typeof import('leaflet'));
        setReactLeafletModule({
          MapContainer: RL.MapContainer,
          Marker: RL.Marker,
          Popup: RL.Popup,
          Polyline: RL.Polyline,
          useMap: RL.useMap,
          useMapEvents: RL.useMapEvents,
        });

        // Generate new key to force clean mount
        setMapKey((prev) => prev + 1);

        // Small delay to ensure everything is ready
        setTimeout(() => {
          if (isMountedRef.current && mapContainerRef.current) {
            setIsClientReady(true);
          }
        }, 100);
      } catch (error) {
        mapLog.log('Failed to load Leaflet modules:', error);
        errorHandler.logError(
          error instanceof Error ? error : new Error('Failed to load map modules'),
          'Map Loading',
          'medium',
        );
      }
    };

    loadLeaflet();

    return () => {
      isMountedRef.current = false;
      setOverlaysReady(false);
      setIsClientReady(false);
    };
  }, []);

  // ============================================
  // HELPER FUNCTIONS (use L from state)
  // ============================================
  const pixelToLatLng = useCallback(
    (x: number, y: number): { lat: number; lng: number } => {
      if (!leafletModule) {
        // Fallback calculation without Leaflet
        const xNorm = x / MAP_WIDTH;
        const yNorm = (MAP_HEIGHT - y) / MAP_HEIGHT;
        const lat = CAMPUS_BOUNDS[0][0] + (CAMPUS_BOUNDS[1][0] - CAMPUS_BOUNDS[0][0]) * yNorm;
        const lng = CAMPUS_BOUNDS[0][1] + (CAMPUS_BOUNDS[1][1] - CAMPUS_BOUNDS[0][1]) * xNorm;
        return { lat, lng };
      }

      const latLngBounds = leafletModule.latLngBounds(CAMPUS_BOUNDS);
      const xNorm = x / MAP_WIDTH;
      const yNorm = (MAP_HEIGHT - y) / MAP_HEIGHT;
      const lat =
        latLngBounds.getSouth() + (latLngBounds.getNorth() - latLngBounds.getSouth()) * yNorm;
      const lng =
        latLngBounds.getWest() + (latLngBounds.getEast() - latLngBounds.getWest()) * xNorm;
      return { lat, lng };
    },
    [leafletModule],
  );

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

  // Create marker icon
  const getMarkerIcon = useCallback(
    (isSelected: boolean) => {
      if (!leafletModule) return undefined;

      const baseFill = '#a6192e';
      const selectedFill = '#d6001c';
      const centerFill = '#ffffff';
      const fill = isSelected ? selectedFill : baseFill;

      return new leafletModule.Icon({
        iconUrl: `data:image/svg+xml;base64,${btoa(`
          <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.7 12.5 28.5 12.5 28.5s12.5-19.8 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="${fill}"/>
            <circle cx="12.5" cy="12.5" r="5" fill="${centerFill}"/>
          </svg>
        `)}`,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: '/images/leaflet/marker-shadow.png',
        shadowSize: [41, 41],
      });
    },
    [leafletModule],
  );

  const userIcon = useMemo(() => {
    if (!leafletModule) return undefined;
    return leafletModule.divIcon({
      className: 'user-location-dot',
      html: `<div class="pulse"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  }, [leafletModule]);

  const selectedIcon = useMemo(() => getMarkerIcon(true), [getMarkerIcon]);

  // ============================================
  // OVERLAYS READY EFFECT - Delay overlay rendering until map is stable
  // ============================================
  useEffect(() => {
    if (!mapInstance || !isMapReady(mapInstance)) {
      setOverlaysReady(false);
      return;
    }

    // Delay overlay rendering to ensure map container DOM is fully stable
    const timer = setTimeout(() => {
      if (isMountedRef.current && isMapReady(mapInstance)) {
        mapLog.log('Map stable, enabling overlays');
        setOverlaysReady(true);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      setOverlaysReady(false);
    };
  }, [mapInstance, isMapReady]);

  // ============================================
  // NATIVE LEAFLET OVERLAYS - Use native API to avoid react-leaflet HMR issues
  // ============================================
  const campusOverlayRef = useRef<import('leaflet').ImageOverlay | null>(null);
  const activeOverlayRefs = useRef<Map<MapOverlayId, import('leaflet').ImageOverlay>>(new Map());

  // Campus base image overlay
  useEffect(() => {
    if (!mapInstance || !leafletModule || !overlaysReady) return;

    try {
      // Create campus overlay using native Leaflet
      const campusOverlay = leafletModule.imageOverlay(CAMPUS_IMAGE_URL, CAMPUS_BOUNDS);
      campusOverlay.addTo(mapInstance);
      campusOverlayRef.current = campusOverlay;
      mapLog.log('Campus overlay added via native Leaflet');
    } catch (error) {
      mapLog.log('Error adding campus overlay:', error);
    }

    return () => {
      try {
        if (campusOverlayRef.current && mapInstance) {
          // Check if map still has the layer before removing
          if (mapInstance.hasLayer(campusOverlayRef.current)) {
            mapInstance.removeLayer(campusOverlayRef.current);
          }
        }
      } catch {
        // Silently ignore cleanup errors during HMR - this is expected
        mapLog.log('Campus overlay cleanup skipped (HMR or unmount)');
      }
      campusOverlayRef.current = null;
    };
  }, [mapInstance, leafletModule, overlaysReady]);

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
          const overlay = leafletModule.imageOverlay(OVERLAY_PATHS[overlayId], CAMPUS_BOUNDS, {
            opacity: 0.85,
            className: 'map-overlay-layer',
          });
          overlay.addTo(mapInstance);
          currentOverlays.set(overlayId, overlay);
          mapLog.log(`Overlay ${overlayId} added via native Leaflet`);
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

  // ============================================
  // GEOLOCATION EFFECT
  // ============================================
  useEffect(() => {
    if (!mapInstance || !isMapReady(mapInstance) || !leafletModule || !navigator.geolocation) {
      if (typeof navigator !== 'undefined' && !navigator.geolocation) {
        mapLog.log('Geolocation API not available');
        setLocationStatus('error');
      }
      return;
    }

    mapLog.log('Starting geolocation watch...');
    setLocationStatus('searching');

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!isMapReady(mapInstance)) {
          mapLog.log('Map no longer ready, skipping position update');
          return;
        }

        mapLog.log('Position received:', {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });

        setLocationStatus('found');
        const latlng = leafletModule.latLng(pos.coords.latitude, pos.coords.longitude);
        setOrigin({ lat: latlng.lat, lng: latlng.lng });

        const latLngBounds = leafletModule.latLngBounds(CAMPUS_BOUNDS);
        const isInBounds = latLngBounds.contains(latlng);
        const distance = latlng.distanceTo(
          leafletModule.latLng(CAMPUS_CENTRE.lat, CAMPUS_CENTRE.lng),
        );
        mapLog.log('Position analysis:', {
          isInCampusBounds: isInBounds,
          distanceFromCampusCentre: `${Math.round(distance)}m`,
        });

        try {
          if (!userMarkerRef.current && userIcon) {
            mapLog.log('Creating user marker at:', latlng);
            userMarkerRef.current = leafletModule
              .marker(latlng, {
                icon: userIcon,
                zIndexOffset: 1000,
              })
              .addTo(mapInstance);
          } else if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng(latlng);
          }

          const accuracy = pos.coords.accuracy;
          if (!accuracyCircleRef.current) {
            accuracyCircleRef.current = leafletModule
              .circle(latlng, {
                radius: accuracy,
                color: 'var(--mq-primary, #1a73e8)',
                weight: 1,
                opacity: 0.4,
                fillOpacity: 0.1,
              })
              .addTo(mapInstance);
          } else {
            accuracyCircleRef.current.setLatLng(latlng);
            accuracyCircleRef.current.setRadius(accuracy);
          }
        } catch (error) {
          mapLog.log('Error updating location markers (likely unmounted):', error);
        }
      },
      (err) => {
        mapLog.log('Geolocation error:', {
          code: err.code,
          message: err.message,
          codeDescription:
            err.code === 1
              ? 'PERMISSION_DENIED'
              : err.code === 2
                ? 'POSITION_UNAVAILABLE'
                : err.code === 3
                  ? 'TIMEOUT'
                  : 'UNKNOWN',
        });

        const isPermissionDenied = err.code === 1;

        if (!isPermissionDenied) {
          errorHandler.logError(
            new Error(`Location tracking failed: ${err.message}`),
            'Map Geolocation',
            'low',
          );
        }

        if (isPermissionDenied) {
          setLocationStatus('denied');
        } else {
          setLocationStatus('error');
        }

        if (!hasSetFallbackOrigin.current) {
          hasSetFallbackOrigin.current = true;
          setOrigin(CAMPUS_CENTRE);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 15000,
      },
    );

    return () => {
      mapLog.log('Clearing geolocation watch and cleaning up markers');
      navigator.geolocation.clearWatch(watchId);

      try {
        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
          userMarkerRef.current = null;
        }
        if (accuracyCircleRef.current) {
          accuracyCircleRef.current.remove();
          accuracyCircleRef.current = null;
        }
      } catch (error) {
        mapLog.log('Marker cleanup error (likely already removed):', error);
      }
    };
  }, [mapInstance, leafletModule, userIcon, isMapReady]);

  // ============================================
  // CENTER ON USER ACTION
  // ============================================
  const centerOnUser = useCallback(() => {
    mapLog.log('centerOnUser called', { status: locationStatus, origin });

    if (locationStatus === 'denied') {
      toastUtils.error(t('locationAccessDenied'), t('locationDeniedDesc'));
      return;
    }

    if (locationStatus === 'searching') {
      toastUtils.info(t('locating'), t('requestingPosition'));
      return;
    }

    if (locationStatus === 'error') {
      toastUtils.error(t('locationError'), t('positionUnavailableDesc'));
      return;
    }

    if (userMarkerRef.current && mapInstance && isMapReady(mapInstance) && leafletModule) {
      try {
        const userLatLng = userMarkerRef.current.getLatLng();
        mapLog.log('Centering on user at:', userLatLng);
        mapInstance.setView(userLatLng, 18, { animate: true });

        const latLngBounds = leafletModule.latLngBounds(CAMPUS_BOUNDS);
        if (!latLngBounds.contains(userLatLng)) {
          const distance = userLatLng.distanceTo(
            leafletModule.latLng(CAMPUS_CENTRE.lat, CAMPUS_CENTRE.lng),
          );
          toastUtils.warning(
            t('outsideCampus'),
            t('outsideCampusDistance', { distance: Math.round(distance).toString() }),
          );
        }
      } catch (error) {
        mapLog.log('Error centering on user (likely unmounted):', error);
        toastUtils.warning(t('locationError'), t('positionUnavailableDesc'));
      }
    } else {
      mapLog.log('Cannot center - marker:', {
        hasMarker: !!userMarkerRef.current,
        hasMap: !!mapInstance,
      });
      toastUtils.warning(t('locationError'), t('positionUnavailableDesc'));
    }
  }, [locationStatus, mapInstance, origin, t, leafletModule, isMapReady]);

  // ============================================
  // RETRY ROUTE
  // ============================================
  const retryRoute = useCallback(async () => {
    if (!selectedBuilding || !origin) return;

    setIsLoadingRoute(true);
    setRouteError(null);

    const destLatLng = pixelToLatLng(selectedBuilding.position[0], selectedBuilding.position[1]);
    const dest = { lat: destLatLng.lat, lng: destLatLng.lng };

    const { coordinates, preview: routeData, error } = await fetchORSRoute(origin, dest);

    if (routeData) {
      setRouteCoords(coordinates);
      setPreview(routeData);
    } else {
      setRouteError(error || t('unknownError'));
      setRouteCoords([]);
      setPreview(null);
    }

    setIsLoadingRoute(false);
  }, [selectedBuilding, origin, t, pixelToLatLng]);

  // ============================================
  // ROUTING LOGIC
  // ============================================
  useEffect(() => {
    async function updateRoute() {
      if (!selectedBuilding || !origin) {
        setPreview(null);
        setRouteCoords([]);
        return;
      }

      setIsLoadingRoute(true);
      const destLatLng = pixelToLatLng(selectedBuilding.position[0], selectedBuilding.position[1]);
      const dest = { lat: destLatLng.lat, lng: destLatLng.lng };

      setRouteError(null);
      const { coordinates, preview: routeData, error } = await fetchORSRoute(origin, dest);

      if (routeData) {
        setRouteCoords(coordinates);
        setPreview(routeData);
      } else {
        setRouteError(error || t('unknownError'));
        setRouteCoords([]);
        setPreview(null);
      }
      setIsLoadingRoute(false);
    }

    const timer = setTimeout(updateRoute, 100);
    return () => clearTimeout(timer);
  }, [selectedBuilding, origin, t, pixelToLatLng]);

  // ============================================
  // MAP CONTROLLER COMPONENT (defined inside to access hooks)
  // ============================================
  const MapController = useMemo(() => {
    if (!reactLeafletModule || !leafletModule) return null;

    const { useMap, useMapEvents } = reactLeafletModule;

    const Controller = ({
      selectedBuildingProp,
      coordPickerModeProp,
      onMapClickProp,
      setMapInstanceProp,
      setPickedLocationProp,
    }: {
      selectedBuildingProp?: Building;
      coordPickerModeProp: boolean;
      onMapClickProp: (e: { latlng: { lat: number; lng: number } }) => void;
      setMapInstanceProp: (map: import('leaflet').Map) => void;
      setPickedLocationProp: (latlng: { lat: number; lng: number } | null) => void;
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
        const timer = setTimeout(checkReady, 100);

        return () => {
          clearTimeout(timer);
          map.off('load', checkReady);
        };
      }, [map, setMapInstanceProp]);

      useMapEvents({
        click: (e) => {
          if (coordPickerModeProp) {
            setPickedLocationProp({ lat: e.latlng.lat, lng: e.latlng.lng });
          }
          onMapClickProp({ latlng: { lat: e.latlng.lat, lng: e.latlng.lng } });
        },
      });

      useEffect(() => {
        if (!coordPickerModeProp) {
          setPickedLocationProp(null);
        }
      }, [coordPickerModeProp, setPickedLocationProp]);

      useEffect(() => {
        if (!isReady || !isMapReady(map)) return;

        try {
          // Center on campus hub area using accurate coordinates
          const center: [number, number] = [-33.7742, 151.1127];
          map.setView(center, 16);
          map.setMaxBounds(CAMPUS_BOUNDS);
          map.setMinZoom(15);
          map.setMaxZoom(20);
        } catch (error) {
          mapLog.log('Map setup error (likely unmounted):', error);
        }
      }, [map, isReady]);

      useEffect(() => {
        if (!isReady || !isMapReady(map) || !selectedBuildingProp) return;

        try {
          const buildingLatLng = pixelToLatLng(
            selectedBuildingProp.position[0],
            selectedBuildingProp.position[1],
          );
          map.setView([buildingLatLng.lat, buildingLatLng.lng], 17);

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
          mapLog.log('Building navigation error (likely unmounted):', error);
        }
      }, [selectedBuildingProp, map, isReady]);

      useEffect(() => {
        if (!isReady || !isMapReady(map)) return;

        try {
          const container = map.getContainer();
          if (container?.style) {
            container.style.cursor = coordPickerModeProp ? 'crosshair' : '';
          }
        } catch {
          // Silently ignore cursor style errors during HMR/unmount
        }
      }, [coordPickerModeProp, map, isReady]);

      return null;
    };

    return Controller;
  }, [reactLeafletModule, leafletModule, isMapReady, pixelToLatLng]);

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
      {/* Only render MapContainer after client-side modules are loaded */}
      {isClientReady && reactLeafletModule && MapController ? (
        <reactLeafletModule.MapContainer
          key={`map-${mapKey}`} // Force clean remount on HMR
          center={[-33.7742, 151.1127]} // Campus hub coordinates
          zoom={16}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          {/* Base campus image and overlay layers are managed via native Leaflet API in useEffect */}
          {/* This avoids react-leaflet ImageOverlay HMR/DOM conflicts */}

          <MapController
            selectedBuildingProp={selectedBuilding}
            coordPickerModeProp={coordPickerMode}
            onMapClickProp={onMapClick}
            setMapInstanceProp={setMapInstance}
            setPickedLocationProp={setPickedLocation}
          />

          {/* Route Polyline - only render when overlays are ready */}
          {overlaysReady && routeCoords.length > 0 && (
            <reactLeafletModule.Polyline
              positions={routeCoords}
              color="var(--mq-primary, blue)"
              weight={5}
              opacity={0.7}
            />
          )}

          {/* Picked Location Marker - only render when overlays are ready */}
          {overlaysReady && pickedLocation && selectedIcon && (
            <reactLeafletModule.Marker
              position={[pickedLocation.lat, pickedLocation.lng]}
              icon={selectedIcon}
            >
              <reactLeafletModule.Popup>
                <div className="p-2">
                  <p className="font-semibold text-mq-content">{t('coordPickerMode')}</p>
                  <p className="text-xs font-mono text-mq-content-secondary mt-1">
                    {Math.round(pickedLocation.lat * 100000) / 100000},{' '}
                    {Math.round(pickedLocation.lng * 100000) / 100000}
                  </p>
                </div>
              </reactLeafletModule.Popup>
            </reactLeafletModule.Marker>
          )}

          {/* Building markers - only show when a building is selected and overlays are ready */}
          {overlaysReady && selectedBuilding && selectedIcon && (
            <reactLeafletModule.Marker
              key={selectedBuilding.id}
              position={[
                pixelToLatLng(selectedBuilding.position[0], selectedBuilding.position[1]).lat,
                pixelToLatLng(selectedBuilding.position[0], selectedBuilding.position[1]).lng,
              ]}
              icon={selectedIcon}
            >
              <reactLeafletModule.Popup>
                <div className="p-3 min-w-[260px] max-w-[320px]">
                  {/* Header with category badge */}
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

                  {/* Building ID and Grid Reference */}
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

                  {/* Address */}
                  {selectedBuilding.address && (
                    <div className="flex items-center gap-1.5 text-xs text-mq-content-secondary mb-2">
                      <svg
                        className="w-3.5 h-3.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
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
                      <span>{selectedBuilding.address}</span>
                    </div>
                  )}

                  {/* Description */}
                  {selectedBuilding.descriptionKey && (
                    <p className="text-xs text-mq-content-tertiary mb-3 leading-relaxed">
                      {t(selectedBuilding.descriptionKey)}
                    </p>
                  )}

                  {/* Info chips: levels, wheelchair */}
                  {(selectedBuilding.levels || selectedBuilding.wheelchair) && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {selectedBuilding.levels && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-mq-background-secondary text-mq-content-secondary">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                          {selectedBuilding.levels} {t('levels')}
                        </span>
                      )}
                      {selectedBuilding.wheelchair && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-mq-success/10 text-mq-success">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path d="M12 2a2 2 0 100 4 2 2 0 000-4zm-2 6.5V9a1 1 0 001 1h2a1 1 0 001-1v-.5a.5.5 0 00-.5-.5h-3a.5.5 0 00-.5.5zm-1.5 2l-.9 4.5a1 1 0 00.98 1.2l3.47-.35a1.5 1.5 0 011.45.78l1.8 3.15a1 1 0 001.73-1l-1.8-3.15a3.5 3.5 0 00-3.38-1.83l-2.12.22.55-2.77 2.17.72a1 1 0 00.63-1.9l-3.05-1.02a1 1 0 00-1.1.45l-.43.72z" />
                          </svg>
                          {t('accessible')}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {selectedBuilding.tags && selectedBuilding.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2 border-t border-mq-border/50">
                      {selectedBuilding.tags.slice(0, 4).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[10px] bg-mq-background-secondary/50"
                        >
                          {t(tag as TranslationKey)}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* OSM Attribution (small, subtle) */}
                  {selectedBuilding.location?.osmId && (
                    <div className="mt-2 pt-2 border-t border-mq-border/30">
                      <span className="text-[9px] text-mq-content-tertiary/60">
                        Data: OpenStreetMap
                      </span>
                    </div>
                  )}
                </div>
              </reactLeafletModule.Popup>
            </reactLeafletModule.Marker>
          )}
        </reactLeafletModule.MapContainer>
      ) : (
        /* Show loading placeholder while waiting for client-side mount */
        <div className="w-full h-full flex items-center justify-center bg-mq-background-secondary/50 rounded-mq-lg">
          <div className="animate-pulse text-mq-content-secondary">Loading map...</div>
        </div>
      )}

      {/* Floating Action Button: Center on User */}
      <button
        onClick={centerOnUser}
        aria-label={t('liveLocation')}
        className={`absolute bottom-6 right-4 z-[1000] p-3 rounded-full shadow-lg transition-all active:scale-95 ${
          locationStatus === 'denied' || locationStatus === 'error'
            ? 'bg-mq-background-secondary text-mq-content-tertiary cursor-not-allowed'
            : 'bg-mq-card-background text-mq-primary hover:bg-mq-hover-background'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={locationStatus === 'searching' ? 'animate-pulse' : ''}
          aria-hidden="true"
        >
          {locationStatus === 'denied' ? (
            <>
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M21 21l-9-9m0 0L3 3" />
            </>
          ) : (
            <>
              <circle cx="12" cy="12" r="10" />
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

      {/* Navigation Panel - Solid Card Design matching website style */}
      {selectedBuilding && (preview || routeError || isLoadingRoute) && (
        <div
          className="route-panel absolute bottom-4 left-4 right-4 md:right-auto z-[1000] md:w-80 max-h-[60vh] overflow-hidden"
          role="region"
          aria-label={t('turnByTurn')}
        >
          {/* Solid opaque card - NO transparency, NO blur */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: 'var(--alabaster, #edeade)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* Dark mode support via CSS class */}
            <div className="dark:hidden">
              <div
                style={{
                  backgroundColor: '#edeade',
                  color: '#1a1a1a',
                }}
              >
                {/* Header */}
                <div className="p-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3
                        className="font-bold text-lg leading-tight truncate"
                        style={{ color: '#1a1a1a' }}
                      >
                        {t(selectedBuilding.translationKey)}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span
                          className="text-xs font-mono px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: 'rgba(0,0,0,0.06)',
                            color: '#2b2b2b',
                          }}
                        >
                          {selectedBuilding.id}
                        </span>
                        {preview && (
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: 'rgba(166,25,46,0.1)',
                              color: '#a6192e',
                            }}
                          >
                            {t('walkingDirections')}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setPreview(null);
                        setRouteError(null);
                        setRouteCoords([]);
                      }}
                      className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                      style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                      aria-label={t('close')}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        style={{ color: '#4a4a44' }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 max-h-[calc(60vh-80px)] overflow-y-auto">
                  {isLoadingRoute ? (
                    <div className="flex items-center justify-center py-6">
                      <div
                        className="animate-spin rounded-full h-6 w-6 border-2"
                        style={{ borderColor: '#a6192e', borderTopColor: 'transparent' }}
                      />
                      <span className="ml-3 text-sm" style={{ color: '#4a4a44' }}>
                        {t('loading')}
                      </span>
                    </div>
                  ) : routeError ? (
                    <div className="space-y-3">
                      <div
                        className="p-3 rounded-lg flex items-start gap-3"
                        style={{
                          backgroundColor: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.2)',
                        }}
                      >
                        <svg
                          className="w-5 h-5 flex-shrink-0 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <p className="text-sm font-medium text-red-700">{routeError}</p>
                      </div>
                      <button
                        onClick={retryRoute}
                        className="w-full py-2.5 px-4 rounded-lg font-medium transition-colors"
                        style={{ backgroundColor: '#a6192e', color: '#ffffff' }}
                      >
                        {t('tryAgain')}
                      </button>
                    </div>
                  ) : (
                    preview && (
                      <>
                        {/* Duration & Distance */}
                        <div className="mb-4">
                          <span className="text-3xl font-bold" style={{ color: '#10b981' }}>
                            {formatDuration(preview.durationSeconds)}
                          </span>
                          <span className="text-sm ml-2" style={{ color: '#4a4a44' }}>
                            ({formatDistance(preview.distanceMeters)})
                          </span>
                        </div>

                        {/* Navigate Button */}
                        <button
                          onClick={() => {
                            const destLatLng = pixelToLatLng(
                              selectedBuilding.position[0],
                              selectedBuilding.position[1],
                            );
                            openBestNavApp(origin, { lat: destLatLng.lat, lng: destLatLng.lng });
                          }}
                          aria-label={`${t('navigate')} ${selectedBuilding.name}`}
                          className="w-full font-bold py-3 px-4 rounded-lg mb-4 transition-all flex items-center justify-center gap-2"
                          style={{ backgroundColor: '#a6192e', color: '#ffffff' }}
                        >
                          <span>{t('navigate')}</span>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </button>

                        {/* Turn-by-turn */}
                        {preview.steps.length > 0 && (
                          <div
                            className="pt-2 border-t"
                            style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                          >
                            <h4
                              className="text-xs font-semibold uppercase tracking-wider mb-3"
                              style={{ color: '#6d6f69' }}
                            >
                              {t('turnByTurn')}
                            </h4>
                            <div className="relative space-y-4 ml-1">
                              <div
                                className="absolute left-[7px] top-2 bottom-2 w-0.5 rounded-full"
                                style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                              />
                              {preview.steps.slice(0, 6).map((s, i) => (
                                <div key={i} className="relative pl-6">
                                  <div
                                    className="absolute left-0 top-1 w-4 h-4 rounded-full border-2 box-border"
                                    style={{
                                      backgroundColor: '#edeade',
                                      borderColor: i === 0 ? '#10b981' : '#a0a29c',
                                    }}
                                  />
                                  <p className="text-sm leading-snug" style={{ color: '#1a1a1a' }}>
                                    {s.text}
                                  </p>
                                  <p
                                    className="text-xs font-mono mt-0.5"
                                    style={{ color: '#6d6f69' }}
                                  >
                                    {formatDistance(s.distance)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Dark mode version */}
            <div className="hidden dark:block">
              <div
                style={{
                  backgroundColor: '#262826',
                  color: '#edeade',
                }}
              >
                {/* Header */}
                <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3
                        className="font-bold text-lg leading-tight truncate"
                        style={{ color: '#edeade' }}
                      >
                        {t(selectedBuilding.translationKey)}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span
                          className="text-xs font-mono px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            color: '#c4c6c0',
                          }}
                        >
                          {selectedBuilding.id}
                        </span>
                        {preview && (
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: 'rgba(214,0,28,0.2)',
                              color: '#ff6b7a',
                            }}
                          >
                            {t('walkingDirections')}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setPreview(null);
                        setRouteError(null);
                        setRouteCoords([]);
                      }}
                      className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                      aria-label={t('close')}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        style={{ color: '#a8aaa3' }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 max-h-[calc(60vh-80px)] overflow-y-auto">
                  {isLoadingRoute ? (
                    <div className="flex items-center justify-center py-6">
                      <div
                        className="animate-spin rounded-full h-6 w-6 border-2"
                        style={{ borderColor: '#d6001c', borderTopColor: 'transparent' }}
                      />
                      <span className="ml-3 text-sm" style={{ color: '#a8aaa3' }}>
                        {t('loading')}
                      </span>
                    </div>
                  ) : routeError ? (
                    <div className="space-y-3">
                      <div
                        className="p-3 rounded-lg flex items-start gap-3"
                        style={{
                          backgroundColor: 'rgba(239,68,68,0.15)',
                          border: '1px solid rgba(239,68,68,0.3)',
                        }}
                      >
                        <svg
                          className="w-5 h-5 flex-shrink-0"
                          fill="none"
                          stroke="#ef4444"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <p className="text-sm font-medium" style={{ color: '#fca5a5' }}>
                          {routeError}
                        </p>
                      </div>
                      <button
                        onClick={retryRoute}
                        className="w-full py-2.5 px-4 rounded-lg font-medium transition-colors"
                        style={{ backgroundColor: '#d6001c', color: '#ffffff' }}
                      >
                        {t('tryAgain')}
                      </button>
                    </div>
                  ) : (
                    preview && (
                      <>
                        {/* Duration & Distance */}
                        <div className="mb-4">
                          <span className="text-3xl font-bold" style={{ color: '#10b981' }}>
                            {formatDuration(preview.durationSeconds)}
                          </span>
                          <span className="text-sm ml-2" style={{ color: '#a8aaa3' }}>
                            ({formatDistance(preview.distanceMeters)})
                          </span>
                        </div>

                        {/* Navigate Button */}
                        <button
                          onClick={() => {
                            const destLatLng = pixelToLatLng(
                              selectedBuilding.position[0],
                              selectedBuilding.position[1],
                            );
                            openBestNavApp(origin, { lat: destLatLng.lat, lng: destLatLng.lng });
                          }}
                          aria-label={`${t('navigate')} ${selectedBuilding.name}`}
                          className="w-full font-bold py-3 px-4 rounded-lg mb-4 transition-all flex items-center justify-center gap-2"
                          style={{ backgroundColor: '#d6001c', color: '#ffffff' }}
                        >
                          <span>{t('navigate')}</span>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </button>

                        {/* Turn-by-turn */}
                        {preview.steps.length > 0 && (
                          <div
                            className="pt-2 border-t"
                            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                          >
                            <h4
                              className="text-xs font-semibold uppercase tracking-wider mb-3"
                              style={{ color: '#8a8c86' }}
                            >
                              {t('turnByTurn')}
                            </h4>
                            <div className="relative space-y-4 ml-1">
                              <div
                                className="absolute left-[7px] top-2 bottom-2 w-0.5 rounded-full"
                                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                              />
                              {preview.steps.slice(0, 6).map((s, i) => (
                                <div key={i} className="relative pl-6">
                                  <div
                                    className="absolute left-0 top-1 w-4 h-4 rounded-full border-2 box-border"
                                    style={{
                                      backgroundColor: '#262826',
                                      borderColor: i === 0 ? '#10b981' : '#6d6f69',
                                    }}
                                  />
                                  <p className="text-sm leading-snug" style={{ color: '#edeade' }}>
                                    {s.text}
                                  </p>
                                  <p
                                    className="text-xs font-mono mt-0.5"
                                    style={{ color: '#8a8c86' }}
                                  >
                                    {formatDistance(s.distance)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
