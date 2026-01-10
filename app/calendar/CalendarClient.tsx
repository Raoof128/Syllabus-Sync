'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  GraduationCap,
  PartyPopper,
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
import { getMQKeyDatesForDay, MQ_DATE_COLORS, PROGRAM_LABELS } from '@/data/mqKeyDates';
import dynamic from 'next/dynamic';
import { format, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, isToday, addWeeks, subWeeks, getHours, getMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

// Dynamically import forms
const EventForm = dynamic(() => import('@/components/events/EventForm'), {
  loading: () => null,
});

const UnitForm = dynamic(() => import('@/components/units/UnitForm'), {
  loading: () => null,
});

// Hours to display (7 AM to 12 AM midnight = 17 hours visible, but 6 AM exists logically)
const HOURS = Array.from({ length: 18 }, (_, i) => i + 7); // 7am to 12am (24)
const HOUR_HEIGHT = 48; // pixels per hour
const START_HOUR = 7; // First visible hour (6 AM exists logically but not shown)

// Type colors for the calendar
const TYPE_COLORS = {
  Assignment: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white' },
  Exam: { bg: 'bg-red-500', border: 'border-red-600', text: 'text-white' },
  Quiz: { bg: 'bg-amber-500', border: 'border-amber-600', text: 'text-white' },
  Presentation: { bg: 'bg-purple-500', border: 'border-purple-600', text: 'text-white' },
  Event: { bg: 'bg-green-500', border: 'border-green-600', text: 'text-white' },
};

// Parse time string like "2:00 PM" or "14:00" or "10:00 AM - 2:00 PM" to start/end hours
function parseTimeRange(timeStr: string): { startHour: number; startMin: number; endHour: number; endMin: number } | null {
  if (!timeStr) return null;

  // Try parsing range format "10:00 AM - 2:00 PM"
  const rangeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?\s*[-–]\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (rangeMatch) {
    let startHour = parseInt(rangeMatch[1], 10);
    const startMin = parseInt(rangeMatch[2], 10);
    const startPeriod = (rangeMatch[3] || rangeMatch[6] || 'AM').toUpperCase();

    let endHour = parseInt(rangeMatch[4], 10);
    const endMin = parseInt(rangeMatch[5], 10);
    const endPeriod = (rangeMatch[6] || 'PM').toUpperCase();

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

  // Try parsing "14:00" format
  const militaryMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (militaryMatch) {
    const hours = parseInt(militaryMatch[1], 10);
    const minutes = parseInt(militaryMatch[2], 10);
    return { startHour: hours, startMin: minutes, endHour: hours + 1, endMin: minutes };
  }

  return null;
}

// Calculate position and height for a time-based item
function getTimePositionAndHeight(startHour: number, startMin: number, endHour: number, endMin: number): { top: number; height: number } | null {
  // Clamp to visible range (7am to midnight)
  const effectiveStartHour = Math.max(START_HOUR, Math.min(24, startHour));
  const effectiveEndHour = Math.max(START_HOUR, Math.min(24, endHour));

  if (effectiveStartHour >= 24) return null;

  const top = (effectiveStartHour - START_HOUR) * HOUR_HEIGHT + (startMin / 60) * HOUR_HEIGHT;
  const durationHours = (effectiveEndHour - effectiveStartHour) + (endMin - startMin) / 60;
  const height = Math.max(20, durationHours * HOUR_HEIGHT);

  return { top, height };
}

export default function CalendarClient() {
  const router = useRouter();
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const toggleComplete = useDeadlinesStore((state) => state.toggleComplete);
  const userEvents = useEventsStore((state) => state.events);
  const units = useUnitsStore((state) => state.units);

  const hasHydrated = useHydration();
  const { t } = useTranslation();

  // Dialog states
  const [deadlineDialogOpen, setDeadlineDialogOpen] = useState(false);
  const [editDeadline, setEditDeadline] = useState<Deadline | null>(null);

  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);

  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Calendar state
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
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
      unit.schedule
        .filter((s) => s.day === dayName)
        .map((s) => ({ ...unit, schedule: s }))
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

  // Deadline handlers
  const openAddDeadline = () => {
    setEditDeadline(null);
    setDeadlineDialogOpen(true);
  };

  const openEditDeadline = (deadline: Deadline) => {
    setEditDeadline(deadline);
    setDeadlineDialogOpen(true);
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

  // Filter deadlines by type
  const assignments = deadlines.filter((d) => d.type === 'Assignment');
  const exams = deadlines.filter((d) => d.type === 'Exam' || d.type === 'Quiz');

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl calendar-page">
      <ScrollReveal>
        <header className="mb-6">
          <h1 className="text-mq-3xl font-bold text-mq-content mb-2">{t('calendar')}</h1>
          <p className="text-mq-content-secondary">{t('trackDeadlinesDesc')}</p>
        </header>
      </ScrollReveal>

      {/* Apple/Google Calendar Style Weekly View */}
      <ScrollReveal delay={0.1}>
        <MagicCard isLiquidEnhanced>
          <div className="mq-magic-card-content p-0">
            {/* Calendar Header - Removed add deadline button */}
            <div className="flex items-center justify-between p-4 border-b border-mq-border">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  {t('today')}
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="text-lg font-semibold text-mq-content">
                {format(currentWeekStart, 'MMMM yyyy')}
              </h2>
              <div className="w-24" /> {/* Spacer for balance */}
            </div>

            {/* Calendar Grid with Time Lines - Scrollable from 6am to 12am */}
            <div className="overflow-auto" style={{ maxHeight: '700px' }}>
              <div className="min-w-[800px]">
                {/* Day Headers - Sticky */}
                <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-mq-border sticky top-0 bg-mq-background z-20">
                  <div className="p-2 text-center text-xs text-mq-content-secondary border-r border-mq-border" />
                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'p-3 text-center border-r border-mq-border last:border-r-0',
                        isToday(day) && 'bg-mq-primary/5'
                      )}
                    >
                      <div className="text-xs text-mq-content-secondary uppercase font-medium">
                        {format(day, 'EEE')}
                      </div>
                      <div
                        className={cn(
                          'text-xl font-semibold mt-1 inline-flex items-center justify-center',
                          isToday(day)
                            ? 'w-9 h-9 rounded-full bg-mq-primary text-white'
                            : 'text-mq-content'
                        )}
                      >
                        {format(day, 'd')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time Grid */}
                <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
                  {/* Hour Lines */}
                  {HOURS.map((hour, index) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 grid grid-cols-[60px_repeat(7,1fr)]"
                      style={{ top: index * HOUR_HEIGHT }}
                    >
                      {/* Time Label */}
                      <div className="text-xs text-mq-content-secondary text-right pr-2 -mt-2 border-r border-mq-border">
                        {hour === 24 ? '12 AM' : format(new Date().setHours(hour, 0), 'h a')}
                      </div>
                      {/* Hour Lines for each day */}
                      {weekDays.map((day) => (
                        <div
                          key={`${day.toISOString()}-${hour}`}
                          className={cn(
                            'border-t border-mq-border/50 border-r border-mq-border/30 last:border-r-0',
                            isToday(day) && 'bg-mq-primary/[0.02]'
                          )}
                          style={{ height: HOUR_HEIGHT }}
                        />
                      ))}
                    </div>
                  ))}

                  {/* Current Time Indicator */}
                  {currentTimePosition !== null && (
                    <div
                      className="absolute left-[60px] right-0 z-30 pointer-events-none"
                      style={{ top: currentTimePosition }}
                    >
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 shadow-lg" />
                        <div className="flex-1 h-0.5 bg-red-500 shadow-sm" />
                      </div>
                    </div>
                  )}

                  {/* Events, Units and Deadlines Overlay */}
                  <div className="absolute left-[60px] right-0 top-0 bottom-0 grid grid-cols-7">
                    {weekDays.map((day) => {
                      const { deadlines: dayDeadlines, events: dayEvents, mqDates: dayMQDates, units: dayUnits } = getItemsForDay(day);

                      return (
                        <div key={day.toISOString()} className="relative border-r border-mq-border/30 last:border-r-0">
                          {/* MQ Key Dates - Full day background */}
                          {dayMQDates.map((mqDate, idx) => {
                            const colors = MQ_DATE_COLORS[mqDate.category];
                            const programLabel = PROGRAM_LABELS[mqDate.program];
                            const isSpecial = mqDate.program !== 'general';

                            return (
                              <div
                                key={mqDate.id}
                                className={cn(
                                  'absolute left-0 right-0 z-5',
                                  colors.bgLight
                                )}
                                style={{ top: 0, height: '100%', opacity: 0.3 }}
                              >
                                <div
                                  className={cn(
                                    'absolute top-0 left-1 right-1 text-[9px] px-1 py-0.5 rounded font-medium z-10 truncate',
                                    colors.bg, colors.text
                                  )}
                                  style={{ top: idx * 18 + 2 }}
                                  title={`${mqDate.event} - ${mqDate.term}${isSpecial ? ` (${programLabel})` : ''}`}
                                >
                                  {isSpecial && <GraduationCap className="h-2 w-2 inline mr-0.5" />}
                                  {mqDate.event}
                                </div>
                              </div>
                            );
                          })}

                          {/* Units - filled time block with unit color */}
                          {dayUnits.map((unitData) => {
                            const schedule = unitData.schedule;
                            const timeInfo = parseTimeRange(`${schedule.startTime} - ${schedule.endTime}`);

                            if (!timeInfo) return null;

                            const posInfo = getTimePositionAndHeight(timeInfo.startHour, timeInfo.startMin, timeInfo.endHour, timeInfo.endMin);
                            if (!posInfo) return null;

                            return (
                              <div
                                key={`${unitData.id}-${schedule.day}-${schedule.startTime}`}
                                className="absolute left-1 right-1 rounded-md shadow-md z-10 border-l-4 overflow-hidden"
                                style={{
                                  top: posInfo.top,
                                  height: posInfo.height,
                                  backgroundColor: `${unitData.color}20`,
                                  borderLeftColor: unitData.color,
                                }}
                                title={`${unitData.code} - ${unitData.name}\n${schedule.startTime} - ${schedule.endTime}\n${unitData.location.building} ${unitData.location.room}`}
                              >
                                <div className="p-1 h-full" style={{ color: unitData.color }}>
                                  <span className="block text-[10px] font-bold truncate">{unitData.code}</span>
                                  <span className="text-[8px] opacity-80">{schedule.startTime}</span>
                                </div>
                              </div>
                            );
                          })}

                          {/* Deadlines - filled time block */}
                          {dayDeadlines.map((deadline, idx) => {
                            const dueDate = new Date(deadline.dueDate);
                            const hours = getHours(dueDate);
                            const minutes = getMinutes(dueDate);
                            const colors = TYPE_COLORS[deadline.type];

                            // Default 1 hour duration from due time
                            const posInfo = getTimePositionAndHeight(hours, minutes, hours + 1, minutes);

                            if (!posInfo || hours < START_HOUR) {
                              // Show at top if outside visible hours
                              return (
                                <button
                                  key={deadline.id}
                                  onClick={() => openEditDeadline(deadline)}
                                  className={cn(
                                    'absolute left-1 right-1 text-left text-[10px] px-1 py-0.5 rounded shadow-sm truncate font-medium z-10',
                                    colors.bg, colors.text,
                                    deadline.completed && 'opacity-50 line-through'
                                  )}
                                  style={{ top: (dayMQDates.length * 18) + 4 + (idx * 22) }}
                                  title={`${deadline.type}: ${deadline.title} @ ${format(dueDate, 'h:mm a')}`}
                                >
                                  {deadline.title}
                                </button>
                              );
                            }

                            return (
                              <button
                                key={deadline.id}
                                onClick={() => openEditDeadline(deadline)}
                                className={cn(
                                  'absolute left-1 right-1 text-left text-[10px] px-1 py-0.5 rounded-md shadow-md truncate font-medium z-10 border-l-4',
                                  colors.bg, colors.text, colors.border,
                                  deadline.completed && 'opacity-50 line-through'
                                )}
                                style={{ top: posInfo.top, height: posInfo.height }}
                                title={`${deadline.type}: ${deadline.title} @ ${format(dueDate, 'h:mm a')}`}
                              >
                                <span className="block truncate">{deadline.title}</span>
                                <span className="text-[8px] opacity-80">{format(dueDate, 'h:mm a')}</span>
                              </button>
                            );
                          })}

                          {/* Events - filled time block */}
                          {dayEvents.map((event, idx) => {
                            const timeInfo = parseTimeRange(event.time);
                            const colors = TYPE_COLORS.Event;

                            if (!timeInfo) {
                              // Show at top if no valid time
                              const offsetTop = (dayMQDates.length * 18) + 4 + (dayDeadlines.length * 22) + (idx * 22);
                              return (
                                <button
                                  key={event.id}
                                  onClick={() => handleEventClick(event)}
                                  className={cn(
                                    'absolute left-1 right-1 text-left text-[10px] px-1 py-0.5 rounded shadow-sm truncate font-medium z-10',
                                    colors.bg, colors.text
                                  )}
                                  style={{ top: offsetTop }}
                                  title={`Event: ${event.title} @ ${event.time}`}
                                >
                                  {event.title}
                                </button>
                              );
                            }

                            const posInfo = getTimePositionAndHeight(timeInfo.startHour, timeInfo.startMin, timeInfo.endHour, timeInfo.endMin);

                            if (!posInfo) {
                              const offsetTop = (dayMQDates.length * 18) + 4 + (dayDeadlines.length * 22) + (idx * 22);
                              return (
                                <button
                                  key={event.id}
                                  onClick={() => handleEventClick(event)}
                                  className={cn(
                                    'absolute left-1 right-1 text-left text-[10px] px-1 py-0.5 rounded shadow-sm truncate font-medium z-10',
                                    colors.bg, colors.text
                                  )}
                                  style={{ top: offsetTop }}
                                  title={`Event: ${event.title} @ ${event.time}`}
                                >
                                  {event.title}
                                </button>
                              );
                            }

                            return (
                              <button
                                key={event.id}
                                onClick={() => handleEventClick(event)}
                                className={cn(
                                  'absolute left-1 right-1 text-left text-[10px] px-1 py-0.5 rounded-md shadow-md truncate font-medium z-10 border-l-4',
                                  colors.bg, colors.text, 'border-green-700'
                                )}
                                style={{ top: posInfo.top, height: posInfo.height }}
                                title={`Event: ${event.title} @ ${event.time}`}
                              >
                                <span className="block truncate">{event.title}</span>
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

            {/* Legend */}
            <div className="flex flex-wrap gap-4 p-4 border-t border-mq-border">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-violet-500 to-purple-500" />
                <span>{t('myUnits')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span>{t('assignment' as 'title')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span>{t('exam' as 'title')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>{t('event' as 'title')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <GraduationCap className="h-3 w-3 text-mq-content-secondary" />
                <span>MQ Key Dates</span>
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
                      <Button size="sm" variant="outline" onClick={openAddDeadline}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assignments.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-10 w-10 text-mq-content-tertiary mx-auto mb-3" />
                      <p className="text-mq-content-secondary text-sm">{t('noAssignmentsYet' as 'title')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {assignments
                        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                        .map((assignment) => {
                          const due = new Date(assignment.dueDate);
                          const isOverdue = !assignment.completed && due < new Date();
                          return (
                            <div
                              key={assignment.id}
                              className={cn(
                                'flex items-center justify-between p-3 rounded-lg border transition-all',
                                assignment.completed ? 'opacity-60 border-mq-border' :
                                isOverdue ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : 'border-mq-border hover:border-blue-300'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <button onClick={() => toggleComplete(assignment.id)}>
                                  {assignment.completed ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-mq-content-secondary" />
                                  )}
                                </button>
                                <div>
                                  <h4 className={cn('font-medium text-sm', assignment.completed && 'line-through')}>
                                    {assignment.title}
                                  </h4>
                                  <p className="text-xs text-mq-content-secondary">
                                    {assignment.unitCode} • {format(due, 'MMM d, h:mm a')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={PRIORITY_COLORS[assignment.priority]} variant="neutral">
                                  {assignment.priority}
                                </Badge>
                                <button onClick={() => openEditDeadline(assignment)} className="p-1 hover:bg-mq-hover-background rounded">
                                  <Edit2 className="h-4 w-4 text-mq-content-secondary" />
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
                      <Button size="sm" variant="outline" onClick={openAddDeadline}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {exams.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="h-10 w-10 text-mq-content-tertiary mx-auto mb-3" />
                      <p className="text-mq-content-secondary text-sm">{t('noExamsYet' as 'title')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {exams
                        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                        .map((exam) => {
                          const due = new Date(exam.dueDate);
                          const isOverdue = !exam.completed && due < new Date();
                          return (
                            <div
                              key={exam.id}
                              className={cn(
                                'flex items-center justify-between p-3 rounded-lg border transition-all',
                                exam.completed ? 'opacity-60 border-mq-border' :
                                isOverdue ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : 'border-mq-border hover:border-red-300'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <button onClick={() => toggleComplete(exam.id)}>
                                  {exam.completed ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-mq-content-secondary" />
                                  )}
                                </button>
                                <div>
                                  <h4 className={cn('font-medium text-sm', exam.completed && 'line-through')}>
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
                                <button onClick={() => openEditDeadline(exam)} className="p-1 hover:bg-mq-hover-background rounded">
                                  <Edit2 className="h-4 w-4 text-mq-content-secondary" />
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
            <div className="mq-magic-card-content p-0">
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
                      <Button size="sm" variant="outline" onClick={openAddUnit}>
                        <Plus className="h-4 w-4" />
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
                          className="flex items-center gap-3 p-2 rounded-lg border border-mq-border hover:border-mq-primary/20 transition-all"
                        >
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: unit.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{unit.code}</h4>
                            <p className="text-xs text-mq-content-secondary truncate">{unit.name}</p>
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
                      <Button size="sm" variant="outline" onClick={() => { setEditEvent(null); setEventDialogOpen(true); }}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {allEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <PartyPopper className="h-10 w-10 text-mq-content-tertiary mx-auto mb-3" />
                      <p className="text-mq-content-secondary text-sm">{t('noEventsYet' as 'title')}</p>
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
                            <h4 className="font-medium text-sm truncate">{event.title}</h4>
                            <p className="text-xs text-mq-content-secondary truncate">{event.time} • {event.location}</p>
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
                              'p-3 rounded-lg border-l-4 bg-mq-background-secondary/50',
                              colors.border,
                              isOverdue && 'bg-red-50 dark:bg-red-950/20'
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{deadline.title}</h4>
                                <p className="text-xs text-mq-content-secondary mt-1">
                                  {deadline.unitCode} • {deadline.type}
                                </p>
                                <p className={cn('text-xs mt-1', isOverdue ? 'text-red-600' : 'text-mq-content-secondary')}>
                                  {format(due, 'EEE, MMM d @ h:mm a')}
                                </p>
                              </div>
                              <button onClick={() => openEditDeadline(deadline)} className="p-1 hover:bg-mq-hover-background rounded ml-2">
                                <Edit2 className="h-4 w-4 text-mq-content-secondary" />
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

      {/* Event Form Dialog */}
      <EventForm
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        editEvent={editEvent}
      />

      {/* Unit Form Dialog */}
      <UnitForm
        open={unitDialogOpen}
        onOpenChange={setUnitDialogOpen}
        editUnit={editingUnit}
      />
    </div>
  );
}
