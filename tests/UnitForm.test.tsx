// tests/UnitForm.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import UnitForm from '@/components/units/UnitForm';
import { useUnitsStore } from '@/lib/store/unitsStore';

// Mock the store
vi.mock('@/lib/store/unitsStore', () => ({
  useUnitsStore: vi.fn(),
}));

describe('UnitForm', () => {
  const mockAddUnit = vi.fn();
  const mockUpdateUnit = vi.fn();
  const mockRemoveUnit = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useUnitsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      addUnit: mockAddUnit,
      updateUnit: mockUpdateUnit,
      removeUnit: mockRemoveUnit,
    });
  });

  it('renders the form when open', () => {
    render(<UnitForm open={true} onOpenChange={mockOnOpenChange} />);

    expect(screen.getByText('Add New Unit')).toBeInTheDocument();
  });

  it('shows edit title when editing a unit', () => {
    const editUnit = {
      id: 'test-id',
      code: 'COMP101',
      name: 'Test Unit',
      color: '#A6192E',
      location: { building: 'C5C', room: '101' },
      schedule: [],
      createdAt: new Date(),
    };

    render(<UnitForm open={true} onOpenChange={mockOnOpenChange} editUnit={editUnit} />);

    expect(screen.getByText('Edit Unit')).toBeInTheDocument();
  });

  it('shows required field labels', () => {
    render(<UnitForm open={true} onOpenChange={mockOnOpenChange} />);

    // Check that form is rendered with required fields - use getAllByText since there may be multiple
    expect(screen.getAllByText(/Unit Code/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Unit Name/).length).toBeGreaterThan(0);
  });

  it('renders Add Unit button', () => {
    render(<UnitForm open={true} onOpenChange={mockOnOpenChange} />);

    expect(screen.getByRole('button', { name: /Add Unit/i })).toBeInTheDocument();
  });
});

