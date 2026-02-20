'use client';

import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Navigation, ArrowLeft, MapPin } from 'lucide-react';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { UNIVERSITY_CONFIG } from '@/lib/config';
import type { Building } from '@/features/map/lib/buildings';

const MQ_QUERY = 'Macquarie+University+Sydney+NSW+Australia';

const EMBED_VIEW_URL = `https://www.google.com/maps?q=${MQ_QUERY}&z=16&ie=UTF8&iwloc=&output=embed`;

const EMBED_DIRECTIONS_URL = `https://www.google.com/maps?saddr=My+Location&daddr=${MQ_QUERY}&z=14&ie=UTF8&output=embed`;

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
    const { t } = useTypedTranslation();
    const [mode, setMode] = useState<MapMode>('view');
    const destinationQuery = selectedBuilding?.location
      ? `${selectedBuilding.location.lat},${selectedBuilding.location.lng}`
      : MQ_QUERY;
    const resolvedDestinationLabel = destinationLabel || UNIVERSITY_CONFIG.name;

    // Expose navigation control via ref (same pattern as CampusMap)
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

    // Reset to view mode when building changes
    useEffect(() => {
      setMode('view');
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

          {mode === 'view' ? (
            <button
              onClick={() => setMode('directions')}
              className="flex items-center gap-1.5 rounded-mq-lg bg-mq-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-mq-primary/90"
              aria-label={t('navigateToMQ')}
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>{t('navigate')}</span>
            </button>
          ) : (
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
              ? t('googleMapsDirectionsTo', { destination: resolvedDestinationLabel })
              : t('googleMapsViewAt', { destination: resolvedDestinationLabel })
          }
          src={
            mode === 'view'
              ? EMBED_VIEW_URL.replace(MQ_QUERY, destinationQuery)
              : EMBED_DIRECTIONS_URL.replace(MQ_QUERY, destinationQuery)
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
      </div>
    );
  },
);
GoogleMapEmbed.displayName = 'GoogleMapEmbed';
