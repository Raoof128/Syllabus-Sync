import { useEffect, useCallback } from 'react';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useEventsStore } from '@/lib/store/eventsStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useTodosStore } from '@/lib/store/todosStore';
import { useHydration } from '@/lib/hooks';

export function useCalendarData() {
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const loadDeadlines = useDeadlinesStore((state) => state.loadDeadlines);
  const removeDeadline = useDeadlinesStore((state) => state.removeDeadline);
  const removeDeadlinesByUnit = useDeadlinesStore((state) => state.removeDeadlinesByUnit);

  const userEvents = useEventsStore((state) => state.events);
  const loadEvents = useEventsStore((state) => state.loadEvents);
  const removeEvent = useEventsStore((state) => state.removeEvent);

  const units = useUnitsStore((state) => state.units);
  const loadUnits = useUnitsStore((state) => state.loadUnits);
  const removeUnit = useUnitsStore((state) => state.removeUnit);

  const todos = useTodosStore((state) => state.todos);
  const loadTodos = useTodosStore((state) => state.loadTodos);
  const addTodo = useTodosStore((state) => state.addTodo);
  const removeTodo = useTodosStore((state) => state.removeTodo);
  const updateTodo = useTodosStore((state) => state.updateTodo);

  const hasHydrated = useHydration();

  // Load all data from database on mount
  useEffect(() => {
    if (hasHydrated) {
      loadUnits();
      loadDeadlines();
      loadEvents();
      loadTodos();
    }
  }, [hasHydrated, loadUnits, loadDeadlines, loadEvents, loadTodos]);

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
