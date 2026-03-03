import { WeatherProvider } from './provider';
import { WeatherQuery, WeatherResult } from '../types';
import { normalizeGoogleResponse } from '../normalizeGoogle';

const GOOGLE_WEATHER_BASE = 'https://weather.googleapis.com/v1';

export class GoogleWeatherProvider implements WeatherProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getWeather(query: WeatherQuery): Promise<WeatherResult> {
    const locationParams = `location.latitude=${query.lat}&location.longitude=${query.lon}`;
    const keyParam = `key=${this.apiKey}`;

    const currentUrl = `${GOOGLE_WEATHER_BASE}/currentConditions:lookup?${keyParam}&${locationParams}`;
    const hourlyUrl = `${GOOGLE_WEATHER_BASE}/forecast/hours:lookup?${keyParam}&${locationParams}&hours=12&pageSize=12`;

    const [currentRes, hourlyRes] = await Promise.all([
      fetch(currentUrl, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 300 },
      }),
      fetch(hourlyUrl, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 300 },
      }),
    ]);

    if (!currentRes.ok) {
      throw new Error(
        `Google Weather API error (currentConditions): ${currentRes.status} ${currentRes.statusText}`,
      );
    }

    const currentData = await currentRes.json();

    // Hourly is non-critical — degrade gracefully
    let hourlyData = null;
    if (hourlyRes.ok) {
      hourlyData = await hourlyRes.json();
    }

    return normalizeGoogleResponse(currentData, hourlyData);
  }
}
