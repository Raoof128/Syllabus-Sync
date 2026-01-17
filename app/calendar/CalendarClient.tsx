'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { MagicCard } from '@/components/ui/MagicCard';
import { sampleEvents } from '@/data/sampleEvents';
import { getMQKeyDatesForDay, MQ_DATE_COLORS } from '@/data/mqKeyDates';
import dynamic from 'next/dynamic';
import {
  format,
  isSameDay,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  addWeeks,
  subWeeks,
  getHours,
  getMinutes,
} from 'date-fns';
import { cn } from '@/lib/utils';

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

const ExamForm = dynamic(() => import('@/components/exams/ExamForm'), {
  loading: () => null,
});

// Hours to display (6 AM to 11 PM = 18 hours)
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6am to 11pm (23)
const HOUR_HEIGHT = 48; // pixels per hour
const START_HOUR = 6; // First visible hour

// Type colors for the calendar
const TYPE_COLORS = {
  Assignment: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white' },
  Exam: { bg: 'bg-red-500', border: 'border-red-600', text: 'text-white' },
  Quiz: { bg: 'bg-amber-500', border: 'border-amber-600', text: 'text-white' },
  Presentation: { bg: 'bg-purple-500', border: 'border-purple-600', text: 'text-white' },
  Event: { bg: 'bg-green-500', border: 'border-green-600', text: 'text-white' },
};

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
  const userEvents = useEventsStore((state) => state.events);
  const units = useUnitsStore((state) => state.units);
  const removeUnit = useUnitsStore((state) => state.removeUnit);

  const hasHydrated = useHydration();
  const { t } = useTranslation();

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

  const unitsWidgetRef = useRef<HTMLDivElement>(null);

  // Highlighted unit derived from URL query parameter
  const highlightedUnitId = useMemo(() => searchParams.get('highlightUnit'), [searchParams]);

  // Handle highlighted unit side effects (scroll + auto-clear)
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
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );

  // Get days of the current week
  const weekDays = useMemo(() => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  }, [currentWeekStart]);

  // Combine all events
  const allEvents = useMemo(() => [...sampleEvents, ...userEvents], [userEvents]);

  // Get unit schedules for a specific day
  const getUnitsForDay = (date: Date) => {
    const dayName = format(date, 'EEEE'); // Monday, Tuesday, etc.
    return units.flatMap((unit) =>
      unit.schedule.filter((s) => s.day === dayName).map((s) => ({ ...unit, schedule: s })),
    );
  };

  // Get items for a specific day (filtering out "classes" category from MQ dates since we show units instead)
  const getItemsForDay = (date: Date) => {
    const dayDeadlines = deadlines.filter((d) => isSameDay(new Date(d.dueDate), date));
    const dayEvents = allEvents.filter((e) => isSameDay(new Date(e.date), date));
    const dayMQDates = getMQKeyDatesForDay(date).filter((d) => d.category !== 'classes');
    const dayUnits = getUnitsForDay(date);
    return { deadlines: dayDeadlines, events: dayEvents, mqDates: dayMQDates, units: dayUnits };
  };

  // Get color for a deadline (custom color or unit color)
  const getDeadlineColor = (deadline: Deadline): string => {
    if (deadline.color) return deadline.color;
    const unit = units.find((u) => u.code === deadline.unitCode);
    return unit?.color || '#6366f1'; // fallback to indigo
  };

  // Current time position for the red line indicator
  const currentTimePosition = useMemo(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    if (hours < START_HOUR || hours >= 24) return null;
    return (hours - START_HOUR) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
  }, []);

  // Navigation handlers
  const goToPreviousWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

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

  // Exam handlers
  const openAddExam = () => {
    setEditExam(null);
    setExamDialogOpen(true);
  };

  const openEditExam = (exam: Deadline) => {
    setEditExam(exam);
    setExamDialogOpen(true);
  };

  // Event handlers - navigate to feed with highlight
  const handleEventClick = (event: Event) => {
    if (userEvents.find((e) => e.id === event.id)) {
      setEditEvent(event);
      setEventDialogOpen(true);
    } else {
      router.push(`/feed?highlight=${event.id}`);
    }
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
            {/* Calendar Header - Removed add deadline button */}
            <div className="flex items-center justify-between p-4 border-b border-mq-border">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousWeek}
                  aria-label="Previous week"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  {t('today')}
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextWeek} aria-label="Next week">
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
              <h2 className="text-lg font-semibold text-mq-content">
                {format(currentWeekStart, 'MMMM yyyy')}
              </h2>
              <div className="w-24" /> {/* Spacer for balance */}
            </div>

            {/* Calendar Grid with Time Lines - Scrollable from 6am to 12am */}
            <div
              className="overflow-auto"
              style={{ maxHeight: '700px' }}
              role="grid"
              aria-label="Weekly calendar"
              aria-roledescription="Interactive weekly calendar showing units, deadlines, and events from 6 AM to 11 PM. Use arrow keys to navigate weeks. Tab through calendar items to interact."
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
                    const dayName = format(day, 'EEEE');
                    const dayDate = format(day, 'd');
                    const isTodayCell = isToday(day);
                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          'p-2 text-center border-r border-mq-border last:border-r-0',
                          isTodayCell && 'bg-mq-primary/5',
                        )}
                        role="columnheader"
                        aria-label={`${dayName}, ${dayDate}${isTodayCell ? ', Today' : ''}`}
                      >
                        <div
                          className="text-xs text-mq-content-secondary uppercase font-medium"
                          aria-hidden="true"
                        >
                          {format(day, 'EEE')}
                        </div>
                        <div
                          className={cn(
                            'text-xl font-semibold mt-1 inline-flex items-center justify-center',
                            isTodayCell
                              ? 'w-9 h-9 rounded-full bg-[#7A0A21] text-white'
                              : 'text-mq-content',
                          )}
                          aria-hidden="true"
                        >
                          {format(day, 'd')}
                        </div>
                        {/* MQ Key Dates badges in header */}
                        {dayMQDates.length > 0 && (
                          <div className="mt-1 flex flex-col gap-1">
                            {dayMQDates.slice(0, 2).map((mqDate) => {
                              const isLastEnroll = /last date to enrol/i.test(mqDate.event);
                              const colors = MQ_DATE_COLORS[mqDate.category];
                              return (
                                <div
                                  key={mqDate.id}
                                  className={cn(
                                    'text-[9px] px-1.5 py-0.5 rounded-md font-semibold line-clamp-2 break-words leading-tight shadow-sm border',
                                    isLastEnroll &&
                                      'text-[11px] px-2 py-1 uppercase tracking-wide ring-2 ring-red-500 ring-offset-1 ring-offset-mq-background shadow-md bg-red-600 border-red-700 text-white',
                                    !isLastEnroll && [colors.bg, colors.text, colors.border],
                                  )}
                                  title={`${mqDate.event} - ${mqDate.term}`}
                                >
                                  <span className="flex items-center justify-center gap-1">
                                    {isLastEnroll && (
                                      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                                    )}
                                    {mqDate.event}
                                  </span>
                                </div>
                              );
                            })}
                            {dayMQDates.length > 2 && (
                              <div className="text-[9px] text-mq-content-secondary font-medium">
                                +{dayMQDates.length - 2} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Time Grid */}
                <div
                  className="relative"
                  style={{ height: HOURS.length * HOUR_HEIGHT + 12 }}
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
                        className="text-xs text-mq-content-secondary text-right pr-2 -mt-2 border-r border-mq-border"
                        role="rowheader"
                        aria-label={`${format(new Date().setHours(hour, 0), 'h a')}`}
                      >
                        {format(new Date().setHours(hour, 0), 'h a')}
                      </div>
                      {/* Hour Lines for each day */}
                      {weekDays.map((day) => (
                        <div
                          key={`${day.toISOString()}-${hour}`}
                          className={cn(
                            'border-t border-mq-border/50 border-r border-mq-border/30 last:border-r-0',
                            isToday(day) && 'bg-mq-primary/[0.02]',
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
                        const dueDate = new Date(deadline.dueDate);
                        const hours = getHours(dueDate);
                        const minutes = getMinutes(dueDate);
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
                          className="relative border-r border-mq-border/30 last:border-r-0"
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

                            // Format time for display (e.g., "9:00 AM")
                            const formatTime = (time: string) => {
                              const [h, m] = time.split(':').map(Number);
                              const hour = h % 12 || 12;
                              const period = h >= 12 ? 'PM' : 'AM';
                              return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
                            };

                            return (
                              <button
                                key={`${unitData.id}-${schedule.day}-${schedule.startTime}`}
                                type="button"
                                className="absolute rounded-md shadow-md z-10 border-l-4 overflow-hidden cursor-pointer hover:opacity-80 hover:shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-[44px] min-w-[44px] flex flex-col justify-center"
                                style={{
                                  top: posInfo.top,
                                  height: Math.max(posInfo.height, 44),
                                  left,
                                  width,
                                  backgroundColor: `${unitData.color}20`,
                                  borderLeftColor: unitData.color,
                                }}
                                aria-label={`${unitData.code} class, ${formatTime(schedule.startTime)} to ${formatTime(schedule.endTime)}${unitData.location?.building ? ` in ${unitData.location.building} ${unitData.location.room}` : ''}. Press Enter or Space to view details.`}
                                title={`Click to view ${unitData.code} details`}
                                onClick={() => {
                                  const originalUnit = units.find((u) => u.id === unitData.id);
                                  if (originalUnit) openUnitDetail(originalUnit);
                                }}
                              >
                                <div
                                  className="p-1 h-full overflow-hidden"
                                  style={{ color: unitData.color }}
                                >
                                  <span className="block text-xs font-bold line-clamp-2 break-words leading-tight">
                                    {unitData.code}
                                  </span>
                                  <span className="text-[10px] opacity-80 block">
                                    {formatTime(schedule.startTime)} -{' '}
                                    {formatTime(schedule.endTime)}
                                  </span>
                                  {posInfo.height > 50 && (
                                    <span className="text-[10px] opacity-70 block line-clamp-2 break-words leading-tight">
                                      {unitData.location.building} {unitData.location.room}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}

                          {/* Deadlines - filled time block with unit color */}
                          {dayDeadlines.map((deadline, idx) => {
                            const dueDate = new Date(deadline.dueDate);
                            const hours = getHours(dueDate);
                            const minutes = getMinutes(dueDate);
                            const deadlineColor = getDeadlineColor(deadline);

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
                              return (
                                <button
                                  key={deadline.id}
                                  type="button"
                                  onClick={() => openEditDeadline(deadline)}
                                  className={cn(
                                    'absolute left-1 right-1 text-left text-xs px-2 py-1.5 rounded shadow-sm font-medium z-10 text-white line-clamp-2 break-words leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-[44px]',
                                    deadline.completed && 'opacity-50 line-through',
                                  )}
                                  style={{
                                    top: 4 + idx * 24,
                                    backgroundColor: deadlineColor,
                                  }}
                                  aria-label={`${deadline.type} ${displayName} due ${format(dueDate, 'h:mm a')}. Press Enter to edit.`}
                                  title={`${deadline.type}: ${displayName} @ ${format(dueDate, 'h:mm a')}`}
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

                            return (
                              <button
                                key={deadline.id}
                                type="button"
                                onClick={() => openEditDeadline(deadline)}
                                className={cn(
                                  'absolute text-left text-xs px-2 py-1.5 rounded-md shadow-md font-medium z-10 border-l-4 text-white line-clamp-2 break-words leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-[44px]',
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
                                aria-label={`${deadline.type} ${displayName} due ${format(dueDate, 'h:mm a')}. Press Enter to edit. ${deadline.completed ? 'Completed' : 'Not completed'}.`}
                                title={`${deadline.type}: ${displayName} @ ${format(dueDate, 'h:mm a')}`}
                              >
                                <span className="block line-clamp-2 break-words leading-tight">
                                  {displayName}
                                </span>
                                <span className="text-[10px] opacity-80">
                                  {format(dueDate, 'h:mm a')}
                                </span>
                              </button>
                            );
                          })}

                          {/* Events - filled time block */}
                          {dayEvents.map((event, idx) => {
                            const timeInfo = parseTimeRange(event.time);
                            const colors = TYPE_COLORS.Event;

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
                                    colors.bg,
                                    colors.text,
                                  )}
                                  style={{ top: offsetTop }}
                                  aria-label={`Event ${event.title} at ${event.time}. Press Enter to view details.`}
                                  title={`Event: ${event.title} @ ${event.time}`}
                                >
                                  <span className="block truncate">{event.title}</span>
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
                                    colors.bg,
                                    colors.text,
                                  )}
                                  style={{ top: offsetTop }}
                                  aria-label={`Event ${event.title} at ${event.time}`}
                                  title={`Event: ${event.title} @ ${event.time}`}
                                >
                                  {event.title}
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
                                  colors.bg,
                                  colors.text,
                                  'border-green-700',
                                )}
                                style={{
                                  top: posInfo.top,
                                  height: Math.max(posInfo.height, 44),
                                  left: evtLeft,
                                  width: evtWidth,
                                }}
                                aria-label={`Event ${event.title} at ${event.time}. Press Enter to view details.`}
                                title={`Event: ${event.title} @ ${event.time}`}
                              >
                                <span className="block line-clamp-2 break-words leading-tight">
                                  {event.title}
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
          </div>
        </MagicCard>
      </ScrollReveal>

      {/* Two Column Layout: Assignments/Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Assignments Widget */}
        <ScrollReveal delay={0.2}>
          <MagicCard isLiquidEnhanced>
            <div className="mq-magic-card-content p-0">
              <Card className="border-0 shadow-none bg-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      {t('assignments' as 'title')}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral">
                        {assignments.filter((a) => !a.completed).length} {t('pending')}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={openAddAssignment}
                        aria-label={t('addAssignment' as 'title') || 'Add Assignment'}
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
                      <p className="text-mq-content-secondary text-sm">
                        {t('noAssignmentsYet' as 'title')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {assignments
                        .sort(
                          (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
                        )
                        .map((assignment) => {
                          const due = new Date(assignment.dueDate);
                          const isOverdue = !assignment.completed && due < new Date();
                          return (
                            <div
                              key={assignment.id}
                              className={cn(
                                'flex items-center justify-between p-3 rounded-lg border transition-all',
                                assignment.completed
                                  ? 'opacity-60 border-mq-border'
                                  : isOverdue
                                    ? 'border-red-300 bg-red-50 dark:bg-red-950/20'
                                    : 'border-mq-border hover:border-blue-300',
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => toggleComplete(assignment.id)}
                                  aria-label={
                                    assignment.completed ? 'Mark as incomplete' : 'Mark as complete'
                                  }
                                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                                <div>
                                  <h4
                                    className={cn(
                                      'font-medium text-sm',
                                      assignment.completed && 'line-through',
                                    )}
                                  >
                                    {assignment.title}
                                  </h4>
                                  <p className="text-xs text-mq-content-secondary">
                                    {assignment.unitCode} • {format(due, 'MMM d, h:mm a')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={PRIORITY_COLORS[assignment.priority]}
                                  variant="neutral"
                                >
                                  {assignment.priority}
                                </Badge>
                                <button
                                  type="button"
                                  onClick={() => openEditAssignment(assignment)}
                                  className="p-2 hover:bg-mq-hover-background rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-[44px] min-w-[44px]"
                                  aria-label={`Edit ${assignment.title}`}
                                >
                                  <Edit2
                                    className="h-4 w-4 text-mq-content-secondary"
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
                      {t('exams' as 'title')}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral">
                        {exams.filter((e) => !e.completed).length} {t('upcoming' as 'title')}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={openAddExam}
                        aria-label={t('addDeadline')}
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
                      <p className="text-mq-content-secondary text-sm">
                        {t('noExamsYet' as 'title')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {exams
                        .sort(
                          (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
                        )
                        .map((exam) => {
                          const due = new Date(exam.dueDate);
                          const isOverdue = !exam.completed && due < new Date();
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
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => toggleComplete(exam.id)}
                                  aria-label={
                                    exam.completed ? 'Mark as incomplete' : 'Mark as complete'
                                  }
                                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                                <div>
                                  <h4
                                    className={cn(
                                      'font-medium text-sm',
                                      exam.completed && 'line-through',
                                    )}
                                  >
                                    {exam.title}
                                  </h4>
                                  <p className="text-xs text-mq-content-secondary">
                                    {exam.unitCode} • {exam.type} • {format(due, 'MMM d, h:mm a')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={PRIORITY_COLORS[exam.priority]} variant="neutral">
                                  {exam.priority}
                                </Badge>
                                <button
                                  type="button"
                                  onClick={() => openEditExam(exam)}
                                  className="p-2 hover:bg-mq-hover-background rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-[44px] min-w-[44px]"
                                  aria-label={`Edit ${exam.title}`}
                                >
                                  <Edit2
                                    className="h-4 w-4 text-mq-content-secondary"
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
          <MagicCard isLiquidEnhanced>
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
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {units.map((unit) => (
                        <div
                          key={unit.id}
                          className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${
                            highlightedUnitId === unit.id
                              ? 'border-mq-primary bg-mq-primary/10 ring-2 ring-mq-primary ring-offset-2 ring-offset-mq-background animate-pulse'
                              : 'border-mq-border hover:border-mq-primary/20'
                          }`}
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
                              onClick={() => openEditUnit(unit)}
                              className="p-1 hover:bg-mq-hover-background rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background"
                              title={`Edit ${unit.code}`}
                              aria-label={`Edit ${unit.code}`}
                            >
                              <Edit2
                                className="h-4 w-4 text-mq-content-secondary"
                                aria-hidden="true"
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUnit(unit)}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-950/30 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background"
                              title={`Delete ${unit.code}`}
                              aria-label={`Delete ${unit.code}`}
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
                      {t('events' as 'title')}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral">
                        {allEvents.length} {t('total' as 'title')}
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
                      <p className="text-mq-content-secondary text-sm">
                        {t('noEventsYet' as 'title')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {allEvents.slice(0, 5).map((event) => (
                        <button
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg border border-mq-border hover:border-green-300 transition-all text-left"
                        >
                          <div className="w-3 h-3 rounded-full flex-shrink-0 bg-green-500" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2 break-words">
                              {event.title}
                            </h4>
                            <p className="text-xs text-mq-content-secondary line-clamp-2 break-words">
                              {event.time} • {event.location}
                            </p>
                          </div>
                        </button>
                      ))}
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
                    <Button size="sm" variant="outline" onClick={openAddDeadline}>
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
                    <p className="text-mq-content-secondary">{t('noDeadlinesYet')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[...deadlines]
                      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                      .filter((d) => !d.completed)
                      .slice(0, 9)
                      .map((deadline) => {
                        const due = new Date(deadline.dueDate);
                        const isOverdue = due < new Date();
                        const colors = TYPE_COLORS[deadline.type];

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
                                  {deadline.unitCode} • {deadline.type}
                                </p>
                                <p
                                  className={cn(
                                    'text-xs mt-1',
                                    isOverdue ? 'text-red-600' : 'text-mq-content-secondary',
                                  )}
                                >
                                  {format(due, 'EEE, MMM d @ h:mm a')}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => openEditDeadline(deadline)}
                                className="p-1 hover:bg-mq-hover-background rounded ml-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background"
                                aria-label={`Edit ${deadline.title}`}
                              >
                                <Edit2
                                  className="h-4 w-4 text-mq-content-secondary"
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
        onOpenChange={setUnitDetailOpen}
        onEditDeadline={handleEditDeadlineFromPanel}
      />

      {/* Delete Confirmation Modal */}
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
    </div>
  );
}
