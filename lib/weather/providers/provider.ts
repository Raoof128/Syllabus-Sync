import { WeatherQuery, WeatherResult } from "../types";

export interface WeatherProvider {
  getWeather(query: WeatherQuery): Promise<WeatherResult>;
}
