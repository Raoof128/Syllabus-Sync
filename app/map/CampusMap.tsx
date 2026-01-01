'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Badge } from '@/components/ui/badge';
import { buildings, Building } from '@/lib/map/buildings';

// Function to generate tile URL with bounds checking and y-flipping for TMS
const getTileUrl = (coords: L.Coords) => {
  const z = coords.z;
  let x = coords.x;
  let y = coords.y;

  // Get the max coordinates for this zoom level
  const [maxX, maxY] = TILE_RANGES[z] || [18, 12];

  // For TMS tiles (y=0 is top), flip y-coordinate for CRS.Simple (y=0 is bottom)
  y = maxY - y;  // Flip the y-coordinate

  // Clamp coordinates to valid range for this zoom level
  x = Math.max(0, Math.min(maxX, x));
  y = Math.max(0, Math.min(maxY, y));

  return `/tiles/${z}/${x}/${y}.png`;
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
const TILE_SIZE = 256;

// Tile ranges for each zoom level (based on actual tiles)
// Zoom level -> [maxX, maxY]
const TILE_RANGES: Record<number, [number, number]> = {
  3: [4, 3],    // 5x4 tiles - Minimum zoom
  4: [9, 6],    // 10x7 tiles
  5: [18, 12],  // 19x13 tiles - Maximum zoom
};

// Custom marker icon
const createMarkerIcon = (isSelected: boolean) => new L.Icon({
  iconUrl: isSelected
    ? `data:image/svg+xml;base64,${btoa(`
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.7 12.5 28.5 12.5 28.5s12.5-19.8 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="#10b981"/>
        <circle cx="12.5" cy="12.5" r="5" fill="white"/>
      </svg>
    `)}`
    : `data:image/svg+xml;base64,${btoa(`
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.7 12.5 28.5 12.5 28.5s12.5-19.8 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="#A6192E"/>
        <circle cx="12.5" cy="12.5" r="5" fill="white"/>
      </svg>
    `)}`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  shadowSize: [41, 41],
});

// Component to handle map centering, popup opening, click events, and tile layer
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
    // Add tile layer using a custom tile layer that overrides getTileUrl
    const tileLayer = L.tileLayer('', {
      noWrap: true,
    });

    // Override the getTileUrl method
    tileLayer.getTileUrl = getTileUrl;

    tileLayer.addTo(map);

    // Set more restrictive bounds to prevent gray areas
    // Add inward padding to make bounds more restrictive
    const paddingX = 100; // horizontal padding in pixels
    const paddingY = 200; // vertical padding in pixels (more for top to prevent gray screen)

    const bounds = new L.LatLngBounds(
      map.unproject([paddingX, MAP_HEIGHT - paddingY/2], 5),     // bottom-left: inset from edges
      map.unproject([MAP_WIDTH - paddingX, paddingY], 5)          // top-right: more inset on top
    );
    map.setMaxBounds(bounds);

    // Center the map on the image center at default zoom
    map.setView(map.unproject([MAP_WIDTH / 2, MAP_HEIGHT / 2], 5), 5);

    // Cleanup function to remove the layer
    return () => {
      map.removeLayer(tileLayer);
    };
  }, [map]);

  useEffect(() => {
    if (selectedBuilding) {
      map.setView(selectedBuilding.position, 3);
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
  return (
            <MapContainer
              center={[0, 0]}
              zoom={5}
              minZoom={3}
              maxZoom={5}
              zoomControl={true}
              maxBoundsViscosity={1.0}
              bounceAtZoomLimits={false}
              crs={L.CRS.Simple}
              style={{
                height: '100%',
                width: '100%',
                backgroundColor: '#f1f5f9' // Pleasant light background
              }}
            >
              <MapController
                selectedBuilding={selectedBuilding}
                coordPickerMode={coordPickerMode}
                onMapClick={onMapClick}
              />
      {buildings.map((building) => (
        <Marker
          key={building.id}
          position={building.position}
          icon={createMarkerIcon(selectedBuilding?.id === building.id)}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{building.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Building {building.id}</p>
              {building.description && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{building.description}</p>
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
      ))}
    </MapContainer>
  );
}