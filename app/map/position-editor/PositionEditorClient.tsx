'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  Search,
  Download,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Save,
  X,
  MapPin,
  Building2,
  Filter,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

import 'leaflet/dist/leaflet.css';

import { buildings, type Building, MAP_CONFIG } from '@/lib/map/buildings';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';

// ============================================================================
// Types
// ============================================================================

interface PositionChange {
  buildingId: string;
  originalPosition: [number, number];
  newPosition: [number, number];
}

// ============================================================================
// Constants
// ============================================================================

const MAP_DIMS = { width: MAP_CONFIG.width, height: MAP_CONFIG.height };
const PIXEL_BOUNDS: L.LatLngBoundsExpression = [
  [0, 0],
  [MAP_DIMS.height, MAP_DIMS.width],
];
const CAMPUS_CENTER: L.LatLngExpression = [MAP_DIMS.height / 2, MAP_DIMS.width / 2];

// ============================================================================
// Helpers
// ============================================================================

// Convert image pixel [x, y] to CRS.Simple [lat, lng]
const pixelToLatLng = (x: number, y: number): L.LatLngExpression => {
  return [MAP_DIMS.height - y, x];
};

// Convert CRS.Simple [lat, lng] back to image pixel [x, y]
const latLngToPixel = (lat: number, lng: number): [number, number] => {
  return [Math.round(lng), Math.round(MAP_DIMS.height - lat)];
};

// Create marker icon
const createMarkerIcon = (isSelected: boolean, hasChanges: boolean) => {
  const color = isSelected ? '#dc2626' : hasChanges ? '#f59e0b' : '#3b82f6';
  const size = isSelected ? 32 : 24;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        ${isSelected ? 'z-index: 1000;' : ''}
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
};

// ============================================================================
// Map Controller Component
// ============================================================================

interface MapControllerProps {
  selectedBuilding: Building | null;
  onMapClick: (lat: number, lng: number) => void;
}

function MapController({ selectedBuilding, onMapClick }: MapControllerProps) {
  const map = useMap();

  // Handle map clicks
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });

  // Fly to selected building
  useEffect(() => {
    if (selectedBuilding) {
      const [x, y] = selectedBuilding.position;
      const latLng = pixelToLatLng(x, y);
      map.flyTo(latLng, 1, { duration: 0.5 });
    }
  }, [selectedBuilding, map]);

  return null;
}

// ============================================================================
// Draggable Marker Component
// ============================================================================

interface DraggableMarkerProps {
  building: Building;
  position: [number, number];
  isSelected: boolean;
  hasChanges: boolean;
  onSelect: () => void;
  onDragEnd: (newPosition: [number, number]) => void;
}

function DraggableMarker({
  building,
  position,
  isSelected,
  hasChanges,
  onSelect,
  onDragEnd,
}: DraggableMarkerProps) {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = useMemo(
    () => ({
      click: () => onSelect(),
      dragend: () => {
        const marker = markerRef.current;
        if (marker) {
          const latlng = marker.getLatLng();
          const newPixel = latLngToPixel(latlng.lat, latlng.lng);
          onDragEnd(newPixel);
        }
      },
    }),
    [onSelect, onDragEnd],
  );

  const latLng = pixelToLatLng(position[0], position[1]);
  const icon = createMarkerIcon(isSelected, hasChanges);

  return (
    <Marker ref={markerRef} position={latLng} icon={icon} draggable eventHandlers={eventHandlers}>
      <Popup>
        <div className="text-sm">
          <strong>{building.name}</strong>
          <br />
          <span className="text-gray-500">ID: {building.id}</span>
          <br />
          <span className="text-gray-500">
            Position: [{position[0]}, {position[1]}]
          </span>
        </div>
      </Popup>
    </Marker>
  );
}

// ============================================================================
// Main Editor Component
// ============================================================================

export default function PositionEditorClient() {
  const { t } = useTypedTranslation();
  // State
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [positionChanges, setPositionChanges] = useState<Map<string, PositionChange>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [showOnlyChanged, setShowOnlyChanged] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string>('');

  // Get current position for a building (changed or original)
  const getCurrentPosition = useCallback(
    (building: Building): [number, number] => {
      const change = positionChanges.get(building.id);
      return change ? change.newPosition : building.position;
    },
    [positionChanges],
  );

  // Handle position change
  const handlePositionChange = useCallback((building: Building, newPosition: [number, number]) => {
    setPositionChanges((prev) => {
      const next = new Map(prev);
      const existing = next.get(building.id);

      // If position is back to original, remove the change
      if (newPosition[0] === building.position[0] && newPosition[1] === building.position[1]) {
        next.delete(building.id);
      } else {
        next.set(building.id, {
          buildingId: building.id,
          originalPosition: existing?.originalPosition || building.position,
          newPosition,
        });
      }
      return next;
    });
  }, []);

  // Reset a single building
  const resetBuilding = useCallback((buildingId: string) => {
    setPositionChanges((prev) => {
      const next = new Map(prev);
      next.delete(buildingId);
      return next;
    });
  }, []);

  // Reset all changes
  const resetAllChanges = useCallback(() => {
    setPositionChanges(new Map());
    setSelectedBuilding(null);
  }, []);

  // Handle map click (move selected building)
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (selectedBuilding) {
        const newPixel = latLngToPixel(lat, lng);
        handlePositionChange(selectedBuilding, newPixel);
      }
    },
    [selectedBuilding, handlePositionChange],
  );

  // Filter buildings
  const filteredBuildings = useMemo(() => {
    let result = [...buildings];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.id.toLowerCase().includes(query) ||
          b.tags?.some((t) => t.toLowerCase().includes(query)),
      );
    }

    // Filter by category
    if (filterCategory !== 'all') {
      result = result.filter((b) => b.category === filterCategory);
    }

    // Filter to show only changed
    if (showOnlyChanged) {
      result = result.filter((b) => positionChanges.has(b.id));
    }

    return result;
  }, [searchQuery, filterCategory, showOnlyChanged, positionChanges]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(buildings.map((b) => b.category).filter(Boolean));
    return ['all', ...Array.from(cats)] as string[];
  }, []);

  // Navigate between buildings
  const navigateBuilding = useCallback(
    (direction: 'prev' | 'next') => {
      if (!selectedBuilding) {
        setSelectedBuilding(filteredBuildings[0] || null);
        return;
      }

      const currentIndex = filteredBuildings.findIndex((b) => b.id === selectedBuilding.id);
      const newIndex =
        direction === 'next'
          ? (currentIndex + 1) % filteredBuildings.length
          : (currentIndex - 1 + filteredBuildings.length) % filteredBuildings.length;

      setSelectedBuilding(filteredBuildings[newIndex] || null);
    },
    [selectedBuilding, filteredBuildings],
  );

  // Generate export code
  const generateExportCode = useCallback(() => {
    if (positionChanges.size === 0) return '// No changes to export';

    const lines: string[] = [
      '// Updated building positions',
      '// Copy these changes to lib/map/buildings.ts',
      '',
      '// Changes summary:',
    ];

    positionChanges.forEach((change) => {
      const building = buildings.find((b) => b.id === change.buildingId);
      lines.push(
        `// ${building?.name || change.buildingId}: [${change.originalPosition.join(', ')}] -> [${change.newPosition.join(', ')}]`,
      );
    });

    lines.push('');
    lines.push('// Find and replace these positions in buildings.ts:');
    lines.push('');

    positionChanges.forEach((change) => {
      const building = buildings.find((b) => b.id === change.buildingId);
      lines.push(`// ${building?.name || change.buildingId}`);
      lines.push(`// Old: position: [${change.originalPosition.join(', ')}],`);
      lines.push(`// New: position: [${change.newPosition.join(', ')}],`);
      lines.push('');
    });

    // Generate a JSON array for bulk updates
    lines.push('// ============================================');
    lines.push('// JSON format for bulk processing:');
    lines.push('// ============================================');
    lines.push('/*');
    const jsonChanges = Array.from(positionChanges.values()).map((c) => ({
      id: c.buildingId,
      position: c.newPosition,
    }));
    lines.push(JSON.stringify(jsonChanges, null, 2));
    lines.push('*/');

    return lines.join('\n');
  }, [positionChanges]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async () => {
    const code = generateExportCode();
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generateExportCode]);

  // Download as file
  const downloadChanges = useCallback(() => {
    const code = generateExportCode();
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `building-positions-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generateExportCode]);

  // Save changes directly to buildings.ts file
  const saveToFile = useCallback(async () => {
    if (positionChanges.size === 0) return;

    setSaveStatus('saving');
    setSaveMessage('');

    try {
      // Prepare the changes for the API
      const changes = Array.from(positionChanges.values()).map((c) => ({
        id: c.buildingId,
        position: c.newPosition,
      }));

      const response = await fetch('/api/admin/update-building-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to save changes');
      }

      setSaveStatus('success');
      setSaveMessage(result.data.message);

      // Clear changes after successful save (positions are now updated in the file)
      // The changes are now the "new original" positions
      setPositionChanges(new Map());

      // Auto-reset status after 5 seconds
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 5000);
    } catch (error) {
      setSaveStatus('error');
      setSaveMessage(error instanceof Error ? error.message : 'Failed to save changes');

      // Auto-reset error status after 10 seconds
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 10000);
    }
  }, [positionChanges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case 'ArrowLeft':
          navigateBuilding('prev');
          break;
        case 'ArrowRight':
          navigateBuilding('next');
          break;
        case 'Escape':
          setSelectedBuilding(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateBuilding, selectedBuilding, resetBuilding]);

  return (
    <div className="flex h-screen w-full">
      {/* Left Sidebar - Building List */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-600" />
            Position Editor
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Drag markers to correct positions
          </p>
        </div>

        {/* Search & Filter */}
        <div className="border-b border-gray-200 p-3 dark:border-gray-700 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchBuildingsPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowOnlyChanged(!showOnlyChanged)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                showOnlyChanged
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
              title="Show only changed buildings"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
          <span>{filteredBuildings.length} buildings</span>
          <span className="text-amber-600 dark:text-amber-400">{positionChanges.size} changed</span>
        </div>

        {/* Building List */}
        <div className="flex-1 overflow-y-auto">
          {filteredBuildings.map((building) => {
            const hasChanges = positionChanges.has(building.id);
            const isSelected = selectedBuilding?.id === building.id;

            return (
              <button
                key={building.id}
                onClick={() => setSelectedBuilding(building)}
                className={`w-full px-4 py-3 text-left border-b border-gray-100 dark:border-gray-800 transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  isSelected ? 'bg-red-50 dark:bg-red-900/20' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium truncate ${
                          isSelected
                            ? 'text-red-700 dark:text-red-400'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {building.name}
                      </span>
                      {hasChanges && (
                        <span className="flex-shrink-0 h-2 w-2 rounded-full bg-amber-500" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {building.id} &bull; [{getCurrentPosition(building).join(', ')}]
                    </div>
                  </div>
                  <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-3 dark:border-gray-700 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => navigateBuilding('prev')}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <button
              onClick={() => navigateBuilding('next')}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={resetAllChanges}
            disabled={positionChanges.size === 0}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <RotateCcw className="h-4 w-4" />
            Reset All Changes
          </button>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative">
        <MapContainer
          center={CAMPUS_CENTER}
          zoom={0}
          minZoom={-2}
          maxZoom={3}
          crs={L.CRS.Simple}
          maxBounds={[
            [-500, -500],
            [MAP_DIMS.height + 500, MAP_DIMS.width + 500],
          ]}
          maxBoundsViscosity={0.8}
          className="h-full w-full"
          style={{ background: '#1a1a2e' }}
        >
          {/* Campus Map Image */}
          <ImageOverlay url="/maps/raster/mq-campus.png" bounds={PIXEL_BOUNDS} />

          {/* Map Controller */}
          <MapController selectedBuilding={selectedBuilding} onMapClick={handleMapClick} />

          {/* Building Markers */}
          {filteredBuildings.map((building) => (
            <DraggableMarker
              key={building.id}
              building={building}
              position={getCurrentPosition(building)}
              isSelected={selectedBuilding?.id === building.id}
              hasChanges={positionChanges.has(building.id)}
              onSelect={() => setSelectedBuilding(building)}
              onDragEnd={(newPos) => handlePositionChange(building, newPos)}
            />
          ))}
        </MapContainer>

        {/* Selected Building Info Panel */}
        {selectedBuilding && (
          <div className="absolute top-4 left-4 z-[1000] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-80">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{selectedBuilding.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ID: {selectedBuilding.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedBuilding(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Original:</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  [{selectedBuilding.position.join(', ')}]
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Current:</span>
                <span
                  className={`font-mono ${
                    positionChanges.has(selectedBuilding.id)
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  [{getCurrentPosition(selectedBuilding).join(', ')}]
                </span>
              </div>
              {positionChanges.has(selectedBuilding.id) && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Delta:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">
                    [{getCurrentPosition(selectedBuilding)[0] - selectedBuilding.position[0]},{' '}
                    {getCurrentPosition(selectedBuilding)[1] - selectedBuilding.position[1]}]
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => resetBuilding(selectedBuilding.id)}
                disabled={!positionChanges.has(selectedBuilding.id)}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
              Drag the marker or click on the map to move
            </p>
          </div>
        )}

        {/* Export Panel */}
        {positionChanges.size > 0 && (
          <div className="absolute bottom-4 right-4 z-[1000] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-72">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                <Save className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {positionChanges.size} Changes
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ready to save</p>
              </div>
            </div>

            {/* Save Status Message */}
            {saveStatus !== 'idle' && (
              <div
                className={`mb-3 flex items-start gap-2 rounded-lg p-2 text-xs ${
                  saveStatus === 'success'
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : saveStatus === 'error'
                      ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}
              >
                {saveStatus === 'success' && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
                {saveStatus === 'error' && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
                {saveStatus === 'saving' && (
                  <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
                )}
                <span>{saveMessage || 'Saving changes...'}</span>
              </div>
            )}

            {/* Primary Action: Save to File */}
            <button
              onClick={saveToFile}
              disabled={saveStatus === 'saving'}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed mb-2"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Save to buildings.ts
                </>
              )}
            </button>

            {/* Secondary Actions */}
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={downloadChanges}
                className="flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                title="Download as file"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Success Toast (after save) */}
        {saveStatus === 'success' && positionChanges.size === 0 && (
          <div className="absolute bottom-4 right-4 z-[1000] bg-green-600 text-white rounded-xl shadow-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6" />
            <div>
              <div className="font-bold">Changes Saved!</div>
              <div className="text-sm text-green-100">{saveMessage}</div>
            </div>
          </div>
        )}

        {/* Help Panel */}
        <div className="absolute top-4 right-4 z-[1000] bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
          <div className="font-medium mb-1">Keyboard Shortcuts</div>
          <div>← → Navigate buildings</div>
          <div>R Reset selected</div>
          <div>Esc Deselect</div>
        </div>
      </div>
    </div>
  );
}
