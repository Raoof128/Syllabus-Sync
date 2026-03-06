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
import { Map, ExternalLink } from 'lucide-react';
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

  const handleCampusMap = useCallback(() => {
    const params = new URLSearchParams();
    params.set('building', buildingId.toLowerCase());
    if (room) params.set('room', room);
    params.set('autonav', 'true');
    router.push(`/map?${params.toString()}`);
    onOpenChange(false);
  }, [buildingId, room, router, onOpenChange]);

  const handleGoogleMaps = useCallback(() => {
    const building = getBuildingById(buildingId);
    if (building) {
      const gps = getBuildingGps(building);
      const destination = encodeURIComponent(`${gps.lat},${gps.lng}`);
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    onOpenChange(false);
  }, [buildingId, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-mq-primary" />
            {t('navigationPreference') || 'Navigation Options'}
          </DialogTitle>
          <DialogDescription>
            {t('chooseNavigationMethod') || 'Which map would you like to use for navigation?'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
            onClick={handleCampusMap}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-mq-primary/10">
              <Map className="h-5 w-5 text-mq-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold">{t('campusMap') || 'Campus Map'}</p>
              <p className="text-xs text-mq-content-secondary">
                {t('campusMapDesc') || 'Navigate using the built-in campus map'}
              </p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
            onClick={handleGoogleMaps}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10">
              <ExternalLink className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold">{t('googleMaps') || 'Google Maps'}</p>
              <p className="text-xs text-mq-content-secondary">
                {t('googleMapsDesc') || 'Open in Google Maps for directions'}
              </p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to manage navigation preference dialog state
export function useNavigationPreference() {
  const [isOpen, setIsOpen] = useState(false);
  const [buildingId, setBuildingId] = useState('');
  const [room, setRoom] = useState<string | undefined>(undefined);

  const openNavigationDialog = useCallback((building: string, roomNumber?: string) => {
    setBuildingId(building);
    setRoom(roomNumber);
    setIsOpen(true);
  }, []);

  const closeNavigationDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    setIsOpen,
    buildingId,
    room,
    openNavigationDialog,
    closeNavigationDialog,
  };
}
