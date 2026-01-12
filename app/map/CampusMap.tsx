'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/mq/badge';
import { Building, BUILDING_CATEGORY_LABELS, getBuildingGps } from '@/lib/map/buildings';
import {
  RoutePreview,
  formatDistance,
  formatDuration,
  openBestNavApp,
} from '@/lib/map/navigationHelpers';
import { createMarkerIcon, createUserLocationIcon } from '@/lib/map/mapUtils';
import { fetchORSRoute } from '@/lib/services/ors';
import { toastUtils } from '@/lib/utils/toast';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { useLeafletLoader } from '@/lib/hooks/useLeafletLoader';
import { errorHandler } from '@/lib/utils/errorHandling';
import { devLog } from '@/lib/utils/devLog';
import type { TranslationKey } from '@/lib/i18n/translations';
import type { MapOverlayId } from '@/lib/map/mapOverlays';

// Map-specific logger
const mapLog = devLog.map;

// Campus image path
const CAMPUS_IMAGE_URL = '/maps/raster/mq-campus.png';

// === CRS.Simple PIXEL-BASED COORDINATE SYSTEM (v0.14.22) ===
// The map image is a raster illustration (4678x3307 pixels), NOT georeferenced.
// Using L.CRS.Simple treats the map as a pure 2D pixel grid where 1 unit = 1 pixel.
// This eliminates ALL projection distortion and edge drift issues.
//
// Coordinate system:
//   - Origin [0, 0] is at bottom-left (Leaflet default for CRS.Simple)
//   - X increases to the right (0 to 4678)
//   - Y increases upward (0 to 3307)
//   - Building positions are stored as [x, y] in IMAGE coords (Y from top)
//   - For Leaflet, we convert: [x, height - y] to get [lng, lat] in CRS.Simple
//
// Map dimensions from VRT file
const MAP_DIMS = { width: 4678, height: 3307 };

// Pixel-based bounds for CRS.Simple: [[minY, minX], [maxY, maxX]]
// In CRS.Simple with default transformation, bounds are [y, x] format
const PIXEL_BOUNDS: [[number, number], [number, number]] = [
  [0, 0], // Bottom-left corner (origin)
  [MAP_DIMS.height, MAP_DIMS.width], // Top-right corner
];

// Campus center in pixel coordinates (for initial view)
const CAMPUS_CENTER_PIXEL: [number, number] = [MAP_DIMS.height / 2, MAP_DIMS.width / 2];

// Real GPS coordinates for campus center (used ONLY for geolocation comparison)
const CAMPUS_CENTRE_GPS = { lat: -33.7742, lng: 151.1127 };

// GPS bounds for checking if user is on campus (approximate)
const GPS_CAMPUS_BOUNDS = {
  south: -33.7833,
  north: -33.7654,
  west: 151.1055,
  east: 151.1251,
};

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
  // LEAFLET MODULE - Loaded dynamically via custom hook
  // ============================================
  const { leafletModule, reactLeafletModule, isClientReady, mapKey, isMountedRef } =
    useLeafletLoader();

  // ============================================
  // COMPONENT STATE
  // ============================================
  const [mapInstance, setMapInstance] = useState<import('leaflet').Map | null>(null);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [overlaysReady, setOverlaysReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

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

  // Reset overlays on mount/unmount
  useEffect(() => {
    return () => {
      setOverlaysReady(false);
    };
  }, []);

  // ============================================
  // HELPER FUNCTIONS (use L from state)
  // ============================================

  // Convert building pixel position [x, y] to CRS.Simple coordinates [lat, lng]
  // In CRS.Simple:
  //   - Leaflet expects [lat, lng] which maps to [y, x] in pixel space
  //   - Image coordinates have Y=0 at TOP, but CRS.Simple has Y=0 at BOTTOM
  //   - So we invert Y: leafletY = MAP_DIMS.height - imageY
  const pixelToLatLng = useCallback((x: number, y: number): { lat: number; lng: number } => {
    // Convert from image coordinates (Y from top) to CRS.Simple (Y from bottom)
    // In CRS.Simple, lat=Y and lng=X
    return {
      lat: MAP_DIMS.height - y, // Invert Y axis
      lng: x,
    };
  }, []);

  // Get the map coordinates for a building marker in CRS.Simple
  // Uses pixel position directly - no projection math needed!
  // NOTE: For external navigation/routing, use building.location (real GPS) instead
  const getBuildingLatLng = useCallback(
    (building: Building): { lat: number; lng: number } => {
      // Convert pixel position to CRS.Simple coordinates
      return pixelToLatLng(building.position[0], building.position[1]);
    },
    [pixelToLatLng],
  );

  // Convert real GPS coordinates to approximate pixel position on map
  // Used ONLY for showing user's geolocation on the map
  // This is approximate since the map is not georeferenced
  const gpsToPixelLatLng = useCallback(
    (gpsLat: number, gpsLng: number): { lat: number; lng: number } | null => {
      const { south, north, west, east } = GPS_CAMPUS_BOUNDS;

      // Check if position is within campus bounds (with some margin)
      const margin = 0.002; // ~200m margin
      if (
        gpsLat < south - margin ||
        gpsLat > north + margin ||
        gpsLng < west - margin ||
        gpsLng > east + margin
      ) {
        return null; // Outside campus area
      }

      // Linear interpolation from GPS to pixel coordinates
      const xNorm = (gpsLng - west) / (east - west);
      const yNorm = (north - gpsLat) / (north - south); // Note: lat decreases as image Y increases

      const pixelX = xNorm * MAP_DIMS.width;
      const pixelY = yNorm * MAP_DIMS.height;

      // Convert to CRS.Simple coordinates
      return pixelToLatLng(pixelX, pixelY);
    },
    [pixelToLatLng],
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
    if (!leafletModule) return undefined;
    return createUserLocationIcon(leafletModule);
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
  }, [mapInstance, isMapReady, isMountedRef]);

  // ============================================
  // NATIVE LEAFLET OVERLAYS - Use native API to avoid react-leaflet HMR issues
  // ============================================
  const campusOverlayRef = useRef<import('leaflet').ImageOverlay | null>(null);
  const activeOverlayRefs = useRef<Map<MapOverlayId, import('leaflet').ImageOverlay>>(new Map());
  const debugRectRef = useRef<import('leaflet').Rectangle | null>(null);

  // Debug mode for bounds calibration (Ctrl+Shift+D to toggle)
  const [debugMode, setDebugMode] = useState(false);

  // GCP debug mode for calibration visualization (Ctrl+Shift+G to toggle)
  const [gcpDebugMode, setGcpDebugMode] = useState(false);

  // Debug keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setDebugMode((prev) => !prev);
        mapLog.log('Debug mode:', !debugMode);
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        setGcpDebugMode((prev) => !prev);
        mapLog.log('GCP debug mode:', !gcpDebugMode);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [debugMode, gcpDebugMode]);

  // Campus base image overlay
  useEffect(() => {
    if (!mapInstance || !leafletModule || !overlaysReady) return;

    try {
      // Create campus overlay using native Leaflet with PIXEL_BOUNDS for CRS.Simple
      const campusOverlay = leafletModule.imageOverlay(CAMPUS_IMAGE_URL, PIXEL_BOUNDS);
      campusOverlay.addTo(mapInstance);
      campusOverlayRef.current = campusOverlay;
      mapLog.log('Campus overlay added via native Leaflet (CRS.Simple pixel bounds)');
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

  // Debug rectangle for bounds visualization
  useEffect(() => {
    if (!mapInstance || !leafletModule || !overlaysReady) return;

    if (debugMode) {
      // Add debug rectangle to visualize pixel bounds
      const debugRect = leafletModule.rectangle(PIXEL_BOUNDS, {
        color: '#ff0000',
        weight: 3,
        fillOpacity: 0.1,
        dashArray: '10, 10',
      });
      debugRect.addTo(mapInstance);
      debugRectRef.current = debugRect;
      mapLog.log('Debug rectangle added - pixel bounds:', PIXEL_BOUNDS);
    } else {
      // Remove debug rectangle
      if (debugRectRef.current && mapInstance.hasLayer(debugRectRef.current)) {
        mapInstance.removeLayer(debugRectRef.current);
        debugRectRef.current = null;
      }
    }

    return () => {
      if (debugRectRef.current && mapInstance) {
        try {
          if (mapInstance.hasLayer(debugRectRef.current)) {
            mapInstance.removeLayer(debugRectRef.current);
          }
        } catch {
          // Ignore cleanup errors
        }
        debugRectRef.current = null;
      }
    };
  }, [mapInstance, leafletModule, overlaysReady, debugMode]);

  // Corner markers debug visualization (replaces GCP markers for CRS.Simple)
  // Shows pixel coordinate markers at map corners for verification
  const cornerMarkersRef = useRef<import('leaflet').Marker[]>([]);

  useEffect(() => {
    if (!mapInstance || !leafletModule || !overlaysReady) return;

    // Cleanup existing corner markers
    cornerMarkersRef.current.forEach((marker) => {
      try {
        if (mapInstance.hasLayer(marker)) {
          mapInstance.removeLayer(marker);
        }
      } catch {
        // Ignore cleanup errors
      }
    });
    cornerMarkersRef.current = [];

    if (gcpDebugMode) {
      // In CRS.Simple mode, show corner markers with pixel coordinates
      const corners = [
        { name: 'Bottom-Left (Origin)', pixel: [0, 0] },
        { name: 'Bottom-Right', pixel: [MAP_DIMS.width, 0] },
        { name: 'Top-Left', pixel: [0, MAP_DIMS.height] },
        { name: 'Top-Right', pixel: [MAP_DIMS.width, MAP_DIMS.height] },
        { name: 'Center', pixel: [MAP_DIMS.width / 2, MAP_DIMS.height / 2] },
      ];

      const createCornerIcon = (color: string) => {
        return leafletModule.divIcon({
          className: 'corner-marker',
          html: `<div style="
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: ${color};
            border: 2px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          "></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
      };

      corners.forEach((corner, i) => {
        // Convert image pixel coords to CRS.Simple coords
        const pos = pixelToLatLng(corner.pixel[0], corner.pixel[1]);
        const marker = leafletModule.marker([pos.lat, pos.lng], {
          icon: createCornerIcon(i === 4 ? '#00ff00' : '#ff00ff'),
          zIndexOffset: 2000,
        });
        marker.bindPopup(`
          <div style="font-size: 12px;">
            <strong>${corner.name}</strong><br/>
            Image Pixel: [${corner.pixel[0]}, ${corner.pixel[1]}]<br/>
            CRS.Simple: [${pos.lat.toFixed(0)}, ${pos.lng.toFixed(0)}]
          </div>
        `);
        marker.addTo(mapInstance);
        cornerMarkersRef.current.push(marker);
      });

      mapLog.log('Corner debug markers added for CRS.Simple verification');
    }

    return () => {
      cornerMarkersRef.current.forEach((marker) => {
        try {
          if (mapInstance && mapInstance.hasLayer(marker)) {
            mapInstance.removeLayer(marker);
          }
        } catch {
          // Ignore cleanup errors
        }
      });
      cornerMarkersRef.current = [];
    };
  }, [mapInstance, leafletModule, overlaysReady, gcpDebugMode, pixelToLatLng]);

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
          const overlay = leafletModule.imageOverlay(OVERLAY_PATHS[overlayId], PIXEL_BOUNDS, {
            opacity: 0.85,
            className: 'map-overlay-layer',
          });
          overlay.addTo(mapInstance);
          currentOverlays.set(overlayId, overlay);
          mapLog.log(`Overlay ${overlayId} added via native Leaflet (CRS.Simple)`);
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
  // GEOLOCATION EFFECT - Convert real GPS to pixel coords for CRS.Simple
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

        const gpsLat = pos.coords.latitude;
        const gpsLng = pos.coords.longitude;

        mapLog.log('GPS position received:', {
          lat: gpsLat,
          lng: gpsLng,
          accuracy: pos.coords.accuracy,
        });

        setLocationStatus('found');
        // Store real GPS coords for routing (ORS needs real GPS)
        setOrigin({ lat: gpsLat, lng: gpsLng });

        // Check if user is within campus bounds using GPS
        const { south, north, west, east } = GPS_CAMPUS_BOUNDS;
        const isInBounds = gpsLat >= south && gpsLat <= north && gpsLng >= west && gpsLng <= east;

        // Calculate approximate distance from campus center
        const latDiff = gpsLat - CAMPUS_CENTRE_GPS.lat;
        const lngDiff = gpsLng - CAMPUS_CENTRE_GPS.lng;
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000; // rough meters

        mapLog.log('Position analysis:', {
          isInCampusBounds: isInBounds,
          distanceFromCampusCentre: `${Math.round(distance)}m`,
        });

        try {
          // Convert GPS to pixel coordinates for CRS.Simple display
          const pixelPos = gpsToPixelLatLng(gpsLat, gpsLng);

          if (pixelPos) {
            // User is on/near campus - show marker on map
            if (!userMarkerRef.current && userIcon) {
              mapLog.log('Creating user marker at pixel coords:', pixelPos);
              userMarkerRef.current = leafletModule
                .marker([pixelPos.lat, pixelPos.lng], {
                  icon: userIcon,
                  zIndexOffset: 1000,
                })
                .addTo(mapInstance);
            } else if (userMarkerRef.current) {
              userMarkerRef.current.setLatLng([pixelPos.lat, pixelPos.lng]);
            }

            // Accuracy circle - convert meters to pixels (approximate)
            // At campus scale, roughly 1 pixel ≈ 0.42m (based on map dimensions)
            const accuracy = pos.coords.accuracy;
            const pixelAccuracy = accuracy / 0.42; // Convert meters to pixels
            if (!accuracyCircleRef.current) {
              accuracyCircleRef.current = leafletModule
                .circle([pixelPos.lat, pixelPos.lng], {
                  radius: pixelAccuracy,
                  color: 'var(--mq-primary, #1a73e8)',
                  weight: 1,
                  opacity: 0.4,
                  fillOpacity: 0.1,
                })
                .addTo(mapInstance);
            } else {
              accuracyCircleRef.current.setLatLng([pixelPos.lat, pixelPos.lng]);
              accuracyCircleRef.current.setRadius(pixelAccuracy);
            }
          } else {
            // User is off campus - remove markers
            mapLog.log('User is outside campus bounds, hiding marker');
            if (userMarkerRef.current) {
              mapInstance.removeLayer(userMarkerRef.current);
              userMarkerRef.current = null;
            }
            if (accuracyCircleRef.current) {
              mapInstance.removeLayer(accuracyCircleRef.current);
              accuracyCircleRef.current = null;
            }
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
          setOrigin(CAMPUS_CENTRE_GPS);
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
  }, [mapInstance, leafletModule, userIcon, isMapReady, gpsToPixelLatLng]);

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

    if (userMarkerRef.current && mapInstance && isMapReady(mapInstance)) {
      try {
        const userLatLng = userMarkerRef.current.getLatLng();
        mapLog.log('Centering on user at pixel coords:', userLatLng);
        // In CRS.Simple, zoom level 0 shows the full map. Use 1 for closer view.
        mapInstance.setView(userLatLng, 0, { animate: true });
      } catch (error) {
        mapLog.log('Error centering on user (likely unmounted):', error);
        toastUtils.warning(t('locationError'), t('positionUnavailableDesc'));
      }
    } else if (!userMarkerRef.current && origin) {
      // User is off campus but we have their GPS - show a message
      toastUtils.warning(t('outsideCampus'), t('positionUnavailableDesc'));
    } else {
      mapLog.log('Cannot center - marker:', {
        hasMarker: !!userMarkerRef.current,
        hasMap: !!mapInstance,
      });
      toastUtils.warning(t('locationError'), t('positionUnavailableDesc'));
    }
  }, [locationStatus, mapInstance, origin, t, isMapReady]);

  // ============================================
  // RETRY ROUTE
  // ============================================
  const retryRoute = useCallback(async () => {
    if (!selectedBuilding || !origin) return;

    setIsLoadingRoute(true);
    setRouteError(null);

    // Use real GPS coordinates for ORS routing (not pixel-based CRS.Simple coords)
    const destGps = getBuildingGps(selectedBuilding);

    // Validate coordinates
    const isValidCoord = (c: { lat: number; lng: number } | null): boolean => {
      if (!c) return false;
      return (
        typeof c.lat === 'number' &&
        typeof c.lng === 'number' &&
        Number.isFinite(c.lat) &&
        Number.isFinite(c.lng) &&
        c.lat >= -90 &&
        c.lat <= 90 &&
        c.lng >= -180 &&
        c.lng <= 180
      );
    };

    if (!isValidCoord(destGps) || !isValidCoord(origin)) {
      mapLog.warn('Invalid coordinates for retry:', { destGps, origin });
      setRouteError('Invalid coordinates');
      setIsLoadingRoute(false);
      return;
    }

    const { coordinates, preview: routeData, error } = await fetchORSRoute(origin, destGps);

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
      // Use real GPS coordinates for ORS routing (not pixel-based CRS.Simple coords)
      const destGps = getBuildingGps(selectedBuilding);

      // Validate coordinates before sending to API
      const isValidCoord = (c: { lat: number; lng: number } | null): boolean => {
        if (!c) return false;
        return (
          typeof c.lat === 'number' &&
          typeof c.lng === 'number' &&
          Number.isFinite(c.lat) &&
          Number.isFinite(c.lng) &&
          c.lat >= -90 &&
          c.lat <= 90 &&
          c.lng >= -180 &&
          c.lng <= 180
        );
      };

      // Debug logging to diagnose coordinate issues
      mapLog.log('ORS Route Request:', {
        buildingId: selectedBuilding.id,
        buildingName: selectedBuilding.name,
        hasLocation: !!selectedBuilding.location,
        pixelPosition: selectedBuilding.position,
        destGps,
        origin,
        destValid: isValidCoord(destGps),
        originValid: isValidCoord(origin),
      });

      if (!isValidCoord(destGps)) {
        mapLog.warn('Invalid destination GPS coordinates:', destGps);
        setRouteError('Invalid building coordinates');
        setIsLoadingRoute(false);
        return;
      }

      if (!isValidCoord(origin)) {
        mapLog.warn('Invalid origin GPS coordinates:', origin);
        setRouteError('Location not available');
        setIsLoadingRoute(false);
        return;
      }

      setRouteError(null);
      const { coordinates, preview: routeData, error } = await fetchORSRoute(origin, destGps);

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
          // CRS.Simple: Center on campus using pixel coordinates
          // CAMPUS_CENTER_PIXEL is [height/2, width/2] = [1653.5, 2339]
          map.setView(CAMPUS_CENTER_PIXEL, 0); // Zoom 0 shows full map in CRS.Simple
          map.setMaxBounds(PIXEL_BOUNDS);
          map.setMinZoom(-2); // Allow zooming out
          map.setMaxZoom(2); // Allow zooming in
        } catch (error) {
          mapLog.log('Map setup error (likely unmounted):', error);
        }
      }, [map, isReady]);

      useEffect(() => {
        if (!isReady || !isMapReady(map) || !selectedBuildingProp) return;

        try {
          // Use pixel-to-latLng conversion for CRS.Simple positioning
          const buildingLatLng = pixelToLatLng(
            selectedBuildingProp.position[0],
            selectedBuildingProp.position[1],
          );
          map.setView([buildingLatLng.lat, buildingLatLng.lng], 1); // Zoom 1 for building detail

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
      {isClientReady && reactLeafletModule && leafletModule && MapController ? (
        <reactLeafletModule.MapContainer
          key={`map-${mapKey}`} // Force clean remount on HMR
          crs={leafletModule.CRS.Simple} // Use pixel-based CRS for raster image
          center={CAMPUS_CENTER_PIXEL} // Pixel center [height/2, width/2]
          zoom={0} // Zoom 0 = 1:1 pixel scale in CRS.Simple
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
                getBuildingLatLng(selectedBuilding).lat,
                getBuildingLatLng(selectedBuilding).lng,
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
                          className="text-[10px] bg-mq-background-secondary"
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
        <div className="w-full h-full flex items-center justify-center bg-mq-background-secondary rounded-mq-lg">
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
          <div className="rounded-xl overflow-hidden bg-mq-background dark:bg-mq-background shadow-lg ring-1 ring-black/5 dark:ring-white/10">
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
                  <button
                    onClick={() => {
                      setPreview(null);
                      setRouteError(null);
                      setRouteCoords([]);
                    }}
                    className="p-1.5 rounded-lg transition-colors flex-shrink-0 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
                    aria-label={t('close')}
                  >
                    <svg
                      className="w-4 h-4 text-mq-content-secondary"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 max-h-[calc(60vh-80px)] overflow-y-auto">
                {isLoadingRoute ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-mq-primary dark:border-mq-red-bright border-t-transparent" />
                    <span className="ml-3 text-sm text-mq-content-secondary">{t('loading')}</span>
                  </div>
                ) : routeError ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg flex items-start gap-3 bg-red-500/10 border border-red-500/20">
                      <svg
                        className="w-5 h-5 flex-shrink-0 text-red-600 dark:text-red-400"
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
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">
                        {routeError}
                      </p>
                    </div>
                    <button
                      onClick={retryRoute}
                      className="w-full py-2.5 px-4 rounded-lg font-medium transition-colors bg-mq-primary dark:bg-mq-red-bright text-white hover:opacity-90"
                    >
                      {t('tryAgain')}
                    </button>
                  </div>
                ) : (
                  preview && (
                    <>
                      {/* Duration & Distance */}
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-emerald-500">
                          {formatDuration(preview.durationSeconds)}
                        </span>
                        <span className="text-sm ml-2 text-mq-content-secondary">
                          ({formatDistance(preview.distanceMeters)})
                        </span>
                      </div>

                      {/* Navigate Button */}
                      <button
                        onClick={() => {
                          // Use real GPS for external navigation (Google/Apple Maps)
                          const destGps = getBuildingGps(selectedBuilding);
                          mapLog.log('Navigate button clicked:', {
                            buildingId: selectedBuilding.id,
                            buildingName: selectedBuilding.name,
                            hasStoredLocation: !!selectedBuilding.location,
                            storedLocation: selectedBuilding.location,
                            calculatedGps: destGps,
                            origin,
                          });
                          openBestNavApp(origin, destGps);
                        }}
                        aria-label={`${t('navigate')} ${selectedBuilding.name}`}
                        className="w-full font-bold py-3 px-4 rounded-lg mb-4 transition-all flex items-center justify-center gap-2 bg-mq-primary dark:bg-mq-red-bright text-white hover:opacity-90"
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
                        <div className="pt-2 border-t border-mq-border">
                          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 text-mq-content-tertiary">
                            {t('turnByTurn')}
                          </h4>
                          <div className="relative space-y-4 ml-1">
                            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 rounded-full bg-black/10 dark:bg-white/15" />
                            {preview.steps.slice(0, 6).map((s, i) => (
                              <div key={i} className="relative pl-6">
                                <div
                                  className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 box-border bg-mq-background ${
                                    i === 0 ? 'border-emerald-500' : 'border-mq-content-tertiary'
                                  }`}
                                />
                                <p className="text-sm leading-snug text-mq-content">{s.text}</p>
                                <p className="text-xs font-mono mt-0.5 text-mq-content-tertiary">
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
      )}
    </div>
  );
}
