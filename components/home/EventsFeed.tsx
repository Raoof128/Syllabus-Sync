// components/home/EventsFeed.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock } from 'lucide-react';
import { sampleEvents } from '@/data/sampleEvents';

const categoryColors = {
  Career: 'bg-blue-100 text-blue-800',
  Social: 'bg-purple-100 text-purple-800',
  Academic: 'bg-green-100 text-green-800',
  'Free Food': 'bg-orange-100 text-orange-800',
};

export default function EventsFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Events Today</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sampleEvents.map((event) => (
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
      </CardContent>
    </Card>
  );
}
