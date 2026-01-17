'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useGamificationStore, useXPProgress, useStreak } from '@/lib/store/gamificationStore';
import { LevelBadge } from './LevelBadge';
import { XPProgressBar } from './XPProgressBar';
import { StreakBadge } from './StreakIndicator';

type LevelColors = {
  pillGradientStyle: string;
  ringClass: string;
  ringColor: string;
  trackBgStyle: string;
  trackBorderStyle: string;
  fillGradientStyle: string;
};

function getLevelColors(level: number): LevelColors {
  if (level <= 5) {
    return {
      pillGradientStyle: 'linear-gradient(90deg, #f59e0b, #b45309)',
      ringClass: 'ring-amber-500/60',
      ringColor: '#f59e0b',
      trackBgStyle: 'rgba(245, 158, 11, 0.18)',
      trackBorderStyle: 'rgba(245, 158, 11, 0.35)',
      fillGradientStyle: 'linear-gradient(90deg, #fff7ed, #fef3c7, #fff7ed)',
    };
  }
  if (level <= 10) {
    return {
      pillGradientStyle: 'linear-gradient(90deg, #cbd5e1, #475569)',
      ringClass: 'ring-slate-400/60',
      ringColor: '#cbd5e1',
      trackBgStyle: 'rgba(203, 213, 225, 0.18)',
      trackBorderStyle: 'rgba(203, 213, 225, 0.35)',
      fillGradientStyle: 'linear-gradient(90deg, #ffffff, #f8fafc, #ffffff)',
    };
  }
  if (level <= 20) {
    return {
      pillGradientStyle: 'linear-gradient(90deg, #facc15, #d97706)',
      ringClass: 'ring-amber-400/60',
      ringColor: '#facc15',
      trackBgStyle: 'rgba(250, 204, 21, 0.18)',
      trackBorderStyle: 'rgba(250, 204, 21, 0.35)',
      fillGradientStyle: 'linear-gradient(90deg, #fefce8, #fef3c7, #fefce8)',
    };
  }
  if (level <= 35) {
    return {
      pillGradientStyle: 'linear-gradient(90deg, #22d3ee, #2563eb)',
      ringClass: 'ring-cyan-400/60',
      ringColor: '#22d3ee',
      trackBgStyle: 'rgba(34, 211, 238, 0.16)',
      trackBorderStyle: 'rgba(34, 211, 238, 0.3)',
      fillGradientStyle: 'linear-gradient(90deg, #f8fdff, #ecfeff, #f8fdff)',
    };
  }
  if (level <= 50) {
    return {
      pillGradientStyle: 'linear-gradient(90deg, #c084fc, #4f46e5)',
      ringClass: 'ring-purple-400/60',
      ringColor: '#c084fc',
      trackBgStyle: 'rgba(192, 132, 252, 0.16)',
      trackBorderStyle: 'rgba(192, 132, 252, 0.3)',
      fillGradientStyle: 'linear-gradient(90deg, #fbf7ff, #f5f3ff, #fbf7ff)',
    };
  }
  return {
    pillGradientStyle: 'linear-gradient(90deg, #f43f5e, #b91c1c)',
    ringClass: 'ring-rose-500/60',
    ringColor: '#f43f5e',
    trackBgStyle: 'rgba(244, 63, 94, 0.16)',
    trackBorderStyle: 'rgba(244, 63, 94, 0.3)',
    fillGradientStyle: 'linear-gradient(90deg, #fff5f7, #ffe4e6, #fff5f7)',
  };
}

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
  const { currentXP, level, xpToNext, progress } = useXPProgress();
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
    const rawProgress = Math.min(100, Math.max(0, Math.round((progress ?? 0) * 100)));
    // Ensure a visible sliver for low progress without exceeding 100%
    const progressPercent = rawProgress <= 0 ? 0 : Math.min(100, Math.max(rawProgress, 18));
    const levelAriaLabel = `Level ${level}, ${currentXP} XP, ${xpToNext} XP to next level`;
    const levelColors = getLevelColors(level);

    return (
      <div className={cn('flex items-center gap-3', className)}>
        <span
          className={cn(
            'relative inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-md ring-2',
            levelColors.ringClass,
          )}
          style={{
            background: levelColors.pillGradientStyle,
            boxShadow: `0 0 0 2px ${levelColors.ringColor}`,
          }}
          aria-label={levelAriaLabel}
          data-testid="level-badge"
        >
          Level {level}
          <span
            className={cn('h-2 w-12 rounded-full overflow-hidden shadow-inner border')}
            style={{
              background: levelColors.trackBgStyle,
              borderColor: levelColors.trackBorderStyle,
            }}
            aria-hidden="true"
          >
            <span
              className={cn(
                'block h-full transition-[width] duration-300 shadow-[0_0_10px_rgba(255,255,255,0.75)]',
              )}
              style={{
                width: `${progressPercent}%`,
                background: levelColors.fillGradientStyle,
              }}
              aria-hidden="true"
            />
          </span>
        </span>
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
