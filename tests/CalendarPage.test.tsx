import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CalendarPage from '@/app/calendar/page';
import translations from '@/locales/en/translations.json';

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
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('CalendarPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    deadlinesState.toggleComplete.mockClear();
    deadlinesState.getStressLevel.mockClear();
  });

  it('renders the calendar page with header', async () => {
    render(<CalendarPage />);

    // Check that the main calendar heading is present
    expect(screen.getByRole('heading', { name: translations.calendar })).toBeInTheDocument();
  });

  it('displays deadline information in the sidebar', async () => {
    render(<CalendarPage />);

    // Deadlines appear in multiple places - verify at least one exists
    const assignmentTitles = screen.getAllByText('Assignment 1');
    expect(assignmentTitles.length).toBeGreaterThan(0);
  });

  it('displays the Assignments section with pending count', async () => {
    render(<CalendarPage />);

    // Check for the Assignments section heading
    const assignmentsHeading = screen.getByRole('heading', {
      name: new RegExp(`${translations.assignments}.*${translations.pending}`, 'i'),
    });
    expect(assignmentsHeading).toBeInTheDocument();
  });

  it('renders navigation controls', async () => {
    render(<CalendarPage />);

    // Find the Today button which should be present
    const todayButton = screen.getByRole('button', { name: translations.today });
    expect(todayButton).toBeInTheDocument();

    // Check that the button is focusable
    todayButton.focus();
    expect(document.activeElement).toBe(todayButton);
  });
});
