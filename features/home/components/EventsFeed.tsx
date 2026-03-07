// components/home/EventsFeed.tsx
// Shows PUBLIC university events (not user-owned) - read-only announcement board
'use client';

import React, { memo, useMemo, useEffect } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { MapPin, Clock, ExternalLink, Calendar } from 'lucide-react';
import { usePublicEventsStore } from '@/lib/store/publicEventsStore';
import { isToday } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/mq/button';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { CardSolid } from '@/features/home/components/HomeCard';
import { PublicEvent } from '@/lib/types/publicEvents';
import { useHydration } from '@/lib/hooks';

const categoryColors: Record<string, string> = {
  Career: 'bg-mq-info/10 text-mq-info border border-mq-info/20',
  Social: 'bg-mq-purple/10 text-mq-purple border border-mq-purple/20',
  Academic: 'bg-mq-success/10 text-mq-success border border-mq-success/20',
  'Free Food': 'bg-mq-warning/10 text-mq-warning border border-mq-warning/20',
};

const EventsFeed = memo(() => {
  const { t } = useTypedTranslation();
  const router = useRouter();
  const { events, isLoading, fetchPublicEvents } = usePublicEventsStore();
  const isHydrated = useHydration();

  // Fetch public events on mount
  useEffect(() => {
    if (isHydrated) {
      fetchPublicEvents();
    }
  }, [isHydrated, fetchPublicEvents]);

  // Filter events to today only - use startAt as source of truth
  const todayEvents = useMemo(() => {
    return events.filter((event) => {
      return isToday(new Date(event.startAt));
    });
  }, [events]);

  const handleViewAll = () => {
    router.push('/feed');
  };

  const handleEventClick = (event: PublicEvent) => {
    // Navigate to feed page with highlight
    router.push(`/feed?highlight=${event.id}`);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getTimeRange = (event: PublicEvent) => {
    if (event.allDay) return t('allDay');
    const start = formatTime(event.startAt);
    if (event.endAt) {
      const end = formatTime(event.endAt);
      return `${start} - ${end}`;
    }
    return start;
  };

  return (
    <CardSolid className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('eventsToday')}</CardTitle>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={handleViewAll}
          aria-label={t('viewAll')}
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t('viewAll')}</span>
        </Button>
      </CardHeader>
      <CardContent>
        {!isHydrated || isLoading ? (
          <div className="space-y-3 p-2">
            <div className="animate-pulse">
              <div className="h-4 bg-mq-background-tertiary rounded w-3/4 mb-3" />
              <div className="h-3 bg-mq-background-tertiary rounded w-1/2" />
            </div>
          </div>
        ) : todayEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar
              className="h-12 w-12 mx-auto mb-4 text-mq-content-tertiary"
              aria-hidden="true"
            />
            <p className="text-mq-content-tertiary">{t('noEventsToday')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayEvents.map((event) => {
              const eventContent = (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-mq-sm font-medium text-mq-content line-clamp-2">
                      {event.title}
                    </h3>
                    <Badge
                      className={`${categoryColors[event.category]} alabaster-readable shrink-0`}
                    >
                      {t(`category_${event.category.replace(/ /g, '')}` as TranslationKey)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-mq-content-secondary">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>{getTimeRange(event)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>
                </>
              );

              const baseClassName =
                'group block p-3 bg-mq-background-secondary rounded-lg border border-mq-border hover:bg-mq-hover-background transition-all duration-300 hover:translate-x-1 hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] focus:outline-none focus:ring-2 focus:ring-mq-primary/50 focus:ring-offset-2 focus:ring-offset-mq-card-background focus:bg-mq-primary/10 focus:border-mq-primary/40 focus:shadow-sm';

              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => handleEventClick(event)}
                  className={`${baseClassName} cursor-pointer text-left w-full`}
                  aria-label={t('viewEventAria', { title: event.title })}
                >
                  {eventContent}
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </CardSolid>
  );
});

EventsFeed.displayName = 'EventsFeed';

export default EventsFeed;
