'use client';

import { useState } from 'react';
import { Navigation, ArrowLeft } from 'lucide-react';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { UNIVERSITY_CONFIG } from '@/lib/config';

const MQ_QUERY = 'Macquarie+University+Sydney+NSW+Australia';

const EMBED_VIEW_URL = `https://maps.google.com/maps?q=${MQ_QUERY}&z=16&ie=UTF8&iwloc=&output=embed`;

const EMBED_DIRECTIONS_URL = `https://maps.google.com/maps?saddr=My+Location&daddr=${MQ_QUERY}&z=14&ie=UTF8&output=embed`;

type MapMode = 'view' | 'directions';

export function GoogleMapEmbed() {
  const { t } = useTypedTranslation();
  const [mode, setMode] = useState<MapMode>('view');

  return (
    <div className="relative flex h-full min-h-[520px] flex-col overflow-hidden rounded-xl border border-mq-border">
      <div className="flex shrink-0 items-center justify-between border-b border-mq-border bg-mq-card-background px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-mq-content">{UNIVERSITY_CONFIG.name}</span>
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
        key={mode}
        title={
          mode === 'directions'
            ? 'Directions to Macquarie University'
            : 'Google Maps — Macquarie University'
        }
        src={mode === 'view' ? EMBED_VIEW_URL : EMBED_DIRECTIONS_URL}
        className="min-h-[460px] w-full flex-1 border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        aria-label={mode === 'directions' ? t('directionsIframeLabel') : t('googleMapsIframeLabel')}
        allowFullScreen
      />
    </div>
  );
}
