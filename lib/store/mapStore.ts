// lib/store/mapStore.ts
// ============================================
// MAP STORE
// ============================================
// Manages map state including active overlays and user preferences

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  MAP_OVERLAY_IDS,
  normaliseOverlayIds,
  type MapOverlayId,
} from "@/features/map/lib/mapOverlays";

export interface MapState {
  // Active overlay layers (always in registry order, no duplicates)
  activeOverlays: MapOverlayId[];
  // Toggle an overlay on/off
  toggleOverlay: (overlayId: MapOverlayId) => void;
  // Set multiple overlays at once (normalises)
  setOverlays: (overlays: string[]) => void;
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
  setLastPosition: (
    pos: { lat: number; lng: number; zoom: number } | null,
  ) => void;
  // Haptic feedback for navigation (mobile)
  hapticFeedbackEnabled: boolean;
  setHapticFeedbackEnabled: (enabled: boolean) => void;
  toggleHapticFeedback: () => void;
  reset: () => void;
}

type MapPersistedState = Pick<
  MapState,
  | "activeOverlays"
  | "showOverlayPanel"
  | "lastPosition"
  | "hapticFeedbackEnabled"
>;

export const useMapStore = create<MapState>()(
  persist(
    (set, get) => ({
      activeOverlays: [],

      toggleOverlay: (overlayId) =>
        set((state) => {
          const next = state.activeOverlays.includes(overlayId)
            ? state.activeOverlays.filter((id) => id !== overlayId)
            : normaliseOverlayIds([...state.activeOverlays, overlayId]);
          return { activeOverlays: next };
        }),

      setOverlays: (overlays) =>
        set({ activeOverlays: normaliseOverlayIds(overlays) }),

      clearOverlays: () => set({ activeOverlays: [] }),

      isOverlayActive: (overlayId) => get().activeOverlays.includes(overlayId),

      selectedBuildingId: null,

      setSelectedBuilding: (buildingId) =>
        set({ selectedBuildingId: buildingId }),

      showOverlayPanel: false,

      setShowOverlayPanel: (show) => set({ showOverlayPanel: show }),

      lastPosition: null,

      setLastPosition: (pos) => set({ lastPosition: pos }),

      // Haptic feedback settings (default enabled on mobile)
      hapticFeedbackEnabled: true,

      setHapticFeedbackEnabled: (enabled) =>
        set({ hapticFeedbackEnabled: enabled }),

      toggleHapticFeedback: () =>
        set((state) => ({
          hapticFeedbackEnabled: !state.hapticFeedbackEnabled,
        })),

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
      name: "map-storage",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      partialize: (state): MapPersistedState => ({
        activeOverlays: state.activeOverlays,
        showOverlayPanel: state.showOverlayPanel,
        lastPosition: state.lastPosition,
        hapticFeedbackEnabled: state.hapticFeedbackEnabled,
      }),
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<
          MapPersistedState & { activeOverlays: string[] }
        >;
        // Re-normalise overlays on migration to drop stale IDs (e.g. 'exam', 'walk', 'water', 'permits')
        const migrated: MapPersistedState = {
          activeOverlays: normaliseOverlayIds(state?.activeOverlays ?? []),
          showOverlayPanel: state?.showOverlayPanel ?? false,
          lastPosition: state?.lastPosition ?? null,
          hapticFeedbackEnabled: state?.hapticFeedbackEnabled ?? true,
        };
        // Suppress unused parameter lint — version is needed by Zustand's migrate signature
        void version;
        return migrated;
      },
    },
  ),
);

// Helper to parse overlays from URL query string
export const parseOverlaysFromURL = (
  searchParams: URLSearchParams,
): MapOverlayId[] => {
  const layersParam = searchParams.get("layers");
  if (!layersParam) return [];
  return normaliseOverlayIds(layersParam.split(","));
};

// Helper to create URL query string from overlays (always in registry order)
export const overlaysToURLParam = (overlays: MapOverlayId[]): string => {
  // Ensure stable ordering
  const ordered = MAP_OVERLAY_IDS.filter((id) => overlays.includes(id));
  return ordered.length > 0 ? ordered.join(",") : "";
};
