// lib/store/unitsStore.ts
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Unit, ClassTime } from '@/lib/types';

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
        set((state) => ({
          units: [...state.units, unit],
        }));
      },

      removeUnit: (id) => {
        set((state) => ({
          units: state.units.filter((u) => u.id !== id),
        }));
      },

      updateUnit: (id, updatedUnit) => {
        set((state) => ({
          units: state.units.map((u) => (u.id === id ? { ...u, ...updatedUnit } : u)),
        }));
      },

      getUnitByCode: (code) => {
        return get().units.find((u) => u.code === code);
      },

      getTodayClasses: () => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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
    },
  ),
);
