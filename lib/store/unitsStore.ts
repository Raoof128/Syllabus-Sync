// lib/store/unitsStore.ts
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Unit, ClassTime } from '@/lib/types';
import { errorHandler } from '@/lib/utils/errorHandling';
import { apiRequest } from '@/lib/utils/api';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

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
  clearUnits: () => void;
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
          const data = await apiRequest<Unit[]>('/api/units', { noRetry: true });
          // Use database data directly - no sample data fallback for authenticated users
          // This ensures proper user isolation and data ownership
          set({ units: data.map(normalizeUnit), hasLoaded: true });
        } catch (error) {
          // Check if this is an auth error
          const isAuthError =
            error instanceof Error &&
            (error.message.includes('401') ||
              error.message.includes('authentication') ||
              error.message.includes('Unauthorized'));

          if (isAuthError) {
            // Auth failure: clear persisted data to prevent showing stale user data
            set({ units: [], hasLoaded: true });
          } else {
            // Non-auth error: keep persisted data but mark as loaded
            console.warn('Failed to load units from API, using persisted data:', error);
            set({ hasLoaded: true });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      addUnit: async (unit) => {
        // For testing compatibility, update state synchronously first
        const normalized = normalizeUnit({
          ...unit,
          id:
            unit.id &&
            unit.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
              ? unit.id
              : uuidv4(),
          createdAt: unit.createdAt || new Date(),
        });

        set((state) => {
          if (state.units.some((existing) => existing.id === normalized.id)) {
            return state;
          }
          return { units: [...state.units, normalized] };
        });

        try {
          const apiPayload: Partial<Unit> = { ...normalized };
          // API will set createdAt; remove to avoid date serialization issues
          delete apiPayload.createdAt;

          const created = await apiRequest<Unit>('/api/units', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apiPayload),
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
        // Store the unit before removing for potential rollback
        const unitToRestore = get().units.find((u) => u.id === id);

        // Remove from local state immediately
        set((state) => ({
          units: state.units.filter((u) => u.id !== id),
        }));

        try {
          await apiRequest<{ id: string }>(`/api/units/${id}`, { method: 'DELETE' });
        } catch (error) {
          // On error, restore the unit to local state
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
        const currentUnit = get().units.find((u) => u.id === id);
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

      clearUnits: () => {
        set({ units: [], hasLoaded: false, isLoading: false });
      },
    }),
    {
      name: 'units-storage',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2) {
          // Migration from version 1 to 2: Convert old non-UUID string IDs to UUIDs
          // This migration handles legacy data that used string IDs like 'unit-comp2310'
          const StateSchema = z.object({
            state: z
              .object({
                units: z
                  .array(
                    z.object({
                      id: z.string().optional(),
                      schedule: z.array(z.object({ id: z.string().optional() })).optional(),
                    }),
                  )
                  .optional(),
              })
              .optional(),
          });

          const parsed = StateSchema.safeParse(persistedState);
          if (!parsed.success) {
            // If persisted state doesn't match expected shape, skip migration to avoid runtime errors
            return persistedState;
          }

          // Helper to check if a string is already a valid UUID
          const isUUID = (str: string): boolean =>
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

          // Helper to generate a deterministic UUID from a string (for consistency across migrations)
          const generateUUID = (): string => {
            // Generate a random UUID v4 format
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
              const r = (Math.random() * 16) | 0;
              const v = c === 'x' ? r : (r & 0x3) | 0x8;
              return v.toString(16);
            });
          };

          const state = parsed.data;
          if (state?.state?.units && Array.isArray(state.state.units)) {
            // Create a mapping of old IDs to new UUIDs (generated once per migration run)
            const idMigrationMap = new Map<string, string>();

            state.state.units = state.state.units.map((unit) => {
              // Skip if already a valid UUID
              if (unit.id && !isUUID(unit.id)) {
                // Get or create a new UUID for this old ID
                if (!idMigrationMap.has(unit.id)) {
                  idMigrationMap.set(unit.id, generateUUID());
                }
                const updatedUnit = { ...unit, id: idMigrationMap.get(unit.id)! };

                // Also migrate schedule IDs if present
                if (updatedUnit.schedule && Array.isArray(updatedUnit.schedule)) {
                  updatedUnit.schedule = updatedUnit.schedule.map((schedule) => {
                    if (schedule.id && !isUUID(schedule.id)) {
                      if (!idMigrationMap.has(schedule.id)) {
                        idMigrationMap.set(schedule.id, generateUUID());
                      }
                      return { ...schedule, id: idMigrationMap.get(schedule.id)! };
                    }
                    return schedule;
                  });
                }
                return updatedUnit;
              }
              return unit;
            });

            return state;
          }
        }
        return persistedState;
      },
    },
  ),
);
