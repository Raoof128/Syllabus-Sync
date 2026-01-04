'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Search, MapPin, Navigation, Building2, Info, Copy, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { Button } from '@/components/ui/mq/button';
import { Input } from '@/components/ui/mq/input';
import { UNIVERSITY_CONFIG, CAMPUS_BUILDINGS } from '@/lib/config';
import { Building, getBuildingById, searchBuildings } from '@/lib/map/buildings';
import Link from 'next/link';
import { errorHandler } from '@/lib/utils/errorHandling';
import { useTranslation } from '@/lib/hooks/useTranslation';

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
    clearSearch
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
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const selectedBuildingId = searchParams.get('building');
  const selectedBuilding = selectedBuildingId ? getBuildingById(selectedBuildingId) : undefined;

  // Use debounced search hook
  const {
    query: searchQuery,
    results: filteredBuildings,
    isSearching,
    hasSearched,
    updateQuery,
    clearSearch
  } = useDebouncedSearch(searchBuildings, 300);

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
        setSelectedResultIndex(prev =>
          prev < filteredBuildings.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedResultIndex(prev => prev > 0 ? prev - 1 : -1);
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
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-mq-3xl font-bold text-mq-content mb-2">{t('campusMap')}</h1>
        <p className="text-mq-content-secondary">{t('navigateCampus').replace('Macquarie University', UNIVERSITY_CONFIG.name)}</p>
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
              <p className="text-mq-xs text-mq-success">{t('building')} {selectedBuilding.id}</p>
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
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-mq-content-tertiary ${prefersReducedMotion ? '' : 'animate-spin'
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
                  className={`w-full text-left px-4 py-3 border-b border-mq-border last:border-b-0 transition-colors ${index === selectedResultIndex
                    ? 'bg-mq-info/10'
                    : 'hover:bg-mq-hover-background'
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
              <p className="text-mq-sm font-medium text-mq-info">
                {t('coordPickerMode')}
              </p>
              <p className="text-mq-xs text-mq-info">
                {t('coordPickerDesc')}
              </p>
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
              variant={coordPickerMode ? "primary" : "secondary"}
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
      <Card className="mb-6">
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

      {/* Campus Buildings Quick Reference */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('campusBuildings')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CAMPUS_BUILDINGS.map((building) => {
              const buildingData = getBuildingById(building.code);
              const isSelected = selectedBuildingId === building.code;
              return (
                <Link
                  key={building.code}
                  href={`/map?building=${building.code}`}
                  aria-current={isSelected ? 'page' : undefined}
                  className={`p-3 rounded-mq-lg transition-colors ${isSelected
                    ? 'bg-mq-success/10 border-2 border-mq-success'
                    : 'bg-mq-background-secondary hover:bg-mq-hover-background'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-mq-content">{building.code}</div>
                    {isSelected && (
                      <Badge className="bg-mq-success text-white text-mq-xs">{t('selected')}</Badge>
                    )}
                  </div>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <div className="text-mq-sm text-mq-content-secondary">{t(building.translationKey as any)}</div>
                  {buildingData?.tags && buildingData.tags.length > 0 && (
                    <div className="mt-1">
                      <Badge variant="neutral" className="text-xs">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {t(buildingData.tags[0] as any)}
                      </Badge>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Features Coming Soon */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              {t('turnByTurn')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-mq-background-secondary rounded-mq-lg">
                <h4 className="font-semibold text-mq-content">{t('walkingDirections')}</h4>
                <p className="text-mq-sm text-mq-content-secondary mt-1">
                  {t('walkingDirectionsDesc')}
                </p>
              </div>
              <div className="flex items-center gap-2 text-mq-sm text-mq-content-secondary">
                <Info className="h-4 w-4" />
                <span>{t('comingSoon')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t('liveLocation')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-mq-background-secondary rounded-mq-lg">
                <h4 className="font-semibold text-mq-content">{t('realTimeTracking')}</h4>
                <p className="text-mq-sm text-mq-content-secondary mt-1">
                  {t('realTimeTrackingDesc')}
                </p>
              </div>
              <div className="flex items-center gap-2 text-mq-sm text-mq-content-secondary">
                <Info className="h-4 w-4" />
                <span>{t('comingSoon')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              {t('advancedSearch')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-mq-background-secondary rounded-mq-lg">
                <h4 className="font-semibold text-mq-content">{t('filterAndFind')}</h4>
                <p className="text-mq-sm text-mq-content-secondary mt-1">
                  {t('filterAndFindDesc')}
                </p>
              </div>
              <div className="flex items-center gap-2 text-mq-sm text-mq-content-secondary">
                <Info className="h-4 w-4" />
                <span>{t('comingSoon')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
