import { jsonSuccess, jsonError, ERROR_CODES } from '@/app/api/_lib/response';

export async function GET() {
  try {
    const response = await fetch('http://localhost:3000/api/weather?lat=-33.8688&lon=151.2093');
    const data = await response.json();
    return jsonSuccess(data);
  } catch (error) {
    console.error('Test weather API error:', error);
    return jsonError('Failed to fetch weather data', 500, ERROR_CODES.EXTERNAL_SERVICE_ERROR);
  }
}
