'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/mq/button';
import { Badge } from '@/components/ui/mq/badge';
import { cn } from '@/lib/utils';
import { PublicEvent } from '@/lib/types/publicEvents';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';

const categoryGradients: Record<string, string> = {
  Career: 'from-blue-600 to-blue-800',
  Social: 'from-purple-600 to-purple-800',
  Academic: 'from-emerald-600 to-emerald-800',
  'Free Food': 'from-amber-500 to-orange-600',
};

const categoryIcons: Record<string, string> = {
  Career: '💼',
  Social: '🎉',
  Academic: '📚',
  'Free Food': '🍕',
};

interface FeaturedEventsBannerProps {
  events: PublicEvent[];
  onEventClick: (event: PublicEvent) => void;
}

export const FeaturedEventsBanner = memo(({
  events,
  onEventClick,
}: FeaturedEventsBannerProps) => {
  const { t, language } = useTypedTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const getLocaleString = language === 'en' ? 'en-AU' : language;

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying || events.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, events.length]);

  const goToPrevious = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
  }, [events.length]);

  const goToNext = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % events.length);
  }, [events.length]);

  if (events.length === 0) return null;

  const currentEvent = events[currentIndex];

  return (
    <div className="relative mb-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
        <h2 className="text-xl font-bold text-mq-content">{t('featuredEvents') || 'Featured Events'}</h2>
        <Badge variant="secondary" className="ml-2 bg-mq-primary/10 text-mq-primary border-mq-primary/20">
          {events.length} {t('upcoming') || 'upcoming'}
        </Badge>
      </div>

      {/* Carousel Container */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        {/* Main Content */}
        <button
          onClick={() => onEventClick(currentEvent)}
          className={cn(
            'w-full text-left relative overflow-hidden bg-linear-to-r p-6 md:p-8 min-h-50 md:min-h-60 transition-all duration-500 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/50',
            categoryGradients[currentEvent.category]
          )}
        >
          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-2xl">
            {/* Category Badge */}
            <Badge className="mb-3 bg-white/20 text-white border-white/30 backdrop-blur-sm">
              <span className="mr-1">{categoryIcons[currentEvent.category]}</span>
              {currentEvent.category}
            </Badge>

            {/* Title */}
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 line-clamp-2">
              {currentEvent.title}
            </h3>

            {/* Description */}
            <p className="text-white/90 text-sm md:text-base mb-4 line-clamp-2 max-w-xl">
              {currentEvent.description}
            </p>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>
                  {currentEvent.startAt.toLocaleDateString(getLocaleString, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                {!currentEvent.allDay && (
                  <span>
                    {' • '}
                    {currentEvent.startAt.toLocaleTimeString(getLocaleString, {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span className="truncate max-w-50">{currentEvent.location}</span>
              </div>
            </div>
          </div>

          {/* Decorative Emoji */}
          <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 text-6xl md:text-8xl opacity-20 select-none">
            {categoryIcons[currentEvent.category]}
          </div>
        </button>

        {/* Navigation Arrows */}
        {events.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Dots Indicator */}
        {events.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {events.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAutoPlaying(false);
                  setCurrentIndex(index);
                }}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  index === currentIndex
                    ? 'bg-white w-6'
                    : 'bg-white/40 hover:bg-white/60'
                )}
                aria-label={`Go to event ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

FeaturedEventsBanner.displayName = 'FeaturedEventsBanner';

