'use client';

import { useMemo } from 'react';
import { startOfWeek, addDays, format, isSameDay, isToday } from 'date-fns';
import { enAU } from 'date-fns/locale';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import Link from 'next/link';
import { CardSolid } from './HomeCard';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { useHydration } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function WeekHeatStrip() {
  const { t } = useTranslation();
  const isHydrated = useHydration();
  const units = useUnitsStore((state) => state.units);
  const deadlines = useDeadlinesStore((state) => state.deadlines);

  const weekData = useMemo(() => {
    if (!isHydrated) return [];

    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday start

    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(start, i);
      const dayName = format(date, 'EEEE', { locale: enAU }); // Full day name for matching

      // Count classes
      let classCount = 0;
      units.forEach((unit) => {
        const unitClasses = unit.schedule?.filter((s) => s.day === dayName) || [];
        classCount += unitClasses.length;
      });

      // Count deadlines
      const deadlineCount = deadlines.filter(
        (d) => !d.completed && isSameDay(new Date(d.dueDate), date),
      ).length;

      // Total load (simple sum for now)
      const load = classCount + deadlineCount;

      // Normalize intensity (0-4 scale for visualization)
      // 0: Empty
      // 1: 1 item
      // 2: 2 items
      // 3: 3 items
      // 4: 4+ items
      const intensity = Math.min(load, 4);

      return {
        date,
        dayShort: format(date, 'EEE', { locale: enAU }),
        fullDate: format(date, 'PPP', { locale: enAU }),
        classCount,
        deadlineCount,
        load,
        intensity,
        isToday: isToday(date),
      };
    });
  }, [units, deadlines, isHydrated]);

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

  return (
    <CardSolid className="p-4 mb-6 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-mq-content-secondary">
          {t('weekAtAGlance') || 'Week Ahead'}
        </h3>
        <span className="text-xs text-mq-content-tertiary hidden sm:inline-block">
          {format(weekData[0]?.date || new Date(), 'MMM d')} -{' '}
          {format(weekData[6]?.date || new Date(), 'MMM d')}
        </span>
      </div>

      <div className="flex justify-between items-end h-24 gap-2 sm:gap-4">
        {weekData.map((day, i) => (
          <Link
            key={i}
            href={`/calendar?date=${format(day.date, 'yyyy-MM-dd')}`}
            className="flex-1 flex flex-col justify-end h-full group relative rounded-md hover:bg-mq-background-secondary/50 transition-colors focus-visible:ring-2 focus-visible:ring-mq-primary focus-visible:outline-none"
          >
            {/* Tooltip-ish overlay */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[150px] bg-mq-content text-mq-background text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
              <p className="font-bold">{day.fullDate}</p>
              <p>{day.classCount} classes</p>
              <p>{day.deadlineCount} deadlines</p>
            </div>

            <div className="w-full flex flex-col justify-end flex-grow pb-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: '100%' }}
                className="w-full flex items-end justify-center"
              >
                <div
                  className={cn(
                    'w-full rounded-md transition-all duration-300',
                    getHeight(day.intensity),
                    getColor(day.intensity, day.isToday),
                    day.isToday &&
                      'ring-2 ring-offset-2 ring-mq-primary ring-offset-mq-card-background',
                  )}
                  aria-label={`${day.dayShort}: ${day.classCount} classes, ${day.deadlineCount} deadlines`}
                />
              </motion.div>
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
