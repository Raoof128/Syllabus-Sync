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

function createBuildingPin(label: string, selected: boolean): HTMLDivElement {
  const el = document.createElement('div');
  Object.assign(el.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: selected ? '54px' : '42px',
    height: selected ? '40px' : '32px',
    padding: '0 10px',
    borderRadius: '999px',
    border: selected ? '2px solid #b51f2a' : '1px solid rgba(42, 45, 52, 0.16)',
    background: selected ? '#d24140' : 'rgba(255, 255, 255, 0.94)',
    color: selected ? '#ffffff' : '#1e293b',
    fontSize: '12px',
    fontWeight: '700',
    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.16)',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  });
  el.textContent = label;
  // Hover effect
  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.12)';
    el.style.boxShadow = '0 16px 32px rgba(15, 23, 42, 0.24)';
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1)';
    el.style.boxShadow = '0 12px 28px rgba(15, 23, 42, 0.16)';
  });
  return el;
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

interface Props {
  buildings: Building[];
  selectedBuilding?: Building;
  externalDestination: ExternalDestination | null;
  userLocation: MapLatLng | null;
  route: GoogleComputedRoute | null;
  isNavigating: boolean;
  onSelectBuilding?: (buildingId: string) => void;
}

export default function GoogleMapCanvas({
  buildings,
  selectedBuilding,
  externalDestination,
  userLocation,
  route,
  isNavigating,
  onSelectBuilding,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const buildingMarkersRef = useRef<Map<string, AnyMarker>>(new Map());
  const userMarkerRef = useRef<AnyMarker | null>(null);
  const userAccuracyCircleRef = useRef<google.maps.Circle | null>(null);
  const destMarkerRef = useRef<AnyMarker | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const walkedPolylineRef = useRef<google.maps.Polyline | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
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
          mapTypeControlOptions: { position: google.maps.ControlPosition.TOP_RIGHT },
          streetViewControl: true,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: 'greedy',
          clickableIcons: false,
        });
        infoWindowRef.current = new google.maps.InfoWindow();
        setMapReady(true);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Building markers — with click interaction
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    buildingMarkersRef.current.forEach((m) => clearMarker(m));
    buildingMarkersRef.current.clear();

    buildings.forEach((b) => {
      const pos = getBuildingGps(b);
      const selected = selectedBuilding?.id === b.id;
      const title = `${b.id} ${b.name}`.trim();

      let marker: AnyMarker;
      try {
        marker = new google.maps.marker.AdvancedMarkerElement({
          position: pos,
          title,
          content: createBuildingPin(b.id, selected),
        });
      } catch {
        marker = new google.maps.Marker({
          position: pos,
          title,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: selected ? 10 : 7,
            fillColor: selected ? '#d24140' : '#1d4ed8',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
        });
      }

      // Click handler — select this building
      if (onSelectBuilding) {
        if (marker instanceof google.maps.Marker) {
          marker.addListener('click', () => onSelectBuilding(b.id));
        } else {
          marker.addEventListener('gmp-click', () => onSelectBuilding(b.id));
        }
      }

      // Show info window on hover / click
      const showInfo = () => {
        const iw = infoWindowRef.current;
        if (!iw || !map) return;
        const dist = userLocation ? haversineMetres(userLocation, pos) : null;
        const distStr =
          dist !== null
            ? dist >= 1000
              ? `${(dist / 1000).toFixed(1)} km`
              : `${Math.round(dist)} m`
            : '';
        iw.setContent(
          `<div style="font-family:system-ui;padding:2px 0"><strong>${b.id}</strong> ${b.name}${distStr ? `<br/><span style="color:#6b7280;font-size:12px">${distStr} away</span>` : ''}</div>`,
        );
        if (marker instanceof google.maps.Marker) {
          iw.open(map, marker);
        } else {
          iw.open({ map, anchor: marker });
        }
      };

      if (marker instanceof google.maps.Marker) {
        marker.addListener('click', showInfo);
        marker.setMap(map);
      } else {
        marker.addEventListener('gmp-click', showInfo);
        marker.map = map;
      }
      buildingMarkersRef.current.set(b.id, marker);
    });
  }, [buildings, selectedBuilding, mapReady, onSelectBuilding, userLocation]);

  // Pan to selected building
  useEffect(() => {
    if (!mapRef.current || !selectedBuilding) return;
    mapRef.current.panTo(getBuildingGps(selectedBuilding));
    mapRef.current.setZoom(18);
  }, [selectedBuilding, mapReady]);

  // External destination marker
  useEffect(() => {
    if (destMarkerRef.current) {
      clearMarker(destMarkerRef.current);
      destMarkerRef.current = null;
    }
    const map = mapRef.current;
    if (!map || !externalDestination) return;

    const pos = { lat: externalDestination.lat, lng: externalDestination.lng };
    let m: AnyMarker;
    try {
      const pin = new google.maps.marker.PinElement({
        background: '#d24140',
        borderColor: '#b51f2a',
        glyphColor: '#ffffff',
        scale: 1.4,
      });
      m = new google.maps.marker.AdvancedMarkerElement({
        position: pos,
        title: externalDestination.label,
        content: pin.element,
      });
    } catch {
      m = new google.maps.Marker({ position: pos, title: externalDestination.label });
    }

    if (m instanceof google.maps.Marker) {
      m.setMap(map);
    } else {
      m.map = map;
    }
    destMarkerRef.current = m;
    map.panTo(pos);
    map.setZoom(17);
  }, [externalDestination, mapReady]);

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

  // Route polyline — shows walked portion in different color
  useEffect(() => {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    if (walkedPolylineRef.current) {
      walkedPolylineRef.current.setMap(null);
      walkedPolylineRef.current = null;
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
        strokeWeight: 4,
        geodesic: true,
      });
    }

    // Remaining route
    const remainingPath = isNavigating && splitIdx > 0 ? path.slice(splitIdx) : path;
    polylineRef.current = new google.maps.Polyline({
      path: remainingPath,
      map,
      strokeColor: '#3b82f6',
      strokeOpacity: 0.9,
      strokeWeight: 5,
      geodesic: true,
    });

    // Fit bounds only when route first appears (not during navigation — user is being followed)
    if (!isNavigating && path.length) {
      const bounds = new google.maps.LatLngBounds();
      path.forEach((p) => bounds.extend(p));
      if (userLocation) bounds.extend(userLocation);
      map.fitBounds(bounds, { top: 60, right: 20, bottom: 220, left: 20 });
    }
  }, [route, isNavigating, userLocation, mapReady]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  if (error)
    return (
      <div className="flex h-full items-center justify-center bg-muted/50 text-sm text-destructive p-4 text-center">
        Google Maps unavailable: {error}
      </div>
    );

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
