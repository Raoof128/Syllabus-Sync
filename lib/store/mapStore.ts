// lib/store/mapStore.ts
// ============================================
// MAP STORE
// ============================================
// Manages map state including active overlays and user preferences

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mapOverlays, type MapOverlayId } from '@/lib/map/mapOverlays';

export interface MapState {
  // Active overlay layers
  activeOverlays: MapOverlayId[];
  // Toggle an overlay on/off
  toggleOverlay: (overlayId: MapOverlayId) => void;
  // Set multiple overlays at once
  setOverlays: (overlays: MapOverlayId[]) => void;
  // Clear all overlays
  clearOverlays: () => void;
  // Check if an overlay is active
  isOverlayActive: (overlayId: MapOverlayId) => boolean;
  // Selected building for navigation
  selectedBuildingId: string | null;
  setSelectedBuilding: (buildingId: string | null) => void;
  // Show/hide overlay panel
  showOverlayPanel: boolean;
  setShowOverlayPanel: (show: boolean) => void;
  // Last viewed position (for restoring map state)
  lastPosition: { lat: number; lng: number; zoom: number } | null;
  setLastPosition: (pos: { lat: number; lng: number; zoom: number } | null) => void;
  // Haptic feedback for navigation (mobile)
  hapticFeedbackEnabled: boolean;
  setHapticFeedbackEnabled: (enabled: boolean) => void;
  toggleHapticFeedback: () => void;
  reset: () => void;
}

type MapPersistedState = Pick<
  MapState,
  'activeOverlays' | 'showOverlayPanel' | 'lastPosition' | 'hapticFeedbackEnabled'
>;

export const useMapStore = create<MapState>()(
  persist(
    (set, get) => ({
      activeOverlays: [],

      toggleOverlay: (overlayId) =>
        set((state) => ({
          activeOverlays: state.activeOverlays.includes(overlayId)
            ? state.activeOverlays.filter((id) => id !== overlayId)
            : [...state.activeOverlays, overlayId],
        })),

      setOverlays: (overlays) => set({ activeOverlays: overlays }),

      clearOverlays: () => set({ activeOverlays: [] }),

      isOverlayActive: (overlayId) => get().activeOverlays.includes(overlayId),

      selectedBuildingId: null,

      setSelectedBuilding: (buildingId) => set({ selectedBuildingId: buildingId }),

      showOverlayPanel: false,

      setShowOverlayPanel: (show) => set({ showOverlayPanel: show }),

      lastPosition: null,

      setLastPosition: (pos) => set({ lastPosition: pos }),

      // Haptic feedback settings (default enabled on mobile)
      hapticFeedbackEnabled: true,

      setHapticFeedbackEnabled: (enabled) => set({ hapticFeedbackEnabled: enabled }),

      toggleHapticFeedback: () =>
        set((state) => ({ hapticFeedbackEnabled: !state.hapticFeedbackEnabled })),

      reset: () =>
        set({
          activeOverlays: [],
          selectedBuildingId: null,
          showOverlayPanel: false,
          lastPosition: null,
          hapticFeedbackEnabled: true,
        }),
    }),
    {
      name: 'map-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state): MapPersistedState => ({
        activeOverlays: state.activeOverlays,
        showOverlayPanel: state.showOverlayPanel,
        lastPosition: state.lastPosition,
        hapticFeedbackEnabled: state.hapticFeedbackEnabled,
      }),
      migrate: (persistedState) => {
        const state = persistedState as Partial<MapPersistedState>;
        return {
          activeOverlays: state?.activeOverlays ?? [],
          showOverlayPanel: state?.showOverlayPanel ?? false,
          lastPosition: state?.lastPosition ?? null,
          hapticFeedbackEnabled: state?.hapticFeedbackEnabled ?? true,
        };
      },
    },
  ),
);

// Helper to parse overlays from URL query string
export const parseOverlaysFromURL = (searchParams: URLSearchParams): MapOverlayId[] => {
  const layersParam = searchParams.get('layers');
  if (!layersParam) return [];

  const validOverlayIds = mapOverlays.map((o) => o.id);

  return layersParam
    .split(',')
    .filter((id): id is MapOverlayId => validOverlayIds.includes(id as MapOverlayId));
};

// Helper to create URL query string from overlays
export const overlaysToURLParam = (overlays: MapOverlayId[]): string => {
  return overlays.length > 0 ? overlays.join(',') : '';
};
