import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  ImageOverlay,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  Polyline,
} from 'react-leaflet';
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

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Map-specific logger
const mapLog = devLog.map;

// Map dimensions (image size)
const MAP_WIDTH = 4678;
const MAP_HEIGHT = 3307;

// Campus image path
const CAMPUS_IMAGE_URL = '/maps/raster/mq-campus.png';

// Macquarie University coordinates (approximate bounds for campus)
const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [-33.783, 151.105], // bottom-left
  [-33.77, 151.125], // top-right
];

// Fallback origin (Campus Hub/Centre approx)
const CAMPUS_CENTRE = { lat: -33.775, lng: 151.115 };

// Convert pixel coordinates to lat/lng for markers
const pixelToLatLng = (x: number, y: number) => {
  const latLngBounds = L.latLngBounds(CAMPUS_BOUNDS);

  // Convert pixel coordinates to normalized position (0-1)
  const xNorm = x / MAP_WIDTH;
  const yNorm = (MAP_HEIGHT - y) / MAP_HEIGHT; // Flip Y since image Y=0 is top

  // Convert to lat/lng within campus bounds
  const lat = latLngBounds.getSouth() + (latLngBounds.getNorth() - latLngBounds.getSouth()) * yNorm;
  const lng = latLngBounds.getWest() + (latLngBounds.getEast() - latLngBounds.getWest()) * xNorm;

  return L.latLng(lat, lng);
};

// Fix for default markers in react-leaflet - use self-hosted images
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/leaflet/marker-icon-2x.png',
  iconUrl: '/images/leaflet/marker-icon.png',
  shadowUrl: '/images/leaflet/marker-shadow.png',
});

// Module-level icon cache for performance (avoid re-creating on every render)
const iconCache: { base: L.Icon | null; selected: L.Icon | null } = {
  base: null,
  selected: null,
};

// Create marker icons with caching
const getMarkerIcon = (isSelected: boolean): L.Icon => {
  const key = isSelected ? 'selected' : 'base';
  if (iconCache[key]) {
    return iconCache[key]!;
  }

  // Use CSS variables via currentColor approach or fixed brand colors
  const baseFill = '#a6192e'; // --c-red fallback
  const selectedFill = '#d6001c'; // --c-bright-red fallback
  const centerFill = '#ffffff';
  const fill = isSelected ? selectedFill : baseFill;

  const icon = new L.Icon({
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

  iconCache[key] = icon;
  return icon;
};

// Google-style Blue Dot Icon
const userIcon = L.divIcon({
  className: 'user-location-dot',
  html: `<div class="pulse"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Component to handle map setup and image overlay
function MapController({
  selectedBuilding,
  coordPickerMode,
  onMapClick,
  setMapInstance,
  setPickedLocation,
}: {
  selectedBuilding?: Building;
  coordPickerMode: boolean;
  onMapClick: (e: L.LeafletMouseEvent) => void;
  setMapInstance: (map: L.Map) => void;
  setPickedLocation: (latlng: L.LatLng | null) => void;
}) {
  const map = useMap();

  useEffect(() => {
    setMapInstance(map);
  }, [map, setMapInstance]);

  // Handle map clicks
  useMapEvents({
    click: (e) => {
      if (coordPickerMode) {
        setPickedLocation(e.latlng);
      }
      onMapClick(e);
    },
  });

  useEffect(() => {
    if (!coordPickerMode) {
      setPickedLocation(null);
    }
  }, [coordPickerMode, setPickedLocation]);

  useEffect(() => {
    const center: [number, number] = [-33.7767, 151.1134];
    map.setView(center, 16);
    map.setMaxBounds(CAMPUS_BOUNDS);
    map.setMinZoom(16);
    map.setMaxZoom(20);
  }, [map]);

  useEffect(() => {
    if (selectedBuilding) {
      const buildingLatLng = pixelToLatLng(
        selectedBuilding.position[0],
        selectedBuilding.position[1],
      );
      map.setView(buildingLatLng, 17);

      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          const marker = layer as L.Marker;
          const popupContent = marker.getPopup()?.getContent();
          if (
            popupContent &&
            typeof popupContent === 'string' &&
            popupContent.includes(selectedBuilding.id)
          ) {
            marker.openPopup();
          }
        }
      });
    }
  }, [selectedBuilding, map]);

  useEffect(() => {
    if (coordPickerMode) {
      map.getContainer().style.cursor = 'crosshair';
    } else {
      map.getContainer().style.cursor = '';
    }
  }, [coordPickerMode, map]);

  return null;
}

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
  onMapClick: (e: L.LeafletMouseEvent) => void;
  activeOverlays?: MapOverlayId[];
}

export default function CampusMap({
  selectedBuilding,
  coordPickerMode,
  onMapClick,
  activeOverlays = [],
}: CampusMapProps) {
  const { t } = useTranslation();
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [pickedLocation, setPickedLocation] = useState<L.LatLng | null>(null);

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

  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  // Memoized marker icon for selected building
  const selectedIcon = useMemo(() => getMarkerIcon(true), []);

  // Live Location Tracking
  // Use a ref to track if we've set a fallback origin to avoid infinite loops
  const hasSetFallbackOrigin = useRef(false);

  useEffect(() => {
    if (!mapInstance || !navigator.geolocation) {
      if (!navigator.geolocation) {
        mapLog.log('Geolocation API not available');
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocationStatus('error');
      }
      return;
    }

    mapLog.log('Starting geolocation watch...');
    setLocationStatus('searching');

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        mapLog.log('Position received:', {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocationStatus('found');
        const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude);
        setOrigin({ lat: latlng.lat, lng: latlng.lng });

        // Check if position is within or near campus bounds
        const latLngBounds = L.latLngBounds(CAMPUS_BOUNDS);
        const isInBounds = latLngBounds.contains(latlng);
        const distance = latlng.distanceTo(L.latLng(CAMPUS_CENTRE.lat, CAMPUS_CENTRE.lng));
        mapLog.log('Position analysis:', {
          isInCampusBounds: isInBounds,
          distanceFromCampusCentre: `${Math.round(distance)}m`,
        });

        if (!userMarkerRef.current) {
          mapLog.log('Creating user marker at:', latlng);
          userMarkerRef.current = L.marker(latlng, {
            icon: userIcon,
            zIndexOffset: 1000,
          }).addTo(mapInstance);
        } else {
          userMarkerRef.current.setLatLng(latlng);
        }

        const accuracy = pos.coords.accuracy;
        if (!accuracyCircleRef.current) {
          accuracyCircleRef.current = L.circle(latlng, {
            radius: accuracy,
            color: 'var(--mq-primary, #1a73e8)',
            weight: 1,
            opacity: 0.4,
            fillOpacity: 0.1,
          }).addTo(mapInstance);
        } else {
          accuracyCircleRef.current.setLatLng(latlng);
          accuracyCircleRef.current.setRadius(accuracy);
        }
      },
      (err) => {
        mapLog.log('Geolocation error:', {
          code: err.code,
          message: err.message,
          // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
          codeDescription:
            err.code === 1
              ? 'PERMISSION_DENIED'
              : err.code === 2
                ? 'POSITION_UNAVAILABLE'
                : err.code === 3
                  ? 'TIMEOUT'
                  : 'UNKNOWN',
        });

        // Permission denied (code 1) is expected when user blocks location or
        // when geolocation is disabled by permissions policy - don't log as error
        const isPermissionDenied = err.code === 1;

        if (!isPermissionDenied) {
          // Only log unexpected errors (position unavailable, timeout, etc.)
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

        // Set fallback origin only once to avoid re-triggering
        if (!hasSetFallbackOrigin.current) {
          hasSetFallbackOrigin.current = true;
          setOrigin(CAMPUS_CENTRE);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 15000, // Increased timeout to 15 seconds
      },
    );

    return () => {
      mapLog.log('Clearing geolocation watch');
      navigator.geolocation.clearWatch(watchId);
    };
  }, [mapInstance]); // Removed 'origin' from dependencies to prevent infinite loop

  // Center on User action
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

    if (userMarkerRef.current && mapInstance) {
      const userLatLng = userMarkerRef.current.getLatLng();
      mapLog.log('Centering on user at:', userLatLng);
      mapInstance.setView(userLatLng, 18, { animate: true });

      // Check if user is outside campus bounds
      const latLngBounds = L.latLngBounds(CAMPUS_BOUNDS);
      if (!latLngBounds.contains(userLatLng)) {
        const distance = userLatLng.distanceTo(L.latLng(CAMPUS_CENTRE.lat, CAMPUS_CENTRE.lng));
        toastUtils.warning(
          t('outsideCampus'),
          t('outsideCampusDistance', { distance: Math.round(distance).toString() }),
        );
      }
    } else {
      mapLog.log('Cannot center - marker:', {
        hasMarker: !!userMarkerRef.current,
        hasMap: !!mapInstance,
      });
      toastUtils.warning(t('locationError'), t('positionUnavailableDesc'));
    }
  }, [locationStatus, mapInstance, origin, t]);

  // Retry route fetch
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
  }, [selectedBuilding, origin, t]);

  // Routing Logic when selectedBuilding changes
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
  }, [selectedBuilding, origin, t]);

  return (
    <div
      className="relative w-full h-full"
      role="application"
      aria-label={t('interactiveCampusMap')}
    >
      <MapContainer
        center={[-33.77, 151.115]}
        zoom={16}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <ImageOverlay url={CAMPUS_IMAGE_URL} bounds={CAMPUS_BOUNDS} />

        {/* Map Overlay Layers */}
        {activeOverlays.map((overlayId) => (
          <ImageOverlay
            key={overlayId}
            url={OVERLAY_PATHS[overlayId]}
            bounds={CAMPUS_BOUNDS}
            opacity={0.85}
            className="map-overlay-layer"
          />
        ))}

        <MapController
          selectedBuilding={selectedBuilding}
          coordPickerMode={coordPickerMode}
          onMapClick={onMapClick}
          setMapInstance={setMapInstance}
          setPickedLocation={setPickedLocation}
        />

        {/* Route Polyline */}
        {routeCoords.length > 0 && (
          <Polyline
            positions={routeCoords}
            color="var(--mq-primary, blue)"
            weight={5}
            opacity={0.7}
          />
        )}

        {/* Picked Location Marker */}
        {pickedLocation && (
          <Marker position={pickedLocation} icon={selectedIcon}>
            <Popup>
              <div className="p-2">
                <p className="font-semibold text-mq-content">{t('coordPickerMode')}</p>
                <p className="text-xs font-mono text-mq-content-secondary mt-1">
                  {Math.round(pickedLocation.lat * 100000) / 100000},{' '}
                  {Math.round(pickedLocation.lng * 100000) / 100000}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Building markers - only show when a building is selected */}
        {selectedBuilding && (
          <Marker
            key={selectedBuilding.id}
            position={pixelToLatLng(selectedBuilding.position[0], selectedBuilding.position[1])}
            icon={selectedIcon}
          >
            <Popup>
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
            </Popup>
          </Marker>
        )}
      </MapContainer>

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

      {/* Hybrid Navigation Panel - Responsive */}
      {selectedBuilding && (preview || routeError || isLoadingRoute) && (
        <div
          className="route-panel absolute bottom-4 left-4 right-4 md:right-auto z-[1000] p-4 md:p-5 rounded-2xl shadow-2xl md:w-80 max-h-[60vh] overflow-y-auto border-2 transition-all duration-300 bg-mq-card-background/95 backdrop-blur-lg border-mq-border text-mq-content"
          role="region"
          aria-label={t('turnByTurn')}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg md:text-xl leading-tight text-mq-content">
                {t(selectedBuilding.translationKey)}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs font-mono border border-mq-border">
                  {selectedBuilding.id}
                </Badge>
                {preview && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-mq-background-secondary text-mq-content-secondary">
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
              className="p-1 rounded-full hover:bg-mq-hover-background transition-colors"
              aria-label={t('close')}
            >
              <svg
                className="w-5 h-5 opacity-60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {isLoadingRoute ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mq-primary" />
              <span className="ml-3 text-mq-content-secondary">{t('loading')}</span>
            </div>
          ) : routeError ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg flex items-start gap-3 bg-mq-error/10 border border-mq-error/20">
                <svg
                  className="w-5 h-5 flex-shrink-0 text-mq-error"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-sm font-medium text-mq-error">{routeError}</p>
              </div>
              <button
                onClick={retryRoute}
                className="w-full py-2 px-4 rounded-lg bg-mq-primary text-white font-medium hover:bg-mq-primary/90 transition-colors"
              >
                {t('tryAgain')}
              </button>
            </div>
          ) : (
            preview && (
              <>
                {/* Summary Stats */}
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-mq-success">
                    {formatDuration(preview.durationSeconds)}
                  </span>
                  <span className="text-sm font-medium opacity-60 ml-1 text-mq-content-secondary">
                    ({formatDistance(preview.distanceMeters)})
                  </span>
                </div>

                {/* Call to Action */}
                <button
                  onClick={() => {
                    const destLatLng = pixelToLatLng(
                      selectedBuilding.position[0],
                      selectedBuilding.position[1],
                    );
                    openBestNavApp(origin, { lat: destLatLng.lat, lng: destLatLng.lng });
                  }}
                  aria-label={`${t('navigate')} ${selectedBuilding.name}`}
                  className="w-full font-bold py-3 px-4 rounded-xl mb-6 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-md hover:shadow-lg group bg-mq-primary text-white"
                >
                  <span>{t('navigate')}</span>
                  <svg
                    className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </button>

                {/* Custom Timeline */}
                {preview.steps.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-3 opacity-50 text-mq-content-tertiary">
                      {t('turnByTurn')}
                    </h4>
                    <div className="relative space-y-6 ml-1">
                      {/* Vertical Line */}
                      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 rounded-full bg-mq-border" />

                      {preview.steps.slice(0, 8).map((s, i) => (
                        <div key={i} className="relative pl-6 group">
                          {/* Dot */}
                          <div
                            className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 z-10 box-border transition-colors group-hover:scale-110 bg-mq-card-background ${
                              i === 0 ? 'border-mq-success' : 'border-mq-content-tertiary'
                            }`}
                          />

                          <p className="text-sm font-medium leading-snug text-mq-content">
                            {s.text}
                          </p>
                          <p className="text-xs font-mono mt-0.5 opacity-60 text-mq-content-secondary">
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
      )}
    </div>
  );
}
