'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import '@/app/styles/leaflet.css';
import {
  X,
  CheckCircle2,
  Accessibility,
  Layers,
  Car,
  Droplets,
  BadgeCheck,
  GraduationCap,
  Link as LinkIcon,
} from 'lucide-react';
import { MapErrorBoundary } from './MapErrorBoundary';
import { MapLoadingSkeleton } from './MapSkeleton';
import CampusMapHUD from './CampusMapHUD';
import { APP_CONFIG } from '@/lib/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { Button } from '@/components/ui/mq/button';
import { UNIVERSITY_CONFIG } from '@/lib/config';
import { buildings, getBuildingById, searchBuildings } from '@/lib/map/buildings';
import { mapOverlays, type MapOverlayId } from '@/lib/map/mapOverlays';
import { useMapStore, parseOverlaysFromURL, overlaysToURLParam } from '@/lib/store/mapStore';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { MagicCard } from '@/components/ui/MagicCard';
import { toastUtils } from '@/lib/utils/toast';

import { triggerHaptic } from '@/lib/utils/haptics';

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
import type { LocationStatus, CampusMapRef } from './CampusMap';

export default function MapClient() {
  const { t } = useTypedTranslation();
  const searchParams = useSearchParams();
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const campusMapRef = useRef<CampusMapRef>(null);

  // Location status from CampusMap
  const [, setLocationStatus] = useState<LocationStatus>('idle');

  // Buildings sidebar state
  const [buildingSearch, setBuildingSearch] = useState('');
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
    return buildingSearch.trim() ? searchBuildings(buildingSearch) : [...buildings];
  }, [buildingSearch]);

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
      <section
        className="container mx-auto p-4 max-w-7xl map-page"
        aria-label={t('campusMapLabel')}
      >
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-mq-3xl font-bold text-mq-content mb-2">{t('map')}</h1>
          <p className="text-mq-content-secondary">
            {t('navigateCampus').replace('Macquarie University', UNIVERSITY_CONFIG.name)}
          </p>
        </header>

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
                        <m.button
                          key={overlay.id}
                          onClick={() => {
                            toggleOverlay(overlay.id);
                            triggerHaptic('tap', 'light');
                          }}
                          aria-pressed={isActive}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full flex items-center gap-2 p-3 rounded-mq-lg border transition-colors duration-200 text-left relative overflow-hidden ${
                            isActive
                              ? 'bg-mq-primary/10 border-mq-primary text-mq-primary'
                              : 'bg-mq-background-secondary border-transparent hover:border-mq-border hover:bg-mq-hover-background text-mq-content'
                          }`}
                        >
                          {/* Ripple Effect */}
                          {isActive && (
                            <m.div
                              className="absolute inset-0 bg-mq-primary/5 rounded-mq-lg pointer-events-none"
                              initial={{ scale: 0, opacity: 0.5 }}
                              animate={{ scale: 1.5, opacity: 0 }}
                              transition={{ duration: 0.5 }}
                            />
                          )}

                          <m.div
                            animate={
                              isActive
                                ? {
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 5, -5, 0],
                                  }
                                : {}
                            }
                            transition={{ duration: 0.4 }}
                          >
                            <Icon className={`h-5 w-5 flex-shrink-0 ${overlay.color}`} />
                          </m.div>
                          <div className="min-w-0 flex-1">
                            <p className="text-mq-sm font-medium truncate">
                              {t(`overlay_${overlay.id}_name` as TranslationKey)}
                            </p>
                            <p className="text-mq-xs text-mq-content-secondary truncate">
                              {t(`overlay_${overlay.id}_desc` as TranslationKey)}
                            </p>
                          </div>
                          <AnimatePresence>
                            {isActive && (
                              <m.div
                                initial={{ x: 10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 10, opacity: 0 }}
                              >
                                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                              </m.div>
                            )}
                          </AnimatePresence>
                        </m.button>
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
                        title={t('copyShareableURL')}
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
                  className="relative h-[50vh] md:h-[500px] lg:h-[600px] rounded-mq-lg overflow-hidden border border-mq-border"
                >
                  {shouldRenderMap ? (
                    <MapErrorBoundary>
                      <CampusMap
                        ref={campusMapRef}
                        selectedBuilding={selectedBuilding}
                        activeOverlays={activeOverlays}
                        onLocationStatusChange={setLocationStatus}
                      />
                    </MapErrorBoundary>
                  ) : (
                    <MapLoadingSkeleton />
                  )}

                  {/* HUD overlays */}
                  <CampusMapHUD
                    selectedBuilding={selectedBuilding}
                    buildings={sidebarBuildings}
                    buildingSearch={buildingSearch}
                    setBuildingSearch={setBuildingSearch}
                    onCopyShare={copyShareableURL}
                    onStartNavigation={() => campusMapRef.current?.startNavigation()}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </MagicCard>
      </section>
    </LazyMotion>
  );
}
