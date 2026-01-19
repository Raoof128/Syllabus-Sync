// lib/store/eventsStore.ts
// Events store with Supabase API integration
// Follows the same pattern as unitsStore for consistency
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Event } from '@/lib/types';
import { errorHandler } from '@/lib/utils/errorHandling';
import { apiRequest } from '@/lib/utils/api';
import { v4 as uuidv4 } from 'uuid';

interface EventsState {
  events: Event[];
  isLoading: boolean;
  hasLoaded: boolean;
  loadEvents: () => Promise<void>;
  addEvent: (event: Omit<Event, 'id' | 'date' | 'time'> & { id?: string }) => Promise<Event | null>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<Event | null>;
  removeEvent: (id: string) => Promise<void>;
  getEventsByDate: (date: Date) => Event[];
  getUpcomingEvents: (days?: number) => Event[];
}

// Normalize event dates from API response
const normalizeEvent = (event: Event): Event => ({
  ...event,
  startAt: event.startAt instanceof Date ? event.startAt : new Date(event.startAt),
  endAt: event.endAt
    ? event.endAt instanceof Date
      ? event.endAt
      : new Date(event.endAt)
    : undefined,
  date: event.startAt instanceof Date ? event.startAt : new Date(event.startAt),
  time: event.allDay
    ? ''
    : new Date(event.startAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
});

export const useEventsStore = create<EventsState>()(
  persist(
    (set, get) => ({
      events: [],
      isLoading: false,
      hasLoaded: false,

      loadEvents: async () => {
        if (get().hasLoaded) return;
        set({ isLoading: true });
        try {
          const data = await apiRequest<Event[]>('/api/events', { noRetry: true });
          set({ events: data.map(normalizeEvent), hasLoaded: true });
        } catch (error) {
          // Silently fail - keep persisted data if API is unavailable
          // This allows the app to work with local data until database is set up
          console.warn('Failed to load events from API, using persisted data:', error);
          set({ hasLoaded: true }); // Mark as loaded to prevent retry
        } finally {
          set({ isLoading: false });
        }
      },

      addEvent: async (eventInput) => {
        // Create full event with computed fields
        const event: Event = {
          ...eventInput,
          id:
            eventInput.id &&
            eventInput.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
              ? eventInput.id
              : uuidv4(),
          date: eventInput.startAt,
          time: eventInput.allDay
            ? ''
            : eventInput.startAt.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              }),
        };

        const normalized = normalizeEvent(event);

        // Optimistic update
        set((state) => {
          if (state.events.some((existing) => existing.id === normalized.id)) {
            return state;
          }
          return { events: [...state.events, normalized] };
        });

        try {
          const created = await apiRequest<Event>('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: normalized.id,
              title: normalized.title,
              description: normalized.description,
              location: normalized.location,
              building: normalized.building,
              category: normalized.category,
              imageUrl: normalized.imageUrl,
              startAt: normalized.startAt.toISOString(),
              endAt: normalized.endAt?.toISOString(),
              allDay: normalized.allDay,
            }),
          });
          const serverNormalized = normalizeEvent(created);
          // Update with server response
          set((state) => ({
            events: state.events.map((e) => (e.id === normalized.id ? serverNormalized : e)),
          }));
          return serverNormalized;
        } catch (error) {
          // Silently handle API errors - stores work with local data
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('authentication') && !errorMessage.includes('unauthorized')) {
            errorHandler.logError(
              error instanceof Error ? error : new Error('Failed to add event'),
              'EventsStore.addEvent',
              'medium',
            );
          }
          return normalized; // Return the local version on error
        }
      },

      updateEvent: async (id, updates) => {
        const currentEvent = get().events.find((e) => e.id === id);
        if (!currentEvent) return null;

        const optimisticUpdate = normalizeEvent({ ...currentEvent, ...updates });
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? optimisticUpdate : e)),
        }));

        try {
          const updatePayload: Record<string, unknown> = {};
          if (updates.title !== undefined) updatePayload.title = updates.title;
          if (updates.description !== undefined) updatePayload.description = updates.description;
          if (updates.location !== undefined) updatePayload.location = updates.location;
          if (updates.building !== undefined) updatePayload.building = updates.building;
          if (updates.category !== undefined) updatePayload.category = updates.category;
          if (updates.imageUrl !== undefined) updatePayload.imageUrl = updates.imageUrl;
          if (updates.startAt !== undefined)
            updatePayload.startAt =
              updates.startAt instanceof Date ? updates.startAt.toISOString() : updates.startAt;
          if (updates.endAt !== undefined)
            updatePayload.endAt =
              updates.endAt instanceof Date ? updates.endAt.toISOString() : updates.endAt;
          if (updates.allDay !== undefined) updatePayload.allDay = updates.allDay;

          const updated = await apiRequest<Event>(`/api/events/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload),
          });
          const serverNormalized = normalizeEvent(updated);
          set((state) => ({
            events: state.events.map((e) => (e.id === id ? serverNormalized : e)),
          }));
          return serverNormalized;
        } catch (error) {
          // Revert to original state on error
          set((state) => ({
            events: state.events.map((e) => (e.id === id ? currentEvent : e)),
          }));
          errorHandler.logError(
            error instanceof Error ? error : new Error(`Failed to update event ${id}`),
            'EventsStore.updateEvent',
            'high',
          );
          return null;
        }
      },

      removeEvent: async (id) => {
        const eventToRestore = get().events.find((e) => e.id === id);

        // Optimistic delete
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
        }));

        try {
          await apiRequest<{ id: string }>(`/api/events/${id}`, { method: 'DELETE' });
        } catch (error) {
          // On error, restore the event to local state
          if (eventToRestore) {
            set((state) => ({ events: [...state.events, eventToRestore] }));
          }
          errorHandler.logError(
            error instanceof Error ? error : new Error(`Failed to remove event ${id}`),
            'EventsStore.removeEvent',
            'high',
          );
        }
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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ events: state.events }),
    },
  ),
);
