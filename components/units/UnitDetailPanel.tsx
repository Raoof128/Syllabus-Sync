'use client';

import { useMemo } from 'react';
import { Unit, Deadline } from '@/lib/types';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/mq/badge';
import { BookOpen, FileText, Clock, MapPin, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { format, isPast, isFuture, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { formatScheduleTime, formatLocation } from '@/lib/utils/locale';
import ItemActionButtons from '@/components/calendar/ItemActionButtons';

interface UnitDetailPanelProps {
  unit: Unit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditDeadline?: (deadline: Deadline) => void;
  onEditUnit?: () => void;
  onDeleteUnit?: () => void;
}

export default function UnitDetailPanel({
  unit,
  open,
  onOpenChange,
  onEditDeadline,
  onEditUnit,
  onDeleteUnit,
}: UnitDetailPanelProps) {
  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const toggleComplete = useDeadlinesStore((state) => state.toggleComplete);
  const { t, language } = useTypedTranslation();

  // Filter deadlines for this unit
  const unitDeadlines = useMemo(() => {
    if (!unit) return { assignments: [], exams: [], quizzes: [], presentations: [], all: [] };

    const filtered = deadlines.filter((d) => d.unitCode === unit.code);

    return {
      assignments: filtered.filter((d) => d.type === 'Assignment'),
      exams: filtered.filter((d) => d.type === 'Exam'),
      quizzes: filtered.filter((d) => d.type === 'Quiz'),
      presentations: filtered.filter((d) => d.type === 'Presentation'),
      all: filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    };
  }, [deadlines, unit]);

  // Stats
  const stats = useMemo(() => {
    if (!unit) return { total: 0, completed: 0, upcoming: 0, overdue: 0 };

    const all = unitDeadlines.all;
    // Note: we use date-fns isFuture/isPast which compare against current time internally

    return {
      total: all.length,
      completed: all.filter((d) => d.completed).length,
      upcoming: all.filter((d) => !d.completed && isFuture(new Date(d.dueDate))).length,
      overdue: all.filter((d) => !d.completed && isPast(new Date(d.dueDate))).length,
    };
  }, [unitDeadlines.all, unit]);

  if (!unit) return null;

  const getDeadlineStatus = (deadline: Deadline) => {
    if (deadline.completed) return 'completed';
    const dueDate = new Date(deadline.dueDate);
    if (isPast(dueDate)) return 'overdue';
    const daysUntil = differenceInDays(dueDate, new Date());
    if (daysUntil <= 3) return 'urgent';
    return 'upcoming';
  };

  const formatDueDate = (date: Date) => {
    const d = new Date(date);
    const daysUntil = differenceInDays(d, new Date());

    if (daysUntil === 0) return 'Due today';
    if (daysUntil === 1) return 'Due tomorrow';
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
    if (daysUntil <= 7) return `Due in ${daysUntil} days`;

    return format(d, 'MMM d, yyyy');
  };

  const DeadlineItem = ({ deadline }: { deadline: Deadline }) => {
    const status = getDeadlineStatus(deadline);

    return (
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border border-mq-border bg-mq-background-secondary transition-all cursor-pointer hover:border-opacity-80',
          status === 'completed' && 'opacity-60',
          status === 'upcoming' && 'hover:border-mq-primary/30',
        )}
        style={{ borderLeftColor: unit.color, borderLeftWidth: '4px' }}
        onClick={() => onEditDeadline?.(deadline)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onEditDeadline?.(deadline);
          }
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleComplete(deadline.id);
          }}
          className="flex-shrink-0"
        >
          {deadline.completed ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : status === 'overdue' ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <Circle className="h-5 w-5 text-mq-content-secondary hover:text-mq-primary" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className={cn('font-medium text-sm truncate', deadline.completed && 'line-through')}
            >
              {unit.code} – {deadline.title}
            </h4>
            <Badge
              variant="neutral"
              className="text-[10px] px-1.5 py-0"
              style={{ backgroundColor: `${unit.color}20`, color: unit.color }}
            >
              {deadline.type}
            </Badge>
          </div>
          <p
            className={cn(
              'text-xs mt-0.5',
              status === 'overdue' && 'text-red-600',
              status === 'urgent' && 'text-amber-600',
              (status === 'upcoming' || status === 'completed') && 'text-mq-content-secondary',
            )}
          >
            {formatDueDate(deadline.dueDate)} • {format(new Date(deadline.dueDate), 'h:mm a')}
          </p>
        </div>

        <Badge
          variant="neutral"
          className={cn(
            'text-[10px]',
            deadline.priority === 'Urgent' && 'bg-red-100 text-red-700',
            deadline.priority === 'High' && 'bg-orange-100 text-orange-700',
            deadline.priority === 'Medium' && 'bg-yellow-100 text-yellow-700',
            deadline.priority === 'Low' && 'bg-green-100 text-green-700',
          )}
        >
          {deadline.priority}
        </Badge>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${unit.color}20` }}
            >
              <BookOpen className="h-6 w-6" style={{ color: unit.color }} />
            </div>
            <div>
              <DialogTitle className="text-xl">{unit.code}</DialogTitle>
              <p className="text-sm text-mq-content-secondary">{unit.name}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ItemActionButtons
                itemType="unit"
                itemId={unit.id}
                itemTitle={unit.code}
                building={unit.location?.building}
                room={unit.location?.room}
                unitCode={unit.code}
                onEdit={onEditUnit}
                onDelete={onDeleteUnit}
                variant="detail"
                stopPropagation={false}
              />
              <div
                className="w-6 h-6 rounded-full border-2"
                style={{ backgroundColor: unit.color, borderColor: unit.color }}
                title={t('unitColor')}
              />
            </div>
          </div>
        </DialogHeader>

        {/* Unit Info */}
        <div className="flex flex-wrap gap-4 py-3 border-b border-mq-border">
          <div className="flex items-center gap-2 text-sm text-mq-content-secondary">
            <MapPin className="h-4 w-4" />
            <span>{formatLocation(unit.location.building, unit.location.room, t('room'))}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-mq-content-secondary">
            <Clock className="h-4 w-4" />
            <span>
              {unit.schedule.length} class{unit.schedule.length !== 1 ? 'es' : ''}/week
            </span>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-3 py-3">
          <div className="text-center p-2 rounded-lg bg-mq-background-secondary">
            <div className="text-2xl font-bold" style={{ color: unit.color }}>
              {stats.total}
            </div>
            <div className="text-xs text-mq-content-secondary">Total</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-mq-background-secondary border border-mq-border">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-mq-content-secondary">Completed</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-mq-background-secondary border border-mq-border">
            <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
            <div className="text-xs text-mq-content-secondary">Upcoming</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-mq-background-secondary border border-mq-border">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-xs text-mq-content-secondary">Overdue</div>
          </div>
        </div>

        {/* Deadlines List */}
        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {unitDeadlines.all.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-mq-content-tertiary">
                <FileText className="h-12 w-12 mx-auto mb-3" />
              </div>
              <p className="text-mq-content-secondary">{t('noUnitsForDeadline')}</p>
              <p className="text-xs text-mq-content-tertiary mt-1">{t('noUnitsForDeadlineDesc')}</p>
            </div>
          ) : (
            <>
              {/* Assignments Section */}
              {unitDeadlines.assignments.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-medium mb-2">
                    <FileText className="h-4 w-4" />
                    {t('assignments')} ({unitDeadlines.assignments.length})
                  </h3>
                  <div className="space-y-2">
                    {unitDeadlines.assignments.map((d) => (
                      <DeadlineItem key={d.id} deadline={d} />
                    ))}
                  </div>
                </div>
              )}

              {/* Exams Section */}
              {unitDeadlines.exams.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-medium mb-2">
                    <BookOpen className="h-4 w-4" />
                    {t('exams')} ({unitDeadlines.exams.length})
                  </h3>
                  <div className="space-y-2">
                    {unitDeadlines.exams.map((d) => (
                      <DeadlineItem key={d.id} deadline={d} />
                    ))}
                  </div>
                </div>
              )}

              {/* Quizzes Section */}
              {unitDeadlines.quizzes.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-medium mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    {t('quizzes')} ({unitDeadlines.quizzes.length})
                  </h3>
                  <div className="space-y-2">
                    {unitDeadlines.quizzes.map((d) => (
                      <DeadlineItem key={d.id} deadline={d} />
                    ))}
                  </div>
                </div>
              )}

              {/* Presentations Section */}
              {unitDeadlines.presentations.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Clock className="h-4 w-4" />
                    {t('presentations')} ({unitDeadlines.presentations.length})
                  </h3>
                  <div className="space-y-2">
                    {unitDeadlines.presentations.map((d) => (
                      <DeadlineItem key={d.id} deadline={d} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Schedule Preview */}
        {unit.schedule.length > 0 && (
          <div className="flex-shrink-0 pt-3 border-t border-mq-border">
            <h3 className="text-sm font-medium mb-2">{t('weeklySchedule')}</h3>
            <div className="flex flex-wrap gap-2">
              {unit.schedule.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                  style={{ backgroundColor: `${unit.color}15`, color: unit.color }}
                >
                  <span className="font-medium">{s.day.slice(0, 3)}</span>
                  <span>
                    {formatScheduleTime(s.startTime, language)} -{' '}
                    {formatScheduleTime(s.endTime, language)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
