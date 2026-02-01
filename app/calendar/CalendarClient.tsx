'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import {
  Edit2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  Clock,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/mq/button';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useEventsStore } from '@/lib/store/eventsStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useTodosStore } from '@/lib/store/todosStore';
import DeadlineForm from '@/components/deadlines/DeadlineForm';
import { Deadline, Event, Unit, Todo } from '@/lib/types';
import { useHydration } from '@/lib/hooks';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
// Events are now loaded from Supabase via eventsStore (no more sampleEvents import)
import {
  getMQKeyDatesForDay,
  MQ_DATE_COLORS,
  PROGRAM_STYLES,
  PROGRAM_LABELS,
} from '@/data/mqKeyDates';
import dynamic from 'next/dynamic';
import { formatLocalizedDate, formatLocation } from '@/lib/utils/locale';
import { toastUtils } from '@/lib/utils/toast';
import { cn } from '@/lib/utils';
import CalendarHeader, { CalendarView } from '@/components/calendar/CalendarHeader';
import CalendarSidebar from '@/components/calendar/CalendarSidebar';
import CalendarWidgets from '@/components/calendar/CalendarWidgets';
import ProgramLegend from '@/components/calendar/ProgramLegend';
import DayView from '@/components/calendar/DayView';
import AgendaView from '@/components/calendar/AgendaView';
import FilterPanel, { CalendarFilters } from '@/components/calendar/FilterPanel';

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

const TodoDetailPanel = dynamic(() => import('@/components/calendar/TodoDetailPanel'), {
  loading: () => null,
});

import {
  HOURS,
  HOUR_HEIGHT,
  START_HOUR,
  getEventColors,
  getDeadlineColor,
  parseTimeRange,
  getTimePositionAndHeight,
  calculateOverlapGroups,
  CalendarItem,
} from '@/lib/calendar-utils';

export default function CalendarClient() {
  const searchParams = useSearchParams();
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const removeDeadline = useDeadlinesStore((state) => state.removeDeadline);
  const removeDeadlinesByUnit = useDeadlinesStore((state) => state.removeDeadlinesByUnit);
  const userEvents = useEventsStore((state) => state.events);
  const removeEvent = useEventsStore((state) => state.removeEvent);
  const units = useUnitsStore((state) => state.units);
  const removeUnit = useUnitsStore((state) => state.removeUnit);

  const addTodo = useTodosStore((state) => state.addTodo);
  const removeTodo = useTodosStore((state) => state.removeTodo);
  const updateTodo = useTodosStore((state) => state.updateTodo);

  const hasHydrated = useHydration();
  const { language, t } = useTypedTranslation();
  const tOr = (key: TranslationKey, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  // Calendar View State
  const [view, setView] = useState<CalendarView>('week');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<CalendarFilters>({
    showUnits: true,
    showDeadlines: true,
    showEvents: true,
    showCompleted: false,
  });

  // Filter Data
  const filteredUnits = useMemo(() => {
    return filters.showUnits ? units : [];
  }, [units, filters.showUnits]);

  const filteredDeadlines = useMemo(() => {
    if (!filters.showDeadlines) return [];
    if (!filters.showCompleted) return deadlines.filter((x) => !x.completed);
    return deadlines;
  }, [deadlines, filters.showDeadlines, filters.showCompleted]);

  const filteredEvents = useMemo(() => {
    return filters.showEvents ? userEvents : [];
  }, [userEvents, filters.showEvents]);

  // Dialog states
  const [deadlineDialogOpen, setDeadlineDialogOpen] = useState(false);
  const [editDeadline, setEditDeadline] = useState<Deadline | null>(null);

  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState<Deadline | null>(null);

  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [editExam, setEditExam] = useState<Deadline | null>(null);

  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);

  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Unit detail panel state
  const [unitDetailOpen, setUnitDetailOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  // Delete confirmation modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);

  // Delete confirmation state for assignments
  const [assignmentDeleteConfirmOpen, setAssignmentDeleteConfirmOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Deadline | null>(null);

  // Delete confirmation state for exams
  const [examDeleteConfirmOpen, setExamDeleteConfirmOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Deadline | null>(null);

  // Delete confirmation state for deadlines
  const [deadlineDeleteConfirmOpen, setDeadlineDeleteConfirmOpen] = useState(false);
  const [deadlineToDelete, setDeadlineToDelete] = useState<Deadline | null>(null);

  // Delete confirmation state for events
  const [eventDeleteConfirmOpen, setEventDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  const [todoDeleteConfirmOpen, setTodoDeleteConfirmOpen] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<{ id: string; title: string } | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [todoDialogOpen, setTodoDialogOpen] = useState(false);
  const [editTodoTitle, setEditTodoTitle] = useState('');
  const [editTodoPriority, setEditTodoPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [editTodoDueDate, setEditTodoDueDate] = useState('');
  const [editTodoDueTime, setEditTodoDueTime] = useState('');

  // Assignment detail panel state
  const [assignmentDetailOpen, setAssignmentDetailOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Deadline | null>(null);

  // Exam detail panel state
  const [examDetailOpen, setExamDetailOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Deadline | null>(null);

  // Event detail panel state
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Todo detail panel state
  const [todoDetailOpen, setTodoDetailOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  const unitsWidgetRef = useRef<HTMLDivElement>(null);
  const assignmentsWidgetRef = useRef<HTMLDivElement>(null);

  // Highlighted unit derived from URL query parameter
  const highlightedUnitId = useMemo(() => searchParams.get('highlightUnit'), [searchParams]);
  const highlightedUnit = useMemo(() => {
    if (!highlightedUnitId) return null;
    return units.find((unit) => unit.id === highlightedUnitId) ?? null;
  }, [highlightedUnitId, units]);

  // Highlighted deadline derived from URL query parameter
  const highlightedDeadlineId = useMemo(
    () => searchParams.get('highlightDeadline'),
    [searchParams],
  );
  const deadlineHighlightActive = Boolean(highlightedDeadlineId);
  const deadlineRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Handle highlighted deadline side effects (scroll + show detail panel)
  useEffect(() => {
    if (!highlightedDeadlineId) {
      return;
    }

    // Find the highlighted deadline
    const highlightedDeadline = deadlines.find((d) => d.id === highlightedDeadlineId);

    // Scroll to assignments widget and open detail panel
    const scrollTimer = window.setTimeout(() => {
      // First scroll to the assignments widget
      if (assignmentsWidgetRef.current) {
        assignmentsWidgetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // Then scroll to the specific deadline item if it exists in calendar view
      const deadlineElement = deadlineRefs.current.get(highlightedDeadlineId);
      if (deadlineElement) {
        setTimeout(() => {
          deadlineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 400);
      }

      // Open the assignment detail panel
      if (highlightedDeadline) {
        setSelectedAssignment(highlightedDeadline);
        setAssignmentDetailOpen(true);
      }

      // Clear the URL parameter after capturing state (panel will stay open)
      const url = new URL(window.location.href);
      url.searchParams.delete('highlightDeadline');
      window.history.replaceState({}, '', url.toString());
    }, 300);

    return () => {
      clearTimeout(scrollTimer);
    };
  }, [highlightedDeadlineId, deadlines]);

  // Track if we've already opened the unit panel for this highlight (to prevent re-opening)
  const processedUnitHighlightRef = useRef<string | null>(null);

  // Handle highlighted unit - open the detail panel when a unit is highlighted via URL
  useEffect(() => {
    if (
      highlightedUnitId &&
      highlightedUnit &&
      processedUnitHighlightRef.current !== highlightedUnitId
    ) {
      processedUnitHighlightRef.current = highlightedUnitId;

      // Use a microtask to avoid the lint warning about setState in effect
      queueMicrotask(() => {
        setSelectedUnit(highlightedUnit);
        setUnitDetailOpen(true);

        // Clear the URL parameter immediately (we've captured the state)
        const url = new URL(window.location.href);
        url.searchParams.delete('highlightUnit');
        window.history.replaceState({}, '', url.toString());
      });
    }
  }, [highlightedUnitId, highlightedUnit]);

  // Use selectedUnit for the panel (no longer depends on URL)
  const effectiveSelectedUnit = selectedUnit;
  const effectiveUnitDetailOpen = unitDetailOpen;

  const handleUnitDetailOpenChange = useCallback((open: boolean) => {
    setUnitDetailOpen(open);
  }, []);

  // Highlighted widget derived from URL query parameter (e.g., "units" for My Units widget)
  const highlightedWidget = useMemo(() => searchParams.get('highlightWidget'), [searchParams]);

  // Handle highlighted widget side effects (scroll + auto-clear URL)
  useEffect(() => {
    if (!highlightedWidget) return;

    const scrollTimer = window.setTimeout(() => {
      if (highlightedWidget === 'units') {
        unitsWidgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    // Clear highlight and URL parameter after 3 seconds
    const clearTimer = window.setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete('highlightWidget');
      window.history.replaceState({}, '', url.toString());
    }, 3000);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [highlightedWidget]);

  // Scroll to units widget when highlighted via URL (URL clearing is handled in the panel open effect)
  useEffect(() => {
    if (!highlightedUnitId) return;

    const scrollTimer = window.setTimeout(() => {
      unitsWidgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    return () => {
      clearTimeout(scrollTimer);
    };
  }, [highlightedUnitId]);

  // Get date from URL parameter if provided
  const urlDate = useMemo(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const parsed = dayjs(dateParam);
      if (parsed.isValid()) {
        return parsed;
      }
    }
    return null;
  }, [searchParams]);

  // Calendar state - use URL date if provided, otherwise current week
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const dateParam = params.get('date');
      if (dateParam) {
        const parsed = dayjs(dateParam);
        if (parsed.isValid()) {
          return parsed.startOf('isoWeek').toDate();
        }
      }
    }
    return dayjs().startOf('isoWeek').toDate();
  });

  // Mobile: track the currently selected day index (0-6 for Mon-Sun)
  const [mobileSelectedDayIndex, setMobileSelectedDayIndex] = useState(() => {
    // Check for URL date parameter first
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const dateParam = params.get('date');
      if (dateParam) {
        const parsed = dayjs(dateParam);
        if (parsed.isValid()) {
          const weekStart = parsed.startOf('isoWeek');
          return parsed.diff(weekStart, 'day');
        }
      }
    }
    // Default to today's day of week (0 = Monday in isoWeek)
    const today = dayjs();
    const weekStart = dayjs().startOf('isoWeek');
    return today.diff(weekStart, 'day');
  });

  // Update week when URL date changes
  useEffect(() => {
    if (urlDate) {
      const newWeekStart = urlDate.startOf('isoWeek').toDate();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentWeekStart(newWeekStart);
      // Update mobile selected day
      const dayIndex = urlDate.diff(urlDate.startOf('isoWeek'), 'day');
      setMobileSelectedDayIndex(dayIndex);

      // Clear the date parameter from URL after processing
      const clearTimer = setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete('date');
        window.history.replaceState({}, '', url.toString());
      }, 1000);

      return () => clearTimeout(clearTimer);
    }
  }, [urlDate]);

  // Get days of the current week
  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => dayjs(currentWeekStart).add(index, 'day').toDate()),
    [currentWeekStart],
  );

  // Events from store (loaded from Supabase API)
  // const allEvents = useMemo(() => userEvents, [userEvents]);

  // Get unit schedules for a specific day
  const getUnitsForDay = (date: Date) => {
    const dayName = dayjs(date).locale('en').format('dddd'); // Monday, Tuesday, etc.
    return filteredUnits.flatMap((unit) =>
      unit.schedule.filter((s) => s.day === dayName).map((s) => ({ ...unit, schedule: s })),
    );
  };

  // Get items for a specific day (filtering out "classes" category from MQ dates since we show units instead)
  const getItemsForDay = (date: Date) => {
    const dayDeadlines = filteredDeadlines.filter((d) => dayjs(d.dueDate).isSame(date, 'day'));
    // Use startAt as source of truth for events, fallback to date for backward compatibility
    const dayEvents = filteredEvents.filter((e) => {
      const eventDate = e.startAt || e.date;
      return dayjs(eventDate).isSame(date, 'day');
    });
    const dayMQDates = getMQKeyDatesForDay(date).filter((d) => d.category !== 'classes');
    const dayUnits = getUnitsForDay(date);
    return { deadlines: dayDeadlines, events: dayEvents, mqDates: dayMQDates, units: dayUnits };
  };

  const formatLocalized = (date: Date, options: Intl.DateTimeFormatOptions) =>
    formatLocalizedDate(date, language, options);

  const formatDayNumber = (date: Date) => formatLocalized(date, { day: 'numeric' });
  const formatMonthYear = (date: Date) => formatLocalized(date, { month: 'long', year: 'numeric' });
  const formatWeekdayLong = (date: Date) => formatLocalized(date, { weekday: 'long' });
  const formatWeekdayShort = (date: Date) => formatLocalized(date, { weekday: 'short' });
  const formatTimeShort = (date: Date) =>
    formatLocalized(date, { hour: 'numeric', minute: '2-digit' });
  // formatWeekdayMonthDayTime - available for future use
  // const formatWeekdayMonthDayTime = (date: Date) =>
  //   formatLocalized(date, {
  //     weekday: 'short',
  //     month: 'short',
  //     day: 'numeric',
  //     hour: 'numeric',
  //     minute: '2-digit',
  //   });
  // formatMonthDayTime - available for future use
  // const formatMonthDayTime = (date: Date) =>
  //   formatLocalized(date, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  const formatHourLabel = (hour: number) =>
    formatLocalized(dayjs().hour(hour).minute(0).second(0).millisecond(0).toDate(), {
      hour: 'numeric',
    });

  const formatScheduleTime = (time: string) => {
    const [hourStr, minuteStr] = time.split(':');
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return time;
    return formatLocalized(dayjs().hour(hour).minute(minute).second(0).millisecond(0).toDate(), {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getEventTitle = (event: Event) =>
    event.translationKey ? t(event.translationKey as TranslationKey) : event.title;

  const getDeadlineTypeLabel = (type: Deadline['type']) => t(`type_${type}` as TranslationKey);

  const computeCurrentTimePosition = () => {
    const now = dayjs();
    const hours = now.hour();
    const minutes = now.minute();
    if (hours < START_HOUR || hours >= 24) return null;
    return (hours - START_HOUR) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
  };

  // Current time position for the red line indicator (updates every minute)
  const [currentTimePosition, setCurrentTimePosition] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setCurrentTimePosition(computeCurrentTimePosition());
    update();
    const intervalId = window.setInterval(update, 60_000);
    return () => clearInterval(intervalId);
  }, []);

  // Navigation handlers
  const goToPreviousWeek = () =>
    setCurrentWeekStart(dayjs(currentWeekStart).subtract(1, 'week').toDate());
  const goToNextWeek = () => setCurrentWeekStart(dayjs(currentWeekStart).add(1, 'week').toDate());
  const goToToday = () => {
    setCurrentWeekStart(dayjs().startOf('isoWeek').toDate());
    // Also reset mobile day to today
    const today = dayjs();
    const weekStart = dayjs().startOf('isoWeek');
    setMobileSelectedDayIndex(today.diff(weekStart, 'day'));
  };

  // Mobile day navigation
  const goToPreviousDay = () => {
    if (mobileSelectedDayIndex > 0) {
      setMobileSelectedDayIndex(mobileSelectedDayIndex - 1);
    } else {
      // Go to previous week, select Sunday (index 6)
      setCurrentWeekStart(dayjs(currentWeekStart).subtract(1, 'week').toDate());
      setMobileSelectedDayIndex(6);
    }
  };
  const goToNextDay = () => {
    if (mobileSelectedDayIndex < 6) {
      setMobileSelectedDayIndex(mobileSelectedDayIndex + 1);
    } else {
      // Go to next week, select Monday (index 0)
      setCurrentWeekStart(dayjs(currentWeekStart).add(1, 'week').toDate());
      setMobileSelectedDayIndex(0);
    }
  };

  // Get the currently selected mobile day
  const mobileSelectedDay = weekDays[mobileSelectedDayIndex] || weekDays[0];

  // Keyboard navigation for weeks
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Skip keyboard shortcuts when user is typing in an input field
    const target = e.target as HTMLElement;
    const isInputField =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      target.closest('[contenteditable="true"]');

    if (isInputField) {
      return; // Don't intercept keyboard events when typing
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPreviousWeek();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToNextWeek();
    } else if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      goToToday();
    }
  };

  // Deadline handlers
  const openEditDeadline = (deadline: Deadline) => {
    setEditDeadline(deadline);
    setDeadlineDialogOpen(true);
  };

  // Assignment handlers
  const openAddAssignment = () => {
    setEditAssignment(null);
    setAssignmentDialogOpen(true);
  };

  const openEditAssignment = (assignment: Deadline) => {
    setEditAssignment(assignment);
    setAssignmentDialogOpen(true);
  };

  // Assignment detail panel handler
  const openAssignmentDetail = (assignment: Deadline) => {
    setSelectedAssignment(assignment);
    setAssignmentDetailOpen(true);
  };

  // Exam handlers
  const openAddExam = () => {
    setEditExam(null);
    setExamDialogOpen(true);
  };

  const openEditExam = (exam: Deadline) => {
    setEditExam(exam);
    setExamDialogOpen(true);
  };

  // Event handlers - open detail panel to view event details
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setEventDetailOpen(true);
  };

  const openAddTodo = () => {
    setEditingTodo(null);
    setEditTodoTitle('');
    setEditTodoPriority('Medium');
    setEditTodoDueDate('');
    setEditTodoDueTime('');
    setTodoDialogOpen(true);
  };

  const openEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setEditTodoTitle(todo.title);
    setEditTodoPriority(todo.priority);
    if (todo.dueDate) {
      const date = new Date(todo.dueDate);
      setEditTodoDueDate(dayjs(date).format('YYYY-MM-DD'));
      setEditTodoDueTime(dayjs(date).format('HH:mm'));
    } else {
      setEditTodoDueDate('');
      setEditTodoDueTime('');
    }
    setTodoDialogOpen(true);
  };

  // Unit handlers
  const openAddUnit = () => {
    setEditingUnit(null);
    setUnitDialogOpen(true);
  };

  const openEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setUnitDialogOpen(true);
  };

  const handleDeleteUnit = (unit: Unit) => {
    setUnitToDelete(unit);
    setDeleteConfirmOpen(true);
  };

  // View Handlers
  const handleViewChange = (newView: CalendarView) => {
    setView(newView);
    // Update URL param
    const url = new URL(window.location.href);
    url.searchParams.set('view', newView);
    window.history.replaceState({}, '', url.toString());
  };

  const handleToggleFilters = () => setIsFiltersOpen(!isFiltersOpen);

  const handleDateChange = (date: Date) => {
    setCurrentWeekStart(dayjs(date).startOf('isoWeek').toDate());
  };

  const confirmDeleteUnit = () => {
    if (unitToDelete) {
      // Cascade delete: remove all deadlines associated with this unit locally
      removeDeadlinesByUnit(unitToDelete.id, unitToDelete.code);
      // Then delete the unit (which also cascades on the backend)
      removeUnit(unitToDelete.id);
      setDeleteConfirmOpen(false);
      setUnitToDelete(null);
    }
  };

  // Assignment delete handlers
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

  // Exam delete handlers
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

  // Deadline delete handlers
  const confirmDeleteDeadline = () => {
    if (deadlineToDelete) {
      removeDeadline(deadlineToDelete.id);
      setDeadlineDeleteConfirmOpen(false);
      setDeadlineToDelete(null);
    }
  };

  // Event delete handlers
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

  // Todo handlers
  const handleDeleteTodo = (todo: Todo) => {
    setTodoToDelete({ id: todo.id, title: todo.title });
    setTodoDeleteConfirmOpen(true);
  };

  const handleNotifyTodo = (todo: Todo) => {
    // Schedule a reminder for this todo
    if (todo.dueDate) {
      // Use toast to confirm reminder was set
      const dueDate = new Date(todo.dueDate);
      toastUtils.success(
        t('reminderSet' as TranslationKey) || 'Reminder Set',
        `${todo.title} - ${dueDate.toLocaleDateString()}`,
        { id: `todo-reminder-set-${todo.id}` },
      );
    } else {
      toastUtils.info(
        t('noDateForReminder' as TranslationKey) || 'No Due Date',
        t('todoNeedsDueDate' as TranslationKey) || 'Add a due date to set a reminder',
        { id: `todo-reminder-no-date-${todo.id}` },
      );
    }
  };

  // Get building info for a deadline (either from deadline itself or from its unit)
  // const getDeadlineBuilding = (deadline: Deadline): string | undefined => {
  //   // First check if deadline has its own building (for exams)
  //   if (deadline.building) return deadline.building;
  //   // Otherwise, get building from the associated unit
  //   const unit = units.find((u) => u.code === deadline.unitCode);
  //   return unit?.location?.building;
  // };

  // Event edit handler
  const openEditEvent = (event: Event) => {
    setEditEvent(event);
    setEventDialogOpen(true);
  };

  // Open unit detail panel
  const openUnitDetail = (unit: Unit) => {
    setSelectedUnit(unit);
    setUnitDetailOpen(true);
  };

  // Handle editing deadline from unit detail panel
  const handleEditDeadlineFromPanel = (deadline: Deadline) => {
    setUnitDetailOpen(false);
    setEditDeadline(deadline);
    setDeadlineDialogOpen(true);
  };

  // Filter deadlines by type
  // const assignments = deadlines.filter((d) => d.type === 'Assignment');
  // const exams = deadlines.filter((d) => d.type === 'Exam' || d.type === 'Quiz');

  return (
    <div
      className="container mx-auto p-4 sm:p-6 max-w-[1600px] calendar-page min-h-screen"
      role="region"
      aria-labelledby="calendar-heading"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <CalendarHeader
        currentDate={currentWeekStart}
        view={view}
        onViewChange={handleViewChange}
        onDateChange={handleDateChange}
        onToday={goToToday}
        onToggleFilters={handleToggleFilters}
        isFiltersOpen={isFiltersOpen}
      />

      <FilterPanel
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={filters}
        onFilterChange={setFilters}
      />

      {/* Program Legend - helps users understand All-Day items by program/stream */}
      <ProgramLegend className="mt-4" />

      <div className="flex flex-col lg:flex-row gap-6 mt-4">
        {/* Main Calendar Area */}
        <div className="flex-1 min-w-0">
          {!hasHydrated && (
            <p className="mb-4 text-xs text-mq-content-secondary" role="status" aria-live="polite">
              {t('loading')}
            </p>
          )}

          {/* Week View */}
          {/* Default to Week view if view is week or undefined */}
          {view === 'week' && (
            // Apple/Google Calendar Style Weekly View
            <ScrollReveal delay={0.1}>
              <div className="bg-mq-card-background border border-mq-border rounded-mq-xl shadow-sm overflow-hidden">
                <div className="p-0 calendar-main-panel overflow-visible">
                  <div className="md:overflow-x-auto overflow-x-hidden">
                    {/* Calendar Header - Week navigation for desktop, day navigation for mobile */}
                    <div className="sticky top-0 z-40 flex items-center justify-between p-4 border-b border-mq-border bg-mq-card-background/95 backdrop-blur-md md:min-w-[800px]">
                      {/* Desktop week navigation REMOVED per user request */}
                      {/* Mobile day navigation */}
                      <div className="flex md:hidden items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPreviousDay}
                          aria-label={t('calendarPreviousDay' as TranslationKey) || 'Previous day'}
                        >
                          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={goToToday}>
                          {t('today')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextDay}
                          aria-label={t('calendarNextDay' as TranslationKey) || 'Next day'}
                        >
                          <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                      {/* Desktop: Month/Year title */}
                      <h2 className="hidden md:block text-lg font-semibold text-mq-content">
                        {formatMonthYear(currentWeekStart)}
                      </h2>
                      {/* Mobile: Selected day title */}
                      <h2 className="md:hidden text-lg font-semibold text-mq-content">
                        {formatWeekdayLong(mobileSelectedDay)}, {formatDayNumber(mobileSelectedDay)}
                      </h2>
                      <div className="w-24" /> {/* Spacer for balance */}
                    </div>

                    {/* Mobile: Week day quick picker */}
                    <div className="md:hidden flex justify-center gap-1 p-2 border-b border-mq-border bg-mq-background-secondary">
                      {weekDays.map((day, index) => {
                        const isSelected = index === mobileSelectedDayIndex;
                        const isTodayPill = dayjs(day).isSame(dayjs(), 'day');
                        return (
                          <button
                            key={day.toISOString()}
                            type="button"
                            onClick={() => setMobileSelectedDayIndex(index)}
                            className={cn(
                              'flex flex-col items-center justify-center w-10 h-14 rounded-lg transition-all',
                              isSelected
                                ? 'bg-mq-primary text-white shadow-md'
                                : isTodayPill
                                  ? 'bg-mq-primary/10 text-mq-primary'
                                  : 'bg-mq-background hover:bg-mq-hover-background text-mq-content',
                            )}
                            aria-label={`${formatWeekdayLong(day)}, ${formatDayNumber(day)}`}
                            aria-pressed={isSelected}
                          >
                            <span className="text-[10px] font-medium uppercase">
                              {formatWeekdayShort(day).slice(0, 2)}
                            </span>
                            <span
                              className={cn('text-sm font-semibold', isSelected && 'text-white')}
                            >
                              {formatDayNumber(day)}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Calendar Grid with Time Lines - Scrollable from 6am to 12am */}
                    {/* Desktop: Full week view */}
                    <div
                      className="hidden md:block"
                      role="grid"
                      aria-label={t('calendarWeeklyGridLabel')}
                      aria-roledescription={t('calendarWeeklyGridDescription')}
                    >
                      <div className="min-w-[800px] overflow-visible">
                        {/* Day Headers - Sticky with MQ Key Dates */}
                        <div
                          className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-mq-border sticky top-[73px] bg-mq-background/95 backdrop-blur-md z-30"
                          role="row"
                        >
                          <div
                            className="p-2 text-center text-xs text-mq-content-secondary border-r border-mq-border"
                            aria-hidden="true"
                          />
                          {weekDays.map((day) => {
                            const dayMQDates = getMQKeyDatesForDay(day)
                              .filter((d) => d.category !== 'classes')
                              .sort((a, b) => {
                                const isEnroll = (event: string) =>
                                  /last date to enrol/i.test(event) ? 0 : 1;
                                return isEnroll(a.event) - isEnroll(b.event);
                              });
                            const dayName = formatWeekdayLong(day);
                            const dayDate = formatDayNumber(day);
                            const isTodayCell = dayjs(day).isSame(dayjs(), 'day');
                            return (
                              <div
                                key={day.toISOString()}
                                className={cn(
                                  'p-2 text-center border-r border-mq-border last:border-r-0',
                                  isTodayCell && 'bg-mq-primary/10',
                                )}
                                role="columnheader"
                                aria-label={
                                  isTodayCell
                                    ? t('calendarDayAriaLabelToday', {
                                        dayDate,
                                        dayName,
                                        todayLabel: t('today'),
                                      })
                                    : t('calendarDayAriaLabel', { dayDate, dayName })
                                }
                              >
                                <div
                                  className="text-xs text-mq-content-secondary uppercase font-medium"
                                  aria-hidden="true"
                                >
                                  {formatWeekdayShort(day)}
                                </div>
                                <div
                                  className={cn(
                                    'text-xl font-semibold mt-1 inline-flex items-center justify-center',
                                    isTodayCell
                                      ? 'w-9 h-9 rounded-full bg-mq-primary text-white'
                                      : 'text-mq-content',
                                  )}
                                  aria-hidden="true"
                                >
                                  {formatDayNumber(day)}
                                </div>
                                {/* MQ Key Dates badges in header - only show important alerts */}
                                {dayMQDates.filter((d) => /last date to enrol/i.test(d.event))
                                  .length > 0 && (
                                  <div className="mt-1 flex flex-col gap-1">
                                    {dayMQDates
                                      .filter((d) => /last date to enrol/i.test(d.event))
                                      .slice(0, 1)
                                      .map((mqDate) => {
                                        return (
                                          <div
                                            key={mqDate.id}
                                            className="text-[11px] px-2 py-1 uppercase tracking-wide ring-2 ring-red-500 ring-offset-1 ring-offset-mq-background shadow-md bg-red-600 border-red-700 text-white rounded-md font-semibold"
                                            title={
                                              mqDate.description
                                                ? `${mqDate.event} - ${mqDate.term}: ${mqDate.description}`
                                                : `${mqDate.event} - ${mqDate.term}`
                                            }
                                          >
                                            <span className="flex items-center justify-center gap-1">
                                              <AlertTriangle
                                                className="h-3 w-3"
                                                aria-hidden="true"
                                              />
                                              {mqDate.event}
                                            </span>
                                          </div>
                                        );
                                      })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Full-Day Events Row - MQ Key Dates as visual blocks */}
                        {(() => {
                          // Check if any day has MQ key dates (non-class)
                          const hasAnyFullDayEvents = weekDays.some((day) => {
                            const mqDates = getMQKeyDatesForDay(day).filter(
                              (d) => d.category !== 'classes',
                            );
                            return mqDates.length > 0;
                          });

                          if (!hasAnyFullDayEvents) return null;

                          return (
                            <div
                              className="grid grid-cols-[60px_repeat(7,1fr)] border-b-2 border-mq-border bg-mq-background-secondary/50"
                              role="row"
                            >
                              {/* Label column */}
                              <div className="p-2 text-xs font-medium text-mq-content-secondary text-right pr-2 border-r border-mq-border flex items-center justify-end min-h-[80px]">
                                {t('calendarAllDay')}
                              </div>
                              {/* Full-day events for each day */}
                              {weekDays.map((day) => {
                                const dayMQDates = getMQKeyDatesForDay(day).filter(
                                  (d) =>
                                    d.category !== 'classes' &&
                                    !/last date to enrol/i.test(d.event),
                                );
                                const isTodayCell = dayjs(day).isSame(dayjs(), 'day');

                                return (
                                  <div
                                    key={`fullday-${day.toISOString()}`}
                                    className={cn(
                                      'min-h-[80px] max-h-[160px] overflow-y-auto p-2 border-r border-mq-border last:border-r-0 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-mq-border scrollbar-track-transparent',
                                      isTodayCell && 'bg-mq-primary/10',
                                    )}
                                  >
                                    {dayMQDates.map((mqDate) => {
                                      const categoryColors = MQ_DATE_COLORS[mqDate.category];
                                      const programStyle = PROGRAM_STYLES[mqDate.program];
                                      // Category short label for badge
                                      const categoryLabel =
                                        {
                                          exams: 'Exam',
                                          admin: 'Admin',
                                          results: 'Results',
                                          payment: 'Payment',
                                          enrollment: 'Enroll',
                                          recess: 'Break',
                                          classes: 'Class',
                                        }[mqDate.category] || mqDate.category;

                                      return (
                                        <div
                                          key={mqDate.id}
                                          className={cn(
                                            'min-h-[36px] px-2 py-1.5 rounded-md text-[11px] font-semibold flex flex-col justify-center leading-tight shadow-sm border-l-4',
                                            programStyle.bgLight,
                                            programStyle.border,
                                            programStyle.pattern,
                                          )}
                                          title={
                                            mqDate.description
                                              ? `${PROGRAM_LABELS[mqDate.program]}: ${mqDate.event} - ${mqDate.term}: ${mqDate.description}`
                                              : `${PROGRAM_LABELS[mqDate.program]}: ${mqDate.event} - ${mqDate.term}`
                                          }
                                        >
                                          <div className="flex items-center gap-1 mb-0.5">
                                            <span className="text-sm" aria-hidden="true">
                                              {programStyle.icon}
                                            </span>
                                            <span
                                              className={cn(
                                                'text-[8px] font-bold uppercase px-1 py-0.5 rounded',
                                                categoryColors.bg,
                                                categoryColors.text,
                                              )}
                                            >
                                              {categoryLabel}
                                            </span>
                                          </div>
                                          <span className={cn('line-clamp-2', programStyle.text)}>
                                            {mqDate.event}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}

                        {/* Time Grid */}
                        <div
                          className="relative"
                          style={{
                            height: HOURS.length * HOUR_HEIGHT + 12,
                          }}
                          role="presentation"
                          aria-hidden="true"
                        >
                          {/* Hour Lines */}
                          {HOURS.map((hour, index) => (
                            <div
                              key={hour}
                              className="absolute left-0 right-0 grid grid-cols-[60px_repeat(7,1fr)]"
                              style={{ top: index * HOUR_HEIGHT + 8 }}
                              role="row"
                            >
                              {/* Time Label */}
                              <div
                                className="text-xs text-mq-content-secondary text-right pr-2 -mt-2"
                                role="rowheader"
                                aria-label={formatHourLabel(hour)}
                              >
                                {formatHourLabel(hour)}
                              </div>
                              {/* Hour Lines for each day */}
                              {weekDays.map((day, dayIndex) => (
                                <div
                                  key={`${day.toISOString()}-${hour}`}
                                  className={cn(
                                    'calendar-grid-cell border-t border-r border-mq-border last:border-r-0',
                                    dayIndex === 0 && 'border-l',
                                    dayjs(day).isSame(dayjs(), 'day') && 'bg-mq-primary/10',
                                  )}
                                  style={{ height: HOUR_HEIGHT }}
                                  role="gridcell"
                                  aria-hidden="true"
                                />
                              ))}
                            </div>
                          ))}

                          {/* Current Time Indicator */}
                          {currentTimePosition !== null && (
                            <div
                              className="absolute left-[60px] right-0 z-30 pointer-events-none"
                              style={{ top: currentTimePosition + 8 }}
                            >
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 shadow-lg" />
                                <div className="flex-1 h-0.5 bg-red-500 shadow-sm" />
                              </div>
                            </div>
                          )}

                          {/* Events, Units and Deadlines Overlay */}
                          <div className="absolute left-[60px] right-0 top-[8px] bottom-0 grid grid-cols-7">
                            {weekDays.map((day) => {
                              const {
                                deadlines: dayDeadlines,
                                events: dayEvents,
                                units: dayUnits,
                              } = getItemsForDay(day);

                              // Build calendar items for collision detection
                              const calendarItems: CalendarItem[] = [];

                              // Add units
                              dayUnits.forEach((unitData) => {
                                const schedule = unitData.schedule;
                                const timeInfo = parseTimeRange(
                                  `${schedule.startTime} - ${schedule.endTime}`,
                                );
                                if (timeInfo) {
                                  calendarItems.push({
                                    id: `unit-${unitData.id}-${schedule.day}-${schedule.startTime}`,
                                    startHour: timeInfo.startHour,
                                    startMin: timeInfo.startMin,
                                    endHour: timeInfo.endHour,
                                    endMin: timeInfo.endMin,
                                    type: 'unit',
                                    data: unitData,
                                  });
                                }
                              });

                              // Add deadlines
                              dayDeadlines.forEach((deadline) => {
                                const dueDayjs = dayjs(deadline.dueDate);
                                const hours = dueDayjs.hour();
                                const minutes = dueDayjs.minute();
                                if (hours >= START_HOUR) {
                                  calendarItems.push({
                                    id: `deadline-${deadline.id}`,
                                    startHour: hours,
                                    startMin: minutes,
                                    endHour: hours + 1,
                                    endMin: minutes,
                                    type: 'deadline',
                                    data: deadline,
                                  });
                                }
                              });

                              // Add events
                              dayEvents.forEach((event) => {
                                const timeInfo = parseTimeRange(event.time);
                                if (timeInfo) {
                                  calendarItems.push({
                                    id: `event-${event.id}`,
                                    startHour: timeInfo.startHour,
                                    startMin: timeInfo.startMin,
                                    endHour: timeInfo.endHour,
                                    endMin: timeInfo.endMin,
                                    type: 'event',
                                    data: event,
                                  });
                                }
                              });

                              // Calculate overlap groups
                              const overlapInfo = calculateOverlapGroups(calendarItems);

                              return (
                                <div
                                  key={day.toISOString()}
                                  className="calendar-day-column relative border-r border-mq-border last:border-r-0"
                                >
                                  {/* Units - filled time block with unit color */}
                                  {dayUnits.map((unitData) => {
                                    const schedule = unitData.schedule;
                                    const timeInfo = parseTimeRange(
                                      `${schedule.startTime} - ${schedule.endTime}`,
                                    );

                                    if (!timeInfo) return null;

                                    const posInfo = getTimePositionAndHeight(
                                      timeInfo.startHour,
                                      timeInfo.startMin,
                                      timeInfo.endHour,
                                      timeInfo.endMin,
                                    );
                                    if (!posInfo) return null;

                                    // Get overlap info for this item
                                    const itemId = `unit-${unitData.id}-${schedule.day}-${schedule.startTime}`;
                                    const overlap = overlapInfo.get(itemId) || {
                                      column: 0,
                                      totalColumns: 1,
                                    };
                                    const width = `calc((100% - 8px) / ${overlap.totalColumns})`;
                                    const left = `calc(4px + (100% - 8px) * ${overlap.column} / ${overlap.totalColumns})`;

                                    const locationSuffix = unitData.location?.building
                                      ? t('calendarUnitLocationSuffix', {
                                          building: unitData.location.building,
                                          room: unitData.location.room,
                                        })
                                      : '';

                                    return (
                                      <button
                                        key={`${unitData.id}-${schedule.day}-${schedule.startTime}`}
                                        type="button"
                                        className="absolute rounded-md shadow-md z-10 border-l-4 overflow-hidden cursor-pointer hover:opacity-80 hover:shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-[44px] min-w-[44px] flex flex-col justify-center bg-mq-card-background backdrop-blur"
                                        style={{
                                          top: posInfo.top,
                                          height: Math.max(posInfo.height, 44),
                                          left,
                                          width,
                                          borderLeftColor: unitData.color,
                                        }}
                                        aria-label={t('calendarUnitAriaLabel', {
                                          endTime: formatScheduleTime(schedule.endTime),
                                          instruction: t('calendarPressEnterOrSpaceToViewDetails'),
                                          locationSuffix,
                                          startTime: formatScheduleTime(schedule.startTime),
                                          unitCode: unitData.code,
                                        })}
                                        title={t('calendarUnitTitle', { unitCode: unitData.code })}
                                        onClick={() => {
                                          const originalUnit = units.find(
                                            (u) => u.id === unitData.id,
                                          );
                                          if (originalUnit) openUnitDetail(originalUnit);
                                        }}
                                      >
                                        <div className="p-1 h-full overflow-hidden text-mq-content">
                                          <span className="block text-xs font-bold line-clamp-2 break-words leading-tight">
                                            {unitData.code}
                                          </span>
                                          <span className="text-[10px] opacity-80 block">
                                            {formatScheduleTime(schedule.startTime)} -{' '}
                                            {formatScheduleTime(schedule.endTime)}
                                          </span>
                                          {posInfo.height > 50 && (
                                            <span className="text-[10px] opacity-70 block line-clamp-2 break-words leading-tight">
                                              {formatLocation(
                                                unitData.location.building,
                                                unitData.location.room,
                                                t('room'),
                                              )}
                                            </span>
                                          )}
                                        </div>
                                      </button>
                                    );
                                  })}

                                  {/* Deadlines - point-in-time markers (not time blocks) */}
                                  {dayDeadlines.map((deadline, idx) => {
                                    const dueDayjs = dayjs(deadline.dueDate);
                                    const dueDate = dueDayjs.toDate();
                                    const hours = dueDayjs.hour();
                                    const minutes = dueDayjs.minute();
                                    const deadlineColor = getDeadlineColor(deadline, units);
                                    const deadlineTypeLabel = getDeadlineTypeLabel(deadline.type);

                                    // Calculate position at exact due time (point-in-time, not duration)
                                    // Use a small fixed height for the marker instead of spanning an hour
                                    const MARKER_HEIGHT = 28; // Fixed height for deadline marker
                                    const topPosition =
                                      (hours - START_HOUR) * HOUR_HEIGHT +
                                      (minutes / 60) * HOUR_HEIGHT +
                                      8;

                                    // Display name: UNIT_CODE – Type or Title
                                    const displayName = `${deadline.unitCode} – ${deadline.title}`;

                                    if (hours < START_HOUR) {
                                      // Show at top if outside visible hours
                                      const isHighlighted =
                                        deadlineHighlightActive &&
                                        highlightedDeadlineId === deadline.id;
                                      return (
                                        <button
                                          key={deadline.id}
                                          type="button"
                                          ref={(el) => {
                                            if (el) deadlineRefs.current.set(deadline.id, el);
                                          }}
                                          onClick={() => openEditDeadline(deadline)}
                                          className={cn(
                                            'absolute left-1 right-1 text-left text-xs px-2 py-1 rounded shadow-sm font-medium z-10 text-white overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background transition-all hover:z-50',
                                            deadline.completed && 'opacity-50 line-through',
                                            isHighlighted &&
                                              'ring-4 ring-mq-primary ring-offset-2 ring-offset-mq-background shadow-lg shadow-mq-primary/30 animate-pulse',
                                          )}
                                          style={{
                                            top: 4 + idx * 24,
                                            height: 24,
                                            backgroundColor: deadlineColor,
                                          }}
                                          aria-label={t('calendarDeadlineAriaLabel', {
                                            displayName,
                                            instruction: t('calendarPressEnterToEdit'),
                                            time: formatTimeShort(dueDate),
                                            type: deadlineTypeLabel,
                                          })}
                                          title={`${deadlineTypeLabel}: ${displayName} - Due ${formatTimeShort(dueDate)}`}
                                        >
                                          <span className="block truncate text-[10px]">
                                            {displayName}
                                          </span>
                                        </button>
                                      );
                                    }

                                    // Get overlap info for this item
                                    const itemId = `deadline-${deadline.id}`;
                                    const overlap = overlapInfo.get(itemId) || {
                                      column: 0,
                                      totalColumns: 1,
                                    };
                                    const width = `calc((100% - 8px) / ${overlap.totalColumns})`;
                                    const left = `calc(4px + (100% - 8px) * ${overlap.column} / ${overlap.totalColumns})`;
                                    const isHighlightedDeadline =
                                      deadlineHighlightActive &&
                                      highlightedDeadlineId === deadline.id;

                                    return (
                                      <button
                                        key={deadline.id}
                                        type="button"
                                        ref={(el) => {
                                          if (el) deadlineRefs.current.set(deadline.id, el);
                                        }}
                                        onClick={() => openEditDeadline(deadline)}
                                        className={cn(
                                          'absolute text-left text-xs px-1.5 py-0.5 rounded-md shadow-md font-medium z-10 border-l-4 text-white overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background transition-all hover:z-50 hover:shadow-lg',
                                          deadline.completed && 'opacity-50 line-through',
                                          isHighlightedDeadline &&
                                            'ring-4 ring-mq-primary ring-offset-2 ring-offset-mq-background shadow-lg shadow-mq-primary/30 animate-pulse z-20',
                                        )}
                                        style={{
                                          top: topPosition,
                                          height: MARKER_HEIGHT, // Fixed height for point-in-time marker
                                          left,
                                          width,
                                          backgroundColor: `${deadlineColor}`,
                                          borderLeftColor: deadlineColor,
                                        }}
                                        aria-label={t('calendarDeadlineAriaLabelStatus', {
                                          displayName,
                                          instruction: t('calendarPressEnterToEdit'),
                                          status: deadline.completed
                                            ? t('calendarCompletedStatus')
                                            : t('calendarNotCompletedStatus'),
                                          time: formatTimeShort(dueDate),
                                          type: deadlineTypeLabel,
                                        })}
                                        title={`${deadlineTypeLabel}: ${displayName} - Due at ${formatTimeShort(dueDate)}`}
                                      >
                                        {/* Compact deadline marker */}
                                        <div className="flex items-center gap-1 h-full">
                                          <Clock
                                            className="h-3 w-3 shrink-0 opacity-80"
                                            aria-hidden="true"
                                          />
                                          <span className="text-[10px] font-bold shrink-0">
                                            {formatTimeShort(dueDate)}
                                          </span>
                                          <span className="text-[10px] truncate opacity-90">
                                            {displayName}
                                          </span>
                                        </div>
                                      </button>
                                    );
                                  })}

                                  {/* Events - filled time block */}
                                  {dayEvents.map((event, idx) => {
                                    const timeInfo = parseTimeRange(event.time);
                                    const eventColors = getEventColors(event);
                                    const eventTitle = getEventTitle(event);

                                    if (!timeInfo) {
                                      // Show at top if no valid time
                                      const offsetTop = 4 + dayDeadlines.length * 24 + idx * 24;
                                      return (
                                        <button
                                          key={event.id}
                                          type="button"
                                          onClick={() => handleEventClick(event)}
                                          className={cn(
                                            'absolute left-1 right-1 text-left text-[10px] px-2 py-1.5 rounded shadow-sm font-medium z-10 line-clamp-2 break-words leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-[44px] transition-all hover:z-50 hover:h-auto hover:min-h-fit',
                                            eventColors.bg,
                                            eventColors.text,
                                          )}
                                          style={{ top: offsetTop, ...eventColors.style }}
                                          aria-label={t('calendarEventAriaLabel', {
                                            instruction: t('calendarPressEnterToViewDetails'),
                                            time: event.time,
                                            title: eventTitle,
                                          })}
                                          title={t('calendarEventTitle', {
                                            time: event.time,
                                            title: eventTitle,
                                          })}
                                        >
                                          <span className="block line-clamp-1 hover:line-clamp-none whitespace-normal hover:overflow-visible">
                                            {eventTitle}
                                          </span>
                                        </button>
                                      );
                                    }

                                    const posInfo = getTimePositionAndHeight(
                                      timeInfo.startHour,
                                      timeInfo.startMin,
                                      timeInfo.endHour,
                                      timeInfo.endMin,
                                    );

                                    if (!posInfo) {
                                      const offsetTop = 4 + dayDeadlines.length * 22 + idx * 22;
                                      return (
                                        <button
                                          key={event.id}
                                          type="button"
                                          onClick={() => handleEventClick(event)}
                                          className={cn(
                                            'absolute left-1 right-1 text-left text-[10px] px-1 py-0.5 rounded shadow-sm font-medium z-10 line-clamp-2 break-words leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background',
                                            eventColors.bg,
                                            eventColors.text,
                                          )}
                                          style={{ top: offsetTop, ...eventColors.style }}
                                          aria-label={t('calendarEventAriaLabelShort', {
                                            time: event.time,
                                            title: eventTitle,
                                          })}
                                          title={t('calendarEventTitle', {
                                            time: event.time,
                                            title: eventTitle,
                                          })}
                                        >
                                          {eventTitle}
                                        </button>
                                      );
                                    }

                                    // Get overlap info for this item
                                    const itemId = `event-${event.id}`;
                                    const overlap = overlapInfo.get(itemId) || {
                                      column: 0,
                                      totalColumns: 1,
                                    };
                                    const evtWidth = `calc((100% - 8px) / ${overlap.totalColumns})`;
                                    const evtLeft = `calc(4px + (100% - 8px) * ${overlap.column} / ${overlap.totalColumns})`;

                                    return (
                                      <button
                                        key={event.id}
                                        type="button"
                                        onClick={() => handleEventClick(event)}
                                        className={cn(
                                          'absolute text-left text-[10px] px-2 py-1.5 rounded-md shadow-md font-medium z-10 border-l-4 leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-[44px] transition-all hover:z-50 hover:h-auto hover:min-h-fit overflow-hidden hover:overflow-visible',
                                          eventColors.bg,
                                          eventColors.border,
                                          eventColors.text,
                                        )}
                                        style={{
                                          top: posInfo.top,
                                          height: Math.max(posInfo.height, 44),
                                          left: evtLeft,
                                          width: evtWidth,
                                          ...eventColors.style,
                                        }}
                                        aria-label={t('calendarEventAriaLabel', {
                                          instruction: t('calendarPressEnterToViewDetails'),
                                          time: event.time,
                                          title: eventTitle,
                                        })}
                                        title={t('calendarEventTitle', {
                                          time: event.time,
                                          title: eventTitle,
                                        })}
                                      >
                                        <span className="block line-clamp-2 hover:line-clamp-none break-words leading-tight">
                                          {eventTitle}
                                        </span>
                                        <span className="text-[8px] opacity-80 block truncate">
                                          {event.time}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile: Single day view */}
                    <div
                      className="md:hidden"
                      role="region"
                      aria-label={t('calendarDayViewLabel' as TranslationKey) || 'Day view'}
                    >
                      {/* Mobile Day Header with MQ Key Dates */}
                      {(() => {
                        const dayMQDates = getMQKeyDatesForDay(mobileSelectedDay).filter(
                          (d) => d.category !== 'classes',
                        );
                        const isTodayCell = dayjs(mobileSelectedDay).isSame(dayjs(), 'day');

                        return (
                          <div
                            className={cn(
                              'p-3 border-b border-mq-border',
                              isTodayCell && 'bg-mq-primary/10',
                            )}
                          >
                            {/* MQ Key Dates for mobile */}
                            {dayMQDates.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {dayMQDates.map((mqDate) => {
                                  const colors = MQ_DATE_COLORS[mqDate.category];
                                  const isAlert = /last date to enrol/i.test(mqDate.event);
                                  return (
                                    <div
                                      key={mqDate.id}
                                      className={cn(
                                        'px-2 py-1 rounded-md text-xs font-bold shadow-md ring-1 ring-inset ring-white/20',
                                        isAlert
                                          ? 'ring-2 ring-red-500 ring-offset-1 ring-offset-mq-background bg-red-600 text-white'
                                          : cn(colors.bg, colors.text, colors.border, 'border-2'),
                                      )}
                                      title={
                                        mqDate.description
                                          ? `${mqDate.event} - ${mqDate.term}: ${mqDate.description}`
                                          : `${mqDate.event} - ${mqDate.term}`
                                      }
                                    >
                                      {isAlert && (
                                        <AlertTriangle
                                          className="inline h-3 w-3 mr-1"
                                          aria-hidden="true"
                                        />
                                      )}
                                      <span className="drop-shadow-sm">{mqDate.event}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Mobile Time Grid */}
                      <div
                        className="relative"
                        style={{
                          height: HOURS.length * HOUR_HEIGHT + 12,
                        }}
                      >
                        {/* Hour Lines */}
                        {HOURS.map((hour, index) => (
                          <div
                            key={hour}
                            className="absolute left-0 right-0 flex"
                            style={{ top: index * HOUR_HEIGHT + 8 }}
                          >
                            {/* Time Label */}
                            <div className="w-14 text-xs text-mq-content-secondary text-right pr-2 -mt-2 border-r border-mq-border flex-shrink-0">
                              {formatHourLabel(hour)}
                            </div>
                            {/* Hour line */}
                            <div
                              className={cn(
                                'flex-1 border-t border-mq-border',
                                dayjs(mobileSelectedDay).isSame(dayjs(), 'day') &&
                                  'bg-mq-primary/10',
                              )}
                              style={{ height: HOUR_HEIGHT }}
                            />
                          </div>
                        ))}

                        {/* Current Time Indicator (only if viewing today) */}
                        {currentTimePosition !== null &&
                          dayjs(mobileSelectedDay).isSame(dayjs(), 'day') && (
                            <div
                              className="absolute left-[56px] right-0 z-30 pointer-events-none"
                              style={{ top: currentTimePosition + 8 }}
                            >
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 shadow-lg" />
                                <div className="flex-1 h-0.5 bg-red-500 shadow-sm" />
                              </div>
                            </div>
                          )}

                        {/* Mobile Events Overlay */}
                        <div className="absolute left-[56px] right-0 top-[8px] bottom-0">
                          {(() => {
                            const {
                              deadlines: dayDeadlines,
                              events: dayEvents,
                              units: dayUnits,
                            } = getItemsForDay(mobileSelectedDay);

                            // Build calendar items for collision detection
                            const calendarItems: CalendarItem[] = [];

                            // Add units
                            dayUnits.forEach((unitData) => {
                              const schedule = unitData.schedule;
                              const timeInfo = parseTimeRange(
                                `${schedule.startTime} - ${schedule.endTime}`,
                              );
                              if (timeInfo) {
                                calendarItems.push({
                                  id: `unit-${unitData.id}-${schedule.day}-${schedule.startTime}`,
                                  startHour: timeInfo.startHour,
                                  startMin: timeInfo.startMin,
                                  endHour: timeInfo.endHour,
                                  endMin: timeInfo.endMin,
                                  type: 'unit',
                                  data: unitData,
                                });
                              }
                            });

                            // Add deadlines
                            dayDeadlines.forEach((deadline) => {
                              const dueDayjs = dayjs(deadline.dueDate);
                              const hours = dueDayjs.hour();
                              const minutes = dueDayjs.minute();
                              if (hours >= START_HOUR) {
                                calendarItems.push({
                                  id: `deadline-${deadline.id}`,
                                  startHour: hours,
                                  startMin: minutes,
                                  endHour: hours + 1,
                                  endMin: minutes,
                                  type: 'deadline',
                                  data: deadline,
                                });
                              }
                            });

                            // Add events
                            dayEvents.forEach((event) => {
                              const timeInfo = parseTimeRange(event.time);
                              if (timeInfo) {
                                calendarItems.push({
                                  id: `event-${event.id}`,
                                  startHour: timeInfo.startHour,
                                  startMin: timeInfo.startMin,
                                  endHour: timeInfo.endHour,
                                  endMin: timeInfo.endMin,
                                  type: 'event',
                                  data: event,
                                });
                              }
                            });

                            // Calculate overlap groups
                            const overlapInfo = calculateOverlapGroups(calendarItems);

                            return (
                              <>
                                {/* Units */}
                                {dayUnits.map((unitData) => {
                                  const schedule = unitData.schedule;
                                  const timeInfo = parseTimeRange(
                                    `${schedule.startTime} - ${schedule.endTime}`,
                                  );
                                  if (!timeInfo) return null;

                                  const posInfo = getTimePositionAndHeight(
                                    timeInfo.startHour,
                                    timeInfo.startMin,
                                    timeInfo.endHour,
                                    timeInfo.endMin,
                                  );
                                  if (!posInfo) return null;

                                  const itemId = `unit-${unitData.id}-${schedule.day}-${schedule.startTime}`;
                                  const overlap = overlapInfo.get(itemId) || {
                                    column: 0,
                                    totalColumns: 1,
                                  };
                                  const width = `calc((100% - 8px) / ${overlap.totalColumns})`;
                                  const left = `calc(4px + (100% - 8px) * ${overlap.column} / ${overlap.totalColumns})`;

                                  return (
                                    <button
                                      key={`mobile-${unitData.id}-${schedule.day}-${schedule.startTime}`}
                                      type="button"
                                      className="absolute rounded-md shadow-md z-10 border-l-4 overflow-hidden cursor-pointer hover:opacity-80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus min-h-[44px] flex flex-col justify-center bg-mq-card-background backdrop-blur p-2"
                                      style={{
                                        top: posInfo.top,
                                        height: Math.max(posInfo.height, 44),
                                        left,
                                        width,
                                        borderLeftColor: unitData.color,
                                      }}
                                      onClick={() => {
                                        const originalUnit = units.find(
                                          (u) => u.id === unitData.id,
                                        );
                                        if (originalUnit) openUnitDetail(originalUnit);
                                      }}
                                    >
                                      <span className="text-xs font-bold text-mq-content line-clamp-1">
                                        {unitData.code}
                                      </span>
                                      <span className="text-[10px] text-mq-content-secondary">
                                        {formatScheduleTime(schedule.startTime)} -{' '}
                                        {formatScheduleTime(schedule.endTime)}
                                      </span>
                                      <span className="text-[10px] text-mq-content-secondary line-clamp-1">
                                        {formatLocation(
                                          unitData.location.building,
                                          unitData.location.room,
                                          t('room'),
                                        )}
                                      </span>
                                    </button>
                                  );
                                })}

                                {/* Deadlines */}
                                {dayDeadlines.map((deadline) => {
                                  const dueDayjs = dayjs(deadline.dueDate);
                                  const dueDate = dueDayjs.toDate();
                                  const hours = dueDayjs.hour();
                                  const minutes = dueDayjs.minute();
                                  const deadlineColor = getDeadlineColor(deadline, units);

                                  const posInfo = getTimePositionAndHeight(
                                    hours,
                                    minutes,
                                    hours + 1,
                                    minutes,
                                  );
                                  if (!posInfo || hours < START_HOUR) return null;

                                  const itemId = `deadline-${deadline.id}`;
                                  const overlap = overlapInfo.get(itemId) || {
                                    column: 0,
                                    totalColumns: 1,
                                  };
                                  const width = `calc((100% - 8px) / ${overlap.totalColumns})`;
                                  const left = `calc(4px + (100% - 8px) * ${overlap.column} / ${overlap.totalColumns})`;

                                  return (
                                    <button
                                      key={`mobile-deadline-${deadline.id}`}
                                      type="button"
                                      onClick={() => openEditDeadline(deadline)}
                                      className={cn(
                                        'absolute text-left text-xs px-2 py-1.5 rounded-md shadow-md font-medium z-10 border-l-4 text-white min-h-[44px] transition-all hover:z-50 hover:h-auto hover:min-h-fit',
                                        deadline.completed && 'opacity-50 line-through',
                                      )}
                                      style={{
                                        top: posInfo.top,
                                        height: Math.max(posInfo.height, 44),
                                        left,
                                        width,
                                        backgroundColor: `${deadlineColor}dd`,
                                        borderLeftColor: deadlineColor,
                                      }}
                                    >
                                      <span className="block line-clamp-2 hover:line-clamp-none">
                                        {deadline.unitCode} – {deadline.title}
                                      </span>
                                      <span className="text-[10px] opacity-80">
                                        {formatTimeShort(dueDate)}
                                      </span>
                                    </button>
                                  );
                                })}

                                {/* Events */}
                                {dayEvents.map((event) => {
                                  const timeInfo = parseTimeRange(event.time);
                                  const eventColors = getEventColors(event);
                                  const eventTitle = getEventTitle(event);

                                  if (!timeInfo) return null;

                                  const posInfo = getTimePositionAndHeight(
                                    timeInfo.startHour,
                                    timeInfo.startMin,
                                    timeInfo.endHour,
                                    timeInfo.endMin,
                                  );
                                  if (!posInfo) return null;

                                  const itemId = `event-${event.id}`;
                                  const overlap = overlapInfo.get(itemId) || {
                                    column: 0,
                                    totalColumns: 1,
                                  };
                                  const width = `calc((100% - 8px) / ${overlap.totalColumns})`;
                                  const left = `calc(4px + (100% - 8px) * ${overlap.column} / ${overlap.totalColumns})`;

                                  return (
                                    <button
                                      key={`mobile-event-${event.id}`}
                                      type="button"
                                      onClick={() => handleEventClick(event)}
                                      className={cn(
                                        'absolute text-left text-xs px-2 py-1.5 rounded-md shadow-md font-medium z-10 border-l-4 min-h-[44px] transition-all hover:z-50 hover:h-auto hover:min-h-fit',
                                        eventColors.bg,
                                        eventColors.border,
                                        eventColors.text,
                                      )}
                                      style={{
                                        top: posInfo.top,
                                        height: Math.max(posInfo.height, 44),
                                        left,
                                        width,
                                        ...eventColors.style,
                                      }}
                                    >
                                      <span className="block line-clamp-2 hover:line-clamp-none">
                                        {eventTitle}
                                      </span>
                                      <span className="text-[10px] opacity-80">{event.time}</span>
                                    </button>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
              onUnitClick={openUnitDetail}
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
              onUnitClick={openUnitDetail}
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
            onOpenUnitDetail={openUnitDetail}
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
        unit={effectiveSelectedUnit}
        open={effectiveUnitDetailOpen}
        onOpenChange={handleUnitDetailOpenChange}
        onEditDeadline={handleEditDeadlineFromPanel}
        onEditUnit={() => {
          if (effectiveSelectedUnit) {
            handleUnitDetailOpenChange(false);
            openEditUnit(effectiveSelectedUnit);
          }
        }}
        onDeleteUnit={() => {
          if (effectiveSelectedUnit) {
            handleUnitDetailOpenChange(false);
            handleDeleteUnit(effectiveSelectedUnit);
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
                if (editTodoTitle.trim()) {
                  // Build due date if provided
                  let dueDate: Date | undefined = undefined;
                  if (editTodoDueDate) {
                    dueDate = new Date(editTodoDueDate);
                    if (editTodoDueTime) {
                      const [hours, minutes] = editTodoDueTime.split(':').map(Number);
                      dueDate.setHours(hours, minutes, 0, 0);
                    } else {
                      dueDate.setHours(23, 59, 59, 999);
                    }
                  }

                  if (editingTodo) {
                    await updateTodo(editingTodo.id, {
                      title: editTodoTitle.trim(),
                      priority: editTodoPriority,
                      dueDate,
                    });
                  } else {
                    await addTodo({
                      title: editTodoTitle.trim(),
                      priority: editTodoPriority,
                      dueDate,
                    });
                  }

                  setTodoDialogOpen(false);
                  setEditingTodo(null);
                  setEditTodoTitle('');
                  setEditTodoPriority('Medium');
                  setEditTodoDueDate('');
                  setEditTodoDueTime('');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="edit-todo-title"
                  className="block text-sm font-medium text-mq-content mb-1"
                >
                  {tOr('taskTitle', 'Task Title')}
                </label>
                <input
                  id="edit-todo-title"
                  type="text"
                  value={editTodoTitle}
                  onChange={(e) => setEditTodoTitle(e.target.value)}
                  placeholder={tOr('enterTaskTitle', 'Enter task title...')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-mq-border bg-mq-background focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  autoFocus
                />
              </div>
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
              {/* Due Date and Time */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-mq-content">
                  {tOr('dueDateTime', 'Due Date & Time')}
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <Calendar className="h-4 w-4 text-mq-content-secondary flex-shrink-0" />
                    <input
                      type="date"
                      value={editTodoDueDate}
                      onChange={(e) => setEditTodoDueDate(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-mq-border bg-mq-background focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-mq-content"
                      aria-label={tOr('selectDueDate', 'Select due date')}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-mq-content-secondary flex-shrink-0" />
                    <input
                      type="time"
                      value={editTodoDueTime}
                      onChange={(e) => setEditTodoDueTime(e.target.value)}
                      disabled={!editTodoDueDate}
                      className={cn(
                        'px-3 py-2 text-sm rounded-lg border border-mq-border bg-mq-background focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-mq-content min-w-[110px]',
                        !editTodoDueDate && 'opacity-50 cursor-not-allowed',
                      )}
                      aria-label={tOr('selectDueTime', 'Select due time')}
                    />
                  </div>
                </div>
                {(editTodoDueDate || editTodoDueTime) && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditTodoDueDate('');
                      setEditTodoDueTime('');
                    }}
                    className="text-sm text-mq-content-secondary hover:text-mq-content transition-colors underline"
                    aria-label={tOr('clearDueDate', 'Clear due date')}
                  >
                    {tOr('clearDueDate', 'Clear due date')}
                  </button>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setTodoDialogOpen(false);
                    setEditingTodo(null);
                    setEditTodoTitle('');
                    setEditTodoPriority('Medium');
                    setEditTodoDueDate('');
                    setEditTodoDueTime('');
                  }}
                >
                  {t('cancelAction')}
                </Button>
                <Button
                  type="submit"
                  disabled={!editTodoTitle.trim()}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {tOr('saveChanges', editingTodo ? 'Save Changes' : 'Add Task')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        onNotify={(todo) => {
          handleNotifyTodo(todo);
        }}
      />
    </div>
  );
}
