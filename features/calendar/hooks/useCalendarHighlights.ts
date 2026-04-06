import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Deadline, Event, Unit, Todo } from '@/lib/types';
import { useCalendarDialogs } from './useCalendarDialogs';
import type { CalendarView } from '@/lib/types';

export function useCalendarHighlights(
  units: Unit[],
  deadlines: Deadline[],
  events: Event[],
  todos: Todo[],
  hasHydrated: boolean,
  dialogs: ReturnType<typeof useCalendarDialogs>,
  setView?: (view: CalendarView) => void,
) {
  const {
    setSelectedUnit,
    setUnitDetailOpen,
    setSelectedExam,
    setExamDetailOpen,
    setSelectedAssignment,
    setAssignmentDetailOpen,
    setSelectedTodo,
    setTodoDetailOpen,
    setSelectedEvent,
    setEventDetailOpen,
  } = dialogs;

  const searchParams = useSearchParams();
  const unitsWidgetRef = useRef<HTMLDivElement>(null);
  const assignmentsWidgetRef = useRef<HTMLDivElement>(null);
  const deadlineRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Helper: isElementInViewport
  const isElementInViewport = useCallback((el: HTMLElement | null): boolean => {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }, []);

  // Helper: scrollIfNotVisible
  const scrollIfNotVisible = useCallback(
    (el: HTMLElement | null, block: ScrollLogicalPosition = 'center') => {
      if (el && !isElementInViewport(el)) {
        el.scrollIntoView({ behavior: 'smooth', block });
      }
    },
    [isElementInViewport],
  );

  // 1. Highlighted Unit
  const highlightedUnitId = useMemo(() => searchParams.get('highlightUnit'), [searchParams]);
  const highlightedUnit = useMemo(() => {
    if (!highlightedUnitId) return null;
    return units.find((unit) => unit.id === highlightedUnitId) ?? null;
  }, [highlightedUnitId, units]);

  const processedUnitHighlightRef = useRef<string | null>(null);

  useEffect(() => {
    if (highlightedUnitId && processedUnitHighlightRef.current !== highlightedUnitId) {
      processedUnitHighlightRef.current = null;
    }
  }, [highlightedUnitId]);

  useEffect(() => {
    if (!hasHydrated || !highlightedUnitId || !highlightedUnit) return;
    if (processedUnitHighlightRef.current === highlightedUnitId) return;

    processedUnitHighlightRef.current = highlightedUnitId;

    // Switch to week view so the user can see all the unit's classes across the week
    if (setView) {
      setView('week');
    }

    const timer = window.setTimeout(() => {
      setSelectedUnit(highlightedUnit);
      setUnitDetailOpen(true);
    }, 300);

    const clearTimer = window.setTimeout(() => {
      const url = new URL(window.location.href);
      if (url.searchParams.has('highlightUnit')) {
        url.searchParams.delete('highlightUnit');
        window.history.replaceState({}, '', url.toString());
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(clearTimer);
    };
  }, [
    highlightedUnitId,
    highlightedUnit,
    hasHydrated,
    setSelectedUnit,
    setUnitDetailOpen,
    setView,
  ]);

  // Scroll to units widget when highlighted unit exists
  useEffect(() => {
    if (!highlightedUnitId) return;
    const scrollTimer = window.setTimeout(() => {
      scrollIfNotVisible(unitsWidgetRef.current);
    }, 100);
    return () => clearTimeout(scrollTimer);
  }, [highlightedUnitId, scrollIfNotVisible]);

  // 2. Highlighted Deadline
  const highlightedDeadlineId = useMemo(
    () => searchParams.get('highlightDeadline'),
    [searchParams],
  );

  const processedDeadlineHighlightRef = useRef<string | null>(null);

  useEffect(() => {
    if (highlightedDeadlineId && processedDeadlineHighlightRef.current !== highlightedDeadlineId) {
      processedDeadlineHighlightRef.current = null;
    }
  }, [highlightedDeadlineId]);

  // Open the detail dialog (guarded by processedRef so it only fires once)
  useEffect(() => {
    if (!hasHydrated || !highlightedDeadlineId) return;
    if (processedDeadlineHighlightRef.current === highlightedDeadlineId) return;

    const highlightedDeadline = deadlines.find((d) => d.id === highlightedDeadlineId);

    processedDeadlineHighlightRef.current = highlightedDeadlineId;

    const timer = window.setTimeout(() => {
      if (highlightedDeadline) {
        if (highlightedDeadline.type === 'Exam' || highlightedDeadline.type === 'Quiz') {
          setSelectedExam(highlightedDeadline);
          setExamDetailOpen(true);
        } else {
          setSelectedAssignment(highlightedDeadline);
          setAssignmentDetailOpen(true);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [
    highlightedDeadlineId,
    deadlines,
    hasHydrated,
    setSelectedExam,
    setExamDetailOpen,
    setSelectedAssignment,
    setAssignmentDetailOpen,
  ]);

  // Clear URL param after 3s (separate effect — won't be canceled by data changes)
  useEffect(() => {
    if (!highlightedDeadlineId) return;
    const clearTimer = window.setTimeout(() => {
      const url = new URL(window.location.href);
      if (url.searchParams.has('highlightDeadline')) {
        url.searchParams.delete('highlightDeadline');
        window.history.replaceState({}, '', url.toString());
      }
    }, 3000);
    return () => clearTimeout(clearTimer);
  }, [highlightedDeadlineId]);

  // 3. Highlighted Todo
  const highlightedTodoId = useMemo(() => searchParams.get('highlightTodo'), [searchParams]);
  const processedTodoHighlightRef = useRef<string | null>(null);

  useEffect(() => {
    if (highlightedTodoId && processedTodoHighlightRef.current !== highlightedTodoId) {
      processedTodoHighlightRef.current = null;
    }
  }, [highlightedTodoId]);

  // Open the detail dialog (guarded by processedRef so it only fires once)
  useEffect(() => {
    if (!hasHydrated || !highlightedTodoId) return;
    if (processedTodoHighlightRef.current === highlightedTodoId) return;

    const highlightedTodo = todos.find((t) => t.id === highlightedTodoId);
    if (!highlightedTodo) return;

    processedTodoHighlightRef.current = highlightedTodoId;

    const timer = window.setTimeout(() => {
      setSelectedTodo(highlightedTodo);
      setTodoDetailOpen(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [highlightedTodoId, todos, hasHydrated, setSelectedTodo, setTodoDetailOpen]);

  // Clear URL param after 3s (separate effect — won't be canceled by data changes)
  useEffect(() => {
    if (!highlightedTodoId) return;
    const clearTimer = window.setTimeout(() => {
      const url = new URL(window.location.href);
      if (url.searchParams.has('highlightTodo')) {
        url.searchParams.delete('highlightTodo');
        window.history.replaceState({}, '', url.toString());
      }
    }, 3000);
    return () => clearTimeout(clearTimer);
  }, [highlightedTodoId]);

  // 4. Highlighted Event
  const highlightedEventId = useMemo(() => searchParams.get('highlightEvent'), [searchParams]);
  const processedEventHighlightRef = useRef<string | null>(null);

  // Reset the guard whenever the ID changes so a new deep-link always fires.
  useEffect(() => {
    if (highlightedEventId && processedEventHighlightRef.current !== highlightedEventId) {
      processedEventHighlightRef.current = null;
    }
  }, [highlightedEventId]);

  // Open the detail dialog only once per highlight ID — prevents re-opening on every
  // store refresh (which re-runs this effect because `events` is in the dep array).
  useEffect(() => {
    if (!hasHydrated || !highlightedEventId) return;
    if (processedEventHighlightRef.current === highlightedEventId) return;

    const highlightedEvent = events.find((e) => e.id === highlightedEventId);
    processedEventHighlightRef.current = highlightedEventId;

    const timer = window.setTimeout(() => {
      if (highlightedEvent) {
        setSelectedEvent(highlightedEvent);
        setEventDetailOpen(true);
      }
    }, 300);

    const clearTimer = window.setTimeout(() => {
      const url = new URL(window.location.href);
      if (url.searchParams.has('highlightEvent')) {
        url.searchParams.delete('highlightEvent');
        window.history.replaceState({}, '', url.toString());
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(clearTimer);
    };
  }, [highlightedEventId, events, hasHydrated, setSelectedEvent, setEventDetailOpen]);

  // 5. Highlighted Widget
  const highlightedWidget = useMemo(() => searchParams.get('highlightWidget'), [searchParams]);
  // When an `action` param is also present, the FAB quick-add flow is active and
  // CalendarWidgets handles highlight + scroll + form open. Skip here to avoid
  // conflicting replaceState calls that can cancel CalendarWidgets' timers.
  const actionParam = useMemo(() => searchParams.get('action'), [searchParams]);

  useEffect(() => {
    if (!highlightedWidget || actionParam) return;

    const scrollTimer = window.setTimeout(() => {
      if (highlightedWidget === 'units') {
        scrollIfNotVisible(unitsWidgetRef.current);
      }
    }, 100);

    const clearTimer = window.setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete('highlightWidget');
      window.history.replaceState({}, '', url.toString());
    }, 3000);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [highlightedWidget, actionParam, scrollIfNotVisible]);

  return {
    unitsWidgetRef,
    assignmentsWidgetRef,
    deadlineRefs,
    highlightedUnitId,
    highlightedDeadlineId,
    deadlineHighlightActive: Boolean(highlightedDeadlineId),
  };
}
