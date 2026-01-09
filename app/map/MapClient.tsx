'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Search,
  MapPin,
  Navigation,
  Building2,
  Info,
  Copy,
  X,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Filter as FilterIcon,
  Accessibility,
  Coffee,
  BookOpen,
  Dumbbell,
  Briefcase,
  Layers,
  Car,
  Droplets,
  BadgeCheck,
  GraduationCap,
  Footprints,
  Link as LinkIcon,
  HelpCircle,
  Stethoscope,
  Home,
  Utensils,
  Theater,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
} from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { Button } from '@/components/ui/mq/button';
import { Input } from '@/components/ui/mq/input';
import { UNIVERSITY_CONFIG } from '@/lib/config';
import {
  Building,
  buildings,
  getBuildingById,
  searchBuildings,
  BuildingCategory,
  BUILDING_CATEGORY_LABELS,
} from '@/lib/map/buildings';
import { mapOverlays, type MapOverlayId } from '@/lib/map/mapOverlays';
import { useMapStore, parseOverlaysFromURL, overlaysToURLParam } from '@/lib/store/mapStore';
import Link from 'next/link';
import { errorHandler } from '@/lib/utils/errorHandling';
import { useTranslation } from '@/lib/hooks/useTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { MagicCard } from '@/components/ui/MagicCard';
import { toastUtils } from '@/lib/utils/toast';

// Filter categories for Advanced Search
const FILTER_CATEGORIES = [
  { id: 'academic', icon: BookOpen, label: 'academic' as TranslationKey },
  { id: 'services', icon: Briefcase, label: 'services' as TranslationKey },
  { id: 'sports', icon: Dumbbell, label: 'sports' as TranslationKey },
  { id: 'study', icon: Coffee, label: 'study' as TranslationKey },
  { id: 'labs', icon: FlaskConical, label: 'labs' as TranslationKey },
  { id: 'accessibility', icon: Accessibility, label: 'accessibility' as TranslationKey },
] as const;

// Category filter buttons for buildings sidebar
const CATEGORY_FILTERS: {
  id: BuildingCategory | 'all';
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
}[] = [
  { id: 'all', icon: LayoutGrid, label: 'All', color: 'text-mq-content' },
  { id: 'academic', icon: BookOpen, label: 'Teaching', color: 'text-blue-500' },
  { id: 'food', icon: Utensils, label: 'Food', color: 'text-orange-500' },
  { id: 'services', icon: Briefcase, label: 'Services', color: 'text-purple-500' },
  { id: 'health', icon: Stethoscope, label: 'Health', color: 'text-red-500' },
  { id: 'sports', icon: Dumbbell, label: 'Sports', color: 'text-green-500' },
  { id: 'venue', icon: Theater, label: 'Venues', color: 'text-pink-500' },
  { id: 'research', icon: FlaskConical, label: 'Research', color: 'text-cyan-500' },
  { id: 'residential', icon: Home, label: 'Housing', color: 'text-amber-500' },
];

// Map overlay icons
const OVERLAY_ICONS: Record<MapOverlayId, React.ComponentType<{ className?: string }>> = {
  parking: Car,
  water: Droplets,
  accessibility: Accessibility,
  permits: BadgeCheck,
  exam: GraduationCap,
  walking_track: Footprints,
};

// Custom hook for debounced search with proper state management
function useDebouncedSearch(searchFunction: (query: string) => Building[], delay: number = 300) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update query and manage searching state
  const updateQuery = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);
      setIsSearching(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setDebouncedQuery(newQuery);
        setHasSearched(true);
        setIsSearching(false);
      }, delay);
    },
    [delay],
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Perform search when debounced query changes
  const results = useMemo(() => {
    if (debouncedQuery.trim()) {
      return searchFunction(debouncedQuery);
    } else {
      return [];
    }
  }, [debouncedQuery, searchFunction]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setHasSearched(false);
    setIsSearching(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    query,
    results,
    isSearching,
    hasSearched,
    updateQuery,
    clearSearch,
  };
}

// Dynamically import the entire map component
const CampusMap = dynamic(() => import('./CampusMap'), { ssr: false });

export default function MapClient() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [coordPickerMode, setCoordPickerMode] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState<string>('');
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // Buildings sidebar state
  const [buildingSearch, setBuildingSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<BuildingCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAllBuildings, setShowAllBuildings] = useState(false);
  const buildingSearchRef = useRef<HTMLInputElement>(null);

  // Use map store for overlay persistence
  const {
    activeOverlays,
    showOverlayPanel,
    toggleOverlay,
    setOverlays,
    clearOverlays,
    setShowOverlayPanel,
  } = useMapStore();

  const selectedBuildingId = searchParams.get('building');
  const selectedBuilding = selectedBuildingId ? getBuildingById(selectedBuildingId) : undefined;

  // Sync overlays from URL on mount
  useEffect(() => {
    const urlOverlays = parseOverlaysFromURL(searchParams);
    if (urlOverlays.length > 0) {
      setOverlays(urlOverlays);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Update URL when overlays change (without navigating)
  useEffect(() => {
    const layersParam = overlaysToURLParam(activeOverlays);
    const currentLayers = searchParams.get('layers') || '';

    // Only update URL if layers actually changed
    if (layersParam !== currentLayers) {
      const params = new URLSearchParams(searchParams.toString());
      if (layersParam) {
        params.set('layers', layersParam);
      } else {
        params.delete('layers');
      }

      // Use replace to avoid adding to history
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [activeOverlays, searchParams]);

  // Copy shareable URL
  const copyShareableURL = useCallback(async () => {
    const url = new URL(window.location.href);
    if (activeOverlays.length > 0) {
      url.searchParams.set('layers', overlaysToURLParam(activeOverlays));
    }
    if (selectedBuildingId) {
      url.searchParams.set('building', selectedBuildingId);
    }

    try {
      await navigator.clipboard.writeText(url.toString());
      toastUtils.success(t('copied'), `${url.toString().substring(0, 50)}...`);
    } catch {
      toastUtils.error(t('error'), t('tryAgain'));
    }
  }, [activeOverlays, selectedBuildingId, t]);

  // Use debounced search hook
  const {
    query: searchQuery,
    results: searchResults,
    isSearching,
    hasSearched,
    updateQuery,
    clearSearch,
  } = useDebouncedSearch(searchBuildings, 300);

  // Apply tag filters to search results or all buildings
  const filteredBuildings = useMemo(() => {
    const baseResults = searchQuery.trim() ? searchResults : [];
    if (activeFilters.length === 0) return baseResults;
    return baseResults.filter((building) =>
      activeFilters.some((filter) => building.tags?.includes(filter)),
    );
  }, [searchResults, activeFilters, searchQuery]);

  // Buildings sidebar - filtered and searched
  const sidebarBuildings = useMemo(() => {
    let result = [...buildings];

    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter((b) => b.category === categoryFilter);
    }

    // Apply search filter
    if (buildingSearch.trim()) {
      const query = buildingSearch.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.id.toLowerCase().includes(query) ||
          b.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
          b.description?.toLowerCase().includes(query) ||
          b.address?.toLowerCase().includes(query),
      );
    }

    return result;
  }, [categoryFilter, buildingSearch]);

  // Calculate category counts for badge display
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: buildings.length };
    buildings.forEach((b) => {
      if (b.category) {
        counts[b.category] = (counts[b.category] || 0) + 1;
      }
    });
    return counts;
  }, []);

  // Toggle a filter
  const toggleFilter = useCallback((filterId: string) => {
    setActiveFilters((prev) =>
      prev.includes(filterId) ? prev.filter((f) => f !== filterId) : [...prev, filterId],
    );
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setActiveFilters([]);
  }, []);

  // Handle coordinate picker click
  const handleMapClick = async (e: L.LeafletMouseEvent) => {
    if (coordPickerMode) {
      const coords = `[${Math.round(e.latlng.lat)}, ${Math.round(e.latlng.lng)}]`;
      try {
        if (!navigator.clipboard?.writeText) {
          throw new Error('Clipboard API unavailable');
        }
        await navigator.clipboard.writeText(coords);
        setCopiedCoords(coords);
        setTimeout(() => setCopiedCoords(''), 2000);
      } catch (error) {
        errorHandler.logError(
          error instanceof Error ? error : new Error('Failed to copy coordinates'),
          'Map Clipboard',
          'low',
        );
        setCopiedCoords('');
      }
    }
  };

  // Handle building selection from search results
  const handleBuildingSelect = (building: Building) => {
    router.push(`/map?building=${building.id}`);
    clearSearch();
    setSelectedResultIndex(-1);
  };

  // Handle keyboard navigation in search results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredBuildings.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedResultIndex((prev) => (prev < filteredBuildings.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedResultIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedResultIndex >= 0 && selectedResultIndex < filteredBuildings.length) {
          handleBuildingSelect(filteredBuildings[selectedResultIndex]);
        }
        break;
      case 'Escape':
        clearSearch();
        setSelectedResultIndex(-1);
        break;
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateQuery(e.target.value);
    setSelectedResultIndex(-1);
  };

  const highlightMatch = useCallback(
    (text: string) => {
      const query = searchQuery.trim();
      if (!query) return text;
      const lowerText = text.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const matchIndex = lowerText.indexOf(lowerQuery);
      if (matchIndex === -1) return text;
      const endIndex = matchIndex + query.length;
      return (
        <>
          {text.slice(0, matchIndex)}
          <span className="text-mq-primary font-semibold">{text.slice(matchIndex, endIndex)}</span>
          {text.slice(endIndex)}
        </>
      );
    },
    [searchQuery],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setPrefersReducedMotion(mediaQuery.matches);
    updateMotion();
    mediaQuery.addEventListener('change', updateMotion);
    return () => mediaQuery.removeEventListener('change', updateMotion);
  }, []);

  // Ensure a non-empty document title for accessibility scanners
  useEffect(() => {
    try {
      document.title = `${APP_CONFIG.name} - Map`;
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (shouldRenderMap) return;
    const node = mapContainerRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShouldRenderMap(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRenderMap(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldRenderMap]);

  return (
    <div className="container mx-auto p-4 max-w-7xl map-page">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-mq-3xl font-bold text-mq-content mb-2">{t('map')}</h1>
        <p className="text-mq-content-secondary">
          {t('navigateCampus').replace('Macquarie University', UNIVERSITY_CONFIG.name)}
        </p>
      </header>

      {/* Selected Building Banner */}
      {selectedBuilding && (
        <MagicCard isLiquidEnhanced className="mb-4">
          <div className="mq-magic-card-content p-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Navigation className="h-5 w-5 text-mq-success" />
              <div>
                <p className="text-mq-sm font-medium text-mq-success">
                  {t('navigatingTo')}: <strong>{t(selectedBuilding.translationKey)}</strong>
                </p>
                <p className="text-mq-xs text-mq-success">
                  {t('building')} {selectedBuilding.id}
                </p>
              </div>
            </div>
            <Link href="/map">
              <Button variant="secondary" size="sm" className="gap-1">
                <X className="h-4 w-4" />
                {t('clear')}
              </Button>
            </Link>
          </div>
        </MagicCard>
      )}

      {/* Search and Coordinate Picker */}
      <div className="mb-4 space-y-4">
        {/* Search */}
        <div className="relative">
          {isSearching ? (
            <Loader2
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-mq-content-tertiary ${
                prefersReducedMotion ? '' : 'animate-spin'
              }`}
            />
          ) : (
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-mq-content-tertiary" />
          )}
          <Input
            type="text"
            placeholder={t('searchBuildings')}
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-10 bg-mq-background-secondary/50 backdrop-blur-sm"
            role="combobox"
            aria-expanded={hasSearched && searchQuery.length > 0}
            aria-controls="map-search-results"
            aria-activedescendant={
              selectedResultIndex >= 0
                ? `map-search-option-${filteredBuildings[selectedResultIndex]?.id}`
                : undefined
            }
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label={t('clearSearch')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-mq-content-tertiary hover:text-mq-content"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {hasSearched && searchQuery && filteredBuildings.length > 0 && (
            <div
              id="map-search-results"
              role="listbox"
              aria-label={t('buildingResults')}
              aria-live="polite"
              className="absolute top-full left-0 right-0 mt-1 bg-mq-background/95 backdrop-blur-md border border-mq-border rounded-mq-lg shadow-mq-lg z-10 max-h-60 overflow-y-auto"
            >
              {filteredBuildings.map((building, index: number) => (
                <button
                  key={building.id}
                  id={`map-search-option-${building.id}`}
                  role="option"
                  aria-selected={index === selectedResultIndex}
                  onClick={() => handleBuildingSelect(building)}
                  className={`w-full text-left px-4 py-3 border-b border-mq-border last:border-b-0 transition-all duration-300 ${
                    index === selectedResultIndex
                      ? 'bg-mq-info/10'
                      : 'hover:bg-mq-hover-background hover:shadow-[0_0_10px_rgba(166,25,46,0.08)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-mq-content truncate">
                        {highlightMatch(t(building.translationKey))}
                      </div>
                      <div className="text-mq-sm text-mq-content-secondary">
                        {highlightMatch(building.id)}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                      {t((building.tags?.[0] || 'building') as TranslationKey)}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
          {hasSearched && searchQuery && filteredBuildings.length === 0 && !isSearching && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-mq-background/95 backdrop-blur-md border border-mq-border rounded-mq-lg shadow-mq-lg z-10 p-4 text-center text-mq-content-secondary">
              {t('noBuildingsFound', { query: searchQuery })}
            </div>
          )}
        </div>

        {/* Coordinate Picker */}
        <MagicCard isLiquidEnhanced>
          <div className="mq-magic-card-content p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-mq-info" />
              <div>
                <p className="text-mq-sm font-medium text-mq-info">{t('coordPickerMode')}</p>
                <p className="text-mq-xs text-mq-info">{t('coordPickerDesc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {copiedCoords && (
                <div className="flex items-center gap-2 text-mq-sm text-mq-success">
                  <Copy className="h-4 w-4" />
                  {t('copied')} {copiedCoords}
                </div>
              )}
              <Button
                variant={coordPickerMode ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setCoordPickerMode(!coordPickerMode)}
                className="gap-2"
              >
                {coordPickerMode ? (
                  <>
                    <Eye className="h-4 w-4" />
                    {t('enabled')}
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4" />
                    {t('disabled')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </MagicCard>

        {/* Map Overlay Layers */}
        <MagicCard isLiquidEnhanced>
          <div className="mq-magic-card-content p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-mq-primary" />
                <div>
                  <p className="text-mq-sm font-medium text-mq-content">{t('mapLayers')}</p>
                  <p className="text-mq-xs text-mq-content-secondary">{t('mapLayersDesc')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeOverlays.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {activeOverlays.length} {t('active')}
                  </Badge>
                )}
                <Button
                  variant={showOverlayPanel ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setShowOverlayPanel(!showOverlayPanel)}
                  className="gap-2"
                >
                  <Layers className="h-4 w-4" />
                  {showOverlayPanel ? t('hideLayers') : t('showLayers')}
                </Button>
              </div>
            </div>

            {/* Overlay Toggle Buttons */}
            {showOverlayPanel && (
              <div className="space-y-3 pt-3 border-t border-mq-border">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {mapOverlays.map((overlay) => {
                    const Icon = OVERLAY_ICONS[overlay.id];
                    const isActive = activeOverlays.includes(overlay.id);
                    return (
                      <div key={overlay.id} className="relative group">
                        <button
                          onClick={() => toggleOverlay(overlay.id)}
                          aria-pressed={isActive}
                          className={`w-full flex items-center gap-2 p-3 rounded-mq-lg border transition-all duration-200 text-left ${
                            isActive
                              ? 'bg-mq-primary/10 border-mq-primary text-mq-primary'
                              : 'bg-mq-background-secondary border-transparent hover:border-mq-border hover:bg-mq-hover-background text-mq-content'
                          }`}
                        >
                          <Icon className={`h-5 w-5 flex-shrink-0 ${overlay.color}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-mq-sm font-medium truncate">{overlay.name}</p>
                            <p className="text-mq-xs text-mq-content-secondary truncate">
                              {overlay.description}
                            </p>
                          </div>
                          {isActive && (
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-mq-success" />
                          )}
                        </button>
                        {/* Hover Tooltip with Legend */}
                        <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-mq-background border border-mq-border rounded-mq-lg shadow-mq-lg z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                          <div className="flex items-center gap-2 mb-2">
                            <HelpCircle className="h-4 w-4 text-mq-info flex-shrink-0" />
                            <span className="text-mq-sm font-semibold text-mq-content">
                              {overlay.name}
                            </span>
                          </div>
                          <div className="space-y-1.5 text-mq-xs">
                            <p className="text-mq-content-secondary">
                              <span className="font-medium text-mq-content">{t('source')}:</span>{' '}
                              {overlay.source}
                            </p>
                            <p className="text-mq-content-secondary">
                              <span className="font-medium text-mq-content">
                                {t('lastUpdated')}:
                              </span>{' '}
                              {overlay.lastUpdated}
                            </p>
                            {overlay.legend && overlay.legend.length > 0 && (
                              <div className="pt-1.5 border-t border-mq-border">
                                <p className="font-medium text-mq-content mb-1">{t('legend')}:</p>
                                <ul className="space-y-0.5 text-mq-content-secondary">
                                  {overlay.legend.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-1">
                                      <span className="text-mq-primary">•</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          {/* Tooltip arrow */}
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-mq-background border-r border-b border-mq-border rotate-45" />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {activeOverlays.length > 0 && (
                  <div className="flex justify-between items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyShareableURL}
                      className="gap-1 text-mq-info"
                      title="Copy shareable URL with current layers"
                    >
                      <LinkIcon className="h-4 w-4" />
                      Copy Link
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearOverlays} className="gap-1">
                      <X className="h-4 w-4" />
                      {t('clearAll')}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </MagicCard>
      </div>

      {/* Map */}
      <MagicCard isLiquidEnhanced className="mb-6">
        <div className="mq-magic-card-content p-0">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader>
              <CardTitle>{t('interactiveCampusMap')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                ref={mapContainerRef}
                className="h-96 md:h-[500px] rounded-mq-lg overflow-hidden border border-mq-border"
              >
                {shouldRenderMap ? (
                  <CampusMap
                    selectedBuilding={selectedBuilding}
                    coordPickerMode={coordPickerMode}
                    onMapClick={handleMapClick}
                    activeOverlays={activeOverlays}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-3 bg-mq-background-secondary text-mq-content-secondary">
                    <MapPin className="h-6 w-6" />
                    <p className="text-mq-sm">{t('mapLoadsWhenVisible')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </MagicCard>

      {/* Campus Buildings Quick Reference - Enhanced with Search & Filter */}
      <MagicCard isLiquidEnhanced className="mb-6">
        <div className="mq-magic-card-content p-0">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {t('campusBuildings')}
                  <Badge className="ml-2 bg-mq-primary/10 text-mq-primary">
                    {sidebarBuildings.length} / {buildings.length}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  {/* View Toggle */}
                  <div className="flex items-center bg-mq-background-secondary rounded-mq p-0.5">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-mq-card-background text-mq-primary shadow-sm'
                          : 'text-mq-content-tertiary hover:text-mq-content'
                      }`}
                      aria-label="Grid view"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded transition-colors ${
                        viewMode === 'list'
                          ? 'bg-mq-card-background text-mq-primary shadow-sm'
                          : 'text-mq-content-tertiary hover:text-mq-content'
                      }`}
                      aria-label="List view"
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-mq-content-tertiary" />
                <input
                  ref={buildingSearchRef}
                  type="text"
                  placeholder={t('searchBuildings')}
                  value={buildingSearch}
                  onChange={(e) => setBuildingSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-mq-background-secondary/50 border border-mq-border rounded-mq-lg text-mq-sm text-mq-content placeholder:text-mq-content-tertiary focus:outline-none focus:ring-2 focus:ring-mq-primary/30 focus:border-mq-primary transition-all"
                />
                {buildingSearch && (
                  <button
                    type="button"
                    onClick={() => setBuildingSearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-mq-content-tertiary hover:text-mq-content"
                    aria-label={t('clearSearch')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-2">
                {CATEGORY_FILTERS.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = categoryFilter === cat.id;
                  const count = categoryCounts[cat.id] || 0;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-mq-xs font-medium transition-all ${
                        isActive
                          ? 'bg-mq-primary text-white shadow-sm'
                          : 'bg-mq-background-secondary text-mq-content-secondary hover:bg-mq-hover-background hover:text-mq-content'
                      }`}
                      aria-pressed={isActive}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isActive ? '' : cat.color}`} />
                      <span>{cat.label}</span>
                      {count > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            isActive ? 'bg-white/20' : 'bg-mq-background text-mq-content-tertiary'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Buildings Grid/List */}
              {sidebarBuildings.length > 0 ? (
                <>
                  <div
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'
                        : 'space-y-2'
                    }
                  >
                    {(showAllBuildings ? sidebarBuildings : sidebarBuildings.slice(0, 12)).map(
                      (building) => {
                        const isSelected = selectedBuildingId === building.id;
                        const categoryInfo = CATEGORY_FILTERS.find(
                          (c) => c.id === building.category,
                        );
                        const CategoryIcon = categoryInfo?.icon || Building2;

                        if (viewMode === 'list') {
                          return (
                            <Link
                              key={building.id}
                              href={`/map?building=${building.id}`}
                              aria-current={isSelected ? 'page' : undefined}
                              className={`flex items-center gap-3 p-3 rounded-mq-lg transition-all duration-200 border ${
                                isSelected
                                  ? 'bg-mq-success/10 border-mq-success'
                                  : 'bg-mq-background-secondary/50 border-transparent hover:border-mq-primary/20 hover:bg-mq-hover-background'
                              }`}
                            >
                              <div
                                className={`p-2 rounded-mq ${
                                  isSelected ? 'bg-mq-success/20' : 'bg-mq-background'
                                }`}
                              >
                                <CategoryIcon
                                  className={`h-4 w-4 ${isSelected ? 'text-mq-success' : categoryInfo?.color || 'text-mq-content-secondary'}`}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-mq-sm text-mq-content">
                                    {building.id}
                                  </span>
                                  {building.wheelchair && (
                                    <Accessibility className="h-3 w-3 text-mq-success" />
                                  )}
                                  {isSelected && (
                                    <Badge className="bg-mq-success text-white text-[10px] px-1.5">
                                      {t('selected')}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-mq-xs text-mq-content-secondary truncate">
                                  {t(building.translationKey)}
                                </p>
                              </div>
                              {building.category && (
                                <Badge variant="secondary" className="text-[10px] shrink-0">
                                  {BUILDING_CATEGORY_LABELS[building.category]}
                                </Badge>
                              )}
                            </Link>
                          );
                        }

                        // Grid view
                        return (
                          <Link
                            key={building.id}
                            href={`/map?building=${building.id}`}
                            aria-current={isSelected ? 'page' : undefined}
                            className={`group p-3 rounded-mq-lg transition-all duration-200 border ${
                              isSelected
                                ? 'bg-mq-success/10 border-2 border-mq-success'
                                : 'bg-mq-background-secondary/50 border-transparent hover:border-mq-primary/20 hover:shadow-[0_0_15px_rgba(166,25,46,0.08)]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <CategoryIcon
                                  className={`h-4 w-4 ${isSelected ? 'text-mq-success' : categoryInfo?.color || 'text-mq-content-secondary'}`}
                                />
                                <span className="font-semibold text-mq-content">{building.id}</span>
                              </div>
                              {isSelected && (
                                <Badge className="bg-mq-success text-white text-[10px] px-1">
                                  {t('selected')}
                                </Badge>
                              )}
                            </div>
                            <p className="text-mq-sm text-mq-content-secondary line-clamp-2">
                              {t(building.translationKey)}
                            </p>
                            <div className="flex items-center gap-1 mt-2">
                              {building.category && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] bg-mq-background/50"
                                >
                                  {BUILDING_CATEGORY_LABELS[building.category]}
                                </Badge>
                              )}
                              {building.wheelchair && (
                                <span className="inline-flex items-center text-[10px] text-mq-success">
                                  <Accessibility className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                          </Link>
                        );
                      },
                    )}
                  </div>

                  {/* Show More/Less Button */}
                  {sidebarBuildings.length > 12 && (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllBuildings(!showAllBuildings)}
                        className="gap-2 text-mq-content-secondary hover:text-mq-content"
                      >
                        {showAllBuildings ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Show All ({sidebarBuildings.length - 12} more)
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-mq-content-secondary">
                  <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p className="text-mq-sm">
                    {buildingSearch
                      ? t('noBuildingsFound', { query: buildingSearch })
                      : t('noMatchingBuildings')}
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setBuildingSearch('');
                      setCategoryFilter('all');
                    }}
                    className="mt-3 gap-2"
                  >
                    <X className="h-4 w-4" />
                    {t('clearFilters')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MagicCard>

      {/* Active Map Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Turn-by-Turn Navigation - ACTIVE */}
        <MagicCard isLiquidEnhanced>
          <div className="mq-magic-card-content p-0 h-full">
            <Card className="border-0 shadow-none bg-transparent h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-mq-success" />
                  {t('turnByTurn')}
                  <Badge className="ml-auto bg-mq-success/10 text-mq-success border-mq-success/20">
                    {t('active')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-mq-success/5 rounded-mq-lg border border-mq-success/20">
                    <h4 className="font-semibold text-mq-content">{t('walkingDirections')}</h4>
                    <p className="text-mq-sm text-mq-content-secondary mt-1">
                      {t('walkingDirectionsDesc')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-mq-sm text-mq-success">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      {selectedBuilding ? t('routeReady') : t('selectBuildingToNavigate')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </MagicCard>

        {/* Live Location - ACTIVE */}
        <MagicCard isLiquidEnhanced>
          <div className="mq-magic-card-content p-0 h-full">
            <Card className="border-0 shadow-none bg-transparent h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-mq-info" />
                  {t('liveLocation')}
                  <Badge className="ml-auto bg-mq-info/10 text-mq-info border-mq-info/20">
                    {t('active')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-mq-info/5 rounded-mq-lg border border-mq-info/20">
                    <h4 className="font-semibold text-mq-content">{t('realTimeTracking')}</h4>
                    <p className="text-mq-sm text-mq-content-secondary mt-1">
                      {t('realTimeTrackingDesc')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-mq-sm text-mq-info">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{t('locationTrackingEnabled')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </MagicCard>

        {/* Advanced Search - ACTIVE */}
        <MagicCard isLiquidEnhanced>
          <div className="mq-magic-card-content p-0 h-full">
            <Card className="border-0 shadow-none bg-transparent h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FilterIcon className="h-5 w-5 text-mq-primary" />
                  {t('advancedSearch')}
                  <Badge className="ml-auto bg-mq-primary/10 text-mq-primary border-mq-primary/20">
                    {t('active')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-mq-primary/5 rounded-mq-lg border border-mq-primary/20">
                    <h4 className="font-semibold text-mq-content">{t('filterAndFind')}</h4>
                    <p className="text-mq-sm text-mq-content-secondary mt-1">
                      {t('filterAndFindDesc')}
                    </p>
                  </div>
                  {/* Filter toggle and chips */}
                  <div className="space-y-2">
                    <Button
                      variant={showFilters ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="w-full gap-2"
                    >
                      <FilterIcon className="h-4 w-4" />
                      {showFilters ? t('hideFilters') : t('showFilters')}
                      {activeFilters.length > 0 && (
                        <Badge className="ml-1 bg-white/20 text-current">
                          {activeFilters.length}
                        </Badge>
                      )}
                    </Button>
                    {showFilters && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {FILTER_CATEGORIES.map((category) => {
                          const Icon = category.icon;
                          const isActive = activeFilters.includes(category.id);
                          const categoryLabel = t(category.label as TranslationKey);
                          return (
                            <button
                              key={category.id}
                              onClick={() => toggleFilter(category.id)}
                              aria-label={
                                isActive
                                  ? t('removeFilter', { filter: categoryLabel })
                                  : t('addFilter', { filter: categoryLabel })
                              }
                              aria-pressed={isActive}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-mq-xs font-medium transition-colors ${
                                isActive
                                  ? 'bg-mq-primary text-white'
                                  : 'bg-mq-background-secondary text-mq-content-secondary hover:bg-mq-hover-background'
                              }`}
                            >
                              <Icon className="h-3 w-3" aria-hidden="true" />
                              {categoryLabel}
                            </button>
                          );
                        })}
                        {activeFilters.length > 0 && (
                          <button
                            onClick={clearFilters}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-mq-xs font-medium text-mq-error hover:bg-mq-error/10 transition-colors"
                          >
                            <X className="h-3 w-3" />
                            {t('clearAll')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </MagicCard>
      </div>
    </div>
  );
}
