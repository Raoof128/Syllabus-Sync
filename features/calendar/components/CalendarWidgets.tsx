'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { Deadline, Event, Unit, Todo } from '@/lib/types';
import type { CalendarIntentTarget } from '@/features/calendar/lib/calendarIntent';

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
  unitsWidgetRef?: React.RefObject<HTMLDivElement | null>;
  assignmentsWidgetRef?: React.RefObject<HTMLDivElement | null>;
  examsWidgetRef?: React.RefObject<HTMLDivElement | null>;
  eventsWidgetRef?: React.RefObject<HTMLDivElement | null>;
  remindersWidgetRef?: React.RefObject<HTMLDivElement | null>;
  intentHighlightTarget?: CalendarIntentTarget | null;
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
  examsWidgetRef: externalExamsRef,
  eventsWidgetRef: externalEventsRef,
  remindersWidgetRef: externalRemindersRef,
  intentHighlightTarget = null,
}: CalendarWidgetsProps) {
  const searchParams = useSearchParams();

  // Stores (needed for counts in mobile header and scrolling logic)
  const deadlines = useDeadlinesStore((state) => state.deadlines);

  // Highlight Refs
  const internalUnitsRef = useRef<HTMLDivElement>(null);
  const internalAssignmentsRef = useRef<HTMLDivElement>(null);
  const internalExamsRef = useRef<HTMLDivElement>(null);
  const internalEventsRef = useRef<HTMLDivElement>(null);
  const internalRemindersRef = useRef<HTMLDivElement>(null);
  const unitsWidgetRef = externalUnitsRef || internalUnitsRef;
  const assignmentsWidgetRef = externalAssignmentsRef || internalAssignmentsRef;
  const examsWidgetRef = externalExamsRef || internalExamsRef;
  const eventsWidgetRef = externalEventsRef || internalEventsRef;
  const todosWidgetRef = externalRemindersRef || internalRemindersRef;

  // URL Highlights
  const highlightedDeadlineId = searchParams.get('highlightDeadline');
  const highlightedUnitId = searchParams.get('highlightUnit');
  const highlightedTodoId = searchParams.get('highlightTodo');
  const highlightedEventId = searchParams.get('highlightEvent');
  const highlightedWidget = searchParams.get('highlightWidget');
  const highlightSection = searchParams.get('section');
  const sectionHighlight = searchParams.get('highlight') === 'true';

  // State for section highlight that persists for 3 seconds
  const [sectionHighlightActive, setSectionHighlightActive] = useState<
    'events' | 'todos' | 'units' | 'assignments' | 'exams' | null
  >(null);

  // State for individual highlight auto-clear after 3 seconds
  const [eventHighlightDismissed, setEventHighlightDismissed] = useState(false);
  const [deadlineHighlightDismissed, setDeadlineHighlightDismissed] = useState(false);
  const [todoHighlightDismissed, setTodoHighlightDismissed] = useState(false);

  // Track if we've processed the current URL params to prevent re-processing
  const hasProcessedCurrentHighlight = useRef(false);

  const deadlineHighlightActive =
    (Boolean(highlightedDeadlineId) && !deadlineHighlightDismissed) ||
    sectionHighlightActive === 'assignments' ||
    intentHighlightTarget === 'assignment';
  const todoHighlightActive =
    (Boolean(highlightedTodoId) && !todoHighlightDismissed) ||
    sectionHighlightActive === 'todos' ||
    intentHighlightTarget === 'reminder';
  const eventHighlightActive =
    (Boolean(highlightedEventId) && !eventHighlightDismissed) ||
    sectionHighlightActive === 'events' ||
    intentHighlightTarget === 'event';
  const examsHighlightActive =
    sectionHighlightActive === 'exams' || intentHighlightTarget === 'exam';
  const unitsHighlightActive =
    sectionHighlightActive === 'units' || intentHighlightTarget === 'unit';

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

  // Guard: only scroll once per deadline highlight
  const deadlineScrolledRef = useRef<string | null>(null);

  // Reset the guard when the highlight ID changes
  useEffect(() => {
    if (highlightedDeadlineId !== deadlineScrolledRef.current) {
      deadlineScrolledRef.current = null;
    }
  }, [highlightedDeadlineId]);

  // Scroll Effects
  useEffect(() => {
    if (!highlightedDeadlineId || deadlineScrolledRef.current === highlightedDeadlineId) return;

    const deadline = deadlines.find((d) => d.id === highlightedDeadlineId);
    if (!deadline) return; // data not loaded yet — wait for next render

    deadlineScrolledRef.current = highlightedDeadlineId;

    const targetRef =
      deadline.type === 'Exam' || deadline.type === 'Quiz'
        ? examsWidgetRef.current
        : assignmentsWidgetRef.current;

    setTimeout(() => {
      scrollIfNotVisible(targetRef);
    }, 100);
  }, [highlightedDeadlineId, deadlines, scrollIfNotVisible, assignmentsWidgetRef, examsWidgetRef]);

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
  }, [highlightedTodoId, scrollIfNotVisible, todosWidgetRef]);

  useEffect(() => {
    if (highlightedEventId && eventsWidgetRef.current) {
      setTimeout(() => {
        scrollIfNotVisible(eventsWidgetRef.current);
      }, 100);
    }
  }, [highlightedEventId, eventsWidgetRef, scrollIfNotVisible]);

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

  // Auto-dismiss deadline highlight after 3 seconds
  useEffect(() => {
    if (highlightedDeadlineId) {
      const resetTimer = setTimeout(() => {
        setDeadlineHighlightDismissed(false);
      }, 0);
      const dismissTimer = setTimeout(() => {
        setDeadlineHighlightDismissed(true);
      }, 3000);
      return () => {
        clearTimeout(resetTimer);
        clearTimeout(dismissTimer);
      };
    }
  }, [highlightedDeadlineId]);

  // Auto-dismiss todo highlight after 3 seconds
  useEffect(() => {
    if (highlightedTodoId) {
      const resetTimer = setTimeout(() => {
        setTodoHighlightDismissed(false);
      }, 0);
      const dismissTimer = setTimeout(() => {
        setTodoHighlightDismissed(true);
      }, 3000);
      return () => {
        clearTimeout(resetTimer);
        clearTimeout(dismissTimer);
      };
    }
  }, [highlightedTodoId]);

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
  }, [eventsWidgetRef, highlightSection, sectionHighlight, todosWidgetRef]);

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
