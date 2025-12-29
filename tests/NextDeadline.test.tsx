// tests/NextDeadline.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NextDeadline from '@/components/home/NextDeadline';

// Mock the zustand store
vi.mock('@/lib/store/deadlinesStore', () => ({
  useDeadlinesStore: vi.fn((selector: (state: any) => any) => {
    const state = {
      deadlines: [],
      getUpcoming: () => [],
    };
    return selector(state);
  }),
}));

describe('NextDeadline', () => {
  it('renders the component header', () => {
    render(<NextDeadline />);
    expect(screen.getByText('Next Deadline')).toBeInTheDocument();
  });

  it('shows loading or empty state', async () => {
    render(<NextDeadline />);
    // The component may show loading briefly or move directly to empty state
    await waitFor(() => {
      const hasLoading = screen.queryByText('Loading...');
      const hasEmpty = screen.queryByText('No upcoming deadlines 🎯');
      expect(hasLoading || hasEmpty).toBeTruthy();
    });
  });

  it('shows empty state when no upcoming deadlines', async () => {
    render(<NextDeadline />);
    await waitFor(() => {
      expect(screen.getByText('No upcoming deadlines 🎯')).toBeInTheDocument();
    });
  });
});
