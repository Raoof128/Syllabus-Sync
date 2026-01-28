'use client';

import { useMemo } from 'react';
import { Search, Share2, Download, Calendar, Building2, X, Navigation } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/mq/badge';
import { Button } from '@/components/ui/mq/button';
import type { Building } from '@/lib/map/buildings';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { cn } from '@/lib/utils';

type Props = {
  selectedBuilding?: Building;
  buildings: Building[];
  buildingSearch: string;
  setBuildingSearch: (v: string) => void;
  onCopyShare: () => void;
  onStartNavigation?: () => void;
};

export default function CampusMapHUD({
  selectedBuilding,
  buildings,
  buildingSearch,
  setBuildingSearch,
  onCopyShare,
  onStartNavigation,
}: Props) {
  const { t } = useTranslation();

  const topSlice = useMemo(() => buildings.slice(0, 15), [buildings]);

  return (
    <div className="absolute inset-0 z-[1100] pointer-events-none">
      {/* Top-right actions */}
      <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-auto">
        <Button
          variant="secondary"
          size="sm"
          className="gap-2 shadow-sm bg-mq-card-background/90 backdrop-blur border-mq-border/50 hover:bg-mq-card-background text-mq-content"
        >
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">{t('today')}</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2 shadow-sm bg-mq-card-background/90 backdrop-blur border-mq-border/50 hover:bg-mq-card-background text-mq-content"
          onClick={onCopyShare}
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">{t('share')}</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2 shadow-sm bg-mq-card-background/90 backdrop-blur border-mq-border/50 hover:bg-mq-card-background text-mq-content"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">{t('export')}</span>
        </Button>
      </div>

      {/* Left sidebar */}
      <div className="absolute top-3 left-3 w-[280px] sm:w-[320px] max-w-[calc(100vw-24px)] pointer-events-auto flex flex-col max-h-[calc(100%-24px)] sm:max-h-[500px]">
        <div className="rounded-mq-xl border border-mq-border bg-mq-card-background/90 backdrop-blur-md shadow-mq overflow-hidden flex flex-col">
          <div className="px-4 py-3 flex items-center justify-between border-b border-mq-border/50">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-mq-content-tertiary" />
              <span className="font-semibold text-mq-content">{t('places')}</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {buildings.length}
            </Badge>
          </div>

          <div className="px-4 py-3 border-b border-mq-border/50 bg-mq-background-secondary/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mq-content-tertiary" />
              <input
                value={buildingSearch}
                onChange={(e) => setBuildingSearch(e.target.value)}
                placeholder={t('filterBuildings')}
                className="w-full pl-10 pr-3 py-2 bg-mq-background border border-mq-border rounded-mq-lg text-mq-sm text-mq-content placeholder:text-mq-content-tertiary focus:outline-none focus:ring-2 focus:ring-mq-primary/30 focus:border-mq-primary transition-all"
              />
            </div>
          </div>

          <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar min-h-0">
            {topSlice.map((b) => {
              const isSelected = selectedBuilding?.id === b.id;
              return (
                <Link
                  key={b.id}
                  href={isSelected ? '/map' : `/map?building=${b.id}`}
                  className={cn(
                    'flex items-center justify-between p-2.5 rounded-mq-lg transition-all',
                    isSelected
                      ? 'bg-mq-primary/10 border border-mq-primary/20 text-mq-primary shadow-sm'
                      : 'hover:bg-mq-background-secondary text-mq-content border border-transparent',
                  )}
                >
                  <div className="flex flex-col min-w-0">
                    <span
                      className={cn(
                        'text-sm font-medium truncate',
                        isSelected ? 'text-mq-primary' : 'text-mq-content',
                      )}
                    >
                      {b.id}
                    </span>
                    <span className="text-xs text-mq-content-secondary truncate max-w-[180px]">
                      {t(b.translationKey)}
                    </span>
                  </div>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-mq-primary shrink-0" />}
                </Link>
              );
            })}
            {buildings.length === 0 && (
              <div className="p-8 text-center text-sm text-mq-content-tertiary">
                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
                {t('noMatchingBuildings')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom-right card (Selected Building) */}
      {selectedBuilding && (
        <div className="absolute bottom-20 sm:bottom-6 right-3 w-[calc(100vw-24px)] sm:w-[300px] pointer-events-auto">
          <div className="rounded-mq-xl border border-mq-border bg-mq-card-background/90 backdrop-blur-md shadow-mq p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-mq-content text-lg">{selectedBuilding.id}</h3>
                <p className="text-sm text-mq-content-secondary line-clamp-1">
                  {t(selectedBuilding.translationKey)}
                </p>
              </div>
              <Link
                href="/map"
                className="text-mq-content-tertiary hover:text-mq-content transition-colors p-1 hover:bg-mq-background-secondary rounded-full"
              >
                <span className="sr-only">{t('close')}</span>
                <X className="h-5 w-5" />
              </Link>
            </div>

            <div className="space-y-2 mt-3">
              {selectedBuilding.category && (
                <Badge variant="neutral" className="bg-mq-background/50 text-xs">
                  {selectedBuilding.category.charAt(0).toUpperCase() +
                    selectedBuilding.category.slice(1)}
                </Badge>
              )}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-mq-background-secondary/50 rounded-lg p-2 text-center border border-mq-border/30">
                  <div className="text-[10px] text-mq-content-tertiary uppercase font-bold tracking-wider">
                    Status
                  </div>
                  <div className="text-sm font-semibold text-mq-success">Open</div>
                </div>
                <div className="bg-mq-background-secondary/50 rounded-lg p-2 text-center border border-mq-border/30">
                  <div className="text-[10px] text-mq-content-tertiary uppercase font-bold tracking-wider">
                    Crowd
                  </div>
                  <div className="text-sm font-semibold text-mq-content">Low</div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => {
                    if (onStartNavigation) {
                      onStartNavigation();
                    }
                  }}
                >
                  <Navigation className="h-4 w-4" />
                  {t('navigateOnCampus')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => {
                    const gps = selectedBuilding.location;
                    if (gps) {
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${gps.lat},${gps.lng}`,
                        '_blank',
                      );
                    }
                  }}
                >
                  <Search className="h-4 w-4" />
                  {t('navigateToGoogleMaps')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
