import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleMapBuildingSearch } from '@/features/map/components/GoogleMapBuildingSearch';
import type { Building } from '@/features/map/lib/buildings';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  m: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  useReducedMotion: () => false,
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock translations
vi.mock('@/lib/hooks/useTypedTranslation', () => ({
  useTypedTranslation: () => ({
    t: (key: string, _params?: Record<string, string | number>) => {
      const translations: Record<string, string> = {
        searchBuildingsPlaceholder: 'Search buildings...',
        filterBuildings: 'Filter buildings...',
        buildingsFound: '5 buildings found',
        places: 'Places',
        noMatchingBuildings: 'No matching buildings',
        clearSearch: 'Clear search',
        navigate: 'Navigate',
        openInGoogleMaps: 'Open in Google Maps',
        close: 'Close',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock haptics
vi.mock('@/lib/utils/haptics', () => ({
  triggerHaptic: vi.fn(),
}));

// Mock getBuildingGps
vi.mock('@/features/map/lib/buildings', () => ({
  getBuildingGps: (building: Building) => building.location || { lat: -33.7742, lng: 151.1127 },
}));

const mockBuildings: Building[] = [
  {
    id: 'LIB',
    name: 'Waranara Library',
    position: [2345, 2388],
    translationKey: 'building_LIB_name',
    descriptionKey: 'building_LIB_desc',
    address: '16 Macquarie Walk',
    location: { lat: -33.7756994, lng: 151.1131306 },
  },
  {
    id: '18WW',
    name: "18 Wally's Walk",
    position: [2282, 1881],
    translationKey: 'building_18WW_name',
    descriptionKey: 'building_18WW_desc',
    address: "18 Wally's Walk",
    location: { lat: -33.7739781, lng: 151.1126116 },
  },
  {
    id: '4ER',
    name: '4 Eastern Road (Business School)',
    position: [3066, 2352],
    translationKey: 'building_4ER_name',
    descriptionKey: 'building_4ER_desc',
    address: '4 Eastern Road',
    location: { lat: -33.775787, lng: 151.1160258 },
  },
] as Building[];

describe('GoogleMapBuildingSearch', () => {
  beforeEach(() => {
    // Reset any mocks
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders search trigger button', () => {
      render(<GoogleMapBuildingSearch buildings={mockBuildings} />);
      expect(screen.getByText('Search buildings...')).toBeTruthy();
    });

    it('renders with collapsed state by default on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: false, // mobile
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      render(<GoogleMapBuildingSearch buildings={mockBuildings} />);
      // Search input should not be visible initially
      expect(screen.queryByPlaceholderText('Filter buildings...')).toBeNull();
    });
  });

  describe('search functionality', () => {
    it('expands panel when clicking header', async () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: false,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      render(<GoogleMapBuildingSearch buildings={mockBuildings} />);

      const headerButton = screen.getByRole('button', { expanded: false });
      await act(async () => {
        fireEvent.click(headerButton);
      });

      expect(screen.getByPlaceholderText('Filter buildings...')).toBeTruthy();
    });

    it('filters buildings when typing in search', async () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: true, // desktop - expanded by default
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      render(<GoogleMapBuildingSearch buildings={mockBuildings} />);

      const searchInput = screen.getByPlaceholderText('Filter buildings...');
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'Library' } });
      });

      // Should show Library building
      expect(screen.getByText('LIB')).toBeTruthy();
      // Should not show other buildings
      expect(screen.queryByText('18WW')).toBeNull();
    });

    it('clears search when clear button is clicked', async () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: true,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      render(<GoogleMapBuildingSearch buildings={mockBuildings} />);

      const searchInput = screen.getByPlaceholderText('Filter buildings...');
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'Test' } });
      });

      const clearButton = screen.getByLabelText('Clear search');
      await act(async () => {
        fireEvent.click(clearButton);
      });

      expect((searchInput as HTMLInputElement).value).toBe('');
    });

    it('shows no results message when no buildings match', async () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: true,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      render(<GoogleMapBuildingSearch buildings={mockBuildings} />);

      const searchInput = screen.getByPlaceholderText('Filter buildings...');
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'xyz123nonexistent' } });
      });

      expect(screen.getByText('No matching buildings')).toBeTruthy();
    });
  });

  describe('building selection', () => {
    it('calls onNavigateToBuilding when building is clicked', async () => {
      const onNavigate = vi.fn();
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: true,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      render(
        <GoogleMapBuildingSearch buildings={mockBuildings} onNavigateToBuilding={onNavigate} />,
      );

      const libraryButton = screen.getByRole('button', { name: /LIB/i });
      await act(async () => {
        fireEvent.click(libraryButton);
      });

      expect(onNavigate).toHaveBeenCalledWith(mockBuildings[0]);
    });

    it('shows selected building card when a building is selected', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: true,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      render(
        <GoogleMapBuildingSearch buildings={mockBuildings} selectedBuilding={mockBuildings[0]} />,
      );

      // Should show selected building details
      expect(screen.getByRole('heading', { name: 'LIB' })).toBeTruthy();
      expect(screen.getByText('Navigate')).toBeTruthy();
    });

    it('hides selected building card when navigating', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: true,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      render(
        <GoogleMapBuildingSearch
          buildings={mockBuildings}
          selectedBuilding={mockBuildings[0]}
          isNavigating={true}
        />,
      );

      // Selected building card should be hidden during navigation
      expect(screen.queryByRole('heading', { name: 'LIB' })).toBeNull();
    });
  });

  describe('Google Maps integration', () => {
    it('opens Google Maps directions when Navigate is clicked', async () => {
      const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: true,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      render(
        <GoogleMapBuildingSearch buildings={mockBuildings} selectedBuilding={mockBuildings[0]} />,
      );

      const navigateButton = screen.getByRole('button', { name: 'Navigate' });
      await act(async () => {
        fireEvent.click(navigateButton);
      });

      expect(windowOpen).toHaveBeenCalledWith(
        expect.stringContaining('google.com/maps/dir'),
        '_blank',
        'noopener,noreferrer',
      );

      windowOpen.mockRestore();
    });

    it('opens building location in Google Maps when external link button clicked', async () => {
      const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: true,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      render(
        <GoogleMapBuildingSearch buildings={mockBuildings} selectedBuilding={mockBuildings[0]} />,
      );

      const externalButton = screen.getByTitle('Open in Google Maps');
      await act(async () => {
        fireEvent.click(externalButton);
      });

      expect(windowOpen).toHaveBeenCalledWith(
        expect.stringContaining('google.com/maps/search'),
        '_blank',
        'noopener,noreferrer',
      );

      windowOpen.mockRestore();
    });
  });
});
