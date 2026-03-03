import { useState, useMemo, useCallback, useEffect } from 'react';
import { usePublicEventsStore } from '@/lib/store/publicEventsStore';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { toastUtils } from '@/lib/utils/toast';
import { CategoryFilter, TimeFilter, SortOption } from '../types';

export function usePublicFeed() {
  const { t } = useTypedTranslation();

  // Store
  const {
    events,
    featuredEvents: allFeaturedEvents,
    isLoading,
    isAddingToCalendar,
    addedToCalendar,
    error,
    fetchPublicEvents,
    addToCalendar,
  } = usePublicEventsStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date');

  // Fetch events on mount
  useEffect(() => {
    fetchPublicEvents();
  }, [fetchPublicEvents]);

  // Filter featured events based on category filter (but not search/time)
  // This allows the banner to show relevant featured events when filtering
  const featuredEvents = useMemo(() => {
    // Safety check - ensure allFeaturedEvents is a valid array with valid events
    const safeEvents = Array.isArray(allFeaturedEvents)
      ? allFeaturedEvents.filter(e => e && typeof e.category === 'string' && e.startAt)
      : [];

    if (categoryFilter === 'All') {
      return safeEvents;
    }
    return safeEvents.filter((e) => e.category === categoryFilter);
  }, [allFeaturedEvents, categoryFilter]);

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    // Safety check - ensure events is a valid array with valid events
    const safeEvents = Array.isArray(events)
      ? events.filter(e => e && typeof e.category === 'string' && e.startAt)
      : [];

    let result = [...safeEvents];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query) ||
          e.location.toLowerCase().includes(query) ||
          (e.building && e.building.toLowerCase().includes(query)),
      );
    }

    // Category filter
    if (categoryFilter !== 'All') {
      result = result.filter((e) => e.category === categoryFilter);
    }

    // Time filter
    const now = new Date();
    if (timeFilter === 'today') {
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      result = result.filter((e) => e.startAt <= endOfDay);
    } else if (timeFilter === 'week') {
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + 7);
      result = result.filter((e) => e.startAt <= endOfWeek);
    } else if (timeFilter === 'month') {
      const endOfMonth = new Date(now);
      endOfMonth.setMonth(now.getMonth() + 1);
      result = result.filter((e) => e.startAt <= endOfMonth);
    }

    // Sort
    if (sortOption === 'date') {
      result.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    } else if (sortOption === 'priority') {
      result.sort((a, b) => b.priority - a.priority);
    } else if (sortOption === 'category') {
      result.sort((a, b) => a.category.localeCompare(b.category));
    }

    return result;
  }, [events, searchQuery, categoryFilter, timeFilter, sortOption]);

  // Non-featured events for the grid
  const gridEvents = useMemo(() => {
    const featuredIds = new Set(featuredEvents.map((e) => e.id));
    return filteredEvents.filter((e) => !featuredIds.has(e.id));
  }, [filteredEvents, featuredEvents]);

  // All non-featured events (before filtering by category/search/time) for QuickStats
  const nonFeaturedEvents = useMemo(() => {
    const featuredIds = new Set(
      Array.isArray(allFeaturedEvents)
        ? allFeaturedEvents.filter(e => e && e.id).map(e => e.id)
        : []
    );
    return (Array.isArray(events)
      ? events.filter(e => e && typeof e.category === 'string' && e.startAt)
      : []
    ).filter(e => !featuredIds.has(e.id));
  }, [events, allFeaturedEvents]);

  // Category counts - count only non-featured events to match what's displayed in the grid
  // Featured events are shown in the carousel, not in the grid
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      All: nonFeaturedEvents.length,
      Career: 0,
      Social: 0,
      Academic: 0,
      'Free Food': 0,
    };
    nonFeaturedEvents.forEach((e) => {
      if (e.category in counts) {
        counts[e.category as Exclude<CategoryFilter, 'All'>]++;
      }
    });
    return counts;
  }, [nonFeaturedEvents]);

  // Handle add to calendar
  const handleAddToCalendar = useCallback(
    async (eventId: string) => {
      const result = await addToCalendar(eventId);

      if (result.success) {
        if (result.alreadyAdded) {
          toastUtils.info(t('alreadyAdded'), t('eventAlreadyInCalendar'));
        } else {
          toastUtils.success(t('addedToCalendar'), t('eventAddedSuccess'));
        }
      } else {
        toastUtils.error(t('error'), t('failedToAddEvent'));
      }
    },
    [addToCalendar, t],
  );

  return {
    events,
    featuredEvents,
    gridEvents,
    nonFeaturedEvents,
    isLoading,
    error,
    isAddingToCalendar,
    addedToCalendar,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    timeFilter,
    setTimeFilter,
    sortOption,
    setSortOption,
    categoryCounts,
    handleAddToCalendar,
    fetchPublicEvents,
  };
}
