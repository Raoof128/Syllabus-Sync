'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Building } from '@/features/map/lib/buildings';
import { getBuildingGps } from '@/features/map/lib/buildings';
import { CAMPUS_CENTRE_GPS } from '@/features/map/lib/constants';
import { loadGoogleMaps } from '@/lib/maps/google/loader';
import { decodePolyline } from '@/lib/maps/google/decodePolyline';
import type { GoogleComputedRoute, MapLatLng, ExternalDestination } from '@/lib/maps/google/types';

const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID;

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
  });
  el.textContent = label;
  return el;
}

interface Props {
  buildings: Building[];
  selectedBuilding?: Building;
  externalDestination: ExternalDestination | null;
  userLocation: MapLatLng | null;
  route: GoogleComputedRoute | null;
}

export default function GoogleMapCanvas({
  buildings,
  selectedBuilding,
  externalDestination,
  userLocation,
  route,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const buildingMarkersRef = useRef<Map<string, AnyMarker>>(new Map());
  const userMarkerRef = useRef<AnyMarker | null>(null);
  const destMarkerRef = useRef<AnyMarker | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitedMode, setLimitedMode] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Initialise map once
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: CAMPUS_CENTRE_GPS,
          zoom: 16,
          mapId: MAP_ID || undefined,
          mapTypeControl: true,
          mapTypeControlOptions: { position: google.maps.ControlPosition.TOP_RIGHT },
          streetViewControl: true,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: 'greedy',
          clickableIcons: false,
        });
        if (!MAP_ID) setLimitedMode(true);
        setMapReady(true);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Building markers
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

      if (marker instanceof google.maps.Marker) {
        marker.setMap(map);
      } else {
        marker.map = map;
      }
      buildingMarkersRef.current.set(b.id, marker);
    });
  }, [buildings, selectedBuilding, mapReady]);

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

  // User location dot
  const renderUserMarker = useCallback((loc: MapLatLng) => {
    const map = mapRef.current;
    if (!map) return;

    if (!userMarkerRef.current) {
      const dot = document.createElement('div');
      Object.assign(dot.style, {
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: '#3b82f6',
        border: '3px solid #fff',
        boxShadow: '0 0 0 4px rgba(59,130,246,0.3)',
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
    } else {
      if (userMarkerRef.current instanceof google.maps.Marker) {
        userMarkerRef.current.setPosition(loc);
      } else {
        userMarkerRef.current.position = loc;
      }
    }
  }, []);

  useEffect(() => {
    if (userLocation) renderUserMarker(userLocation);
  }, [userLocation, renderUserMarker, mapReady]);

  // Route polyline
  useEffect(() => {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    const map = mapRef.current;
    if (!map || !route) return;

    const path = decodePolyline(route.encodedPolyline);
    polylineRef.current = new google.maps.Polyline({
      path,
      map,
      strokeColor: '#3b82f6',
      strokeOpacity: 0.9,
      strokeWeight: 5,
      geodesic: true,
    });
    if (path.length) {
      const bounds = new google.maps.LatLngBounds();
      path.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, { top: 60, right: 20, bottom: 220, left: 20 });
    }
  }, [route, mapReady]);

  if (error)
    return (
      <div className="flex h-full items-center justify-center bg-muted/50 text-sm text-destructive p-4 text-center">
        Google Maps unavailable: {error}
      </div>
    );

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {limitedMode && (
        <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-yellow-300">
          Limited mode — add NEXT_PUBLIC_GOOGLE_MAP_ID for vector tiles
        </div>
      )}
    </div>
  );
}
