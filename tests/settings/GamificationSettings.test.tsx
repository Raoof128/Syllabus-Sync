// tests/settings/GamificationSettings.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GamificationSettings from '@/features/settings/components/GamificationSettings';

// Mock toast utils
vi.mock('@/lib/utils/toast', () => ({
  toastUtils: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock gamification store
const mockProfile = {
  xp: 150,
  level: 3,
  streakDays: 5,
  longestStreak: 10,
  lastActivityDate: '2026-01-09',
  xpToNextLevel: 50,
  xpForCurrentLevel: 100,
  levelProgress: 50,
};

const mockSettings = {
  showXPNotifications: true,
  showLevelUpNotifications: true,
  showStreakReminders: false,
  displayOnProfile: true,
};

const mockUpdateSettings = vi.fn();
const mockGetLevelTitle = vi.fn(() => 'Rising Star');
const mockGetStreakEmoji = vi.fn(() => '🔥🔥');

vi.mock('@/lib/store/gamificationStore', () => ({
  useGamificationStore: vi.fn((selector) => {
    const state = {
      profile: mockProfile,
      settings: mockSettings,
      updateSettings: mockUpdateSettings,
      getLevelTitle: mockGetLevelTitle,
      getStreakEmoji: mockGetStreakEmoji,
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

// Mock getLevelTier from types
vi.mock('@/lib/types', () => ({
  getLevelTier: vi.fn(() => 'bronze'),
  DEFAULT_GAMIFICATION_SETTINGS: {
    showXPNotifications: true,
    showLevelUpNotifications: true,
    showStreakReminders: true,
    displayOnProfile: true,
  },
}));

describe('GamificationSettings', () => {
  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      gamification: 'Gamification',
      yourProgress: 'Your Progress',
      level: 'Level',
      totalXP: 'Total XP',
      currentStreak: 'Current Streak',
      longestStreak: 'Longest Streak',
      day: 'day',
      showXPNotifications: 'XP Notifications',
      showXPNotificationsDesc: 'Get notified when you earn XP',
      showLevelUpNotifications: 'Level Up Notifications',
      showLevelUpNotificationsDesc: 'Celebrate when you reach a new level',
      showStreakReminders: 'Streak Reminders',
      showStreakRemindersDesc: 'Remind me to maintain my streak',
      displayOnProfile: 'Display on Profile',
      displayOnProfileDesc: 'Show gamification stats on your profile',
      resetProgress: 'Reset Progress',
      resetProgressDesc: 'Clear all XP and start fresh',
      resetProgressConfirm:
        'Are you sure? This will reset all your XP, level, and streak data. This cannot be undone.',
      progressReset: 'Progress Reset',
      progressResetMsg: 'Your gamification progress has been reset.',
      preferenceUpdated: 'Preference Updated',
      enabled: 'Enabled',
      disabled: 'Disabled',
      cancel: 'Cancel',
      reset: 'Reset',
    };
    return translations[key] || key;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders gamification settings card', () => {
    render(<GamificationSettings t={mockT} />);

    expect(screen.getByTestId('gamification-settings')).toBeInTheDocument();
    expect(screen.getByText('Gamification')).toBeInTheDocument();
  });

  it('displays user progress stats', () => {
    render(<GamificationSettings t={mockT} />);

    expect(screen.getByText('Your Progress')).toBeInTheDocument();
    expect(screen.getByText('3 - Rising Star')).toBeInTheDocument();
    expect(screen.getByText('150 XP')).toBeInTheDocument();
  });

  it('displays streak information', () => {
    render(<GamificationSettings t={mockT} />);

    expect(screen.getByText('Current Streak')).toBeInTheDocument();
    expect(screen.getByText('Longest Streak')).toBeInTheDocument();
  });

  it('renders all setting toggles', () => {
    render(<GamificationSettings t={mockT} />);

    expect(screen.getByTestId('toggle-xp-notifications')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-levelup-notifications')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-streak-reminders')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-display-profile')).toBeInTheDocument();
  });

  it('shows correct toggle states', () => {
    render(<GamificationSettings t={mockT} />);

    const xpToggle = screen.getByTestId('toggle-xp-notifications');
    const streakToggle = screen.getByTestId('toggle-streak-reminders');

    expect(xpToggle).toHaveAttribute('aria-checked', 'true');
    expect(streakToggle).toHaveAttribute('aria-checked', 'false');
  });

  it('calls updateSettings when toggle is clicked', () => {
    render(<GamificationSettings t={mockT} />);

    fireEvent.click(screen.getByTestId('toggle-xp-notifications'));
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      showXPNotifications: false,
    });
  });

  it('renders reset progress button', () => {
    render(<GamificationSettings t={mockT} />);

    expect(screen.getByTestId('reset-progress-button')).toBeInTheDocument();
    expect(screen.getByText('Reset Progress')).toBeInTheDocument();
  });

  it('opens reset confirmation dialog when reset button is clicked', () => {
    render(<GamificationSettings t={mockT} />);

    fireEvent.click(screen.getByTestId('reset-progress-button'));

    // Dialog should be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('dialog').querySelector('[data-slot="dialog-description"]'),
    ).toHaveTextContent(
      'Are you sure? This will reset all your XP, level, and streak data. This cannot be undone.',
    );
  });

  it('closes dialog when cancel is clicked', () => {
    render(<GamificationSettings t={mockT} />);

    // Open dialog
    fireEvent.click(screen.getByTestId('reset-progress-button'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click cancel
    fireEvent.click(screen.getByText('Cancel'));

    // Dialog should be closed (not in document)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<GamificationSettings t={mockT} />);

    const region = screen.getByRole('region', { name: 'Gamification' });
    expect(region).toBeInTheDocument();

    // Check aria-checked attributes on toggles
    const xpToggle = screen.getByTestId('toggle-xp-notifications');
    expect(xpToggle).toHaveAttribute('aria-checked');
  });
});
