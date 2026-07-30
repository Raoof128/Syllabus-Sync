import { WeatherProvider } from './provider';
import { WeatherQuery, WeatherResult } from '../types';
import { normalizeOpenMeteoResponse } from '../normalize';

const OPENMETEO_BASE_URL = 'https://api.open-meteo.com/v1';

export class OpenMeteoProvider implements WeatherProvider {
  async getWeather(query: WeatherQuery): Promise<WeatherResult> {
    const url = new URL(`${OPENMETEO_BASE_URL}/forecast`);
    url.searchParams.set('latitude', query.lat.toString());
    url.searchParams.set('longitude', query.lon.toString());
    url.searchParams.set(
      'current',
      'temperature_2m,apparent_temperature,precipitation_probability,weather_code,is_day,wind_speed_10m',
    );
    url.searchParams.set(
      'hourly',
      'temperature_2m,precipitation_probability,weather_code,wind_speed_10m',
    );
    url.searchParams.set('timezone', 'Australia/Sydney');
    url.searchParams.set('models', 'best_match');
    url.searchParams.set('forecast_days', '1');

    // AVAILABILITY: see googleWeatherProvider — `next.revalidate` does not bound
    // the request, so an upstream that stalls rather than failing would hang the
    // weather route instead of degrading.
    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(2_500),
    });

    if (!response.ok) {
      throw new Error(`OpenMeteo API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return normalizeOpenMeteoResponse(data);
  }
}
