// lib/store/deadlinesStore.ts
'use client';

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
      const data = await apiRequest<Deadline[]>('/api/deadlines');
      set({ deadlines: data.map(normalizeDeadline), hasLoaded: true });
    } catch (error) {
      // Silently fail - keep persisted data if API is unavailable
      // This allows the app to work with local data until database is set up
      console.warn('Failed to load deadlines from API, using persisted data:', error);
      set({ hasLoaded: true }); // Mark as loaded to prevent retry
    } finally {
      set({ isLoading: false });
    }
  },

  addDeadline: async (deadline) => {
    const deadlineWithId: Deadline = {
      ...deadline,
      id: deadline.id || `deadline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
      errorHandler.logError(
        error instanceof Error ? error : new Error('Failed to add deadline'),
        'DeadlinesStore.addDeadline',
        'high',
      );
      return normalized; // Return local version on error
    }
  },

  removeDeadline: async (id) => {
    // Remove from local state immediately
    const deadlineToRemove = get().deadlines.find(d => d.id === id);
    set((state) => ({
      deadlines: state.deadlines.filter((d) => d.id !== id),
    }));

    try {
      await apiRequest<{ id: string }>(`/api/deadlines/${id}`, { method: 'DELETE' });
    } catch (error) {
      // Restore the deadline to local state on error
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
    const currentDeadline = get().deadlines.find(d => d.id === id);
    if (!currentDeadline) return null;

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
      // Revert to original state on error
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
    const upcoming = get().getUpcoming(20);
    const now = new Date();
    const priorityPoints: Record<Deadline['priority'], number> = {
      Urgent: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };

    const totalPoints = upcoming.reduce((sum, deadline) => {
      const dueDate = new Date(deadline.dueDate);
      const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const timeWeight =
        daysUntil <= 1
          ? 1.5
          : daysUntil <= 3
            ? 1.25
            : daysUntil <= 7
              ? 1
              : daysUntil <= 14
                ? 0.75
                : 0.5;

      return sum + priorityPoints[deadline.priority] * timeWeight;
    }, 0);

    if (totalPoints >= 12) return 'High';
    if (totalPoints >= 6) return 'Busy';
    return 'Low';
  },
}),
{
  name: 'deadlines-storage',
  storage: createJSONStorage(() => localStorage),
  version: 1,
},
),
);
