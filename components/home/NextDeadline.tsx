// components/home/NextDeadline.tsx
'use client';

import React, { useMemo, memo } from 'react';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { PRIORITY_COLORS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { formatDistanceToNow, format, isValid } from 'date-fns';
import { enAU, es, faIR } from 'date-fns/locale';
import Link from 'next/link';
import { useHydration } from '@/lib/hooks';
import { Button } from '@/components/ui/mq/button';
import { useTranslation } from '@/lib/hooks/useTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { MagicCard } from '@/components/ui/MagicCard';

const NextDeadline = memo(() => {
  const isHydrated = useHydration();
  const deadlines = useDeadlinesStore((state) => state.deadlines);
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

  const nextDeadline = useMemo(() => {
    const now = new Date();
    const validUpcoming = deadlines
      .filter((deadline) => {
        if (deadline.completed) return false;
        const dueDate = new Date(deadline.dueDate);
        return isValid(dueDate) && dueDate > now;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    if (validUpcoming.length > 0) {
      return validUpcoming[0];
    }

    const invalid = deadlines.filter((deadline) => {
      if (deadline.completed) return false;
      const dueDate = new Date(deadline.dueDate);
      return !isValid(dueDate);
    });

    return invalid[0] ?? null;
  }, [deadlines]);
  const dueDate = nextDeadline ? new Date(nextDeadline.dueDate) : null;
  const hasValidDate = dueDate ? isValid(dueDate) : false;
  const calendarDate = hasValidDate ? format(dueDate as Date, 'yyyy-MM-dd') : null;

  return (
    <MagicCard isLiquidEnhanced>
      <div className="mq-magic-card-content">
        <Card className="h-full border-0 shadow-none bg-transparent">
          <CardHeader
            className="flex flex-row items-center justify-between"
            style={{ color: 'var(--mq-content)', WebkitTextFillColor: 'var(--mq-content)' }}
          >
            <CardTitle>{t('nextDeadline')}</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              asChild
            >
              <Link href="/calendar" aria-label={t('viewAll')}>
                <ExternalLink className="h-4 w-4" />
                {t('viewAll')}
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!isHydrated ? (
              <div className="h-32 flex items-center justify-center">
                <p
                  className="text-mq-content alabaster-readable"
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
            ) : !nextDeadline ? (
              <div
                className="text-center py-8 alabaster-readable"
                style={{
                  color: 'var(--mq-content)',
                  WebkitTextFillColor: 'var(--mq-content)',
                  opacity: 1,
                  mixBlendMode: 'normal',
                }}
              >
                <Clock className="h-12 w-12 text-mq-content-tertiary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-mq-content mb-2">
                  {t('noUpcomingDeadlines')}
                </h3>
                <p className="text-mq-content mb-4">{t('noDeadlinesDesc')}</p>
              </div>
            ) : (
              <Link
                href={calendarDate ? `/calendar?date=${calendarDate}` : '/calendar'}
                className="block focus:outline-none focus:ring-2 focus:ring-mq-primary/50 focus:rounded-lg"
                aria-label={t('viewDeadlineDetails', { title: nextDeadline.title })}
              >
                <div
                  className="space-y-3 p-3 -m-3 rounded-lg border border-transparent hover:border-mq-primary/20 hover:bg-mq-hover-background hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300 alabaster-readable"
                  style={{
                    color: 'var(--mq-content)',
                    WebkitTextFillColor: 'var(--mq-content)',
                    opacity: 1,
                    mixBlendMode: 'normal',
                  }}
                >
                  {/* Deadline info */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className="font-semibold text-mq-content"
                        style={{
                          color: 'var(--mq-content)',
                          WebkitTextFillColor: 'var(--mq-content)',
                        }}
                      >
                        {nextDeadline.unitCode} — {nextDeadline.title}
                      </h3>
                      <Badge
                        className={`${PRIORITY_COLORS[nextDeadline.priority]} alabaster-readable`}
                      >
                        {t(
                          typeof nextDeadline.priority === 'string'
                            ? (`priority_${nextDeadline.priority}` as TranslationKey)
                            : nextDeadline.priority,
                        )}
                      </Badge>
                    </div>

                    <p
                      className="text-sm text-mq-content-secondary mt-1"
                      style={{
                        color: 'var(--mq-content-secondary)',
                        WebkitTextFillColor: 'var(--mq-content-secondary)',
                      }}
                    >
                      {t('due')}{' '}
                      {hasValidDate
                        ? format(dueDate as Date, 'MMM dd, h:mm a', { locale: currentLocale })
                        : t('invalidDate')}
                    </p>
                  </div>

                  {/* Time warning */}
                  <div className="flex items-center gap-2 text-sm">
                    {nextDeadline.priority === 'Urgent' ? (
                      <AlertCircle className="h-4 w-4 text-mq-error" />
                    ) : (
                      <Clock className="h-4 w-4 text-mq-content-tertiary" />
                    )}
                    <span
                      className={
                        nextDeadline.priority === 'Urgent'
                          ? 'text-mq-error font-medium'
                          : 'text-mq-content-secondary'
                      }
                    >
                      {hasValidDate
                        ? formatDistanceToNow(dueDate as Date, {
                            addSuffix: true,
                            locale: currentLocale,
                          })
                        : ''}
                    </span>
                  </div>
                </div>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </MagicCard>
  );
});

NextDeadline.displayName = 'NextDeadline';

export default NextDeadline;
