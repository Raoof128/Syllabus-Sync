// tests/gamification/StreakIndicator.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  StreakIndicator,
  StreakBadge,
  StreakCard,
} from '@/components/gamification/StreakIndicator';

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
    };
    return typeof selector === 'function'
      ? (selector as (s: typeof state) => unknown)(state)
      : state;
  }),
  useStreak: vi.fn(() => ({
    days: 5,
    longest: 10,
    emoji: '🔥🔥',
    isActive: true,
  })),
}));

describe('StreakIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders streak with fire emoji', () => {
    render(<StreakIndicator />);

    const emoji = screen.getByRole('img', { name: '5 day streak' });
    expect(emoji).toBeInTheDocument();
  });

  it('displays streak count by default', () => {
    render(<StreakIndicator />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('hides streak count when showCount is false', () => {
    render(<StreakIndicator showCount={false} />);

    expect(screen.queryByText('5')).not.toBeInTheDocument();
  });

  it('shows day streak label when showLabel is true', () => {
    render(<StreakIndicator showLabel />);

    expect(screen.getByText('5 day streak')).toBeInTheDocument();
  });

  it('applies small size classes', () => {
    const { container } = render(<StreakIndicator size="sm" />);

    const emoji = container.querySelector('[role="img"]');
    expect(emoji).toHaveClass('text-base');
  });

  it('applies medium size classes', () => {
    const { container } = render(<StreakIndicator size="md" />);

    const emoji = container.querySelector('[role="img"]');
    expect(emoji).toHaveClass('text-xl');
  });

  it('applies large size classes', () => {
    const { container } = render(<StreakIndicator size="lg" />);

    const emoji = container.querySelector('[role="img"]');
    expect(emoji).toHaveClass('text-2xl');
  });

  it('applies custom className', () => {
    const { container } = render(<StreakIndicator className="custom-streak" />);

    expect(container.firstChild).toHaveClass('custom-streak');
  });

  it('shows title with streak info', () => {
    const { container } = render(<StreakIndicator />);

    const indicator = container.firstChild;
    expect(indicator).toHaveAttribute(
      'title',
      '5 day streak! Complete tasks daily to keep it going. Your longest streak: 10 days.',
    );
  });

  it('applies orange color when streak is active', () => {
    const { container } = render(<StreakIndicator />);

    expect(container.firstChild).toHaveClass('text-orange-500');
  });
});

describe('StreakIndicator - Zero Streak', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows start message when no streak', async () => {
    const { useStreak } = await import('@/lib/store/gamificationStore');
    vi.mocked(useStreak).mockReturnValue({
      days: 0,
      longest: 5,
      emoji: '',
      isActive: false,
    });

    render(<StreakIndicator />);

    expect(screen.getByText('Start a streak!')).toBeInTheDocument();
  });

  it('shows fire emoji with no streak aria label', async () => {
    const { useStreak } = await import('@/lib/store/gamificationStore');
    vi.mocked(useStreak).mockReturnValue({
      days: 0,
      longest: 5,
      emoji: '',
      isActive: false,
    });

    render(<StreakIndicator />);

    const emoji = screen.getByRole('img', { name: 'No streak' });
    expect(emoji).toBeInTheDocument();
  });

  it('applies opacity when no streak', async () => {
    const { useStreak } = await import('@/lib/store/gamificationStore');
    vi.mocked(useStreak).mockReturnValue({
      days: 0,
      longest: 5,
      emoji: '',
      isActive: false,
    });

    const { container } = render(<StreakIndicator />);

    expect(container.firstChild).toHaveClass('opacity-50');
  });
});

describe('StreakIndicator Loading State', () => {
  it('shows loading skeleton when loading', async () => {
    const { useGamificationStore } = await import('@/lib/store/gamificationStore');
    vi.mocked(useGamificationStore).mockImplementation((selector: unknown) => {
      const state = {
        profile: null,
        loadProfile: mockLoadProfile,
        hasLoaded: false,
        isLoading: true,
      };
      return typeof selector === 'function'
        ? (selector as (s: typeof state) => unknown)(state)
        : state;
    });

    const { container } = render(<StreakIndicator />);

    const skeleton = container.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });
});

describe('StreakBadge', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset mock to default state for badge tests
    const { useStreak } = await import('@/lib/store/gamificationStore');
    vi.mocked(useStreak).mockReturnValue({
      days: 5,
      longest: 10,
      emoji: '🔥🔥',
      isActive: true,
    });
  });

  it('renders streak badge with count', () => {
    render(<StreakBadge />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('includes fire emoji', () => {
    render(<StreakBadge />);

    const emoji = screen.getByRole('img', { hidden: true });
    expect(emoji).toHaveTextContent('🔥');
  });

  it('applies active styling when streak is active', () => {
    render(<StreakBadge />);

    const badge = screen.getByText('5').closest('span');
    expect(badge).toHaveClass('bg-orange-100', 'text-orange-600');
  });

  it('applies custom className', () => {
    render(<StreakBadge className="custom-badge" />);

    const badge = screen.getByText('5').closest('span');
    expect(badge).toHaveClass('custom-badge');
  });

  it('returns null when no streak', async () => {
    const { useStreak } = await import('@/lib/store/gamificationStore');
    vi.mocked(useStreak).mockReturnValue({
      days: 0,
      longest: 5,
      emoji: '',
      isActive: false,
    });

    const { container } = render(<StreakBadge />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe('StreakCard', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset mocks for card tests
    const { useGamificationStore, useStreak } = await import('@/lib/store/gamificationStore');
    vi.mocked(useGamificationStore).mockImplementation((selector: unknown) => {
      const state = {
        profile: mockProfile,
        loadProfile: mockLoadProfile,
        hasLoaded: true,
        isLoading: false,
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

  it('renders streak card with days count', () => {
    render(<StreakCard />);

    expect(screen.getByText('5 Days')).toBeInTheDocument();
  });

  it('shows current streak label when active', () => {
    render(<StreakCard />);

    expect(screen.getByText('Current Streak')).toBeInTheDocument();
  });

  it('displays longest streak', () => {
    render(<StreakCard />);

    expect(screen.getByText('Best')).toBeInTheDocument();
    expect(screen.getByText('10 days')).toBeInTheDocument();
  });

  it('applies active gradient styling', () => {
    const { container } = render(<StreakCard />);

    expect(container.firstChild).toHaveClass('from-orange-50', 'border-orange-200');
  });

  it('applies custom className', () => {
    const { container } = render(<StreakCard className="custom-card" />);

    expect(container.firstChild).toHaveClass('custom-card');
  });

  it('shows singular day for 1 day streak', async () => {
    const { useStreak } = await import('@/lib/store/gamificationStore');
    vi.mocked(useStreak).mockReturnValue({
      days: 1,
      longest: 5,
      emoji: '🔥',
      isActive: true,
    });

    render(<StreakCard />);

    expect(screen.getByText('1 Day')).toBeInTheDocument();
  });

  it('shows motivation message when streak is inactive but has days', async () => {
    const { useStreak } = await import('@/lib/store/gamificationStore');
    vi.mocked(useStreak).mockReturnValue({
      days: 3,
      longest: 5,
      emoji: '🔥',
      isActive: false,
    });

    render(<StreakCard />);

    expect(screen.getByText('Streak Inactive')).toBeInTheDocument();
    expect(screen.getByText('Complete a task to continue your streak!')).toBeInTheDocument();
  });
});
