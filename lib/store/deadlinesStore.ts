// lib/store/deadlinesStore.ts
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Deadline, StressLevel } from '@/lib/types';

interface DeadlinesState {
  deadlines: Deadline[];
  addDeadline: (deadline: Deadline) => void;
  removeDeadline: (id: string) => void;
  updateDeadline: (id: string, deadline: Partial<Deadline>) => void;
  toggleComplete: (id: string) => void;
  getUpcoming: (limit?: number) => Deadline[];
  getStressLevel: () => StressLevel;
}

export const useDeadlinesStore = create<DeadlinesState>()(
  persist(
    (set, get) => ({
      deadlines: [],

      addDeadline: (deadline) => {
        set((state) => {
          if (state.deadlines.some((existing) => existing.id === deadline.id)) {
            return state;
          }
          return { deadlines: [...state.deadlines, deadline] };
        });
      },

      removeDeadline: (id) => {
        set((state) => ({
          deadlines: state.deadlines.filter((d) => d.id !== id),
        }));
      },

      updateDeadline: (id, updatedDeadline) => {
        set((state) => ({
          deadlines: state.deadlines.map((d) => (d.id === id ? { ...d, ...updatedDeadline } : d)),
        }));
      },

      toggleComplete: (id) => {
        set((state) => ({
          deadlines: state.deadlines.map((d) =>
            d.id === id ? { ...d, completed: !d.completed } : d,
          ),
        }));
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
      onRehydrateStorage: () => (state) => {
        if (!state?.deadlines?.length) return;
        const seen = new Set<string>();
        const deduped = state.deadlines.filter((deadline) => {
          if (seen.has(deadline.id)) return false;
          seen.add(deadline.id);
          return true;
        });
        if (deduped.length !== state.deadlines.length) {
          state.deadlines = deduped;
        }
      },
    },
  ),
);
