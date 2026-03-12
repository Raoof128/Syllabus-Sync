import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouteAnnouncer } from '@/features/map/components/RouteAnnouncer';

// Mock useSafeTranslation — component uses t(), not safeT()
const translationMap: Record<string, string> = {
  navigationArrived: 'You have arrived at your destination.',
  navigatingTo: 'Navigating to:',
  meters: 'meters',
  kilometers: 'kilometers',
};

vi.mock('@/lib/hooks/useSafeTranslation', () => ({
  useSafeTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (key === 'navigationUpdate' && params?.distance) {
        return `Continue for ${params.distance}.`;
      }
      return translationMap[key] || key;
    },
    safeT: (key: string, fallback: string) => translationMap[key] || fallback || key,
  }),
}));

describe('RouteAnnouncer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a polite live region', () => {
    render(<RouteAnnouncer navState={null} locationStatus="idle" />);
    const region = screen.getByRole('status', { hidden: true });
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveClass('sr-only');
  });

  it('announces arrival immediately', () => {
    render(
      <RouteAnnouncer
        navState={{ isNavigating: false, status: 'arrived' }}
        locationStatus="found"
      />,
    );
    const region = screen.getByRole('status', { hidden: true });
    expect(region).toHaveTextContent('You have arrived at your destination.');
  });

  it('announces navigation start', () => {
    render(
      <RouteAnnouncer
        navState={{ isNavigating: true }}
        locationStatus="searching"
        selectedBuildingName="Library"
      />,
    );
    const region = screen.getByRole('status', { hidden: true });
    expect(region).toHaveTextContent('Navigating to: Library');
  });

  it('announces distance updates when threshold is met', () => {
    const { rerender } = render(
      <RouteAnnouncer
        navState={{ isNavigating: true, remainingDistance: 100 }}
        locationStatus="searching"
      />,
    );

    // Initial announcement
    let region = screen.getByRole('status', { hidden: true });
    expect(region).toHaveTextContent('Continue for 100 meters.');

    // Update with small change (should NOT announce due to throttle/threshold)
    rerender(
      <RouteAnnouncer
        navState={{ isNavigating: true, remainingDistance: 90 }}
        locationStatus="searching"
      />,
    );
    region = screen.getByRole('status', { hidden: true });
    // Should still be the same (or empty if it cleared, but here state persists)
    // Actually the component sets state. If state doesn't change, text remains.
    // If logic doesn't trigger setAnnouncement, text remains same.

    // Update with LARGE change (> 50m)
    rerender(
      <RouteAnnouncer
        navState={{ isNavigating: true, remainingDistance: 40 }}
        locationStatus="searching"
      />,
    );

    region = screen.getByRole('status', { hidden: true });
    expect(region).toHaveTextContent('Continue for 40 meters.');
  });
});
