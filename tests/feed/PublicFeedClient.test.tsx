import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PublicFeedClient from "../../features/feed/components/PublicFeedClient";

// Mock dependencies
vi.mock("@/lib/hooks/useTypedTranslation", () => ({
  useTypedTranslation: () => ({
    t: (key: string) => key,
    language: "en",
  }),
}));

vi.mock("../../features/feed/hooks/usePublicFeed", () => ({
  usePublicFeed: () => ({
    events: [],
    featuredEvents: [],
    gridEvents: [],
    isLoading: false,
    error: null,
    isAddingToCalendar: new Set(),
    addedToCalendar: new Set(),
    searchQuery: "",
    setSearchQuery: vi.fn(),
    categoryFilter: "All",
    setCategoryFilter: vi.fn(),
    timeFilter: "all",
    setTimeFilter: vi.fn(),
    sortOption: "date",
    setSortOption: vi.fn(),
    categoryCounts: {
      All: 0,
      Academic: 0,
      Career: 0,
      Social: 0,
      "Free Food": 0,
    },
    handleAddToCalendar: vi.fn(),
    fetchPublicEvents: vi.fn(),
  }),
}));

// Mock child components
vi.mock("../../features/feed/components/PublicFeedFilters", () => ({
  PublicFeedFilters: () => <div data-testid="feed-filters">Filters</div>,
}));

vi.mock("../../features/feed/components/FeaturedEventsBanner", () => ({
  FeaturedEventsBanner: () => <div data-testid="featured-banner">Featured</div>,
}));

vi.mock("../../features/feed/components/PublicEventCard", () => ({
  PublicEventCard: () => <div data-testid="event-card">Event Card</div>,
}));

vi.mock("../../features/feed/components/EventDetailModal", () => ({
  EventDetailModal: () => <div data-testid="event-modal">Modal</div>,
}));

vi.mock("../../features/feed/components/AnnouncementsSection", () => ({
  AnnouncementsSection: () => (
    <div data-testid="announcements">Announcements</div>
  ),
}));

vi.mock("../../features/feed/components/QuickStats", () => ({
  QuickStats: () => <div data-testid="quick-stats">Stats</div>,
}));

vi.mock("../../features/feed/components/FeedSkeletons", () => ({
  FeedSkeletons: () => <div data-testid="feed-skeletons">Loading...</div>,
}));

describe("PublicFeedClient", () => {
  it("renders the feed header", () => {
    render(<PublicFeedClient />);
    expect(screen.getByText("eventFeed")).toBeInTheDocument();
    expect(screen.getByText("feedDescription")).toBeInTheDocument();
  });

  it("renders the filters and sidebar components", () => {
    render(<PublicFeedClient />);
    expect(screen.getByTestId("feed-filters")).toBeInTheDocument();
    expect(screen.getByTestId("quick-stats")).toBeInTheDocument();
    expect(screen.getByTestId("announcements")).toBeInTheDocument();
  });

  it('renders "no events found" state when gridEvents is empty', () => {
    render(<PublicFeedClient />);
    expect(screen.getByText("noEventsFound")).toBeInTheDocument();
  });
});
