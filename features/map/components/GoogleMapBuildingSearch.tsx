'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Search, X, Navigation, MapPin, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { triggerHaptic } from '@/lib/utils/haptics';
import type { Building } from '@/features/map/lib/buildings';
import { getBuildingGps } from '@/features/map/lib/buildings';

interface GoogleMapBuildingSearchProps {
  buildings: Building[];
  selectedBuilding?: Building;
  onNavigateToBuilding?: (building: Building) => void;
  onStartNavigation?: (building: Building) => void;
  isNavigating?: boolean;
}

const normalizeForSearch = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export function GoogleMapBuildingSearch({
  buildings,
  selectedBuilding,
  onNavigateToBuilding,
  onStartNavigation,
  isNavigating,
}: GoogleMapBuildingSearchProps) {
  const { t } = useTypedTranslation();
  const prefersReducedMotion = useReducedMotion();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Collapse on mobile by default, expand on desktop
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 640px)');
    const syncExpandedState = () => {
      if (!isNavigating) {
        setIsExpanded(mediaQuery.matches);
      }
    };
    syncExpandedState();
    mediaQuery.addEventListener('change', syncExpandedState);
    return () => mediaQuery.removeEventListener('change', syncExpandedState);
  }, [isNavigating]);

  // Collapse when navigation starts
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isNavigating) {
      setIsExpanded(false);
    }
  }, [isNavigating]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Keyboard shortcut: Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsExpanded(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
        triggerHaptic('tap', 'light');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter buildings based on search
  const filteredBuildings = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return buildings.slice(0, 15);

    const normalizedQuery = normalizeForSearch(query);

    return buildings.filter((building) => {
      const searchableFields = [
        building.id,
        building.name,
        t(building.translationKey),
        building.description,
        building.gridRef,
        building.address,
        ...(building.tags ?? []),
      ]
        .filter(Boolean)
        .map((value) => normalizeForSearch(String(value)));

      return searchableFields.some((field) => field.includes(normalizedQuery));
    });
  }, [buildings, searchQuery, t]);

  const buildMapHref = useCallback((buildingId?: string) => {
    const params = new URLSearchParams();
    params.set('view', 'google');
    if (buildingId) params.set('building', buildingId);
    return `/map?${params.toString()}`;
  }, []);

  const handleBuildingSelect = useCallback(
    (building: Building) => {
      triggerHaptic('tap', 'medium');
      setIsExpanded(false);
      setSearchQuery('');
      onNavigateToBuilding?.(building);
    },
    [onNavigateToBuilding],
  );

  const openInGoogleMaps = useCallback((building: Building) => {
    const gps = getBuildingGps(building);
    const query = encodeURIComponent(`${building.name}, Macquarie University`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}&center=${gps.lat},${gps.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const getDirectionsInGoogleMaps = useCallback((building: Building) => {
    const gps = getBuildingGps(building);
    const destination = encodeURIComponent(`${gps.lat},${gps.lng}`);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`;
    window.open(url, '_blank', 'noopener,noreferrer');
    triggerHaptic('tap', 'medium');
  }, []);

  const handleNavigate = useCallback(
    (building: Building) => {
      // Always keep selected destination in sync before starting nav.
      onNavigateToBuilding?.(building);

      if (onStartNavigation) {
        triggerHaptic('tap', 'medium');
        onStartNavigation(building);
        return;
      }

      // Fallback for standalone usage where embed navigation callback isn't provided.
      getDirectionsInGoogleMaps(building);
    },
    [getDirectionsInGoogleMaps, onNavigateToBuilding, onStartNavigation],
  );

  return (
    <div className="absolute left-3 top-16 z-[1100] pointer-events-none w-[min(320px,calc(100vw-24px))]">
      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {searchQuery ? t('buildingsFound', { count: filteredBuildings.length }) : ''}
      </div>

      {/* Search Card - Google Maps Style */}
      <div
        className={cn(
          'pointer-events-auto rounded-lg border border-mq-border bg-mq-card-background shadow-lg transition-all duration-200',
          isExpanded && 'shadow-xl',
        )}
      >
        {/* Search Header */}
        <button
          type="button"
          onClick={() => {
            setIsExpanded(!isExpanded);
            if (!isExpanded) {
              setTimeout(() => searchInputRef.current?.focus(), 100);
            }
            triggerHaptic('tap', 'light');
          }}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
            'hover:bg-mq-hover-background',
            isExpanded && 'border-b border-mq-border',
          )}
          aria-expanded={isExpanded}
          aria-controls="google-map-building-search"
        >
          <Search className="h-5 w-5 text-[#4285f4] shrink-0" />
          <span className="flex-1 text-sm font-medium text-mq-content">
            {t('searchBuildingsPlaceholder')}
          </span>
          <span className="text-mq-content-tertiary">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>

        {/* Expandable Search Content */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <m.div
              id="google-map-building-search"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              className="overflow-hidden"
            >
              {/* Search Input */}
              <div className="px-4 py-3 border-b border-mq-border/60">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mq-content-tertiary" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('filterBuildings')}
                    aria-label={t('filterBuildings')}
                    className={cn(
                      'w-full pl-10 pr-10 py-2.5 rounded-full text-sm',
                      'bg-mq-background-secondary',
                      'text-mq-content',
                      'placeholder:text-mq-content-tertiary',
                      'border-2 border-transparent transition-all',
                      'focus:outline-none focus:bg-mq-card-background',
                      'focus:border-mq-primary focus:shadow-sm',
                    )}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        searchInputRef.current?.focus();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-mq-content-tertiary dark:text-mq-content/60 hover:text-mq-content hover:bg-mq-hover-background transition-colors"
                      aria-label={t('clearSearch')}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {!searchQuery && (
                    <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-mq-content-tertiary bg-mq-background-secondary rounded">
                      <span>⌘</span>
                      <span>K</span>
                    </kbd>
                  )}
                </div>
              </div>

              {/* Building List */}
              <div className="max-h-[280px] overflow-y-auto overscroll-contain">
                {filteredBuildings.length > 0 ? (
                  <ul className="py-1" role="listbox" aria-label={t('places')}>
                    {filteredBuildings.map((building) => {
                      const isSelected = selectedBuilding?.id === building.id;
                      return (
                        <li key={building.id} role="option" aria-selected={isSelected}>
                          <button
                            type="button"
                            onClick={() => handleBuildingSelect(building)}
                            className={cn(
                              'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors',
                              'hover:bg-mq-hover-background',
                              isSelected && 'bg-mq-primary/10 border-l-4 border-mq-primary',
                            )}
                          >
                            <MapPin
                              className={cn(
                                'h-5 w-5 mt-0.5 shrink-0',
                                isSelected ? 'text-[#4285f4]' : 'text-[#ea4335]',
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  'text-sm font-medium truncate',
                                  isSelected ? 'text-mq-primary' : 'text-mq-content',
                                )}
                              >
                                {building.id}
                              </p>
                              <p className="text-xs text-mq-content-secondary truncate">
                                {t(building.translationKey)}
                              </p>
                              {building.address && (
                                <p className="text-xs text-mq-content-tertiary truncate mt-0.5">
                                  {building.address}
                                </p>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-mq-content-tertiary/70" />
                    <p className="text-sm text-mq-content-secondary">{t('noMatchingBuildings')}</p>
                  </div>
                )}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Building Card - Google Maps Style */}
      <AnimatePresence>
        {selectedBuilding && !isNavigating && (
          <m.div
            initial={{ y: prefersReducedMotion ? 0 : 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: prefersReducedMotion ? 0 : 10, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="pointer-events-auto mt-3 rounded-lg border border-mq-border bg-mq-card-background shadow-lg"
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-mq-content">{selectedBuilding.id}</h3>
                  <p className="text-sm text-mq-content-secondary truncate">
                    {t(selectedBuilding.translationKey)}
                  </p>
                  {selectedBuilding.address && (
                    <p className="text-xs text-mq-content-tertiary mt-1">
                      {selectedBuilding.address}
                    </p>
                  )}
                </div>
                <Link
                  href={buildMapHref(undefined)}
                  className="p-1.5 rounded-full text-mq-content-tertiary dark:text-mq-content/60 hover:text-mq-content hover:bg-mq-hover-background transition-colors"
                  aria-label={t('close')}
                >
                  <X className="h-5 w-5" />
                </Link>
              </div>

              {/* Action Buttons - Google Maps Style */}
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => handleNavigate(selectedBuilding)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full',
                    'bg-[#4285f4] hover:bg-[#3367d6] text-white',
                    'text-sm font-medium transition-colors',
                  )}
                >
                  <Navigation className="h-4 w-4" />
                  {t('navigate')}
                </button>
                <button
                  type="button"
                  onClick={() => openInGoogleMaps(selectedBuilding)}
                  className={cn(
                    'flex items-center justify-center gap-2 px-4 py-2.5 rounded-full',
                    'bg-mq-background-secondary hover:bg-mq-hover-background',
                    'text-mq-content',
                    'text-sm font-medium transition-colors',
                  )}
                  title={t('openInGoogleMaps')}
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
