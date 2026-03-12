'use client';

import { useMemo, useEffect, useState } from 'react';
import { Search, Building2, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { Badge } from '@/components/ui/mq/badge';
import type { Building } from '@/features/map/lib/buildings';
import type { GooglePlaceSuggestion } from '@/features/map/hooks/useGooglePlacesSearch';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/lib/utils/haptics';

type Props = {
  selectedBuilding?: Building;
  buildings: Building[];
  buildingSearch: string;
  setBuildingSearch: (v: string) => void;
  onStartNavigation?: () => void;
  onStopNavigation?: () => void;
  isNavigating?: boolean;
  isGoogleMode?: boolean;
  /** Secondary Google Places suggestions (shown when no strong campus match) */
  placeSuggestions?: GooglePlaceSuggestion[];
  isLoadingPlaces?: boolean;
  onSelectPlace?: (place: GooglePlaceSuggestion) => void;
  /** Clear the currently selected external place */
  onClearExternalPlace?: () => void;
  /** Label for the currently selected external place */
  selectedPlaceLabel?: string;
  /** Focused mode: hide places panel, show only destination building info */
  isFocusedMode?: boolean;
  /** Whether Google Maps Street View panorama is currently active */
  isStreetViewActive?: boolean;
};

import { LayeredCard } from './LayeredCard';

export default function CampusMapHUD({
  selectedBuilding,
  buildings,
  buildingSearch,
  setBuildingSearch,
  onStartNavigation: _onStartNavigation,
  onStopNavigation: _onStopNavigation,
  isNavigating,
  isGoogleMode,
  placeSuggestions,
  isLoadingPlaces,
  onSelectPlace,
  onClearExternalPlace,
  selectedPlaceLabel,
  isFocusedMode,
  isStreetViewActive,
}: Props) {
  const { t } = useTypedTranslation();
  const prefersReducedMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const layersParam = searchParams.get('layers');

  // Dropdown state — building list opens on focus click and while typing
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isSearching = buildingSearch.trim().length > 0;
  const showDropdown = isDropdownOpen || isSearching;

  const buildMapHref = (buildingId?: string) => {
    const params = new URLSearchParams();
    if (layersParam) params.set('layers', layersParam);
    const viewParam = searchParams.get('view');
    if (viewParam) params.set('view', viewParam);
    if (buildingId) params.set('building', buildingId);

    const qs = params.toString();
    return qs ? `/map?${qs}` : '/map';
  };

  // Override the global red focus-visible ring for the map search input
  useEffect(() => {
    const styleId = 'map-search-focus-override';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #map-search-input:focus-visible {
        outline: none !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  // Cmd/Ctrl+K keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('map-search-input');
        if (searchInput) {
          searchInput.focus();
          triggerHaptic('tap', 'light');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const visibleBuildings = useMemo(() => {
    return buildingSearch.trim() ? buildings : buildings.slice(0, 15);
  }, [buildings, buildingSearch]);

  // ─── Street View active: hide all custom controls ───
  if (isGoogleMode && isStreetViewActive) return null;

  // ─── Google Maps mode: floating search bar ───
  if (isGoogleMode && !isFocusedMode) {
    const hasResults =
      showDropdown &&
      (visibleBuildings.length > 0 || (placeSuggestions && placeSuggestions.length > 0));

    return (
      <div className="absolute inset-0 z-[1100] pointer-events-none">
        {/* Screen reader announcement */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {buildingSearch ? t('buildingsFound', { count: visibleBuildings.length }) : ''}
        </div>

        {/* Google Maps-style floating search bar aligned with campus mode */}
        <div className="absolute top-3 left-3 w-[min(400px,calc(100vw-100px))] sm:w-[min(400px,calc(100vw-24px))] pointer-events-auto">
          <div
            className={cn(
              'bg-mq-card-background shadow-lg',
              hasResults ? 'rounded-2xl' : 'rounded-full',
            )}
          >
            {/* Search input */}
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-4 w-4 text-mq-content-tertiary" />
              <input
                id="map-search-input"
                value={buildingSearch}
                onChange={(e) => setBuildingSearch(e.target.value)}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                placeholder={t('filterBuildings')}
                aria-label={t('filterBuildings')}
                className="w-full bg-transparent pl-11 pr-14 py-3 text-sm text-mq-content placeholder:text-mq-content-tertiary focus:outline-none focus:ring-0"
              />
              {isSearching ? (
                <button
                  type="button"
                  onClick={() => {
                    setBuildingSearch('');
                    setIsDropdownOpen(false);
                  }}
                  className="absolute right-3 p-1.5 rounded-full text-mq-content-secondary hover:text-mq-content hover:bg-mq-hover-background transition-colors"
                  aria-label={t('clearSearch')}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <kbd className="absolute right-3 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-mono text-mq-content-tertiary bg-mq-background-secondary rounded border border-mq-border">
                  <span className="text-[10px]">⌘</span>
                  <span>K</span>
                </kbd>
              )}
            </div>

            {/* Search results dropdown — shows on focus click or when typing */}
            {showDropdown && (
              <div className="border-t border-mq-border/40 max-h-[280px] overflow-y-auto pb-2 custom-scrollbar animate-in fade-in slide-in-from-top-2">
                {/* Campus buildings */}
                {visibleBuildings.length > 0 && (
                  <div className="px-2 pt-2 space-y-0.5">
                    {visibleBuildings.map((b) => {
                      const isSelected = selectedBuilding?.id === b.id;
                      return (
                        <Link
                          key={b.id}
                          href={isSelected ? buildMapHref(undefined) : buildMapHref(b.id)}
                          onClick={() => {
                            triggerHaptic('tap', 'medium');
                            setBuildingSearch('');
                            setIsDropdownOpen(false);
                            onClearExternalPlace?.();
                          }}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                            isSelected
                              ? 'bg-[#d2e3fc] dark:bg-[#1a3a5c]'
                              : 'hover:bg-mq-hover-background',
                          )}
                        >
                          <Building2 className="h-4 w-4 shrink-0 text-mq-content-tertiary" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-mq-content truncate">
                              {b.id}
                            </span>
                            <span className="text-xs text-mq-content-secondary truncate">
                              {t(b.translationKey)}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Google Places suggestions */}
                {placeSuggestions &&
                  placeSuggestions.length > 0 &&
                  buildingSearch.trim().length >= 3 && (
                    <div className="px-2 pt-1 space-y-0.5">
                      {visibleBuildings.length > 0 && (
                        <div className="px-3 pt-2 pb-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-mq-content-tertiary">
                            {t('places')}
                          </span>
                        </div>
                      )}
                      {placeSuggestions.map((place) => (
                        <button
                          key={place.placeId}
                          type="button"
                          onClick={() => {
                            onSelectPlace?.(place);
                            triggerHaptic('tap', 'medium');
                            setBuildingSearch('');
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left hover:bg-mq-hover-background transition-colors"
                        >
                          <Search className="h-4 w-4 shrink-0 text-mq-content-tertiary" />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-medium text-mq-content truncate">
                              {place.mainText}
                            </span>
                            <span className="text-xs text-mq-content-secondary truncate">
                              {place.secondaryText}
                            </span>
                          </div>
                          {place.distanceMeters != null && (
                            <span className="text-[10px] text-mq-content-tertiary whitespace-nowrap">
                              {place.distanceMeters >= 1000
                                ? `${(place.distanceMeters / 1000).toFixed(1)} km`
                                : `${Math.round(place.distanceMeters)} m`}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                {/* Loading */}
                {isLoadingPlaces && buildingSearch.trim().length >= 3 && (
                  <div className="p-3 text-center text-xs text-mq-content-tertiary">
                    {t('loading')}
                  </div>
                )}

                {/* No results */}
                {visibleBuildings.length === 0 &&
                  (!placeSuggestions || placeSuggestions.length === 0) &&
                  !isLoadingPlaces && (
                    <div className="p-6 text-center text-xs text-mq-content-tertiary">
                      {t('noMatchingBuildings')}
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom-right: selected external place info */}
        <AnimatePresence>
          {selectedPlaceLabel && !isNavigating && (
            <m.div
              className="absolute bottom-6 right-3 w-[calc(100vw-24px)] sm:w-[300px] pointer-events-auto"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
            >
              <LayeredCard interactive={false} className="rounded-mq-xl border-mq-border p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-mq-content text-lg">{selectedPlaceLabel}</h3>
                    <p className="text-xs text-mq-content-tertiary">{t('places')}</p>
                  </div>
                  <button
                    onClick={() => onClearExternalPlace?.()}
                    className="text-mq-content-tertiary hover:text-mq-content transition-colors p-1 hover:bg-mq-background-secondary rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </LayeredCard>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─── Campus mode: pill-style floating search (mirrors Google Maps mode) ───
  const hasResults = showDropdown && visibleBuildings.length > 0;

  return (
    <div className="absolute inset-0 z-[1100] pointer-events-none">
      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {buildingSearch ? t('buildingsFound', { count: visibleBuildings.length }) : ''}
      </div>

      {/* Floating pill-style search bar — hidden in focused mode */}
      {!isFocusedMode && (
        <div className="absolute top-3 left-3 w-[min(400px,calc(100vw-24px))] pointer-events-auto">
          <div
            className={cn(
              'bg-mq-card-background shadow-lg',
              hasResults ? 'rounded-2xl' : 'rounded-full',
            )}
          >
            {/* Search input */}
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-4 w-4 text-mq-content-tertiary" />
              <input
                id="map-search-input"
                value={buildingSearch}
                onChange={(e) => setBuildingSearch(e.target.value)}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                placeholder={t('filterBuildings')}
                aria-label={t('filterBuildings')}
                className="w-full bg-transparent pl-11 pr-14 py-3 text-sm text-mq-content placeholder:text-mq-content-tertiary focus:outline-none focus:ring-0"
              />
              {isSearching ? (
                <button
                  type="button"
                  onClick={() => {
                    setBuildingSearch('');
                    setIsDropdownOpen(false);
                  }}
                  className="absolute right-3 p-1.5 rounded-full text-mq-content-secondary hover:text-mq-content hover:bg-mq-hover-background transition-colors"
                  aria-label={t('clearSearch')}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <kbd className="absolute right-3 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-mono text-mq-content-tertiary bg-mq-background-secondary rounded border border-mq-border">
                  <span className="text-[10px]">⌘</span>
                  <span>K</span>
                </kbd>
              )}
            </div>

            {/* Search results dropdown — shows on focus click or when typing */}
            {showDropdown && (
              <div className="border-t border-mq-border/40 max-h-[280px] overflow-y-auto pb-2 custom-scrollbar animate-in fade-in slide-in-from-top-2">
                {visibleBuildings.length > 0 ? (
                  <div className="px-2 pt-2 space-y-0.5">
                    {visibleBuildings.map((b) => {
                      const isSelected = selectedBuilding?.id === b.id;
                      return (
                        <Link
                          key={b.id}
                          href={isSelected ? buildMapHref(undefined) : buildMapHref(b.id)}
                          onClick={() => {
                            triggerHaptic('tap', 'medium');
                            setBuildingSearch('');
                            setIsDropdownOpen(false);
                            onClearExternalPlace?.();
                          }}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                            isSelected ? 'bg-mq-primary/10' : 'hover:bg-mq-hover-background',
                          )}
                        >
                          <Building2 className="h-4 w-4 shrink-0 text-mq-content-tertiary" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-mq-content truncate">
                              {b.id}
                            </span>
                            <span className="text-xs text-mq-content-secondary truncate">
                              {t(b.translationKey)}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="ml-auto w-2 h-2 rounded-full bg-mq-primary shrink-0" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-mq-content-tertiary">
                    {t('noMatchingBuildings')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom-right card (Selected Building — campus mode only) */}
      <AnimatePresence>
        {selectedBuilding && !isNavigating && (
          <m.div
            className="absolute bottom-20 sm:bottom-6 right-3 w-[calc(100vw-24px)] sm:w-[300px] pointer-events-auto"
            initial={{ y: prefersReducedMotion ? 0 : 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: prefersReducedMotion ? 0 : 20, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
          >
            <LayeredCard interactive={false} className="rounded-mq-xl border-mq-border p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-mq-content text-lg">{selectedBuilding.id}</h3>
                  <p className="text-sm text-mq-content-secondary line-clamp-1">
                    {t(selectedBuilding.translationKey)}
                  </p>
                </div>
                <Link
                  href={buildMapHref(undefined)}
                  className="text-mq-content-tertiary hover:text-mq-content transition-colors p-1 hover:bg-mq-background-secondary rounded-full"
                >
                  <span className="sr-only">{t('close')}</span>
                  <X className="h-5 w-5" />
                </Link>
              </div>

              <div className="space-y-2 mt-3">
                {selectedBuilding?.category && (
                  <Badge variant="neutral" className="bg-mq-background/50 text-xs">
                    {selectedBuilding.category.charAt(0).toUpperCase() +
                      selectedBuilding.category.slice(1)}
                  </Badge>
                )}
              </div>
            </LayeredCard>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
