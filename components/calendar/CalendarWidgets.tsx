'use client';

import React, { useRef, useEffect, useMemo } from 'react';
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
import ItemActionButtons from '@/components/calendar/ItemActionButtons';
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
  onNotifyTodo,
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
  const units = useUnitsStore((state) => state.units);
  const events = useEventsStore((state) => state.events);

  // Todo Store
  const todos = useTodosStore((state) => state.todos);
  const toggleTodoComplete = useTodosStore((state) => state.toggleComplete);
  const deleteTodo = useTodosStore((state) => state.removeTodo);

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
  const unitsWidgetRef = useRef<HTMLDivElement>(null);
  const assignmentsWidgetRef = useRef<HTMLDivElement>(null);

  // URL Highlights
  const highlightedDeadlineId = searchParams.get('highlightDeadline');
  const highlightedUnitId = searchParams.get('highlightUnit');
  const highlightedWidget = searchParams.get('highlightWidget');
  const deadlineHighlightActive = Boolean(highlightedDeadlineId);

  // Scroll Effects
  useEffect(() => {
    if (highlightedDeadlineId && assignmentsWidgetRef.current) {
      setTimeout(() => {
        assignmentsWidgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [highlightedDeadlineId]);

  useEffect(() => {
    if ((highlightedUnitId || highlightedWidget === 'units') && unitsWidgetRef.current) {
      setTimeout(() => {
        unitsWidgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [highlightedUnitId, highlightedWidget]);

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
                              onEdit={() => onEditAssignment(assignment)}
                              onDelete={() => onDeleteAssignment(assignment)}
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
          <div className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border">
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
                              onEdit={() => onEditExam(exam)}
                              onDelete={() => onDeleteExam(exam)}
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
                          highlightedUnitId === unit.id && 'border-mq-primary bg-mq-primary/5',
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
                          onEdit={() => onEditUnit(unit)}
                          onDelete={() => onDeleteUnit(unit)}
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
        <MagicCard isLiquidEnhanced>
          <div className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border">
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

                      return (
                        <div
                          key={event.id}
                          className="group flex items-center gap-3 p-2.5 rounded-md border-l-4 border border-mq-border bg-mq-background-secondary transition-all cursor-pointer hover:bg-mq-surface hover:shadow-sm"
                          style={{ borderLeftColor: eventColor, borderLeftWidth: '4px' }}
                          onClick={() => onOpenEventDetail(event)}
                          onKeyDown={(e) => handleKeyDown(e, () => onOpenEventDetail(event))}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{event.title}</h4>
                            <p className="text-[11px] text-mq-content-secondary truncate">
                              {event.time} • {event.location}
                            </p>
                          </div>
                          <ItemActionButtons
                            itemType="event"
                            itemId={event.id}
                            itemTitle={event.title}
                            building={event.building}
                            room={event.room}
                            dateTime={event.startAt || event.date}
                            onEdit={() => onEditEvent(event)}
                            onDelete={() => onDeleteEvent(event)}
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
        <MagicCard isLiquidEnhanced>
          <div className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border">
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

                      return (
                        <div
                          key={todo.id}
                          className={cn(
                            'group flex items-center gap-3 p-2.5 rounded-md border-l-4 border border-mq-border bg-mq-background-secondary transition-all cursor-pointer hover:bg-mq-surface hover:shadow-sm',
                            todo.completed && 'opacity-60 grayscale',
                            isOverdue && 'bg-red-500/5',
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
                          {/* Action buttons - Bell, Trash, Edit order as per requirements */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onNotifyTodo?.(todo);
                              }}
                              className="p-1.5 hover:bg-mq-hover-background rounded transition-colors text-mq-content-secondary hover:text-amber-500"
                              title={tOr('setReminder', 'Set reminder')}
                              aria-label={tOr('setReminder', 'Set reminder')}
                            >
                              <Bell className="h-3.5 w-3.5" />
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
                                onEditTodo(todo);
                              }}
                              className="p-1.5 hover:bg-mq-hover-background rounded transition-colors text-mq-content-secondary hover:text-mq-primary"
                              title={tOr('editTodo', 'Edit')}
                              aria-label={tOr('editTodo', 'Edit todo')}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
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
