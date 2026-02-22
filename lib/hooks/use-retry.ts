import { useState, useCallback } from "react";
import { errorHandler } from "@/lib/utils/errorHandling";
import { toastUtils } from "@/lib/utils/toast";
import { withRetry, RetryError } from "@/lib/utils/retry";

export interface UseRetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  showToastOnError?: boolean;
  errorMessage?: string;
  successMessage?: string;
}

export function useRetry<T extends unknown[], R>(
  asyncFn: (...args: T) => Promise<R>,
  options: UseRetryOptions = {},
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    showToastOnError = true,
    errorMessage = "Operation failed. Please try again.",
    successMessage,
  } = options;

  const execute = useCallback(
    async (...args: T): Promise<R | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await withRetry(() => asyncFn(...args), {
          maxAttempts,
          delayMs,
          backoffMultiplier,
          retryCondition: (error) => {
            // Retry on network-related errors
            return (
              error.name === "NetworkError" ||
              error.name === "TimeoutError" ||
              error.name === "AbortError" ||
              error.message.toLowerCase().includes("network") ||
              error.message.toLowerCase().includes("fetch")
            );
          },
        });

        if (successMessage) {
          toastUtils.success("Success", successMessage);
        }

        return result;
      } catch (err) {
        const error =
          err instanceof RetryError ? err.lastError : (err as Error);
        setError(error);

        // Log to error handler
        errorHandler.logError(error, "Retry Hook Operation", "medium");

        // Show toast if enabled
        if (showToastOnError) {
          toastUtils.error("Error", errorMessage);
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [
      asyncFn,
      maxAttempts,
      delayMs,
      backoffMultiplier,
      showToastOnError,
      errorMessage,
      successMessage,
    ],
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    execute,
    isLoading,
    error,
    reset,
  };
}
