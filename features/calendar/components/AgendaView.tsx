'use client';

import React from 'react';
import dayjs from 'dayjs';
import { Unit, Deadline, Event, ClassTime } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { formatLocalizedDate } from '@/lib/utils/locale';
import { Card, CardContent } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { Clock, MapPin, AlertCircle, GraduationCap } from 'lucide-react';
import { parseTimeRange, getEventColors, getDeadlineColor } from '@/lib/calendar-utils';
import {
  getMQKeyDatesForDay,
  PROGRAM_STYLES,
  PROGRAM_LABELS,
  MQProgram,
  MQKeyDate,
} from '@/data/mqKeyDates';

interface AgendaViewProps {
  date: Date; // The start date (usually start of week)
  daysToShow?: number; // Default 7 for week view
  units: Unit[];
  deadlines: Deadline[];
  events: Event[];
  onUnitClick: (unit: Unit) => void;
  onDeadlineClick: (deadline: Deadline) => void;
  onEventClick: (event: Event) => void;
  showMQKeyDates?: boolean;
  mqProgramFilter?: MQProgram[];
}

export default function AgendaView({
  date,
  daysToShow = 7,
  units,
  deadlines,
  events,
  onUnitClick,
  onDeadlineClick,
  onEventClick,
  showMQKeyDates = true,
  mqProgramFilter,
}: AgendaViewProps) {
  const { t, language } = useTypedTranslation();
  const startDate = dayjs(date);

  // Generate array of days to show
  const days = Array.from({ length: daysToShow }, (_, i) => startDate.add(i, 'day'));

  // Get items for a specific day
  const getItemsForDay = (day: dayjs.Dayjs) => {
    const dayName = day.format('dddd');

    // Units (Classes)
    const dayUnits = units.flatMap((u) => {
      if (!u.schedule || u.schedule.length === 0) return [];
      return u.schedule
        .filter((s) => s.day === dayName)
        .map((s) => ({
          item: u,
          scheduleInstance: s,
          agendaType: 'class' as const,
          sortTime: parseTimeRange(`${s.startTime}`)?.startHour || 0,
          id: `unit-${u.id}-${s.day}-${s.startTime}`,
        }));
    });

    // Deadlines
    const dayDeadlines = deadlines
      .filter((d) => dayjs(d.dueDate).isSame(day, 'day'))
      .map((d) => ({
        item: d,
        agendaType: 'deadline' as const,
        sortTime: dayjs(d.dueDate).hour(),
        id: `deadline-${d.id}`,
      }));

    // Events
    const dayEvents = events
      .filter((e) => {
        const start = e.startAt ? dayjs(e.startAt) : null;
        if (start) return start.isSame(day, 'day');
        return dayjs(e.date).isSame(day, 'day');
      })
      .map((e) => {
        const timeInfo = parseTimeRange(e.time);
        return {
          item: e,
          agendaType: 'event' as const,
          sortTime: timeInfo?.startHour || 0,
          id: `event-${e.id}`,
        };
      });

    // MQ Key Dates (filtered by program)
    const dayMQDates = showMQKeyDates
      ? getMQKeyDatesForDay(day.toDate())
          .filter((d) => d.category !== 'classes')
          .filter((d) => !mqProgramFilter || mqProgramFilter.includes(d.program))
          .map((d) => ({
            item: d,
            agendaType: 'mqdate' as const,
            sortTime: 0, // MQ dates appear at the top (all-day events)
            id: `mqdate-${d.id}`,
          }))
      : [];

    // Combine and sort by time (MQ dates first as they're all-day)
    const allItems = [...dayMQDates, ...dayUnits, ...dayDeadlines, ...dayEvents].sort(
      (a, b) => a.sortTime - b.sortTime,
    );

    return allItems;
  };

  return (
    <div className="space-y-6 pb-20">
      {days.map((day) => {
        const items = getItemsForDay(day);
        const isToday = day.isSame(dayjs(), 'day');

        return (
          <div
            key={day.toISOString()}
            className={cn(
              'group relative pl-8 border-l-2',
              isToday ? 'border-mq-primary' : 'border-mq-border',
            )}
          >
            {/* Date Header bubble */}
            <div
              className={cn(
                'absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 transition-colors',
                isToday
                  ? 'bg-mq-primary border-mq-primary'
                  : 'bg-mq-card-background border-mq-border group-hover:border-mq-content-tertiary',
              )}
            />

            <div className="mb-4">
              <h3
                className={cn(
                  'text-lg font-bold flex items-center gap-2',
                  isToday ? 'text-mq-primary' : 'text-mq-content',
                )}
              >
                {day.format('dddd')}
                <span className="text-sm font-normal text-mq-content-secondary">
                  {formatLocalizedDate(day.toDate(), language, {
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                {isToday && (
                  <Badge variant="neutral" className="ml-2">
                    {t('today')}
                  </Badge>
                )}
              </h3>
            </div>

            <div className="space-y-3">
              {items.length === 0 ? (
                <p className="text-sm text-mq-content-tertiary italic pl-1">
                  {t('noItemsScheduled')}
                </p>
              ) : (
                items.map((entry, idx) => {
                  // Render MQ Key Dates
                  if (entry.agendaType === 'mqdate') {
                    const mqDate = entry.item as MQKeyDate;
                    const programStyle = PROGRAM_STYLES[mqDate.program];

                    return (
                      <Card
                        key={entry.id}
                        className={cn(
                          'border-l-4 border-t-0 border-b-0 border-r-0 rounded-none shadow-sm',
                          programStyle.bgLight,
                        )}
                        style={{ borderLeftColor: programStyle.border.replace('border-', '') }}
                      >
                        <CardContent className="p-3 flex items-center gap-4">
                          <div className="flex-col w-16 text-center hidden sm:flex">
                            <span className="text-lg" aria-hidden="true">
                              {programStyle.icon}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className={cn('font-semibold text-sm', programStyle.text)}>
                                {mqDate.event}
                              </h4>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-mq-content-tertiary flex-wrap">
                              <span className="flex items-center gap-1">
                                <GraduationCap className="w-3 h-3" />{' '}
                                {PROGRAM_LABELS[mqDate.program]}
                              </span>
                              <span>{mqDate.term}</span>
                            </div>
                            {mqDate.description && (
                              <p className="text-[10px] text-mq-content-secondary mt-1 line-clamp-2">
                                {mqDate.description}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  // Render logic based on type
                  if (entry.agendaType === 'class') {
                    // Unit
                    const u = entry.item as Unit;
                    const s = entry.scheduleInstance as ClassTime;

                    return (
                      <Card
                        key={`${entry.id}-${idx}`}
                        className="border-l-4 border-l-mq-primary border-t-0 border-b-0 border-r-0 rounded-none bg-mq-card-background shadow-sm hover:bg-mq-background-secondary transition-colors cursor-pointer"
                        onClick={() => onUnitClick(u)}
                      >
                        <CardContent className="p-3 flex items-center gap-4">
                          <div className="flex-col w-16 text-center hidden sm:flex">
                            <span className="text-xs font-bold text-mq-content">{s.startTime}</span>
                            <span className="text-[10px] text-mq-content-tertiary">
                              {s.endTime}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="neutral"
                                className="text-[10px] px-1 py-0 h-4 border border-mq-primary/30 text-mq-primary bg-mq-primary/5"
                              >
                                {t('class')}
                              </Badge>
                              <h4 className="font-semibold text-sm">{u.code}</h4>
                            </div>
                            <p className="text-xs text-mq-content-secondary line-clamp-1">
                              {u.name}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-[10px] text-mq-content-tertiary">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {s.startTime} - {s.endTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {u.location?.room}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  } else if (entry.agendaType === 'deadline') {
                    const d = entry.item as Deadline;
                    const deadlineColor = getDeadlineColor(d, units);
                    return (
                      <Card
                        key={entry.id}
                        className="border-l-4 border-t-0 border-b-0 border-r-0 rounded-none bg-mq-card-background shadow-sm hover:bg-mq-background-secondary transition-colors cursor-pointer"
                        style={{ borderLeftColor: deadlineColor }}
                        onClick={() => onDeadlineClick(d)}
                      >
                        <CardContent className="p-3 flex items-center gap-4">
                          <div className="flex-col w-16 text-center hidden sm:flex">
                            <span className="text-xs font-bold text-mq-content">
                              {dayjs(d.dueDate).format('HH:mm')}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="neutral"
                                className="text-[10px] px-1 py-0 h-4 border"
                                style={{
                                  color: deadlineColor,
                                  borderColor: `${deadlineColor}4d`,
                                  backgroundColor: `${deadlineColor}1a`,
                                }}
                              >
                                {d.type}
                              </Badge>
                              <h4
                                className={cn(
                                  'font-semibold text-sm',
                                  d.completed && 'line-through opacity-60',
                                )}
                              >
                                {d.title}
                              </h4>
                            </div>
                            <p className="text-xs text-mq-content-secondary">{d.unitCode}</p>
                            <div className="flex items-center gap-3 mt-2 text-[10px] text-mq-content-tertiary">
                              <span className="flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {t('due')}{' '}
                                {dayjs(d.dueDate).format('h:mm A')}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  } else {
                    // Event
                    const e = entry.item as Event;
                    const colors = getEventColors(e);
                    return (
                      <Card
                        key={entry.id}
                        className="border-l-4 border-l-mq-success border-t-0 border-b-0 border-r-0 rounded-none bg-mq-card-background shadow-sm hover:bg-mq-background-secondary transition-colors cursor-pointer"
                        style={{
                          borderLeftColor: colors.style?.backgroundColor,
                        }}
                        onClick={() => onEventClick(e)}
                      >
                        <CardContent className="p-3 flex items-center gap-4">
                          <div className="flex-col w-16 text-center hidden sm:flex">
                            <span className="text-xs font-bold text-mq-content">
                              {e.time.split('-')[0]}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="neutral"
                                className="text-[10px] px-1 py-0 h-4 border border-mq-success/30 text-mq-success bg-mq-success/5"
                              >
                                {t('event')}
                              </Badge>
                              <h4 className="font-semibold text-sm">{e.title}</h4>
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-[10px] text-mq-content-tertiary">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {e.time}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {e.location}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
