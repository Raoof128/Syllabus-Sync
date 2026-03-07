'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useGamificationStore } from '@/lib/store/gamificationStore';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';

interface LevelBadgeProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show the level title (e.g., "Dedicated Scholar") */
  showTitle?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Level Badge Component
 * Displays the user's current commitment title with optional numeric tier
 */
export function LevelBadge({ size = 'md', showTitle = false, className }: LevelBadgeProps) {
  const { t } = useTypedTranslation();
  const { profile, loadProfile, hasLoaded, isLoading, getLevelTitle } = useGamificationStore();

  useEffect(() => {
    if (!hasLoaded) {
      loadProfile();
    }
  }, [hasLoaded, loadProfile]);

  const level = profile?.level ?? 1;
  const title = getLevelTitle();

  const sizeConfig = {
    sm: {
      badge: 'w-6 h-6 text-xs',
      title: 'text-xs',
      container: 'gap-1',
    },
    md: {
      badge: 'w-8 h-8 text-sm',
      title: 'text-sm',
      container: 'gap-1.5',
    },
    lg: {
      badge: 'w-10 h-10 text-base',
      title: 'text-base',
      container: 'gap-2',
    },
    xl: {
      badge: 'w-14 h-14 text-xl',
      title: 'text-lg',
      container: 'gap-3',
    },
  };

  const config = sizeConfig[size];

  // Color gradient based on level
  const levelGradient = getLevelGradient(level);

  if (isLoading && !hasLoaded) {
    return (
      <div className={cn('flex items-center', config.container, className)}>
        <div
          className={cn(config.badge, 'rounded-full bg-mq-background-secondary animate-pulse')}
        />
        {showTitle && <div className="h-4 w-20 bg-mq-background-secondary rounded animate-pulse" />}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center', config.container, className)}>
      {/* Level Circle */}
      <div
        className={cn(
          config.badge,
          'rounded-full flex items-center justify-center font-bold text-white shadow-md',
          'transition-transform hover:scale-105',
          levelGradient,
        )}
        title={`${t('level')} ${level}: ${title}`}
        role="img"
        aria-label={`${t('level')} ${level}: ${title}`}
      >
        {level}
      </div>

      {/* Optional Title */}
      {showTitle && (
        <div className="flex flex-col">
          <span className={cn(config.title, 'font-semibold text-mq-content')}>{title}</span>
          <span className="text-xs text-mq-content-secondary">
            {t('level')} {level}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Get gradient class based on level tier
 */
function getLevelGradient(level: number): string {
  if (level <= 5) {
    // Bronze tier (1-5)
    return 'bg-gradient-to-br from-amber-600 to-amber-800';
  }
  if (level <= 10) {
    // Silver tier (6-10)
    return 'bg-gradient-to-br from-gray-400 to-gray-600';
  }
  if (level <= 20) {
    // Gold tier (11-20)
    return 'bg-gradient-to-br from-yellow-400 to-amber-600';
  }
  if (level <= 35) {
    // Platinum tier (21-35)
    return 'bg-gradient-to-br from-cyan-400 to-blue-600';
  }
  if (level <= 50) {
    // Diamond tier (36-50)
    return 'bg-gradient-to-br from-purple-400 to-indigo-600';
  }
  // Master tier (51+)
  return 'bg-gradient-to-br from-rose-500 to-red-700';
}

interface LevelBadgeInlineProps {
  className?: string;
}

/**
 * Inline level badge for use in text or compact areas
 */
export function LevelBadgeInline({ className }: LevelBadgeInlineProps) {
  const profile = useGamificationStore((state) => state.profile);
  const level = profile?.level ?? 1;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'px-1.5 py-0.5 rounded text-xs font-bold',
        'bg-mq-primary text-white',
        className,
      )}
      title={`Level ${level}`}
      aria-label={`Level ${level}`}
    >
      Lv.{level}
    </span>
  );
}
