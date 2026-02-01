'use client';

import { useMemo } from 'react';
import { Event } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/mq/badge';
import { MapPin, Clock, CalendarDays, Navigation, Tag, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { format, isPast, differenceInDays, differenceInHours } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { Button } from '@/components/ui/mq/button';
import { CATEGORY_COLORS } from '@/lib/constants';
import type { TranslationKey } from '@/lib/i18n/translations';
import ItemActionButtons from '@/components/calendar/ItemActionButtons';

interface EventDetailPanelProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
}

export default function EventDetailPanel({
  event,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: EventDetailPanelProps) {
  const { t } = useTypedTranslation();

  // Get the color (from event custom color or category default)
  const color = useMemo(() => {
    if (!event) return '#A6192E';
    if (event.color) return event.color;
    // Default category colors
    const categoryColors: Record<string, string> = {
      Career: '#3B82F6',
      Social: '#8B5CF6',
      Academic: '#10B981',
      'Free Food': '#F59E0B',
    };
    return categoryColors[event.category] || '#A6192E';
  }, [event]);

  // Get location display - must be before early return
  const locationDisplay = useMemo(() => {
    if (!event) return null;
    if (event.building && event.room) {
      return `${event.building} ${event.room}`;
    }
    if (event.building) {
      return event.building;
    }
    if (event.location) {
      return event.location;
    }
    return null;
  }, [event]);

  // Early return after all hooks
  if (!event) return null;

  const eventDate = new Date(event.startAt);
  const now = new Date();
  const isPastEvent = isPast(eventDate);
  const daysUntil = differenceInDays(eventDate, now);
  const hoursUntil = differenceInHours(eventDate, now);

  const getStatus = () => {
    if (isPastEvent) return 'past';
    if (daysUntil === 0) return 'today';
    if (daysUntil === 1) return 'tomorrow';
    if (daysUntil <= 7) return 'thisWeek';
    return 'upcoming';
  };

  const status = getStatus();

  const getTimeRemaining = () => {
    if (isPastEvent) {
      const daysPast = Math.abs(daysUntil);
      if (daysPast === 0) return 'Earlier today';
      if (daysPast === 1) return 'Yesterday';
      return `${daysPast} days ago`;
    }
    if (hoursUntil < 1) return 'Starting soon';
    if (hoursUntil < 24) {
      return `In ${hoursUntil} hours`;
    }
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil <= 7) return `In ${daysUntil} days`;
    return `In ${daysUntil} days`;
  };

  const getCategoryLabel = (category: Event['category']) => {
    switch (category) {
      case 'Career':
        return t('category_Career' as TranslationKey) || 'Career';
      case 'Social':
        return t('category_Social' as TranslationKey) || 'Social';
      case 'Academic':
        return t('category_Academic' as TranslationKey) || 'Academic';
      case 'Free Food':
        return t('category_FreeFood' as TranslationKey) || 'Free Food';
      default:
        return category;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
            {event.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quick Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 p-2 rounded-lg">
                <PartyPopper className="h-5 w-5 text-mq-content-secondary" />
                <span className="text-sm font-medium text-mq-content-secondary">
                  {event.allDay ? 'All Day Event' : 'Event'}
                </span>
              </div>
            </div>

            <ItemActionButtons
              itemType="event"
              itemId={event.id}
              itemTitle={event.title}
              building={event.building}
              room={event.room}
              dateTime={event.startAt}
              onEdit={onEdit ? () => onEdit(event) : undefined}
              onDelete={onDelete ? () => onDelete(event) : undefined}
              variant="detail"
              stopPropagation={false}
            />
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Category */}
            <div className="p-3 rounded-lg bg-mq-background-secondary border border-mq-border">
              <div className="flex items-center gap-2 text-mq-content-secondary text-xs mb-1">
                <Tag className="h-3.5 w-3.5" />
                {t('category' as TranslationKey) || 'Category'}
              </div>
              <Badge className={cn(CATEGORY_COLORS[event.category], 'mt-0.5')}>
                {getCategoryLabel(event.category)}
              </Badge>
            </div>

            {/* Status */}
            <div className="p-3 rounded-lg bg-mq-background-secondary border border-mq-border">
              <div className="flex items-center gap-2 text-mq-content-secondary text-xs mb-1">
                <Clock className="h-3.5 w-3.5" />
                {t('status' as TranslationKey) || 'Status'}
              </div>
              <p
                className={cn(
                  'font-medium text-sm',
                  status === 'past' && 'text-mq-content-tertiary',
                  status === 'today' && 'text-emerald-600',
                  status === 'tomorrow' && 'text-amber-600',
                )}
              >
                {getTimeRemaining()}
              </p>
            </div>

            {/* Date */}
            <div className="p-3 rounded-lg bg-mq-background-secondary border border-mq-border">
              <div className="flex items-center gap-2 text-mq-content-secondary text-xs mb-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {t('date' as TranslationKey) || 'Date'}
              </div>
              <p className="font-medium text-sm">{format(eventDate, 'MMM d, yyyy')}</p>
              {!event.allDay && (
                <p className="text-xs text-mq-content-secondary">{format(eventDate, 'h:mm a')}</p>
              )}
            </div>

            {/* Location */}
            <div className="p-3 rounded-lg bg-mq-background-secondary border border-mq-border">
              <div className="flex items-center gap-2 text-mq-content-secondary text-xs mb-1">
                <MapPin className="h-3.5 w-3.5" />
                {t('location' as TranslationKey) || 'Location'}
              </div>
              <p className="font-medium text-sm">{locationDisplay || 'Not specified'}</p>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="p-4 rounded-lg border border-mq-border bg-mq-card-background">
              <p className="text-sm text-mq-content-secondary whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Navigate to Building */}
          {event.building && (
            <div className="p-4 rounded-lg border border-mq-border bg-mq-card-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-mq-content-secondary text-xs">
                  <MapPin className="h-3.5 w-3.5" />
                  Event Location
                </div>
                <Link href={`/map?building=${event.building.toLowerCase()}&autonav=true`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="p-1 inline-flex items-center justify-center hover:bg-mq-hover-background rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mq-background min-h-11 min-w-11"
                    aria-label={`Navigate to ${event.building} on campus map`}
                  >
                    <Navigation className="h-4 w-4 text-mq-content-secondary" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-4 h-4 rounded shrink-0" style={{ backgroundColor: color }} />
                <div>
                  <p className="font-semibold text-sm">{event.building}</p>
                  {event.room && (
                    <p className="text-xs text-mq-content-secondary">Room {event.room}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Created Info */}
          <div className="pt-2 border-t border-mq-border">
            <p className="text-xs text-mq-content-tertiary">
              {event.userId ? 'Personal Event' : 'Campus Event'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
