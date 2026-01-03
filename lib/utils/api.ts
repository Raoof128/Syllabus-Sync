export interface ApiErrorResponse {
  error: string | { code: string; message: string; details?: Record<string, unknown> };
}

export interface ApiSuccessResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export async function apiRequest<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const data = (await response.json().catch(() => null)) as T | ApiSuccessResponse<T> | null;

  if (!response.ok) {
    // Handle different error response formats
    if (data && typeof data === 'object' && 'error' in data) {
      const errorData = (data as ApiSuccessResponse).error;
      if (errorData && typeof errorData === 'object' && 'message' in errorData) {
        throw new Error(errorData.message);
      } else if (typeof errorData === 'string') {
        throw new Error(errorData);
      }
    }
    throw new Error(`Request failed with ${response.status}`);
  }

  // Handle success response format
  if (data && typeof data === 'object' && 'success' in data) {
    const apiResponse = data as ApiSuccessResponse<T>;
    if (!apiResponse.success) {
      const errorMessage = apiResponse.error?.message || 'API request failed';
      throw new Error(errorMessage);
    }
    return apiResponse.data as T;
  }

  return data as T;
}
