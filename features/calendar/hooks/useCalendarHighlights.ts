import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Deadline, Event, Unit, Todo } from '@/lib/types';
import { useCalendarDialogs } from './useCalendarDialogs';

export function useCalendarHighlights(
  units: Unit[],
  deadlines: Deadline[],
  events: Event[],
  todos: Todo[],
  hasHydrated: boolean,
  dialogs: ReturnType<typeof useCalendarDialogs>,
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
  }, [highlightedUnitId, highlightedUnit, hasHydrated, setSelectedUnit, setUnitDetailOpen]);

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

  useEffect(() => {
    if (!highlightedDeadlineId) return;

    const highlightedDeadline = deadlines.find((d) => d.id === highlightedDeadlineId);

    const scrollTimer = window.setTimeout(() => {
      scrollIfNotVisible(assignmentsWidgetRef.current, 'start');

      const deadlineElement = deadlineRefs.current.get(highlightedDeadlineId);
      if (deadlineElement) {
        setTimeout(() => {
          scrollIfNotVisible(deadlineElement, 'center');
        }, 400);
      }

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

    const clearTimer = window.setTimeout(() => {
      const url = new URL(window.location.href);
      if (url.searchParams.has('highlightDeadline')) {
        url.searchParams.delete('highlightDeadline');
        window.history.replaceState({}, '', url.toString());
      }
    }, 3000);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [
    highlightedDeadlineId,
    deadlines,
    scrollIfNotVisible,
    setSelectedExam,
    setExamDetailOpen,
    setSelectedAssignment,
    setAssignmentDetailOpen,
  ]);

  // 3. Highlighted Todo
  const highlightedTodoId = useMemo(() => searchParams.get('highlightTodo'), [searchParams]);

  useEffect(() => {
    if (!highlightedTodoId) return;

    const highlightedTodo = todos.find((t) => t.id === highlightedTodoId);

    const timer = window.setTimeout(() => {
      if (highlightedTodo) {
        setSelectedTodo(highlightedTodo);
        setTodoDetailOpen(true);
      }
    }, 300);

    const clearTimer = window.setTimeout(() => {
      const url = new URL(window.location.href);
      if (url.searchParams.has('highlightTodo')) {
        url.searchParams.delete('highlightTodo');
        window.history.replaceState({}, '', url.toString());
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(clearTimer);
    };
  }, [highlightedTodoId, todos, setSelectedTodo, setTodoDetailOpen]);

  // 4. Highlighted Event
  const highlightedEventId = useMemo(() => searchParams.get('highlightEvent'), [searchParams]);

  useEffect(() => {
    if (!highlightedEventId) return;

    const highlightedEvent = events.find((e) => e.id === highlightedEventId);

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
  }, [highlightedEventId, events, setSelectedEvent, setEventDetailOpen]);

  // 5. Highlighted Widget
  const highlightedWidget = useMemo(() => searchParams.get('highlightWidget'), [searchParams]);

  useEffect(() => {
    if (!highlightedWidget) return;

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
  }, [highlightedWidget, scrollIfNotVisible]);

  return {
    unitsWidgetRef,
    assignmentsWidgetRef,
    deadlineRefs,
    highlightedUnitId,
    highlightedDeadlineId,
    deadlineHighlightActive: Boolean(highlightedDeadlineId),
  };
}
