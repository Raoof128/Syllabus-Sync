// components/home/NextDeadline.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const priorityColors = {
  Low: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-orange-100 text-orange-800',
  Urgent: 'bg-red-100 text-red-800',
};

export default function NextDeadline() {
  const getUpcoming = useDeadlinesStore((state) => state.getUpcoming);
  const [nextDeadline, setNextDeadline] = useState<ReturnType<typeof getUpcoming>[0] | null>(null);
  const [isClient, setIsClient] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setIsClient(true);
    const upcomingDeadlines = getUpcoming(1);
    setNextDeadline(upcomingDeadlines[0] || null);
  }, [getUpcoming]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <Card>
      <CardHeader>
        <CardTitle>Next Deadline</CardTitle>
      </CardHeader>
      <CardContent>
        {!isClient ? (
          <div className="h-32 flex items-center justify-center">
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : !nextDeadline ? (
          <p className="text-gray-500 text-center py-8">No upcoming deadlines 🎯</p>
        ) : (
          <div className="space-y-3">
            {/* Deadline info */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900">
                  {nextDeadline.unitCode} — {nextDeadline.title}
                </h3>
                <Badge className={priorityColors[nextDeadline.priority]}>
                  {nextDeadline.priority}
                </Badge>
              </div>

              <p className="text-sm text-gray-600 mt-1">
                Due {format(new Date(nextDeadline.dueDate), 'MMM dd, h:mm a')}
              </p>
            </div>

            {/* Time warning */}
            <div className="flex items-center gap-2 text-sm">
              {nextDeadline.priority === 'Urgent' ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <Clock className="h-4 w-4 text-gray-400" />
              )}
              <span
                className={
                  nextDeadline.priority === 'Urgent' ? 'text-red-600 font-medium' : 'text-gray-600'
                }
              >
                {formatDistanceToNow(new Date(nextDeadline.dueDate), { addSuffix: true })}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
