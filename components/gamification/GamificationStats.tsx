'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useGamificationStore, useXPProgress, useStreak } from '@/lib/store/gamificationStore';
import { LevelBadge } from './LevelBadge';
import { XPProgressBar } from './XPProgressBar';
import { StreakBadge } from './StreakIndicator';

interface GamificationStatsProps {
  /** Display variant */
  variant?: 'compact' | 'full' | 'card';
  /** Show XP progress bar */
  showProgress?: boolean;
  /** Show streak info */
  showStreak?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * GamificationStats Component
 * A flexible component to display user's gamification stats
 * Can be used in headers, profile cards, or as a standalone card
 */
export function GamificationStats({
  variant = 'compact',
  showProgress = true,
  showStreak = true,
  className,
}: GamificationStatsProps) {
  const { loadProfile, hasLoaded, isLoading, isDemo } = useGamificationStore();
  const { currentXP, level, xpToNext } = useXPProgress();
  const { days } = useStreak();

  // Load profile on mount
  useEffect(() => {
    if (!hasLoaded) {
      loadProfile();
    }
  }, [hasLoaded, loadProfile]);

  if (isLoading && !hasLoaded) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-mq-background-secondary rounded-full" />
          <div className="w-20 h-4 bg-mq-background-secondary rounded" />
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <LevelBadge size="sm" />
        {showStreak && days > 0 && <StreakBadge />}
        {isDemo && (
          <span className="text-xs text-mq-content-tertiary bg-mq-background-secondary px-1.5 py-0.5 rounded">
            Demo
          </span>
        )}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={cn('space-y-3', className)}>
        {/* Level and XP Row */}
        <div className="flex items-center justify-between">
          <LevelBadge size="md" showTitle />
          {showStreak && days > 0 && (
            <div className="flex items-center gap-1 text-orange-500">
              <span role="img" aria-label="streak">
                🔥
              </span>
              <span className="font-bold">{days}</span>
              <span className="text-sm text-mq-content-secondary">day{days !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* XP Progress */}
        {showProgress && <XPProgressBar size="md" showNumbers />}

        {/* Demo indicator */}
        {isDemo && (
          <p className="text-xs text-mq-content-tertiary text-center">
            Sign in to track your real progress
          </p>
        )}
      </div>
    );
  }

  // Card variant
  return (
    <div className={cn('p-4 rounded-xl border bg-mq-card-background border-mq-border', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-mq-content">Your Progress</h3>
          {isDemo && (
            <span className="text-xs text-mq-content-tertiary bg-mq-background-secondary px-2 py-1 rounded">
              Demo Mode
            </span>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between">
          <LevelBadge size="lg" showTitle />
          {showStreak && (
            <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                <span className="text-2xl" role="img" aria-label="streak">
                  🔥
                </span>
                <span className="text-2xl font-bold text-mq-content">{days}</span>
              </div>
              <span className="text-xs text-mq-content-secondary">day streak</span>
            </div>
          )}
        </div>

        {/* XP Progress */}
        {showProgress && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-mq-content-secondary">XP Progress</span>
              <span className="text-mq-content font-medium">{currentXP.toLocaleString()} XP</span>
            </div>
            <XPProgressBar size="lg" showNumbers={false} />
            <p className="text-xs text-mq-content-tertiary mt-1 text-right">
              {xpToNext.toLocaleString()} XP to Level {level + 1}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Minimal XP indicator for navbar/headers
 */
export function XPIndicator({ className }: { className?: string }) {
  const { profile, loadProfile, hasLoaded } = useGamificationStore();
  const { days } = useStreak();

  useEffect(() => {
    if (!hasLoaded) {
      loadProfile(false); // Don't load events for minimal indicator
    }
  }, [hasLoaded, loadProfile]);

  const level = profile?.level ?? 1;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Level */}
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-mq-primary text-white text-xs font-bold">
        {level}
      </span>

      {/* Streak (only if active) */}
      {days > 0 && (
        <span className="text-orange-500 text-sm" title={`${days} day streak`}>
          {days}
        </span>
      )}
    </div>
  );
}
