'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Search, MapPin, Navigation, Building2, Info, Copy, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UNIVERSITY_CONFIG, CAMPUS_BUILDINGS } from '@/lib/config';
import { buildings, Building, getBuildingById, searchBuildings } from '@/lib/map/buildings';
import Link from 'next/link';

// Custom hook for debounced search
function useDebouncedSearch(searchFunction: (query: string) => Building[], delay: number = 300) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<Building[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce the query
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setHasSearched(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      const searchResults = searchFunction(debouncedQuery);
      setResults(searchResults);
    } else {
      setResults([]);
    }
    setIsSearching(false);
  }, [debouncedQuery, searchFunction]);

  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setResults([]);
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

export default function MapPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [coordPickerMode, setCoordPickerMode] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState<string>('');
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const mapRef = useRef<L.Map>(null);

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
  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (coordPickerMode) {
      const coords = `[${Math.round(e.latlng.lat)}, ${Math.round(e.latlng.lng)}]`;
      navigator.clipboard.writeText(coords).then(() => {
        setCopiedCoords(coords);
        setTimeout(() => setCopiedCoords(''), 2000);
      });
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

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Campus Map</h1>
        <p className="text-gray-600 dark:text-gray-400">Navigate {UNIVERSITY_CONFIG.name} campus with ease.</p>
      </header>

      {/* Selected Building Banner */}
      {selectedBuilding && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Navigation className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Navigating to: <strong>{selectedBuilding.name}</strong>
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">Building {selectedBuilding.id}</p>
            </div>
          </div>
          <Link href="/map">
            <Button variant="outline" size="sm" className="gap-1">
              <X className="h-4 w-4" />
              Clear
            </Button>
          </Link>
        </div>
      )}

      {/* Search and Coordinate Picker */}
      <div className="mb-4 space-y-4">
        {/* Search */}
        <div className="relative">
          {isSearching ? (
            <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          )}
          <Input
            type="text"
            placeholder="Search buildings by name, code, or tags..."
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {hasSearched && searchQuery && filteredBuildings.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {filteredBuildings.map((building, index) => (
                <button
                  key={building.id}
                  onClick={() => handleBuildingSelect(building)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors ${
                    index === selectedResultIndex
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">{building.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{building.id}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                      {building.tags?.[0] || 'building'}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
          {hasSearched && searchQuery && filteredBuildings.length === 0 && !isSearching && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 p-4 text-center text-gray-500 dark:text-gray-400">
              No buildings found matching "{searchQuery}"
            </div>
          )}
        </div>

        {/* Coordinate Picker */}
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Coordinate Picker Mode
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Click on the map to copy pixel coordinates for adding new markers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {copiedCoords && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Copy className="h-4 w-4" />
                Copied: {copiedCoords}
              </div>
            )}
            <Button
              variant={coordPickerMode ? "default" : "outline"}
              size="sm"
              onClick={() => setCoordPickerMode(!coordPickerMode)}
              className="gap-2"
            >
              {coordPickerMode ? (
                <>
                  <Eye className="h-4 w-4" />
                  Enabled
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  Disabled
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Map */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Interactive Campus Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 md:h-[500px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <CampusMap
              selectedBuilding={selectedBuilding}
              coordPickerMode={coordPickerMode}
              onMapClick={handleMapClick}
            />
          </div>
        </CardContent>
      </Card>

      {/* Campus Buildings Quick Reference */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Campus Buildings
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
                  className={`p-3 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-green-100 dark:bg-green-900/20 border-2 border-green-500'
                      : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">{building.code}</div>
                    {isSelected && (
                      <Badge className="bg-green-500 text-white text-xs">Selected</Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{building.name}</div>
                  {buildingData?.tags && buildingData.tags.length > 0 && (
                    <div className="mt-1">
                      <Badge variant="outline" className="text-xs">
                        {buildingData.tags[0]}
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
              Turn-by-Turn Navigation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Walking Directions</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Get directions between buildings with estimated walking time.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Info className="h-4 w-4" />
                <span>Coming Soon</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Live Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Real-time Tracking</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Track your current location on campus in real-time.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Info className="h-4 w-4" />
                <span>Coming Soon</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Advanced Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Filter & Find</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Search by facilities, accessibility features, and more.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Info className="h-4 w-4" />
                <span>Coming Soon</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}