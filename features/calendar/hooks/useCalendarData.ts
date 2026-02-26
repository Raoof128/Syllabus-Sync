import { useEffect, useCallback, useRef } from 'react';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useEventsStore } from '@/lib/store/eventsStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useTodosStore } from '@/lib/store/todosStore';
import { useHydration } from '@/lib/hooks';
import { createBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export function useCalendarData() {
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const forceRefreshDeadlines = useDeadlinesStore((state) => state.forceRefresh);
  const removeDeadline = useDeadlinesStore((state) => state.removeDeadline);
  const removeDeadlinesByUnit = useDeadlinesStore((state) => state.removeDeadlinesByUnit);

  const userEvents = useEventsStore((state) => state.events);
  const forceRefreshEvents = useEventsStore((state) => state.forceRefresh);
  const removeEvent = useEventsStore((state) => state.removeEvent);

  const units = useUnitsStore((state) => state.units);
  const forceRefreshUnits = useUnitsStore((state) => state.forceRefresh);
  const removeUnit = useUnitsStore((state) => state.removeUnit);

  const todos = useTodosStore((state) => state.todos);
  const forceRefreshTodos = useTodosStore((state) => state.forceRefresh);
  const addTodo = useTodosStore((state) => state.addTodo);
  const removeTodo = useTodosStore((state) => state.removeTodo);
  const updateTodo = useTodosStore((state) => state.updateTodo);

  const hasHydrated = useHydration();
  const initialLoadDone = useRef(false);

  // Load all data from database on mount - use forceRefresh for fresh data
  useEffect(() => {
    if (hasHydrated && !initialLoadDone.current) {
      initialLoadDone.current = true;
      forceRefreshUnits();
      forceRefreshDeadlines();
      forceRefreshEvents();
      forceRefreshTodos();
    }
  }, [hasHydrated, forceRefreshUnits, forceRefreshDeadlines, forceRefreshEvents, forceRefreshTodos]);

  // Listen for auth state changes and refresh data on sign-in
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_IN') {
        // Force refresh all data after sign-in
        forceRefreshUnits();
        forceRefreshDeadlines();
        forceRefreshEvents();
        forceRefreshTodos();
      }
    });

    return () => subscription.unsubscribe();
  }, [forceRefreshUnits, forceRefreshDeadlines, forceRefreshEvents, forceRefreshTodos]);

  // Listen for unit-deleted events to cascade delete deadlines
  const handleUnitDeleted = useCallback(
    (event: Event) => {
      const customEvent = event as CustomEvent<{
        unitId: string;
        unitCode: string;
      }>;
      const { unitId, unitCode } = customEvent.detail;
      removeDeadlinesByUnit(unitId, unitCode);
    },
    [removeDeadlinesByUnit],
  );

  useEffect(() => {
    window.addEventListener('unit-deleted', handleUnitDeleted);
    return () => {
      window.removeEventListener('unit-deleted', handleUnitDeleted);
    };
  }, [handleUnitDeleted]);

  return {
    deadlines,
    userEvents,
    units,
    todos,
    hasHydrated,
    removeDeadline,
    removeDeadlinesByUnit,
    removeEvent,
    removeUnit,
    addTodo,
    removeTodo,
    updateTodo,
  };
}
