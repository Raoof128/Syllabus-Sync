'use client';

import React from 'react';
import dayjs from 'dayjs';
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
import { Unit, Deadline, Event, ClassTime } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { TranslationKey } from '@/lib/i18n/translations';
import { formatLocation, formatScheduleTime } from '@/lib/utils/locale';
import { getMQKeyDatesForDay, MQ_DATE_COLORS, PROGRAM_STYLES } from '@/data/mqKeyDates';

interface DayViewProps {
  date: Date;
  units: Unit[];
  deadlines: Deadline[];
  events: Event[];
  onUnitClick: (unit: Unit) => void;
  onDeadlineClick: (deadline: Deadline) => void;
  onEventClick: (event: Event) => void;
}

export default function DayView({
  date,
  units,
  deadlines,
  events,
  onUnitClick,
  onDeadlineClick,
  onEventClick,
}: DayViewProps) {
  const { t } = useTypedTranslation();
  const dayDate = dayjs(date);
  const isToday = dayDate.isSame(dayjs(), 'day');

  // helper to check if a unit's schedule matches this day
  const getItemsForDay = () => {
    // 1. Units
    const dayName = dayDate.format('dddd'); // "Monday", "Tuesday"...
    const dayUnits = units.flatMap((u) => {
      if (!u.schedule || u.schedule.length === 0) return [];
      // Find all schedule entries for this day
      return u.schedule
        .filter((s: ClassTime) => s.day === dayName)
        .map((s: ClassTime) => ({ unit: u, schedule: s }));
    });

    // 2. Deadlines
    const dayDeadlines = deadlines.filter((d) => dayjs(d.dueDate).isSame(dayDate, 'day'));

    // 3. Events
    const dayEvents = events.filter((e) => {
      const start = e.startAt ? dayjs(e.startAt) : null;
      if (start) return start.isSame(dayDate, 'day');
      return dayjs(e.date).isSame(dayDate, 'day');
    });

    return { dayUnits, dayDeadlines, dayEvents };
  };

  const { dayUnits, dayDeadlines, dayEvents } = getItemsForDay();

  // Prepare items for overlap calculation
  const calendarItems: CalendarItem[] = [];

  // Add units
  dayUnits.forEach(({ unit, schedule }) => {
    const timeInfo = parseTimeRange(`${schedule.startTime} - ${schedule.endTime}`);
    if (timeInfo) {
      calendarItems.push({
        id: `unit-${unit.id}-${schedule.day}-${schedule.startTime}`,
        startHour: timeInfo.startHour,
        startMin: timeInfo.startMin,
        endHour: timeInfo.endHour,
        endMin: timeInfo.endMin,
        type: 'unit',
        data: { unit, schedule },
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

  const overlapInfo = calculateOverlapGroups(calendarItems);
  const mqKeyDates = getMQKeyDatesForDay(date).filter((d) => d.category !== 'classes');

  // Calculate current time position for the red line
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  let currentTimePosition: number | null = null;

  if (isToday && currentHour >= START_HOUR && currentHour < START_HOUR + HOURS.length) {
    currentTimePosition =
      (currentHour - START_HOUR) * HOUR_HEIGHT + (currentMinute / 60) * HOUR_HEIGHT;
  }

  return (
    <div className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-mq-border bg-mq-card-background">
      <div className="relative h-[clamp(28rem,65vh,52rem)] flex-1 overflow-x-hidden overflow-y-auto no-scrollbar md:h-[clamp(32rem,68vh,56rem)]">
        {/* MQ Key Dates Header */}
        {mqKeyDates.length > 0 && (
          <div className="p-3 border-b border-mq-border bg-mq-background-secondary/30 sticky top-0 z-20 backdrop-blur-sm">
            <div className="flex flex-wrap gap-2">
              {mqKeyDates.map((mqDate) => {
                const categoryColors = MQ_DATE_COLORS[mqDate.category];
                const programStyle = PROGRAM_STYLES[mqDate.program];
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
                      'px-2 py-1.5 rounded-md text-xs font-semibold shadow-sm border-l-4 flex flex-col',
                      programStyle.bgLight,
                      programStyle.border,
                      programStyle.pattern,
                    )}
                    title={
                      mqDate.description
                        ? `${mqDate.event} - ${mqDate.term}: ${mqDate.description}`
                        : `${mqDate.event} - ${mqDate.term}`
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
                    <span className={cn('line-clamp-1', programStyle.text)}>{mqDate.event}</span>
                    <span className={cn('text-[9px] opacity-70', programStyle.text)}>
                      {mqDate.term}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Time Grid */}
        <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT + 24 }}>
          {/* Hour Lines */}
          {HOURS.map((hour, index) => (
            <div
              key={hour}
              className="absolute left-0 right-0 flex"
              style={{ top: index * HOUR_HEIGHT + 24 }}
            >
              <div className="w-16 text-xs text-mq-content-secondary text-right pr-4 -mt-2 border-r border-mq-border flex-shrink-0 font-medium">
                {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </div>
              <div
                className={cn('flex-1 border-t border-mq-border/50', isToday && 'bg-mq-primary/5')}
                style={{ height: HOUR_HEIGHT }}
              />
            </div>
          ))}

          {/* Current Time Line */}
          {currentTimePosition !== null && (
            <div
              className="absolute left-[64px] right-0 z-30 pointer-events-none flex items-center"
              style={{ top: currentTimePosition + 24 }}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 ring-2 ring-mq-background" />
              <div className="flex-1 h-[2px] bg-red-500 shadow-sm" />
            </div>
          )}

          {/* Events Overlay */}
          <div className="absolute left-[64px] right-2 top-[24px] bottom-0">
            {/* Units */}
            {dayUnits.map(({ unit, schedule }) => {
              const timeInfo = parseTimeRange(`${schedule.startTime} - ${schedule.endTime}`);
              if (!timeInfo) return null;

              const posInfo = getTimePositionAndHeight(
                timeInfo.startHour,
                timeInfo.startMin,
                timeInfo.endHour,
                timeInfo.endMin,
              );
              if (!posInfo) return null;

              const itemId = `unit-${unit.id}-${schedule.day}-${schedule.startTime}`;
              const overlap = overlapInfo.get(itemId) || { column: 0, totalColumns: 1 };
              const width = `calc((100% - 8px) / ${overlap.totalColumns})`;
              const left = `calc(4px + (100% - 8px) * ${overlap.column} / ${overlap.totalColumns})`;

              return (
                <button
                  key={itemId}
                  type="button"
                  className="absolute rounded-md shadow-sm z-10 border-l-4 overflow-hidden cursor-pointer hover:brightness-95 transition-all text-left group bg-mq-card-background border border-mq-border"
                  style={{
                    top: posInfo.top,
                    height: Math.max(posInfo.height, 44),
                    left,
                    width,
                    borderLeftColor: unit.color,
                  }}
                  onClick={() => onUnitClick(unit)}
                >
                  <div className="p-1 h-full overflow-hidden">
                    <span className="block text-xs font-bold truncate text-mq-content group-hover:text-mq-primary transition-colors">
                      {unit.code}
                    </span>
                    <span className="text-[10px] text-mq-content-secondary block">
                      {formatScheduleTime(schedule.startTime, 'en')} -{' '}
                      {formatScheduleTime(schedule.endTime, 'en')}
                    </span>
                    <span className="text-[10px] text-mq-content-tertiary block truncate mt-0.5">
                      {formatLocation(
                        unit.location.building,
                        unit.location.room,
                        t('room' as TranslationKey),
                      )}
                    </span>
                  </div>
                </button>
              );
            })}

            {/* Deadlines */}
            {dayDeadlines.map((deadline) => {
              const dueDayjs = dayjs(deadline.dueDate);
              const hours = dueDayjs.hour();
              const minutes = dueDayjs.minute();
              const posInfo = getTimePositionAndHeight(hours, minutes, hours + 1, minutes);

              if (!posInfo || hours < START_HOUR) return null;

              const deadlineColor = getDeadlineColor(deadline, units);

              const itemId = `deadline-${deadline.id}`;
              const overlap = overlapInfo.get(itemId) || { column: 0, totalColumns: 1 };
              const width = `calc((100% - 8px) / ${overlap.totalColumns})`;
              const left = `calc(4px + (100% - 8px) * ${overlap.column} / ${overlap.totalColumns})`;

              return (
                <button
                  key={itemId}
                  type="button"
                  onClick={() => onDeadlineClick(deadline)}
                  className={cn(
                    'absolute text-left px-2 py-1 rounded-md shadow-sm text-xs font-medium z-10 border-l-4 transition-all hover:brightness-95 text-white',
                    deadline.completed && 'opacity-60 line-through',
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
                  <div className="line-clamp-2 leading-tight">
                    {deadline.unitCode} – {deadline.title}
                  </div>
                  <div className="text-[10px] opacity-90 mt-0.5">
                    {dayjs(deadline.dueDate).format('h:mm A')}
                  </div>
                </button>
              );
            })}

            {/* Events */}
            {dayEvents.map((event) => {
              const timeInfo = parseTimeRange(event.time);
              if (!timeInfo) return null;
              const posInfo = getTimePositionAndHeight(
                timeInfo.startHour,
                timeInfo.startMin,
                timeInfo.endHour,
                timeInfo.endMin,
              );
              if (!posInfo) return null;

              const colors = getEventColors(event);
              const itemId = `event-${event.id}`;
              const overlap = overlapInfo.get(itemId) || { column: 0, totalColumns: 1 };
              const width = `calc((100% - 8px) / ${overlap.totalColumns})`;
              const left = `calc(4px + (100% - 8px) * ${overlap.column} / ${overlap.totalColumns})`;

              return (
                <button
                  key={itemId}
                  type="button"
                  onClick={() => onEventClick(event)}
                  className={cn(
                    'absolute text-left px-2 py-1 rounded-md shadow-sm text-xs font-medium z-10 transition-all hover:brightness-95',
                    colors.bg,
                    colors.text,
                    colors.border && 'border border-l-4',
                  )}
                  style={{
                    top: posInfo.top,
                    height: Math.max(posInfo.height, 44),
                    left,
                    width,
                    ...colors.style,
                    ...(colors.border ? { borderLeftColor: colors.style?.borderColor } : {}),
                  }}
                >
                  <div className="font-bold truncate">{event.title}</div>
                  <div className="text-[10px] opacity-90 truncate">{event.location}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
