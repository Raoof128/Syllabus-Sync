// tests/TodaySchedule.test.tsx
import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

// Use vi.hoisted to create stable mock state that survives vi.mock hoisting
const { mockState } = vi.hoisted(() => {
  const mockGetTodayClasses = () => [];
  return {
    mockState: {
      units: [] as Array<Record<string, unknown>>,
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

vi.mock('@/lib/hooks', () => ({
  useHydration: () => true,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import TodaySchedule from '@/features/home/components/TodaySchedule';

describe('TodaySchedule', () => {
  afterEach(() => {
    vi.useRealTimers();
    mockState.units = [];
    cleanup();
  });

  it('renders the component header', () => {
    render(<TodaySchedule />);
    expect(screen.getByText("Today's Classes")).toBeInTheDocument();
  });

  it('shows loading or empty state', async () => {
    render(<TodaySchedule />);
    await waitFor(() => {
      const hasLoading = screen.queryByText('Loading...');
      const hasEmpty = screen.queryByText('No classes today');
      expect(hasLoading || hasEmpty).toBeTruthy();
    });
  });

  it('shows empty state when no classes today', async () => {
    render(<TodaySchedule />);
    await waitFor(() => {
      expect(screen.getByText('No classes today')).toBeInTheDocument();
    });
  });

  it('crosses out past classes and shows them as passed', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-16T14:30:00'));

    mockState.units = [
      {
        id: 'unit-1',
        code: 'COMP1010',
        name: 'Intro to Computing',
        color: '#2563eb',
        location: { building: '4ER', room: '120' },
        schedule: [
          {
            day: 'Monday',
            startTime: '09:00',
            endTime: '10:00',
          },
        ],
      },
    ];

    render(<TodaySchedule />);

    expect(screen.getByText('COMP1010')).toHaveClass('line-through');
    expect(screen.getByText('Intro to Computing')).toHaveClass('line-through');
    expect(screen.getByText('PASSED')).toBeInTheDocument();
  });
});
