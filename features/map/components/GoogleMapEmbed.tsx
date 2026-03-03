'use client';

import { useEffect, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { Navigation, ArrowLeft, MapPin } from 'lucide-react';
import { useSafeTranslation } from '@/lib/hooks/useSafeTranslation';
import { UNIVERSITY_CONFIG } from '@/lib/config';
import { cn } from '@/lib/utils';
import type { Building } from '@/features/map/lib/buildings';
import { CAMPUS_CENTRE_GPS } from '@/features/map/lib/constants';

// Exact coordinates for Macquarie University campus center
const MQ_COORDS = `${CAMPUS_CENTRE_GPS.lat},${CAMPUS_CENTRE_GPS.lng}`;

// Google Maps Embed API key (optional — falls back to link if not set).
// Read lazily so tests can set the env var before rendering.
const getEmbedApiKey = () => process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY ?? '';

// Build embed URLs using the official Maps Embed API v1 when key is available.
// Without a key, use Google Maps keyless embed URLs and keep rendering in-iframe.
const buildViewUrl = (query: string) => {
  const key = getEmbedApiKey();
  if (key) {
    // Use 'place' mode for a richer experience with place details
    // This shows the location marker and nearby points of interest like Google Maps website
    return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${encodeURIComponent(query)}&zoom=17&maptype=roadmap`;
  }

  // Keep users inside the in-app map iframe when API key is not configured.
  return `https://www.google.com/maps?output=embed&q=${encodeURIComponent(query)}&z=17`;
};

const buildDirectionsUrl = (destination: string, origin?: { lat: number; lng: number } | null) => {
  const key = getEmbedApiKey();
  const resolvedOrigin = origin ?? CAMPUS_CENTRE_GPS;
  const originStr = `${resolvedOrigin.lat},${resolvedOrigin.lng}`;
  if (key) {
    // Use directions mode with walking - this shows the route like Google Maps
    // Note: The Embed API shows a solid blue route line, not dotted circles
    return `https://www.google.com/maps/embed/v1/directions?key=${key}&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destination)}&mode=walking&maptype=roadmap`;
  }

  // Keep directions embedded even without API key.
  return `https://www.google.com/maps?output=embed&saddr=${encodeURIComponent(originStr)}&daddr=${encodeURIComponent(destination)}&dirflg=w`;
};

type MapMode = 'view' | 'directions';

export interface GoogleMapRef {
  startNavigation: () => void;
  stopNavigation: () => void;
  isNavigating: boolean;
}

interface GoogleMapEmbedProps {
  selectedBuilding?: Building;
  destinationLabel?: string;
  onNavStateChange?: (state: { isNavigating: boolean; status: 'idle' | 'navigating' }) => void;
}

export const GoogleMapEmbed = forwardRef<GoogleMapRef, GoogleMapEmbedProps>(
  ({ selectedBuilding, destinationLabel, onNavStateChange }, ref) => {
    const { t, safeT } = useSafeTranslation();
    const [mode, setMode] = useState<MapMode>('view');
    const [forceCenter, setForceCenter] = useState<boolean>(false);
    const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
    const lastLocRef = useRef<{ lat: number; lng: number } | null>(null);

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
              // Throttle iframe updates to ~20-25m threshold to prevent constant flashing
              if (distSq < 0.00000004) return;
            }
            lastLocRef.current = { lat: newLat, lng: newLng };
            setUserLoc({ lat: newLat, lng: newLng });
          },
          (err) => console.warn('GoogleMapEmbed geolocation error:', err),
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 5000 },
        );
      }
      return () => {
        if (watchId !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
          navigator.geolocation.clearWatch(watchId);
        }
      };
    }, []);

    // If we've explicitly requested centering on user, override the building or campus query
    const destinationQuery = forceCenter
      ? userLoc
        ? `${userLoc.lat},${userLoc.lng}`
        : 'My+Location'
      : selectedBuilding?.location
        ? `${selectedBuilding.location.lat},${selectedBuilding.location.lng}`
        : MQ_COORDS;

    const resolvedDestinationLabel = forceCenter
      ? safeT('myLocation', 'My Location')
      : destinationLabel || UNIVERSITY_CONFIG.name;

    // Expose navigation control via ref (same pattern as CampusMap)
    useImperativeHandle(ref, () => ({
      startNavigation: () => {
        setForceCenter(false);
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

    // Keep directions mode active across destination changes so selecting
    // another destination immediately updates navigation.
    useEffect(() => {
      setForceCenter(false);
    }, [selectedBuilding?.id]);

    return (
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-mq-card-background">
        {/* Header bar - shows current state */}
        <div className="flex shrink-0 items-center justify-between border-b border-mq-border bg-mq-card-background px-4 py-2.5">
          <div className="flex items-center gap-2">
            {mode === 'directions' ? (
              <Navigation className="h-3.5 w-3.5 text-mq-primary" />
            ) : (
              <MapPin className="h-3.5 w-3.5 text-mq-content-tertiary" />
            )}
            <span className="text-sm font-semibold text-mq-content">
              {resolvedDestinationLabel}
            </span>
            <span className="hidden text-xs text-mq-content-secondary sm:inline">
              · {mode === 'directions' ? t('directions') : t('googleMaps')}
            </span>
          </div>

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

        <iframe
          key={`${mode}-${destinationQuery}`}
          title={
            mode === 'directions'
              ? t('googleMapsDirectionsTo', {
                  destination: resolvedDestinationLabel,
                })
              : t('googleMapsViewAt', { destination: resolvedDestinationLabel })
          }
          src={
            mode === 'view'
              ? buildViewUrl(destinationQuery)
              : buildDirectionsUrl(destinationQuery, userLoc)
          }
          className="h-full w-full flex-1 border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          aria-label={
            mode === 'directions' ? t('directionsIframeLabel') : t('googleMapsIframeLabel')
          }
          allowFullScreen
          allow="geolocation"
        />

        {/* Floating Action Button - Center on User */}
        {mode === 'view' && (
          <button
            onClick={() => setForceCenter(true)}
            className={cn(
              'absolute z-[1000] p-3 rounded-full shadow-lg transition-all duration-200 bg-mq-card-background text-mq-primary hover:bg-mq-hover-background focus:outline-none focus:ring-2 focus:ring-mq-primary/50',
              selectedBuilding
                ? 'bottom-[240px] right-4 sm:bottom-[140px] sm:right-4'
                : 'bottom-[100px] sm:bottom-[40px] right-4',
            )}
            aria-label={safeT('centerOnLocation', 'Center on my location')}
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
  },
);
GoogleMapEmbed.displayName = 'GoogleMapEmbed';
