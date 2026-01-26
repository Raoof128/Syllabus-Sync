
import { useWeather } from './lib/hooks/useWeather';

export default function TestWeather() {
  const { weatherData, loading, error } = useWeather();
  
  console.log('Weather data:', weatherData);
  console.log('Loading:', loading);
  console.log('Error:', error);
  
  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {weatherData && (
        <div>
          <div>Temperature: {weatherData.temp}°</div>
          <div>Condition: {weatherData.condition}</div>
          <div>Location: {weatherData.location}</div>
          <div>Vibe: {weatherData.vibe}</div>
        </div>
      )}
    </div>
  );
}
