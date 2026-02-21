export interface WeatherQuery {
  lat: number;
  lon: number;
}

export interface WeatherCurrent {
  temperature: number;
  apparentTemperature: number;
  precipitationProbability: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  condition: string;
}

export interface WeatherHourly {
  time: string[];
  temperature: number[];
  precipitationProbability: number[];
  weatherCode: number[];
  windSpeed: number[];
}

export interface WeatherResult {
  current: WeatherCurrent;
  hourly?: WeatherHourly;
  timezone: string;
  source: string;
  timestamp: number;
  modelUsed?: string;
}
