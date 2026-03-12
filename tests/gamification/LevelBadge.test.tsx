// tests/gamification/LevelBadge.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LevelBadge, LevelBadgeInline } from '@/features/gamification/components/LevelBadge';

// Mock useTypedTranslation so t() returns English level titles
const levelTitleTranslations: Record<string, string> = {
  level: 'Level',
  gamification_level_1: 'Freshman',
  gamification_level_2: 'Eager Learner',
  gamification_level_3: 'Rising Star',
  gamification_level_4: 'Dedicated Scholar',
  gamification_level_5: 'Academic Achiever',
  gamification_level_6: 'Knowledge Seeker',
  gamification_level_7: 'Study Champion',
  gamification_level_8: "Dean's Lister",
  gamification_level_9: 'Academic Elite',
  gamification_level_10: 'Scholarly Master',
  gamification_level_veteran: 'Academic Veteran',
  gamification_level_expert: 'Knowledge Expert',
  gamification_level_legend: 'Scholarly Legend',
  gamification_level_titan: 'Academic Titan',
  gamification_level_grand: 'Grand Scholar',
};

vi.mock('@/lib/hooks/useTypedTranslation', () => ({
  useTypedTranslation: () => ({
    t: (key: string) => levelTitleTranslations[key] || key,
  }),
}));

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
const mockGetLevelTitle = vi.fn(() => 'Rising Star');

vi.mock('@/lib/store/gamificationStore', () => ({
  useGamificationStore: vi.fn((selector: unknown) => {
    const state = {
      profile: mockProfile,
      loadProfile: mockLoadProfile,
      hasLoaded: true,
      isLoading: false,
      getLevelTitle: mockGetLevelTitle,
    };
    return typeof selector === 'function'
      ? (selector as (s: typeof state) => unknown)(state)
      : state;
  }),
}));

describe('LevelBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders level number', () => {
    render(<LevelBadge />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows level with title attribute', () => {
    render(<LevelBadge />);

    const badge = screen.getByTitle('Level 3: Rising Star');
    expect(badge).toBeInTheDocument();
  });

  it('shows title text when showTitle is true', () => {
    render(<LevelBadge showTitle />);

    expect(screen.getByText('Rising Star')).toBeInTheDocument();
    expect(screen.getByText('Level 3')).toBeInTheDocument();
  });

  it('hides title text when showTitle is false', () => {
    render(<LevelBadge showTitle={false} />);

    expect(screen.queryByText('Rising Star')).not.toBeInTheDocument();
  });

  it('applies small size classes', () => {
    const { container } = render(<LevelBadge size="sm" />);

    const badge = container.querySelector('[title]');
    expect(badge).toHaveClass('w-6', 'h-6');
  });

  it('applies medium size classes', () => {
    const { container } = render(<LevelBadge size="md" />);

    const badge = container.querySelector('[title]');
    expect(badge).toHaveClass('w-8', 'h-8');
  });

  it('applies large size classes', () => {
    const { container } = render(<LevelBadge size="lg" />);

    const badge = container.querySelector('[title]');
    expect(badge).toHaveClass('w-10', 'h-10');
  });

  it('applies extra-large size classes', () => {
    const { container } = render(<LevelBadge size="xl" />);

    const badge = container.querySelector('[title]');
    expect(badge).toHaveClass('w-14', 'h-14');
  });

  it('applies custom className', () => {
    const { container } = render(<LevelBadge className="custom-badge" />);

    expect(container.firstChild).toHaveClass('custom-badge');
  });

  it('applies bronze gradient for levels 1-5', () => {
    render(<LevelBadge />);

    const badge = screen.getByTitle('Level 3: Rising Star');
    expect(badge).toHaveClass('from-amber-600', 'to-amber-800');
  });
});

describe('LevelBadge - Different Level Tiers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies silver gradient for levels 6-10', async () => {
    const { useGamificationStore } = await import('@/lib/store/gamificationStore');
    vi.mocked(useGamificationStore).mockImplementation((selector: unknown) => {
      const state = {
        profile: { ...mockProfile, level: 7 },
        loadProfile: mockLoadProfile,
        hasLoaded: true,
        isLoading: false,
        getLevelTitle: vi.fn(() => 'Study Champion'),
      };
      return typeof selector === 'function'
        ? (selector as (s: typeof state) => unknown)(state)
        : state;
    });

    render(<LevelBadge />);

    const badge = screen.getByTitle('Level 7: Study Champion');
    expect(badge).toHaveClass('from-gray-400', 'to-gray-600');
  });

  it('applies gold gradient for levels 11-20', async () => {
    const { useGamificationStore } = await import('@/lib/store/gamificationStore');
    vi.mocked(useGamificationStore).mockImplementation((selector: unknown) => {
      const state = {
        profile: { ...mockProfile, level: 15 },
        loadProfile: mockLoadProfile,
        hasLoaded: true,
        isLoading: false,
        getLevelTitle: vi.fn(() => 'Academic Veteran'),
      };
      return typeof selector === 'function'
        ? (selector as (s: typeof state) => unknown)(state)
        : state;
    });

    render(<LevelBadge />);

    const badge = screen.getByTitle('Level 15: Academic Veteran');
    expect(badge).toHaveClass('from-yellow-400', 'to-amber-600');
  });

  it('applies platinum gradient for levels 21-35', async () => {
    const { useGamificationStore } = await import('@/lib/store/gamificationStore');
    vi.mocked(useGamificationStore).mockImplementation((selector: unknown) => {
      const state = {
        profile: { ...mockProfile, level: 25 },
        loadProfile: mockLoadProfile,
        hasLoaded: true,
        isLoading: false,
        getLevelTitle: vi.fn(() => 'Knowledge Expert'),
      };
      return typeof selector === 'function'
        ? (selector as (s: typeof state) => unknown)(state)
        : state;
    });

    render(<LevelBadge />);

    const badge = screen.getByTitle('Level 25: Knowledge Expert');
    expect(badge).toHaveClass('from-cyan-400', 'to-blue-600');
  });

  it('applies diamond gradient for levels 36-50', async () => {
    const { useGamificationStore } = await import('@/lib/store/gamificationStore');
    vi.mocked(useGamificationStore).mockImplementation((selector: unknown) => {
      const state = {
        profile: { ...mockProfile, level: 40 },
        loadProfile: mockLoadProfile,
        hasLoaded: true,
        isLoading: false,
        getLevelTitle: vi.fn(() => 'Scholarly Legend'),
      };
      return typeof selector === 'function'
        ? (selector as (s: typeof state) => unknown)(state)
        : state;
    });

    render(<LevelBadge />);

    const badge = screen.getByTitle('Level 40: Scholarly Legend');
    expect(badge).toHaveClass('from-purple-400', 'to-indigo-600');
  });

  it('applies master gradient for levels 51+', async () => {
    const { useGamificationStore } = await import('@/lib/store/gamificationStore');
    vi.mocked(useGamificationStore).mockImplementation((selector: unknown) => {
      const state = {
        profile: { ...mockProfile, level: 55 },
        loadProfile: mockLoadProfile,
        hasLoaded: true,
        isLoading: false,
        getLevelTitle: vi.fn(() => 'Academic Titan'),
      };
      return typeof selector === 'function'
        ? (selector as (s: typeof state) => unknown)(state)
        : state;
    });

    render(<LevelBadge />);

    const badge = screen.getByTitle('Level 55: Academic Titan');
    expect(badge).toHaveClass('from-rose-500', 'to-red-700');
  });
});

describe('LevelBadge Loading State', () => {
  it('shows loading skeleton when loading', async () => {
    const { useGamificationStore } = await import('@/lib/store/gamificationStore');
    vi.mocked(useGamificationStore).mockImplementation((selector: unknown) => {
      const state = {
        profile: null,
        loadProfile: mockLoadProfile,
        hasLoaded: false,
        isLoading: true,
        getLevelTitle: mockGetLevelTitle,
      };
      return typeof selector === 'function'
        ? (selector as (s: typeof state) => unknown)(state)
        : state;
    });

    const { container } = render(<LevelBadge />);

    const skeleton = container.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });
});

describe('LevelBadgeInline', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset mock to default state for inline tests
    const { useGamificationStore } = await import('@/lib/store/gamificationStore');
    vi.mocked(useGamificationStore).mockImplementation((selector: unknown) => {
      const state = {
        profile: mockProfile,
        loadProfile: mockLoadProfile,
        hasLoaded: true,
        isLoading: false,
        getLevelTitle: mockGetLevelTitle,
      };
      return typeof selector === 'function'
        ? (selector as (s: typeof state) => unknown)(state)
        : state;
    });
  });

  it('renders inline level badge', () => {
    render(<LevelBadgeInline />);

    expect(screen.getByText('Lv.3')).toBeInTheDocument();
  });

  it('applies inline styling classes', () => {
    render(<LevelBadgeInline />);

    const badge = screen.getByText('Lv.3');
    expect(badge).toHaveClass('inline-flex', 'rounded', 'text-xs', 'font-bold');
  });

  it('applies custom className', () => {
    render(<LevelBadgeInline className="custom-inline" />);

    const badge = screen.getByText('Lv.3');
    expect(badge).toHaveClass('custom-inline');
  });
});
