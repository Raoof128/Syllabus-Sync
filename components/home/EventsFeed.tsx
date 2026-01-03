// components/home/EventsFeed.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { MapPin, Clock, Navigation } from 'lucide-react';
import { sampleEvents } from '@/data/sampleEvents';
import { isToday } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/mq/button';

const categoryColors: Record<string, string> = {
  Career: 'bg-mq-info/10 text-mq-info border border-mq-info/20',
  Social: 'bg-mq-purple/10 text-mq-purple border border-mq-purple/20',
  Academic: 'bg-mq-success/10 text-mq-success border border-mq-success/20',
  'Free Food': 'bg-mq-warning/10 text-mq-warning border border-mq-warning/20',
};

export default function EventsFeed() {
  // Filter to show only today's events
  const todayEvents = sampleEvents.filter((event) => isToday(new Date(event.date)));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Events Today</CardTitle>
        <Link href="/feed" className="text-sm text-mq-info hover:text-mq-info/80 hover:underline">
          View all events →
        </Link>
      </CardHeader>
      <CardContent>
        {todayEvents.length === 0 ? (
          <p className="text-mq-content-tertiary text-center py-8">No events scheduled for today</p>
        ) : (
          <div className="space-y-3">
            {todayEvents.map((event) => (
              <div
                key={event.id}
                className="p-3 bg-mq-background-secondary rounded-lg hover:bg-mq-hover-background transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-mq-content">{event.title}</h3>
                  <Badge className={categoryColors[event.category]}>{event.category}</Badge>
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

                {/* Navigation to Map */}
                {event.building && (
                  <div className="mt-2">
                    <Button asChild variant="secondary" size="sm" className="gap-1 text-xs h-7">
                      <Link href={`/map?building=${event.building}`}>
                        <Navigation className="h-3 w-3" />
                        Navigate to {event.building}
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
