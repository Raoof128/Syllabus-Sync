/**
 * Public Events Store
 *
 * Zustand store for managing university-wide public events.
 * These events are visible to all users and can be added to personal calendar.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  PublicEvent,
  PublicEventFromDB,
  transformPublicEvent,
} from "@/lib/types/publicEvents";
import { useEventsStore } from "@/lib/store/eventsStore";

interface PublicEventsState {
  // Data
  events: PublicEvent[];
  featuredEvents: PublicEvent[];

  // Loading states
  isLoading: boolean;
  isAddingToCalendar: Set<string>;
  addedToCalendar: Set<string>;

  // Error handling
  error: string | null;

  // Actions
  fetchPublicEvents: () => Promise<void>;
  addToCalendar: (
    eventId: string,
  ) => Promise<{
    success: boolean;
    userEventId?: string;
    alreadyAdded?: boolean;
  }>;
  checkUserEvents: () => Promise<void>;
  reset: () => void;
}

export const usePublicEventsStore = create<PublicEventsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      events: [],
      featuredEvents: [],
      isLoading: false,
      isAddingToCalendar: new Set(),
      addedToCalendar: new Set(),
      error: null,

      // Fetch all public events
      fetchPublicEvents: async () => {
        set({ isLoading: true, error: null });

        try {
          const supabase = createBrowserClient();

          const { data, error } = await supabase
            .from("public_events")
            .select("*")
            .is("deleted_at", null)
            .gte("start_at", new Date().toISOString())
            .order("priority", { ascending: false })
            .order("start_at", { ascending: true });

          if (error) {
            set({
              isLoading: false,
              error: error.message || "Failed to load events",
            });
            return;
          }

          const events = (data as PublicEventFromDB[]).map(
            transformPublicEvent,
          );
          const featuredEvents = events.filter((e) => e.isFeatured);

          set({
            events,
            featuredEvents,
            isLoading: false,
          });

          // Check which events user has already added
          await get().checkUserEvents();
        } catch (error) {
          console.error("Failed to fetch public events:", error);
          set({
            isLoading: false,
            error:
              error instanceof Error ? error.message : "Failed to load events",
          });
        }
      },

      // Check which public events are already in user's calendar
      checkUserEvents: async () => {
        try {
          const supabase = createBrowserClient();

          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) return;

          const { data } = await supabase
            .from("events")
            .select("source_public_event_id")
            .eq("user_id", user.id)
            .not("source_public_event_id", "is", null)
            .is("deleted_at", null);

          if (data) {
            const addedIds = new Set<string>(
              data
                .map(
                  (e: { source_public_event_id: string | null }) =>
                    e.source_public_event_id,
                )
                .filter((id: string | null): id is string => id !== null),
            );
            set({ addedToCalendar: addedIds });
          }
        } catch (error) {
          console.error("Failed to check user events:", error);
        }
      },

      // Add a public event to user's personal calendar
      addToCalendar: async (eventId: string) => {
        const { isAddingToCalendar, addedToCalendar } = get();

        // Already added
        if (addedToCalendar.has(eventId)) {
          return { success: true, alreadyAdded: true };
        }

        // Already processing
        if (isAddingToCalendar.has(eventId)) {
          return { success: false };
        }

        // Mark as loading
        set({
          isAddingToCalendar: new Set(isAddingToCalendar).add(eventId),
        });

        try {
          const supabase = createBrowserClient();

          // Call the database function to copy the event
          const { data, error } = await supabase.rpc(
            "add_public_event_to_calendar",
            {
              p_public_event_id: eventId,
            },
          );

          if (error) {
            console.error("Failed to add event to calendar:", error);
            const newLoading = new Set(get().isAddingToCalendar);
            newLoading.delete(eventId);
            set({ isAddingToCalendar: newLoading });
            return { success: false };
          }

          // Mark as added
          const newAdded = new Set(get().addedToCalendar);
          newAdded.add(eventId);

          // Remove from loading
          const newLoading = new Set(get().isAddingToCalendar);
          newLoading.delete(eventId);

          set({
            addedToCalendar: newAdded,
            isAddingToCalendar: newLoading,
          });

          // Refresh the events store so calendar widget updates immediately
          // Reset hasLoaded to force a fresh fetch from the database
          useEventsStore.getState().reset();
          useEventsStore.getState().loadEvents();

          return { success: true, userEventId: data as string };
        } catch (error) {
          console.error("Failed to add event to calendar:", error);

          // Remove from loading
          const newLoading = new Set(get().isAddingToCalendar);
          newLoading.delete(eventId);
          set({ isAddingToCalendar: newLoading });

          return { success: false };
        }
      },

      // Reset store
      reset: () => {
        set({
          events: [],
          featuredEvents: [],
          isLoading: false,
          isAddingToCalendar: new Set(),
          addedToCalendar: new Set(),
          error: null,
        });
      },
    }),
    { name: "public-events-store" },
  ),
);
