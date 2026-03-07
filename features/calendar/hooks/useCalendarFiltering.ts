import { useState, useMemo } from 'react';
import { CalendarFilters, ALL_MQ_PROGRAMS } from '@/features/calendar/components/FilterPanel';
import { Unit, Deadline, Event } from '@/lib/types';

export function useCalendarFiltering(units: Unit[], deadlines: Deadline[], events: Event[]) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<CalendarFilters>({
    showUnits: true,
    showDeadlines: true,
    showEvents: true,
    showCompleted: false,
    showMQKeyDates: true,
    mqPrograms: [...ALL_MQ_PROGRAMS],
  });

  const filteredUnits = useMemo(() => {
    return filters.showUnits ? units : [];
  }, [units, filters.showUnits]);

  const filteredDeadlines = useMemo(() => {
    if (!filters.showDeadlines) return [];
    if (!filters.showCompleted) return deadlines.filter((x) => !x.completed);
    return deadlines;
  }, [deadlines, filters.showDeadlines, filters.showCompleted]);

  const filteredEvents = useMemo(() => {
    return filters.showEvents ? events : [];
  }, [events, filters.showEvents]);

  const handleToggleFilters = () => setIsFiltersOpen(!isFiltersOpen);

  return {
    filters,
    setFilters,
    isFiltersOpen,
    setIsFiltersOpen,
    handleToggleFilters,
    filteredUnits,
    filteredDeadlines,
    filteredEvents,
  };
}
