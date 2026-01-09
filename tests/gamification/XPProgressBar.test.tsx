// tests/gamification/XPProgressBar.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { XPProgressBar, XPProgressCompact } from '@/components/gamification/XPProgressBar';

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
  useXPProgress: vi.fn(() => ({
    currentXP: 150,
    level: 3,
    progress: 50,
    xpToNext: 50,
    xpInLevel: 50,
    xpNeededForLevel: 100,
  })),
}));

describe('XPProgressBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders progress bar with correct ARIA attributes', () => {
    render(<XPProgressBar />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute('aria-valuenow', '50');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    expect(progressbar).toHaveAttribute('aria-label', 'Level 3 progress: 50%');
  });

  it('displays XP numbers by default', () => {
    render(<XPProgressBar />);

    expect(screen.getByText('50 / 100 XP')).toBeInTheDocument();
    expect(screen.getByText('50 to Lv. 4')).toBeInTheDocument();
  });

  it('hides XP numbers when showNumbers is false', () => {
    render(<XPProgressBar showNumbers={false} />);

    expect(screen.queryByText('50 / 100 XP')).not.toBeInTheDocument();
    expect(screen.queryByText('50 to Lv. 4')).not.toBeInTheDocument();
  });

  it('applies small size classes', () => {
    const { container } = render(<XPProgressBar size="sm" />);

    const progressContainer = container.querySelector('[role="progressbar"]');
    expect(progressContainer).toHaveClass('h-1.5');
  });

  it('applies medium size classes', () => {
    const { container } = render(<XPProgressBar size="md" />);

    const progressContainer = container.querySelector('[role="progressbar"]');
    expect(progressContainer).toHaveClass('h-2.5');
  });

  it('applies large size classes', () => {
    const { container } = render(<XPProgressBar size="lg" />);

    const progressContainer = container.querySelector('[role="progressbar"]');
    expect(progressContainer).toHaveClass('h-4');
  });

  it('applies custom className', () => {
    const { container } = render(<XPProgressBar className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows animation classes when animate is true', () => {
    const { container } = render(<XPProgressBar animate />);

    const progressFill = container.querySelector('[role="progressbar"] > div');
    expect(progressFill).toHaveClass('animate-in');
  });
});

describe('XPProgressBar Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton when loading and not loaded', async () => {
    // Override mock for loading state
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

    const { container } = render(<XPProgressBar />);

    // Should show skeleton loading animation
    const skeleton = container.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });
});

describe('XPProgressCompact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders compact level display', () => {
    render(<XPProgressCompact />);

    expect(screen.getByText('Lv.3')).toBeInTheDocument();
  });

  it('displays current XP count', () => {
    render(<XPProgressCompact />);

    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('includes mini progress bar', () => {
    const { container } = render(<XPProgressCompact />);

    // Mini progress bar has specific classes
    const miniBar = container.querySelector('.min-w-\\[60px\\]');
    expect(miniBar).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<XPProgressCompact className="custom-compact" />);

    expect(container.firstChild).toHaveClass('custom-compact');
  });
});
