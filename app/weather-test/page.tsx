
'use client';

import { useEffect, useState } from 'react';

interface WeatherData {
  temp: number;
  condition: string;
  location: string;
  vibe: string;
  date: string;
  isDay: boolean;
  hourlyTemps: number[];
}

export default function WeatherTestPage() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch('/api/test-weather');
        const result = await response.json();
        console.log('Weather API response:', result);
        
        if (result.success) {
          setWeatherData(result.data.data);
        } else {
          setError(result.error?.message || 'Failed to fetch weather');
        }
      } catch (err) {
        setError('Network error');
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold mb-6">Weather Data</h1>
      <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
        {JSON.stringify(weatherData, null, 2)}
      </pre>
    </div>
  );
}
