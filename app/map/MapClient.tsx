'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LazyMotion, m, domAnimation, AnimatePresence } from 'framer-motion';
import '@/app/styles/leaflet.css';
import {
  Search,
  Navigation,
  Building2,
  X,
  CheckCircle2,
  Accessibility,
  BookOpen,
  Dumbbell,
  Briefcase,
  Layers,
  Car,
  Droplets,
  BadgeCheck,
  GraduationCap,
  Link as LinkIcon,
  Stethoscope,
  Home,
  Utensils,
  Theater,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List as ListIcon,
} from 'lucide-react';
import { MapErrorBoundary } from './MapErrorBoundary';
import { MapLoadingSkeleton } from './MapSkeleton';
import { APP_CONFIG } from '@/lib/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { Button } from '@/components/ui/mq/button';
import { UNIVERSITY_CONFIG } from '@/lib/config';
import {
  buildings,
  getBuildingById,
  searchBuildings,
  BuildingCategory,
  BUILDING_CATEGORY_LABELS,
} from '@/lib/map/buildings';
import { mapOverlays, type MapOverlayId } from '@/lib/map/mapOverlays';
import { useMapStore, parseOverlaysFromURL, overlaysToURLParam } from '@/lib/store/mapStore';
import Link from 'next/link';
import { useTranslation } from '@/lib/hooks/useTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { MagicCard } from '@/components/ui/MagicCard';
import { toastUtils } from '@/lib/utils/toast';

// Category filter buttons for buildings sidebar
const CATEGORY_FILTERS: {
  id: BuildingCategory | 'all';
  icon: React.ComponentType<{ className?: string }>;
  labelKey: TranslationKey;
  color: string;
}[] = [
  { id: 'all', icon: LayoutGrid, labelKey: 'categoryAll', color: 'text-mq-content' },
  { id: 'academic', icon: BookOpen, labelKey: 'categoryTeaching', color: 'text-mq-info' },
  { id: 'food', icon: Utensils, labelKey: 'categoryFood', color: 'text-mq-warning' },
  { id: 'services', icon: Briefcase, labelKey: 'categoryServices', color: 'text-mq-primary' },
  { id: 'health', icon: Stethoscope, labelKey: 'categoryHealth', color: 'text-mq-error' },
  { id: 'sports', icon: Dumbbell, labelKey: 'categorySports', color: 'text-mq-success' },
  { id: 'venue', icon: Theater, labelKey: 'categoryVenues', color: 'text-mq-secondary' },
  { id: 'research', icon: FlaskConical, labelKey: 'categoryResearch', color: 'text-mq-info' },
  { id: 'residential', icon: Home, labelKey: 'categoryHousing', color: 'text-mq-warning' },
  { id: 'other', icon: Building2, labelKey: 'categoryOther', color: 'text-mq-content-tertiary' },
];

// Map overlay icons
const OVERLAY_ICONS: Record<MapOverlayId, React.ComponentType<{ className?: string }>> = {
  parking: Car,
  water: Droplets,
  accessibility: Accessibility,
  permits: BadgeCheck,
  exam: GraduationCap,
};

// Dynamically import the entire map component
const CampusMap = dynamic(() => import('./CampusMap'), { ssr: false });

// Import LocationStatus type
import type { LocationStatus } from './CampusMap';

export default function MapClient() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // Location status from CampusMap
  const [, setLocationStatus] = useState<LocationStatus>('idle');

  // Buildings sidebar state
  const [buildingSearch, setBuildingSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<BuildingCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAllBuildings, setShowAllBuildings] = useState(false);
  const buildingSearchRef = useRef<HTMLInputElement>(null);
  const hasAutoNavigatedRef = useRef(false);

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
  const autoNavigate = searchParams.get('autonav') === 'true';

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

  // Auto-scroll and notify when arriving with a building + autonav flag
  useEffect(() => {
    if (!autoNavigate || !selectedBuilding || hasAutoNavigatedRef.current) return;
    hasAutoNavigatedRef.current = true;
    if (mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    toastUtils.success(t('routeReady'), t('selectBuildingToNavigate'));
  }, [autoNavigate, selectedBuilding, t]);

  // PERF: Prefetch overlay images when user opens the overlay panel
  // This improves perceived performance when toggling layers
  useEffect(() => {
    if (!showOverlayPanel) return;

    // Prefetch all overlay images in the background
    mapOverlays.forEach((overlay) => {
      const img = new Image();
      img.src = overlay.imagePath;
    });
  }, [showOverlayPanel]);

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

  // Buildings sidebar - filtered and searched
  const sidebarBuildings = useMemo(() => {
    // Use searchBuildings from buildings.ts to avoid duplicating filter logic
    let result = buildingSearch.trim() ? searchBuildings(buildingSearch) : [...buildings];

    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter((b) => b.category === categoryFilter);
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
    <LazyMotion features={domAnimation}>
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
            <div className="mq-magic-card-content p-4 flex flex-row items-center justify-between bg-mq-card-background border border-mq-border">
              <div className="flex items-center gap-3">
                <Navigation className="h-5 w-5" />
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

        {/* Map Overlay Layers */}
        <div className="mb-4">
          <MagicCard isLiquidEnhanced>
            <div className="mq-magic-card-content p-4 bg-mq-card-background border border-mq-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Layers className="h-5 w-5" />
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
                        <button
                          key={overlay.id}
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
                            <p className="text-mq-sm font-medium truncate">
                              {t(`overlay_${overlay.id}_name` as TranslationKey)}
                            </p>
                            <p className="text-mq-xs text-mq-content-secondary truncate">
                              {t(`overlay_${overlay.id}_desc` as TranslationKey)}
                            </p>
                          </div>
                          {isActive && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
                        </button>
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
                        {t('copyLink')}
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
          <div className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border">
            <Card className="border border-mq-border bg-mq-card-background">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('interactiveCampusMap')}</CardTitle>
                  <p className="text-xs text-mq-content-tertiary hidden md:block">
                    Use arrow keys to pan, +/- to zoom
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  ref={mapContainerRef}
                  className="h-[50vh] md:h-[500px] lg:h-[600px] rounded-mq-lg overflow-hidden border border-mq-border"
                >
                  {shouldRenderMap ? (
                    <MapErrorBoundary>
                      <CampusMap
                        selectedBuilding={selectedBuilding}
                        activeOverlays={activeOverlays}
                        onLocationStatusChange={setLocationStatus}
                      />
                    </MapErrorBoundary>
                  ) : (
                    <MapLoadingSkeleton />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </MagicCard>

        {/* Campus Buildings Quick Reference - Enhanced with Search & Filter */}
        <MagicCard isLiquidEnhanced className="mb-6">
          <div className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border">
            <Card className="border border-mq-border bg-mq-card-background">
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
                        aria-label={t('gridView')}
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
                        aria-label={t('listView')}
                      >
                        <ListIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Building Filter Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-mq-content-tertiary" />
                  <input
                    ref={buildingSearchRef}
                    type="text"
                    placeholder={t('filterBuildings')}
                    value={buildingSearch}
                    onChange={(e) => setBuildingSearch(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-mq-background-secondary border border-mq-border rounded-mq-lg text-mq-sm text-mq-content placeholder:text-mq-content-tertiary focus:outline-none focus:ring-2 focus:ring-mq-primary/30 focus:border-mq-primary transition-all"
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
                        <span>{t(cat.labelKey)}</span>
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

                {/* Buildings Grid/List with Animations */}
                {sidebarBuildings.length > 0 ? (
                  <>
                    <m.div
                      layout
                      className={
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'
                          : 'space-y-2'
                      }
                    >
                      <AnimatePresence mode="popLayout">
                        {(showAllBuildings ? sidebarBuildings : sidebarBuildings.slice(0, 12)).map(
                          (building, index) => {
                            const isSelected = selectedBuildingId === building.id;
                            const categoryInfo = CATEGORY_FILTERS.find(
                              (c) => c.id === building.category,
                            );
                            const CategoryIcon = categoryInfo?.icon || Building2;

                            if (viewMode === 'list') {
                              return (
                                <m.div
                                  key={building.id}
                                  layout
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{
                                    duration: 0.2,
                                    delay: Math.min(index * 0.02, 0.15),
                                  }}
                                >
                                  <Link
                                    href={isSelected ? '/map' : `/map?building=${building.id}`}
                                    aria-current={isSelected ? 'page' : undefined}
                                    className={`flex items-center gap-3 p-3 rounded-mq-lg transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-mq-primary/50 ${
                                      isSelected
                                        ? 'bg-mq-success/10 border-mq-success'
                                        : 'bg-mq-background-secondary border-transparent hover:border-mq-primary/20 hover:bg-mq-hover-background'
                                    }`}
                                  >
                                    <div
                                      className={`p-2 rounded-mq ${
                                        isSelected ? 'bg-mq-success/20' : 'bg-mq-background'
                                      }`}
                                    >
                                      <CategoryIcon
                                        className={`h-4 w-4 ${isSelected ? 'text-mq-success' : categoryInfo?.color || 'text-mq-content-secondary'}`}
                                        aria-hidden="true"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-mq-sm text-mq-content">
                                          {building.id}
                                        </span>
                                        {building.wheelchair && (
                                          <Accessibility
                                            className="h-3 w-3"
                                            aria-label={t('wheelchairAccessible')}
                                          />
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
                                </m.div>
                              );
                            }

                            // Grid view with animations
                            return (
                              <m.div
                                key={building.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{
                                  duration: 0.2,
                                  delay: Math.min(index * 0.02, 0.15),
                                }}
                              >
                                <Link
                                  href={isSelected ? '/map' : `/map?building=${building.id}`}
                                  aria-current={isSelected ? 'page' : undefined}
                                  className={`group block h-full p-3 rounded-mq-lg transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-mq-primary/50 flex flex-col gap-2 ${
                                    isSelected
                                      ? 'bg-mq-success/10 border-2 border-mq-success'
                                      : 'bg-mq-background-secondary border-transparent hover:border-mq-primary/20 hover:shadow-[0_0_15px_rgba(166,25,46,0.08)]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                      <CategoryIcon
                                        className={`h-4 w-4 ${isSelected ? 'text-mq-success' : categoryInfo?.color || 'text-mq-content-secondary'}`}
                                        aria-hidden="true"
                                      />
                                      <span className="font-semibold text-mq-content">
                                        {building.id}
                                      </span>
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
                                  <div className="flex items-center gap-1 mt-auto min-h-[22px]">
                                    {building.category && (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] bg-mq-background"
                                      >
                                        {BUILDING_CATEGORY_LABELS[building.category]}
                                      </Badge>
                                    )}
                                    {building.wheelchair && (
                                      <span
                                        className="inline-flex items-center text-[10px] text-mq-success"
                                        aria-label={t('wheelchairAccessible')}
                                      >
                                        <Accessibility className="h-3 w-3" aria-hidden="true" />
                                      </span>
                                    )}
                                  </div>
                                </Link>
                              </m.div>
                            );
                          },
                        )}
                      </AnimatePresence>
                    </m.div>

                    {/* Show More/Less Button */}
                    {sidebarBuildings.length > 12 && (
                      <m.div
                        className="flex justify-center pt-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAllBuildings(!showAllBuildings)}
                          className="gap-2 text-mq-content-secondary hover:text-mq-content"
                        >
                          {showAllBuildings ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              {t('showLess')}
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              {t('showAllBuildings')} ({sidebarBuildings.length - 12})
                            </>
                          )}
                        </Button>
                      </m.div>
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
      </div>
    </LazyMotion>
  );
}
