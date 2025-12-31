// tests/TodaySchedule.test.tsx
import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

// Use vi.hoisted to create stable mock state that survives vi.mock hoisting
const { mockState } = vi.hoisted(() => {
  const mockGetTodayClasses = () => [];
  return {
    mockState: {
      units: [],
      getTodayClasses: mockGetTodayClasses,
    },
  };
});

// Mock the zustand store
vi.mock('@/lib/store/unitsStore', () => ({
  useUnitsStore: (selector: (state: typeof mockState) => unknown) => {
    return selector(mockState);
  },
}));

import TodaySchedule from '@/components/home/TodaySchedule';

describe('TodaySchedule', () => {
  afterEach(() => {
    cleanup();
  });

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
