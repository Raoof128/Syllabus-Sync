import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CalendarPage from '@/app/calendar/page';

const deadlinesState = {
  deadlines: [
    {
      id: 'deadline-1',
      title: 'Assignment 1',
      unitCode: 'COMP2310',
      dueDate: new Date(2025, 0, 15, 14, 30),
      priority: 'High',
      type: 'Assignment',
      completed: false,
      createdAt: new Date(),
    },
  ],
  toggleComplete: vi.fn(),
  getStressLevel: vi.fn(() => 'Low'),
  addDeadline: vi.fn(),
  updateDeadline: vi.fn(),
  removeDeadline: vi.fn(),
};

const unitsState = {
  units: [
    {
      id: 'unit-comp2310',
      code: 'COMP2310',
      name: 'Networking',
      color: '#A6192E',
      location: { building: 'C5C', room: '204' },
      schedule: [],
      createdAt: new Date(),
    },
  ],
};

vi.mock('@/lib/store/deadlinesStore', () => ({
  useDeadlinesStore: (selector?: (state: typeof deadlinesState) => unknown) =>
    selector ? selector(deadlinesState) : deadlinesState,
}));

vi.mock('@/lib/store/unitsStore', () => ({
  useUnitsStore: (selector: (state: typeof unitsState) => unknown) => selector(unitsState),
}));

vi.mock('@/lib/hooks', () => ({
  useHydration: () => true,
}));

const calendarSearchParams = new URLSearchParams('date=2025-01-15');

vi.mock('next/navigation', () => ({
  useSearchParams: () => calendarSearchParams,
}));

describe('CalendarPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    deadlinesState.toggleComplete.mockClear();
    deadlinesState.getStressLevel.mockClear();
  });

  it('opens edit dialog with keyboard interaction', async () => {
    render(<CalendarPage />);

    const assignmentButtons = screen.getAllByRole('button', { name: /Assignment 1/i });
    const listCard = assignmentButtons.find((node) => node.tagName === 'DIV');
    expect(listCard).toBeDefined();
    fireEvent.keyDown(listCard as HTMLElement, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('opens edit dialog from calendar grid button click', async () => {
    render(<CalendarPage />);

    const gridButton = screen.getByTitle(/Assignment 1 \(2:30 PM\)/i);
    fireEvent.click(gridButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
