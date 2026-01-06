'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, CalendarDays, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
// import { Button } from '@/components/ui/mq/button';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import DeadlineForm from '@/components/deadlines/DeadlineForm';
import { Deadline } from '@/lib/types';
import { useHydration } from '@/lib/hooks';
import { PRIORITY_COLORS } from '@/lib/constants';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function CalendarClient() {
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const toggleComplete = useDeadlinesStore((state) => state.toggleComplete);

  const hasHydrated = useHydration();
  const { t } = useTranslation();

  // Dialog state for editing deadlines
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDeadline, setEditDeadline] = useState<Deadline | null>(null);

  const openEdit = (d: Deadline) => {
    setEditDeadline(d);
    setDialogOpen(true);
  };

  const closeEdit = () => {
    setDialogOpen(false);
    setEditDeadline(null);
  };

  // For now, just show a simple calendar view
  return (
    <div className="container mx-auto p-6 max-w-7xl calendar-page">
      <div className="mb-8">
        <h1 className="text-mq-3xl font-bold text-mq-content mb-2">{t('calendar')}</h1>
        <p className="text-mq-content-secondary">{t('trackDeadlinesDesc')}</p>
      </div>

      <div className="mq-magic-card">
        <div className="mq-magic-card-content p-0">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                {t('upcomingDeadlines')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasHydrated && deadlines.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarDays className="h-12 w-12 text-mq-content-tertiary mx-auto mb-4" />
                  <h3 className="text-mq-lg font-semibold text-mq-content mb-2">
                    {t('noDeadlinesYet')}
                  </h3>
                  <p className="text-mq-content-secondary mb-4">{t('addDeadlinesDesc')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deadlines.slice(0, 5).map((deadline) => {
                    const due = new Date(deadline.dueDate);
                    const time = due.toLocaleTimeString(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                    });

                    return (
                      <article
                        key={deadline.id}
                        className="flex items-center justify-between p-3 bg-mq-background-secondary rounded-mq border border-mq-border"
                        aria-label={`${deadline.title} deadline - ${deadline.completed ? t('completed') : t('due')} ${due.toLocaleDateString()}`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleComplete(deadline.id)}
                            aria-label={
                              deadline.completed ? t('markIncomplete') : t('markComplete')
                            }
                            className="text-mq-content-secondary hover:text-mq-content transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 rounded-full"
                          >
                            {deadline.completed ? (
                              <CheckCircle2
                                className="h-5 w-5 text-mq-success"
                                aria-hidden="true"
                              />
                            ) : (
                              <Circle className="h-5 w-5" aria-hidden="true" />
                            )}
                          </button>
                          <div>
                            <h4
                              className={`font-medium ${deadline.completed ? 'line-through text-mq-content-secondary' : 'text-mq-content'}`}
                            >
                              {deadline.title}
                            </h4>
                            <p className="text-mq-sm text-mq-content-secondary">
                              {deadline.unitCode} • {t('due')} {due.toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Edit button */}
                          <button
                            title={`${deadline.title} (${time})`}
                            aria-label={`${t('openEditDialog')} ${deadline.title}`}
                            onClick={() => openEdit(deadline)}
                            className="text-mq-content-secondary hover:text-mq-content transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 rounded-mq p-1"
                          >
                            <Edit2 className="h-4 w-4" aria-hidden="true" />
                          </button>

                          <Badge className={PRIORITY_COLORS[deadline.priority]}>
                            {deadline.priority}
                          </Badge>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <DeadlineForm
        open={dialogOpen}
        onOpenChange={(v) => {
          if (v) setDialogOpen(true);
          else closeEdit();
        }}
        editDeadline={editDeadline}
      />
    </div>
  );
}
