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
    featuredEvents,
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

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let result = [...events];

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

  // Category counts - exclude featured events to match what's shown in the grid
  const categoryCounts = useMemo(() => {
    const featuredIds = new Set(featuredEvents.map((e) => e.id));
    const nonFeatured = events.filter((e) => !featuredIds.has(e.id));
    const counts: Record<CategoryFilter, number> = {
      All: nonFeatured.length,
      Career: 0,
      Social: 0,
      Academic: 0,
      'Free Food': 0,
    };
    nonFeatured.forEach((e) => {
      if (e.category in counts) {
        counts[e.category as Exclude<CategoryFilter, 'All'>]++;
      }
    });
    return counts;
  }, [events, featuredEvents]);

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
