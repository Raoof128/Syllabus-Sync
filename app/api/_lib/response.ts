import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// ============================================================================
// API RESPONSE HELPERS
// ============================================================================

/**
 * Standard API Response Format
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * Standard API Error Codes
 */
export const ERROR_CODES = {
  // Client Errors (4xx)
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',

  // Server Errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * Create a success response
 */
export const jsonSuccess = <T = unknown>(
  data: T,
  status: number = 200,
  meta?: ApiResponse['meta']
): NextResponse<ApiResponse<T>> => {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    },
    { status }
  );
};

/**
 * Create an error response
 */
export const jsonError = (
  message: string,
  status: number = 500,
  code?: ErrorCode,
  details?: Record<string, unknown>
): NextResponse<ApiResponse<never>> => {
  const errorCode = code || getErrorCodeFromStatus(status);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: errorCode,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
};

/**
 * Handle Zod validation errors
 */
export const handleValidationError = (error: ZodError): NextResponse<ApiResponse<never>> => {
  const details = error.errors.reduce((acc, err) => {
    const field = err.path.join('.');
    if (!acc[field]) acc[field] = [];
    acc[field].push(err.message);
    return acc;
  }, {} as Record<string, string[]>);

  return jsonError(
    'Validation failed',
    400,
    ERROR_CODES.VALIDATION_ERROR,
    { fields: details }
  );
};

/**
 * Handle database errors
 */
export const handleDatabaseError = (error: unknown): NextResponse<ApiResponse<never>> => {
  console.error('Database error:', error);

  // Don't expose internal database errors to clients
  return jsonError(
    'A database error occurred',
    500,
    ERROR_CODES.DATABASE_ERROR,
    process.env.NODE_ENV === 'development' ? { originalError: error.message } : undefined
  );
};

/**
 * Handle authentication errors
 */
export const jsonUnauthorized = (message: string = 'Authentication required'): NextResponse<ApiResponse<never>> => {
  return jsonError(message, 401, ERROR_CODES.UNAUTHORIZED);
};

/**
 * Handle forbidden access errors
 */
export const jsonForbidden = (message: string = 'Access denied'): NextResponse<ApiResponse<never>> => {
  return jsonError(message, 403, ERROR_CODES.FORBIDDEN);
};

/**
 * Handle not found errors
 */
export const jsonNotFound = (resource: string = 'Resource'): NextResponse<ApiResponse<never>> => {
  return jsonError(`${resource} not found`, 404, ERROR_CODES.NOT_FOUND);
};

/**
 * Create paginated response
 */
export const jsonPaginated = <T = unknown>(
  data: T[],
  page: number,
  limit: number,
  total: number
): NextResponse<ApiResponse<T[]>> => {
  const totalPages = Math.ceil(total / limit);

  return jsonSuccess(data, 200, {
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Map HTTP status code to error code
 */
function getErrorCodeFromStatus(status: number): ErrorCode {
  switch (status) {
    case 400:
      return ERROR_CODES.BAD_REQUEST;
    case 401:
      return ERROR_CODES.UNAUTHORIZED;
    case 403:
      return ERROR_CODES.FORBIDDEN;
    case 404:
      return ERROR_CODES.NOT_FOUND;
    case 409:
      return ERROR_CODES.CONFLICT;
    case 429:
      return ERROR_CODES.RATE_LIMITED;
    default:
      return ERROR_CODES.INTERNAL_ERROR;
  }
}

/**
 * Generate request ID for tracking
 */
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
