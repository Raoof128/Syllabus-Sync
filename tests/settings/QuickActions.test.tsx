// tests/settings/QuickActions.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import QuickActions from '@/app/settings/components/QuickActions';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('QuickActions', () => {
  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      quickActions: 'Quick Actions',
      homeDashboard: 'Home Dashboard',
      calendarView: 'Calendar View',
      eventsFeed: 'Events Feed',
      campusMap: 'Campus Map',
      manageProfiles: 'Manage Profiles',
    };
    return translations[key] || key;
  });

  const defaultProps = {
    t: mockT,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders quick actions card', () => {
    render(<QuickActions {...defaultProps} />);

    expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('renders all navigation links', () => {
    render(<QuickActions {...defaultProps} />);

    expect(screen.getByTestId('quick-action-home')).toBeInTheDocument();
    expect(screen.getByTestId('quick-action-calendar')).toBeInTheDocument();
    expect(screen.getByTestId('quick-action-feed')).toBeInTheDocument();
    expect(screen.getByTestId('quick-action-map')).toBeInTheDocument();
    expect(screen.getByTestId('quick-action-manage-profiles')).toBeInTheDocument();
  });

  it('has correct href for each link', () => {
    render(<QuickActions {...defaultProps} />);

    expect(screen.getByTestId('quick-action-home')).toHaveAttribute('href', '/home');
    expect(screen.getByTestId('quick-action-calendar')).toHaveAttribute('href', '/calendar');
    expect(screen.getByTestId('quick-action-feed')).toHaveAttribute('href', '/feed');
    expect(screen.getByTestId('quick-action-map')).toHaveAttribute('href', '/map');
    expect(screen.getByTestId('quick-action-manage-profiles')).toHaveAttribute(
      'href',
      '/manage-profiles',
    );
  });

  it('displays translated labels for each link', () => {
    render(<QuickActions {...defaultProps} />);

    expect(screen.getByText('Home Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Calendar View')).toBeInTheDocument();
    expect(screen.getByText('Events Feed')).toBeInTheDocument();
    expect(screen.getByText('Campus Map')).toBeInTheDocument();
    expect(screen.getByText('Manage Profiles')).toBeInTheDocument();
  });

  it('has navigation role for accessibility', () => {
    render(<QuickActions {...defaultProps} />);

    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('has proper aria-labelledby for navigation', () => {
    render(<QuickActions {...defaultProps} />);

    const navigation = screen.getByRole('navigation');
    expect(navigation).toHaveAttribute('aria-labelledby', 'quick-actions-heading');
  });

  it('strips emojis from labels if present', () => {
    const mockTWithEmoji = vi.fn((key: string) => {
      const translations: Record<string, string> = {
        quickActions: 'Quick Actions',
        homeDashboard: '🏠 Home Dashboard',
        calendarView: '📅 Calendar View',
        eventsFeed: '📰 Events Feed',
        campusMap: '🗺️ Campus Map',
        manageProfiles: '👥 Manage Profiles',
      };
      return translations[key] || key;
    });

    render(<QuickActions t={mockTWithEmoji} />);

    // Should display without emoji prefix
    expect(screen.getByText('Home Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Calendar View')).toBeInTheDocument();
  });
});
