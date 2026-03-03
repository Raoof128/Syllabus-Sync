'use client';

import React from 'react';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { Plus, ListTodo, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/mq/button';
import { Badge } from '@/components/ui/mq/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { MagicCard } from '@/components/ui/MagicCard';
import { cn } from '@/lib/utils';
import { useTodosStore } from '@/lib/store/todosStore';
import { PRIORITY_COLORS } from '@/lib/constants';
import dayjs from 'dayjs';
import { Todo } from '@/lib/types';
import ItemActionButtons from '@/features/calendar/components/ItemActionButtons';
import { formatLocalizedDate } from '@/lib/utils/locale';

interface TodosWidgetProps {
  onAddTodo: () => void;
  onEditTodo: (todo: Todo) => void;
  onOpenTodoDetail: (todo: Todo) => void;
  onDeleteTodo: (todo: Todo) => void;
  highlightedTodoId: string | null;
  widgetRef: React.RefObject<HTMLDivElement | null>;
  todoHighlightActive: boolean;
}

export default function TodosWidget({
  onAddTodo,
  onEditTodo,
  onOpenTodoDetail,
  onDeleteTodo,
  highlightedTodoId,
  widgetRef,
  todoHighlightActive,
}: TodosWidgetProps) {
  const { t, language } = useTypedTranslation();
  const todos = useTodosStore((state) => state.todos);
  const toggleTodoComplete = useTodosStore((state) => state.toggleComplete);
  const toggleTodoNotification = useTodosStore((state) => state.toggleNotification);

  const formatMonthDayTime = (date: Date) =>
    formatLocalizedDate(date, language, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  // Sort pending todos: Overdue first, then High priority, then by due date
  const pendingTodos = todos
    .filter((t) => !t.completed)
    .sort((a, b) => {
      // 1. Overdue first
      const now = dayjs();
      const aDue = dayjs(a.dueDate);
      const bDue = dayjs(b.dueDate);
      const aOverdue = aDue.isBefore(now);
      const bOverdue = bDue.isBefore(now);

      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      // 2. Priority
      const priorityOrder: Record<string, number> = {
        High: 0,
        Medium: 1,
        Low: 2,
      };
      const pDiff = (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
      if (pDiff !== 0) return pDiff;

      // 3. Due Date (soonest first)
      return aDue.valueOf() - bDue.valueOf();
    });

  return (
    <MagicCard
      isLiquidEnhanced
      className={
        todoHighlightActive
          ? 'ring-2 ring-mq-primary ring-offset-2 ring-offset-mq-background transition-all duration-300 animate-pulse'
          : 'transition-all duration-300'
      }
    >
      <div
        className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border"
        ref={widgetRef}
      >
        <Card
          variant="glass"
          className="border border-mq-border shadow-none calendar-glass-solid bg-mq-card-background"
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-mq-content">
                <ListTodo className="h-4 w-4 text-mq-content" />
                {t('todos')}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="neutral" className="text-[10px] h-5 px-1.5">
                  {pendingTodos.length} {t('pending')}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={onAddTodo}
                  aria-label={t('addTodo')}
                >
                  <Plus className="h-4 w-4 text-mq-content" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {todos.length === 0 ? (
              <div className="text-center py-6 text-mq-content-tertiary">
                <p className="text-xs">{t('noTodosYet')}</p>
              </div>
            ) : (
              <div className="space-y-2 pr-1">
                {/* Show pending first, then completed */}
                {[...pendingTodos, ...todos.filter((t) => t.completed)].map((todo) => {
                  const due = dayjs(todo.dueDate);
                  const isOverdue = !todo.completed && due.isBefore(dayjs());
                  const isHighlighted = todoHighlightActive && highlightedTodoId === todo.id;

                  return (
                    <div
                      key={todo.id}
                      className={cn(
                        'group flex items-center gap-3 p-2.5 rounded-md border-l-4 border border-mq-border bg-mq-background-secondary transition-all cursor-pointer hover:bg-mq-surface hover:shadow-sm',
                        todo.completed && 'opacity-60 grayscale',
                        isOverdue && 'opacity-70 bg-red-500/5',
                        isHighlighted && 'ring-2 ring-mq-primary ring-offset-1 animate-pulse',
                      )}
                      style={{
                        borderLeftColor:
                          todo.priority === 'High'
                            ? '#ef4444'
                            : todo.priority === 'Medium'
                              ? '#f59e0b'
                              : '#3b82f6',
                        borderLeftWidth: '4px',
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        onOpenTodoDetail(todo);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, () => onOpenTodoDetail(todo))}
                      role="button"
                      tabIndex={0}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTodoComplete(todo.id);
                        }}
                        className={cn(
                          'text-mq-content-secondary hover:text-mq-primary transition-colors',
                          todo.completed ? 'text-green-600 dark:text-green-400' : '',
                        )}
                      >
                        {todo.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <Circle className="h-4 w-4 text-mq-content-secondary" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4
                            className={cn(
                              'font-medium text-sm truncate',
                              (todo.completed || isOverdue) &&
                                'line-through decoration-mq-content-tertiary',
                            )}
                          >
                            {todo.title}
                          </h4>
                          <Badge
                            className={cn(
                              PRIORITY_COLORS[todo.priority],
                              'ml-2 text-[10px] h-4 px-1',
                              isOverdue && 'opacity-70',
                            )}
                            variant="neutral"
                          >
                            {isOverdue
                              ? t('overdue' as TranslationKey)
                              : t(`priority_${todo.priority}` as TranslationKey)}
                          </Badge>
                        </div>
                        <p
                          className={cn(
                            'text-[11px] text-mq-content-secondary truncate mt-0.5',
                            isOverdue && 'text-red-600 dark:text-red-400',
                          )}
                        >
                          {formatMonthDayTime(due.toDate())}
                        </p>
                      </div>
                      <ItemActionButtons
                        itemType="todo"
                        itemId={todo.id}
                        itemTitle={todo.title}
                        dateTime={todo.dueDate}
                        notificationEnabled={todo.notificationEnabled}
                        onEdit={() => onEditTodo(todo)}
                        onDelete={() => onDeleteTodo(todo)}
                        onToggleNotification={() => toggleTodoNotification(todo.id)}
                        variant="compact"
                        stopPropagation
                        className="action-buttons-auto"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MagicCard>
  );
}
