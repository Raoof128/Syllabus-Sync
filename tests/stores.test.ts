// tests/stores.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useUnitsStore } from '@/lib/store/unitsStore';
import { useDeadlinesStore } from '@/lib/store/deadlinesStore';
import { Unit, Deadline } from '@/lib/types';

describe('unitsStore', () => {
  const mockUnit: Unit = {
    id: 'test-unit-1',
    code: 'COMP2310',
    name: 'Networking',
    color: '#A6192E',
    location: { building: 'C5C', room: '204' },
    schedule: [
      { id: 'schedule-1', day: 'Monday', startTime: '09:00', endTime: '11:00' },
    ],
    createdAt: new Date(),
  };

  beforeEach(() => {
    // Reset store state before each test
    useUnitsStore.setState({ units: [] });
  });

  it('should add a unit', () => {
    const { addUnit } = useUnitsStore.getState();
    addUnit(mockUnit);

    const { units } = useUnitsStore.getState();
    expect(units).toHaveLength(1);
    expect(units[0].code).toBe('COMP2310');
  });

  it('should remove a unit', () => {
    useUnitsStore.setState({ units: [mockUnit] });

    const { removeUnit } = useUnitsStore.getState();
    removeUnit('test-unit-1');

    const { units } = useUnitsStore.getState();
    expect(units).toHaveLength(0);
  });

  it('should update a unit', () => {
    useUnitsStore.setState({ units: [mockUnit] });

    const { updateUnit } = useUnitsStore.getState();
    updateUnit('test-unit-1', { name: 'Updated Name' });

    const { units } = useUnitsStore.getState();
    expect(units[0].name).toBe('Updated Name');
  });

  it('should get unit by code', () => {
    useUnitsStore.setState({ units: [mockUnit] });

    const { getUnitByCode } = useUnitsStore.getState();
    const unit = getUnitByCode('COMP2310');

    expect(unit).toBeDefined();
    expect(unit?.name).toBe('Networking');
  });

  it('should return undefined for non-existent unit code', () => {
    useUnitsStore.setState({ units: [mockUnit] });

    const { getUnitByCode } = useUnitsStore.getState();
    const unit = getUnitByCode('NONEXISTENT');

    expect(unit).toBeUndefined();
  });
});

describe('deadlinesStore', () => {
  const mockDeadline: Deadline = {
    id: 'test-deadline-1',
    title: 'Assignment 1',
    unitCode: 'COMP2310',
    dueDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
    priority: 'High',
    type: 'Assignment',
    completed: false,
    createdAt: new Date(),
  };

  beforeEach(() => {
    // Reset store state before each test
    useDeadlinesStore.setState({ deadlines: [] });
  });

  it('should add a deadline', () => {
    const { addDeadline } = useDeadlinesStore.getState();
    addDeadline(mockDeadline);

    const { deadlines } = useDeadlinesStore.getState();
    expect(deadlines).toHaveLength(1);
    expect(deadlines[0].title).toBe('Assignment 1');
  });

  it('should remove a deadline', () => {
    useDeadlinesStore.setState({ deadlines: [mockDeadline] });

    const { removeDeadline } = useDeadlinesStore.getState();
    removeDeadline('test-deadline-1');

    const { deadlines } = useDeadlinesStore.getState();
    expect(deadlines).toHaveLength(0);
  });

  it('should update a deadline', () => {
    useDeadlinesStore.setState({ deadlines: [mockDeadline] });

    const { updateDeadline } = useDeadlinesStore.getState();
    updateDeadline('test-deadline-1', { title: 'Updated Title' });

    const { deadlines } = useDeadlinesStore.getState();
    expect(deadlines[0].title).toBe('Updated Title');
  });

  it('should toggle deadline completion', () => {
    useDeadlinesStore.setState({ deadlines: [mockDeadline] });

    const { toggleComplete } = useDeadlinesStore.getState();
    toggleComplete('test-deadline-1');

    const { deadlines } = useDeadlinesStore.getState();
    expect(deadlines[0].completed).toBe(true);
  });

  it('should get upcoming deadlines sorted by due date', () => {
    const deadline1 = { ...mockDeadline, id: 'd1', dueDate: new Date(Date.now() + 86400000 * 5) };
    const deadline2 = { ...mockDeadline, id: 'd2', dueDate: new Date(Date.now() + 86400000) };
    const deadline3 = { ...mockDeadline, id: 'd3', dueDate: new Date(Date.now() + 86400000 * 3), completed: true };

    useDeadlinesStore.setState({ deadlines: [deadline1, deadline2, deadline3] });

    const { getUpcoming } = useDeadlinesStore.getState();
    const upcoming = getUpcoming(3);

    expect(upcoming).toHaveLength(2); // Excludes completed
    expect(upcoming[0].id).toBe('d2'); // Closest due date first
    expect(upcoming[1].id).toBe('d1');
  });

  it('should calculate stress level correctly', () => {
    // Low stress - no deadlines
    useDeadlinesStore.setState({ deadlines: [] });
    let { getStressLevel } = useDeadlinesStore.getState();
    expect(getStressLevel()).toBe('Low');

    // High stress - multiple urgent deadlines soon
    const urgentDeadlines = [
      { ...mockDeadline, id: 'd1', priority: 'Urgent' as const, dueDate: new Date(Date.now() + 86400000) },
      { ...mockDeadline, id: 'd2', priority: 'Urgent' as const, dueDate: new Date(Date.now() + 86400000) },
      { ...mockDeadline, id: 'd3', priority: 'High' as const, dueDate: new Date(Date.now() + 86400000 * 2) },
      { ...mockDeadline, id: 'd4', priority: 'High' as const, dueDate: new Date(Date.now() + 86400000 * 2) },
    ];
    useDeadlinesStore.setState({ deadlines: urgentDeadlines });
    ({ getStressLevel } = useDeadlinesStore.getState());
    expect(getStressLevel()).toBe('High');
  });
});

