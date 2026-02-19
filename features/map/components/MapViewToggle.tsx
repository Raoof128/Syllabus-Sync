'use client';

import type { ReactNode } from 'react';
import { Map, Globe } from 'lucide-react';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';

export type MapView = 'campus' | 'google';

interface MapViewToggleProps {
  activeView: MapView;
  onViewChange: (view: MapView) => void;
}

export function MapViewToggle({ activeView, onViewChange }: MapViewToggleProps) {
  const { t } = useTypedTranslation();

  const views: { id: MapView; label: string; icon: ReactNode }[] = [
    { id: 'campus', label: t('campusMap'), icon: <Map className="h-4 w-4" /> },
    { id: 'google', label: t('googleMaps'), icon: <Globe className="h-4 w-4" /> },
  ];

  return (
    <div
      role="group"
      aria-label={t('mapViewToggle')}
      className="flex items-center gap-1 rounded-mq-lg border border-mq-border bg-mq-background-secondary p-1"
    >
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id)}
          aria-pressed={activeView === view.id}
          className={`flex items-center gap-2 rounded-mq-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
            activeView === view.id
              ? 'bg-mq-card-background text-mq-primary shadow-sm'
              : 'text-mq-content-secondary hover:text-mq-content'
          }`}
        >
          {view.icon}
          <span className="hidden sm:inline">{view.label}</span>
        </button>
      ))}
    </div>
  );
}
