// components/home/NextDeadline.tsx
'use client';

import React, { useMemo } from 'react';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, format, isValid } from 'date-fns';
import Link from 'next/link';
import { useHydration } from '@/lib/hooks';
import { Button } from '@/components/ui/mq/button';

const priorityColors: Record<'Low' | 'Medium' | 'High' | 'Urgent', string> = {
  Low: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-orange-100 text-orange-800',
  Urgent: 'bg-red-100 text-red-800',
};

export default function NextDeadline() {
  const isHydrated = useHydration();
  const deadlines = useDeadlinesStore((state) => state.deadlines);
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Next Deadline</CardTitle>
        <Link
          href="/calendar"
          className="text-sm text-blue-900 hover:text-blue-950 hover:underline"
        >
          View all →
        </Link>
      </CardHeader>
      <CardContent>
        {!isHydrated ? (
          <div className="h-32 flex items-center justify-center">
            <p className="text-mq-content">Loading...</p>
          </div>
        ) : !nextDeadline ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-mq-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-mq-content mb-2">No upcoming deadlines</h3>
            <p className="text-mq-content mb-4">
              All caught up! Add your first deadline to stay on top of your work.
            </p>
             <Button asChild>
               <Link href="/calendar" className="gap-2">
                 <Clock className="h-4 w-4" />
                 Add Deadline
               </Link>
             </Button>
          </div>
        ) : (
          <Link
            href={calendarDate ? `/calendar?date=${calendarDate}` : '/calendar'}
            className="block"
          >
            <div className="space-y-3 p-3 -m-3 rounded-lg hover:bg-mq-hover-background transition-colors">
              {/* Deadline info */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-mq-content">
                    {nextDeadline.unitCode} — {nextDeadline.title}
                  </h3>
                  <Badge className={priorityColors[nextDeadline.priority]}>
                    {nextDeadline.priority}
                  </Badge>
                </div>

                <p className="text-sm text-mq-content-secondary mt-1">
                  Due {hasValidDate ? format(dueDate as Date, 'MMM dd, h:mm a') : 'Invalid date'}
                </p>
              </div>

              {/* Time warning */}
              <div className="flex items-center gap-2 text-sm">
                {nextDeadline.priority === 'Urgent' ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <Clock className="h-4 w-4 text-mq-slate-400" />
                )}
                <span
                  className={
                    nextDeadline.priority === 'Urgent'
                      ? 'text-red-800 font-medium'
                      : 'text-mq-content-secondary'
                  }
                >
                  {hasValidDate ? formatDistanceToNow(dueDate as Date, { addSuffix: true }) : ''}
                </span>
              </div>
            </div>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
