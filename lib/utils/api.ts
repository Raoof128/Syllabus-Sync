import { withRetry, retryConditions, RetryError } from './retry';

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

export interface ApiRequestOptions extends RequestInit {
  /** Disable retry logic for this request */
  noRetry?: boolean;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
}

/**
 * Makes an API request with automatic retry logic for network and server errors.
 * Retries on: network failures, timeouts, and 5xx server errors.
 * Does NOT retry on: 4xx client errors (400, 401, 403, 404, etc.)
 */
export async function apiRequest<T>(input: RequestInfo, init?: ApiRequestOptions): Promise<T> {
  const { noRetry = false, maxRetries = 3, ...fetchInit } = init || {};

  const executeRequest = async (): Promise<T> => {
    const response = await fetch(input, fetchInit);
    const data = (await response.json().catch(() => null)) as T | ApiSuccessResponse<T> | null;

    if (!response.ok) {
      // Handle different error response formats
      if (data && typeof data === 'object' && 'error' in data) {
        const errorData = (data as ApiSuccessResponse).error;
        if (errorData && typeof errorData === 'object' && 'message' in errorData) {
          throw new Error(`${response.status}: ${errorData.message}`);
        } else if (typeof errorData === 'string') {
          throw new Error(`${response.status}: ${errorData}`);
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
  };

  // If retry is disabled, execute directly
  if (noRetry) {
    return executeRequest();
  }

  // Execute with retry logic
  try {
    return await withRetry(executeRequest, {
      maxAttempts: maxRetries,
      delayMs: 1000,
      backoffMultiplier: 2,
      retryCondition: (error: Error) => {
        // Retry on network errors
        if (retryConditions.networkError(error)) {
          return true;
        }
        // Retry on server errors (5xx)
        if (retryConditions.serverError(error)) {
          return true;
        }
        // Don't retry on client errors (4xx) - these are not transient
        return false;
      },
    });
  } catch (error) {
    // Unwrap RetryError to return the original error message
    if (error instanceof RetryError) {
      throw error.lastError;
    }
    throw error;
  }
}
