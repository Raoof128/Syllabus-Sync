import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NavigationStateManager } from '@/features/map/lib/realtimeNavigation';
import { useMapLocation } from '@/features/map/hooks/useMapLocation';
import { CAMPUS_CENTRE_GPS, GPS_CAMPUS_BOUNDS } from '@/features/map/lib/constants';
import { toastUtils } from '@/lib/utils/toast';
import { errorHandler } from '@/lib/utils/errorHandling';

vi.mock('@/lib/hooks/useTypedTranslation', () => ({
  useTypedTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/lib/utils/toast', () => ({
  toastUtils: {
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/utils/errorHandling', () => ({
  errorHandler: {
    logError: vi.fn(),
  },
}));

vi.mock('@/features/map/lib/geospatialCalibration', () => ({
  gpsToCrsSimple: vi.fn((lat: number, lng: number) => ({ lat, lng })),
}));

type HookProps = Parameters<typeof useMapLocation>[0];

function makePosition(lat: number, lng: number): GeolocationPosition {
  return {
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
  } as GeolocationPosition;
}

function makeGeoError(code: number, message: string): GeolocationPositionError {
  return {
    code,
    message,
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  } as GeolocationPositionError;
}

function installGeolocationMock(watchId: number = 1) {
  const originalGeolocation = navigator.geolocation;
  let successCallback: PositionCallback | null = null;
  let errorCallback: PositionErrorCallback | null = null;

  const watchPosition = vi.fn((success: PositionCallback, error?: PositionErrorCallback) => {
    successCallback = success;
    errorCallback = error || null;
    return watchId;
  });
  const clearWatch = vi.fn();

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
}

function createLeafletModuleMock() {
  let current = { lat: 0, lng: 0 };

  const marker = {
    addTo: vi.fn().mockReturnThis(),
    setLatLng: vi.fn((coords: [number, number]) => {
      current = { lat: coords[0], lng: coords[1] };
      return marker;
    }),
    getLatLng: vi.fn(() => current),
    getElement: vi.fn(() => null),
    remove: vi.fn(),
  };

  const circle = {
    addTo: vi.fn().mockReturnThis(),
    setLatLng: vi.fn().mockReturnThis(),
    setRadius: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  };

  const leafletModule = {
    marker: vi.fn(() => marker),
    circle: vi.fn(() => circle),
  } as unknown as HookProps['leafletModule'];

  return { leafletModule };
}

function createNavManager(status: string = 'idle'): NavigationStateManager {
  return {
    getState: vi.fn(() => ({ status })),
    updatePosition: vi.fn(),
    setMotionState: vi.fn(),
  } as unknown as NavigationStateManager;
}

describe('useMapLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tracks live location and can center map on user', async () => {
    const geo = installGeolocationMock(7);
    const { leafletModule } = createLeafletModuleMock();
    const flyTo = vi.fn();

    const props: HookProps = {
      mapInstance: { flyTo } as unknown as import('leaflet').Map,
      leafletModule,
      isMapReady: () => true,
      userIcon: {} as unknown as import('leaflet').Icon,
      navManagerRef: { current: createNavManager() },
    };

    const { result, unmount } = renderHook(() => useMapLocation(props));
    expect(geo.watchPosition).toHaveBeenCalledTimes(1);

    act(() => {
      geo.emitSuccess(makePosition(CAMPUS_CENTRE_GPS.lat, CAMPUS_CENTRE_GPS.lng));
    });

    await waitFor(() => {
      expect(result.current.locationStatus).toBe('found');
    });
    expect(result.current.origin).toEqual({
      lat: CAMPUS_CENTRE_GPS.lat,
      lng: CAMPUS_CENTRE_GPS.lng,
    });
    expect(result.current.isOffCampus).toBe(false);

    act(() => {
      result.current.centerOnUser();
    });
    expect(flyTo).toHaveBeenCalled();

    unmount();
    expect(geo.clearWatch).toHaveBeenCalledWith(7);
    geo.restore();
  });

  it('flags off-campus location and throttles warning toast', async () => {
    const geo = installGeolocationMock();
    const { leafletModule } = createLeafletModuleMock();

    const props: HookProps = {
      mapInstance: { flyTo: vi.fn() } as unknown as import('leaflet').Map,
      leafletModule,
      isMapReady: () => true,
      userIcon: {} as unknown as import('leaflet').Icon,
      navManagerRef: { current: createNavManager() },
    };

    const { result, unmount } = renderHook(() => useMapLocation(props));
    const outsideLat = GPS_CAMPUS_BOUNDS.north + 0.01;
    const outsideLng = GPS_CAMPUS_BOUNDS.east + 0.01;

    act(() => {
      geo.emitSuccess(makePosition(outsideLat, outsideLng));
      geo.emitSuccess(makePosition(outsideLat + 0.0003, outsideLng + 0.0003));
    });

    await waitFor(() => {
      expect(result.current.isOffCampus).toBe(true);
    });
    expect(toastUtils.warning).toHaveBeenCalledTimes(1);

    unmount();
    geo.restore();
  });

  it('sets denied status on permission error', async () => {
    const geo = installGeolocationMock();
    const { leafletModule } = createLeafletModuleMock();

    const props: HookProps = {
      mapInstance: { flyTo: vi.fn() } as unknown as import('leaflet').Map,
      leafletModule,
      isMapReady: () => true,
      userIcon: null,
      navManagerRef: { current: createNavManager() },
    };

    const { result, unmount } = renderHook(() => useMapLocation(props));

    act(() => {
      geo.emitError(makeGeoError(1, 'permission denied'));
    });

    await waitFor(() => {
      expect(result.current.locationStatus).toBe('denied');
    });
    expect(toastUtils.warning).toHaveBeenCalledWith(
      'Location Denied',
      'Please enable location access.',
    );

    unmount();
    geo.restore();
  });

  it('sets error status on timeout and throttles timeout toast', async () => {
    const geo = installGeolocationMock();
    const { leafletModule } = createLeafletModuleMock();

    const props: HookProps = {
      mapInstance: { flyTo: vi.fn() } as unknown as import('leaflet').Map,
      leafletModule,
      isMapReady: () => true,
      userIcon: null,
      navManagerRef: { current: createNavManager() },
    };

    const { result, unmount } = renderHook(() => useMapLocation(props));

    act(() => {
      geo.emitError(makeGeoError(3, 'timeout'));
      geo.emitError(makeGeoError(3, 'timeout'));
    });

    await waitFor(() => {
      expect(result.current.locationStatus).toBe('error');
    });
    expect(toastUtils.info).toHaveBeenCalledTimes(1);

    unmount();
    geo.restore();
  });

  it('logs unknown geolocation errors and clears watch id 0 on unmount', async () => {
    const geo = installGeolocationMock(0);
    const { leafletModule } = createLeafletModuleMock();

    const props: HookProps = {
      mapInstance: { flyTo: vi.fn() } as unknown as import('leaflet').Map,
      leafletModule,
      isMapReady: () => true,
      userIcon: null,
      navManagerRef: { current: createNavManager() },
    };

    const { result, unmount } = renderHook(() => useMapLocation(props));

    act(() => {
      geo.emitError(makeGeoError(2, 'position unavailable'));
    });

    await waitFor(() => {
      expect(result.current.locationStatus).toBe('error');
    });
    expect(errorHandler.logError).toHaveBeenCalled();
    expect(toastUtils.warning).toHaveBeenCalledWith(
      'Location Not Available',
      'Please wait for your location to be found.',
    );

    unmount();
    expect(geo.clearWatch).toHaveBeenCalledWith(0);
    geo.restore();
  });
});
