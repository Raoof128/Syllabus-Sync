'use client';

import { forwardRef } from 'react';
import type { Building } from '@/features/map/lib/buildings';
import type { GoogleTravelMode } from '@/lib/maps/google/types';
import { GoogleMapController, type GoogleMapRef } from './GoogleMapController';
export type { GoogleMapRef } from './GoogleMapController';

interface GoogleMapIntegrationProps {
  buildings: Building[];
  selectedBuilding?: Building;
  travelMode: GoogleTravelMode;
  onTravelModeChange: (mode: GoogleTravelMode) => void;
  onSelectBuilding?: (building: Building) => void;
  onNavStateChange?: (state: {
    isNavigating: boolean;
    status: 'idle' | 'navigating' | 'recalculating' | 'error';
    remainingDistance?: number;
  }) => void;
}

export const GoogleMapIntegration = forwardRef<GoogleMapRef, GoogleMapIntegrationProps>(
  (
    {
      buildings,
      onNavStateChange,
      onSelectBuilding,
      onTravelModeChange,
      selectedBuilding,
      travelMode,
    },
    ref,
  ) => {
    return (
      <GoogleMapController
        ref={ref}
        buildings={buildings}
        selectedBuilding={selectedBuilding}
        travelMode={travelMode}
        onTravelModeChange={onTravelModeChange}
        onSelectBuilding={onSelectBuilding}
        onNavStateChange={onNavStateChange}
      />
    );
  },
);

GoogleMapIntegration.displayName = 'GoogleMapIntegration';
