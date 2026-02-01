'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useGamificationStore, useStreak } from '@/lib/store/gamificationStore';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';

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
  const { t } = useTypedTranslation();
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
        <span className={config.icon} role="img" aria-label={t('noStreak')}>
          🔥
        </span>
        {showCount && (
          <span className={cn(config.text, 'text-mq-content-tertiary')}>{t('startStreak')}</span>
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
      title={t('streakDayTooltip', { count: days, longest })}
    >
      {/* Fire Icon with optional milestone emoji */}
      <span
        className={cn(config.icon, 'transition-transform', isActive && 'animate-pulse')}
        role="img"
        aria-label={t('streakDay', { count: days })}
      >
        {emoji || ''}
      </span>

      {/* Streak Count */}
      {showCount && (
        <span className={cn(config.text, 'font-bold')}>
          {days}
          {showLabel && (
            <span className="font-normal text-mq-content-secondary ml-1">
              {t('streakDay', { count: days })}
            </span>
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
  const { t } = useTypedTranslation();
  const { days, isActive, longest } = useStreak();

  if (days === 0) return null;

  const streakTooltip = t('streakDayTooltip', { count: days, longest });

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold shadow-md',
        isActive
          ? 'bg-linear-to-r from-orange-400 to-amber-500 text-white'
          : 'bg-mq-background-secondary text-mq-content-tertiary',
        className,
      )}
      title={streakTooltip}
      aria-label={streakTooltip}
    >
      <span role="img" aria-hidden="true" className="text-sm">
        🔥
      </span>
      <span className="tabular-nums">{days}</span>
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
  const { t } = useTypedTranslation();
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
          <span className="text-3xl" role="img" aria-label={t('streakDay', { count: days })}>
            🔥
          </span>
          <div>
            <div className="text-2xl font-bold text-mq-content">
              {days} {days === 1 ? t('streakCardTitle_one') : t('streakCardTitle_other')}
            </div>
            <div className="text-sm text-mq-content-secondary">
              {isActive ? t('streakActive') : t('streakInactive')}
            </div>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="text-right">
          <div className="text-sm text-mq-content-tertiary">{t('streakBest')}</div>
          <div className="text-lg font-semibold text-mq-content">
            {longest} {t('days')}
          </div>
        </div>
      </div>

      {/* Motivation Message */}
      {!isActive && days > 0 && (
        <div className="mt-3 p-2 rounded-lg bg-mq-background-secondary text-sm text-mq-content-secondary">
          {t('streakMotivation')}
        </div>
      )}
    </div>
  );
}
