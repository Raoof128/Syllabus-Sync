import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EventsFeed from '@/components/home/EventsFeed';

describe('EventsFeed', () => {
  it('renders the events header', () => {
    render(<EventsFeed />);
    expect(screen.getByText('Events Today')).toBeInTheDocument();
  });
});
