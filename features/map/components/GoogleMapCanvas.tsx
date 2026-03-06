'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Building } from '@/features/map/lib/buildings';
import { CAMPUS_CENTRE_GPS } from '@/features/map/lib/constants';
import { getBuildingGps } from '@/features/map/lib/buildings';
import { loadGoogleMaps } from '@/lib/maps/google/loader';
import { decodePolyline } from '@/lib/maps/google/decodePolyline';
import type { GoogleComputedRoute, MapLatLng } from '@/lib/maps/google/types';
import { useSafeTranslation } from '@/lib/hooks/useSafeTranslation';

interface GoogleMapCanvasProps {
  buildings: Building[];
  selectedBuilding?: Building;
  userLocation: MapLatLng | null;
  route: GoogleComputedRoute | null;
  onSelectBuilding?: (building: Building) => void;
}

export function GoogleMapCanvas({
  buildings,
  selectedBuilding,
  userLocation,
  route,
  onSelectBuilding,
}: GoogleMapCanvasProps) {
  const { safeT } = useSafeTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const buildingMarkersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(
    new Map(),
  );
  const [error, setError] = useState<string | null>(null);
  const googleMapId = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID;

  const sortedBuildings = useMemo(
    () => [...buildings].sort((left, right) => left.id.localeCompare(right.id)),
    [buildings],
  );

  useEffect(() => {
    let cancelled = false;
    const buildingMarkers = buildingMarkersRef.current;

    async function initialiseMap() {
      if (!containerRef.current) return;

      if (!googleMapId) {
        setError(
          safeT(
            'googleMapIdMissing',
            'NEXT_PUBLIC_GOOGLE_MAP_ID is missing. Configure a Google Map ID to render the JavaScript map.',
          ),
        );
        return;
      }

      try {
        const googleMaps = await loadGoogleMaps();
        const { Map } = (await googleMaps.importLibrary('maps')) as google.maps.MapsLibrary;

        if (cancelled || !containerRef.current) return;

        mapRef.current = new Map(containerRef.current, {
          center: selectedBuilding ? getBuildingGps(selectedBuilding) : CAMPUS_CENTRE_GPS,
          zoom: selectedBuilding ? 17 : 16,
          mapId: googleMapId,
          fullscreenControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          clickableIcons: false,
          gestureHandling: 'greedy',
        });

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
      if (userMarkerRef.current) {
        userMarkerRef.current.map = null;
      }
      userMarkerRef.current = null;
      buildingMarkers.forEach((marker) => {
        marker.map = null;
      });
      buildingMarkers.clear();
    };
  }, [googleMapId, safeT, selectedBuilding]);

  useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;

    async function syncBuildingMarkers() {
      const googleMaps = await loadGoogleMaps();
      const { AdvancedMarkerElement } = (await googleMaps.importLibrary(
        'marker',
      )) as google.maps.MarkerLibrary;

      if (cancelled || !mapRef.current) return;

      buildingMarkersRef.current.forEach((marker) => {
        marker.map = null;
      });
      buildingMarkersRef.current.clear();

      sortedBuildings.forEach((building) => {
        const marker = new AdvancedMarkerElement({
          map: mapRef.current,
          position: getBuildingGps(building),
          title: `${building.id} ${building.name}`.trim(),
          content: createBuildingMarkerElement(building.id, building.id === selectedBuilding?.id),
          gmpClickable: true,
        });

        marker.addListener('gmp-click', () => {
          onSelectBuilding?.(building);
        });

        buildingMarkersRef.current.set(building.id, marker);
      });
    }

    syncBuildingMarkers();

    return () => {
      cancelled = true;
    };
  }, [onSelectBuilding, selectedBuilding?.id, sortedBuildings]);

  useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;

    async function syncUserMarker() {
      const googleMaps = await loadGoogleMaps();
      const { AdvancedMarkerElement } = (await googleMaps.importLibrary(
        'marker',
      )) as google.maps.MarkerLibrary;

      if (cancelled || !mapRef.current) return;

      if (!userLocation) {
        if (userMarkerRef.current) {
          userMarkerRef.current.map = null;
        }
        userMarkerRef.current = null;
        return;
      }

      const content = createUserMarkerElement();

      if (!userMarkerRef.current) {
        userMarkerRef.current = new AdvancedMarkerElement({
          map: mapRef.current,
          position: userLocation,
          title: safeT('myLocation', 'My Location'),
          content,
        });
      } else {
        userMarkerRef.current.position = userLocation;
        userMarkerRef.current.content = content;
      }
    }

    syncUserMarker();

    return () => {
      cancelled = true;
    };
  }, [safeT, userLocation]);

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
        mapRef.current.fitBounds(bounds, 72);
      }
      return;
    }

    if (selectedBuilding) {
      mapRef.current.panTo(getBuildingGps(selectedBuilding));
      mapRef.current.setZoom(17);
      return;
    }

    if (userLocation) {
      mapRef.current.panTo(userLocation);
    }
  }, [route, selectedBuilding, userLocation]);

  return (
    <div className="relative h-full w-full bg-mq-card-background">
      <div
        ref={containerRef}
        className="h-full w-full"
        aria-label={safeT('googleMaps', 'Google Maps')}
      />
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

function createBuildingMarkerElement(label: string, selected: boolean): HTMLDivElement {
  const marker = document.createElement('div');
  marker.className = 'google-campus-marker';
  marker.style.display = 'flex';
  marker.style.alignItems = 'center';
  marker.style.justifyContent = 'center';
  marker.style.minWidth = selected ? '54px' : '42px';
  marker.style.height = selected ? '40px' : '32px';
  marker.style.padding = '0 10px';
  marker.style.borderRadius = '999px';
  marker.style.border = selected ? '2px solid #b51f2a' : '1px solid rgba(42, 45, 52, 0.16)';
  marker.style.background = selected ? '#d24140' : 'rgba(255, 255, 255, 0.94)';
  marker.style.color = selected ? '#ffffff' : '#1e293b';
  marker.style.fontSize = '12px';
  marker.style.fontWeight = '700';
  marker.style.boxShadow = '0 12px 28px rgba(15, 23, 42, 0.16)';
  marker.textContent = label;
  return marker;
}

function createUserMarkerElement(): HTMLDivElement {
  const marker = document.createElement('div');
  marker.style.width = '20px';
  marker.style.height = '20px';
  marker.style.borderRadius = '999px';
  marker.style.background = '#2563eb';
  marker.style.border = '3px solid rgba(255,255,255,0.95)';
  marker.style.boxShadow = '0 0 0 8px rgba(37,99,235,0.16)';
  return marker;
}
