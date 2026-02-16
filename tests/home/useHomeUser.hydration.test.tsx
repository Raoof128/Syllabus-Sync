import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.resetModules();
  vi.clearAllMocks();
});

function makeProfile(name: string) {
  return {
    id: 'profile-1',
    name,
    email: 'student@example.com',
    studentId: '12345678',
    course: 'Test Course',
    year: '1',
    preferences: {
      notifications: true,
      emailReminders: false,
      pushNotifications: true,
    },
    createdAt: new Date('2026-02-16T00:00:00.000Z'),
    lastLogin: new Date('2026-02-16T00:00:00.000Z'),
  };
}

describe('useHomeUser hydration safety', () => {
  it('does not expose persisted profile name before hydration (prevents SSR/client mismatch)', async () => {
    vi.doMock('@/lib/hooks', async () => {
      const actual = await vi.importActual<typeof import('@/lib/hooks')>('@/lib/hooks');
      return { ...actual, useHydration: () => false };
    });

    const { useProfilesStore } = await import('@/lib/store/profilesStore');
    useProfilesStore.setState({
      profiles: [makeProfile('Raoof')],
      currentProfileId: 'profile-1',
    });

    const { useHomeUser } = await import('@/features/home/hooks/useHomeUser');

    function Probe() {
      const { displayName } = useHomeUser(null);
      return <div data-testid="name">{displayName ?? ''}</div>;
    }

    render(<Probe />);

    expect(screen.getByTestId('name')).toHaveTextContent('');
  });

  it('uses persisted profile name after hydration', async () => {
    vi.doMock('@/lib/hooks', async () => {
      const actual = await vi.importActual<typeof import('@/lib/hooks')>('@/lib/hooks');
      return { ...actual, useHydration: () => true };
    });

    const { useProfilesStore } = await import('@/lib/store/profilesStore');
    useProfilesStore.setState({
      profiles: [makeProfile('Raoof')],
      currentProfileId: 'profile-1',
    });

    const { useHomeUser } = await import('@/features/home/hooks/useHomeUser');

    function Probe() {
      const { displayName } = useHomeUser(null);
      return <div data-testid="name">{displayName ?? ''}</div>;
    }

    render(<Probe />);

    expect(screen.getByTestId('name')).toHaveTextContent('Raoof');
  });
});
