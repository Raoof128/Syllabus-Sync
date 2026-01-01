// lib/store/unitsStore.ts
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Unit, ClassTime } from '@/lib/types';
import { errorHandler } from '@/lib/utils/errorHandling';

interface UnitsState {
  units: Unit[];
  addUnit: (unit: Unit) => void;
  removeUnit: (id: string) => void;
  updateUnit: (id: string, unit: Partial<Unit>) => void;
  getUnitByCode: (code: string) => Unit | undefined;
  getTodayClasses: () => (Unit & ClassTime)[];
}

export const useUnitsStore = create<UnitsState>()(
  persist(
    (set, get) => ({
      units: [],

      addUnit: (unit) => {
        try {
          set((state) => {
            if (state.units.some((existing) => existing.id === unit.id)) {
              errorHandler.logError(
                `Unit with ID ${unit.id} already exists`,
                'UnitsStore.addUnit',
                'low',
              );
              return state;
            }
            return { units: [...state.units, unit] };
          });
        } catch (error) {
          errorHandler.logError(
            error instanceof Error ? error : new Error('Failed to add unit'),
            'UnitsStore.addUnit',
            'high',
          );
        }
      },

      removeUnit: (id) => {
        try {
          set((state) => ({
            units: state.units.filter((u) => u.id !== id),
          }));
        } catch (error) {
          errorHandler.logError(
            error instanceof Error ? error : new Error(`Failed to remove unit ${id}`),
            'UnitsStore.removeUnit',
            'high',
          );
        }
      },

      updateUnit: (id, updatedUnit) => {
        try {
          set((state) => ({
            units: state.units.map((u) => (u.id === id ? { ...u, ...updatedUnit } : u)),
          }));
        } catch (error) {
          errorHandler.logError(
            error instanceof Error ? error : new Error(`Failed to update unit ${id}`),
            'UnitsStore.updateUnit',
            'high',
          );
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

        // Sort by start time
        return todayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));
      },
    }),
    {
      name: 'units-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state?.units?.length) return;
        const seen = new Set<string>();
        const deduped = state.units.filter((unit) => {
          if (seen.has(unit.id)) return false;
          seen.add(unit.id);
          return true;
        });
        if (deduped.length !== state.units.length) {
          state.units = deduped;
        }
      },
    },
  ),
);
