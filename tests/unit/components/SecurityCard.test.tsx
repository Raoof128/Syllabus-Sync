// tests/unit/components/SecurityCard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SecurityCard } from '@/app/manage-profiles/components/SecurityCard';

// Mock next/navigation
const mockRouterPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// Mock useTypedTranslation
vi.mock('@/lib/hooks/useTypedTranslation', () => ({
  useTypedTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        security: 'Security',
        changePassword: 'Change Password',
        changePasswordDesc: 'Update your password',
        manageSessions: 'Manage Sessions',
        manageSessionsDesc: 'View and manage active sessions',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock SessionsList component
vi.mock('@/features/settings/components/privacy/SessionsList', () => ({
  SessionsList: ({ open }: { open: boolean }) => (
    open ? <div data-testid="sessions-dialog">Sessions List</div> : null
  ),
}));

describe('SecurityCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<SecurityCard />);
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getAllByText('Change Password')).toHaveLength(2);
    expect(screen.getByText('Update your password')).toBeInTheDocument();
    expect(screen.getAllByText('Manage Sessions')).toHaveLength(2);
    expect(screen.getByText('View and manage active sessions')).toBeInTheDocument();
  });

  it('navigates to reset-password when change password button is clicked', () => {
    render(<SecurityCard />);
    const buttons = screen.getAllByRole('button', { name: 'Change Password' });
    fireEvent.click(buttons[0]); // Both the container and the button have the label if not careful, but let's just pick one
    expect(mockRouterPush).toHaveBeenCalledWith('/reset-password?from=settings');
  });

  it('opens sessions dialog when manage sessions button is clicked', () => {
    render(<SecurityCard />);
    const manageButton = screen.getByRole('button', { name: 'Manage Sessions' });
    fireEvent.click(manageButton);
    expect(screen.getByTestId('sessions-dialog')).toBeInTheDocument();
  });
});
