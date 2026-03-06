'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Building } from '@/features/map/lib/buildings';
import { CAMPUS_CENTRE_GPS } from '@/features/map/lib/constants';
import { getBuildingGps } from '@/features/map/lib/buildings';
import { loadGoogleMaps } from '@/lib/maps/google/loader';
import { decodePolyline } from '@/lib/maps/google/decodePolyline';
import type { GoogleComputedRoute, MapLatLng } from '@/lib/maps/google/types';
import { useSafeTranslation } from '@/lib/hooks/useSafeTranslation';

type GoogleCanvasMarker = google.maps.Marker | google.maps.marker.AdvancedMarkerElement;

const FALLBACK_GOOGLE_MAP_ID = 'DEMO_MAP_ID';

interface GoogleMapCanvasProps {
  buildings: Building[];
  selectedBuilding?: Building;
  userLocation: MapLatLng | null;
  userHeading: number | null;
  route: GoogleComputedRoute | null;
  isNavigating: boolean;
  onSelectBuilding?: (building: Building) => void;
}

export function GoogleMapCanvas({
  buildings,
  selectedBuilding,
  userLocation,
  userHeading,
  route,
  isNavigating,
  onSelectBuilding,
}: GoogleMapCanvasProps) {
  const { safeT } = useSafeTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const userMarkerRef = useRef<GoogleCanvasMarker | null>(null);
  const userAccuracyCircleRef = useRef<google.maps.Circle | null>(null);
  const buildingMarkersRef = useRef<Map<string, GoogleCanvasMarker>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [useAdvancedMarkers, setUseAdvancedMarkers] = useState(true);
  const googleMapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? FALLBACK_GOOGLE_MAP_ID;
  const hasUserInteractedRef = useRef(false);

  const sortedBuildings = useMemo(
    () => [...buildings].sort((left, right) => left.id.localeCompare(right.id)),
    [buildings],
  );

  // Track user interaction with the map to avoid fighting auto-pan
  const markUserInteraction = useCallback(() => {
    hasUserInteractedRef.current = true;
  }, []);

  // Initialize the map once
  useEffect(() => {
    let cancelled = false;
    const buildingMarkers = buildingMarkersRef.current;

    async function initialiseMap() {
      if (!containerRef.current) return;

      try {
        const googleMaps = await loadGoogleMaps();
        const { Map } = (await googleMaps.importLibrary('maps')) as google.maps.MapsLibrary;

        if (cancelled || !containerRef.current) return;

        const map = new Map(containerRef.current, {
          center: CAMPUS_CENTRE_GPS,
          zoom: 16,
          mapId: googleMapId,
          fullscreenControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          clickableIcons: false,
          gestureHandling: 'greedy',
        });

        // Track user map interactions
        map.addListener('dragstart', markUserInteraction);
        map.addListener('zoom_changed', markUserInteraction);

        mapRef.current = map;

        // Test if AdvancedMarkerElement is available
        try {
          await googleMaps.importLibrary('marker');
        } catch {
          setUseAdvancedMarkers(false);
        }

        setError(null);
      } catch (initialiseError) {
        const message =
          initialiseError instanceof Error
            ? initialiseError.message
            : safeT('googleMapUnavailable', 'Google Maps failed to load.');
        setError(message);
      }
    }

    initialiseMap();

    return () => {
      cancelled = true;
      routePolylineRef.current?.setMap(null);
      routePolylineRef.current = null;
      userAccuracyCircleRef.current?.setMap(null);
      userAccuracyCircleRef.current = null;
      clearMarker(userMarkerRef.current);
      userMarkerRef.current = null;
      buildingMarkers.forEach((marker) => {
        clearMarker(marker);
      });
      buildingMarkers.clear();
    };
    // Only reinit if mapId changes - NOT on selectedBuilding change
  }, [googleMapId, safeT, markUserInteraction]);

  // Sync building markers
  useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;

    async function syncBuildingMarkers() {
      const googleMaps = await loadGoogleMaps();

      let markerLibrary: google.maps.MarkerLibrary | null = null;
      if (useAdvancedMarkers) {
        try {
          markerLibrary = (await googleMaps.importLibrary('marker')) as google.maps.MarkerLibrary;
        } catch {
          setUseAdvancedMarkers(false);
        }
      }

      if (cancelled || !mapRef.current) return;

      buildingMarkersRef.current.forEach((marker) => {
        clearMarker(marker);
      });
      buildingMarkersRef.current.clear();

      sortedBuildings.forEach((building) => {
        const position = getBuildingGps(building);
        const isSelected = building.id === selectedBuilding?.id;
        const title = `${building.id} ${building.name}`.trim();

        let marker: GoogleCanvasMarker | null = null;

        if (markerLibrary?.AdvancedMarkerElement) {
          marker = new markerLibrary.AdvancedMarkerElement({
            map: mapRef.current,
            position,
            title,
            content: createBuildingMarkerElement(building.id, isSelected),
            gmpClickable: true,
          });
        } else {
          // Fallback to legacy Marker
          marker = new google.maps.Marker({
            map: mapRef.current,
            position,
            title,
            label: {
              text: building.id,
              fontSize: '12px',
              fontWeight: '700',
              color: isSelected ? '#ffffff' : '#1e293b',
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: isSelected ? 20 : 16,
              fillColor: isSelected ? '#d24140' : 'rgba(255, 255, 255, 0.94)',
              fillOpacity: 1,
              strokeColor: isSelected ? '#b51f2a' : 'rgba(42, 45, 52, 0.16)',
              strokeWeight: isSelected ? 2 : 1,
            },
          });
        }

        if (!marker) return;

        if (marker instanceof google.maps.Marker) {
          marker.addListener('click', () => {
            onSelectBuilding?.(building);
          });
        } else {
          marker.addListener('gmp-click', () => {
            onSelectBuilding?.(building);
          });
        }

        buildingMarkersRef.current.set(building.id, marker);
      });
    }

    syncBuildingMarkers();

    return () => {
      cancelled = true;
    };
  }, [onSelectBuilding, selectedBuilding?.id, sortedBuildings, useAdvancedMarkers]);

  // Sync user location marker with heading indicator
  useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;

    async function syncUserMarker() {
      if (cancelled || !mapRef.current) return;

      if (!userLocation) {
        clearMarker(userMarkerRef.current);
        userMarkerRef.current = null;
        userAccuracyCircleRef.current?.setMap(null);
        userAccuracyCircleRef.current = null;
        return;
      }

      const googleMaps = await loadGoogleMaps();

      if (cancelled || !mapRef.current) return;

      // User accuracy circle (shows approximate GPS accuracy)
      if (!userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current = new google.maps.Circle({
          map: mapRef.current,
          center: userLocation,
          radius: 30,
          fillColor: '#2563eb',
          fillOpacity: 0.08,
          strokeColor: '#2563eb',
          strokeOpacity: 0.2,
          strokeWeight: 1,
          clickable: false,
        });
      } else {
        userAccuracyCircleRef.current.setCenter(userLocation);
      }

      let markerLibrary: google.maps.MarkerLibrary | null = null;
      if (useAdvancedMarkers) {
        try {
          markerLibrary = (await googleMaps.importLibrary('marker')) as google.maps.MarkerLibrary;
        } catch {
          // Fall back silently
        }
      }

      if (cancelled || !mapRef.current) return;

      if (markerLibrary?.AdvancedMarkerElement) {
        if (!userMarkerRef.current || userMarkerRef.current instanceof google.maps.Marker) {
          // Create or replace with AdvancedMarkerElement
          clearMarker(userMarkerRef.current);
          const content = createUserMarkerElement(userHeading);
          userMarkerRef.current = new markerLibrary.AdvancedMarkerElement({
            map: mapRef.current,
            position: userLocation,
            title: safeT('myLocation', 'My Location'),
            content,
          });
        } else {
          // Update existing AdvancedMarkerElement position and heading
          userMarkerRef.current.position = userLocation;
          updateUserMarkerHeading(
            userMarkerRef.current.content as HTMLDivElement | null,
            userHeading,
          );
        }
      } else {
        // Legacy marker fallback
        if (!userMarkerRef.current || !(userMarkerRef.current instanceof google.maps.Marker)) {
          clearMarker(userMarkerRef.current);
          userMarkerRef.current = new google.maps.Marker({
            map: mapRef.current,
            position: userLocation,
            title: safeT('myLocation', 'My Location'),
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            },
          });
        } else {
          userMarkerRef.current.setPosition(userLocation);
        }
      }
    }

    syncUserMarker();

    return () => {
      cancelled = true;
    };
  }, [safeT, useAdvancedMarkers, userLocation, userHeading]);

  // Pan/zoom logic: route, selected building, or user location
  useEffect(() => {
    if (!mapRef.current) return;

    routePolylineRef.current?.setMap(null);
    routePolylineRef.current = null;

    if (route?.encodedPolyline) {
      const path = decodePolyline(route.encodedPolyline);
      routePolylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#D24140',
        strokeOpacity: 0.92,
        strokeWeight: 5,
      });
      routePolylineRef.current.setMap(mapRef.current);

      if (path.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        path.forEach((point) => bounds.extend(point));
        if (userLocation) {
          bounds.extend(userLocation);
        }
        mapRef.current.fitBounds(bounds, 72);
      }
      hasUserInteractedRef.current = false;
      return;
    }

    if (selectedBuilding) {
      mapRef.current.panTo(getBuildingGps(selectedBuilding));
      mapRef.current.setZoom(17);
      hasUserInteractedRef.current = false;
      return;
    }

    if (userLocation && !hasUserInteractedRef.current) {
      mapRef.current.panTo(userLocation);
    }
  }, [route, selectedBuilding, userLocation]);

  // During navigation, follow user location unless user panned away
  useEffect(() => {
    if (!mapRef.current || !isNavigating || !userLocation || hasUserInteractedRef.current) return;
    mapRef.current.panTo(userLocation);
  }, [isNavigating, userLocation]);

  const handleRecenter = useCallback(() => {
    if (!mapRef.current || !userLocation) return;
    hasUserInteractedRef.current = false;
    mapRef.current.panTo(userLocation);
    mapRef.current.setZoom(17);
  }, [userLocation]);

  return (
    <div className="relative h-full w-full bg-mq-card-background">
      <div
        ref={containerRef}
        className="h-full w-full"
        aria-label={safeT('googleMaps', 'Google Maps')}
      />

      {/* Recenter button - shown when user has panned away during navigation */}
      {isNavigating && userLocation && (
        <button
          type="button"
          onClick={handleRecenter}
          className="absolute bottom-24 right-3 z-[1050] flex h-11 w-11 items-center justify-center rounded-full border border-mq-border bg-mq-card-background/95 shadow-lg backdrop-blur-sm transition-transform hover:scale-105 active:scale-95"
          aria-label={safeT('myLocation', 'My Location')}
          title={safeT('myLocation', 'My Location')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-mq-primary"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </button>
      )}

      {error && (
        <div className="absolute inset-x-3 top-3 rounded-mq-xl border border-mq-danger/20 bg-mq-card-background/95 p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-mq-danger" />
            <div>
              <p className="text-sm font-semibold text-mq-content">
                {safeT('googleMapUnavailable', 'Google Map unavailable')}
              </p>
              <p className="mt-1 text-sm text-mq-content-secondary">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function clearMarker(marker: GoogleCanvasMarker | null): void {
  if (!marker) return;
  if (marker instanceof google.maps.Marker) {
    marker.setMap(null);
    return;
  }
  marker.map = null;
}

function createBuildingMarkerElement(label: string, selected: boolean): HTMLDivElement {
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
    transition: 'transform 0.15s ease',
  });
  el.textContent = label;
  return el;
}

function createUserMarkerElement(heading: number | null): HTMLDivElement {
  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    position: 'relative',
    width: '28px',
    height: '28px',
  });

  // Heading indicator (arrow) — shown when we have compass heading
  if (heading !== null) {
    const arrow = document.createElement('div');
    arrow.className = 'user-heading-arrow';
    Object.assign(arrow.style, {
      position: 'absolute',
      top: '-8px',
      left: '50%',
      transform: `translateX(-50%) rotate(${heading}deg)`,
      transformOrigin: '50% calc(100% + 6px)',
      width: '0',
      height: '0',
      borderLeft: '6px solid transparent',
      borderRight: '6px solid transparent',
      borderBottom: '10px solid #2563eb',
      opacity: '0.7',
      transition: 'transform 0.3s ease',
    });
    wrapper.appendChild(arrow);
  }

  // Blue dot
  const dot = document.createElement('div');
  Object.assign(dot.style, {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '20px',
    height: '20px',
    borderRadius: '999px',
    background: '#2563eb',
    border: '3px solid rgba(255,255,255,0.95)',
    boxShadow: '0 0 0 8px rgba(37,99,235,0.16)',
  });
  wrapper.appendChild(dot);

  return wrapper;
}

function updateUserMarkerHeading(content: HTMLDivElement | null, heading: number | null): void {
  if (!content) return;
  const arrow = content.querySelector('.user-heading-arrow') as HTMLDivElement | null;

  if (heading !== null) {
    if (arrow) {
      arrow.style.transform = `translateX(-50%) rotate(${heading}deg)`;
    } else {
      // Create arrow if it didn't exist before
      const newArrow = document.createElement('div');
      newArrow.className = 'user-heading-arrow';
      Object.assign(newArrow.style, {
        position: 'absolute',
        top: '-8px',
        left: '50%',
        transform: `translateX(-50%) rotate(${heading}deg)`,
        transformOrigin: '50% calc(100% + 6px)',
        width: '0',
        height: '0',
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderBottom: '10px solid #2563eb',
        opacity: '0.7',
        transition: 'transform 0.3s ease',
      });
      content.insertBefore(newArrow, content.firstChild);
    }
  } else if (arrow) {
    arrow.remove();
  }
}
