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
      errorHandler.logError(
        error instanceof Error ? error : new Error('Failed to load units'),
        'UnitsStore.loadUnits',
        'high',
      );
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
      errorHandler.logError(
        error instanceof Error ? error : new Error('Failed to add unit'),
        'UnitsStore.addUnit',
        'high',
      );
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
  version: 1,
},
),
);
