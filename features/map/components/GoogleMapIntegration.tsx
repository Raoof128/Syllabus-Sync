'use client';

import {
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useRef,
  useMemo,
} from 'react';
import {
  Navigation,
  ArrowLeft,
  MapPin,
  Search,
  X,
  Loader2,
  ExternalLink,
  Building2,
} from 'lucide-react';
import { useSafeTranslation } from '@/lib/hooks/useSafeTranslation';
import { UNIVERSITY_CONFIG } from '@/lib/config';
import { cn } from '@/lib/utils';
import { CAMPUS_CENTRE_GPS } from '@/features/map/lib/constants';
import { Button } from '@/components/ui/mq/button';

// Google Maps types are available globally when the script is loaded
// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace google.maps {
  class LatLng {
    constructor(lat: number, lng: number);
  }
  namespace places {
    class AutocompleteService {
      getPlacePredictions(
        request: AutocompletionRequest,
        callback: (
          predictions: AutocompletePrediction[] | null,
          status: PlacesServiceStatus
        ) => void
      ): void;
    }
    interface AutocompletionRequest {
      input: string;
      locationBias?: LatLng | { center: LatLng; radius: number };
      componentRestrictions?: { country: string | string[] };
      types?: string[];
    }
    interface AutocompletePrediction {
      place_id: string;
      description: string;
      structured_formatting?: {
        main_text: string;
        secondary_text: string;
      };
      types?: string[];
    }
    enum PlacesServiceStatus {
      OK = 'OK',
    }
  }
}

// MQ Campus bounds for restricting Google Maps view
const MQ_CENTER = { lat: CAMPUS_CENTRE_GPS.lat, lng: CAMPUS_CENTRE_GPS.lng };

// Google Maps API keys
const getApiKey = () => process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const getEmbedApiKey = () => process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY ?? '';

// Script loading state
let googleMapsScriptLoaded = false;
let googleMapsScriptLoading = false;
const scriptLoadCallbacks: Array<() => void> = [];

// Load Google Maps JavaScript API with Places library
const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve) => {
    if (googleMapsScriptLoaded || typeof google !== 'undefined') {
      googleMapsScriptLoaded = true;
      resolve();
      return;
    }

    if (googleMapsScriptLoading) {
      scriptLoadCallbacks.push(resolve);
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      // No API key, can't load Places API
      resolve();
      return;
    }

    googleMapsScriptLoading = true;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=__googleMapsCallback`;
    script.async = true;
    script.defer = true;

    // Global callback for Google Maps
    (window as unknown as Record<string, unknown>).__googleMapsCallback = () => {
      googleMapsScriptLoaded = true;
      googleMapsScriptLoading = false;
      resolve();
      scriptLoadCallbacks.forEach((cb) => cb());
      scriptLoadCallbacks.length = 0;
      delete (window as unknown as Record<string, unknown>).__googleMapsCallback;
    };

    script.onerror = () => {
      googleMapsScriptLoading = false;
      resolve(); // Resolve anyway to not block the component
    };

    document.head.appendChild(script);
  });
};

type MapMode = 'view' | 'directions';

// Place result from Google Places
interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry?: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  types?: string[];
}

export interface GoogleMapRef {
  startNavigation: () => void;
  stopNavigation: () => void;
  isNavigating: boolean;
}

interface GoogleMapIntegrationProps {
  onNavStateChange?: (state: { isNavigating: boolean; status: 'idle' | 'navigating' }) => void;
}

// Build URLs for the iframe embed fallback
const buildEmbedViewUrl = (placeId?: string, query?: string) => {
  const key = getEmbedApiKey();
  if (!key) {
    // Fallback to basic Google Maps URL centered on campus
    const searchQuery = query
      ? encodeURIComponent(query)
      : encodeURIComponent(UNIVERSITY_CONFIG.name);
    return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3315.!2d${MQ_CENTER.lng}!3d${MQ_CENTER.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s${searchQuery}!5e0!3m2!1sen!2sau`;
  }

  if (placeId) {
    return `https://www.google.com/maps/embed/v1/place?key=${key}&q=place_id:${placeId}&zoom=18`;
  }

  // Use query if provided, otherwise default to MQ campus
  const searchTerm = query || UNIVERSITY_CONFIG.name;
  return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${encodeURIComponent(searchTerm)}&center=${MQ_CENTER.lat},${MQ_CENTER.lng}&zoom=16`;
};

const buildEmbedDirectionsUrl = (
  destinationPlaceId?: string,
  destinationQuery?: string,
  origin?: { lat: number; lng: number } | null
) => {
  const key = getEmbedApiKey();
  const resolvedOrigin = origin ?? MQ_CENTER;
  const originStr = `${resolvedOrigin.lat},${resolvedOrigin.lng}`;

  if (!key) {
    const dest = destinationQuery || UNIVERSITY_CONFIG.name;
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(dest)}&travelmode=walking`;
  }

  const destination = destinationPlaceId
    ? `place_id:${destinationPlaceId}`
    : destinationQuery || UNIVERSITY_CONFIG.name;

  return `https://www.google.com/maps/embed/v1/directions?key=${key}&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destination)}&mode=walking`;
};

export const GoogleMapIntegration = forwardRef<GoogleMapRef, GoogleMapIntegrationProps>(
  ({ onNavStateChange }, ref) => {
    const { t, safeT } = useSafeTranslation();
    const [mode, setMode] = useState<MapMode>('view');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<GooglePlace[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState<GooglePlace | null>(null);
    const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [placesApiReady, setPlacesApiReady] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchTimeoutRef = useRef<number | null>(null);
    const lastLocRef = useRef<{ lat: number; lng: number } | null>(null);

    // Load Google Maps JavaScript API with Places
    useEffect(() => {
      loadGoogleMapsScript().then(() => {
        if (typeof google !== 'undefined' && google.maps?.places) {
          setPlacesApiReady(true);
        }
      });
    }, []);

    // Watch user location
    useEffect(() => {
      let watchId: number | null = null;
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const newLat = pos.coords.latitude;
            const newLng = pos.coords.longitude;
            const last = lastLocRef.current;
            if (last) {
              const dx = newLat - last.lat;
              const dy = newLng - last.lng;
              const distSq = dx * dx + dy * dy;
              // Throttle updates to ~20-25m threshold
              if (distSq < 0.00000004) return;
            }
            lastLocRef.current = { lat: newLat, lng: newLng };
            setUserLoc({ lat: newLat, lng: newLng });
          },
          (err) => console.warn('GoogleMapIntegration geolocation error:', err),
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 5000 }
        );
      }
      return () => {
        if (watchId !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
          navigator.geolocation.clearWatch(watchId);
        }
      };
    }, []);

    // Search places using Google Places Autocomplete API via client-side
    const searchPlaces = useCallback(async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);

      try {
        // Use Places Autocomplete Service when available
        if (placesApiReady && typeof google !== 'undefined' && google.maps?.places) {
          const service = new google.maps.places.AutocompleteService();

          const request = {
            input: query,
            // Restrict to MQ campus area
            locationBias: {
              center: new google.maps.LatLng(MQ_CENTER.lat, MQ_CENTER.lng),
              radius: 1500, // 1.5km radius around campus
            } as unknown as google.maps.LatLng,
            componentRestrictions: { country: 'au' },
            types: ['establishment', 'geocode'],
          };

          service.getPlacePredictions(
            request,
            (
              predictions: google.maps.places.AutocompletePrediction[] | null,
              status: google.maps.places.PlacesServiceStatus
            ) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                const places: GooglePlace[] = predictions.map(
                  (p: google.maps.places.AutocompletePrediction) => ({
                    place_id: p.place_id,
                    name: p.structured_formatting?.main_text || p.description,
                    formatted_address: p.structured_formatting?.secondary_text || p.description,
                    types: p.types,
                  })
                );

                // Filter to only show results near MQ campus
                setSearchResults(places.slice(0, 8));
              } else {
                setSearchResults([]);
              }
              setIsSearching(false);
            }
          );
        } else {
          // Fallback when Places API is not available:
          // Create a simple search result that will search Google Maps directly
          setSearchResults([
            {
              place_id: `search:${query}`,
              name: query,
              formatted_address: safeT('searchOnGoogleMaps', 'Search on Google Maps'),
            },
          ]);
          setIsSearching(false);
        }
      } catch (error) {
        console.error('Places search error:', error);
        setSearchResults([]);
        setIsSearching(false);
      }
    }, [placesApiReady, safeT]);

    // Debounced search
    useEffect(() => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }

      if (searchQuery.trim().length >= 2) {
        searchTimeoutRef.current = window.setTimeout(() => {
          searchPlaces(searchQuery);
        }, 300);
      } else {
        setSearchResults([]);
      }

      return () => {
        if (searchTimeoutRef.current) {
          window.clearTimeout(searchTimeoutRef.current);
        }
      };
    }, [searchQuery, searchPlaces]);

    // Handle place selection
    const handleSelectPlace = useCallback((place: GooglePlace) => {
      setSelectedPlace(place);
      setSearchQuery(place.name);
      setShowSearchResults(false);
      setMode('view');
    }, []);

    // Clear selection
    const handleClearSelection = useCallback(() => {
      setSelectedPlace(null);
      setSearchQuery('');
      setSearchResults([]);
      setMode('view');
    }, []);

    // Expose navigation control via ref
    useImperativeHandle(ref, () => ({
      startNavigation: () => {
        setMode('directions');
      },
      stopNavigation: () => {
        setMode('view');
      },
      get isNavigating() {
        return mode === 'directions';
      },
    }));

    // Notify parent of navigation state changes
    useEffect(() => {
      onNavStateChange?.({
        isNavigating: mode === 'directions',
        status: mode === 'directions' ? 'navigating' : 'idle',
      });
    }, [mode, onNavStateChange]);

    // Build iframe URL
    const iframeSrc = useMemo(() => {
      // Don't use place_id if it's a search placeholder
      const placeId = selectedPlace?.place_id?.startsWith('search:')
        ? undefined
        : selectedPlace?.place_id;

      if (mode === 'directions') {
        return buildEmbedDirectionsUrl(
          placeId,
          selectedPlace?.name || searchQuery || undefined,
          userLoc
        );
      }
      return buildEmbedViewUrl(placeId, selectedPlace?.name || undefined);
    }, [mode, selectedPlace, searchQuery, userLoc]);

    // Open in native Google Maps app
    const openInGoogleMaps = useCallback(() => {
      const dest = selectedPlace?.name || UNIVERSITY_CONFIG.name;
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }, [selectedPlace]);

    return (
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-mq-card-background">
        {/* Search Bar - Google's own search */}
        <div className="relative shrink-0 border-b border-mq-border bg-mq-card-background p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mq-content-tertiary" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder={safeT('searchGoogleMaps', 'Search places on campus...')}
              className="w-full pl-10 pr-10 py-2.5 bg-mq-input-background border border-mq-border rounded-mq-lg text-sm text-mq-content placeholder:text-mq-content-tertiary focus:outline-none focus:ring-2 focus:ring-mq-primary/35 focus:border-mq-primary transition-all"
              aria-label={safeT('searchGoogleMaps', 'Search places on campus')}
            />
            {(searchQuery || selectedPlace) && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-mq-content-secondary hover:text-mq-content hover:bg-mq-hover-background transition-colors"
                aria-label={t('clearSearch')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {isSearching && (
              <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-mq-content-tertiary" />
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-100 bg-mq-card-background border border-mq-border rounded-mq-lg shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((place) => (
                <button
                  key={place.place_id}
                  type="button"
                  onClick={() => handleSelectPlace(place)}
                  className="w-full flex items-start gap-3 p-3 hover:bg-mq-hover-background transition-colors text-left border-b border-mq-border/50 last:border-b-0"
                >
                  <MapPin className="h-4 w-4 text-mq-primary mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-mq-content truncate">
                      {place.name}
                    </p>
                    {place.formatted_address && (
                      <p className="text-xs text-mq-content-secondary truncate">
                        {place.formatted_address}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Close dropdown when clicking outside */}
          {showSearchResults && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowSearchResults(false)}
              aria-hidden="true"
            />
          )}
        </div>

        {/* Header bar - shows current state */}
        <div className="flex shrink-0 items-center justify-between border-b border-mq-border bg-mq-card-background px-4 py-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {mode === 'directions' ? (
              <Navigation className="h-3.5 w-3.5 text-mq-primary shrink-0" />
            ) : selectedPlace ? (
              <MapPin className="h-3.5 w-3.5 text-mq-primary shrink-0" />
            ) : (
              <Building2 className="h-3.5 w-3.5 text-mq-content-tertiary shrink-0" />
            )}
            <span className="text-sm font-semibold text-mq-content truncate">
              {selectedPlace?.name || UNIVERSITY_CONFIG.name}
            </span>
            <span className="hidden text-xs text-mq-content-secondary sm:inline shrink-0">
              · {mode === 'directions' ? t('directions') : t('googleMaps')}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {mode === 'directions' ? (
              <button
                onClick={() => setMode('view')}
                className="flex items-center gap-1.5 rounded-mq-lg bg-mq-background-secondary px-3 py-1.5 text-xs font-medium text-mq-content transition-colors hover:bg-mq-hover-background"
                aria-label={t('backToMap')}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>{t('backToMap')}</span>
              </button>
            ) : (
              <button
                onClick={openInGoogleMaps}
                className="flex items-center gap-1.5 rounded-mq-lg bg-mq-background-secondary px-3 py-1.5 text-xs font-medium text-mq-content transition-colors hover:bg-mq-hover-background"
                aria-label={safeT('openInGoogleMaps', 'Open in Google Maps')}
                title={safeT('openInGoogleMaps', 'Open in Google Maps')}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{safeT('openInApp', 'Open App')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Map iframe */}
        <iframe
          key={`${mode}-${selectedPlace?.place_id || 'mq'}`}
          title={
            mode === 'directions'
              ? t('googleMapsDirectionsTo', { destination: selectedPlace?.name || UNIVERSITY_CONFIG.name })
              : t('googleMapsViewAt', { destination: selectedPlace?.name || UNIVERSITY_CONFIG.name })
          }
          src={iframeSrc}
          className="h-full w-full flex-1 border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          aria-label={mode === 'directions' ? t('directionsIframeLabel') : t('googleMapsIframeLabel')}
          allowFullScreen
          allow="geolocation"
        />

        {/* Selected Place Card - Bottom */}
        {selectedPlace && mode === 'view' && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[320px] z-10">
            <div className="bg-mq-card-background border border-mq-border rounded-mq-xl p-4 shadow-lg">
              <div className="flex justify-between items-start mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-mq-content text-base truncate">
                    {selectedPlace.name}
                  </h3>
                  {selectedPlace.formatted_address && (
                    <p className="text-xs text-mq-content-secondary truncate mt-0.5">
                      {selectedPlace.formatted_address}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleClearSelection}
                  className="text-mq-content-tertiary hover:text-mq-content transition-colors p-1 hover:bg-mq-background-secondary rounded-full shrink-0 ml-2"
                  aria-label={t('close')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => setMode('directions')}
                >
                  <Navigation className="h-4 w-4" />
                  {t('navigate')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={openInGoogleMaps}
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden sm:inline">{safeT('openInApp', 'Open')}</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Button - Center on Campus */}
        {mode === 'view' && !selectedPlace && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedPlace(null);
            }}
            className={cn(
              'absolute z-10 p-3 rounded-full shadow-lg transition-all duration-200',
              'bg-mq-card-background text-mq-primary hover:bg-mq-hover-background',
              'focus:outline-none focus:ring-2 focus:ring-mq-primary/50',
              'bottom-4 right-4'
            )}
            aria-label={safeT('centerOnCampus', 'Center on campus')}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="2" x2="12" y2="4" />
              <line x1="12" y1="20" x2="12" y2="22" />
              <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
              <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
              <line x1="2" y1="12" x2="4" y2="12" />
              <line x1="20" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
              <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

GoogleMapIntegration.displayName = 'GoogleMapIntegration';

