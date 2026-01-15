import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Deadline, StressLevel } from '@/lib/types';
import { apiRequest } from '@/lib/utils/api';
import { errorHandler } from '@/lib/utils/errorHandling';

interface DeadlinesState {
  deadlines: Deadline[];
  isLoading: boolean;
  hasLoaded: boolean;
  loadDeadlines: () => Promise<void>;
  addDeadline: (deadline: Deadline) => Promise<Deadline | null>;
  removeDeadline: (id: string) => Promise<void>;
  updateDeadline: (id: string, deadline: Partial<Deadline>) => Promise<Deadline | null>;
  toggleComplete: (id: string) => Promise<void>;
  getUpcoming: (limit?: number) => Deadline[];
  getStressLevel: () => StressLevel;
}

const normalizeDeadline = (deadline: Deadline): Deadline => ({
  ...deadline,
  dueDate: deadline.dueDate instanceof Date ? deadline.dueDate : new Date(deadline.dueDate),
  createdAt: deadline.createdAt instanceof Date ? deadline.createdAt : new Date(deadline.createdAt),
});

// Helper to validate UUIDs
const isValidUUID = (id: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const useDeadlinesStore = create<DeadlinesState>()(
  persist(
    (set, get) => ({
      deadlines: [],
      isLoading: false,
      hasLoaded: false,

      loadDeadlines: async () => {
        if (get().hasLoaded) return;
        set({ isLoading: true });
        try {
          const data = await apiRequest<Deadline[]>('/api/deadlines', { noRetry: true });
          // Ensure loaded data has valid UUIDs (filter out bad ones from API if any)
          const validData = data.map(normalizeDeadline).filter((d) => {
            if (!isValidUUID(d.id)) {
              console.warn(`Filtered out invalid deadline ID from API: ${d.id}`);
              return false;
            }
            return true;
          });
          set({ deadlines: validData, hasLoaded: true });
        } catch (error) {
          // Silently fail - keep persisted data if API is unavailable
          console.warn('Failed to load deadlines from API, using persisted data:', error);
          set({ hasLoaded: true });
        } finally {
          set({ isLoading: false });
        }
      },

      addDeadline: async (deadline) => {
        // Ensure new ID is a UUID
        const id = deadline.id && isValidUUID(deadline.id) ? deadline.id : uuidv4();

        const deadlineWithId: Deadline = {
          ...deadline,
          id,
          createdAt: deadline.createdAt || new Date(),
        };

        const normalized = normalizeDeadline(deadlineWithId);
        set((state) => {
          if (state.deadlines.some((existing) => existing.id === normalized.id)) {
            return state;
          }
          return { deadlines: [...state.deadlines, normalized] };
        });

        try {
          const created = await apiRequest<Deadline>('/api/deadlines', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(normalized),
          });
          const serverNormalized = normalizeDeadline(created);
          set((state) => ({
            deadlines: state.deadlines.map((d) => (d.id === normalized.id ? serverNormalized : d)),
          }));
          return serverNormalized;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('authentication') && !errorMessage.includes('unauthorized')) {
            errorHandler.logError(
              error instanceof Error ? error : new Error('Failed to add deadline'),
              'DeadlinesStore.addDeadline',
              'medium',
            );
          }
          return normalized;
        }
      },

      removeDeadline: async (id) => {
        // Guard: If ID is invalid, just remove locally and stop
        if (!isValidUUID(id)) {
          console.warn(`Removing invalid ID locally only: ${id}`);
          set((state) => ({
            deadlines: state.deadlines.filter((d) => d.id !== id),
          }));
          return;
        }

        const deadlineToRemove = get().deadlines.find((d) => d.id === id);
        set((state) => ({
          deadlines: state.deadlines.filter((d) => d.id !== id),
        }));

        try {
          await apiRequest<{ id: string }>(`/api/deadlines/${id}`, { method: 'DELETE' });
        } catch (error) {
          if (deadlineToRemove) {
            set((state) => ({ deadlines: [...state.deadlines, deadlineToRemove] }));
          }
          errorHandler.logError(
            error instanceof Error ? error : new Error(`Failed to remove deadline ${id}`),
            'DeadlinesStore.removeDeadline',
            'high',
          );
        }
      },

      updateDeadline: async (id, updatedDeadline) => {
        const currentDeadline = get().deadlines.find((d) => d.id === id);
        if (!currentDeadline) return null;

        // If ID is not a UUID, treat as local-only (sample/legacy) and skip API calls.
        // This prevents console errors and keeps the UI functional (e.g. toggleComplete).
        if (!isValidUUID(id)) {
          console.warn(`Updating non-UUID deadline locally only: ${id}`);
          const localUpdate = { ...currentDeadline, ...updatedDeadline };
          set((state) => ({
            deadlines: state.deadlines.map((d) => (d.id === id ? localUpdate : d)),
          }));
          return localUpdate;
        }

        const optimisticUpdate = { ...currentDeadline, ...updatedDeadline };
        set((state) => ({
          deadlines: state.deadlines.map((d) => (d.id === id ? optimisticUpdate : d)),
        }));

        try {
          const updated = await apiRequest<Deadline>(`/api/deadlines/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedDeadline),
          });
          const normalized = normalizeDeadline(updated);
          set((state) => ({
            deadlines: state.deadlines.map((d) => (d.id === id ? normalized : d)),
          }));
          return normalized;
        } catch (error) {
          set((state) => ({
            deadlines: state.deadlines.map((d) => (d.id === id ? currentDeadline : d)),
          }));
          errorHandler.logError(
            error instanceof Error ? error : new Error(`Failed to update deadline ${id}`),
            'DeadlinesStore.updateDeadline',
            'high',
          );
          return null;
        }
      },

      toggleComplete: async (id) => {
        const existing = get().deadlines.find((deadline) => deadline.id === id);
        if (!existing) return;
        await get().updateDeadline(id, { completed: !existing.completed });
      },

      getUpcoming: (limit = 5) => {
        const now = new Date();
        return get()
          .deadlines.filter((d) => !d.completed && new Date(d.dueDate) > now)
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
          .slice(0, limit);
      },

      getStressLevel: (): StressLevel => {
        try {
          const upcoming = get().getUpcoming(20);
          const now = new Date();
          if (isNaN(now.getTime())) return 'Low';

          const priorityPoints: Record<Deadline['priority'], number> = {
            Urgent: 4,
            High: 3,
            Medium: 2,
            Low: 1,
          };

          const totalPoints = upcoming.reduce((sum, deadline) => {
            try {
              const dueDate = new Date(deadline.dueDate);
              if (isNaN(dueDate.getTime())) return sum;
              const daysUntil = Math.ceil(
                (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
              );
              const timeWeight =
                daysUntil <= 0
                  ? 2.0
                  : daysUntil <= 1
                    ? 1.5
                    : daysUntil <= 3
                      ? 1.25
                      : daysUntil <= 7
                        ? 1
                        : daysUntil <= 14
                          ? 0.75
                          : 0.5;
              return sum + (priorityPoints[deadline.priority] || 1) * timeWeight;
            } catch {
              return sum;
            }
          }, 0);

          if (totalPoints >= 12) return 'High';
          if (totalPoints >= 6) return 'Busy';
          return 'Low';
        } catch {
          return 'Low';
        }
      },
    }),
    {
      name: 'deadlines-storage',
      storage: createJSONStorage(() => localStorage),
      version: 4,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as { state: { deadlines: Partial<Deadline>[] } };
        if (version < 4) {
          if (state?.state?.deadlines && Array.isArray(state.state.deadlines)) {
            // Migration: Version 4 forces ALL IDs to be valid UUIDs
            state.state.deadlines = state.state.deadlines.map((deadline: Partial<Deadline>) => {
              // Legacy hardcoded map
              const idMap: Record<string, string> = {
                'deadline-comp2310-assignment-1': '550e8400-e29b-41d4-a716-446655440001',
                'deadline-math1001-quiz-1': '550e8400-e29b-41d4-a716-446655440002',
                'deadline-hist2002-essay-1': '550e8400-e29b-41d4-a716-446655440003',
              };

              let newId = deadline.id ?? '';

              if (newId && idMap[newId]) {
                // Known legacy ID -> Map to specific UUID
                newId = idMap[newId];
              } else if (!newId || !isValidUUID(newId)) {
                // Unknown legacy/invalid ID -> Generate random UUID
                newId = uuidv4();
              }

              return { ...deadline, id: newId };
            });
          }
        }
        return persistedState;
      },
    },
  ),
);
