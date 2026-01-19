'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useGamificationStore, useStreak } from '@/lib/store/gamificationStore';

interface StreakIndicatorProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show the streak count text */
  showCount?: boolean;
  /** Show "day streak" label */
  showLabel?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Streak Indicator Component
 * Shows the user's current streak with fire icon
 */
export function StreakIndicator({
  size = 'md',
  showCount = true,
  showLabel = false,
  className,
}: StreakIndicatorProps) {
  const { loadProfile, hasLoaded, isLoading } = useGamificationStore();
  const { days, longest, emoji, isActive } = useStreak();

  useEffect(() => {
    if (!hasLoaded) {
      loadProfile();
    }
  }, [hasLoaded, loadProfile]);

  const sizeConfig = {
    sm: {
      icon: 'text-base',
      text: 'text-xs',
      container: 'gap-0.5',
    },
    md: {
      icon: 'text-xl',
      text: 'text-sm',
      container: 'gap-1',
    },
    lg: {
      icon: 'text-2xl',
      text: 'text-base',
      container: 'gap-1.5',
    },
  };

  const config = sizeConfig[size];

  if (isLoading && !hasLoaded) {
    return (
      <div className={cn('flex items-center', config.container, className)}>
        <div
          className={cn(config.icon, 'w-5 h-5 bg-mq-background-secondary rounded animate-pulse')}
        />
      </div>
    );
  }

  // Don't show if no streak
  if (days === 0) {
    return (
      <div className={cn('flex items-center', config.container, 'opacity-50', className)}>
        <span className={config.icon} role="img" aria-label="No streak">
          🔥
        </span>
        {showCount && (
          <span className={cn(config.text, 'text-mq-content-tertiary')}>Start a streak!</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center',
        config.container,
        isActive ? 'text-orange-500' : 'text-mq-content-tertiary',
        className,
      )}
      title={`${days} day streak (longest: ${longest})`}
    >
      {/* Fire Icon with optional milestone emoji */}
      <span
        className={cn(config.icon, 'transition-transform', isActive && 'animate-pulse')}
        role="img"
        aria-label={`${days} day streak`}
      >
        {emoji || ''}
      </span>

      {/* Streak Count */}
      {showCount && (
        <span className={cn(config.text, 'font-bold')}>
          {days}
          {showLabel && (
            <span className="font-normal text-mq-content-secondary ml-1">day streak</span>
          )}
        </span>
      )}
    </div>
  );
}

interface StreakBadgeProps {
  className?: string;
}

/**
 * Compact streak badge for profile headers
 */
export function StreakBadge({ className }: StreakBadgeProps) {
  const { days, isActive, longest } = useStreak();

  if (days === 0) return null;

  const streakTooltip = `${days} day streak! Complete tasks daily to keep it going. Your longest streak: ${longest} days.`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        isActive
          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
          : 'bg-mq-background-secondary text-mq-content-tertiary',
        className,
      )}
      title={streakTooltip}
      aria-label={streakTooltip}
    >
      <span role="img" aria-hidden="true">
        🔥
      </span>
      {days}
    </span>
  );
}

interface StreakCardProps {
  className?: string;
}

/**
 * Full streak card with more details
 */
export function StreakCard({ className }: StreakCardProps) {
  const { loadProfile, hasLoaded } = useGamificationStore();
  const { days, longest, isActive } = useStreak();

  useEffect(() => {
    if (!hasLoaded) {
      loadProfile();
    }
  }, [hasLoaded, loadProfile]);

  return (
    <div
      className={cn(
        'p-4 rounded-xl border',
        isActive
          ? 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800'
          : 'bg-mq-card-background border-mq-border',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl" role="img" aria-label="streak">
            🔥
          </span>
          <div>
            <div className="text-2xl font-bold text-mq-content">
              {days} {days === 1 ? 'Day' : 'Days'}
            </div>
            <div className="text-sm text-mq-content-secondary">
              {isActive ? 'Current Streak' : 'Streak Inactive'}
            </div>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="text-right">
          <div className="text-sm text-mq-content-tertiary">Best</div>
          <div className="text-lg font-semibold text-mq-content">{longest} days</div>
        </div>
      </div>

      {/* Motivation Message */}
      {!isActive && days > 0 && (
        <div className="mt-3 p-2 rounded-lg bg-mq-background-secondary text-sm text-mq-content-secondary">
          Complete a task to continue your streak!
        </div>
      )}
    </div>
  );
}
