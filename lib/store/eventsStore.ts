// lib/store/eventsStore.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Event } from '@/lib/types';

interface EventsState {
  events: Event[];
  addEvent: (event: Event) => void;
  updateEvent: (id: string, event: Partial<Event>) => void;
  removeEvent: (id: string) => void;
  getEventsByDate: (date: Date) => Event[];
  getUpcomingEvents: (days?: number) => Event[];
}

export const useEventsStore = create<EventsState>()(
  persist(
    (set, get) => ({
      events: [],

      addEvent: (event) => {
        set((state) => ({
          events: [...state.events, event],
        }));
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        }));
      },

      removeEvent: (id) => {
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
        }));
      },

      getEventsByDate: (date) => {
        const { events } = get();
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        return events.filter((event) => {
          const eventDate = new Date(event.startAt);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate.getTime() === targetDate.getTime();
        });
      },

      getUpcomingEvents: (days = 7) => {
        const { events } = get();
        const now = new Date();
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        return events
          .filter((event) => {
            const eventDate = new Date(event.startAt);
            return eventDate >= now && eventDate <= futureDate;
          })
          .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
      },
    }),
    {
      name: 'events-storage',
      partialize: (state) => ({ events: state.events }),
    },
  ),
);
