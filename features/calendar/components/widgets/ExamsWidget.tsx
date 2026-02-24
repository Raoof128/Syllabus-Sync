'use client';

import React from 'react';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import { Plus, BookOpen, CheckCircle2, Circle } from 'lucide-react';
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

interface ExamsWidgetProps {
  onAddExam: () => void;
  onEditExam: (exam: Deadline) => void;
  onOpenExamDetail: (exam: Deadline) => void;
  onDeleteExam: (exam: Deadline) => void;
  highlightedDeadlineId: string | null;
  widgetRef: React.RefObject<HTMLDivElement | null>;
  deadlineHighlightActive: boolean;
}

export default function ExamsWidget({
  onAddExam,
  onEditExam,
  onOpenExamDetail,
  onDeleteExam,
  highlightedDeadlineId,
  widgetRef,
  deadlineHighlightActive,
}: ExamsWidgetProps) {
  const { t, language } = useTypedTranslation();
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const toggleComplete = useDeadlinesStore((state) => state.toggleComplete);
  const toggleDeadlineNotification = useDeadlinesStore((state) => state.toggleNotification);
  const units = useUnitsStore((state) => state.units);

  const exams = deadlines.filter((d) => d.type === 'Exam' || d.type === 'Quiz');

  const formatMonthDayTime = (date: Date) =>
    formatLocalizedDate(date, language, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  const getDeadlineBuilding = (deadline: Deadline): string | undefined => {
    if (deadline.building) return deadline.building;
    const unit = units.find((u) => u.code === deadline.unitCode);
    return unit?.location?.building;
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <MagicCard isLiquidEnhanced>
      <div
        className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border"
        ref={widgetRef}
      >
        <Card className="border border-mq-border shadow-sm bg-mq-card-background">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="h-4 w-4" />
                {t('exams')}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="neutral" className="text-[10px] h-5 px-1.5">
                  {exams.filter((e) => !e.completed).length} {t('upcoming')}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={onAddExam}
                  aria-label={t('addExam')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {exams.length === 0 ? (
              <div className="text-center py-6 text-mq-content-tertiary">
                <p className="text-xs">{t('noExamsYet')}</p>
              </div>
            ) : (
              <div className="space-y-2 pr-1">
                {exams
                  .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf())
                  .map((exam) => {
                    const due = dayjs(exam.dueDate);
                    const isOverdue = !exam.completed && due.isBefore(dayjs());
                    const deadlineColor = getDeadlineColor(exam, units);
                    const isHighlighted =
                      deadlineHighlightActive && highlightedDeadlineId === exam.id;

                    return (
                      <div
                        key={exam.id}
                        className={cn(
                          'group flex items-center gap-3 p-2.5 rounded-md border-l-4 border border-mq-border transition-all cursor-pointer w-full bg-mq-background-secondary hover:bg-mq-surface hover:shadow-sm',
                          exam.completed && 'opacity-60 grayscale',
                          isOverdue && 'bg-red-500/5',
                          isHighlighted && 'ring-2 ring-mq-primary ring-offset-1 animate-pulse',
                        )}
                        style={{
                          borderLeftColor: deadlineColor,
                          borderLeftWidth: '4px',
                        }}
                        onClick={() => onOpenExamDetail(exam)}
                        onKeyDown={(e) => handleKeyDown(e, () => onOpenExamDetail(exam))}
                        role="button"
                        tabIndex={0}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleComplete(exam.id);
                          }}
                          className={cn(
                            'text-mq-content-secondary hover:text-mq-primary transition-colors',
                            exam.completed && 'text-green-600 dark:text-green-400',
                          )}
                        >
                          {exam.completed ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4
                              className={cn(
                                'font-medium text-sm truncate',
                                exam.completed && 'line-through decoration-mq-content-tertiary',
                              )}
                            >
                              {exam.title}
                            </h4>
                            <Badge
                              className={cn(
                                PRIORITY_COLORS[exam.priority],
                                'ml-2 text-[10px] h-4 px-1',
                              )}
                              variant="neutral"
                            >
                              {t(`priority_${exam.priority}` as TranslationKey)}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-mq-content-secondary truncate mt-0.5">
                            {exam.unitCode} • {formatMonthDayTime(due.toDate())}
                          </p>
                        </div>
                        <ItemActionButtons
                          itemType="exam"
                          itemId={exam.id}
                          itemTitle={exam.title}
                          building={getDeadlineBuilding(exam)}
                          room={exam.room}
                          unitCode={exam.unitCode}
                          dateTime={exam.dueDate}
                          notificationEnabled={exam.notificationEnabled}
                          onEdit={() => onEditExam(exam)}
                          onDelete={() => onDeleteExam(exam)}
                          onToggleNotification={() => toggleDeadlineNotification(exam.id)}
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
