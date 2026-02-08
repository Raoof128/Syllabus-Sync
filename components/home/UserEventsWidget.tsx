'use client';

import React, { useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useEventsStore } from '@/lib/store/eventsStore';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { Calendar, ExternalLink, Clock, MapPin, Eye } from 'lucide-react';
import { isToday, format, isValid, endOfMonth, isBefore, startOfDay } from 'date-fns';
import { enAU, es, faIR } from 'date-fns/locale';
import Link from 'next/link';
import { useHydration } from '@/lib/hooks';
import { Button } from '@/components/ui/mq/button';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { CardSolid } from '@/components/home/HomeCard';
import { cn } from '@/lib/utils';

const UserEventsWidget = memo(() => {
  const isHydrated = useHydration();
  const router = useRouter();
  const events = useEventsStore((state) => state.events);
  const { t, language } = useTypedTranslation();

  const tOr = (key: TranslationKey | string, fallback: string) => {
    const value = t(key as TranslationKey);
    return value === key ? fallback : value;
  };

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

  // Get ALL events from today until end of current month
  const monthEndEvents = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const monthEnd = endOfMonth(now);

    return events
      .filter((event) => {
        // Handle both Date objects and string dates from API/persistence
        let eventDate: Date;
        if (event.startAt) {
          eventDate = event.startAt instanceof Date ? event.startAt : new Date(event.startAt);
        } else if (event.date) {
          eventDate = event.date instanceof Date ? event.date : new Date(event.date);
        } else {
          return false;
        }
        if (!isValid(eventDate)) return false;

        // Show events from today until end of current month (no past events)
        const eventDay = startOfDay(eventDate);
        // Event must be today or in the future, AND before or on the last day of the month
        return !isBefore(eventDay, today) && !isBefore(monthEnd, eventDay);
      })
      .sort((a, b) => {
        const dateA = a.startAt
          ? (a.startAt instanceof Date ? a.startAt : new Date(a.startAt))
          : (a.date instanceof Date ? a.date : new Date(a.date));
        const dateB = b.startAt
          ? (b.startAt instanceof Date ? b.startAt : new Date(b.startAt))
          : (b.date instanceof Date ? b.date : new Date(b.date));
        return dateA.getTime() - dateB.getTime();
      });
  }, [events]);


  const formatEventTime = (event: { startAt: Date; date: Date; time?: string }) => {
    const startDate = event.startAt instanceof Date ? event.startAt : new Date(event.startAt);
    return format(startDate, 'EEE, MMM d • h:mm a', { locale: currentLocale });
  };

  // Category colors
  const categoryColors: Record<string, string> = {
    Career: '#3B82F6',
    Social: '#8B5CF6',
    Academic: '#10B981',
    'Free Food': '#F59E0B',
  };

  return (
    <CardSolid className="h-full flex flex-col">
      <CardHeader
        className="flex flex-row items-center justify-between"
        style={{ color: 'var(--mq-content)', WebkitTextFillColor: 'var(--mq-content)' }}
      >
        <div className="flex items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {tOr('myEvents', 'My Events')}
          </CardTitle>
          {isHydrated && monthEndEvents.length > 0 && (
            <Badge
              variant="neutral"
              className="bg-mq-background-secondary text-mq-content-secondary text-[10px]"
            >
              {monthEndEvents.length} {tOr('upcoming', 'upcoming')}
            </Badge>
          )}
          {/* View Only Badge */}
          {isHydrated && events.length > 0 && (
            <Badge
              variant="neutral"
              className="ml-1 bg-mq-background-secondary text-mq-content-tertiary text-[10px] px-2 py-0.5 flex items-center gap-1"
            >
              <Eye className="h-3 w-3" aria-hidden="true" />
              {t('viewOnly')}
            </Badge>
          )}
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" asChild>
          <Link href="/calendar" aria-label={`${t('viewAll')} ${tOr('myEvents', 'My Events')}`}>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('viewAll')}</span>
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 flex-1">
        {!isHydrated ? (
          <div className="h-48 flex items-center justify-center">
            <p className="text-lg text-mq-content">{t('loading')}</p>
          </div>
        ) : monthEndEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-mq-content-tertiary mx-auto mb-4" aria-hidden="true" />
            <p className="text-mq-content-tertiary">{tOr('noEventsYet', 'No events yet')}</p>
            <p className="text-mq-content-tertiary text-sm mt-1">
              {tOr('addEventsInCalendar', 'Add events in the Calendar tab')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {monthEndEvents.map((event) => {
              const eventColor = event.color || categoryColors[event.category] || '#A6192E';
              const eventStartDate = event.startAt
                ? (event.startAt instanceof Date ? event.startAt : new Date(event.startAt))
                : event.date
                  ? (event.date instanceof Date ? event.date : new Date(event.date))
                  : null;
              const eventIsToday = eventStartDate ? isToday(eventStartDate) : false;
              const eventDateStr = eventStartDate ? format(eventStartDate, 'yyyy-MM-dd') : '';

              return (
                <div
                  key={event.id}
                  className={cn(
                    'group relative flex items-start gap-3 p-3 rounded-lg border transition-all duration-300 hover:translate-x-1 cursor-pointer',
                    'bg-mq-background-secondary border-transparent hover:border-mq-primary/20 hover:bg-mq-hover-background',
                  )}
                  style={{ borderLeftColor: eventColor, borderLeftWidth: '4px' }}
                  onClick={() => router.push(`/calendar?date=${eventDateStr}&highlightEvent=${event.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/calendar?date=${eventDateStr}&highlightEvent=${event.id}`);
                    }
                  }}
                >
                  {/* Color indicator */}
                  <div
                    className="w-1.5 self-stretch rounded-full shrink-0"
                    style={{ backgroundColor: eventColor }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-mq-sm font-medium text-mq-content truncate" title={event.title}>
                        {event.title}
                      </h4>
                      {eventIsToday && (
                        <Badge
                          variant="neutral"
                          className="text-[10px] px-1.5 py-0.5 font-medium shrink-0 bg-mq-background-secondary text-mq-content-secondary"
                        >
                          {tOr('today', 'Today')}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-mq-content-secondary">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{formatEventTime(event)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
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

UserEventsWidget.displayName = 'UserEventsWidget';

export default UserEventsWidget;
