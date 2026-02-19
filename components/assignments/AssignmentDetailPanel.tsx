'use client';

import { useMemo } from 'react';
import { Deadline } from '@/lib/types';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/mq/badge';
import {
  FileText,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  CalendarDays,
  BookOpen,
  Navigation,
} from 'lucide-react';
import Link from 'next/link';
import { format, isPast, differenceInDays, differenceInHours } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { PRIORITY_COLORS } from '@/lib/constants';
import type { TranslationKey } from '@/lib/i18n/translations';
import ItemActionButtons from '@/features/calendar/components/ItemActionButtons';

interface AssignmentDetailPanelProps {
  assignment: Deadline | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (assignment: Deadline) => void;
  onDelete?: (assignment: Deadline) => void;
  /** Called when the associated unit is clicked - opens unit detail panel */
  onUnitClick?: (unitCode: string) => void;
}

export default function AssignmentDetailPanel({
  assignment,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onUnitClick,
}: AssignmentDetailPanelProps) {
  const toggleComplete = useDeadlinesStore((state) => state.toggleComplete);
  const units = useUnitsStore((state) => state.units);
  const { t } = useTypedTranslation();

  // Find the associated unit for color and additional info
  const unit = useMemo(() => {
    if (!assignment) return null;
    return units.find((u) => u.code === assignment.unitCode) ?? null;
  }, [assignment, units]);

  // Get the color (from assignment custom color or unit color)
  const color = useMemo(() => {
    if (!assignment) return '#3B82F6';
    if (assignment.color) return assignment.color;
    if (unit?.color) return unit.color;
    return '#3B82F6';
  }, [assignment, unit]);

  if (!assignment) return null;

  const dueDate = new Date(assignment.dueDate);
  const now = new Date();
  const isPastDue = isPast(dueDate);
  const daysUntil = differenceInDays(dueDate, now);
  const hoursUntil = differenceInHours(dueDate, now);

  const getStatus = () => {
    if (assignment.completed) return 'completed';
    if (isPastDue) return 'overdue';
    if (daysUntil <= 1) return 'urgent';
    if (daysUntil <= 3) return 'soon';
    return 'upcoming';
  };

  const status = getStatus();

  const getTimeRemaining = () => {
    if (assignment.completed) return t('completed' as TranslationKey);
    if (isPastDue) {
      const daysPast = Math.abs(daysUntil);
      if (daysPast === 0) return 'Overdue (today)';
      if (daysPast === 1) return '1 day overdue';
      return `${daysPast} days overdue`;
    }
    if (hoursUntil < 24) {
      if (hoursUntil <= 1) return 'Due within an hour';
      return `Due in ${hoursUntil} hours`;
    }
    if (daysUntil === 1) return 'Due tomorrow';
    if (daysUntil <= 7) return `Due in ${daysUntil} days`;
    return `Due in ${daysUntil} days`;
  };

  const getTypeLabel = (type: Deadline['type']) => {
    switch (type) {
      case 'Assignment':
        return t('type_Assignment' as TranslationKey);
      case 'Exam':
        return t('type_Exam' as TranslationKey);
      case 'Quiz':
        return t('type_Quiz' as TranslationKey);
      case 'Presentation':
        return t('type_Presentation' as TranslationKey);
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            {assignment.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status and Quick Actions */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleComplete(assignment.id)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-mq-hover-background transition-colors"
                aria-label={assignment.completed ? t('markIncomplete') : t('markAsCompleted')}
              >
                {assignment.completed ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : status === 'overdue' ? (
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                ) : (
                  <Circle className="h-6 w-6 text-mq-content-secondary" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    assignment.completed && 'text-green-600 dark:text-green-400',
                    status === 'overdue' && !assignment.completed && 'text-red-600 dark:text-red-400',
                  )}
                >
                  {assignment.completed
                    ? t('completed' as TranslationKey)
                    : status === 'overdue'
                      ? 'Overdue'
                      : 'Mark complete'}
                </span>
              </button>
            </div>

            <ItemActionButtons
              itemType="assignment"
              itemId={assignment.id}
              itemTitle={assignment.title}
              unitCode={assignment.unitCode}
              dateTime={assignment.dueDate}
              itemColor={color}
              onEdit={onEdit ? () => onEdit(assignment) : undefined}
              onDelete={onDelete ? () => onDelete(assignment) : undefined}
              variant="detail"
              stopPropagation={false}
            />
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Type */}
            <div className="p-3 rounded-lg bg-mq-background-secondary border border-mq-border">
              <div className="flex items-center gap-2 text-mq-content-secondary text-xs mb-1">
                <FileText className="h-3.5 w-3.5" />
                {t('type' as TranslationKey)}
              </div>
              <p className="font-medium text-sm">{getTypeLabel(assignment.type)}</p>
            </div>

            {/* Priority */}
            <div className="p-3 rounded-lg bg-mq-background-secondary border border-mq-border">
              <div className="flex items-center gap-2 text-mq-content-secondary text-xs mb-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {t('priority' as TranslationKey)}
              </div>
              <Badge className={cn(PRIORITY_COLORS[assignment.priority], 'mt-0.5')}>
                {t(`priority_${assignment.priority}` as TranslationKey)}
              </Badge>
            </div>

            {/* Due Date */}
            <div className="p-3 rounded-lg bg-mq-background-secondary border border-mq-border">
              <div className="flex items-center gap-2 text-mq-content-secondary text-xs mb-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {t('due' as TranslationKey)}
              </div>
              <p className="font-medium text-sm">{format(dueDate, 'MMM d, yyyy')}</p>
              <p className="text-xs text-mq-content-secondary">{format(dueDate, 'h:mm a')}</p>
            </div>

            {/* Time Remaining */}
            <div
              className={cn('p-3 rounded-lg border bg-mq-background-secondary border-mq-border')}
            >
              <div className="flex items-center gap-2 text-mq-content-secondary text-xs mb-1">
                <Clock className="h-3.5 w-3.5" />
                Status
              </div>
              <p
                className={cn(
                  'font-medium text-sm',
                  status === 'overdue' && 'text-red-600',
                  status === 'urgent' && 'text-amber-600',
                  status === 'soon' && 'text-yellow-600',
                  status === 'completed' && 'text-green-600',
                )}
              >
                {getTimeRemaining()}
              </p>
            </div>
          </div>

          {/* Unit Association */}
          {unit && (
            <div
              className={cn(
                'p-4 rounded-lg border border-mq-border bg-mq-card-background',
                onUnitClick &&
                  'cursor-pointer hover:border-mq-primary/50 hover:bg-mq-hover-background transition-colors',
              )}
              {...(onUnitClick && {
                role: 'button' as const,
                tabIndex: 0,
                onClick: () => onUnitClick(unit.code),
                onKeyDown: (e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onUnitClick(unit.code);
                  }
                },
              })}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-mq-content-secondary text-xs">
                  <BookOpen className="h-3.5 w-3.5" />
                  Associated Unit
                </div>
                {unit.location?.building && (
                  <Link
                    href={`/map?building=${unit.location.building.toLowerCase()}&autonav=true`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-lg text-mq-content-secondary hover:text-emerald-600 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 transition-colors"
                    aria-label={
                      t('navigateToBuildingAria', { building: unit.location.building }) ||
                      `Navigate to ${unit.location.building} on campus map`
                    }
                  >
                    <Navigation className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded flex-shrink-0"
                  style={{ backgroundColor: unit.color }}
                />
                <div>
                  <p className="font-semibold text-sm">{unit.code}</p>
                  <p className="text-xs text-mq-content-secondary">{unit.name}</p>
                </div>
              </div>
            </div>
          )}

          {/* No Unit Found */}
          {!unit && assignment.unitCode && (
            <div className="p-4 rounded-lg border border-mq-border bg-mq-card-background">
              <div className="flex items-center gap-2 text-mq-content-secondary text-xs mb-2">
                <BookOpen className="h-3.5 w-3.5" />
                Unit Code
              </div>
              <p className="font-medium text-sm">{assignment.unitCode}</p>
              <p className="text-xs text-mq-content-tertiary mt-1">Unit details not found</p>
            </div>
          )}

          {/* Created Date */}
          <div className="pt-2 border-t border-mq-border">
            <p className="text-xs text-mq-content-tertiary">
              Created {format(new Date(assignment.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
