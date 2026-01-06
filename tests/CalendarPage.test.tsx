import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import CalendarPage from '@/app/calendar/page';

const deadlinesState = {
  deadlines: [
    {
      id: 'deadline-1',
      title: 'Assignment 1',
      unitCode: 'COMP2310',
      dueDate: new Date(2026, 0, 15, 14, 30),
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

const calendarSearchParams = new URLSearchParams('date=2026-01-15');

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

  // Replaced skipped dialog-opening tests with interaction tests matching the current CalendarClient behavior.
  it('completion control is keyboard-focusable and activates', async () => {
    render(<CalendarPage />);

    const title = screen.getByText('Assignment 1');
    const contentWrapper = title.parentElement?.parentElement as HTMLElement | null;
    expect(contentWrapper).toBeDefined();
    const toggleButton = contentWrapper!.querySelector('button') as HTMLButtonElement;
    expect(toggleButton).toBeTruthy();

    // Ensure the control is focusable and has a clear accessible name
    toggleButton.focus();
    expect(document.activeElement).toBe(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-label');

    // Simulate activation (keyboard activation should trigger a click in browsers; use click here to assert behavior)
    fireEvent.click(toggleButton);

    expect(deadlinesState.toggleComplete).toHaveBeenCalledWith('deadline-1');
  });

  it('toggles complete when completion button clicked', async () => {
    render(<CalendarPage />);

    const title = screen.getByText('Assignment 1');
    const contentWrapper = title.parentElement?.parentElement as HTMLElement | null;
    expect(contentWrapper).toBeDefined();
    const toggleButton = contentWrapper!.querySelector('button') as HTMLButtonElement;
    expect(toggleButton).toBeTruthy();

    fireEvent.click(toggleButton);

    expect(deadlinesState.toggleComplete).toHaveBeenCalledWith('deadline-1');
  });

  it('opens edit dialog with keyboard interaction', async () => {
    render(<CalendarPage />);

    const cardButton = screen.getByRole('button', { name: /Assignment 1 deadline/i });
    const user = userEvent.setup();
    cardButton.focus();
    await user.keyboard('{Enter}');

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
