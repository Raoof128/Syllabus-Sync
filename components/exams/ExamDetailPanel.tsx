'use client';

import { useMemo } from 'react';
import { Deadline } from '@/lib/types';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/mq/badge';
import {
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  CalendarDays,
  BookOpen,
  Navigation,
  MapPin,
  GraduationCap,
} from 'lucide-react';
import Link from 'next/link';
import { format, isPast, differenceInDays, differenceInHours } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { Button } from '@/components/ui/mq/button';
import { PRIORITY_COLORS } from '@/lib/constants';
import type { TranslationKey } from '@/lib/i18n/translations';
import ItemActionButtons from '@/components/calendar/ItemActionButtons';

interface ExamDetailPanelProps {
  exam: Deadline | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (exam: Deadline) => void;
  onDelete?: (exam: Deadline) => void;
}

export default function ExamDetailPanel({
  exam,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: ExamDetailPanelProps) {
  const toggleComplete = useDeadlinesStore((state) => state.toggleComplete);
  const units = useUnitsStore((state) => state.units);
  const { t } = useTypedTranslation();

  // Find the associated unit for color and additional info
  const unit = useMemo(() => {
    if (!exam) return null;
    return units.find((u) => u.code === exam.unitCode) ?? null;
  }, [exam, units]);

  // Get the color (from exam custom color or unit color)
  const color = useMemo(() => {
    if (!exam) return '#3B82F6';
    if (exam.color) return exam.color;
    if (unit?.color) return unit.color;
    return '#3B82F6';
  }, [exam, unit]);

  // Get location display - must be before early return
  const locationDisplay = useMemo(() => {
    if (!exam) return null;
    if (exam.building && exam.room) {
      return `${exam.building} ${exam.room}`;
    }
    if (exam.building) {
      return exam.building;
    }
    return null;
  }, [exam]);

  // Early return after all hooks
  if (!exam) return null;

  const dueDate = new Date(exam.dueDate);
  const now = new Date();
  const isPastDue = isPast(dueDate);
  const daysUntil = differenceInDays(dueDate, now);
  const hoursUntil = differenceInHours(dueDate, now);

  const getStatus = () => {
    if (exam.completed) return 'completed';
    if (isPastDue) return 'overdue';
    if (daysUntil <= 1) return 'urgent';
    if (daysUntil <= 3) return 'soon';
    return 'upcoming';
  };

  const status = getStatus();

  const getTimeRemaining = () => {
    if (exam.completed) return t('completed' as TranslationKey);
    if (isPastDue) {
      const daysPast = Math.abs(daysUntil);
      if (daysPast === 0) return 'Exam was today';
      if (daysPast === 1) return '1 day ago';
      return `${daysPast} days ago`;
    }
    if (hoursUntil < 24) {
      if (hoursUntil <= 1) return 'Starting soon';
      return `In ${hoursUntil} hours`;
    }
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil <= 7) return `In ${daysUntil} days`;
    return `In ${daysUntil} days`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
            {exam.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status and Quick Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleComplete(exam.id)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-mq-hover-background transition-colors"
                aria-label={exam.completed ? t('markIncomplete') : t('markAsCompleted')}
              >
                {exam.completed ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                ) : status === 'overdue' ? (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                ) : (
                  <Circle className="h-6 w-6 text-mq-content-secondary" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    exam.completed && 'text-emerald-600',
                    status === 'overdue' && !exam.completed && 'text-red-600',
                  )}
                >
                  {exam.completed
                    ? t('completed' as TranslationKey)
                    : status === 'overdue'
                      ? 'Exam passed'
                      : 'Mark complete'}
                </span>
              </button>
            </div>

            <ItemActionButtons
              itemType="exam"
              itemId={exam.id}
              itemTitle={exam.title}
              building={exam.building}
              room={exam.room}
              unitCode={exam.unitCode}
              dateTime={exam.dueDate}
              onEdit={onEdit ? () => onEdit(exam) : undefined}
              onDelete={onDelete ? () => onDelete(exam) : undefined}
              variant="detail"
              stopPropagation={false}
            />
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Type */}
            <div className="p-3 rounded-lg bg-mq-background-secondary border border-mq-border">
              <div className="flex items-center gap-2 text-mq-content-secondary text-xs mb-1">
                <GraduationCap className="h-3.5 w-3.5" />
                {t('type' as TranslationKey)}
              </div>
              <p className="font-medium text-sm">Exam</p>
            </div>

            {/* Priority */}
            <div className="p-3 rounded-lg bg-mq-background-secondary border border-mq-border">
              <div className="flex items-center gap-2 text-mq-content-secondary text-xs mb-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {t('priority' as TranslationKey)}
              </div>
              <Badge className={cn(PRIORITY_COLORS[exam.priority], 'mt-0.5')}>
                {t(`priority_${exam.priority}` as TranslationKey)}
              </Badge>
            </div>

            {/* Date & Time */}
            <div className="p-3 rounded-lg bg-mq-background-secondary border border-mq-border">
              <div className="flex items-center gap-2 text-mq-content-secondary text-xs mb-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {t('date' as TranslationKey) || 'Date'}
              </div>
              <p className="font-medium text-sm">{format(dueDate, 'MMM d, yyyy')}</p>
              <p className="text-xs text-mq-content-secondary">{format(dueDate, 'h:mm a')}</p>
            </div>

            {/* Status / Time Remaining */}
            <div className="p-3 rounded-lg bg-mq-background-secondary border border-mq-border">
              <div className="flex items-center gap-2 text-mq-content-secondary text-xs mb-1">
                <Clock className="h-3.5 w-3.5" />
                {t('status' as TranslationKey) || 'Status'}
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
          </div>

          {/* Exam Location */}
          {locationDisplay && (
            <div className="p-4 rounded-lg border border-mq-border bg-mq-card-background">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-mq-content-secondary text-xs">
                  <MapPin className="h-3.5 w-3.5" />
                  Exam Location
                </div>
                {exam.building && (
                  <Link href={`/map?building=${exam.building.toLowerCase()}&autonav=true`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="p-1 inline-flex items-center justify-center hover:bg-mq-hover-background rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-11 min-w-11"
                      aria-label={`Navigate to ${exam.building} on campus map`}
                    >
                      <Navigation
                        className="h-4 w-4 text-mq-content-secondary"
                        aria-hidden="true"
                      />
                    </Button>
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded shrink-0" style={{ backgroundColor: color }} />
                <div>
                  <p className="font-semibold text-sm">{exam.building || 'TBA'}</p>
                  {exam.room && (
                    <p className="text-xs text-mq-content-secondary">Room {exam.room}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Unit Association */}
          {unit && (
            <div className="p-4 rounded-lg border border-mq-border bg-mq-card-background">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-mq-content-secondary text-xs">
                  <BookOpen className="h-3.5 w-3.5" />
                  Associated Unit
                </div>
                {unit.location?.building && (
                  <Link href={`/map?building=${unit.location.building.toLowerCase()}&autonav=true`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="p-1 inline-flex items-center justify-center hover:bg-mq-hover-background rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-11 min-w-11"
                      aria-label={
                        t('navigateToBuildingAria', { building: unit.location.building }) ||
                        `Navigate to ${unit.location.building} on campus map`
                      }
                    >
                      <Navigation
                        className="h-4 w-4 text-mq-content-secondary"
                        aria-hidden="true"
                      />
                    </Button>
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded shrink-0" style={{ backgroundColor: unit.color }} />
                <div>
                  <p className="font-semibold text-sm">{unit.code}</p>
                  <p className="text-xs text-mq-content-secondary">{unit.name}</p>
                </div>
              </div>
            </div>
          )}

          {/* No Unit Found */}
          {!unit && exam.unitCode && (
            <div className="p-4 rounded-lg border border-mq-border bg-mq-card-background">
              <div className="flex items-center gap-2 text-mq-content-secondary text-xs mb-2">
                <BookOpen className="h-3.5 w-3.5" />
                Unit Code
              </div>
              <p className="font-medium text-sm">{exam.unitCode}</p>
              <p className="text-xs text-mq-content-tertiary mt-1">Unit details not found</p>
            </div>
          )}

          {/* Created Date */}
          {exam.createdAt && (
            <div className="pt-2 border-t border-mq-border">
              <p className="text-xs text-mq-content-tertiary">
                Created {format(new Date(exam.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
