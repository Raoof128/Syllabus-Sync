'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import {
  CheckCircle2,
  Circle,
  CalendarDays,
  Edit2,
  Plus,
  BookOpen,
  FileText,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { Button } from '@/components/ui/mq/button';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useEventsStore } from '@/lib/store/eventsStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import DeadlineForm from '@/components/deadlines/DeadlineForm';
import { Deadline, Event, Unit } from '@/lib/types';
import { useHydration } from '@/lib/hooks';
import { PRIORITY_COLORS } from '@/lib/constants';
import { useTranslation } from '@/lib/hooks/useTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { MagicCard } from '@/components/ui/MagicCard';
// Events are now loaded from Supabase via eventsStore (no more sampleEvents import)
import { getMQKeyDatesForDay, MQ_DATE_COLORS } from '@/data/mqKeyDates';
import dynamic from 'next/dynamic';
import { formatLocalizedDate, formatLocation } from '@/lib/utils/locale';
import { cn } from '@/lib/utils';

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

const AssignmentDetailPanel = dynamic(() => import('@/components/assignments/AssignmentDetailPanel'), {
  loading: () => null,
});

const ExamForm = dynamic(() => import('@/components/exams/ExamForm'), {
  loading: () => null,
});

// Hours to display (6 AM to 11 PM = 18 hours)
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6am to 11pm (23)
const HOUR_HEIGHT = 48; // pixels per hour
const START_HOUR = 6; // First visible hour

// Type colors for the calendar
const TYPE_COLORS = {
  Assignment: { bg: 'bg-mq-info', border: 'border-mq-info', text: 'text-white' },
  Exam: { bg: 'bg-mq-error', border: 'border-mq-error', text: 'text-white' },
  Event: { bg: 'bg-mq-success', border: 'border-mq-success', text: 'text-white' },
  Presentation: { bg: 'bg-mq-purple', border: 'border-mq-purple', text: 'text-white' },
  Quiz: { bg: 'bg-mq-warning', border: 'border-mq-warning', text: 'text-black' },
};

// Category-specific colors for events
const EVENT_CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Career: { bg: 'bg-indigo-500', border: 'border-indigo-600', text: 'text-white' },
  Social: { bg: 'bg-pink-500', border: 'border-pink-600', text: 'text-white' },
  Academic: { bg: 'bg-cyan-500', border: 'border-cyan-600', text: 'text-white' },
  'Free Food': { bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-white' },
};

// Helper to get event colors based on custom color, category, or default
function getEventColors(event: Event): {
  bg: string;
  border: string;
  text: string;
  style?: React.CSSProperties;
} {
  // Use custom color if provided
  if (event.color) {
    return {
      bg: '',
      border: '',
      text: 'text-white',
      style: { backgroundColor: event.color, borderColor: event.color },
    };
  }

  // Use category-specific color if available
  if (event.category && EVENT_CATEGORY_COLORS[event.category]) {
    return EVENT_CATEGORY_COLORS[event.category];
  }

  // Fallback to default event color
  return TYPE_COLORS.Event;
}

// Parse time string like "2:00 PM" or "14:00" or "10:00 AM - 2:00 PM" or "09:00 - 11:00" to start/end hours
function parseTimeRange(
  timeStr: string,
): { startHour: number; startMin: number; endHour: number; endMin: number } | null {
  if (!timeStr) return null;

  // Try parsing 24-hour range format "09:00 - 11:00" first (most common in our data)
  const militaryRangeMatch = timeStr.match(
    /(\d{1,2}):(\d{2})(?::\d{2})?\s*[-–]\s*(\d{1,2}):(\d{2})(?::\d{2})?/,
  );
  if (militaryRangeMatch) {
    const startHour = parseInt(militaryRangeMatch[1], 10);
    const startMin = parseInt(militaryRangeMatch[2], 10);
    const endHour = parseInt(militaryRangeMatch[3], 10);
    const endMin = parseInt(militaryRangeMatch[4], 10);
    return { startHour, startMin, endHour, endMin };
  }

  // Try parsing range format "10:00 AM - 2:00 PM"
  const rangeMatch = timeStr.match(
    /(\d{1,2}):(\d{2})\s*(AM|PM)\s*[-–]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i,
  );
  if (rangeMatch) {
    let startHour = parseInt(rangeMatch[1], 10);
    const startMin = parseInt(rangeMatch[2], 10);
    const startPeriod = rangeMatch[3].toUpperCase();

    let endHour = parseInt(rangeMatch[4], 10);
    const endMin = parseInt(rangeMatch[5], 10);
    const endPeriod = rangeMatch[6].toUpperCase();

    if (startPeriod === 'PM' && startHour !== 12) startHour += 12;
    if (startPeriod === 'AM' && startHour === 12) startHour = 0;
    if (endPeriod === 'PM' && endHour !== 12) endHour += 12;
    if (endPeriod === 'AM' && endHour === 12) endHour = 0;

    return { startHour, startMin, endHour, endMin };
  }

  // Try parsing single time "2:00 PM" format (assume 1 hour duration)
  const ampmMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return { startHour: hours, startMin: minutes, endHour: hours + 1, endMin: minutes };
  }

  // Try parsing "14:00" format (single time, assume 1 hour duration)
  const militaryMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (militaryMatch) {
    const hours = parseInt(militaryMatch[1], 10);
    const minutes = parseInt(militaryMatch[2], 10);
    return { startHour: hours, startMin: minutes, endHour: hours + 1, endMin: minutes };
  }

  return null;
}

// Calculate position and height for a time-based item
function getTimePositionAndHeight(
  startHour: number,
  startMin: number,
  endHour: number,
  endMin: number,
): { top: number; height: number } | null {
  // Clamp to visible range (6am to 11pm)
  const effectiveStartHour = Math.max(START_HOUR, Math.min(23, startHour));
  const effectiveEndHour = Math.max(START_HOUR, Math.min(24, endHour));

  if (effectiveStartHour >= 24) return null;

  const top = (effectiveStartHour - START_HOUR) * HOUR_HEIGHT + (startMin / 60) * HOUR_HEIGHT;
  const durationHours = effectiveEndHour - effectiveStartHour + (endMin - startMin) / 60;
  const height = Math.max(24, durationHours * HOUR_HEIGHT);

  return { top, height };
}

// Interface for calendar items with time info
interface CalendarItem {
  id: string;
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
  type: 'unit' | 'deadline' | 'event';
  data: unknown;
}

// Calculate overlapping groups for collision detection
function calculateOverlapGroups(
  items: CalendarItem[],
): Map<string, { column: number; totalColumns: number }> {
  if (items.length === 0) return new Map();

  // Sort items by start time
  const sortedItems = [...items].sort((a, b) => {
    const aStart = a.startHour * 60 + a.startMin;
    const bStart = b.startHour * 60 + b.startMin;
    return aStart - bStart;
  });

  const result = new Map<string, { column: number; totalColumns: number }>();
  const groups: CalendarItem[][] = [];

  // Group overlapping items
  for (const item of sortedItems) {
    const itemStart = item.startHour * 60 + item.startMin;

    // Find a group that this item overlaps with
    let foundGroup = false;
    for (const group of groups) {
      const groupEnd = Math.max(...group.map((g) => g.endHour * 60 + g.endMin));
      if (itemStart < groupEnd) {
        // Overlaps with this group
        group.push(item);
        foundGroup = true;
        break;
      }
    }

    if (!foundGroup) {
      groups.push([item]);
    }
  }

  // Assign columns within each group
  for (const group of groups) {
    const columns: CalendarItem[][] = [];

    for (const item of group) {
      const itemStart = item.startHour * 60 + item.startMin;

      // Find the first column where this item doesn't overlap
      let placed = false;
      for (let col = 0; col < columns.length; col++) {
        const colItems = columns[col];
        const lastItem = colItems[colItems.length - 1];
        const lastEnd = lastItem.endHour * 60 + lastItem.endMin;

        if (itemStart >= lastEnd) {
          colItems.push(item);
          placed = true;
          break;
        }
      }

      if (!placed) {
        columns.push([item]);
      }
    }

    // Assign column info to each item in the group
    const totalColumns = columns.length;
    for (let col = 0; col < columns.length; col++) {
      for (const item of columns[col]) {
        result.set(item.id, { column: col, totalColumns });
      }
    }
  }

  return result;
}

export default function CalendarClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const toggleComplete = useDeadlinesStore((state) => state.toggleComplete);
  const removeDeadline = useDeadlinesStore((state) => state.removeDeadline);
  const userEvents = useEventsStore((state) => state.events);
  const removeEvent = useEventsStore((state) => state.removeEvent);
  const units = useUnitsStore((state) => state.units);
  const removeUnit = useUnitsStore((state) => state.removeUnit);

  const hasHydrated = useHydration();
  const { language, t } = useTranslation();

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

  // Assignment detail panel state
  const [assignmentDetailOpen, setAssignmentDetailOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Deadline | null>(null);

  const unitsWidgetRef = useRef<HTMLDivElement>(null);
  const assignmentsWidgetRef = useRef<HTMLDivElement>(null);

  // Highlighted unit derived from URL query parameter
  const highlightedUnitId = useMemo(() => searchParams.get('highlightUnit'), [searchParams]);
  const highlightedUnit = useMemo(() => {
    if (!highlightedUnitId) return null;
    return units.find((unit) => unit.id === highlightedUnitId) ?? null;
  }, [highlightedUnitId, units]);

  // Highlighted deadline derived from URL query parameter
  const highlightedDeadlineId = useMemo(() => searchParams.get('highlightDeadline'), [searchParams]);
  const deadlineHighlightActive = Boolean(highlightedDeadlineId);
  const deadlineRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Handle highlighted deadline side effects (scroll + highlight + auto-clear URL + show detail panel)
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
    }, 300);

    // Clear highlight and URL parameter after 5 seconds
    const clearTimer = window.setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete('highlightDeadline');
      window.history.replaceState({}, '', url.toString());
    }, 5000);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [highlightedDeadlineId, deadlines]);
  const effectiveSelectedUnit = highlightedUnit ?? selectedUnit;
  const effectiveUnitDetailOpen = unitDetailOpen || Boolean(highlightedUnit);

  const handleUnitDetailOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setUnitDetailOpen(false);
        if (highlightedUnitId) {
          const url = new URL(window.location.href);
          url.searchParams.delete('highlightUnit');
          window.history.replaceState({}, '', url.toString());
        }
        return;
      }
      setUnitDetailOpen(true);
    },
    [highlightedUnitId],
  );

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

  // Handle highlighted unit side effects (scroll + auto-clear URL)
  useEffect(() => {
    if (!highlightedUnitId) return;

    const scrollTimer = window.setTimeout(() => {
      unitsWidgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    const clearTimer = window.setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete('highlightUnit');
      window.history.replaceState({}, '', url.toString());
    }, 3000);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [highlightedUnitId]);

  // Calendar state
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    dayjs().startOf('isoWeek').toDate(),
  );

  // Mobile: track the currently selected day index (0-6 for Mon-Sun)
  const [mobileSelectedDayIndex, setMobileSelectedDayIndex] = useState(() => {
    // Default to today's day of week (0 = Monday in isoWeek)
    const today = dayjs();
    const weekStart = dayjs().startOf('isoWeek');
    return today.diff(weekStart, 'day');
  });

  // Get days of the current week
  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => dayjs(currentWeekStart).add(index, 'day').toDate()),
    [currentWeekStart],
  );

  // Events from store (loaded from Supabase API)
  const allEvents = useMemo(() => userEvents, [userEvents]);

  // Get unit schedules for a specific day
  const getUnitsForDay = (date: Date) => {
    const dayName = dayjs(date).locale('en').format('dddd'); // Monday, Tuesday, etc.
    return units.flatMap((unit) =>
      unit.schedule.filter((s) => s.day === dayName).map((s) => ({ ...unit, schedule: s })),
    );
  };

  // Get items for a specific day (filtering out "classes" category from MQ dates since we show units instead)
  const getItemsForDay = (date: Date) => {
    const dayDeadlines = deadlines.filter((d) => dayjs(d.dueDate).isSame(date, 'day'));
    const dayEvents = allEvents.filter((e) => dayjs(e.date).isSame(date, 'day'));
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
  const formatWeekdayMonthDayTime = (date: Date) =>
    formatLocalized(date, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  const formatMonthDayTime = (date: Date) =>
    formatLocalized(date, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

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

  // Get color for a deadline (custom color or unit color)
  const getDeadlineColor = (deadline: Deadline): string => {
    if (deadline.color) return deadline.color;
    const unit = units.find((u) => u.code === deadline.unitCode);
    return unit?.color || 'var(--c-primary)';
  };

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
  const openAddDeadline = () => {
    setEditDeadline(null);
    setDeadlineDialogOpen(true);
  };

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

  // Event handlers - navigate to feed with highlight to view event details
  const handleEventClick = (event: Event) => {
    // Navigate to feed page and highlight the event for viewing
    router.push(`/feed?highlight=${event.id}`);
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

  const confirmDeleteUnit = () => {
    if (unitToDelete) {
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
  const handleDeleteDeadline = (deadline: Deadline) => {
    setDeadlineToDelete(deadline);
    setDeadlineDeleteConfirmOpen(true);
  };

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
  const assignments = deadlines.filter((d) => d.type === 'Assignment');
  const exams = deadlines.filter((d) => d.type === 'Exam' || d.type === 'Quiz');

  return (
    <div
      className="container mx-auto p-4 sm:p-6 max-w-7xl calendar-page"
      role="region"
      aria-labelledby="calendar-heading"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <ScrollReveal>
        <header className="mb-6">
          <h1 id="calendar-heading" className="text-mq-3xl font-bold text-mq-content mb-2">
            {t('calendar')}
          </h1>
          <p className="text-mq-content-secondary">{t('trackDeadlinesDesc')}</p>
          {!hasHydrated && (
            <p className="mt-2 text-xs text-mq-content-secondary" role="status" aria-live="polite">
              {t('loading')}
            </p>
          )}
        </header>
      </ScrollReveal>

      {/* Apple/Google Calendar Style Weekly View */}
      <ScrollReveal delay={0.1} className="mt-6">
        <MagicCard isLiquidEnhanced>
          <div className="mq-magic-card-content p-0">
            {/* Calendar Header - Week navigation for desktop, day navigation for mobile */}
            <div className="flex items-center justify-between p-4 border-b border-mq-border">
              {/* Desktop week navigation */}
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousWeek}
                  aria-label={t('calendarPreviousWeek')}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  {t('today')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextWeek}
                  aria-label={t('calendarNextWeek')}
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
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
            <div className="md:hidden flex justify-center gap-1 p-2 border-b border-mq-border bg-mq-background-secondary/50">
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
                    <span className={cn('text-sm font-semibold', isSelected && 'text-white')}>
                      {formatDayNumber(day)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Calendar Grid with Time Lines - Scrollable from 6am to 12am */}
            {/* Desktop: Full week view */}
            <div
              className="hidden md:block overflow-auto"
              style={{ maxHeight: '700px' }}
              role="grid"
              aria-label={t('calendarWeeklyGridLabel')}
              aria-roledescription={t('calendarWeeklyGridDescription')}
            >
              <div className="min-w-[800px]">
                {/* Day Headers - Sticky with MQ Key Dates */}
                <div
                  className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-mq-border sticky top-0 bg-mq-background z-20"
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
                          isTodayCell && 'bg-mq-primary/5',
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
                        {dayMQDates.filter((d) => /last date to enrol/i.test(d.event)).length >
                          0 && (
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
                                      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
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
                      className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-mq-border bg-mq-background-secondary/50"
                      role="row"
                    >
                      {/* Label column */}
                      <div className="p-2 text-xs text-mq-content-secondary text-right pr-2 border-r border-mq-border flex items-center justify-end">
                        {t('calendarAllDay')}
                      </div>
                      {/* Full-day events for each day */}
                      {weekDays.map((day) => {
                        const dayMQDates = getMQKeyDatesForDay(day).filter(
                          (d) => d.category !== 'classes' && !/last date to enrol/i.test(d.event),
                        );
                        const isTodayCell = dayjs(day).isSame(dayjs(), 'day');

                        return (
                          <div
                            key={`fullday-${day.toISOString()}`}
                            className={cn(
                              'min-h-[48px] p-1 border-r border-mq-border/80 last:border-r-0 flex flex-col gap-1',
                              isTodayCell && 'bg-mq-primary/5',
                            )}
                          >
                            {dayMQDates.map((mqDate) => {
                              const colors = MQ_DATE_COLORS[mqDate.category];
                              return (
                                <div
                                  key={mqDate.id}
                                  className={cn(
                                    'flex-1 min-h-[28px] px-2 py-1 rounded-md text-[10px] font-bold flex items-center justify-center text-center leading-tight shadow-md ring-1 ring-inset ring-white/20',
                                    colors.bg,
                                    colors.text,
                                    colors.border,
                                    'border-2',
                                  )}
                                  title={
                                    mqDate.description
                                      ? `${mqDate.event} - ${mqDate.term}: ${mqDate.description}`
                                      : `${mqDate.event} - ${mqDate.term}`
                                  }
                                >
                                  <span className="line-clamp-2 drop-shadow-sm">
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
                            'calendar-grid-cell border-t border-mq-border/90 border-r border-mq-border/80 last:border-r-0',
                            dayIndex === 0 && 'border-l border-mq-border/80',
                            dayjs(day).isSame(dayjs(), 'day') && 'bg-mq-primary/[0.03]',
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
                          className="calendar-day-column relative border-r border-mq-border/60 last:border-r-0"
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
                                className="absolute rounded-md shadow-md z-10 border-l-4 overflow-hidden cursor-pointer hover:opacity-80 hover:shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-[44px] min-w-[44px] flex flex-col justify-center bg-mq-card-background/90 backdrop-blur"
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
                                  const originalUnit = units.find((u) => u.id === unitData.id);
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

                          {/* Deadlines - filled time block with unit color */}
                          {dayDeadlines.map((deadline, idx) => {
                            const dueDayjs = dayjs(deadline.dueDate);
                            const dueDate = dueDayjs.toDate();
                            const hours = dueDayjs.hour();
                            const minutes = dueDayjs.minute();
                            const deadlineColor = getDeadlineColor(deadline);
                            const deadlineTypeLabel = getDeadlineTypeLabel(deadline.type);

                            // Default 1 hour duration from due time
                            const posInfo = getTimePositionAndHeight(
                              hours,
                              minutes,
                              hours + 1,
                              minutes,
                            );

                            // Display name: UNIT_CODE – Type or Title
                            const displayName = `${deadline.unitCode} – ${deadline.title}`;

                            if (!posInfo || hours < START_HOUR) {
                              // Show at top if outside visible hours
                              const isHighlighted = deadlineHighlightActive && highlightedDeadlineId === deadline.id;
                              return (
                                <button
                                  key={deadline.id}
                                  type="button"
                                  ref={(el) => {
                                    if (el) deadlineRefs.current.set(deadline.id, el);
                                  }}
                                  onClick={() => openEditDeadline(deadline)}
                                  className={cn(
                                    'absolute left-1 right-1 text-left text-xs px-2 py-1.5 rounded shadow-sm font-medium z-10 text-white line-clamp-2 break-words leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-[44px]',
                                    deadline.completed && 'opacity-50 line-through',
                                    isHighlighted && 'ring-4 ring-mq-primary ring-offset-2 ring-offset-mq-background shadow-lg shadow-mq-primary/30 animate-pulse',
                                  )}
                                  style={{
                                    top: 4 + idx * 24,
                                    backgroundColor: deadlineColor,
                                  }}
                                  aria-label={t('calendarDeadlineAriaLabel', {
                                    displayName,
                                    instruction: t('calendarPressEnterToEdit'),
                                    time: formatTimeShort(dueDate),
                                    type: deadlineTypeLabel,
                                  })}
                                  title={t('calendarDeadlineTitle', {
                                    displayName,
                                    time: formatTimeShort(dueDate),
                                    type: deadlineTypeLabel,
                                  })}
                                >
                                  <span className="block truncate">{displayName}</span>
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
                            const isHighlightedDeadline = deadlineHighlightActive && highlightedDeadlineId === deadline.id;

                            return (
                              <button
                                key={deadline.id}
                                type="button"
                                ref={(el) => {
                                  if (el) deadlineRefs.current.set(deadline.id, el);
                                }}
                                onClick={() => openEditDeadline(deadline)}
                                className={cn(
                                  'absolute text-left text-xs px-2 py-1.5 rounded-md shadow-md font-medium z-10 border-l-4 text-white line-clamp-2 break-words leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-[44px]',
                                  deadline.completed && 'opacity-50 line-through',
                                  isHighlightedDeadline && 'ring-4 ring-mq-primary ring-offset-2 ring-offset-mq-background shadow-lg shadow-mq-primary/30 animate-pulse z-20',
                                )}
                                style={{
                                  top: posInfo.top,
                                  height: Math.max(posInfo.height, 44),
                                  left,
                                  width,
                                  backgroundColor: `${deadlineColor}dd`,
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
                                title={t('calendarDeadlineTitle', {
                                  displayName,
                                  time: formatTimeShort(dueDate),
                                  type: deadlineTypeLabel,
                                })}
                              >
                                <span className="block line-clamp-2 break-words leading-tight">
                                  {displayName}
                                </span>
                                <span className="text-[10px] opacity-80">
                                  {formatTimeShort(dueDate)}
                                </span>
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
                                    'absolute left-1 right-1 text-left text-[10px] px-2 py-1.5 rounded shadow-sm font-medium z-10 line-clamp-2 break-words leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-[44px]',
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
                                  <span className="block truncate">{eventTitle}</span>
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
                                  'absolute text-left text-[10px] px-2 py-1.5 rounded-md shadow-md font-medium z-10 border-l-4 line-clamp-2 break-words leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-[44px]',
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
                                <span className="block line-clamp-2 break-words leading-tight">
                                  {eventTitle}
                                </span>
                                <span className="text-[8px] opacity-80">{event.time}</span>
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
              className="md:hidden overflow-auto"
              style={{ maxHeight: '600px' }}
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
                      isTodayCell && 'bg-mq-primary/5',
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
                                <AlertTriangle className="inline h-3 w-3 mr-1" aria-hidden="true" />
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
                        'flex-1 border-t border-mq-border/90',
                        dayjs(mobileSelectedDay).isSame(dayjs(), 'day') && 'bg-mq-primary/[0.03]',
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
                              className="absolute rounded-md shadow-md z-10 border-l-4 overflow-hidden cursor-pointer hover:opacity-80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus min-h-[44px] flex flex-col justify-center bg-mq-card-background/90 backdrop-blur p-2"
                              style={{
                                top: posInfo.top,
                                height: Math.max(posInfo.height, 44),
                                left,
                                width,
                                borderLeftColor: unitData.color,
                              }}
                              onClick={() => {
                                const originalUnit = units.find((u) => u.id === unitData.id);
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
                          const deadlineColor = getDeadlineColor(deadline);

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
                                'absolute text-left text-xs px-2 py-1.5 rounded-md shadow-md font-medium z-10 border-l-4 text-white min-h-[44px]',
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
                              <span className="block line-clamp-2">
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
                                'absolute text-left text-xs px-2 py-1.5 rounded-md shadow-md font-medium z-10 border-l-4 min-h-[44px]',
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
                              <span className="block line-clamp-2">{eventTitle}</span>
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
        </MagicCard>
      </ScrollReveal>

      {/* Two Column Layout: Assignments/Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Assignments Widget */}
        <ScrollReveal delay={0.2}>
          <MagicCard
            isLiquidEnhanced
            className={
              highlightedDeadlineId && deadlines.find(d => d.id === highlightedDeadlineId)?.type === 'Assignment'
                ? 'ring-2 ring-mq-primary ring-offset-2 ring-offset-mq-background transition-all'
                : ''
            }
          >
            <div className="mq-magic-card-content p-0" ref={assignmentsWidgetRef}>
              <Card className="border-0 shadow-none bg-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      {t('assignments')}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral">
                        {assignments.filter((a) => !a.completed).length} {t('pending')}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={openAddAssignment}
                        aria-label={t('addAssignment')}
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assignments.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-10 w-10 text-mq-content-tertiary mx-auto mb-3" />
                      <p className="text-mq-content-secondary text-sm">{t('noAssignmentsYet')}</p>
                      <p className="text-mq-content-tertiary text-xs mt-1">
                        {t('noAssignmentsYetDesc')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {assignments
                        .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf())
                        .map((assignment) => {
                          const due = dayjs(assignment.dueDate);
                          const isOverdue = !assignment.completed && due.isBefore(dayjs());
                          const isHighlighted = deadlineHighlightActive && highlightedDeadlineId === assignment.id;
                          return (
                            <div
                              key={assignment.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => openAssignmentDetail(assignment)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  openAssignmentDetail(assignment);
                                }
                              }}
                              className={cn(
                                'flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer',
                                assignment.completed
                                  ? 'opacity-60 border-mq-border'
                                  : isOverdue
                                    ? 'border-red-300 bg-red-50 dark:bg-red-950/20'
                                    : 'border-mq-border hover:border-blue-300',
                                isHighlighted && 'ring-2 ring-mq-primary ring-offset-2 ring-offset-mq-background shadow-lg shadow-mq-primary/20 animate-pulse',
                              )}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleComplete(assignment.id);
                                  }}
                                  aria-label={
                                    assignment.completed
                                      ? t('markIncomplete')
                                      : t('markAsCompleted')
                                  }
                                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background rounded min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
                                >
                                  {assignment.completed ? (
                                    <CheckCircle2
                                      className="h-5 w-5 text-green-500"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <Circle
                                      className="h-5 w-5 text-mq-content-secondary"
                                      aria-hidden="true"
                                    />
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4
                                      className={cn(
                                        'font-medium text-sm truncate',
                                        assignment.completed && 'line-through',
                                      )}
                                    >
                                      {assignment.title}
                                    </h4>
                                    <Badge
                                      className={cn(PRIORITY_COLORS[assignment.priority], 'flex-shrink-0')}
                                      variant="neutral"
                                    >
                                      {t(`priority_${assignment.priority}` as TranslationKey)}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-mq-content-secondary truncate">
                                    {assignment.unitCode} • {formatMonthDayTime(due.toDate())}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditAssignment(assignment);
                                  }}
                                  className="p-2 hover:bg-mq-hover-background rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-[44px] min-w-[44px]"
                                  aria-label={t('calendarEditItem', { title: assignment.title })}
                                >
                                  <Edit2
                                    className="h-4 w-4 text-mq-content-secondary"
                                    aria-hidden="true"
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteAssignment(assignment);
                                  }}
                                  className="p-2 hover:bg-red-100 dark:hover:bg-red-950/30 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-[44px] min-w-[44px]"
                                  aria-label={t('calendarDeleteItem', { title: assignment.title })}
                                >
                                  <Trash2
                                    className="h-4 w-4 text-mq-content-secondary hover:text-red-500"
                                    aria-hidden="true"
                                  />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </MagicCard>
        </ScrollReveal>

        {/* Exams Widget */}
        <ScrollReveal delay={0.25}>
          <MagicCard isLiquidEnhanced>
            <div className="mq-magic-card-content p-0">
              <Card className="border-0 shadow-none bg-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-red-500" />
                      {t('exams')}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral">
                        {exams.filter((e) => !e.completed).length} {t('upcoming')}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={openAddExam}
                        aria-label={t('addExam')}
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {exams.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="h-10 w-10 text-mq-content-tertiary mx-auto mb-3" />
                      <p className="text-mq-content-secondary text-sm">{t('noExamsYet')}</p>
                      <p className="text-mq-content-tertiary text-xs mt-1">{t('noExamsYetDesc')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {exams
                        .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf())
                        .map((exam) => {
                          const due = dayjs(exam.dueDate);
                          const isOverdue = !exam.completed && due.isBefore(dayjs());
                          const examTypeLabel = getDeadlineTypeLabel(exam.type);
                          return (
                            <div
                              key={exam.id}
                              className={cn(
                                'flex items-center justify-between p-3 rounded-lg border transition-all',
                                exam.completed
                                  ? 'opacity-60 border-mq-border'
                                  : isOverdue
                                    ? 'border-red-300 bg-red-50 dark:bg-red-950/20'
                                    : 'border-mq-border hover:border-red-300',
                              )}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => toggleComplete(exam.id)}
                                  aria-label={
                                    exam.completed ? t('markIncomplete') : t('markAsCompleted')
                                  }
                                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background rounded min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
                                >
                                  {exam.completed ? (
                                    <CheckCircle2
                                      className="h-5 w-5 text-green-500"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <Circle
                                      className="h-5 w-5 text-mq-content-secondary"
                                      aria-hidden="true"
                                    />
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4
                                      className={cn(
                                        'font-medium text-sm truncate',
                                        exam.completed && 'line-through',
                                      )}
                                    >
                                      {exam.title}
                                    </h4>
                                    <Badge className={cn(PRIORITY_COLORS[exam.priority], 'flex-shrink-0')} variant="neutral">
                                      {t(`priority_${exam.priority}` as TranslationKey)}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-mq-content-secondary truncate">
                                    {exam.unitCode} • {examTypeLabel} •{' '}
                                    {formatMonthDayTime(due.toDate())}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                <button
                                  type="button"
                                  onClick={() => openEditExam(exam)}
                                  className="p-2 hover:bg-mq-hover-background rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-[44px] min-w-[44px]"
                                  aria-label={t('calendarEditItem', { title: exam.title })}
                                >
                                  <Edit2
                                    className="h-4 w-4 text-mq-content-secondary"
                                    aria-hidden="true"
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExam(exam)}
                                  className="p-2 hover:bg-red-100 dark:hover:bg-red-950/30 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-[44px] min-w-[44px]"
                                  aria-label={t('calendarDeleteItem', { title: exam.title })}
                                >
                                  <Trash2
                                    className="h-4 w-4 text-mq-content-secondary hover:text-red-500"
                                    aria-hidden="true"
                                  />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </MagicCard>
        </ScrollReveal>
      </div>

      {/* Second Row: Units and Events Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Add Unit Widget */}
        <ScrollReveal delay={0.3}>
          <MagicCard
            isLiquidEnhanced
            className={
              highlightedWidget === 'units'
                ? 'ring-2 ring-mq-primary ring-offset-2 ring-offset-mq-background transition-all'
                : ''
            }
          >
            <div className="mq-magic-card-content p-0" ref={unitsWidgetRef}>
              <Card className="border-0 shadow-none bg-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-purple-500" />
                      {t('myUnits')}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral">
                        {units.length} {t('units')}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={openAddUnit}
                        aria-label={t('addUnit')}
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {units.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="h-10 w-10 text-mq-content-tertiary mx-auto mb-3" />
                      <p className="text-mq-content-secondary text-sm">{t('noUnitsYet')}</p>
                      <p className="text-mq-content-tertiary text-xs mt-1">{t('noUnitsYetDesc')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {units.map((unit) => (
                        <div
                          key={unit.id}
                          className={`flex items-center gap-3 p-2 rounded-lg border transition-all cursor-pointer ${
                            highlightedUnitId === unit.id
                              ? 'border-mq-primary ring-2 ring-mq-primary ring-offset-2 ring-offset-mq-background shadow-[inset_0_0_0_1px_rgba(var(--c-primary-rgb),0.2)]'
                              : 'border-mq-border hover:border-mq-primary/20 hover:bg-mq-hover-background'
                          }`}
                          onClick={() => openUnitDetail(unit)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openUnitDetail(unit);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={t('calendarUnitTitle', { unitCode: unit.code })}
                        >
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: unit.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2 break-words">
                              {unit.code}
                            </h4>
                            <p className="text-xs text-mq-content-secondary line-clamp-2 break-words">
                              {unit.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditUnit(unit);
                              }}
                              className="p-1 hover:bg-mq-hover-background rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background"
                              title={t('calendarEditItem', { title: unit.code })}
                              aria-label={t('calendarEditItem', { title: unit.code })}
                            >
                              <Edit2
                                className="h-4 w-4 text-mq-content-secondary"
                                aria-hidden="true"
                              />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUnit(unit);
                              }}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-950/30 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background"
                              title={t('calendarDeleteItem', { title: unit.code })}
                              aria-label={t('calendarDeleteItem', { title: unit.code })}
                            >
                              <Trash2
                                className="h-4 w-4 text-mq-content-secondary hover:text-red-500"
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </MagicCard>
        </ScrollReveal>

        {/* Add Event Widget */}
        <ScrollReveal delay={0.35}>
          <MagicCard isLiquidEnhanced>
            <div className="mq-magic-card-content p-0">
              <Card className="border-0 shadow-none bg-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <PartyPopper className="h-5 w-5 text-green-500" />
                      {t('events')}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral">
                        {allEvents.length} {t('total')}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditEvent(null);
                          setEventDialogOpen(true);
                        }}
                        aria-label={t('addEvent')}
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {allEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <PartyPopper className="h-10 w-10 text-mq-content-tertiary mx-auto mb-3" />
                      <p className="text-mq-content-secondary text-sm">{t('noEventsYet')}</p>
                      <p className="text-mq-content-tertiary text-xs mt-1">
                        {t('noEventsYetDesc')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {allEvents.slice(0, 5).map((event) => {
                        const eventTitle = getEventTitle(event);
                        return (
                          <div
                            key={event.id}
                            className="flex items-center gap-3 p-2 rounded-lg border border-mq-border hover:border-mq-success/40 transition-all cursor-pointer"
                            onClick={() => handleEventClick(event)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleEventClick(event);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="w-3 h-3 rounded-full flex-shrink-0 bg-mq-success" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm line-clamp-2 break-words">
                                {eventTitle}
                              </h4>
                              <p className="text-xs text-mq-content-secondary line-clamp-2 break-words">
                                {event.time} • {event.location}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditEvent(event);
                                }}
                                className="p-1 hover:bg-mq-hover-background rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background"
                                title={t('calendarEditItem', { title: eventTitle })}
                                aria-label={t('calendarEditItem', { title: eventTitle })}
                              >
                                <Edit2
                                  className="h-4 w-4 text-mq-content-secondary"
                                  aria-hidden="true"
                                />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEvent(event);
                                }}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-950/30 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background"
                                title={t('calendarDeleteItem', { title: eventTitle })}
                                aria-label={t('calendarDeleteItem', { title: eventTitle })}
                              >
                                <Trash2
                                  className="h-4 w-4 text-mq-content-secondary hover:text-red-500"
                                  aria-hidden="true"
                                />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </MagicCard>
        </ScrollReveal>
      </div>

      {/* Full Width Upcoming Deadlines */}
      <ScrollReveal delay={0.4}>
        <MagicCard isLiquidEnhanced className="mt-6">
          <div className="mq-magic-card-content p-0">
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    {t('upcomingDeadlines')}
                  </span>
                  <div className="flex items-center gap-2">
                    {hasHydrated && deadlines.length > 0 && (
                      <Badge variant="neutral">
                        {deadlines.filter((d) => !d.completed).length} {t('pending')}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={openAddDeadline}
                      aria-label={t('addDeadline')}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!hasHydrated ? (
                  <div className="h-32 flex items-center justify-center">
                    <div className="animate-pulse text-mq-content-secondary">{t('loading')}</div>
                  </div>
                ) : deadlines.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarDays className="h-12 w-12 text-mq-content-tertiary mx-auto mb-4" />
                    <p className="text-mq-content-secondary font-medium">{t('noDeadlinesYet')}</p>
                    <p className="text-mq-content-tertiary text-sm mt-1">
                      {t('noDeadlinesYetDesc')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[...deadlines]
                      .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf())
                      .filter((d) => !d.completed)
                      .slice(0, 9)
                      .map((deadline) => {
                        const due = dayjs(deadline.dueDate);
                        const isOverdue = due.isBefore(dayjs());
                        const colors = TYPE_COLORS[deadline.type];
                        const deadlineTypeLabel = getDeadlineTypeLabel(deadline.type);

                        return (
                          <div
                            key={deadline.id}
                            className={cn(
                              'p-3 rounded-lg border-l-4 bg-mq-background-secondary',
                              colors.border,
                              isOverdue && 'bg-red-50 dark:bg-red-950/20',
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm line-clamp-2 break-words">
                                  {deadline.title}
                                </h4>
                                <p className="text-xs text-mq-content-secondary mt-1">
                                  {deadline.unitCode} • {deadlineTypeLabel}
                                </p>
                                <p
                                  className={cn(
                                    'text-xs mt-1',
                                    isOverdue ? 'text-red-600' : 'text-mq-content-secondary',
                                  )}
                                >
                                  {formatWeekdayMonthDayTime(due.toDate())}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditDeadline(deadline)}
                                  className="p-1 hover:bg-mq-hover-background rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background"
                                  aria-label={t('calendarEditItem', { title: deadline.title })}
                                >
                                  <Edit2
                                    className="h-4 w-4 text-mq-content-secondary"
                                    aria-hidden="true"
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDeadline(deadline)}
                                  className="p-1 hover:bg-red-100 dark:hover:bg-red-950/30 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background"
                                  aria-label={t('calendarDeleteItem', { title: deadline.title })}
                                >
                                  <Trash2
                                    className="h-4 w-4 text-mq-content-secondary hover:text-red-500"
                                    aria-hidden="true"
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </MagicCard>
      </ScrollReveal>

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
      />

      {/* Delete Confirmation Modal for Units */}
      {deleteConfirmOpen && unitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-mq-surface border border-mq-border rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-500" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-mq-surface border border-mq-border rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-mq-content">{t('deleteAssignmentConfirm' as TranslationKey) || 'Delete Assignment?'}</h3>
                <p className="text-sm text-mq-content-secondary">
                  {assignmentToDelete.title}
                </p>
              </div>
            </div>
            <p className="text-sm text-mq-content-secondary mb-6">{t('deleteAssignmentConfirmDesc' as TranslationKey) || 'This action cannot be undone. Are you sure you want to delete this assignment?'}</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-mq-surface border border-mq-border rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-mq-content">{t('deleteExamConfirm' as TranslationKey) || 'Delete Exam?'}</h3>
                <p className="text-sm text-mq-content-secondary">
                  {examToDelete.title}
                </p>
              </div>
            </div>
            <p className="text-sm text-mq-content-secondary mb-6">{t('deleteExamConfirmDesc' as TranslationKey) || 'This action cannot be undone. Are you sure you want to delete this exam?'}</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-mq-surface border border-mq-border rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-mq-content">{t('deleteDeadlineConfirm' as TranslationKey) || 'Delete Deadline?'}</h3>
                <p className="text-sm text-mq-content-secondary">
                  {deadlineToDelete.title}
                </p>
              </div>
            </div>
            <p className="text-sm text-mq-content-secondary mb-6">{t('deleteDeadlineConfirmDesc' as TranslationKey) || 'This action cannot be undone. Are you sure you want to delete this deadline?'}</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-mq-surface border border-mq-border rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-mq-content">{t('deleteEventConfirm' as TranslationKey) || 'Delete Event?'}</h3>
                <p className="text-sm text-mq-content-secondary">
                  {eventToDelete.title}
                </p>
              </div>
            </div>
            <p className="text-sm text-mq-content-secondary mb-6">{t('deleteEventConfirmDesc' as TranslationKey) || 'This action cannot be undone. Are you sure you want to delete this event?'}</p>
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

      {/* Assignment Detail Panel */}
      <AssignmentDetailPanel
        assignment={selectedAssignment}
        open={assignmentDetailOpen}
        onOpenChange={setAssignmentDetailOpen}
        onEdit={(assignment) => {
          setAssignmentDetailOpen(false);
          openEditAssignment(assignment);
        }}
      />
    </div>
  );
}
