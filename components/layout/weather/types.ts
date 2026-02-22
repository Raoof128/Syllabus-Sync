export type SydneyRegion = {
  id: string;
  name: string;
  lat: number;
  lon: number;
};

export type Vibe =
  | "sunny"
  | "cloudy"
  | "rainy"
  | "thunder"
  | "snowy"
  | "windy"
  | "night";

export interface WeatherData {
  temp: number;
  apparentTemp?: number;
  precipProb?: number;
  windSpeed?: number;
  condition: string;
  location: string;
  locationType?: "gps" | "building" | "saved" | "approx";
  vibe: Vibe;
  isDay: boolean;
  timestamp?: number;
}
