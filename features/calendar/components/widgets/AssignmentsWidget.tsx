'use client';

import React from 'react';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { Plus, FileText, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/mq/button';
import { Badge } from '@/components/ui/mq/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { MagicCard } from '@/components/ui/MagicCard';
import { cn } from '@/lib/utils';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { PRIORITY_COLORS } from '@/lib/constants';
import { getDeadlineColor } from '@/lib/calendar-utils';
import dayjs from 'dayjs';
import { Deadline } from '@/lib/types';
import ItemActionButtons from '@/features/calendar/components/ItemActionButtons';
import { formatLocalizedDate } from '@/lib/utils/locale';

interface AssignmentsWidgetProps {
  onAddAssignment: () => void;
  onEditAssignment: (assignment: Deadline) => void;
  onOpenAssignmentDetail: (assignment: Deadline) => void;
  onDeleteAssignment: (assignment: Deadline) => void;
  highlightedDeadlineId: string | null;
  widgetRef: React.RefObject<HTMLDivElement | null>;
  deadlineHighlightActive: boolean;
}

export default function AssignmentsWidget({
  onAddAssignment,
  onEditAssignment,
  onOpenAssignmentDetail,
  onDeleteAssignment,
  highlightedDeadlineId,
  widgetRef,
  deadlineHighlightActive,
}: AssignmentsWidgetProps) {
  const { t, language } = useTypedTranslation();
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const toggleComplete = useDeadlinesStore((state) => state.toggleComplete);
  const toggleDeadlineNotification = useDeadlinesStore((state) => state.toggleNotification);
  const units = useUnitsStore((state) => state.units);

  const assignments = deadlines.filter((d) => d.type === 'Assignment');

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

  return (
    <MagicCard
      isLiquidEnhanced
      className={
        deadlineHighlightActive ||
        (highlightedDeadlineId &&
          deadlines.find((d) => d.id === highlightedDeadlineId)?.type === 'Assignment')
          ? 'ring-2 ring-mq-primary ring-offset-2 ring-offset-mq-background transition-all'
          : ''
      }
    >
      <div
        className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border"
        ref={widgetRef}
      >
        <Card className="border border-mq-border shadow-sm bg-mq-card-background">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-mq-content">
                <FileText className="h-4 w-4 text-mq-content" />
                {t('assignments')}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="neutral" className="text-[10px] h-5 px-1.5">
                  {assignments.filter((a) => !a.completed).length} {t('pending')}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={onAddAssignment}
                  aria-label={t('addAssignment')}
                >
                  <Plus className="h-4 w-4 text-mq-content" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {assignments.length === 0 ? (
              <div className="text-center py-6 text-mq-content-tertiary">
                <p className="text-xs">{t('noAssignmentsYet')}</p>
              </div>
            ) : (
              <div className="space-y-2 pr-1">
                {assignments
                  .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf())
                  .map((assignment) => {
                    const due = dayjs(assignment.dueDate);
                    const isOverdue = !assignment.completed && due.isBefore(dayjs());
                    const isHighlighted =
                      deadlineHighlightActive && highlightedDeadlineId === assignment.id;
                    const deadlineColor = getDeadlineColor(assignment, units);

                    return (
                      <div
                        key={assignment.id}
                        className={cn(
                          'group flex items-center gap-3 p-2.5 rounded-md border-l-4 border border-mq-border transition-all cursor-pointer w-full bg-mq-background-secondary hover:bg-mq-surface hover:shadow-sm',
                          assignment.completed && 'opacity-60 grayscale',
                          isOverdue && 'opacity-70 bg-red-500/5',
                          isHighlighted && 'ring-2 ring-mq-primary ring-offset-1 animate-pulse',
                        )}
                        style={{
                          borderLeftColor: deadlineColor,
                          borderLeftWidth: '4px',
                        }}
                        onClick={() => onOpenAssignmentDetail(assignment)}
                        onKeyDown={(e) =>
                          handleKeyDown(e, () => onOpenAssignmentDetail(assignment))
                        }
                        role="button"
                        tabIndex={0}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleComplete(assignment.id);
                          }}
                          className={cn(
                            'text-mq-content-secondary hover:text-mq-primary transition-colors',
                            assignment.completed && 'text-green-600 dark:text-green-400',
                          )}
                        >
                          {assignment.completed ? (
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
                                (assignment.completed || isOverdue) &&
                                  'line-through decoration-mq-content-tertiary',
                              )}
                            >
                              {assignment.title}
                            </h4>
                            <Badge
                              className={cn(
                                PRIORITY_COLORS[assignment.priority],
                                'ml-2 text-[10px] h-4 px-1',
                                isOverdue && 'opacity-70',
                              )}
                              variant="neutral"
                            >
                              {isOverdue
                                ? t('overdue' as TranslationKey)
                                : t(`priority_${assignment.priority}` as TranslationKey)}
                            </Badge>
                          </div>
                          <p
                            className={cn(
                              'text-[11px] text-mq-content-secondary truncate mt-0.5',
                              isOverdue && 'text-red-600 dark:text-red-400',
                            )}
                          >
                            {assignment.unitCode} • {formatMonthDayTime(due.toDate())}
                          </p>
                        </div>
                        <ItemActionButtons
                          itemType="assignment"
                          itemId={assignment.id}
                          itemTitle={assignment.title}
                          unitCode={assignment.unitCode}
                          dateTime={assignment.dueDate}
                          notificationEnabled={assignment.notificationEnabled}
                          onEdit={() => onEditAssignment(assignment)}
                          onDelete={() => onDeleteAssignment(assignment)}
                          onToggleNotification={() => toggleDeadlineNotification(assignment.id)}
                          variant="compact"
                          stopPropagation
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
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
