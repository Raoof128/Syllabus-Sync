import { renderHook, act, waitFor } from '@testing-library/react';
import { useMapNavigation } from '@/app/map/hooks/useMapNavigation';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NavigationStateManager } from '@/lib/map/realtimeNavigation';
import * as orsService from '@/lib/services/ors';
import { toastUtils } from '@/lib/utils/toast';

// Mock dependencies
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

vi.mock('@/lib/services/ors', () => ({
  fetchORSRoute: vi.fn(),
}));

// Mock NavigationStateManager
const mockNavManager = {
  setOnStateChange: vi.fn(),
  startNavigation: vi.fn(),
  stopNavigation: vi.fn(),
  updatePosition: vi.fn(),
  setMotionState: vi.fn(),
} as unknown as NavigationStateManager;

describe('useMapNavigation', () => {
  const mockNavManagerRef = { current: mockNavManager };
  const mockGpsToCrsSimple = vi.fn((lat, lng) => ({ lat, lng }));
  const mockGetBuildingLatLng = vi.fn(() => ({ lat: 10, lng: 10 }));

  const defaultProps = {
    selectedBuilding: undefined,
    origin: null,
    isOffCampus: false,
    navManagerRef: mockNavManagerRef,
    gpsToCrsSimple: mockGpsToCrsSimple,
    getBuildingLatLng: mockGetBuildingLatLng,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useMapNavigation(defaultProps));

    expect(result.current.isNavigating).toBe(false);
    expect(result.current.routeCoords).toEqual([]);
    expect(result.current.preview).toBeNull();
    expect(result.current.routeError).toBeNull();
  });

  it('should fetch route when origin and selectedBuilding are present', async () => {
    const mockRouteData = {
      coordinates: [
        [0, 0],
        [1, 1],
      ], // [lng, lat] from ORS
      preview: { distanceMeters: 100, durationSeconds: 60 },
      error: null,
    };

    // Reset mock implementation to return specific data if needed, or rely on default
    // @ts-ignore
    orsService.fetchORSRoute.mockResolvedValue(mockRouteData);

    const props = {
      ...defaultProps,
      origin: { lat: 0, lng: 0 },
      selectedBuilding: {
        id: 'b1',
        name: 'Building 1',
        type: 'academic',
        location: { lat: 1, lng: 1 },
      } as any,
    };

    const { result } = renderHook(() => useMapNavigation(props));

    // Trigger timeout
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    // Allow async state updates to flush
    await act(async () => {});

    expect(result.current.preview).toEqual(mockRouteData.preview);

    expect(orsService.fetchORSRoute).toHaveBeenCalledWith(
      props.origin,
      expect.anything(), // destGps
    );
    // gpsRouteCoords is internal, so we check routeCoords (pixel) or preview
    expect(result.current.routeCoords.length).toBeGreaterThan(0);
  });

  it('should prevent navigation if off-campus', () => {
    const props = {
      ...defaultProps,
      isOffCampus: true,
    };

    const { result } = renderHook(() => useMapNavigation(props));

    act(() => {
      result.current.startNavigation();
    });

    expect(result.current.isNavigating).toBe(false);
    expect(toastUtils.warning).toHaveBeenCalledWith(
      'Outside campus boundary',
      'Navigation is disabled while you are outside campus.',
    );
  });

  it('should start navigation when conditions are met', async () => {
    const mockRouteData = {
      coordinates: [
        [0, 0],
        [1, 1],
      ],
      preview: { distanceMeters: 100, durationSeconds: 60 },
      error: null,
    };
    // @ts-ignore
    vi.spyOn(orsService, 'fetchORSRoute').mockResolvedValue(mockRouteData);

    const props = {
      ...defaultProps,
      origin: { lat: 0, lng: 0 },
      selectedBuilding: {
        id: 'b1',
        name: 'Building 1',
        type: 'academic',
        location: { lat: 1, lng: 1 },
      } as any,
    };

    const { result } = renderHook(() => useMapNavigation(props));

    // Wait for route to load
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    await act(async () => {});

    expect(result.current.preview).not.toBeNull();

    // Start navigation
    act(() => {
      result.current.startNavigation();
    });

    expect(result.current.isNavigating).toBe(true);
    expect(mockNavManager.startNavigation).toHaveBeenCalled();
    expect(toastUtils.success).toHaveBeenCalled();
  });
});
