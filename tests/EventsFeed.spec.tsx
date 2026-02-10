import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import EventsFeed from '@/features/home/components/EventsFeed';

describe('EventsFeed', () => {
  it('renders the events header', () => {
    render(<EventsFeed />);
    expect(screen.getByText('Events Today')).toBeInTheDocument();
  });
});
