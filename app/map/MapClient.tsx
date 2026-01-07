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
} from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { Button } from '@/components/ui/mq/button';
import { Input } from '@/components/ui/mq/input';
import { UNIVERSITY_CONFIG } from '@/lib/config';
import { Building, buildings, getBuildingById, searchBuildings } from '@/lib/map/buildings';
import Link from 'next/link';
import { errorHandler } from '@/lib/utils/errorHandling';
import { useTranslation } from '@/lib/hooks/useTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';

// Filter categories for Advanced Search
const FILTER_CATEGORIES = [
  { id: 'academic', icon: BookOpen, label: 'academic' },
  { id: 'services', icon: Briefcase, label: 'services' },
  { id: 'sports', icon: Dumbbell, label: 'sports' },
  { id: 'study', icon: Coffee, label: 'study' },
  { id: 'labs', icon: FilterIcon, label: 'labs' },
  { id: 'accessibility', icon: Accessibility, label: 'accessibility' },
] as const;

// Custom hook for debounced search
// eslint-disable react-hooks/set-state-in-effect
function useDebouncedSearch(searchFunction: (query: string) => Building[], delay: number = 300) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce the query
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setHasSearched(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  // Perform search when debounced query changes
  const results = useMemo(() => {
    if (debouncedQuery.trim()) {
      return searchFunction(debouncedQuery);
    } else {
      return [];
    }
  }, [debouncedQuery, searchFunction]);

  // Set searching to false after search completes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSearching(false);
  }, [results]);

  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setHasSearched(false);
    setIsSearching(false);
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

  const selectedBuildingId = searchParams.get('building');
  const selectedBuilding = selectedBuildingId ? getBuildingById(selectedBuildingId) : undefined;

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

  // Get buildings filtered by active tags (for the grid display)
  const filteredBuildingsForGrid = useMemo(() => {
    if (activeFilters.length === 0) return buildings;
    return buildings.filter((building) =>
      activeFilters.some((filter) => building.tags?.includes(filter)),
    );
  }, [activeFilters]);

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
      document.title = `${APP_CONFIG.name} - Campus Map`;
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
        <h1 className="text-mq-3xl font-bold text-mq-content mb-2">{t('campusMap')}</h1>
        <p className="text-mq-content-secondary">
          {t('navigateCampus').replace('Macquarie University', UNIVERSITY_CONFIG.name)}
        </p>
      </header>

      {/* Selected Building Banner */}
      {selectedBuilding && (
        <div className="mb-4 p-4 bg-mq-success/10 border border-mq-success/20 rounded-mq-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Navigation className="h-5 w-5 text-mq-success" />
            <div>
              <p className="text-mq-sm font-medium text-mq-success">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {t('navigatingTo')}: <strong>{t(selectedBuilding.translationKey as any)}</strong>
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
            className="pl-10 pr-10"
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
              className="absolute top-full left-0 right-0 mt-1 bg-mq-background border border-mq-border rounded-mq-lg shadow-mq-lg z-10 max-h-60 overflow-y-auto"
            >
              {filteredBuildings.map((building, index: number) => (
                <button
                  key={building.id}
                  id={`map-search-option-${building.id}`}
                  role="option"
                  aria-selected={index === selectedResultIndex}
                  onClick={() => handleBuildingSelect(building)}
                  className={`w-full text-left px-4 py-3 border-b border-mq-border last:border-b-0 transition-colors ${
                    index === selectedResultIndex ? 'bg-mq-info/10' : 'hover:bg-mq-hover-background'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-mq-content truncate">
                        {/* Note: Highlight match logic runs on English names for now */}
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {highlightMatch(t(building.translationKey as any))}
                      </div>
                      <div className="text-mq-sm text-mq-content-secondary">
                        {highlightMatch(building.id)}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {t((building.tags?.[0] || 'building') as any)}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
          {hasSearched && searchQuery && filteredBuildings.length === 0 && !isSearching && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-mq-background border border-mq-border rounded-mq-lg shadow-mq-lg z-10 p-4 text-center text-mq-content-secondary">
              {t('noBuildingsFound', { query: searchQuery })}
            </div>
          )}
        </div>

        {/* Coordinate Picker */}
        <div className="flex items-center justify-between p-4 bg-mq-info/10 border border-mq-info/20 rounded-mq-lg">
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
      </div>

      {/* Map */}
      <div className="mq-magic-card mb-6">
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
      </div>

      {/* Campus Buildings Quick Reference */}
      <div className="mq-magic-card mb-6">
        <div className="mq-magic-card-content p-0">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t('campusBuildings')}
                {activeFilters.length > 0 && (
                  <Badge className="ml-2 bg-mq-primary/10 text-mq-primary">
                    {filteredBuildingsForGrid.length} {t('results')}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredBuildingsForGrid.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {filteredBuildingsForGrid.map((building) => {
                    const isSelected = selectedBuildingId === building.id;
                    return (
                      <Link
                        key={building.id}
                        href={`/map?building=${building.id}`}
                        aria-current={isSelected ? 'page' : undefined}
                        className={`p-3 rounded-mq-lg transition-colors text-mq-content ${
                          isSelected
                            ? 'bg-mq-success/10 border-2 border-mq-success'
                            : 'bg-mq-background-secondary hover:bg-mq-hover-background'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-mq-content">{building.id}</div>
                          {isSelected && (
                            <Badge className="bg-mq-success text-white text-mq-xs">
                              {t('selected')}
                            </Badge>
                          )}
                        </div>
                        <div className="text-mq-sm text-mq-content-secondary">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {t(building.translationKey as any)}
                        </div>
                        {building.tags && building.tags.length > 0 && (
                          <div className="mt-1">
                            <Badge variant="neutral" className="text-xs">
                              {t(building.tags[0] as TranslationKey)}
                            </Badge>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-mq-content-secondary">
                  <FilterIcon className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p className="text-mq-sm">{t('noMatchingBuildings')}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={clearFilters}
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
      </div>

      {/* Active Map Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Turn-by-Turn Navigation - ACTIVE */}
        <div className="mq-magic-card">
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
        </div>

        {/* Live Location - ACTIVE */}
        <div className="mq-magic-card">
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
        </div>

        {/* Advanced Search - ACTIVE */}
        <div className="mq-magic-card">
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
                          return (
                            <button
                              key={category.id}
                              onClick={() => toggleFilter(category.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-mq-xs font-medium transition-colors ${
                                isActive
                                  ? 'bg-mq-primary text-white'
                                  : 'bg-mq-background-secondary text-mq-content-secondary hover:bg-mq-hover-background'
                              }`}
                            >
                              <Icon className="h-3 w-3" />
                              {t(category.label as TranslationKey)}
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
        </div>
      </div>
    </div>
  );
}
