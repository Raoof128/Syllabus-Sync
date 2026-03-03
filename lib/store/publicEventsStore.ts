/**
 * Public Events Store
 *
 * Zustand store for managing university-wide public events.
 * These events are visible to all users and can be added to personal calendar.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createBrowserClient } from '@/lib/supabase/client';
import { PublicEvent, PublicEventFromDB, transformPublicEvent } from '@/lib/types/publicEvents';
import { useEventsStore } from '@/lib/store/eventsStore';

// ============================================================================
// FALLBACK SAMPLE EVENTS (used when DB has no events or is unavailable)
// These are the same 16 events seeded in the database migration.
// They serve as a fallback only - actual data comes from the database.
// ============================================================================
const createSampleEvents = (): PublicEvent[] => {
  const now = new Date();
  // Note: These dates match the database seed in 20260303000000_seed_16_public_events.sql
  // Using fixed March 2026 dates to ensure exactly 4 events per category
  return [
    // Academic (4 events)
    { id: 'aaaaaaaa-0001-4000-8000-000000000001', title: 'Research Skills Workshop', description: 'Learn essential research methodology and academic writing skills. Perfect for thesis students and researchers.', startAt: new Date('2026-03-05T10:00:00+11:00'), endAt: new Date('2026-03-05T12:00:00+11:00'), allDay: false, location: 'Library Level 3, Room 301', building: 'LIB', room: '301', category: 'Academic', isFeatured: false, priority: 50, createdAt: now },
    { id: 'aaaaaaaa-0001-4000-8000-000000000002', title: 'AI & Ethics Public Lecture', description: 'Guest speaker Prof. Sarah Chen discusses ethical implications of generative AI in education.', startAt: new Date('2026-03-04T14:00:00+11:00'), endAt: new Date('2026-03-04T16:00:00+11:00'), allDay: false, location: '4 Eastern Road Auditorium', building: '4ER', category: 'Academic', isFeatured: true, priority: 70, createdAt: now },
    { id: 'aaaaaaaa-0001-4000-8000-000000000003', title: 'Study Jam: Midterm Prep', description: 'Collaborative study session with peer tutors. Bring your notes and questions!', startAt: new Date('2026-03-12T10:00:00+11:00'), endAt: new Date('2026-03-12T14:00:00+11:00'), allDay: false, location: 'Library Level 2 Study Hub', building: 'LIB', room: '201', category: 'Academic', isFeatured: false, priority: 45, createdAt: now },
    { id: 'aaaaaaaa-0001-4000-8000-000000000004', title: 'Data Science Bootcamp', description: 'Hands-on intro to Python data analysis. Laptops provided. No prior experience needed.', startAt: new Date('2026-03-18T09:00:00+11:00'), endAt: new Date('2026-03-18T17:00:00+11:00'), allDay: false, location: '9 Wally\'s Walk Lab', building: '9WW', room: '120', category: 'Academic', isFeatured: false, priority: 55, createdAt: now },
    // Free Food (4 events)
    { id: 'aaaaaaaa-0002-4000-8000-000000000001', title: 'Free Pizza Friday', description: 'Join us for free pizza! Hosted by the Student Association. All students welcome.', startAt: new Date('2026-03-06T12:30:00+11:00'), endAt: new Date('2026-03-06T14:00:00+11:00'), allDay: false, location: 'Wally\'s Walk Courtyard', building: 'WALLYS', category: 'Free Food', isFeatured: false, priority: 60, createdAt: now },
    { id: 'aaaaaaaa-0002-4000-8000-000000000002', title: 'Pancake Breakfast', description: 'Free pancakes, fruit, and coffee to kickstart your week! Vegan and GF options available.', startAt: new Date('2026-03-09T07:30:00+11:00'), endAt: new Date('2026-03-09T09:30:00+11:00'), allDay: false, location: 'Central Courtyard', building: 'LIB', category: 'Free Food', isFeatured: false, priority: 50, createdAt: now },
    { id: 'aaaaaaaa-0002-4000-8000-000000000003', title: 'Sushi & Smoothie Giveaway', description: 'Free sushi rolls and smoothies while stocks last. Grab lunch on us!', startAt: new Date('2026-03-13T12:00:00+11:00'), endAt: new Date('2026-03-13T13:30:00+11:00'), allDay: false, location: 'UniBar Courtyard', building: 'UBAR', category: 'Free Food', isFeatured: false, priority: 55, createdAt: now },
    { id: 'aaaaaaaa-0002-4000-8000-000000000004', title: 'BBQ on the Lawn', description: 'Classic Aussie BBQ with snags, burgers, and veggie options. Sponsored by MQ Sport.', startAt: new Date('2026-03-20T11:30:00+11:00'), endAt: new Date('2026-03-20T14:00:00+11:00'), allDay: false, location: 'Sports Fields', building: 'FIELDS', category: 'Free Food', isFeatured: true, priority: 65, createdAt: now },
    // Career (4 events)
    { id: 'aaaaaaaa-0003-4000-8000-000000000001', title: 'Tech Industry Career Fair', description: 'Meet recruiters from Google, Microsoft, Atlassian, and more. Bring your resume!', startAt: new Date('2026-03-07T09:00:00+11:00'), endAt: new Date('2026-03-07T16:00:00+11:00'), allDay: false, location: 'Macquarie Theatre', building: 'MQTH', category: 'Career', isFeatured: true, priority: 80, createdAt: now },
    { id: 'aaaaaaaa-0003-4000-8000-000000000002', title: 'Graduate Employer Mixer', description: 'Casual networking with hiring managers from top graduate programs. Refreshments provided.', startAt: new Date('2026-03-11T17:00:00+11:00'), endAt: new Date('2026-03-11T19:30:00+11:00'), allDay: false, location: 'Campus Hub Foyer', building: '18WW', category: 'Career', isFeatured: false, priority: 55, createdAt: now },
    { id: 'aaaaaaaa-0003-4000-8000-000000000003', title: 'Resume & LinkedIn Workshop', description: 'Professional career advisors help you polish your resume and LinkedIn profile.', startAt: new Date('2026-03-14T13:00:00+11:00'), endAt: new Date('2026-03-14T15:00:00+11:00'), allDay: false, location: 'Digital Learning Centre', building: 'DLC', category: 'Career', isFeatured: false, priority: 50, createdAt: now },
    { id: 'aaaaaaaa-0003-4000-8000-000000000004', title: 'Startup Pitch Night', description: 'Watch student startups pitch to a panel of investors. Networking drinks afterwards.', startAt: new Date('2026-03-19T18:00:00+11:00'), endAt: new Date('2026-03-19T21:00:00+11:00'), allDay: false, location: 'Incubator Hub', building: 'INCUB', category: 'Career', isFeatured: false, priority: 60, createdAt: now },
    // Social (4 events)
    { id: 'aaaaaaaa-0004-4000-8000-000000000001', title: 'International Student Mixer', description: 'Meet fellow international students! Games, music, and free refreshments.', startAt: new Date('2026-03-08T17:00:00+11:00'), endAt: new Date('2026-03-08T20:00:00+11:00'), allDay: false, location: 'UniBar', building: 'UBAR', category: 'Social', isFeatured: false, priority: 55, createdAt: now },
    { id: 'aaaaaaaa-0004-4000-8000-000000000002', title: 'Trivia Night', description: 'Test your knowledge in teams of 4–6. Prizes for top 3! Drinks at bar prices.', startAt: new Date('2026-03-12T18:30:00+11:00'), endAt: new Date('2026-03-12T21:00:00+11:00'), allDay: false, location: 'UniBar', building: 'UBAR', category: 'Social', isFeatured: false, priority: 50, createdAt: now },
    { id: 'aaaaaaaa-0004-4000-8000-000000000003', title: 'Outdoor Movie Night', description: 'Screening of Interstellar on the big screen. BYO blankets and snacks!', startAt: new Date('2026-03-15T19:00:00+11:00'), endAt: new Date('2026-03-15T22:00:00+11:00'), allDay: false, location: 'Sports Fields', building: 'FIELDS', category: 'Social', isFeatured: true, priority: 70, createdAt: now },
    { id: 'aaaaaaaa-0004-4000-8000-000000000004', title: 'Cultural Festival', description: 'Celebrating diversity with food stalls, performances, and art from 30+ cultures.', startAt: new Date('2026-03-21T10:00:00+11:00'), endAt: new Date('2026-03-21T18:00:00+11:00'), allDay: true, location: 'Central Courtyard', building: 'LIB', category: 'Social', isFeatured: true, priority: 75, createdAt: now },
  ];
};

// Generate sample events - called lazily when needed
const SAMPLE_PUBLIC_EVENTS = createSampleEvents();

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
  addToCalendar: (eventId: string) => Promise<{
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
      // Fetch all public events (only future events - overdue events are hidden from Feed)
      fetchPublicEvents: async () => {
        set({ isLoading: true, error: null });

        try {
          const supabase = createBrowserClient();

          // Only fetch future events - overdue events should not appear in Feed
          const now = new Date();

          const { data, error } = await supabase
            .from('public_events')
            .select('*')
            .is('deleted_at', null)
            .gte('start_at', now.toISOString())
            .order('priority', { ascending: false })
            .order('start_at', { ascending: true });

          if (error) {
            // DB error — use fallback sample events (only future events)
            const now = new Date();
            const fallback = SAMPLE_PUBLIC_EVENTS.filter((e) => e.startAt >= now);
            set({
              events: fallback,
              featuredEvents: fallback.filter((e) => e.isFeatured),
              isLoading: false,
              error: null,
            });
            return;
          }

          let events = (data as PublicEventFromDB[]).map(transformPublicEvent);

          // If DB returned no events, use fallback sample events (only future)
          if (events.length === 0) {
            const now = new Date();
            events = SAMPLE_PUBLIC_EVENTS.filter((e) => e.startAt >= now);
          }

          // Featured events from the future events
          const featuredEvents = events.filter((e) => e.isFeatured);

          set({
            events,
            featuredEvents,
            isLoading: false,
          });

          // Check which events user has already added
          await get().checkUserEvents();
        } catch (_error) {
          // Network/other error — use fallback sample events (only future)
          const now = new Date();
          const fallback = SAMPLE_PUBLIC_EVENTS.filter((e) => e.startAt >= now);
          set({
            events: fallback,
            featuredEvents: fallback.filter((e) => e.isFeatured),
            isLoading: false,
            error: null,
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
            .from('events')
            .select('source_public_event_id')
            .eq('user_id', user.id)
            .not('source_public_event_id', 'is', null)
            .is('deleted_at', null);

          if (data) {
            const addedIds = new Set<string>(
              data
                .map((e: { source_public_event_id: string | null }) => e.source_public_event_id)
                .filter((id: string | null): id is string => id !== null),
            );
            set({ addedToCalendar: addedIds });
          }
        } catch (error) {
          console.error('Failed to check user events:', error);
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
          const { data, error } = await supabase.rpc('add_public_event_to_calendar', {
            p_public_event_id: eventId,
          });

          if (error) {
            console.error('Failed to add event to calendar:', error);
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
          console.error('Failed to add event to calendar:', error);

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
    { name: 'public-events-store' },
  ),
);
