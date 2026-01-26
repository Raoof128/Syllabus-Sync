// Test script for determineVibe function
const WeatherCode = {
  CLEAR_SKY: 0,
  PARTLY_CLOUDY: 1,
  CLOUDY: 2,
  OVERCAST: 3,
  FOGGY: 45,
  RIME_FOG: 48,
  LIGHT_DRIZZLE: 51,
  MODERATE_DRIZZLE: 53,
  DENSE_DRIZZLE: 55,
  LIGHT_FREEZING_DRIZZLE: 56,
  DENSE_FREEZING_DRIZZLE: 57,
  SLIGHT_RAIN: 61,
  MODERATE_RAIN: 63,
  HEAVY_RAIN: 65,
  LIGHT_FREEZING_RAIN: 66,
  HEAVY_FREEZING_RAIN: 67,
  SLIGHT_SNOW: 71,
  MODERATE_SNOW: 73,
  HEAVY_SNOW: 75,
  SNOW_GRAINS: 77,
  SLIGHT_RAIN_SHOWERS: 80,
  MODERATE_RAIN_SHOWERS: 81,
  VIOLENT_RAIN_SHOWERS: 82,
  SLIGHT_SNOW_SHOWERS: 85,
  HEAVY_SNOW_SHOWERS: 86,
  THUNDERSTORM: 95,
  THUNDERSTORM_WITH_HAIL: 96,
  THUNDERSTORM_WITH_HEAVY_HAIL: 99,
};

const determineVibe = (weatherCode, isDay) => {
  if (!isDay) return 'night';
  if (weatherCode === WeatherCode.CLEAR_SKY) return 'sunny';
  if ([WeatherCode.PARTLY_CLOUDY, WeatherCode.CLOUDY, WeatherCode.OVERCAST].includes(weatherCode))
    return 'cloudy';
  if (
    [
      WeatherCode.LIGHT_DRIZZLE,
      WeatherCode.MODERATE_DRIZZLE,
      WeatherCode.DENSE_DRIZZLE,
      WeatherCode.LIGHT_FREEZING_DRIZZLE,
      WeatherCode.DENSE_FREEZING_DRIZZLE,
      WeatherCode.SLIGHT_RAIN,
      WeatherCode.MODERATE_RAIN,
      WeatherCode.HEAVY_RAIN,
      WeatherCode.LIGHT_FREEZING_RAIN,
      WeatherCode.HEAVY_FREEZING_RAIN,
      WeatherCode.SLIGHT_RAIN_SHOWERS,
      WeatherCode.MODERATE_RAIN_SHOWERS,
      WeatherCode.VIOLENT_RAIN_SHOWERS,
    ].includes(weatherCode)
  )
    return 'rainy';
  if (
    [
      WeatherCode.SLIGHT_SNOW,
      WeatherCode.MODERATE_SNOW,
      WeatherCode.HEAVY_SNOW,
      WeatherCode.SNOW_GRAINS,
      WeatherCode.SLIGHT_SNOW_SHOWERS,
      WeatherCode.HEAVY_SNOW_SHOWERS,
    ].includes(weatherCode)
  )
    return 'snowy';
  if (
    [
      WeatherCode.THUNDERSTORM,
      WeatherCode.THUNDERSTORM_WITH_HAIL,
      WeatherCode.THUNDERSTORM_WITH_HEAVY_HAIL,
    ].includes(weatherCode)
  )
    return 'thunder';
  return 'windy';
};

// Test all weather codes for both day and night
console.log('=== Daytime Vibes ===');
Object.keys(WeatherCode).forEach((key) => {
  const code = WeatherCode[key];
  const vibe = determineVibe(code, true);
  console.log(`${key} (${code}): ${vibe}`);
});

console.log('\n=== Nighttime Vibes ===');
Object.keys(WeatherCode).forEach((key) => {
  const code = WeatherCode[key];
  const vibe = determineVibe(code, false);
  console.log(`${key} (${code}): ${vibe}`);
});
