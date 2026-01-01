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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import DeadlineForm from '@/components/deadlines/DeadlineForm';
import { Deadline } from '@/lib/types';
import { useHydration } from '@/lib/hooks';
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

const priorityColors: Record<'Low' | 'Medium' | 'High' | 'Urgent', string> = {
  Low: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-orange-100 text-orange-800',
  Urgent: 'bg-red-100 text-red-800',
};

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
    Low: 'bg-green-100 text-green-800',
    Busy: 'bg-yellow-100 text-yellow-800',
    High: 'bg-red-100 text-red-800',
  };

  const getUnitColor = (unitCode: string) => {
    const unit = units.find((u) => u.code === unitCode);
    return unit?.color || '#6b7280';
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar & Deadlines</h1>
          <p className="text-gray-600">
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
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-yellow-900">
              <strong>Note:</strong> Add some units on the Home page first before you can create
              deadlines.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Deadlines */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          {isHydrated && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm text-gray-500">Upcoming</p>
                    <p className="text-2xl font-bold">{incompleteDeadlines.length}</p>
                  </div>
                  <Clock className="h-6 w-6 text-blue-400" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm text-gray-900">Overdue</p>
                    <p className="text-2xl font-bold">{overdueDeadlines.length}</p>
                  </div>
                  <AlertCircle className="h-6 w-6 text-red-400" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm text-gray-900">Completed</p>
                    <p className="text-2xl font-bold">{completedDeadlines.length}</p>
                  </div>
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm text-gray-900">Total</p>
                    <p className="text-2xl font-bold">{deadlines.length}</p>
                  </div>
                  <CalendarDays className="h-6 w-6 text-purple-400" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-900">Completed</p>
                      <p className="text-2xl font-bold">{completedDeadlines.length}</p>
                    </div>
                    <CheckCircle2 className="h-6 w-6 text-green-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-900">Overdue</p>
                      <p className="text-2xl font-bold text-red-600">{overdueDeadlines.length}</p>
                    </div>
                    <AlertCircle className="h-6 w-6 text-red-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Stress</p>
                      <Badge className={stressColors[stressLevel]}>{stressLevel}</Badge>
                    </div>
                    <span className="text-xl">
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
                  <p className="text-gray-900">Loading deadlines...</p>
                </div>
              </CardContent>
            </Card>
          ) : deadlines.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No deadlines yet</h3>
                  <p className="text-gray-600 mb-4">
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
                            className={`p-4 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                              isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
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
                                <Circle className="h-5 w-5 text-gray-400 hover:text-blue-500" />
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h4 className="font-semibold text-gray-900">
                                      {deadline.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: getUnitColor(deadline.unitCode) }}
                                      />
                                      <span className="text-sm text-gray-600">
                                        {deadline.unitCode}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">{deadline.type}</Badge>
                                    <Badge className={priorityColors[deadline.priority]}>
                                      {deadline.priority}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                  <span>
                                    Due:{' '}
                                    {hasValidDate
                                      ? format(dueDate, 'MMM dd, h:mm a')
                                      : 'Invalid date'}
                                  </span>
                                  <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                    {isOverdue
                                      ? 'Overdue!'
                                      : hasValidDate
                                        ? formatDistanceToNow(dueDate, { addSuffix: true })
                                        : ''}
                                  </span>
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
                    <CardTitle className="flex items-center gap-2 text-gray-500">
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
                            className="p-4 bg-gray-50 rounded-lg border border-gray-200 opacity-60 cursor-pointer hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              </button>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-700 line-through">
                                  {deadline.title}
                                </h4>
                                <span className="text-sm text-gray-500">{deadline.unitCode}</span>
                                {!hasValidDate && (
                                  <p className="text-xs text-gray-400 mt-1">Invalid date</p>
                                )}
                              </div>
                              <Badge variant="outline" className="opacity-50">
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

        {/* Right Column - Calendar & Features */}
        <div className="space-y-6">
          {/* Calendar View */}
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
                  <Button variant="outline" size="sm" onClick={goToPrevious} aria-label="Previous">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={jumpToToday}>
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToNext} aria-label="Next">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm font-medium text-gray-700">
                  {view === 'week'
                    ? `${format(calendarRange.start, 'MMM d')} - ${format(calendarRange.end, 'MMM d')}`
                    : format(currentDate, 'MMMM yyyy')}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={view === 'month' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setView('month')}
                  >
                    Month
                  </Button>
                  <Button
                    variant={view === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setView('week')}
                  >
                    Week
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 text-xs text-gray-500 mb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
                  <div key={label} className="text-center font-medium">
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day) => {
                  const dayKey = format(day, 'yyyy-MM-dd');
                  const dayDeadlines = deadlinesByDay[dayKey] ?? [];
                  const isOutside = view === 'month' && !isSameMonth(day, currentDate);
                  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                  return (
                    <div
                      key={dayKey}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedDate(day)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedDate(day);
                        }
                      }}
                      className={`min-h-[120px] rounded-lg border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        isOutside ? 'bg-gray-50 text-gray-600' : 'bg-white'
                      } ${isSelected ? 'border-blue-400 ring-1 ring-blue-200' : 'border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold ${isToday(day) ? 'text-blue-600' : ''}`}
                        >
                          {format(day, 'd')}
                        </span>
                        {isToday(day) && <span className="text-[10px] text-blue-500">Today</span>}
                      </div>
                      <div className="mt-2 space-y-1">
                        {dayDeadlines.slice(0, 3).map((deadline) => (
                          <button
                            key={deadline.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleEditDeadline(deadline);
                            }}
                            className={`w-full rounded px-2 py-1 text-left text-[11px] font-medium text-gray-800 hover:bg-gray-100 ${
                              deadline.completed ? 'line-through text-gray-400' : ''
                            }`}
                            style={{ borderLeft: `3px solid ${getUnitColor(deadline.unitCode)}` }}
                            title={`${deadline.title} (${format(new Date(deadline.dueDate), 'h:mm a')})`}
                          >
                            <div className="truncate">{deadline.title}</div>
                            <div className="text-[10px] text-gray-800">
                              {format(new Date(deadline.dueDate), 'h:mm a')}
                            </div>
                          </button>
                        ))}
                        {dayDeadlines.length > 3 && (
                          <div className="text-[10px] text-gray-500">
                            +{dayDeadlines.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                <Grid3x3 className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">Multiple Views</h4>
                  <p className="text-xs text-gray-500">Month, week, day views</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                <Filter className="h-5 w-5 text-purple-500 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">Filtering</h4>
                  <p className="text-xs text-gray-500">Filter by unit or type</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                <Bell className="h-5 w-5 text-orange-500 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">Reminders</h4>
                  <p className="text-xs text-gray-500">Smart notifications</p>
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
