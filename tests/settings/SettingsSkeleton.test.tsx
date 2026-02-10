// tests/settings/SettingsSkeleton.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SettingsSkeleton from '@/features/settings/components/SettingsSkeleton';

describe('SettingsSkeleton', () => {
  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      loading: 'Loading',
      loadingSettings: 'Loading settings...',
    };
    return translations[key] || key;
  });

  const defaultProps = {
    t: mockT,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders skeleton container', () => {
    render(<SettingsSkeleton {...defaultProps} />);

    expect(screen.getByTestId('settings-skeleton')).toBeInTheDocument();
  });

  it('has aria-busy attribute for accessibility', () => {
    render(<SettingsSkeleton {...defaultProps} />);

    const skeleton = screen.getByTestId('settings-skeleton');
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
  });

  it('has aria-label for screen readers', () => {
    render(<SettingsSkeleton {...defaultProps} />);

    const skeleton = screen.getByTestId('settings-skeleton');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading');
  });

  it('renders header skeleton elements', () => {
    render(<SettingsSkeleton {...defaultProps} />);

    // Should have header elements (title and description placeholders)
    const header = screen.getByTestId('settings-skeleton').querySelector('header');
    expect(header).toBeInTheDocument();
  });

  it('renders skeleton cards for notification settings', () => {
    render(<SettingsSkeleton {...defaultProps} />);

    // Should render 3 notification skeleton items (SKELETON_COUNTS.notifications = 3)
    const container = screen.getByTestId('settings-skeleton');
    const notificationSkeletons = container.querySelectorAll('[class*="mq-magic-card"]');
    expect(notificationSkeletons.length).toBeGreaterThan(0);
  });

  it('renders loading status indicator', () => {
    render(<SettingsSkeleton {...defaultProps} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading settings...')).toBeInTheDocument();
  });

  it('has proper grid layout structure', () => {
    render(<SettingsSkeleton {...defaultProps} />);

    const container = screen.getByTestId('settings-skeleton');
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });

  it('renders animated pulse elements', () => {
    render(<SettingsSkeleton {...defaultProps} />);

    const container = screen.getByTestId('settings-skeleton');
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('renders aria-hidden elements for decorative skeleton items', () => {
    render(<SettingsSkeleton {...defaultProps} />);

    const container = screen.getByTestId('settings-skeleton');
    const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenElements.length).toBeGreaterThan(0);
  });
});
