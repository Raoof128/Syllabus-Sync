// components/calendar/WeeklyCalendar.tsx
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/mq/button';
import { Badge } from '@/components/ui/mq/badge';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { PRIORITY_COLORS } from '@/lib/constants';
import { Deadline, Unit, DayOfWeek } from '@/lib/types';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
} from 'date-fns';

interface WeeklyCalendarProps {
  onAddDeadline: () => void;
  onEditDeadline: (deadline: Deadline) => void;
}

// Hours to display (6 AM to 11 PM)
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);
const HOUR_HEIGHT = 60; // pixels per hour

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function WeeklyCalendar({ onAddDeadline, onEditDeadline }: WeeklyCalendarProps) {
  const { t } = useTranslation();
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const units = useUnitsStore((state) => state.units);
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );

  // Get days of the current week
  const weekDays = useMemo(() => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  }, [currentWeekStart]);

  // Navigation handlers
  const goToPreviousWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Get deadlines for a specific day
  const getDeadlinesForDay = (date: Date) => {
    return deadlines.filter((d) => isSameDay(new Date(d.dueDate), date));
  };

  // Get classes for a specific day
  const getClassesForDay = (dayOfWeek: DayOfWeek) => {
    const classes: Array<{
      unit: Unit;
      startTime: string;
      endTime: string;
      scheduleId: string;
    }> = [];

    units.forEach((unit) => {
      unit.schedule.forEach((schedule) => {
        if (schedule.day === dayOfWeek) {
          classes.push({
            unit,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            scheduleId: schedule.id,
          });
        }
      });
    });

    return classes;
  };

  // Convert time string to position
  const timeToPosition = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours - 6) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
  };

  // Calculate duration in pixels
  const getDuration = (startTime: string, endTime: string) => {
    const startPos = timeToPosition(startTime);
    const endPos = timeToPosition(endTime);
    return Math.max(endPos - startPos, 30); // Minimum height of 30px
  };

  // Get current time position for the time indicator line
  const [currentTimePosition, setCurrentTimePosition] = useState<number | null>(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    if (hours < 6 || hours >= 24) return null;
    return (hours - 6) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
  });

  // Update current time position every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      if (hours < 6 || hours >= 24) {
        setCurrentTimePosition(null);
      } else {
        setCurrentTimePosition((hours - 6) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT);
      }
    };

    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4 px-2">
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
        <Button onClick={onAddDeadline} size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          {t('addDeadline')}
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto border border-mq-border rounded-mq-lg bg-mq-background">
        {/* Day headers */}
        <div className="sticky top-0 z-20 bg-mq-background border-b border-mq-border">
          <div className="grid grid-cols-[60px_repeat(7,1fr)]">
            {/* Empty corner cell */}
            <div className="p-2 border-r border-mq-border" />
            {/* Day headers */}
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  'p-2 text-center border-r border-mq-border last:border-r-0',
                  isToday(day) && 'bg-mq-primary/5',
                )}
              >
                <div className="text-xs text-mq-content-secondary uppercase">
                  {format(day, 'EEE')}
                </div>
                <div
                  className={cn(
                    'text-lg font-semibold mt-1',
                    isToday(day)
                      ? 'w-8 h-8 mx-auto rounded-full bg-mq-primary text-white flex items-center justify-center'
                      : 'text-mq-content',
                  )}
                >
                  {format(day, 'd')}
                </div>
                {/* Deadlines count badge */}
                {getDeadlinesForDay(day).length > 0 && (
                  <Badge variant="neutral" className="mt-1 text-xs">
                    {getDeadlinesForDay(day).length} {t('pending')}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Time grid */}
        <div className="relative">
          <div className="grid grid-cols-[60px_repeat(7,1fr)]">
            {/* Time labels */}
            <div className="relative">
              {HOURS.map((hour) => (
                <div key={hour} className="h-[60px] border-b border-mq-border pr-2 text-right">
                  <span className="text-xs text-mq-content-secondary -mt-2 block">
                    {format(new Date().setHours(hour, 0), 'h a')}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day) => {
              const dayIndex = day.getDay();
              // Adjust for Monday start (0 = Monday, 6 = Sunday)
              const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
              const dayName = DAYS_OF_WEEK[adjustedIndex];
              const classes = getClassesForDay(dayName);
              const dayDeadlines = getDeadlinesForDay(day);

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'relative border-r border-mq-border last:border-r-0',
                    isToday(day) && 'bg-mq-primary/5',
                  )}
                >
                  {/* Hour lines */}
                  {HOURS.map((hour) => (
                    <div key={hour} className="h-[60px] border-b border-mq-border border-dashed" />
                  ))}

                  {/* Current time indicator */}
                  {isToday(day) && currentTimePosition !== null && (
                    <div
                      className="absolute left-0 right-0 z-30 pointer-events-none"
                      style={{ top: currentTimePosition }}
                    >
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-mq-error" />
                        <div className="flex-1 h-0.5 bg-mq-error" />
                      </div>
                    </div>
                  )}

                  {/* Classes */}
                  {classes.map((classItem) => {
                    const top = timeToPosition(classItem.startTime);
                    const height = getDuration(classItem.startTime, classItem.endTime);

                    return (
                      <div
                        key={classItem.scheduleId}
                        className="absolute left-1 right-1 rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                        style={{
                          top,
                          height,
                          backgroundColor: `${classItem.unit.color}20`,
                          borderLeft: `3px solid ${classItem.unit.color}`,
                        }}
                      >
                        <div className="p-1 text-xs">
                          <div
                            className="font-semibold truncate"
                            style={{ color: classItem.unit.color }}
                          >
                            {classItem.unit.code}
                          </div>
                          <div className="text-mq-content-secondary truncate flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {classItem.startTime} - {classItem.endTime}
                          </div>
                          {height > 50 && (
                            <div className="text-mq-content-secondary truncate">
                              {classItem.unit.location.building} {classItem.unit.location.room}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Deadlines - show as markers at the top of each day */}
                  {dayDeadlines.length > 0 && (
                    <div className="absolute top-1 left-1 right-1 space-y-1 z-10">
                      {dayDeadlines.slice(0, 3).map((deadline) => {
                        const dueTime = new Date(deadline.dueDate);
                        const hours = dueTime.getHours();
                        const minutes = dueTime.getMinutes();
                        const timePosition = hours >= 6 ? timeToPosition(`${hours}:${minutes}`) : 0;

                        return (
                          <button
                            key={deadline.id}
                            onClick={() => onEditDeadline(deadline)}
                            className={cn(
                              'absolute left-1 right-1 p-1 rounded text-xs font-medium truncate text-left hover:opacity-80 transition-opacity',
                              PRIORITY_COLORS[deadline.priority],
                              deadline.completed && 'opacity-50 line-through',
                            )}
                            style={{ top: timePosition || 0 }}
                          >
                            📌 {deadline.title}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
