'use client';

import React, { useMemo } from 'react';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { Plus, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/mq/button';
import { Badge } from '@/components/ui/mq/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { MagicCard } from '@/components/ui/MagicCard';
import { cn } from '@/lib/utils';
import { useEventsStore } from '@/lib/store/eventsStore';
import { Event } from '@/lib/types';
import ItemActionButtons from '@/features/calendar/components/ItemActionButtons';
import { formatLocalizedDate } from '@/lib/utils/locale';
import { isPast, startOfDay } from 'date-fns';

interface EventsWidgetProps {
  onAddEvent: () => void;
  onEditEvent: (event: Event) => void;
  onOpenEventDetail: (event: Event) => void;
  onDeleteEvent: (event: Event) => void;
  highlightedEventId: string | null;
  widgetRef: React.RefObject<HTMLDivElement | null>;
  eventHighlightActive: boolean;
}

export default function EventsWidget({
  onAddEvent,
  onEditEvent,
  onOpenEventDetail,
  onDeleteEvent,
  highlightedEventId,
  widgetRef,
  eventHighlightActive,
}: EventsWidgetProps) {
  const { t, language } = useTypedTranslation();
  const events = useEventsStore((state) => state.events);
  const toggleEventNotification = useEventsStore((state) => state.toggleNotification);

  const tOr = (key: TranslationKey | string, fallback: string) => {
    const value = t(key as TranslationKey);
    return value === key ? fallback : value;
  };

  // Sort events: upcoming events first (by date ascending), then overdue events (by date descending)
  // This ensures upcoming events are shown prominently, matching the Home page widget behavior
  const sortedEvents = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);

    const getEventDate = (event: Event): Date => {
      if (event.startAt) {
        return event.startAt instanceof Date ? event.startAt : new Date(event.startAt);
      }
      if (event.date) {
        return event.date instanceof Date ? event.date : new Date(event.date);
      }
      return new Date();
    };

    return [...events].sort((a, b) => {
      const dateA = getEventDate(a);
      const dateB = getEventDate(b);
      const aIsOverdue = startOfDay(dateA) < today;
      const bIsOverdue = startOfDay(dateB) < today;

      // Upcoming events come first
      if (!aIsOverdue && bIsOverdue) return -1;
      if (aIsOverdue && !bIsOverdue) return 1;

      // Within same group, sort by date
      // Upcoming: ascending (nearest first)
      // Overdue: descending (most recent first)
      if (!aIsOverdue && !bIsOverdue) {
        return dateA.getTime() - dateB.getTime();
      }
      return dateB.getTime() - dateA.getTime();
    });
  }, [events]);

  const formatMonthDayTime = (date: Date) =>
    formatLocalizedDate(date, language, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <MagicCard
      isLiquidEnhanced
      className={
        eventHighlightActive
          ? 'ring-2 ring-mq-primary ring-offset-2 ring-offset-mq-background transition-all duration-300 animate-pulse'
          : 'transition-all duration-300'
      }
    >
      <div
        className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border"
        ref={widgetRef}
      >
        <Card
          variant="glass"
          className="border border-mq-border shadow-none calendar-glass-solid bg-mq-card-background"
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-mq-content">
                <PartyPopper className="h-4 w-4 text-mq-content" />
                {t('events')}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="neutral" className="text-[10px] h-5 px-1.5">
                  {events.length}{' '}
                  {events.length === 1 ? tOr('event', 'event') : tOr('eventsLabel', 'events')}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={onAddEvent}
                  aria-label={t('addEvent')}
                >
                  <Plus className="h-4 w-4 text-mq-content" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 pr-1">
              {events.length === 0 ? (
                <div className="text-center py-6 text-mq-content-tertiary">
                  <p className="text-xs">{t('noEventsYet' as TranslationKey)}</p>
                </div>
              ) : (
                sortedEvents.slice(0, 5).map((event) => {
                  // Get category color
                  const categoryColors: Record<string, string> = {
                    Career: '#3B82F6',
                    Social: '#8B5CF6',
                    Academic: '#10B981',
                    'Free Food': '#F59E0B',
                  };
                  const eventColor = event.color || categoryColors[event.category] || '#A6192E';

                  // Events from public feed (have sourcePublicEventId) can be deleted but not edited
                  const isFromPublicFeed = Boolean(event.sourcePublicEventId);
                  const isHighlighted = eventHighlightActive && highlightedEventId === event.id;

                  // Check if event is overdue (past its start time)
                  const eventStartDate = event.startAt
                    ? event.startAt instanceof Date
                      ? event.startAt
                      : new Date(event.startAt)
                    : null;
                  const isOverdue = eventStartDate ? isPast(eventStartDate) : false;

                  return (
                    <div
                      key={event.id}
                      className={cn(
                        'group flex items-center gap-3 p-2.5 rounded-md border-l-4 border border-mq-border bg-mq-background-secondary transition-all cursor-pointer hover:bg-mq-surface hover:shadow-sm',
                        isOverdue && 'opacity-70 bg-red-500/5',
                        isHighlighted && 'ring-2 ring-mq-primary ring-offset-1 animate-pulse',
                      )}
                      style={{
                        borderLeftColor: eventColor,
                        borderLeftWidth: '4px',
                      }}
                      onClick={() => onOpenEventDetail(event)}
                      onKeyDown={(e) => handleKeyDown(e, () => onOpenEventDetail(event))}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4
                            className={cn(
                              'font-medium text-sm truncate',
                              isOverdue && 'line-through decoration-mq-content-tertiary',
                            )}
                          >
                            {event.title}
                          </h4>
                          {isOverdue && (
                            <Badge
                              variant="brand"
                              className="text-[9px] px-1 py-0 h-4 uppercase bg-red-500"
                            >
                              {tOr('overdue', 'Overdue')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-mq-content-secondary truncate">
                          {event.startAt
                            ? formatMonthDayTime(
                                event.startAt instanceof Date
                                  ? event.startAt
                                  : new Date(event.startAt),
                              )
                            : event.time}{' '}
                          • {event.location}
                        </p>
                      </div>
                      <ItemActionButtons
                        itemType="event"
                        itemId={event.id}
                        itemTitle={event.title}
                        building={event.building}
                        room={event.room}
                        dateTime={event.startAt || event.date}
                        notificationEnabled={event.notificationEnabled}
                        onEdit={isFromPublicFeed ? undefined : () => onEditEvent(event)}
                        onDelete={() => onDeleteEvent(event)}
                        onToggleNotification={() => toggleEventNotification(event.id)}
                        variant="compact"
                        stopPropagation
                        className="action-buttons-auto"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MagicCard>
  );
}
