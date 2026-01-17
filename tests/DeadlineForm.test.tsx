// tests/DeadlineForm.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DeadlineForm from '@/components/deadlines/DeadlineForm';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { Deadline } from '@/lib/types';

vi.mock('@/lib/store/deadlinesStore', () => ({
  useDeadlinesStore: vi.fn(),
}));

vi.mock('@/lib/store/unitsStore', () => ({
  useUnitsStore: vi.fn(),
}));

describe('DeadlineForm', () => {
  const mockAddDeadline = vi.fn();
  const mockUpdateDeadline = vi.fn();
  const mockRemoveDeadline = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    const deadlinesState = {
      addDeadline: mockAddDeadline,
      updateDeadline: mockUpdateDeadline,
      removeDeadline: mockRemoveDeadline,
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

    (useDeadlinesStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector?: (state: typeof deadlinesState) => unknown) =>
        selector ? selector(deadlinesState) : deadlinesState,
    );
    (useUnitsStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: typeof unitsState) => unknown) => selector(unitsState),
    );
  });

  it('pre-fills edit values including date, time, and completion', () => {
    const editDeadline: Deadline = {
      id: 'deadline-1',
      title: 'Assignment 1',
      unitCode: 'COMP2310',
      dueDate: new Date(2025, 0, 15, 14, 30),
      priority: 'High',
      type: 'Assignment',
      completed: true,
      createdAt: new Date(),
    };

    render(
      <DeadlineForm open={true} onOpenChange={mockOnOpenChange} editDeadline={editDeadline} />,
    );

    const titleInput = screen.getByLabelText(/Title/i) as HTMLInputElement;
    const dateInput = screen.getByLabelText(/Due Date/i) as HTMLInputElement;
    const timeInput = screen.getByLabelText(/Due Time/i) as HTMLInputElement;

    expect(titleInput.value).toBe('Assignment 1');
    expect(dateInput.value).toBe('2025-01-15');
    expect(timeInput.value).toBe('14:30');
  });
});
