'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/mq/button';
import { Badge } from '@/components/ui/mq/badge';
import { Calendar, Clock, MapPin, Plus, Check, Navigation, Loader2, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PublicEvent } from '@/lib/types/publicEvents';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import { buildings } from '@/features/map/lib/buildings';

const categoryStyles: Record<string, { gradient: string; icon: string }> = {
  Career: { gradient: 'from-blue-500 to-blue-700', icon: '💼' },
  Social: { gradient: 'from-purple-500 to-purple-700', icon: '🎉' },
  Academic: { gradient: 'from-emerald-500 to-emerald-700', icon: '📚' },
  'Free Food': { gradient: 'from-amber-500 to-orange-600', icon: '🍕' },
};

interface EventDetailModalProps {
  event: PublicEvent | null;
  isOpen: boolean;
  onClose: () => void;
  isAdded: boolean;
  isAdding: boolean;
  onAddToCalendar: () => void;
  locale?: string;
}

export const EventDetailModal = memo(
  ({
    event,
    isOpen,
    onClose,
    isAdded,
    isAdding,
    onAddToCalendar,
    locale = 'en-AU',
  }: EventDetailModalProps) => {
    const { t } = useTypedTranslation();

    if (!event) return null;

    const style = categoryStyles[event.category] || categoryStyles.Academic;

    // Find building details
    const buildingInfo = event.building ? buildings.find((b) => b.id === event.building) : null;

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString(locale, {
        hour: 'numeric',
        minute: '2-digit',
      });
    };

    const formatFullDate = (date: Date) => {
      return date.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
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
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          {/* Header with Gradient */}
          <div className={cn('relative bg-linear-to-br p-6 pb-8', style.gradient)}>
            {/* Decorative Elements */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full" />
            </div>

            {/* Category Badge */}
            <Badge className="mb-3 bg-white/20 text-white border-white/30 backdrop-blur-sm">
              <span className="mr-1.5">{style.icon}</span>
              {event.category}
            </Badge>

            {/* Title */}
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white pr-8">
                {event.title}
              </DialogTitle>
            </DialogHeader>

            {/* Large Emoji */}
            <div className="absolute bottom-4 right-4 text-5xl opacity-30 select-none">
              {style.icon}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Description */}
            <div>
              <h4 className="text-sm font-semibold text-mq-content-tertiary uppercase tracking-wide mb-2">
                {t('description') || 'Description'}
              </h4>
              <p className="text-mq-content leading-relaxed">{event.description}</p>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-mq-background-secondary">
                <div className="p-2 rounded-lg bg-mq-primary/10 text-mq-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-mq-content-tertiary font-medium uppercase">
                    {t('date') || 'Date'}
                  </p>
                  <p className="text-sm font-semibold text-mq-content">
                    {formatFullDate(event.startAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-mq-background-secondary">
                <div className="p-2 rounded-lg bg-mq-primary/10 text-mq-primary">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-mq-content-tertiary font-medium uppercase">
                    {t('time') || 'Time'}
                  </p>
                  <p className="text-sm font-semibold text-mq-content">{getTimeRange()}</p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-mq-background-secondary">
              <div className="p-2 rounded-lg bg-mq-primary/10 text-mq-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-mq-content-tertiary font-medium uppercase mb-1">
                  {t('location') || 'Location'}
                </p>
                <p className="text-sm font-semibold text-mq-content mb-1">{event.location}</p>
                {buildingInfo && (
                  <div className="flex items-center gap-2 text-xs text-mq-content-secondary">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{buildingInfo.name}</span>
                    {event.room && <span>• Room {event.room}</span>}
                  </div>
                )}
              </div>
              {event.building && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-mq-primary hover:bg-mq-primary/10"
                >
                  <Link
                    href={`/map?building=${encodeURIComponent(event.building)}${event.room ? `&room=${encodeURIComponent(event.room)}` : ''}&autonav=true`}
                  >
                    <Navigation className="h-4 w-4 mr-1.5" />
                    {t('navigate') || 'Navigate'}
                  </Link>
                </Button>
              )}
            </div>

            {/* Add to Calendar Action */}
            <div className="pt-2 border-t border-mq-border">
              <Button
                onClick={onAddToCalendar}
                disabled={isAdding || isAdded}
                size="lg"
                className={cn(
                  'w-full gap-2 transition-all',
                  isAdded
                    ? 'bg-emerald-600 hover:bg-emerald-600 border-emerald-600'
                    : 'bg-mq-primary hover:bg-mq-primary-dark',
                )}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t('adding') || 'Adding...'}
                  </>
                ) : isAdded ? (
                  <>
                    <Check className="h-5 w-5" />
                    {t('addedToCalendar') || 'Added to Your Calendar'}
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    {t('addToMyCalendar') || 'Add to My Calendar'}
                  </>
                )}
              </Button>

              {isAdded && (
                <p className="text-xs text-mq-content-tertiary text-center mt-2">
                  {t('eventAddedInfo') ||
                    'This event has been added to your personal calendar. You can view it in the Calendar tab.'}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  },
);

EventDetailModal.displayName = 'EventDetailModal';
