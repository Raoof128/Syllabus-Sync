'use client';

import { memo, useMemo, useState, useCallback } from 'react';
import { TrendingUp, Calendar, Users, MapPin, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PublicEvent } from '@/lib/types/publicEvents';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/mq/button';
import { Badge } from '@/components/ui/mq/badge';

interface QuickStatsProps {
  events: PublicEvent[];
  className?: string;
}

interface DialogState {
  title: string;
  events: PublicEvent[];
}

export const QuickStats = memo(({ events, className }: QuickStatsProps) => {
  const { t } = useTypedTranslation();
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<PublicEvent | null>(null);

  const stats = useMemo(() => {
    // Safety check - ensure events is a valid array
    const safeEvents = Array.isArray(events)
      ? events.filter((e) => e && typeof e.category === 'string')
      : [];

    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    const thisWeekEvents = safeEvents.filter(
      (e) => e.startAt && e.startAt >= now && e.startAt <= endOfWeek,
    );
    const freeFood = safeEvents.filter((e) => e.category === 'Free Food');
    const career = safeEvents.filter((e) => e.category === 'Career');
    const social = safeEvents.filter((e) => e.category === 'Social');
    const academic = safeEvents.filter((e) => e.category === 'Academic');

    return {
      total: safeEvents.length,
      totalEvents: safeEvents,
      thisWeek: thisWeekEvents.length,
      thisWeekEvents,
      freeFood: freeFood.length,
      freeFoodEvents: freeFood,
      career: career.length,
      careerEvents: career,
      social: social.length,
      socialEvents: social,
      academic: academic.length,
      academicEvents: academic,
    };
  }, [events]);

  const openDialog = useCallback((title: string, eventsList: PublicEvent[]) => {
    setSelectedEvent(null);
    setDialogState({ title, events: eventsList });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState(null);
    setSelectedEvent(null);
  }, []);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-mq-primary" />
        <h3 className="font-bold text-mq-content">{t('thisWeek')}</h3>
      </div>

      {/* Stats Cards */}
      <div className="space-y-2">
        <StatCard
          icon={Calendar}
          label={t('totalEvents')}
          value={stats.total}
          color="text-mq-primary"
          bgColor="bg-mq-primary/10"
          onClick={() => openDialog(t('totalEvents'), stats.totalEvents)}
        />
        <StatCard
          icon={Users}
          label={t('thisWeek')}
          value={stats.thisWeek}
          color="text-mq-purple"
          bgColor="bg-mq-purple/10"
          onClick={() => openDialog(t('thisWeek'), stats.thisWeekEvents)}
        />
      </div>

      {/* Category Breakdown */}
      <div className="pt-4 border-t border-mq-border">
        <p className="text-xs font-semibold text-mq-content-tertiary uppercase tracking-wide mb-3">
          {t('byCategory')}
        </p>
        <div className="space-y-2">
          <CategoryBar
            icon="💼"
            label={t('career')}
            count={stats.career}
            total={stats.total}
            color="bg-mq-info"
            onClick={() => openDialog(t('career'), stats.careerEvents)}
          />
          <CategoryBar
            icon="📚"
            label={t('academic')}
            count={stats.academic}
            total={stats.total}
            color="bg-mq-success"
            onClick={() => openDialog(t('academic'), stats.academicEvents)}
          />
          <CategoryBar
            icon="🎉"
            label={t('social')}
            count={stats.social}
            total={stats.total}
            color="bg-mq-purple"
            onClick={() => openDialog(t('social'), stats.socialEvents)}
          />
          <CategoryBar
            icon="🍕"
            label={t('freeFood')}
            count={stats.freeFood}
            total={stats.total}
            color="bg-mq-warning"
            onClick={() => openDialog(t('freeFood'), stats.freeFoodEvents)}
          />
        </div>
      </div>

      {/* Events Dialog */}
      <Dialog
        open={dialogState !== null}
        onOpenChange={(open: boolean) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh]">
          {dialogState &&
            (selectedEvent ? (
              /* Single event detail view */
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedEvent.title}</DialogTitle>
                  <DialogDescription className="text-sm text-mq-content-secondary">
                    {selectedEvent.category}
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <EventCard event={selectedEvent} expanded />
                </div>
                <div className="flex justify-between mt-4">
                  <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                    {t('back')}
                  </Button>
                  <Button variant="outline" onClick={closeDialog}>
                    {t('close')}
                  </Button>
                </div>
              </>
            ) : (
              /* Events list view */
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{dialogState.title}</DialogTitle>
                  <DialogDescription className="text-sm text-mq-content-secondary">
                    {t(dialogState.events.length === 1 ? 'eventsCount_one' : 'eventsCount_other', {
                      count: dialogState.events.length,
                    })}
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-3 overflow-y-auto max-h-[50vh]">
                  {dialogState.events.length === 0 ? (
                    <p className="text-center py-8 text-mq-content-tertiary">
                      {t('noEventsFound')}
                    </p>
                  ) : (
                    dialogState.events.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onClick={() => setSelectedEvent(event)}
                      />
                    ))
                  )}
                </div>
                <div className="flex justify-end mt-4">
                  <Button variant="outline" onClick={closeDialog}>
                    {t('close')}
                  </Button>
                </div>
              </>
            ))}
        </DialogContent>
      </Dialog>
    </div>
  );
});

QuickStats.displayName = 'QuickStats';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  bgColor: string;
  onClick: () => void;
}

function StatCard({ icon: Icon, label, value, color, bgColor, onClick }: StatCardProps) {
  const { t } = useTypedTranslation();
  return (
    <div
      className="flex items-center justify-between p-3 rounded-xl bg-mq-card-background border border-mq-border cursor-pointer select-none hover:shadow-md active:scale-[0.98] transition-all"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={t('viewLabel', { label })}
    >
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg', bgColor)}>
          <Icon className={cn('h-4 w-4', color)} aria-hidden="true" />
        </div>
        <span className="text-sm text-mq-content-secondary">{label}</span>
      </div>
      <span className="text-lg font-bold text-mq-content">{value}</span>
    </div>
  );
}

interface CategoryBarProps {
  icon: string;
  label: string;
  count: number;
  total: number;
  color: string;
  onClick: () => void;
}

function CategoryBar({ icon, label, count, total, color, onClick }: CategoryBarProps) {
  const { t } = useTypedTranslation();
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div
      className="cursor-pointer select-none p-2 -m-2 rounded-lg hover:bg-mq-background-secondary/50 transition-all active:scale-[0.98]"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={t('viewCategoryEvents', { label })}
    >
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="flex items-center gap-1.5 text-mq-content-secondary">
          <span>{icon}</span>
          {label}
        </span>
        <span className="font-medium text-mq-content">{count}</span>
      </div>
      <div className="h-1.5 bg-mq-background-secondary rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Event Card Component for Dialog
interface EventCardProps {
  event: PublicEvent;
  onClick?: () => void;
  expanded?: boolean;
}

function EventCard({ event, onClick, expanded }: EventCardProps) {
  const { t, language } = useTypedTranslation();
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
  const locale = localeMap[language] || 'en-AU';

  const categoryColors: Record<string, string> = {
    Career: 'bg-mq-info/10 text-mq-info border-mq-info/20',
    Social: 'bg-mq-purple/10 text-mq-purple border-mq-purple/20',
    Academic: 'bg-mq-success/10 text-mq-success border-mq-success/20',
    'Free Food': 'bg-mq-warning/10 text-mq-warning border-mq-warning/20',
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTimeRange = () => {
    if (event.allDay) return t('allDay');
    const start = formatTime(event.startAt);
    if (event.endAt) {
      const end = formatTime(event.endAt);
      return `${start} - ${end}`;
    }
    return start;
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- role, tabIndex, and keyboard handlers are conditionally applied when onClick is present
    <div
      className={cn(
        'p-4 rounded-lg border border-mq-border bg-mq-card-background transition-all',
        onClick && 'cursor-pointer hover:shadow-md hover:border-mq-primary/30 active:scale-[0.99]',
      )}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="font-semibold text-base text-mq-content flex-1">{event.title}</h4>
        <Badge className={cn('text-xs shrink-0 border', categoryColors[event.category])}>
          {event.category}
        </Badge>
      </div>
      {event.description && (
        <p className={cn('text-sm text-mq-content-secondary mb-3', !expanded && 'line-clamp-2')}>
          {event.description}
        </p>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-mq-content-secondary">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-mq-content-secondary" aria-hidden="true" />
          <span>{formatDate(event.startAt)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-mq-content-secondary" aria-hidden="true" />
          <span>{getTimeRange()}</span>
        </div>
        {event.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-mq-content-secondary" aria-hidden="true" />
            <span>{event.location}</span>
          </div>
        )}
      </div>
      {expanded && event.building && (
        <div className="mt-3 pt-3 border-t border-mq-border">
          <p className="text-xs text-mq-content-tertiary">
            {t('building')}: {event.building}
            {event.room && ` - ${t('room')} ${event.room}`}
          </p>
        </div>
      )}
    </div>
  );
}
