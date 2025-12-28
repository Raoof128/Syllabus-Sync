// tests/NextDeadline.test.tsx
import { render, screen } from '@testing-library/react';
import NextDeadline from '@/components/home/NextDeadline';

// Mock the zustand store
vi.mock('@/lib/store/deadlinesStore', () => ({
    useDeadlinesStore: vi.fn((selector) => {
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

    it('shows empty state when no upcoming deadlines', () => {
        render(<NextDeadline />);
        expect(screen.getByText('No upcoming deadlines 🎯')).toBeInTheDocument();
    });
});

