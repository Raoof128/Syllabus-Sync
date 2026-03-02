'use client';

import { useEffect, useState, forwardRef, useImperativeHandle, useRef, useMemo } from 'react';
import { Navigation, ArrowLeft, Building2, MapPin } from 'lucide-react';
import { useSafeTranslation } from '@/lib/hooks/useSafeTranslation';
import { UNIVERSITY_CONFIG } from '@/lib/config';
import { CAMPUS_CENTRE_GPS } from '@/features/map/lib/constants';
import type { Building } from '@/features/map/lib/buildings';
import { getBuildingGps } from '@/features/map/lib/buildings';

// MQ Campus center for Google Maps view
const MQ_CENTER = { lat: CAMPUS_CENTRE_GPS.lat, lng: CAMPUS_CENTRE_GPS.lng };

// Google Maps API keys
const getEmbedApiKey = () => process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY ?? '';

type MapMode = 'view' | 'directions';

export interface GoogleMapRef {
  startNavigation: () => void;
  stopNavigation: () => void;
  isNavigating: boolean;
}

interface GoogleMapIntegrationProps {
  onNavStateChange?: (state: { isNavigating: boolean; status: 'idle' | 'navigating' }) => void;
  selectedBuilding?: Building;
}

// Build URLs for the iframe embed
const buildEmbedViewUrl = (building?: Building) => {
  const key = getEmbedApiKey();

  // If a building is selected, center on it
  if (building) {
    const gps = getBuildingGps(building);
    const query = encodeURIComponent(`${building.name}, Macquarie University`);

    if (!key) {
      return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d500!2d${gps.lng}!3d${gps.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s${query}!5e0!3m2!1sen!2sau`;
    }
    return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${query}&center=${gps.lat},${gps.lng}&zoom=18`;
  }

  if (!key) {
    // Fallback to basic Google Maps URL centered on campus
    const searchQuery = encodeURIComponent(UNIVERSITY_CONFIG.name);
    return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3315.!2d${MQ_CENTER.lng}!3d${MQ_CENTER.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s${searchQuery}!5e0!3m2!1sen!2sau`;
  }

  // Default to MQ campus
  return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${encodeURIComponent(UNIVERSITY_CONFIG.name)}&center=${MQ_CENTER.lat},${MQ_CENTER.lng}&zoom=16`;
};

const buildEmbedDirectionsUrl = (
  origin?: { lat: number; lng: number } | null,
  building?: Building,
) => {
  const key = getEmbedApiKey();
  const resolvedOrigin = origin ?? MQ_CENTER;
  const originStr = `${resolvedOrigin.lat},${resolvedOrigin.lng}`;

  // If a building is selected, navigate to it; otherwise to university
  let dest: string;
  if (building) {
    const gps = getBuildingGps(building);
    dest = `${gps.lat},${gps.lng}`;
  } else {
    dest = UNIVERSITY_CONFIG.name;
  }

  if (!key) {
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(dest)}&travelmode=walking`;
  }

  return `https://www.google.com/maps/embed/v1/directions?key=${key}&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(dest)}&mode=walking`;
};

export const GoogleMapIntegration = forwardRef<GoogleMapRef, GoogleMapIntegrationProps>(
  ({ onNavStateChange, selectedBuilding }, ref) => {
    const { t } = useSafeTranslation();
    const [mode, setMode] = useState<MapMode>('view');
    const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
    const lastLocRef = useRef<{ lat: number; lng: number } | null>(null);

    // Watch user location for directions
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
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 5000 },
        );
      }
      return () => {
        if (watchId !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
          navigator.geolocation.clearWatch(watchId);
        }
      };
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

    // Build iframe URL - show selected building or default campus view
    const iframeSrc = useMemo(() => {
      if (mode === 'directions') {
        return buildEmbedDirectionsUrl(userLoc, selectedBuilding);
      }
      return buildEmbedViewUrl(selectedBuilding);
    }, [mode, userLoc, selectedBuilding]);

    // Get display name for header
    const displayName = selectedBuilding ? selectedBuilding.id : UNIVERSITY_CONFIG.name;

    return (
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-mq-card-background">
        {/* Header bar - shows current state */}
        <div className="flex shrink-0 items-center justify-between border-b border-mq-border bg-mq-card-background px-4 py-2.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {mode === 'directions' ? (
              <Navigation className="h-4 w-4 text-mq-primary shrink-0" />
            ) : selectedBuilding ? (
              <MapPin className="h-4 w-4 text-[#ea4335] shrink-0" />
            ) : (
              <Building2 className="h-4 w-4 text-mq-content shrink-0" />
            )}
            <span className="text-sm font-semibold text-mq-content truncate">{displayName}</span>
            <span className="hidden text-xs text-mq-content-secondary sm:inline shrink-0">
              · {t('googleMaps')}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {mode === 'directions' && (
              <button
                onClick={() => setMode('view')}
                className="flex items-center gap-1.5 rounded-mq-lg bg-mq-background-secondary px-3 py-1.5 text-xs font-medium text-mq-content transition-colors hover:bg-mq-hover-background"
                aria-label={t('backToMap')}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>{t('backToMap')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Map iframe */}
        <iframe
          key={`${mode}-${selectedBuilding?.id ?? 'mq'}`}
          title={
            mode === 'directions'
              ? t('googleMapsDirectionsTo', { destination: displayName })
              : t('googleMapsViewAt', { destination: displayName })
          }
          src={iframeSrc}
          className="h-full w-full flex-1 border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          aria-label={
            mode === 'directions' ? t('directionsIframeLabel') : t('googleMapsIframeLabel')
          }
          allowFullScreen
          allow="geolocation"
        />
      </div>
    );
  },
);

GoogleMapIntegration.displayName = 'GoogleMapIntegration';
