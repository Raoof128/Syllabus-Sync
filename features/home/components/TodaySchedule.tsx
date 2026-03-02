// components/home/TodaySchedule.tsx
'use client';

import React, { useMemo, memo, useState, useEffect } from 'react';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Clock, MapPin, CalendarDays, Zap, CheckCircle2 } from 'lucide-react';
import { useHydration } from '@/lib/hooks';
import { Button } from '@/components/ui/mq/button';
import { Badge } from '@/components/ui/mq/badge';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import Link from 'next/link';
import { CardSolid } from '@/features/home/components/HomeCard';
import { formatScheduleTime, formatLocation } from '@/lib/utils/locale';

// Parse time string "HH:MM" to minutes since midnight
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Format minutes difference to human readable string
function formatTimeDiff(minutes: number): string {
  if (minutes < 1) return '<1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

type ClassStatus = 'now' | 'next' | 'upcoming' | 'done';

interface ClassWithStatus {
  id: string;
  code: string;
  name: string;
  color: string;
  location: { building: string; room: string };
  startTime: string;
  endTime: string;
  day: string;
  status: ClassStatus;
  minutesUntilStart?: number;
  minutesUntilEnd?: number;
  progressPercent?: number;
}

const TodaySchedule = memo(() => {
  const isHydrated = useHydration();
  const units = useUnitsStore((state) => state.units);
  const { t, language } = useTypedTranslation();
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    };

    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const todayLabel = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }, []);

  const todayDate = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Get classes with smart status
  const classesWithStatus = useMemo((): ClassWithStatus[] => {
    const classes = units.flatMap((unit) =>
      unit.schedule
        .filter((schedule) => schedule.day === todayLabel)
        .map((schedule) => {
          const startMinutes = parseTimeToMinutes(schedule.startTime);
          const endMinutes = parseTimeToMinutes(schedule.endTime);

          let status: ClassStatus;
          let minutesUntilStart: number | undefined;
          let minutesUntilEnd: number | undefined;
          let progressPercent: number | undefined;

          if (currentMinutes >= endMinutes) {
            // Class has ended
            status = 'done';
          } else if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
            // Class is in progress
            status = 'now';
            minutesUntilEnd = endMinutes - currentMinutes;
            progressPercent = ((currentMinutes - startMinutes) / (endMinutes - startMinutes)) * 100;
          } else {
            // Class hasn't started
            status = 'upcoming';
            minutesUntilStart = startMinutes - currentMinutes;
          }

          return {
            id: unit.id,
            code: unit.code,
            name: unit.name,
            color: unit.color,
            location: unit.location,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            day: schedule.day,
            status,
            minutesUntilStart,
            minutesUntilEnd,
            progressPercent,
          };
        }),
    );

    // Sort by start time
    const sorted = classes.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Mark the first upcoming class as "next"
    const nextIndex = sorted.findIndex((cls) => cls.status === 'upcoming');
    return sorted.map((cls, index) =>
      index === nextIndex ? { ...cls, status: 'next' as ClassStatus } : cls,
    );
  }, [todayLabel, units, currentMinutes]);

  // Calculate remaining classes count
  const remainingClasses = classesWithStatus.filter(
    (cls) => cls.status === 'now' || cls.status === 'next' || cls.status === 'upcoming',
  ).length;

  const getStatusBadge = (status: ClassStatus) => {
    switch (status) {
      case 'now':
        return (
          <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 animate-pulse flex items-center gap-1">
            <Zap className="h-3 w-3" aria-hidden="true" />
            {t('classNow')}
          </Badge>
        );
      case 'next':
        return (
          <Badge className="bg-mq-primary text-white text-[10px] px-1.5 py-0.5">
            {t('classNext')}
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge
            variant="neutral"
            className="bg-mq-background-tertiary text-mq-content-secondary text-[10px] px-1.5 py-0.5"
          >
            {t('classUpcoming')}
          </Badge>
        );
      case 'done':
        return (
          <Badge
            variant="neutral"
            className="bg-mq-background-tertiary text-mq-content-tertiary text-[10px] px-1.5 py-0.5 flex items-center gap-1"
          >
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            {t('classDone')}
          </Badge>
        );
    }
  };

  return (
    <CardSolid className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="flex items-center gap-2">{t('todaysClasses')}</CardTitle>
          {/* Smart indicator - remaining classes */}
          {isHydrated && classesWithStatus.length > 0 && (
            <Badge
              variant="neutral"
              className="bg-mq-background-secondary text-mq-content-secondary text-[10px]"
            >
              {remainingClasses > 0
                ? t('classesRemaining', { count: remainingClasses })
                : t('allClassesDone')}
            </Badge>
          )}
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" asChild>
          <Link href="/calendar" aria-label={`${t('viewInCalendar')} ${t('todaysClasses')}`}>
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('viewInCalendar')}</span>
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 flex-1">
        {!isHydrated ? (
          <div className="space-y-4 p-2">
            <div className="animate-pulse">
              <div className="h-4 bg-mq-background-tertiary rounded w-3/4 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-mq-background-tertiary rounded w-full" />
                <div className="h-3 bg-mq-background-tertiary rounded w-5/6" />
              </div>
            </div>
            <div className="animate-pulse animation-delay-100">
              <div className="h-4 bg-mq-background-tertiary rounded w-2/3 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-mq-background-tertiary rounded w-full" />
                <div className="h-3 bg-mq-background-tertiary rounded w-4/5" />
              </div>
            </div>
          </div>
        ) : classesWithStatus.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto mb-4 text-mq-content-tertiary" aria-hidden="true" />
            <p className="text-mq-content-tertiary">{t('noClassesToday')}</p>
            <p className="text-mq-content-tertiary text-sm mt-1">{t('noClassesDesc')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {classesWithStatus.map((cls) => (
              <Link
                key={`${cls.id}-${cls.code}-${cls.startTime}`}
                href={`/calendar?date=${todayDate}&highlightUnit=${encodeURIComponent(cls.id)}`}
                className={`group relative flex items-start gap-3 p-3 rounded-lg border border-mq-border transition-all duration-300 hover:translate-x-1 focus:outline-none focus:ring-2 focus:ring-mq-primary/50 focus:ring-offset-2 ${
                  cls.status === 'now'
                    ? 'bg-mq-primary/10 shadow-sm'
                    : cls.status === 'next'
                      ? 'bg-mq-primary/10 shadow-sm'
                      : cls.status === 'done'
                        ? 'bg-mq-background-secondary opacity-60'
                        : 'bg-mq-background-secondary hover:bg-mq-hover-background'
                } focus:bg-mq-primary/10 focus:border-mq-primary/40 focus:shadow-sm`}
                aria-label={`${cls.code} - ${cls.name}, ${formatScheduleTime(cls.startTime, language)} - ${formatScheduleTime(cls.endTime, language)} at ${formatLocation(cls.location.building, cls.location.room, t('room'))}, ${cls.status}`}
              >
                {/* Progress bar for "now" status */}
                {cls.status === 'now' && cls.progressPercent !== undefined && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-mq-background-secondary rounded-b-lg overflow-hidden">
                    <div
                      className="h-full bg-mq-primary/10 transition-all duration-1000"
                      style={{ width: `${cls.progressPercent}%` }}
                    />
                  </div>
                )}

                {/* Color indicator - thicker for emphasis */}
                <div
                  className="w-1.5 self-stretch rounded-full flex-shrink-0"
                  style={{ backgroundColor: cls.color }}
                />

                {/* Class info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3
                      className={`font-semibold text-mq-content ${cls.status === 'done' ? 'line-through' : ''}`}
                    >
                      {cls.code}
                    </h3>
                    {getStatusBadge(cls.status)}
                  </div>

                  <p
                    className="text-sm text-mq-content-secondary mb-1.5 line-clamp-1"
                    title={cls.name}
                  >
                    {cls.name}
                  </p>

                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-mq-content-secondary">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {formatScheduleTime(cls.startTime, language)} -{' '}
                        {formatScheduleTime(cls.endTime, language)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {formatLocation(cls.location.building, cls.location.room, t('room'))}
                      </span>
                    </div>
                  </div>

                  {/* Smart time indicator */}
                  {cls.status === 'now' && cls.minutesUntilEnd !== undefined && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 font-medium">
                      {t('classEndsIn', {
                        time: formatTimeDiff(cls.minutesUntilEnd),
                      })}
                    </p>
                  )}
                  {cls.status === 'next' && cls.minutesUntilStart !== undefined && (
                    <p className="text-xs text-mq-primary mt-1.5 font-medium">
                      {t('classStartsIn', {
                        time: formatTimeDiff(cls.minutesUntilStart),
                      })}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </CardSolid>
  );
});

TodaySchedule.displayName = 'TodaySchedule';

export default TodaySchedule;
