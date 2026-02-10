// components/home/UpcomingDeadlines.tsx
'use client';

import React, { useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { PRIORITY_COLORS } from '@/lib/constants';
import { getDeadlineColor } from '@/lib/calendar-utils';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { Clock, AlertCircle, ExternalLink, CalendarDays, CheckCircle2, Circle } from 'lucide-react';
import { format, isValid, isPast, endOfMonth } from 'date-fns';
import { enAU, es, faIR } from 'date-fns/locale';
import Link from 'next/link';
import { useHydration } from '@/lib/hooks';
import { Button } from '@/components/ui/mq/button';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { CardSolid } from '@/features/home/components/HomeCard';
import { cn } from '@/lib/utils';

const UpcomingDeadlines = memo(() => {
  const isHydrated = useHydration();
  const router = useRouter();
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const toggleComplete = useDeadlinesStore((state) => state.toggleComplete);
  const units = useUnitsStore((state) => state.units);
  const { t, language } = useTypedTranslation();

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

  // Get upcoming deadlines due by end of current month, sorted by date
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const monthEnd = endOfMonth(now);

    return deadlines
      .filter((deadline) => {
        if (deadline.completed) return false;
        const dueDate = new Date(deadline.dueDate);
        if (!isValid(dueDate)) return false;
        // Show deadlines that are overdue OR due by end of current month
        return isPast(dueDate) || dueDate <= monthEnd;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [deadlines]);

  // Use the count of displayed deadlines for consistency
  const pendingCount = upcomingDeadlines.length;

  const getDeadlineTypeLabel = (type: string) => {
    return t(`type_${type}` as TranslationKey) || type;
  };

  const formatDueDate = (date: Date) => {
    const d = new Date(date);
    return format(d, 'EEE, MMM d • h:mm a', { locale: currentLocale });
  };

  return (
    <CardSolid className="h-full flex flex-col">
      <CardHeader
        className="flex flex-row items-center justify-between"
        style={{ color: 'var(--mq-content)', WebkitTextFillColor: 'var(--mq-content)' }}
      >
        <div className="flex items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {t('upcomingDeadlines')}
          </CardTitle>
          {isHydrated && pendingCount > 0 && (
            <Badge
              variant="neutral"
              className="bg-mq-background-secondary text-mq-content-secondary text-[10px]"
            >
              {pendingCount} {t('pending')}
            </Badge>
          )}
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" asChild>
          <Link href="/calendar" aria-label={`${t('viewAll')} ${t('upcomingDeadlines')}`}>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('viewAll')}</span>
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 flex-1">
        {!isHydrated ? (
          <div className="h-48 flex items-center justify-center">
            <p
              className="text-lg text-mq-content alabaster-readable"
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
            className="text-center py-8 alabaster-readable"
            style={{
              color: 'var(--mq-content)',
              WebkitTextFillColor: 'var(--mq-content)',
              opacity: 1,
              mixBlendMode: 'normal',
            }}
          >
            <Clock className="h-12 w-12 text-mq-content-tertiary mx-auto mb-4" aria-hidden="true" />
            <p className="text-mq-content-tertiary">{t('noUpcomingDeadlines')}</p>
            <p className="text-mq-content-tertiary text-sm mt-1">{t('noDeadlinesDesc')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingDeadlines.map((deadline) => {
              const dueDate = new Date(deadline.dueDate);
              const isOverdue = isPast(dueDate);
              const deadlineColor = getDeadlineColor(deadline, units);
              const deadlineDateStr = format(dueDate, 'yyyy-MM-dd');

              return (
                <div
                  key={deadline.id}
                  className={cn(
                    'group relative flex items-start gap-3 p-3 rounded-lg border transition-all duration-300 hover:translate-x-1 cursor-pointer',
                    isOverdue
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                      : 'bg-mq-background-secondary border-transparent hover:border-mq-primary/20 hover:bg-mq-hover-background',
                  )}
                  onClick={() =>
                    router.push(
                      `/calendar?date=${deadlineDateStr}&highlightDeadline=${deadline.id}`,
                    )
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(
                        `/calendar?date=${deadlineDateStr}&highlightDeadline=${deadline.id}`,
                      );
                    }
                  }}
                >
                  {/* Color indicator using unit color */}
                  <div
                    className="w-1.5 self-stretch rounded-full shrink-0"
                    style={{ backgroundColor: deadlineColor }}
                  />

                  {/* Deadline info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleComplete(deadline.id);
                          }}
                          className="shrink-0 p-1.5 -m-1.5 hover:bg-mq-hover-background rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-mq-primary/50"
                          aria-label={
                            deadline.completed ? t('markIncomplete') : t('markAsCompleted')
                          }
                        >
                          {deadline.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-mq-content-tertiary hover:text-mq-primary" />
                          )}
                        </button>
                        <h4
                          className={cn(
                            'font-semibold text-mq-content truncate',
                            deadline.completed && 'line-through text-mq-content-tertiary',
                          )}
                          title={deadline.title}
                        >
                          {deadline.title}
                        </h4>
                      </div>
                      <Badge
                        className={cn(
                          PRIORITY_COLORS[deadline.priority],
                          'text-[10px] px-1.5 py-0.5 font-medium shrink-0',
                        )}
                        variant="neutral"
                      >
                        {t(`priority_${deadline.priority}` as TranslationKey)}
                      </Badge>
                    </div>

                    <p className="text-sm text-mq-content-secondary mb-1.5 line-clamp-1">
                      {deadline.unitCode} • {getDeadlineTypeLabel(deadline.type)}
                    </p>

                    <div className="flex items-center gap-1 text-sm text-mq-content-secondary">
                      {isOverdue && <AlertCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />}
                      <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                        {formatDueDate(dueDate)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </CardSolid>
  );
});

UpcomingDeadlines.displayName = 'UpcomingDeadlines';

export default UpcomingDeadlines;
