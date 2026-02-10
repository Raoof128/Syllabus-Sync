'use client';

import { useMemo, useEffect } from 'react';
import { startOfWeek, addDays, format, isSameDay, isToday } from 'date-fns';
import { enAU } from 'date-fns/locale';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useEventsStore } from '@/lib/store/eventsStore';
import Link from 'next/link';
import { CardSolid } from './HomeCard';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { useHydration } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from 'framer-motion';

export default function WeekHeatStrip() {
  const { t } = useTypedTranslation();
  const isHydrated = useHydration();
  const units = useUnitsStore((state) => state.units);
  const loadUnits = useUnitsStore((state) => state.loadUnits);
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const loadDeadlines = useDeadlinesStore((state) => state.loadDeadlines);
  const events = useEventsStore((state) => state.events);
  const loadEvents = useEventsStore((state) => state.loadEvents);
  const prefersReducedMotion = useReducedMotion();

  // Load data from database on mount
  useEffect(() => {
    if (isHydrated) {
      loadUnits();
      loadDeadlines();
      loadEvents();
    }
  }, [isHydrated, loadUnits, loadDeadlines, loadEvents]);

  const weekData = useMemo(() => {
    if (!isHydrated) return [];

    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday start

    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(start, i);
      const dayName = format(date, 'EEEE', { locale: enAU }); // Full day name for matching

      // Count classes from units
      let classCount = 0;
      units.forEach((unit) => {
        const unitClasses = unit.schedule?.filter((s) => s.day === dayName) || [];
        classCount += unitClasses.length;
      });

      // Get all deadlines for this day (including exams and assignments)
      const dayDeadlines = deadlines.filter(
        (d) => !d.completed && isSameDay(new Date(d.dueDate), date),
      );

      // Count by type from deadlines store
      const examCount = dayDeadlines.filter((d) => d.type === 'Exam').length;
      const assignmentCount = dayDeadlines.filter((d) => d.type === 'Assignment').length;
      const quizCount = dayDeadlines.filter((d) => d.type === 'Quiz').length;
      const presentationCount = dayDeadlines.filter((d) => d.type === 'Presentation').length;
      const otherDeadlineCount = quizCount + presentationCount;
      const deadlineCount = dayDeadlines.length;

      // Count events for this day
      const dayEvents = events.filter((e) => isSameDay(new Date(e.startAt), date));
      const eventCount = dayEvents.length;

      // Total load (weighted: exams are more significant)
      const load =
        classCount + examCount * 2 + assignmentCount * 1.5 + otherDeadlineCount + eventCount;

      // Normalize intensity (0-4 scale for visualization)
      const intensity = load === 0 ? 0 : Math.min(Math.ceil(load / 2), 4);

      return {
        date,
        dayShort: format(date, 'EEE', { locale: enAU }),
        fullDate: format(date, 'PPP', { locale: enAU }),
        classCount,
        deadlineCount,
        examCount,
        assignmentCount,
        otherDeadlineCount,
        eventCount,
        load,
        intensity,
        isToday: isToday(date),
      };
    });
  }, [units, deadlines, events, isHydrated]);

  if (!isHydrated) {
    return (
      <CardSolid className="p-4 mb-6">
        <div className="flex justify-between items-end h-16 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="w-full bg-mq-background-tertiary rounded-t-sm h-full animate-pulse opacity-30"
            />
          ))}
        </div>
      </CardSolid>
    );
  }

  // Color mapping for intensity
  const getHeight = (intensity: number) => {
    switch (intensity) {
      case 0:
        return 'h-2';
      case 1:
        return 'h-6';
      case 2:
        return 'h-10';
      case 3:
        return 'h-14';
      case 4:
        return 'h-full';
      default:
        return 'h-2';
    }
  };

  const getColor = (intensity: number, isToday: boolean) => {
    if (intensity === 0) return 'bg-mq-border';
    if (isToday) return 'bg-mq-primary';

    // Gradient from cool to hot? Or just opacity steps?
    // Let's use primary with varying opacities or shades
    // Actually, "Just solid bars with accent colour" - maybe standard accent color

    if (intensity >= 3) return 'bg-mq-accent'; // High load
    return 'bg-mq-primary/60'; // Normal load
  };

  const totalClasses = weekData.reduce((sum, day) => sum + day.classCount, 0);
  const totalDeadlines = weekData.reduce((sum, day) => sum + day.deadlineCount, 0);
  const totalExams = weekData.reduce((sum, day) => sum + day.examCount, 0);
  const totalAssignments = weekData.reduce((sum, day) => sum + day.assignmentCount, 0);
  const totalEvents = weekData.reduce((sum, day) => sum + day.eventCount, 0);

  return (
    <CardSolid className="p-4 sm:p-5 mb-6 overflow-hidden">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-sm font-semibold text-mq-content shrink-0">
          {t('weekAtAGlance') || 'Week Ahead'}
        </h3>
        <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-mq-content-tertiary flex-wrap justify-end">
          <span className="hidden lg:inline-block text-mq-content-tertiary">
            {format(weekData[0]?.date || new Date(), 'MMM d')} –{' '}
            {format(weekData[6]?.date || new Date(), 'MMM d')}
          </span>
          {/* Classes */}
          <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="hidden sm:inline">{totalClasses}</span>
            <span className="sm:hidden">{totalClasses}</span>
            <span className="hidden sm:inline">{totalClasses === 1 ? 'class' : 'classes'}</span>
          </span>
          {/* Exams */}
          {totalExams > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {totalExams}
              <span className="hidden sm:inline">{totalExams === 1 ? 'exam' : 'exams'}</span>
            </span>
          )}
          {/* Assignments */}
          {totalAssignments > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              {totalAssignments}
              <span className="hidden md:inline">
                {totalAssignments === 1 ? 'assignment' : 'assignments'}
              </span>
            </span>
          )}
          {/* Events */}
          {totalEvents > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200/60 dark:border-green-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {totalEvents}
              <span className="hidden md:inline">{totalEvents === 1 ? 'event' : 'events'}</span>
            </span>
          )}
          {/* Other deadlines (quizzes, presentations) */}
          {totalDeadlines > totalExams + totalAssignments && (
            <span className="hidden lg:inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-mq-background-secondary text-mq-content-secondary border border-mq-border/60">
              <span className="w-1.5 h-1.5 rounded-full bg-mq-accent" />
              {totalDeadlines - totalExams - totalAssignments} other
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-between items-end h-24 gap-2 sm:gap-4">
        {weekData.map((day, i) => (
          <Link
            key={i}
            href={`/calendar?date=${format(day.date, 'yyyy-MM-dd')}`}
            className="flex-1 flex flex-col justify-end h-full group relative rounded-md hover:bg-mq-background-secondary/50 transition-colors focus-visible:ring-2 focus-visible:ring-mq-primary focus-visible:ring-offset-2 focus-visible:ring-offset-mq-card-background focus-visible:outline-none"
            aria-label={`${day.fullDate}: ${day.classCount} classes, ${day.examCount} exams, ${day.assignmentCount} assignments, ${day.eventCount} events`}
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[160px] bg-mq-content text-mq-background text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
              <p className="font-bold">{day.fullDate}</p>
              <p>
                {day.classCount} {day.classCount === 1 ? 'class' : 'classes'}
              </p>
              {day.examCount > 0 && (
                <p className="text-red-300">
                  {day.examCount} {day.examCount === 1 ? 'exam' : 'exams'}
                </p>
              )}
              {day.assignmentCount > 0 && (
                <p className="text-purple-300">
                  {day.assignmentCount} {day.assignmentCount === 1 ? 'assignment' : 'assignments'}
                </p>
              )}
              {day.eventCount > 0 && (
                <p className="text-green-300">
                  {day.eventCount} {day.eventCount === 1 ? 'event' : 'events'}
                </p>
              )}
              {day.otherDeadlineCount > 0 && (
                <p className="text-amber-300">{day.otherDeadlineCount} other</p>
              )}
            </div>

            <div className="w-full flex flex-col justify-end flex-grow pb-1">
              {prefersReducedMotion ? (
                <div className="w-full flex items-end justify-center">
                  <div
                    className={cn(
                      'w-full rounded-md',
                      getHeight(day.intensity),
                      getColor(day.intensity, day.isToday),
                      day.isToday &&
                        'ring-2 ring-offset-2 ring-mq-primary ring-offset-mq-card-background',
                    )}
                    aria-label={`${day.dayShort}: ${day.classCount} classes, ${day.examCount} exams, ${day.assignmentCount} assignments`}
                  />
                </div>
              ) : (
                <div className="w-full flex items-end justify-center">
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{
                      duration: 0.4,
                      ease: 'easeOut',
                      delay: i * 0.05, // Stagger effect
                    }}
                    style={{ originY: 1 }}
                    className={cn(
                      'w-full rounded-md',
                      getHeight(day.intensity),
                      getColor(day.intensity, day.isToday),
                      day.isToday &&
                        'ring-2 ring-offset-2 ring-mq-primary ring-offset-mq-card-background',
                    )}
                    aria-label={`${day.dayShort}: ${day.classCount} classes, ${day.examCount} exams, ${day.assignmentCount} assignments`}
                  />
                </div>
              )}
            </div>

            <p
              className={cn(
                'text-xs text-center mb-1 font-medium',
                day.isToday ? 'text-mq-primary' : 'text-mq-content-tertiary',
              )}
            >
              {day.dayShort.charAt(0)}
            </p>
          </Link>
        ))}
      </div>
    </CardSolid>
  );
}
