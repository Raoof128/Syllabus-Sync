'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/mq/button';
import { Map, ExternalLink, Loader2 } from 'lucide-react';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { getBuildingGps, getBuildingById } from '@/features/map/lib/buildings';

interface NavigationPreferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingId: string;
  room?: string;
}

export function NavigationPreferenceDialog({
  open,
  onOpenChange,
  buildingId,
  room,
}: NavigationPreferenceDialogProps) {
  const { t } = useTypedTranslation();
  const router = useRouter();
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Wrapper for onOpenChange that resets loading state when dialog closes
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setIsGettingLocation(false);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  // Show in Campus Map: Focus only on the destination building (no clutter)
  const handleCampusMap = useCallback(() => {
    const params = new URLSearchParams();
    params.set('building', buildingId.toLowerCase());
    if (room) params.set('room', room);
    params.set('autonav', 'true');
    params.set('focused', 'true'); // Focus mode: show only destination marker
    router.push(`/map?${params.toString()}`);
    handleOpenChange(false);
  }, [buildingId, room, router, handleOpenChange]);

  // Navigate with Google Maps: Use current location as origin when possible
  const handleGoogleMaps = useCallback(() => {
    const building = getBuildingById(buildingId);
    if (!building) {
      handleOpenChange(false);
      return;
    }

    const gps = getBuildingGps(building);
    const destinationParam = encodeURIComponent(`${gps.lat},${gps.lng}`);

    // Try to get current location for better directions
    if ('geolocation' in navigator) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Success: use current location as origin
          const originParam = encodeURIComponent(
            `${position.coords.latitude},${position.coords.longitude}`,
          );
          const url = `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destinationParam}&travelmode=walking`;
          window.open(url, '_blank', 'noopener,noreferrer');
          setIsGettingLocation(false);
          handleOpenChange(false);
        },
        () => {
          // Error or denied: open without origin (Google Maps will use device location or prompt)
          const url = `https://www.google.com/maps/dir/?api=1&destination=${destinationParam}&travelmode=walking`;
          window.open(url, '_blank', 'noopener,noreferrer');
          setIsGettingLocation(false);
          handleOpenChange(false);
        },
        { timeout: 5000, maximumAge: 60000 },
      );
    } else {
      // No geolocation support: open without origin
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destinationParam}&travelmode=walking`;
      window.open(url, '_blank', 'noopener,noreferrer');
      handleOpenChange(false);
    }
  }, [buildingId, handleOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-mq-primary" />
            {t('navigationPreference')}
          </DialogTitle>
          <DialogDescription>{t('chooseNavigationMethod')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
            onClick={handleCampusMap}
            disabled={isGettingLocation}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-mq-primary/10">
              <Map className="h-5 w-5 text-mq-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold">{t('campusMap')}</p>
              <p className="text-xs text-mq-content-secondary">{t('campusMapDesc')}</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
            onClick={handleGoogleMaps}
            disabled={isGettingLocation}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10">
              {isGettingLocation ? (
                <Loader2 className="h-5 w-5 text-emerald-600 animate-spin" />
              ) : (
                <ExternalLink className="h-5 w-5 text-emerald-600" />
              )}
            </div>
            <div className="text-left">
              <p className="font-semibold">
                {isGettingLocation ? t('gettingLocation') : t('googleMaps')}
              </p>
              <p className="text-xs text-mq-content-secondary">{t('googleMapsDesc')}</p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
