import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GoogleMapIntegration,
  type GoogleMapRef,
} from '@/features/map/components/GoogleMapIntegration';
import { CAMPUS_CENTRE_GPS } from '@/features/map/lib/constants';

vi.mock('@/lib/hooks/useTypedTranslation', () => ({
  useTypedTranslation: () => ({
    t: (k: string, params?: Record<string, string | number>) => {
      if (k === 'googleMapsViewAt' && params?.destination)
        return `Google Maps — ${params.destination}`;
      if (k === 'googleMapsDirectionsTo' && params?.destination)
        return `Directions to ${params.destination}`;
      return k;
    },
  }),
}));

vi.mock('@/lib/hooks/useSafeTranslation', () => ({
  useSafeTranslation: () => ({
    t: (k: string, params?: Record<string, string | number>) => {
      if (k === 'googleMapsViewAt' && params?.destination)
        return `Google Maps — ${params.destination}`;
      if (k === 'googleMapsDirectionsTo' && params?.destination)
        return `Directions to ${params.destination}`;
      return k;
    },
    safeT: (_k: string, fallback: string) => fallback,
  }),
}));

const TEST_EMBED_KEY = 'test-embed-key-123';
const TEST_API_KEY = 'test-api-key-456';

describe('GoogleMapIntegration', () => {
  const installGeolocationMock = (
    watchImpl?: (success: PositionCallback, error?: PositionErrorCallback) => number,
  ) => {
    const originalGeolocation = navigator.geolocation;
    const clearWatch = vi.fn();
    let successCallback: PositionCallback | null = null;
    let errorCallback: PositionErrorCallback | null = null;
    const watchPosition = vi
      .fn()
      .mockImplementation((success: PositionCallback, error?: PositionErrorCallback) => {
        successCallback = success;
        errorCallback = error || null;
        if (watchImpl) return watchImpl(success, error);
        return 1;
      }) as unknown as Geolocation['watchPosition'];

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        watchPosition,
        clearWatch,
      } as unknown as Geolocation,
    });

    const restore = () => {
      if (typeof originalGeolocation === 'undefined') {
        Reflect.deleteProperty(navigator, 'geolocation');
        return;
      }
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: originalGeolocation,
      });
    };

    return {
      watchPosition,
      clearWatch,
      emitSuccess: (position: GeolocationPosition) => successCallback?.(position),
      emitError: (error: GeolocationPositionError) => errorCallback?.(error),
      restore,
    };
  };

  const makePosition = (lat: number, lng: number): GeolocationPosition =>
    ({
      coords: {
        latitude: lat,
        longitude: lng,
        accuracy: 5,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    }) as GeolocationPosition;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY = TEST_EMBED_KEY;
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = TEST_API_KEY;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  });

  it('renders the iframe in view mode by default', () => {
    render(<GoogleMapIntegration />);
    const iframe = screen.getByTitle('Google Maps — Macquarie University');
    expect(iframe).toBeTruthy();
    expect(iframe.getAttribute('src')).toContain('maps/embed/v1/place');
    expect(iframe.getAttribute('src')).toContain(`key=${TEST_EMBED_KEY}`);
  });

  it('switches to directions mode via ref', () => {
    const ref = React.createRef<GoogleMapRef>();
    render(<GoogleMapIntegration ref={ref} />);

    expect(ref.current).toBeTruthy();
    act(() => {
      ref.current?.startNavigation();
    });

    const iframe = screen.getByTitle('Directions to Macquarie University');
    expect(iframe.getAttribute('src')).toContain('maps/embed/v1/directions');
    expect(iframe.getAttribute('src')).toContain(
      `origin=${encodeURIComponent(`${CAMPUS_CENTRE_GPS.lat},${CAMPUS_CENTRE_GPS.lng}`)}`,
    );
    expect(iframe.getAttribute('src')).toContain('mode=walking');
  });

  it('switches back to view mode via ref or back button', () => {
    const ref = React.createRef<GoogleMapRef>();
    render(<GoogleMapIntegration ref={ref} />);

    act(() => {
      ref.current?.startNavigation();
    });

    fireEvent.click(screen.getByRole('button', { name: 'backToMap' }));

    expect(screen.getByTitle('Google Maps — Macquarie University')).toBeTruthy();
  });

  it('clears geolocation watch on unmount when watch id is 0', () => {
    const { watchPosition, clearWatch, restore } = installGeolocationMock(() => 0);

    const { unmount } = render(<GoogleMapIntegration />);
    expect(watchPosition).toHaveBeenCalledTimes(1);

    unmount();
    expect(clearWatch).toHaveBeenCalledWith(0);
    restore();
  });

  it('emits live navigation state transitions via callback', () => {
    const { restore } = installGeolocationMock();
    const onNavStateChange = vi.fn();
    const ref = React.createRef<GoogleMapRef>();

    const { unmount } = render(
      <GoogleMapIntegration ref={ref} onNavStateChange={onNavStateChange} />,
    );

    act(() => {
      ref.current?.startNavigation();
    });
    act(() => {
      ref.current?.stopNavigation();
    });

    expect(onNavStateChange).toHaveBeenCalledWith({
      isNavigating: true,
      status: 'navigating',
    });
    expect(onNavStateChange).toHaveBeenCalledWith({
      isNavigating: false,
      status: 'idle',
    });

    unmount();
    restore();
  });

  describe('fallback (no API key)', () => {
    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    });

    it('renders fallback embedded view iframe when no API key', () => {
      render(<GoogleMapIntegration />);
      const iframe = screen.getByTitle('Google Maps — Macquarie University');
      expect(iframe).toBeTruthy();
      // Check that it uses the fallback URL format
      expect(iframe.getAttribute('src')).toContain('google.com/maps/embed');
    });
  });

  describe('selectedBuilding prop', () => {
    it('displays selected building in header when provided', () => {
      const testBuilding = {
        id: 'LIB',
        name: 'Waranara Library',
        position: [2345, 2388] as [number, number],
        translationKey: 'building_LIB_name' as const,
        descriptionKey: 'building_LIB_desc' as const,
      };

      render(<GoogleMapIntegration selectedBuilding={testBuilding} />);
      expect(screen.getByText('LIB')).toBeTruthy();
    });

    it('updates iframe URL when building is selected', () => {
      const testBuilding = {
        id: 'LIB',
        name: 'Waranara Library',
        position: [2345, 2388] as [number, number],
        translationKey: 'building_LIB_name' as const,
        descriptionKey: 'building_LIB_desc' as const,
        location: { lat: -33.7756994, lng: 151.1131306 },
      };

      render(<GoogleMapIntegration selectedBuilding={testBuilding} />);
      const iframe = document.querySelector('iframe');
      expect(iframe?.getAttribute('src')).toContain('Waranara');
    });
  });
});
