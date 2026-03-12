'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Building } from '@/features/map/lib/buildings';
import { getBuildingGps } from '@/features/map/lib/buildings';
import { CAMPUS_CENTRE_GPS } from '@/features/map/lib/constants';
import { loadGoogleMaps } from '@/lib/maps/google/loader';
import { decodePolyline } from '@/lib/maps/google/decodePolyline';
import type {
  GoogleComputedRoute,
  GoogleTravelMode,
  MapLatLng,
  ExternalDestination,
} from '@/lib/maps/google/types';

// DEMO_MAP_ID is Google's built-in demo Map ID that enables Advanced Markers
// without requiring a custom Map ID from the Cloud Console.
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || 'DEMO_MAP_ID';

type AnyMarker = google.maps.marker.AdvancedMarkerElement | google.maps.Marker;

function clearMarker(m: AnyMarker | null): void {
  if (!m) return;
  if (m instanceof google.maps.Marker) {
    m.setMap(null);
  } else {
    m.map = null;
  }
}

/** Haversine distance in metres */
function haversineMetres(a: MapLatLng, b: MapLatLng): number {
  const R = 6_371_000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function createRouteDot(color: string): HTMLDivElement {
  const el = document.createElement('div');
  Object.assign(el.style, {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    background: color,
    border: '3px solid #fff',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
  });
  return el;
}

interface Props {
  selectedBuilding?: Building;
  externalDestination: ExternalDestination | null;
  userLocation: MapLatLng | null;
  route: GoogleComputedRoute | null;
  isNavigating: boolean;
  /** When the route panel is visible, shift the location button above it */
  panelVisible?: boolean;
  /** Current travel mode — walking uses dashed polyline */
  travelMode?: GoogleTravelMode;
  /** Notifies parent when Street View is entered or exited */
  onStreetViewChange?: (active: boolean) => void;
}

export default function GoogleMapCanvas({
  selectedBuilding,
  externalDestination,
  userLocation,
  route,
  isNavigating,
  panelVisible,
  travelMode,
  onStreetViewChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<AnyMarker | null>(null);
  const userAccuracyCircleRef = useRef<google.maps.Circle | null>(null);
  const destMarkerRef = useRef<AnyMarker | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const outlinePolylineRef = useRef<google.maps.Polyline | null>(null);
  const walkedPolylineRef = useRef<google.maps.Polyline | null>(null);
  const originDotRef = useRef<AnyMarker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [isStreetViewActive, setIsStreetViewActive] = useState(false);
  const lastAnimatedPosRef = useRef<MapLatLng | null>(null);
  const animFrameRef = useRef<number>(0);

  // Initialise map once
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: CAMPUS_CENTRE_GPS,
          zoom: 16,
          mapId: MAP_ID,
          mapTypeControl: true,
          mapTypeControlOptions: { position: google.maps.ControlPosition.TOP_RIGHT },
          streetViewControl: true,
          streetViewControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
          fullscreenControl: false,
          zoomControl: true,
          zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
          scaleControl: true,
          gestureHandling: 'greedy',
          clickableIcons: true,
          // Disable 3D camera/tilt/rotate controls on vector maps (not in TS types yet)
          ...({
            cameraControl: false,
            tiltControl: false,
            rotateControl: false,
          } as Partial<google.maps.MapOptions>),
        });
        setMapReady(true);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Destination marker — single pin for selected building or external destination
  // (No building markers are rendered; the map stays clean like native Google Maps)
  useEffect(() => {
    if (destMarkerRef.current) {
      clearMarker(destMarkerRef.current);
      destMarkerRef.current = null;
    }
    const map = mapRef.current;
    if (!map) return;

    // Determine destination: external place or selected building
    let pos: { lat: number; lng: number } | null = null;
    let title = '';

    if (externalDestination) {
      pos = { lat: externalDestination.lat, lng: externalDestination.lng };
      title = externalDestination.label;
    } else if (selectedBuilding) {
      const gps = getBuildingGps(selectedBuilding);
      pos = { lat: gps.lat, lng: gps.lng };
      title = `${selectedBuilding.id} ${selectedBuilding.name}`.trim();
    }

    if (!pos) return;

    let m: AnyMarker;
    try {
      const pin = new google.maps.marker.PinElement({
        background: '#ea4335',
        borderColor: '#c5221f',
        glyphColor: '#ffffff',
        scale: 1.3,
      });
      m = new google.maps.marker.AdvancedMarkerElement({
        position: pos,
        title,
        content: pin.element,
      });
    } catch {
      m = new google.maps.Marker({ position: pos, title });
    }

    if (m instanceof google.maps.Marker) {
      m.setMap(map);
    } else {
      m.map = map;
    }
    destMarkerRef.current = m;
    map.panTo(pos);
    map.setZoom(17);
  }, [externalDestination, selectedBuilding, mapReady]);

  // Smooth user dot animation helper
  const animateUserDot = useCallback((from: MapLatLng, to: MapLatLng, duration: number) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3);
      const lat = from.lat + (to.lat - from.lat) * ease;
      const lng = from.lng + (to.lng - from.lng) * ease;
      const pos = { lat, lng };
      if (userMarkerRef.current) {
        if (userMarkerRef.current instanceof google.maps.Marker) {
          userMarkerRef.current.setPosition(pos);
        } else {
          userMarkerRef.current.position = pos;
        }
      }
      if (userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current.setCenter(pos);
      }
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        lastAnimatedPosRef.current = to;
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  // User location dot + accuracy circle
  const renderUserMarker = useCallback(
    (loc: MapLatLng) => {
      const map = mapRef.current;
      if (!map) return;

      const accuracy = loc.accuracy ?? 0;

      if (!userMarkerRef.current) {
        // Create the blue dot
        const dot = document.createElement('div');
        Object.assign(dot.style, {
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: '#3b82f6',
          border: '3px solid #fff',
          boxShadow: '0 0 0 4px rgba(59,130,246,0.3)',
          transition: 'box-shadow 0.3s ease',
        });
        let m: AnyMarker;
        try {
          m = new google.maps.marker.AdvancedMarkerElement({
            position: loc,
            title: 'You',
            content: dot,
            zIndex: 999,
          });
          m.map = map;
        } catch {
          m = new google.maps.Marker({
            position: loc,
            title: 'You',
            zIndex: 999,
            map,
          });
        }
        userMarkerRef.current = m;
        lastAnimatedPosRef.current = loc;

        // Accuracy circle
        if (accuracy > 0) {
          userAccuracyCircleRef.current = new google.maps.Circle({
            map,
            center: loc,
            radius: accuracy,
            fillColor: '#3b82f6',
            fillOpacity: 0.08,
            strokeColor: '#3b82f6',
            strokeOpacity: 0.25,
            strokeWeight: 1,
            clickable: false,
            zIndex: 1,
          });
        }
      } else {
        // Smoothly animate to new position
        const prev = lastAnimatedPosRef.current ?? loc;
        const dist = haversineMetres(prev, loc);
        if (dist > 2) {
          // Animate over 400ms for natural movement
          animateUserDot(prev, loc, Math.min(400, dist * 10));
        } else {
          lastAnimatedPosRef.current = loc;
        }

        // Update accuracy circle
        if (userAccuracyCircleRef.current) {
          if (accuracy > 0) {
            userAccuracyCircleRef.current.setRadius(accuracy);
          } else {
            userAccuracyCircleRef.current.setMap(null);
            userAccuracyCircleRef.current = null;
          }
        } else if (accuracy > 0) {
          userAccuracyCircleRef.current = new google.maps.Circle({
            map,
            center: loc,
            radius: accuracy,
            fillColor: '#3b82f6',
            fillOpacity: 0.08,
            strokeColor: '#3b82f6',
            strokeOpacity: 0.25,
            strokeWeight: 1,
            clickable: false,
            zIndex: 1,
          });
        }
      }
    },
    [animateUserDot],
  );

  useEffect(() => {
    if (userLocation) renderUserMarker(userLocation);
  }, [userLocation, renderUserMarker, mapReady]);

  // Follow user during active navigation
  useEffect(() => {
    if (!isNavigating || !userLocation || !mapRef.current) return;
    mapRef.current.panTo({ lat: userLocation.lat, lng: userLocation.lng });
  }, [isNavigating, userLocation, mapReady]);

  // Route polyline — shows walked portion in different color, two-layer outline effect
  useEffect(() => {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    if (outlinePolylineRef.current) {
      outlinePolylineRef.current.setMap(null);
      outlinePolylineRef.current = null;
    }
    if (walkedPolylineRef.current) {
      walkedPolylineRef.current.setMap(null);
      walkedPolylineRef.current = null;
    }
    if (originDotRef.current) {
      clearMarker(originDotRef.current);
      originDotRef.current = null;
    }
    const map = mapRef.current;
    if (!map || !route) return;

    const path = decodePolyline(route.encodedPolyline);

    // Find closest point on polyline to user (for progress tracking)
    let splitIdx = 0;
    if (isNavigating && userLocation && path.length > 1) {
      let minDist = Infinity;
      for (let i = 0; i < path.length; i++) {
        const d = haversineMetres(userLocation, path[i]);
        if (d < minDist) {
          minDist = d;
          splitIdx = i;
        }
      }
    }

    // Walked portion (dimmed)
    if (isNavigating && splitIdx > 0) {
      walkedPolylineRef.current = new google.maps.Polyline({
        path: path.slice(0, splitIdx + 1),
        map,
        strokeColor: '#94a3b8',
        strokeOpacity: 0.5,
        strokeWeight: 5,
        geodesic: true,
        zIndex: 1,
      });
    }

    // Remaining route — two-layer polyline for Google Maps outline effect
    const remainingPath = isNavigating && splitIdx > 0 ? path.slice(splitIdx) : path;

    const isWalking = travelMode === 'WALK';

    if (isWalking) {
      // Dashed polyline for walking — repeating symbol icons along the path
      const outlineDash = {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        strokeColor: '#1a56db',
        scale: 4,
      };
      const coreDash = {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        strokeColor: '#4285F4',
        scale: 3,
      };

      outlinePolylineRef.current = new google.maps.Polyline({
        path: remainingPath,
        map,
        strokeOpacity: 0,
        strokeWeight: 8,
        geodesic: true,
        zIndex: 2,
        icons: [{ icon: outlineDash, offset: '0', repeat: '16px' }],
      });

      polylineRef.current = new google.maps.Polyline({
        path: remainingPath,
        map,
        strokeOpacity: 0,
        strokeWeight: 6,
        geodesic: true,
        zIndex: 3,
        icons: [{ icon: coreDash, offset: '0', repeat: '16px' }],
      });
    } else {
      // Solid polyline for drive/transit/bicycle
      outlinePolylineRef.current = new google.maps.Polyline({
        path: remainingPath,
        map,
        strokeColor: '#1a56db',
        strokeOpacity: 1.0,
        strokeWeight: 8,
        geodesic: true,
        zIndex: 2,
      });

      polylineRef.current = new google.maps.Polyline({
        path: remainingPath,
        map,
        strokeColor: '#4285F4',
        strokeOpacity: 1.0,
        strokeWeight: 6,
        geodesic: true,
        zIndex: 3,
      });
    }

    // Origin dot marker (green, like Google Maps)
    if (path.length > 0 && !isNavigating) {
      try {
        originDotRef.current = new google.maps.marker.AdvancedMarkerElement({
          position: path[0],
          title: 'Start',
          content: createRouteDot('#34a853'),
          zIndex: 100,
        });
        (originDotRef.current as google.maps.marker.AdvancedMarkerElement).map = map;
      } catch {
        // Fallback — skip origin dot if AdvancedMarkers unavailable
      }
    }

    // Fit bounds only when route first appears (not during navigation — user is being followed)
    if (!isNavigating && path.length) {
      const bounds = new google.maps.LatLngBounds();
      path.forEach((p) => bounds.extend(p));
      if (userLocation) bounds.extend(userLocation);
      map.fitBounds(bounds, {
        top: 80,
        right: 40,
        bottom: 280,
        left: 40,
      });
    }
  }, [route, isNavigating, userLocation, mapReady, travelMode]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Inject CSS to keep Google Maps controls readable in Street View and dark mode
  useEffect(() => {
    const styleId = 'gmap-control-overrides';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Force Google Maps controls to stay white/readable in Street View and dark mode */
      .gm-style .gm-control-active {
        background-color: #fff !important;
        color: #666 !important;
      }
      .gm-style .gm-control-active:hover {
        background-color: #f5f5f5 !important;
      }
      .gm-style .gm-control-active > img {
        filter: none !important;
      }
      .gm-style .gmnoprint > div > div {
        background-color: #fff !important;
      }
      /* Ensure Street View Pegman control is always visible */
      .gm-style .gm-svpc {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      /* Street View panorama controls */
      .gm-style .gm-iv-container .gm-control-active {
        background-color: #fff !important;
        color: #666 !important;
      }
      .gm-style .gm-compass {
        background-color: #fff !important;
      }
      /* Prevent dark/black overlay in Street View panorama */
      .gm-style .gm-style-pbc {
        background-color: transparent !important;
      }
      /* Street View address bar — force readable text on all nested elements */
      .gm-style .gm-iv-address {
        background-color: rgba(255, 255, 255, 0.9) !important;
        color: #333 !important;
      }
      .gm-style .gm-iv-address * {
        color: #333 !important;
      }
      .gm-style .gm-iv-address a,
      .gm-style .gm-iv-address a:visited {
        color: #1a73e8 !important;
      }
      /* Street View short address overlay (top-left road name) */
      .gm-style .gm-iv-short-address-description {
        color: #333 !important;
      }
      /* Street View close/back button label */
      .gm-style .gm-iv-back-icon,
      .gm-style .gm-iv-marker {
        filter: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  // Detect when Street View panorama is entered or exited
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const sv = map.getStreetView();
    const listener = sv.addListener('visible_changed', () => {
      const active = sv.getVisible();
      setIsStreetViewActive(active);
    });
    return () => google.maps.event.removeListener(listener);
  }, [mapReady]);

  // Notify parent of Street View state changes
  useEffect(() => {
    onStreetViewChange?.(isStreetViewActive);
  }, [isStreetViewActive, onStreetViewChange]);

  // Center map on user location (or request permission if not yet granted)
  const handleMyLocation = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userLocation) {
      map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
      map.setZoom(17);
      return;
    }

    // No location yet — request geolocation permission
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        map.setZoom(17);
      },
      () => {
        // Permission denied or error — handled by parent's useMapLocation hook
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [userLocation]);

  if (error)
    return (
      <div className="flex h-full items-center justify-center bg-mq-background-secondary/50 text-sm text-red-600 dark:text-red-400 p-4 text-center">
        Google Maps unavailable: {error}
      </div>
    );

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* Loading skeleton — visible until Google Maps initializes */}
      {!mapReady && (
        <div className="absolute inset-0 z-[900] flex flex-col items-center justify-center bg-[#e8eaed] dark:bg-mq-background transition-opacity duration-300">
          <div className="relative mb-4">
            <svg
              className="h-10 w-10 text-mq-content-tertiary animate-pulse"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="h-2 w-20 rounded-full bg-gray-300 dark:bg-mq-content-tertiary/30 animate-pulse" />
        </div>
      )}

      {/* My Location button — left side to avoid Google native controls (zoom/Pegman) on right */}
      {!isStreetViewActive && (
        <button
          onClick={handleMyLocation}
          className={`absolute ${panelVisible ? 'bottom-[28rem]' : 'bottom-20'} left-3 z-[1100] flex h-10 w-10 items-center justify-center rounded bg-white dark:bg-mq-card-background shadow-[0_1px_4px_rgba(0,0,0,0.3)] transition-[bottom] duration-200 hover:bg-gray-100 dark:hover:bg-mq-hover-background active:bg-gray-200 dark:active:bg-mq-background-secondary`}
          aria-label="My location"
          title="My location"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 text-gray-600 dark:text-mq-content-secondary"
          >
            <circle cx={12} cy={12} r={4} stroke="currentColor" strokeWidth={2} fill="none" />
            <circle
              cx={12}
              cy={12}
              r={2}
              fill={userLocation ? '#4285F4' : 'currentColor'}
              stroke="none"
            />
            <line x1={12} y1={2} x2={12} y2={6} stroke="currentColor" strokeWidth={2} />
            <line x1={12} y1={18} x2={12} y2={22} stroke="currentColor" strokeWidth={2} />
            <line x1={2} y1={12} x2={6} y2={12} stroke="currentColor" strokeWidth={2} />
            <line x1={18} y1={12} x2={22} y2={12} stroke="currentColor" strokeWidth={2} />
          </svg>
        </button>
      )}
    </div>
  );
}
