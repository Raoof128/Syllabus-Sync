"use client";

import {
  Suspense,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import ReactDOM from "react-dom";
import {
  LazyMotion,
  domAnimation,
  m,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import "@/app/styles/leaflet.css";
import {
  X,
  CheckCircle2,
  Accessibility,
  Layers,
  Car,
  Droplets,
  BadgeCheck,
  Link as LinkIcon,
} from "lucide-react";
import { TranslatedMapErrorBoundary } from "./MapErrorBoundary";
import { MapLoadingSkeleton } from "./MapSkeleton";
import CampusMapHUD from "./CampusMapHUD";
import { RouteAnnouncer } from "./RouteAnnouncer";
import { APP_CONFIG } from "@/lib/config";

import { Badge } from "@/components/ui/mq/badge";
import { Button } from "@/components/ui/mq/button";
import { UNIVERSITY_CONFIG } from "@/lib/config";
import { buildings, getBuildingById } from "@/features/map/lib/buildings";
import { mapOverlays, type MapOverlayId } from "@/features/map/lib/mapOverlays";
import {
  useMapStore,
  parseOverlaysFromURL,
  overlaysToURLParam,
} from "@/lib/store/mapStore";
import { useTypedTranslation } from "@/lib/hooks/useTypedTranslation";
import { MagicCard } from "@/components/ui/MagicCard";
import { toastUtils } from "@/lib/utils/toast";
import { CAMPUS_IMAGE_URL } from "@/features/map/lib/constants";
import { MapViewToggle, type MapView } from "./MapViewToggle";
import { GoogleMapEmbed, type GoogleMapRef } from "./GoogleMapEmbed";

import { triggerHaptic } from "@/lib/utils/haptics";

const normalizeForSearch = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

// Map overlay icons
const OVERLAY_ICONS: Record<
  MapOverlayId,
  React.ComponentType<{ className?: string }>
> = {
  parking: Car,
  drinking_water: Droplets,
  accessibility: Accessibility,
  special_permits: BadgeCheck,
};

// Dynamic import for the heavy map lib with Suspense
const CampusMap = dynamic(() => import("./CampusMap"), {
  ssr: false,
  loading: () => <MapLoadingSkeleton />,
});

// Import LocationStatus type
import type { LocationStatus, CampusMapRef } from "./CampusMap";

export default function MapClient() {
  const { t } = useTypedTranslation();
  const prefersReducedMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const campusMapRef = useRef<CampusMapRef>(null);
  const googleMapRef = useRef<GoogleMapRef>(null);
  const overlayToggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const wasOverlayOpenRef = useRef(false);

  // Preload critical map image for better LCP (Largest Contentful Paint).
  // Keep this in an effect to avoid side effects during render.
  const hasPreloadedCampusImageRef = useRef(false);
  useEffect(() => {
    if (hasPreloadedCampusImageRef.current) return;
    hasPreloadedCampusImageRef.current = true;
    try {
      ReactDOM.preload(CAMPUS_IMAGE_URL, { as: "image" });
    } catch {
      // Ignore: preload is a progressive enhancement.
    }
  }, []);

  // Location status from CampusMap
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");

  // Navigation state for RouteAnnouncer
  const [navState, setNavState] = useState<{
    isNavigating: boolean;
    remainingDistance?: number;
    status?:
    | "idle"
    | "navigating"
    | "arrived"
    | "off-route"
    | "recalculating"
    | "error";
  } | null>(null);

  // Smooth loading transition state
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapLoadTimedOut, setMapLoadTimedOut] = useState(false);
  const mapReadyTimeoutRef = useRef<number | null>(null);

  // Buildings sidebar state
  const [buildingSearch, setBuildingSearch] = useState("");
  const hasAutoNavigatedRef = useRef(false);
  const mapView: MapView =
    searchParams.get("view") === "google" ? "google" : "campus";

  // Use map store for overlay persistence
  const {
    activeOverlays,
    showOverlayPanel,
    toggleOverlay,
    setOverlays,
    clearOverlays,
    setShowOverlayPanel,
  } = useMapStore();

  const overlaysContainerRef = useRef<HTMLDivElement>(null);

  // Focus management for overlay panel
  useEffect(() => {
    if (showOverlayPanel && overlaysContainerRef.current) {
      // Small timeout to allow animation/rendering to start
      const timer = setTimeout(() => {
        const firstButton =
          overlaysContainerRef.current?.querySelector("button");
        if (firstButton) {
          (firstButton as HTMLElement).focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showOverlayPanel]);

  useEffect(() => {
    if (wasOverlayOpenRef.current && !showOverlayPanel) {
      overlayToggleButtonRef.current?.focus();
    }
    wasOverlayOpenRef.current = showOverlayPanel;
  }, [showOverlayPanel]);

  const handleOverlayPanelKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowOverlayPanel(false);
        overlayToggleButtonRef.current?.focus();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable =
        overlaysContainerRef.current?.querySelectorAll("button");
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [setShowOverlayPanel],
  );

  const selectedBuildingId = searchParams.get("building");
  const selectedBuilding = selectedBuildingId
    ? getBuildingById(selectedBuildingId)
    : undefined;
  const autoNavigate = searchParams.get("autonav") === "true";

  // Ref-based lock to prevent URL↔store feedback loops.
  // 'url' = URL just wrote to store (suppress store→URL echo)
  // 'store' = store just wrote to URL (suppress URL→store echo)
  const syncLockRef = useRef<"url" | "store" | null>(null);

  // URL → store: only fires when searchParams change (back/forward or initial load)
  useEffect(() => {
    if (syncLockRef.current === "store") return;
    const layersParam = searchParams.get("layers") || "";
    if (!layersParam) return;

    const urlOverlays = parseOverlaysFromURL(searchParams);
    syncLockRef.current = "url";
    setOverlays(urlOverlays);
    queueMicrotask(() => {
      syncLockRef.current = null;
    });
  }, [searchParams, setOverlays]);

  // Store → URL: fires when activeOverlays change (user toggle)
  useEffect(() => {
    if (syncLockRef.current === "url") return;

    const nextParam = overlaysToURLParam(activeOverlays);
    const currentParam = searchParams.get("layers") || "";

    if (nextParam === currentParam) return;

    const params = new URLSearchParams(searchParams.toString());
    if (nextParam) {
      params.set("layers", nextParam);
    } else {
      params.delete("layers");
    }

    syncLockRef.current = "store";
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, "", newUrl);
    queueMicrotask(() => {
      syncLockRef.current = null;
    });
  }, [activeOverlays, searchParams]);

  // Auto-scroll and notify when arriving with a building + autonav flag
  useEffect(() => {
    if (!autoNavigate || !selectedBuilding || hasAutoNavigatedRef.current)
      return;
    hasAutoNavigatedRef.current = true;
    if (mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    toastUtils.success(t("routeReady"), t("selectBuildingToNavigate"));
  }, [autoNavigate, selectedBuilding, t]);

  // PERF: Prefetch overlay images when user opens the overlay panel
  // This improves perceived performance when toggling layers
  useEffect(() => {
    if (!showOverlayPanel) return;

    // Prefetch all overlay images in the background
    mapOverlays.forEach((overlay) => {
      const img = new Image();
      img.src = overlay.url;
    });
  }, [showOverlayPanel]);

  // Copy shareable URL
  const copyShareableURL = useCallback(async () => {
    const url = new URL(window.location.href);
    if (activeOverlays.length > 0) {
      url.searchParams.set("layers", overlaysToURLParam(activeOverlays));
    }
    if (selectedBuildingId) {
      url.searchParams.set("building", selectedBuildingId);
    }

    try {
      await navigator.clipboard.writeText(url.toString());
      toastUtils.success(t("copied"), `${url.toString().substring(0, 50)}...`);
    } catch {
      toastUtils.error(t("error"), t("tryAgain"));
    }
  }, [activeOverlays, selectedBuildingId, t]);

  const handleMapViewChange = useCallback(
    (nextView: MapView) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextView === "google") {
        params.set("view", "google");
      } else {
        params.delete("view");
      }
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      window.history.replaceState({}, "", newUrl);
    },
    [searchParams],
  );

  const handleExport = useCallback(() => {
    try {
      const link = document.createElement("a");
      link.href = CAMPUS_IMAGE_URL;
      link.download = "campus-map.png";
      link.rel = "noopener";
      link.click();
      toastUtils.success(t("export"), t("downloadStarted"));
    } catch {
      toastUtils.error(t("error"), t("tryAgain"));
    }
  }, [t]);

  // Buildings sidebar - filtered and searched
  const sidebarBuildings = useMemo(() => {
    const query = buildingSearch.trim();
    if (!query) return [...buildings];

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
  }, [buildingSearch, t]);

  // Ensure a non-empty document title for accessibility scanners
  useEffect(() => {
    try {
      document.title = `${APP_CONFIG.name} - Map`;
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isMapReady) {
      if (mapReadyTimeoutRef.current) {
        window.clearTimeout(mapReadyTimeoutRef.current);
      }
      mapReadyTimeoutRef.current = window.setTimeout(() => {
        if (!isMapReady) {
          setMapLoadTimedOut(true);
          setIsMapReady(true);
        }
      }, 5000);
    }

    return () => {
      if (mapReadyTimeoutRef.current) {
        window.clearTimeout(mapReadyTimeoutRef.current);
        mapReadyTimeoutRef.current = null;
      }
    };
  }, [isMapReady]);

  // NOTE: No IntersectionObserver - map loads immediately for better LCP
  // The map component is loaded with Suspense for progressive enhancement

  return (
    <LazyMotion features={domAnimation}>
      <section
        className="container mx-auto max-w-7xl map-page relative px-3 py-4 sm:p-4"
        aria-label={t("campusMapLabel")}
      >
        {/* Skip Link - Keyboard Accessibility (only visible when focused) */}
        <a
          href="#map-search-input"
          className="absolute -top-[9999px] -left-[9999px] focus:top-2 focus:left-2 focus:z-[2000] px-4 py-2 bg-mq-primary text-white font-bold rounded-mq-lg shadow-lg transition-all focus:outline-none"
        >
          {t("skipToSearch")}
        </a>

        {/* Route Announcer for Screen Readers */}
        <RouteAnnouncer
          navState={navState}
          locationStatus={locationStatus}
          selectedBuildingName={selectedBuilding?.id}
        />

        {/* Header */}
        <header className="mb-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-mq-2xl font-bold text-mq-content sm:text-mq-3xl">
              {t("navigation")}
            </h1>
          </div>
          <p className="text-mq-content-secondary">
            {t("navigateCampus").replace(
              "Macquarie University",
              UNIVERSITY_CONFIG.name,
            )}
          </p>
        </header>

        {mapView === "campus" && (
          <>
            {/* Map Overlay Layers */}
            <div className="mb-4">
              <MagicCard isLiquidEnhanced>
                <div className="mq-magic-card-content p-4 bg-mq-card-background border border-mq-border">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <Layers className="h-5 w-5" />
                      <div className="min-w-0">
                        <p className="text-mq-sm font-medium text-mq-content">
                          {t("mapLayers")}
                        </p>
                        <p className="text-mq-xs text-mq-content-secondary">
                          {t("mapLayersDesc")}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {activeOverlays.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {activeOverlays.length} {t("active")}
                        </Badge>
                      )}
                      <Button
                        variant={showOverlayPanel ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => setShowOverlayPanel(!showOverlayPanel)}
                        ref={overlayToggleButtonRef}
                        aria-expanded={showOverlayPanel}
                        aria-controls="map-overlays-panel"
                        className="gap-2 whitespace-nowrap"
                      >
                        <Layers className="h-4 w-4" />
                        {showOverlayPanel ? t("hideLayers") : t("showLayers")}
                      </Button>
                    </div>
                  </div>

                  {/* Overlay Toggle Buttons */}
                  {showOverlayPanel && (
                    <div
                      id="map-overlays-panel"
                      ref={overlaysContainerRef}
                      onKeyDown={handleOverlayPanelKeyDown}
                      role="group"
                      aria-label={t("mapLayers")}
                      tabIndex={-1}
                      className="space-y-3 pt-3 border-t border-mq-border"
                    >
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {mapOverlays.map((overlay) => {
                          const Icon = OVERLAY_ICONS[overlay.id];
                          const isActive = activeOverlays.includes(overlay.id);
                          return (
                            <m.button
                              key={overlay.id}
                              onClick={() => {
                                toggleOverlay(overlay.id);
                                triggerHaptic("tap", "light");
                              }}
                              aria-pressed={isActive}
                              whileHover={
                                prefersReducedMotion
                                  ? undefined
                                  : { scale: 1.02 }
                              }
                              whileTap={
                                prefersReducedMotion
                                  ? undefined
                                  : { scale: 0.98 }
                              }
                              className={`w-full flex items-center gap-2 p-3 rounded-mq-lg border transition-colors duration-200 text-left relative overflow-hidden ${isActive
                                  ? "bg-mq-primary/10 border-mq-primary text-mq-primary"
                                  : "bg-mq-background-secondary border-transparent hover:border-mq-border hover:bg-mq-hover-background text-mq-content"
                                }`}
                            >
                              {/* Ripple Effect */}
                              {isActive && !prefersReducedMotion && (
                                <m.div
                                  className="absolute inset-0 bg-mq-primary/5 rounded-mq-lg pointer-events-none"
                                  initial={{ scale: 0, opacity: 0.5 }}
                                  animate={{ scale: 1.5, opacity: 0 }}
                                  transition={{ duration: 0.5 }}
                                />
                              )}

                              <m.div
                                animate={
                                  isActive && !prefersReducedMotion
                                    ? {
                                      scale: [1, 1.2, 1],
                                      rotate: [0, 5, -5, 0],
                                    }
                                    : undefined
                                }
                                transition={
                                  prefersReducedMotion
                                    ? undefined
                                    : { duration: 0.4 }
                                }
                              >
                                <Icon
                                  className={`h-5 w-5 flex-shrink-0 ${overlay.color}`}
                                />
                              </m.div>
                              <div className="min-w-0 flex-1">
                                <p className="text-mq-sm font-medium truncate">
                                  {t(overlay.labelKey)}
                                </p>
                                <p className="text-mq-xs text-mq-content-secondary truncate">
                                  {t(overlay.descKey)}
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
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={copyShareableURL}
                            className="gap-1 text-mq-info"
                            title={t("copyShareableURL")}
                          >
                            <LinkIcon className="h-4 w-4" />
                            {t("copyLink")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearOverlays}
                            className="gap-1"
                          >
                            <X className="h-4 w-4" />
                            {t("clearAll")}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </MagicCard>
            </div>
          </>
        )}

        {/* Combined Map Wrapper */}
        {/* Combined Map Wrapper */}
        <div className="mb-6 w-full max-w-none">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3 px-1">
            <div className="w-full sm:w-auto">
              <MapViewToggle
                activeView={mapView}
                onViewChange={handleMapViewChange}
              />
            </div>
            <p className="text-xs text-mq-content-tertiary hidden md:block">
              {t("mapPanZoomHint")}
            </p>
          </div>

          <div
            ref={mapContainerRef}
            className="relative h-[65svh] min-h-[400px] sm:h-[75svh] md:h-[clamp(500px,70vh,800px)] lg:h-[clamp(600px,80vh,900px)] landscape:h-[75svh] landscape:min-h-[350px] w-full bg-mq-background-secondary overflow-hidden"
          >
            {mapView === "campus" ? (
              <>
                {/* Real Map (with smooth fade-in when ready) */}
                <div
                  className={`absolute inset-0 transition-opacity duration-500 ${isMapReady ? "opacity-100" : "opacity-0"}`}
                >
                  <TranslatedMapErrorBoundary>
                    <Suspense fallback={null}>
                      <CampusMap
                        ref={campusMapRef}
                        selectedBuilding={selectedBuilding}
                        activeOverlays={activeOverlays}
                        onLocationStatusChange={setLocationStatus}
                        onNavStateChange={setNavState}
                        onMapReady={() => setIsMapReady(true)}
                      />
                    </Suspense>
                  </TranslatedMapErrorBoundary>
                </div>

                {/* Skeleton Overlay (fades out when map is ready) */}
                <AnimatePresence>
                  {!isMapReady && (
                    <m.div
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 z-10"
                    >
                      <MapLoadingSkeleton />
                    </m.div>
                  )}
                </AnimatePresence>

                {mapLoadTimedOut && (
                  <div className="absolute bottom-3 left-3 right-3 z-20 text-center">
                    <p className="text-xs text-mq-content-tertiary bg-mq-card-background/80 rounded-mq px-3 py-1.5 inline-block">
                      {t("mapLoadSlow")}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 z-[50]">
                <GoogleMapEmbed
                  ref={googleMapRef}
                  selectedBuilding={selectedBuilding}
                  destinationLabel={
                    selectedBuilding
                      ? t(selectedBuilding.translationKey)
                      : UNIVERSITY_CONFIG.name
                  }
                  onNavStateChange={setNavState}
                />
              </div>
            )}

            {/* HUD overlays - loaded immediately, sits on top */}
            <CampusMapHUD
              selectedBuilding={selectedBuilding}
              buildings={sidebarBuildings}
              buildingSearch={buildingSearch}
              setBuildingSearch={setBuildingSearch}
              onCopyShare={copyShareableURL}
              onExport={mapView === "campus" ? handleExport : undefined}
              onStartNavigation={
                mapView === "campus"
                  ? () => campusMapRef.current?.startNavigation()
                  : () => googleMapRef.current?.startNavigation()
              }
              isNavigating={navState?.isNavigating || false}
              isGoogleMode={mapView === "google"}
            />
          </div>
        </div>
      </section>
    </LazyMotion>
  );
}
