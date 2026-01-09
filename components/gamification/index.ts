// Gamification Components
// Export all gamification UI components from a single entry point

export { XPProgressBar, XPProgressCompact } from './XPProgressBar';
export { LevelBadge, LevelBadgeInline } from './LevelBadge';
export { StreakIndicator, StreakBadge, StreakCard } from './StreakIndicator';
export { GamificationStats, XPIndicator } from './GamificationStats';

// Re-export store hooks for convenience
export {
  useGamificationStore,
  useXPProgress,
  useStreak,
  type GamificationProfile,
  type XPEvent,
} from '@/lib/store/gamificationStore';
