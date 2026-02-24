import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WeatherWidget from '../../components/layout/WeatherWidget';
import { SYDNEY_REGIONS } from '../../components/layout/weather/constants';
import * as useWeatherHook from '../../components/layout/weather/useWeather';

// Mock the custom hook
vi.mock('../../components/layout/weather/useWeather', () => ({
  useWeather: vi.fn(),
}));

describe('WeatherWidget', () => {
  const mockHandleRegionChange = vi.fn();
  const mockRetry = vi.fn();

  const defaultMockReturn = {
    weatherData: null,
    loading: true,
    error: null,
    selectedRegion: SYDNEY_REGIONS[0],
    handleRegionChange: mockHandleRegionChange,
    useGps: true,
    enableGps: vi.fn(),
    retry: mockRetry,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state correctly', () => {
    vi.spyOn(useWeatherHook, 'useWeather').mockReturnValue({
      ...defaultMockReturn,
      loading: true,
    });

    render(<WeatherWidget />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render error state and retry button', () => {
    vi.spyOn(useWeatherHook, 'useWeather').mockReturnValue({
      ...defaultMockReturn,
      loading: false,
      error: 'Failed to fetch weather',
      weatherData: null,
    });

    render(<WeatherWidget />);

    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('should render weather data correctly when loaded', () => {
    const mockWeatherData = {
      temp: 22,
      condition: 'Sunny',
      location: 'Macquarie Uni',
      vibe: 'sunny' as const,
      isDay: true,
      timestamp: Date.now(),
    };

    vi.spyOn(useWeatherHook, 'useWeather').mockReturnValue({
      ...defaultMockReturn,
      loading: false,
      weatherData: mockWeatherData,
    });

    render(<WeatherWidget />);

    expect(screen.getByText('22°')).toBeInTheDocument();
    expect(screen.getByText('Sunny')).toBeInTheDocument();

    // Location is in aria-label and title, not visible text
    const widgetButton = screen.getByRole('button', { name: /Macquarie Uni/i });
    expect(widgetButton).toBeInTheDocument();
    expect(widgetButton).toHaveAttribute('title', expect.stringContaining('Macquarie Uni'));
  });

  it('should toggle region dropdown on click', () => {
    const mockWeatherData = {
      temp: 22,
      condition: 'Sunny',
      location: 'Macquarie Uni',
      vibe: 'sunny' as const,
      isDay: true,
      timestamp: Date.now(),
    };

    vi.spyOn(useWeatherHook, 'useWeather').mockReturnValue({
      ...defaultMockReturn,
      loading: false,
      weatherData: mockWeatherData,
    });

    render(<WeatherWidget />);

    const triggerButton = screen.getByRole('button', { expanded: false });
    fireEvent.click(triggerButton);

    // Check if dropdown content is visible
    // The dropdown items should be visible now
    expect(screen.getByText('Sydney CBD')).toBeInTheDocument();

    // Click again to close
    fireEvent.click(triggerButton);
    // Note: asserting it's not visible might depend on implementation (if conditional rendering or CSS hidden)
    // In this component, it seems to be conditional rendering
    expect(screen.queryByText('Sydney CBD')).not.toBeInTheDocument();
  });

  it('should call handleRegionChange when a region is selected', () => {
    const mockWeatherData = {
      temp: 22,
      condition: 'Sunny',
      location: 'Macquarie Uni',
      vibe: 'sunny' as const,
      isDay: true,
      timestamp: Date.now(),
    };

    vi.spyOn(useWeatherHook, 'useWeather').mockReturnValue({
      ...defaultMockReturn,
      loading: false,
      weatherData: mockWeatherData,
    });

    render(<WeatherWidget />);

    // Open dropdown
    const triggerButton = screen.getByRole('button', { expanded: false });
    fireEvent.click(triggerButton);

    // Click on a different region
    const regionOption = screen.getByText('Sydney CBD');
    fireEvent.click(regionOption);

    expect(mockHandleRegionChange).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Sydney CBD' }),
    );
  });

  it('should close dropdown when clicking outside', async () => {
    const mockWeatherData = {
      temp: 22,
      condition: 'Sunny',
      location: 'Macquarie Uni',
      vibe: 'sunny' as const,
      isDay: true,
      timestamp: Date.now(),
    };

    vi.spyOn(useWeatherHook, 'useWeather').mockReturnValue({
      ...defaultMockReturn,
      loading: false,
      weatherData: mockWeatherData,
    });

    render(<WeatherWidget />);

    // Open dropdown
    const triggerButton = screen.getByRole('button', { expanded: false });
    fireEvent.click(triggerButton);
    expect(screen.getByText('Sydney CBD')).toBeInTheDocument();

    // Click outside
    fireEvent.click(document.body);

    await waitFor(() => {
      expect(screen.queryByText('Sydney CBD')).not.toBeInTheDocument();
    });
  });
});
