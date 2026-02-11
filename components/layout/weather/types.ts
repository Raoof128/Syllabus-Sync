export type SydneyRegion = {
  id: string;
  name: string;
  lat: number;
  lon: number;
};

export type Vibe = 'sunny' | 'cloudy' | 'rainy' | 'thunder' | 'snowy' | 'windy' | 'night';

export interface WeatherData {
  temp: number;
  condition: string;
  location: string;
  vibe: Vibe;
  isDay: boolean;
  timestamp?: number;
}
