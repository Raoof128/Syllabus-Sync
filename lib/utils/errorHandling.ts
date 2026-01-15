// lib/utils/errorHandling.ts
import { AppError, ValidationError, FormErrors, ErrorSeverity } from '@/lib/types';
import { withRetry, RetryError, type RetryOptions } from './retry';

export class AppErrorHandler {
  private static instance: AppErrorHandler;
  private errors: AppError[] = [];
  private maxStoredErrors = 50;

  static getInstance(): AppErrorHandler {
    if (!AppErrorHandler.instance) {
      AppErrorHandler.instance = new AppErrorHandler();
    }
    return AppErrorHandler.instance;
  }

  // Log application errors
  logError(
    error: Error | string | AppError,
    context?: string,
    severity: ErrorSeverity = 'medium',
  ): void {
    let appError: AppError;

    if (error instanceof Error) {
      appError = {
        code: this.generateErrorCode(severity),
        message: error.message,
        details: { stack: error.stack },
        timestamp: new Date(),
        context,
      };
    } else if (typeof error === 'string') {
      appError = {
        code: this.generateErrorCode(severity),
        message: error,
        timestamp: new Date(),
        context,
      };
    } else {
      // It's already an AppError
      appError = { ...error, context: context || error.context };
    }

    this.errors.unshift(appError);

    // Keep only the most recent errors
    if (this.errors.length > this.maxStoredErrors) {
      this.errors = this.errors.slice(0, this.maxStoredErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${severity.toUpperCase()}] ${context || 'App'}:`, appError.message, appError);
    }

    // Send to error tracking service (Sentry is configured in next.config.ts)
    this.reportToService(appError, severity);
  }

  // Handle form validation errors
  handleValidationError(errors: ValidationError[]): FormErrors {
    const formErrors: FormErrors = {};

    errors.forEach((error) => {
      formErrors[error.field] = error.message;
    });

    // Log validation errors as low severity
    const validationError = new Error(
      `Form validation failed: ${errors.map((e) => e.field).join(', ')}`,
    );
    this.logError(validationError, 'FormValidation', 'low');

    return formErrors;
  }

  // Handle API errors (for future use)
  handleApiError(error: unknown, endpoint: string): AppError {
    const errorObj = error as Record<string, unknown> | undefined;
    const appError: AppError = {
      code: 'API_ERROR',
      message: (errorObj?.message as string) || 'An API error occurred',
      details: {
        endpoint,
        status: errorObj?.status,
        response: errorObj?.response,
      },
      timestamp: new Date(),
      context: 'API',
    };

    this.logError(appError, 'API', 'high');
    return appError;
  }

  // Handle network errors
  handleNetworkError(error: Error): AppError {
    const appError: AppError = {
      code: 'NETWORK_ERROR',
      message: 'Network connection failed',
      details: { originalError: error.message },
      timestamp: new Date(),
      context: 'Network',
    };

    this.logError(appError, 'Network', 'high');
    return appError;
  }

  // Get recent errors
  getRecentErrors(limit: number = 10): AppError[] {
    return this.errors.slice(0, limit);
  }

  // Clear error history
  clearErrors(): void {
    this.errors = [];
  }

  private generateErrorCode(severity: ErrorSeverity): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const severityCode = severity.charAt(0).toUpperCase();
    return `${severityCode}${timestamp}`;
  }

  private reportToService(error: AppError, severity: ErrorSeverity): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const isBrowser = typeof window !== 'undefined';

    // Report to Sentry if available (dynamically imported to avoid build issues)
    if (isProduction || process.env.NEXT_PUBLIC_SENTRY_ENABLED === 'true') {
      this.reportToSentry(error, severity);
    }

    // In production, log high-severity errors to console (picked up by Vercel logs)
    if (isProduction && severity === 'high') {
      console.error(
        '[ERROR_REPORT]',
        JSON.stringify({
          code: error.code,
          message: error.message,
          context: error.context,
          timestamp: error.timestamp,
          // Don't log stack traces to production logs for security
        }),
      );
    }

    // In development, store errors locally for debugging
    if (!isProduction && isBrowser) {
      try {
        const existingErrors = JSON.parse(localStorage.getItem('appErrors') || '[]');
        existingErrors.unshift({
          ...error,
          severity,
          userAgent: navigator.userAgent,
          url: window.location.href,
        });

        // Keep only last 20 errors
        localStorage.setItem('appErrors', JSON.stringify(existingErrors.slice(0, 20)));
      } catch {
        // Ignore localStorage errors
      }
    }
  }

  /**
   * Report error to Sentry (dynamically loaded to avoid build-time dependency)
   */
  private reportToSentry(error: AppError, severity: ErrorSeverity): void {
    // Dynamic import to avoid issues when Sentry is not configured
    import('@sentry/nextjs')
      .then((Sentry) => {
        const sentryLevel =
          severity === 'high' ? 'error' : severity === 'medium' ? 'warning' : 'info';

        Sentry.captureException(new Error(error.message), {
          level: sentryLevel,
          tags: {
            context: error.context || 'unknown',
            errorCode: error.code,
          },
          extra: {
            details: error.details,
            timestamp: error.timestamp,
          },
        });
      })
      .catch(() => {
        // Sentry not available, silently ignore
      });
  }

  /**
   * Execute an operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    options: Partial<RetryOptions> = {},
  ): Promise<T> {
    try {
      return await withRetry(operation, {
        maxAttempts: 3,
        delayMs: 1000,
        backoffMultiplier: 2,
        retryCondition: (error) => {
          // Retry on network errors and certain server errors
          return (
            error.name === 'NetworkError' ||
            error.name === 'TimeoutError' ||
            error.message.includes('fetch')
          );
        },
        ...options,
      });
    } catch (error) {
      if (error instanceof RetryError) {
        this.logError(
          error.lastError,
          `${context} (failed after ${error.attempts} attempts)`,
          'high',
        );
      } else {
        this.logError(error as Error, context, 'high');
      }
      throw error;
    }
  }

  /**
   * Execute a critical operation with aggressive retry
   */
  async executeCritical<T>(operation: () => Promise<T>, context: string): Promise<T> {
    return this.executeWithRetry(operation, context, {
      maxAttempts: 5,
      delayMs: 500,
      backoffMultiplier: 1.5,
      retryCondition: () => true, // Always retry for critical operations
    });
  }
}

// Export singleton instance
export const errorHandler = AppErrorHandler.getInstance();

// Utility functions for common error handling patterns
export const handleAsyncError = async <T>(
  asyncFn: () => Promise<T>,
  context: string = 'AsyncOperation',
): Promise<T | null> => {
  try {
    return await asyncFn();
  } catch (error) {
    errorHandler.logError(
      error instanceof Error ? error : new Error(String(error)),
      context,
      'high',
    );
    return null;
  }
};

export const createFormValidator = (rules: Record<string, (value: unknown) => string | null>) => {
  return (data: Record<string, unknown>): ValidationError[] => {
    const errors: ValidationError[] = [];

    Object.entries(rules).forEach(([field, validator]) => {
      const error = validator(data[field]);
      if (error) {
        errors.push({
          field,
          message: error,
          code: `${field.toUpperCase()}_INVALID`,
        });
      }
    });

    return errors;
  };
};

// Common validation rules
export const validationRules = {
  required: (fieldName: string) => (value: unknown) =>
    !value || (typeof value === 'string' && value.trim() === '')
      ? `${fieldName} is required`
      : null,

  numeric: (fieldName: string) => (value: unknown) =>
    value && Number.isNaN(Number(value)) ? `${fieldName} must be a number` : null,

  positive: (fieldName: string) => (value: unknown) =>
    value && Number(value) <= 0 ? `${fieldName} must be a positive number` : null,
};
