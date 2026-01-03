'use client';

import { useEffect, useState } from 'react';
import L from 'leaflet';
import { MapContainer, ImageOverlay, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Badge } from '@/components/ui/badge';
import { buildings, Building } from '@/lib/map/buildings';

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

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Map dimensions (image size)
const MAP_WIDTH = 4678;
const MAP_HEIGHT = 3307;

// Campus image path
const CAMPUS_IMAGE_URL = '/maps/raster/mq-campus.png';

// Macquarie University coordinates (approximate bounds for campus)
const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [-33.783, 151.105], // bottom-left
  [-33.770, 151.125], // top-right
];

const resolveCssColor = (variableName: string, fallback: string) => {
  if (typeof window === 'undefined') {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  return value || fallback;
};

// Custom marker icon
const createMarkerIcon = (isSelected: boolean) => {
  const baseFill = resolveCssColor('--c-red', '#a6192e');
  const selectedFill = resolveCssColor('--c-bright-red', '#d6001c');
  const centerFill = resolveCssColor('--c-background-invert', '#ffffff');
  const fill = isSelected ? selectedFill : baseFill;
  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.7 12.5 28.5 12.5 28.5s12.5-19.8 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="${fill}"/>
          <circle cx="12.5" cy="12.5" r="5" fill="${centerFill}"/>
        </svg>
      `)}`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  shadowSize: [41, 41],
  });
};

// Component to handle map setup and image overlay
function MapController({
  selectedBuilding,
  coordPickerMode,
  onMapClick
}: {
  selectedBuilding?: Building;
  coordPickerMode: boolean;
  onMapClick: (e: L.LeafletMouseEvent) => void;
}) {
  const map = useMap();

  // Handle map clicks
  useMapEvents({
    click: onMapClick,
  });

  useEffect(() => {
    // Center on Macquarie University
    const center: [number, number] = [-33.7767, 151.1134];
    map.setView(center, 16);

    // Set bounds to campus area
    map.setMaxBounds(CAMPUS_BOUNDS);
    map.setMinZoom(16);
    map.setMaxZoom(20);  // Increased max zoom for more detail
  }, [map]);

  useEffect(() => {
    if (selectedBuilding) {
      // Convert building pixel coordinates to lat/lng
      const buildingLatLng = pixelToLatLng(selectedBuilding.position[0], selectedBuilding.position[1]);
      map.setView(buildingLatLng, 17);

      // Find and open the popup for this building
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          const marker = layer as L.Marker;
          const popupContent = marker.getPopup()?.getContent();
          if (popupContent && typeof popupContent === 'string' && popupContent.includes(selectedBuilding.id)) {
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

interface CampusMapProps {
  selectedBuilding?: Building;
  coordPickerMode: boolean;
  onMapClick: (e: L.LeafletMouseEvent) => void;
}

export default function CampusMap({ selectedBuilding, coordPickerMode, onMapClick }: CampusMapProps) {
  const [themeKey, setThemeKey] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const updateThemeKey = () => {
      if (typeof document !== 'undefined' && document.documentElement) {
        const isDark = document.documentElement.classList.contains('dark');
        setThemeKey(isDark ? 'dark' : 'light');
      }
    };

    updateThemeKey();
    if (typeof document !== 'undefined' && document.documentElement) {
      const observer = new MutationObserver(updateThemeKey);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    }
  }, []);

  return (
            <MapContainer
              center={[-33.77, 151.115]}
              zoom={16}
              zoomControl
              style={{
                height: '100%',
                width: '100%',
              }}
            >
              {/* Campus image overlay */}
              <ImageOverlay
                url={CAMPUS_IMAGE_URL}
                bounds={CAMPUS_BOUNDS}
              />

              <MapController
                selectedBuilding={selectedBuilding}
                coordPickerMode={coordPickerMode}
                onMapClick={onMapClick}
              />

              {/* Building markers */}
              {buildings.map((building) => {
                const buildingLatLng = pixelToLatLng(building.position[0], building.position[1]);
                return (
                  <Marker
                    key={`${building.id}-${themeKey}-${selectedBuilding?.id === building.id ? 'selected' : 'base'}`}
                    position={buildingLatLng}
                    icon={createMarkerIcon(selectedBuilding?.id === building.id)}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <h3 className="font-semibold text-mq-content">{building.name}</h3>
                        <p className="text-mq-sm text-mq-content-secondary mb-2">Building {building.id}</p>
                        {building.description && (
                          <p className="text-mq-sm text-mq-content-tertiary mb-3">{building.description}</p>
                        )}
                        {building.tags && building.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {building.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
  );
}
