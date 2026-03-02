'use client';

import { forwardRef } from 'react';
import { UNIVERSITY_CONFIG } from '@/lib/config';
import type { Building } from '@/features/map/lib/buildings';
import { GoogleMapEmbed, type GoogleMapRef as GoogleMapEmbedRef } from './GoogleMapEmbed';

export type GoogleMapRef = GoogleMapEmbedRef;

interface GoogleMapIntegrationProps {
  onNavStateChange?: (state: { isNavigating: boolean; status: 'idle' | 'navigating' }) => void;
  selectedBuilding?: Building;
}

export const GoogleMapIntegration = forwardRef<GoogleMapRef, GoogleMapIntegrationProps>(
  ({ onNavStateChange, selectedBuilding }, ref) => {
    const displayName = selectedBuilding ? selectedBuilding.id : UNIVERSITY_CONFIG.name;

    return (
      <GoogleMapEmbed
        ref={ref}
        selectedBuilding={selectedBuilding}
        destinationLabel={displayName}
        onNavStateChange={onNavStateChange}
      />
    );
  },
);

GoogleMapIntegration.displayName = 'GoogleMapIntegration';
