// components/home/UpcomingDeadlines.tsx
'use client';

import React, { useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { PRIORITY_COLORS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import {
  Clock,
  AlertCircle,
  ExternalLink,
  CalendarDays,
  CheckCircle2,
  Circle,
  MapPin,
} from 'lucide-react';
import { format, isValid, isPast } from 'date-fns';
import { enAU, es, faIR } from 'date-fns/locale';
import Link from 'next/link';
import { useHydration } from '@/lib/hooks';
import { Button } from '@/components/ui/mq/button';
import { useTranslation } from '@/lib/hooks/useTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { MagicCard } from '@/components/ui/MagicCard';
import { cn } from '@/lib/utils';

// Type colors for deadlines
const TYPE_COLORS = {
  Assignment: { bg: 'bg-mq-info', border: 'border-mq-info', text: 'text-white' },
  Exam: { bg: 'bg-mq-error', border: 'border-mq-error', text: 'text-white' },
  Presentation: { bg: 'bg-mq-purple', border: 'border-mq-purple', text: 'text-white' },
  Quiz: { bg: 'bg-mq-warning', border: 'border-mq-warning', text: 'text-black' },
};

const UpcomingDeadlines = memo(() => {
  const isHydrated = useHydration();
  const router = useRouter();
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const toggleComplete = useDeadlinesStore((state) => state.toggleComplete);
  const units = useUnitsStore((state) => state.units);
  const { t, language } = useTranslation();

  const currentLocale = useMemo(() => {
    switch (language) {
      case 'es':
        return es;
      case 'fa':
        return faIR;
      default:
        return enAU;
    }
  }, [language]);

  // Get upcoming deadlines sorted by date, limited to 6
  const upcomingDeadlines = useMemo(() => {
    return deadlines
      .filter((deadline) => {
        if (deadline.completed) return false;
        const dueDate = new Date(deadline.dueDate);
        return isValid(dueDate);
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 6);
  }, [deadlines]);

  const pendingCount = deadlines.filter((d) => !d.completed).length;

  const getDeadlineTypeLabel = (type: string) => {
    return t(`type_${type}` as TranslationKey) || type;
  };

  const formatDueDate = (date: Date) => {
    const d = new Date(date);
    return format(d, 'EEE, MMM d • h:mm a', { locale: currentLocale });
  };

  // Get unit for a deadline to access building info
  const getUnitForDeadline = (unitCode: string) => {
    return units.find((u) => u.code === unitCode);
  };

  return (
    <MagicCard isLiquidEnhanced>
      <div className="mq-magic-card-content">
        <Card className="h-full border-0 shadow-none bg-transparent">
          <CardHeader
            className="flex flex-row items-center justify-between pb-4"
            style={{ color: 'var(--mq-content)', WebkitTextFillColor: 'var(--mq-content)' }}
          >
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <CalendarDays className="h-6 w-6" />
              {t('upcomingDeadlines')}
            </CardTitle>
            <div className="flex items-center gap-2">
              {isHydrated && pendingCount > 0 && (
                <Badge variant="neutral">
                  {pendingCount} {t('pending')}
                </Badge>
              )}
              <Button size="sm" variant="outline" className="gap-1" asChild>
                <Link href="/calendar" aria-label={`${t('viewAll')} ${t('upcomingDeadlines')}`}>
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  <span>{t('viewAll')}</span>
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!isHydrated ? (
              <div className="h-40 flex items-center justify-center">
                <p
                  className="text-base text-mq-content alabaster-readable"
                  style={{
                    color: 'var(--mq-content)',
                    WebkitTextFillColor: 'var(--mq-content)',
                    opacity: 1,
                    mixBlendMode: 'normal',
                  }}
                >
                  {t('loading')}
                </p>
              </div>
            ) : upcomingDeadlines.length === 0 ? (
              <div
                className="text-center py-12 alabaster-readable"
                style={{
                  color: 'var(--mq-content)',
                  WebkitTextFillColor: 'var(--mq-content)',
                  opacity: 1,
                  mixBlendMode: 'normal',
                }}
              >
                <Clock className="h-14 w-14 text-mq-content-tertiary mx-auto mb-5" />
                <h3 className="text-xl font-semibold text-mq-content mb-3">
                  {t('noUpcomingDeadlines')}
                </h3>
                <p className="text-base text-mq-content mb-4">{t('noDeadlinesDesc')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {upcomingDeadlines.map((deadline) => {
                  const dueDate = new Date(deadline.dueDate);
                  const isOverdue = isPast(dueDate);
                  const colors = TYPE_COLORS[deadline.type];
                  const unit = getUnitForDeadline(deadline.unitCode);

                  return (
                    <div
                      key={deadline.id}
                      className={cn(
                        'p-5 rounded-xl border-l-4 bg-mq-background-secondary/50 hover:bg-mq-background-secondary transition-all cursor-pointer shadow-sm hover:shadow-lg',
                        colors.border,
                        isOverdue && 'bg-red-50/50 dark:bg-red-950/20',
                      )}
                      onClick={() => router.push(`/calendar?highlightDeadline=${deadline.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/calendar?highlightDeadline=${deadline.id}`);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleComplete(deadline.id);
                              }}
                              className="flex-shrink-0 p-1.5 hover:bg-mq-hover-background rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                              aria-label={
                                deadline.completed ? t('markIncomplete') : t('markAsCompleted')
                              }
                            >
                              {deadline.completed ? (
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                              ) : (
                                <Circle className="h-6 w-6 text-mq-content-tertiary hover:text-mq-primary" />
                              )}
                            </button>
                            <h4
                              className={cn(
                                'font-semibold text-lg leading-snug line-clamp-2',
                                deadline.completed && 'line-through text-mq-content-tertiary',
                              )}
                            >
                              {deadline.title}
                            </h4>
                          </div>
                          <p className="text-base text-mq-content-secondary mb-2 pl-1">
                            {deadline.unitCode} • {getDeadlineTypeLabel(deadline.type)}
                          </p>
                          <p
                            className={cn(
                              'text-base mt-3 flex items-center gap-2 pl-1',
                              isOverdue
                                ? 'text-red-600 font-semibold'
                                : 'text-mq-content-secondary',
                            )}
                          >
                            {isOverdue && <AlertCircle className="h-5 w-5 inline" />}
                            {formatDueDate(dueDate)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <Badge
                            className={cn(PRIORITY_COLORS[deadline.priority], 'text-sm px-3 py-1.5 font-medium')}
                            variant="neutral"
                          >
                            {t(`priority_${deadline.priority}` as TranslationKey)}
                          </Badge>
                          {unit?.location?.building && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/map?building=${unit.location.building}`);
                              }}
                              className="p-3 hover:bg-mq-hover-background rounded-xl text-mq-content-secondary hover:text-mq-primary min-h-[48px] min-w-[48px] flex items-center justify-center transition-all hover:shadow-md border border-transparent hover:border-mq-border"
                              title={`${unit.location.building} ${unit.location.room ? `Room ${unit.location.room}` : ''}`}
                              aria-label={t('navigateToBuildingAria', {
                                building: unit.location.building,
                              })}
                            >
                              <MapPin className="h-6 w-6" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MagicCard>
  );
});

UpcomingDeadlines.displayName = 'UpcomingDeadlines';

export default UpcomingDeadlines;
