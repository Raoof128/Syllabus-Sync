// components/home/TodaySchedule.tsx
'use client';

import React, { useMemo, memo } from 'react';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Clock, MapPin, ExternalLink } from 'lucide-react';
import { useHydration } from '@/lib/hooks';
import { Button } from '@/components/ui/mq/button';
import { useTranslation } from '@/lib/hooks/useTranslation';
import Link from 'next/link';
import { MagicCard } from '@/components/ui/MagicCard';
import { formatScheduleTime, formatLocation } from '@/lib/utils/locale';

const TodaySchedule = memo(() => {
  const isHydrated = useHydration();
  const units = useUnitsStore((state) => state.units);
  const { t, language } = useTranslation();

  const todayLabel = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }, []);

  const todayDate = useMemo(() => {
    return new Date().toISOString().split('T')[0];
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
    <MagicCard isLiquidEnhanced>
      <div className="mq-magic-card-content">
        <Card className="h-full border-0 shadow-none bg-transparent">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('todaysClasses')}</CardTitle>
            <Button size="sm" variant="outline" className="gap-1" asChild>
              <Link
                href="/calendar?view=today"
                aria-label={`${t('viewAll')} ${t('todaysClasses')}`}
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                <span>{t('viewAll')}</span>
              </Link>
            </Button>
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
                <Clock
                  className="h-12 w-12 text-mq-content-tertiary mx-auto mb-4"
                  aria-hidden="true"
                />
                <p className="text-mq-content-tertiary">{t('noClassesToday')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayClasses.map((cls, index) => (
                  <Link
                    key={`${cls.id}-${cls.code}`}
                    href={`/calendar?date=${todayDate}&unit=${encodeURIComponent(cls.code)}`}
                    className={`group flex items-start gap-3 p-3 bg-mq-background-secondary rounded-lg border border-transparent hover:border-mq-primary/20 hover:bg-mq-hover-background transition-all duration-300 hover:translate-x-1 hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] focus:outline-none focus:ring-2 focus:ring-mq-primary/50 focus:ring-offset-2 ${index > 0 ? 'border-t-2 border-t-mq-border' : ''}`}
                    aria-label={`${cls.code} - ${cls.name}, ${formatScheduleTime(cls.startTime, language)} - ${formatScheduleTime(cls.endTime, language)} at ${formatLocation(cls.location.building, cls.location.room, t('room'))}`}
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
                          <Clock className="h-4 w-4" aria-hidden="true" />
                          <span>
                            {formatScheduleTime(cls.startTime, language)} -{' '}
                            {formatScheduleTime(cls.endTime, language)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" aria-hidden="true" />
                          <span>
                            {formatLocation(cls.location.building, cls.location.room, t('room'))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MagicCard>
  );
});

TodaySchedule.displayName = 'TodaySchedule';

export default TodaySchedule;
