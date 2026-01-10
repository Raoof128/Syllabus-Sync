// components/home/EventsFeed.tsx
'use client';

import React, { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { MapPin, Clock, Plus } from 'lucide-react';
import { sampleEvents } from '@/data/sampleEvents';
import { useEventsStore } from '@/lib/store/eventsStore';
import { isToday } from 'date-fns';
import { Button } from '@/components/ui/mq/button';
import { useTranslation } from '@/lib/hooks/useTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { MagicCard } from '@/components/ui/MagicCard';
import { Event } from '@/lib/types';
import dynamic from 'next/dynamic';

// Dynamically import EventForm for code splitting
const EventForm = dynamic(() => import('@/components/events/EventForm'), {
  loading: () => null,
});

const categoryColors: Record<string, string> = {
  Career: 'bg-mq-info/10 text-mq-info border border-mq-info/20',
  Social: 'bg-mq-purple/10 text-mq-purple border border-mq-purple/20',
  Academic: 'bg-mq-success/10 text-mq-success border border-mq-success/20',
  'Free Food': 'bg-mq-warning/10 text-mq-warning border border-mq-warning/20',
};

const EventsFeed = memo(() => {
  const { t } = useTranslation();
  const userEvents = useEventsStore((state) => state.events);
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Combine sample events with user events and filter to today
  const allEvents = [...sampleEvents, ...userEvents];
  const todayEvents = allEvents.filter((event) => isToday(new Date(event.date)));

  const handleAddEvent = () => {
    setEditingEvent(null);
    setEventFormOpen(true);
  };

  const handleEventClick = (event: Event) => {
    // Only allow editing user-created events (not sample events)
    if (userEvents.find((e) => e.id === event.id)) {
      setEditingEvent(event);
      setEventFormOpen(true);
    }
  };

  return (
    <>
      <MagicCard isLiquidEnhanced>
        <div className="mq-magic-card-content">
          <Card className="h-full border-0 shadow-none bg-transparent">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('eventsToday')}</CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={handleAddEvent}
                aria-label={t('addEvent')}
              >
                <Plus className="h-4 w-4" />
                {t('addEvent')}
              </Button>
            </CardHeader>
            <CardContent>
              {todayEvents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-mq-content-tertiary mb-4">{t('noEventsToday')}</p>
                  <Button onClick={handleAddEvent} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    {t('addYourFirstEvent')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayEvents.map((event) => {
                    const isUserEvent = userEvents.find((e) => e.id === event.id);

                    const eventContent = (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-mq-content">
                            {t((event.translationKey || event.title) as TranslationKey)}
                          </h3>
                          <Badge className={`${categoryColors[event.category]} alabaster-readable`}>
                            {t(`category_${event.category.replace(/ /g, '')}` as TranslationKey)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-mq-content-secondary">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {event.time}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                        </div>
                      </>
                    );

                    const baseClassName = "group block p-3 bg-mq-background-secondary rounded-lg border border-transparent hover:border-mq-primary/20 hover:bg-mq-hover-background transition-all duration-300 hover:translate-x-1 hover:shadow-[0_0_15px_rgba(166,25,46,0.1)]";

                    // For user events, render as a button for proper accessibility
                    if (isUserEvent) {
                      return (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => handleEventClick(event)}
                          className={`${baseClassName} cursor-pointer text-left w-full`}
                          aria-label={`Edit event: ${event.title}`}
                        >
                          {eventContent}
                        </button>
                      );
                    }

                    // For sample events, render as a non-interactive div
                    return (
                      <div key={event.id} className={baseClassName}>
                        {eventContent}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MagicCard>

      {/* Event Form Dialog */}
      <EventForm
        open={eventFormOpen}
        onOpenChange={setEventFormOpen}
        editEvent={editingEvent}
      />
    </>
  );
});

EventsFeed.displayName = 'EventsFeed';

export default EventsFeed;
