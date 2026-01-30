'use client';

import { useMemo } from 'react';
import { Todo } from '@/lib/types';
import { useTodosStore } from '@/lib/store/todosStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/mq/badge';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  CalendarDays,
  Bell,
  Edit2,
  Trash2,
} from 'lucide-react';
import { format, isPast, differenceInDays, differenceInHours } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { Button } from '@/components/ui/mq/button';
import { PRIORITY_COLORS } from '@/lib/constants';
import type { TranslationKey } from '@/lib/i18n/translations';

interface TodoDetailPanelProps {
  todo: Todo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (todo: Todo) => void;
  onDelete?: (todo: Todo) => void;
  onNotify?: (todo: Todo) => void;
}

export default function TodoDetailPanel({
  todo,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onNotify,
}: TodoDetailPanelProps) {
  const toggleComplete = useTodosStore((state) => state.toggleComplete);
  const { t } = useTranslation();

  const tOr = (key: TranslationKey | string, fallback: string) => {
    const value = t(key as TranslationKey);
    return value === key ? fallback : value;
  };

  // Priority-based color
  const color = useMemo(() => {
    if (!todo) return '#6B7280';
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
    if (todo.completed) return tOr('completed', 'Completed');
    if (!dueDate) return tOr('noDueDate', 'No due date');
    if (isPastDue) {
      const daysPast = Math.abs(daysUntil || 0);
      if (daysPast === 0) return tOr('overdueToday', 'Overdue (today)');
      if (daysPast === 1) return tOr('oneDayOverdue', '1 day overdue');
      return `${daysPast} ${tOr('daysOverdue', 'days overdue')}`;
    }
    if (hoursUntil !== null && hoursUntil < 24) {
      if (hoursUntil <= 1) return tOr('dueWithinHour', 'Due within an hour');
      return `${tOr('dueIn', 'Due in')} ${hoursUntil} ${tOr('hours', 'hours')}`;
    }
    if (daysUntil === 1) return tOr('dueTomorrow', 'Due tomorrow');
    if (daysUntil !== null && daysUntil <= 7) return `${tOr('dueIn', 'Due in')} ${daysUntil} ${tOr('days', 'days')}`;
    return daysUntil !== null ? `${tOr('dueIn', 'Due in')} ${daysUntil} ${tOr('days', 'days')}` : '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            {todo.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status and Quick Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleComplete(todo.id)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-mq-hover-background transition-colors"
                aria-label={todo.completed ? tOr('markIncomplete', 'Mark incomplete') : tOr('markAsCompleted', 'Mark as completed')}
              >
                {todo.completed ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                ) : status === 'overdue' ? (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                ) : (
                  <Circle className="h-6 w-6 text-mq-content-secondary" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    todo.completed && 'text-emerald-600',
                    status === 'overdue' && !todo.completed && 'text-red-600',
                  )}
                >
                  {todo.completed
                    ? tOr('completed', 'Completed')
                    : status === 'overdue'
                      ? tOr('overdue', 'Overdue')
                      : tOr('markComplete', 'Mark complete')}
                </span>
              </button>
            </div>

            {/* Action buttons - Bell, Edit, Delete (no Navigate for Todos) */}
            <div className="flex items-center gap-1">
              {onNotify && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => onNotify(todo)}
                  title={tOr('setReminder', 'Set reminder')}
                >
                  <Bell className="h-4 w-4" />
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => onEdit(todo)}
                  title={tOr('edit', 'Edit')}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-red-100 dark:hover:bg-red-950/30 hover:text-red-500"
                  onClick={() => onDelete(todo)}
                  title={t('delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Priority */}
            <div className="p-3 rounded-lg bg-mq-background-secondary border border-mq-border">
              <div className="flex items-center gap-2 text-mq-content-secondary text-xs mb-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {tOr('priority', 'Priority')}
              </div>
              <Badge className={cn(PRIORITY_COLORS[todo.priority], 'mt-0.5')}>
                {t(`priority_${todo.priority}` as TranslationKey)}
              </Badge>
            </div>

            {/* Status / Time Remaining */}
            <div className="p-3 rounded-lg bg-mq-background-secondary border border-mq-border">
              <div className="flex items-center gap-2 text-mq-content-secondary text-xs mb-1">
                <Clock className="h-3.5 w-3.5" />
                {tOr('status', 'Status')}
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
              <div className="p-3 rounded-lg bg-mq-background-secondary border border-mq-border col-span-2">
                <div className="flex items-center gap-2 text-mq-content-secondary text-xs mb-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {tOr('dueDate', 'Due Date')}
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
                {tOr('description', 'Description')}
              </div>
              <p className="text-sm text-mq-content whitespace-pre-wrap">{todo.description}</p>
            </div>
          )}

          {/* Created Date */}
          {todo.createdAt && (
            <div className="pt-2 border-t border-mq-border">
              <p className="text-xs text-mq-content-tertiary">
                {tOr('created', 'Created')} {format(new Date(todo.createdAt), 'MMM d, yyyy')}
              </p>
              {todo.completedAt && (
                <p className="text-xs text-mq-content-tertiary mt-1">
                  {tOr('completedOn', 'Completed on')} {format(new Date(todo.completedAt), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
