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
                set((state) => ({
                    deadlines: [...state.deadlines, deadline]
                }));
            },

            removeDeadline: (id) => {
                set((state) => ({
                    deadlines: state.deadlines.filter((d) => d.id !== id),
                }));
            },

            updateDeadline: (id, updatedDeadline) => {
                set((state) => ({
                    deadlines: state.deadlines.map((d) =>
                        d.id === id ? { ...d, ...updatedDeadline } : d
                    ),
                }));
            },

            toggleComplete: (id) => {
                set((state) => ({
                    deadlines: state.deadlines.map((d) =>
                        d.id === id ? { ...d, completed: !d.completed } : d
                    ),
                }));
            },

            getUpcoming: (limit = 5) => {
                const now = new Date();
                return get()
                    .deadlines
                    .filter((d) => !d.completed && new Date(d.dueDate) > now)
                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .slice(0, limit);
            },

            getStressLevel: (): StressLevel => {
                const upcoming = get().getUpcoming(10);
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);

                const urgentCount = upcoming.filter(
                    (d) => new Date(d.dueDate) <= nextWeek
                ).length;

                if (urgentCount >= 4) return 'High';
                if (urgentCount >= 2) return 'Busy';
                return 'Low';
            },
        }),
        {
            name: 'deadlines-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);