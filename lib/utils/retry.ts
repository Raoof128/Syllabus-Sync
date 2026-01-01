/**
 * Retry utility for handling transient failures
 */

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: Error) => boolean;
}

export class RetryError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError: Error,
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

/**
 * Executes a function with retry logic
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    retryCondition = () => true,
  } = options;

  let lastError: Error;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt or if condition fails
      if (attempt === maxAttempts || !retryCondition(lastError)) {
        throw new RetryError(`Operation failed after ${attempt} attempts`, attempt, lastError);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay *= backoffMultiplier;
    }
  }

  // This should never be reached, but TypeScript requires it
  throw new RetryError(`Operation failed after ${maxAttempts} attempts`, maxAttempts, lastError!);
}

/**
 * Common retry conditions for different types of errors
 */
export const retryConditions = {
  // Retry on network errors
  networkError: (error: Error) => {
    const networkErrors = ['NetworkError', 'TimeoutError', 'AbortError'];
    return (
      networkErrors.some((type) => error.name.includes(type)) ||
      error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('fetch')
    );
  },

  // Retry on server errors (5xx)
  serverError: (error: Error) => {
    return (
      error.message.includes('500') ||
      error.message.includes('502') ||
      error.message.includes('503') ||
      error.message.includes('504')
    );
  },

  // Retry on all errors (be careful with this one)
  always: () => true,

  // Never retry
  never: () => false,
};

/**
 * Creates a retry wrapper with predefined options
 */
export function createRetryWrapper(options: RetryOptions) {
  return <T>(fn: () => Promise<T>) => withRetry(fn, options);
}

/**
 * Pre-configured retry wrappers for common scenarios
 */
export const retryWrappers = {
  // For API calls
  apiCall: createRetryWrapper({
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
    retryCondition: retryConditions.networkError,
  }),

  // For critical operations
  critical: createRetryWrapper({
    maxAttempts: 5,
    delayMs: 500,
    backoffMultiplier: 1.5,
    retryCondition: retryConditions.always,
  }),

  // For fast operations
  fast: createRetryWrapper({
    maxAttempts: 2,
    delayMs: 200,
    backoffMultiplier: 2,
    retryCondition: retryConditions.networkError,
  }),
};
