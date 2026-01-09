// tests/gamification/GamificationStats.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GamificationStats, XPIndicator } from '@/components/gamification/GamificationStats';

// Mock the gamification store
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

const mockLoadProfile = vi.fn();

vi.mock('@/lib/store/gamificationStore', () => ({
  useGamificationStore: vi.fn((selector: unknown) => {
    const state = {
      profile: mockProfile,
      loadProfile: mockLoadProfile,
      hasLoaded: true,
      isLoading: false,
      isDemo: false,
      getLevelTitle: vi.fn(() => 'Rising Star'),
    };
    return typeof selector === 'function'
      ? (selector as (s: typeof state) => unknown)(state)
      : state;
  }),
  useXPProgress: vi.fn(() => ({
    currentXP: 150,
    level: 3,
    progress: 50,
    xpToNext: 50,
    xpInLevel: 50,
    xpNeededForLevel: 100,
  })),
  useStreak: vi.fn(() => ({
    days: 5,
    longest: 10,
    emoji: '🔥🔥',
    isActive: true,
  })),
}));

// Mock the child components
vi.mock('@/components/gamification/LevelBadge', () => ({
  LevelBadge: ({ size, showTitle }: { size?: string; showTitle?: boolean }) => (
    <div data-testid="level-badge" data-size={size} data-show-title={showTitle}>
      Level 3
    </div>
  ),
}));

vi.mock('@/components/gamification/XPProgressBar', () => ({
  XPProgressBar: ({ size, showNumbers }: { size?: string; showNumbers?: boolean }) => (
    <div data-testid="xp-progress-bar" data-size={size} data-show-numbers={showNumbers}>
      XP Progress
    </div>
  ),
}));

vi.mock('@/components/gamification/StreakIndicator', () => ({
  StreakBadge: () => <div data-testid="streak-badge">5 🔥</div>,
}));

describe('GamificationStats - Compact Variant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders compact variant by default', () => {
    render(<GamificationStats />);

    expect(screen.getByTestId('level-badge')).toBeInTheDocument();
  });

  it('shows streak badge when streak > 0 and showStreak is true', () => {
    render(<GamificationStats showStreak />);

    expect(screen.getByTestId('streak-badge')).toBeInTheDocument();
  });

  it('hides streak badge when showStreak is false', () => {
    render(<GamificationStats showStreak={false} />);

    expect(screen.queryByTestId('streak-badge')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<GamificationStats className="custom-stats" />);

    expect(container.firstChild).toHaveClass('custom-stats');
  });

  it('shows demo indicator when in demo mode', async () => {
    const { useGamificationStore } = await import('@/lib/store/gamificationStore');
    vi.mocked(useGamificationStore).mockImplementation((selector: unknown) => {
      const state = {
        profile: mockProfile,
        loadProfile: mockLoadProfile,
        hasLoaded: true,
        isLoading: false,
        isDemo: true,
        getLevelTitle: vi.fn(() => 'Rising Star'),
      };
      return typeof selector === 'function'
        ? (selector as (s: typeof state) => unknown)(state)
        : state;
    });

    render(<GamificationStats />);

    expect(screen.getByText('Demo')).toBeInTheDocument();
  });
});

describe('GamificationStats - Full Variant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders full variant with all elements', () => {
    render(<GamificationStats variant="full" />);

    expect(screen.getByTestId('level-badge')).toBeInTheDocument();
    expect(screen.getByTestId('xp-progress-bar')).toBeInTheDocument();
  });

  it('shows level badge with title in full variant', () => {
    render(<GamificationStats variant="full" />);

    const levelBadge = screen.getByTestId('level-badge');
    expect(levelBadge).toHaveAttribute('data-show-title', 'true');
  });

  it('shows streak count with days label', () => {
    render(<GamificationStats variant="full" />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('days')).toBeInTheDocument();
  });

  it('hides progress bar when showProgress is false', () => {
    render(<GamificationStats variant="full" showProgress={false} />);

    expect(screen.queryByTestId('xp-progress-bar')).not.toBeInTheDocument();
  });

  it('shows sign in message when in demo mode', async () => {
    const { useGamificationStore } = await import('@/lib/store/gamificationStore');
    vi.mocked(useGamificationStore).mockImplementation((selector: unknown) => {
      const state = {
        profile: mockProfile,
        loadProfile: mockLoadProfile,
        hasLoaded: true,
        isLoading: false,
        isDemo: true,
        getLevelTitle: vi.fn(() => 'Rising Star'),
      };
      return typeof selector === 'function'
        ? (selector as (s: typeof state) => unknown)(state)
        : state;
    });

    render(<GamificationStats variant="full" />);

    expect(screen.getByText('Sign in to track your real progress')).toBeInTheDocument();
  });
});

describe('GamificationStats - Card Variant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders card variant with header', () => {
    render(<GamificationStats variant="card" />);

    expect(screen.getByText('Your Progress')).toBeInTheDocument();
  });

  it('shows large level badge in card variant', () => {
    render(<GamificationStats variant="card" />);

    const levelBadge = screen.getByTestId('level-badge');
    expect(levelBadge).toHaveAttribute('data-size', 'lg');
  });

  it('displays XP count and progress info', () => {
    render(<GamificationStats variant="card" />);

    // Use getAllByText for XP Progress since both the label and mock component have it
    expect(screen.getAllByText('XP Progress').length).toBeGreaterThan(0);
    expect(screen.getByText('150 XP')).toBeInTheDocument();
    expect(screen.getByText('50 XP to Level 4')).toBeInTheDocument();
  });

  it('shows streak count with fire emoji', () => {
    render(<GamificationStats variant="card" />);

    const streakEmoji = screen.getByRole('img', { name: 'streak' });
    expect(streakEmoji).toBeInTheDocument();
    expect(screen.getByText('day streak')).toBeInTheDocument();
  });

  it('shows demo mode indicator in card variant', async () => {
    const { useGamificationStore } = await import('@/lib/store/gamificationStore');
    vi.mocked(useGamificationStore).mockImplementation((selector: unknown) => {
      const state = {
        profile: mockProfile,
        loadProfile: mockLoadProfile,
        hasLoaded: true,
        isLoading: false,
        isDemo: true,
        getLevelTitle: vi.fn(() => 'Rising Star'),
      };
      return typeof selector === 'function'
        ? (selector as (s: typeof state) => unknown)(state)
        : state;
    });

    render(<GamificationStats variant="card" />);

    expect(screen.getByText('Demo Mode')).toBeInTheDocument();
  });

  it('applies card styling', () => {
    const { container } = render(<GamificationStats variant="card" />);

    expect(container.firstChild).toHaveClass('p-4', 'rounded-xl', 'border');
  });
});

describe('GamificationStats - Loading State', () => {
  it('shows loading skeleton when loading', async () => {
    const { useGamificationStore } = await import('@/lib/store/gamificationStore');
    vi.mocked(useGamificationStore).mockImplementation((selector: unknown) => {
      const state = {
        profile: null,
        loadProfile: mockLoadProfile,
        hasLoaded: false,
        isLoading: true,
        isDemo: false,
        getLevelTitle: vi.fn(() => 'Student'),
      };
      return typeof selector === 'function'
        ? (selector as (s: typeof state) => unknown)(state)
        : state;
    });

    const { container } = render(<GamificationStats />);

    expect(container.firstChild).toHaveClass('animate-pulse');
  });
});

describe('XPIndicator', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset mocks for XPIndicator tests
    const { useGamificationStore, useStreak } = await import('@/lib/store/gamificationStore');
    vi.mocked(useGamificationStore).mockImplementation((selector: unknown) => {
      const state = {
        profile: mockProfile,
        loadProfile: mockLoadProfile,
        hasLoaded: true,
        isLoading: false,
        isDemo: false,
        getLevelTitle: vi.fn(() => 'Rising Star'),
      };
      return typeof selector === 'function'
        ? (selector as (s: typeof state) => unknown)(state)
        : state;
    });
    vi.mocked(useStreak).mockReturnValue({
      days: 5,
      longest: 10,
      emoji: '🔥🔥',
      isActive: true,
    });
  });

  it('renders level in circular badge', () => {
    render(<XPIndicator />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows streak count when streak > 0', () => {
    render(<XPIndicator />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('has title with streak info', () => {
    render(<XPIndicator />);

    const streakText = screen.getByText('5');
    expect(streakText).toHaveAttribute('title', '5 day streak');
  });

  it('applies custom className', () => {
    const { container } = render(<XPIndicator className="custom-indicator" />);

    expect(container.firstChild).toHaveClass('custom-indicator');
  });

  it('hides streak when days is 0', async () => {
    const { useStreak } = await import('@/lib/store/gamificationStore');
    vi.mocked(useStreak).mockReturnValue({
      days: 0,
      longest: 5,
      emoji: '',
      isActive: false,
    });

    const { container } = render(<XPIndicator />);

    // Should only show level, not streak
    const texts = container.querySelectorAll('span');
    expect(texts.length).toBe(1);
  });
});

describe('GamificationStats - Streak Hidden When Zero', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides streak badge in compact variant when days is 0', async () => {
    const { useStreak } = await import('@/lib/store/gamificationStore');
    vi.mocked(useStreak).mockReturnValue({
      days: 0,
      longest: 5,
      emoji: '',
      isActive: false,
    });

    render(<GamificationStats variant="compact" showStreak />);

    // Streak badge should not be present when days is 0
    expect(screen.queryByTestId('streak-badge')).not.toBeInTheDocument();
  });

  it('hides streak in full variant when days is 0', async () => {
    const { useStreak } = await import('@/lib/store/gamificationStore');
    vi.mocked(useStreak).mockReturnValue({
      days: 0,
      longest: 5,
      emoji: '',
      isActive: false,
    });

    render(<GamificationStats variant="full" showStreak />);

    // The streak fire emoji section should not show the streak count
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
