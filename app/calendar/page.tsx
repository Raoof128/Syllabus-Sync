// app/calendar/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Filter,
  Clock,
  Bell,
  Grid3x3,
  List,
  Plus,
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { Button } from '@/components/ui/mq/button';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import DeadlineForm from '@/components/deadlines/DeadlineForm';
import { Deadline } from '@/lib/types';
import { useHydration } from '@/lib/hooks';
import { PRIORITY_COLORS } from '@/lib/constants';
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  formatDistanceToNow,
  isPast,
  isSameDay,
  isSameMonth,
  isToday,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import { useSearchParams } from 'next/navigation';

export default function CalendarPage() {
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const toggleComplete = useDeadlinesStore((state) => state.toggleComplete);
  const getStressLevel = useDeadlinesStore((state) => state.getStressLevel);
  const units = useUnitsStore((state) => state.units);
  const [deadlineFormOpen, setDeadlineFormOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [view, setView] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const isHydrated = useHydration();
  const searchParams = useSearchParams();

  const handleAddDeadline = () => {
    setEditingDeadline(null);
    setDeadlineFormOpen(true);
  };

  const handleEditDeadline = (deadline: Deadline) => {
    setEditingDeadline(deadline);
    setDeadlineFormOpen(true);
  };

  // Sort deadlines: incomplete first by due date, then completed
  const sortedDeadlines = [...deadlines].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const incompleteDeadlines = sortedDeadlines.filter((d) => !d.completed);
  const completedDeadlines = sortedDeadlines.filter((d) => d.completed);
  const overdueDeadlines = incompleteDeadlines.filter((d) => {
    const dueDate = new Date(d.dueDate);
    return isValid(dueDate) && isPast(dueDate);
  });
  const stressLevel = isHydrated ? getStressLevel() : 'Low';

  const stressColors = {
    Low: 'bg-mq-success/10 text-mq-success',
    Busy: 'bg-mq-warning/10 text-mq-warning',
    High: 'bg-mq-error/10 text-mq-error',
  };

  const getUnitColor = (unitCode: string) => {
    const unit = units.find((u) => u.code === unitCode);
    return unit?.color || 'var(--mq-content-secondary)';
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (!dateParam) return;
    const parsed = parseISO(dateParam);
    if (!Number.isNaN(parsed.getTime())) {
      setCurrentDate(parsed);
      setSelectedDate(parsed);
    }
  }, [searchParams]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const calendarRange = useMemo(() => {
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return { start, end };
    }
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return { start, end };
  }, [currentDate, view]);

  const calendarDays = useMemo(
    () => eachDayOfInterval({ start: calendarRange.start, end: calendarRange.end }),
    [calendarRange],
  );

  const deadlinesByDay = useMemo(() => {
    return deadlines.reduce<Record<string, Deadline[]>>((acc, deadline) => {
      const dueDate = new Date(deadline.dueDate);
      if (!isValid(dueDate)) return acc;
      const key = format(dueDate, 'yyyy-MM-dd');
      if (!acc[key]) acc[key] = [];
      acc[key].push(deadline);
      return acc;
    }, {});
  }, [deadlines]);

  const jumpToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const goToPrevious = () => {
    setCurrentDate((prev) => (view === 'week' ? subWeeks(prev, 1) : subMonths(prev, 1)));
  };

  const goToNext = () => {
    setCurrentDate((prev) => (view === 'week' ? addWeeks(prev, 1) : addMonths(prev, 1)));
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-mq-3xl font-bold text-mq-content mb-2">Calendar & Deadlines</h1>
          <p className="text-mq-content-secondary">
            View and manage your academic schedule, assignments, and important dates.
          </p>
        </div>
        <Button onClick={handleAddDeadline} className="gap-2" disabled={units.length === 0}>
          <Plus className="h-4 w-4" />
          Add Deadline
        </Button>
      </header>

      {/* Info Banner when no units */}
      {units.length === 0 && (
        <div className="mb-6 p-4 bg-mq-warning/10 border border-mq-warning/20 rounded-mq-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-mq-warning flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-mq-sm text-mq-warning">
              <strong>Note:</strong> Add some units on the Home page first before you can create
              deadlines.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Calendar View - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={goToPrevious} aria-label="Previous">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="sm" onClick={jumpToToday}>
                  Today
                </Button>
                <Button variant="secondary" size="sm" onClick={goToNext} aria-label="Next">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-mq-sm font-medium text-mq-content">
                {view === 'week'
                  ? `${format(calendarRange.start, 'MMM d')} - ${format(calendarRange.end, 'MMM d')}`
                  : format(currentDate, 'MMMM yyyy')}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={view === 'month' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setView('month')}
                >
                  Month
                </Button>
                <Button
                  variant={view === 'week' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setView('week')}
                >
                  Week
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-mq-xs text-mq-content-secondary mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
                <div key={label} className="text-center font-medium">
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarDays.map((day) => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const dayLabel = format(day, 'EEEE, MMM d');
                const dayDeadlines = deadlinesByDay[dayKey] ?? [];
                const isOutside = view === 'month' && !isSameMonth(day, currentDate);
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const deadlineCount = dayDeadlines.length;
                const deadlineLabel =
                  deadlineCount === 0
                    ? 'no deadlines'
                    : `${deadlineCount} deadline${deadlineCount > 1 ? 's' : ''}`;
                return (
                  <div
                    key={dayKey}
                    role="button"
                    tabIndex={0}
                    aria-label={`${dayLabel}, ${deadlineLabel}`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedDate(day)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedDate(day);
                      }
                    }}
                    className={`min-h-[80px] sm:min-h-[100px] rounded-mq border p-1 sm:p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus ${
                      isOutside
                        ? 'bg-mq-background-secondary/50 text-mq-content-tertiary'
                        : 'bg-mq-background dark:bg-mq-card-background'
                    } ${isSelected ? 'border-mq-primary ring-1 ring-mq-primary/20' : 'border-mq-border'} ${isToday(day) ? 'bg-mq-primary/5 dark:bg-mq-primary/10' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-mq-xs font-semibold ${isToday(day) ? 'text-mq-primary' : 'text-mq-content'}`}
                      >
                        {format(day, 'd')}
                      </span>
                      {isToday(day) && <span className="text-[10px] text-mq-primary font-medium">Today</span>}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {dayDeadlines.slice(0, 2).map((deadline) => (
                        <button
                          key={deadline.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEditDeadline(deadline);
                          }}
                          className={`w-full rounded px-1 py-0.5 text-left text-[10px] sm:text-[11px] font-medium hover:opacity-80 transition-opacity ${
                            deadline.completed ? 'line-through opacity-50' : ''
                          }`}
                          style={{
                            backgroundColor: `${getUnitColor(deadline.unitCode)}20`,
                            borderLeft: `2px solid ${getUnitColor(deadline.unitCode)}`,
                            color: 'var(--mq-content)'
                          }}
                          title={`${deadline.title} (${format(new Date(deadline.dueDate), 'h:mm a')})`}
                        >
                          <div className="truncate">{deadline.title}</div>
                        </button>
                      ))}
                      {dayDeadlines.length > 2 && (
                        <div className="text-[9px] sm:text-[10px] text-mq-content-tertiary pl-1">
                          +{dayDeadlines.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Stats and Deadlines */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats */}
          {isHydrated && (
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="flex items-start justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="text-mq-sm text-mq-content-secondary leading-tight">Upcoming</p>
                    <p className="text-mq-2xl font-bold text-mq-content">{incompleteDeadlines.length}</p>
                  </div>
                  <Clock className="h-6 w-6 text-mq-content-secondary shrink-0" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-start justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="text-mq-sm text-mq-content-secondary leading-tight">Overdue</p>
                    <p className="text-mq-2xl font-bold text-mq-content">{overdueDeadlines.length}</p>
                  </div>
                  <AlertCircle className="h-6 w-6 text-mq-content-secondary shrink-0" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-start justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="text-mq-sm text-mq-content-secondary leading-tight">Completed</p>
                    <p className="text-mq-2xl font-bold text-mq-content">{completedDeadlines.length}</p>
                  </div>
                  <CheckCircle2 className="h-6 w-6 text-mq-content-secondary shrink-0" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-start justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="text-mq-sm text-mq-content-secondary leading-tight">Total</p>
                    <p className="text-mq-2xl font-bold text-mq-content">{deadlines.length}</p>
                  </div>
                  <CalendarDays className="h-6 w-6 text-mq-content-secondary shrink-0" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-mq-sm text-mq-content-secondary">Workload</p>
                      <Badge className={stressColors[stressLevel]}>{stressLevel}</Badge>
                    </div>
                    <span className="text-mq-xl">
                      {stressLevel === 'High' ? '😰' : stressLevel === 'Busy' ? '😅' : '😊'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Deadlines List */}
          {!isHydrated ? (
            <Card>
              <CardContent className="py-12">
                <div className="h-32 flex items-center justify-center">
                  <p className="text-mq-content">Loading deadlines...</p>
                </div>
              </CardContent>
            </Card>
          ) : deadlines.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Clock className="h-12 w-12 text-mq-content-tertiary mx-auto mb-4" />
                  <h3 className="text-mq-lg font-semibold text-mq-content mb-2">No deadlines yet</h3>
                  <p className="text-mq-content-secondary mb-4">
                    Add your first deadline to start tracking your assignments.
                  </p>
                  <Button
                    onClick={handleAddDeadline}
                    className="gap-2"
                    disabled={units.length === 0}
                  >
                    <Plus className="h-4 w-4" />
                    Add Your First Deadline
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Upcoming Deadlines */}
              {incompleteDeadlines.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Upcoming ({incompleteDeadlines.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {incompleteDeadlines.map((deadline) => {
                        const dueDate = new Date(deadline.dueDate);
                        const hasValidDate = isValid(dueDate);
                        const isOverdue = hasValidDate ? isPast(dueDate) : false;
                        return (
                          <div
                            key={deadline.id}
                            role="button"
                            tabIndex={0}
                            className={`p-4 rounded-mq-lg border transition-colors cursor-pointer hover:bg-mq-hover-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus ${
                              isOverdue ? 'border-mq-error/20 bg-mq-error/10' : 'border-mq-border bg-mq-card-background'
                            }`}
                            onClick={() => handleEditDeadline(deadline)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                handleEditDeadline(deadline);
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleComplete(deadline.id);
                                }}
                                aria-label={`Mark ${deadline.title} as completed`}
                                className="mt-0.5"
                              >
                                <Circle className="h-5 w-5 text-mq-content-tertiary hover:text-mq-primary" />
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0">
                                    <h4 className="font-semibold text-mq-content break-words">
                                      {deadline.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: getUnitColor(deadline.unitCode) }}
                                      />
                                      <span className="text-mq-sm text-mq-content-secondary">
                                        {deadline.unitCode}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                    <Badge variant="neutral">{deadline.type}</Badge>
                                    <Badge className={PRIORITY_COLORS[deadline.priority]}>
                                      {deadline.priority}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-mq-sm text-mq-content-secondary">
                                  {hasValidDate && (
                                    <span className={isOverdue ? 'text-mq-error' : ''}>
                                      {isOverdue ? 'Overdue' : 'Due'} {formatDistanceToNow(dueDate, { addSuffix: true })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Completed Deadlines */}
              {completedDeadlines.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-mq-content-secondary">
                      <CheckCircle2 className="h-5 w-5" />
                      Completed ({completedDeadlines.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {completedDeadlines.map((deadline) => {
                        const dueDate = new Date(deadline.dueDate);
                        const hasValidDate = isValid(dueDate);
                        return (
                          <div
                            key={deadline.id}
                            role="button"
                            tabIndex={0}
                            className="p-4 bg-mq-background-secondary rounded-mq-lg border border-mq-border opacity-60 cursor-pointer hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus"
                            onClick={() => handleEditDeadline(deadline)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                handleEditDeadline(deadline);
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleComplete(deadline.id);
                                }}
                                aria-label={`Mark ${deadline.title} as incomplete`}
                                className="mt-0.5"
                              >
                                <CheckCircle2 className="h-5 w-5 text-mq-success" />
                              </button>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-mq-content-secondary line-through">
                                  {deadline.title}
                                </h4>
                                <span className="text-mq-sm text-mq-content-tertiary">{deadline.unitCode}</span>
                                {!hasValidDate && (
                                  <p className="text-mq-xs text-mq-content-tertiary mt-1">Invalid date</p>
                                )}
                              </div>
                              <Badge variant="neutral" className="opacity-50">
                                {deadline.type}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Features */}
        <div className="space-y-6">
          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-2 bg-mq-background-secondary dark:bg-mq-background-tertiary rounded-mq-lg">
                <Grid3x3 className="h-5 w-5 text-mq-info flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-mq-content">Multiple Views</h4>
                  <p className="text-mq-xs text-mq-content-secondary">Month, week, day views</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 bg-mq-background-secondary dark:bg-mq-background-tertiary rounded-mq-lg">
                <Filter className="h-5 w-5 text-mq-purple flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-mq-content">Smart Filtering</h4>
                  <p className="text-mq-xs text-mq-content-secondary">Filter by unit or type</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 bg-mq-background-secondary dark:bg-mq-background-tertiary rounded-mq-lg">
                <Bell className="h-5 w-5 text-mq-warning flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-mq-content">Smart Notifications</h4>
                  <p className="text-mq-xs text-mq-content-secondary">Get reminded at the right time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Deadline Form Dialog */}
      <DeadlineForm
        open={deadlineFormOpen}
        onOpenChange={setDeadlineFormOpen}
        editDeadline={editingDeadline}
      />
    </div>
  );
}
