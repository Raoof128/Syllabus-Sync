// lib/store/unitsStore.ts
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Unit, ClassTime } from '@/lib/types';
import { errorHandler } from '@/lib/utils/errorHandling';
import { apiRequest } from '@/lib/utils/api';

interface UnitsState {
  units: Unit[];
  isLoading: boolean;
  hasLoaded: boolean;
  loadUnits: () => Promise<void>;
  addUnit: (unit: Unit) => Promise<Unit | null>;
  removeUnit: (id: string) => Promise<void>;
  updateUnit: (id: string, unit: Partial<Unit>) => Promise<Unit | null>;
  getUnitByCode: (code: string) => Unit | undefined;
  getTodayClasses: () => (Unit & ClassTime)[];
}

const normalizeUnit = (unit: Unit): Unit => ({
  ...unit,
  createdAt: unit.createdAt instanceof Date ? unit.createdAt : new Date(unit.createdAt),
  schedule: unit.schedule ?? [],
});

export const useUnitsStore = create<UnitsState>()(
  persist(
    (set, get) => ({
  units: [],
  isLoading: false,
  hasLoaded: false,

  loadUnits: async () => {
    if (get().hasLoaded) return;
    set({ isLoading: true });
    try {
      const data = await apiRequest<Unit[]>('/api/units');
      set({ units: data.map(normalizeUnit), hasLoaded: true });
    } catch (error) {
      // Silently fail - keep persisted data if API is unavailable
      // This allows the app to work with local data until database is set up
      console.warn('Failed to load units from API, using persisted data:', error);
      set({ hasLoaded: true }); // Mark as loaded to prevent retry
    } finally {
      set({ isLoading: false });
    }
  },

  addUnit: async (unit) => {
    // For testing compatibility, update state synchronously first
    const normalized = normalizeUnit({
      ...unit,
      id: unit.id || `unit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: unit.createdAt || new Date(),
    });

    set((state) => {
      if (state.units.some((existing) => existing.id === normalized.id)) {
        return state;
      }
      return { units: [...state.units, normalized] };
    });

    try {
      const created = await apiRequest<Unit>('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized),
      });
      const serverNormalized = normalizeUnit(created);
      // Update with server response if different
      set((state) => ({
        units: state.units.map((u) => (u.id === normalized.id ? serverNormalized : u)),
      }));
      return serverNormalized;
    } catch (error) {
      // Silently handle API errors - stores work with local data
      // Only log unexpected errors, not auth failures
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('authentication') && !errorMessage.includes('unauthorized')) {
        errorHandler.logError(
          error instanceof Error ? error : new Error('Failed to add unit'),
          'UnitsStore.addUnit',
          'medium',
        );
      }
      return normalized; // Return the local version on error
    }
  },

  removeUnit: async (id) => {
    // Remove from local state immediately
    set((state) => ({
      units: state.units.filter((u) => u.id !== id),
    }));

    try {
      await apiRequest<{ id: string }>(`/api/units/${id}`, { method: 'DELETE' });
    } catch (error) {
      // On error, restore the unit to local state
      const unitToRestore = get().units.find(u => u.id === id);
      if (unitToRestore) {
        set((state) => ({ units: [...state.units, unitToRestore] }));
      }
      errorHandler.logError(
        error instanceof Error ? error : new Error(`Failed to remove unit ${id}`),
        'UnitsStore.removeUnit',
        'high',
      );
    }
  },

  updateUnit: async (id, updatedUnit) => {
    // Update local state immediately
    const currentUnit = get().units.find(u => u.id === id);
    if (!currentUnit) return null;

    const optimisticUpdate = { ...currentUnit, ...updatedUnit };
    set((state) => ({
      units: state.units.map((u) => (u.id === id ? optimisticUpdate : u)),
    }));

    try {
      const updated = await apiRequest<Unit>(`/api/units/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUnit),
      });
      const normalized = normalizeUnit(updated);
      set((state) => ({
        units: state.units.map((u) => (u.id === id ? normalized : u)),
      }));
      return normalized;
    } catch (error) {
      // Revert to original state on error
      set((state) => ({
        units: state.units.map((u) => (u.id === id ? currentUnit : u)),
      }));
      errorHandler.logError(
        error instanceof Error ? error : new Error(`Failed to update unit ${id}`),
        'UnitsStore.updateUnit',
        'high',
      );
      return null;
    }
  },

  getUnitByCode: (code) => {
    return get().units.find((u) => u.code === code);
  },

  getTodayClasses: () => {
    const days: string[] = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const today = days[new Date().getDay()];

    const todayClasses = get().units.flatMap((unit) =>
      unit.schedule
        .filter((schedule) => schedule.day === today)
        .map((schedule) => ({
          ...unit,
          ...schedule,
        })),
    );

    return todayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));
  },
}),
{
  name: 'units-storage',
  storage: createJSONStorage(() => localStorage),
  version: 2,
  migrate: (persistedState: any, version: number) => {
    if (version < 2) {
      // Migration from version 1 to 2: Convert old string IDs to UUIDs
      if (persistedState?.state?.units && Array.isArray(persistedState.state.units)) {
        const idMap: Record<string, string> = {
          'unit-comp2310': '550e8400-e29b-41d4-a716-446655440100',
          'unit-math1001': '550e8400-e29b-41d4-a716-446655440200',
          'unit-hist2002': '550e8400-e29b-41d4-a716-446655440300',
        };

        persistedState.state.units = persistedState.state.units.map((unit: any) => {
          if (unit.id && idMap[unit.id]) {
            // Also update schedule IDs
            const updatedUnit = { ...unit, id: idMap[unit.id] };
            if (updatedUnit.schedule && Array.isArray(updatedUnit.schedule)) {
              updatedUnit.schedule = updatedUnit.schedule.map((schedule: any) => {
                if (schedule.id) {
                  // Convert schedule IDs to UUIDs
                  const scheduleIdMap: Record<string, string> = {
                    'comp2310-lecture': '550e8400-e29b-41d4-a716-446655440101',
                    'comp2310-tutorial': '550e8400-e29b-41d4-a716-446655440102',
                    'math1001-lecture': '550e8400-e29b-41d4-a716-446655440201',
                    'math1001-workshop': '550e8400-e29b-41d4-a716-446655440202',
                    'hist2002-lecture': '550e8400-e29b-41d4-a716-446655440301',
                  };
                  if (scheduleIdMap[schedule.id]) {
                    return { ...schedule, id: scheduleIdMap[schedule.id] };
                  }
                }
                return schedule;
              });
            }
            return updatedUnit;
          }
          return unit;
        });
      }
    }
    return persistedState;
  },
},
),
);
