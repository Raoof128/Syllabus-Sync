'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, CalendarDays, Edit2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { Button } from '@/components/ui/mq/button';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import DeadlineForm from '@/components/deadlines/DeadlineForm';
import { Deadline } from '@/lib/types';
import { useHydration } from '@/lib/hooks';
import { PRIORITY_COLORS } from '@/lib/constants';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { MagicCard } from '@/components/ui/MagicCard';

export default function CalendarClient() {
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const toggleComplete = useDeadlinesStore((state) => state.toggleComplete);

  const hasHydrated = useHydration();
  const { t, language } = useTranslation();

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

  const handleAddDeadline = () => {
    setEditDeadline(null);
    setDialogOpen(true);
  };

  // Get locale string for date formatting
  const getLocaleString = () => {
    const localeMap: Record<string, string> = {
      en: 'en-AU',
      es: 'es-ES',
      fa: 'fa-IR',
      zh: 'zh-CN',
      ar: 'ar-SA',
      hi: 'hi-IN',
      ko: 'ko-KR',
      ja: 'ja-JP',
    };
    return localeMap[language] || 'en-AU';
  };

  // Sort deadlines by due date
  const sortedDeadlines = [...deadlines].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl calendar-page">
      <ScrollReveal>
        <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-mq-3xl font-bold text-mq-content mb-2">{t('calendar')}</h1>
            <p className="text-mq-content-secondary">{t('trackDeadlinesDesc')}</p>
          </div>
          <Button onClick={handleAddDeadline} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('addDeadline')}
          </Button>
        </header>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <MagicCard isLiquidEnhanced>
          <div className="mq-magic-card-content p-0">
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" aria-hidden="true" />
                    {t('upcomingDeadlines')}
                  </span>
                  {hasHydrated && deadlines.length > 0 && (
                    <Badge variant="neutral">
                      {deadlines.filter((d) => !d.completed).length} {t('pending')}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!hasHydrated ? (
                  <div className="h-32 flex items-center justify-center">
                    <div className="animate-pulse space-y-3 w-full max-w-md">
                      <div className="h-4 bg-mq-background-tertiary rounded w-3/4 mx-auto" />
                      <div className="h-4 bg-mq-background-tertiary rounded w-1/2 mx-auto" />
                    </div>
                  </div>
                ) : deadlines.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarDays className="h-12 w-12 text-mq-content-tertiary mx-auto mb-4" />
                    <h3 className="text-mq-lg font-semibold text-mq-content mb-2">
                      {t('noDeadlinesYet')}
                    </h3>
                    <p className="text-mq-content-secondary mb-4 max-w-md mx-auto">
                      {t('addDeadlinesDesc')}
                    </p>
                    <Button onClick={handleAddDeadline} className="gap-2">
                      <Plus className="h-4 w-4" />
                      {t('addYourFirstDeadline')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3" role="list" aria-label={t('upcomingDeadlines')}>
                    {sortedDeadlines.map((deadline) => {
                      const due = new Date(deadline.dueDate);
                      const isOverdue = !deadline.completed && due < new Date();
                      const time = due.toLocaleTimeString(getLocaleString(), {
                        hour: 'numeric',
                        minute: '2-digit',
                      });

                      return (
                        <article
                          key={deadline.id}
                          role="listitem"
                          className={`flex items-center justify-between p-3 sm:p-4 bg-mq-background-secondary/50 backdrop-blur-sm rounded-mq-lg border transition-all duration-mq-fast ${
                            deadline.completed
                              ? 'border-mq-border opacity-60'
                              : isOverdue
                                ? 'border-mq-error/50 bg-mq-error/5 hover:shadow-[0_0_15px_rgba(166,25,46,0.15)]'
                                : 'border-mq-border hover:border-mq-primary/20 hover:shadow-[0_0_15px_rgba(166,25,46,0.1)]'
                          }`}
                          aria-label={`${deadline.title} - ${deadline.completed ? t('completed') : isOverdue ? t('overdue') : t('due')} ${due.toLocaleDateString(getLocaleString())}`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <button
                              onClick={() => toggleComplete(deadline.id)}
                              aria-label={
                                deadline.completed ? t('markIncomplete') : t('markComplete')
                              }
                              className="flex-shrink-0 text-mq-content-secondary hover:text-mq-content transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 rounded-full p-0.5"
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
                            <div className="min-w-0 flex-1">
                              <h4
                                className={`font-medium truncate ${deadline.completed ? 'line-through text-mq-content-secondary' : 'text-mq-content'}`}
                              >
                                {deadline.title}
                              </h4>
                              <p className="text-mq-sm text-mq-content-secondary truncate">
                                {deadline.unitCode} • {t('due')}{' '}
                                {due.toLocaleDateString(getLocaleString(), {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}{' '}
                                {t('at')} {time}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
                            <button
                              title={`${t('edit')} ${deadline.title}`}
                              aria-label={`${t('edit')} ${deadline.title}`}
                              onClick={() => openEdit(deadline)}
                              className="text-mq-content-secondary hover:text-mq-content transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 rounded-mq p-1.5 hover:bg-mq-hover-background"
                            >
                              <Edit2 className="h-4 w-4" aria-hidden="true" />
                            </button>

                            <Badge
                              className={`${PRIORITY_COLORS[deadline.priority]} hidden sm:inline-flex`}
                            >
                              {deadline.priority}
                            </Badge>
                            <Badge className={`${PRIORITY_COLORS[deadline.priority]} sm:hidden`}>
                              {deadline.priority.charAt(0).toUpperCase()}
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
        </MagicCard>
      </ScrollReveal>

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
