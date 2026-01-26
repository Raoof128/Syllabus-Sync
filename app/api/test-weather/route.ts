
import { NextRequest } from 'next/server';
import { jsonSuccess, jsonError, ERROR_CODES } from '@/app/api/_lib/response';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch('http://localhost:3000/api/weather?lat=-33.8688&lon=151.2093');
    const data = await response.json();
    return jsonSuccess(data);
  } catch (error) {
    return jsonError('Failed to fetch weather data', 500, ERROR_CODES.EXTERNAL_SERVICE_ERROR);
  }
}
