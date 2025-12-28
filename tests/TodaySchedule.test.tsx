// tests/TodaySchedule.test.tsx
import { render, screen } from '@testing-library/react';
import TodaySchedule from '@/components/home/TodaySchedule';

// Mock the zustand store
vi.mock('@/lib/store/unitsStore', () => ({
    useUnitsStore: vi.fn((selector) => {
        const state = {
            units: [],
            getTodayClasses: () => [],
        };
        return selector(state);
    }),
}));

describe('TodaySchedule', () => {
    it('renders the component header', () => {
        render(<TodaySchedule />);
        expect(screen.getByText("Today's Classes")).toBeInTheDocument();
    });

    it('shows empty state when no classes today', () => {
        render(<TodaySchedule />);
        expect(screen.getByText('No classes today 🎉')).toBeInTheDocument();
    });
});

