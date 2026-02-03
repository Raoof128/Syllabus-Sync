'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

interface EventCardSkeletonProps {
  className?: string;
}

export const EventCardSkeleton = memo(({
  className,
}: EventCardSkeletonProps) => {
  return (
    <div
      className={cn(
        'flex flex-col h-full bg-mq-card-background rounded-2xl border border-mq-border overflow-hidden',
        className
      )}
    >
      {/* Category Strip */}
      <div className="h-1.5 bg-mq-background-secondary animate-pulse" />

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Category Badge */}
        <div className="h-6 w-20 bg-mq-background-secondary rounded-lg animate-pulse mb-3" />

        {/* Title */}
        <div className="h-6 w-3/4 bg-mq-background-secondary rounded-lg animate-pulse mb-2" />

        {/* Description */}
        <div className="space-y-2 mb-4 flex-1">
          <div className="h-4 bg-mq-background-secondary rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-mq-background-secondary rounded animate-pulse" />
        </div>

        {/* Metadata */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-mq-background-secondary rounded animate-pulse" />
            <div className="h-4 w-24 bg-mq-background-secondary rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-mq-background-secondary rounded animate-pulse" />
            <div className="h-4 w-20 bg-mq-background-secondary rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-mq-background-secondary rounded animate-pulse" />
            <div className="h-4 w-32 bg-mq-background-secondary rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-mq-border bg-mq-background-secondary/30">
        <div className="h-9 bg-mq-background-secondary rounded-lg animate-pulse" />
      </div>
    </div>
  );
});

EventCardSkeleton.displayName = 'EventCardSkeleton';

export const FeaturedBannerSkeleton = memo(() => {
  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-5 w-5 bg-mq-background-secondary rounded animate-pulse" />
        <div className="h-6 w-40 bg-mq-background-secondary rounded animate-pulse" />
      </div>

      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-mq-background-secondary to-mq-background-secondary/50 p-6 md:p-8 min-h-50 md:min-h-60">
        {/* Badge */}
        <div className="h-6 w-24 bg-white/10 rounded-full animate-pulse mb-3" />

        {/* Title */}
        <div className="h-8 w-2/3 bg-white/10 rounded-lg animate-pulse mb-3" />

        {/* Description */}
        <div className="space-y-2 mb-4 max-w-xl">
          <div className="h-4 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse" />
        </div>

        {/* Meta */}
        <div className="flex gap-4">
          <div className="h-5 w-24 bg-white/10 rounded animate-pulse" />
          <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
        </div>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          <div className="w-6 h-2 bg-white/20 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-white/20 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-white/20 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
});

FeaturedBannerSkeleton.displayName = 'FeaturedBannerSkeleton';

export const FeedSkeletons = memo(() => {
  return (
    <>
      <FeaturedBannerSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
});

FeedSkeletons.displayName = 'FeedSkeletons';

