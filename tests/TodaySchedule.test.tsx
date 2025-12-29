// tests/TodaySchedule.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TodaySchedule from '@/components/home/TodaySchedule';

// Mock the zustand store
vi.mock('@/lib/store/unitsStore', () => ({
  useUnitsStore: vi.fn((selector: (state: any) => any) => {
    const state = {
      units: [],
      getTodayClasses: () => [],
    };
    return selector(state);
  }),
}));

describe('TodaySchedule', () => {
  it('renders the component header', () => {
    render(<TodaySchedule />);
    expect(screen.getByText("Today's Classes")).toBeInTheDocument();
  });

  it('shows loading or empty state', async () => {
    render(<TodaySchedule />);
    // The component may show loading briefly or move directly to empty state
    await waitFor(() => {
      const hasLoading = screen.queryByText('Loading...');
      const hasEmpty = screen.queryByText('No classes today 🎉');
      expect(hasLoading || hasEmpty).toBeTruthy();
    });
  });

  it('shows empty state when no classes today', async () => {
    render(<TodaySchedule />);
    await waitFor(() => {
      expect(screen.getByText('No classes today 🎉')).toBeInTheDocument();
    });
  });
});
