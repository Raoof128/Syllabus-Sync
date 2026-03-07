'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { Deadline, Event, Unit, Todo } from '@/lib/types';

// Widgets
import AssignmentsWidget from './widgets/AssignmentsWidget';
import ExamsWidget from './widgets/ExamsWidget';
import UnitsWidget from './widgets/UnitsWidget';
import EventsWidget from './widgets/EventsWidget';
import TodosWidget from './widgets/TodosWidget';

interface CalendarWidgetsProps {
  onAddAssignment: () => void;
  onEditAssignment: (assignment: Deadline) => void;
  onOpenAssignmentDetail: (assignment: Deadline) => void;
  onAddExam: () => void;
  onEditExam: (exam: Deadline) => void;
  onOpenExamDetail: (exam: Deadline) => void;
  onAddUnit: () => void;
  onEditUnit: (unit: Unit) => void;
  onOpenUnitDetail: (unit: Unit) => void;
  onDeleteUnit: (unit: Unit) => void;
  onAddEvent: () => void;
  onEditEvent: (event: Event) => void;
  onOpenEventDetail: (event: Event) => void;
  onDeleteEvent: (event: Event) => void;
  onDeleteAssignment: (assignment: Deadline) => void;
  onDeleteExam: (exam: Deadline) => void;
  onEditTodo: (todo: Todo) => void;
  onAddTodo?: () => void;
  onOpenTodoDetail?: (todo: Todo) => void;
  onDeleteTodo?: (todo: Todo) => void;
  onNotifyTodo?: (todo: Todo) => void;
  unitsWidgetRef?: React.RefObject<HTMLDivElement>;
  assignmentsWidgetRef?: React.RefObject<HTMLDivElement>;
}

export default function CalendarWidgets({
  onAddAssignment,
  onEditAssignment,
  onOpenAssignmentDetail,
  onAddExam,
  onEditExam,
  onOpenExamDetail,
  onAddUnit,
  onEditUnit,
  onOpenUnitDetail,
  onDeleteUnit,
  onAddEvent,
  onEditEvent,
  onOpenEventDetail,
  onDeleteEvent,
  onDeleteAssignment,
  onDeleteExam,
  onEditTodo,
  onAddTodo,
  onOpenTodoDetail,
  onDeleteTodo,
  onNotifyTodo: _onNotifyTodo,
  unitsWidgetRef: externalUnitsRef,
  assignmentsWidgetRef: externalAssignmentsRef,
}: CalendarWidgetsProps) {
  const searchParams = useSearchParams();

  // Stores (needed for counts in mobile header and scrolling logic)
  const deadlines = useDeadlinesStore((state) => state.deadlines);

  // Highlight Refs
  const internalUnitsRef = useRef<HTMLDivElement>(null);
  const internalAssignmentsRef = useRef<HTMLDivElement>(null);
  const unitsWidgetRef = externalUnitsRef || internalUnitsRef;
  const assignmentsWidgetRef = externalAssignmentsRef || internalAssignmentsRef;
  const examsWidgetRef = useRef<HTMLDivElement>(null);
  const eventsWidgetRef = useRef<HTMLDivElement>(null);
  const todosWidgetRef = useRef<HTMLDivElement>(null);

  // URL Highlights
  const highlightedDeadlineId = searchParams.get('highlightDeadline');
  const highlightedUnitId = searchParams.get('highlightUnit');
  const highlightedTodoId = searchParams.get('highlightTodo');
  const highlightedEventId = searchParams.get('highlightEvent');
  const highlightedWidget = searchParams.get('highlightWidget');
  const highlightSection = searchParams.get('section');
  const sectionHighlight = searchParams.get('highlight') === 'true';
  const actionParam = searchParams.get('action');

  // State for section highlight that persists for 3 seconds
  const [sectionHighlightActive, setSectionHighlightActive] = useState<
    'events' | 'todos' | 'units' | 'assignments' | 'exams' | null
  >(null);

  // State for individual event highlight that auto-clears after 3 seconds
  const [eventHighlightDismissed, setEventHighlightDismissed] = useState(false);

  // Track if we've processed the current URL params to prevent re-processing
  const hasProcessedCurrentHighlight = useRef(false);
  const hasProcessedActionRef = useRef<string | null>(null);

  const deadlineHighlightActive =
    Boolean(highlightedDeadlineId) || sectionHighlightActive === 'assignments';
  const todoHighlightActive = Boolean(highlightedTodoId) || sectionHighlightActive === 'todos';
  const eventHighlightActive =
    (Boolean(highlightedEventId) && !eventHighlightDismissed) ||
    sectionHighlightActive === 'events';
  const examsHighlightActive = sectionHighlightActive === 'exams';
  const unitsHighlightActive = sectionHighlightActive === 'units';

  // Helper function to check if element is visible in viewport
  const isElementInViewport = React.useCallback((el: HTMLElement | null): boolean => {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }, []);

  // Helper function to scroll only if element is not visible
  const scrollIfNotVisible = React.useCallback(
    (el: HTMLElement | null) => {
      if (el && !isElementInViewport(el)) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    [isElementInViewport],
  );

  // Scroll Effects
  useEffect(() => {
    if (highlightedDeadlineId && assignmentsWidgetRef.current) {
      // Check if it's an exam or assignment to scroll to correct widget
      const deadline = deadlines.find((d) => d.id === highlightedDeadlineId);
      const targetRef =
        deadline?.type === 'Exam' || deadline?.type === 'Quiz'
          ? examsWidgetRef.current
          : assignmentsWidgetRef.current;

      setTimeout(() => {
        scrollIfNotVisible(targetRef);
      }, 100);
    }
  }, [highlightedDeadlineId, deadlines, scrollIfNotVisible, assignmentsWidgetRef]);

  useEffect(() => {
    if ((highlightedUnitId || highlightedWidget === 'units') && unitsWidgetRef.current) {
      setTimeout(() => {
        scrollIfNotVisible(unitsWidgetRef.current);
      }, 100);
    }
  }, [highlightedUnitId, highlightedWidget, scrollIfNotVisible, unitsWidgetRef]);

  useEffect(() => {
    if (highlightedTodoId && todosWidgetRef.current) {
      setTimeout(() => {
        scrollIfNotVisible(todosWidgetRef.current);
      }, 100);
    }
  }, [highlightedTodoId, scrollIfNotVisible]);

  useEffect(() => {
    if (highlightedEventId && eventsWidgetRef.current) {
      setTimeout(() => {
        scrollIfNotVisible(eventsWidgetRef.current);
      }, 100);
    }
  }, [highlightedEventId, scrollIfNotVisible]);

  // Auto-dismiss individual event highlight after 3 seconds
  useEffect(() => {
    if (highlightedEventId) {
      const resetTimer = setTimeout(() => {
        setEventHighlightDismissed(false);
      }, 0);
      const dismissTimer = setTimeout(() => {
        setEventHighlightDismissed(true);
      }, 3000);
      return () => {
        clearTimeout(resetTimer);
        clearTimeout(dismissTimer);
      };
    }
  }, [highlightedEventId]);

  // Handle section scroll from home page "View All" links
  useEffect(() => {
    if (highlightSection && sectionHighlight && !hasProcessedCurrentHighlight.current) {
      // Mark as processed
      hasProcessedCurrentHighlight.current = true;

      // Activate highlight and scroll after a small delay (avoid synchronous setState in effect)
      const activateTimer = setTimeout(() => {
        if (highlightSection === 'events' || highlightSection === 'todos') {
          setSectionHighlightActive(highlightSection);
        }

        if (highlightSection === 'events' && eventsWidgetRef.current) {
          eventsWidgetRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        } else if (highlightSection === 'todos' && todosWidgetRef.current) {
          todosWidgetRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 0);

      // Clear highlight after 3 seconds
      const clearTimer = setTimeout(() => {
        setSectionHighlightActive(null);
      }, 3000);

      return () => {
        clearTimeout(activateTimer);
        clearTimeout(clearTimer);
        // Reset ref in cleanup so effect can run again on next page visit
        hasProcessedCurrentHighlight.current = false;
      };
    }
  }, [highlightSection, sectionHighlight]);

  // Handle highlightWidget + action params from FAB menu
  // Store callbacks in refs so they never trigger effect re-runs
  const onAddUnitRef = React.useRef(onAddUnit);
  const onAddAssignmentRef = React.useRef(onAddAssignment);
  const onAddExamRef = React.useRef(onAddExam);
  const onAddEventRef = React.useRef(onAddEvent);
  const onAddTodoRef = React.useRef(onAddTodo);
  useEffect(() => {
    onAddUnitRef.current = onAddUnit;
    onAddAssignmentRef.current = onAddAssignment;
    onAddExamRef.current = onAddExam;
    onAddEventRef.current = onAddEvent;
    onAddTodoRef.current = onAddTodo;
  }, [onAddUnit, onAddAssignment, onAddExam, onAddEvent, onAddTodo]);

  useEffect(() => {
    if (!highlightedWidget || !actionParam) return;
    if (hasProcessedActionRef.current === actionParam) return;

    // Mark as consumed immediately — this is the one-shot guard
    hasProcessedActionRef.current = actionParam;

    // Immediately strip both action AND highlightWidget from URL to prevent any re-trigger
    const url = new URL(window.location.href);
    url.searchParams.delete('action');
    url.searchParams.delete('highlightWidget');
    window.history.replaceState({}, '', url.toString());

    // Capture values for use inside timers (independent of future renders)
    const widget = highlightedWidget;
    const action = actionParam;

    // Scroll to the appropriate widget (only if not visible) and activate highlight
    const activateTimer = setTimeout(() => {
      if (
        widget === 'units' ||
        widget === 'assignments' ||
        widget === 'exams' ||
        widget === 'events' ||
        widget === 'todos'
      ) {
        setSectionHighlightActive(widget);
      }

      // Scroll to appropriate widget ONLY if not already visible
      if (widget === 'units' && unitsWidgetRef.current) {
        scrollIfNotVisible(unitsWidgetRef.current);
      } else if (widget === 'assignments' && assignmentsWidgetRef.current) {
        scrollIfNotVisible(assignmentsWidgetRef.current);
      } else if (widget === 'exams' && examsWidgetRef.current) {
        scrollIfNotVisible(examsWidgetRef.current);
      } else if (widget === 'events' && eventsWidgetRef.current) {
        scrollIfNotVisible(eventsWidgetRef.current);
      } else if (widget === 'todos' && todosWidgetRef.current) {
        scrollIfNotVisible(todosWidgetRef.current);
      }

      // Trigger the appropriate add action after scroll
      setTimeout(() => {
        if (action === 'add-unit') {
          onAddUnitRef.current();
        } else if (action === 'add-assignment') {
          onAddAssignmentRef.current();
        } else if (action === 'add-exam') {
          onAddExamRef.current();
        } else if (action === 'add-event') {
          onAddEventRef.current();
        } else if (action === 'add-todo') {
          onAddTodoRef.current?.();
        }
      }, 300);
    }, 100);

    // Clear highlight after 3 seconds (highlight is visual-only, action already consumed)
    const clearTimer = setTimeout(() => {
      setSectionHighlightActive(null);
    }, 3000);

    return () => {
      clearTimeout(activateTimer);
      clearTimeout(clearTimer);
    };
  }, [highlightedWidget, actionParam, unitsWidgetRef, assignmentsWidgetRef, scrollIfNotVisible]);

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6">
        <AssignmentsWidget
          onAddAssignment={onAddAssignment}
          onEditAssignment={onEditAssignment}
          onOpenAssignmentDetail={onOpenAssignmentDetail}
          onDeleteAssignment={onDeleteAssignment}
          highlightedDeadlineId={highlightedDeadlineId}
          widgetRef={assignmentsWidgetRef}
          deadlineHighlightActive={deadlineHighlightActive}
        />

        <ExamsWidget
          onAddExam={onAddExam}
          onEditExam={onEditExam}
          onOpenExamDetail={onOpenExamDetail}
          onDeleteExam={onDeleteExam}
          highlightedDeadlineId={highlightedDeadlineId}
          widgetRef={examsWidgetRef}
          deadlineHighlightActive={deadlineHighlightActive || examsHighlightActive}
        />

        <UnitsWidget
          onAddUnit={onAddUnit}
          onEditUnit={onEditUnit}
          onOpenUnitDetail={onOpenUnitDetail}
          onDeleteUnit={onDeleteUnit}
          highlightedUnitId={highlightedUnitId}
          widgetRef={unitsWidgetRef}
          highlightedWidget={unitsHighlightActive ? 'units' : highlightedWidget}
        />

        <EventsWidget
          onAddEvent={onAddEvent}
          onEditEvent={onEditEvent}
          onOpenEventDetail={onOpenEventDetail}
          onDeleteEvent={onDeleteEvent}
          highlightedEventId={highlightedEventId}
          widgetRef={eventsWidgetRef}
          eventHighlightActive={eventHighlightActive}
        />

        <TodosWidget
          onAddTodo={onAddTodo || (() => {})}
          onEditTodo={onEditTodo}
          onOpenTodoDetail={onOpenTodoDetail || (() => {})}
          onDeleteTodo={onDeleteTodo || (() => {})}
          highlightedTodoId={highlightedTodoId}
          widgetRef={todosWidgetRef}
          todoHighlightActive={todoHighlightActive}
        />
      </div>
    </div>
  );
}
