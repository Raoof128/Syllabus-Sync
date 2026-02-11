import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useWeather } from '../../components/layout/weather/useWeather';
import { SYDNEY_REGIONS } from '../../components/layout/weather/constants';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('useWeather Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();

    // Default successful response
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          current_weather: {
            temperature: 25,
            weathercode: 0,
            is_day: 1,
          },
        },
      }),
    });
  });

  it('should initialize with default region and loading state', async () => {
    const { result } = renderHook(() => useWeather());

    expect(result.current.loading).toBe(true);
    expect(result.current.selectedRegion).toEqual(SYDNEY_REGIONS[0]);
    expect(result.current.error).toBeNull();
    expect(result.current.weatherData).toBeNull();

    // Wait for initial fetch to complete
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('should fetch and set weather data successfully', async () => {
    const { result } = renderHook(() => useWeather());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.weatherData).toEqual({
      temp: 25,
      condition: 'Clear sky',
      location: 'Macquarie Uni',
      vibe: 'sunny',
      isDay: true,
      timestamp: expect.any(Number),
    });
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => useWeather());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Weather service unreachable');
    expect(result.current.weatherData).toBeNull();
  });

  it('should handle invalid data from API', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          current_weather: {
            // Missing temperature
            weathercode: 0,
            is_day: 1,
          },
        },
      }),
    });

    const { result } = renderHook(() => useWeather());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Invalid weather data');
  });

  it('should load selected region from localStorage on mount', async () => {
    const savedRegion = SYDNEY_REGIONS[1]; // Sydney CBD
    localStorageMock.getItem.mockReturnValue(savedRegion.id);

    const { result } = renderHook(() => useWeather());

    // It might take a tick to update state from effect
    await waitFor(() => {
      expect(result.current.selectedRegion.id).toBe(savedRegion.id);
    });
  });

  it('should update selected region and trigger new fetch', async () => {
    const { result } = renderHook(() => useWeather());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const newRegion = SYDNEY_REGIONS[1]; // Sydney CBD

    act(() => {
      result.current.handleRegionChange(newRegion);
    });

    // Check that state updated
    expect(result.current.selectedRegion).toEqual(newRegion);

    // Should verify localStorage update
    expect(localStorageMock.setItem).toHaveBeenCalledWith('mq-weather-region', newRegion.id);

    // Wait for fetch to complete (which means loading becomes false again)
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Verify fetch was called with new coordinates
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`lat=${newRegion.lat}&lon=${newRegion.lon}`),
    );
  });

  it('should use cached data if available and fresh', async () => {
    const region = SYDNEY_REGIONS[0];
    const cachedData = {
      temp: 20,
      condition: 'Cloudy',
      location: region.name,
      vibe: 'cloudy',
      isDay: true,
      timestamp: Date.now(), // Fresh
    };

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === `mq-weather-cache-${region.id}`) {
        return JSON.stringify({ timestamp: Date.now(), data: cachedData });
      }
      return null;
    });

    const { result } = renderHook(() => useWeather());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.weatherData).toEqual(cachedData);
    expect(fetchMock).not.toHaveBeenCalled(); // Should not fetch if cache is valid
  });

  it('should ignore expired cache', async () => {
    const region = SYDNEY_REGIONS[0];
    const expiredData = {
      temp: 20,
      condition: 'Cloudy',
      location: region.name,
      vibe: 'cloudy',
      isDay: true,
      timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes ago (expired)
    };

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === `mq-weather-cache-${region.id}`) {
        return JSON.stringify({ timestamp: expiredData.timestamp, data: expiredData });
      }
      return null;
    });

    const { result } = renderHook(() => useWeather());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchMock).toHaveBeenCalled(); // Should fetch because cache is expired
    // The result will be the mocked fetch response (25 degrees), not the expired cache (20 degrees)
    expect(result.current.weatherData?.temp).toBe(25);
  });
});
