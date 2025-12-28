import { render, screen } from '@testing-library/react';
import EventsFeed from '@/components/home/EventsFeed';

describe('EventsFeed', () => {
  it('renders the events header', () => {
    render(<EventsFeed />);
    expect(screen.getByText('Events Today')).toBeInTheDocument();
  });
});
