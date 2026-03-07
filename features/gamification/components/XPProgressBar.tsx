'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useGamificationStore, useXPProgress } from '@/lib/store/gamificationStore';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';

interface XPProgressBarProps {
  /** Show the XP numbers (e.g., "120 / 250 XP") */
  showNumbers?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
  /** Animate on mount */
  animate?: boolean;
}

/**
 * XP Progress Bar Component
 * Displays the user's XP progress toward the next level
 */
export function XPProgressBar({
  showNumbers = true,
  size = 'md',
  className,
  animate = true,
}: XPProgressBarProps) {
  const { t } = useTypedTranslation();
  const { loadProfile, hasLoaded, isLoading } = useGamificationStore();
  const { level, progress, xpToNext, xpInLevel, xpNeededForLevel } = useXPProgress();

  // Load profile on mount
  useEffect(() => {
    if (!hasLoaded) {
      loadProfile();
    }
  }, [hasLoaded, loadProfile]);

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (isLoading && !hasLoaded) {
    return (
      <div className={cn('space-y-1', className)}>
        <div
          className={cn(
            'w-full bg-mq-background-secondary rounded-full overflow-hidden',
            sizeClasses[size],
          )}
        >
          <div className="h-full w-1/3 bg-mq-content-tertiary/30 animate-pulse rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {/* Progress Bar */}
      <div
        className={cn(
          'w-full bg-mq-background-secondary rounded-full overflow-hidden',
          sizeClasses[size],
        )}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('levelProgressAria' as TranslationKey, { level, progress })}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            'bg-gradient-to-r from-mq-primary to-mq-success',
            animate && 'animate-in slide-in-from-left',
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* XP Numbers */}
      {showNumbers && (
        <div className={cn('flex justify-between items-center', textSizeClasses[size])}>
          <span className="text-mq-content-secondary font-medium">
            {xpInLevel.toLocaleString()} / {xpNeededForLevel.toLocaleString()} XP
          </span>
          <span className="text-mq-content-tertiary">
            {t('xpToLevelShort' as TranslationKey, {
              xp: xpToNext.toLocaleString(),
              nextLevel: level + 1,
            })}
          </span>
        </div>
      )}
    </div>
  );
}

interface XPProgressCompactProps {
  className?: string;
}

/**
 * Compact XP display for tight spaces (e.g., navbar, mobile)
 */
export function XPProgressCompact({ className }: XPProgressCompactProps) {
  const { t } = useTypedTranslation();
  const { loadProfile, hasLoaded } = useGamificationStore();
  const { currentXP, level, progress } = useXPProgress();

  useEffect(() => {
    if (!hasLoaded) {
      loadProfile();
    }
  }, [hasLoaded, loadProfile]);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Level Badge */}
      <span className="text-xs font-bold text-mq-primary">
        {t('lvShort' as TranslationKey)}
        {level}
      </span>

      {/* Mini Progress Bar */}
      <div className="flex-1 min-w-[60px] h-1.5 bg-mq-background-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-mq-primary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* XP Count */}
      <span className="text-xs text-mq-content-tertiary font-mono">
        {currentXP.toLocaleString()}
      </span>
    </div>
  );
}
