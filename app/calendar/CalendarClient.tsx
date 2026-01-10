'use client';

import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  CalendarDays,
  Edit2,
  Plus,
  BookOpen,
  FileText,
  PartyPopper,
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
import dynamic from 'next/dynamic';
import { format, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, isToday, addWeeks, subWeeks } from 'date-fns';
import { cn } from '@/lib/utils';

// Dynamically import forms
const EventForm = dynamic(() => import('@/components/events/EventForm'), {
  loading: () => null,
});

// Type colors for the calendar
const TYPE_COLORS = {
  Assignment: 'bg-mq-info/20 border-mq-info text-mq-info',
  Exam: 'bg-mq-error/20 border-mq-error text-mq-error',
  Quiz: 'bg-mq-warning/20 border-mq-warning text-mq-warning',
  Presentation: 'bg-mq-purple/20 border-mq-purple text-mq-purple',
  Event: 'bg-mq-success/20 border-mq-success text-mq-success',
};

export default function CalendarClient() {
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
    return { deadlines: dayDeadlines, events: dayEvents };
  };

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

  // Event handlers
  const openAddEvent = () => {
    setEditEvent(null);
    setEventDialogOpen(true);
  };

  const openEditEvent = (event: Event) => {
    // Only edit user events
    if (userEvents.find((e) => e.id === event.id)) {
      setEditEvent(event);
      setEventDialogOpen(true);
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

      {/* Weekly Calendar View */}
      <ScrollReveal delay={0.1}>
        <MagicCard isLiquidEnhanced>
          <div className="mq-magic-card-content p-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                  ←
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  {t('today')}
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextWeek}>
                  →
                </Button>
              </div>
              <h2 className="text-lg font-semibold text-mq-content">
                {format(currentWeekStart, 'MMMM yyyy')}
              </h2>
              <div className="w-32" /> {/* Spacer for balance */}
            </div>

            {/* Week Grid */}
            <div className="grid grid-cols-7 gap-2 min-h-[400px]">
              {weekDays.map((day) => {
                const { deadlines: dayDeadlines, events: dayEvents } = getItemsForDay(day);
                const hasItems = dayDeadlines.length > 0 || dayEvents.length > 0;

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'border border-mq-border rounded-lg p-2 min-h-[120px]',
                      isToday(day) && 'bg-mq-primary/5 border-mq-primary/30'
                    )}
                  >
                    {/* Day Header */}
                    <div className="text-center mb-2">
                      <div className="text-xs text-mq-content-secondary uppercase">
                        {format(day, 'EEE')}
                      </div>
                      <div
                        className={cn(
                          'text-lg font-semibold',
                          isToday(day)
                            ? 'w-8 h-8 mx-auto rounded-full bg-mq-primary text-white flex items-center justify-center'
                            : 'text-mq-content'
                        )}
                      >
                        {format(day, 'd')}
                      </div>
                    </div>

                    {/* Day Items */}
                    <div className="space-y-1 overflow-y-auto max-h-[200px]">
                      {/* Deadlines */}
                      {dayDeadlines.map((deadline) => (
                        <button
                          key={deadline.id}
                          onClick={() => openEditDeadline(deadline)}
                          className={cn(
                            'w-full text-left text-xs p-1 rounded border-l-2 truncate hover:opacity-80',
                            TYPE_COLORS[deadline.type],
                            deadline.completed && 'opacity-50 line-through'
                          )}
                          title={`${deadline.type}: ${deadline.title}`}
                        >
                          {deadline.type === 'Exam' && '📝 '}
                          {deadline.type === 'Assignment' && '📄 '}
                          {deadline.type === 'Quiz' && '❓ '}
                          {deadline.type === 'Presentation' && '🎤 '}
                          {deadline.title}
                        </button>
                      ))}

                      {/* Events */}
                      {dayEvents.map((event) => (
                        <button
                          key={event.id}
                          onClick={() => openEditEvent(event)}
                          className={cn(
                            'w-full text-left text-xs p-1 rounded border-l-2 truncate hover:opacity-80',
                            TYPE_COLORS.Event
                          )}
                          title={`Event: ${event.title}`}
                        >
                          🎉 {event.title}
                        </button>
                      ))}

                      {!hasItems && (
                        <div className="text-xs text-mq-content-tertiary text-center py-2">
                          -
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-mq-border">
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded bg-mq-info/20 border border-mq-info" />
                <span>{t('assignment' as 'title')}</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded bg-mq-error/20 border border-mq-error" />
                <span>{t('exam' as 'title')}</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded bg-mq-warning/20 border border-mq-warning" />
                <span>{t('quiz' as 'title')}</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded bg-mq-success/20 border border-mq-success" />
                <span>{t('event' as 'title')}</span>
              </div>
            </div>
          </div>
        </MagicCard>
      </ScrollReveal>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {/* Add Assignment Card */}
        <ScrollReveal delay={0.2}>
          <MagicCard>
            <Card className="border-0 shadow-none bg-transparent h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-mq-info" />
                  {t('assignments' as 'title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-mq-content-secondary mb-3">
                  {assignments.filter((a) => !a.completed).length} {t('pending')}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-1"
                  onClick={() => openAddDeadline()}
                >
                  <Plus className="h-4 w-4" />
                  {t('addAssignment' as 'title')}
                </Button>
              </CardContent>
            </Card>
          </MagicCard>
        </ScrollReveal>

        {/* Add Exam Card */}
        <ScrollReveal delay={0.25}>
          <MagicCard>
            <Card className="border-0 shadow-none bg-transparent h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-5 w-5 text-mq-error" />
                  {t('exams' as 'title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-mq-content-secondary mb-3">
                  {exams.filter((e) => !e.completed).length} {t('upcoming' as 'title')}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-1"
                  onClick={() => openAddDeadline()}
                >
                  <Plus className="h-4 w-4" />
                  {t('addExam' as 'title')}
                </Button>
              </CardContent>
            </Card>
          </MagicCard>
        </ScrollReveal>

        {/* Add Event Card */}
        <ScrollReveal delay={0.3}>
          <MagicCard>
            <Card className="border-0 shadow-none bg-transparent h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <PartyPopper className="h-5 w-5 text-mq-success" />
                  {t('events' as 'title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-mq-content-secondary mb-3">
                  {allEvents.length} {t('total' as 'title')}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-1"
                  onClick={openAddEvent}
                >
                  <Plus className="h-4 w-4" />
                  {t('addEvent')}
                </Button>
              </CardContent>
            </Card>
          </MagicCard>
        </ScrollReveal>

        {/* Deadlines Summary Card */}
        <ScrollReveal delay={0.35}>
          <MagicCard>
            <Card className="border-0 shadow-none bg-transparent h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="h-5 w-5 text-mq-purple" />
                  {t('allDeadlines' as 'title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-mq-content-secondary mb-3">
                  {deadlines.filter((d) => !d.completed).length} {t('pending')}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-1"
                  onClick={() => openAddDeadline()}
                >
                  <Plus className="h-4 w-4" />
                  {t('addDeadline')}
                </Button>
              </CardContent>
            </Card>
          </MagicCard>
        </ScrollReveal>
      </div>

      {/* Upcoming Deadlines List */}
      <ScrollReveal delay={0.4}>
        <MagicCard isLiquidEnhanced className="mt-6">
          <div className="mq-magic-card-content p-0">
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  {t('upcomingDeadlines')}
                  {hasHydrated && deadlines.length > 0 && (
                    <Badge variant="neutral" className="ml-2">
                      {deadlines.filter((d) => !d.completed).length} {t('pending')}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!hasHydrated ? (
                  <div className="h-32 flex items-center justify-center">
                    <div className="animate-pulse text-mq-content-secondary">
                      {t('loading')}
                    </div>
                  </div>
                ) : deadlines.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarDays className="h-12 w-12 text-mq-content-tertiary mx-auto mb-4" />
                    <p className="text-mq-content-secondary mb-4">{t('noDeadlinesYet')}</p>
                    <Button onClick={() => openAddDeadline()} variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      {t('addYourFirstDeadline')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...deadlines]
                      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                      .slice(0, 10)
                      .map((deadline) => {
                        const due = new Date(deadline.dueDate);
                        const isOverdue = !deadline.completed && due < new Date();

                        return (
                          <div
                            key={deadline.id}
                            className={cn(
                              'flex items-center justify-between p-3 rounded-lg border transition-all',
                              deadline.completed
                                ? 'border-mq-border opacity-60'
                                : isOverdue
                                  ? 'border-mq-error/50 bg-mq-error/5'
                                  : 'border-mq-border hover:border-mq-primary/20'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleComplete(deadline.id)}
                                className="flex-shrink-0"
                              >
                                {deadline.completed ? (
                                  <CheckCircle2 className="h-5 w-5 text-mq-success" />
                                ) : (
                                  <Circle className="h-5 w-5 text-mq-content-secondary" />
                                )}
                              </button>
                              <div>
                                <h4 className={cn(
                                  'font-medium',
                                  deadline.completed && 'line-through text-mq-content-secondary'
                                )}>
                                  {deadline.title}
                                </h4>
                                <p className="text-xs text-mq-content-secondary">
                                  {deadline.unitCode} • {deadline.type} •{' '}
                                  {format(due, 'MMM d, yyyy h:mm a')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={PRIORITY_COLORS[deadline.priority]}>
                                {deadline.priority}
                              </Badge>
                              <button
                                onClick={() => openEditDeadline(deadline)}
                                className="p-1 hover:bg-mq-hover-background rounded"
                              >
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
