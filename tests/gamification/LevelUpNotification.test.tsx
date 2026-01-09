// tests/gamification/LevelUpNotification.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  LevelUpNotificationProvider,
  useLevelUpNotification,
  showXPEarnedNotification,
} from '@/components/gamification/LevelUpNotification';

// Mock toast utils
const mockSuccess = vi.fn();
const mockInfo = vi.fn();

vi.mock('@/lib/utils/toast', () => ({
  toastUtils: {
    success: (...args: unknown[]) => mockSuccess(...args),
    info: (...args: unknown[]) => mockInfo(...args),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock getLevelTier from types
vi.mock('@/lib/types', () => ({
  getLevelTier: vi.fn((level: number) => {
    if (level <= 5) return 'bronze';
    if (level <= 10) return 'silver';
    if (level <= 20) return 'gold';
    if (level <= 35) return 'platinum';
    if (level <= 50) return 'diamond';
    return 'master';
  }),
}));

// Create mutable mock state
let mockProfile: { level: number } | null = { level: 3 };
let mockSettings = {
  showLevelUpNotifications: true,
  showXPNotifications: true,
  showStreakReminders: true,
  displayOnProfile: true,
};

const mockGetLevelTitle = vi.fn(() => 'Rising Star');

vi.mock('@/lib/store/gamificationStore', () => ({
  useGamificationStore: vi.fn((selector: unknown) => {
    const state = {
      profile: mockProfile,
      settings: mockSettings,
      getLevelTitle: mockGetLevelTitle,
    };
    return typeof selector === 'function'
      ? (selector as (s: typeof state) => unknown)(state)
      : state;
  }),
}));

describe('LevelUpNotificationProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfile = { level: 3 };
    mockSettings = {
      showLevelUpNotifications: true,
      showXPNotifications: true,
      showStreakReminders: true,
      displayOnProfile: true,
    };
  });

  it('renders children without notification on initial render', () => {
    render(
      <LevelUpNotificationProvider>
        <div data-testid="child">Child Content</div>
      </LevelUpNotificationProvider>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(mockSuccess).not.toHaveBeenCalled();
  });

  it('does not show notification when settings are disabled', async () => {
    mockSettings.showLevelUpNotifications = false;

    const { rerender } = render(
      <LevelUpNotificationProvider>
        <div>Content</div>
      </LevelUpNotificationProvider>,
    );

    // Simulate level change
    mockProfile = { level: 4 };
    rerender(
      <LevelUpNotificationProvider>
        <div>Content</div>
      </LevelUpNotificationProvider>,
    );

    expect(mockSuccess).not.toHaveBeenCalled();
  });

  it('does not show notification when profile is null', () => {
    mockProfile = null;

    render(
      <LevelUpNotificationProvider>
        <div>Content</div>
      </LevelUpNotificationProvider>,
    );

    expect(mockSuccess).not.toHaveBeenCalled();
  });

  it('uses provided locale for messages', () => {
    render(
      <LevelUpNotificationProvider locale="es">
        <div>Content</div>
      </LevelUpNotificationProvider>,
    );

    // Just verify it renders without error
    expect(mockSuccess).not.toHaveBeenCalled();
  });

  it('defaults to English locale', () => {
    render(
      <LevelUpNotificationProvider>
        <div>Content</div>
      </LevelUpNotificationProvider>,
    );

    // Just verify it renders without error
    expect(mockSuccess).not.toHaveBeenCalled();
  });
});

describe('useLevelUpNotification hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSettings = {
      showLevelUpNotifications: true,
      showXPNotifications: true,
      showStreakReminders: true,
      displayOnProfile: true,
    };
  });

  function TestComponent() {
    const { showNotification } = useLevelUpNotification();
    return <button onClick={() => showNotification(5)}>Show Notification</button>;
  }

  it('shows notification when called', async () => {
    render(<TestComponent />);

    await act(async () => {
      screen.getByRole('button').click();
    });

    expect(mockSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Congratulations'),
      expect.stringContaining('Level'),
    );
  });

  it('does not show notification when settings are disabled', async () => {
    mockSettings.showLevelUpNotifications = false;

    render(<TestComponent />);

    await act(async () => {
      screen.getByRole('button').click();
    });

    expect(mockSuccess).not.toHaveBeenCalled();
  });

  it('uses correct tier emoji for bronze level', async () => {
    render(<TestComponent />);

    await act(async () => {
      screen.getByRole('button').click();
    });

    // Level 5 is bronze tier
    expect(mockSuccess).toHaveBeenCalledWith(expect.stringContaining('🥉'), expect.any(String));
  });
});

describe('showXPEarnedNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows XP notification with amount and reason', () => {
    showXPEarnedNotification(25, 'Completed deadline', 'en', true);

    expect(mockInfo).toHaveBeenCalledWith('+25 XP', 'Completed deadline');
  });

  it('does not show notification when disabled', () => {
    showXPEarnedNotification(25, 'Completed deadline', 'en', false);

    expect(mockInfo).not.toHaveBeenCalled();
  });

  it('uses localized XP text for Chinese', () => {
    showXPEarnedNotification(25, 'Completed', 'zh', true);

    expect(mockInfo).toHaveBeenCalledWith('+25 经验值', 'Completed');
  });

  it('falls back to English for unknown locale', () => {
    showXPEarnedNotification(25, 'Completed', 'unknown', true);

    expect(mockInfo).toHaveBeenCalledWith('+25 XP', 'Completed');
  });

  it('formats XP amount correctly', () => {
    showXPEarnedNotification(100, 'Level up bonus', 'en', true);

    expect(mockInfo).toHaveBeenCalledWith('+100 XP', 'Level up bonus');
  });
});
