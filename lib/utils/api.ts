import { withRetry, retryConditions, RetryError } from "./retry";

export interface ApiErrorResponse {
  error:
    | string
    | { code: string; message: string; details?: Record<string, unknown> };
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
  /** Skip CSRF token (for GET requests or special cases) */
  skipCsrf?: boolean;
}

/**
 * Returns true when an error likely represents a browser/network fetch failure
 * (offline, DNS, CORS/network interruption), not an API business error.
 */
export function isLikelyNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("load failed")
  );
}

/**
 * Browser offline hint.
 */
export function isBrowserOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

// ============================================================================
// CSRF TOKEN HELPERS
// ============================================================================

const CSRF_COOKIE_NAME = "__Host-csrf";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Get CSRF token from cookie
 */
function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === CSRF_COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Generate and set a new CSRF token (called on app init)
 */
export function initCsrfToken(): string {
  if (typeof document === "undefined") return "";

  // Check if token already exists
  let token = getCsrfToken();
  if (token) return token;

  // Generate new token
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  token = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );

  // Set cookie (secure in production, sameSite strict)
  const isSecure = window.location.protocol === "https:";
  const cookieValue = `${CSRF_COOKIE_NAME}=${token}; path=/; max-age=86400; samesite=strict${isSecure ? "; secure" : ""}`;
  document.cookie = cookieValue;

  return token;
}

// Methods that require CSRF protection
const MUTATION_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

/**
 * Makes an API request with automatic retry logic for network and server errors.
 * Retries on: network failures, timeouts, and 5xx server errors.
 * Does NOT retry on: 4xx client errors (400, 401, 403, 404, etc.)
 *
 * SECURITY: Automatically includes CSRF token for mutation requests (POST, PUT, PATCH, DELETE)
 */
export async function apiRequest<T>(
  input: RequestInfo,
  init?: ApiRequestOptions,
): Promise<T> {
  const {
    noRetry = false,
    maxRetries = 3,
    skipCsrf = false,
    ...fetchInit
  } = init || {};

  // Add CSRF token for mutation methods
  const method = (fetchInit.method || "GET").toUpperCase();
  if (!skipCsrf && MUTATION_METHODS.includes(method)) {
    const csrfToken = getCsrfToken() || initCsrfToken();
    if (csrfToken) {
      fetchInit.headers = {
        ...fetchInit.headers,
        [CSRF_HEADER_NAME]: csrfToken,
      };
    }
  }

  // Ensure cookies are sent with requests (critical for Supabase auth)
  if (!fetchInit.credentials) {
    fetchInit.credentials = "include";
  }

  const executeRequest = async (): Promise<T> => {
    const response = await fetch(input, fetchInit);
    const data = (await response.json().catch(() => null)) as
      | T
      | ApiSuccessResponse<T>
      | null;

    if (!response.ok) {
      // Handle different error response formats
      if (data && typeof data === "object" && "error" in data) {
        const errorData = (data as ApiSuccessResponse).error;
        if (
          errorData &&
          typeof errorData === "object" &&
          "message" in errorData
        ) {
          throw new Error(`${response.status}: ${errorData.message}`);
        } else if (typeof errorData === "string") {
          throw new Error(`${response.status}: ${errorData}`);
        }
      }
      throw new Error(`Request failed with ${response.status}`);
    }

    // Handle success response format
    if (data && typeof data === "object" && "success" in data) {
      const apiResponse = data as ApiSuccessResponse<T>;
      if (!apiResponse.success) {
        const errorMessage = apiResponse.error?.message || "API request failed";
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
