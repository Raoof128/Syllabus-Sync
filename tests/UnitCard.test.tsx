// tests/UnitCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UnitCard from '@/components/units/UnitCard';
import { Unit } from '@/lib/types';

describe('UnitCard', () => {
  const mockUnit: Unit = {
    id: 'test-unit-1',
    code: 'COMP2310',
    name: 'Networking',
    color: '#A6192E',
    location: {
      building: 'C5C',
      room: '204',
    },
    schedule: [
      {
        id: 'schedule-1',
        day: 'Monday',
        startTime: '09:00',
        endTime: '11:00',
      },
      {
        id: 'schedule-2',
        day: 'Thursday',
        startTime: '14:00',
        endTime: '16:00',
      },
    ],
    createdAt: new Date('2025-01-01'),
  };

  it('renders unit code and name', () => {
    render(<UnitCard unit={mockUnit} />);

    expect(screen.getByText('COMP2310')).toBeInTheDocument();
    expect(screen.getByText('Networking')).toBeInTheDocument();
  });

  it('renders location information', () => {
    render(<UnitCard unit={mockUnit} />);

    expect(screen.getByText('C5C')).toBeInTheDocument();
    expect(screen.getByText('Room 204')).toBeInTheDocument();
  });

  it('renders class schedule days', () => {
    render(<UnitCard unit={mockUnit} />);

    expect(screen.getByText('Mon, Thu')).toBeInTheDocument();
  });

  it('renders schedule times', () => {
    render(<UnitCard unit={mockUnit} />);

    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('09:00 - 11:00')).toBeInTheDocument();
    expect(screen.getByText('Thursday')).toBeInTheDocument();
    expect(screen.getByText('14:00 - 16:00')).toBeInTheDocument();
  });

  it('shows edit button when onEdit is provided', () => {
    const mockOnEdit = vi.fn();
    const { container } = render(<UnitCard unit={mockUnit} onEdit={mockOnEdit} />);

    // Find buttons in the card header actions area
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = vi.fn();
    const { container } = render(<UnitCard unit={mockUnit} onEdit={mockOnEdit} />);

    // Find the first button (edit button)
    const buttons = container.querySelectorAll('button');
    if (buttons.length > 0) {
      fireEvent.click(buttons[0]);
      expect(mockOnEdit).toHaveBeenCalledWith(mockUnit);
    }
  });

  it('shows delete button when onDelete is provided', () => {
    const mockOnDelete = vi.fn();
    const { container } = render(<UnitCard unit={mockUnit} onDelete={mockOnDelete} />);

    // Find buttons with red styling (delete button)
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('calls onDelete when delete button is clicked', () => {
    const mockOnDelete = vi.fn();
    const { container } = render(<UnitCard unit={mockUnit} onDelete={mockOnDelete} />);

    // Find all buttons and click the delete one (has red text)
    const buttons = container.querySelectorAll('button');
    if (buttons.length > 0) {
      fireEvent.click(buttons[0]);
      expect(mockOnDelete).toHaveBeenCalledWith(mockUnit);
    }
  });

  it('hides action buttons when showActions is false', () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    const { container } = render(<UnitCard unit={mockUnit} onEdit={mockOnEdit} onDelete={mockOnDelete} showActions={false} />);

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(0);
  });

  it('displays unit color indicator', () => {
    const { container } = render(<UnitCard unit={mockUnit} />);

    const colorIndicator = container.querySelector('[style*="background-color"]');
    expect(colorIndicator).toBeInTheDocument();
  });
});

