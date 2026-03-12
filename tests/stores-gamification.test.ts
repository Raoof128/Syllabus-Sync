/**
 * Gamification Store Tests
 * Tests the gamificationStore actions, computed helpers, level titles, and streak emojis
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGamificationStore, useXPProgress, useStreak } from '@/lib/store/gamificationStore';
import { DEFAULT_GAMIFICATION_SETTINGS } from '@/lib/types';
import { renderHook } from '@testing-library/react';

vi.mock('@/lib/utils/api', () => ({
  apiRequest: vi.fn(),
}));

const { apiRequest } = await import('@/lib/utils/api');
const apiRequestMock = apiRequest as unknown as ReturnType<typeof vi.fn>;

describe('gamificationStore', () => {
  beforeEach(() => {
    useGamificationStore.getState().reset();
    apiRequestMock.mockReset();
  });

  it('should initialize with default state', () => {
    const state = useGamificationStore.getState();
    expect(state.profile).toBeNull();
    expect(state.recentEvents).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.hasLoaded).toBe(false);
    expect(state.isDemo).toBe(false);
    expect(state.error).toBeNull();
    expect(state.settings).toEqual(DEFAULT_GAMIFICATION_SETTINGS);
  });

  it('should load profile from API', async () => {
    const mockProfile = {
      xp: 100,
      level: 3,
      streakDays: 5,
      longestStreak: 10,
      lastActivityDate: '2026-03-12',
      xpToNextLevel: 50,
      xpForCurrentLevel: 75,
      levelProgress: 67,
    };

    apiRequestMock.mockResolvedValueOnce({
      profile: mockProfile,
      events: [
        {
          id: '1',
          eventType: 'daily_login',
          xpAmount: 10,
          referenceId: null,
          metadata: {},
          createdAt: '2026-03-12',
        },
      ],
      isDemo: false,
    });

    await useGamificationStore.getState().loadProfile(true);

    const state = useGamificationStore.getState();
    expect(state.profile).toEqual(mockProfile);
    expect(state.recentEvents).toHaveLength(1);
    expect(state.isDemo).toBe(false);
    expect(state.hasLoaded).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('should fall back to default profile on error', async () => {
    apiRequestMock.mockRejectedValueOnce(new Error('Network error'));

    await useGamificationStore.getState().loadProfile();

    const state = useGamificationStore.getState();
    expect(state.profile).not.toBeNull();
    expect(state.profile!.xp).toBe(0);
    expect(state.profile!.level).toBe(1);
    expect(state.isDemo).toBe(true);
    expect(state.hasLoaded).toBe(true);
    expect(state.error).toBe('Network error');
  });

  it('should not reload if already loaded', async () => {
    useGamificationStore.setState({
      hasLoaded: true,
      profile: {
        xp: 50,
        level: 2,
        streakDays: 0,
        longestStreak: 0,
        lastActivityDate: null,
        xpToNextLevel: 25,
        xpForCurrentLevel: 25,
        levelProgress: 50,
      },
    });

    await useGamificationStore.getState().loadProfile();
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it('should record activity for non-demo users', async () => {
    useGamificationStore.setState({ isDemo: false });
    apiRequestMock.mockResolvedValueOnce({
      message: 'ok',
      profile: {
        xp: 60,
        level: 2,
        streakDays: 1,
        longestStreak: 1,
        lastActivityDate: '2026-03-13',
        xpToNextLevel: 40,
        xpForCurrentLevel: 25,
        levelProgress: 33,
      },
    });

    await useGamificationStore.getState().recordActivity();
    expect(apiRequestMock).toHaveBeenCalledWith('/api/gamification', { method: 'POST' });
  });

  it('should not record activity for demo users', async () => {
    useGamificationStore.setState({ isDemo: true });
    await useGamificationStore.getState().recordActivity();
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it('should refresh profile by resetting hasLoaded', async () => {
    useGamificationStore.setState({ hasLoaded: true, profile: null });

    apiRequestMock.mockResolvedValueOnce({
      profile: {
        xp: 0,
        level: 1,
        streakDays: 0,
        longestStreak: 0,
        lastActivityDate: null,
        xpToNextLevel: 25,
        xpForCurrentLevel: 0,
        levelProgress: 0,
      },
      events: [],
      isDemo: true,
    });

    await useGamificationStore.getState().refreshProfile();
    expect(apiRequestMock).toHaveBeenCalled();
    expect(useGamificationStore.getState().hasLoaded).toBe(true);
  });

  it('should update settings', () => {
    useGamificationStore.getState().updateSettings({ showXPNotifications: false });
    expect(useGamificationStore.getState().settings.showXPNotifications).toBe(false);
    expect(useGamificationStore.getState().settings.showLevelUpNotifications).toBe(true);
  });

  it('should reset settings to defaults', () => {
    useGamificationStore
      .getState()
      .updateSettings({ showXPNotifications: false, showStreakReminders: false });
    useGamificationStore.getState().resetSettings();
    expect(useGamificationStore.getState().settings).toEqual(DEFAULT_GAMIFICATION_SETTINGS);
  });

  it('should reset progress', () => {
    useGamificationStore.setState({
      profile: {
        xp: 500,
        level: 10,
        streakDays: 30,
        longestStreak: 30,
        lastActivityDate: '2026-01-01',
        xpToNextLevel: 100,
        xpForCurrentLevel: 400,
        levelProgress: 80,
      },
      recentEvents: [
        {
          id: '1',
          eventType: 'daily_login',
          xpAmount: 10,
          referenceId: null,
          metadata: {},
          createdAt: '2026-01-01',
        },
      ],
    });

    useGamificationStore.getState().resetProgress();
    const state = useGamificationStore.getState();
    expect(state.profile!.xp).toBe(0);
    expect(state.profile!.level).toBe(1);
    expect(state.profile!.streakDays).toBe(0);
    expect(state.recentEvents).toHaveLength(0);
  });

  describe('getLevelTitle', () => {
    it('returns Student when no profile', () => {
      expect(useGamificationStore.getState().getLevelTitle()).toBe('Student');
    });

    it('returns Freshman for level 1', () => {
      useGamificationStore.setState({
        profile: {
          xp: 0,
          level: 1,
          streakDays: 0,
          longestStreak: 0,
          lastActivityDate: null,
          xpToNextLevel: 25,
          xpForCurrentLevel: 0,
          levelProgress: 0,
        },
      });
      expect(useGamificationStore.getState().getLevelTitle()).toBe('Freshman');
    });

    it('returns Academic Elite for level 9', () => {
      useGamificationStore.setState({
        profile: {
          xp: 0,
          level: 9,
          streakDays: 0,
          longestStreak: 0,
          lastActivityDate: null,
          xpToNextLevel: 25,
          xpForCurrentLevel: 0,
          levelProgress: 0,
        },
      });
      expect(useGamificationStore.getState().getLevelTitle()).toBe('Academic Elite');
    });

    it('returns Academic Veteran for levels 11-20', () => {
      useGamificationStore.setState({
        profile: {
          xp: 0,
          level: 15,
          streakDays: 0,
          longestStreak: 0,
          lastActivityDate: null,
          xpToNextLevel: 25,
          xpForCurrentLevel: 0,
          levelProgress: 0,
        },
      });
      expect(useGamificationStore.getState().getLevelTitle()).toBe('Academic Veteran');
    });

    it('returns Grand Scholar for levels 76+', () => {
      useGamificationStore.setState({
        profile: {
          xp: 0,
          level: 80,
          streakDays: 0,
          longestStreak: 0,
          lastActivityDate: null,
          xpToNextLevel: 25,
          xpForCurrentLevel: 0,
          levelProgress: 0,
        },
      });
      expect(useGamificationStore.getState().getLevelTitle()).toBe('Grand Scholar');
    });
  });

  describe('getStreakEmoji', () => {
    it('returns empty string when no profile', () => {
      expect(useGamificationStore.getState().getStreakEmoji()).toBe('');
    });

    it('returns empty for 0 days', () => {
      useGamificationStore.setState({
        profile: {
          xp: 0,
          level: 1,
          streakDays: 0,
          longestStreak: 0,
          lastActivityDate: null,
          xpToNextLevel: 25,
          xpForCurrentLevel: 0,
          levelProgress: 0,
        },
      });
      expect(useGamificationStore.getState().getStreakEmoji()).toBe('');
    });

    it('returns single fire for 1-2 days', () => {
      useGamificationStore.setState({
        profile: {
          xp: 0,
          level: 1,
          streakDays: 2,
          longestStreak: 2,
          lastActivityDate: null,
          xpToNextLevel: 25,
          xpForCurrentLevel: 0,
          levelProgress: 0,
        },
      });
      expect(useGamificationStore.getState().getStreakEmoji()).toBe('🔥');
    });

    it('returns double fire for 3-6 days', () => {
      useGamificationStore.setState({
        profile: {
          xp: 0,
          level: 1,
          streakDays: 5,
          longestStreak: 5,
          lastActivityDate: null,
          xpToNextLevel: 25,
          xpForCurrentLevel: 0,
          levelProgress: 0,
        },
      });
      expect(useGamificationStore.getState().getStreakEmoji()).toBe('🔥🔥');
    });

    it('returns triple fire for 7-13 days', () => {
      useGamificationStore.setState({
        profile: {
          xp: 0,
          level: 1,
          streakDays: 10,
          longestStreak: 10,
          lastActivityDate: null,
          xpToNextLevel: 25,
          xpForCurrentLevel: 0,
          levelProgress: 0,
        },
      });
      expect(useGamificationStore.getState().getStreakEmoji()).toBe('🔥🔥🔥');
    });

    it('returns lightning+fire for 14-29 days', () => {
      useGamificationStore.setState({
        profile: {
          xp: 0,
          level: 1,
          streakDays: 20,
          longestStreak: 20,
          lastActivityDate: null,
          xpToNextLevel: 25,
          xpForCurrentLevel: 0,
          levelProgress: 0,
        },
      });
      expect(useGamificationStore.getState().getStreakEmoji()).toBe('⚡🔥');
    });

    it('returns diamond for 30-59 days', () => {
      useGamificationStore.setState({
        profile: {
          xp: 0,
          level: 1,
          streakDays: 45,
          longestStreak: 45,
          lastActivityDate: null,
          xpToNextLevel: 25,
          xpForCurrentLevel: 0,
          levelProgress: 0,
        },
      });
      expect(useGamificationStore.getState().getStreakEmoji()).toBe('💎🔥');
    });

    it('returns crown for 60+ days', () => {
      useGamificationStore.setState({
        profile: {
          xp: 0,
          level: 1,
          streakDays: 100,
          longestStreak: 100,
          lastActivityDate: null,
          xpToNextLevel: 25,
          xpForCurrentLevel: 0,
          levelProgress: 0,
        },
      });
      expect(useGamificationStore.getState().getStreakEmoji()).toBe('👑🔥');
    });
  });
});

describe('useXPProgress hook', () => {
  beforeEach(() => {
    useGamificationStore.getState().reset();
  });

  it('returns defaults when no profile', () => {
    const { result } = renderHook(() => useXPProgress());
    expect(result.current.currentXP).toBe(0);
    expect(result.current.level).toBe(1);
    expect(result.current.progress).toBe(0);
    expect(result.current.xpToNext).toBe(25);
  });

  it('returns correct progress with profile', () => {
    useGamificationStore.setState({
      profile: {
        xp: 100,
        level: 3,
        streakDays: 0,
        longestStreak: 0,
        lastActivityDate: null,
        xpToNextLevel: 50,
        xpForCurrentLevel: 75,
        levelProgress: 33,
      },
    });

    const { result } = renderHook(() => useXPProgress());
    expect(result.current.currentXP).toBe(100);
    expect(result.current.level).toBe(3);
    expect(result.current.progress).toBe(33);
    expect(result.current.xpToNext).toBe(50);
    expect(result.current.xpInLevel).toBe(25); // 100 - 75
  });
});

describe('useStreak hook', () => {
  beforeEach(() => {
    useGamificationStore.getState().reset();
  });

  it('returns defaults when no profile', () => {
    const { result } = renderHook(() => useStreak());
    expect(result.current.days).toBe(0);
    expect(result.current.longest).toBe(0);
    expect(result.current.emoji).toBe('');
    expect(result.current.isActive).toBe(false);
  });

  it('returns active streak info', () => {
    useGamificationStore.setState({
      profile: {
        xp: 100,
        level: 3,
        streakDays: 5,
        longestStreak: 10,
        lastActivityDate: '2026-03-13',
        xpToNextLevel: 50,
        xpForCurrentLevel: 75,
        levelProgress: 33,
      },
    });

    const { result } = renderHook(() => useStreak());
    expect(result.current.days).toBe(5);
    expect(result.current.longest).toBe(10);
    expect(result.current.isActive).toBe(true);
    expect(result.current.emoji).toBe('🔥🔥');
  });
});
