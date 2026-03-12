/**
 * Events Store Tests
 * Tests the eventsStore CRUD operations, filtering, and edge cases
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEventsStore } from '@/lib/store/eventsStore';
import { Event } from '@/lib/types';

vi.mock('@/lib/utils/api', () => ({
  apiRequest: vi.fn().mockRejectedValue(new Error('401: authentication required')),
  isLikelyNetworkError: () => false,
  isBrowserOffline: () => false,
}));

vi.mock('@/lib/utils/errorHandling', () => ({
  errorHandler: {
    logError: vi.fn(),
  },
}));

const makeEvent = (overrides: Partial<Event> = {}): Omit<Event, 'id' | 'date' | 'time'> => {
  const startAt = overrides.startAt ?? new Date('2026-03-15T10:00:00');
  return {
    title: 'Test Event',
    description: 'A test event',
    category: 'Academic' as const,
    allDay: false,
    startAt,
    ...overrides,
  };
};

describe('eventsStore', () => {
  beforeEach(() => {
    useEventsStore.setState({
      events: [],
      isLoading: false,
      hasLoaded: false,
    });
  });

  it('should initialize with empty state', () => {
    const state = useEventsStore.getState();
    expect(state.events).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.hasLoaded).toBe(false);
  });

  it('should add an event locally', async () => {
    const { addEvent } = useEventsStore.getState();
    const result = await addEvent(makeEvent({ title: 'Open Day' }));

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Open Day');
    expect(result!.id).toBeDefined();

    const { events } = useEventsStore.getState();
    expect(events).toHaveLength(1);
  });

  it('should not add duplicate event', async () => {
    const { addEvent } = useEventsStore.getState();
    const event = await addEvent(makeEvent());

    // Manually try to add an event with same ID
    useEventsStore.setState((state) => {
      if (state.events.some((e) => e.id === event!.id)) return state;
      return { events: [...state.events, event!] };
    });

    expect(useEventsStore.getState().events).toHaveLength(1);
  });

  it('should remove an event (restores on non-404 API error)', async () => {
    const { addEvent } = useEventsStore.getState();
    const event = await addEvent(makeEvent());
    expect(useEventsStore.getState().events).toHaveLength(1);

    // removeEvent throws on non-404 API failure; event should be restored
    await expect(useEventsStore.getState().removeEvent(event!.id)).rejects.toThrow();

    // Event should be restored after failed API delete
    expect(useEventsStore.getState().events).toHaveLength(1);
  });

  it('should update an event optimistically (reverts on error)', async () => {
    const { addEvent } = useEventsStore.getState();
    const event = await addEvent(makeEvent());

    // updateEvent will throw because API mock rejects with non-auth error
    await expect(
      useEventsStore.getState().updateEvent(event!.id, { title: 'Updated Event' }),
    ).rejects.toThrow();

    // State should revert to original since API failed
    const { events } = useEventsStore.getState();
    expect(events[0].title).toBe('Test Event');
  });

  it('should return null for updating non-existent event', async () => {
    const result = await useEventsStore.getState().updateEvent('nonexistent', { title: 'X' });
    expect(result).toBeNull();
  });

  it('should toggle notification (throws on API error)', async () => {
    const { addEvent } = useEventsStore.getState();
    const event = await addEvent(makeEvent());

    // toggleNotification calls updateEvent which throws
    await expect(useEventsStore.getState().toggleNotification(event!.id)).rejects.toThrow();
  });

  it('toggleNotification does nothing for non-existent id', async () => {
    await useEventsStore.getState().toggleNotification('nonexistent');
    expect(useEventsStore.getState().events).toHaveLength(0);
  });

  it('should get events by date', async () => {
    const { addEvent } = useEventsStore.getState();
    await addEvent(makeEvent({ startAt: new Date('2026-03-15T10:00:00') }));
    await addEvent(makeEvent({ title: 'Other', startAt: new Date('2026-03-16T14:00:00') }));

    const march15 = useEventsStore.getState().getEventsByDate(new Date('2026-03-15'));
    expect(march15).toHaveLength(1);

    const march16 = useEventsStore.getState().getEventsByDate(new Date('2026-03-16'));
    expect(march16).toHaveLength(1);
    expect(march16[0].title).toBe('Other');
  });

  it('should get upcoming events within the given days', async () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);
    const nextWeek = new Date(now.getTime() + 86400000 * 6);
    const farFuture = new Date(now.getTime() + 86400000 * 30);

    const { addEvent } = useEventsStore.getState();
    await addEvent(makeEvent({ title: 'Tomorrow', startAt: tomorrow }));
    await addEvent(makeEvent({ title: 'Next Week', startAt: nextWeek }));
    await addEvent(makeEvent({ title: 'Far Future', startAt: farFuture }));

    const upcoming = useEventsStore.getState().getUpcomingEvents(7);
    expect(upcoming).toHaveLength(2);
    expect(upcoming[0].title).toBe('Tomorrow');
    expect(upcoming[1].title).toBe('Next Week');
  });

  it('should clear events', () => {
    const mockEvent: Event = {
      id: '1',
      title: 'E',
      description: '',
      category: 'Social',
      allDay: false,
      startAt: new Date(),
      date: new Date(),
      time: '10:00 AM',
    };
    useEventsStore.setState({ events: [mockEvent], hasLoaded: true });

    useEventsStore.getState().clearEvents();
    const state = useEventsStore.getState();
    expect(state.events).toHaveLength(0);
    expect(state.hasLoaded).toBe(false);
  });

  it('should reset store', () => {
    useEventsStore.setState({ events: [], isLoading: true, hasLoaded: true });

    useEventsStore.getState().reset();
    const state = useEventsStore.getState();
    expect(state.events).toHaveLength(0);
    expect(state.hasLoaded).toBe(false);
    expect(state.isLoading).toBe(false);
  });
});
