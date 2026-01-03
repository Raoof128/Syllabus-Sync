'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Filter,
  Clock,
  Bell,
  Grid3x3,
  List,
  Plus,
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { Button } from '@/components/ui/mq/button';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import DeadlineForm from '@/components/deadlines/DeadlineForm';
import { Deadline } from '@/lib/types';
import { useHydration } from '@/lib/hooks';
import { PRIORITY_COLORS } from '@/lib/constants';

export default function CalendarClient() {
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const toggleComplete = useDeadlinesStore((state) => state.toggleComplete);
  const getStressLevel = useDeadlinesStore((state) => state.getStressLevel);
  const units = useUnitsStore((state) => state.units);
  const hasHydrated = useHydration();

  // For now, just show a simple calendar view
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-mq-3xl font-bold text-mq-content mb-2">Calendar</h1>
        <p className="text-mq-content-secondary">
          Track upcoming deadlines and manage assignment dates.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Upcoming Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasHydrated && deadlines.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays className="h-12 w-12 text-mq-content-tertiary mx-auto mb-4" />
              <h3 className="text-mq-lg font-semibold text-mq-content mb-2">No deadlines yet</h3>
              <p className="text-mq-content-secondary mb-4">
                Add deadlines to see them organized in your calendar view.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {deadlines.slice(0, 5).map((deadline) => (
                <div key={deadline.id} className="flex items-center justify-between p-3 bg-mq-background-secondary rounded-mq border border-mq-border">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleComplete(deadline.id)}
                      className="text-mq-content-secondary hover:text-mq-content transition-colors"
                    >
                      {deadline.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-mq-success" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    <div>
                      <h4 className={`font-medium ${deadline.completed ? 'line-through text-mq-content-secondary' : 'text-mq-content'}`}>
                        {deadline.title}
                      </h4>
                      <p className="text-mq-sm text-mq-content-secondary">
                        {deadline.unitCode} • Due {new Date(deadline.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={PRIORITY_COLORS[deadline.priority]}>
                    {deadline.priority}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
