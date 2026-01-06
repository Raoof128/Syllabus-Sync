// components/home/EventsFeed.tsx
'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { MapPin, Clock, Plus } from 'lucide-react';
import { sampleEvents } from '@/data/sampleEvents';
import { isToday } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/mq/button';
import { useTranslation } from '@/lib/hooks/useTranslation';

const categoryColors: Record<string, string> = {
  Career: 'bg-mq-info/10 text-mq-info border border-mq-info/20',
  Social: 'bg-mq-purple/10 text-mq-purple border border-mq-purple/20',
  Academic: 'bg-mq-success/10 text-mq-success border border-mq-success/20',
  'Free Food': 'bg-mq-warning/10 text-mq-warning border border-mq-warning/20',
};

const EventsFeed = memo(() => {
  const { t } = useTranslation();
  // Filter to show only today's events
  const todayEvents = sampleEvents.filter((event) => isToday(new Date(event.date)));

  return (
    <div className="mq-magic-card">
      <div className="mq-magic-card-content">
        <Card className="h-full border-0 shadow-none bg-transparent">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('eventsToday')}</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => {
                try {
                  window.dispatchEvent(new CustomEvent('add-event'));
                } catch (error) {
                  console.warn('Failed to trigger add event:', error);
                }
              }}
              aria-label={t('addEvent' as 'addDeadline')}
            >
              <Plus className="h-4 w-4" />
              {t('addEvent' as 'addDeadline')}
            </Button>
          </CardHeader>
          <CardContent>
            {todayEvents.length === 0 ? (
              <p className="text-mq-content-tertiary text-center py-8">{t('noEventsToday')}</p>
            ) : (
              <div className="space-y-3">
                {todayEvents.map((event) => (
                  <Link
                    key={event.id}
                    href="/feed"
                    className="group block p-3 bg-mq-background-secondary rounded-lg border border-mq-border hover:bg-mq-hover-background transition-all duration-300 hover:translate-x-1 hover:shadow-mq-sm alabaster-readable focus:outline-none focus:ring-2 focus:ring-mq-primary/50"
                    style={{
                      color: 'var(--mq-content)',
                      WebkitTextFillColor: 'var(--mq-content)',
                      opacity: 1,
                      mixBlendMode: 'normal',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-mq-content">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {t((event.translationKey || event.title) as any)}
                      </h3>
                      <Badge className={`${categoryColors[event.category]} alabaster-readable`}>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {t(
                          typeof event.category === 'string'
                            ? (`category_${event.category.replace(/ /g, '')}` as any)
                            : event.category,
                        )}
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
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

EventsFeed.displayName = 'EventsFeed';

export default EventsFeed;
