'use client';

import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  BookOpen,
  FileText,
  CheckCircle2,
  Circle,
  PartyPopper,
  Trash2,
  CheckSquare,
  Clock,
  Edit2,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/mq/button';
import { Badge } from '@/components/ui/mq/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { MagicCard } from '@/components/ui/MagicCard';
import { cn } from '@/lib/utils';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useEventsStore } from '@/lib/store/eventsStore';
import { useTodosStore } from '@/lib/store/todosStore';
import { PRIORITY_COLORS } from '@/lib/constants';
import { getDeadlineColor } from '@/lib/calendar-utils';
import dayjs from 'dayjs';
import { Deadline, Event, Unit, Todo } from '@/lib/types';
import ItemActionButtons from '@/features/calendar/components/ItemActionButtons';
import { formatLocalizedDate } from '@/lib/utils/locale';

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
  const { t, language } = useTypedTranslation();
  const tOr = (key: TranslationKey | string, fallback: string) => {
    const value = t(key as TranslationKey);
    return value === key ? fallback : value;
  };
  const searchParams = useSearchParams();

  // Stores
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const toggleComplete = useDeadlinesStore((state) => state.toggleComplete);
  const toggleDeadlineNotification = useDeadlinesStore((state) => state.toggleNotification);
  const units = useUnitsStore((state) => state.units);
  const toggleUnitNotification = useUnitsStore((state) => state.toggleNotification);
  const events = useEventsStore((state) => state.events);
  const toggleEventNotification = useEventsStore((state) => state.toggleNotification);

  // Todo Store
  const todos = useTodosStore((state) => state.todos);
  const toggleTodoComplete = useTodosStore((state) => state.toggleComplete);
  const deleteTodo = useTodosStore((state) => state.removeTodo);
  const toggleTodoNotification = useTodosStore((state) => state.toggleNotification);

  // Compute pending todos locally to avoid infinite loop from selector returning new references
  const pendingTodos = useMemo(() => {
    const now = dayjs();
    return todos
      .filter((t) => !t.completed)
      .sort((a, b) => {
        // Sort overdue items first (using dayjs for consistent comparison)
        const aDue = a.dueDate ? dayjs(a.dueDate) : null;
        const bDue = b.dueDate ? dayjs(b.dueDate) : null;
        const aOverdue = aDue && aDue.isBefore(now);
        const bOverdue = bDue && bDue.isBefore(now);

        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        // Then sort by due date (items with due dates first, earlier dates first)
        if (aDue && !bDue) return -1;
        if (!aDue && bDue) return 1;
        if (aDue && bDue) {
          const dateDiff = aDue.valueOf() - bDue.valueOf();
          if (dateDiff !== 0) return dateDiff;
        }

        // Then sort by priority
        const priorityOrder = { High: 0, Medium: 1, Low: 2 };
        const pA = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
        const pB = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;
        if (pA !== pB) return pA - pB;

        // Finally sort by creation date
        return dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf();
      });
  }, [todos]);

  // Derived Data
  const assignments = deadlines.filter((d) => d.type === 'Assignment');
  const exams = deadlines.filter((d) => d.type === 'Exam' || d.type === 'Quiz');

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

  // State for section highlight that persists for 5 seconds
  const [sectionHighlightActive, setSectionHighlightActive] = useState<'events' | 'todos' | null>(
    null,
  );

  const deadlineHighlightActive = Boolean(highlightedDeadlineId);
  const todoHighlightActive = Boolean(highlightedTodoId) || sectionHighlightActive === 'todos';
  const eventHighlightActive = Boolean(highlightedEventId) || sectionHighlightActive === 'events';

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

  // Handle section scroll from home page "View All" links
  useEffect(() => {
    if (highlightSection && sectionHighlight) {
      const scrollTimer = setTimeout(() => {
        // Activate the highlight
        if (highlightSection === 'events' || highlightSection === 'todos') {
          setSectionHighlightActive(highlightSection);
        }

        if (highlightSection === 'events' && eventsWidgetRef.current) {
          eventsWidgetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (highlightSection === 'todos' && todosWidgetRef.current) {
          todosWidgetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        // Clear URL params after scrolling
        const url = new URL(window.location.href);
        url.searchParams.delete('section');
        url.searchParams.delete('highlight');
        window.history.replaceState({}, '', url.toString());
      }, 300);

      // Clear highlight after 2 seconds
      const highlightTimer = setTimeout(() => {
        setSectionHighlightActive(null);
      }, 2000);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(highlightTimer);
      };
    }
  }, [highlightSection, sectionHighlight]);

  // Format Helpers
  const formatMonthDayTime = (date: Date) =>
    formatLocalizedDate(date, language, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  // Get building info for a deadline
  const getDeadlineBuilding = (deadline: Deadline): string | undefined => {
    if (deadline.building) return deadline.building;
    const unit = units.find((u) => u.code === deadline.unitCode);
    return unit?.location?.building;
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Mobile section header - only visible on smaller screens */}
      <div className="lg:hidden flex items-center gap-2 pb-2 border-b border-mq-border">
        <h2 className="text-lg font-semibold text-mq-content">
          {tOr('calendarWidgets' as TranslationKey, 'Quick Access')}
        </h2>
        <span className="text-xs text-mq-content-tertiary">
          ({assignments.length + exams.length + units.length + events.length}{' '}
          {tOr('items' as TranslationKey, 'items')})
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6">
        {/* Assignments Widget */}
        <MagicCard
          isLiquidEnhanced
          className={
            highlightedDeadlineId &&
            deadlines.find((d) => d.id === highlightedDeadlineId)?.type === 'Assignment'
              ? 'ring-2 ring-mq-primary ring-offset-2 ring-offset-mq-background transition-all'
              : ''
          }
        >
          <div
            className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border"
            ref={assignmentsWidgetRef}
          >
            <Card className="border border-mq-border shadow-sm bg-mq-card-background">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <FileText className="h-4 w-4" />
                    {t('assignments')}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral" className="text-[10px] h-5 px-1.5">
                      {assignments.filter((a) => !a.completed).length} {t('pending')}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={onAddAssignment}
                      aria-label={t('addAssignment')}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {assignments.length === 0 ? (
                  <div className="text-center py-6 text-mq-content-tertiary">
                    <p className="text-xs">{t('noAssignmentsYet')}</p>
                  </div>
                ) : (
                  <div className="space-y-2 pr-1">
                    {assignments
                      .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf())
                      .map((assignment) => {
                        const due = dayjs(assignment.dueDate);
                        const isOverdue = !assignment.completed && due.isBefore(dayjs());
                        const isHighlighted =
                          deadlineHighlightActive && highlightedDeadlineId === assignment.id;
                        const deadlineColor = getDeadlineColor(assignment, units);

                        return (
                          <div
                            key={assignment.id}
                            className={cn(
                              'group flex items-center gap-3 p-2.5 rounded-md border-l-4 border border-mq-border transition-all cursor-pointer w-full bg-mq-background-secondary hover:bg-mq-surface hover:shadow-sm',
                              assignment.completed && 'opacity-60 grayscale',
                              isOverdue && 'bg-red-500/5',
                              isHighlighted && 'ring-2 ring-mq-primary ring-offset-1 animate-pulse',
                            )}
                            style={{ borderLeftColor: deadlineColor, borderLeftWidth: '4px' }}
                            onClick={() => onOpenAssignmentDetail(assignment)}
                            onKeyDown={(e) =>
                              handleKeyDown(e, () => onOpenAssignmentDetail(assignment))
                            }
                            role="button"
                            tabIndex={0}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleComplete(assignment.id);
                              }}
                              className={cn(
                                'text-mq-content-secondary hover:text-mq-primary transition-colors',
                                assignment.completed ? 'text-green-600' : '',
                              )}
                            >
                              {assignment.completed ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <Circle className="h-4 w-4" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4
                                  className={cn(
                                    'font-medium text-sm truncate',
                                    assignment.completed &&
                                      'line-through decoration-mq-content-tertiary',
                                  )}
                                >
                                  {assignment.title}
                                </h4>
                                <Badge
                                  className={cn(
                                    PRIORITY_COLORS[assignment.priority],
                                    'ml-2 text-[10px] h-4 px-1',
                                  )}
                                  variant="neutral"
                                >
                                  {t(`priority_${assignment.priority}` as TranslationKey)}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-mq-content-secondary truncate mt-0.5">
                                {assignment.unitCode} • {formatMonthDayTime(due.toDate())}
                              </p>
                            </div>
                            <ItemActionButtons
                              itemType="assignment"
                              itemId={assignment.id}
                              itemTitle={assignment.title}
                              unitCode={assignment.unitCode}
                              dateTime={assignment.dueDate}
                              notificationEnabled={assignment.notificationEnabled}
                              onEdit={() => onEditAssignment(assignment)}
                              onDelete={() => onDeleteAssignment(assignment)}
                              onToggleNotification={() => toggleDeadlineNotification(assignment.id)}
                              variant="compact"
                              stopPropagation
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </MagicCard>

        {/* Exams Widget */}
        <MagicCard isLiquidEnhanced>
          <div
            className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border"
            ref={examsWidgetRef}
          >
            <Card className="border border-mq-border shadow-sm bg-mq-card-background">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <BookOpen className="h-4 w-4" />
                    {t('exams')}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral" className="text-[10px] h-5 px-1.5">
                      {exams.filter((e) => !e.completed).length} {t('upcoming')}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={onAddExam}
                      aria-label={t('addExam')}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {exams.length === 0 ? (
                  <div className="text-center py-6 text-mq-content-tertiary">
                    <p className="text-xs">{t('noExamsYet')}</p>
                  </div>
                ) : (
                  <div className="space-y-2 pr-1">
                    {exams
                      .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf())
                      .map((exam) => {
                        const due = dayjs(exam.dueDate);
                        const isOverdue = !exam.completed && due.isBefore(dayjs());
                        const deadlineColor = getDeadlineColor(exam, units);

                        return (
                          <div
                            key={exam.id}
                            className={cn(
                              'group flex items-center gap-3 p-2.5 rounded-md border-l-4 border border-mq-border transition-all cursor-pointer w-full bg-mq-background-secondary hover:bg-mq-surface hover:shadow-sm',
                              exam.completed && 'opacity-60 grayscale',
                              isOverdue && 'bg-red-500/5',
                            )}
                            style={{ borderLeftColor: deadlineColor, borderLeftWidth: '4px' }}
                            onClick={() => onOpenExamDetail(exam)}
                            onKeyDown={(e) => handleKeyDown(e, () => onOpenExamDetail(exam))}
                            role="button"
                            tabIndex={0}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleComplete(exam.id);
                              }}
                              className={cn(
                                'text-mq-content-secondary hover:text-mq-primary transition-colors',
                                exam.completed ? 'text-green-600' : '',
                              )}
                            >
                              {exam.completed ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <Circle className="h-4 w-4" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4
                                  className={cn(
                                    'font-medium text-sm truncate',
                                    exam.completed && 'line-through decoration-mq-content-tertiary',
                                  )}
                                >
                                  {exam.title}
                                </h4>
                                <Badge
                                  className={cn(
                                    PRIORITY_COLORS[exam.priority],
                                    'ml-2 text-[10px] h-4 px-1',
                                  )}
                                  variant="neutral"
                                >
                                  {t(`priority_${exam.priority}` as TranslationKey)}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-mq-content-secondary truncate mt-0.5">
                                {exam.unitCode} • {formatMonthDayTime(due.toDate())}
                              </p>
                            </div>
                            <ItemActionButtons
                              itemType="exam"
                              itemId={exam.id}
                              itemTitle={exam.title}
                              building={getDeadlineBuilding(exam)}
                              room={exam.room}
                              unitCode={exam.unitCode}
                              dateTime={exam.dueDate}
                              notificationEnabled={exam.notificationEnabled}
                              onEdit={() => onEditExam(exam)}
                              onDelete={() => onDeleteExam(exam)}
                              onToggleNotification={() => toggleDeadlineNotification(exam.id)}
                              variant="compact"
                              stopPropagation
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </MagicCard>

        {/* Units Widget */}
        <MagicCard
          isLiquidEnhanced
          className={
            highlightedWidget === 'units'
              ? 'ring-2 ring-mq-primary ring-offset-2 ring-offset-mq-background transition-all'
              : ''
          }
        >
          <div
            className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border"
            ref={unitsWidgetRef}
          >
            <Card
              variant="glass"
              className="border border-mq-border shadow-none calendar-glass-solid bg-mq-card-background"
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <BookOpen className="h-4 w-4" />
                    {t('myUnits')}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral" className="text-[10px] h-5 px-1.5">
                      {units.length}{' '}
                      {units.length === 1 ? tOr('unit', 'unit') : tOr('unitsLabel', 'units')}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={onAddUnit}
                      aria-label={t('addUnit')}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {units.length === 0 ? (
                  <div className="text-center py-6 text-mq-content-tertiary">
                    <p className="text-xs">{t('noUnitsYet')}</p>
                  </div>
                ) : (
                  <div className="space-y-2 pr-1">
                    {units.map((unit) => (
                      <div
                        key={unit.id}
                        className={cn(
                          'group flex items-center gap-3 p-2.5 rounded-md border-l-4 border border-mq-border bg-mq-background-secondary transition-all cursor-pointer hover:bg-mq-surface hover:shadow-sm',
                          highlightedUnitId === unit.id &&
                            'ring-2 ring-mq-primary ring-offset-1 animate-pulse bg-mq-primary/5',
                        )}
                        style={{ borderLeftColor: unit.color, borderLeftWidth: '4px' }}
                        onClick={() => onOpenUnitDetail(unit)}
                        onKeyDown={(e) => handleKeyDown(e, () => onOpenUnitDetail(unit))}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{unit.code}</h4>
                          <p className="text-[11px] text-mq-content-secondary truncate">
                            {unit.name}
                          </p>
                        </div>
                        <ItemActionButtons
                          itemType="unit"
                          itemId={unit.id}
                          itemTitle={unit.code}
                          building={unit.location?.building}
                          room={unit.location?.room}
                          unitCode={unit.code}
                          notificationEnabled={unit.notificationEnabled}
                          onEdit={() => onEditUnit(unit)}
                          onDelete={() => onDeleteUnit(unit)}
                          onToggleNotification={() => toggleUnitNotification(unit.id)}
                          variant="compact"
                          stopPropagation
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </MagicCard>

        {/* Events Widget */}
        <MagicCard
          isLiquidEnhanced
          className={
            eventHighlightActive
              ? 'ring-2 ring-mq-primary ring-offset-2 ring-offset-mq-background transition-all duration-300 animate-pulse'
              : 'transition-all duration-300'
          }
        >
          <div
            className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border"
            ref={eventsWidgetRef}
          >
            <Card
              variant="glass"
              className="border border-mq-border shadow-none calendar-glass-solid bg-mq-card-background"
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <PartyPopper className="h-4 w-4" />
                    {t('events')}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral" className="text-[10px] h-5 px-1.5">
                      {events.length}{' '}
                      {events.length === 1 ? tOr('event', 'event') : tOr('eventsLabel', 'events')}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => onAddEvent()}
                      aria-label={t('addEvent')}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 pr-1">
                  {events.length === 0 ? (
                    <div className="text-center py-6 text-mq-content-tertiary">
                      <p className="text-xs">{t('noEventsYet' as TranslationKey)}</p>
                    </div>
                  ) : (
                    events.slice(0, 5).map((event) => {
                      // Get category color
                      const categoryColors: Record<string, string> = {
                        Career: '#3B82F6',
                        Social: '#8B5CF6',
                        Academic: '#10B981',
                        'Free Food': '#F59E0B',
                      };
                      const eventColor = event.color || categoryColors[event.category] || '#A6192E';

                      // Events from public feed (have sourcePublicEventId) can be deleted but not edited
                      const isFromPublicFeed = Boolean(event.sourcePublicEventId);
                      const isHighlighted = eventHighlightActive && highlightedEventId === event.id;

                      return (
                        <div
                          key={event.id}
                          className={cn(
                            'group flex items-center gap-3 p-2.5 rounded-md border-l-4 border border-mq-border bg-mq-background-secondary transition-all cursor-pointer hover:bg-mq-surface hover:shadow-sm',
                            isHighlighted && 'ring-2 ring-mq-primary ring-offset-1 animate-pulse',
                          )}
                          style={{ borderLeftColor: eventColor, borderLeftWidth: '4px' }}
                          onClick={() => onOpenEventDetail(event)}
                          onKeyDown={(e) => handleKeyDown(e, () => onOpenEventDetail(event))}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{event.title}</h4>
                            <p className="text-[11px] text-mq-content-secondary truncate">
                              {event.startAt
                                ? formatMonthDayTime(
                                    event.startAt instanceof Date
                                      ? event.startAt
                                      : new Date(event.startAt),
                                  )
                                : event.time}{' '}
                              • {event.location}
                            </p>
                          </div>
                          <ItemActionButtons
                            itemType="event"
                            itemId={event.id}
                            itemTitle={event.title}
                            building={event.building}
                            room={event.room}
                            dateTime={event.startAt || event.date}
                            notificationEnabled={event.notificationEnabled}
                            onEdit={isFromPublicFeed ? undefined : () => onEditEvent(event)}
                            onDelete={() => onDeleteEvent(event)}
                            onToggleNotification={() => toggleEventNotification(event.id)}
                            variant="compact"
                            stopPropagation
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </MagicCard>

        {/* Todos Widget */}
        <MagicCard
          isLiquidEnhanced
          className={
            todoHighlightActive
              ? 'ring-2 ring-mq-primary ring-offset-2 ring-offset-mq-background transition-all duration-300 animate-pulse'
              : 'transition-all duration-300'
          }
        >
          <div
            className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border"
            ref={todosWidgetRef}
          >
            <Card
              variant="glass"
              className="border border-mq-border shadow-none calendar-glass-solid bg-mq-card-background"
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <CheckSquare className="h-4 w-4" />
                    {t('todos' as TranslationKey)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral" className="text-[10px] h-5 px-1.5">
                      {pendingTodos.length} {t('pending')}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => onAddTodo?.()}
                      aria-label={tOr('addTodo', 'Add Todo')}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 pr-1">
                  {pendingTodos.length === 0 ? (
                    <div className="text-center py-6 text-mq-content-tertiary">
                      <p className="text-xs">{t('noTodos' as TranslationKey)}</p>
                    </div>
                  ) : (
                    pendingTodos.map((todo) => {
                      // Priority-based left border color
                      const priorityColors: Record<string, string> = {
                        High: '#EF4444',
                        Medium: '#F59E0B',
                        Low: '#10B981',
                      };
                      const todoColor = priorityColors[todo.priority] || '#6B7280';
                      // Use dayjs for consistent date comparison (same as assignments/exams)
                      const due = todo.dueDate ? dayjs(todo.dueDate) : null;
                      const isOverdue = due && !todo.completed && due.isBefore(dayjs());
                      const isHighlighted = todoHighlightActive && highlightedTodoId === todo.id;

                      return (
                        <div
                          key={todo.id}
                          className={cn(
                            'group flex items-center gap-3 p-2.5 rounded-md border-l-4 border border-mq-border bg-mq-background-secondary transition-all cursor-pointer hover:bg-mq-surface hover:shadow-sm',
                            todo.completed && 'opacity-60 grayscale',
                            isOverdue && 'bg-red-500/5',
                            isHighlighted && 'ring-2 ring-mq-primary ring-offset-1 animate-pulse',
                          )}
                          style={{ borderLeftColor: todoColor, borderLeftWidth: '4px' }}
                          onClick={() => onOpenTodoDetail?.(todo)}
                          onKeyDown={(e) => handleKeyDown(e, () => onOpenTodoDetail?.(todo))}
                          role="button"
                          tabIndex={0}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTodoComplete(todo.id);
                            }}
                            className={cn(
                              'text-mq-content-secondary hover:text-mq-primary transition-colors shrink-0',
                              todo.completed && 'text-green-600',
                            )}
                            aria-label={
                              todo.completed
                                ? tOr('markIncomplete', 'Mark incomplete')
                                : tOr('markComplete', 'Mark complete')
                            }
                          >
                            {todo.completed ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4
                                className={cn(
                                  'font-medium text-sm truncate',
                                  todo.completed && 'line-through decoration-mq-content-tertiary',
                                )}
                              >
                                {todo.title}
                              </h4>
                              <Badge
                                className={cn(
                                  PRIORITY_COLORS[todo.priority],
                                  'ml-2 text-[10px] h-4 px-1',
                                )}
                                variant="neutral"
                              >
                                {t(`priority_${todo.priority}` as TranslationKey)}
                              </Badge>
                            </div>
                            {todo.dueDate && (
                              <p
                                className={cn(
                                  'text-[11px] text-mq-content-secondary flex items-center gap-1 mt-0.5',
                                  isOverdue && 'text-red-500 font-medium',
                                )}
                              >
                                <Clock className="h-3 w-3" />
                                {`${isOverdue ? `${tOr('overdue', 'Overdue')} • ` : ''}${formatMonthDayTime(new Date(todo.dueDate))}`}
                              </p>
                            )}
                          </div>
                          {/* Action buttons - Edit, Trash, Bell order to match other cards */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTodo(todo);
                              }}
                              className="p-1.5 hover:bg-mq-hover-background rounded transition-colors text-mq-content-secondary hover:text-mq-primary"
                              title={tOr('editTodo', 'Edit')}
                              aria-label={tOr('editTodo', 'Edit todo')}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onDeleteTodo) {
                                  onDeleteTodo(todo);
                                } else {
                                  deleteTodo(todo.id);
                                }
                              }}
                              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-950/30 rounded transition-colors text-mq-content-secondary hover:text-red-500"
                              title={t('delete')}
                              aria-label={t('delete')}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTodoNotification(todo.id);
                              }}
                              className={cn(
                                'p-1.5 rounded transition-colors',
                                todo.notificationEnabled
                                  ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 hover:bg-amber-200 dark:hover:bg-amber-900/40'
                                  : 'hover:bg-mq-hover-background text-mq-content-secondary hover:text-amber-500',
                              )}
                              title={
                                todo.notificationEnabled
                                  ? tOr('cancelReminder', 'Disable notification')
                                  : tOr('setReminder', 'Set reminder')
                              }
                              aria-label={
                                todo.notificationEnabled
                                  ? tOr('cancelReminder', 'Disable notification')
                                  : tOr('setReminder', 'Set reminder')
                              }
                            >
                              <Bell
                                className={cn(
                                  'h-3.5 w-3.5',
                                  todo.notificationEnabled && 'fill-current',
                                )}
                              />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </MagicCard>
      </div>
    </div>
  );
}
