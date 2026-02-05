'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Plus, Check, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/mq/button';
import { Badge } from '@/components/ui/mq/badge';
import { cn } from '@/lib/utils';
import { PublicEvent } from '@/lib/types/publicEvents';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { MagicCard } from '@/components/ui/MagicCard';

const categoryColors: Record<
  string,
  { bg: string; text: string; border: string; icon: string; gradient: string }
> = {
  Career: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    icon: '💼',
    gradient: 'from-blue-500/10 to-blue-600/5',
  },
  Social: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    icon: '🎉',
    gradient: 'from-purple-500/10 to-purple-600/5',
  },
  Academic: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: '📚',
    gradient: 'from-emerald-500/10 to-emerald-600/5',
  },
  'Free Food': {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-500',
    border: 'border-amber-200 dark:border-amber-800',
    icon: '🍕',
    gradient: 'from-amber-500/10 to-orange-500/5',
  },
};

interface PublicEventCardProps {
  event: PublicEvent;
  isAdded: boolean;
  isAdding: boolean;
  onAddToCalendar: () => void;
  onClick: () => void;
  locale?: string;
}

export const PublicEventCard = memo(function PublicEventCard({
  event,
  isAdded,
  isAdding,
  onAddToCalendar,
  onClick,
  locale = 'en-AU',
}: PublicEventCardProps) {
  const { t } = useTypedTranslation();
  const categoryStyle = categoryColors[event.category] || categoryColors.Academic;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getTimeRange = () => {
    if (event.allDay) return 'All Day';
    const start = formatTime(event.startAt);
    if (event.endAt) {
      const end = formatTime(event.endAt);
      return `${start} - ${end}`;
    }
    return start;
  };

  return (
    <MagicCard isLiquidEnhanced className="h-full">
      <article
        className={cn(
          'group relative flex flex-col h-full bg-mq-card-background rounded-2xl border transition-all duration-300',
          'border-mq-border hover:border-mq-primary/40 hover:shadow-xl hover:shadow-mq-primary/10 cursor-pointer',
          'overflow-hidden',
        )}
        onClick={onClick}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
        role="button"
        tabIndex={0}
      >
        {/* Gradient Background Overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-linear-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300',
            categoryStyle.gradient,
          )}
        />

        {/* Category Strip */}
        <div
          className={cn(
            'h-1.5 rounded-t-2xl relative z-10',
            categoryStyle.bg.replace('bg-', 'bg-').replace('/30', ''),
          )}
        />

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col relative z-10">
          {/* Header: Category + Icon */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <Badge
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-lg border',
                categoryStyle.bg,
                categoryStyle.text,
                categoryStyle.border,
              )}
            >
              <span className="mr-1.5">{categoryStyle.icon}</span>
              {event.category}
            </Badge>

            {event.isFeatured && (
              <Badge className="bg-linear-to-r from-amber-400 to-orange-500 text-white border-0 text-[10px] uppercase tracking-wide font-semibold">
                ✨ Featured
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-lg text-mq-content mb-2 line-clamp-2 group-hover:text-mq-primary transition-colors">
            {event.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-mq-content-secondary line-clamp-2 mb-4 flex-1">
            {event.description}
          </p>

          {/* Metadata */}
          <div className="space-y-2 text-sm">
            {/* Date */}
            <div className="flex items-center gap-2 text-mq-content-secondary">
              <Calendar className="h-4 w-4 text-mq-content-tertiary shrink-0" />
              <time dateTime={event.startAt.toISOString()} className="font-medium">
                {event.startAt.toLocaleDateString(locale, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </time>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 text-mq-content-secondary">
              <Clock className="h-4 w-4 text-mq-content-tertiary shrink-0" />
              <span>{getTimeRange()}</span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-mq-content-secondary">
              <MapPin className="h-4 w-4 text-mq-content-tertiary shrink-0" />
              <span className="truncate">{event.location}</span>
              {event.building && (
                <Badge variant="neutral" className="ml-1 text-[10px] font-mono shrink-0">
                  {event.building}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-mq-border bg-mq-background-secondary/50 backdrop-blur-sm rounded-b-2xl flex gap-2 relative z-10">
          <Button
            variant={isAdded ? 'primary' : 'outline'}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (!isAdded && !isAdding) {
                onAddToCalendar();
              }
            }}
            disabled={isAdding || isAdded}
            className={cn(
              'flex-1 gap-2 transition-all font-medium',
              isAdded && 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white',
            )}
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isAdded ? (
              <Check className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {isAdded
              ? t('addedToCalendar') || 'Added to Calendar'
              : t('addToCalendar') || 'Add to Calendar'}
          </Button>

          {event.building && (
            <Button
              asChild
              variant="ghost"
              size="icon"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 text-mq-content-secondary hover:text-mq-primary hover:bg-mq-primary/10"
            >
              <Link
                href={`/map?building=${encodeURIComponent(event.building)}${event.room ? `&room=${encodeURIComponent(event.room)}` : ''}`}
                aria-label={`Navigate to ${event.building}`}
              >
                <Navigation className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </article>
    </MagicCard>
  );
});
