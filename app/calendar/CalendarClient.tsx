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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { Button } from '@/components/ui/mq/button';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useEventsStore } from '@/lib/store/eventsStore';
import DeadlineForm from '@/components/deadlines/DeadlineForm';
import { Deadline, Event } from '@/lib/types';
import { useHydration } from '@/lib/hooks';
import { PRIORITY_COLORS } from '@/lib/constants';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { MagicCard } from '@/components/ui/MagicCard';
import { sampleEvents } from '@/data/sampleEvents';
import { getMQKeyDatesForDay, MQ_DATE_COLORS } from '@/data/mqKeyDates';
import dynamic from 'next/dynamic';
import { format, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, isToday, addWeeks, subWeeks, getHours, getMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

// Dynamically import forms
const EventForm = dynamic(() => import('@/components/events/EventForm'), {
  loading: () => null,
});

// Hours to display (6 AM to 10 PM)
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);
const HOUR_HEIGHT = 48; // pixels per hour

// Type colors for the calendar
const TYPE_COLORS = {
  Assignment: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white' },
  Exam: { bg: 'bg-red-500', border: 'border-red-600', text: 'text-white' },
  Quiz: { bg: 'bg-amber-500', border: 'border-amber-600', text: 'text-white' },
  Presentation: { bg: 'bg-purple-500', border: 'border-purple-600', text: 'text-white' },
  Event: { bg: 'bg-green-500', border: 'border-green-600', text: 'text-white' },
};

// Parse time string like "2:00 PM" or "14:00" to hours and minutes
function parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null;

  // Try parsing "2:00 PM" format
  const ampmMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return { hours, minutes };
  }

  // Try parsing "14:00" format
  const militaryMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (militaryMatch) {
    return {
      hours: parseInt(militaryMatch[1], 10),
      minutes: parseInt(militaryMatch[2], 10),
    };
  }

  return null;
}

// Calculate position for a time-based item
function getTimePosition(date: Date): number | null {
  const hours = getHours(date);
  const minutes = getMinutes(date);

  if (hours < 6 || hours >= 23) return null;
  return (hours - 6) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
}

export default function CalendarClient() {
  const router = useRouter();
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const toggleComplete = useDeadlinesStore((state) => state.toggleComplete);
  const userEvents = useEventsStore((state) => state.events);

  const hasHydrated = useHydration();
  const { t } = useTranslation();

  // Dialog states
  const [deadlineDialogOpen, setDeadlineDialogOpen] = useState(false);
  const [editDeadline, setEditDeadline] = useState<Deadline | null>(null);

  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);

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

  // Get items for a specific day
  const getItemsForDay = (date: Date) => {
    const dayDeadlines = deadlines.filter((d) => isSameDay(new Date(d.dueDate), date));
    const dayEvents = allEvents.filter((e) => isSameDay(new Date(e.date), date));
    const dayMQDates = getMQKeyDatesForDay(date);
    return { deadlines: dayDeadlines, events: dayEvents, mqDates: dayMQDates };
  };

  // Current time position for the red line indicator
  const currentTimePosition = useMemo(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    if (hours < 6 || hours >= 23) return null;
    return (hours - 6) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
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
    // Check if it's a user event (editable)
    if (userEvents.find((e) => e.id === event.id)) {
      setEditEvent(event);
      setEventDialogOpen(true);
    } else {
      // Navigate to feed page with highlight for sample events
      router.push(`/feed?highlight=${event.id}`);
    }
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
            {/* Calendar Header */}
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
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={openAddDeadline}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t('addDeadline')}
                </Button>
              </div>
            </div>

            {/* Calendar Grid with Time Lines */}
            <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
              <div className="min-w-[800px]">
                {/* Day Headers */}
                <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-mq-border sticky top-0 bg-mq-background z-10">
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
                        {format(new Date().setHours(hour, 0), 'h a')}
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
                      className="absolute left-[60px] right-0 z-20 pointer-events-none"
                      style={{ top: currentTimePosition }}
                    >
                      <div className="flex items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1" />
                        <div className="flex-1 h-0.5 bg-red-500" />
                      </div>
                    </div>
                  )}

                  {/* Events and Deadlines Overlay */}
                  <div className="absolute left-[60px] right-0 top-0 bottom-0 grid grid-cols-7">
                    {weekDays.map((day) => {
                      const { deadlines: dayDeadlines, events: dayEvents, mqDates: dayMQDates } = getItemsForDay(day);

                      return (
                        <div key={day.toISOString()} className="relative border-r border-mq-border/30 last:border-r-0">
                          {/* MQ Key Dates - displayed at top */}
                          {dayMQDates.length > 0 && (
                            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-mq-background to-transparent p-1 z-10">
                              {dayMQDates.slice(0, 2).map((mqDate) => {
                                const colors = MQ_DATE_COLORS[mqDate.category];
                                return (
                                  <div
                                    key={mqDate.id}
                                    className={cn(
                                      'text-[10px] px-1 py-0.5 rounded mb-0.5 truncate font-medium',
                                      colors.bg, colors.text
                                    )}
                                    title={`${mqDate.event} (${mqDate.term})`}
                                  >
                                    <GraduationCap className="h-2.5 w-2.5 inline mr-0.5" />
                                    {mqDate.event}
                                  </div>
                                );
                              })}
                              {dayMQDates.length > 2 && (
                                <div className="text-[10px] text-mq-content-secondary text-center">
                                  +{dayMQDates.length - 2} more
                                </div>
                              )}
                            </div>
                          )}

                          {/* Deadlines - positioned by time */}
                          {dayDeadlines.map((deadline) => {
                            const dueDate = new Date(deadline.dueDate);
                            const position = getTimePosition(dueDate);
                            const colors = TYPE_COLORS[deadline.type];

                            // If position is null, show at top (all-day style)
                            if (position === null) {
                              return (
                                <button
                                  key={deadline.id}
                                  onClick={() => openEditDeadline(deadline)}
                                  className={cn(
                                    'absolute left-1 right-1 text-left text-[10px] px-1 py-0.5 rounded shadow-sm truncate font-medium z-5',
                                    colors.bg, colors.text,
                                    deadline.completed && 'opacity-50 line-through'
                                  )}
                                  style={{ top: dayMQDates.length > 0 ? 40 : 4 }}
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
                                  'absolute left-1 right-1 text-left text-[10px] px-1 py-0.5 rounded shadow-sm truncate font-medium',
                                  colors.bg, colors.text,
                                  deadline.completed && 'opacity-50 line-through'
                                )}
                                style={{ top: position, height: 20 }}
                                title={`${deadline.type}: ${deadline.title} @ ${format(dueDate, 'h:mm a')}`}
                              >
                                {deadline.title}
                              </button>
                            );
                          })}

                          {/* Events - positioned by time */}
                          {dayEvents.map((event, idx) => {
                            const eventDate = new Date(event.date);
                            const timeInfo = parseTimeString(event.time);
                            let position: number | null = null;

                            if (timeInfo) {
                              const hours = timeInfo.hours;
                              const minutes = timeInfo.minutes;
                              if (hours >= 6 && hours < 23) {
                                position = (hours - 6) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
                              }
                            }

                            const colors = TYPE_COLORS.Event;

                            // If no valid time position, show below deadlines
                            if (position === null) {
                              const offsetTop = (dayMQDates.length > 0 ? 40 : 4) + (dayDeadlines.length * 24) + (idx * 24);
                              return (
                                <button
                                  key={event.id}
                                  onClick={() => handleEventClick(event)}
                                  className={cn(
                                    'absolute left-1 right-1 text-left text-[10px] px-1 py-0.5 rounded shadow-sm truncate font-medium',
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
                                  'absolute left-1 right-1 text-left text-[10px] px-1 py-0.5 rounded shadow-sm truncate font-medium',
                                  colors.bg, colors.text
                                )}
                                style={{ top: position, height: 20 }}
                                title={`Event: ${event.title} @ ${event.time}`}
                              >
                                {event.title}
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
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span>{t('assignment' as 'title')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span>{t('exam' as 'title')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span>{t('quiz' as 'title')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>{t('event' as 'title')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded bg-cyan-500" />
                <span>MQ Key Dates</span>
              </div>
            </div>
          </div>
        </MagicCard>
      </ScrollReveal>

      {/* Two Column Layout: Assignments/Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Assignments Widget - Full Size */}
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
                      <p className="text-mq-content-secondary text-sm">{t('noDeadlinesYet')}</p>
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

        {/* Exams Widget - Full Size */}
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
                      <p className="text-mq-content-secondary text-sm">{t('noDeadlinesYet')}</p>
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

      {/* Full Width Upcoming Deadlines */}
      <ScrollReveal delay={0.3}>
        <MagicCard isLiquidEnhanced className="mt-6">
          <div className="mq-magic-card-content p-0">
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    {t('upcomingDeadlines')}
                  </span>
                  {hasHydrated && deadlines.length > 0 && (
                    <Badge variant="neutral">
                      {deadlines.filter((d) => !d.completed).length} {t('pending')}
                    </Badge>
                  )}
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
                    <p className="text-mq-content-secondary mb-4">{t('noDeadlinesYet')}</p>
                    <Button onClick={openAddDeadline} variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      {t('addYourFirstDeadline')}
                    </Button>
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
    </div>
  );
}
