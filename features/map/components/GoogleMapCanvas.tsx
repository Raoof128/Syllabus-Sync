'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Building } from '@/features/map/lib/buildings';
import { getBuildingGps } from '@/features/map/lib/buildings';
import { CAMPUS_CENTRE_GPS } from '@/features/map/lib/constants';
import { loadGoogleMaps } from '@/lib/maps/google/loader';
import { decodePolyline } from '@/lib/maps/google/decodePolyline';
import type { GoogleComputedRoute, MapLatLng, ExternalDestination } from '@/lib/maps/google/types';

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
}

export default function GoogleMapCanvas({
  selectedBuilding,
  externalDestination,
  userLocation,
  route,
  isNavigating,
  panelVisible,
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
          mapTypeControlOptions: { position: google.maps.ControlPosition.TOP_LEFT },
          streetViewControl: true,
          streetViewControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
          fullscreenControl: false,
          zoomControl: true,
          zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
          scaleControl: true,
          gestureHandling: 'greedy',
          clickableIcons: true,
          // Disable 3D tilt/rotate camera control on vector maps (not in TS types yet)
          ...({ tiltControl: false, rotateControl: false } as Partial<google.maps.MapOptions>),
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

    // Outer outline layer (darker blue, wider)
    outlinePolylineRef.current = new google.maps.Polyline({
      path: remainingPath,
      map,
      strokeColor: '#1a56db',
      strokeOpacity: 1.0,
      strokeWeight: 8,
      geodesic: true,
      zIndex: 2,
    });

    // Inner core layer (Google Maps blue)
    polylineRef.current = new google.maps.Polyline({
      path: remainingPath,
      map,
      strokeColor: '#4285F4',
      strokeOpacity: 1.0,
      strokeWeight: 6,
      geodesic: true,
      zIndex: 3,
    });

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
  }, [route, isNavigating, userLocation, mapReady]);

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
      /* Street View panorama controls */
      .gm-style .gm-iv-container .gm-control-active {
        background-color: #fff !important;
        color: #666 !important;
      }
      .gm-style .gm-compass {
        background-color: #fff !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

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
      <div className="flex h-full items-center justify-center bg-muted/50 text-sm text-destructive p-4 text-center">
        Google Maps unavailable: {error}
      </div>
    );

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* My Location button — always visible, always white (matches Google Maps native controls) */}
      {/* Sits between Pegman (above zoom +/-) and the zoom buttons on the right side */}
      <button
        onClick={handleMyLocation}
        className={`absolute ${panelVisible ? 'bottom-[28rem]' : 'bottom-[8.5rem]'} right-[10px] z-[1100] flex h-10 w-10 items-center justify-center rounded-sm bg-white shadow-[0_1px_4px_rgba(0,0,0,0.3)] transition-[bottom] duration-200 hover:bg-gray-100 active:bg-gray-200`}
        aria-label="My location"
        title="My location"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-5 w-5 ${userLocation ? 'text-[#666]' : 'text-[#999]'}`}
        >
          {/* Crosshair icon matching Google Maps */}
          <circle cx={12} cy={12} r={4} fill="currentColor" fillOpacity={0.15} />
          <circle cx={12} cy={12} r={2} fill={userLocation ? '#4285F4' : '#999'} stroke="none" />
          <line x1={12} y1={2} x2={12} y2={6} />
          <line x1={12} y1={18} x2={12} y2={22} />
          <line x1={2} y1={12} x2={6} y2={12} />
          <line x1={18} y1={12} x2={22} y2={12} />
        </svg>
      </button>
    </div>
  );
}
