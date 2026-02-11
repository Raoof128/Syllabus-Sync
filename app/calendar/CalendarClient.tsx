'use client';

import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import {
  Edit2,
  AlertTriangle,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/mq/button';
import DeadlineForm from '@/components/deadlines/DeadlineForm';
import { Deadline, Event, Todo, ClassTime } from '@/lib/types';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { cn } from '@/lib/utils';
import { UNIT_COLORS } from '@/lib/config';
import CalendarSidebar from '@/features/calendar/components/CalendarSidebar';
import CalendarWidgets from '@/features/calendar/components/CalendarWidgets';
import DayView from '@/features/calendar/components/DayView';
import AgendaView from '@/features/calendar/components/AgendaView';
import FilterPanel from '@/features/calendar/components/FilterPanel';
import dynamic from 'next/dynamic';

// Hooks
import { useCalendarData } from '@/features/calendar/hooks/useCalendarData';
import { useCalendarView } from '@/features/calendar/hooks/useCalendarView';
import { useCalendarFiltering } from '@/features/calendar/hooks/useCalendarFiltering';
import { useCalendarDialogs } from '@/features/calendar/hooks/useCalendarDialogs';
import { useCalendarHighlights } from '@/features/calendar/hooks/useCalendarHighlights';
import { useCalendarGetters } from '@/features/calendar/hooks/useCalendarGetters';

dayjs.extend(isoWeek);

// Dynamically import forms
const EventForm = dynamic(() => import('@/components/events/EventForm'), {
  loading: () => null,
});

const UnitForm = dynamic(() => import('@/components/units/UnitForm'), {
  loading: () => null,
});

const UnitDetailPanel = dynamic(() => import('@/components/units/UnitDetailPanel'), {
  loading: () => null,
});

const AssignmentForm = dynamic(() => import('@/components/assignments/AssignmentForm'), {
  loading: () => null,
});

const AssignmentDetailPanel = dynamic(
  () => import('@/components/assignments/AssignmentDetailPanel'),
  {
    loading: () => null,
  },
);

const ExamForm = dynamic(() => import('@/components/exams/ExamForm'), {
  loading: () => null,
});

const ExamDetailPanel = dynamic(() => import('@/components/exams/ExamDetailPanel'), {
  loading: () => null,
});

const EventDetailPanel = dynamic(() => import('@/components/events/EventDetailPanel'), {
  loading: () => null,
});

const TodoDetailPanel = dynamic(() => import('@/features/calendar/components/TodoDetailPanel'), {
  loading: () => null,
});

export default function CalendarClient() {
  const { t } = useTypedTranslation();
  const tOr = (key: TranslationKey, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  // 1. Data Hook
  const {
    deadlines,
    userEvents,
    units,
    todos,
    hasHydrated,
    removeDeadline,
    removeEvent,
    removeUnit,
    addTodo,
    removeTodo,
    updateTodo,
  } = useCalendarData();

  // 2. View Hook
  const {
    view,
    setView,
    currentWeekStart,
    mobileSelectedDayIndex,
    setMobileSelectedDayIndex,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
    weekDays,
  } = useCalendarView();

  // 3. Filtering Hook
  const {
    filters,
    setFilters,
    isFiltersOpen,
    handleToggleFilters,
    filteredUnits,
    filteredDeadlines,
    filteredEvents,
  } = useCalendarFiltering(units, deadlines, userEvents);

  // 4. Dialogs Hook
  const dialogs = useCalendarDialogs();
  const {
    // Dialog states
    deadlineDialogOpen,
    setDeadlineDialogOpen,
    editDeadline,
    assignmentDialogOpen,
    setAssignmentDialogOpen,
    editAssignment,
    examDialogOpen,
    setExamDialogOpen,
    editExam,
    eventDialogOpen,
    setEventDialogOpen,
    editEvent,
    setEditEvent,
    unitDialogOpen,
    setUnitDialogOpen,
    editingUnit,
    todoDialogOpen,
    setTodoDialogOpen,
    editingTodo,
    setEditingTodo,
    editTodoTitle,
    setEditTodoTitle,
    editTodoPriority,
    setEditTodoPriority,
    editTodoDueDate,
    setEditTodoDueDate,
    editTodoDueTime,
    setEditTodoDueTime,
    editTodoColor,
    setEditTodoColor,

    // Detail panel states
    unitDetailOpen,
    setUnitDetailOpen,
    selectedUnit,
    setSelectedUnit,
    assignmentDetailOpen,
    setAssignmentDetailOpen,
    selectedAssignment,
    setSelectedAssignment,
    examDetailOpen,
    setExamDetailOpen,
    selectedExam,
    setSelectedExam,
    eventDetailOpen,
    setEventDetailOpen,
    selectedEvent,
    todoDetailOpen,
    setTodoDetailOpen,
    selectedTodo,
    setSelectedTodo,

    // Delete confirm states
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    unitToDelete,
    setUnitToDelete,
    assignmentDeleteConfirmOpen,
    setAssignmentDeleteConfirmOpen,
    assignmentToDelete,
    setAssignmentToDelete,
    examDeleteConfirmOpen,
    setExamDeleteConfirmOpen,
    examToDelete,
    setExamToDelete,
    deadlineDeleteConfirmOpen,
    setDeadlineDeleteConfirmOpen,
    deadlineToDelete,
    setDeadlineToDelete,
    eventDeleteConfirmOpen,
    setEventDeleteConfirmOpen,
    eventToDelete,
    setEventToDelete,
    todoDeleteConfirmOpen,
    setTodoDeleteConfirmOpen,
    todoToDelete,
    setTodoToDelete,

    // Actions
    openEditDeadline,
    openAddAssignment,
    openEditAssignment,
    openAssignmentDetail,
    openAddExam,
    openEditExam,
    handleEventClick,
    openEditEvent,
    openAddTodo,
    openEditTodo,
    openAddUnit,
    openEditUnit,
    handleDeleteUnit,
  } = dialogs;

  // 5. Highlights Hook
  const { unitsWidgetRef, assignmentsWidgetRef, deadlineRefs, highlightedDeadlineId } =
    useCalendarHighlights(units, deadlines, userEvents, todos, hasHydrated, dialogs);

  // 6. Getters Hook
  const { formatDayNumber, formatMonthYear, formatWeekdayShort, formatTimeShort, formatLocalized } =
    useCalendarGetters(filteredUnits, filteredDeadlines, filteredEvents);

  // Local Helpers
  const handleDeleteAssignment = (assignment: Deadline) => {
    setAssignmentToDelete(assignment);
    setAssignmentDeleteConfirmOpen(true);
  };

  const confirmDeleteAssignment = () => {
    if (assignmentToDelete) {
      removeDeadline(assignmentToDelete.id);
      setAssignmentDeleteConfirmOpen(false);
      setAssignmentToDelete(null);
    }
  };

  const handleDeleteExam = (exam: Deadline) => {
    setExamToDelete(exam);
    setExamDeleteConfirmOpen(true);
  };

  const confirmDeleteExam = () => {
    if (examToDelete) {
      removeDeadline(examToDelete.id);
      setExamDeleteConfirmOpen(false);
      setExamToDelete(null);
    }
  };

  const confirmDeleteDeadline = () => {
    if (deadlineToDelete) {
      removeDeadline(deadlineToDelete.id);
      setDeadlineDeleteConfirmOpen(false);
      setDeadlineToDelete(null);
    }
  };

  const handleDeleteEvent = (event: Event) => {
    setEventToDelete(event);
    setEventDeleteConfirmOpen(true);
  };

  const confirmDeleteEvent = () => {
    if (eventToDelete) {
      removeEvent(eventToDelete.id);
      setEventDeleteConfirmOpen(false);
      setEventToDelete(null);
    }
  };

  const handleDeleteTodo = (todo: Todo) => {
    setTodoToDelete({ id: todo.id, title: todo.title });
    setTodoDeleteConfirmOpen(true);
  };

  const handleNotifyTodo = (_todo: Todo) => {
    // Notification logic would go here
  };

  const confirmDeleteUnit = () => {
    if (unitToDelete) {
      removeUnit(unitToDelete.id);
      setDeleteConfirmOpen(false);
      setUnitToDelete(null);
    }
  };

  const handleEditDeadlineFromPanel = (deadline: Deadline) => {
    if (deadline.type === 'Exam' || deadline.type === 'Quiz') {
      openEditExam(deadline);
    } else {
      openEditAssignment(deadline);
    }
  };

  const handleUnitDetailOpenChange = (open: boolean) => {
    setUnitDetailOpen(open);
  };

  // Get unit schedules for a specific day (used in mobile view/helpers)
  const getUnitsForDay = (date: Date) => {
    const dayName = dayjs(date).locale('en').format('dddd');
    return filteredUnits.flatMap((unit) =>
      unit.schedule
        .filter((s: ClassTime) => s.day === dayName)
        .map((s: ClassTime) => ({ ...unit, schedule: [s] })),
    );
  };

  const getItemsForDay = (date: Date) => {
    const dayDeadlines = filteredDeadlines.filter((d) => dayjs(d.dueDate).isSame(date, 'day'));
    const dayEvents = filteredEvents.filter((e) => {
      const eventDate = e.startAt || e.date;
      return dayjs(eventDate).isSame(date, 'day');
    });
    return { dayDeadlines, dayEvents };
  };

  if (!hasHydrated) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-mq-background">
      {/* Mobile Header (Date Selector) */}
      <div className="md:hidden flex flex-col bg-mq-card-background border-b border-mq-border sticky top-0 z-20">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-mq-content">
            {formatMonthYear(dayjs(currentWeekStart).add(mobileSelectedDayIndex, 'day').toDate())}
          </h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              {t('today')}
            </Button>
            <Button variant="ghost" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Days Row */}
        <div className="flex overflow-x-auto pb-2 px-2 gap-2 scrollbar-hide">
          {weekDays.map((date, index) => {
            const isSelected = index === mobileSelectedDayIndex;
            const isToday = dayjs(date).isSame(dayjs(), 'day');

            return (
              <button
                key={index}
                onClick={() => setMobileSelectedDayIndex(index)}
                className={cn(
                  'flex flex-col items-center justify-center min-w-[3.5rem] py-2 rounded-lg transition-colors',
                  isSelected
                    ? 'bg-mq-primary text-white'
                    : 'bg-mq-background text-mq-content hover:bg-mq-background-hover',
                  isToday && !isSelected && 'border border-mq-primary text-mq-primary',
                )}
              >
                <span className="text-xs font-medium opacity-80">{formatWeekdayShort(date)}</span>
                <span className="text-lg font-bold">{formatDayNumber(date)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block sticky top-0 z-30 bg-mq-background pb-4 pt-6 px-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-mq-content">
                {formatMonthYear(currentWeekStart)}
              </h1>
              <p className="text-mq-content-secondary mt-1">
                {t('weekOf')}{' '}
                {formatLocalized(currentWeekStart, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-mq-card-background rounded-lg p-1 border border-mq-border">
                <Button
                  variant={view === 'week' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setView('week')}
                  className="text-sm"
                >
                  {t('weekView')}
                </Button>
                <Button
                  variant={view === 'day' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setView('day')}
                  className="text-sm"
                >
                  {t('dayView')}
                </Button>
                <Button
                  variant={view === 'agenda' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setView('agenda')}
                  className="text-sm"
                >
                  {t('agendaView')}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  {t('today')}
                </Button>
                <Button variant="outline" size="icon" onClick={goToNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant={isFiltersOpen ? 'secondary' : 'outline'}
                onClick={handleToggleFilters}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                {t('filter')}
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <FilterPanel
              filters={filters}
              onFilterChange={setFilters}
              isOpen={isFiltersOpen}
              onClose={handleToggleFilters}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-24 md:pb-6 scrollbar-hide">
          {/* Week View */}
          {view === 'week' && (
            <ScrollReveal>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4 min-h-[calc(100vh-200px)]">
                {weekDays.map((date, index) => {
                  const { dayDeadlines, dayEvents } = getItemsForDay(date);
                  const dayUnits = getUnitsForDay(date);
                  const isToday = dayjs(date).isSame(dayjs(), 'day');

                  return (
                    <div
                      key={index}
                      className={cn(
                        'flex flex-col gap-2 p-3 rounded-xl border min-h-[150px] transition-colors',
                        isToday
                          ? 'bg-mq-primary/5 border-mq-primary/20'
                          : 'bg-mq-card-background border-mq-border hover:border-mq-primary/30',
                      )}
                    >
                      <div className="flex flex-col items-center mb-2">
                        <span className="text-xs font-medium text-mq-content-secondary uppercase">
                          {formatWeekdayShort(date)}
                        </span>
                        <span
                          className={cn(
                            'text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full mt-1',
                            isToday ? 'bg-mq-primary text-white' : 'text-mq-content',
                          )}
                        >
                          {formatDayNumber(date)}
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col gap-2">
                        {/* Units */}
                        {dayUnits.map((item) => (
                          <div
                            key={`unit-${item.id}-${(item.schedule[0] as ClassTime).startTime}`}
                            onClick={() => {
                              setSelectedUnit(item);
                              setUnitDetailOpen(true);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setSelectedUnit(item);
                                setUnitDetailOpen(true);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            className="text-xs p-2 rounded-lg bg-mq-background border border-mq-border cursor-pointer hover:border-mq-primary transition-colors group"
                            style={{ borderLeftColor: item.color, borderLeftWidth: '3px' }}
                          >
                            <div className="font-semibold truncate">{item.code}</div>
                            <div className="text-[10px] text-mq-content-secondary truncate">
                              {item.location?.building} {item.location?.room}
                            </div>
                            <div className="text-[10px] text-mq-content-secondary mt-1 group-hover:text-mq-primary">
                              {(item.schedule[0] as ClassTime).startTime}
                            </div>
                          </div>
                        ))}

                        {/* Deadlines */}
                        {dayDeadlines.map((deadline) => (
                          <div
                            key={deadline.id}
                            ref={(el) => {
                              if (el && deadlineRefs.current) {
                                deadlineRefs.current.set(deadline.id, el);
                              }
                            }}
                            onClick={() => {
                              if (deadline.type === 'Exam' || deadline.type === 'Quiz') {
                                setSelectedExam(deadline);
                                setExamDetailOpen(true);
                              } else {
                                setSelectedAssignment(deadline);
                                setAssignmentDetailOpen(true);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                if (deadline.type === 'Exam' || deadline.type === 'Quiz') {
                                  setSelectedExam(deadline);
                                  setExamDetailOpen(true);
                                } else {
                                  setSelectedAssignment(deadline);
                                  setAssignmentDetailOpen(true);
                                }
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            className={cn(
                              'text-xs p-2 rounded-lg border cursor-pointer transition-all',
                              highlightedDeadlineId === deadline.id
                                ? 'ring-2 ring-mq-primary shadow-lg scale-[1.02]'
                                : 'hover:scale-[1.02]',
                            )}
                            style={{
                              backgroundColor: `${deadline.type === 'Exam' ? '#ef4444' : '#3b82f6'}15`,
                              borderColor: `${deadline.type === 'Exam' ? '#ef4444' : '#3b82f6'}30`,
                              borderLeftWidth: '3px',
                              borderLeftColor: deadline.type === 'Exam' ? '#ef4444' : '#3b82f6',
                            }}
                          >
                            <div className="font-medium truncate">{deadline.title}</div>
                            <div className="flex items-center gap-1 text-[10px] text-mq-content-secondary mt-1">
                              <Clock className="h-3 w-3" />
                              {formatTimeShort(new Date(deadline.dueDate))}
                            </div>
                          </div>
                        ))}

                        {/* Events */}
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            onClick={() => handleEventClick(event)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleEventClick(event);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            className="text-xs p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 border-l-emerald-500 border-l-[3px] cursor-pointer hover:bg-emerald-500/20 transition-colors"
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            {event.startAt && (
                              <div className="text-[10px] text-mq-content-secondary mt-1">
                                {formatTimeShort(new Date(event.startAt))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollReveal>
          )}

          {/* Day View */}
          {view === 'day' && (
            <DayView
              date={dayjs(currentWeekStart).add(mobileSelectedDayIndex, 'day').toDate()}
              units={filteredUnits}
              deadlines={filteredDeadlines}
              events={filteredEvents}
              onUnitClick={(u) => {
                setSelectedUnit(u);
                setUnitDetailOpen(true);
              }}
              onDeadlineClick={(d) => openEditDeadline(d)}
              onEventClick={handleEventClick}
            />
          )}

          {/* Agenda View */}
          {view === 'agenda' && (
            <AgendaView
              date={currentWeekStart}
              units={filteredUnits}
              deadlines={filteredDeadlines}
              events={filteredEvents}
              onUnitClick={(u) => {
                setSelectedUnit(u);
                setUnitDetailOpen(true);
              }}
              onDeadlineClick={(d) => openEditDeadline(d)}
              onEventClick={handleEventClick}
            />
          )}
        </div>

        {/* Sticky Sidebar with Widgets */}
        <CalendarSidebar>
          <CalendarWidgets
            onAddAssignment={openAddAssignment}
            onEditAssignment={openEditAssignment}
            onOpenAssignmentDetail={openAssignmentDetail}
            onAddExam={openAddExam}
            onEditExam={openEditExam}
            onOpenExamDetail={(exam) => {
              setSelectedExam(exam);
              setExamDetailOpen(true);
            }}
            onAddUnit={openAddUnit}
            onEditUnit={openEditUnit}
            onOpenUnitDetail={(u) => {
              setSelectedUnit(u);
              setUnitDetailOpen(true);
            }}
            onDeleteUnit={handleDeleteUnit}
            onAddEvent={() => {
              setEditEvent(null);
              setEventDialogOpen(true);
            }}
            onEditEvent={openEditEvent}
            onOpenEventDetail={handleEventClick}
            onDeleteEvent={handleDeleteEvent}
            onDeleteAssignment={handleDeleteAssignment}
            onDeleteExam={handleDeleteExam}
            onEditTodo={openEditTodo}
            onAddTodo={openAddTodo}
            onOpenTodoDetail={(todo) => {
              setSelectedTodo(todo);
              setTodoDetailOpen(true);
            }}
            onDeleteTodo={handleDeleteTodo}
            onNotifyTodo={handleNotifyTodo}
            unitsWidgetRef={unitsWidgetRef as React.RefObject<HTMLDivElement>}
            assignmentsWidgetRef={assignmentsWidgetRef as React.RefObject<HTMLDivElement>}
          />
        </CalendarSidebar>
      </div>

      {/* Deadline Form Dialog */}
      <DeadlineForm
        open={deadlineDialogOpen}
        onOpenChange={setDeadlineDialogOpen}
        editDeadline={editDeadline}
      />

      {/* Assignment Form Dialog */}
      <AssignmentForm
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        editAssignment={editAssignment}
      />

      {/* Exam Form Dialog */}
      <ExamForm open={examDialogOpen} onOpenChange={setExamDialogOpen} editExam={editExam} />

      {/* Event Form Dialog */}
      <EventForm open={eventDialogOpen} onOpenChange={setEventDialogOpen} editEvent={editEvent} />

      {/* Unit Form Dialog */}
      <UnitForm open={unitDialogOpen} onOpenChange={setUnitDialogOpen} editUnit={editingUnit} />

      {/* Unit Detail Panel */}
      <UnitDetailPanel
        unit={selectedUnit}
        open={unitDetailOpen}
        onOpenChange={handleUnitDetailOpenChange}
        onEditDeadline={handleEditDeadlineFromPanel}
        onEditUnit={() => {
          if (selectedUnit) {
            handleUnitDetailOpenChange(false);
            openEditUnit(selectedUnit);
          }
        }}
        onDeleteUnit={() => {
          if (selectedUnit) {
            handleUnitDetailOpenChange(false);
            handleDeleteUnit(selectedUnit);
          }
        }}
      />

      {/* Delete Confirmation Modal for Units */}
      {deleteConfirmOpen && unitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/60 backdrop-blur-0 dark:backdrop-blur-sm p-4">
          <div className="bg-mq-background dark:bg-mq-card-background border border-mq-border rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-mq-content">{t('deleteUnitConfirm')}</h3>
                <p className="text-sm text-mq-content-secondary">
                  {unitToDelete.code} - {unitToDelete.name}
                </p>
              </div>
            </div>
            <p className="text-sm text-mq-content-secondary mb-6">{t('deleteUnitConfirmDesc')}</p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setUnitToDelete(null);
                }}
              >
                {t('cancelAction')}
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteUnit}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {t('confirmDelete')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Assignments */}
      {assignmentDeleteConfirmOpen && assignmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/60 backdrop-blur-0 dark:backdrop-blur-sm p-4">
          <div className="bg-mq-background dark:bg-mq-card-background border border-mq-border rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-mq-content">
                  {t('deleteAssignmentConfirm' as TranslationKey) || 'Delete Assignment?'}
                </h3>
                <p className="text-sm text-mq-content-secondary">{assignmentToDelete.title}</p>
              </div>
            </div>
            <p className="text-sm text-mq-content-secondary mb-6">
              {t('deleteAssignmentConfirmDesc' as TranslationKey) ||
                'This action cannot be undone. Are you sure you want to delete this assignment?'}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setAssignmentDeleteConfirmOpen(false);
                  setAssignmentToDelete(null);
                }}
              >
                {t('cancelAction')}
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteAssignment}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {t('confirmDelete')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Exams */}
      {examDeleteConfirmOpen && examToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/60 backdrop-blur-0 dark:backdrop-blur-sm p-4">
          <div className="bg-mq-background dark:bg-mq-card-background border border-mq-border rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-mq-content">
                  {t('deleteExamConfirm' as TranslationKey) || 'Delete Exam?'}
                </h3>
                <p className="text-sm text-mq-content-secondary">{examToDelete.title}</p>
              </div>
            </div>
            <p className="text-sm text-mq-content-secondary mb-6">
              {t('deleteExamConfirmDesc' as TranslationKey) ||
                'This action cannot be undone. Are you sure you want to delete this exam?'}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setExamDeleteConfirmOpen(false);
                  setExamToDelete(null);
                }}
              >
                {t('cancelAction')}
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteExam}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {t('confirmDelete')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Deadlines */}
      {deadlineDeleteConfirmOpen && deadlineToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/60 backdrop-blur-0 dark:backdrop-blur-sm p-4">
          <div className="bg-mq-background dark:bg-mq-card-background border border-mq-border rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-mq-content">
                  {t('deleteDeadlineConfirm' as TranslationKey) || 'Delete Deadline?'}
                </h3>
                <p className="text-sm text-mq-content-secondary">{deadlineToDelete.title}</p>
              </div>
            </div>
            <p className="text-sm text-mq-content-secondary mb-6">
              {t('deleteDeadlineConfirmDesc' as TranslationKey) ||
                'This action cannot be undone. Are you sure you want to delete this deadline?'}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeadlineDeleteConfirmOpen(false);
                  setDeadlineToDelete(null);
                }}
              >
                {t('cancelAction')}
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteDeadline}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {t('confirmDelete')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Events */}
      {eventDeleteConfirmOpen && eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/60 backdrop-blur-0 dark:backdrop-blur-sm p-4">
          <div className="bg-mq-background dark:bg-mq-card-background border border-mq-border rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-mq-content">
                  {t('deleteEventConfirm' as TranslationKey) || 'Delete Event?'}
                </h3>
                <p className="text-sm text-mq-content-secondary">{eventToDelete.title}</p>
              </div>
            </div>
            <p className="text-sm text-mq-content-secondary mb-6">
              {t('deleteEventConfirmDesc' as TranslationKey) ||
                'This action cannot be undone. Are you sure you want to delete this event?'}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setEventDeleteConfirmOpen(false);
                  setEventToDelete(null);
                }}
              >
                {t('cancelAction')}
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteEvent}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {t('confirmDelete')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Todos */}
      {todoDeleteConfirmOpen && todoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/60 backdrop-blur-0 dark:backdrop-blur-sm p-4">
          <div className="bg-mq-background dark:bg-mq-card-background border border-mq-border rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-mq-content">
                  {tOr('deleteTodoConfirm', 'Delete Task?')}
                </h3>
                <p className="text-sm text-mq-content-secondary">{todoToDelete.title}</p>
              </div>
            </div>
            <p className="text-sm text-mq-content-secondary mb-6">
              {tOr(
                'deleteTodoConfirmDesc',
                'This action cannot be undone. Are you sure you want to delete this task?',
              )}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setTodoDeleteConfirmOpen(false);
                  setTodoToDelete(null);
                }}
              >
                {t('cancelAction')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (todoToDelete) {
                    removeTodo(todoToDelete.id);
                    setTodoDeleteConfirmOpen(false);
                    setTodoToDelete(null);
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {t('confirmDelete')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Todo Modal */}
      {todoDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/60 backdrop-blur-0 dark:backdrop-blur-sm p-4">
          <div className="bg-mq-background dark:bg-mq-card-background border border-mq-border rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                <Edit2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-mq-content">
                  {editingTodo ? tOr('editTodo', 'Edit Task') : tOr('addTodo', 'Add Task')}
                </h3>
              </div>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (editTodoTitle.trim() && editTodoDueDate) {
                  // Build due date (required)
                  const dueDate = new Date(editTodoDueDate);
                  if (editTodoDueTime) {
                    const [hours, minutes] = editTodoDueTime.split(':').map(Number);
                    dueDate.setHours(hours, minutes, 0, 0);
                  } else {
                    dueDate.setHours(23, 59, 59, 999);
                  }

                  if (editingTodo) {
                    await updateTodo(editingTodo.id, {
                      title: editTodoTitle.trim(),
                      priority: editTodoPriority,
                      dueDate,
                      color: editTodoColor,
                    });
                  } else {
                    await addTodo({
                      title: editTodoTitle.trim(),
                      priority: editTodoPriority,
                      dueDate,
                      color: editTodoColor,
                    });
                  }

                  setTodoDialogOpen(false);
                  setEditingTodo(null);
                  setEditTodoTitle('');
                  setEditTodoPriority('Medium');
                  setEditTodoDueDate('');
                  setEditTodoDueTime('');
                  setEditTodoColor('#10b981');
                }
              }}
              className="space-y-4"
            >
              {/* Task Title - Required */}
              <div>
                <label
                  htmlFor="edit-todo-title"
                  className="block text-sm font-medium text-mq-content mb-1"
                >
                  {tOr('taskTitle', 'Task Title')} <span className="text-mq-error">*</span>
                </label>
                <input
                  id="edit-todo-title"
                  type="text"
                  value={editTodoTitle}
                  onChange={(e) => setEditTodoTitle(e.target.value)}
                  placeholder={tOr('enterTaskTitle', 'Enter task title...')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-mq-border bg-mq-background focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  autoFocus
                  required
                />
              </div>

              {/* Priority */}
              <div>
                <label
                  htmlFor="edit-todo-priority"
                  className="block text-sm font-medium text-mq-content mb-1"
                >
                  {tOr('priority', 'Priority')}
                </label>
                <select
                  id="edit-todo-priority"
                  value={editTodoPriority}
                  onChange={(e) => setEditTodoPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                  className={cn(
                    'w-full px-3 py-2 text-sm rounded-lg border border-mq-border bg-mq-background focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
                    editTodoPriority === 'High' && 'text-red-600 dark:text-red-400',
                    editTodoPriority === 'Medium' && 'text-amber-600 dark:text-amber-400',
                    editTodoPriority === 'Low' && 'text-emerald-600 dark:text-emerald-400',
                  )}
                >
                  <option value="High">{tOr('priorityHigh', 'High')}</option>
                  <option value="Medium">{tOr('priorityMedium', 'Medium')}</option>
                  <option value="Low">{tOr('priorityLow', 'Low')}</option>
                </select>
              </div>

              {/* Due Date and Time - Required */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-mq-content">
                  {tOr('dueDateTime', 'Due Date & Time')} <span className="text-mq-error">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <Calendar className="h-4 w-4 text-mq-content-secondary shrink-0" />
                    <input
                      type="date"
                      value={editTodoDueDate}
                      onChange={(e) => setEditTodoDueDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-mq-border bg-mq-background focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      aria-label={tOr('selectDueDate', 'Select due date')}
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-32">
                    <input
                      type="time"
                      value={editTodoDueTime}
                      onChange={(e) => setEditTodoDueTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-mq-border bg-mq-background focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      aria-label={tOr('selectDueTime', 'Select due time')}
                    />
                  </div>
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-mq-content mb-2">
                  {tOr('color', 'Color')}
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 px-2 pt-2 scrollbar-thin scrollbar-thumb-mq-border">
                  {UNIT_COLORS.map((colorOption) => (
                    <button
                      key={colorOption.value}
                      type="button"
                      onClick={() => setEditTodoColor(colorOption.value)}
                      className={cn(
                        'w-8 h-8 rounded-full border transition-transform hover:scale-110',
                        editTodoColor === colorOption.value
                          ? 'ring-2 ring-offset-2 ring-offset-mq-background ring-mq-primary scale-110'
                          : 'border-transparent',
                      )}
                      style={{ backgroundColor: colorOption.value }}
                      aria-label={`Select color ${colorOption.name}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setTodoDialogOpen(false);
                    setEditingTodo(null);
                  }}
                >
                  {t('cancelAction')}
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {editingTodo ? tOr('saveChanges', 'Save Changes') : tOr('addTodo', 'Add Task')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Todo Detail Panel */}
      <TodoDetailPanel
        todo={selectedTodo}
        open={todoDetailOpen}
        onOpenChange={setTodoDetailOpen}
        onEdit={(todo) => {
          setTodoDetailOpen(false);
          openEditTodo(todo);
        }}
        onDelete={(todo) => {
          setTodoDetailOpen(false);
          handleDeleteTodo(todo);
        }}
      />

      {/* Assignment Detail Panel */}
      <AssignmentDetailPanel
        assignment={selectedAssignment}
        open={assignmentDetailOpen}
        onOpenChange={setAssignmentDetailOpen}
        onEdit={(assignment) => {
          setAssignmentDetailOpen(false);
          openEditAssignment(assignment);
        }}
        onDelete={(assignment) => {
          setAssignmentDetailOpen(false);
          handleDeleteAssignment(assignment);
        }}
      />

      {/* Exam Detail Panel */}
      <ExamDetailPanel
        exam={selectedExam}
        open={examDetailOpen}
        onOpenChange={setExamDetailOpen}
        onEdit={(exam) => {
          setExamDetailOpen(false);
          openEditExam(exam);
        }}
        onDelete={(exam) => {
          setExamDetailOpen(false);
          handleDeleteExam(exam);
        }}
      />

      {/* Event Detail Panel */}
      <EventDetailPanel
        event={selectedEvent}
        open={eventDetailOpen}
        onOpenChange={setEventDetailOpen}
        onEdit={(event) => {
          setEventDetailOpen(false);
          openEditEvent(event);
        }}
        onDelete={(event) => {
          setEventDetailOpen(false);
          handleDeleteEvent(event);
        }}
      />
    </div>
  );
}
