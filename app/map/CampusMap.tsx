import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, ImageOverlay, Marker, Popup, useMap, useMapEvents, Polyline } from 'react-leaflet';
import { Badge } from '@/components/ui/badge';
import { buildings, Building } from '@/lib/map/buildings';
import { RoutePreview, formatDistance, formatDuration, openBestNavApp } from '@/lib/map/navigationHelpers';
import { fetchORSRoute } from '@/lib/services/ors';

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
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'; // Hybrid Nav Req

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

// Fallback origin (Campus Hub/Centre approx)
const CAMPUS_CENTRE = { lat: -33.775, lng: 151.115 };

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

// Google-style Blue Dot Icon
const userIcon = L.divIcon({
  className: "user-location-dot",
  html: `<div class="pulse"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Component to handle map setup and image overlay
function MapController({
  selectedBuilding,
  coordPickerMode,
  onMapClick,
  setMapInstance
}: {
  selectedBuilding?: Building;
  coordPickerMode: boolean;
  onMapClick: (e: L.LeafletMouseEvent) => void;
  setMapInstance: (map: L.Map) => void;
}) {
  const map = useMap();

  useEffect(() => {
    setMapInstance(map);
  }, [map, setMapInstance]);

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
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  // -- Hybrid Navigation State --
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [preview, setPreview] = useState<RoutePreview | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  // 1. Live Location Tracking (The "Blue Dot")
  useEffect(() => {
    // Only run if map is ready and geolocation exists
    if (!mapInstance || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const latlng = L.latLng(
          pos.coords.latitude,
          pos.coords.longitude
        );

        // Update app origin for routing
        setOrigin({ lat: latlng.lat, lng: latlng.lng });

        // Marker
        if (!userMarkerRef.current) {
          userMarkerRef.current = L.marker(latlng, {
            icon: userIcon,
            zIndexOffset: 1000,
          }).addTo(mapInstance);
        } else {
          userMarkerRef.current.setLatLng(latlng);
        }

        // Accuracy circle (optional but pro)
        const accuracy = pos.coords.accuracy;
        if (!accuracyCircleRef.current) {
          accuracyCircleRef.current = L.circle(latlng, {
            radius: accuracy,
            color: "#1a73e8",
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
        console.warn("Location tracking disabled or failed", err);
        // Fallback to campus centre if we haven't got a location yet
        if (!origin) {
          setOrigin(CAMPUS_CENTRE);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [mapInstance]); // Depend on mapInstance being ready

  // "Center on Me" Button Action
  const centerOnUser = () => {
    if (userMarkerRef.current && mapInstance) {
      mapInstance.setView(
        userMarkerRef.current.getLatLng(),
        18, // Zoom in close for user view
        { animate: true }
      );
    } else {
      alert("Location not available yet.");
    }
  };


  // 2. Routing Logic when selectedBuilding changes
  useEffect(() => {
    async function updateRoute() {
      if (!selectedBuilding || !origin) {
        setPreview(null);
        setRouteCoords([]);
        return;
      }

      // ORS requires lat/lng
      const destLatLng = pixelToLatLng(selectedBuilding.position[0], selectedBuilding.position[1]);
      const dest = { lat: destLatLng.lat, lng: destLatLng.lng };

      setRouteError(null);
      const { coordinates, preview: routeData, error } = await fetchORSRoute(origin, dest);

      if (routeData) {
        setRouteCoords(coordinates);
        setPreview(routeData);
      } else {
        setRouteError(error || "Couldn't load route preview");
        setRouteCoords([]);
        setPreview(null);
      }
    }

    // Debounce updates slightly to avoid thrashing if location jitters while selecting
    const timer = setTimeout(updateRoute, 100);
    return () => clearTimeout(timer);
  }, [selectedBuilding, origin]);

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
    <div className="relative w-full h-full">
      <MapContainer
        center={[-33.77, 151.115]}
        zoom={16}
        zoomControl={false} // Custom or default zoom control off if we want to place custom buttons
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
          setMapInstance={setMapInstance}
        />

        {/* Route Polyline */}
        {routeCoords.length > 0 && (
          <Polyline positions={routeCoords} color="blue" weight={5} opacity={0.7} />
        )}

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

      {/* Floating Action Button: Center on User */}
      <button
        onClick={centerOnUser}
        className="absolute bottom-6 right-4 z-[1000] p-3 rounded-full shadow-lg bg-white dark:bg-gray-800 text-blue-600 hover:bg-gray-50 focus:outline-none transition-transform active:scale-95"
        title="Center on my location"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="3"></circle>
          <line x1="12" y1="2" x2="12" y2="4"></line>
          <line x1="12" y1="20" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"></line>
          <line x1="17.66" y1="17.66" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="4" y2="12"></line>
          <line x1="20" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="6.34" y2="17.66"></line>
          <line x1="17.66" y1="6.34" x2="19.07" y2="4.93"></line>
        </svg>
      </button>


      {/* Hybrid Navigation Panel */}
      {selectedBuilding && (preview || routeError) && (
        <div
          className="route-panel absolute bottom-4 left-4 z-[1000] p-5 rounded-2xl shadow-xl w-80 max-h-[60vh] overflow-y-auto border backdrop-blur-md transition-all duration-300"
          style={{
            backgroundColor: 'var(--c-card-background)',
            borderColor: 'var(--c-border)',
            color: 'var(--c-content)',
            boxShadow: 'var(--c-shadow-sm)'
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-xl leading-tight" style={{ fontFamily: 'var(--f-primary)', color: 'var(--c-content)' }}>
                {selectedBuilding.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs font-mono" style={{ borderColor: 'var(--c-border)', color: 'var(--c-content-secondary)' }}>
                  {selectedBuilding.id}
                </Badge>
                {preview && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--c-slate-100)', color: 'var(--c-navy-900)' }}>
                    Walking
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
              className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Close navigation"
            >
              <svg className="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {routeError ? (
            <div className="p-3 rounded-lg flex items-start gap-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--c-error)' }}>
              <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--c-error)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <p className="text-sm font-medium" style={{ color: 'var(--c-error)' }}>
                {routeError}
              </p>
            </div>
          ) : (
            preview && (
              <>
                {/* Summary Stats */}
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--c-success)' }}>
                    {formatDuration(preview.durationSeconds)}
                  </span>
                  <span className="text-sm font-medium opacity-60 ml-1" style={{ color: 'var(--c-content-secondary)' }}>
                    ({formatDistance(preview.distanceMeters)})
                  </span>
                </div>

                {/* Call to Action */}
                <button
                  onClick={() => {
                    const destLatLng = pixelToLatLng(selectedBuilding.position[0], selectedBuilding.position[1]);
                    openBestNavApp(origin, { lat: destLatLng.lat, lng: destLatLng.lng });
                  }}
                  className="w-full font-bold py-3 px-4 rounded-xl mb-6 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-md hover:shadow-lg group"
                  style={{
                    backgroundColor: 'var(--c-red)',
                    color: '#ffffff', // Always white
                  }}
                >
                  <span>Start Navigation</span>
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </button>

                {/* Custom Timeline */}
                {preview.steps.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-3 opacity-50" style={{ color: 'var(--c-content-tertiary)' }}>Turn-by-Turn</h4>
                    <div className="relative space-y-6 ml-1">
                      {/* Vertical Line */}
                      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 rounded-full" style={{ backgroundColor: 'var(--c-border)' }}></div>

                      {preview.steps.slice(0, 8).map((s, i) => (
                        <div key={i} className="relative pl-6 group">
                          {/* Dot */}
                          <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 z-10 box-border transition-colors group-hover:scale-110"
                            style={{
                              backgroundColor: 'var(--c-card-background)',
                              borderColor: i === 0 ? 'var(--c-success)' : 'var(--c-content-faded)'
                            }}></div>

                          <p className="text-sm font-medium leading-snug" style={{ color: 'var(--c-content)' }}>{s.text}</p>
                          <p className="text-xs font-mono mt-0.5 opacity-60" style={{ color: 'var(--c-content-secondary)' }}>{formatDistance(s.distance)}</p>
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
