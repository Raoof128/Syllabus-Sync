'use client';

import { useMemo } from 'react';
import { Todo } from '@/lib/types';
import { useTodosStore } from '@/lib/store/todosStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/mq/badge';
import { CheckSquare, Clock, CheckCircle2, Circle, AlertCircle, CalendarDays } from 'lucide-react';
import { format, isPast, differenceInDays, differenceInHours } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { PRIORITY_COLORS } from '@/lib/constants';
import type { TranslationKey } from '@/lib/i18n/translations';
import ItemActionButtons from '@/features/calendar/components/ItemActionButtons';

interface TodoDetailPanelProps {
  todo: Todo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (todo: Todo) => void;
  onDelete?: (todo: Todo) => void;
}

export default function TodoDetailPanel({
  todo,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: TodoDetailPanelProps) {
  const toggleComplete = useTodosStore((state) => state.toggleComplete);
  const { t } = useTypedTranslation();

  // Use custom color if set, otherwise fall back to priority colors
  const color = useMemo(() => {
    if (!todo) return '#6B7280';
    if (todo.color) return todo.color;
    const priorityColors: Record<string, string> = {
      High: '#EF4444',
      Medium: '#F59E0B',
      Low: '#10B981',
    };
    return priorityColors[todo.priority] || '#6B7280';
  }, [todo]);

  if (!todo) return null;

  const dueDate = todo.dueDate ? new Date(todo.dueDate) : null;
  const now = new Date();
  const isPastDue = dueDate ? isPast(dueDate) : false;
  const daysUntil = dueDate ? differenceInDays(dueDate, now) : null;
  const hoursUntil = dueDate ? differenceInHours(dueDate, now) : null;

  const getStatus = () => {
    if (todo.completed) return 'completed';
    if (isPastDue) return 'overdue';
    if (daysUntil !== null && daysUntil <= 1) return 'urgent';
    if (daysUntil !== null && daysUntil <= 3) return 'soon';
    return 'upcoming';
  };

  const status = getStatus();

  const getTimeRemaining = () => {
    if (todo.completed) return t('completed' as TranslationKey);
    if (!dueDate) return t('noDueDate' as TranslationKey);
    if (isPastDue) {
      const daysPast = Math.abs(daysUntil || 0);
      if (daysPast === 0) return t('overdueToday' as TranslationKey);
      if (daysPast === 1) return t('oneDayOverdue' as TranslationKey);
      return t('daysOverdue' as TranslationKey, { count: daysPast });
    }
    if (hoursUntil !== null && hoursUntil < 24) {
      if (hoursUntil <= 1) return t('dueWithinHour' as TranslationKey);
      return `${t('dueIn' as TranslationKey)} ${hoursUntil} ${t('hours' as TranslationKey)}`;
    }
    if (daysUntil === 1) return t('dueTomorrow' as TranslationKey);
    if (daysUntil !== null && daysUntil <= 7)
      return `${t('dueIn' as TranslationKey)} ${daysUntil} ${t('days' as TranslationKey)}`;
    return daysUntil !== null
      ? `${t('dueIn' as TranslationKey)} ${daysUntil} ${t('days' as TranslationKey)}`
      : '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
            {todo.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status and Quick Actions */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleComplete(todo.id)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-mq-hover-background transition-colors"
                aria-label={
                  todo.completed
                    ? t('markIncomplete' as TranslationKey)
                    : t('markAsCompleted' as TranslationKey)
                }
              >
                {todo.completed ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                ) : status === 'overdue' ? (
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                ) : (
                  <Circle className="h-6 w-6 text-mq-content-secondary" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    todo.completed && 'text-emerald-600 dark:text-emerald-400',
                    status === 'overdue' && !todo.completed && 'text-red-600 dark:text-red-400',
                  )}
                >
                  {todo.completed
                    ? t('completed' as TranslationKey)
                    : status === 'overdue'
                      ? t('overdue' as TranslationKey)
                      : t('markComplete' as TranslationKey)}
                </span>
              </button>
            </div>

            {/* Action buttons using ItemActionButtons for consistency */}
            <ItemActionButtons
              itemType="todo"
              itemId={todo.id}
              itemTitle={todo.title}
              dateTime={todo.dueDate}
              itemColor={color}
              onEdit={onEdit ? () => onEdit(todo) : undefined}
              onDelete={onDelete ? () => onDelete(todo) : undefined}
              variant="detail"
              stopPropagation={false}
            />
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Priority */}
            <div className="p-3 rounded-lg bg-mq-background-secondary border border-mq-border">
              <div className="flex items-center gap-2 text-mq-content-secondary text-xs mb-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {t('priority' as TranslationKey)}
              </div>
              <Badge className={cn(PRIORITY_COLORS[todo.priority], 'mt-0.5')}>
                {t(`priority_${todo.priority}` as TranslationKey)}
              </Badge>
            </div>

            {/* Status / Time Remaining */}
            <div className="p-3 rounded-lg bg-mq-background-secondary border border-mq-border">
              <div className="flex items-center gap-2 text-mq-content-secondary text-xs mb-1">
                <Clock className="h-3.5 w-3.5" />
                {t('status' as TranslationKey)}
              </div>
              <p
                className={cn(
                  'font-medium text-sm',
                  status === 'overdue' && 'text-red-600',
                  status === 'urgent' && 'text-amber-600',
                  status === 'soon' && 'text-yellow-600',
                  status === 'completed' && 'text-emerald-600',
                )}
              >
                {getTimeRemaining()}
              </p>
            </div>

            {/* Due Date */}
            {dueDate && (
              <div className="col-span-1 rounded-lg border border-mq-border bg-mq-background-secondary p-3 sm:col-span-2">
                <div className="flex items-center gap-2 text-mq-content-secondary text-xs mb-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {t('dueDate' as TranslationKey)}
                </div>
                <p className="font-medium text-sm">{format(dueDate, 'EEEE, MMMM d, yyyy')}</p>
                <p className="text-xs text-mq-content-secondary">{format(dueDate, 'h:mm a')}</p>
              </div>
            )}
          </div>

          {/* Description */}
          {todo.description && (
            <div className="p-4 rounded-lg border border-mq-border bg-mq-card-background">
              <div className="flex items-center gap-2 text-mq-content-secondary text-xs mb-2">
                <CheckSquare className="h-3.5 w-3.5" />
                {t('description' as TranslationKey)}
              </div>
              <p className="text-sm text-mq-content whitespace-pre-wrap">{todo.description}</p>
            </div>
          )}

          {/* Created Date */}
          {todo.createdAt && (
            <div className="pt-2 border-t border-mq-border">
              <p className="text-xs text-mq-content-tertiary">
                {t('created' as TranslationKey)} {format(new Date(todo.createdAt), 'MMM d, yyyy')}
              </p>
              {todo.completedAt && (
                <p className="text-xs text-mq-content-tertiary mt-1">
                  {t('completedOn' as TranslationKey)}{' '}
                  {format(new Date(todo.completedAt), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
