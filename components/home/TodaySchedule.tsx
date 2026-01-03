// components/home/TodaySchedule.tsx
'use client';

import React, { useMemo, memo } from 'react';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Clock, MapPin, BookOpen } from 'lucide-react';
import { useHydration } from '@/lib/hooks';
import { Button } from '@/components/ui/mq/button';

const TodaySchedule = memo(function TodaySchedule() {
  const isHydrated = useHydration();
  const units = useUnitsStore((state) => state.units);
  const todayLabel = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }, []);
  const todayClasses = useMemo(() => {
    const classes = units.flatMap((unit) =>
      unit.schedule
        .filter((schedule) => schedule.day === todayLabel)
        .map((schedule) => ({
          ...unit,
          ...schedule,
        })),
    );

    return classes.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [todayLabel, units]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s Classes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
        ) : todayClasses.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-mq-content-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-mq-content mb-2">No classes today</h3>
            <p className="text-mq-content-secondary mb-4">You&apos;re all caught up! Enjoy your free time.</p>
            <Button
              onClick={() => {
                try {
                  window.dispatchEvent(new CustomEvent('add-unit'));
                } catch (error) {
                  console.warn('Failed to trigger add unit event:', error);
                  // Fallback to direct navigation
                  window.location.href = '/home';
                }
              }}
              className="gap-2 focus:ring-2 focus:ring-mq-primary/50"
              aria-label="Add a new unit to start tracking classes"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  try {
                    window.dispatchEvent(new CustomEvent('add-unit'));
                  } catch (error) {
                    console.warn('Failed to trigger add unit event:', error);
                    window.location.href = '/home';
                  }
                }
              }}
            >
              <BookOpen className="h-4 w-4" />
              Add Unit
            </Button>
          </div>
        ) : (
          todayClasses.map((cls) => (
            <div
              key={`${cls.id}-${cls.code}`}
              className="flex items-start gap-3 p-3 bg-mq-background-secondary rounded-lg hover:bg-mq-hover-background transition-colors"
            >
              {/* Color indicator */}
              <div
                className="w-1 h-full rounded-full flex-shrink-0"
                style={{ backgroundColor: cls.color }}
              />

              {/* Class info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-mq-content">
                  {cls.code} — {cls.name}
                </h3>

                <div className="flex items-center gap-4 mt-1 text-sm text-mq-content-secondary">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {cls.startTime} - {cls.endTime}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {cls.location.building} {cls.location.room}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
});

TodaySchedule.displayName = 'TodaySchedule';

export default TodaySchedule;
