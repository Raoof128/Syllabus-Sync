// components/home/EventsFeed.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock } from 'lucide-react';
import { sampleEvents } from '@/data/sampleEvents';
import { isToday } from 'date-fns';
import Link from 'next/link';

const categoryColors: Record<string, string> = {
  Career: 'bg-blue-100 text-blue-800',
  Social: 'bg-purple-100 text-purple-800',
  Academic: 'bg-green-100 text-green-800',
  'Free Food': 'bg-orange-100 text-orange-800',
};

export default function EventsFeed() {
  // Filter to show only today's events
  const todayEvents = sampleEvents.filter((event) => isToday(new Date(event.date)));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Events Today</CardTitle>
        <Link href="/feed" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
          View all events →
        </Link>
      </CardHeader>
      <CardContent>
        {todayEvents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No events scheduled for today</p>
        ) : (
          <div className="space-y-3">
            {todayEvents.map((event) => (
              <div
                key={event.id}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">{event.title}</h3>
                  <Badge className={categoryColors[event.category]}>{event.category}</Badge>
                </div>

                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {event.time}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
