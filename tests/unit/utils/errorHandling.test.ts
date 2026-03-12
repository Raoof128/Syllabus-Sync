/**
 * Error Handling Utility Tests
 * Tests AppErrorHandler, form validation, validation rules, and async error handling
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AppErrorHandler,
  errorHandler,
  handleAsyncError,
  createFormValidator,
  validationRules,
} from '@/lib/utils/errorHandling';

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

describe('AppErrorHandler', () => {
  beforeEach(() => {
    errorHandler.clearErrors();
  });

  it('should be a singleton', () => {
    const instance1 = AppErrorHandler.getInstance();
    const instance2 = AppErrorHandler.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should log Error objects', () => {
    errorHandler.logError(new Error('Test error'), 'TestContext', 'medium');
    const errors = errorHandler.getRecentErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Test error');
    expect(errors[0].context).toBe('TestContext');
  });

  it('should log string errors', () => {
    errorHandler.logError('Simple error', 'StringContext');
    const errors = errorHandler.getRecentErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Simple error');
  });

  it('should log AppError objects', () => {
    errorHandler.logError({
      code: 'TEST_ERR',
      message: 'App error',
      timestamp: new Date(),
    });
    const errors = errorHandler.getRecentErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('TEST_ERR');
  });

  it('should limit stored errors to maxStoredErrors', () => {
    for (let i = 0; i < 60; i++) {
      errorHandler.logError(`Error ${i}`);
    }
    const errors = errorHandler.getRecentErrors(100);
    expect(errors.length).toBeLessThanOrEqual(50);
  });

  it('should return limited recent errors', () => {
    for (let i = 0; i < 20; i++) {
      errorHandler.logError(`Error ${i}`);
    }
    const recent = errorHandler.getRecentErrors(5);
    expect(recent).toHaveLength(5);
  });

  it('should clear errors', () => {
    errorHandler.logError('Error 1');
    errorHandler.logError('Error 2');
    errorHandler.clearErrors();
    expect(errorHandler.getRecentErrors()).toHaveLength(0);
  });

  it('should handle validation errors', () => {
    const result = errorHandler.handleValidationError([
      { field: 'email', message: 'Invalid email', code: 'EMAIL_INVALID' },
      { field: 'name', message: 'Name required', code: 'NAME_REQUIRED' },
    ]);
    expect(result.email).toBe('Invalid email');
    expect(result.name).toBe('Name required');
  });

  it('should handle API errors', () => {
    const result = errorHandler.handleApiError(
      { message: 'Server error', status: 500 },
      '/api/test',
    );
    expect(result.code).toBe('API_ERROR');
    expect(result.details?.endpoint).toBe('/api/test');
    expect(result.details?.status).toBe(500);
  });

  it('should handle network errors', () => {
    const result = errorHandler.handleNetworkError(new Error('Network failed'));
    expect(result.code).toBe('NETWORK_ERROR');
    expect(result.message).toBe('Network connection failed');
  });

  it('should execute with retry', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await errorHandler.executeWithRetry(fn, 'test');
    expect(result).toBe('ok');
  });

  it('should log error after retry failure', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    const spy = vi.spyOn(errorHandler, 'logError');

    await expect(
      errorHandler.executeWithRetry(fn, 'retryTest', {
        maxAttempts: 2,
        delayMs: 10,
        retryCondition: () => true,
      }),
    ).rejects.toThrow();

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should execute critical operations with more retries', async () => {
    const fn = vi.fn().mockResolvedValue('critical-ok');
    const result = await errorHandler.executeCritical(fn, 'critical-test');
    expect(result).toBe('critical-ok');
  });
});

describe('handleAsyncError', () => {
  it('should return result on success', async () => {
    const result = await handleAsyncError(async () => 42, 'test');
    expect(result).toBe(42);
  });

  it('should return null on error', async () => {
    const result = await handleAsyncError(async () => {
      throw new Error('boom');
    }, 'test');
    expect(result).toBeNull();
  });
});

describe('createFormValidator', () => {
  it('should validate fields and return errors', () => {
    const validate = createFormValidator({
      name: (value) => (!value ? 'Name is required' : null),
      age: (value) => (Number(value) <= 0 ? 'Must be positive' : null),
    });

    const errors = validate({ name: '', age: -1 });
    expect(errors).toHaveLength(2);
    expect(errors[0].field).toBe('name');
    expect(errors[1].field).toBe('age');
  });

  it('should return empty array when no errors', () => {
    const validate = createFormValidator({
      name: (value) => (!value ? 'Required' : null),
    });

    const errors = validate({ name: 'John' });
    expect(errors).toHaveLength(0);
  });
});

describe('validationRules', () => {
  it('required - rejects empty string', () => {
    expect(validationRules.required('Name')('')).toBe('Name is required');
    expect(validationRules.required('Name')('  ')).toBe('Name is required');
    expect(validationRules.required('Name')(null)).toBe('Name is required');
    expect(validationRules.required('Name')(undefined)).toBe('Name is required');
  });

  it('required - accepts non-empty values', () => {
    expect(validationRules.required('Name')('hello')).toBeNull();
  });

  it('numeric - rejects non-numeric values', () => {
    expect(validationRules.numeric('Age')('abc')).toBe('Age must be a number');
  });

  it('numeric - accepts numeric values', () => {
    expect(validationRules.numeric('Age')('42')).toBeNull();
    expect(validationRules.numeric('Age')(null)).toBeNull();
  });

  it('positive - rejects negative values', () => {
    expect(validationRules.positive('Count')(-5)).toBe('Count must be a positive number');
  });

  it('positive - returns null for zero (falsy short-circuit)', () => {
    expect(validationRules.positive('Count')(0)).toBeNull();
  });

  it('positive - accepts positive values', () => {
    expect(validationRules.positive('Count')(5)).toBeNull();
  });
});
