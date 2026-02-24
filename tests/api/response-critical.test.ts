/**
 * Critical Path Tests - API Response Utility
 * Tests the core API response utilities that are used across all API routes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { jsonSuccess, jsonError, ApiResponse, ERROR_CODES } from '@/app/api/_lib/response';

describe('API Response Utilities', () => {
  beforeEach(() => {
    // Mock crypto.randomUUID for testing
    vi.stubGlobal('crypto', {
      randomUUID: () => 'test-uuid-12345',
    });
  });

  describe('jsonSuccess', () => {
    it('should create a success response with data', async () => {
      const data = { id: 1, name: 'Test' };
      const response = jsonSuccess(data);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);

      const responseData = response.json ? await response.json() : null;
      expect(responseData).toEqual({
        success: true,
        data,
        meta: {
          timestamp: expect.any(String),
        },
      });
    });

    it('should create a success response with custom status', () => {
      const data = { id: 1 };
      const response = jsonSuccess(data, 201);

      expect(response.status).toBe(201);
    });

    it('should include correct headers', () => {
      const data = { test: true };
      const response = jsonSuccess(data);

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('jsonError', () => {
    it('should create an error response with message', async () => {
      const response = jsonError('Test error message');

      expect(response.status).toBe(500);

      const responseData = response.json ? await response.json() : null;
      expect(responseData).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Test error message',
        },
        meta: {
          timestamp: expect.any(String),
        },
      });
    });

    it('should use appropriate HTTP status for different error codes', () => {
      const unauthorizedResponse = jsonError('Not authenticated', 401, ERROR_CODES.UNAUTHORIZED);
      expect(unauthorizedResponse.status).toBe(401);

      const forbiddenResponse = jsonError('Access denied', 403, ERROR_CODES.FORBIDDEN);
      expect(forbiddenResponse.status).toBe(403);

      const notFoundResponse = jsonError('Resource not found', 404, ERROR_CODES.NOT_FOUND);
      expect(notFoundResponse.status).toBe(404);

      const validationResponse = jsonError('Invalid input', 422, ERROR_CODES.VALIDATION_ERROR);
      expect(validationResponse.status).toBe(422);
    });

    it('should include error details when provided', async () => {
      const details = { field: 'email', value: 'invalid-email' };
      const response = jsonError('Invalid email', 400, ERROR_CODES.VALIDATION_ERROR, details);

      const responseData = response.json ? await response.json() : null;
      expect(responseData?.error?.details).toEqual(details);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null data gracefully', async () => {
      const response = jsonSuccess(null);

      const responseData = response.json ? await response.json() : null;
      expect(responseData?.data).toBeNull();
    });

    it('should handle undefined data gracefully', async () => {
      const response = jsonSuccess(undefined);

      const responseData = response.json ? await response.json() : null;
      expect(responseData?.data).toBeUndefined();
    });

    it('should handle circular references in data', async () => {
      const circularData: any = { name: 'test' };
      circularData.self = circularData;

      const response = jsonSuccess(circularData);
      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.error.code).toBe('INTERNAL_ERROR');
      expect(responseData.error.message).toBe('Response serialization failed');
    });

    it('should handle very long error messages', async () => {
      const longMessage = 'A'.repeat(10000);
      const response = jsonError(longMessage);

      const responseData = response.json ? await response.json() : null;
      expect(responseData?.error?.message).toBe(longMessage);
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large data payloads efficiently', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
      }));
      const startTime = performance.now();

      const response = jsonSuccess(largeData);

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
      expect(response.status).toBe(200);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety for response data', async () => {
      interface TestType {
        id: number;
        name: string;
      }

      const testData: TestType = { id: 1, name: 'test' };
      const response = jsonSuccess<TestType>(testData);

      const responseData = response.json ? await response.json() : null;
      expect(responseData?.data).toEqual(testData);
      expect(responseData?.data?.id).toBeTypeOf('number');
      expect(responseData?.data?.name).toBeTypeOf('string');
    });

    it('should properly type error responses', async () => {
      const response = jsonError('Invalid data', 400, ERROR_CODES.VALIDATION_ERROR);

      const responseData = response.json ? await response.json() : null;
      expect(responseData?.success).toBe(false);
      expect(responseData?.error?.code).toBe('VALIDATION_ERROR');
      expect(responseData?.error?.message).toBe('Invalid data');
    });
  });
});
