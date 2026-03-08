'use client';

import React, { useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useTodosStore } from '@/lib/store/todosStore';
import { PRIORITY_COLORS } from '@/lib/constants';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Badge } from '@/components/ui/mq/badge';
import { CheckSquare, ExternalLink, CheckCircle2, Circle, Clock, Eye } from 'lucide-react';
import { format, isValid, isPast } from 'date-fns';
import { enAU, es, faIR } from 'date-fns/locale';
import Link from 'next/link';
import { useHydration } from '@/lib/hooks';
import { Button } from '@/components/ui/mq/button';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { CardSolid } from '@/features/home/components/HomeCard';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

const TodosWidget = memo(() => {
  const isHydrated = useHydration();
  const router = useRouter();
  const todos = useTodosStore((state) => state.todos);
  const toggleComplete = useTodosStore((state) => state.toggleComplete);
  const { t, language } = useTypedTranslation();

  const currentLocale = useMemo(() => {
    switch (language) {
      case 'es':
        return es;
      case 'fa':
        return faIR;
      default:
        return enAU;
    }
  }, [language]);

  // Get ALL pending todos sorted by due date and priority
  const pendingTodos = useMemo(() => {
    const now = dayjs();
    return todos
      .filter((todo) => !todo.completed)
      .sort((a, b) => {
        // Sort overdue items first
        const aDue = a.dueDate ? dayjs(a.dueDate) : null;
        const bDue = b.dueDate ? dayjs(b.dueDate) : null;
        const aOverdue = aDue && aDue.isBefore(now);
        const bOverdue = bDue && bDue.isBefore(now);

        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        // Then sort by due date
        if (aDue && !bDue) return -1;
        if (!aDue && bDue) return 1;
        if (aDue && bDue) {
          const dateDiff = aDue.valueOf() - bDue.valueOf();
          if (dateDiff !== 0) return dateDiff;
        }

        // Then sort by priority
        const priorityOrder = { High: 0, Medium: 1, Low: 2 };
        const pA = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
        const pB = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;
        return pA - pB;
      });
  }, [todos]);

  const totalPending = todos.filter((t) => !t.completed).length;

  const formatDueDate = (date: Date) => {
    const d = new Date(date);
    if (!isValid(d)) return '';
    return format(d, 'EEE, MMM d • h:mm a', { locale: currentLocale });
  };

  return (
    <CardSolid className="h-full flex flex-col">
      <CardHeader
        className="flex flex-row items-center justify-between"
        style={{
          color: 'var(--mq-content)',
          WebkitTextFillColor: 'var(--mq-content)',
        }}
      >
        <div className="flex items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            {t('todos')}
          </CardTitle>
          {isHydrated && totalPending > 0 && (
            <Badge
              variant="neutral"
              className="bg-mq-background-secondary text-mq-content-secondary text-[10px]"
            >
              {totalPending} {t('pending')}
            </Badge>
          )}
          {/* View Only Badge */}
          {isHydrated && todos.length > 0 && (
            <Badge
              variant="neutral"
              className="ml-1 bg-mq-background-secondary text-mq-content-tertiary text-[10px] px-2 py-0.5 flex items-center gap-1"
            >
              <Eye className="h-3 w-3" aria-hidden="true" />
              {t('viewOnly')}
            </Badge>
          )}
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" asChild>
          <Link
            href="/calendar?section=todos&highlight=true"
            aria-label={`${t('viewAll')} ${t('todos')}`}
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('viewAll')}</span>
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 flex-1">
        {!isHydrated ? (
          <div className="h-48 flex items-center justify-center">
            <p
              className="text-lg text-mq-content alabaster-readable"
              style={{
                color: 'var(--mq-content)',
                WebkitTextFillColor: 'var(--mq-content)',
                opacity: 1,
                mixBlendMode: 'normal',
              }}
            >
              {t('loading')}
            </p>
          </div>
        ) : pendingTodos.length === 0 ? (
          <div
            className="text-center py-8 alabaster-readable"
            style={{
              color: 'var(--mq-content)',
              WebkitTextFillColor: 'var(--mq-content)',
              opacity: 1,
              mixBlendMode: 'normal',
            }}
          >
            <CheckSquare
              className="h-12 w-12 text-mq-content-tertiary mx-auto mb-4"
              aria-hidden="true"
            />
            <p className="text-mq-content-tertiary">{t('noTodos')}</p>
            <p className="text-mq-content-tertiary text-sm mt-1">{t('addTodosInCalendar')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingTodos.map((todo) => {
              const dueDate = todo.dueDate ? new Date(todo.dueDate) : null;
              const isOverdue = dueDate && isPast(dueDate);
              const todoDateStr =
                dueDate && isValid(dueDate)
                  ? format(dueDate, 'yyyy-MM-dd')
                  : format(new Date(), 'yyyy-MM-dd');

              return (
                <div
                  key={todo.id}
                  className={cn(
                    'group relative flex items-start gap-3 p-3 rounded-lg border transition-all duration-300 hover:translate-x-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-mq-primary/50 focus:ring-offset-2 focus:ring-offset-mq-card-background focus:bg-mq-primary/10 focus:border-mq-primary/40 focus:shadow-sm',
                    isOverdue
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                      : 'bg-mq-background-secondary border-transparent hover:border-mq-primary/20 hover:bg-mq-hover-background',
                  )}
                  onClick={() =>
                    router.push(`/calendar?date=${todoDateStr}&highlightTodo=${todo.id}`)
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/calendar?date=${todoDateStr}&highlightTodo=${todo.id}`);
                    }
                  }}
                >
                  {/* Color indicator - use custom color if set, otherwise priority-based */}
                  <div
                    className="w-1.5 self-stretch rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        todo.color ||
                        (todo.priority === 'High'
                          ? '#ef4444'
                          : todo.priority === 'Medium'
                            ? '#f59e0b'
                            : '#22c55e'),
                    }}
                  />

                  {/* Todo info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleComplete(todo.id);
                          }}
                          className="shrink-0 p-1.5 -m-1.5 hover:bg-mq-hover-background rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-mq-primary/50"
                          aria-label={todo.completed ? t('markIncomplete') : t('markComplete')}
                        >
                          {todo.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-mq-content-tertiary hover:text-mq-primary" />
                          )}
                        </button>
                        <h4
                          className={cn(
                            'text-mq-sm font-medium text-mq-content truncate',
                            todo.completed && 'line-through text-mq-content-tertiary',
                            isOverdue && !todo.completed && 'line-through text-mq-content-tertiary',
                          )}
                          title={todo.title}
                        >
                          {todo.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isOverdue && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/40 px-1.5 py-0.5 rounded">
                            {t('overdueLabel')}
                          </span>
                        )}
                        <Badge
                          className={cn(
                            PRIORITY_COLORS[todo.priority],
                            'text-[10px] px-1.5 py-0.5 font-medium shrink-0',
                          )}
                          variant="neutral"
                        >
                          {t(`priority_${todo.priority}` as TranslationKey)}
                        </Badge>
                      </div>
                    </div>
                    {dueDate && (
                      <div className="flex items-center gap-1 text-sm text-mq-content-secondary">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                          {isOverdue && `${t('overdue')} • `}
                          {formatDueDate(dueDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </CardSolid>
  );
});

TodosWidget.displayName = 'TodosWidget';

export default TodosWidget;
