'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { useSearchParams } from 'next/navigation';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useEventsStore } from '@/lib/store/eventsStore';
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
  const { t } = useTypedTranslation();
  const tOr = (key: TranslationKey | string, fallback: string) => {
    const value = t(key as TranslationKey);
    return value === key ? fallback : value;
  };
  const searchParams = useSearchParams();

  // Stores (needed for counts in mobile header and scrolling logic)
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const units = useUnitsStore((state) => state.units);
  const events = useEventsStore((state) => state.events);

  // Derived Data for mobile header count
  const assignmentsCount = deadlines.filter((d) => d.type === 'Assignment').length;
  const examsCount = deadlines.filter((d) => d.type === 'Exam' || d.type === 'Quiz').length;

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

  // State for section highlight that persists for 3 seconds
  const [sectionHighlightActive, setSectionHighlightActive] = useState<'events' | 'todos' | null>(
    null,
  );

  // State for individual event highlight that auto-clears after 3 seconds
  const [eventHighlightDismissed, setEventHighlightDismissed] = useState(false);

  // Track if we've processed the current URL params to prevent re-processing
  const hasProcessedCurrentHighlight = useRef(false);

  const deadlineHighlightActive = Boolean(highlightedDeadlineId);
  const todoHighlightActive = Boolean(highlightedTodoId) || sectionHighlightActive === 'todos';
  const eventHighlightActive =
    (Boolean(highlightedEventId) && !eventHighlightDismissed) ||
    sectionHighlightActive === 'events';

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
          eventsWidgetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (highlightSection === 'todos' && todosWidgetRef.current) {
          todosWidgetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Mobile section header - only visible on smaller screens */}
      <div className="lg:hidden flex items-center gap-2 pb-2 border-b border-mq-border">
        <h2 className="text-lg font-semibold text-mq-content">
          {tOr('calendarWidgets' as TranslationKey, 'Quick Access')}
        </h2>
        <span className="text-xs text-mq-content-tertiary">
          ({assignmentsCount + examsCount + units.length + events.length}{' '}
          {tOr('items' as TranslationKey, 'items')})
        </span>
      </div>

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
          deadlineHighlightActive={deadlineHighlightActive}
        />

        <UnitsWidget
          onAddUnit={onAddUnit}
          onEditUnit={onEditUnit}
          onOpenUnitDetail={onOpenUnitDetail}
          onDeleteUnit={onDeleteUnit}
          highlightedUnitId={highlightedUnitId}
          widgetRef={unitsWidgetRef}
          highlightedWidget={highlightedWidget}
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
